// ===================================================================
// 隐兰狂玉唤剑葫 —— 重做脚本
// 技能系统（依据物品描述）：
//   剑光(左键)：向前发射一道剑光，命中后召唤白剑从天而降，造成 70 伤害
//   焰眸(右键)：在前方高空召唤法阵，3秒内每0.5秒发射一道红剑落下，
//               单次最多 5 道，冷却 6 秒。每把伤害 = 总伤害 / 实际道数
//   心霆机制  ：每次施展(剑光/焰眸)增加 1 层 [心霆]；到达 10 层后自动进入
//               持续 10 秒的心霆状态，期间缓慢升空，只能左键施展剑霆
//   剑霆(心霆状态左键)：发射一簇雷魂剑，对途径敌人造成 100 伤害，
//               爆炸后再额外造成一次 100 伤害
// 监听方式：自注册 PlayerInteractEvent，热重载安全注册（参考 风墟龙冕.js）
// ===================================================================

// === Java 类型导入 ===
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var UUID = Java.type("java.util.UUID");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var _EDBE_GET_DAMAGER = (function () {
    try { return EntityDamageByEntityEvent.getMethod("getDamager"); } catch (e) { return null; }
})();
function edbeDamager(event) {
    if (event == null) return null;
    try { if (!(event instanceof EntityDamageByEntityEvent)) return null; } catch (e0) { return null; }
    if (_EDBE_GET_DAMAGER != null) {
        try { return _EDBE_GET_DAMAGER.invoke(event); } catch (e1) {}
    }
    try { return event.getDamager(); } catch (e2) {}
    return null;
}
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle.DustOptions");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Vector = Java.type("org.bukkit.util.Vector");
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var BarColor = Java.type("org.bukkit.boss.BarColor");
var BarStyle = Java.type("org.bukkit.boss.BarStyle");
var FluidCollisionMode = Java.type("org.bukkit.FluidCollisionMode");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var plugin = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;

var HUANJIANHU_ITEM_ID = "FKR_隐兰狂玉唤剑葫";
var META_HUANJIANHU_DECAY_TASK = "gltc_huanjianhu_decay_task";
var META_HUANJIANHU_BAR_TASK = "gltc_huanjianhu_bar_task";
var META_HUANJIANHU_STACKS = "gltc_huanjianhu_stacks";
var META_HUANJIANHU_STATE = "gltc_huanjianhu_state";
var META_HUANJIANHU_DECAY_TICK = "gltc_huanjianhu_decay_tick";
var META_HUANJIANHU_BAR = "gltc_huanjianhu_bar";
var META_HUANJIANHU_YANMOU_CD = "gltc_huanjianhu_yanmou_cd";
var META_HUANJIANHU_LEFT_CD = "gltc_huanjianhu_left_cd";
var META_HUANJIANHU_ABILITY_DAMAGE = "gltc_huanjianhu_ability_damage";
var ABILITY_POWER_DEFAULT = 10;
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment";
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";
var DAMAGE_NOTIFY_DEFAULT = "chat";
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";

// === 药水效果类型 ===
var TYPE_LEVITATION = PotionEffectType.getByName("LEVITATION");
var TYPE_SLOW_FALLING = PotionEffectType.getByName("SLOW_FALLING");

// === 粒子颜色常量 ===
var WHITE_DUST     = new DustOptions(Color.fromRGB(255, 255, 255), 1.4);   // 白剑
var RED_DUST       = new DustOptions(Color.fromRGB(255, 60, 60), 1.5);      // 红剑
var RED_DUST_BIG   = new DustOptions(Color.fromRGB(255, 40, 40), 2.2);      // 法阵/红爆
var THUNDER_DUST   = new DustOptions(Color.fromRGB(130, 90, 255), 1.6);     // 雷魂剑
var THUNDER_DUST2  = new DustOptions(Color.fromRGB(255, 220, 90), 1.4);     // 雷魂剑(亮芯)

// 彩色粒子发射。
// 重要背景：经过对同目录 破军.js 的实测验证，"Particle.DUST 字面量 + DustOptions data"
// 这一写法在 GraalJS 同步线程下完全可以正常工作（见 破军.js 第253、336行等大量同款用法，
// 甚至 data 位置直接写三元表达式都正常）。之前报的 "missing required data class
// org.bukkit.Color" 并非 DUST 带 data 本身的问题，而是由于把 Particle 放到变量里交给
// spawnParticle 的通用重载（或走 ParticleBuilder）时，GraalJS 泛型重载解析出错所致。
// 因此这里统一改用与 破军.js 完全一致的写法：字面量 Particle.DUST + DustOptions data，
// 由 GraalJS 静态绑定到正确的带 data 重载，彻底还原真实颜色且不再报 Color 错。
function spawnDust(world, loc, count, dx, dy, dz, speed, dust) {
    try {
        world.spawnParticle(Particle.DUST, loc, count, dx, dy, dz, speed, dust);
    } catch (e) {}
}

// === 音效常量 ===
var SOUND_EXPLODE   = "entity.generic.explode";
var SOUND_ANVIL_LAND = "block.anvil.land";
var SOUND_THUNDER   = "entity.lightning_bolt.thunder";
var SOUND_SWEEP     = "entity.player.attack.sweep";
var SOUND_BEACON    = "block.beacon.power_select";
var SOUND_ANVIL_PLACE = "block.anvil.place";   // 铁砧放置（白剑命中）
var SOUND_STEAM     = "block.fire.extinguish"; // 蒸汽
var SOUND_WITHER_SHOOT = "entity.wither.shoot"; // 气斩发射声
var SOUND_DING      = "block.note_block.pling";
var SOUND_RESPAWN_ANCHOR_EXPLODE = "block.respawn_anchor.explode"; // 重生锚破碎（剑霆命中）

// ===================================================================
// 心霆机制参数
// ===================================================================
var XINTING_MAX         = 9;    // 心霆最大层数
var XINTING_DECAY_TICKS = 80;    // 每 3 秒减少一层心霆（倒计时不被获得重置）
var XINTING_STATE_TICKS = 200;   // 心霆状态持续 10 秒
var XINTING_LEVITATION_LEVEL = 1; // 心霆状态飘浮等级(amplifier=1 => 飘浮II)
var XINTING_SLOW_FALL_TICKS  = 300; // 心霆状态缓降持续 15 秒
var XINTING_SLOW_FALL_LEVEL  = 0;  // 心霆状态缓降等级(amplifier=0 => 缓降I)

// ===================================================================
// 通用伤害半径（所有造成伤害时均为直径 4 = 半径 2）
// ===================================================================
var AOE_RADIUS          = 3;     // 范围伤害半径（直径 4）

// ===================================================================
// 剑光参数（左键）
// ===================================================================
var SIT_JIANGUANG_MULT    = 7;    // 白剑：7x SIT
var JIANGUANG_RANGE       = 32;   // 剑光最大射程
var JIANGUANG_SWORD_DROP_HEIGHT = 8; // 白剑召唤高度(米)
var JIANGUANG_SWORD_DROP_TICK   = 8; // 白剑落地时长(tick)
var JIANGUANG_CD_MS       = 400;  // 剑光点击再装填

