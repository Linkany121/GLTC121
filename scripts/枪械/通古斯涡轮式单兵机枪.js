// ===================================================================
// 通古斯涡轮式单兵机枪 · 可调配置
// 最终伤害 = 系数 × 异能强度(SIT)；改完重载脚本生效
// ===================================================================
var SIT_DAMAGE_MULT = 1.6;             // 单发伤害系数（×SIT）
var ABILITY_POWER_DEFAULT = 10;        // 异能强度默认值（配置缺失时回退）
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment"; // 异能强度读取的配置键
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";   // 伤害提示方式配置键
var DAMAGE_NOTIFY_DEFAULT = "chat";    // 伤害提示默认：chat / actionbar / none
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f"; // 伤害提示前缀
var RANGE = 30;                        // 射程（格）
var COOLDOWN_MS = 5000;                // 弹匣打空后的再装填（毫秒）
var FIRE_INTERVAL_MS = 100;            // 连射最小间隔（毫秒）
var MAX_AMMO = 24;                     // 弹匣容量（发）

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
try{if(plugin.gltcGunCdTask_通古斯涡轮式单兵机枪!=null){org.bukkit.Bukkit.getScheduler().cancelTask(plugin.gltcGunCdTask_通古斯涡轮式单兵机枪);plugin.gltcGunCdTask_通古斯涡轮式单兵机枪=null;}}catch(_e){}
plugin.gltcGunCdTask_通古斯涡轮式单兵机枪 = new _cleanupTask().runTaskTimer(plugin, 600, 600).getTaskId();
