// ===================================================================
// 通古斯制式轨道信标投递器 · 可调配置
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
function wasHoldingGun(stack) {
    return stack != null && stack.getType() !== Material.AIR;
}

var GUN_ID = "FKR_通古斯制式轨道信标投递器";
var SIT_DAMAGE_MULT = 10;
var COOLDOWN_MS = 5000;
var RANGE = 50;
var BLAST_RADIUS = 5;
var DROP_HEIGHT = 30;
var DROP_SPEED = -5;

var cdMap = new java.util.HashMap();
function clearGunState(player) { if (player == null) return; cdMap.remove(player.getUniqueId().toString()); }

var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var Vector = org.bukkit.util.Vector;

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;

    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        player.sendActionBar("§c装填中...");
        player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7, 1.0);
        return;
    }
    cdMap.put(uuid, now);
    scheduleReloadSound(player, COOLDOWN_MS);
    var world = player.getWorld();
    var eyeLoc = player.getEyeLocation();
    var dir = eyeLoc.getDirection();
    var rayHit = rayTraceLiving(world, eyeLoc, dir, RANGE, player);
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
        dealSitDamage(hitEntity, player, item, SIT_DAMAGE_MULT);
    }
    var targets = world.getNearbyEntities(hitPoint, BLAST_RADIUS, BLAST_RADIUS, BLAST_RADIUS);
    var it = targets.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (ent instanceof org.bukkit.entity.LivingEntity && ent !== player) {
            if (hitEntity != null && ent.getUniqueId().equals(hitEntity.getUniqueId())) continue;
            dealSitDamage(ent, player, item, SIT_DAMAGE_MULT);
        }
    }
    for (var i = 0; i < 3; i++) {
        var offsetX = (Math.random() - 0.5) * 2.0;
        var offsetZ = (Math.random() - 0.5) * 2.0;
        world.strikeLightningEffect(hitPoint.clone().add(offsetX, 0, offsetZ));
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
    new RemoveTask().runTaskLater(plugin, 20);
    world.spawnParticle(Particle.FLAME, eyeLoc, 10, 0.1, 0.1, 0.1, 0.05);
    world.playSound(eyeLoc, "entity.blaze.shoot", 0.5, 1.5);
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
