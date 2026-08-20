/**
 * GLTC 料理 / 食物战斗效果（独立监听）
 * 由 监听.js 启动时 eval 加载并自注册
 *
 * - 百香爆烤 gltc_baoxiang：受伤咆哮
 * - 灼金汤锅 gltc_soup：横扫黄金蒸汽
 * - 黄金炒饭 gltc_goldenrice：攻击附加烫伤
 */

var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle$DustOptions");
var Bukkit = Java.type("org.bukkit.Bukkit");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Projectile = Java.type("org.bukkit.entity.Projectile");
var RegainReason = Java.type("org.bukkit.event.entity.EntityRegainHealthEvent$RegainReason");
var EntityDamageEvent = Java.type("org.bukkit.event.entity.EntityDamageEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");

var GOLD_COLOR = Color.fromRGB(226, 207, 69);
var DUST_OPT_1_8 = new DustOptions(GOLD_COLOR, 1.8);
var DUST_OPT_1_5 = new DustOptions(GOLD_COLOR, 1.5);

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

var COOLDOWN_MS = 300;
var MAP_TTL_MS = 5000;

var baoxiangLastTrigger = new java.util.HashMap();
var soupLastSweep = new java.util.HashMap();
var goldenRiceLastHit = new java.util.HashMap();
var cleanupCounter = 0;
var _foodListenerRegistered = false;

var _sweepMethodCache = (function() {
    try {
        return EntityDamageByEntityEvent.getMethod("isSweepAttack");
    } catch (e) {
        return null;
    }
})();

// 监听父类 EntityDamageEvent 时，用反射取 getDamager（避免依赖 Java.cast，兼容 Nashorn / Graal）
var _getDamagerMethod = (function() {
    try {
        return EntityDamageByEntityEvent.getMethod("getDamager");
    } catch (e) {
        return null;
    }
})();

function addEffectSafe(entity, type, duration, amplifier) {
    if (type != null) {
        entity.addPotionEffect(new PotionEffect(type, duration, amplifier, true, false, false));
    }
}

function getEndTime(player, key) {
    if (!player.hasMetadata(key)) return -1;
    var metaList = player.getMetadata(key);
    if (metaList.isEmpty()) return -1;
    var endTime = metaList.get(0).asLong();
    if (Date.now() > endTime) {
        player.removeMetadata(key, PLUGIN);
        return -1;
    }
    return endTime;
}

function isOnCooldown(map, uuid, now) {
    var last = map.get(uuid);
    return last != null && (now - last) < COOLDOWN_MS;
}

function markCooldown(map, uuid, now) {
    map.put(uuid, now);
}

function maybeCleanupMaps(now) {
    cleanupCounter++;
    if (cleanupCounter % 128 !== 0
        && baoxiangLastTrigger.size() < 96
        && soupLastSweep.size() < 96
        && goldenRiceLastHit.size() < 96) {
        return;
    }
    cleanupMap(baoxiangLastTrigger, now);
    cleanupMap(soupLastSweep, now);
    cleanupMap(goldenRiceLastHit, now);
}

function cleanupMap(map, now) {
    var iter = map.entrySet().iterator();
    while (iter.hasNext()) {
        var entry = iter.next();
        if (now - entry.getValue() > MAP_TTL_MS) {
            iter.remove();
        }
    }
}

function resolvePlayerDamager(damager) {
    if (damager instanceof Player) return damager;
    if (damager instanceof Projectile) {
        var shooter = damager.getShooter();
        if (shooter instanceof Player) return shooter;
    }
    return null;
}

function isSweepAttack(event) {
    if (_sweepMethodCache != null) {
        try {
            return _sweepMethodCache.invoke(event);
        } catch (e) {}
    }
    try {
        var cause = event.getCause();
        if (cause != null) {
            var n = cause.name();
            return n === "SWEEP_ATTACK" || n === "ENTITY_SWEEP_ATTACK";
        }
    } catch (e) {}
    return false;
}

function formatRemaining(endTime, now) {
    var totalSec = Math.floor((endTime - now) / 1000);
    if (totalSec < 0) totalSec = 0;
    var min = Math.floor(totalSec / 60);
    var sec = totalSec % 60;
    return min + "§7分§f" + sec + "§7秒";
}

function healPlayer(player, amount) {
    if (amount <= 0) return;
    try {
        player.heal(amount, RegainReason.MAGIC);
        return;
    } catch (e) {}
    var maxHealth = player.getMaxHealth();
    player.setHealth(Math.min(maxHealth, player.getHealth() + amount));
}

function applyNearbyLivingEffects(world, center, radius, source, applyFn) {
    var radiusSq = radius * radius;
    var nearby = world.getNearbyEntities(center, radius, radius, radius);
    for (var i = 0; i < nearby.size(); i++) {
        var target = nearby.get(i);
        if (!(target instanceof LivingEntity) || target === source || target.isDead()) continue;
        if (target.getLocation().distanceSquared(center) > radiusSq) continue;
        applyFn(target);
    }
}

function createBurstRing(world, centerX, centerY, centerZ, radius, count, dustOpt, upSpeed, outSpeed) {
    var step = (2 * Math.PI) / count;
    for (var i = 0; i < count; i++) {
        var angle = step * i;
        var ringX = Math.cos(angle) * radius;
        var ringZ = Math.sin(angle) * radius;
        var vx = ringX * outSpeed * 0.75;
        var vy = upSpeed;
        var vz = ringZ * outSpeed * 0.75;
        world.spawnParticle(
            Particle.DUST,
            centerX + ringX,
            centerY,
            centerZ + ringZ,
            0,
            vx,
            vy,
            vz,
            0,
            dustOpt
        );
    }
}

