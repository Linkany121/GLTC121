
// === Java 类型导入 ===
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Vector = Java.type("org.bukkit.util.Vector");
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var BarColor = Java.type("org.bukkit.boss.BarColor");
var BarStyle = Java.type("org.bukkit.boss.BarStyle");
var UUIDClass = Java.type("java.util.UUID");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;

var ITEM_ID = "FKR_风墟龙冕";
// 气斩/剑气造成伤害时的实体标记，用于防止 EntityDamageByEntityEvent 递归触发气斩
var META_SWORD_QI_DAMAGE = "fx_sword_qi_damage";

// === 药水效果类型 ===
var TYPE_LEVITATION = PotionEffectType.getByName("LEVITATION");
var TYPE_BLINDNESS  = PotionEffectType.getByName("BLINDNESS");
var TYPE_SPEED      = PotionEffectType.getByName("SPEED");

// === 气斩参数 ===
var AIR_SLASH_COOLDOWN_MS       = 500;   // 再装填0.8秒
var AIR_SLASH_DAMAGE            = 40;    // 伤害
var AIR_SLASH_SPEED             = 1.1;  // 
var AIR_SLASH_RANGE             = 16;    // 持续16格
var AIR_SLASH_HALF_LENGTH       = 2.5;     // 剑气半长（格）
var AIR_SLASH_LEVITATION_TICKS  = 10;    // 1秒飘浮
var AIR_SLASH_LEVITATION_LEVEL  = 4;     // 飘浮 IV（amplifier=3）
// 普通气斩粒子密度
var AIR_SLASH_PARTICLE_GAP       = 0.25;  // 剑气线粒子间距（格），越小越密
var AIR_SLASH_CLOUD_COUNT        = 2;    // 每个点的 CLOUD 粒子数量
var AIR_SLASH_CLOUD_OFFSET       = 0.04; // CLOUD 粒子散布偏移
var AIR_SLASH_END_ROD_INTERVAL   = 1;    // 每隔 N 个点生成一个 END_ROD
var AIR_SLASH_END_ROD_COUNT      = 1;    // END_ROD 粒子数量

// === 竖直剑气参数 ===
var VERTICAL_DAMAGE             = 120;   // 伤害
var VERTICAL_SPEED              = 1.0;   // 每秒4格 = 0.2格/tick
var VERTICAL_RANGE              = 24;    // 持续24格
var VERTICAL_HALF_HEIGHT_START  = 1;     // 起始：上下各延伸1格
var VERTICAL_HALF_HEIGHT_MAX    = 6;     // 最大：上下各延伸5格
var VERTICAL_GROW_DISTANCE      = 24;    // 飞行20格时高度增长到最大
var VERTICAL_LEVITATION_TICKS   = 10;    // 1秒飘浮
var VERTICAL_LEVITATION_LEVEL   = 16;     // 飘浮 IX（amplifier=8）
var VERTICAL_BLINDNESS_TICKS    = 40;    // 2秒失明
var VERTICAL_BLINDNESS_LEVEL    = 0;     // 失明 I
// 竖直剑气粒子密度
var VERTICAL_PARTICLE_GAP       = 0.1;  // 竖直线粒子间距（格），越小越密
var VERTICAL_CLOUD_COUNT        = 2;    // 每个点的 CLOUD 粒子数量
var VERTICAL_CLOUD_OFFSET       = 0.03; // CLOUD 粒子散布偏移
var VERTICAL_END_ROD_COUNT      = 1;    // 每个点的 END_ROD 粒子数量
var VERTICAL_END_ROD_OFFSET     = 0.02; // END_ROD 粒子散布偏移

// === 风脉系统参数 ===
var WIND_VEIN_MAX          = 3;     // 风脉最大层数
var SPEED_DURATION_TICKS   = 120;   // 速度 II 持续5秒
var SPEED_LEVEL            = 2;     // 速度 II（amplifier=1）
var WIND_VEIN_DECAY_MS     = 5000;  // 风脉每5秒减少一层

