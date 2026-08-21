/**
 * GLTC 术士系统 - 核心
 *
 * 数值文件：addon_configs/GLTC/玩家属性/术士数值/{uuid}.json  （不含当前粒子量）
 * 装备文件：addon_configs/GLTC/玩家属性/术士装备/{uuid}.json
 * 粒子量：纯内存缓存；退出清缓存、重载/崩溃不保留（回满即可）
 *
 * 最终减伤：影响普通/粒子伤害，不影响脉冲伤害（需走 dealPulseDamage）
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Attribute = Java.type("org.bukkit.attribute.Attribute");
var AttributeModifier = Java.type("org.bukkit.attribute.AttributeModifier");
var EquipmentSlotGroup = Java.type("org.bukkit.inventory.EquipmentSlotGroup");
var UUID = Java.type("java.util.UUID");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");
var Base64 = Java.type("java.util.Base64");
var ByteArrayInputStream = Java.type("java.io.ByteArrayInputStream");
var ByteArrayOutputStream = Java.type("java.io.ByteArrayOutputStream");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var STATS_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士数值");
var GEAR_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士装备");
if (!STATS_DIR.exists()) STATS_DIR.mkdirs();
if (!GEAR_DIR.exists()) GEAR_DIR.mkdirs();

var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
var GLI_CONFIG_KEY = "ParticleConcentration";
var GLI_DEFAULT = 1.0;
var PULSE_META = "gltc_pulse_hit";

var GEAR_CFG = null;
var STAFF_CFG = null;

var JString = Java.type("java.lang.String");

/** ConcurrentHashMap 键统一为 java.lang.String，避免 Graal JS string 与 Java String 分裂 */
function cacheKey(uuid) {
    return JString.valueOf(String(uuid));
}

/**
 * 跨脚本 eval 上下文共享缓存。
 * 固定字段名挂 Plugin；同时写 Metadata 作兜底；两边都读，防止双 Map。
 */
function sharedConcurrentMap(metaKey, preferredField) {
    var field = preferredField || ("gltc_map_" + String(metaKey).replace(/[^a-zA-Z0-9_]/g, "_"));
    var fromField = null;
    var fromMeta = null;
    try { if (PLUGIN[field] != null) fromField = PLUGIN[field]; } catch (e0) {}
    try {
        if (PLUGIN.hasMetadata(metaKey)) {
            fromMeta = PLUGIN.getMetadata(metaKey).get(0).value();
        }
    } catch (e1) {}

    // 已有两边不一致时，以 Field 为准并回写 Meta
    if (fromField != null) {
        try { PLUGIN.setMetadata(metaKey, new FixedMetadataValue(PLUGIN, fromField)); } catch (e2) {}
        return fromField;
    }
    if (fromMeta != null) {
        try { PLUGIN[field] = fromMeta; } catch (e3) {}
        return fromMeta;
    }

    var map = new java.util.concurrent.ConcurrentHashMap();
    try { PLUGIN[field] = map; } catch (e4) {}
    try { PLUGIN.setMetadata(metaKey, new FixedMetadataValue(PLUGIN, map)); } catch (e5) {}
    return map;
}

/** 粒子量：专用固定字段，所有核心 eval 必须命中同一张表 */
var particleCache = sharedConcurrentMap("gltc_shared_particle_cache", "gltcParticleCache");
/** 存 JSON 字符串，避免 Graal 跨上下文传 JS 对象 */
var statsDataCache = sharedConcurrentMap("gltc_shared_stats_json_cache", "gltcStatsJsonCache");
var equipBonusCache = sharedConcurrentMap("gltc_shared_equip_bonus_json_cache", "gltcEquipBonusCache");

// 升级时术士潜能/体能潜能获得量（1~8级）
var LEVEL_POTENTIAL = [0, 8, 4, 4, 10, 4, 4, 10, 12];

/**
 * 全局硬顶（潜能 + 组件汇总后钳制）
 * 百分比用 0~1；白值用绝对数
 */
var HARD_CAPS = {
    cardiovascular: 0.99,
    particleRefraction: 0.95,
    finalDamageReduction: 0.90,
    armor: 100,
    toughness: 50
};

/**
 * 术士潜能加点
 * per：每点增益；maxPoints：潜能自身可投入上限（缺省=无上限）
 */
var MAGE_POINT_OPTIONS = {
    particlePower: { label: "粒子强度", per: 0.1 },
    pituitaryCapacity: { label: "松垂体容量", per: 8 },
    cardiovascular: { label: "心血管强度", per: 0.02, maxPoints: 20 },
    particleRefraction: { label: "粒子折射", per: 0.03, maxPoints: 20 },
    finalDamageReduction: { label: "最终减伤", per: 0.02, maxPoints: 24 }
};