// ===================================================================
// 焰眸参数（右键）
// ===================================================================
var YANMOU_COOLDOWN_MS    = 6000; // 焰眸冷却 6 秒
var YANMOU_INTERVAL_TICK  = 10;   // 每 0.5 秒发射一道红剑
var YANMOU_DURATION_TICK  = 60;   // 法阵持续 3 秒
var SIT_YANMOU_TOTAL_MULT = 50;   // 焰眸每轮红剑总伤害（按道数平分）
var YANMOU_FORWARD        = 15;   // 无目标时法阵位于玩家前方距离（15格）
var YANMOU_HEIGHT_ABOVE   = 15;   // 法阵中心在目标/最高地面之上 y+15 格
var YANMOU_RADIUS         = 7.5;  // 法阵半径（直径 15）
var YANMOU_SWORD_DROP_TICK = 10;  // 红剑落地时长(tick)
var YANMOU_CAST_TICK      = 10;   // 红球飞行 / 法阵展开 各 0.5 秒
var JIANTING_BLAST_DELAY  = 4;    // 剑霆终点二次爆炸延迟(tick)

// ===================================================================
// 雷魂剑参数（心霆状态左键）
// ===================================================================
var SIT_JIANTING_MULT   = 10;    // 剑霆：10x SIT
var JIANTING_RANGE      = 32;    // 剑霆最远距离（米）

// ===================================================================
// 文字提示（全部可配置，支持 § 颜色码与 {n} 占位符）
// ===================================================================
// 心霆 BossBar
var MSG_XINTING_BAR_STACK  = "§c[心霆] §f{stacks}/{max}";   // 层数模式
var MSG_XINTING_BAR_STATE  = "§c[此身既化剑，心跳响雷鼓！] §f{secs}秒"; // 状态模式倒计时
// 心霆触发标题
var MSG_XINTING_TITLE      = "§c[此身既化剑，心跳响雷鼓！]";
var MSG_XINTING_SUBTITLE   = "§7无尽雷霆斥己身！";
// 心霆 ActionBar
var MSG_XINTING_STACK_GAINED = "§c[心霆] §f{stacks}/{max}"; // 获得层数
var MSG_XINTING_ACTIVATED  = "§c此身既化剑，心跳响雷鼓！";
var MSG_XINTING_ENDED      = "§b万敌既死，奔雷还空。";
var MSG_XINTING_RIGHT_BLOCKED = "§7无尽雷霆斥己身！";
// 焰眸冷却
var MSG_FLAME_EYE_COOLDOWN = "§c焰眸冷却中... {secs}秒";
// 占位符替换工具：MSG_XINTING_BAR_STACK 等中的 {xxx} 用对应值替换
function fmtMsg(tpl, args) {
    return String(tpl).replace(/\{(\w+)\}/g, function(m, k) { return (k in args) ? args[k] : m; });
}

// ===================================================================
// 状态映射（本脚本局部 HashMap，与风墟龙冕/伏地.js 同模式；勿用 Metadata 挂 Map）
// ===================================================================
var xinTingStacksMap = new java.util.HashMap();
var xinTingBarMap = new java.util.HashMap();
var xinTingStateMap = new java.util.HashMap();
var xinTingDecayTickMap = new java.util.HashMap();
var yanmouCdMap = new java.util.HashMap();
var leftClickCdMap = new java.util.HashMap();
var yanmouTaskMap = new java.util.HashMap();
var xinTingBarTickerActive = false;

function isOffHand(hand) {
    if (hand == null) return false;
    try { return hand.name() === "OFF_HAND"; } catch (e) { return String(hand).indexOf("OFF") >= 0; }
}
function isMainHand(hand) {
    return !isOffHand(hand);
}

function getXinTingStacksMap() { return xinTingStacksMap; }
function getXinTingBarMap() { return xinTingBarMap; }
function getXinTingStateMap() { return xinTingStateMap; }
function getXinTingDecayTickMap() { return xinTingDecayTickMap; }
function getYanmouCdMap() { return yanmouCdMap; }
function getLeftClickCdMap() { return leftClickCdMap; }

function isLivingEntity(ent) {
    if (ent == null) return false;
    try { return ent instanceof LivingEntity; } catch (e) { return false; }
}
function isPlayer(ent) {
    if (ent == null) return false;
    try { return ent instanceof Player; } catch (e) { return false; }
}
function isSamePlayer(ent, player) {
    if (ent == null || player == null) return false;
    try { return ent.getUniqueId().equals(player.getUniqueId()); } catch (e) { return ent === player; }
}

function resolvePlayer(playerOrId) {
    if (playerOrId == null) return null;
    try {
        if (playerOrId instanceof Player) {
            return playerOrId.isOnline() ? playerOrId : null;
        }
        var idStr = String(playerOrId);
        try { return Bukkit.getPlayer(UUID.fromString(idStr)); } catch (eUuid) {}
        return Bukkit.getPlayer(playerOrId);
    } catch (e) {
        return null;
    }
}

// ===================================================================
// 辅助：检查玩家是否手持唤剑葫
// ===================================================================
function getEventPlugin() {
    try {
        var p = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        if (p != null) return p;
    } catch (e) {}
    return plugin;
}

function matchItemId(actualId, expectedId) {
    if (!actualId || !expectedId) return false;
    if (actualId === expectedId) return true;
    try {
        var a = String(actualId).toLowerCase();
        var e = String(expectedId).toLowerCase();
        if (a === e) return true;
        if (a.endsWith(":" + e) || a.endsWith("/" + e)) return true;
        if (a.length > e.length && a.substring(a.length - e.length) === e) return true;
    } catch (err) {}
    return false;
}

// Graal 兼容射线：勿将 JS 函数传给 rayTrace 的 Entity 过滤器
function rayTraceLivingAhead(world, origin, direction, maxDistance, player) {
    var result = { loc: null, entity: null, distance: maxDistance };
    if (world == null || origin == null || direction == null) return result;
    var dir = direction.clone().normalize();
    var maxDist = maxDistance > 0 ? maxDistance : 1;
    try {
        var hits = world.rayTraceEntities(origin, dir, maxDist, 0.5);
        if (hits != null) {
            for (var hi = 0; hi < hits.size(); hi++) {
                var ent = hits.get(hi);
                if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
                if (isSamePlayer(ent, player)) continue;
                result.entity = ent;
                result.loc = ent.getLocation();
                try {
                    result.distance = origin.toVector().distance(ent.getLocation().toVector());
                } catch (eDist) {}
                return result;
            }
        }
    } catch (eRay) {}
    var step = 0.4;
    var steps = Math.ceil(maxDist / step);
    var stepVec = dir.clone().multiply(step);
    var tracer = origin.clone();
    for (var s = 0; s < steps; s++) {
        tracer.add(stepVec);
        try {
            var block = world.getBlockAt(tracer);
            if (block != null && block.getType() != null && !block.getType().isAir()) {
                result.loc = tracer.clone();
                result.distance = (s + 1) * step;
                return result;
            }
        } catch (eBlk) {}
        try {
            var nearby = world.getNearbyEntities(tracer, 0.45, 0.45, 0.45);
            for (var ni = 0; ni < nearby.size(); ni++) {
                var nearEnt = nearby.get(ni);
                if (!(nearEnt instanceof LivingEntity) || nearEnt.isDead()) continue;
                if (isSamePlayer(nearEnt, player)) continue;
                result.entity = nearEnt;
                result.loc = nearEnt.getLocation();
                result.distance = (s + 1) * step;
                return result;
            }
        } catch (eNear) {}
    }
    result.loc = origin.clone().add(dir.clone().multiply(maxDist));
    result.distance = maxDist;
    return result;
}

