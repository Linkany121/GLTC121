/**
 * 术式登记 v2
 * 自动扫描 scripts/术式/*.js（排除 _ 开头与 登记.js）
 * 每个术式导出 { id, name, ring, cooldownMs, book?, school?, cast }
 * book:true = 存在同 ID 的术式载体物品（items.yml 流派色潜影盒）
 *
 * 可配置：下方 SCHOOL_* 决定 GUI 潜影盒材质与流派显示名
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var LOADER = null;

function getLoader() {
    if (LOADER != null) return LOADER;
    try {
        if (PLUGIN.gltcScriptLoader != null) {
            LOADER = PLUGIN.gltcScriptLoader;
            return LOADER;
        }
    } catch (e0) {}
    try {
        var File = java.io.File;
        var Files = java.nio.file.Files;
        var StandardCharsets = java.nio.charset.StandardCharsets;
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var f = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/_gltcScriptLoader.js");
        if (!f.exists()) {
            f = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/_gltcScriptLoader.js");
        }
        if (f.exists()) {
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString();
            LOADER = (0, eval)(code);
            try { PLUGIN.gltcScriptLoader = LOADER; } catch (e1) {}
            return LOADER;
        }
    } catch (e2) {}
    return null;
}

function isSpellScriptPath(rel, fileName) {
    if (!fileName || fileName === "登记.js") return false;
    if (fileName.charAt(0) === "_") return false;
    return /\.js$/i.test(fileName);
}

function discoverSpellFiles() {
    var loader = getLoader();
    if (loader && loader.listScriptFiles) {
        return loader.listScriptFiles("术式", isSpellScriptPath);
    }
    return ["术式/环夜谷_1_火球术.js"];
}

var SPELL_FILES = discoverSpellFiles();

// === 流派 → GUI 潜影盒材质（可增改）===
var SCHOOL_SHULKER = {
    "环夜谷": "BLUE_SHULKER_BOX",
    "沃土": "LIME_SHULKER_BOX",
    "赤焰": "RED_SHULKER_BOX",
    "金律": "YELLOW_SHULKER_BOX",
    "绯梦": "PINK_SHULKER_BOX"
};

// === 流派 → 玩家可见显示名（刻录仪 lore 等）===
var SCHOOL_DISPLAY = {
    "环夜谷": "环夜谷标准流派",
    "沃土": "沃土奥法流派",
    "赤焰": "赤焰流派",
    "金律": "金律流派",
    "绯梦": "绯梦流派"
};

// === 空槽 / 未解锁回退材质 ===
var EMPTY_SPELL_SHULKER  = "LIGHT_GRAY_SHULKER_BOX";
var LOCKED_SPELL_SHULKER = "OBSIDIAN";

var SPELL_REGISTRY = {};
var SPELL_BOOK_IDS = {};

function evalScriptExport(relativeUnderScripts) {
    var loader = getLoader();
    if (loader && loader.evalScriptExport) {
        // 隔离加载，避免多术式全局 var 互相覆盖
        return loader.evalScriptExport(relativeUnderScripts, { isolated: true });
    }
    return null;
}

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
    var matName = key && SCHOOL_SHULKER[key] ? SCHOOL_SHULKER[key] : "LIGHT_GRAY_SHULKER_BOX";
    return materialByName(matName, "LIGHT_GRAY_SHULKER_BOX");
}

function getEmptySpellShulkerMaterial() {
    return materialByName(EMPTY_SPELL_SHULKER, EMPTY_SPELL_SHULKER);
}

function getLockedSpellShulkerMaterial() {
    return materialByName(LOCKED_SPELL_SHULKER, LOCKED_SPELL_SHULKER);
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
    var id = String(def.id);
    if (SPELL_REGISTRY[id]) {
        Bukkit.getLogger().warning("[GLTC术式] 重复 ID " + id + "，后者覆盖: " + source);
    }
    var school = normalizeSchoolKey(def.school || schoolFromSource(source));
    SPELL_REGISTRY[id] = {
        name: def.name || id,
        ring: def.ring || 1,
        cooldownMs: def.cooldownMs || 1000,
        school: school,
        cast: def.cast
    };
    if (def.book) SPELL_BOOK_IDS[id] = true;
    return true;
}

function loadAllSpells() {
    SPELL_REGISTRY = {};
    SPELL_BOOK_IDS = {};
    SPELL_FILES = discoverSpellFiles();
    for (var i = 0; i < SPELL_FILES.length; i++) {
        var path = SPELL_FILES[i];
        var def = evalScriptExport(path);
        if (def) registerSpellDef(def, path);
    }
    try {
        if (!PLUGIN.gltcSpellLoadLogged) {
            PLUGIN.gltcSpellLoadLogged = true;
            Bukkit.getLogger().info("[GLTC术式] v2 已加载 " + Object.keys(SPELL_REGISTRY).length + " 个术式");
        }
    } catch (eLog) {
        Bukkit.getLogger().info("[GLTC术式] v2 已加载 " + Object.keys(SPELL_REGISTRY).length + " 个术式");
    }
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
    loadAllSpells: loadAllSpells,
    discoverSpellFiles: discoverSpellFiles
});
