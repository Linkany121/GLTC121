// ===================================================================
// FKR_无锋破军 —— 旌旗 / 重锋 / 镇压 / 忽视60%护甲韧性
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Material = Java.type("org.bukkit.Material");
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle$DustOptions");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Vector = Java.type("org.bukkit.util.Vector");
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var UUIDClass = Java.type("java.util.UUID");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;

var ITEM_ID = "FKR_无锋破军";
var ABILITY_POWER_DEFAULT = 10;
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment";
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";
var DAMAGE_NOTIFY_DEFAULT = "chat";
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";

// === 药水效果类型 ===
var TYPE_BLINDNESS = PotionEffectType.getByName("BLINDNESS");
var TYPE_SLOWNESS  = PotionEffectType.getByName("SLOWNESS");
var TYPE_SPEED     = PotionEffectType.getByName("SPEED");
var TYPE_STRENGTH  = PotionEffectType.getByName("STRENGTH");

// === 旌旗参数 ===
var BANNER_RADIUS          = 12;      // 玩家直径12格内随机（半径6格）
var BANNER_TRIGGER_DIST    = 1.2;    // 玩家踩到水平范围（格）
var BANNER_LIFETIME_MS     = 12000; // 旌旗存活时间（12秒）
var BANNER_MAX_PER_PLAYER  = 5;      // 每玩家最多同时存在旌旗数
var BANNER_HEIGHT          = 5;      // 竖直粒子柱高度（3米）

// === 重锋参数 ===
var HEAVY_EDGE_MAX        = 3;       // 重锋满3层
var HEAVY_EDGE_DECAY_MS   = 5000;    // 每5秒减少一层
var SPEED_DURATION_TICKS  = 200;     // 10秒加速1
var SPEED_LEVEL           = 1;       // 加速 I（amplifier=0）
var STRENGTH_DURATION_TICKS = 200;   // 每次踩旗增加的力量时长（10秒）
var STRENGTH_LEVEL_ADD      = 10;     // 每次踩旗增加的力量等级（amplifier +1）

// === 镇压参数 ===
var CRUSH_RANGE           = 30;      // 30格内
var CRUSH_FOV_DEG         = 120;     // 视线120度
var SIT_CRUSH_MULT        = 50;      // 镇压：50x SIT
var CRUSH_BLIND_TICKS     = 120;     // 6秒失明
var CRUSH_SLOWNESS_TICKS  = 120;     // 6秒缓慢
var CRUSH_SLOWNESS_LEVEL  = 99;      // 缓慢100（amplifier=99，无法移动）
var CRUSH_SPEAR_COUNT     = 40;      // 40根深红长矛
var CRUSH_SPEAR_HEIGHT    = 30;      // 长矛从30格高度发射
var CRUSH_SPEAR_LENGTH    = 4;       // 长矛长4米
var CRUSH_SPEAR_TILT_MIN  = 5;       // 长矛随机倾角最小值（度，偏离竖直）
var CRUSH_SPEAR_TILT_MAX  = 20;      // 长矛随机倾角最大值（度，偏离竖直）
var CRUSH_SPEAR_FALL_TICKS = 20;     // 1秒落地
var CRUSH_SPEAR_HOLD_TICKS = 10;     // 落地后爆开延迟

// === 攻击参数 ===
var ATTACK_SLOWNESS_TICKS = 20;      // 攻击命中造成1秒缓慢3
var ATTACK_SLOWNESS_LEVEL = 2;       // 缓慢 III（amplifier=2）

// === 忽视护甲参数 ===
var ARMOR_IGNORE_RATE     = 0.6;     // 忽视60%的护甲与韧性

// === 台词消息 ===
var MSG_HEAVY_FULL = "§x§f§f§2§a§0§d狼§x§f§e§4§2§0§d烟§x§f§e§5§9§0§d漫§x§f§d§7§1§0§d卷§x§f§d§8§9§0§d城§x§f§c§a§0§0§d头§x§f§c§b§8§0§d立§x§f§b§d§0§0§d—§x§f§b§e§7§0§d—§x§f§a§f§f§0§d—";
var MSG_CRUSH = "§             §x§f§f§d§8§0§d—§x§f§f§b§3§0§a—§x§f§f§8§e§0§8—§x§f§f§6§9§0§5沉§x§f§f§4§4§0§3对§x§f§f§1§f§0§0千§x§f§9§1§f§0§0锋§x§f§3§1§f§0§0不§x§e§c§2§0§0§0肯§x§e§6§2§0§0§0还§x§e§0§2§0§0§0！";