function isHuanjianhuItemId(id) {
    if (id == null) return false;
    var s = String(id);
    return s === "FKR_隐兰狂玉唤剑葫" || s.endsWith("FKR_隐兰狂玉唤剑葫") || s.indexOf("隐兰狂玉唤剑葫") >= 0;
}
function isHoldingItem(player) {
    if (player == null || !player.isOnline()) return false;
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem != null && isHuanjianhuItemId(sfItem.getId())) return true;
    try {
        var meta = item.getItemMeta();
        if (meta != null && meta.hasDisplayName() && String(meta.getDisplayName()).indexOf("唤剑葫") >= 0) return true;
    } catch (e) {}
    return false;
}
function wasHolding(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(stack);
    if (sfItem != null && isHuanjianhuItemId(sfItem.getId())) return true;
    try {
        var meta = stack.getItemMeta();
        if (meta != null && meta.hasDisplayName() && String(meta.getDisplayName()).indexOf("唤剑葫") >= 0) return true;
    } catch (e) {}
    return false;
}
function clearWeaponState(player) {
    if (player == null) return;
    var uuid = player.getUniqueId().toString();
    getXinTingStacksMap().remove(uuid);
    getXinTingStateMap().remove(uuid);
    getXinTingDecayTickMap().remove(uuid);
    getLeftClickCdMap().remove(uuid);
    getYanmouCdMap().remove(uuid);
    cancelYanmouTask(uuid);
    removeXinTingBar(uuid);
}

function isApplyingAbilityDamage(player) {
    if (player == null) return false;
    try { return player.hasMetadata(META_HUANJIANHU_ABILITY_DAMAGE); } catch (e) { return false; }
}

function withAbilityDamage(player, fn) {
    player = resolvePlayer(player);
    if (player == null || fn == null) return;
    try {
        player.setMetadata(META_HUANJIANHU_ABILITY_DAMAGE, new FixedMetadataValue(plugin, true));
        fn();
    } finally {
        try { player.removeMetadata(META_HUANJIANHU_ABILITY_DAMAGE, plugin); } catch (e) {}
    }
}

