/**
 * 术式：火球术 —— 单发火球，系数 1.0
 * 物品/术式 ID：VASA_火球术
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
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
    try {
        world.spawnParticle(Particle.DUST, loc, count, 0.05, 0.05, 0.05, 0,
            new Particle.DustOptions(Color.fromRGB(r, g, b), size || 1.0));
    } catch (e) {}
}

({
    id: "VASA_火球术",
    name: "火球术",
    ring: 1,
    cost: 3,
    cooldownMs: 1600,
    book: true,
    cast: function(player, mageApi) {
        var world = player.getWorld();
        var eye = player.getEyeLocation();
        var dir = eye.getDirection().normalize();
        var dmg = mageApi.calcSpellDamage(player, 1.0);
        var loc = eye.clone().add(dir.clone().multiply(0.8));
        var uuid = player.getUniqueId().toString();
        var ticks = 0;
        var maxTicks = 40;
        var speed = 0.85;
        try { world.playSound(eye, Sound.ENTITY_BLAZE_SHOOT, 0.7, 1.05); } catch (e) {}

        var task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    ticks++;
                    loc.add(dir.getX() * speed, dir.getY() * speed, dir.getZ() * speed);
                    world.spawnParticle(Particle.FLAME, loc, 8, 0.08, 0.08, 0.08, 0.01);
                    try { world.spawnParticle(Particle.SMOKE, loc, 2, 0.05, 0.05, 0.05, 0.01); } catch (sm) {
                        try { world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, loc, 2, 0.05, 0.05, 0.05, 0.01); } catch (sm2) {}
                    }
                    spawnDust(world, loc, 255, 120, 40, 4, 1.1);

                    var near = world.getNearbyEntities(loc, 0.65, 0.65, 0.65);
                    var it = near.iterator();
                    while (it.hasNext()) {
                        var ent = it.next();
                        if (ent instanceof LivingEntity && !(ent instanceof Player && ent.getUniqueId().toString() === uuid)) {
                            try { ent.damage(dmg, player); } catch (e2) { try { ent.damage(dmg); } catch (e3) {} }
                            try { world.spawnParticle(Particle.EXPLOSION, loc, 1, 0, 0, 0, 0); } catch (e4) {
                                try { world.spawnParticle(Particle.EXPLOSION_LARGE, loc, 1, 0, 0, 0, 0); } catch (e5) {}
                            }
                            try { world.playSound(loc, Sound.ENTITY_GENERIC_EXPLODE, 0.55, 1.3); } catch (e6) {}
                            try { task.cancel(); } catch (e7) {}
                            return;
                        }
                    }
                    if (ticks >= maxTicks || loc.getBlock().getType().isSolid()) {
                        try { world.spawnParticle(Particle.FLAME, loc, 20, 0.25, 0.25, 0.25, 0.02); } catch (e8) {}
                        try { task.cancel(); } catch (e9) {}
                    }
                } catch (ex) {
                    try { task.cancel(); } catch (e10) {}
                }
            }
        })), 0, 1);
        return true;
    }
});
