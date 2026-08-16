var DAMAGE = 15;
var COOLDOWN_MS = 500;
var RANGE = 40;
var cdMap = new java.util.HashMap();
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
var _cdCleanup = Java.extend(BukkitRunnable, {
    run: function() {
        var _now = Date.now();
        var _it = cdMap.entrySet().iterator();
        while (_it.hasNext()) {
            var _e = _it.next();
            if (_now - _e.getValue() > COOLDOWN_MS) _it.remove();
        }
    }
});
new _cdCleanup().runTaskTimer(plugin, 400, 400);
var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;
var blackDust = new DustOptions(Color.fromRGB(0, 0, 0), 0.7);
function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "FKR_通古斯制式步枪") return;
    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        player.sendActionBar("§c射击过于频繁！");
        player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7, 1.0);
        return;
    }
    cdMap.put(uuid, now);
    var _player = player;
    var CloseTask = Java.extend(BukkitRunnable, { run: function() {
        if (_player.isOnline()) _player.getWorld().playSound(_player.getLocation(), "block.iron_door.close", 0.7, 1.0);
    }});
    new CloseTask().runTaskLater(plugin, Math.floor(COOLDOWN_MS / 50));
    var world = player.getWorld();
    var start = player.getEyeLocation();
    var dir = start.getDirection().normalize();
    var rayHit = world.rayTrace(
        start, dir, RANGE,
        org.bukkit.FluidCollisionMode.NEVER,
        false, 0.3,
        function(ent) {
            return ent instanceof org.bukkit.entity.LivingEntity && ent !== player;
        }
    );
    var endDist = RANGE;
    var hitEntity = null;
    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        endDist = start.toVector().distance(hitPos);
        hitEntity = rayHit.getHitEntity();
        if (hitEntity != null) {
            hitEntity.setNoDamageTicks(0);
            hitEntity.damage(DAMAGE, player);
        }
    }
    var tracerLoc = start.clone();
    var stepVec = dir.clone().multiply(0.7);
    var steps = Math.floor(endDist / 0.7);
    var particleCountPerPoint = 2;
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.DUST, tracerLoc, particleCountPerPoint, 0.02, 0.02, 0.02, 0, blackDust);
        tracerLoc.add(stepVec);
    }
    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        var hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
        world.spawnParticle(Particle.DUST, hitLoc, 12, 0.15, 0.15, 0.15, 0.05, blackDust);
        world.spawnParticle(Particle.SMOKE, hitLoc, 5, 0.1, 0.1, 0.1, 0.02);
    }
    world.playSound(start, "entity.generic.explode", 0.5, 1.5);
    world.playSound(start, "entity.firework_rocket.blast", 0.3, 1.3);
}