function cancelYanmouTask(uuid) {
    try {
        if (!yanmouTaskMap.containsKey(uuid)) return;
        var tid = yanmouTaskMap.remove(uuid);
        if (tid != null) Bukkit.getScheduler().cancelTask(Number(tid));
    } catch (e) {}
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

// ===================================================================
// 辅助：对指定半径内的所有活体实体造成纯伤害（不含玩家自身）
//   返回是否至少命中了一个生物
// ===================================================================
function aoeDamageParam(world, hitPoint, player, radius, dmg) {
    player = resolvePlayer(player);
    if (player == null) return false;
    var item = player.getInventory().getItemInMainHand();
    var hitAny = false;
    var hitCount = 0;
    var totalDamage = 0;
    withAbilityDamage(player, function () {
        var targets = world.getNearbyEntities(hitPoint, radius, radius, radius);
        for (var ti = 0; ti < targets.size(); ti++) {
            var ent = targets.get(ti);
            if (!(ent instanceof LivingEntity) || isSamePlayer(ent, player) || ent.isDead()) continue;
            ent.setNoDamageTicks(0);
            ent.damage(dmg, player);
            hitCount++;
            totalDamage += dmg;
            hitAny = true;
        }
    });
    if (hitCount > 0) {
        notifyAbilityDamageSummary(player, item, totalDamage, hitCount);
    }
    return hitAny;
}

// ===================================================================
// 辅助：垂直下坠的粒子剑（剑尖朝下、握柄朝上），用指定颜色绘制
//   loc = 剑尖位置；s = 尺寸倍数
// ===================================================================
function drawFallingSword(world, loc, dustOpt, s) {
    var bladeLen  = 1.2 * s;
    var guardHalf = 0.35 * s;
    var handleLen = 0.4 * s;
    var step = 0.15;
    for (var y = 0; y <= bladeLen; y += step) {
        spawnDust(world, loc.clone().add(0, y, 0), 1, 0, 0, 0, 0, dustOpt);
    }
    for (var x = -guardHalf; x <= guardHalf; x += step) {
        spawnDust(world, loc.clone().add(x, bladeLen, 0), 1, 0, 0, 0, 0, dustOpt);
    }
    for (var y2 = bladeLen + 0.1; y2 <= bladeLen + handleLen; y2 += step) {
        spawnDust(world, loc.clone().add(0, y2, 0), 1, 0, 0, 0, 0, dustOpt);
    }
}

// ===================================================================
// 辅助：火焰红剑（焰眸专用）——火焰 + 红色粒子组成的剑，垂直下落
//   loc = 剑尖位置；s = 尺寸倍数
// ===================================================================
function drawFlameSword(world, loc, s) {
    var bladeLen  = 1.2 * s;
    var guardHalf = 0.35 * s;
    var handleLen = 0.4 * s;
    var step = 0.15;
    for (var y = 0; y <= bladeLen; y += step) {
        world.spawnParticle(Particle.FLAME, loc.clone().add(0, y, 0), 1, 0, 0, 0, 0);
        spawnDust(world, loc.clone().add(0, y, 0), 1, 0, 0, 0, 0, RED_DUST);
    }
    for (var x = -guardHalf; x <= guardHalf; x += step) {
        world.spawnParticle(Particle.FLAME, loc.clone().add(x, bladeLen, 0), 1, 0, 0, 0, 0);
        spawnDust(world, loc.clone().add(x, bladeLen, 0), 1, 0, 0, 0, 0, RED_DUST);
    }
    for (var y2 = bladeLen + 0.1; y2 <= bladeLen + handleLen; y2 += step) {
        world.spawnParticle(Particle.FLAME, loc.clone().add(0, y2, 0), 1, 0, 0, 0, 0);
        spawnDust(world, loc.clone().add(0, y2, 0), 1, 0, 0, 0, 0, RED_DUST);
    }
}

// ===================================================================
// 辅助：焰眸红剑下落（火焰剑），落地后造成范围伤害
// ===================================================================
function summonFlameSwordDrop(world, targetLoc, player, height, dropTicks, radius, dmg) {
    var ownerId = player.getUniqueId().toString();
    var startLoc = targetLoc.clone().add(0, height, 0);
    var pos = startLoc.clone();
    var perTick = height / dropTicks;
    var tickCount = 0;
    var landed = false;
    var taskRef = null;
    var damageCenter = targetLoc.clone().add(0, 1.0, 0);
    var DownTask = Java.extend(BukkitRunnable, {
        run: function() {
            if (landed) return;
            var owner = resolvePlayer(ownerId);
            if (owner == null) {
                landed = true;
                try { taskRef.cancel(); } catch (e0) {}
                return;
            }
            drawFlameSword(world, pos, 1.0);
            tickCount++;
            pos.subtract(0, perTick, 0);
            if (tickCount >= dropTicks) {
                landed = true;
                try { taskRef.cancel(); } catch(e) {}
                aoeDamageParam(world, damageCenter, owner, radius, dmg);
                // 命中爆炸（火焰 + 红色粒子 + 声音）
                world.spawnParticle(Particle.FLAME, targetLoc, 20, 1.5, 1.5, 1.5, 0.03);
                spawnDust(world, targetLoc, 40, 1.5, 1.5, 1.5, 0, RED_DUST_BIG);
                world.playSound(targetLoc, SOUND_EXPLODE, 1.2, 0.9);
            }
        }
    });
    taskRef = new DownTask().runTaskTimer(plugin, 0, 1);
}

// ===================================================================
// 辅助：在指定位置召唤一把粒子剑垂直下落，落地后对 radius 造成 dmg 伤害
// ===================================================================
function summonSwordDrop(world, targetLoc, player, dustOpt, height, dropTicks, radius, dmg, impactFunc) {
    var ownerId = player.getUniqueId().toString();
    var startLoc = targetLoc.clone().add(0, height, 0);
    var pos = startLoc.clone();
    var perTick = height / dropTicks;
    var tickCount = 0;
    var landed = false;
    var taskRef = null;
    var damageCenter = targetLoc.clone().add(0, 1.0, 0);
    var DownTask = Java.extend(BukkitRunnable, {
        run: function() {
            if (landed) return;
            var owner = resolvePlayer(ownerId);
            if (owner == null) {
                landed = true;
                try { taskRef.cancel(); } catch (e0) {}
                return;
            }
            drawFallingSword(world, pos, dustOpt, 1.0);
            tickCount++;
            pos.subtract(0, perTick, 0);
            if (tickCount >= dropTicks) {
                landed = true;
                try { taskRef.cancel(); } catch(e) {}
                var hitAny = aoeDamageParam(world, damageCenter, owner, radius, dmg);
                if (impactFunc) impactFunc(world, targetLoc, owner, hitAny);
            }
        }
    });
    taskRef = new DownTask().runTaskTimer(plugin, 0, 1);
}

// ===================================================================
// 心霆 BossBar 显示
// ===================================================================
// 创建/激活心霆 BossBar（层数模式，倒计时进度由刷新任务持续更新）
function updateXinTingBar(uuid, player, stacks) {
    try {
        var barMap = getXinTingBarMap();
        var bar = barMap.get(uuid);
        if (bar == null) {
            bar = Bukkit.createBossBar(
                fmtMsg(MSG_XINTING_BAR_STACK, {stacks: stacks, max: XINTING_MAX}),
                BarColor.RED, BarStyle.SOLID
            );
            barMap.put(uuid, bar);
        }
        try { bar.removeAll(); } catch (eRm) {}
        bar.addPlayer(player);
        bar.setTitle(fmtMsg(MSG_XINTING_BAR_STACK, {stacks: stacks, max: XINTING_MAX}));
        bar.setColor(BarColor.RED);
        bar.setProgress(1.0);
        bar.setVisible(true);
        startXinTingBarTicker();
    } catch (e) {
        plugin.getLogger().warning("[隐兰狂玉唤剑葫] 心霆BossBar异常: " + e);
    }
}

// 每 tick 刷新心霆 BossBar：仅在有 Bar 时运行；清空后自动停止
function stopXinTingBarTicker() {
    try {
        if (plugin.hasMetadata(META_HUANJIANHU_BAR_TASK)) {
            try { Bukkit.getScheduler().cancelTask(Number(plugin.getMetadata(META_HUANJIANHU_BAR_TASK).get(0).value())); } catch (e0) {}
            try { plugin.removeMetadata(META_HUANJIANHU_BAR_TASK, plugin); } catch (e1) {}
        }
    } catch (e) {}
    xinTingBarTickerActive = false;
}
function startXinTingBarTicker() {
    stopXinTingBarTicker();
    xinTingBarTickerActive = true;
    var Ticker = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                if (getXinTingBarMap().isEmpty()) {
                    stopXinTingBarTicker();
                    return;
                }
                var uuids = new java.util.HashSet(getXinTingBarMap().keySet());
                var it = uuids.iterator();
                while (it.hasNext()) {
                    var uuid = it.next();
                    var bar = getXinTingBarMap().get(uuid);
                    if (bar == null) continue;
                    var player = Bukkit.getPlayer(UUID.fromString(uuid));
                    if (player == null || !player.isOnline()) { removeXinTingBar(uuid); continue; }

                    var left = getXinTingStateMap().containsKey(uuid) ? getXinTingStateMap().get(uuid) : 0;
                    if (left > 0) {
                        // 状态模式：显示状态持续倒计时
                        var secs = Math.max(1, Math.ceil(left / 20));
                        bar.setColor(BarColor.PURPLE);
                        bar.setTitle(fmtMsg(MSG_XINTING_BAR_STATE, {secs: secs}));
                        bar.setProgress(Math.max(0.05, Math.min(1.0, left / XINTING_STATE_TICKS)));
                        bar.setVisible(true);
                        bar.addPlayer(player);
                    } else {
                        // 层数模式：显示层数 + 衰减倒计时进度
                        var stacks = getXinTingStacksMap().containsKey(uuid) ? Number(getXinTingStacksMap().get(uuid)) : 0;
                        if (stacks <= 0) { removeXinTingBar(uuid); continue; }
                        var decayTick = getXinTingDecayTickMap().containsKey(uuid) ? Number(getXinTingDecayTickMap().get(uuid)) : 0;
                        // 倒计时：从 1 递减到接近 0，衰减触发时归 1
                        var prog = 1.0 - (decayTick / XINTING_DECAY_TICKS);
                        bar.setColor(BarColor.RED);
                        bar.setTitle(fmtMsg(MSG_XINTING_BAR_STACK, {stacks: stacks, max: XINTING_MAX}));
                        bar.setProgress(Math.max(0.05, Math.min(1.0, prog)));
                        bar.setVisible(true);
                        bar.addPlayer(player);
                        // 递增衰减周期进度
                        getXinTingDecayTickMap().put(uuid, decayTick + 1);
                    }
                }
                if (getXinTingBarMap().isEmpty()) stopXinTingBarTicker();
            } catch (e) {}
        }
    });
    try {
        plugin.setMetadata(META_HUANJIANHU_BAR_TASK, new FixedMetadataValue(plugin, new Ticker().runTaskTimer(plugin, 0, 1).getTaskId()));
    } catch (eId) {}
}
function removeXinTingBar(uuid) {
    try {
        var bar = getXinTingBarMap().remove(uuid);
        if (bar != null) { bar.removeAll(); bar.setVisible(false); }
        if (getXinTingBarMap().isEmpty()) stopXinTingBarTicker();
    } catch (e) {}
}

// ===================================================================
// 心霆层数增加 / 心霆状态触发
// ===================================================================
function addXinTingStack(player) {
    var uuid = player.getUniqueId().toString();
    var stacks = 0;
    if (getXinTingStacksMap().containsKey(uuid)) stacks = Number(getXinTingStacksMap().get(uuid));
    stacks++;
    if (stacks >= XINTING_MAX) {
        getXinTingStacksMap().put(uuid, 0);
        triggerXinTingState(player);
    } else {
        getXinTingStacksMap().put(uuid, stacks);
        updateXinTingBar(uuid, player, stacks);
        player.sendActionBar(fmtMsg(MSG_XINTING_STACK_GAINED, {stacks: stacks, max: XINTING_MAX}));
    }
}

