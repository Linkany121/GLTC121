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
var MAGE_API = null;
function gltcEvalScript(relativePath, captureExport) {
    return gltcEvalScriptEx(relativePath, captureExport, false);
}
/** isolated=true 时用 IIFE 包裹，避免多武器脚本共用全局 var 互相覆盖 */
function gltcEvalScriptEx(relativePath, captureExport, isolated) {
    var rel = String(relativePath).replace(/\\/g, "/");
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + rel),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + rel)
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) {
                    candidates.push(new File(list[i].getAbsolutePath() + "/scripts/" + rel));
                }
            }
        }
    } catch (e) {}
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
    MAGE_API = exported;
    try { PLUGIN.gltcMageApi = exported; } catch (e0) {}
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
                        var api = PLUGIN.gltcMageApi != null ? PLUGIN.gltcMageApi : MAGE_API;
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
                var api = PLUGIN.gltcMageApi != null ? PLUGIN.gltcMageApi : MAGE_API;
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
                // 粒子折射：仅术式造成的粒子伤害（须带 gltc_spell_particle_hit）
                if (isSpellParticle) {
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

// ---------- 3) 术式工具单例（须在施术核心之前，供 Java 桥跨上下文调用） ----------
(function preloadSpellUtil() {
    var util = gltcEvalScript("术式/_工具.js", true);
    if (util && util.ensureSpellDamageListener) {
        try { util.ensureSpellDamageListener(); } catch (eDmg) {}
        Bukkit.getLogger().info("[GLTC监听] 已预加载 术式/_工具.js（Java 桥已就绪）");
    } else {
        Bukkit.getLogger().warning("[GLTC监听] 术式/_工具.js 预加载失败");
    }
})();

// ---------- 4) 施术核心单例：只在本上下文 eval 一次并挂监听 ----------
// Graal 不能跨上下文调 JS 函数；道具脚本勿再 eval 核心，只写 gltc_staff_hooks_map（Java Consumer）。
// 术式/_工具.js 已在上方预加载并写入 PLUGIN.gltcSpellUtilBridge
(function setupSpellCoreSingleton() {
    var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
    var inst = RSC.INSTANCE;
    var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");
    // 共享根须在 eval 施术核心之前创建（Java CHM 跨 Graal 上下文同引用）
    try {
        if (inst != null && (inst.gltcSharedMaps == null || !(inst.gltcSharedMaps instanceof CHM))) {
            inst.gltcSharedMaps = new CHM();
        }
        if (inst != null && inst.gltcSharedMaps != null) {
            PLUGIN.gltcSharedMaps = inst.gltcSharedMaps;
        }
    } catch (eRoot) {
        Bukkit.getLogger().warning("[GLTC监听] gltcSharedMaps 初始化失败: " + eRoot);
    }
    var castApi = gltcEvalScript("施术道具/施术核心.js", true);
    if (!castApi || typeof castApi.handleStaffUse !== "function") {
        Bukkit.getLogger().warning("[GLTC监听] 施术核心预加载失败；将由首个施术道具脚本兜底 eval");
        return;
    }
    try { PLUGIN.gltcCastApi = castApi; } catch (e0) {}
    try { PLUGIN.gltcCastApiOwner = "listener"; } catch (e1) {}
    try {
        var inst = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
        if (inst != null) {
            inst.gltcCastApi = castApi;
            inst.gltcCastApiOwner = "listener";
        }
    } catch (eInst) {}
    try {
        if (typeof castApi.ensureListeners === "function") castApi.ensureListeners(true);
    } catch (eEns) {
        Bukkit.getLogger().warning("[GLTC监听] 施术核心 ensureListeners 失败: " + eEns);
    }
    // 右键桥写入 gltcSharedMaps（道具 onUse 跨 Graal 上下文读 Java Map）
    try {
        var sharedRoot = inst != null ? inst.gltcSharedMaps : null;
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
                } catch (eEn) {
                    try { Bukkit.getLogger().warning("[GLTC监听] ensureListeners: " + eEn); } catch (eLog2) {}
                }
            }
        }))();
        sharedRoot.put("handleStaffUse", staffUseConsumer);
        sharedRoot.put("ensureListeners", ensureConsumer);
        bridgeMap.put("handleStaffUse", staffUseConsumer);
        bridgeMap.put("ensureListeners", ensureConsumer);
        bridgeMap.put("interactReady", java.lang.Boolean.TRUE);
        bridgeMap.put("listenerVer", java.lang.Long.parseLong("38", 10));
        if (inst != null) {
            inst.gltcSharedMaps = sharedRoot;
            inst.gltcHandleStaffUseConsumer = staffUseConsumer;
            inst.gltcEnsureSpellCoreListeners = ensureConsumer;
            inst.gltc_spell_core_bridge_map = bridgeMap;
        }
        PLUGIN.gltcSharedMaps = sharedRoot;
        PLUGIN.gltcHandleStaffUseConsumer = staffUseConsumer;
        PLUGIN.gltcEnsureSpellCoreListeners = ensureConsumer;
        PLUGIN.gltc_spell_core_bridge_map = bridgeMap;
    } catch (eBridge) {
        Bukkit.getLogger().warning("[GLTC监听] 施术桥接失败: " + eBridge);
    }
    // 辉墨摇篮「光影废墟」activator 槽位（由 施术道具/辉墨摇篮.js 写入 Java Object 桥）
    try {
        if (sharedRoot != null && sharedRoot.get("gltc_huimo_activator") == null) {
            sharedRoot.put("gltc_huimo_activator_pending", java.lang.Boolean.TRUE);
        }
    } catch (eHuimo) {}
    Bukkit.getLogger().info("[GLTC监听] 已单例加载 施术核心（gltcSharedMaps 桥已就绪）");
})();

// ---------- 4) 异能武器：由 items.yml script 绑定加载，勿在此预加载 ----------
// 若在监听中 eval 武器脚本，会与 RSC 物品脚本各注册一套 registerEvent，导致技能触发两次。
(function noteWeaponScripts() {
    Bukkit.getLogger().info("[GLTC监听] 异能武器改由 items.yml script 加载（避免重复注册监听器）");
})();
