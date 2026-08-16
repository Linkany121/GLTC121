// ===================================================================
// 全局缓存
// ===================================================================
// 引入Bukkit调度器，用于延迟/重复任务
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
// 获取插件主类实例，用于调度任务时传入插件参数
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;

// 缓存常用Bukkit类，提升性能并方便书写
var PotionEffectType = org.bukkit.potion.PotionEffectType;
var PotionEffect = org.bukkit.potion.PotionEffect;
var Particle = org.bukkit.Particle;
var Color = org.bukkit.Color;
var DustOptions = org.bukkit.Particle.DustOptions;
var Location = org.bukkit.Location;
var Vector = org.bukkit.util.Vector;
var FluidCollisionMode = org.bukkit.FluidCollisionMode;

/**
 * 根据名称获取药水效果类型
 * @param {string} name - 药水效果名称（如 "LEVITATION"）
 * @returns {PotionEffectType} 对应的药水效果类型对象
 */
function getPotionType(name) {
    return PotionEffectType.getByName(name);
}
// 预先获取需要用到的药水效果类型
var TYPE_LEVITATION    = getPotionType("LEVITATION");   // 飘浮
var TYPE_SLOW_FALLING  = getPotionType("SLOW_FALLING"); // 缓降

// 预定义粒子效果参数：蓝色粉尘（用于爆炸特效）
var BLUE_DUST_OPT = new DustOptions(Color.fromRGB(0, 0, 255), 2.5);
// 预定义粒子效果参数：浅蓝色粉尘（用于爆炸特效）
var LIGHT_BLUE_DUST_OPT = new DustOptions(Color.fromRGB(0, 128, 255), 1.8);

// 音效名称常量，避免魔法字符串
var SOUND_EXPLODE = "entity.generic.explode";
var SOUND_ARROW_HIT = "entity.arrow.hit";
var SOUND_ANVIL_LAND = "block.anvil.land";
var SOUND_SWEEP = "entity.player.attack.sweep";
var SOUND_THUNDER = "entity.lightning_bolt.thunder";
var SOUND_BEACON = "block.beacon.power_select";

// ===================================================================
// 参数配置
// ===================================================================
var DAMAGE = 90;                // 所有攻击造成的伤害值（AOE）
var BLAST_RADIUS = 5;           // 爆炸伤害半径（方块）

// 第一剑：箭矢（射线）参数
var SWORD_ARROW_COUNT = 6;      // 箭矢总数（1根主箭 + 5根散射）
var SWORD_ARROW_RANGE = 40;     // 箭矢最大射程（方块）
var SWORD_ARROW_SPEED = 2.0;    // 箭矢速度（未在射线版本中使用，保留兼容）
var SWORD_SCATTER_MIN = 0.5;    // 散射最小偏移距离
var SWORD_SCATTER_MAX = 2.0;    // 散射最大偏移距离
var BLOCK_HIT_DELAY = 40;       // 命中方块后爆炸延迟（tick，20tick=1秒）

// 第二剑：火球参数
var FIREBALL_COUNT = 9;          // 发射火球数量
var FIREBALL_INTERVAL = 4;      // 每个火球之间的发射间隔（tick）
var FIREBALL_ANGLE = 45;        // 火球最大散射角度（度，圆锥半角）
var FIREBALL_VELOCITY = 2.0;    // 火球飞行速度
var FIREBALL_LAUNCH_Y = 1;      // 火球发射点相对于玩家眼睛高度的Y偏移

// 第三剑：状态效果参数
var LEVITATION_DURATION = 100;   // 飘浮效果持续时间（tick）
var LEVITATION_LEVEL = 0;       // 飘浮效果等级（0级=1级效果）
var SLOW_FALLING_DURATION = 200; // 缓降效果持续时间（tick）
var SLOW_FALLING_LEVEL = 2;     // 缓降效果等级