// === 粒子颜色 ===
var GOLD_DUST  = new DustOptions(Color.fromRGB(255, 180, 30), 1.2);   // 金色
var RED_DUST   = new DustOptions(Color.fromRGB(220, 40, 40), 1.2);    // 红色
var GOLD_DUST_BIG = new DustOptions(Color.fromRGB(255, 190, 50), 2.5);  // 大型金色
var RED_DUST_BIG  = new DustOptions(Color.fromRGB(230, 50, 50), 2.5);   // 大型红色
var DARK_RED_DUST  = new DustOptions(Color.fromRGB(139, 0, 0), 1.0);    // 深红色（长矛）
var DARK_RED_DUST_BIG = new DustOptions(Color.fromRGB(150, 10, 10), 2.2); // 大型深红色（爆发）

// === 状态映射 ===
var heavyEdgeMap     = new java.util.HashMap(); // UUID -> 重锋层数
var heavyEdgeTimeMap = new java.util.HashMap(); // UUID -> 上次获得/刷新重锋时间(ms)
var bannerMap        = new java.util.HashMap(); // UUID -> 旌旗数组 [{loc, born}]

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

// ===================================================================
// 辅助：检查玩家是否手持破军
// ===================================================================
function isHolding(player) {
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(item);
    return sfItem != null && sfItem.getId() === ITEM_ID;
}

// ===================================================================
// 辅助：找到地面生成点（优先玩家同y，只能在地面）
// ===================================================================
function findGroundY(world, x, z, yStart) {
    // 从玩家y向下找第一个非空气方块，返回其上表面y
    for (var y = yStart; y > yStart - 32; y--) {
        var block = world.getBlockAt(x, y, z);
        if (!block.getType().isAir()) {
            return y + 1;
        }
    }
    return yStart;
}

// ===================================================================
// 攻击命中：生成旌旗 + 造成1秒缓慢3
// ===================================================================
function onHit(damager, target) {
    var uuid = damager.getUniqueId().toString();
    var world = damager.getWorld();
    var pLoc = damager.getLocation();

    // 1秒缓慢3
    if (TYPE_SLOWNESS != null) {
        target.addPotionEffect(new PotionEffect(
            TYPE_SLOWNESS, ATTACK_SLOWNESS_TICKS, ATTACK_SLOWNESS_LEVEL, false, true, true
        ));
    }

    // 生成旌旗：玩家视野范围内（视线方向 ±60°扇形，半径2-6格），只在地面
    var viewYaw = pLoc.getYaw();
    var angleRad = (viewYaw + 90) * Math.PI / 180; // MC yaw转弧度：0°=南方，转向量需+90°
    var fovHalf = 60; // 视野扇形半角60°（左右各60°，共120°）
    var randAngle = (Math.random() * 2 - 1) * fovHalf * Math.PI / 180;
    var finalAngle = angleRad + randAngle;
    var dist = 1.5 + Math.random() * BANNER_RADIUS;
    var x = pLoc.getX() + Math.cos(finalAngle) * dist;
    var z = pLoc.getZ() + Math.sin(finalAngle) * dist;
    var y = findGroundY(world, Math.floor(x), Math.floor(z), Math.round(pLoc.getY()));

    var bannerLoc = new org.bukkit.Location(world, x, y, z);

    var list = bannerMap.get(uuid);
    if (list == null) {
        list = new java.util.ArrayList();
        bannerMap.put(uuid, list);
    }
    // 每玩家最多5个旌旗，超出移除最旧的
    if (list.size() >= BANNER_MAX_PER_PLAYER) {
        list.remove(0);
    }
    list.add({ loc: bannerLoc, born: Date.now() });
}