/**
 * 体能潜能加点
 */
var BODY_POINT_OPTIONS = {
    meleeDamage: { label: "近战伤害白值", per: 1 },
    maxHealth: { label: "血量白值", per: 8 },
    armor: { label: "防御白值", per: 2, maxPoints: 15 },
    toughness: { label: "韧性白值", per: 0.5, maxPoints: 20 },
    speed: { label: "速度白值", per: 0.01, maxPoints: 32 },
    reach: { label: "手长白值", per: 0.1 }
};

var ATTR_MOD_UUID = {
    meleeDamage: UUID.fromString("a1111111-1111-4111-8111-111111111101"),
    maxHealth: UUID.fromString("a1111111-1111-4111-8111-111111111102"),
    armor: UUID.fromString("a1111111-1111-4111-8111-111111111103"),
    toughness: UUID.fromString("a1111111-1111-4111-8111-111111111104"),
    speed: UUID.fromString("a1111111-1111-4111-8111-111111111105"),
    reach: UUID.fromString("a1111111-1111-4111-8111-111111111106")
};

function findScriptFile(relativeUnderScripts) {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + relativeUnderScripts),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + relativeUnderScripts)
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) {
                    candidates.push(new File(list[i], "scripts/" + relativeUnderScripts));
                }
            }
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists()) return candidates[c];
    }
    return null;
}

function evalScriptExport(relativeUnderScripts) {
    var file = findScriptFile(relativeUnderScripts);
    if (!file) return null;
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes)).toString();
        return (0, eval)(code);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC术士] 加载失败 " + relativeUnderScripts + ": " + e);
        return null;
    }
}

function loadGearConfig() {
    var exported = evalScriptExport("术士系统/装备加成.js");
    if (exported && exported.GEAR_REGISTRY) { GEAR_CFG = exported; return true; }
    return !!(GEAR_CFG && GEAR_CFG.GEAR_REGISTRY);
}

function loadStaffConfig() {
    if (STAFF_CFG && STAFF_CFG.STAFF_REGISTRY) return true;
    var exported = evalScriptExport("施术道具/登记.js");
    if (exported && exported.STAFF_REGISTRY) { STAFF_CFG = exported; return true; }
    return false;
}

loadGearConfig();
loadStaffConfig();

function equipSlotCount() {
    return GEAR_CFG ? GEAR_CFG.getSlotCount() : 8;
}

function defaultStats() {
    return {
        mageLevel: 0,
        proficiency: 0,
        magePotential: 0,
        bodyPotential: 0,
        particlePower: 1,
        pituitaryCapacity: 10,
        cardiovascular: 0,
        particleRefraction: 0,
        meleeDamage: 0,
        maxHealth: 0,
        armor: 0,
        toughness: 0,
        speed: 0,
        reach: 0,
        finalDamageReduction: 0
    };
}

function emptyBonuses() {
    return {
        particlePower: 0, pituitaryCapacity: 0, cardiovascular: 0, particleRefraction: 0,
        meleeDamage: 0, maxHealth: 0, armor: 0, toughness: 0, speed: 0, reach: 0,
        finalDamageReduction: 0
    };
}

function readJsonFile(file) {
    if (!file.exists()) return null;
    try {
        var bytes = Files.readAllBytes(file.toPath());
        return JSON.parse(StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes)).toString());
    } catch (e) {
        return null;
    }
}

function writeJsonFile(file, obj) {
    try {
        var parent = file.getParentFile();
        if (parent && !parent.exists()) parent.mkdirs();
        var lines = new java.util.ArrayList();
        lines.add(JSON.stringify(obj, null, 2));
        Files.write(file.toPath(), lines, StandardCharsets.UTF_8);
        return true;
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC术士] 保存失败 " + file.getName() + ": " + e);
        return false;
    }
}

function statsFile(uuid) { return new File(STATS_DIR.getAbsolutePath() + "/" + uuid + ".json"); }
function gearFile(uuid) { return new File(GEAR_DIR.getAbsolutePath() + "/" + uuid + ".json"); }

function invalidatePlayerCache(uuid) {
    var key = cacheKey(uuid);
    try { statsDataCache.remove(key); } catch (e0) {}
    try { equipBonusCache.remove(key); } catch (e1) {}
}

function clonePlainObject(obj) {
    var out = {};
    if (!obj) return out;
    for (var k in obj) out[k] = obj[k];
    return out;
}

