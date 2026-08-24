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
                        if (api && typeof api.refillParticlesToCap === "function") api.refillParticlesToCap(p);
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

                var cause = event.getCause();
                var causeName = cause ? cause.name() : "";
                var isSpellParticle = false;
                try { isSpellParticle = entity.hasMetadata("gltc_spell_particle_hit"); } catch (eSp) {}
                // 粒子折射：仅术式粒子伤害（SONIC_BOOM / 术式标记）
                if (isSpellParticle || causeName === "SONIC_BOOM") {
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

// ---------- 3) 施术核心：仅由施术道具脚本本上下文 eval（Graal 无法跨脚本调 JS API）----------
(function setupSpellCoreNote() {
    Bukkit.getLogger().info("[GLTC监听] 施术核心改由施术道具脚本加载（避免双上下文状态分裂）");
})();

// ---------- 4) 异能武器：隔离预加载 registerEvent（IIFE 防 ITEM_ID 污染；非全局路由）----------
(function preloadWeaponScripts() {
    var weaponScripts = [
        "武器/伏地.js",
        "武器/风墟龙冕.js",
        "武器/破军.js",
        "武器/隐兰狂玉唤剑葫.js",
        "武器/咀梦.js",
        "武器/ASPL.js"
    ];
    for (var wi = 0; wi < weaponScripts.length; wi++) {
        try {
            if (gltcEvalScriptEx(weaponScripts[wi], false, true)) {
                Bukkit.getLogger().info("[GLTC监听] 已预加载 " + weaponScripts[wi]);
            }
        } catch (eW) {
            Bukkit.getLogger().warning("[GLTC监听] 预加载失败 " + weaponScripts[wi] + ": " + eW);
        }
    }
})();