// === 击退参数 ===
var AIR_SLASH_KNOCKBACK    = 0.5;   // 普通气斩击退力度
var VERTICAL_KNOCKBACK     = 1.2;   // 竖直剑气击退力度

// === 解锁/释放提示消息 ===
var MSG_UNLOCK = "§x§f§f§f§9§6§f此§x§e§f§f§a§7§3剑§x§d§f§f§a§7§7曾§x§c§f§f§b§7§b守§x§b§f§f§c§7§f万§x§a§f§f§c§8§3仞§x§9§f§f§d§8§7群§x§8§f§f§e§8§b山§x§7§f§f§e§8§f，§x§6§f§f§f§9§3今§x§6§7§f§f§9§f朝§x§5§f§f§f§a§b—§x§5§7§f§f§b§7—§x§4§f§f§f§c§3—§x§4§6§f§f§c§f锋§x§3§e§f§f§d§b芒§x§3§6§f§f§e§7重§x§2§e§f§f§f§3现§x§2§6§f§f§f§f！";
var MSG_VERTICAL = "§x§f§f§8§c§4§b§l我§x§f§f§9§9§4§a§l曾§x§f§e§a§6§4§9§l屠§x§f§e§b§2§4§9§l尽§x§f§e§b§f§4§8§l，§x§f§d§c§c§4§7§l犯§x§f§d§d§9§4§6§l疆§x§f§d§e§5§4§6§l狂§x§f§c§f§2§4§5§l鳞§x§f§c§f§f§4§4§l！";

// === 气斩角度（轮流） ===
var AIR_SLASH_ANGLES = [0, 40, -40];

// === 状态映射 ===
var angleIndexMap    = new java.util.HashMap();  // UUID -> 角度索引
var windVeinMap      = new java.util.HashMap();  // UUID -> 风脉层数
var windVeinDecayMap = new java.util.HashMap();  // UUID -> 上次风脉衰减时间(ms)
var windVeinBarMap   = new java.util.HashMap();  // UUID -> BossBar（风脉倒计时显示）
var leftClickCdMap   = new java.util.HashMap();  // UUID -> 上次左键时间(ms)

// ===================================================================
// 辅助：检查方块是否阻挡
// ===================================================================
function isBlockBlocking(block) {
    var type = block.getType();
    if (type.isAir()) return false;
    try { return !block.isPassable(); } catch (e) { return type.isSolid(); }
}

// ===================================================================
// 辅助：绕Y轴旋转向量
// ===================================================================
function rotateAroundY(vec, angleRad) {
    var s = Math.sin(angleRad);
    var c = Math.cos(angleRad);
    var x = vec.getX(), z = vec.getZ();
    return new Vector(x * c - z * s, vec.getY(), x * s + z * c);
}

// ===================================================================
// 辅助：检查玩家是否手持风墟龙冕
// ===================================================================
function isHoldingItem(player) {
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(item);
    return sfItem != null && sfItem.getId() === ITEM_ID;
}

// ===================================================================
// 右键：释放竖直剑气（风脉>=4时可用）
// ===================================================================
function onUse(event) {
    var player = event.getPlayer();
    if (!isHoldingItem(player)) return;

    var uuid = player.getUniqueId().toString();
    var stacks = windVeinMap.containsKey(uuid) ? windVeinMap.get(uuid) : 0;

    if (stacks < WIND_VEIN_MAX) {
        player.sendActionBar("\u00a7b[\u98ce\u8109] \u00a77\u4e0d\u8db3 \u00a7f" + stacks + "/" + WIND_VEIN_MAX);
        return;
    }

    // 消耗风脉，释放竖直剑气
    windVeinMap.put(uuid, 0);
    windVeinDecayMap.remove(uuid);
    removeWindVeinBar(uuid);
    releaseVerticalSwordQi(player);
}

