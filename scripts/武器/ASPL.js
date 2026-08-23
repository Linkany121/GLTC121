var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");

var SIT_DAMAGE_MULT = 5;
var ABILITY_POWER_DEFAULT = 10;
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment";
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";
var DAMAGE_NOTIFY_DEFAULT = "chat";
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";
var COOLDOWN_MS = 4000; // 冷却时间（毫秒）
var RANGE = 40; // 水球最大飞行距离（米）
var BLAST_RADIUS = 12; // 爆炸伤害范围（米）
var LEVITATION_TICKS = 20; // 飘浮持续时间（tick），20=1秒
var LEVITATION_LEVEL = 7; // 飘浮等级，5=VI
var TELEPORT_DELAY = 20; // 命中后延迟传送时间（tick），20=1秒

var Particle = org.bukkit.Particle;
var Location = org.bukkit.Location;
var Vector = org.bukkit.util.Vector;
var FluidCollisionMode = org.bukkit.FluidCollisionMode;
var PotionEffect = org.bukkit.potion.PotionEffect;
var PotionEffectType = org.bukkit.potion.PotionEffectType;
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
var DustOptions = org.bukkit.Particle.DustOptions;
var Color = org.bukkit.Color;

var blueDust = new DustOptions(Color.fromRGB(0, 100, 255), 1.5);
var lightBlueDust = new DustOptions(Color.fromRGB(100, 200, 255), 1.2);
var waterExpDust = new DustOptions(Color.fromRGB(60, 180, 255), 1.5);
var waterDust = new DustOptions(Color.fromRGB(80, 200, 255), 1.2);
var TYPE_LEVITATION = PotionEffectType.getByName("LEVITATION");

var cdMap = new java.util.HashMap();

function isHolding(player) {
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(item);
    return sfItem != null && sfItem.getId() === "FKR_ASPL";
}
function wasHolding(stack) {
    if (!stack || stack.getType() === org.bukkit.Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(stack);
    return sfItem != null && sfItem.getId() === "FKR_ASPL";
}
function clearWeaponState(player) {
    if (player == null) return;
    cdMap.remove(player.getUniqueId().toString());
}
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
function notifyAbilityDamageSummary(player, item, totalDamage, hitCount) {
    if (player == null || !player.isOnline() || hitCount <= 0 || totalDamage <= 0) return;
    var mode = getDamageNotifyMode();
    if (mode === "none") return;
    var msg = GLTC_DAMAGE_MSG_PREFIX + "使用 " + getWeaponDisplayName(item)
        + " §f对 §e" + hitCount + " §f个目标共造成 §c"
        + formatAbilityDamage(totalDamage) + " §f伤害！";
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

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "FKR_ASPL") return;

    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        player.sendActionBar("§c冷却中...");
        return;
    }
    cdMap.put(uuid, now);

    var world = player.getWorld();
    var startLoc = player.getEyeLocation();
    var dir = startLoc.getDirection().normalize();

    // === 发射时触发潮涌核心音效 ===
    world.playSound(startLoc, "block.conduit.activate", 2.0, 1.0);

    // 一次性rayTrace检测方块+实体
    var rayHit = world.rayTrace(
        startLoc, dir, RANGE,
        FluidCollisionMode.NEVER, false, 0.5,
        function(ent) {
            return ent instanceof org.bukkit.entity.LivingEntity && ent !== player;
        }
    );

    // 确定命中点
    var endDist = RANGE;
    var hitLoc = null;
    var hitEntity = false;
    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        endDist = startLoc.toVector().distance(hitPos);
        hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
        if (rayHit.getHitEntity() != null) {
            hitEntity = true;
            hitLoc = rayHit.getHitEntity().getLocation();
        }
    } else {
        hitLoc = startLoc.clone().add(dir.clone().multiply(RANGE));
    }

    // 蓝色球体飞行粒子
    var tracerLoc = startLoc.clone();
    var stepVec = dir.clone().multiply(0.5);
    var steps = Math.floor(endDist / 0.5);
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.DUST, tracerLoc, 4, 0.08, 0.08, 0.08, 0, blueDust);
        world.spawnParticle(Particle.DUST, tracerLoc, 2, 0.12, 0.12, 0.12, 0, lightBlueDust);
        world.spawnParticle(Particle.END_ROD, tracerLoc, 1, 0.05, 0.05, 0.05, 0.01);
        tracerLoc.add(stepVec);
    }

    // === 在命中位置触发爆炸效果（提取为函数，稍后在原位置也调用） ===
    triggerWaterBlast(world, hitLoc, player);

    // === 记录传送前位置和朝向 ===
    var originLoc = player.getLocation();
    var originYaw = originLoc.getYaw();
    var originPitch = originLoc.getPitch();

    // 命中位置：生物→直接传送，方块/空爆→y+2
    var teleportTarget = hitLoc.clone();
    if (!hitEntity) {
        teleportTarget.setY(hitLoc.getY() + 2);
    }
    // 视线调转180度（yaw+180，pitch取反）
    teleportTarget.setYaw(originYaw + 180);
    teleportTarget.setPitch(-originPitch);

    // === 1秒后传送 + 双位置雷电 + 原位置爆炸 ===
    var _player = player;
    var _world = world;
    var _originLoc = originLoc;
    var _teleportTarget = teleportTarget;

    var TeleportTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                // 原位置触发与命中相同的爆炸效果（粒子+飘浮+伤害）
                triggerWaterBlast(_world, _originLoc, _player);

                // 传送前位置雷电
                _world.strikeLightningEffect(_originLoc);

                // 传送到命中位置（Location本身已包含yaw/pitch）
                _player.teleport(_teleportTarget);

                // 传送后位置雷电
                _world.strikeLightningEffect(_teleportTarget);

                // 音效
                _world.playSound(_originLoc, "entity.lightning_bolt.thunder", 1.0, 1.0);
                _world.playSound(_teleportTarget, "entity.lightning_bolt.thunder", 1.0, 1.0);
            } catch (e) {
                plugin.getLogger().warning("[ASPL] 传送失败: " + e);
            }
        }
    });
    new TeleportTask().runTaskLater(plugin, TELEPORT_DELAY);
}