// ===================================================================
// 获得重锋：+1层，10秒加速1
// ===================================================================
function gainHeavyEdge(player) {
    var uuid = player.getUniqueId().toString();
    var stacks = heavyEdgeMap.containsKey(uuid) ? heavyEdgeMap.get(uuid) : 0;

    // 重置衰减计时
    heavyEdgeTimeMap.put(uuid, Date.now());

    if (stacks < HEAVY_EDGE_MAX) {
        stacks++;
        heavyEdgeMap.put(uuid, stacks);
    }

    // 10秒加速1
    if (TYPE_SPEED != null) {
        player.addPotionEffect(new PotionEffect(
            TYPE_SPEED, SPEED_DURATION_TICKS, SPEED_LEVEL, false, true, true
        ));
    }
    // 力量：每次踩旗在玩家身上叠加 +1 级、+10 秒
    // 例：踩10个旗 = 力量100持续100秒
    if (TYPE_STRENGTH != null) {
        var curStr = player.getPotionEffect(TYPE_STRENGTH);
        var baseLevel = (curStr != null) ? curStr.getAmplifier() : -1;
        var baseTicks = (curStr != null) ? curStr.getDuration() : 0;
        var newLevel = baseLevel + STRENGTH_LEVEL_ADD;               // 每次 +1 级
        var newTicks = baseTicks + STRENGTH_DURATION_TICKS;          // 每次 +10 秒
        player.addPotionEffect(new PotionEffect(
            TYPE_STRENGTH, newTicks, newLevel, false, true, true
        ));
    }

    if (stacks >= HEAVY_EDGE_MAX) {
        player.sendActionBar("\u00a7e\u91cd\u950b\u5df2\u6ee1\uff01\u00a76\u53f3\u952e\u53ef\u9547\u538b\u5468\u56f4\u76ee\u6807\uff01");
        player.sendMessage(MSG_HEAVY_FULL);
    } else {
        player.sendActionBar("\u00a76[\u91cd\u950b] \u00a7f" + stacks + "/" + HEAVY_EDGE_MAX);
    }
}

// ===================================================================
// 右键：重锋满3层时镇压
// ===================================================================
function onUse(event) {
    var player = event.getPlayer();
    if (!isHolding(player)) return;

    var uuid = player.getUniqueId().toString();
    var stacks = heavyEdgeMap.containsKey(uuid) ? heavyEdgeMap.get(uuid) : 0;

    if (stacks < HEAVY_EDGE_MAX) {
        player.sendActionBar("\u00a76[\u91cd\u950b] \u00a7f\u4e0d\u8db3\uff0c\u9700\u8981 " + HEAVY_EDGE_MAX + " \u5c42\uff08\u5f53\u524d " + stacks + " \u5c42\uff09");
        return;
    }

    // 消耗全部重锋，执行镇压
    heavyEdgeMap.remove(uuid);
    heavyEdgeTimeMap.remove(uuid);
    crush(player);
}