// ===================================================================
// 左键：释放气斩
// ===================================================================
function tryAirSlash(player) {
    var uuid = player.getUniqueId().toString();
    var now = Date.now();

    // 冷却检查
    if (leftClickCdMap.containsKey(uuid) && (now - leftClickCdMap.get(uuid)) < AIR_SLASH_COOLDOWN_MS) {
        return;
    }
    leftClickCdMap.put(uuid, now);

    // 获取下一个角度
    var angleIdx = angleIndexMap.containsKey(uuid) ? angleIndexMap.get(uuid) : 0;
    var angle = AIR_SLASH_ANGLES[angleIdx];
    angleIndexMap.put(uuid, (angleIdx + 1) % AIR_SLASH_ANGLES.length);

    releaseAirSlash(player, angle);
}

// ===================================================================
// 风脉结算：命中瞬间立即执行（+1层，满层给予速度2）
// ===================================================================
function awardWindVein(player) {
    try {
        if (!player.isOnline()) return;
        var uuid = player.getUniqueId().toString();
        var stacks = windVeinMap.containsKey(uuid) ? windVeinMap.get(uuid) : 0;
        // 确保衰减任务运行中（惰性启动）
        ensureDecayTask();
        // 每次获得风脉都重置倒计时
        windVeinDecayMap.put(uuid, Date.now());
        if (stacks >= WIND_VEIN_MAX) {
            // 已满层：仅刷新计时维持满层状态，不再叠加
            return;
        }
        stacks++;
        windVeinMap.put(uuid, stacks);

        // 同步更新 BossBar 显示（重置后剩余为满 5 秒），层数仅由 BossBar 展示
        updateWindVeinBar(uuid, player, stacks, 5);

        if (stacks >= WIND_VEIN_MAX) {
            // 风脉满：给予速度2，可释放竖直剑气
            if (TYPE_SPEED != null) {
                player.addPotionEffect(new PotionEffect(
                    TYPE_SPEED, SPEED_DURATION_TICKS, SPEED_LEVEL, false, true, true
                ));
            }
            player.sendActionBar("\u00a7x\u00a74\u00a7b\u00a7f\u00a7f\u00a7c\u00a79\u98ce\u00a7x\u00a74\u00a7a\u00a7f\u00a7b\u00a7c\u00a7f\u8109\u00a7x\u00a74\u00a79\u00a7f\u00a77\u00a7d\u00a75\u6ee1\u00a7x\u00a74\u00a79\u00a7f\u00a74\u00a7d\u00a7b\u6ea2\u00a7x\u00a74\u00a78\u00a7f\u00a70\u00a7e\u00a71\uff0c\u00a7x\u00a74\u00a77\u00a7e\u00a7c\u00a7e\u00a77\u5347\u00a7x\u00a74\u00a76\u00a7e\u00a78\u00a7e\u00a7d\u9f99\u00a7x\u00a74\u00a76\u00a7e\u00a75\u00a7f\u00a73\u89e3\u00a7x\u00a74\u00a75\u00a7e\u00a71\u00a7f\u00a79\u653e\u00a7x\u00a74\u00a74\u00a7d\u00a7d\u00a7f\u00a7f\uff01");
            player.sendMessage(MSG_UNLOCK);
            player.getWorld().playSound(player.getLocation(), "block.beacon.power_select", 1.2, 1.5);
        }
    } catch (e) {
        plugin.getLogger().warning("[\u98ce\u9f99\u51a0] \u98ce\u8109\u7ed3\u7b97\u5f02\u5e38: " + e);
    }
}