// ===================================================================
// 心霆层数递减：每 3 秒减少一层，直到归零（获得层数不会重置倒计时）
// ===================================================================
function startXinTingDecay() {
    try {
        if (plugin.hasMetadata(META_HUANJIANHU_DECAY_TASK)) {
            try { Bukkit.getScheduler().cancelTask(Number(plugin.getMetadata(META_HUANJIANHU_DECAY_TASK).get(0).value())); } catch (e0) {}
            try { plugin.removeMetadata(META_HUANJIANHU_DECAY_TASK, plugin); } catch (e1) {}
        }
    } catch (e0) {}
    var DecayTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                var it = getXinTingStacksMap().entrySet().iterator();
                while (it.hasNext()) {
                    var entry = it.next();
                    var uuid = entry.getKey();
                    var stacks = Number(entry.getValue());
                    if (stacks <= 0) continue;
                    stacks--;
                    if (stacks <= 0) {
                        entry.setValue(0);
                        getXinTingDecayTickMap().remove(uuid);
                        removeXinTingBar(uuid);
                    } else {
                        entry.setValue(stacks);
                        getXinTingDecayTickMap().put(uuid, 0); // 衰减一次，倒计时进度归 1
                        var player = Bukkit.getPlayer(UUID.fromString(uuid));
                        if (player != null && player.isOnline()) {
                            updateXinTingBar(uuid, player, stacks);
                        }
                    }
                }
            } catch (e) {}
        }
    });
    try {
        plugin.setMetadata(META_HUANJIANHU_DECAY_TASK, new FixedMetadataValue(plugin, new DecayTask().runTaskTimer(plugin, XINTING_DECAY_TICKS, XINTING_DECAY_TICKS).getTaskId()));
    } catch (eId) {}
}

function triggerXinTingState(player) {
    var uuid = player.getUniqueId().toString();
    var world = player.getWorld();
    // 缓慢升空：飘浮 10 秒
    if (TYPE_LEVITATION != null) {
        player.addPotionEffect(new PotionEffect(TYPE_LEVITATION, XINTING_STATE_TICKS, XINTING_LEVITATION_LEVEL, true, false, false));
    }
    // 缓降：持续 15 秒（覆盖心霆状态时间，结束后仍缓降缓冲落地）
    if (TYPE_SLOW_FALLING != null) {
        player.addPotionEffect(new PotionEffect(TYPE_SLOW_FALLING, XINTING_SLOW_FALL_TICKS, XINTING_SLOW_FALL_LEVEL, true, false, false));
    }
    getXinTingStateMap().put(uuid, XINTING_STATE_TICKS);
    // 冷却掉层数，切换为状态 Bar（显示状态持续倒计时）
    getXinTingStacksMap().put(uuid, 0);
    getXinTingDecayTickMap().remove(uuid);
    // 创建/复用状态 BossBar（紫色），倒计时由刷新任务持续更新
    var stateBar = getXinTingBarMap().get(uuid);
    if (stateBar == null) {
        stateBar = Bukkit.createBossBar(
            fmtMsg(MSG_XINTING_BAR_STATE, {secs: 10}),
            BarColor.PURPLE, BarStyle.SOLID
        );
        getXinTingBarMap().put(uuid, stateBar);
    }
    stateBar.addPlayer(player);
    stateBar.setColor(BarColor.PURPLE);
    stateBar.setTitle(fmtMsg(MSG_XINTING_BAR_STATE, {secs: 10}));
    stateBar.setProgress(1.0);
    stateBar.setVisible(true);
    startXinTingBarTicker();
    player.sendTitle(
        MSG_XINTING_TITLE,
        MSG_XINTING_SUBTITLE,
        10, 70, 20
    );
    player.sendActionBar(MSG_XINTING_ACTIVATED);
    world.playSound(player.getLocation(), SOUND_BEACON, 1.0, 1.2);
    world.playSound(player.getLocation(), SOUND_THUNDER, 1.0, 1.0);
    // 心霆状态全局粒子扩散
    spawnDust(world, player.getLocation().add(0, 1, 0), 200, 2, 2, 2, 0, THUNDER_DUST);
    world.spawnParticle(Particle.ELECTRIC_SPARK, player.getLocation().add(0, 1, 0), 60, 2, 2, 2, 0.05);

    // 10 秒倒计时，结束移除心霆状态
    var left = XINTING_STATE_TICKS;
    var taskRef = null;
    var StateTask = Java.extend(BukkitRunnable, {
        run: function() {
            if (!player.isOnline()) {
                getXinTingStateMap().remove(uuid);
                try { taskRef.cancel(); } catch(e) {}
                return;
            }
            left--;
            getXinTingStateMap().put(uuid, left); // 同步给刷新任务用于状态倒计时显示
            if (left <= 0) {
                getXinTingStateMap().remove(uuid);
                player.sendActionBar(MSG_XINTING_ENDED);
                try { taskRef.cancel(); } catch(e) {}
            } else {
                // 缓慢升空期间周期性粒子
                if (left % 20 === 0) {
                    world.spawnParticle(Particle.ELECTRIC_SPARK, player.getLocation().add(0, 1, 0), 20, 1.2, 1.2, 1.2, 0.03);
                }
            }
        }
    });
    taskRef = new StateTask().runTaskTimer(plugin, 0, 1);
}

function isXinTingState(player) {
    var uuid = player.getUniqueId().toString();
    return getXinTingStateMap().containsKey(uuid) && getXinTingStateMap().get(uuid) > 0;
}

// ===================================================================
// 剑光（左键）：发射剑光，命中生物/方块/到达最大射程时，
//   均在最终位置召唤白剑从天而降；爆炸命中生物后为玩家播放声音
// ===================================================================
function castSwordLight(player) {
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();
    // 释放时玩家自身：小型蒸汽粒子爆发 + 风墟龙冕小气斩的发射声音
    var selfLoc = player.getLocation().add(0, 1.2, 0);
    world.spawnParticle(Particle.CLOUD, selfLoc, 30, 0.6, 0.6, 0.6, 0.06);
    spawnDust(world, selfLoc, 12, 0.5, 0.5, 0.5, 0, WHITE_DUST);
    world.playSound(selfLoc, SOUND_STEAM, 1.0, 1.6);
    world.playSound(selfLoc, SOUND_SWEEP, 0.6, 1.8);
    world.playSound(selfLoc, SOUND_WITHER_SHOOT, 0.8, 1.2);
    // 剑光射线检测（命中生物或方块）
    var ray = rayTraceLivingAhead(world, eye, dir, JIANGUANG_RANGE, player);
    var endDist = ray.distance;
    var hitLoc = ray.loc;
    if (ray.entity != null) hitLoc = ray.entity.getLocation();
    // 剑光轨迹粒子（白色）
    var tracer = eye.clone();
    var stepVec = dir.clone().multiply(0.4);
    var steps = Math.floor(endDist / 0.4);
    for (var i = 0; i < steps; i++) {
        spawnDust(world, tracer, 1, 0.02, 0.02, 0.02, 0, WHITE_DUST);
        world.spawnParticle(Particle.END_ROD, tracer, 1, 0.05, 0.05, 0.05, 0);
        tracer.add(stepVec);
    }
    // 命中点（生物/方块/最大射程均在此召唤白剑）
    var target = hitLoc != null ? hitLoc : eye.clone().add(dir.clone().multiply(JIANGUANG_RANGE));
    // 命中点给目标地面坐标（白剑落到最上方固体上）
    target.setY(world.getHighestBlockYAt(target.getBlockX(), target.getBlockZ()) - 0.5);
    world.spawnParticle(Particle.END_ROD, target, 30, 1, 1, 1, 0.05);
    world.playSound(player.getLocation(), SOUND_ANVIL_LAND, 1.0, 1.2);
    summonSwordDrop(
        world, target, player,
        WHITE_DUST, JIANGUANG_SWORD_DROP_HEIGHT, JIANGUANG_SWORD_DROP_TICK,
        AOE_RADIUS, calcSitDamage(SIT_JIANGUANG_MULT),
        function(w, loc, p, hitAny) {
            w.spawnParticle(Particle.CLOUD, loc, 20, 1.0, 1.0, 1.0, 0.04);
            spawnDust(w, loc, 25, 1.2, 1.2, 1.2, 0, WHITE_DUST);
            // 铁砧落地声：无论命中方块还是敌人，都在玩家耳边清晰播放
            w.playSound(loc, SOUND_ANVIL_LAND, 1.0, 1.1);
            p.getWorld().playSound(p.getLocation(), SOUND_ANVIL_LAND, 1.0, 1.05);
            // 命中生物时叠加横扫打击声（不再用"叮"声）
            if (hitAny) {
                p.getWorld().playSound(p.getLocation(), SOUND_SWEEP, 1.0, 1.2);
            }
        }
    );
    // 心霆层数 +1
    addXinTingStack(player);
}

