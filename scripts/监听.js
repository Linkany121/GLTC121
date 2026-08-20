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
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + relativePath),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + relativePath)
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) {
                    candidates.push(new File(list[i], "scripts/" + relativePath));
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
                    try { MAGE_API.applyMageAttributes(p); } catch (e) {}
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
                // 脉冲伤害：不吃粒子折射、不吃最终减伤
                if (MAGE_API.isPulseDamage && MAGE_API.isPulseDamage(entity)) return;

                var stats = MAGE_API.getTotalStats(entity, false);
                var dmg = event.getDamage();

                var cause = event.getCause();
                var causeName = cause ? cause.name() : "";
                if (causeName === "SONIC_BOOM" || causeName === "MAGIC" || causeName === "INDIRECT_MAGIC") {
                    var refract = stats.particleRefraction || 0;
                    if (refract > 0) dmg = dmg * (1 - Math.min(0.95, refract));
                }

                // 最终减伤：普通 + 粒子 都吃；脉冲已在上方跳过
                var fdr = stats.finalDamageReduction || 0;
                if (fdr > 0) dmg = dmg * (1 - Math.min(0.95, fdr));

                if (dmg < 0) dmg = 0;
                event.setDamage(dmg);
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getLogger().info("[GLTC监听] 已加载 术士系统");
})();

// ---------- 3) 施术核心：仅由法杖脚本本上下文 eval（Graal 无法跨脚本调 JS API）----------
(function setupSpellCoreNote() {
    Bukkit.getLogger().info("[GLTC监听] 施术核心改由法杖脚本加载（避免双上下文状态分裂）");
})();
