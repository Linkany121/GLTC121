/**
 * GLTC 术士系统 - 核心（重构版）
 *
 * 数值文件：addon_configs/GLTC/玩家属性/术士数值/{uuid}.json
 *   - 术士等级、驭粒熟练度、术士/体能潜能池
 *   - 每项属性：当前数值（潜能+默认，不含组件）+ 该项已消耗潜能点数
 * 装备文件：addon_configs/GLTC/玩家属性/术士装备/{uuid}.json
 *   - 8 槽：A潜能模组 / B核心心区 / C生控中枢 / D粒术中转 / E辅助×4
 *   - 槽位记录 UGW 配置 ID（如 A000000001）及物品快照（base64）
 * UGW 配置：addon_configs/GLTC/术式组件/{A|B|C|D|E}/{id}.json
 * 粒子量：纯内存；登录/重载回满；容量变化时仅钳制超上限
 *
 * 粒子折射：仅减免术式造成的粒子伤害
 * 最终减伤：减免脉冲以外的所有伤害
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
var UGW_ROOT = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/术式组件");
if (!STATS_DIR.exists()) STATS_DIR.mkdirs();
if (!GEAR_DIR.exists()) GEAR_DIR.mkdirs();
for (var _ti = 0; _ti < ["A", "B", "C", "D", "E"].length; _ti++) {
    var _td = new File(UGW_ROOT, ["A", "B", "C", "D", "E"][_ti]);
    if (!_td.exists()) _td.mkdirs();
}

var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
var KEY_UGW_ID = new NamespacedKey("gltc", "ugw_id");
var KEY_UGW_CREATOR = new NamespacedKey("gltc", "ugw_creator");
var GLI_CONFIG_KEY = "ParticleConcentration";
var GLI_DEFAULT = 1.0;
var PULSE_META = "gltc_pulse_hit";

var GEAR_CFG = null;
var STAFF_CFG = null;
var JString = Java.type("java.lang.String");

var ugwJsonCache = new java.util.concurrent.ConcurrentHashMap();

function cacheKey(uuid) {
    return JString.valueOf(String(uuid));
}

function sharedConcurrentMap(metaKey, preferredField) {
    var field = preferredField || ("gltc_map_" + String(metaKey).replace(/[^a-zA-Z0-9_]/g, "_"));
    var fromField = null;
    var fromMeta = null;
    try { if (PLUGIN[field] != null) fromField = PLUGIN[field]; } catch (e0) {}
    try {
        if (PLUGIN.hasMetadata(metaKey)) fromMeta = PLUGIN.getMetadata(metaKey).get(0).value();
    } catch (e1) {}
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

var particleCache = sharedConcurrentMap("gltc_shared_particle_cache", "gltcParticleCache");
var statsDataCache = sharedConcurrentMap("gltc_shared_stats_json_cache", "gltcStatsJsonCache");
var equipBonusCache = sharedConcurrentMap("gltc_shared_equip_bonus_json_cache", "gltcEquipBonusCache");

var LEVEL_POTENTIAL = [0, 8, 4, 4, 10, 4, 4, 10, 12];

var HARD_CAPS = {
    cardiovascular: 0.99,
    particleRefraction: 0.95,
    finalDamageReduction: 0.90,
    armor: 100,
    toughness: 50
};

/** 术士潜能：statKey → 配置 */
var MAGE_POINT_OPTIONS = {
    particlePower: { label: "粒子强度", per: 0.1 },
    pituitaryCapacity: { label: "松垂体容量", per: 8 },
    cardiovascular: { label: "心血管强度", per: 0.02, maxPoints: 20 },
    particleRefraction: { label: "粒子折射", per: 0.03, maxPoints: 20 },
    finalDamageReduction: { label: "最终减伤", per: 0.02, maxPoints: 24 }
};

/** 体能潜能 */
var BODY_POINT_OPTIONS = {
    meleeDamage: { label: "筋力解放", per: 1 },
    maxHealth: { label: "肌脂提升", per: 8 },
    armor: { label: "骨骼结构", per: 2, maxPoints: 15 },
    toughness: { label: "体态掌控", per: 0.5, maxPoints: 20 },
    speed: { label: "心肺强化", per: 0.01, maxPoints: 32 },
    reach: { label: "体态协调", per: 0.1, maxPoints: 16 }
};

