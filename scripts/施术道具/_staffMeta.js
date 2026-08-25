// ===================================================================
// 施术道具 PDC 读写 — 施术核心 / 刻录仪共用
// 槽位上限由嵌入的「施术技能核心」决定（无核心 = baseSpellSlots，默认 0）
// ===================================================================

var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");

// === PDC 键（勿轻易改，改后旧法杖数据失效）===
var KEY_SPELLS     = new NamespacedKey("gltc", "staff_spells");      // 术式槽序列化
var KEY_SELECTED   = new NamespacedKey("gltc", "staff_selected");    // 当前选中槽 index
var KEY_SKILL_CORE = new NamespacedKey("gltc", "staff_skill_core");  // 嵌入的技能核心 ID

// === 槽位上限（可调，须与 GUI / 核心登记一致）===
var MAX_STAFF_SPELL_SLOTS = 6;

function toJavaInt(n) {
    var v = Math.floor(Number(n));
    if (!isFinite(v)) v = 0;
    return java.lang.Integer.parseInt(String(v), 10);
}

function clampSlots(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 0) return 0;
    if (n > MAX_STAFF_SPELL_SLOTS) return MAX_STAFF_SPELL_SLOTS;
    return n;
}

function readSkillCoreId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var meta = stack.getItemMeta();
        if (!meta) return null;
        var pdc = meta.getPersistentDataContainer();
        if (!pdc.has(KEY_SKILL_CORE, PersistentDataType.STRING)) return null;
        var v = String(pdc.get(KEY_SKILL_CORE, PersistentDataType.STRING)).trim();
        return v.length ? v : null;
    } catch (e) { return null; }
}

function resolveCapacity(entry, skillCoreId, skillCoreCfg) {
    if (skillCoreId && skillCoreCfg && typeof skillCoreCfg.resolveSpellSlots === "function") {
        return clampSlots(skillCoreCfg.resolveSpellSlots(skillCoreId, entry, skillCoreCfg));
    }
    if (skillCoreId && skillCoreCfg && typeof skillCoreCfg.getCoreEntry === "function") {
        var core = skillCoreCfg.getCoreEntry(skillCoreId);
        if (core && core.spellSlots != null) return clampSlots(core.spellSlots);
    }
    var base = entry && entry.baseSpellSlots != null ? entry.baseSpellSlots : 0;
    return clampSlots(base);
}

function parseSpellsRaw(raw, cap) {
    cap = cap != null ? cap : MAX_STAFF_SPELL_SLOTS;
    var spells = [];
    var i;
    raw = String(raw || "").trim();
    if (raw.charAt(0) === "[") {
        try {
            var parsed = JSON.parse(raw);
            if (parsed && parsed.length != null) {
                for (i = 0; i < cap; i++) {
                    var v = parsed[i] ? String(parsed[i]).trim() : "";
                    spells.push(v || null);
                }
                return spells;
            }
        } catch (e) {}
    }
    var parts = raw.length ? raw.split(",") : [];
    for (i = 0; i < cap; i++) {
        var sid = parts[i] ? String(parts[i]).trim() : "";
        spells.push(sid || null);
    }
    return spells;
}

function readStaffMeta(stack, staffCfg, isStaffFn, skillCoreCfg) {
    if (!stack || stack.getType() === Material.AIR || !staffCfg || !isStaffFn || !isStaffFn(stack)) return null;
    var id = null;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(stack);
        id = sf != null ? String(sf.getId()) : null;
    } catch (eId) { return null; }
    if (!id) return null;
    var entry = staffCfg.getStaffEntry ? staffCfg.getStaffEntry(id) : (staffCfg.STAFF_REGISTRY ? staffCfg.STAFF_REGISTRY[id] : null);
    if (!entry) return null;

    var skillCoreId = readSkillCoreId(stack);
    var cap = resolveCapacity(entry, skillCoreId, skillCoreCfg);
    var spells = [];
    var selected = -1;
    try {
        var meta = stack.getItemMeta();
        if (meta) {
            var pdc = meta.getPersistentDataContainer();
            if (pdc.has(KEY_SPELLS, PersistentDataType.STRING)) {
                spells = parseSpellsRaw(pdc.get(KEY_SPELLS, PersistentDataType.STRING), MAX_STAFF_SPELL_SLOTS);
            } else {
                var defaults = entry.defaultSpells || [];
                for (var j = 0; j < MAX_STAFF_SPELL_SLOTS; j++) {
                    spells.push(j < defaults.length && defaults[j] ? String(defaults[j]) : null);
                }
            }
            if (pdc.has(KEY_SELECTED, PersistentDataType.INTEGER)) {
                selected = Number(pdc.get(KEY_SELECTED, PersistentDataType.INTEGER));
            }
        }
    } catch (e) {
        for (var k = 0; k < MAX_STAFF_SPELL_SLOTS; k++) spells.push(null);
    }
    while (spells.length < MAX_STAFF_SPELL_SLOTS) spells.push(null);
    if (spells.length > MAX_STAFF_SPELL_SLOTS) spells = spells.slice(0, MAX_STAFF_SPELL_SLOTS);
    if (selected < 0 || selected >= cap || !spells[selected]) selected = -1;
    return {
        id: id,
        staffId: id,
        skillCoreId: skillCoreId,
        capacity: cap,
        spells: spells,
        selected: selected
    };
}

function writeStaffMeta(stack, spells, selected) {
    var meta = stack.getItemMeta();
    if (!meta) return false;
    var pdc = meta.getPersistentDataContainer();
    var arr = [];
    for (var i = 0; i < MAX_STAFF_SPELL_SLOTS; i++) {
        arr.push(spells[i] ? String(spells[i]) : "");
    }
    pdc.set(KEY_SPELLS, PersistentDataType.STRING, JSON.stringify(arr));
    if (selected >= 0) pdc.set(KEY_SELECTED, PersistentDataType.INTEGER, toJavaInt(selected));
    else try { pdc.remove(KEY_SELECTED); } catch (eR) {}
    stack.setItemMeta(meta);
    return true;
}

function writeStaffSkillCore(stack, skillCoreId) {
    var meta = stack.getItemMeta();
    if (!meta) return false;
    var pdc = meta.getPersistentDataContainer();
    if (skillCoreId) {
        pdc.set(KEY_SKILL_CORE, PersistentDataType.STRING, String(skillCoreId));
    } else {
        try { pdc.remove(KEY_SKILL_CORE); } catch (eR) {}
    }
    stack.setItemMeta(meta);
    return true;
}

({
    KEY_SPELLS: KEY_SPELLS,
    KEY_SELECTED: KEY_SELECTED,
    KEY_SKILL_CORE: KEY_SKILL_CORE,
    MAX_STAFF_SPELL_SLOTS: MAX_STAFF_SPELL_SLOTS,
    parseSpellsRaw: parseSpellsRaw,
    readStaffMeta: readStaffMeta,
    writeStaffMeta: writeStaffMeta,
    writeStaffSkillCore: writeStaffSkillCore,
    readSkillCoreId: readSkillCoreId,
    resolveCapacity: resolveCapacity,
    toJavaInt: toJavaInt,
    clampSlots: clampSlots
});
