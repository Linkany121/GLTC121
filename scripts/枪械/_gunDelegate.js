// ===================================================================
// 枪械委托 — 加载各枪械脚本并代其执行 onUse
// 枪械模块须在 监听.js 启动时 bootstrap，物品脚本上下文内 eval 不可靠
// ===================================================================

var Bukkit = Java.type("org.bukkit.Bukkit");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var moduleCache = new java.util.concurrent.ConcurrentHashMap();

function getLoader() {
    try {
        if (PLUGIN != null && PLUGIN.gltcScriptLoader != null) return PLUGIN.gltcScriptLoader;
    } catch (e0) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcScriptLoader != null) return RSC.INSTANCE.gltcScriptLoader;
    } catch (e1) {}
    return null;
}

function getBootModuleCache() {
    try {
        if (PLUGIN != null && PLUGIN.gltcGunModuleCache != null) return PLUGIN.gltcGunModuleCache;
    } catch (e0) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcGunModuleCache != null) return RSC.INSTANCE.gltcGunModuleCache;
    } catch (e1) {}
    return null;
}

function findGunScriptFile(scriptRel) {
    scriptRel = String(scriptRel || "").replace(/\\/g, "/").trim();
    if (!/\.js$/i.test(scriptRel)) scriptRel = scriptRel + ".js";
    var loader = getLoader();
    if (loader && loader.findScriptFile) {
        var fromLoader = loader.findScriptFile(scriptRel);
        if (fromLoader != null) return fromLoader;
    }
    if (PLUGIN == null) return null;
    var roots = ["GLTC_联合协议", "GLTC121"];
    var base = PLUGIN.getDataFolder().getAbsolutePath() + "/addons/";
    for (var i = 0; i < roots.length; i++) {
        var f = new File(base + roots[i] + "/scripts/" + scriptRel);
        if (f.exists()) return f;
    }
    return null;
}

function readGunScriptBody(scriptRel) {
    var file = findGunScriptFile(scriptRel);
    if (!file) return null;
    try {
        return StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
    } catch (e) { return null; }
}

function buildGunModuleWrapper(body) {
    body = String(body || "").replace(/\s+$/, "").replace(/\bonLoad\s*\(\s*\)\s*;\s*$/, "");
    return "(function(){\n" +
        "var getAddonConfig = (typeof getAddonConfig === 'function' ? getAddonConfig : function() {\n" +
        "  return { getInt: function(k, d) { return d; }, getString: function(k, d) { return d; } };\n" +
        "});\n" +
        body + "\n" +
        "return {\n" +
        "  onUse: (typeof onUse === 'function' ? onUse : null),\n" +
        "  clearGunState: (typeof clearGunState === 'function' ? clearGunState : null),\n" +
        "  GUN_ID: (typeof GUN_ID !== 'undefined' ? GUN_ID : null)\n" +
        "};\n" +
        "})();";
}

function loadGunModuleFromSource(scriptRel) {
    scriptRel = String(scriptRel || "").replace(/\\/g, "/");
    if (!scriptRel) return null;
    var hit = moduleCache.get(scriptRel);
    if (hit != null) return hit;
    var body = readGunScriptBody(scriptRel);
    if (!body) return null;
    var wrapped = buildGunModuleWrapper(body);
    try {
        var mod = (0, eval)(wrapped);
        if (mod != null) moduleCache.put(scriptRel, mod);
        return mod;
    } catch (e) {
        try { Bukkit.getLogger().warning("[GLTC枪械] 委托加载失败 " + scriptRel + ": " + e); } catch (e2) {}
        return null;
    }
}

function loadGunModule(scriptRel) {
    scriptRel = String(scriptRel || "").replace(/\\/g, "/");
    if (!scriptRel) return null;
    var boot = getBootModuleCache();
    if (boot != null) {
        var fromBoot = boot.get(scriptRel);
        if (fromBoot != null) return fromBoot;
    }
    return loadGunModuleFromSource(scriptRel);
}

function bootstrapGunModules(gunCfg) {
    var cache = new java.util.concurrent.ConcurrentHashMap();
    if (!gunCfg || typeof gunCfg.listGuns !== "function") return 0;
    var guns = gunCfg.listGuns();
    var count = 0;
    for (var i = 0; i < guns.length; i++) {
        var rel = String(guns[i].script || "");
        if (!rel) continue;
        var mod = loadGunModuleFromSource(rel);
        if (mod != null && typeof mod.onUse === "function") {
            cache.put(rel, mod);
            count++;
        } else {
            try { Bukkit.getLogger().warning("[GLTC枪械] 预加载失败: " + rel); } catch (eWarn) {}
        }
    }
    try { PLUGIN.gltcGunModuleCache = cache; } catch (ePut) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null) RSC.INSTANCE.gltcGunModuleCache = cache;
    } catch (eInst) {}
    return count;
}

function clearGunModuleCache() {
    try { moduleCache.clear(); } catch (e) {}
    try { PLUGIN.gltcGunModuleCache = null; } catch (e2) {}
}

function delegateFire(player, event, gunId, scriptRel) {
    if (!player || !event || !gunId || !scriptRel) return false;
    scriptRel = String(scriptRel || "").replace(/\\/g, "/").trim();
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        var inst = RSC.INSTANCE;
        if (inst != null && inst.gltcGunModuleApi != null && typeof inst.gltcGunModuleApi.getModule === "function") {
            var modFromApi = inst.gltcGunModuleApi.getModule(scriptRel);
            if (modFromApi != null && typeof modFromApi.onUse === "function") {
                modFromApi.onUse(event);
                return true;
            }
        }
    } catch (eApi) {}
    var mod = loadGunModule(scriptRel);
    if (!mod || typeof mod.onUse !== "function") {
        try { Bukkit.getLogger().warning("[GLTC枪械] 委托射击无模块: " + gunId + " / " + scriptRel); } catch (eMod) {}
        return false;
    }
    try {
        mod.onUse(event);
    } catch (eFire) {
        try { Bukkit.getLogger().warning("[GLTC枪械] 委托射击异常 " + gunId + ": " + eFire); } catch (eLog) {}
        return false;
    }
    return true;
}

function clearDelegatedGunState(player, gunId, gunCfg) {
    if (!player || !gunId || !gunCfg) return;
    var scriptRel = typeof gunCfg.getGunScript === "function" ? gunCfg.getGunScript(gunId) : null;
    if (!scriptRel) return;
    var mod = loadGunModule(scriptRel);
    if (mod && typeof mod.clearGunState === "function") {
        try { mod.clearGunState(player); } catch (e) {}
    }
}

return {
    loadGunModule: loadGunModule,
    loadGunModuleFromSource: loadGunModuleFromSource,
    bootstrapGunModules: bootstrapGunModules,
    delegateFire: delegateFire,
    clearDelegatedGunState: clearDelegatedGunState,
    clearGunModuleCache: clearGunModuleCache
};
