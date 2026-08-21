/**
 * 术式登记加载器
 * - 每个术式单独一个 JS（见下方 SPELL_FILES）
 * - 术式脚本需导出：{ id, name, ring, cost, cooldownMs, book?, cast }
 * - book:true 的 ID 可作为术式刻录载体（附魔书物品 ID = 术式 ID）
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

/** 在此追加新术式文件名（相对 scripts/，不含路径前缀重复） */
var SPELL_FILES = [
    "术式/火球术.js",
    "术式/送花.js",
    "术式/微风花流.js",
    "术式/庇护脉络.js",
    "术式/花如画卷.js"
];

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
        return null;
    }
}

function registerSpellDef(def, source) {
    if (!def || !def.id || typeof def.cast !== "function") {
        Bukkit.getLogger().warning("[GLTC术式] 无效术式定义: " + source);
        return false;
    }
    SPELL_REGISTRY[def.id] = {
        name: def.name || def.id,
        ring: def.ring || 1,
        cost: def.cost || 0,
        cooldownMs: def.cooldownMs || 1000,
        cast: def.cast
    };
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
    getSpell: getSpell,
    getSpellName: getSpellName,
    isSpellBook: isSpellBook,
    getSpellIdFromBook: getSpellIdFromBook,
    registerSpellDef: registerSpellDef,
    loadAllSpells: loadAllSpells
});
