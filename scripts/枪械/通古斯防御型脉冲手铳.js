// ===================================================================
// 通古斯防御型脉冲手铳 · 可调配置
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
function scheduleReloadSound(player, cooldownMs) { if (player == null) return; var _player = player; var CloseTask = Java.extend(BukkitRunnable, { run: function() { if (_player.isOnline()) _player.getWorld().playSound(_player.getLocation(), "block.iron_door.close", 0.7, 1.0); } }); new CloseTask().runTaskLater(plugin, Math.max(1, Math.floor(cooldownMs / 50))); }
function wasHoldingGun(stack) {
    return stack != null && stack.getType() !== Material.AIR;
}

var GUN_ID = "FKR_通古斯防御型脉冲手铳";
var SIT_DAMAGE_MULT = 6;
var COOLDOWN_MS = 1000;
var RANGE = 40;
var BEAM_DIAMETER = 2.0;
var WHITE_CIRCLE_POINTS = 12;
var WHITE_CIRCLE_RADIUS = 0.55;

var cdMap = new java.util.HashMap();
function clearGunState(player) { if (player == null) return; cdMap.remove(player.getUniqueId().toString()); }

var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;
var Vector = org.bukkit.util.Vector;
var beamDust = new DustOptions(Color.fromRGB(0, 230, 255), 1.2);
var whiteDust = new DustOptions(Color.fromRGB(255, 255, 255), 1.0);

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        player.sendActionBar("§b脉冲手铳充能中...");
        player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7, 1.0);
        return;
    }
    cdMap.put(uuid, now);
    scheduleReloadSound(player, COOLDOWN_MS);
    var world = player.getWorld();
    var start = player.getEyeLocation();
    var dir = start.getDirection().normalize();
    var beamRadius = BEAM_DIAMETER / 2.0;
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
        var expandedBox = ent.getBoundingBox().expand(beamRadius);
        if (expandedBox.rayTrace(startVec, dir, endDist) == null) continue;
        dealSitDamage(ent, player, item, SIT_DAMAGE_MULT);
    }
    var anyVec = new Vector(0, 1, 0);
    if (Math.abs(dir.getX()) < 0.01 && Math.abs(dir.getZ()) < 0.01) anyVec = new Vector(1, 0, 0);
    var perp1 = dir.clone().crossProduct(anyVec).normalize();
    var perp2 = perp1.clone().crossProduct(dir).normalize();
    var whiteOffsets = [];
    for (var j = 0; j < WHITE_CIRCLE_POINTS; j++) {
        var angle = (j / WHITE_CIRCLE_POINTS) * Math.PI * 2;
        whiteOffsets.push(
            perp1.clone().multiply(Math.cos(angle) * WHITE_CIRCLE_RADIUS)
                .add(perp2.clone().multiply(Math.sin(angle) * WHITE_CIRCLE_RADIUS))
        );
    }
    var tracerLoc = start.clone();
    var stepVec = dir.clone().multiply(0.5);
    var steps = Math.floor(endDist / 0.5);
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.DUST, tracerLoc, 2, 0, 0, 0, 0, beamDust);
        if (i % 4 === 0) world.spawnParticle(Particle.ELECTRIC_SPARK, tracerLoc, 15, 0.4, 0.4, 0.4, 0);
        for (var j2 = 0; j2 < WHITE_CIRCLE_POINTS; j2++) {
            world.spawnParticle(Particle.DUST, tracerLoc.clone().add(whiteOffsets[j2]), 1, 0, 0, 0, 0, whiteDust);
        }
        tracerLoc.add(stepVec);
    }
    if (blockHit != null) {
        var hitPos = blockHit.getHitPosition();
        var hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
        world.spawnParticle(Particle.DUST, hitLoc, 20, 0.2, 0.2, 0.2, 0.1, beamDust);
        world.spawnParticle(Particle.ELECTRIC_SPARK, hitLoc, 30, 0.3, 0.3, 0.3, 0.1);
    }
    world.spawnParticle(Particle.DUST, start, 20, 0.15, 0.15, 0.15, 0, beamDust);
    world.spawnParticle(Particle.ELECTRIC_SPARK, start, 5, 0.1, 0.1, 0.1, 0.05);
    world.playSound(start, "entity.lightning_bolt.thunder", 0.4, 1.8);
    world.playSound(start, "block.beacon.activate", 0.6, 2.0);
    world.playSound(start, "entity.blaze.shoot", 0.3, 1.5);
    world.playSound(start, "entity.warden.sonic_boom", 0.4, 0.9);
    world.playSound(start, "block.end_gateway.spawn", 0.5, 1.2);
    world.playSound(start, "item.trident.thunder", 0.3, 0.7);
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