// ===================================================================
// 释放气斩
// ===================================================================
function releaseAirSlash(player, angleDeg) {
    var world = player.getWorld();
    var eyeLoc = player.getEyeLocation();
    var dir = eyeLoc.getDirection().normalize();

    // 构建局部坐标系
    var worldUp = new Vector(0, 1, 0);
    var right = dir.clone().crossProduct(worldUp).normalize();
    if (right.lengthSquared() < 0.001) right = new Vector(1, 0, 0);
    var up = right.clone().crossProduct(dir).normalize();

    // 剑气方向：水平为0°，绕前向轴旋转
    var angleRad = angleDeg * Math.PI / 180;
    var slashDir = right.clone().multiply(Math.cos(angleRad))
                   .add(up.clone().multiply(Math.sin(angleRad))).normalize();

    // 蒸汽音效
    world.playSound(eyeLoc, "block.fire.extinguish", 1.0, 1.6);
    world.playSound(eyeLoc, "entity.player.attack.sweep", 0.6, 1.8);
    world.playSound(eyeLoc, "entity.wither.shoot", 0.8, 1.2);

    // 状态追踪（veinAwarded 确保每次气斩最多+1层风脉）
    var state = { distance: 0, veinAwarded: false };
    var hitEntities = new java.util.HashSet();
    var taskRef = null;

    var SlashTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                if (state.distance >= AIR_SLASH_RANGE) {
                    taskRef.cancel();
                    return;
                }

                var center = eyeLoc.clone().add(dir.clone().multiply(state.distance));

                // 方块阻挡检测
                if (isBlockBlocking(center.getBlock())) {
                    // 撞击粒子
                    world.spawnParticle(Particle.CLOUD, center, 15, 0.5, 0.5, 0.5, 0.05);
                    world.spawnParticle(Particle.POOF, center, 10, 0.3, 0.3, 0.3, 0.03);
                    taskRef.cancel();
                    return;
                }

                // 沿剑气线生成白色蒸汽粒子（密度由参数控制，粒子无漂移速度以贴合剑气）
                var totalSteps = Math.round(AIR_SLASH_HALF_LENGTH * 2 / AIR_SLASH_PARTICLE_GAP);
                for (var pi = 0; pi <= totalSteps; pi++) {
                    var pLoc = center.clone().add(slashDir.clone().multiply(-AIR_SLASH_HALF_LENGTH + pi * AIR_SLASH_PARTICLE_GAP));
                    world.spawnParticle(Particle.CLOUD, pLoc, AIR_SLASH_CLOUD_COUNT,
                        AIR_SLASH_CLOUD_OFFSET, AIR_SLASH_CLOUD_OFFSET, AIR_SLASH_CLOUD_OFFSET, 0.0);
                    if (pi % AIR_SLASH_END_ROD_INTERVAL === 0) {
                        world.spawnParticle(Particle.END_ROD, pLoc, AIR_SLASH_END_ROD_COUNT,
                            0.02, 0.02, 0.02, 0.0);
                    }
                }

                // 实体碰撞检测（不被生物阻挡，但伤害经过的生物）
                var nearby = world.getNearbyEntities(
                    center, AIR_SLASH_HALF_LENGTH + 0.8, 1.2, 1.2
                );
                var it = nearby.iterator();
                while (it.hasNext()) {
                    var ent = it.next();
                    if (!(ent instanceof LivingEntity) || ent === player) continue;
                    var entId = ent.getUniqueId().toString();
                    if (hitEntities.contains(entId)) continue;

                    // 精确检测：实体到剑气线的距离
                    var entLoc = ent.getLocation().add(0, ent.getHeight() / 2, 0);
                    var toEnt = entLoc.toVector().subtract(center.toVector());
                    var projLen = toEnt.dot(slashDir);
                    if (Math.abs(projLen) > AIR_SLASH_HALF_LENGTH + 0.5) continue;
                    var closest = center.toVector().add(slashDir.clone().multiply(projLen));
                    if (closest.distance(entLoc.toVector()) > 1.2) continue;

                    hitEntities.add(entId);
                    // 标记本次伤害来源为气斩，避免 EntityDamageByEntityEvent 递归触发新的气斩
                    try { ent.setMetadata(META_SWORD_QI_DAMAGE, new FixedMetadataValue(plugin, true)); } catch (e) {}
                    ent.setNoDamageTicks(0);
                    ent.damage(AIR_SLASH_DAMAGE, player);
                    try { ent.removeMetadata(META_SWORD_QI_DAMAGE, plugin); } catch (e) {}
                    // 击退：沿剑气飞行方向（水平化），而非剑气线方向
                    var knockDir = dir.clone();
                    knockDir.setY(0);
                    if (knockDir.lengthSquared() < 0.001) knockDir = new Vector(1, 0, 0);
                    knockDir.normalize();
                    ent.setVelocity(ent.getVelocity().add(knockDir.multiply(AIR_SLASH_KNOCKBACK)));
                    if (TYPE_LEVITATION != null) {
                        ent.addPotionEffect(new PotionEffect(
                            TYPE_LEVITATION, AIR_SLASH_LEVITATION_TICKS, AIR_SLASH_LEVITATION_LEVEL,
                            false, true, true
                        ));
                    }
                    // 命中粒子
                    world.spawnParticle(Particle.CLOUD, entLoc, 8, 0.3, 0.3, 0.3, 0.03);
                    // 命中瞬间结算风脉（每次气斩最多+1层）
                    if (!state.veinAwarded) {
                        state.veinAwarded = true;
                        awardWindVein(player);
                    }
                }

                state.distance += AIR_SLASH_SPEED;
            } catch (e) {
                if (taskRef != null) { try { taskRef.cancel(); } catch(e2){} }
            }
        }
    });
    taskRef = new SlashTask().runTaskTimer(plugin, 0, 1);
}

