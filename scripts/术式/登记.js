/**
 * 术式登记加载器
 * - 每个术式单独一个 JS（见下方 SPELL_FILES）
 * - 编写规范：scripts/_术式与施术道具编写指南.js
 * - 文件命名：流派_环数_名称.js（例：环夜谷_1_火球术.js、沃土_4_花如画卷.js）
 * - 术式脚本需导出：{ id, name, ring, cost, cooldownMs, book?, school?, cast }
 * - book:true 的 ID 可作为术式刻录载体（附魔书物品 ID = 术式 ID）
 * - school：流派键；未写时从文件名前缀推断
 *
 * 流派潜影盒色（转换仪槽位）：
 *   红 / 黄 / 浅绿(lime) / 蓝 / 粉 —— 见 SCHOOL_SHULKER
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

/** 在此追加新术式文件名（相对 scripts/，不含路径前缀重复） */
var SPELL_FILES = [
    "术式/环夜谷_1_火球术.js",
    "术式/沃土_1_送花.js",
    "术式/沃土_2_微风花流.js",
    "术式/沃土_3_庇护脉络.js",
    "术式/沃土_4_花如画卷.js"
];

/**
 * 流派 → 潜影盒材质（红黄绿蓝粉）
 * 键用短名；显示名可含「xx流派」后缀，解析时会归一。
 */
var SCHOOL_SHULKER = {
    "环夜谷": "BLUE_SHULKER_BOX",
    "沃土": "LIME_SHULKER_BOX",
    // 预留
    "赤焰": "RED_SHULKER_BOX",
    "金律": "YELLOW_SHULKER_BOX",
    "绯梦": "PINK_SHULKER_BOX"
};

var SCHOOL_DISPLAY = {
    "环夜谷": "环夜谷标准流派",
    "沃土": "沃土奥法流派",
    "赤焰": "赤焰流派",
    "金律": "金律流派",
    "绯梦": "绯梦流派"
};

var EMPTY_SPELL_SHULKER = "LIGHT_GRAY_SHULKER_BOX";
var LOCKED_SPELL_SHULKER = "OBSIDIAN";

var SPELL_REGISTRY = {};
var SPELL_BOOK_IDS = {};

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
        Bukkit.getLogger().warning("[GLTC术式] 加载失败 " + relativeUnderScripts + ": " + e);
    }
    return null;
}

/** 从文件路径推断流派键：术式/环夜谷_1_火球术.js → 环夜谷 */
function schoolFromSource(source) {
    if (!source) return "";
    var base = String(source).replace(/\\/g, "/");
    var slash = base.lastIndexOf("/");
    if (slash >= 0) base = base.substring(slash + 1);
    base = base.replace(/\.js$/i, "");
    var us = base.indexOf("_");
    if (us > 0) return base.substring(0, us);
    return base;
}

/** 归一流派键：环夜谷标准流派 / 环夜谷 → 环夜谷 */
function normalizeSchoolKey(school) {
    var s = String(school || "").trim();
    if (!s) return "";
    if (SCHOOL_SHULKER[s]) return s;
    for (var k in SCHOOL_SHULKER) {
        if (!SCHOOL_SHULKER.hasOwnProperty(k)) continue;
        if (s.indexOf(k) >= 0) return k;
    }
    return s;
}

function materialByName(name, fallback) {
    try {
        var m = Material.valueOf(String(name));
        if (m) return m;
    } catch (e) {}
    try { return Material.valueOf(fallback || "LIGHT_GRAY_SHULKER_BOX"); } catch (e2) {
        return Material.CHEST;
    }
}

function getSchoolShulkerMaterial(school) {
    var key = normalizeSchoolKey(school);
    var matName = key && SCHOOL_SHULKER[key] ? SCHOOL_SHULKER[key] : EMPTY_SPELL_SHULKER;
    return materialByName(matName, EMPTY_SPELL_SHULKER);
}

function getEmptySpellShulkerMaterial() {
    return materialByName(EMPTY_SPELL_SHULKER, "LIGHT_GRAY_SHULKER_BOX");
}

function getLockedSpellShulkerMaterial() {
    return materialByName(LOCKED_SPELL_SHULKER, "OBSIDIAN");
}

function getSchoolDisplayName(school) {
    var key = normalizeSchoolKey(school);
    if (key && SCHOOL_DISPLAY[key]) return SCHOOL_DISPLAY[key];
    return key || "未知流派";
}

function registerSpellDef(def, source) {
    if (!def || !def.id || def.cast == null) {
        Bukkit.getLogger().warning("[GLTC术式] 无效术式定义: " + source);
        return false;
    }
    var school = normalizeSchoolKey(def.school || schoolFromSource(source));
    SPELL_REGISTRY[def.id] = {
        name: def.name || def.id,
        ring: def.ring || 1,
        cost: def.cost || 0,
        cooldownMs: def.cooldownMs || 1000,
        school: school,
        cast: def.cast
    };
    if (def.onLeftClick != null) SPELL_REGISTRY[def.id].onLeftClick = def.onLeftClick;
    if (def.book) SPELL_BOOK_IDS[def.id] = true;
    return true;
}

function loadAllSpells() {
    for (var i = 0; i < SPELL_FILES.length; i++) {
        var path = SPELL_FILES[i];
        var def = evalScriptExport(path);
        if (def) registerSpellDef(def, path);
    }
    Bukkit.getLogger().info("[GLTC术式] 已加载 " + Object.keys(SPELL_REGISTRY).length + " 个术式");
}

loadAllSpells();

function getSpell(id) {
    return id ? (SPELL_REGISTRY[id] || null) : null;
}

function getSpellName(id) {
    var s = getSpell(id);
    return s ? s.name : (id ? String(id) : "空槽");
}

function getSpellSchool(id) {
    var s = getSpell(id);
    return s && s.school ? s.school : "";
}

function isSpellBook(itemId) {
    return !!(itemId && SPELL_BOOK_IDS[itemId]);
}

function getSpellIdFromBook(itemId) {
    return isSpellBook(itemId) ? itemId : null;
}

({
    SPELL_REGISTRY: SPELL_REGISTRY,
    SPELL_BOOK_IDS: SPELL_BOOK_IDS,
    SPELL_FILES: SPELL_FILES,
    SCHOOL_SHULKER: SCHOOL_SHULKER,
    SCHOOL_DISPLAY: SCHOOL_DISPLAY,
    getSpell: getSpell,
    getSpellName: getSpellName,
    getSpellSchool: getSpellSchool,
    getSchoolDisplayName: getSchoolDisplayName,
    getSchoolShulkerMaterial: getSchoolShulkerMaterial,
    getEmptySpellShulkerMaterial: getEmptySpellShulkerMaterial,
    getLockedSpellShulkerMaterial: getLockedSpellShulkerMaterial,
    normalizeSchoolKey: normalizeSchoolKey,
    isSpellBook: isSpellBook,
    getSpellIdFromBook: getSpellIdFromBook,
    registerSpellDef: registerSpellDef,
    loadAllSpells: loadAllSpells
});
