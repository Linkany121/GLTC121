// ===================================================================
// 通古斯制式轨道信标投递器 · 可调配置
// 最终伤害 = 系数 × 异能强度(SIT)；改完重载脚本生效
// ===================================================================
var SIT_DAMAGE_MULT = 10;              // 轨道打击爆炸伤害系数（×SIT）
var ABILITY_POWER_DEFAULT = 10;        // 异能强度默认值（配置缺失时回退）
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment"; // 异能强度读取的配置键
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";   // 伤害提示方式配置键
var DAMAGE_NOTIFY_DEFAULT = "chat";    // 伤害提示默认：chat / actionbar / none
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f"; // 伤害提示前缀
var COOLDOWN_MS = 5000;                // 投递冷却（毫秒）
var RANGE = 50;                        // 瞄准落点最大距离（格）
var BLAST_RADIUS = 5;                  // 爆炸伤害半径（格）
var DROP_HEIGHT = 30;                  // 信标/打击实体生成高度偏移（格，相对落点）
var DROP_SPEED = -5;                   // 下落初速度 Y（负值向下）

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
try{if(PLUGIN.gltcGunCdTask_通古斯制式轨道信标投递器!=null){org.bukkit.Bukkit.getScheduler().cancelTask(PLUGIN.gltcGunCdTask_通古斯制式轨道信标投递器);PLUGIN.gltcGunCdTask_通古斯制式轨道信标投递器=null;}}catch(_e){}
PLUGIN.gltcGunCdTask_通古斯制式轨道信标投递器 = new _cdCleanup().runTaskTimer(PLUGIN, 400, 400).getTaskId();