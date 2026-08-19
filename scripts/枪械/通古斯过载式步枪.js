var SIT_PER_BULLET = 0.6;
var SIT_BEAM_MULT = 20;
var ABILITY_POWER_DEFAULT = 10;
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment";
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";
var DAMAGE_NOTIFY_DEFAULT = "chat";
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";
var RANGE = 60;
function getAbilityPower() {
    try { return getAddonConfig().getInt(ABILITY_POWER_CONFIG_KEY, ABILITY_POWER_DEFAULT); } catch (e) { return ABILITY_POWER_DEFAULT; }
}
function calcSitDamage(mult) { return mult * getAbilityPower(); }
function formatAbilityDamage(dmg) {
    var v = Math.round(dmg * 10) / 10;
    return (Math.abs(v - Math.round(v)) < 0.05) ? String(Math.round(v)) : v.toFixed(1);
}
function getWeaponDisplayName(item) {
    if (item == null) return "未知武器";
    try {
        var meta = item.getItemMeta();
        if (meta != null && meta.hasDisplayName()) return meta.getDisplayName();
    } catch (e) {}
    return "未知武器";
}
function getDamageNotifyMode() {
    try {
        var mode = String(getAddonConfig().getString(DAMAGE_NOTIFY_CONFIG_KEY, DAMAGE_NOTIFY_DEFAULT)).toLowerCase().trim();
        if (mode === "actionbar" || mode === "action_bar" || mode === "action" || mode === "物品栏上方") return "actionbar";
        if (mode === "none" || mode === "off" || mode === "hide" || mode === "不显示") return "none";
        if (mode === "chat" || mode === "聊天框") return "chat";
        return DAMAGE_NOTIFY_DEFAULT;
    } catch (e) {
        return DAMAGE_NOTIFY_DEFAULT;
    }
}
function notifyAbilityDamage(player, item, damage) {
    if (player == null || !player.isOnline()) return;
    var mode = getDamageNotifyMode();
    if (mode === "none") return;
    var msg = GLTC_DAMAGE_MSG_PREFIX + "使用 " + getWeaponDisplayName(item) + " §f造成 §c" + formatAbilityDamage(damage) + " §f伤害！";
    if (mode === "actionbar") {
        try { player.sendActionBar(msg); } catch (e) { player.sendMessage(msg); }
    } else {
        player.sendMessage(msg);
    }
}
function dealSitDamage(target, player, item, sitMult) {
    var dmg = calcSitDamage(sitMult);
    target.setNoDamageTicks(0);
    target.damage(dmg, player);
    notifyAbilityDamage(player, item, dmg);
    return dmg;
}
var COOLDOWN_MS = 5000;
var BULLET_INTERVAL = 2;
var MAX_BULLETS = 10;
var BEAM_RADIUS = 2.0;
var cdMap = new java.util.HashMap();
var firingMap = new java.util.HashMap();
var taskMap = new java.util.HashMap();
var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var Vector = org.bukkit.util.Vector;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
var FluidCollisionMode = org.bukkit.FluidCollisionMode;
var bulletDust = new DustOptions(Color.fromRGB(255, 180, 0), 1.0);
var beamCoreDust = new DustOptions(Color.fromRGB(255, 120, 0), 1.5);
var beamRingDust = new DustOptions(Color.fromRGB(255, 0, 0), 1.2);
function fireBullet(player, bulletIndex) {
    var world = player.getWorld();
    var item = player.getInventory().getItemInMainHand();
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
            dealSitDamage(hitEntity, player, item, SIT_PER_BULLET);
        }
    }
    var tracerLoc = start.clone();
    var stepVec = dir.clone().multiply(0.25);
    var steps = Math.floor(endDist / 0.25);
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.DUST, tracerLoc, 2, 0, 0, 0, 0, bulletDust);
        tracerLoc.add(stepVec);
    }
    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        var hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
        world.spawnParticle(Particle.DUST, hitLoc, 12, 0.15, 0.15, 0.15, 0.05, bulletDust);
        world.spawnParticle(Particle.SMOKE, hitLoc, 3, 0.1, 0.1, 0.1, 0.02);
    }
    var volume = 0.3 + (bulletIndex / 10) * 0.9; // 0.2→0.8
    var pitch = 0.4 + (bulletIndex / 10) * 1.6; // 0.5→2.0
    world.playSound(start, "block.respawn_anchor.charge", volume, pitch);
}
function fireBeam(player) {
    var world = player.getWorld();
    var item = player.getInventory().getItemInMainHand();
    var start = player.getEyeLocation();
    var dir = start.getDirection().normalize();
    var beamRadius = BEAM_RADIUS;
    var blockHit = world.rayTraceBlocks(start, dir, RANGE, FluidCollisionMode.NEVER, false);
    var endDist = RANGE;
    if (blockHit != null) {
        endDist = start.toVector().distance(blockHit.getHitPosition());
    }
    var endLoc = start.clone().add(dir.clone().multiply(endDist));
    var minX = Math.min(start.getX(), endLoc.getX()) - beamRadius;
    var minY = Math.min(start.getY(), endLoc.getY()) - beamRadius;
    var minZ = Math.min(start.getZ(), endLoc.getZ()) - beamRadius;
    var maxX = Math.max(start.getX(), endLoc.getX()) + beamRadius;
    var maxY = Math.max(start.getY(), endLoc.getY()) + beamRadius;
    var maxZ = Math.max(start.getZ(), endLoc.getZ()) + beamRadius;
    var queryCenter = new Location(
        world,
        (minX + maxX) / 2.0,
        (minY + maxY) / 2.0,
        (minZ + maxZ) / 2.0
    );
    var nearby = world.getNearbyEntities(
        queryCenter,
        (maxX - minX) / 2.0,
        (maxY - minY) / 2.0,
        (maxZ - minZ) / 2.0
    );
    var startVec = start.toVector();
    var it = nearby.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof org.bukkit.entity.LivingEntity) || ent === player) continue;
        var box = ent.getBoundingBox().expand(beamRadius);
        if (box.rayTrace(startVec, dir, endDist) == null) continue;
        dealSitDamage(ent, player, item, SIT_BEAM_MULT);
    }
    var anyVec = new Vector(0, 1, 0);
    if (Math.abs(dir.getX()) < 0.01 && Math.abs(dir.getZ()) < 0.01) {
        anyVec = new Vector(1, 0, 0);
    }
    var perp1 = dir.clone().crossProduct(anyVec).normalize();
    var perp2 = perp1.clone().crossProduct(dir).normalize();
    var ringPoints = 12;
    var ringRadius = 0.55;
    var ringOffsets = [];
    for (var j = 0; j < ringPoints; j++) {
        var angle = (j / ringPoints) * Math.PI * 2;
        ringOffsets.push(
            perp1.clone().multiply(Math.cos(angle) * ringRadius)
                .add(perp2.clone().multiply(Math.sin(angle) * ringRadius))
        );
    }
    var tracerLoc = start.clone();
    var stepVec = dir.clone().multiply(0.5);
    var steps = Math.floor(endDist / 0.5);
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.DUST, tracerLoc, 3, 0, 0, 0, 0, beamCoreDust);
        if (i % 4 === 0) {
            world.spawnParticle(Particle.ELECTRIC_SPARK, tracerLoc, 15, 0.4, 0.4, 0.4, 0);
        }
        for (var j = 0; j < ringPoints; j++) {
            var circlePoint = tracerLoc.clone().add(ringOffsets[j]);
            world.spawnParticle(Particle.DUST, circlePoint, 1, 0, 0, 0, 0, beamRingDust);
        }
        tracerLoc.add(stepVec);
    }
    var waveSteps = Math.floor(endDist / 1.0);
    var waveLoc = start.clone();
    var waveStepVec = dir.clone().multiply(1.0);
    for (var w = 0; w < waveSteps; w++) {
        world.spawnParticle(Particle.SONIC_BOOM, waveLoc, 1, 0, 0, 0, 0);
        waveLoc.add(waveStepVec);
    }
    if (blockHit != null) {
        var hitPos = blockHit.getHitPosition();
        var hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
        world.spawnParticle(Particle.DUST, hitLoc, 25, 0.3, 0.3, 0.3, 0.15, beamCoreDust);
        world.spawnParticle(Particle.ELECTRIC_SPARK, hitLoc, 40, 0.4, 0.4, 0.4, 0.15);
        world.spawnParticle(Particle.EXPLOSION, hitLoc, 3, 0.5, 0.5, 0.5, 0.1);
    }
    world.spawnParticle(Particle.DUST, start, 25, 0.2, 0.2, 0.2, 0, beamCoreDust);
    world.spawnParticle(Particle.ELECTRIC_SPARK, start, 10, 0.15, 0.15, 0.15, 0.08);
    world.playSound(start, "block.beacon.activate", 3.0, 0.6);
    world.playSound(start, "item.mace.smash_ground_heavy", 3.0, 1.0);
}
function adjustPitch(player, degrees) {
    if (player == null || !player.isOnline()) return;
    var loc = player.getLocation();
    loc.setPitch(loc.getPitch() - degrees);
    player.teleport(loc);
}
function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "FKR_通古斯过载式步枪") return;
    var uuid = player.getUniqueId().toString();
    if (firingMap.containsKey(uuid)) {
        firingMap.remove(uuid);
        cdMap.put(uuid, Date.now());
        var task = taskMap.remove(uuid);
        if (task != null) { try { task.cancel(); } catch(e) {} }
        player.sendActionBar("§c中止，进入再装填...");
        var _p1 = player;
        var CloseTask1 = Java.extend(BukkitRunnable, { run: function() {
            if (_p1.isOnline()) _p1.getWorld().playSound(_p1.getLocation(), "block.iron_door.close", 0.7, 1.0);
        }});
        new CloseTask1().runTaskLater(plugin, Math.floor(COOLDOWN_MS / 50));
        return;
    }
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        var remaining = Math.ceil((COOLDOWN_MS - (now - cdMap.get(uuid))) / 1000);
        player.sendActionBar("§c再装填中..." + remaining + "秒");
        player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7, 1.0);
        return;
    }
    firingMap.put(uuid, true);
    player.sendActionBar("§e进入充能！");
    var bulletCount = 0;
    var _player = player;
    var _uuid = uuid;
    var FireTask = Java.extend(BukkitRunnable, {
        run: function() {
            // 玩家中途下线：立即终止任务并清理状态，避免闭包引用失效实体持续空转
            if (_player == null || !_player.isOnline()) {
                firingMap.remove(_uuid);
                var _t = taskMap.remove(_uuid);
                if (_t != null) { try { _t.cancel(); } catch(e) {} }
                return;
            }
            if (!firingMap.containsKey(_uuid)) return;
            if (bulletCount < MAX_BULLETS) {
                fireBullet(_player, bulletCount);
                bulletCount++;
                _player.sendActionBar("§e充能射击中 §f" + bulletCount + "§e/§f" + MAX_BULLETS);
            } else {
                firingMap.remove(_uuid);
                fireBeam(_player);
                adjustPitch(_player, 3);
                cdMap.put(_uuid, Date.now());
                _player.sendActionBar("§c已完全激发光束脉冲，进入再装填...");
                var _p2 = _player;
                var CloseTask2 = Java.extend(BukkitRunnable, { run: function() {
                    if (_p2.isOnline()) _p2.getWorld().playSound(_p2.getLocation(), "block.iron_door.close", 0.7, 1.0);
                }});
                new CloseTask2().runTaskLater(plugin, Math.floor(COOLDOWN_MS / 50));
                var task = taskMap.remove(_uuid);
                if (task != null) { try { task.cancel(); } catch(e) {} }
            }
        }
    });
    var bukkitTask = new FireTask().runTaskTimer(plugin, 0, BULLET_INTERVAL);
    taskMap.put(uuid, bukkitTask);
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
new _cdCleanup().runTaskTimer(plugin, 400, 400);