// ===================================================================
// 释放竖直剑气（3道同时发射）
// ===================================================================
function releaseVerticalSwordQi(player) {
    var world = player.getWorld();
    var eyeLoc = player.getEyeLocation();
    var baseDir = eyeLoc.getDirection().normalize();
    baseDir.setY(0);
    if (baseDir.lengthSquared() < 0.001) baseDir = new Vector(0, 0, 1);
    baseDir.normalize();

    // 3个方向：正前方、右侧30°、左侧30°
    var angles = [0, -30, 30]; // 度

    player.sendActionBar("\u00a7x\u00a7f\u00a7f\u00a78\u00a7c\u00a74\u00a7b\u00a7l\u6211\u00a7x\u00a7f\u00a7f\u00a79\u00a79\u00a74\u00a7a\u00a7l\u66fe\u00a7x\u00a7f\u00a7e\u00a7a\u00a76\u00a74\u00a79\u00a7l\u5c60\u00a7x\u00a7f\u00a7e\u00a7b\u00a72\u00a74\u00a79\u00a7l\u5c3d\u00a7x\u00a7f\u00a7e\u00a7b\u00a7f\u00a74\u00a78\u00a7l\uff0c\u00a7x\u00a7f\u00a7d\u00a7c\u00a7c\u00a74\u00a77\u00a7l\u72af\u00a7x\u00a7f\u00a7d\u00a7d\u00a79\u00a74\u00a76\u00a7l\u7586\u00a7x\u00a7f\u00a7d\u00a7e\u00a75\u00a74\u00a76\u00a7l\u72c2\u00a7x\u00a7f\u00a7c\u00a7f\u00a72\u00a74\u00a75\u00a7l\u9cde\u00a7x\u00a7f\u00a7c\u00a7f\u00a7f\u00a74\u00a74\u00a7l\uff01");
    player.sendMessage(MSG_VERTICAL);
    // 龙吼
    world.playSound(eyeLoc, "entity.ender_dragon.growl", 2.0, 0.8);
    world.playSound(eyeLoc, "block.fire.extinguish", 2.0, 0.7);
    world.playSound(eyeLoc, "entity.player.attack.sweep", 1.5, 0.5);
    world.playSound(eyeLoc, "entity.wither.shoot", 1.0, 1.2);

    for (var a = 0; a < angles.length; a++) {
        var angleRad = angles[a] * Math.PI / 180;
        var beamDir = rotateAroundY(baseDir, angleRad);
        fireVerticalBeam(world, eyeLoc, beamDir, player);
    }
}

