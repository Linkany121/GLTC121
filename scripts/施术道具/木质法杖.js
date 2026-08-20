/**
 * VASA 木质法杖
 * - 站立右键：施术
 * - 蹲下右键：选术环
 * - 特效：施术后脚下小型蒸汽爆炸
 *
 * Graal 跨脚本无法调用挂在 Plugin 上的 JS API，
 * 因此在本脚本上下文内 eval 一次施术核心并本地缓存。
 * 选术环会话走 Metadata 上的 ConcurrentHashMap，多实例共享。
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

function loadCastApi() {
    // 每次确保拿到最新核心（脚本热更后旧缓存会失效）
    if (CAST_API && typeof CAST_API.handleStaffUse === "function") return true;

    var file = findCoreFile();
    if (!file) return false;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        var exported = (0, eval)(code);
        if (exported && typeof exported.handleStaffUse === "function") {
            CAST_API = exported;
            return true;
        }
    } catch (e2) {
        Bukkit.getLogger().warning("[GLTC木质法杖] 加载施术核心失败: " + e2);
    }
    return false;
}

loadCastApi();

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

    if (!loadCastApi()) {
        player.sendMessage(GLTC_PREFIX + "§c施术核心加载失败。");
        return;
    }
    CAST_API.handleStaffUse(player, {
        onAfterCast: function(p) { playSteamBurst(p); }
    });
}

function tick(info) {}
