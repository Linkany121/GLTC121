// ============================================
// GLTC 联合协议 - 全局监听入口
// 职责：加载子模块（食物战斗效果、术士系统）
// ============================================
var Bukkit = Java.type("org.bukkit.Bukkit");
var Player = Java.type("org.bukkit.entity.Player");
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");
// 同次 eval 内把术士句柄交给物品脚本桥接（勿用短名 MAGE_API，避免污染同引擎作用域）
var GLTC_MAGE_API = null;
/** setupMageSystem 发布的术士 Java 桥 Map（同次 eval 闭包） */
var GLTC_JAVA_BRIDGE_MAP = null;
/** 同次 eval 闭包持有脚本加载器（PLUGIN 动态字段在 Graal 下可能写不进去） */
var GLTC_SCRIPT_LOADER = null;
/** 枪械集成模块缓存（Java 桥 accept 闭包可能读不到局部 cacheRef） */
var GLTC_GUN_MODULE_CACHE = null;

// 重载时清空脚本缓存与一次性日志标记，避免沿用旧导出 / 刷屏失控
try {
    PLUGIN.gltcEvalCache = new java.util.concurrent.ConcurrentHashMap();
    try { PLUGIN.removeMetadata("gltc_mage_bridge_logged", PLUGIN); } catch (eBrRm) {}
    // 保留 gltc_mage_api / 共享根：boot 中段会覆盖写入
    PLUGIN.gltcGunModuleCache = null;
    PLUGIN.gltcGunDelegateApi = null;
    PLUGIN.gltcIntegrationGunFire = null;
    PLUGIN.gltcIntegrationGunClear = null;
    GLTC_GUN_MODULE_CACHE = null;
    try {
        var RSCGunClr = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSCGunClr.INSTANCE != null) {
            RSCGunClr.INSTANCE.gltcGunModuleCache = null;
            RSCGunClr.INSTANCE.gltcGunModuleApi = null;
            RSCGunClr.INSTANCE.gltcGunCfg = null;
        }
    } catch (eGunInstClr) {}
    try {
        var oldGunL = PLUGIN.gltcIntegrationGunListener;
        if (oldGunL != null) {
            try {
                Java.type("org.bukkit.event.player.PlayerInteractEvent")
                    .getHandlerList().unregister(oldGunL);
            } catch (eGunUnreg) {}
        }
        PLUGIN.gltcIntegrationGunListener = null;
    } catch (eGunLClr) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null) RSC.INSTANCE.gltcMageBridgesLocked = false;
    } catch (eLockClr) {}
} catch (eBoot) {}
GLTC_MAGE_API = null;

function resolveGltcScriptLoader() {
    if (GLTC_SCRIPT_LOADER != null && typeof GLTC_SCRIPT_LOADER.evalScriptExport === "function") {
        return GLTC_SCRIPT_LOADER;
    }
    try {
        var fromPlugin = PLUGIN.gltcScriptLoader;
        if (fromPlugin != null && typeof fromPlugin.evalScriptExport === "function") {
            GLTC_SCRIPT_LOADER = fromPlugin;
            return GLTC_SCRIPT_LOADER;
        }
    } catch (ePl) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        var inst = RSC.INSTANCE;
        if (inst != null && inst.gltcScriptLoader != null && typeof inst.gltcScriptLoader.evalScriptExport === "function") {
            GLTC_SCRIPT_LOADER = inst.gltcScriptLoader;
            return GLTC_SCRIPT_LOADER;
        }
    } catch (eInst) {}
    return null;
}

function findGltcScriptFile(rel) {
    rel = String(rel || "").replace(/\\/g, "/").trim();
    if (!/\.js$/i.test(rel)) rel = rel + ".js";
    var loader = resolveGltcScriptLoader();
    if (loader != null && typeof loader.findScriptFile === "function") {
        var fromLoader = loader.findScriptFile(rel);
        if (fromLoader != null) return fromLoader;
    }
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + rel),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + rel)
    ];
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists()) return candidates[c];
    }
    return null;
}