var ALL_STAT_KEYS = (function() {
    var keys = [];
    for (var k in MAGE_POINT_OPTIONS) keys.push(k);
    for (var b in BODY_POINT_OPTIONS) keys.push(b);
    return keys;
})();

function spentField(statKey) {
    return statKey + "Spent";
}

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
    var o = {
        mageLevel: 0,
        proficiency: 0,
        magePotential: 0,
        bodyPotential: 0,
        particlePower: 0,
        particlePowerSpent: 0,
        pituitaryCapacity: 0,
        pituitaryCapacitySpent: 0,
        cardiovascular: 0,
        cardiovascularSpent: 0,
        particleRefraction: 0,
        particleRefractionSpent: 0,
        finalDamageReduction: 0,
        finalDamageReductionSpent: 0,
        meleeDamage: 0,
        meleeDamageSpent: 0,
        maxHealth: 0,
        maxHealthSpent: 0,
        armor: 0,
        armorSpent: 0,
        toughness: 0,
        toughnessSpent: 0,
        speed: 0,
        speedSpent: 0,
        reach: 0,
        reachSpent: 0
    };
    return o;
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

/** 旧档迁移：mageSpent/bodySpent → xxxSpent；剥离组件加成使文件仅存潜能部分 */
function migrateStatsData(data, uuid) {
    var defs = defaultStats();
    var changed = false;

    if (data.mageSpent || data.bodySpent) {
        var mk, bk;
        for (mk in MAGE_POINT_OPTIONS) {
            var sf = spentField(mk);
            if (data.mageSpent && data.mageSpent[mk] != null) {
                data[sf] = Number(data.mageSpent[mk]) || 0;
                changed = true;
            }
        }
        for (bk in BODY_POINT_OPTIONS) {
            var sf2 = spentField(bk);
            if (data.bodySpent && data.bodySpent[bk] != null) {
                data[sf2] = Number(data.bodySpent[bk]) || 0;
                changed = true;
            }
        }
        delete data.mageSpent;
        delete data.bodySpent;
        changed = true;
    }

    if (data.currentParticles !== undefined) {
        delete data.currentParticles;
        changed = true;
    }

    var equip = null;
    try { equip = getEquipmentBonuses(uuid); } catch (eEq) { equip = emptyBonuses(); }

    for (var i = 0; i < ALL_STAT_KEYS.length; i++) {
        var sk = ALL_STAT_KEYS[i];
        var sf3 = spentField(sk);
        if (data[sf3] === undefined || data[sf3] === null) {
            var opt = MAGE_POINT_OPTIONS[sk] || BODY_POINT_OPTIONS[sk];
            if (opt && data[sk] != null && defs[sk] != null) {
                var delta = Number(data[sk]) - Number(defs[sk]) - Number((equip && equip[sk]) || 0);
                data[sf3] = Math.max(0, Math.round(delta / opt.per));
            } else {
                data[sf3] = 0;
            }
            changed = true;
        }
        if (data[sk] === undefined || data[sk] === null) data[sk] = defs[sk];
        var equipVal = Number((equip && equip[sk]) || 0);
        var spentPts = Number(data[sf3]) || 0;
        var opt2 = MAGE_POINT_OPTIONS[sk] || BODY_POINT_OPTIONS[sk];
        var expected = (opt2 ? spentPts * opt2.per : 0);
        var cur = Number(data[sk]) || 0;
        if (equipVal > 0 && Math.abs(cur - equipVal - expected) < 0.001) {
            data[sk] = expected;
            changed = true;
        } else if (equipVal > 0 && cur > expected + 0.001) {
            data[sk] = Math.max(0, cur - equipVal);
            changed = true;
        }
    }

    for (var k in defs) {
        if (data[k] === undefined || data[k] === null) {
            data[k] = defs[k];
            changed = true;
        }
    }
    return changed;
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

    if (migrateStatsData(data, uuid)) {
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
    if (ok) cachePutStatsJson(uuid, copy);
    else try { statsDataCache.remove(cacheKey(uuid)); } catch (e) {}
    return ok;
}

function normalizeGearSlot(entry) {
    if (entry == null) return null;
    if (typeof entry === "string") {
        return { ugwId: null, item: entry };
    }
    if (typeof entry === "object") {
        return {
            ugwId: entry.ugwId ? String(entry.ugwId) : null,
            item: entry.item ? String(entry.item) : null
        };
    }
    return null;
}

function getPlayerGear(uuid) {
    var data = readJsonFile(gearFile(uuid));
    var need = equipSlotCount();
    var slots = [];
    if (!data || !data.slots) {
        for (var z = 0; z < need; z++) slots.push(null);
        return { slots: slots };
    }
    for (var i = 0; i < need; i++) {
        slots.push(i < data.slots.length ? normalizeGearSlot(data.slots[i]) : null);
    }
    return { slots: slots };
}

function savePlayerGear(uuid, data) {
    uuid = String(uuid);
    var ok = writeJsonFile(gearFile(uuid), data);
    try { equipBonusCache.remove(cacheKey(uuid)); } catch (e) {}
    return ok;
}

function ugwConfigFile(ugwId) {
    if (!ugwId) return null;
    var id = String(ugwId);
    var type = id.charAt(0);
    if ("ABCDE".indexOf(type) < 0) return null;
    return new File(UGW_ROOT, type + "/" + id + ".json");
}

function loadUgwConfig(ugwId) {
    if (!ugwId) return null;
    var key = String(ugwId);
    try {
        if (ugwJsonCache.containsKey(key)) return JSON.parse(String(ugwJsonCache.get(key)));
    } catch (e0) {}
    var file = ugwConfigFile(key);
    if (!file || !file.exists()) return null;
    var cfg = readJsonFile(file);
    if (cfg) {
        try { ugwJsonCache.put(key, JSON.stringify(cfg)); } catch (e1) {}
    }
    return cfg;
}

function getUgwIdFromItem(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var meta = stack.getItemMeta();
        if (meta && meta.getPersistentDataContainer().has(KEY_UGW_ID, PersistentDataType.STRING)) {
            return meta.getPersistentDataContainer().get(KEY_UGW_ID, PersistentDataType.STRING);
        }
    } catch (e) {}
    return null;
}