// === 水粒子爆炸效果函数（命中位置和原位置共用） ===
function triggerWaterBlast(world, loc, player) {
    // 多层水球扩散（密集）
    for (var ring = 0; ring < 5; ring++) {
        var radius = 1.0 + ring * 1.2;
        var count = 50 + ring * 15;
        for (var i = 0; i < count; i++) {
            var theta = Math.acos(2 * Math.random() - 1);
            var phi = 2 * Math.PI * Math.random();
            var px = loc.getX() + radius * Math.sin(theta) * Math.cos(phi);
            var py = loc.getY() + radius * Math.sin(theta) * Math.sin(phi);
            var pz = loc.getZ() + radius * Math.cos(theta);
            var pLoc = new Location(world, px, py, pz);
            world.spawnParticle(Particle.DUST, pLoc, 2, 0.05, 0.05, 0.05, 0, waterExpDust);
        }
    }
    // 中心密集水柱
    for (var i = 0; i < 40; i++) {
        var py = loc.getY() + i * 0.25;
        var pLoc = new Location(world, loc.getX(), py, loc.getZ());
        world.spawnParticle(Particle.DUST, pLoc, 6, 0.15, 0.02, 0.15, 0, waterDust);
        world.spawnParticle(Particle.CLOUD, pLoc, 3, 0.1, 0, 0.1, 0.005);
    }
    // 水波冲击环（密集）
    for (var ring = 0; ring < 4; ring++) {
        var waveRadius = 1.5 + ring * 2.0;
        var waveCount = 80;
        for (var i = 0; i < waveCount; i++) {
            var angle = (2 * Math.PI * i) / waveCount;
            var px = loc.getX() + Math.cos(angle) * waveRadius;
            var pz = loc.getZ() + Math.sin(angle) * waveRadius;
            var pLoc = new Location(world, px, loc.getY(), pz);
            world.spawnParticle(Particle.DUST, pLoc, 2, 0, 0, 0, 0, waterDust);
        }
    }
    // 密集水雾中心
    world.spawnParticle(Particle.CLOUD, loc, 200, 1.5, 1.5, 1.5, 0.03);
    world.spawnParticle(Particle.DUST, loc, 150, 1.5, 1.5, 1.5, 0.02, waterExpDust);
    world.spawnParticle(Particle.END_ROD, loc, 60, 1.0, 1.0, 1.0, 0.05);

    world.playSound(loc, "entity.player.splash.high_speed", 2.0, 0.8);
    world.playSound(loc, "entity.generic.explode", 1.5, 1.2);

    // 12米内所有生物：飘浮1秒(等级6) + 5x SIT 伤害
    var weaponItem = player.getInventory().getItemInMainHand();
    var sitDmg = calcSitDamage(SIT_DAMAGE_MULT);
    var totalDmg = 0;
    var hitCount = 0;
    var targets = world.getNearbyEntities(loc, BLAST_RADIUS, BLAST_RADIUS, BLAST_RADIUS);
    var it = targets.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (ent instanceof org.bukkit.entity.LivingEntity && ent !== player) {
            ent.setNoDamageTicks(0);
            ent.damage(sitDmg, player);
            totalDmg += sitDmg;
            hitCount++;
            if (TYPE_LEVITATION != null) {
                ent.addPotionEffect(new PotionEffect(TYPE_LEVITATION, LEVITATION_TICKS, LEVITATION_LEVEL, false, true, true));
            }
        }
    }
    notifyAbilityDamageSummary(player, weaponItem, totalDmg, hitCount);
}

function onLoad() {
    return {
        PlayerItemHeldEvent: function(evt) {
            try {
                var prev = evt.getPlayer().getInventory().getItem(evt.getPreviousSlot());
                if (wasHolding(prev)) clearWeaponState(evt.getPlayer());
            } catch (e) {}
        },
        PlayerQuitEvent: function(evt) {
            try { clearWeaponState(evt.getPlayer()); } catch (e) {}
        }
    };
}
onLoad();