// 落雷参数
var LIGHTNING_ROUNDS = 4;        // 落雷轮次
var LIGHTNING_INTERVAL = 50;     // 每轮落雷之间的间隔（tick）
var LIGHTNING_PER_ROUND = 30;    // 每轮生成的落雷数量
var LIGHTNING_RANGE_MIN = 31;    // 落雷距离玩家的最小水平半径
var LIGHTNING_RANGE_MAX = 32;    // 落雷距离玩家的最大水平半径

// 星弹（射线）参数
var STAR_INTERVAL = 10;          // 星弹发射间隔（tick）
var STAR_DURATION = 200;        // 星弹技能总持续时间（tick）
var STAR_RANGE = 50;             // 星弹射线最大检测距离
var STAR_SPEED = 3.0;           // 星弹速度（未在射线版本中使用，保留兼容）

// 冷却参数
var COOLDOWN_MS = 3000;          // 技能整体冷却时间（毫秒）

// ===================================================================
// 全局状态（存储玩家数据）
// ===================================================================
// 记录玩家点击次数，用于判定第几剑（0-2循环）
var clickMap = new java.util.HashMap();
// 记录玩家上次使用技能的时间戳（毫秒），用于冷却判定
var lastUseMap = new java.util.HashMap();
// 存储第三剑对应的定时任务对象，以便中途取消（如再次点击第三剑时）
var thirdSwordTasks = new java.util.HashMap();

// ===================================================================
// 爆炸效果（通用）
// ===================================================================
/**
 * 在指定位置生成基础爆炸粒子效果并播放音效
 * @param {Location} loc - 爆炸位置
 * @param {World} world - 所在世界
 */
function createExplosionParticles(loc, world) {
    world.spawnParticle(Particle.CLOUD, loc, 150, 4, 4, 4, 0.05);
    world.spawnParticle(Particle.END_ROD, loc, 100, 3, 3, 3, 0.08);
    world.spawnParticle(Particle.POOF, loc, 80, 2.5, 2.5, 2.5, 0.05);
    world.playSound(loc, SOUND_ARROW_HIT, 1.5, 1.0);
    world.playSound(loc, SOUND_ANVIL_LAND, 0.7, 1.4);
    world.playSound(loc, SOUND_SWEEP, 0.8, 1.2);
}

/**
 * 以某点为中心执行范围伤害，并触发基础爆炸特效。
 * 可选在爆炸特效后追加额外的自定义粒子/音效。
 * @param {World} world - 世界
 * @param {Location} hitPoint - 爆炸中心点
 * @param {Player} player - 技能使用者（不会被误伤）
 * @param {Function} [extraParticleFunc] - 额外特效回调，接收 (world, loc)
 */
function dealAOE(world, hitPoint, player, extraParticleFunc) {
    // 获取半径内的所有实体
    var targets = world.getNearbyEntities(hitPoint, BLAST_RADIUS, BLAST_RADIUS, BLAST_RADIUS);
    var it = targets.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        // 只对活体实体（非玩家自身）造成伤害
        if (ent instanceof org.bukkit.entity.LivingEntity && ent != player) {
            ent.setNoDamageTicks(0); // 清除无敌帧，确保持续伤害有效
            ent.damage(DAMAGE, player);
        }
    }
    // 显示基础爆炸粒子
    createExplosionParticles(hitPoint, world);
    // 如果传入了额外的特效函数，则执行
    if (extraParticleFunc) extraParticleFunc(world, hitPoint);
}

/**
 * 星弹爆炸时额外添加的粒子与音效（蓝色灵魂火焰风格）
 */
function starExplosionExtra(world, loc) {
    world.spawnParticle(Particle.DUST, loc, 300, 4, 4, 4, 0, BLUE_DUST_OPT);
    world.spawnParticle(Particle.DUST, loc, 180, 3, 3, 3, 0, LIGHT_BLUE_DUST_OPT);
    world.spawnParticle(Particle.SOUL_FIRE_FLAME, loc, 80, 2.5, 2.5, 2.5, 0.05);
    world.playSound(loc, SOUND_EXPLODE, 1.8, 0.8);
    world.playSound(loc, SOUND_BEACON, 1.0, 1.5);
    world.playSound(loc, SOUND_THUNDER, 0.8, 0.7);
}