function cacheGetStatsJson(uuid) {
    var key = cacheKey(uuid);
    try {
        if (!statsDataCache.containsKey(key)) return null;
        return JSON.parse(String(statsDataCache.get(key)));
    } catch (e) {
        try { statsDataCache.remove(key); } catch (e2) {}
        return null;
    }
}

function cachePutStatsJson(uuid, data) {
    try { statsDataCache.put(cacheKey(uuid), JSON.stringify(data)); } catch (e) {}
}

function getPlayerStats(uuid) {
    uuid = String(uuid);
    var cached = cacheGetStatsJson(uuid);
    if (cached) return cached;

    var data = readJsonFile(statsFile(uuid));
    if (!data) {
        data = defaultStats();
        savePlayerStats(uuid, data);
        cached = cacheGetStatsJson(uuid);
        return cached ? cached : clonePlainObject(data);
    }
    var base = defaultStats();
    for (var k in base) {
        if (data[k] === undefined || data[k] === null) data[k] = base[k];
    }
    // 旧档清理：数值文件里若还带当前粒子字段则丢掉
    if (data.currentParticles !== undefined) {
        delete data.currentParticles;
        savePlayerStats(uuid, data);
        cached = cacheGetStatsJson(uuid);
        return cached ? cached : clonePlainObject(data);
    }
    cachePutStatsJson(uuid, data);
    return clonePlainObject(data);
}

function savePlayerStats(uuid, data) {
    uuid = String(uuid);
    var copy = {};
    for (var k in data) {
        if (k === "currentParticles") continue;
        copy[k] = data[k];
    }
    var ok = writeJsonFile(statsFile(uuid), copy);
    if (ok) {
        cachePutStatsJson(uuid, copy);
    } else {
        try { statsDataCache.remove(cacheKey(uuid)); } catch (e) {}
    }
    return ok;
}

function getPlayerGear(uuid) {
    var data = readJsonFile(gearFile(uuid));
    var need = equipSlotCount();
    if (!data || !data.slots) {
        return { slots: GEAR_CFG ? GEAR_CFG.emptySlotsArray() : [null, null, null, null, null, null, null, null] };
    }
    while (data.slots.length < need) data.slots.push(null);
    if (data.slots.length > need) data.slots = data.slots.slice(0, need);
    return data;
}

function savePlayerGear(uuid, data) {
    uuid = String(uuid);
    var ok = writeJsonFile(gearFile(uuid), data);
    try { equipBonusCache.remove(cacheKey(uuid)); } catch (e) {}
    return ok;
}

/** 由数值+装备汇总松垂体容量（不触碰粒子缓存） */
function resolvePituitaryCapacity(uuid) {
    uuid = String(uuid);
    try {
        var base = getPlayerStats(uuid);
        var equip = getEquipmentBonuses(uuid);
        return sumStat(base, equip, emptyBonuses(), "pituitaryCapacity");
    } catch (e) {
        return 10;
    }
}

/** 缓存未命中时按真实容量回满（纯内存，不落盘） */
function ensureParticleLoaded(uuid, capHint) {
    var key = cacheKey(uuid);
    if (particleCache.containsKey(key)) return Number(particleCache.get(key)) || 0;
    var v = capHint != null ? Number(capHint) || 0 : resolvePituitaryCapacity(String(uuid));
    // 勿用 Double.valueOf：Graal 对 Integer 会撞 String/double 重载
    particleCache.put(key, v * 1.0);
    return v;
}

function getCurrentParticles(uuid) {
    return ensureParticleLoaded(uuid, null);
}

function setCurrentParticles(uuid, value) {
    var key = cacheKey(uuid);
    var v = Math.max(0, Number(value) || 0);
    particleCache.put(key, v * 1.0);
    return v;
}

/**
 * 直接增加粒子数量，不做其它校验；无法超过当前松垂体容量。
 * @returns 实际增加量
 */
function addParticles(player, amount) {
    amount = Number(amount) || 0;
    if (!(amount > 0) || !player) return 0;
    var uuid = String(player.getUniqueId().toString());
    var cap = resolvePituitaryCapacity(uuid);
    var cur = ensureParticleLoaded(uuid, cap);
    if (cur > cap) {
        cur = cap;
        setCurrentParticles(uuid, cur);
    }
    var next = Math.min(cap, cur + amount);
    var gain = next - cur;
    if (gain > 0) setCurrentParticles(uuid, next);
    return gain;
}

function clearParticleCache(uuid) {
    try { particleCache.remove(cacheKey(uuid)); } catch (e) {}
    invalidatePlayerCache(uuid);
}