function gltcEvalScript(relativePath, captureExport) {
    return gltcEvalScriptEx(relativePath, captureExport, false);
}
/** isolated=true 时用 IIFE 包裹，避免多武器脚本共用全局 var 互相覆盖 */
function gltcEvalScriptEx(relativePath, captureExport, isolated) {
    var rel = String(relativePath).replace(/\\/g, "/");
    var relFile = rel;
    if (!/\.js$/i.test(relFile)) relFile = relFile + ".js";
    // 优先走统一加载器（白名单根 + 缓存）
    try {
        var loader = resolveGltcScriptLoader();
        if (loader && loader.evalScriptExport) {
            var fromLoader = loader.evalScriptExport(rel, { isolated: !!isolated, cache: true });
            if (fromLoader != null) {
                if (captureExport) return fromLoader;
                return true;
            }
        }
    } catch (eL) {}
    // 回退：仅白名单附属目录，禁止扫全部 addons
    var candidates = [
        findGltcScriptFile(rel),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + relFile),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + relFile)
    ];
    for (var c = 0; c < candidates.length; c++) {
        var file = candidates[c];
        if (file == null || !file.exists()) continue;
        try {
            var bytes = Files.readAllBytes(file.toPath());
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes)).toString();
            if (isolated) {
                code = "(function(){\n" + code + "\n})();";
            }
            var exported = (0, eval)(code);
            if (exported != null) {
                try {
                    var cache = PLUGIN.gltcEvalCache;
                    if (cache == null) {
                        cache = new java.util.concurrent.ConcurrentHashMap();
                        PLUGIN.gltcEvalCache = cache;
                    }
                    cache.put(rel, exported);
                } catch (eC) {}
            }
            if (captureExport) return exported;
            return true;
        } catch (e2) {
            Bukkit.getLogger().warning("[GLTC监听] 加载失败 " + relativePath + ": " + e2);
        }
    }
    Bukkit.getLogger().warning("[GLTC监听] 未找到脚本: " + relativePath);
    return captureExport ? null : false;
}
// ---------- 0) 能源流信用点（预加载，供各商店/银行卡/充值机复用） ----------
(function preloadCreditApi() {
    var credit = gltcEvalScript("能源流/_信用点.js", true);
    if (credit) {
        try {
            PLUGIN.gltcCreditApi = credit;
            try {
                Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE.gltcCreditApi = credit;
            } catch (eInst) {}
            Bukkit.getLogger().info("[GLTC监听] 已加载 能源流/_信用点.js");
        } catch (eCredit) {}
    } else {
        Bukkit.getLogger().warning("[GLTC监听] 能源流/_信用点.js 预加载失败，商店将在点击时重试");
    }
})();
// ---------- 0b) 共享根 + 脚本加载器（须先于术士/运行时） ----------
var GLTC_SHARED_ROOT_API = gltcEvalScript("_gltcSharedRoot.js", true);

(function preloadScriptLoader() {
    var loader = gltcEvalScript("_gltcScriptLoader.js", true);
    if (loader) {
        GLTC_SCRIPT_LOADER = loader;
        try { PLUGIN.gltcScriptLoader = loader; } catch (e0) {}
        try {
            var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC.INSTANCE != null) RSC.INSTANCE.gltcScriptLoader = loader;
        } catch (eInst) {}
        Bukkit.getLogger().info("[GLTC监听] 已加载 _gltcScriptLoader.js");
    } else {
        Bukkit.getLogger().warning("[GLTC监听] _gltcScriptLoader.js 预加载失败，部分模块将使用文件回退");
    }
})();

(function initSharedMapsEarly() {
    var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");
    var sharedRoot = null;
    try {
        if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.getGltcSharedRoot) {
            sharedRoot = GLTC_SHARED_ROOT_API.getGltcSharedRoot();
        }
        if (sharedRoot == null) sharedRoot = new CHM();
        if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.publishGltcSharedRoot) {
            sharedRoot = GLTC_SHARED_ROOT_API.publishGltcSharedRoot(sharedRoot);
        }
        try { PLUGIN.gltcSharedMaps = sharedRoot; } catch (ePl) {}
        try {
            var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC.INSTANCE != null) RSC.INSTANCE.gltcSharedMaps = sharedRoot;
        } catch (eRi) {}
    } catch (eRoot) {
        Bukkit.getLogger().warning("[GLTC监听] 共享根预初始化失败: " + eRoot);
    }
})();