// ===================================================================
// 第一剑：6根箭矢（使用rayTrace射线检测，带密集END_ROD粒子轨迹）
// ===================================================================
/**
 * 发射一根箭矢（实际上是射线检测），命中实体立即爆炸，命中方块延迟爆炸。
 * @param {World} world - 世界
 * @param {Location} start - 射线起点（通常为玩家眼睛位置或散射偏移后的位置）
 * @param {Vector} dir - 射线方向（已归一化）
 * @param {Player} player - 使用技能的玩家
 * @param {boolean} isMain - 是否为主箭矢（仅主箭矢发送提示消息）
 */
function fireSwordArrow(world, start, dir, player, isMain) {
    // 进行一次rayTrace，检测方块和活体实体（忽略自身）
    // 参数：世界, 起点, 方向, 最大距离, 流体碰撞模式, 忽略未阻挡的流体, 射线精度, 实体过滤器
    var rayHit = world.rayTrace(
        start, dir, SWORD_ARROW_RANGE,
        FluidCollisionMode.NEVER, false, 0.5,
        function(ent) {
            return ent instanceof org.bukkit.entity.LivingEntity && ent !== player;
        }
    );

    var endDist = SWORD_ARROW_RANGE;  // 射线有效飞行距离
    var hitEntity = null;
    var hitBlock = false;

    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        // 计算起点到命中点的实际距离
        endDist = start.toVector().distance(hitPos);
        hitEntity = rayHit.getHitEntity();
        // 如果击中位置没有实体，则判定为方块
        if (hitEntity == null) hitBlock = true;
    }

    // 沿射线路径生成密集的白色END_ROD粒子，模拟箭矢轨迹
    var tracerLoc = start.clone();
    var stepVec = dir.clone().multiply(0.4);  // 粒子间距0.4格
    var steps = Math.floor(endDist / 0.4);
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.END_ROD, tracerLoc, 3, 0.05, 0.05, 0.05, 0.02);
        tracerLoc.add(stepVec);
    }

    // 命中处理
    if (hitEntity != null) {
        // 命中生物：在生物位置立即引发AOE爆炸
        dealAOE(world, hitEntity.getLocation(), player, null);
        if (isMain) player.sendMessage("§x§f§b§f§f§6§1§l剑光，来！");
    } else if (hitBlock) {
        // 命中方块：在命中位置延迟BLOCK_HIT_DELAY tick后爆炸
        var hitPos = rayHit.getHitPosition();
        var hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
        var DelayTask = Java.extend(BukkitRunnable, {
            run: function() {
                dealAOE(world, hitLoc, player, null);
                if (isMain) player.sendMessage("§x§f§b§f§f§6§1§l剑光，来！");
            }
        });
        new DelayTask().runTaskLater(plugin, BLOCK_HIT_DELAY);
    } else {
        // 未命中任何目标（超出距离），主箭矢仍发送提示
        if (isMain) player.sendMessage("§x§f§b§f§f§6§1§l剑光，来！");
    }
}

// ===================================================================
// 第二剑：火球（实体投射物，带碰撞监听）
// ===================================================================
// 用于存储火球ID与相关数据的映射（玩家、是否主火球、提示消息）
var projectileMap = new java.util.HashMap();

// 注册火球碰撞事件监听器
var pm = org.bukkit.Bukkit.getPluginManager();
var ListenerClass = Java.extend(org.bukkit.event.Listener, {});
var listener = new ListenerClass();

pm.registerEvent(
    org.bukkit.event.entity.ProjectileHitEvent.class, // 监听投射物碰撞事件
    listener,
    org.bukkit.event.EventPriority.NORMAL,
    function(l, event) {
        var proj = event.getEntity();
        var id = proj.getEntityId();
        // 只处理我们生成的火球（检查ID是否在map中）
        if (!projectileMap.containsKey(id)) return;
        var data = projectileMap.remove(id);
        proj.remove(); // 立即移除火球实体
        // 确定爆炸位置：优先使用被击中的实体位置，否则使用火球自身位置
        var hitLoc = event.getHitEntity() ? event.getHitEntity().getLocation() : proj.getLocation();
        dealAOE(proj.getWorld(), hitLoc, data.player, null);
        if (data.isMain) data.player.sendMessage(data.msg);
    },
    plugin
);