// ===================================================================
// 镇压：先施加失明与无法移动，然后30格高度发射30根深红长矛，
// 2秒落地，落地1秒后爆开消失，对视野内所有敌人造成250伤害
// ===================================================================
function crush(player) {
    var world = player.getWorld();
    var eyeLoc = player.getEyeLocation();
    var viewDir = eyeLoc.getDirection().normalize();

    player.sendActionBar("\u00a7c\u00a7l\u9547\u538b\uff01");
    player.sendMessage(MSG_CRUSH);
    world.playSound(eyeLoc, "entity.wither.shoot", 2.0, 0.6);
    world.playSound(eyeLoc, "entity.ender_dragon.growl", 1.5, 0.7);

    // 阶段1：视线120度30格内所有目标，施加6秒失明与6秒缓慢100（无法移动）
    var fovCos = Math.cos(CRUSH_FOV_DEG / 2 * Math.PI / 180); // cos60°=0.5
    var nearby = world.getNearbyEntities(eyeLoc, CRUSH_RANGE, CRUSH_RANGE, CRUSH_RANGE);
    var it = nearby.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent === player) continue;

        var toEnt = ent.getLocation().add(0, ent.getHeight() / 2, 0)
            .toVector().subtract(eyeLoc.toVector());
        if (toEnt.lengthSquared() < 0.0001) continue;
        var dot = viewDir.dot(toEnt.normalize());
        if (dot < fovCos) continue;

        if (TYPE_BLINDNESS != null) {
            ent.addPotionEffect(new PotionEffect(
                TYPE_BLINDNESS, CRUSH_BLIND_TICKS, 0, false, true, true
            ));
        }
        if (TYPE_SLOWNESS != null) {
            ent.addPotionEffect(new PotionEffect(
                TYPE_SLOWNESS, CRUSH_SLOWNESS_TICKS, CRUSH_SLOWNESS_LEVEL, false, true, true
            ));
        }
        // 目标被标记的微粒子
        world.spawnParticle(Particle.DUST, ent.getLocation().add(0, 1, 0), 5, 0.3, 0.5, 0.3, 0, DARK_RED_DUST);
    }

    // 阶段2：30格高度发射30根深红长矛（长4米，角度随机，随机分布在被镇压区域内）
    spawnSpears(world, player, eyeLoc);
}

