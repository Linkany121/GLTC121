// ===================================================================
// 术式：花如画卷 —— 4环 · 沃土奥法（环绕蓄力 + 左键齐射）
// ID：VASA_花如画卷
// 逻辑在 术式运行时/核心.js（castHuaRuHuaJuan）；经 gltcRuntime_invokeCast 桥施展
// ===================================================================

var Bukkit = Java.type("org.bukkit.Bukkit");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

var SPELL_ID          = "VASA_花如画卷";
var SPELL_NAME        = "花如画卷";
var SPELL_RING        = 4;
var SPELL_SCHOOL      = "沃土";
var SPELL_BOOK        = true;
var SPELL_COOLDOWN_MS = 12000;
var SPELL_COEFFICIENT = 1.5;
var RUNTIME_CAST_FN   = "castHuaRuHuaJuan";

var _runtimeCastApiCache = null;

function getRsc() {
    try {
        return Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
    } catch (e) { return null; }
}

function getScriptLoader() {
    try {
        if (PLUGIN != null && PLUGIN.gltcScriptLoader != null) return PLUGIN.gltcScriptLoader;
    } catch (e0) {}
    var inst = getRsc();
    try {
        if (inst != null && inst.gltcScriptLoader != null) return inst.gltcScriptLoader;
    } catch (e1) {}
    return null;
}

function loadRuntimeCastFromFile() {
    try {
        var roots = ["GLTC_联合协议", "GLTC121"];
        var rel = "术式/_runtimeCast.js";
        for (var i = 0; i < roots.length; i++) {
            var f = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/" + roots[i] + "/scripts/" + rel);
            if (!f.exists()) continue;
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString();
            var body = String(code).replace(/\s+$/, "");
            if (!/\breturn\s+/.test(body.slice(-120))) {
                if (/\(\s*\{[\s\S]*\}\s*\)\s*;?\s*$/.test(body)) {
                    body = body.replace(/\(\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/, "return ({\n$1\n});");
                }
            }
            return (0, eval)("(function(){\n" + body + "\n})();");
        }
    } catch (eFile) {}
    return null;
}

function getRuntimeCastApi() {
    if (_runtimeCastApiCache != null) return _runtimeCastApiCache;
    try {
        if (PLUGIN != null && PLUGIN.gltcRuntimeCastApi != null) {
            _runtimeCastApiCache = PLUGIN.gltcRuntimeCastApi;
            return _runtimeCastApiCache;
        }
    } catch (ePl) {}
    var inst = getRsc();
    try {
        if (inst != null && inst.gltcRuntimeCastApi != null) {
            _runtimeCastApiCache = inst.gltcRuntimeCastApi;
            return _runtimeCastApiCache;
        }
    } catch (eInst) {}
    try {
        var cache = PLUGIN != null ? PLUGIN.gltcEvalCache : null;
        if (cache != null) {
            var hit = cache.get("术式/_runtimeCast.js");
            if (hit != null) {
                _runtimeCastApiCache = hit;
                return _runtimeCastApiCache;
            }
        }
    } catch (eCache) {}
    var loader = getScriptLoader();
    if (loader && loader.evalScriptExport) {
        try {
            var fromLoader = loader.evalScriptExport("术式/_runtimeCast.js", { isolated: true, cache: true });
            if (fromLoader != null) {
                _runtimeCastApiCache = fromLoader;
                return _runtimeCastApiCache;
            }
        } catch (eL) {}
    }
    var fromFile = loadRuntimeCastFromFile();
    if (fromFile != null) {
        _runtimeCastApiCache = fromFile;
        try {
            var c = PLUGIN != null ? PLUGIN.gltcEvalCache : null;
            if (c != null) c.put("术式/_runtimeCast.js", fromFile);
        } catch (ePut) {}
    }
    return _runtimeCastApiCache;
}

function calcSpellDamageFallback(player, mageApi) {
    try {
        if (mageApi != null && mageApi.calcSpellDamage != null) {
            var v = Number(mageApi.calcSpellDamage(player, SPELL_COEFFICIENT));
            if (v > 0 && isFinite(v)) return v;
        }
    } catch (eApi) {}
    try {
        var uuid = String(player.getUniqueId().toString());
        var f = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士数值/" + uuid + ".json");
        if (f.exists()) {
            var data = JSON.parse(StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString());
            var total = Number(data.particlePowerTotal);
            var pp = (isFinite(total) && total > 0) ? total : Number(data.particlePower);
            if (pp > 0 && isFinite(pp)) return pp * SPELL_COEFFICIENT;
        }
    } catch (eDisk) {}
    return SPELL_COEFFICIENT;
}

function invokeCastFallback(method, player, dmg, spellInfo) {
    var api = getRuntimeCastApi();
    if (api != null && api.invokeRuntimeCast != null) {
        return api.invokeRuntimeCast(method, player, dmg, spellInfo);
    }
  var br = null;
    try {
        var loader = getScriptLoader();
        if (loader && loader.evalScriptExport) {
            var sr = loader.evalScriptExport("_gltcSharedRoot.js", { isolated: true, cache: true });
            if (sr != null && sr.getJavaBridge != null) br = sr.getJavaBridge("gltcRuntime_invokeCast");
        }
    } catch (eSr) {}
    if (br == null) return false;
    try {
        var list = new java.util.ArrayList();
        list.add(String(method));
        list.add(player);
        list.add(java.lang.Double.valueOf(Number(dmg)));
        list.add(spellInfo);
        var ok = br.apply(list);
        return ok === true || ok === java.lang.Boolean.TRUE;
    } catch (eBr) {
        return false;
    }
}

function castHuaRuHuaJuan(player, mageApi) {
    var api = getRuntimeCastApi();
    var dmg;
    if (api != null && api.calcSpellDamage != null) {
        dmg = api.calcSpellDamage(player, mageApi, SPELL_COEFFICIENT, PLUGIN);
    } else {
        dmg = calcSpellDamageFallback(player, mageApi);
    }
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME, spellId: SPELL_ID };
    if (!invokeCastFallback(RUNTIME_CAST_FN, player, dmg, spellInfo)) {
        try { Bukkit.getLogger().warning("[GLTC术式] 花如画卷施展失败（invokeCast 桥不可用，请重载 GLTC 监听）"); } catch (eLog) {}
        return false;
    }
    return true;
}

({
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: SPELL_BOOK,
    school: SPELL_SCHOOL,
    cast: castHuaRuHuaJuan
});
