// ===================================================================
// 通古斯过载式步枪（反卫星）· 可调配置
// 最终伤害 = 系数 × 异能强度(SIT)；改完重载脚本生效
// ===================================================================
var Bukkit = Java.type("org.bukkit.Bukkit");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Material = Java.type("org.bukkit.Material");
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var FluidCollisionMode = Java.type("org.bukkit.FluidCollisionMode");
var plugin = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
var ABILITY_POWER_DEFAULT = 10;
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment";
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";
var DAMAGE_NOTIFY_DEFAULT = "chat";
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";
function getAbilityPower() { try { return getAddonConfig().getInt(ABILITY_POWER_CONFIG_KEY, ABILITY_POWER_DEFAULT); } catch (e) { return ABILITY_POWER_DEFAULT; } }
function calcSitDamage(mult) { return mult * getAbilityPower(); }
function formatAbilityDamage(dmg) { var v = Math.round(dmg * 10) / 10; return (Math.abs(v - Math.round(v)) < 0.05) ? String(Math.round(v)) : v.toFixed(1); }
function getGunDisplayName(item) { if (item == null) return "未知武器"; try { var meta = item.getItemMeta(); if (meta != null && meta.hasDisplayName()) return meta.getDisplayName(); } catch (e) {} return "未知武器"; }
function getDamageNotifyMode() { try { var mode = String(getAddonConfig().getString(DAMAGE_NOTIFY_CONFIG_KEY, DAMAGE_NOTIFY_DEFAULT)).toLowerCase().trim(); if (mode === "actionbar" || mode === "action_bar" || mode === "action" || mode === "物品栏上方") return "actionbar"; if (mode === "none" || mode === "off" || mode === "hide" || mode === "不显示") return "none"; if (mode === "chat" || mode === "聊天框") return "chat"; return DAMAGE_NOTIFY_DEFAULT; } catch (e) { return DAMAGE_NOTIFY_DEFAULT; } }
function notifyAbilityDamage(player, item, damage) { if (player == null || !player.isOnline()) return; var mode = getDamageNotifyMode(); if (mode === "none") return; var msg = GLTC_DAMAGE_MSG_PREFIX + "使用 " + getGunDisplayName(item) + " §f造成 §c" + formatAbilityDamage(damage) + " §f伤害！"; if (mode === "actionbar") { try { player.sendActionBar(msg); } catch (e) { player.sendMessage(msg); } } else { player.sendMessage(msg); } }
function dealSitDamage(target, player, item, sitMult) { var dmg = calcSitDamage(sitMult); target.setNoDamageTicks(0); target.damage(dmg, player); notifyAbilityDamage(player, item, dmg); return dmg; }
function rayTraceLiving(world, start, dir, range, shooter) { return world.rayTrace(start, dir, range, FluidCollisionMode.NEVER, false, 0.3, function(ent) { return ent instanceof LivingEntity && ent !== shooter; }); }
function scheduleReloadSound(player, cooldownMs) { if (player == null) return; var _player = player; var CloseTask = Java.extend(BukkitRunnable, { run: function() { if (_player.isOnline()) _player.getWorld().playSound(_player.getLocation(), "block.iron_door.close", 0.7, 1.0); } }); new CloseTask().runTaskLater(plugin, Math.max(1, Math.floor(cooldownMs / 50))); }
function adjustPlayerPitch(player, degrees) { if (player == null || !player.isOnline()) return; var loc = player.getLocation(); var newPitch = loc.getPitch() - degrees; if (newPitch > 90) newPitch = 90; if (newPitch < -90) newPitch = -90; try { player.setRotation(loc.getYaw(), newPitch); } catch (e) { try { loc.setPitch(newPitch); player.teleport(loc); } catch (e2) {} } }
function isHoldingGun(player) {
    if (player == null || !player.isOnline()) return false;
    var item = player.getInventory().getItemInMainHand();
    return item != null && item.getType() !== Material.AIR;
}
function wasHoldingGun(stack) {
    return stack != null && stack.getType() !== Material.AIR;
}

var GUN_ID = "FKR_通古斯过载式步枪";
var SIT_PER_BULLET = 0.6;
var SIT_BEAM_MULT = 20;
var RANGE = 60;
var COOLDOWN_MS = 5000;
var BULLET_INTERVAL = 2;
var MAX_BULLETS = 10;
var BEAM_RADIUS = 2.0;

var cdMap = new java.util.HashMap();
var firingMap = new java.util.HashMap();
var taskMap = new java.util.HashMap();
function cancelTaskMap(map) {
    if (map == null) return;
    try {
        var tasks = map.values().toArray();
        for (var i = 0; i < tasks.length; i++) { try { tasks[i].cancel(); } catch (e) {} }
        map.clear();
    } catch (e2) {}
}
function clearGunState(player) {
    if (player == null) return;
    var uuid = player.getUniqueId().toString();
    cdMap.remove(uuid);
    firingMap.remove(uuid);
    var task = taskMap.remove(uuid);
    if (task != null) { try { task.cancel(); } catch (e) {} }
}

