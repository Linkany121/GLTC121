/**
 * ============================================================
 *  GLTC 术士装备加成表（仅菜单饰品）—— 只认粘液物品 ID
 * ============================================================
 *
 * 【菜单倒数第二行】36~44
 *   潜能(36) | 蓝玻(37) | 强化×3(38-40) | 辅助×4(41-44)
 *
 * 【判定规则】
 *   只检查物品的粘液 ID 是否在下方 GEAR_REGISTRY 中登记。
 *   不读 PDC、不读 lore、不看材质。
 *
 * 【新增】
 *   1. items.yml 做好物品，记下 ID
 *   2. 在 GEAR_REGISTRY 加一条（category + bonuses）
 *
 * 【修改】改 bonuses  → 【删除】删掉该 ID 整条
 *
 * 【法杖】不在本文件。见 scripts/施术道具/登记.js 与各法杖 js
 *
 * bonuses 可用键：
 *   particlePower, pituitaryCapacity, cardiovascular, particleRefraction,
 *   meleeDamage, maxHealth, armor, toughness, speed, reach, finalDamageReduction
 * ============================================================
 */

var EQUIP_SLOT_DEFS = [
    { key: "potential", gui: 36, category: "potential", label: "潜能模块" },
    { key: "enhance_1", gui: 38, category: "enhance",   label: "强化组件 · I" },
    { key: "enhance_2", gui: 39, category: "enhance",   label: "强化组件 · II" },
    { key: "enhance_3", gui: 40, category: "enhance",   label: "强化组件 · III" },
    { key: "assist_1",  gui: 41, category: "assist",    label: "术式辅助 · I" },
    { key: "assist_2",  gui: 42, category: "assist",    label: "术式辅助 · II" },
    { key: "assist_3",  gui: 43, category: "assist",    label: "术式辅助 · III" },
    { key: "assist_4",  gui: 44, category: "assist",    label: "术式辅助 · IV" }
];

var SEPARATOR_GUI_SLOT = 37;

var CATEGORY_NAMES = {
    potential: "潜能模块",
    enhance: "强化组件",
    assist: "术式辅助工具"
};

// -------------------- 饰品登记（粘液 ID → 配置）--------------------
var GEAR_REGISTRY = {
    // "VASA_示例潜能": {
    //     category: "potential",
    //     name: "示例潜能模块",
    //     bonuses: { particlePower: 0.3, pituitaryCapacity: 5 }
    // },

    "VASA_测试戒指": {
        category: "enhance",
        name: "测试强化",
        bonuses: {
            particlePower: 0.1,
            pituitaryCapacity: 1
        }
    }

    // "VASA_示例辅助": {
    //     category: "assist",
    //     name: "示例辅助",
    //     bonuses: { cardiovascular: 0.05 }
    // }
};

/** 新增/覆盖 */
function registerGear(itemId, category, bonuses, name) {
    if (!itemId || !category) return false;
    GEAR_REGISTRY[itemId] = {
        category: category,
        name: name || itemId,
        bonuses: bonuses || {}
    };
    return true;
}

/** 删除 */
function unregisterGear(itemId) {
    if (!GEAR_REGISTRY[itemId]) return false;
    delete GEAR_REGISTRY[itemId];
    return true;
}

/** 部分更新 bonuses */
function updateGearBonuses(itemId, bonusPatch) {
    if (!GEAR_REGISTRY[itemId] || !bonusPatch) return false;
    var b = GEAR_REGISTRY[itemId].bonuses || {};
    for (var k in bonusPatch) {
        if (typeof bonusPatch[k] === "number") b[k] = bonusPatch[k];
    }
    GEAR_REGISTRY[itemId].bonuses = b;
    return true;
}

function getGearEntry(itemId) {
    return GEAR_REGISTRY[itemId] || null;
}

function getSlotDef(index) {
    return EQUIP_SLOT_DEFS[index] || null;
}

function getSlotCount() {
    return EQUIP_SLOT_DEFS.length;
}

function emptySlotsArray() {
    var a = [];
    for (var i = 0; i < EQUIP_SLOT_DEFS.length; i++) a.push(null);
    return a;
}

({
    EQUIP_SLOT_DEFS: EQUIP_SLOT_DEFS,
    SEPARATOR_GUI_SLOT: SEPARATOR_GUI_SLOT,
    CATEGORY_NAMES: CATEGORY_NAMES,
    GEAR_REGISTRY: GEAR_REGISTRY,
    registerGear: registerGear,
    unregisterGear: unregisterGear,
    updateGearBonuses: updateGearBonuses,
    getGearEntry: getGearEntry,
    getSlotDef: getSlotDef,
    getSlotCount: getSlotCount,
    emptySlotsArray: emptySlotsArray
});
