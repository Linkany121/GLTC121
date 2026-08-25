// ===================================================================
// 施术技能核心登记 —— itemId → { name, spellSlots, skillId?, material? }
// 嵌入法杖后：解锁术式刻录上限 + 可选道具技能（见 技能登记.js）
// GUI / lore 优先用 items.yml 去前缀彩名；此处 name 仅作回退纯文本
// ===================================================================

// === 槽位规则（可调）===
var CORE_SLOTS_MIN     = 0;  // 最小刻录上限
var CORE_SLOTS_MAX     = 6;  // 最大刻录上限（与 GUI / PDC 一致）
var CORE_SLOTS_DEFAULT = 2;  // registerCore 未指定时的默认槽数

function clampCoreSlots(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < CORE_SLOTS_MIN) return CORE_SLOTS_MIN;
    if (n > CORE_SLOTS_MAX) return CORE_SLOTS_MAX;
    return n;
}

// === 核心表（可增删；skillId → 施术道具/核心技能_*.js 的导出 id）===
// spellSlots：刻录上限  material：刻录仪回退显示材质名
var CORE_REGISTRY = {
    "VASA_施术技能核心_入门": {
        name: "入门",                          // 回退短名
        spellSlots: 2,                         // 刻录上限
        material: "BROWN_GLAZED_TERRACOTTA"     // GUI 回退材质
        // 无 skillId = 无附加道具技能
    },
    "VASA_施术技能核心_辉墨摇篮": {
        name: "辉墨摇篮",
        spellSlots: 6,
        skillId: "light_ruin",                 // → 核心技能_辉墨摇篮.js
        material: "GRAY_GLAZED_TERRACOTTA"
    },
    // 兼容旧 ID（items 已改名为 辉墨摇篮）
    "VASA_施术技能核心_辉墨": {
        name: "辉墨摇篮",
        spellSlots: 6,
        skillId: "light_ruin",
        material: "GRAY_GLAZED_TERRACOTTA"
    }
};

function registerCore(itemId, opts) {
    if (!itemId || !opts) return false;
    CORE_REGISTRY[String(itemId)] = {
        name: opts.name || String(itemId),
        spellSlots: clampCoreSlots(opts.spellSlots != null ? opts.spellSlots : CORE_SLOTS_DEFAULT),
        skillId: opts.skillId || null,
        material: opts.material || null
    };
    return true;
}

function getCoreEntry(itemId) {
    return itemId ? (CORE_REGISTRY[String(itemId)] || null) : null;
}

function isSkillCoreItem(itemId) {
    return !!(itemId && CORE_REGISTRY[itemId]);
}

function getCoreName(itemId) {
    var e = getCoreEntry(itemId);
    return e ? e.name : (itemId ? String(itemId) : "未知核心");
}

function getCoreMaterial(itemId) {
    var e = getCoreEntry(itemId);
    return e && e.material ? String(e.material) : null;
}

function resolveSpellSlots(skillCoreId, staffEntry, skillCoreCfg) {
    var cfg = skillCoreCfg || { getCoreEntry: getCoreEntry, clampCoreSlots: clampCoreSlots };
    if (skillCoreId && cfg.getCoreEntry) {
        var core = cfg.getCoreEntry(skillCoreId);
        if (core) return cfg.clampCoreSlots ? cfg.clampCoreSlots(core.spellSlots) : clampCoreSlots(core.spellSlots);
    }
    var base = staffEntry && staffEntry.baseSpellSlots != null ? staffEntry.baseSpellSlots : 0;
    return clampCoreSlots(base);
}

({
    CORE_REGISTRY: CORE_REGISTRY,
    registerCore: registerCore,
    getCoreEntry: getCoreEntry,
    isSkillCoreItem: isSkillCoreItem,
    getCoreName: getCoreName,
    getCoreMaterial: getCoreMaterial,
    resolveSpellSlots: resolveSpellSlots,
    clampCoreSlots: clampCoreSlots,
    CORE_SLOTS_MAX: CORE_SLOTS_MAX
});
