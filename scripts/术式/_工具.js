/**
 * 术式共用工具（由各术式脚本自行 eval 或复制使用）
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");

function getPlugin() {
    return Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
}

function spawnDust(world, loc, r, g, b, count, size) {
    try {
        world.spawnParticle(Particle.DUST, loc, count, 0.05, 0.05, 0.05, 0,
            new Particle.DustOptions(Color.fromRGB(r, g, b), size || 1.0));
    } catch (e) {
        try { world.spawnParticle(Particle.CRIT, loc, count, 0.1, 0.1, 0.1, 0.01); } catch (e2) {}
    }
}

function rayHitLiving(player, start, dir, maxDist, step) {
    var world = player.getWorld();
    var steps = Math.ceil(maxDist / step);
    for (var i = 1; i <= steps; i++) {
        var loc = start.clone().add(dir.clone().multiply(i * step));
        var near = world.getNearbyEntities(loc, 0.55, 0.55, 0.55);
        var it = near.iterator();
        while (it.hasNext()) {
            var ent = it.next();
            if (ent instanceof LivingEntity && ent !== player) return { entity: ent, loc: loc };
        }
    }
    return null;
}

({
    getPlugin: getPlugin,
    spawnDust: spawnDust,
    rayHitLiving: rayHitLiving
});