/**
 * 生成一个自定义火球（无重力、无爆炸、静音），并注册自毁定时器。
 * @param {Player} player - 发射者
 * @param {Location} launchLoc - 发射位置
 * @param {Vector} direction - 初始速度方向（已归一化）
 * @param {boolean} isMain - 是否为主火球（决定是否发送消息）
 */
function spawnFireball(player, launchLoc, direction, isMain) {
    var world = player.getWorld();
    // 生成火球实体
    var fireball = world.spawn(launchLoc, org.bukkit.entity.Fireball.class);
    fireball.setShooter(player);
    fireball.setVelocity(direction.clone().multiply(FIREBALL_VELOCITY));
    fireball.setGravity(false);      // 无重力，直线飞行
    fireball.setYield(0);            // 禁用原版爆炸威力
    fireball.setIsIncendiary(false); // 不产生火焰
    fireball.setSilent(true);        // 静音，避免原版音效

    // 记录火球数据，用于碰撞监听
    var id = fireball.getEntityId();
    projectileMap.put(id, {
        player: player,
        isMain: isMain,
        msg: isMain ? "§x§f§b§f§f§6§1§l剑火，燃！" : null
    });

    // 设定自毁定时器：30tick后如果仍未碰撞，强制爆炸并移除
    var DetonateTask = Java.extend(BukkitRunnable, {
        run: function() {
            if (projectileMap.containsKey(id)) {
                projectileMap.remove(id);
                if (fireball.isValid()) {
                    var loc = fireball.getLocation();
                    dealAOE(world, loc, player, null);
                    fireball.remove();
                }
            }
        }
    });
    new DetonateTask().runTaskLater(plugin, 30);
}

// ===================================================================
// 第三剑：星弹（使用rayTrace射线检测，碰到生物或方块立刻爆炸）
// ===================================================================
/**
 * 发射一枚星弹（射线），沿途生成灵魂火焰粒子，命中实体或方块后立即触发星爆。
 * @param {World} world - 世界
 * @param {Location} start - 射线起点（玩家眼睛位置）
 * @param {Vector} dir - 射线方向（已归一化）
 * @param {Player} player - 使用技能的玩家
 */
function fireStar(world, start, dir, player) {
    // 射线检测，同第一剑逻辑
    var rayHit = world.rayTrace(
        start, dir, STAR_RANGE,
        FluidCollisionMode.NEVER, false, 0.5,
        function(ent) {
            return ent instanceof org.bukkit.entity.LivingEntity && ent !== player;
        }
    );

    var endDist = STAR_RANGE;
    var hitLoc = null;

    if (rayHit != null) {
        var hitPos = rayHit.getHitPosition();
        endDist = start.toVector().distance(hitPos);
        // 默认命中位置
        hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());

        // 如果命中实体，将爆炸位置调整为实体所在位置
        var hitEntity = rayHit.getHitEntity();
        if (hitEntity != null) {
            hitLoc = hitEntity.getLocation();
        }
    }

    // 生成星弹飞行粒子轨迹：灵魂火焰 + 末地烛粒子
    var tracerLoc = start.clone();
    var stepVec = dir.clone().multiply(0.5);
    var steps = Math.floor(endDist / 0.5);
    for (var i = 0; i < steps; i++) {
        world.spawnParticle(Particle.SOUL_FIRE_FLAME, tracerLoc, 3, 0.15, 0.15, 0.15, 0.01);
        world.spawnParticle(Particle.END_ROD, tracerLoc, 1, 0.1, 0.1, 0.1, 0);
        tracerLoc.add(stepVec);
    }

    // 如果命中任何目标，触发星爆（包含额外特效）
    if (hitLoc != null) {
        dealAOE(world, hitLoc, player, starExplosionExtra);
    }
}

