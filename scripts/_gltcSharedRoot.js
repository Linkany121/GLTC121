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

/** 权威 Java 桥 Map：优先 Metadata（跨 Graal 上下文），再 INSTANCE 动态字段 */
function readBridgeMapFromMetadata() {
    var plug = getPlugin();
    var map = pluginGetMetadataValue(plug, "gltc_java_bridges");
    if (map != null) return map;
    var root = pluginGetMetadataValue(plug, META_KEY);
    if (root != null) {
        try {
            var nested = root.get("gltcJavaBridges");
            if (nested != null) return nested;
        } catch (e0) {}
    }
    return null;
}

function publishBridgeMapToMetadata(map) {
    if (map == null) return;
    var plug = getPlugin();
    pluginSetMetadata(plug, "gltc_java_bridges", map);
    try {
        var root = getGltcSharedRoot();
        if (root != null) root.put("gltcJavaBridges", map);
    } catch (e0) {}
    try {
        var inst = getRscInstance();
        if (inst != null) inst.gltcJavaBridges = map;
    } catch (e1) {}
    try { if (plug != null) plug.gltcJavaBridges = map; } catch (e2) {}
}

function getBridgeMapLegacy() {
    var map = readBridgeMapFromMetadata();
    if (map != null) return map;
    var inst = getRscInstance();
    try {
        if (inst != null && inst.gltcJavaBridges != null) map = inst.gltcJavaBridges;
    } catch (e0) {}
    if (map == null) {
        try {
            var plug = getPlugin();
            if (plug != null && plug.gltcJavaBridges != null) map = plug.gltcJavaBridges;
        } catch (e3) {}
    }
    if (map == null) map = new CHM();
    publishBridgeMapToMetadata(map);
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
            publishBridgeMapToMetadata(leg);
        }
    } catch (e1) {}
    return ok;
}

function getJavaBridge(key) {
    if (key == null) return null;
    var k = String(key);
    // 1) Metadata 权威桥 Map（物品脚本跨上下文最稳）
    try {
        var metaMap = readBridgeMapFromMetadata();
        if (metaMap != null) {
            var fromMeta = metaMap.get(k);
            if (fromMeta != null) return fromMeta;
        }
    } catch (eMeta) {}
    // 2) 共享根直挂
    var root = getGltcSharedRoot();
    if (root != null) {
        try {
            var v = root.get(k);
            if (v != null) return v;
        } catch (e0) {}
    }
    // 3) 施术 / 枪械 Consumer 专用 Metadata
    if (k === "gltcHandleStaffUse") {
        var staffMeta = pluginGetMetadataValue(getPlugin(), "gltc_handle_staff_use");
        if (staffMeta != null) return staffMeta;
    }
    if (k === "gltcIntegrationGunFire") {
        var gunFireMeta = pluginGetMetadataValue(getPlugin(), "gltc_integration_gun_fire");
        if (gunFireMeta != null) return gunFireMeta;
        try {
            var fireRef = pluginGetMetadataValue(getPlugin(), "gltc_integration_gun_fire_ref");
            if (fireRef != null && fireRef.get != null) {
                var fromRef = fireRef.get();
                if (fromRef != null) return fromRef;
            }
        } catch (eGunRef) {}
    }
    if (k === "gltcIntegrationGunClear") {
        var gunClearMeta = pluginGetMetadataValue(getPlugin(), "gltc_integration_gun_clear");
        if (gunClearMeta != null) return gunClearMeta;
        try {
            var clearRef = pluginGetMetadataValue(getPlugin(), "gltc_integration_gun_clear_ref");
            if (clearRef != null && clearRef.get != null) {
                var fromClear = clearRef.get();
                if (fromClear != null) return fromClear;
            }
        } catch (eClrRef) {}
    }
    var inst = getRscInstance();
    try {
        if (inst != null && k === "gltcHandleStaffUse" && inst.gltcHandleStaffUseConsumer != null) {
            return inst.gltcHandleStaffUseConsumer;
        }
        if (inst != null && k === "gltcEnsureSpellListeners" && inst.gltcEnsureSpellCoreListeners != null) {
            return inst.gltcEnsureSpellCoreListeners;
        }
        if (inst != null && inst.gltcJavaBridges != null) {
            var fromInst = inst.gltcJavaBridges.get(k);
            if (fromInst != null) return fromInst;
        }
    } catch (eInst) {}
    try {
        var leg = getBridgeMapLegacy();
        if (leg != null) return leg.get(k);
    } catch (e1) {}
    return null;
}

/** 物品 script 统一入口：施术右键 Consumer */
function resolveStaffUseConsumer() {
    var c = getJavaBridge("gltcHandleStaffUse");
    if (c != null) return c;
    return pluginGetMetadataValue(getPlugin(), "gltc_handle_staff_use");
}

/** 物品 script 统一入口：枪械集成枪射击 Consumer */
function resolveIntegrationGunFireConsumer() {
    return getJavaBridge("gltcIntegrationGunFire");
}

/** 物品 script 统一入口：枪械集成枪清状态 Consumer */
function resolveIntegrationGunClearConsumer() {
    return getJavaBridge("gltcIntegrationGunClear");
}

({
    META_KEY: META_KEY,
    getGltcSharedRoot: getGltcSharedRoot,
    publishGltcSharedRoot: publishGltcSharedRoot,
    putJavaBridge: putJavaBridge,
    getJavaBridge: getJavaBridge,
    resolveStaffUseConsumer: resolveStaffUseConsumer,
    resolveIntegrationGunFireConsumer: resolveIntegrationGunFireConsumer,
    resolveIntegrationGunClearConsumer: resolveIntegrationGunClearConsumer,
    readBridgeMapFromMetadata: readBridgeMapFromMetadata,
    publishBridgeMapToMetadata: publishBridgeMapToMetadata,
    getBridgeMapLegacy: getBridgeMapLegacy,
    pluginGetMetadataValue: pluginGetMetadataValue,
    pluginSetMetadata: pluginSetMetadata,
    pluginHasMetadata: pluginHasMetadata
});