// ===================================================================
// 深红长矛动画：30格高发射 -> 2秒落地 -> 落地1秒后爆开并造成伤害
// ===================================================================
function spawnSpears(world, player, eyeLoc) {
    var spears = new java.util.ArrayList();
    for (var i = 0; i < CRUSH_SPEAR_COUNT; i++) {
        // 在被镇压区域内随机地面落点（视线前方30格半径）
        var ang = Math.random() * Math.PI * 2;
        var dist = 2 + Math.random() * (CRUSH_RANGE - 2);
        var bx = eyeLoc.getX() + Math.cos(ang) * dist;
        var bz = eyeLoc.getZ() + Math.sin(ang) * dist;
        var gy = findGroundY(world, Math.floor(bx), Math.floor(bz), Math.floor(eyeLoc.getY()));
        var target = new org.bukkit.Location(world, bx, gy, bz);

        // 每根长矛独立随机倾角：方向随机 + 倾角5°~20°
        var tiltAng = Math.random() * Math.PI * 2;      // 倾斜方向（360°随机）
        var tiltDeg = CRUSH_SPEAR_TILT_MIN + Math.random() * (CRUSH_SPEAR_TILT_MAX - CRUSH_SPEAR_TILT_MIN); // 倾角
        var tiltRad = tiltDeg * Math.PI / 180;
        var dx = Math.sin(tiltRad) * Math.cos(tiltAng);
        var dz = Math.sin(tiltRad) * Math.sin(tiltAng);
        var dy = -Math.cos(tiltRad); // 向下

        // 发射方向向量（从30格高向落点倾斜下落）
        var spearDir = new Vector(dx, dy, dz);

        // 发射点：沿 dir 反方向偏移30格，确保尖端精确落到 target
        var start = target.clone().subtract(spearDir.clone().multiply(CRUSH_SPEAR_HEIGHT));
        spears.add({ start: start, target: target, dir: spearDir });
    }

    var elapsed = 0;
    var taskRef = null;

    var SpearTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                elapsed++;
                if (elapsed <= CRUSH_SPEAR_FALL_TICKS) {
                    // 下落中：渲染4米长深红长矛（沿各自随机倾角方向），
                    // elapsed==FALL 时 progress=1.0，长矛完整插到落点
                    var curProgress = Math.min(1.0, elapsed / CRUSH_SPEAR_FALL_TICKS);
                    for (var i = 0; i < spears.size(); i++) {
                        var sp = spears.get(i);
                        // 当前长矛头部位置：从 start 沿 dir 方向下落 curProgress 比例
                        var head = sp.start.clone()
                            .add(sp.dir.clone().multiply(CRUSH_SPEAR_HEIGHT * curProgress));
                        if (head.getY() < sp.target.getY()) continue; // 已越过落点
                        // 从头部向下渲染长4米的长矛（加粗：中心大粒子 + 四周4个偏移粒子，十字横截面）
                        for (var s = 0; s <= CRUSH_SPEAR_LENGTH * 2; s++) {
                            var lp = head.clone().subtract(sp.dir.clone().multiply(s * 0.5));
                            if (lp.getY() < sp.target.getY() - 0.5) break;
                            // 中心粗粒子
                            world.spawnParticle(Particle.DUST, lp, 1, 0, 0, 0, 0, DARK_RED_DUST_BIG);
                            // 四周偏移粒子（十字形，让长矛视觉更粗）
                            world.spawnParticle(Particle.DUST, lp.clone().add(0.22, 0, 0), 1, 0, 0, 0, 0, DARK_RED_DUST);
                            world.spawnParticle(Particle.DUST, lp.clone().add(-0.22, 0, 0), 1, 0, 0, 0, 0, DARK_RED_DUST);
                            world.spawnParticle(Particle.DUST, lp.clone().add(0, 0, 0.22), 1, 0, 0, 0, 0, DARK_RED_DUST);
                            world.spawnParticle(Particle.DUST, lp.clone().add(0, 0, -0.22), 1, 0, 0, 0, 0, DARK_RED_DUST);
                        }
                    }
                } else if (elapsed <= CRUSH_SPEAR_FALL_TICKS + CRUSH_SPEAR_HOLD_TICKS) {
                    // 已落地：落点维持深红印记（长矛本体效果），等待爆开
                    for (var i = 0; i < spears.size(); i++) {
                        var sp = spears.get(i);
                        // 沿长矛倾角方向在落点附近保留短柄效果
                        world.spawnParticle(Particle.DUST, sp.target.clone().add(0, 0.3, 0), 4, 0.4, 0.2, 0.4, 0, DARK_RED_DUST);
                        world.spawnParticle(Particle.FLAME, sp.target.clone().add(0, 0.3, 0), 3, 0.4, 0.1, 0.4, 0.02);
                    }
                } else {
                    // 落地后爆开：特效更散开且密集，对视野内所有敌人造成250伤害
                    for (var i = 0; i < spears.size(); i++) {
                        var sp = spears.get(i);
                        var boom = sp.target.clone().add(0, 1, 0);
                        // 大型爆发：深红+红+金，偏移大范围散开，粒子密且带速度飞散
                        world.spawnParticle(Particle.DUST, boom, 60, 3.2, 3.2, 3.2, 0.18, DARK_RED_DUST_BIG);
                        world.spawnParticle(Particle.DUST, boom, 60, 3.2, 3.2, 3.2, 0.18, RED_DUST_BIG);
                        world.spawnParticle(Particle.DUST, boom, 40, 2.6, 2.6, 2.6, 0.12, GOLD_DUST_BIG);
                        world.spawnParticle(Particle.FLAME, boom, 35, 2.2, 2.6, 2.2, 0.1);
                        world.spawnParticle(Particle.CRIT, boom, 30, 3.2, 3.2, 3.2, 0.35);
                        world.spawnParticle(Particle.CLOUD, boom, 20, 2.0, 1.5, 2.0, 0.05);
                        world.playSound(sp.target, "entity.generic.explode", 1.4, 0.75);
                        world.playSound(sp.target, "block.anvil.land", 1.0, 0.9);
                    }
                    // 对视野内所有敌人造成伤害
                    dealCrushDamage(player);
                    taskRef.cancel();
                }
            } catch (e) {
                plugin.getLogger().warning("[\u7834\u519b] \u957f\u77db\u52a8\u753b\u5f02\u5e38: " + e);
                if (taskRef != null) { try { taskRef.cancel(); } catch(e2){} }
            }
        }
    });
    taskRef = new SpearTask().runTaskTimer(plugin, 0, 1);
}

