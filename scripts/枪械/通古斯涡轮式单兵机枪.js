var DAMAGE = 14;
var RANGE = 30;
var COOLDOWN_MS = 5000;
var FIRE_INTERVAL_MS = 100;
var MAX_AMMO = 24;
var cdMap = new java.util.HashMap();
var ammoMap = new java.util.HashMap();
var lastFireMap = new java.util.HashMap();
var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;
var FluidCollisionMode = org.bukkit.FluidCollisionMode;
var blackDust = new DustOptions(Color.fromRGB(0, 0, 0), 0.7);
function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "FKR_通古斯涡轮式单兵机枪") return;

    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        var remaining = Math.ceil((COOLDOWN_MS - (now - cdMap.get(uuid))) / 1000);
        player.sendActionBar("§c再装填中..." + remaining + "秒");
        player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7, 1.0);
        return;
    }
    var ammo = ammoMap.containsKey(uuid) ? ammoMap.get(uuid) : MAX_AMMO;
    if (ammo <= 0) {
        cdMap.put(uuid, now);
        ammoMap.put(uuid, MAX_AMMO);
        player.sendActionBar("§c弹药耗尽，进入再装填...");
        var _player = player;
        var CloseTask = Java.extend(BukkitRunnable, { run: function() {
            if (_player.isOnline()) _player.getWorld().playSound(_player.getLocation(), "block.iron_door.close", 0.7, 1.0);
        }});
        new CloseTask().runTaskLater(plugin, Math.floor(COOLDOWN_MS / 50));
        return;
    }
    if (lastFireMap.containsKey(uuid) && (now - lastFireMap.get(uuid)) < FIRE_INTERVAL_MS) {
        return;
    }
    lastFireMap.put(uuid, now);
    ammo--;
    ammoMap.put(uuid, ammo);
    player.sendActionBar("§a剩余子弹: §f" + ammo + "§a/§f" + MAX_AMMO);
    var world = player.getWorld();
    var start = player.getEyeLocation();
    var dir = start.getDirection().normalize();
    var rayHit = world.rayTrace(
        start, dir, RANGE,
        FluidCollisionMode.NEVER, false, 0.3,
        function(ent) {
            return ent instanceof org.bukkit.entity.LivingEntity && ent !== player;
        }
    );
    var endDist = RANGE;
    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        endDist = start.toVector().distance(hitPos);
        var hitEntity = rayHit.getHitEntity();
        if (hitEntity != null) {
            hitEntity.setNoDamageTicks(0);
            hitEntity.damage(DAMAGE, player);
        }
    }
    var tracerLoc = start.clone();
    var stepVec = dir.clone().multiply(0.7);
    var steps = Math.floor(endDist / 0.7);
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.DUST, tracerLoc, 2, 0.02, 0.02, 0.02, 0, blackDust);
        tracerLoc.add(stepVec);
    }
    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        var hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
        world.spawnParticle(Particle.DUST, hitLoc, 8, 0.15, 0.15, 0.15, 0.05, blackDust);
        world.spawnParticle(Particle.SMOKE, hitLoc, 3, 0.1, 0.1, 0.1, 0.02);
    }
    world.playSound(start, "entity.generic.explode", 0.3, 1.8);
    world.playSound(start, "entity.firework_rocket.blast", 0.2, 1.5);
}

// 定时清理过期状态 map，防止长期在线玩家的条目无限膨胀
var _cleanupTask = Java.extend(BukkitRunnable, {
    run: function() {
        var _now = Date.now();
        var _cdIt = cdMap.entrySet().iterator();
        while (_cdIt.hasNext()) {
            var _e = _cdIt.next();
            if (_now - _e.getValue() > COOLDOWN_MS + 3000) _cdIt.remove();
        }
        var _lfIt = lastFireMap.entrySet().iterator();
        while (_lfIt.hasNext()) {
            var _e2 = _lfIt.next();
            if (_now - _e2.getValue() > FIRE_INTERVAL_MS + 5000) {
                ammoMap.remove(_e2.getKey()); // 长时间未射击，弹药状态一并重置
                _lfIt.remove();
            }
        }
    }
});
new _cleanupTask().runTaskTimer(plugin, 600, 600);
