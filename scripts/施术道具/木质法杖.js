/**
 * VASA 木质施术道具
 * - 站立右键：施术
 * - 蹲下右键：选术环
 * - 特效：施术后脚下小型蒸汽爆炸
 *
 * Graal 跨脚本不能安全复用他上下文的 JS API。
 * 必须在本脚本上下文 eval 施术核心；PLUGIN.gltcCastApi 只作对外标记。
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var Player = Java.type("org.bukkit.entity.Player");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var STAFF_ID = "VASA_木质法杖";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var C_MSG = "§x§f§f§f§5§b§3";
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var CAST_API = null;

function findCoreFile() {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/施术道具/施术核心.js"),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/施术道具/施术核心.js")
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) {
                    candidates.push(new File(list[i], "scripts/施术道具/施术核心.js"));
                }
            }
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists()) return candidates[c];
    }
    return null;
}

function ensureCoreListeners() {
    try {
        if (CAST_API && typeof CAST_API.ensureListeners === "function") {
            var needForce = false;
            try {
                if (PLUGIN.gltcSpellCoreListener == null) needForce = true;
                else if (Number(PLUGIN.gltcSpellCoreListenerVer) < 13) needForce = true;
            } catch (eV) {}
            CAST_API.ensureListeners(needForce);
        }
    } catch (e) {}
}

/** 始终在本上下文 eval；禁止直接拿他上下文的 PLUGIN.gltcCastApi 当函数用 */
function loadCastApi(forceReload) {
    if (!forceReload && CAST_API && typeof CAST_API.handleStaffUse === "function") {
        return true;
    }
    var file = findCoreFile();
    if (!file) return false;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        var exported = (0, eval)(code);
        if (exported && typeof exported.handleStaffUse === "function") {
            CAST_API = exported;
            try { PLUGIN.gltcCastApi = exported; } catch (e1) {}
            return true;
        }
    } catch (e2) {
        Bukkit.getLogger().warning("[GLTC木质施术道具] 加载施术核心失败: " + e2);
    }
    return false;
}

loadCastApi(true);
ensureCoreListeners();

function playSteamBurst(player) {
    var world = player.getWorld();
    var loc = player.getLocation().add(0, 0.15, 0);
    try {
        world.spawnParticle(Particle.CLOUD, loc, 28, 0.35, 0.12, 0.35, 0.04);
        world.spawnParticle(Particle.WHITE_SMOKE, loc, 18, 0.25, 0.08, 0.25, 0.02);
    } catch (e) {
        try { world.spawnParticle(Particle.SMOKE_NORMAL, loc, 20, 0.3, 0.1, 0.3, 0.02); } catch (e2) {}
    }
    try {
        world.playSound(loc, Sound.BLOCK_FIRE_EXTINGUISH, 0.7, 1.35);
        world.playSound(loc, Sound.ENTITY_GENERIC_EXTINGUISH_FIRE, 0.45, 1.1);
    } catch (e3) {}
}

function registerHooks() {
    if (!loadCastApi(false)) return false;
    try {
        CAST_API.registerStaffHooks(STAFF_ID, {
            onAfterCast: function (p) { playSteamBurst(p); }
        });
        return true;
    } catch (e) {
        return false;
    }
}
registerHooks();
try {
    Bukkit.getScheduler().runTaskLater(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            // 勿 forceReload：重复 eval 会清环状态并换监听上下文
            if (!CAST_API) loadCastApi(true);
            ensureCoreListeners();
            registerHooks();
        }
    }))(), 40);
} catch (eDelay) {}

function shouldSkipStaffOnUseLocal(player) {
    try {
        if (PLUGIN.gltcSpellCoreListener != null) return true;
    } catch (e0) {}
    try {
        var f = PLUGIN.gltcSpellCoreInteractReady;
        if (f === true) return true;
        if (f != null && typeof f.booleanValue === "function" && f.booleanValue()) return true;
    } catch (e1) {}
    try {
        var tickMap = PLUGIN.gltc_staff_interact_use_tick;
        if (tickMap != null && player != null) {
            var gk = java.lang.String.valueOf(String(player.getUniqueId().toString()));
            var tick = Number(Bukkit.getCurrentTick());
            var last = tickMap.get(gk);
            if (last != null && Number(last) === tick) return true;
        }
    } catch (e2) {}
    return false;
}

/**
 * SF onUse：Interact 丢失时的兜底。监听在则永不处理，防 Interact+onUse 双开环。
 */
function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(item);
        if (!sf || sf.getId() !== STAFF_ID) return;
    } catch (e2) { return; }

    if (shouldSkipStaffOnUseLocal(player)) return;

    if (!loadCastApi(false)) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "施术核心加载失败。");
        return;
    }
    ensureCoreListeners();
    try {
        CAST_API.handleStaffUse(player, {
            onAfterCast: function (p) { playSteamBurst(p); }
        });
    } catch (eUse) {
        try {
            player.sendMessage(GLTC_PREFIX + C_MSG + "施术调用异常，请重载插件。");
            Bukkit.getLogger().warning("[GLTC木质施术道具] onUse: " + eUse);
        } catch (eLog) {}
    }
}

function tick(info) {}
