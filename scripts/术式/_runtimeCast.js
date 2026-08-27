/**
 * 隔离术式脚本通用：跨 Graal 上下文调用术式运行时里的施展函数。
 * 用法：loader.evalScriptExport("术式/_runtimeCast.js", { isolated: true, cache: true })
 *       api.invokeRuntimeCast("castHuaRuHuaJuan", player, dmg, spellInfo)
 * 新术式只需在 术式运行时/核心.js 实现对应方法并 export，术式文件写 runtimeCast 名即可，勿改施术核心。
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

function getPlugin() {
    try {
        var p = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        if (p != null) return p;
    } catch (e0) {}
    return null;
}

function getScriptLoader(p) {
    try {
        if (p != null && p.gltcScriptLoader != null) return p.gltcScriptLoader;
    } catch (e0) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcScriptLoader != null) return RSC.INSTANCE.gltcScriptLoader;
    } catch (e1) {}
    return null;
}

function getSharedRootApi(p) {
    var loader = getScriptLoader(p);
    try {
        if (loader && loader.evalScriptExport) {
            var sr = loader.evalScriptExport("_gltcSharedRoot.js", { isolated: true, cache: true });
            if (sr != null) return sr;
        }
    } catch (e0) {}
    try {
        var cache = p != null ? p.gltcEvalCache : null;
        if (cache != null) return cache.get("_gltcSharedRoot.js");
    } catch (e1) {}
    return null;
}

function bridgeGet(key) {
    var k = String(key);
    var p = getPlugin();
    var sr = getSharedRootApi(p);
    try {
        if (sr != null && sr.getJavaBridge != null) {
            var fromSr = sr.getJavaBridge(k);
            if (fromSr != null) return fromSr;
        }
    } catch (eSr) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcJavaBridges != null) {
            var v2 = RSC.INSTANCE.gltcJavaBridges.get(k);
            if (v2 != null) return v2;
        }
    } catch (e2) {}
    try {
        if (p != null && p.gltcJavaBridges != null) return p.gltcJavaBridges.get(k);
    } catch (e3) {}
    try {
        if (sr != null && sr.getGltcSharedRoot != null) {
            var root = sr.getGltcSharedRoot();
            if (root != null) {
                var fromRoot = root.get(k);
                if (fromRoot != null) return fromRoot;
            }
        }
    } catch (eRoot) {}
    return null;
}

function invokeRuntimeCast(methodName, player, dmg, spellInfo) {
    var method = String(methodName || "");
    if (!method || !player) return false;
    var br = bridgeGet("gltcRuntime_invokeCast");
    if (br == null) {
        try { Bukkit.getLogger().warning("[GLTC术式] 运行时桥 gltcRuntime_invokeCast 不可用（" + method + "）"); } catch (eLog) {}
        return false;
    }
    try {
        var list = new java.util.ArrayList();
        list.add(method);
        list.add(player);
        list.add(java.lang.Double.valueOf(Number(dmg)));
        list.add(spellInfo);
        var ok = br.apply(list);
        return ok === true || ok === java.lang.Boolean.TRUE;
    } catch (eBr) {
        try { Bukkit.getLogger().warning("[GLTC术式] invokeCast " + method + " 异常: " + eBr); } catch (eLog) {}
        return false;
    }
}

function calcSpellDamage(player, mageApi, coeff, plugin) {
    var c = Number(coeff);
    if (!(c > 0) || !isFinite(c)) c = 1;
    try {
        if (mageApi != null && mageApi.calcSpellDamage != null) {
            var v = Number(mageApi.calcSpellDamage(player, c));
            if (v > 0 && isFinite(v)) return v;
        }
    } catch (eApi) {}
    try {
        var plug = plugin || getPlugin();
        if (plug == null) return c;
        var uuid = String(player.getUniqueId().toString());
        var f = new File(plug.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士数值/" + uuid + ".json");
        if (f.exists()) {
            var data = JSON.parse(StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString());
            var total = Number(data.particlePowerTotal);
            var pp = (isFinite(total) && total > 0) ? total : Number(data.particlePower);
            if (pp > 0 && isFinite(pp)) return pp * c;
        }
    } catch (eDisk) {}
    return c;
}

return {
    bridgeGet: bridgeGet,
    invokeRuntimeCast: invokeRuntimeCast,
    calcSpellDamage: calcSpellDamage
};
