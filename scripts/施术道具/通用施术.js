// VASA_通用施术道具 — onUse（AtomicReference + Metadata 反射，跨 Graal 上下文）
var Player = Java.type("org.bukkit.entity.Player");
var Bukkit = Java.type("org.bukkit.Bukkit");
var JString = Java.type("java.lang.String");

function getPlugin() {
    return Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
}

function metaValue(key) {
    var plug = getPlugin();
    if (plug == null) return null;
    var k = String(key);
    try {
        if (plug.getMetadata != null) {
            var list = plug.getMetadata(k);
            if (list != null && list.size() > 0) return list.get(0).value();
        }
    } catch (e0) {}
    try {
        var list2 = plug.getClass().getMethod("getMetadata", JString).invoke(plug, k);
        if (list2 != null && list2.size() > 0) return list2.get(0).value();
    } catch (e1) {}
    return null;
}

function staffConsumer() {
    try {
        var staffRef = metaValue("gltc_staff_bridge_ref");
        if (staffRef != null && staffRef.get != null) {
            var fromRef = staffRef.get();
            if (fromRef != null) return fromRef;
        }
    } catch (eRef) {}
    var c = metaValue("gltc_handle_staff_use");
    if (c != null) return c;
    try {
        var mapRef = metaValue("gltc_bridge_map_ref");
        if (mapRef != null && mapRef.get != null) {
            var m = mapRef.get();
            if (m != null) {
                c = m.get("gltcHandleStaffUse");
                if (c != null) return c;
            }
        }
    } catch (eMapRef) {}
    try {
        var bridges = metaValue("gltc_java_bridges");
        if (bridges != null) {
            c = bridges.get("gltcHandleStaffUse");
            if (c != null) return c;
        }
    } catch (e1) {}
    try {
        var root = metaValue("gltc_shared_root_maps");
        if (root != null) {
            c = root.get("gltcHandleStaffUse");
            if (c != null) return c;
        }
    } catch (e0) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        var inst = RSC.INSTANCE;
        if (inst != null) {
            try {
                if (inst.gltcHandleStaffUseConsumer != null) return inst.gltcHandleStaffUseConsumer;
            } catch (e2) {}
            try {
                var bm = inst.gltcJavaBridges;
                if (bm != null) {
                    c = bm.get("gltcHandleStaffUse");
                    if (c != null) return c;
                }
            } catch (e3) {}
        }
    } catch (e4) {}
    return null;
}

function onUse(event) {
    try {
        var p = event.getPlayer();
        if (!(p instanceof Player)) return;
        var c = staffConsumer();
        if (c != null) {
            c.accept(p);
            return;
        }
        // RSC 物品 onUse 与 PlayerInteractEvent 双触发；异 Graal 上下文常读不到桥。
        // 施术核心监听器（监听.js 闭包注入）会处理同一次右键，此处静默退出即可。
    } catch (e) {}
}

function tick(info) {}
