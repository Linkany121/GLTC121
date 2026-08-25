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
// 同次 eval 内把运行时/术士句柄直接交给施术核心（勿只靠 PLUGIN 动态字段回读）
// 勿用短名 MAGE_API：物品脚本 装备菜单/调控终端 顶层 var 会污染同引擎作用域
var GLTC_SPELL_RUNTIME = null;
var GLTC_MAGE_API = null;

// 重载时清空脚本缓存与一次性日志标记，避免沿用旧导出 / 刷屏失控
try {
    PLUGIN.gltcEvalCache = new java.util.concurrent.ConcurrentHashMap();
    PLUGIN.gltcSpellDmgListenerReady = false;
    PLUGIN.gltcSpellDmgLogOnce = false;
    PLUGIN.gltcSpellDmgLogVer = 0;
    PLUGIN.gltcRuntimeLoadedLogged = false;
    try { PLUGIN.removeMetadata("gltc_mage_bridge_logged", PLUGIN); } catch (eBrRm) {}
    // 必须清版本号，否则 ensureSpellDamageListener 会因旧 ver 跳过重挂
    try { PLUGIN.gltcSpellDmgListenerVer = 0; } catch (eVer) {}
    try {
        var oldDmgL = PLUGIN.gltcSpellDmgListenerV2;
        if (oldDmgL != null) {
            try {
                Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent")
                    .getHandlerList().unregister(oldDmgL);
            } catch (eU0) {}
            try {
                Java.type("org.bukkit.event.entity.EntityDamageEvent")
                    .getHandlerList().unregister(oldDmgL);
            } catch (eU1) {}
        }
        PLUGIN.gltcSpellDmgListenerV2 = null;
    } catch (eUnreg) {}
    try { PLUGIN.removeMetadata("gltc_spell_dmg_listener", PLUGIN); } catch (eRm) {}
    try { PLUGIN.removeMetadata("gltc_spell_runtime", PLUGIN); } catch (eRm2) {}
    // 保留 gltc_mage_api / 共享根：boot 中段会覆盖写入；先 remove 再 set 失败会导致粒子强度整段失效
    PLUGIN.gltcSpellLoadLogged = false;
    PLUGIN.gltcCoreSkillLoadLogged = false;
    PLUGIN.gltcLoadDepsWarned = false;
    PLUGIN.gltcEngraveApiWarned = false;
    PLUGIN.gltcSpellCoreListenLogged = false;
    PLUGIN.gltcSpellCfg = null;
    PLUGIN.gltcStaffCfg = null;
} catch (eBoot) {}
GLTC_SPELL_RUNTIME = null;
GLTC_MAGE_API = null;

function gltcEvalScript(relativePath, captureExport) {
    return gltcEvalScriptEx(relativePath, captureExport, false);
}
/** isolated=true 时用 IIFE 包裹，避免多武器脚本共用全局 var 互相覆盖 */
function gltcEvalScriptEx(relativePath, captureExport, isolated) {
    var rel = String(relativePath).replace(/\\/g, "/");
    // 优先走统一加载器（白名单根 + 缓存）
    try {
        var loader = PLUGIN.gltcScriptLoader;
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
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + rel),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + rel)
    ];
    for (var c = 0; c < candidates.length; c++) {
        var file = candidates[c];
        if (!file.exists()) continue;
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
        try { PLUGIN.gltcScriptLoader = loader; } catch (e0) {}
        try {
            var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC.INSTANCE != null) RSC.INSTANCE.gltcScriptLoader = loader;
        } catch (eInst) {}
        Bukkit.getLogger().info("[GLTC监听] 已加载 _gltcScriptLoader.js");
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
            exported.publishMageJavaBridges(exported);
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
    Bukkit.getPluginManager().registerEvent(
        EntityDamageEvent, listenerInstance, EventPriority.HIGH,
        function(l, event) {
            if (event.isCancelled()) return;
            var entity = event.getEntity();
            if (!(entity instanceof Player)) return;
            try {
                var api = GLTC_MAGE_API != null ? GLTC_MAGE_API : PLUGIN.gltcMageApi;
                if (!api) return;
                // 脉冲伤害：不吃粒子折射、不吃最终减伤
                if (api.isPulseDamage && api.isPulseDamage(entity)) {
                    try { entity.removeMetadata("gltc_pulse_hit", PLUGIN); } catch (ePulse) {}
                    return;
                }
                var stats = api.getTotalStats(entity, false);
                var dmg = event.getDamage();
                var isSpellParticle = false;
                try { isSpellParticle = entity.hasMetadata("gltc_spell_particle_hit"); } catch (eSp) {}
                // 粒子折射：仅术式造成的粒子伤害；处理后立刻摘 meta，防取消/残留误套
                if (isSpellParticle) {
                    try { entity.removeMetadata("gltc_spell_particle_hit", PLUGIN); } catch (eRmSp) {}
                    var refract = stats.particleRefraction || 0;
                    if (refract > 0) dmg = dmg * (1 - Math.min(0.95, refract));
                }
                // 最终减伤：脉冲以外所有伤害；脉冲已在上方跳过
                var fdr = stats.finalDamageReduction || 0;
                if (fdr > 0) dmg = dmg * (1 - Math.min(0.90, fdr));
                if (dmg < 0) dmg = 0;
                event.setDamage(dmg);
            } catch (e) {}
        }, PLUGIN
    );
    Bukkit.getLogger().info("[GLTC监听] 已加载 术士系统");
})();