// ===================================================================
// 发射单道竖直剑气
// ===================================================================
function fireVerticalBeam(world, start, dir, player) {
    var state = { distance: 0 };
    var hitEntities = new java.util.HashSet();
    var taskRef = null;

    var BeamTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                if (state.distance >= VERTICAL_RANGE) {
                    taskRef.cancel();
                    return;
                }

                var center = start.clone().add(dir.clone().multiply(state.distance));

                // 方块阻挡检测
                if (isBlockBlocking(center.getBlock())) {
                    world.spawnParticle(Particle.CLOUD, center, 20, 0.8, 1.0, 0.8, 0.05);
                    world.spawnParticle(Particle.POOF, center, 15, 0.5, 0.5, 0.5, 0.03);
                    taskRef.cancel();
                    return;
                }

                // 高度渐变：从上下各1格增长，飞行20格时达到上下各5格
                var grow = Math.min(1.0, state.distance / VERTICAL_GROW_DISTANCE);
                var halfHeight = VERTICAL_HALF_HEIGHT_START +
                    (VERTICAL_HALF_HEIGHT_MAX - VERTICAL_HALF_HEIGHT_START) * grow;

                // 竖直粒子线（密度由参数控制）
                for (var h = -halfHeight; h <= halfHeight; h += VERTICAL_PARTICLE_GAP) {
                    var pLoc = center.clone().add(0, h, 0);
                    world.spawnParticle(Particle.CLOUD, pLoc, VERTICAL_CLOUD_COUNT,
                        VERTICAL_CLOUD_OFFSET, VERTICAL_CLOUD_OFFSET, VERTICAL_CLOUD_OFFSET, 0.0);
                    world.spawnParticle(Particle.END_ROD, pLoc, VERTICAL_END_ROD_COUNT,
                        VERTICAL_END_ROD_OFFSET, VERTICAL_END_ROD_OFFSET, VERTICAL_END_ROD_OFFSET, 0.0);
                }

                // 实体碰撞检测（高度随当前剑气尺寸变化）
                var nearby = world.getNearbyEntities(
                    center, 1.5, halfHeight + 1.0, 1.5
                );
                var it = nearby.iterator();
                while (it.hasNext()) {
                    var ent = it.next();
                    if (!(ent instanceof LivingEntity) || ent === player) continue;
                    var entId = ent.getUniqueId().toString();
                    if (hitEntities.contains(entId)) continue;

                    hitEntities.add(entId);
                    // 标记本次伤害来源为剑气，避免 EntityDamageByEntityEvent 递归触发气斩
                    try { ent.setMetadata(META_SWORD_QI_DAMAGE, new FixedMetadataValue(plugin, true)); } catch (e) {}
                    ent.setNoDamageTicks(0);
                    ent.damage(VERTICAL_DAMAGE, player);
                    try { ent.removeMetadata(META_SWORD_QI_DAMAGE, plugin); } catch (e) {}
                    // 击退：沿剑气方向
                    ent.setVelocity(ent.getVelocity().add(dir.clone().multiply(VERTICAL_KNOCKBACK)));
                    if (TYPE_LEVITATION != null) {
                        ent.addPotionEffect(new PotionEffect(
                            TYPE_LEVITATION, VERTICAL_LEVITATION_TICKS, VERTICAL_LEVITATION_LEVEL,
                            false, true, true
                        ));
                    }
                    if (TYPE_BLINDNESS != null) {
                        ent.addPotionEffect(new PotionEffect(
                            TYPE_BLINDNESS, VERTICAL_BLINDNESS_TICKS, VERTICAL_BLINDNESS_LEVEL,
                            false, true, true
                        ));
                    }
                    // 命中爆发粒子
                    var entLoc = ent.getLocation().add(0, ent.getHeight() / 2, 0);
                    world.spawnParticle(Particle.CLOUD, entLoc, 15, 0.5, 0.5, 0.5, 0.05);
                    world.spawnParticle(Particle.END_ROD, entLoc, 8, 0.3, 0.3, 0.3, 0.03);
                    world.playSound(entLoc, "entity.player.attack.sweep", 1.0, 0.8);
                }

                state.distance += VERTICAL_SPEED;
            } catch (e) {
                if (taskRef != null) { try { taskRef.cancel(); } catch(e2){} }
            }
        }
    });
    taskRef = new BeamTask().runTaskTimer(plugin, 0, 1);
}