/** @deprecated 纯内存后无落盘；保留空实现以免旧调用报错 */
function flushParticle(uuid) {}

function itemToBase64(item) {
    if (!item || item.getType() === Material.AIR) return null;
    var baos = new ByteArrayOutputStream();
    var oos = new org.bukkit.util.io.BukkitObjectOutputStream(baos);
    oos.writeObject(item);
    oos.close();
    return Base64.getEncoder().encodeToString(baos.toByteArray());
}

function itemFromBase64(text) {
    if (!text) return null;
    try {
        var ois = new org.bukkit.util.io.BukkitObjectInputStream(new ByteArrayInputStream(Base64.getDecoder().decode(text)));
        var item = ois.readObject();
        ois.close();
        return item;
    } catch (e) { return null; }
}

function getSlimefunId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var meta = stack.getItemMeta();
        if (meta) {
            var pdc = meta.getPersistentDataContainer();
            if (pdc.has(SF_ITEM_KEY, PersistentDataType.STRING)) {
                return pdc.get(SF_ITEM_KEY, PersistentDataType.STRING);
            }
        }
    } catch (e) {}
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(stack);
        return sf ? sf.getId() : null;
    } catch (e2) {}
    return null;
}

function isMageAccessory(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    loadGearConfig();
    var id = getSlimefunId(stack);
    return !!(id && GEAR_CFG && GEAR_CFG.GEAR_REGISTRY[id]);
}

function isMageStaff(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    loadStaffConfig();
    var id = getSlimefunId(stack);
    return !!(id && STAFF_CFG && STAFF_CFG.STAFF_REGISTRY[id]);
}

function mergeBonus(target, src) {
    if (!src) return;
    for (var k in src) {
        if (typeof src[k] === "number") target[k] = (target[k] || 0) + src[k];
    }
}

function getBonusesFromGearId(itemId) {
    var b = emptyBonuses();
    if (!itemId || !GEAR_CFG) return b;
    var entry = GEAR_CFG.GEAR_REGISTRY[itemId];
    if (entry && entry.bonuses) mergeBonus(b, entry.bonuses);
    return b;
}

/** 法杖不再提供数值加成（保留空实现兼容旧调用） */
function getBonusesFromStaffId(itemId) {
    return emptyBonuses();
}

function canEquipInSlot(stack, slotIndex) {
    loadGearConfig();
    if (!GEAR_CFG || !stack) return false;
    var def = GEAR_CFG.getSlotDef(slotIndex);
    if (!def) return false;
    var id = getSlimefunId(stack);
    var entry = id ? GEAR_CFG.GEAR_REGISTRY[id] : null;
    return !!(entry && entry.category === def.category);
}

function getEquipmentBonuses(uuid) {
    uuid = String(uuid);
    var key = cacheKey(uuid);
    try {
        if (equipBonusCache.containsKey(key)) {
            return JSON.parse(String(equipBonusCache.get(key)));
        }
    } catch (e0) {
        try { equipBonusCache.remove(key); } catch (e1) {}
    }

    loadGearConfig();
    var total = emptyBonuses();
    var gear = getPlayerGear(uuid);
    var n = equipSlotCount();
    for (var i = 0; i < n; i++) {
        if (!gear.slots[i]) continue;
        var item = itemFromBase64(gear.slots[i]);
        if (item) mergeBonus(total, getBonusesFromGearId(getSlimefunId(item)));
    }
    try { equipBonusCache.put(key, JSON.stringify(total)); } catch (e2) {}
    return total;
}

/** 法杖仅负责特效与术式存储，不参与数值汇总 */
function getStaffBonuses(player) {
    return emptyBonuses();
}

function clampHard(statKey, v) {
    v = Number(v);
    if (!isFinite(v) || v < 0) v = 0;
    var cap = HARD_CAPS[statKey];
    if (cap != null && v > cap) return cap;
    return v;
}

/** @deprecated 兼容旧调用；默认按 95% 折射顶 */
function clamp01(v) {
    return clampHard("particleRefraction", v);
}

function sumStat(base, equip, staff, key) {
    return Number(base[key] || 0) + Number((equip && equip[key]) || 0) + Number((staff && staff[key]) || 0);
}

