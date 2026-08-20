/**
 * ============================================================
 *  GLTC 术士装备加成表（仅菜单组件）—— 只认粘液物品 ID
 * ============================================================
 *
 * 【菜单倒数第二行】36~44
 *   潜能激发(36) | 蓝玻(37)
 *   | 核心心区(38) | 生控中枢(39) | 粒术中转(40)   ← 三类互不通用
 *   | 术式辅助×4(41-44)                            ← 四槽互通
 *
 * 【判定规则】
 *   只检查物品的粘液 ID 是否在下方 GEAR_REGISTRY 中登记，
 *   且 entry.category 与槽位 category 一致。
 *   不读 PDC、不读 lore、不看材质。
 *
 * 【新增】
 *   1. items.yml 做好物品，记下 ID
 *   2. 在 GEAR_REGISTRY 加一条（category + bonuses）
 *
 * bonuses 可用键：
 *   particlePower, pituitaryCapacity, cardiovascular, particleRefraction,
 *   meleeDamage, maxHealth, armor, toughness, speed, reach, finalDamageReduction
 * ============================================================
 */

var EQUIP_SLOT_DEFS = [
    {
        key: "potential",
        gui: 36,
        category: "potential",
        label: "潜能激发模组",
        skullHash: "2933ccaaeefa83a61f5f3fc9430a708d577890960709c7b9c66f2150bd523561"
    },
    {
        key: "core_heart",
        gui: 38,
        category: "core_heart",
        label: "核心心区组件",
        skullHash: "22e32d66699544433a14f8e5a6d482dc9bc5b34ea2f31fd91144001ed3bfdf2f"
    },
    {
        key: "bio_hub",
        gui: 39,
        category: "bio_hub",
        label: "生控中枢组件",
        skullHash: "ecf682be108d1c9d14b54de18f0bf4f48eb4c39a51ef657501da7fbec3102145"
    },
    {
        key: "particle_hub",
        gui: 40,
        category: "particle_hub",
        label: "粒术中转组件",
        skullHash: "6c34d12f7ac939b1151d12146d0239ef0188e403ee1966d3db199e664ff38283"
    },
    {
        key: "assist_1",
        gui: 41,
        category: "assist",
        label: "术式辅助组件 · I",
        skullHash: "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba"
    },
    {
        key: "assist_2",
        gui: 42,
        category: "assist",
        label: "术式辅助组件 · II",
        skullHash: "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba"
    },
    {
        key: "assist_3",
        gui: 43,
        category: "assist",
        label: "术式辅助组件 · III",
        skullHash: "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba"
    },
    {
        key: "assist_4",
        gui: 44,
        category: "assist",
        label: "术式辅助组件 · IV",
        skullHash: "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba"
    }
];

var SEPARATOR_GUI_SLOT = 37;

var CATEGORY_NAMES = {
    potential: "潜能激发模组",
    core_heart: "核心心区组件",
    bio_hub: "生控中枢组件",
    particle_hub: "粒术中转组件",
    assist: "术式辅助组件"
};

// -------------------- 组件登记（粘液 ID → 配置）--------------------
var GEAR_REGISTRY = {
    // "VASA_示例潜能": {
    //     category: "potential",
    //     name: "示例潜能激发模组",
    //     bonuses: { particlePower: 0.3, pituitaryCapacity: 5 }
    // },

    "VASA_测试戒指": {
        category: "particle_hub",
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