// ---------- 3b) 术式运行时 v2（写入 Metadata 共享根，勿依赖 PLUGIN 动态字段） ----------
(function preloadSpellRuntime() {
    var runtime = null;
    // 优先走脚本加载器缓存，避免与施术核心二次 eval
    try {
        var loader = PLUGIN.gltcScriptLoader;
        if (loader && loader.evalScriptExport) {
            runtime = loader.evalScriptExport("术式运行时/核心.js");
        }
    } catch (eL) {}
    if (!runtime) runtime = gltcEvalScript("术式运行时/核心.js", true);
    if (runtime) {
        GLTC_SPELL_RUNTIME = runtime;
        try { PLUGIN.gltcSpellRuntime = runtime; } catch (e0) {}
        try {
            var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC.INSTANCE != null) RSC.INSTANCE.gltcSpellRuntime = runtime;
        } catch (eInst) {}
        try {
            var root = null;
            if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.getGltcSharedRoot) {
                root = GLTC_SHARED_ROOT_API.getGltcSharedRoot();
            }
            if (root != null) root.put("gltcSpellRuntime", runtime);
        } catch (eMap) {}
        try {
            var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
            PLUGIN.setMetadata("gltc_spell_runtime", new FixedMetadataValue(PLUGIN, runtime));
        } catch (eMeta) {}
        try {
            var cache = PLUGIN.gltcEvalCache;
            if (cache != null) cache.put("术式运行时/核心.js", runtime);
        } catch (eCache) {}
        Bukkit.getLogger().info("[GLTC监听] 已加载 术式运行时/核心.js v2");
    } else {
        Bukkit.getLogger().warning("[GLTC监听] 术式运行时加载失败");
    }
})();

// ---------- 3c) 预加载术式登记（避免首次施术才懒加载） ----------
(function preloadSpellRegistry() {
    var cfg = null;
    try {
        var loader = PLUGIN.gltcScriptLoader;
        if (loader && loader.evalScriptExport) cfg = loader.evalScriptExport("术式/登记.js");
    } catch (eL) {}
    if (!cfg) cfg = gltcEvalScript("术式/登记.js", true);
    if (cfg) {
        try { PLUGIN.gltcSpellCfg = cfg; } catch (e0) {}
        try {
            var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC.INSTANCE != null) RSC.INSTANCE.gltcSpellCfg = cfg;
        } catch (eInst) {}
        try {
            var root = GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.getGltcSharedRoot
                ? GLTC_SHARED_ROOT_API.getGltcSharedRoot() : null;
            if (root != null) root.put("gltcSpellCfg", cfg);
        } catch (eMap) {}
        try {
            var cache = PLUGIN.gltcEvalCache;
            if (cache != null) cache.put("术式/登记.js", cfg);
        } catch (eCache) {}
    } else {
        Bukkit.getLogger().warning("[GLTC监听] 术式登记预加载失败");
    }
})();

