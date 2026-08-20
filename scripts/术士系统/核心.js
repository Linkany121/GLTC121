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
var particleCache = new java.util.concurrent.ConcurrentHashMap();

// 升级时术士潜能/体能潜能获得量（1~8级）
var LEVEL_POTENTIAL = [0, 4, 4, 12, 4, 4, 12, 4, 12];

// 术士潜能加点（每点）
var MAGE_POINT_OPTIONS = {
    particlePower: { label: "粒子强度", per: 0.1 },
    pituitaryCapacity: { label: "松垂体容量", per: 6 },
    cardiovascular: { label: "心血管强度", per: 0.01 },
    particleRefraction: { label: "粒子折射", per: 0.01 },
    finalDamageReduction: { label: "最终减伤", per: 0.01 }
};

// 体能潜能加点（每点）
var BODY_POINT_OPTIONS = {
    meleeDamage: { label: "近战伤害白值", per: 2 },
    maxHealth: { label: "血量白值", per: 10 },
    armor: { label: "防御白值", per: 1 },
    toughness: { label: "韧性白值", per: 0.5 },
    speed: { label: "速度白值", per: 0.01 },
    reach: { label: "手长白值", per: 0.2 }
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
    if (GEAR_CFG && GEAR_CFG.GEAR_REGISTRY) return true;
    var exported = evalScriptExport("术士系统/装备加成.js");
    if (exported && exported.GEAR_REGISTRY) { GEAR_CFG = exported; return true; }
    return false;
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

function getPlayerStats(uuid) {
    var data = readJsonFile(statsFile(uuid));
    if (!data) {
        data = defaultStats();
        savePlayerStats(uuid, data);
        return data;
    }
    var base = defaultStats();
    for (var k in base) {
        if (data[k] === undefined || data[k] === null) data[k] = base[k];
    }
    // 旧档清理：数值文件里若还带当前粒子字段则丢掉
    if (data.currentParticles !== undefined) {
        delete data.currentParticles;
        savePlayerStats(uuid, data);
    }
    return data;
}

function savePlayerStats(uuid, data) {
    var copy = {};
    for (var k in data) {
        if (k === "currentParticles") continue;
        copy[k] = data[k];
    }
    return writeJsonFile(statsFile(uuid), copy);
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
    return writeJsonFile(gearFile(uuid), data);
}

/** 缓存未命中时按容量回满（纯内存，不落盘） */
function ensureParticleLoaded(uuid, capHint) {
    if (particleCache.containsKey(uuid)) return particleCache.get(uuid);
    var v = capHint != null ? Number(capHint) || 0 : 10;
    particleCache.put(uuid, v);
    return v;
}

function getCurrentParticles(uuid) {
    return ensureParticleLoaded(uuid, null);
}

function setCurrentParticles(uuid, value) {
    var v = Math.max(0, Number(value) || 0);
    particleCache.put(uuid, v);
    return v;
}

function clearParticleCache(uuid) {
    try { particleCache.remove(uuid); } catch (e) {}
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
    loadGearConfig();
    var total = emptyBonuses();
    var gear = getPlayerGear(uuid);
    var n = equipSlotCount();
    for (var i = 0; i < n; i++) {
        if (!gear.slots[i]) continue;
        var item = itemFromBase64(gear.slots[i]);
        if (item) mergeBonus(total, getBonusesFromGearId(getSlimefunId(item)));
    }
    return total;
}

/** 法杖仅负责特效与术式存储，不参与数值汇总 */
function getStaffBonuses(player) {
    return emptyBonuses();
}

function clamp01(v) {
    if (v < 0) return 0;
    if (v > 0.95) return 0.95;
    return v;
}

function getTotalStats(player, includeStaff) {
    var uuid = player.getUniqueId().toString();
    var base = getPlayerStats(uuid);
    var equip = getEquipmentBonuses(uuid);
    // includeStaff 参数保留兼容；法杖不再加数值
    var staff = emptyBonuses();

    var pituitaryCapacity = (base.pituitaryCapacity || 0) + equip.pituitaryCapacity + staff.pituitaryCapacity;
    var cur = ensureParticleLoaded(uuid, pituitaryCapacity);
    if (cur > pituitaryCapacity) {
        cur = pituitaryCapacity;
        setCurrentParticles(uuid, cur);
    }

    return {
        mageLevel: base.mageLevel || 0,
        proficiency: base.proficiency || 0,
        magePotential: base.magePotential || 0,
        bodyPotential: base.bodyPotential || 0,
        particlePower: (base.particlePower || 0) + equip.particlePower + staff.particlePower,
        pituitaryCapacity: pituitaryCapacity,
        cardiovascular: clamp01((base.cardiovascular || 0) + equip.cardiovascular + staff.cardiovascular),
        particleRefraction: clamp01((base.particleRefraction || 0) + equip.particleRefraction + staff.particleRefraction),
        meleeDamage: (base.meleeDamage || 0) + equip.meleeDamage + staff.meleeDamage,
        maxHealth: (base.maxHealth || 0) + equip.maxHealth + staff.maxHealth,
        armor: (base.armor || 0) + equip.armor + staff.armor,
        toughness: (base.toughness || 0) + equip.toughness + staff.toughness,
        speed: (base.speed || 0) + equip.speed + staff.speed,
        reach: (base.reach || 0) + equip.reach + staff.reach,
        finalDamageReduction: clamp01((base.finalDamageReduction || 0) + equip.finalDamageReduction + staff.finalDamageReduction),
        currentParticles: cur
    };
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
    var stats = getTotalStats(player, true);
    return Math.max(50, Math.floor(baseCooldownMs * Math.max(0.01, 1 - (stats.cardiovascular || 0))));
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

/** 消耗 1 点潜能加属性。pool: "mage" | "body" */
function spendPotential(player, pool, statKey) {
    var table = pool === "body" ? BODY_POINT_OPTIONS : MAGE_POINT_OPTIONS;
    if (!table[statKey]) return { ok: false, msg: "无效属性" };
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
    ensureSpentMaps(data);
    var field = pool === "body" ? "bodyPotential" : "magePotential";
    var spentField = pool === "body" ? "bodySpent" : "mageSpent";
    if ((data[field] || 0) < 1) return { ok: false, msg: "潜能点不足" };
    data[field] -= 1;
    data[statKey] = (data[statKey] || 0) + table[statKey].per;
    if (statKey === "cardiovascular" || statKey === "particleRefraction" || statKey === "finalDamageReduction") {
        data[statKey] = clamp01(data[statKey]);
    }
    data[spentField][statKey] = (data[spentField][statKey] || 0) + 1;
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return { ok: true, msg: table[statKey].label + " +" + table[statKey].per, left: data[field] };
}

/** 重置全部已分配潜能，点数退回对应池 */
function resetAllPotentials(player) {
    var uuid = player.getUniqueId().toString();
    var data = getPlayerStats(uuid);
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
    savePlayerStats(uuid, data);
    applyMageAttributes(player);
    return { ok: true, mage: refundMage, body: refundBody, mageLeft: data.magePotential, bodyLeft: data.bodyPotential };
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
    if (!inst || !amount) return;
    clearMageModifier(inst, uuid);
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

// 退出清内存缓存（再进服按容量回满）
(function registerParticleCacheCleanup() {
    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    Bukkit.getPluginManager().registerEvent(
        PlayerQuitEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try { clearParticleCache(event.getPlayer().getUniqueId().toString()); } catch (e) {}
        }, PLUGIN
    );
})();

({
    getPlayerStats: getPlayerStats,
    savePlayerStats: savePlayerStats,
    getPlayerGear: getPlayerGear,
    savePlayerGear: savePlayerGear,
    getTotalStats: getTotalStats,
    getGLI: getGLI,
    calcSpellDamage: calcSpellDamage,
    calcSpellCooldownMs: calcSpellCooldownMs,
    canAffordSpell: canAffordSpell,
    consumeParticles: consumeParticles,
    refillParticlesToCap: refillParticlesToCap,
    getCurrentParticles: getCurrentParticles,
    setCurrentParticles: setCurrentParticles,
    clearParticleCache: clearParticleCache,
    flushParticle: flushParticle,
    applyMageAttributes: applyMageAttributes,
    tryLevelUp: tryLevelUp,
    spendPotential: spendPotential,
    resetAllPotentials: resetAllPotentials,
    MAGE_POINT_OPTIONS: MAGE_POINT_OPTIONS,
    BODY_POINT_OPTIONS: BODY_POINT_OPTIONS,
    LEVEL_POTENTIAL: LEVEL_POTENTIAL,
    dealPulseDamage: dealPulseDamage,
    isPulseDamage: isPulseDamage,
    isMageAccessory: isMageAccessory,
    isMageStaff: isMageStaff,
    canEquipInSlot: canEquipInSlot,
    itemToBase64: itemToBase64,
    itemFromBase64: itemFromBase64,
    getSlimefunId: getSlimefunId,
    getGearConfig: function() { loadGearConfig(); return GEAR_CFG; },
    getStaffConfig: function() { loadStaffConfig(); return STAFF_CFG; },
    equipSlotCount: equipSlotCount
});