// ===================================================================
// 焰眸（右键）：大型圆形红色法阵（直径15，大环+3内环），
//   持续索敌法阵范围内敌人，在敌人上方召唤向下落的火焰红剑
// ===================================================================
var META_YANMOU_DEDUP = "gltc_huanjianhu_yanmou_dedup";
var RunnableImpl = Java.extend(Java.type('java.lang.Runnable'));

function castFlameEye(player) {
    if (player == null || !player.isOnline()) return;
    if (player.hasMetadata(META_YANMOU_DEDUP)) return;
    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (getYanmouCdMap().containsKey(uuid) && (now - getYanmouCdMap().get(uuid)) < YANMOU_COOLDOWN_MS) {
        var remain = Math.ceil((YANMOU_COOLDOWN_MS - (now - getYanmouCdMap().get(uuid))) / 1000);
        player.sendActionBar(fmtMsg(MSG_FLAME_EYE_COOLDOWN, {secs: remain}));
        return;
    }
    try {
        player.setMetadata(META_YANMOU_DEDUP, new FixedMetadataValue(plugin, true));
        Bukkit.getScheduler().runTaskLater(plugin, new RunnableImpl({
            run: function () {
                try { player.removeMetadata(META_YANMOU_DEDUP, plugin); } catch (e) {}
            }
        }), 2);
    } catch (eDedup) {}

    try {
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var ownerId = uuid;

    // ===== 确定法阵中心 =====
    var farthest = null, farthestDist = 0;
    var forwardXZ = eye.getDirection().clone(); forwardXZ.setY(0);
    if (forwardXZ.lengthSquared() < 0.001) forwardXZ = new Vector(1, 0, 0);
    forwardXZ.normalize();
    var nearby = world.getNearbyEntities(eye, 20, 20, 20);
    for (var ni = 0; ni < nearby.size(); ni++) {
        var ent = nearby.get(ni);
        if (!(ent instanceof LivingEntity) || isSamePlayer(ent, player) || ent.isDead()) continue;
        var eLoc = ent.getLocation();
        var rel = eLoc.toVector().subtract(eye.toVector());
        var relXZ = rel.clone(); relXZ.setY(0);
        if (relXZ.dot(forwardXZ) <= 0) continue;
        var dist = rel.length();
        if (dist <= 20 && dist > farthestDist) {
            farthestDist = dist;
            farthest = ent;
        }
    }

    var circleCenter;
    if (farthest != null) {
        var fLoc = farthest.getLocation();
        var fgY = world.getHighestBlockYAt(fLoc.getBlockX(), fLoc.getBlockZ());
        circleCenter = new (Java.type("org.bukkit.Location"))(world, fLoc.getX(), fgY + 0.5 + YANMOU_HEIGHT_ABOVE, fLoc.getZ());
    } else {
        var centerX = eye.getX() + forwardXZ.getX() * YANMOU_FORWARD;
        var centerZ = eye.getZ() + forwardXZ.getZ() * YANMOU_FORWARD;
        var ngY = world.getHighestBlockYAt(Math.floor(centerX), Math.floor(centerZ));
        circleCenter = new (Java.type("org.bukkit.Location"))(world, centerX, ngY + 0.5 + YANMOU_HEIGHT_ABOVE, centerZ);
    }
    var radius = YANMOU_RADIUS;

    cancelYanmouTask(uuid);

    var phase = 0;
    var phaseTick = 0;
    var tick = 0;
    var taskRef = null;

    // 绘制法阵：大环 + 3 个内环（水平圆形，粒子密集），r 为当前半径
    function drawRunes(r) {
        var n = 90; // 大环粒子数（更密集）
        // 大环（双层，+/- 小幅高度形成立体厚度）
        for (var i = 0; i < n; i++) {
            var a = (i / n) * 2 * Math.PI;
            var pl = circleCenter.clone().add(Math.cos(a) * r, 0, Math.sin(a) * r);
            spawnDust(world, pl, 1, 0, 0, 0, 0, RED_DUST_BIG);
            world.spawnParticle(Particle.FLAME, pl, 1, 0, 0, 0, 0);
            // 第二层略高，增加密度与立体感
            var plUp = pl.clone().add(0, 0.6, 0);
            spawnDust(world, plUp, 1, 0, 0, 0, 0, RED_DUST_BIG);
            world.spawnParticle(Particle.FLAME, plUp, 1, 0, 0, 0, 0);
        }
        // 3 个内环（半径依次递减，粒子更密集）
        var innerRadii = [r * 0.66, r * 0.4, r * 0.16];
        for (var rr = 0; rr < innerRadii.length; rr++) {
            var nr = 60 - rr * 12;
            for (var j = 0; j < nr; j++) {
                var a2 = (j / nr) * 2 * Math.PI;
                var pl2 = circleCenter.clone().add(Math.cos(a2) * innerRadii[rr], 0, Math.sin(a2) * innerRadii[rr]);
                spawnDust(world, pl2, 1, 0, 0, 0, 0, RED_DUST);
                world.spawnParticle(Particle.FLAME, pl2, 1, 0, 0, 0, 0);
            }
        }
        // 中心密集火焰
        world.spawnParticle(Particle.FLAME, circleCenter, 20, 1.2, 0.4, 1.2, 0.03);
        spawnDust(world, circleCenter, 30, 1.2, 0.4, 1.2, 0, RED_DUST);
    }

    // 绘制红色球状粒子（沿玩家->法阵中心路径的当前位置）
    function drawRedOrb(loc) {
        for (var i = 0; i < 14; i++) {
            var theta = Math.random() * 2 * Math.PI;
            var phi = Math.acos(2 * Math.random() - 1);
            var or = 0.8;
            var ox = loc.getX() + or * Math.sin(phi) * Math.cos(theta);
            var oy = loc.getY() + or * Math.cos(phi);
            var oz = loc.getZ() + or * Math.sin(phi) * Math.sin(theta);
            spawnDust(world, new (Java.type("org.bukkit.Location"))(world, ox, oy, oz), 1, 0, 0, 0, 0, RED_DUST);
        }
        world.spawnParticle(Particle.FLAME, loc, 3, 0.5, 0.5, 0.5, 0);
    }

    // 法阵任务：红球飞行(0.5s) -> 法阵展开(0.5s) -> 持续索敌
    var EyeTask = Java.extend(BukkitRunnable, {
        run: function() {
            try {
                var owner = resolvePlayer(ownerId);
                if (owner == null || !owner.isOnline()) {
                    try { if (taskRef != null) taskRef.cancel(); } catch (e0) {}
                    yanmouTaskMap.remove(ownerId);
                    return;
                }

            if (phase === 0) {
                // 阶段0：红色球状粒子从玩家自身位置飞向法阵中心（0.5秒=10tick）
                var start = owner.getLocation().clone().add(0, 1.5, 0);
                var end = circleCenter.clone();
                var t = phaseTick / YANMOU_CAST_TICK;
                if (t > 1) t = 1;
                var ballPos = start.clone().add(end.clone().subtract(start).multiply(t));
                drawRedOrb(ballPos);
                phaseTick++;
                if (phaseTick >= YANMOU_CAST_TICK) { phase = 1; phaseTick = 0; }
                return;
            }

            if (phase === 1) {
                // 阶段1：法阵从中心快速展开到完整半径（0.5秒）
                var curR = radius * (phaseTick / YANMOU_CAST_TICK);
                if (curR > 0) drawRunes(Math.max(curR, 0.3));
                phaseTick++;
                if (phaseTick >= YANMOU_CAST_TICK) { phase = 2; phaseTick = 0; }
                return;
            }

            // 阶段2：持续绘制法阵 + 索敌召唤红剑
            if (tick >= YANMOU_DURATION_TICK) {
                try { taskRef.cancel(); } catch(e) {}
                yanmouTaskMap.remove(ownerId);
                return;
            }
            drawRunes(radius);

            // 每 0.5 秒一轮：根据本轮红剑数量平分 500 伤害
            if (tick % YANMOU_INTERVAL_TICK === 0) {
                // 索敌：法阵水平投影内所有活体敌人（最多 5 道）
                var dropLocs = new java.util.ArrayList();
                var searchY = circleCenter.getY() - YANMOU_HEIGHT_ABOVE; // 法阵投影地面高度
                var searchCenter = circleCenter.clone(); searchCenter.setY(searchY + YANMOU_HEIGHT_ABOVE / 2);
                var searchRadius = Math.max(radius, YANMOU_HEIGHT_ABOVE + radius);
                var targets = world.getNearbyEntities(searchCenter, radius, searchRadius, radius);
                for (var ti = 0; ti < targets.size(); ti++) {
                    var ent = targets.get(ti);
                    if (!(ent instanceof LivingEntity) || isSamePlayer(ent, owner) || ent.isDead()) continue;
                    var eLoc = ent.getLocation();
                    var dx = eLoc.getX() - circleCenter.getX();
                    var dz = eLoc.getZ() - circleCenter.getZ();
                    if (dx * dx + dz * dz > radius * radius) continue;
                    dropLocs.add(eLoc.clone());
                }
                if (dropLocs.isEmpty()) {
                    // 本轮无法阵范围内敌人：随机生成 5 道红剑
                    for (var rs = 0; rs < 5; rs++) {
                        var ra = Math.random() * 2 * Math.PI;
                        var rr = Math.sqrt(Math.random()) * radius * 0.9;
                        var rx = circleCenter.getX() + Math.cos(ra) * rr;
                        var rz = circleCenter.getZ() + Math.sin(ra) * rr;
                        var rl = new (Java.type("org.bukkit.Location"))(
                            world, rx,
                            world.getHighestBlockYAt(Math.floor(rx), Math.floor(rz)) - 0.5,
                            rz
                        );
                        dropLocs.add(rl);
                    }
                }
                // 最多 5 道，这一轮每把伤害 = 总伤害 / 本轮红剑数量
                var dropCount = Number(dropLocs.size());
                if (dropCount > 5) dropCount = 5;
                if (dropCount <= 0) {
                    tick++;
                    return;
                }
                var roundDamage = calcSitDamage(SIT_YANMOU_TOTAL_MULT / dropCount);
                for (var dl = 0; dl < dropCount; dl++) {
                    try {
                    var fallTarget = dropLocs.get(dl);
                    fallTarget.setY(world.getHighestBlockYAt(fallTarget.getBlockX(), fallTarget.getBlockZ()) - 0.5);
                    var dropHeight = circleCenter.getY() - fallTarget.getY();
                    if (dropHeight < 3) dropHeight = 3;
                    // 下落时长与高度成正比（约每格 1.5 tick，慢速坠落更明显）
                    var dropTicks = Math.max(YANMOU_SWORD_DROP_TICK, Math.floor(dropHeight * 1.5));
                    summonFlameSwordDrop(
                        world, fallTarget, owner,
                        dropHeight, dropTicks,
                        AOE_RADIUS, roundDamage
                    );
                    } catch (dropEx) {
                        try { plugin.getLogger().warning("[隐兰狂玉唤剑葫] 焰眸落剑异常: " + dropEx); } catch (eLog2) {}
                    }
                }
            }
            tick++;
            } catch (ex) {
                try { plugin.getLogger().warning("[隐兰狂玉唤剑葫] 焰眸tick异常: " + ex); } catch (eLog) {}
            }
        }
    });
    taskRef = new EyeTask().runTaskTimer(plugin, 0, 1);
    yanmouTaskMap.put(uuid, taskRef.getTaskId());
    getYanmouCdMap().put(uuid, now);
    world.playSound(player.getLocation(), SOUND_BEACON, 1.0, 0.8);
    world.playSound(circleCenter, SOUND_BEACON, 1.2, 0.6);
    addXinTingStack(player);
    } catch (ex) {
        cancelYanmouTask(uuid);
        try { plugin.getLogger().warning("[隐兰狂玉唤剑葫] 焰眸施展异常: " + ex); } catch (eLog) {}
        try { player.sendActionBar("§c焰眸施展失败"); } catch (eAb) {}
    }
}

