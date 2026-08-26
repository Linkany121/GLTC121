/**
 * GLTC 术士装备加成表（UGW）
 *
 * 类型 A~E 对应槽位：
 *   A 潜能模组 | B 核心心区 | C 生控中枢 | D 粒术中转 | E 术式辅助×4
 *
 * [简易UGW]：在 GEAR_REGISTRY 登记粘液 ID + 固定 bonuses
 * [常规UGW]：addon_configs/GLTC/术式组件/{A|B|C|D|E}/{id}.json
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
        skullHash: "f78d374329d3add928b778b587509c082b8d286aef42309d8f69e6ba2967f908"
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
    potential: "A · 潜能模组",
    core_heart: "B · 核心心区组件",
    bio_hub: "C · 生控中枢组件",
    particle_hub: "D · 粒术中转组件",
    assist: "E · 术式辅助组件"
};

var CATEGORY_LETTER = {
    potential: "A",
    core_heart: "B",
    bio_hub: "C",
    particle_hub: "D",
    assist: "E"
};

// -------------------- 组件登记（粘液 ID → 配置）--------------------
var GEAR_REGISTRY = {
    // —— 学徒 H1 制式 ——
    "VASA_uA01": {
        category: "potential",
        name: "学徒H1制式脑丘激活器",
        bonuses: { magePotential: 1, bodyPotential: 1 }
    },
    "VASA_uB01": {
        category: "core_heart",
        name: "学徒H1制式心脉稳定器",
        bonuses: { cardiovascular: 0.05, speed: 0.01 }
    },
    "VASA_uC01": {
        category: "bio_hub",
        name: "学徒H1制式脖脊辅助器",
        bonuses: { finalDamageReduction: 0.05, armor: 5 }
    },
    "VASA_uD01": {
        category: "particle_hub",
        name: "学徒H1制式腕部血管镀层",
        bonuses: { particlePower: 0.1, particleRefraction: 0.05 }
    },
    "VASA_uE011": {
        category: "assist",
        name: "学徒H1制式防护片",
        bonuses: { armor: 3, toughness: 3 }
    },
    "VASA_uE012": {
        category: "assist",
        name: "学徒H1制式肋间刺激器",
        bonuses: { particlePower: 0.1, meleeDamage: 3 }
    },

    // —— 微光集训制式 ——
    "VASA_uA02": {
        category: "potential",
        name: "微光集训制式脑丘激活器",
        bonuses: { magePotential: 3, bodyPotential: 2 }
    },
    "VASA_uB02": {
        category: "core_heart",
        name: "微光集训制式心肺泵",
        bonuses: { cardiovascular: 0.10, speed: 0.01, maxHealth: 10 }
    },
    "VASA_uC02": {
        category: "bio_hub",
        name: "微光集训制式脊椎软体",
        bonuses: { armor: 8, toughness: 8 }
    },
    "VASA_uD02": {
        category: "particle_hub",
        name: "微光集训制式附腕回路",
        bonuses: { particlePower: 0.4, particleRefraction: 0.10 }
    },
    "VASA_uE021": {
        category: "assist",
        name: "微光集训制式场维持器",
        bonuses: { finalDamageReduction: 0.04, particleRefraction: 0.03 }
    },
    "VASA_uE022": {
        category: "assist",
        name: "微光集训制式肋间刺激器",
        bonuses: { particlePower: 0.2, speed: 0.004 }
    }
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
    CATEGORY_LETTER: CATEGORY_LETTER,
    GEAR_REGISTRY: GEAR_REGISTRY,
    registerGear: registerGear,
    unregisterGear: unregisterGear,
    updateGearBonuses: updateGearBonuses,
    getGearEntry: getGearEntry,
    getSlotDef: getSlotDef,
    getSlotCount: getSlotCount,
    emptySlotsArray: emptySlotsArray
});
