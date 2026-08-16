var DAMAGE = 100;
var COOLDOWN_MS = 5000;
var RANGE = 50;
var BLAST_RADIUS = 5;
var DROP_HEIGHT = 30;
var DROP_SPEED = -5;
var PLUGIN = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var FluidCollisionMode = org.bukkit.FluidCollisionMode;
var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var Vector = org.bukkit.util.Vector;
var cdMap = new java.util.HashMap();
function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "FKR_通古斯制式轨道信标投递器") return;

    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        player.sendActionBar("§c装填中...");
        player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7, 1.0);
        return;
    }
    cdMap.put(uuid, now);
    var _player = player;
    var CloseTask = Java.extend(BukkitRunnable, { run: function() {
        if (_player.isOnline()) _player.getWorld().playSound(_player.getLocation(), "block.iron_door.close", 0.7, 1.0);
    }});
    new CloseTask().runTaskLater(PLUGIN, Math.floor(COOLDOWN_MS / 50));
    var world = player.getWorld();
    var eyeLoc = player.getEyeLocation();
    var dir = eyeLoc.getDirection();
    var rayHit = world.rayTrace(
        eyeLoc, dir, RANGE,
        FluidCollisionMode.NEVER,
        false, 0.3,
        function(ent) {
            return ent instanceof org.bukkit.entity.LivingEntity && ent !== player;
        }
    );
    var hitPoint;
    var hitEntity = null;
    if (rayHit != null) {
        var hitVec = rayHit.getHitPosition();
        hitPoint = new Location(world, hitVec.getX(), hitVec.getY(), hitVec.getZ());
        hitEntity = rayHit.getHitEntity();
    } else {
        hitPoint = eyeLoc.clone().add(dir.clone().multiply(RANGE));
    }
    if (hitEntity != null) {
        hitEntity.setNoDamageTicks(0);
        hitEntity.damage(DAMAGE, player);
    }
    var targets = world.getNearbyEntities(hitPoint, BLAST_RADIUS, BLAST_RADIUS, BLAST_RADIUS);
    var count = 0;
    var it = targets.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (ent instanceof org.bukkit.entity.LivingEntity && ent !== player) {
            ent.setNoDamageTicks(0);
            ent.damage(DAMAGE, player);
            count++;
        }
    }
    for (var i = 0; i < 3; i++) {
        var offsetX = (Math.random() - 0.5) * 2.0;
        var offsetZ = (Math.random() - 0.5) * 2.0;
        var strikeLoc = hitPoint.clone().add(offsetX, 0, offsetZ);
        world.strikeLightningEffect(strikeLoc);
    }
    world.spawnParticle(Particle.EXPLOSION, hitPoint, 170, 3, 3, 3, 1);
    world.spawnParticle(Particle.FLAME, hitPoint, 120, 1.5, 1.5, 1.5, 0.5);
    world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, hitPoint, 180, 0.5, 0.5, 0.5, 0.1);
    world.playSound(hitPoint, "entity.generic.explode", 2.2, 0.7);
    world.playSound(hitPoint, "entity.lightning_bolt.thunder", 2.0, 1.0);
    var spawnLoc = hitPoint.clone().add(0, DROP_HEIGHT, 0);
    var fireball = world.spawn(spawnLoc, org.bukkit.entity.Fireball.class);
    fireball.setShooter(player);
    fireball.setVelocity(new Vector(0, DROP_SPEED, 0));
    fireball.setIsIncendiary(false);
    fireball.setYield(0);
    fireball.setGravity(false);
    var RemoveTask = Java.extend(BukkitRunnable, {
        run: function() {
            if (fireball.isValid()) fireball.remove();
        }
    });
    new RemoveTask().runTaskLater(PLUGIN, 20);
    world.spawnParticle(Particle.FLAME, eyeLoc, 10, 0.1, 0.1, 0.1, 0.05);
    world.playSound(eyeLoc, "entity.blaze.shoot", 0.5, 1.5);

    player.sendMessage(
        "§f[§x§f§f§0§0§e§fG§x§d§b§1§7§f§1L§x§b§6§2§e§f§4T§x§9§2§4§5§f§6C" +
        "§x§6§d§5§d§f§8联§x§4§9§7§4§f§a合§x§2§4§8§b§f§d协§x§0§0§a§2§f§f议§f]" +
        "§x§f§f§f§5§b§3成功对范围内 §e" + count + " §x§f§f§f§5§b§3个目标造成 §c" + DAMAGE + " §x§f§f§f§5§b§3伤害！"
    );
}

// 定时清理已过期的冷却记录，防止 cdMap 长期膨胀
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
new _cdCleanup().runTaskTimer(PLUGIN, 400, 400);