/**
 * 术式：水箭 —— 持续 1 秒射线，每 0.2 秒系数 0.3
 * 物品/术式 ID：VASA_水箭
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var Color = Java.type("org.bukkit.Color");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

function loadUtil() {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/术式/_工具.js"),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/术式/_工具.js")
    ];
    for (var c = 0; c < candidates.length; c++) {
        if (!candidates[c].exists()) continue;
        try {
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(candidates[c].toPath()))).toString();
            return (0, eval)(code);
        } catch (e) {}
    }
    return null;
}

var UTIL = loadUtil();

function spawnDust(world, loc, r, g, b, count, size) {
    if (UTIL && UTIL.spawnDust) return UTIL.spawnDust(world, loc, r, g, b, count, size);
}

function rayHitLiving(player, start, dir, maxDist, step) {
    if (UTIL && UTIL.rayHitLiving) return UTIL.rayHitLiving(player, start, dir, maxDist, step);
    return null;
}

({
    id: "VASA_水箭",
    name: "水箭",
    ring: 1,
    cost: 4,
    cooldownMs: 2200,
    book: true,
    cast: function(player, mageApi) {
        var uuid = player.getUniqueId().toString();
        try { player.getWorld().playSound(player.getEyeLocation(), Sound.ENTITY_PLAYER_SPLASH, 0.7, 1.3); } catch (e) {}

        for (var pulse = 0; pulse < 5; pulse++) {
            (function(delayTicks) {
                Bukkit.getScheduler().runTaskLater(PLUGIN, new (Java.extend(java.lang.Runnable, {
                    run: function() {
                        try {
                            var p = null;
                            try {
                                var online = Bukkit.getOnlinePlayers().toArray();
                                for (var oi = 0; oi < online.length; oi++) {
                                    if (online[oi].getUniqueId().toString() === uuid) { p = online[oi]; break; }
                                }
                            } catch (pe) {}
                            if (p == null || !p.isOnline()) return;
                            var world = p.getWorld();
                            var eye = p.getEyeLocation();
                            var dir = eye.getDirection().normalize();
                            var dmg = mageApi.calcSpellDamage(p, 0.3);
                            for (var i = 1; i <= 16; i++) {
                                var pl = eye.clone().add(dir.clone().multiply(i * 0.45));
                                try { world.spawnParticle(Particle.BUBBLE, pl, 2, 0.02, 0.02, 0.02, 0.01); } catch (b1) {
                                    try { world.spawnParticle(Particle.WATER_BUBBLE, pl, 2, 0.02, 0.02, 0.02, 0.01); } catch (b2) {}
                                }
                                spawnDust(world, pl, 80, 180, 255, 1, 0.7);
                            }
                            var hit = rayHitLiving(p, eye, dir, 7.2, 0.45);
                            if (hit) {
                                try { hit.entity.damage(dmg, p); } catch (e2) { try { hit.entity.damage(dmg); } catch (e3) {} }
                                try { world.playSound(hit.loc, Sound.ENTITY_PLAYER_SPLASH_HIGH_SPEED, 0.35, 1.5); } catch (e4) {}
                            }
                        } catch (ex) {}
                    }
                })), delayTicks);
            })(pulse * 4);
        }
        return true;
    }
});