// ===================================================================
// 事件监听器注册（左键检测）
// 参考 伏地.js 的热重载安全注册模式
// ===================================================================
var fengxuListener = new (Java.extend(Listener, {}))();
var RunnableImpl = Java.extend(Java.type('java.lang.Runnable'));
var initFengxuListener = new RunnableImpl({
    run: function() {
        // 热重载时先注销旧监听器
        if (plugin.fengxuListenerRegistered === true && plugin.fengxuListener != null) {
            try { PlayerInteractEvent.getHandlerList().unregister(plugin.fengxuListener); } catch (e) {}
            try { EntityDamageByEntityEvent.getHandlerList().unregister(plugin.fengxuListener); } catch (e) {}
        }
        plugin.fengxuListener = fengxuListener;
        plugin.fengxuListenerRegistered = true;

        // 注册 PlayerInteractEvent：检测左键空气/方块
        Bukkit.getPluginManager().registerEvent(
            PlayerInteractEvent,
            fengxuListener,
            EventPriority.NORMAL,
            function (l, event) {
                try {
                    var actionName = event.getAction().name();
                    if (actionName !== "LEFT_CLICK_AIR" && actionName !== "LEFT_CLICK_BLOCK") return;
                    var hand = event.getHand();
                    if (hand == null || hand.name() !== "HAND") return;
                    var player = event.getPlayer();
                    if (!isHoldingItem(player)) return;
                    tryAirSlash(player);
                } catch (e) {}
            },
            plugin
        );

        // 注册 EntityDamageByEntityEvent：检测左键攻击实体
        Bukkit.getPluginManager().registerEvent(
            EntityDamageByEntityEvent,
            fengxuListener,
            EventPriority.NORMAL,
            function (l, event) {
                try {
                    if (event.isCancelled()) return;
                    var damager = event.getDamager();
                    if (!(damager instanceof Player)) return;
                    if (!isHoldingItem(damager)) return;
                    // 气斩/剑气自身造成的伤害不再次触发气斩
                    if (event.getEntity().hasMetadata(META_SWORD_QI_DAMAGE)) return;
                    tryAirSlash(damager);
                } catch (e) {}
            },
            plugin
        );
    }
});
Bukkit.getScheduler().runTask(plugin, initFengxuListener);

// ===================================================================
// 风脉 BossBar 显示（无 key 传统 BossBar，热重载无冲突；TAB 无法覆盖）
// ===================================================================
function updateWindVeinBar(uuid, player, stacks, remainSec) {
    try {
        var bar = windVeinBarMap.get(uuid);
        if (bar == null) {
            bar = Bukkit.createBossBar(
                "\u00a7b[\u98ce\u8109] \u00a7f" + stacks + "/" + WIND_VEIN_MAX,
                BarColor.WHITE, BarStyle.SOLID
            );
            windVeinBarMap.put(uuid, bar);
        }
        bar.addPlayer(player);
        bar.setTitle("\u00a7b[\u98ce\u8109] \u00a7f" + stacks + "/" + WIND_VEIN_MAX +
            " \u00a77(" + remainSec + "s)");
        bar.setProgress(Math.max(0.05, Math.min(1.0, stacks / WIND_VEIN_MAX)));
        bar.setVisible(true);
    } catch (e) {
        plugin.getLogger().warning("[\u98ce\u9f99\u51a0] \u98ce\u8109BossBar\u66f4\u65b0\u5f02\u5e38: " + e);
    }
}
function removeWindVeinBar(uuid) {
    try {
        var bar = windVeinBarMap.remove(uuid);
        if (bar != null) {
            bar.removeAll();
            bar.setVisible(false);
        }
    } catch (e) {
        plugin.getLogger().warning("[\u98ce\u9f99\u51a0] \u98ce\u8109BossBar\u79fb\u9664\u5f02\u5e38: " + e);
    }
}

