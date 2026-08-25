// ===================================================================
// VASA_通用施术道具 — NTC外置粒子控制仪
// 跨 Graal 上下文：只走 _gltcSharedRoot 的 Metadata + Java 桥，勿读 PLUGIN 动态字段
// ===================================================================

var Player = Java.type("org.bukkit.entity.Player");
var Bukkit = Java.type("org.bukkit.Bukkit");
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

var _staffUseWarned = false;
var _sharedRootApi = null;

function getSharedRootApi() {
    if (_sharedRootApi != null) return _sharedRootApi;
    try {
        var loader = PLUGIN != null ? PLUGIN.gltcScriptLoader : null;
        if (loader == null) {
            try {
                var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
                if (RSC.INSTANCE != null) loader = RSC.INSTANCE.gltcScriptLoader;
            } catch (e0) {}
        }
        if (loader && loader.evalScriptExport) {
            _sharedRootApi = loader.evalScriptExport("_gltcSharedRoot.js", { isolated: true, cache: true });
            if (_sharedRootApi != null) return _sharedRootApi;
        }
    } catch (eL) {}
    try {
        var File = java.io.File;
        var Files = java.nio.file.Files;
        var StandardCharsets = java.nio.charset.StandardCharsets;
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var dataDir = PLUGIN != null ? PLUGIN.getDataFolder() : null;
        if (dataDir == null) {
            var RSC2 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC2.INSTANCE != null) dataDir = RSC2.INSTANCE.getDataFolder();
        }
        if (dataDir != null) {
            var f = new File(dataDir.getAbsolutePath() + "/addons/GLTC_联合协议/scripts/_gltcSharedRoot.js");
            if (!f.exists()) {
                f = new File(dataDir.getAbsolutePath() + "/addons/GLTC121/scripts/_gltcSharedRoot.js");
            }
            if (f.exists()) {
                var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString();
                _sharedRootApi = (0, eval)(code);
            }
        }
    } catch (eF) {}
    return _sharedRootApi;
}

function getStaffUseConsumer() {
    var sr = getSharedRootApi();
    if (sr != null && sr.getJavaBridge != null) {
        try {
            var c = sr.getJavaBridge("gltcHandleStaffUse");
            if (c != null) return c;
            c = sr.getJavaBridge("handleStaffUse");
            if (c != null) return c;
        } catch (eBr) {}
    }
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        var inst = RSC.INSTANCE;
        if (inst != null) {
            if (inst.gltcHandleStaffUseConsumer != null) return inst.gltcHandleStaffUseConsumer;
            if (inst.gltcJavaBridges != null) {
                var cInst = inst.gltcJavaBridges.get("gltcHandleStaffUse");
                if (cInst != null) return cInst;
            }
            if (inst.gltcSharedMaps != null) {
                var cMap = inst.gltcSharedMaps.get("gltcHandleStaffUse");
                if (cMap != null) return cMap;
                var bm = inst.gltcSharedMaps.get("gltc_spell_core_bridge_map");
                if (bm != null) {
                    cMap = bm.get("handleStaffUse");
                    if (cMap != null) return cMap;
                }
            }
        }
    } catch (eInst) {}
    if (sr != null) {
        try {
            if (sr.getGltcSharedRoot != null) {
                var root = sr.getGltcSharedRoot();
                if (root != null) {
                    var c2 = root.get("gltcHandleStaffUse");
                    if (c2 != null) return c2;
                    var bridge = root.get("gltc_spell_core_bridge_map");
                    if (bridge != null) {
                        c2 = bridge.get("handleStaffUse");
                        if (c2 != null) return c2;
                    }
                    c2 = root.get("handleStaffUse");
                    if (c2 != null) return c2;
                }
            }
        } catch (eRoot) {}
    }
    return null;
}

function ensureSpellListeners() {
    var sr = getSharedRootApi();
    if (sr != null && sr.getJavaBridge != null) {
        try {
            var c = sr.getJavaBridge("gltcEnsureSpellListeners");
            if (c != null && c.accept != null) {
                c.accept(java.lang.Boolean.TRUE);
                return true;
            }
        } catch (e0) {}
    }
    if (sr != null && sr.getGltcSharedRoot != null) {
        try {
            var root = sr.getGltcSharedRoot();
            if (root != null) {
                var c2 = root.get("gltcEnsureSpellListeners");
                if (c2 == null) {
                    var bridge = root.get("gltc_spell_core_bridge_map");
                    if (bridge != null) c2 = bridge.get("ensureListeners");
                    if (c2 == null) c2 = root.get("ensureListeners");
                }
                if (c2 != null && c2.accept != null) {
                    c2.accept(java.lang.Boolean.TRUE);
                    return true;
                }
            }
        } catch (e1) {}
    }
    return false;
}

function invokeStaffUse(player) {
    if (!(player instanceof Player)) return false;
    ensureSpellListeners();
    var consumer = getStaffUseConsumer();
    if (consumer != null) {
        try {
            consumer.accept(player);
            return true;
        } catch (eBr) {
            try { Bukkit.getLogger().warning("[GLTC通用施术] handleStaffUse 桥接异常: " + eBr); } catch (eLog) {}
        }
    }
    try {
        if (!_staffUseWarned) {
            _staffUseWarned = true;
            Bukkit.getLogger().warning("[GLTC通用施术] 施术核心未桥接（共享根无 Consumer，请重启）");
            player.sendMessage("§c[GLTC] 施术系统未桥接，请联系管理重载插件。");
        }
    } catch (eMsg) {}
    return false;
}

function onUse(event) {
    try {
        var p = event.getPlayer();
        if (p instanceof Player) invokeStaffUse(p);
    } catch (e) {}
}

function tick(info) {}