// ---------- 1) 料理 / 食物战斗效果 ----------
if (gltcEvalScript("食物/战斗效果监听.js", false)) {
    Bukkit.getLogger().info("[GLTC监听] 已加载 食物/战斗效果监听");
}
// ---------- 2) 术士系统：核心 + 进服属性 + 最终减伤 / 粒子折射 ----------
(function setupMageSystem() {
    var exported = gltcEvalScript("术士系统/核心.js", true);
    if (!exported || typeof exported.getTotalStats !== "function") {
        Bukkit.getLogger().warning("[GLTC术士] 核心未加载，术士减伤/属性将不可用");
        return;
    }
    GLTC_MAGE_API = exported;
    try { PLUGIN.gltcMageApi = exported; } catch (e0) {}
    try {
        var RSC0 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC0.INSTANCE != null) RSC0.INSTANCE.gltcMageApi = exported;
    } catch (eInst0) {}
    try {
        var FixedMetadataValue0 = Java.type("org.bukkit.metadata.FixedMetadataValue");
        PLUGIN.setMetadata("gltc_mage_api", new FixedMetadataValue0(PLUGIN, exported));
    } catch (eMeta0) {}
    try {
        if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.getGltcSharedRoot) {
            var root0 = GLTC_SHARED_ROOT_API.getGltcSharedRoot();
            if (root0 != null) root0.put("gltcMageApi", exported);
        }
    } catch (eRoot0) {}
    try {
        if (typeof exported.publishMageJavaBridges === "function") {
            exported.publishMageJavaBridges(exported, { force: true, owner: "listener" });
        }
    } catch (eBrPub) {}
    // 同步到 INSTANCE 动态字段 + Java 桥 Map（物品脚本读 PLUGIN 常拿不到 Metadata）
    try {
        var RSC1 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        var inst = RSC1.INSTANCE;
        if (inst != null) {
            inst.gltcMageApi = exported;
            var bridgeStore = inst.gltcJavaBridges;
            if (bridgeStore == null) {
                bridgeStore = new java.util.concurrent.ConcurrentHashMap();
                inst.gltcJavaBridges = bridgeStore;
            }
            try { PLUGIN.gltcJavaBridges = bridgeStore; } catch (ePlBr) {}
            if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.getGltcSharedRoot) {
                var rootBr = GLTC_SHARED_ROOT_API.getGltcSharedRoot();
                if (rootBr != null) {
                    rootBr.put("gltcMageApi", exported);
                    rootBr.put("gltcJavaBridges", bridgeStore);
                }
            }
            try {
                if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.publishBridgeMapToMetadata) {
                    GLTC_SHARED_ROOT_API.publishBridgeMapToMetadata(bridgeStore);
                }
            } catch (eMetaPub) {}
            GLTC_JAVA_BRIDGE_MAP = bridgeStore;
            try {
                if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.readBridgeMapFromMetadata) {
                    var mageMapFromMeta = GLTC_SHARED_ROOT_API.readBridgeMapFromMetadata();
                    if (mageMapFromMeta != null) GLTC_JAVA_BRIDGE_MAP = mageMapFromMeta;
                }
            } catch (eMapSync) {}
            try {
                if (inst.gltcJavaBridges != null) GLTC_JAVA_BRIDGE_MAP = inst.gltcJavaBridges;
            } catch (eMapInst) {}
        }
    } catch (eSync) {}
    var EventPriority = Java.type("org.bukkit.event.EventPriority");
    var Listener = Java.type("org.bukkit.event.Listener");
    var EntityDamageEvent = Java.type("org.bukkit.event.entity.EntityDamageEvent");
    var PlayerJoinEvent = Java.type("org.bukkit.event.player.PlayerJoinEvent");
    try {
        if (PLUGIN.gltcMageListener != null) {
            try { PlayerJoinEvent.getHandlerList().unregister(PLUGIN.gltcMageListener); } catch (eU0) {}
            try { EntityDamageEvent.getHandlerList().unregister(PLUGIN.gltcMageListener); } catch (eU1) {}
            PLUGIN.gltcMageListener = null;
        }
    } catch (eU) {}
    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    PLUGIN.gltcMageListener = listenerInstance;
    Bukkit.getPluginManager().registerEvent(
        PlayerJoinEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                Bukkit.getScheduler().runTaskLater(PLUGIN, function() {
                    try {
                        var api = GLTC_MAGE_API != null ? GLTC_MAGE_API : PLUGIN.gltcMageApi;
                        if (api && typeof api.applyMageAttributes === "function") api.applyMageAttributes(p);
                        if (api && typeof api.getTotalStats === "function") api.getTotalStats(p, true);
                    } catch (e) {}
                }, 20);
            } catch (e2) {}
        }, PLUGIN
    );
    var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
    /** 最终减伤：乘算，上限 90%；仅对 Player */
    function applyFinalDamageReduction(entity, amount, api) {
        var amt = Number(amount);
        if (!(amt > 0) || !isFinite(amt)) return Math.max(0, amt || 0);
        try {
            if (!(entity instanceof Player)) return amt;
        } catch (eP) { return amt; }
        if (!api) return amt;
        try {
            var stats = api.getTotalStats(entity, false);
            var fdr = stats.finalDamageReduction || 0;
            if (fdr > 0) amt = amt * (1 - Math.min(0.90, fdr));
        } catch (e) {}
        return Math.max(0, amt);
    }
    Bukkit.getPluginManager().registerEvent(
        EntityDamageEvent, listenerInstance, EventPriority.HIGHEST,
        function(l, event) {
            if (event.isCancelled()) return;
            var entity = event.getEntity();
            try { if (!(entity instanceof LivingEntity)) return; } catch (eEnt) { return; }
            try {
                var api = GLTC_MAGE_API != null ? GLTC_MAGE_API : PLUGIN.gltcMageApi;
                if (!api) return;
                if (!(entity instanceof Player)) return;
                var dmg = applyFinalDamageReduction(entity, event.getDamage(), api);
                event.setDamage(dmg);
            } catch (e) {}
        }, PLUGIN
    );
    Bukkit.getLogger().info("[GLTC监听] 已加载 术士系统");
})();