// ===================================================================
// 爆开后对视野内所有敌人造成250伤害
// ===================================================================
function dealCrushDamage(player) {
    if (!player.isOnline()) return;
    var world = player.getWorld();
    var eyeLoc = player.getEyeLocation();
    var viewDir = eyeLoc.getDirection().normalize();
    var fovCos = Math.cos(CRUSH_FOV_DEG / 2 * Math.PI / 180);

    var nearby = world.getNearbyEntities(eyeLoc, CRUSH_RANGE, CRUSH_RANGE, CRUSH_RANGE);
    var it = nearby.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent === player) continue;

        var toEnt = ent.getLocation().add(0, ent.getHeight() / 2, 0)
            .toVector().subtract(eyeLoc.toVector());
        if (toEnt.lengthSquared() < 0.0001) continue;
        var dot = viewDir.dot(toEnt.normalize());
        if (dot < fovCos) continue;

        dealSitDamage(ent, player, player.getInventory().getItemInMainHand(), SIT_CRUSH_MULT);
        var entLoc = ent.getLocation().add(0, ent.getHeight() / 2, 0);
        world.spawnParticle(Particle.DUST, entLoc, 25, 0.8, 1.2, 0.8, 0, RED_DUST_BIG);
        world.playSound(entLoc, "entity.player.attack.crit", 1.5, 0.7);
    }
}

// ===================================================================
// 旌旗渲染与靠近检测任务
// ===================================================================
var bannerTask = null;
function startBannerTask() {
    if (bannerTask != null) {
        try { bannerTask.cancel(); } catch (e) {}
        bannerTask = null;
    }
    var BannerTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                var now = Date.now();
                var it = bannerMap.entrySet().iterator();
                while (it.hasNext()) {
                    var entry = it.next();
                    var uuid = entry.getKey();
                    var list = entry.getValue();
                    var out = new java.util.ArrayList();
                    var plEntity = Bukkit.getEntity(UUIDClass.fromString(uuid));
                    var pl = (plEntity instanceof Player) ? plEntity : null;
                    var w = (pl != null && pl.isOnline()) ? pl.getWorld() : null;

                    for (var i = 0; i < list.size(); i++) {
                        var banner = list.get(i);
                        var loc = banner.loc;

                        // 超出存活时间则移除
                        if (now - banner.born > BANNER_LIFETIME_MS) continue;

                        out.add(banner);

                        if (w == null) continue;

                        // 旌旗粒子效果：地面金色光环 + 内部竖直光柱 + 顶部金红旗帜飘动
                        // 1. 地面金色光环（旋转扩散）
                        for (var ring = 0; ring < 3; ring++) {
                            var rAng = (now / 250.0 + ring * 2.094);
                            var rx = Math.cos(rAng) * 0.9;
                            var rz = Math.sin(rAng) * 0.9;
                            var rLoc = loc.clone().add(rx, 0.15 + ring * 0.12, rz);
                            w.spawnParticle(Particle.DUST, rLoc, 1, 0, 0, 0, 0, GOLD_DUST);
                        }
                        // 2. 竖直光柱（金红交替，螺旋上升）
                        var steps = Math.floor(BANNER_HEIGHT / 0.3);
                        for (var h = 0; h <= steps; h++) {
                            var yOff = (h / steps) * BANNER_HEIGHT;
                            var helixAng = now / 150.0 + h * 0.8;
                            var hx = Math.cos(helixAng) * 0.35;
                            var hz = Math.sin(helixAng) * 0.35;
                            var pLoc = loc.clone().add(hx, yOff, hz);
                            w.spawnParticle(Particle.DUST, pLoc, 1, 0, 0, 0, 0,
                                (h % 2 === 0) ? GOLD_DUST : RED_DUST);
                        }
                        // 3. 顶部金红旗帜飘动（横向摆动）
                        var sway = Math.sin(now / 200.0);
                        for (var f = 0; f < 6; f++) {
                            var fOff = (f / 5.0) * 1.4;
                            var fLoc = loc.clone().add(sway * (0.4 + f * 0.15), BANNER_HEIGHT - 0.2, fOff - 0.7);
                            w.spawnParticle(Particle.DUST, fLoc, 1, 0.06, 0.06, 0.06, 0,
                                (f % 2 === 0) ? RED_DUST : GOLD_DUST);
                        }
                        // 4. 顶部火焰光点
                        w.spawnParticle(Particle.FLAME, loc.clone().add(0, BANNER_HEIGHT, 0), 1, 0.08, 0.08, 0.08, 0);
                    }
                    if (out.size() > 0) bannerMap.put(uuid, out);
                    else it.remove();

                    // 踩踏检测：玩家踩到旌旗 -> 音效 + 旌旗消失 + 触发重锋
                    if (pl != null && pl.isOnline() && out.size() > 0) {
                        var plLoc = pl.getLocation();
                        for (var i2 = 0; i2 < out.size(); i2++) {
                            var b = out.get(i2);
                            var bLoc = b.loc;
                            var dx = plLoc.getX() - bLoc.getX();
                            var dz = plLoc.getZ() - bLoc.getZ();
                            // 水平1.2格内且y差1.5格内视为踩到
                            if (Math.abs(dx) <= BANNER_TRIGGER_DIST && Math.abs(dz) <= BANNER_TRIGGER_DIST
                                && Math.abs(plLoc.getY() - bLoc.getY()) <= 1.5) {
                                // 重锤命中声（触发感）
                                w.playSound(bLoc, "entity.player.attack.crit", 1.2, 0.6);
                                w.playSound(bLoc, "block.anvil.land", 1.4, 0.7);
                                w.playSound(bLoc, "entity.generic.explode", 1.2, 0.5);
                                // 踩踏粒子爆炸效果：金色+红色爆发扩散
                                w.spawnParticle(Particle.DUST, bLoc.clone().add(0, 0.5, 0), 50, 2.0, 1.6, 2.0, 0.25, GOLD_DUST_BIG);
                                w.spawnParticle(Particle.DUST, bLoc.clone().add(0, 0.5, 0), 50, 2.0, 1.6, 2.0, 0.25, RED_DUST_BIG);
                                w.spawnParticle(Particle.FLAME, bLoc.clone().add(0, 0.5, 0), 25, 1.6, 1.4, 1.6, 0.15);
                                w.spawnParticle(Particle.CRIT, bLoc.clone().add(0, 0.5, 0), 20, 2.0, 1.6, 2.0, 0.4);
                                w.spawnParticle(Particle.CLOUD, bLoc.clone().add(0, 0.3, 0), 15, 1.5, 0.8, 1.5, 0.05);
                                // 旌旗消失
                                out.remove(i2);
                                gainHeavyEdge(pl);
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                plugin.getLogger().warning("[\u7834\u519b] \u65cc\u65d7\u4efb\u52a1\u5f02\u5e38: " + e);
            }
        }
    });
    bannerTask = new BannerTask().runTaskTimer(plugin, 0, 1);
}