function buildTotalStatsObject(base, equip, staff, cur) {
    return {
        mageLevel: base.mageLevel || 0,
        proficiency: base.proficiency || 0,
        magePotential: base.magePotential || 0,
        bodyPotential: base.bodyPotential || 0,
        particlePower: sumStat(base, equip, staff, "particlePower"),
        pituitaryCapacity: sumStat(base, equip, staff, "pituitaryCapacity"),
        cardiovascular: clampHard("cardiovascular", sumStat(base, equip, staff, "cardiovascular")),
        particleRefraction: clampHard("particleRefraction", sumStat(base, equip, staff, "particleRefraction")),
        meleeDamage: sumStat(base, equip, staff, "meleeDamage"),
        maxHealth: sumStat(base, equip, staff, "maxHealth"),
        armor: clampHard("armor", sumStat(base, equip, staff, "armor")),
        toughness: clampHard("toughness", sumStat(base, equip, staff, "toughness")),
        speed: sumStat(base, equip, staff, "speed"),
        reach: sumStat(base, equip, staff, "reach"),
        finalDamageReduction: clampHard("finalDamageReduction", sumStat(base, equip, staff, "finalDamageReduction")),
        currentParticles: cur
    };
}

function getTotalStats(player, includeStaff) {
    var uuid = player.getUniqueId().toString();
    var base = getPlayerStats(uuid);
    var equip = getEquipmentBonuses(uuid);
    // includeStaff 参数保留兼容；法杖不再加数值
    var staff = emptyBonuses();

    var pituitaryCapacity = sumStat(base, equip, staff, "pituitaryCapacity");
    var cur = ensureParticleLoaded(uuid, pituitaryCapacity);
    if (cur > pituitaryCapacity) {
        cur = pituitaryCapacity;
        setCurrentParticles(uuid, cur);
    }

    return buildTotalStatsObject(base, equip, staff, cur);
}

function getGLI() {
    try {
        return Math.max(0.01, Math.min(100, getAddonConfig().getDouble(GLI_CONFIG_KEY, GLI_DEFAULT)));
    } catch (e) { return GLI_DEFAULT; }
}

function calcSpellDamage(player, spellCoefficient) {
    var stats = getTotalStats(player, true);
    return stats.particlePower * spellCoefficient * getGLI();
}

function calcSpellCooldownMs(player, baseCooldownMs) {
    var base = Math.max(0, Number(baseCooldownMs) || 0);
    var cardio = 0;
    try {
        var stats = getTotalStats(player, true);
        cardio = clampHard("cardiovascular", Number(stats.cardiovascular) || 0);
    } catch (e) {
        cardio = 0;
    }
    // 硬顶 99% → 冷却至少保留 1%
    var mult = Math.max(0.01, 1 - cardio);
    return Math.max(50, Math.floor(base * mult));
}

function canAffordSpell(player, cost) {
    return getCurrentParticles(player.getUniqueId().toString()) >= cost;
}

function consumeParticles(player, cost) {
    var uuid = player.getUniqueId().toString();
    var cur = getCurrentParticles(uuid);
    if (cur < cost) return false;
    setCurrentParticles(uuid, cur - cost);
    return true;
}

function refillParticlesToCap(player) {
    var stats = getTotalStats(player, true);
    setCurrentParticles(player.getUniqueId().toString(), stats.pituitaryCapacity);
}

function tryLevelUp(player) {
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    var next = (data.mageLevel || 0) + 1;
    if (next > 8) return false;
    var grant = LEVEL_POTENTIAL[next] || 0;
    data.mageLevel = next;
    data.proficiency = 0;
    data.magePotential = (data.magePotential || 0) + grant;
    data.bodyPotential = (data.bodyPotential || 0) + grant;
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return true;
}

function emptySpentMap(table) {
    var o = {};
    for (var k in table) o[k] = 0;
    return o;
}

/** 旧档：按「当前值相对默认值」反推已分配点数 */
function ensureSpentMaps(data) {
    var defs = defaultStats();
    if (!data.mageSpent) {
        data.mageSpent = emptySpentMap(MAGE_POINT_OPTIONS);
        for (var mk in MAGE_POINT_OPTIONS) {
            var mPer = MAGE_POINT_OPTIONS[mk].per;
            var mDelta = (Number(data[mk]) || 0) - (Number(defs[mk]) || 0);
            data.mageSpent[mk] = Math.max(0, Math.round(mDelta / mPer));
        }
    }
    if (!data.bodySpent) {
        data.bodySpent = emptySpentMap(BODY_POINT_OPTIONS);
        for (var bk in BODY_POINT_OPTIONS) {
            var bPer = BODY_POINT_OPTIONS[bk].per;
            var bDelta = (Number(data[bk]) || 0) - (Number(defs[bk]) || 0);
            data.bodySpent[bk] = Math.max(0, Math.round(bDelta / bPer));
        }
    }
}