// ---------- 4) 施术核心 v2：监听上下文单例（道具脚本勿再 eval） ----------
(function setupSpellCoreSingleton() {
    var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
    var rscInst = RSC.INSTANCE;
    var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");
    var sharedRoot = null;
    try {
        if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.getGltcSharedRoot) {
            sharedRoot = GLTC_SHARED_ROOT_API.getGltcSharedRoot();
        }
        if (sharedRoot == null) sharedRoot = new CHM();
        if (rscInst != null) {
            try { rscInst.gltcSharedMaps = sharedRoot; } catch (eRi) {}
        }
        if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.publishGltcSharedRoot) {
            sharedRoot = GLTC_SHARED_ROOT_API.publishGltcSharedRoot(sharedRoot);
        }
        try { PLUGIN.gltcSharedMaps = sharedRoot; } catch (ePl) {}
        // 确保运行时句柄仍在权威共享根上（优先同文件本地句柄）
        try {
            var rtKeep = GLTC_SPELL_RUNTIME;
            try { if (rtKeep == null) rtKeep = PLUGIN.gltcSpellRuntime; } catch (eRt0) {}
            if (rtKeep == null && rscInst != null) {
                try { rtKeep = rscInst.gltcSpellRuntime; } catch (eRt1) {}
            }
            if (rtKeep == null) rtKeep = sharedRoot.get("gltcSpellRuntime");
            if (rtKeep != null) {
                sharedRoot.put("gltcSpellRuntime", rtKeep);
                if (GLTC_SPELL_RUNTIME == null) GLTC_SPELL_RUNTIME = rtKeep;
            }
        } catch (eRtPut) {}
    } catch (eRoot) {
        Bukkit.getLogger().warning("[GLTC监听] gltcSharedMaps 初始化失败: " + eRoot);
        if (sharedRoot == null) sharedRoot = new CHM();
    }
    var castApi = gltcEvalScript("施术道具/施术核心.js", true);
    if (!castApi || typeof castApi.handleStaffUse !== "function") {
        Bukkit.getLogger().warning("[GLTC监听] 施术核心 v2 预加载失败");
        return;
    }
    // 优先同次 eval 本地句柄；Metadata / 共享根仅作兜底
    try {
        var rtBind = GLTC_SPELL_RUNTIME;
        try {
            if (rtBind == null && PLUGIN.hasMetadata("gltc_spell_runtime")) {
                rtBind = PLUGIN.getMetadata("gltc_spell_runtime").get(0).value();
            }
        } catch (eM) {}
        if (rtBind == null && sharedRoot != null) {
            try { rtBind = sharedRoot.get("gltcSpellRuntime"); } catch (eS) {}
        }
        try { if (rtBind == null) rtBind = PLUGIN.gltcSpellRuntime; } catch (eP) {}
        try {
            if (rtBind == null && rscInst != null) rtBind = rscInst.gltcSpellRuntime;
        } catch (eR) {}
        if (rtBind != null && typeof castApi.bindRuntime === "function") {
            castApi.bindRuntime(rtBind);
            GLTC_SPELL_RUNTIME = rtBind;
        } else {
            Bukkit.getLogger().warning("[GLTC监听] 施术核心未绑定运行时（rt=" + !!rtBind + ")");
        }
    } catch (eBind) {
        Bukkit.getLogger().warning("[GLTC监听] bindRuntime 失败: " + eBind);
    }
    // 术士 API 同理：优先本地句柄，避免菜单/施术各 eval 一份导致粒子强度缓存分裂
    try {
        var mageBind = GLTC_MAGE_API;
        try {
            if (mageBind == null && PLUGIN.hasMetadata("gltc_mage_api")) {
                mageBind = PLUGIN.getMetadata("gltc_mage_api").get(0).value();
            }
        } catch (eMM) {}
        if (mageBind == null && sharedRoot != null) {
            try { mageBind = sharedRoot.get("gltcMageApi"); } catch (eMS) {}
        }
        try { if (mageBind == null) mageBind = PLUGIN.gltcMageApi; } catch (eMP) {}
        try {
            if (mageBind == null && rscInst != null) mageBind = rscInst.gltcMageApi;
        } catch (eMR) {}
        if (mageBind != null && typeof castApi.bindMageApi === "function") {
            var bound = false;
            try { bound = !!castApi.bindMageApi(mageBind); } catch (eBindRet) { bound = false; }
            if (bound) {
                GLTC_MAGE_API = mageBind;
                try {
                    if (sharedRoot != null) sharedRoot.put("gltcMageApi", mageBind);
                } catch (ePutM) {}
                try { PLUGIN.gltcSharedMaps = sharedRoot; } catch (ePlM) {}
                // 桥已在 setupMageSystem 发布；bind 仅同步句柄
                try {
                    var FixedMetadataValueM = Java.type("org.bukkit.metadata.FixedMetadataValue");
                    PLUGIN.setMetadata("gltc_mage_api", new FixedMetadataValueM(PLUGIN, mageBind));
                } catch (eMetaM) {}
            } else {
                Bukkit.getLogger().warning("[GLTC监听] 施术核心 bindMageApi 返回失败（calcSpellDamage 不可用）");
            }
        } else {
            Bukkit.getLogger().warning("[GLTC监听] 施术核心未绑定术士API（mage=" + !!mageBind + ")");
        }
    } catch (eMageBind) {
        Bukkit.getLogger().warning("[GLTC监听] bindMageApi 失败: " + eMageBind);
    }
    try { PLUGIN.gltcCastApi = castApi; } catch (e0) {}
    try { PLUGIN.gltcCastApiOwner = "listener"; } catch (e1) {}
    try {
        if (rscInst != null) {
            rscInst.gltcCastApi = castApi;
            rscInst.gltcCastApiOwner = "listener";
        }
    } catch (eInst) {}
    try {
        if (typeof castApi.ensureListeners === "function") castApi.ensureListeners(true);
    } catch (eEns) {
        Bukkit.getLogger().warning("[GLTC监听] 施术核心 ensureListeners 失败: " + eEns);
    }
    try {
        if (sharedRoot == null) sharedRoot = new CHM();
        var bridgeMap = sharedRoot.get("gltc_spell_core_bridge_map");
        if (bridgeMap == null) {
            bridgeMap = new CHM();
            sharedRoot.put("gltc_spell_core_bridge_map", bridgeMap);
        }
        var staffUseConsumer = new (Java.extend(java.util.function.Consumer, {
            accept: function(p) {
                try {
                    if (p == null || !(p instanceof Player)) return;
                    castApi.handleStaffUse(p, {});
                } catch (eHu) {
                    try { Bukkit.getLogger().warning("[GLTC监听] handleStaffUse: " + eHu); } catch (eLog) {}
                }
            }
        }))();
        var ensureConsumer = new (Java.extend(java.util.function.Consumer, {
            accept: function(forceFlag) {
                try {
                    var force = forceFlag === true || forceFlag === java.lang.Boolean.TRUE;
                    if (typeof castApi.ensureListeners === "function") castApi.ensureListeners(force);
                } catch (eEn) {}
            }
        }))();
        sharedRoot.put("handleStaffUse", staffUseConsumer);
        sharedRoot.put("ensureListeners", ensureConsumer);
        bridgeMap.put("handleStaffUse", staffUseConsumer);
        bridgeMap.put("ensureListeners", ensureConsumer);
        bridgeMap.put("interactReady", java.lang.Boolean.TRUE);
        bridgeMap.put("listenerVer", java.lang.Long.parseLong("1", 10));
        if (rscInst != null) {
            rscInst.gltcSharedMaps = sharedRoot;
            rscInst.gltcHandleStaffUseConsumer = staffUseConsumer;
            rscInst.gltcEnsureSpellCoreListeners = ensureConsumer;
            rscInst.gltc_spell_core_bridge_map = bridgeMap;
        }
        PLUGIN.gltcSharedMaps = sharedRoot;
        PLUGIN.gltcHandleStaffUseConsumer = staffUseConsumer;
        PLUGIN.gltcEnsureSpellCoreListeners = ensureConsumer;
        PLUGIN.gltc_spell_core_bridge_map = bridgeMap;
        // 本服 Graal 对 Plugin.setMetadata 会报 Unknown identifier；权威通道走 ConcurrentHashMap
        try {
            var bridgeStore = PLUGIN.gltcJavaBridges;
            if (bridgeStore == null && rscInst != null) {
                try { bridgeStore = rscInst.gltcJavaBridges; } catch (e0) {}
            }
            if (bridgeStore == null) {
                bridgeStore = new java.util.concurrent.ConcurrentHashMap();
            }
            bridgeStore.put("gltcHandleStaffUse", staffUseConsumer);
            bridgeStore.put("gltcEnsureSpellListeners", ensureConsumer);
            PLUGIN.gltcJavaBridges = bridgeStore;
            if (rscInst != null) rscInst.gltcJavaBridges = bridgeStore;
            if (sharedRoot != null) {
                sharedRoot.put("gltcHandleStaffUse", staffUseConsumer);
                sharedRoot.put("gltcEnsureSpellListeners", ensureConsumer);
                sharedRoot.put("gltcJavaBridges", bridgeStore);
            }
            // 权威：写入 Metadata 共享根（物品脚本经反射可读）
            if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.putJavaBridge) {
                GLTC_SHARED_ROOT_API.putJavaBridge("gltcHandleStaffUse", staffUseConsumer);
                GLTC_SHARED_ROOT_API.putJavaBridge("gltcEnsureSpellListeners", ensureConsumer);
            }
            Bukkit.getLogger().info("[GLTC监听] 施术 Consumer 已写入 gltcJavaBridges");
        } catch (eMapBr) {
            Bukkit.getLogger().warning("[GLTC监听] 施术 Consumer Map 写入失败: " + eMapBr);
        }
        try {
            var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
            var plug = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
            if (plug != null) {
                plug.setMetadata("gltc_handle_staff_use", new FixedMetadataValue(plug, staffUseConsumer));
                plug.setMetadata("gltc_ensure_spell_listeners", new FixedMetadataValue(plug, ensureConsumer));
            }
        } catch (eMetaBr) {
            // 已知：部分 Graal 版本 Plugin.setMetadata 不可用，上面 Map 已足够
        }
        if (GLTC_SHARED_ROOT_API && GLTC_SHARED_ROOT_API.publishGltcSharedRoot) {
            GLTC_SHARED_ROOT_API.publishGltcSharedRoot(sharedRoot);
        }
    } catch (eBridge) {
        Bukkit.getLogger().warning("[GLTC监听] 施术桥接失败: " + eBridge);
    }
    Bukkit.getLogger().info("[GLTC监听] 已单例加载 施术核心 v2");
})();