// ===================================================================
// 重锋衰减任务：每5秒减少一层
// ===================================================================
var heavyEdgeTask = null;
function startHeavyEdgeDecay() {
    if (heavyEdgeTask != null) {
        try { heavyEdgeTask.cancel(); } catch (e) {}
        heavyEdgeTask = null;
    }
    var DecayTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                var now = Date.now();
                var entries = heavyEdgeMap.entrySet().toArray();
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    var uuid = entry.getKey();
                    var stacks = entry.getValue();
                    if (stacks <= 0) {
                        heavyEdgeMap.remove(uuid);
                        heavyEdgeTimeMap.remove(uuid);
                        continue;
                    }
                    var last = heavyEdgeTimeMap.containsKey(uuid) ? heavyEdgeTimeMap.get(uuid) : now;
                    if (!heavyEdgeTimeMap.containsKey(uuid)) {
                        heavyEdgeTimeMap.put(uuid, now);
                    }
                    if (now - last >= HEAVY_EDGE_DECAY_MS) {
                        stacks--;
                        heavyEdgeTimeMap.put(uuid, now);
                        if (stacks <= 0) {
                            heavyEdgeMap.remove(uuid);
                            heavyEdgeTimeMap.remove(uuid);
                        } else {
                            heavyEdgeMap.put(uuid, stacks);
                            var plEntity = Bukkit.getEntity(UUIDClass.fromString(uuid));
                            var pl = (plEntity instanceof Player) ? plEntity : null;
                            if (pl != null && pl.isOnline()) {
                                pl.sendActionBar("\u00a76[\u91cd\u950b] \u00a77\u8870\u51cf \u00a7f" + stacks + "/" + HEAVY_EDGE_MAX);
                            }
                        }
                    }
                }
            } catch (e) {
                plugin.getLogger().warning("[\u7834\u519b] \u91cd\u950b\u8870\u51cf\u4efb\u52a1\u5f02\u5e38: " + e);
            }
        }
    });
    heavyEdgeTask = new DecayTask().runTaskTimer(plugin, 0, 20);
}

