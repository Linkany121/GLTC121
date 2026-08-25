// ===================================================================
// 施术道具登记 v3 — 仅「法杖」可施术
// 物品：VASA_通用施术道具 / 显示名 NTC外置粒子控制仪
// baseSpellSlots：无技能核心时的刻录上限（默认 0）
// hookScript：监听启动时 eval（onUse 兜底）
// ===================================================================

// === 身份 / 显示（可调）===
var UNIVERSAL_STAFF_ID      = "VASA_通用施术道具"; // Slimefun 物品 ID
/** 仅规范/文档简称，禁止用于游戏内玩家可见文案 */
var STAFF_SHORT_NAME        = "法杖";
var STAFF_DISPLAY_NAME      = "NTC外置粒子控制仪"; // 纯文本全名
var STAFF_DISPLAY_GRADIENT  = "§x§7§4§c§5§f§fN§x§7§a§b§1§f§fT§x§8§0§9§c§f§fC§x§8§7§8§8§f§f外§x§8§d§7§3§f§f置§x§9§7§6§9§f§f粒§x§a§5§6§a§f§f子§x§b§4§6§b§f§f控§x§c§2§6§c§f§f制§x§d§0§6§d§f§f仪";

// === 槽位规则 ===
var STAFF_SLOTS_MIN         = 0;
var STAFF_SLOTS_MAX         = 6;  // 与 GUI / PDC / 技能核心一致
var STAFF_BASE_SLOTS_DEFAULT = 0; // 无核心时默认刻录上限

function clampSlots(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < STAFF_SLOTS_MIN) return STAFF_SLOTS_MIN;
    if (n > STAFF_SLOTS_MAX) return STAFF_SLOTS_MAX;
    return n;
}

// === 法杖表（可增删）===
var STAFF_REGISTRY = {
    "VASA_通用施术道具": {
        name: STAFF_DISPLAY_NAME,
        shortName: STAFF_SHORT_NAME,
        baseSpellSlots: STAFF_BASE_SLOTS_DEFAULT, // 无核心 = 0 槽
        hookScript: "施术道具/通用施术.js"        // RSC onUse 桥接
    }
};

function registerStaff(itemId, opts, name) {
    if (!itemId) return false;
    if (typeof opts === "number") {
        opts = { baseSpellSlots: opts, name: name };
    }
    opts = opts || {};
    STAFF_REGISTRY[itemId] = {
        name: opts.name || name || itemId,
        shortName: opts.shortName || STAFF_SHORT_NAME,
        baseSpellSlots: clampSlots(opts.baseSpellSlots != null ? opts.baseSpellSlots : STAFF_BASE_SLOTS_DEFAULT),
        defaultSpells: opts.defaultSpells || [],
        hookScript: opts.hookScript || null,
        bonuses: opts.bonuses || null
    };
    return true;
}

function unregisterStaff(itemId) {
    if (!STAFF_REGISTRY[itemId]) return false;
    delete STAFF_REGISTRY[itemId];
    return true;
}

function getStaffEntry(itemId) {
    return STAFF_REGISTRY[itemId] || null;
}

/** @deprecated 使用 resolveCapacity + 技能核心；保留兼容 */
function getSpellSlots(itemId) {
    var e = getStaffEntry(itemId);
    return e ? clampSlots(e.baseSpellSlots) : 0;
}

function isUniversalStaff(itemId) {
    return String(itemId) === UNIVERSAL_STAFF_ID;
}

function listHookScripts() {
    var out = [];
    for (var id in STAFF_REGISTRY) {
        if (!STAFF_REGISTRY.hasOwnProperty(id)) continue;
        var hs = STAFF_REGISTRY[id].hookScript;
        if (hs) out.push(String(hs));
    }
    return out;
}

({
    UNIVERSAL_STAFF_ID: UNIVERSAL_STAFF_ID,
    STAFF_SHORT_NAME: STAFF_SHORT_NAME,
    STAFF_DISPLAY_NAME: STAFF_DISPLAY_NAME,
    STAFF_DISPLAY_GRADIENT: STAFF_DISPLAY_GRADIENT,
    STAFF_REGISTRY: STAFF_REGISTRY,
    registerStaff: registerStaff,
    unregisterStaff: unregisterStaff,
    getStaffEntry: getStaffEntry,
    getSpellSlots: getSpellSlots,
    clampSlots: clampSlots,
    isUniversalStaff: isUniversalStaff,
    listHookScripts: listHookScripts,
    STAFF_SLOTS_MAX: STAFF_SLOTS_MAX
});
