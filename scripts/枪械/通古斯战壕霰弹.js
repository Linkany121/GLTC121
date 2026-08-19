var SIT_PER_PELLET = 0.8;
var ABILITY_POWER_DEFAULT = 10;
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment";
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";
var DAMAGE_NOTIFY_DEFAULT = "chat";
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";
var COOLDOWN_MS = 500;
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
var RANGE = 40;
var SCATTER_ANGLE_DEG = 30;
var BULLET_COUNT = 8;
var cdMap = new java.util.HashMap();
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
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
    if (!sfItem || sfItem.getId() !== "FKR_通古斯战壕霰弹") return;
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
    var baseDir = start.getDirection().normalize();
    var halfAngle = (SCATTER_ANGLE_DEG / 2) * Math.PI / 180;
    var bulletDirs = generateDirections(baseDir, halfAngle, BULLET_COUNT);
    var scatterRadius = RANGE * Math.tan(halfAngle) + 1.0;
    var endCenter = start.clone().add(baseDir.clone().multiply(RANGE));
    var queryCenter = new Location(
        world,
        (start.getX() + endCenter.getX()) / 2.0,
        (start.getY() + endCenter.getY()) / 2.0,
        (start.getZ() + endCenter.getZ()) / 2.0
    );
    var queryHalfX = Math.abs(endCenter.getX() - start.getX()) / 2.0 + scatterRadius;
    var queryHalfY = Math.abs(endCenter.getY() - start.getY()) / 2.0 + scatterRadius;
    var queryHalfZ = Math.abs(endCenter.getZ() - start.getZ()) / 2.0 + scatterRadius;
    var nearby = world.getNearbyEntities(queryCenter, queryHalfX, queryHalfY, queryHalfZ);
    var startVec = start.toVector();
    var it = nearby.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof org.bukkit.entity.LivingEntity) || ent === player) continue;
        var box = ent.getBoundingBox().expand(0.3);
        var hitBullets = 0;
        for (var b = 0; b < bulletDirs.length; b++) {
            if (box.rayTrace(startVec, bulletDirs[b], RANGE) != null) {
                hitBullets++;
            }
        }
        if (hitBullets > 0) {
            dealSitDamage(ent, player, item, SIT_PER_PELLET * hitBullets);
        }
    }
    for (var b = 0; b < bulletDirs.length; b++) {
        var tracerLoc = start.clone();
        var stepVec = bulletDirs[b].clone().multiply(0.7);
        var steps = Math.floor(RANGE / 0.7);
        for (var i = 0; i < steps; i++) {
            world.spawnParticle(Particle.DUST, tracerLoc, 1, 0.02, 0.02, 0.02, 0, blackDust);
            tracerLoc.add(stepVec);
        }
    }
    world.playSound(start, "entity.generic.explode", 0.5, 1.5);
    world.playSound(start, "entity.firework_rocket.blast", 0.3, 1.3);
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