// ===================================================================
// 忽视60%护甲与韧性：EntityDamageByEntityEvent
// 直接基于原始伤害按"护甲+韧性"公式重算，将减免比例降至40%
// ===================================================================
function ignoreArmor(event) {
    var damager = event.getDamager();
    if (!(damager instanceof Player)) return;
    var player = damager;
    if (!isHolding(player)) return;
    if (event.isCancelled()) return;

    var target = event.getEntity();
    if (!(target instanceof LivingEntity)) return;

    // Paper API：原始伤害（护甲计算前）
    var original;
    try { original = event.getOriginalDamage(); } catch (e) { return; }
    if (original <= 0) return;

    var finalDmg = event.getDamage();

    // 计算目标原本的护甲减免比例（护甲 + 韧性综合）
    // 已减免量 = 原伤 - 最终伤
    var reduced = Math.max(0, original - finalDmg);
    if (reduced <= 0) return; // 无护甲减免，无需处理

    // 原减免率 = 减免量 / 原伤
    var reductionRate = reduced / original;

    // 忽视60%护甲：新减免率 = 原减免率 * 40%
    var newReductionRate = reductionRate * (1 - ARMOR_IGNORE_RATE);

    // 新伤害 = 原伤 * (1 - 新减免率)
    var newDamage = original * (1 - newReductionRate);

    event.setDamage(newDamage);
}

// ===================================================================
// 事件监听器注册（参考 伏地.js 热重载安全模式）
// ===================================================================
var pojunListener = new (Java.extend(Listener, {}))();
var RunnableImpl = Java.extend(Java.type('java.lang.Runnable'));
var initPojunListener = new RunnableImpl({
    run: function() {
        // 热重载时先注销旧监听器
        if (plugin.pojunListenerRegistered === true && plugin.pojunListener != null) {
            try { PlayerInteractEvent.getHandlerList().unregister(plugin.pojunListener); } catch (e) {}
            try { EntityDamageByEntityEvent.getHandlerList().unregister(plugin.pojunListener); } catch (e) {}
        }
        plugin.pojunListener = pojunListener;
        plugin.pojunListenerRegistered = true;

        // 右键
        Bukkit.getPluginManager().registerEvent(
            PlayerInteractEvent,
            pojunListener,
            EventPriority.NORMAL,
            function (l, event) {
                try {
                    var actionName = event.getAction().name();
                    if (actionName !== "RIGHT_CLICK_AIR" && actionName !== "RIGHT_CLICK_BLOCK") return;
                    var hand = event.getHand();
                    if (hand == null || hand.name() !== "HAND") return;
                    onUse(event);
                } catch (e) {}
            },
            plugin
        );

        // 攻击：忽视护甲 + 生成旌旗 + 缓慢3
        Bukkit.getPluginManager().registerEvent(
            EntityDamageByEntityEvent,
            pojunListener,
            EventPriority.HIGHEST,
            function (l, event) {
                try {
                    if (event.isCancelled()) return;
                    var damager = event.getDamager();
                    if (!(damager instanceof Player)) return;
                    if (!isHolding(damager)) return;
                    var target = event.getEntity();
                    if (!(target instanceof LivingEntity)) return;
                    ignoreArmor(event);
                    onHit(damager, target);
                } catch (e) {}
            },
            plugin
        );
    }
});
Bukkit.getScheduler().runTask(plugin, initPojunListener);

// 启动两个任务
var startTasksRunnable = new RunnableImpl({
    run: function() {
        startBannerTask();
        startHeavyEdgeDecay();
    }
});
Bukkit.getScheduler().runTask(plugin, startTasksRunnable);