// ---------- 3) 枪械集成枪：监听上下文内联预加载 + Java 桥 ----------
(function preloadIntegrationGunModules() {
    try {
        var loader = resolveGltcScriptLoader();
        var gunCfg = null;
        if (loader != null && typeof loader.evalScriptExport === "function") {
            gunCfg = loader.evalScriptExport("枪械/登记.js", { isolated: true, cache: true });
        }
        if (!gunCfg || typeof gunCfg.listGuns !== "function") {
            gunCfg = gltcEvalScriptEx("枪械/登记.js", true, true);
        }
        if (!gunCfg || typeof gunCfg.listGuns !== "function") {
            Bukkit.getLogger().warning("[GLTC监听] 枪械集成预加载失败：登记模块不可用");
            return;
        }

        function normalizeGunScriptRel(rel) {
            return String(rel || "").replace(/\\/g, "/").trim();
        }

        function readGunScriptBody(scriptRel) {
            var file = findGltcScriptFile(normalizeGunScriptRel(scriptRel));
            if (file == null) return null;
            try {
                return StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
            } catch (eRead) { return null; }
        }

        function buildGunModuleWrapper(body) {
            body = String(body || "")
                .replace(/\s+$/, "")
                .replace(/\bonLoad\s*\(\s*\)\s*;\s*$/, "");
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

        function loadGunModuleInline(scriptRel) {
            scriptRel = normalizeGunScriptRel(scriptRel);
            var body = readGunScriptBody(scriptRel);
            if (!body) {
                Bukkit.getLogger().warning("[GLTC枪械] 找不到脚本文件: " + scriptRel);
                return null;
            }
            try {
                return (0, eval)(buildGunModuleWrapper(body));
            } catch (eEval) {
                Bukkit.getLogger().warning("[GLTC枪械] 内联加载失败 " + scriptRel + ": " + eEval);
                return null;
            }
        }

        var cache = new java.util.concurrent.ConcurrentHashMap();
        GLTC_GUN_MODULE_CACHE = cache;
        var gunModuleApi = {
            cache: cache,
            getModule: function(scriptRel) {
                scriptRel = normalizeGunScriptRel(scriptRel);
                var mod = this.cache.get(scriptRel);
                if (mod != null && mod.onUse != null) return mod;
                mod = loadGunModuleInline(scriptRel);
                if (mod != null && mod.onUse != null) {
                    this.cache.put(scriptRel, mod);
                    return mod;
                }
                return null;
            },
            clearState: function(player, gunId, cfg) {
                if (!player || !gunId || !cfg) return;
                var scriptRel = cfg.getGunScript ? cfg.getGunScript(String(gunId)) : null;
                if (!scriptRel) return;
                var mod = this.getModule(scriptRel);
                if (mod != null && mod.clearGunState != null) mod.clearGunState(player);
            }
        };

        var guns = gunCfg.listGuns();
        var count = 0;
        for (var i = 0; i < guns.length; i++) {
            var rel = normalizeGunScriptRel(guns[i].script || "");
            if (!rel) continue;
            var mod = gunModuleApi.getModule(rel);
            if (mod != null && mod.onUse != null) {
                count++;
            } else {
                Bukkit.getLogger().warning("[GLTC枪械] 预加载失败: " + rel
                    + " (mod=" + (mod != null) + " onUse=" + (mod != null && mod.onUse != null) + ")");
            }
        }

        try { PLUGIN.gltcGunModuleCache = cache; } catch (eCache) {}
        try {
            var RSC0 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC0.INSTANCE != null) {
                RSC0.INSTANCE.gltcGunModuleCache = cache;
                RSC0.INSTANCE.gltcGunModuleApi = gunModuleApi;
                RSC0.INSTANCE.gltcGunCfg = gunCfg;
            }
        } catch (eInst0) {}

        var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
        var RSCGunBridge = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        var gunCfgRef = gunCfg;

        var gunFireBridge = new (Java.extend(java.util.function.Consumer, {
            accept: function(payload) {
                var ok = false;
                try {
                    if (payload == null) return;
                    var player = payload.get("player");
                    var event = payload.get("event");
                    var gunId = String(payload.get("gunId") || "");
                    var scriptRel = normalizeGunScriptRel(payload.get("scriptRel"));
                    if (player == null || event == null || !gunId || !scriptRel) return;
                    var api = gunModuleApi;
                    try {
                        var inst = RSCGunBridge.INSTANCE;
                        if (inst != null && inst.gltcGunModuleApi != null) api = inst.gltcGunModuleApi;
                    } catch (eApi) {}
                    var mod = api != null ? api.getModule(scriptRel) : null;
                    if (mod == null || mod.onUse == null) {
                        Bukkit.getLogger().warning("[GLTC枪械] 桥接射击无模块: " + gunId + " / " + scriptRel);
                        return;
                    }
                    mod.onUse(event);
                    ok = true;
                } catch (eFire) {
                    try { Bukkit.getLogger().warning("[GLTC枪械] 桥接射击异常: " + eFire); } catch (eLog) {}
                } finally {
                    try {
                        var result = payload != null ? payload.get("result") : null;
                        if (result != null && result.set != null) result.set(java.lang.Boolean.valueOf(ok));
                    } catch (eRes) {}
                }
            }
        }))();

        var gunClearBridge = new (Java.extend(java.util.function.Consumer, {
            accept: function(payload) {
                try {
                    if (payload == null) return;
                    var player = payload.get("player");
                    var gunId = String(payload.get("gunId") || "");
                    if (player == null || !gunId) return;
                    var cfg = gunCfgRef;
                    var api = gunModuleApi;
                    try {
                        var inst = RSCGunBridge.INSTANCE;
                        if (inst != null) {
                            if (inst.gltcGunCfg != null) cfg = inst.gltcGunCfg;
                            if (inst.gltcGunModuleApi != null) api = inst.gltcGunModuleApi;
                        }
                    } catch (eApi) {}
                    if (api != null) api.clearState(player, gunId, cfg);
                } catch (eClr) {}
            }
        }))();

        try { PLUGIN.gltcIntegrationGunFire = gunFireBridge; } catch (eB0) {}
        try { PLUGIN.gltcIntegrationGunClear = gunClearBridge; } catch (eB1) {}
        try {
            var RSC1 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC1.INSTANCE != null) {
                RSC1.INSTANCE.gltcIntegrationGunFire = gunFireBridge;
                RSC1.INSTANCE.gltcIntegrationGunClear = gunClearBridge;
            }
        } catch (eB2) {}

        var AtomicReference = Java.type("java.util.concurrent.atomic.AtomicReference");
        var fireRef = new AtomicReference();
        fireRef.set(gunFireBridge);
        var clearRef = new AtomicReference();
        clearRef.set(gunClearBridge);

        if (GLTC_SHARED_ROOT_API) {
            try {
                if (GLTC_SHARED_ROOT_API.putJavaBridge) {
                    GLTC_SHARED_ROOT_API.putJavaBridge("gltcIntegrationGunFire", gunFireBridge);
                    GLTC_SHARED_ROOT_API.putJavaBridge("gltcIntegrationGunClear", gunClearBridge);
                }
                if (GLTC_SHARED_ROOT_API.pluginSetMetadata) {
                    GLTC_SHARED_ROOT_API.pluginSetMetadata(PLUGIN, "gltc_integration_gun_fire", gunFireBridge);
                    GLTC_SHARED_ROOT_API.pluginSetMetadata(PLUGIN, "gltc_integration_gun_clear", gunClearBridge);
                    GLTC_SHARED_ROOT_API.pluginSetMetadata(PLUGIN, "gltc_integration_gun_fire_ref", fireRef);
                    GLTC_SHARED_ROOT_API.pluginSetMetadata(PLUGIN, "gltc_integration_gun_clear_ref", clearRef);
                }
            } catch (eMeta) {}
        }
        try {
            var brMap = GLTC_JAVA_BRIDGE_MAP;
            if (brMap == null) brMap = PLUGIN.gltcJavaBridges;
            if (brMap != null) {
                brMap.put("gltcIntegrationGunFire", gunFireBridge);
                brMap.put("gltcIntegrationGunClear", gunClearBridge);
            }
        } catch (eBr) {}

        // 监听上下文直接处理站立右键射击（物品脚本跨 Graal 上下文不可靠）
        var INTEGRATION_GUN_ID = "FKR_枪械集成枪";
        var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
        var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
        var KEY_SELECTED_GUN = new NamespacedKey("gltc", "integration_gun_id");
        var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
        var EventPriority = Java.type("org.bukkit.event.EventPriority");
        var Listener = Java.type("org.bukkit.event.Listener");
        var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
        var Material = Java.type("org.bukkit.Material");
        var SlimefunItemGun = SlimefunItem;

        function readSelectedGunIdInline(stack) {
            if (!stack || stack.getType() === Material.AIR) return null;
            try {
                var meta = stack.getItemMeta();
                if (!meta) return null;
                var pdc = meta.getPersistentDataContainer();
                if (!pdc.has(KEY_SELECTED_GUN, PersistentDataType.STRING)) return null;
                var v = String(pdc.get(KEY_SELECTED_GUN, PersistentDataType.STRING)).trim();
                return v.length ? v : null;
            } catch (e) { return null; }
        }

        function fireIntegrationGun(player, event) {
            var gunId = readSelectedGunIdInline(player.getInventory().getItemInMainHand());
            if (!gunId) {
                try {
                    player.sendMessage("§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f§c请先蹲下右键选择要装载的枪械！");
                } catch (eMsg) {}
                return false;
            }
            var scriptRel = gunCfgRef.getGunScript ? gunCfgRef.getGunScript(gunId) : null;
            if (!scriptRel) return false;
            var payload = new java.util.HashMap();
            payload.put("player", player);
            payload.put("event", event);
            payload.put("gunId", String(gunId));
            payload.put("scriptRel", String(scriptRel));
            gunFireBridge.accept(payload);
            return true;
        }

        var ListenerClass = Java.extend(Listener, {});
        var gunListener = new ListenerClass();
        Bukkit.getPluginManager().registerEvent(
            PlayerInteractEvent, gunListener, EventPriority.NORMAL,
            function(l, evt) {
                try {
                    if (evt.getHand() != null && evt.getHand() !== EquipmentSlot.HAND) return;
                    var action = evt.getAction();
                    if (action == null) return;
                    var actionName = String(action.name());
                    if (actionName !== "RIGHT_CLICK_AIR" && actionName !== "RIGHT_CLICK_BLOCK") return;
                    var player = evt.getPlayer();
                    if (player == null || !player.isOnline()) return;
                    if (player.isSneaking()) return;
                    var item = player.getInventory().getItemInMainHand();
                    if (!item || item.getType() === Material.AIR) return;
                    var sf = SlimefunItemGun.getByItem(item);
                    if (sf == null || String(sf.getId()) !== INTEGRATION_GUN_ID) return;
                    if (fireIntegrationGun(player, evt)) {
                        try { evt.setCancelled(true); } catch (eCancel) {}
                    }
                } catch (eInt) {}
            }, PLUGIN
        );
        try { PLUGIN.gltcIntegrationGunListener = gunListener; } catch (eGunLSet) {}

        Bukkit.getLogger().info("[GLTC监听] 枪械集成已预加载 " + count + " 个枪械射击模块（Java桥已发布）");
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC监听] 枪械集成预加载异常: " + e);
    }
})();

// ---------- 4) 异能武器：由 items.yml script 绑定加载，勿在此预加载 ----------
(function noteWeaponScripts() {
    Bukkit.getLogger().info("[GLTC监听] 异能武器改由 items.yml 的 script 字段加载（避免重复注册监听器）");
})();