function getUgwCreatorFromItem(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var meta = stack.getItemMeta();
        if (meta && meta.getPersistentDataContainer().has(KEY_UGW_CREATOR, PersistentDataType.STRING)) {
            return meta.getPersistentDataContainer().get(KEY_UGW_CREATOR, PersistentDataType.STRING);
        }
    } catch (e) {}
    return null;
}

function resolvePituitaryCapacity(uuid) {
    uuid = String(uuid);
    try {
        var base = getPlayerStats(uuid);
        var equip = getEquipmentBonuses(uuid);
        return sumStat(base, equip, emptyBonuses(), "pituitaryCapacity");
    } catch (e) {
        return 0;
    }
}

function ensureParticleLoaded(uuid, capHint) {
    var key = cacheKey(uuid);
    if (particleCache.containsKey(key)) return Number(particleCache.get(key)) || 0;
    var v = capHint != null ? Number(capHint) || 0 : resolvePituitaryCapacity(String(uuid));
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
    var ugwId = getUgwIdFromItem(stack);
    if (ugwId && loadUgwConfig(ugwId)) return true;
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

function getBonusesFromUgwConfig(cfg) {
    var b = emptyBonuses();
    if (cfg && cfg.bonuses) mergeBonus(b, cfg.bonuses);
    return b;
}

function getBonusesFromStaffId(itemId) {
    return emptyBonuses();
}

function canEquipInSlot(stack, slotIndex, playerUuid) {
    loadGearConfig();
    if (!GEAR_CFG || !stack) return false;
    var def = GEAR_CFG.getSlotDef(slotIndex);
    if (!def) return false;

    var ugwId = getUgwIdFromItem(stack);
    if (ugwId) {
        var cfg = loadUgwConfig(ugwId);
        if (!cfg) return false;
        var typeLetter = String(ugwId).charAt(0);
        var expectCat = def.category;
        var typeMap = { A: "potential", B: "core_heart", C: "bio_hub", D: "particle_hub", E: "assist" };
        if (typeMap[typeLetter] !== expectCat) return false;
        if (cfg.kind === "normal" || cfg.kind === "regular") {
            var creator = cfg.creator || getUgwCreatorFromItem(stack);
            if (creator && playerUuid && String(creator) !== String(playerUuid)) return false;
        }
        return true;
    }

    var id = getSlimefunId(stack);
    var entry = id ? GEAR_CFG.GEAR_REGISTRY[id] : null;
    return !!(entry && entry.category === def.category);
}

/** 装备时去重：同 uid 的常规 UGW 只保留一件 */
function dedupeUgwOnEquip(player, stack) {
    if (!player || !stack) return stack;
    var ugwId = getUgwIdFromItem(stack);
    if (!ugwId) return stack;
    var cfg = loadUgwConfig(ugwId);
    if (!cfg || (cfg.kind !== "normal" && cfg.kind !== "regular")) return stack;

    var gear = getPlayerGear(player.getUniqueId().toString());
    var seen = {};
    var removed = 0;
    for (var i = 0; i < gear.slots.length; i++) {
        var slot = gear.slots[i];
        if (!slot) continue;
        var sid = slot.ugwId;
        if (!sid) {
            var it = slot.item ? itemFromBase64(slot.item) : null;
            sid = it ? getUgwIdFromItem(it) : null;
        }
        if (sid === ugwId) {
            if (seen[sid]) {
                gear.slots[i] = null;
                removed++;
            } else {
                seen[sid] = true;
            }
        }
    }
    if (removed > 0) savePlayerGear(player.getUniqueId().toString(), gear);
    return stack;
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
        var slot = gear.slots[i];
        var ugwId = slot.ugwId;
        var item = slot.item ? itemFromBase64(slot.item) : null;
        if (!ugwId && item) ugwId = getUgwIdFromItem(item);

        if (ugwId) {
            mergeBonus(total, getBonusesFromUgwConfig(loadUgwConfig(ugwId)));
        } else if (item) {
            mergeBonus(total, getBonusesFromGearId(getSlimefunId(item)));
        }
    }
    try { equipBonusCache.put(key, JSON.stringify(total)); } catch (e2) {}
    return total;
}

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
    } catch (e) { cardio = 0; }
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