// ---------- 5) 施术道具 hooks + 技能登记（走 loader cache，避免重复裸 eval） ----------
(function preloadStaffHooks() {
    try {
        var loader = PLUGIN.gltcScriptLoader;
        if (loader && loader.evalScriptExport) {
            loader.evalScriptExport("施术道具/技能登记.js");
        } else {
            gltcEvalScript("施术道具/技能登记.js", false);
        }
    } catch (eSk) {}
    var staffCfg = null;
    try {
        var loader2 = PLUGIN.gltcScriptLoader;
        if (loader2 && loader2.evalScriptExport) staffCfg = loader2.evalScriptExport("施术道具/登记.js");
    } catch (eL) {}
    if (!staffCfg) staffCfg = gltcEvalScript("施术道具/登记.js", true);
    if (!staffCfg || typeof staffCfg.listHookScripts !== "function") {
        Bukkit.getLogger().warning("[GLTC监听] 施术道具登记未加载，hooks 跳过");
        return;
    }
    var paths = staffCfg.listHookScripts();
    var seen = {};
    for (var i = 0; i < paths.length; i++) {
        var rel = String(paths[i]);
        if (seen[rel]) continue;
        seen[rel] = true;
        try {
            var exp = null;
            var loader3 = PLUGIN.gltcScriptLoader;
            if (loader3 && loader3.evalScriptExport) exp = loader3.evalScriptExport(rel);
            else exp = gltcEvalScript(rel, true);
            if (exp && typeof exp.registerHuimoActivateBridge === "function") {
                exp.registerHuimoActivateBridge();
            }
        } catch (e1) {
            Bukkit.getLogger().warning("[GLTC监听] hook 预注册异常 " + rel + ": " + e1);
        }
    }
    Bukkit.getLogger().info("[GLTC监听] 施术道具 hooks 已预注册 (" + paths.length + ")");
})();

// ---------- 6) 异能武器：由 items.yml script 绑定加载，勿在此预加载 ----------
(function noteWeaponScripts() {
    Bukkit.getLogger().info("[GLTC监听] 异能武器改由 items.yml script 加载（避免重复注册监听器）");
})();