var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var Vector = org.bukkit.util.Vector;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;
var bulletDust = new DustOptions(Color.fromRGB(255, 180, 0), 1.0);
var beamCoreDust = new DustOptions(Color.fromRGB(255, 120, 0), 1.5);
var beamRingDust = new DustOptions(Color.fromRGB(255, 0, 0), 1.2);

function fireBullet(player, bulletIndex) {
    if (!isHoldingGun(player)) return;
    var world = player.getWorld();
    var item = player.getInventory().getItemInMainHand();
    var start = player.getEyeLocation();
    var dir = start.getDirection().normalize();
    var rayHit = rayTraceLiving(world, start, dir, RANGE, player);
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
        var hitPos2 = rayHit.getHitPosition();
        var hitLoc = new Location(world, hitPos2.getX(), hitPos2.getY(), hitPos2.getZ());
        world.spawnParticle(Particle.DUST, hitLoc, 12, 0.15, 0.15, 0.15, 0.05, bulletDust);
        world.spawnParticle(Particle.SMOKE, hitLoc, 3, 0.1, 0.1, 0.1, 0.02);
    }
    var volume = 0.3 + (bulletIndex / 10) * 0.9;
    var pitch = 0.4 + (bulletIndex / 10) * 1.6;
    world.playSound(start, "block.respawn_anchor.charge", volume, pitch);
}

function fireBeam(player) {
    if (!isHoldingGun(player)) return;
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
    var queryCenter = new Location(world, (minX + maxX) / 2.0, (minY + maxY) / 2.0, (minZ + maxZ) / 2.0);
    var nearby = world.getNearbyEntities(queryCenter, (maxX - minX) / 2.0, (maxY - minY) / 2.0, (maxZ - minZ) / 2.0);
    var startVec = start.toVector();
    var it = nearby.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof org.bukkit.entity.LivingEntity) || ent === player) continue;
        if (ent.getBoundingBox().expand(beamRadius).rayTrace(startVec, dir, endDist) == null) continue;
        dealSitDamage(ent, player, item, SIT_BEAM_MULT);
    }
    var anyVec = new Vector(0, 1, 0);
    if (Math.abs(dir.getX()) < 0.01 && Math.abs(dir.getZ()) < 0.01) anyVec = new Vector(1, 0, 0);
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
        if (i % 4 === 0) world.spawnParticle(Particle.ELECTRIC_SPARK, tracerLoc, 15, 0.4, 0.4, 0.4, 0);
        for (var j2 = 0; j2 < ringPoints; j2++) {
            world.spawnParticle(Particle.DUST, tracerLoc.clone().add(ringOffsets[j2]), 1, 0, 0, 0, 0, beamRingDust);
        }
        tracerLoc.add(stepVec);
    }
    var waveLoc = start.clone();
    var waveStepVec = dir.clone().multiply(1.0);
    var waveSteps = Math.floor(endDist / 1.0);
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

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var uuid = player.getUniqueId().toString();
    if (firingMap.containsKey(uuid)) {
        firingMap.remove(uuid);
        cdMap.put(uuid, Date.now());
        var task = taskMap.remove(uuid);
        if (task != null) { try { task.cancel(); } catch (e) {} }
        player.sendActionBar("§c中止，进入再装填...");
        scheduleReloadSound(player, COOLDOWN_MS);
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
            if (_player == null || !_player.isOnline()) {
                firingMap.remove(_uuid);
                var _t = taskMap.remove(_uuid);
                if (_t != null) { try { _t.cancel(); } catch (e) {} }
                return;
            }
            if (!firingMap.containsKey(_uuid)) {
                var idleTask = taskMap.remove(_uuid);
                if (idleTask != null) { try { idleTask.cancel(); } catch (e2) {} }
                return;
            }
            if (!isHoldingGun(_player)) {
                firingMap.remove(_uuid);
                var lostTask = taskMap.remove(_uuid);
                if (lostTask != null) { try { lostTask.cancel(); } catch (e3) {} }
                return;
            }
            if (bulletCount < MAX_BULLETS) {
                fireBullet(_player, bulletCount);
                bulletCount++;
                _player.sendActionBar("§e充能射击中 §f" + bulletCount + "§e/§f" + MAX_BULLETS);
            } else {
                firingMap.remove(_uuid);
                fireBeam(_player);
                adjustPlayerPitch(_player, 3);
                cdMap.put(_uuid, Date.now());
                _player.sendActionBar("§c已完全激发光束脉冲，进入再装填...");
                scheduleReloadSound(_player, COOLDOWN_MS);
                var doneTask = taskMap.remove(_uuid);
                if (doneTask != null) { try { doneTask.cancel(); } catch (e4) {} }
            }
        }
    });
    taskMap.put(uuid, new FireTask().runTaskTimer(plugin, 0, BULLET_INTERVAL));
}

function onLoad() {
    return {
        PlayerItemHeldEvent: function(evt) {
            try {
                var prev = evt.getPlayer().getInventory().getItem(evt.getPreviousSlot());
                if (wasHoldingGun(prev)) clearGunState(evt.getPlayer());
            } catch (e) {}
        },
        PlayerQuitEvent: function(evt) {
            try { clearGunState(evt.getPlayer()); } catch (e) {}
        }
    };
}
onLoad();