/** 消耗 1 点潜能加属性（只改 data，不写盘） pool: "mage" | "body" */
function spendPotentialOnData(data, pool, statKey) {
    var table = pool === "body" ? BODY_POINT_OPTIONS : MAGE_POINT_OPTIONS;
    if (!table[statKey]) return { ok: false, msg: "无效属性" };
    ensureSpentMaps(data);
    var field = pool === "body" ? "bodyPotential" : "magePotential";
    var spentField = pool === "body" ? "bodySpent" : "mageSpent";
    if ((data[field] || 0) < 1) return { ok: false, msg: "潜能点不足" };

    var opt = table[statKey];
    var spentNow = Number(data[spentField][statKey]) || 0;
    var maxPts = opt.maxPoints;
    if (maxPts != null && spentNow >= maxPts) {
        return { ok: false, msg: opt.label + " 潜能已达上限（" + maxPts + " 点）" };
    }

    data[field] -= 1;
    data[statKey] = (Number(data[statKey]) || 0) + opt.per;
    data[spentField][statKey] = spentNow + 1;

    var shown = opt.per;
    if (statKey === "cardiovascular" || statKey === "particleRefraction" || statKey === "finalDamageReduction") {
        shown = (Math.round(opt.per * 1000) / 10) + "%";
    }
    return { ok: true, msg: opt.label + " +" + shown, left: data[field] };
}

/** 重置已分配潜能到 data（只改 data，不写盘） */
function resetAllPotentialsOnData(data) {
    ensureSpentMaps(data);
    var refundMage = 0;
    var refundBody = 0;
    var mk, bk;
    for (mk in MAGE_POINT_OPTIONS) refundMage += data.mageSpent[mk] || 0;
    for (bk in BODY_POINT_OPTIONS) refundBody += data.bodySpent[bk] || 0;
    if (refundMage <= 0 && refundBody <= 0) {
        return { ok: false, msg: "没有已分配的潜能" };
    }
    var defs = defaultStats();
    for (mk in MAGE_POINT_OPTIONS) {
        data[mk] = defs[mk];
        data.mageSpent[mk] = 0;
    }
    for (bk in BODY_POINT_OPTIONS) {
        data[bk] = defs[bk];
        data.bodySpent[bk] = 0;
    }
    data.magePotential = (data.magePotential || 0) + refundMage;
    data.bodyPotential = (data.bodyPotential || 0) + refundBody;
    return { ok: true, mage: refundMage, body: refundBody, mageLeft: data.magePotential, bodyLeft: data.bodyPotential };
}

/** 消耗 1 点潜能加属性。pool: "mage" | "body" */
function spendPotential(player, pool, statKey) {
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    var r = spendPotentialOnData(data, pool, statKey);
    if (!r.ok) return r;
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return r;
}

/** 重置全部已分配潜能，点数退回对应池 */
function resetAllPotentials(player) {
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    var r = resetAllPotentialsOnData(data);
    if (!r.ok) return r;
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return r;
}

/** 用指定 base 数值汇总最终面板（装备加成仍读实时装备） */
function getTotalStatsFromBase(player, base) {
    var uuid = player.getUniqueId().toString();
    var equip = getEquipmentBonuses(uuid);
    var staff = emptyBonuses();
    var pituitaryCapacity = sumStat(base, equip, staff, "pituitaryCapacity");
    var cur = ensureParticleLoaded(uuid, pituitaryCapacity);
    if (cur > pituitaryCapacity) {
        cur = pituitaryCapacity;
        setCurrentParticles(uuid, cur);
    }
    return buildTotalStatsObject(base, equip, staff, cur);
}

/** 管理员：调整术士等级（0~8），不自动发放潜能 */
function adminAdjustLevel(player, delta) {
    delta = Math.floor(Number(delta) || 0);
    if (!delta) return { ok: false, msg: "无效增量" };
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    var old = Number(data.mageLevel) || 0;
    var next = old + delta;
    if (next < 0) next = 0;
    if (next > 8) next = 8;
    if (next === old) return { ok: false, msg: "已达等级边界 (0~8)", level: old };
    data.mageLevel = next;
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return { ok: true, level: next, from: old };
}

/**
 * 管理员：调整潜能点数
 * pool: "mage" | "body" | "both"
 */