function handleFoodCombat(event) {
    if (event.isCancelled()) return;

    var entity = event.getEntity();
    // getDamager 仅存在于 EntityDamageByEntityEvent；坠落/岩浆等纯 EntityDamageEvent 无此方法
    // 反射调用：监听父类时直接 .getDamager() 在部分引擎会报 Unknown identifier；Java.cast 在本环境不可用
    var damager = null;
    if (event instanceof EntityDamageByEntityEvent && _getDamagerMethod != null) {
        try {
            damager = _getDamagerMethod.invoke(event);
        } catch (e) {}
    }
    var victimPlayer = entity instanceof Player ? entity : null;
    var attackerPlayer = resolvePlayerDamager(damager);

    if (victimPlayer == null && attackerPlayer == null) return;

    var now = Date.now();
    maybeCleanupMaps(now);

    // ---------- 百香爆烤：受伤咆哮 ----------
    if (victimPlayer != null && victimPlayer.hasMetadata("gltc_baoxiang")) {
        var baoxiangEnd = getEndTime(victimPlayer, "gltc_baoxiang");
        if (baoxiangEnd > 0) {
            var baoxiangUuid = victimPlayer.getUniqueId();
            if (!isOnCooldown(baoxiangLastTrigger, baoxiangUuid, now)) {
                markCooldown(baoxiangLastTrigger, baoxiangUuid, now);

                var loc = victimPlayer.getLocation();
                var world = loc.getWorld();
                var px = loc.getX();
                var py = loc.getY() + 0.5;
                var pz = loc.getZ();

                world.playSound(loc, "entity.ender_dragon.growl", 0.5, 1.2);
                world.spawnParticle(Particle.CLOUD, px, py, pz, 12, 0.2, 0.2, 0.2, 0.05);
                world.spawnParticle(Particle.LAVA, px, py, pz, 6, 0.2, 0.2, 0.2, 0.05);

                var debuffDuration = 60;
                applyNearbyLivingEffects(world, loc, 4.0, victimPlayer, function(target) {
                    addEffectSafe(target, PotionEffectType.SLOWNESS, debuffDuration, 2);
                    addEffectSafe(target, PotionEffectType.POISON, debuffDuration, 9);
                    addEffectSafe(target, PotionEffectType.BLINDNESS, debuffDuration, 0);
                });

                victimPlayer.sendActionBar("§e咆哮§7剩余时间：§f" + formatRemaining(baoxiangEnd, now));
            }
        }
    }

    if (attackerPlayer == null) return;

    // ---------- 灼金汤锅：仅横扫触发 ----------
    if (attackerPlayer.hasMetadata("gltc_soup") && isSweepAttack(event)) {
        var soupEnd = getEndTime(attackerPlayer, "gltc_soup");
        if (soupEnd > 0) {
            var soupUuid = attackerPlayer.getUniqueId();
            if (!isOnCooldown(soupLastSweep, soupUuid, now)) {
                markCooldown(soupLastSweep, soupUuid, now);

                var loc = attackerPlayer.getLocation();
                var world = loc.getWorld();
                world.playSound(loc, "entity.blaze.shoot", 0.8, 1.2);

                var centerY = loc.getY() + 0.5;
                createBurstRing(world, loc.getX(), centerY, loc.getZ(), 1.6, 14, DUST_OPT_1_8, 0.25, 0.15);

                healPlayer(attackerPlayer, attackerPlayer.getMaxHealth() * 0.1);

                applyNearbyLivingEffects(world, loc, 3.5, attackerPlayer, function(target) {
                    addEffectSafe(target, PotionEffectType.LEVITATION, 20, 2);
                });

                attackerPlayer.sendActionBar("§6黄金蒸汽§7剩余时间：§f" + formatRemaining(soupEnd, now));
            }
        }
    }

    // ---------- 黄金炒饭：攻击附加额外伤害 ----------
    if (!(entity instanceof LivingEntity) || entity === attackerPlayer) return;
    if (!attackerPlayer.hasMetadata("gltc_goldenrice")) return;

    var riceEnd = getEndTime(attackerPlayer, "gltc_goldenrice");
    if (riceEnd <= 0) return;

    var riceUuid = attackerPlayer.getUniqueId();
    if (isOnCooldown(goldenRiceLastHit, riceUuid, now)) return;
    markCooldown(goldenRiceLastHit, riceUuid, now);

    var extraDamage = entity.getMaxHealth() * 0.1;
    if (extraDamage <= 0) return;

    event.setDamage(event.getDamage() + extraDamage);

    attackerPlayer.sendActionBar("§6烫伤 §c+" + Math.floor(extraDamage));

    var world = entity.getWorld();
    var loc = entity.getLocation();
    var headY = loc.getY() + entity.getHeight() + 0.5;
    world.playSound(loc, "entity.breeze.wind_burst", 0.8, 1.2);
    world.spawnParticle(Particle.DUST, loc.getX(), headY, loc.getZ(), 12, 0.3, 0.6, 0.3, 0, DUST_OPT_1_5);
}

function registerFoodCombatListener() {
    if (_foodListenerRegistered) return;
    _foodListenerRegistered = true;

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();

    // 监听 EntityDamageEvent：百香爆烤需覆盖非实体伤害；攻击类效果在内部用 instanceof 判断
    Bukkit.getPluginManager().registerEvent(
        EntityDamageEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            try {
                handleFoodCombat(event);
            } catch (e) {
                Bukkit.getLogger().warning("[GLTC食物] 战斗效果异常: " + e);
            }
        }, PLUGIN
    );
}

registerFoodCombatListener();
