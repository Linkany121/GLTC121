// ===================================================================
// 通古斯制式步枪 · 可调配置
// 最终伤害 = 系数 × 异能强度(SIT)；改完重载脚本生效
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

function getAbilityPower() {
    try { return getAddonConfig().getInt(ABILITY_POWER_CONFIG_KEY, ABILITY_POWER_DEFAULT); } catch (e) { return ABILITY_POWER_DEFAULT; }
}
function calcSitDamage(mult) { return mult * getAbilityPower(); }
function formatAbilityDamage(dmg) {
    var v = Math.round(dmg * 10) / 10;
    return (Math.abs(v - Math.round(v)) < 0.05) ? String(Math.round(v)) : v.toFixed(1);
}
function getGunDisplayName(item) {
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
    } catch (e) { return DAMAGE_NOTIFY_DEFAULT; }
}
function notifyAbilityDamage(player, item, damage) {
    if (player == null || !player.isOnline()) return;
    var mode = getDamageNotifyMode();
    if (mode === "none") return;
    var msg = GLTC_DAMAGE_MSG_PREFIX + "使用 " + getGunDisplayName(item) + " §f造成 §c" + formatAbilityDamage(damage) + " §f伤害！";
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
function rayTraceLiving(world, start, dir, range, shooter) {
    return world.rayTrace(start, dir, range, FluidCollisionMode.NEVER, false, 0.3, function(ent) {
        return ent instanceof LivingEntity && ent !== shooter;
    });
}
function scheduleReloadSound(player, cooldownMs) {
    if (player == null) return;
    var _player = player;
    var CloseTask = Java.extend(BukkitRunnable, {
        run: function() {
            if (_player.isOnline()) _player.getWorld().playSound(_player.getLocation(), "block.iron_door.close", 0.7, 1.0);
        }
    });
    new CloseTask().runTaskLater(plugin, Math.max(1, Math.floor(cooldownMs / 50)));
}
function isHoldingGun(player, gunId) {
    if (player == null || !player.isOnline()) return false;
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(item);
    return sfItem != null && sfItem.getId() === gunId;
}
function wasHoldingGun(stack, gunId) {
    if (!stack || stack.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(stack);
    return sfItem != null && sfItem.getId() === gunId;
}

var GUN_ID = "FKR_通古斯制式步枪";
var SIT_DAMAGE_MULT = 1.6;
var COOLDOWN_MS = 500;
var RANGE = 40;

var cdMap = new java.util.HashMap();

function clearGunState(player) {
    if (player == null) return;
    cdMap.remove(player.getUniqueId().toString());
}

var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;
var blackDust = new DustOptions(Color.fromRGB(0, 0, 0), 0.7);

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;
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
    var dir = start.getDirection().normalize();
    var rayHit = rayTraceLiving(world, start, dir, RANGE, player);
    var endDist = RANGE;
    var hitEntity = null;
    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        endDist = start.toVector().distance(hitPos);
        hitEntity = rayHit.getHitEntity();
        if (hitEntity != null) {
            dealSitDamage(hitEntity, player, item, SIT_DAMAGE_MULT);
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
        var hitPos2 = rayHit.getHitPosition();
        var hitLoc = new Location(world, hitPos2.getX(), hitPos2.getY(), hitPos2.getZ());
        world.spawnParticle(Particle.DUST, hitLoc, 12, 0.15, 0.15, 0.15, 0.05, blackDust);
        world.spawnParticle(Particle.SMOKE, hitLoc, 5, 0.1, 0.1, 0.1, 0.02);
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