// ===================================================================
// 剑霆（心霆状态左键）：在视线看向的方向召唤数道雷霆与大型紫色粒子爆发，
//   命中目标/方块/最远 40 米处触发，命中处造成范围伤害并有粒子与声音
// ===================================================================
function castSwordThunder(player) {
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();

    // 心霆状态释放：玩家脚下大型紫色粒子爆发 + 剑光发射声（蒸汽/扫击/气斩）
    var footLoc = player.getLocation().add(0, 0.3, 0);
    spawnDust(world, footLoc, 140, 2.4, 1.0, 2.4, 0, THUNDER_DUST);
    spawnDust(world, footLoc, 80, 2.0, 0.8, 2.0, 0, THUNDER_DUST2);
    world.spawnParticle(Particle.ELECTRIC_SPARK, footLoc, 60, 2.2, 1.0, 2.2, 0.05);
    world.spawnParticle(Particle.CLOUD, footLoc, 40, 1.4, 0.6, 1.4, 0.08);
    world.playSound(footLoc, SOUND_STEAM, 1.0, 1.6);
    world.playSound(footLoc, SOUND_SWEEP, 0.6, 1.8);
    world.playSound(footLoc, SOUND_WITHER_SHOOT, 0.8, 1.2);

    // 视线射线检测（命中目标或方块，最远 JIANTING_RANGE = 40 米）
    var ray = rayTraceLivingAhead(world, eye, dir, JIANTING_RANGE, player);
    var endLoc = null;
    if (ray.loc != null) {
        endLoc = ray.loc.clone();
        if (ray.entity != null) endLoc = ray.entity.getLocation();
    } else {
        endLoc = eye.clone().add(dir.clone().multiply(JIANTING_RANGE));
    }
    endLoc.setY(world.getHighestBlockYAt(endLoc.getBlockX(), endLoc.getBlockZ()) - 0.5);

    // 数道雷霆：在命中点及周围随机召唤多道闪电
    var thunderCount = 6;
    for (var t = 0; t < thunderCount; t++) {
        var strikeLoc = endLoc.clone().add(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 3
        );
        world.strikeLightningEffect(strikeLoc);
    }

    // 大型紫色粒子爆发（FLASH 可能因 Graal 重载解析失败，须 try-catch）
    try { world.spawnParticle(Particle.FLASH, endLoc, 1, 0, 0, 0, 0, Color.fromRGB(255, 255, 255)); } catch (eFlash) {}
    spawnDust(world, endLoc, 250, 4, 2, 4, 0.02, THUNDER_DUST);
    spawnDust(world, endLoc, 120, 3, 1.5, 3, 0.02, THUNDER_DUST2);
    world.spawnParticle(Particle.ELECTRIC_SPARK, endLoc, 150, 4, 2, 4, 0.06);
    world.spawnParticle(Particle.SOUL_FIRE_FLAME, endLoc, 80, 3, 1.5, 3, 0.04);
    // 终点第一次范围伤害
    var thunderDmg = calcSitDamage(SIT_JIANTING_MULT);
    var hitCenter = endLoc.clone().add(0, 1.0, 0);
    var hitAny = aoeDamageParam(world, hitCenter, player, AOE_RADIUS, thunderDmg);

    // 终点第二次爆炸伤害（仅终点，不做途径 AOE）
    var ownerId = player.getUniqueId().toString();
    var blastLoc = endLoc.clone();
    var BlastTask = Java.extend(BukkitRunnable, {
        run: function () {
            var owner = resolvePlayer(ownerId);
            if (owner == null) return;
            spawnDust(world, blastLoc, 80, 2, 1, 2, 0.02, THUNDER_DUST2);
            world.spawnParticle(Particle.ELECTRIC_SPARK, blastLoc, 40, 2, 1, 2, 0.05);
            world.playSound(blastLoc, SOUND_RESPAWN_ANCHOR_EXPLODE, 1.4, 0.85);
            aoeDamageParam(world, hitCenter, owner, AOE_RADIUS, thunderDmg);
        }
    });
    new BlastTask().runTaskLater(plugin, JIANTING_BLAST_DELAY);

    // 声音
    world.playSound(endLoc, SOUND_THUNDER, 1.5, 0.7);
    world.playSound(endLoc, SOUND_EXPLODE, 1.6, 0.8);
    world.playSound(endLoc, SOUND_RESPAWN_ANCHOR_EXPLODE, 1.6, 0.8); // 命中处重生锚破碎声
    if (hitAny) {
        world.playSound(player.getLocation(), SOUND_THUNDER, 1.0, 0.9);
    }
}