function ensureSpentFields(data) {
    for (var i = 0; i < ALL_STAT_KEYS.length; i++) {
        var sk = ALL_STAT_KEYS[i];
        var sf = spentField(sk);
        if (data[sf] === undefined || data[sf] === null) data[sf] = 0;
    }
}

function spendPotentialOnData(data, pool, statKey) {
    var table = pool === "body" ? BODY_POINT_OPTIONS : MAGE_POINT_OPTIONS;
    if (!table[statKey]) return { ok: false, msg: "无效属性" };
    ensureSpentFields(data);
    var field = pool === "body" ? "bodyPotential" : "magePotential";
    var sf = spentField(statKey);
    if ((data[field] || 0) < 1) return { ok: false, msg: "潜能点不足" };

    var opt = table[statKey];
    var spentNow = Number(data[sf]) || 0;
    if (opt.maxPoints != null && spentNow >= opt.maxPoints) {
        return { ok: false, msg: opt.label + " 潜能已达上限（" + opt.maxPoints + " 点）" };
    }

    data[field] -= 1;
    data[statKey] = (Number(data[statKey]) || 0) + opt.per;
    data[sf] = spentNow + 1;

    var shown = opt.per;
    if (statKey === "cardiovascular" || statKey === "particleRefraction" || statKey === "finalDamageReduction") {
        shown = (Math.round(opt.per * 1000) / 10) + "%";
    }
    return { ok: true, msg: opt.label + " +" + shown, left: data[field] };
}