// ===================================================================
// 主入口函数：右键物品时触发三段剑技
// ===================================================================
/**
 * 处理玩家使用物品事件，实现“隐兰狂玉唤剑葫”的三段技能。
 * 每次右键根据点击计数依次释放第一剑（箭矢）、第二剑（火球）、第三剑（落雷+星弹），
 * 完成后计数归零，循环使用。同时进行冷却判定。
 * @param {PlayerInteractEvent} event - 交互事件对象
 */
function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === org.bukkit.Material.AIR) return;

    // 确保是自定义Slimefun物品 "FKR_隐兰狂玉唤剑葫"
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "FKR_隐兰狂玉唤剑葫") return;

    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    var lastUse = lastUseMap.get(uuid);
    var clickCount = clickMap.containsKey(uuid) ? clickMap.get(uuid) : 0;

    // 冷却检查
    if (lastUse != null && (now - lastUse) < COOLDOWN_MS) {
        var remaining = Math.ceil((COOLDOWN_MS - (now - lastUse)) / 1000);
        player.sendActionBar("§c冷却中..." + remaining + "秒");
        return;
    }
    // 更新最后使用时间
    lastUseMap.put(uuid, now);

    // --- 第一剑：散射箭矢 ---
    if (clickCount === 0) {
        player.sendMessage("§x§5§a§d§a§c§d第§x§5§a§c§7§d§1一§x§5§a§b§4§d§6剑§x§5§a§a§1§d§a出§x§5§a§8§e§d§e—§x§5§a§7§b§e§3—§x§5§9§6§8§e§7—§x§5§9§5§5§e§b—§x§5§9§4§2§f§0俱§x§5§9§2§f§f§4怀§x§5§9§1§c§f§8逸§x§5§9§0§9§f§d兴§x§5§5§0§7§f§f壮§x§4§d§1§5§f§f思§x§4§6§2§3§f§f飞§x§3§e§3§0§f§f，§x§3§6§3§e§f§f欲§x§2§e§4§c§f§f上§x§2§7§5§a§f§f青§x§1§f§6§8§f§f天§x§1§7§7§6§f§f揽§x§0§f§8§3§f§f明§x§0§8§9§1§f§f月§x§0§0§9§f§f§f！");

        var world = player.getWorld();
        var eyeLoc = player.getEyeLocation();
        var baseDir = eyeLoc.getDirection().normalize();

        // 构建局部坐标系：前方向（baseDir）、右方向、上方向
        var worldUp = new Vector(0, 1, 0);
        var right = baseDir.clone().crossProduct(worldUp).normalize();
        // 防止方向向量恰好竖直导致右向量为零
        if (right.lengthSquared() < 0.001) right = new Vector(1, 0, 0);
        var up = right.clone().crossProduct(baseDir).normalize();

        // 主箭矢：沿玩家视线正前方
        fireSwordArrow(world, eyeLoc, baseDir, player, true);

        // 5根散射箭矢：在主箭方向周围随机偏移
        for (var i = 0; i < SWORD_ARROW_COUNT - 1; i++) {
            var angle = Math.random() * 2 * Math.PI;
            var dist = SWORD_SCATTER_MIN + Math.random() * (SWORD_SCATTER_MAX - SWORD_SCATTER_MIN);
            // 在垂直于视线的平面上生成随机偏移向量
            var offset = right.clone().multiply(dist * Math.cos(angle))
                         .add(up.clone().multiply(dist * Math.sin(angle)));
            var spawnLoc = eyeLoc.clone().add(offset);
            // 散射方向：主方向加上小偏移，使箭矢略微向外扩散
            var scatterDir = baseDir.clone().add(offset.clone().multiply(0.1)).normalize();
            fireSwordArrow(world, spawnLoc, scatterDir, player, false);
        }

    // --- 第二剑：散射火球 ---
    } else if (clickCount === 1) {
        player.sendMessage("§x§5§a§d§a§c§d第§x§6§8§d§b§c§d二§x§7§7§d§c§c§d剑§x§8§5§d§d§c§e落§x§9§3§d§d§c§e—§x§a§2§d§e§c§e—§x§b§0§d§f§c§e—§x§b§e§e§0§c§e君§x§c§d§e§1§c§e去§x§d§b§e§2§c§f沧§x§e§9§e§3§c§f江§x§f§8§e§4§c§f望§x§f§f§d§e§c§7澄§x§f§f§d§1§b§7碧§x§f§f§c§4§a§7，§x§f§f§b§8§9§7鲸§x§f§f§a§b§8§7鲵§x§f§f§9§e§7§7唐§x§f§f§9§1§6§8突§x§f§f§8§5§5§8留§x§f§f§7§8§4§8馀§x§f§f§6§b§3§8迹§x§f§f§5§f§2§8§x§f§f§5§2§1§8！");
        var world = player.getWorld();
        // 发射点位于玩家眼睛位置上方FIREBALL_LAUNCH_Y格
        var launchLoc = player.getEyeLocation().clone().add(0, FIREBALL_LAUNCH_Y, 0);
        var dir = player.getEyeLocation().getDirection().clone();
        var maxAngleRad = (FIREBALL_ANGLE / 2) * Math.PI / 180; // 半角弧度

        // 构建局部坐标系
        var worldUp = new Vector(0, 1, 0);
        var right = dir.clone().crossProduct(worldUp).normalize();
        if (right.lengthSquared() < 0.001) right = new Vector(1, 0, 0);
        var up = right.clone().crossProduct(dir).normalize();

        // 依次延时发射火球
        for (var i = 0; i < FIREBALL_COUNT; i++) {
            var delay = i * FIREBALL_INTERVAL;
            // 在圆锥范围内随机生成火球方向
            var angle = Math.random() * maxAngleRad;          // 偏移角度
            var theta = Math.random() * 2 * Math.PI;          // 旋转角
            var offset = right.clone().multiply(Math.cos(theta) * Math.tan(angle))
                                  .add(up.clone().multiply(Math.sin(theta) * Math.tan(angle)));
            var fbDir = dir.clone().add(offset).normalize();
            var isMain = (i === 0); // 仅第一个火球发送提示
            // 使用闭包捕获当前延迟和方向
            (function(delay, fbDir, isMain) {
                var FireTask = Java.extend(BukkitRunnable, {
                    run: function() { spawnFireball(player, launchLoc, fbDir, isMain); }
                });
                new FireTask().runTaskLater(plugin, delay);
            })(delay, fbDir, isMain);
        }

    // --- 第三剑：落雷 + 星弹连射 ---
    } else if (clickCount === 2) {
        // 如果之前有第三剑任务未结束，先取消
        var oldTasks = thirdSwordTasks.get(uuid);
        if (oldTasks) {
            try { oldTasks.lightning.cancel(); } catch(e) {}
            try { oldTasks.star.cancel(); } catch(e) {}
            try { oldTasks.stop.cancel(); } catch(e) {}
        }

        player.sendMessage("§x§5§a§d§a§c§d第§x§5§1§e§0§d§2三§x§4§8§e§5§d§7剑§x§3§f§e§b§d§c，§x§3§6§f§0§e§1成§x§2§d§f§6§e§6—§x§2§5§f§c§e§b—§x§6§b§f§f§f§4列§x§6§9§e§e§f§6缺§x§6§7§d§d§f§7霹§x§6§5§c§d§f§9雳§x§6§3§b§c§f§b，§x§6§1§a§b§f§c丘§x§5§f§9§a§f§e峦§x§6§0§8§d§f§f崩§x§6§4§8§3§f§f摧§x§6§8§7§9§f§f.§x§6§c§6§f§f§f.§x§7§0§6§5§f§f.§x§7§4§5§b§f§f素§x§7§8§5§1§f§f手§x§8§d§5§5§f§7把§x§a§2§5§9§e§f芙§x§b§6§5§d§e§7蓉§x§c§b§6§1§d§f，§x§e§0§6§5§d§7虚§x§f§5§6§9§c§f步§x§f§f§7§6§c§2蹑§x§f§f§8§d§b§0太§x§f§f§a§4§9§e清§x§f§f§b§b§8§b？§x§f§f§d§1§7§9缓§x§f§f§e§8§6§7步§x§f§f§f§f§5§5凌§x§f§f§f§6§5§5虚§x§f§f§e§d§5§5御§x§f§f§e§4§5§5风§x§f§f§d§b§5§6雷§x§f§f§d§2§5§6，§x§f§f§c§9§5§6凌§x§f§f§b§9§5§3空§x§f§f§a§3§4§e飞§x§f§f§8§d§4§9戟§x§f§f§7§7§4§4逐§x§f§f§6§1§3§f风§x§f§f§4§b§3§a云§x§f§f§3§5§3§5！");
        player.sendMessage("§x§f§b§f§f§6§1§l剑霆，彻万川！");

        // 给予玩家漂浮和缓降效果，模拟凌空状态
        player.addPotionEffect(new PotionEffect(TYPE_LEVITATION, LEVITATION_DURATION, LEVITATION_LEVEL, false));
        player.addPotionEffect(new PotionEffect(TYPE_SLOW_FALLING, SLOW_FALLING_DURATION, SLOW_FALLING_LEVEL, false));

        var world = player.getWorld();

        // --- 落雷任务 ---
        var counter = 0;
        var lightningTaskRef = null;
        var LightningTask = Java.extend(BukkitRunnable, {
            run: function() {
                if (counter >= LIGHTNING_ROUNDS) {
                    if (lightningTaskRef != null) {
                        try { lightningTaskRef.cancel(); } catch(e) {}
                    }
                    return;
                }
                // 在玩家周围随机位置生成多道闪电效果（无实体伤害，纯视觉效果）
                for (var l = 0; l < LIGHTNING_PER_ROUND; l++) {
                    var angle = Math.random() * 2 * Math.PI;
                    var dist = LIGHTNING_RANGE_MIN + Math.random() * (LIGHTNING_RANGE_MAX - LIGHTNING_RANGE_MIN);
                    var x = player.getLocation().getX() + Math.cos(angle) * dist;
                    var z = player.getLocation().getZ() + Math.sin(angle) * dist;
                    var y = world.getHighestBlockYAt(Math.floor(x), Math.floor(z));
                    var loc = new Location(world, x, y, z);
                    world.strikeLightningEffect(loc); // 仅视觉效果，不造成伤害/火
                    world.playSound(loc, SOUND_THUNDER, 0.8, 0.7);
                }
                counter++;
            }
        });
        lightningTaskRef = new LightningTask().runTaskTimer(plugin, 0, LIGHTNING_INTERVAL);

        // --- 星弹连射任务 ---
        var StarTask = Java.extend(BukkitRunnable, {
            run: function() {
                var eyeLoc = player.getEyeLocation();
                var dir = eyeLoc.getDirection().normalize();
                fireStar(world, eyeLoc, dir, player);
            }
        });
        var starBukkitTask = new StarTask().runTaskTimer(plugin, 0, STAR_INTERVAL);

        // --- 定时停止星弹任务 ---
        var StopStar = Java.extend(BukkitRunnable, {
            run: function() {
                try { starBukkitTask.cancel(); } catch(e) {}
            }
        });
        var stopTaskRef = new StopStar().runTaskLater(plugin, STAR_DURATION);

        // 保存任务引用，以便再次触发第三剑时能够取消旧任务
        thirdSwordTasks.put(uuid, {
            lightning: lightningTaskRef,
            star: starBukkitTask,
            stop: stopTaskRef
        });
    }

    // 更新点击计数（0 -> 1 -> 2 -> 0 循环）
    clickMap.put(uuid, (clickCount + 1) % 3);
}