function adminAdjustPotential(player, pool, delta) {
    delta = Math.floor(Number(delta) || 0);
    if (!delta) return { ok: false, msg: "无效增量" };
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    function bump(field) {
        data[field] = Math.max(0, (Number(data[field]) || 0) + delta);
    }
    if (pool === "body") bump("bodyPotential");
    else if (pool === "both") { bump("magePotential"); bump("bodyPotential"); }
    else bump("magePotential");
    savePlayerStats(uuid, data);
    return {
        ok: true,
        magePotential: data.magePotential || 0,
        bodyPotential: data.bodyPotential || 0
    };
}

/** 管理员：重置自己的全部术士数据（数值默认 + 清空装备并归还 + 清粒子缓存） */
function adminResetAllData(player) {
    var uuid = player.getUniqueId().toString();
    var gear = getPlayerGear(uuid);
    var returned = 0;
    if (gear && gear.slots) {
        for (var i = 0; i < gear.slots.length; i++) {
            if (!gear.slots[i]) continue;
            var item = itemFromBase64(gear.slots[i]);
            if (item) {
                try {
                    var left = player.getInventory().addItem(item);
                    var it = left.values().iterator();
                    while (it.hasNext()) player.getWorld().dropItemNaturally(player.getLocation(), it.next());
                } catch (e) {}
                returned++;
            }
            gear.slots[i] = null;
        }
        savePlayerGear(uuid, gear);
    }
    var fresh = defaultStats();
    savePlayerStats(uuid, fresh);
    clearParticleCache(uuid);
    refillParticlesToCap(player);
    applyMageAttributes(player);
    return { ok: true, returned: returned, level: fresh.mageLevel };
}

function resolveAttribute(nameCandidates) {
    for (var i = 0; i < nameCandidates.length; i++) {
        try { return Attribute.valueOf(nameCandidates[i]); } catch (e) {}
        try { return Attribute.class.getField(nameCandidates[i]).get(null); } catch (e2) {}
    }
    return null;
}

function clearMageModifier(inst, uuid) {
    if (!inst) return;
    try {
        var mods = inst.getModifiers().toArray();
        for (var i = 0; i < mods.length; i++) {
            if (mods[i].getUniqueId().equals(uuid)) inst.removeModifier(mods[i]);
        }
    } catch (e) {
        try { inst.removeModifier(uuid); } catch (e2) {}
    }
}

function addMageModifier(inst, uuid, name, amount) {
    if (!inst) return;
    // 先清旧修正；amount 为 0 时只清除不添加（修复重置潜能后速度等仍残留）
    clearMageModifier(inst, uuid);
    amount = Number(amount) || 0;
    if (!amount) return;
    try {
        inst.addModifier(new AttributeModifier(uuid, name, amount, AttributeModifier.Operation.ADD_NUMBER));
    } catch (e) {
        try {
            inst.addModifier(new AttributeModifier(new NamespacedKey("gltc", name), amount, AttributeModifier.Operation.ADD_NUMBER, EquipmentSlotGroup.ANY));
        } catch (e2) {}
    }
}

function applyMageAttributes(player) {
    if (!player || !player.isOnline()) return;
    var stats = getTotalStats(player, false);
    var atk = resolveAttribute(["GENERIC_ATTACK_DAMAGE", "ATTACK_DAMAGE"]);
    var hp = resolveAttribute(["GENERIC_MAX_HEALTH", "MAX_HEALTH"]);
    var arm = resolveAttribute(["GENERIC_ARMOR", "ARMOR"]);
    var tough = resolveAttribute(["GENERIC_ARMOR_TOUGHNESS", "ARMOR_TOUGHNESS"]);
    var spd = resolveAttribute(["GENERIC_MOVEMENT_SPEED", "MOVEMENT_SPEED"]);
    var reach = resolveAttribute(["PLAYER_ENTITY_INTERACTION_RANGE", "ENTITY_INTERACTION_RANGE", "GENERIC_ATTACK_RANGE"]);

    if (atk) addMageModifier(player.getAttribute(atk), ATTR_MOD_UUID.meleeDamage, "gltc_mage_melee", stats.meleeDamage);
    if (hp) {
        addMageModifier(player.getAttribute(hp), ATTR_MOD_UUID.maxHealth, "gltc_mage_hp", stats.maxHealth);
        try {
            if (player.getHealth() > player.getMaxHealth()) player.setHealth(player.getMaxHealth());
        } catch (e) {}
    }
    if (arm) addMageModifier(player.getAttribute(arm), ATTR_MOD_UUID.armor, "gltc_mage_armor", stats.armor);
    if (tough) addMageModifier(player.getAttribute(tough), ATTR_MOD_UUID.toughness, "gltc_mage_tough", stats.toughness);
    if (spd) addMageModifier(player.getAttribute(spd), ATTR_MOD_UUID.speed, "gltc_mage_speed", stats.speed);
    if (reach) addMageModifier(player.getAttribute(reach), ATTR_MOD_UUID.reach, "gltc_mage_reach", stats.reach);

    var uuid = player.getUniqueId().toString();
    var cur = getCurrentParticles(uuid);
    if (cur > stats.pituitaryCapacity) setCurrentParticles(uuid, stats.pituitaryCapacity);
}