function resetAllPotentialsOnData(data) {
    ensureSpentFields(data);
    var refundMage = 0;
    var refundBody = 0;
    var mk, bk;
    for (mk in MAGE_POINT_OPTIONS) refundMage += Number(data[spentField(mk)]) || 0;
    for (bk in BODY_POINT_OPTIONS) refundBody += Number(data[spentField(bk)]) || 0;
    if (refundMage <= 0 && refundBody <= 0) {
        return { ok: false, msg: "没有已分配的潜能" };
    }
    var defs = defaultStats();
    for (mk in MAGE_POINT_OPTIONS) {
        data[mk] = defs[mk];
        data[spentField(mk)] = 0;
    }
    for (bk in BODY_POINT_OPTIONS) {
        data[bk] = defs[bk];
        data[spentField(bk)] = 0;
    }
    data.magePotential = (data.magePotential || 0) + refundMage;
    data.bodyPotential = (data.bodyPotential || 0) + refundBody;
    return { ok: true, mage: refundMage, body: refundBody, mageLeft: data.magePotential, bodyLeft: data.bodyPotential };
}

function spendPotential(player, pool, statKey) {
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    var r = spendPotentialOnData(data, pool, statKey);
    if (!r.ok) return r;
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return r;
}

function resetAllPotentials(player) {
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    var r = resetAllPotentialsOnData(data);
    if (!r.ok) return r;
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return r;
}

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

function adminResetAllData(player) {
    var uuid = player.getUniqueId().toString();
    var gear = getPlayerGear(uuid);
    var returned = 0;
    if (gear && gear.slots) {
        for (var i = 0; i < gear.slots.length; i++) {
            if (!gear.slots[i] || !gear.slots[i].item) continue;
            var item = itemFromBase64(gear.slots[i].item);
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

function schedulePulseMetaCleanup(target) {
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try { target.removeMetadata(PULSE_META, PLUGIN); } catch (e0) {}
        });
    } catch (e1) {
        try { target.removeMetadata(PULSE_META, PLUGIN); } catch (e2) {}
    }
}

function dealPulseDamage(target, amount, attacker) {
    if (!target || amount <= 0) return;
    try {
        target.setMetadata(PULSE_META, new FixedMetadataValue(PLUGIN, true));
        target.setNoDamageTicks(0);
        var dealt = false;
        try {
            var DamageSource = Java.type("org.bukkit.damage.DamageSource");
            var DamageType = Java.type("org.bukkit.damage.DamageType");
            var src = DamageSource.builder(DamageType.VOID);
            if (attacker) src = src.withCausingEntity(attacker).withDirectEntity(attacker);
            target.damage(amount, src.build());
            dealt = true;
        } catch (eDs) {}
        if (!dealt) {
            if (attacker) target.damage(amount, attacker);
            else target.damage(amount);
        }
    } catch (e) {
        try {
            var hp = Math.max(0, target.getHealth() - amount);
            target.setHealth(hp);
        } catch (e2) {}
    }
    schedulePulseMetaCleanup(target);
}

function isPulseDamage(entity) {
    try { return entity.hasMetadata(PULSE_META); } catch (e) { return false; }
}

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
    dedupeUgwOnEquip: dedupeUgwOnEquip,
    itemToBase64: itemToBase64,
    itemFromBase64: itemFromBase64,
    getSlimefunId: getSlimefunId,
    getEquipmentBonuses: getEquipmentBonuses,
    loadUgwConfig: loadUgwConfig,
    getUgwIdFromItem: getUgwIdFromItem,
    getUgwCreatorFromItem: getUgwCreatorFromItem,
    spentField: spentField,
    ensureSpentFields: ensureSpentFields,
    /** @deprecated 兼容装备菜单 */
    ensureSpentMaps: ensureSpentFields,
    getGearConfig: function() { loadGearConfig(); return GEAR_CFG; },
    getStaffConfig: function() { loadStaffConfig(); return STAFF_CFG; },
    equipSlotCount: equipSlotCount
};
try { PLUGIN.gltcMageApi = MAGE_API_EXPORT; } catch (eApi) {}
MAGE_API_EXPORT;
