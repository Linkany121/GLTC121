// ===================================================================
// 通古斯战壕霰弹 · 可调配置
// 最终伤害 = 每弹丸系数 × 异能强度(SIT)；改完重载脚本生效
// ===================================================================
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
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
function wasHoldingGun(stack, gunId) { if (!stack || stack.getType() === Material.AIR) return false; var sfItem = SlimefunItem.getByItem(stack); return sfItem != null && sfItem.getId() === gunId; }

var GUN_ID = "FKR_通古斯战壕霰弹";
var SIT_PER_PELLET = 0.8;
var COOLDOWN_MS = 500;
var RANGE = 40;
var SCATTER_ANGLE_DEG = 30;
var BULLET_COUNT = 8;

var cdMap = new java.util.HashMap();
function clearGunState(player) { if (player == null) return; cdMap.remove(player.getUniqueId().toString()); }

var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;
var Vector = org.bukkit.util.Vector;
var blackDust = new DustOptions(Color.fromRGB(0, 0, 0), 0.7);
var axisY = new Vector(0, 1, 0);

function generateDirections(baseDir, halfAngle, count) {
    var dirs = [];
    var u, v;
    if (Math.abs(baseDir.getX()) < 0.0001 && Math.abs(baseDir.getZ()) < 0.0001) {
        u = new Vector(1, 0, 0);
        v = new Vector(0, 0, 1);
    } else {
        u = baseDir.clone().crossProduct(axisY).normalize();
        v = baseDir.clone().crossProduct(u).normalize();
    }
    for (var i = 0; i < count; i++) {
        var theta = Math.random() * halfAngle;
        var phi = Math.random() * 2 * Math.PI;
        var dir = baseDir.clone().multiply(Math.cos(theta));
        dir.add(u.clone().multiply(Math.cos(phi) * Math.sin(theta)));
        dir.add(v.clone().multiply(Math.sin(phi) * Math.sin(theta)));
        dirs.push(dir.normalize());
    }
    return dirs;
}

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== GUN_ID) return;
    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        player.sendActionBar("§c射击过于频繁！");
        player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7, 1.0);
        return;
    }
    cdMap.put(uuid, now);
    scheduleReloadSound(player, COOLDOWN_MS);
    var world = player.getWorld();
    var start = player.getEyeLocation();
    var baseDir = start.getDirection().normalize();
    var halfAngle = (SCATTER_ANGLE_DEG / 2) * Math.PI / 180;
    var bulletDirs = generateDirections(baseDir, halfAngle, BULLET_COUNT);

    var hitMap = {};
    for (var b = 0; b < bulletDirs.length; b++) {
        var rayHit = rayTraceLiving(world, start, bulletDirs[b], RANGE, player);
        if (rayHit == null) continue;
        var ent = rayHit.getHitEntity();
        if (ent == null) continue;
        var entId = ent.getUniqueId().toString();
        if (!hitMap[entId]) hitMap[entId] = { entity: ent, count: 0 };
        hitMap[entId].count++;
    }
    for (var key in hitMap) {
        if (!hitMap.hasOwnProperty(key)) continue;
        var entry = hitMap[key];
        dealSitDamage(entry.entity, player, item, SIT_PER_PELLET * entry.count);
    }

    for (var b2 = 0; b2 < bulletDirs.length; b2++) {
        var tracerLoc = start.clone();
        var stepVec = bulletDirs[b2].clone().multiply(0.7);
        var steps = Math.floor(RANGE / 0.7);
        for (var i = 0; i < steps; i++) {
            world.spawnParticle(Particle.DUST, tracerLoc, 1, 0.02, 0.02, 0.02, 0, blackDust);
            tracerLoc.add(stepVec);
        }
    }
    world.playSound(start, "entity.generic.explode", 0.5, 1.5);
    world.playSound(start, "entity.firework_rocket.blast", 0.3, 1.3);
}

function onLoad() {
    return {
        PlayerItemHeldEvent: function(evt) {
            try {
                var prev = evt.getPlayer().getInventory().getItem(evt.getPreviousSlot());
                if (wasHoldingGun(prev, GUN_ID)) clearGunState(evt.getPlayer());
            } catch (e) {}
        },
        PlayerQuitEvent: function(evt) {
            try { clearGunState(evt.getPlayer()); } catch (e) {}
        }
    };
}
onLoad();