/**
 * 脉冲伤害：带击杀归因，忽略最终减伤与粒子折射
 */
function dealPulseDamage(target, amount, attacker) {
    if (!target || amount <= 0) return;
    try {
        target.setMetadata(PULSE_META, new FixedMetadataValue(PLUGIN, true));
        target.setNoDamageTicks(0);
        if (attacker) target.damage(amount, attacker);
        else target.damage(amount);
    } catch (e) {
        try {
            var hp = Math.max(0, target.getHealth() - amount);
            target.setHealth(hp);
        } catch (e2) {}
    } finally {
        try { target.removeMetadata(PULSE_META, PLUGIN); } catch (e3) {}
    }
}

function isPulseDamage(entity) {
    try { return entity.hasMetadata(PULSE_META); } catch (e) { return false; }
}

// 退出清内存缓存（再进服按容量回满）；热重载先卸旧监听
(function registerParticleCacheCleanup() {
    try {
        if (PLUGIN.gltcMageCacheListener != null) {
            PlayerQuitEvent.getHandlerList().unregister(PLUGIN.gltcMageCacheListener);
            PLUGIN.gltcMageCacheListener = null;
        }
    } catch (eU) {}

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    PLUGIN.gltcMageCacheListener = listenerInstance;
    Bukkit.getPluginManager().registerEvent(
        PlayerQuitEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                clearParticleCache(event.getPlayer().getUniqueId().toString());
            } catch (e) {}
        }, PLUGIN
    );
})();

var MAGE_API_EXPORT = {
    getPlayerStats: getPlayerStats,
    savePlayerStats: savePlayerStats,
    getPlayerGear: getPlayerGear,
    savePlayerGear: savePlayerGear,
    getTotalStats: getTotalStats,
    getTotalStatsFromBase: getTotalStatsFromBase,
    invalidatePlayerCache: invalidatePlayerCache,
    getGLI: getGLI,
    calcSpellDamage: calcSpellDamage,
    calcSpellCooldownMs: calcSpellCooldownMs,
    canAffordSpell: canAffordSpell,
    consumeParticles: consumeParticles,
    refillParticlesToCap: refillParticlesToCap,
    getCurrentParticles: getCurrentParticles,
    setCurrentParticles: setCurrentParticles,
    addParticles: addParticles,
    resolvePituitaryCapacity: resolvePituitaryCapacity,
    clearParticleCache: clearParticleCache,
    flushParticle: flushParticle,
    applyMageAttributes: applyMageAttributes,
    tryLevelUp: tryLevelUp,
    spendPotential: spendPotential,
    spendPotentialOnData: spendPotentialOnData,
    resetAllPotentials: resetAllPotentials,
    resetAllPotentialsOnData: resetAllPotentialsOnData,
    adminAdjustLevel: adminAdjustLevel,
    adminAdjustPotential: adminAdjustPotential,
    adminResetAllData: adminResetAllData,
    defaultStats: defaultStats,
    MAGE_POINT_OPTIONS: MAGE_POINT_OPTIONS,
    BODY_POINT_OPTIONS: BODY_POINT_OPTIONS,
    LEVEL_POTENTIAL: LEVEL_POTENTIAL,
    HARD_CAPS: HARD_CAPS,
    clampHard: clampHard,
    dealPulseDamage: dealPulseDamage,
    isPulseDamage: isPulseDamage,
    isMageAccessory: isMageAccessory,
    isMageStaff: isMageStaff,
    canEquipInSlot: canEquipInSlot,
    itemToBase64: itemToBase64,
    itemFromBase64: itemFromBase64,
    getSlimefunId: getSlimefunId,
    getEquipmentBonuses: getEquipmentBonuses,
    ensureSpentMaps: ensureSpentMaps,
    getGearConfig: function() { loadGearConfig(); return GEAR_CFG; },
    getStaffConfig: function() { loadStaffConfig(); return STAFF_CFG; },
    equipSlotCount: equipSlotCount
};
try { PLUGIN.gltcMageApi = MAGE_API_EXPORT; } catch (eApi) {}
MAGE_API_EXPORT;
