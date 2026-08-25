/**
 * GLTC 跨 Graal 上下文共享根（java.util.concurrent.ConcurrentHashMap）
 * 物品脚本里 PLUGIN 常被包成 RykenSlimefunCustomizer 本体，hasMetadata/setMetadata 直接调会失败；
 * 必须走反射调用 JavaPlugin 的 Metadata API，否则每次 getGltcSharedRoot 都会 new 空 Map。
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var META_KEY = "gltc_shared_root_maps";
var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");
var JString = Java.type("java.lang.String");

function getPlugin() {
    return Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
}

function looksLikeMap(v) {
    if (v == null) return false;
    try {
        if (v instanceof CHM) return true;
    } catch (e0) {}
    try {
        if (typeof v.get === "function" && typeof v.put === "function") return true;
    } catch (e1) {}
    try {
        if (v.get != null && v.put != null) return true;
    } catch (e2) {}
    return false;
}

/** Graal 下 plugin.hasMetadata / getMetadata / setMetadata 可能 Unknown identifier */
function pluginHasMetadata(plugin, key) {
    if (plugin == null || key == null) return false;
    try {
        if (plugin.hasMetadata != null && plugin.hasMetadata(String(key))) return true;
    } catch (e0) {}
    try {
        var out = plugin.getClass().getMethod("hasMetadata", JString).invoke(plugin, String(key));
        return out === true || out === java.lang.Boolean.TRUE;
    } catch (e1) {}
    return false;
}

function pluginGetMetadataValue(plugin, key) {
    if (plugin == null || key == null) return null;
    var k = String(key);
    try {
        if (plugin.getMetadata != null) {
            var list = plugin.getMetadata(k);
            if (list != null && list.size() > 0) return list.get(0).value();
        }
    } catch (e0) {}
    try {
        var list2 = plugin.getClass().getMethod("getMetadata", JString).invoke(plugin, k);
        if (list2 != null && list2.size() > 0) return list2.get(0).value();
    } catch (e1) {}
    return null;
}

function pluginSetMetadata(plugin, key, value) {
    if (plugin == null || key == null || value == null) return false;
    var k = String(key);
    var metaVal = new FixedMetadataValue(plugin, value);
    try {
        if (plugin.setMetadata != null) {
            plugin.setMetadata(k, metaVal);
            return true;
        }
    } catch (e0) {}
    try {
        var FmvCls = FixedMetadataValue.class;
        plugin.getClass().getMethod("setMetadata", JString, Java.type("org.bukkit.metadata.MetadataValue"))
            .invoke(plugin, k, metaVal);
        return true;
    } catch (e1) {}
    return false;
}

function getGltcSharedRoot() {
    var plugin = getPlugin();
    if (plugin == null) return null;
    var existing = pluginGetMetadataValue(plugin, META_KEY);
    if (existing != null) return existing;
    try {
        var inst = getRscInstance();
        if (inst != null && inst.gltcSharedMaps != null) return inst.gltcSharedMaps;
    } catch (eInst) {}
    var map = new CHM();
    pluginSetMetadata(plugin, META_KEY, map);
    var raced = pluginGetMetadataValue(plugin, META_KEY);
    return raced != null ? raced : map;
}

function publishGltcSharedRoot(map) {
    if (map == null) return getGltcSharedRoot();
    if (!looksLikeMap(map)) {
        try {
            if (map.get == null && map.put == null) return getGltcSharedRoot();
        } catch (eBad) {
            return getGltcSharedRoot();
        }
    }
    var plugin = getPlugin();
    if (plugin == null) return map;
    pluginSetMetadata(plugin, META_KEY, map);
    try { plugin.gltcSharedMaps = map; } catch (ePl) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null) RSC.INSTANCE.gltcSharedMaps = map;
    } catch (eInst) {}
    return map;
}

function getRscInstance() {
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        return RSC.INSTANCE;
    } catch (e) { return null; }
}

function getBridgeMapLegacy() {
    var inst = getRscInstance();
    var map = null;
    try {
        if (inst != null) map = inst.gltcJavaBridges;
    } catch (e0) {}
    var plugin = getPlugin();
    var root = getGltcSharedRoot();
    if (map == null && root != null) {
        try {
            var nested = root.get("gltcJavaBridges");
            if (nested != null) map = nested;
        } catch (e1) {}
    }
    if (map == null && inst != null) {
        try { map = inst.gltcJavaBridges; } catch (e2) {}
    }
    if (map == null && plugin != null) {
        try { map = plugin.gltcJavaBridges; } catch (e3) {}
    }
    if (map == null) {
        map = new CHM();
    }
    try {
        if (plugin != null) plugin.gltcJavaBridges = map;
    } catch (e4) {}
    try {
        if (inst != null) inst.gltcJavaBridges = map;
    } catch (e5) {}
    if (root != null) {
        try { root.put("gltcJavaBridges", map); } catch (e6) {}
    }
    return map;
}

function putJavaBridge(key, bridge) {
    if (key == null || bridge == null) return false;
    var k = String(key);
    var ok = false;
    var inst = getRscInstance();
    try {
        if (inst != null) {
            if (k === "gltcHandleStaffUse") inst.gltcHandleStaffUseConsumer = bridge;
            if (k === "gltcEnsureSpellListeners") inst.gltcEnsureSpellCoreListeners = bridge;
        }
    } catch (eNamed) {}
    var root = getGltcSharedRoot();
    if (root != null) {
        try { root.put(k, bridge); ok = true; } catch (e0) {}
    }
    try {
        var leg = getBridgeMapLegacy();
        if (leg != null) {
            leg.put(k, bridge);
            ok = true;
        }
    } catch (e1) {}
    return ok;
}

function getJavaBridge(key) {
    if (key == null) return null;
    var k = String(key);
    var inst = getRscInstance();
    try {
        if (inst != null && inst.gltcJavaBridges != null) {
            var fromInst = inst.gltcJavaBridges.get(k);
            if (fromInst != null) return fromInst;
        }
    } catch (eInst) {}
    try {
        if (inst != null && k === "gltcHandleStaffUse" && inst.gltcHandleStaffUseConsumer != null) {
            return inst.gltcHandleStaffUseConsumer;
        }
        if (inst != null && k === "gltcEnsureSpellListeners" && inst.gltcEnsureSpellCoreListeners != null) {
            return inst.gltcEnsureSpellCoreListeners;
        }
    } catch (eNamed) {}
    var root = getGltcSharedRoot();
    if (root != null) {
        try {
            var v = root.get(k);
            if (v != null) return v;
        } catch (e0) {}
    }
    try {
        var leg = getBridgeMapLegacy();
        if (leg != null) return leg.get(k);
    } catch (e1) {}
    return null;
}

({
    META_KEY: META_KEY,
    getGltcSharedRoot: getGltcSharedRoot,
    publishGltcSharedRoot: publishGltcSharedRoot,
    putJavaBridge: putJavaBridge,
    getJavaBridge: getJavaBridge,
    getBridgeMapLegacy: getBridgeMapLegacy,
    pluginGetMetadataValue: pluginGetMetadataValue,
    pluginSetMetadata: pluginSetMetadata,
    pluginHasMetadata: pluginHasMetadata
});