// ===================================================================
// 左键：剑光 / 剑霆（Interact + 近战攻击双入口）
// ===================================================================
function handleLeftClick(player, skipHoldCheck) {
    if (player == null || !player.isOnline()) return;
    if (isApplyingAbilityDamage(player)) return;
    if (!skipHoldCheck && !isHoldingItem(player)) return;
    var now = Date.now();
    var uuid = player.getUniqueId().toString();
    var cdMap = getLeftClickCdMap();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < JIANGUANG_CD_MS) return;
    cdMap.put(uuid, now);
    try {
        if (isXinTingState(player)) castSwordThunder(player);
        else castSwordLight(player);
    } catch (e) {
        try { plugin.getLogger().warning("[隐兰狂玉唤剑葫] 左键施展异常: " + e); } catch (eLog) {}
    }
}

// ===================================================================
// 右键：焰眸（Interact 主入口；onUse 作 RSC 兜底）
// ===================================================================
function handleRightClick(player, skipHoldCheck) {
    if (player == null || !player.isOnline()) return;
    if (!skipHoldCheck && !isHoldingItem(player)) return;
    if (isXinTingState(player)) {
        player.sendActionBar(MSG_XINTING_RIGHT_BLOCKED);
        return;
    }
    castFlameEye(player);
}

// ===================================================================
// 右键：焰眸（Interact 主入口；onUse 作 RSC 兜底）
// ===================================================================
function onUse(event) {
    try {
        handleRightClick(event.getPlayer(), true);
    } catch (e) {
        plugin.getLogger().warning("[隐兰狂玉唤剑葫] onUse异常: " + e);
    }
}

Bukkit.getScheduler().runTask(plugin, new RunnableImpl({ run: startXinTingDecay }));

var huanjianhuListener = new (Java.extend(Listener, {}))();
var initListener = new RunnableImpl({
    run: function() {
        if (plugin.huanjianhuListenerRegistered === true && plugin.huanjianhuListener != null) {
            try { PlayerInteractEvent.getHandlerList().unregister(plugin.huanjianhuListener); } catch (e) {}
            try { EntityDamageByEntityEvent.getHandlerList().unregister(plugin.huanjianhuListener); } catch (e1) {}
            try { PlayerItemHeldEvent.getHandlerList().unregister(plugin.huanjianhuListener); } catch (e2) {}
            try { PlayerQuitEvent.getHandlerList().unregister(plugin.huanjianhuListener); } catch (e3) {}
        }
        plugin.huanjianhuListener = huanjianhuListener;
        plugin.huanjianhuListenerRegistered = true;

        Bukkit.getPluginManager().registerEvent(
            PlayerInteractEvent,
            huanjianhuListener,
            EventPriority.NORMAL,
            function (l, event) {
                try {
                    var actionName = event.getAction().name();
                    if (actionName !== "LEFT_CLICK_AIR" && actionName !== "LEFT_CLICK_BLOCK") return;
                    var hand = event.getHand();
                    if (hand == null || hand.name() !== "HAND") return;
                    var player = event.getPlayer();
                    if (!isHoldingItem(player)) return;
                    handleLeftClick(player, true);
                } catch (e) {
                    plugin.getLogger().warning("[隐兰狂玉唤剑葫] 交互异常: " + e);
                }
            },
            plugin
        );
        Bukkit.getPluginManager().registerEvent(
            EntityDamageByEntityEvent,
            huanjianhuListener,
            EventPriority.NORMAL,
            function (l, event) {
                try {
                    if (event.isCancelled()) return;
                    var damager = edbeDamager(event);
                    if (!isPlayer(damager)) return;
                    if (isApplyingAbilityDamage(damager)) return;
                    if (!isHoldingItem(damager)) return;
                    handleLeftClick(damager, true);
                } catch (e) {
                    try { plugin.getLogger().warning("[隐兰狂玉唤剑葫] 近战左键异常: " + e); } catch (eLog) {}
                }
            },
            plugin
        );
        Bukkit.getPluginManager().registerEvent(
            PlayerItemHeldEvent,
            huanjianhuListener,
            EventPriority.MONITOR,
            function (l, evt) {
                try {
                    var prev = evt.getPlayer().getInventory().getItem(evt.getPreviousSlot());
                    if (wasHolding(prev)) clearWeaponState(evt.getPlayer());
                } catch (e) {}
            },
            plugin
        );
        Bukkit.getPluginManager().registerEvent(
            PlayerQuitEvent,
            huanjianhuListener,
            EventPriority.MONITOR,
            function (l, event) {
                try { clearWeaponState(event.getPlayer()); } catch (e) {}
            },
            plugin
        );
    }
});

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
Bukkit.getScheduler().runTask(plugin, initListener);
