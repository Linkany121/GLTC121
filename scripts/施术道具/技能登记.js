// ===================================================================
// 施术道具技能登记 —— 扫描加载 核心技能_*.js
// 技能核心登记.js 的 skillId 对应各文件导出的 id
// 新建技能：复制 _模板_核心技能.js → 改名为 核心技能_<名>.js → 写顶部可配置
// ===================================================================

var Bukkit = Java.type("org.bukkit.Bukkit");
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var LOADER = null;
var SKILL_DEFS = {};
var SKILL_FILES = [];

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

/** 仅加载「核心技能_」前缀；排除 _ 开头模板与登记本身 */
function isCoreSkillScript(rel, fileName) {
    if (!fileName || !/\.js$/i.test(fileName)) return false;
    if (fileName.charAt(0) === "_") return false;
    if (fileName === "技能登记.js" || fileName === "技能核心登记.js") return false;
    return fileName.indexOf("核心技能_") === 0;
}

function discoverSkillFiles() {
    var loader = getLoader();
    if (loader && loader.listScriptFiles) {
        return loader.listScriptFiles("施术道具", isCoreSkillScript);
    }
    return ["施术道具/核心技能_辉墨摇篮.js"];
}

function evalScriptExport(rel) {
    var loader = getLoader();
    if (loader && loader.evalScriptExport) {
        // 核心技能互不污染：隔离加载
        return loader.evalScriptExport(rel, { isolated: true });
    }
    return null;
}

function registerSkillDef(def, source) {
    if (!def || !def.id) {
        Bukkit.getLogger().warning("[GLTC核心技能] 无效定义（缺 id）: " + source);
        return false;
    }
    var id = String(def.id);
    if (SKILL_DEFS[id]) {
        Bukkit.getLogger().warning("[GLTC核心技能] 重复 id " + id + "，后者覆盖: " + source);
    }
    SKILL_DEFS[id] = {
        name: def.name || id,
        skillHint: def.skillHint || ("§7技能：" + (def.name || id)),
        onSelectSpell: def.onSelectSpell || null,
        onSneakUse: def.onSneakUse || null,
        onAfterCast: def.onAfterCast || null
    };
    return true;
}

function loadAllSkills() {
    SKILL_DEFS = {};
    SKILL_FILES = discoverSkillFiles();
    for (var i = 0; i < SKILL_FILES.length; i++) {
        var path = SKILL_FILES[i];
        var def = evalScriptExport(path);
        if (def) registerSkillDef(def, path);
        else Bukkit.getLogger().warning("[GLTC核心技能] 加载失败: " + path);
    }
    try {
        if (!PLUGIN.gltcCoreSkillLoadLogged) {
            PLUGIN.gltcCoreSkillLoadLogged = true;
            Bukkit.getLogger().info("[GLTC核心技能] 已加载 " + Object.keys(SKILL_DEFS).length + " 个技能");
        }
    } catch (eLog) {
        Bukkit.getLogger().info("[GLTC核心技能] 已加载 " + Object.keys(SKILL_DEFS).length + " 个技能");
    }
}

function asConsumer(fn) {
    if (fn == null) return null;
    return new (Java.extend(java.util.function.Consumer, {
        accept: function(p) {
            try { fn(p); } catch (e) {}
        }
    }))();
}

function getSkillDef(skillId) {
    return skillId ? (SKILL_DEFS[String(skillId)] || null) : null;
}

function getHooksForSkillId(skillId) {
    var def = getSkillDef(skillId);
    if (!def) return null;
    return {
        onSelectSpell: def.onSelectSpell ? asConsumer(def.onSelectSpell) : null,
        onSneakUse: def.onSneakUse ? asConsumer(def.onSneakUse) : null,
        onAfterCast: def.onAfterCast ? asConsumer(def.onAfterCast) : null,
        skillHint: def.skillHint || ("§7技能：" + (def.name || skillId))
    };
}

function getHooksForCore(coreId, coreCfg) {
    if (!coreId || !coreCfg || typeof coreCfg.getCoreEntry !== "function") return null;
    var core = coreCfg.getCoreEntry(coreId);
    if (!core) return null;
    if (!core.skillId) {
        return {
            skillHint: "§7术式槽 §f" + (core.spellSlots || 0) + " §7· 无附加技能"
        };
    }
    return getHooksForSkillId(core.skillId);
}

loadAllSkills();

({
    SKILL_DEFS: SKILL_DEFS,
    SKILL_FILES: SKILL_FILES,
    loadAllSkills: loadAllSkills,
    getSkillDef: getSkillDef,
    getHooksForSkillId: getHooksForSkillId,
    getHooksForCore: getHooksForCore,
    registerSkillDef: registerSkillDef
});