// ===================================================================
// 风脉衰减任务：每5秒减少一层，每秒显示层数+倒计时
// ===================================================================
var windVeinDecayTask = null;  // 模块级任务引用（避免依赖引擎对 Java 对象动态属性支持）
// 惰性启动：获得风脉时确保衰减任务在运行
function ensureDecayTask() {
    if (windVeinDecayTask == null || windVeinDecayTask.isCancelled()) {
        startWindVeinDecay();
    }
}
function startWindVeinDecay() {
    // 热重载/重启时先取消旧任务，避免重复任务
    if (windVeinDecayTask != null) {
        try { windVeinDecayTask.cancel(); } catch (e) {}
        windVeinDecayTask = null;
    }

    var DecayTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                var now = Date.now();
                // 先复制快照再遍历，避免迭代 HashMap 时直接修改导致 ConcurrentModificationException
                var entries = windVeinMap.entrySet().toArray();
                var seen = new java.util.HashSet();
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    var uuid = entry.getKey();
                    var stacks = entry.getValue();
                    seen.add(uuid);
                    if (stacks <= 0) {
                        windVeinMap.remove(uuid);
                        windVeinDecayMap.remove(uuid);
                        removeWindVeinBar(uuid);
                        continue;
                    }
                    // 若无衰减记录，则从当前时间起算
                    var lastDecay = windVeinDecayMap.containsKey(uuid) ? windVeinDecayMap.get(uuid) : now;
                    if (!windVeinDecayMap.containsKey(uuid)) {
                        windVeinDecayMap.put(uuid, now);
                    }
                    // 每5秒衰减一层
                    if (now - lastDecay >= WIND_VEIN_DECAY_MS) {
                        stacks--;
                        windVeinDecayMap.put(uuid, now);
                        if (stacks <= 0) {
                            windVeinMap.remove(uuid);
                            windVeinDecayMap.remove(uuid);
                            removeWindVeinBar(uuid);
                            continue;
                        }
                        windVeinMap.put(uuid, stacks);
                    }
                    // 每秒向持有风脉的玩家显示层数与消失倒计时（BossBar + ActionBar 双轨）
                    // 使用 getEntity(UUID)（无重载歧义），参考 伏地.js 的写法
                    var remainMs = WIND_VEIN_DECAY_MS - (now - lastDecay);
                    var remainSec = Math.max(1, Math.ceil(remainMs / 1000));
                    var entity = Bukkit.getEntity(UUIDClass.fromString(uuid));
                    if (entity instanceof Player && entity.isOnline()) {
                        var player = entity;
                        // 层数与倒计时仅由 BossBar 展示，不再重复发送 actionbar
                        updateWindVeinBar(uuid, player, stacks, remainSec);
                    }
                }
                // 清理已离线/无风脉玩家遗留的 BossBar
                var barIt = windVeinBarMap.entrySet().iterator();
                while (barIt.hasNext()) {
                    var barEntry = barIt.next();
                    var barUuid = barEntry.getKey();
                    var barEntity = Bukkit.getEntity(UUIDClass.fromString(barUuid));
                    var barPlayer = (barEntity instanceof Player) ? barEntity : null;
                    if (barPlayer == null || !barPlayer.isOnline() || !seen.contains(barUuid)) {
                        try { barEntry.getValue().removeAll(); } catch (e2) {}
                        barIt.remove();
                    }
                }
            } catch (e) {
                plugin.getLogger().warning("[\u98ce\u9f99\u51a0] \u98ce\u8109\u8870\u51cf\u4efb\u52a1\u5f02\u5e38: " + e);
            }
        }
    });
    // 立即启动，每秒执行一次（delay=0，避免5秒空窗期导致风脉先衰减完）
    windVeinDecayTask = new DecayTask().runTaskTimer(plugin, 0, 20);
    plugin.getLogger().info("[\u98ce\u9f99\u51a0] \u98ce\u8109\u8870\u51cf\u4efb\u52a1\u5df2\u542f\u52a8");
}
var startDecayRunnable = new RunnableImpl({
    run: function() { startWindVeinDecay(); }
});
Bukkit.getScheduler().runTask(plugin, startDecayRunnable);
