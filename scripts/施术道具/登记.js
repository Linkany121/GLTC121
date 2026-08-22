/**
 * ============================================================
 *  施术道具登记 —— 只认粘液物品 ID
 *  AI 生成规范：scripts/_AI术式与施术道具生成指南.js
 * ============================================================
 *
 * 施术道具不再提供数值加成（避免切换手持时反复改写属性文件）。
 * 仅提供：
 *   - spellSlots：术式存储等级 → 可存术式数量（钳制 2~6）
 *   - defaultSpells：首次初始化时写入物品的默认术式 ID 列表（可选）
 *   - name：显示名
 *
 * 特殊效果写在：scripts/施术道具/某某.js（items.yml script 绑定）
 * ============================================================
 */

function clampSlots(n) {
    n = parseInt(n, 10);
    if (isNaN(n) || n < 2) return 2;
    if (n > 6) return 6;
    return n;
}

var STAFF_REGISTRY = {
    "VASA_木质法杖": {
        name: "木质施术道具",
        spellSlots: 2,
        defaultSpells: []
    },
    "VASA_辉墨摇篮": {
        name: "辉墨摇篮",
        spellSlots: 6,
        defaultSpells: []
    }
};

function registerStaff(itemId, opts, name) {
    if (!itemId) return false;
    if (typeof opts === "number") {
        opts = { spellSlots: opts, name: name };
    }
    opts = opts || {};
    STAFF_REGISTRY[itemId] = {
        name: opts.name || name || itemId,
        spellSlots: clampSlots(opts.spellSlots != null ? opts.spellSlots : 2),
        defaultSpells: opts.defaultSpells || []
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

function getSpellSlots(itemId) {
    var e = getStaffEntry(itemId);
    return e ? clampSlots(e.spellSlots) : 2;
}

({
    STAFF_REGISTRY: STAFF_REGISTRY,
    registerStaff: registerStaff,
    unregisterStaff: unregisterStaff,
    getStaffEntry: getStaffEntry,
    getSpellSlots: getSpellSlots,
    clampSlots: clampSlots
});
