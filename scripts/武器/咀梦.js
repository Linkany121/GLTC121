// ===================================================================
// 咀嚼曾世的晚梦 —— 异能武器脚本
// 技能（依据物品描述 + 设计确认）：
//   左键进入蓄力(2秒◆条，未满黑/满时紫)，蓄满后自动释放 [祝灵=悦灵]
//   右键 [赐梦仪式]：引爆视野内(120°/32格)敌人的斥命
//   斥命>8：召唤宴死者之龙（末影龙下落特效）
//   被动：玩家视野内生物死亡时，在死亡处召唤祝灵
// 异能强度：读取附属配置 StarbyssAdjustment（default_config.yml），默认 10
// ===================================================================

var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var UUID = Java.type("java.util.UUID");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
var EntityDamageEvent = Java.type("org.bukkit.event.entity.EntityDamageEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var EntityDeathEvent = Java.type("org.bukkit.event.entity.EntityDeathEvent");
var EntityExplodeEvent = Java.type("org.bukkit.event.entity.EntityExplodeEvent");
var EntityChangeBlockEvent = Java.type("org.bukkit.event.entity.EntityChangeBlockEvent");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle$DustOptions");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Location = Java.type("org.bukkit.Location");
var Vector = Java.type("org.bukkit.util.Vector");
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var plugin = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;

var ITEM_ID = "FKR_咀嚼曾世的晚梦";     // Slimefun 物品 ID（须与 items.yml 一致）
var META_ZHU_LING = "gltc_jiumeng_zhuling";   // 祝灵实体 metadata 标记
var META_DRAGON = "gltc_jiumeng_dragon";      // 宴死者之龙 metadata 标记
var META_CHIMING_EXTRA = "gltc_jiumeng_chiming_extra"; // 斥命额外伤害防递归标记
// Graal 不能可靠给 Java Plugin 挂 JS 字段，任务 ID / 监听器改走 Metadata + 本文件变量
var META_JIUME_TASKS = "gltc_jiumeng_task_ids";
var META_JIUME_LISTENER = "gltc_jiumeng_listener";
var jiumengTaskIds = [];

// ===================================================================
// 【配置区】按分类调整数值；改完重载脚本即可
// ===================================================================

// -------------------------------------------------------------------
// 1. 基础 / 异能强度
// -------------------------------------------------------------------
var ABILITY_POWER_DEFAULT = 10;         // 异能强度默认值（配置缺失时的回退）
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment"; // 异能强度配置 ID
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode"; // 伤害提示方式
var DAMAGE_NOTIFY_DEFAULT = "chat"; // chat / actionbar / none
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";
var CHIMING_EXTRA_FACTOR = 0.1;         // 斥命受伤额外伤害：层数 × 此值 × 异能强度
var RITUAL_DAMAGE_FACTOR = 1.0;         // 赐梦仪式伤害：层数 × 此值 × 异能强度
var DRAGON_DAMAGE_FACTOR = 100.0;       // 龙落地爆炸伤害：此值 × 异能强度

// -------------------------------------------------------------------
// 2. 左键蓄力
// -------------------------------------------------------------------
var CHARGE_TICKS = 20;                  // 蓄力时长（tick，20=1秒，40=2秒）
var CHARGE_SEGMENTS = 16;               // ActionBar ◆ 格数
var CHARGE_BAR_EMPTY = "§8·";           // 进度为 0 时占位
var CHARGE_BAR_COLOR_CHARGING = "§0";   // 未满颜色（黑）
var CHARGE_BAR_COLOR_FULL = "§d";       // 满条颜色（紫）
var CHARGE_RELEASE_CD_MS = 100;         // 释放后短冷却，防连触发（毫秒）
var CHARGE_START_SOUND = "block.note_block.hat"; // 开始蓄力音效
var CHARGE_START_SOUND_VOL = 0.5;       // 开始蓄力音量
var CHARGE_START_SOUND_PITCH = 1.2;     // 开始蓄力音调
var CHARGE_FULL_SOUND = "block.note_block.chime"; // 蓄满/释放音效
var CHARGE_FULL_SOUND_VOL = 0.8;        // 蓄满音量
var CHARGE_FULL_SOUND_PITCH = 1.6;      // 蓄满音调
var CHARGE_RELEASE_SPLASH_SOUND = "entity.splash_potion.break"; // 蓄力完成召唤祝灵时播放
var CHARGE_RELEASE_SPLASH_VOL = 1.0;
var CHARGE_RELEASE_SPLASH_PITCH = 1.0;

// -------------------------------------------------------------------
// 3. 蓄力开场特效（樱花球 + 脚下紫爆）
// -------------------------------------------------------------------
var CHARGE_FX_CHERRY_RADIUS = 14.0;     // 樱花随机散布半径（格）
var CHARGE_FX_CHERRY_COUNT = 150;       // 樱花采样点数
var CHARGE_FX_CHERRY_PER_POINT = 2;     // 每个采样点粒子数
var CHARGE_FX_OFFSET_X = 0.1;           // 每个点 X 随机偏移半幅（±此值）
var CHARGE_FX_OFFSET_Y = 0.4;           // 每个点 Y 随机偏移半幅（±此值）
var CHARGE_FX_CHERRY_SPREAD = 0.08;     // spawnCherry 的 dx/dy/dz
var CHARGE_FX_BURST_DELAY_TICKS = 5;    // 樱花后多久脚下爆发
var CHARGE_FX_BURST_Y = 0.15;           // 脚下爆发相对地面高度
var CHARGE_FX_SOUND_CHERRY_1 = "block.cherry_wood.place";   // 樱花主音效
var CHARGE_FX_SOUND_CHERRY_2 = "block.cherry_leaves.place"; // 樱花副音效
var CHARGE_FX_SOUND_BURST_1 = "entity.splash_potion.break"; // 脚下爆发音效1
var CHARGE_FX_SOUND_BURST_2 = "block.amethyst_block.break"; // 脚下爆发音效2

// -------------------------------------------------------------------
// 4. 祝灵（悦灵）
// -------------------------------------------------------------------
var ZHU_LING_MAX = 16;                   // 每玩家同时存在上限（仪式爆发可 bypass）
var ZHU_LING_LIFE_TICKS = 120;          // 存活时长（6秒）
var ZHU_LING_SPEED = 0.6;              // 每 tick 飞行距离
var ZHU_LING_HIT_RANGE = 1.4;          // 命中判定半径
var ZHU_LING_SEARCH_RANGE = 32;         // 寻敌半径
var ZHU_LING_SPAWN_ABOVE_HEAD = 1.0;    // 相对头顶再抬高（格）
var ZHU_LING_RESIST_TICKS = 130;        // 抗性持续（10秒）
var ZHU_LING_RESIST_LEVEL = 10;         // 抗性提升 amplifier（10=抗性XI）
var ZHU_LING_TRAIL_CHERRY = 1;          // 飞行尾迹樱花数
var ZHU_LING_TRAIL_DUST = 1;            // 飞行尾迹紫色尘数
var ZHU_LING_HIT_CHERRY = 16;           // 命中樱花数
var ZHU_LING_HIT_DUST = 16;             // 命中紫色尘数
var ZHU_LING_SPAWN_SOUND = "entity.allay.ambient_without_item"; // 生成音效
var ZHU_LING_HIT_SOUND = "entity.allay.hurt";                   // 命中音效
var ZHU_LING_HIT_BLAST_RADIUS = 1.4;    // 命中后爆炸半径（直径 3 米）
var ZHU_LING_HIT_BLAST_DAMAGE = 1.0;    // 命中爆炸伤害系数 × 异能强度
var ZHU_LING_PRIORITIZE_CHIMING = true; // 优先索敌已有斥命的目标

// -------------------------------------------------------------------
// 5. 斥命 Debuff
// -------------------------------------------------------------------
var CHIMING_DECAY_MS = 5000;            // 每多久减 1 层（获层会重置计时；满层不衰减）
var CHIMING_RING_MAX = 8;               // 斥命满层数（满层后祝灵不索敌、层数不减）
var CHIMING_DRAGON_STACKS = 8;          // 仪式时层数 ≥ 此值才出龙（满层即可）
var CHIMING_FULL_NO_TARGET = true;      // 满层敌人不再被祝灵索敌
var CHIMING_FULL_NO_DECAY = true;       // 满层敌人斥命不再随时间减少
var CHIMING_FULL_CAP_STACKS = true;     // 满层后不再叠加更高层数
var CHIMING_CLEAR_ON_UNEQUIP = true;    // 切换手持离开本武器时，只清空自己施加的斥命
var CHIMING_SLOW_TICKS = 120;           // 缓慢刷新时长
var CHIMING_RING_BASE = 0.4;            // 圆环基础半径加成
var CHIMING_RING_WIDTH_FACTOR = 0.6;    // 圆环随实体宽度系数
var CHIMING_RING_PER_STACK = 0.08;      // 每层圆环半径增加
var CHIMING_RING_POINTS_BASE = 12;      // 圆环基础点数
var CHIMING_FULL_CHERRY_1 = 100;        // 叠满大爆樱花（主层）
var CHIMING_FULL_CHERRY_2 = 50;         // 叠满大爆樱花（次层）
var CHIMING_FULL_DUST = 32;             // 叠满大爆紫色尘数量

// -------------------------------------------------------------------
// 6. 赐梦仪式（右键）
// -------------------------------------------------------------------
var RITUAL_RANGE = 32;                  // 作用距离（格）
var RITUAL_FOV_DEG = 120;               // 视野锥角度
var RITUAL_CD_MS = 800;                 // 右键防抖冷却
var RITUAL_SOUND_1 = "block.enchantment_table.use"; // 施法音效1
var RITUAL_SOUND_2 = "entity.evoker.prepare_attack"; // 施法音效2
var RITUAL_HIT_SOUND = "entity.generic.explode";     // 引爆命中音效

// -------------------------------------------------------------------
// 7. 宴死者之龙 — 生成与下落
// -------------------------------------------------------------------
var DRAGON_HEIGHT = 30;                 // 出生高度：目标头顶上方（格）
var DRAGON_FALL_PER_SEC = 30;           // 下落速度（格/秒）
var DRAGON_BIRTH_DELAY_TICKS = 20;      // 先播阵法再出龙的延迟
var DRAGON_YAW_OFFSET = 180.0;          // 模型朝向修正（头朝下常用 +180）
var DRAGON_PITCH = 90.0;                // 俯视俯仰角
var DRAGON_LAND_Y_SLOP = 0.1;          // 落地高度容差
var DRAGON_VELOCITY_MIN_DOWN = -0.5;    // 传送纠偏时最小向下速度
var DRAGON_GROWL_SOUND = "entity.ender_dragon.growl"; // 诞生咆哮音效
var DRAGON_GROWL_SOUND_ALT = "entity.ender_dragon.ambient"; // 备用龙吼（部分客户端 growl 更难听见）
var DRAGON_GROWL_VOL = 2.5;             // 咆哮音量（偏大，避免距离衰减听不见）
var DRAGON_GROWL_PITCH = 1.1;           // 咆哮音调
var DRAGON_GROWL_EXTRA_FOR_OWNER = true; // 额外在召唤者耳边再播一次龙吼
var DRAGON_BLAST_EXTRA_FOR_OWNER = true; // 爆炸时额外为召唤者再播一次爆炸声
var DRAGON_BLAST_ANCHOR_BREAK_SOUND = "block.respawn_anchor.deplete"; // 每次爆炸额外为玩家播重生锚破碎
var DRAGON_BLAST_ANCHOR_BREAK_VOL = 1.2;   // 破碎音音量
var DRAGON_BLAST_ANCHOR_BREAK_PITCH = 0.85; // 破碎音音调
var DRAGON_LAND_ON_GROUND = true;       // 落到地面高度，而非碰到生物即消失
var DRAGON_LAND_FX_LIFT = 0.3;          // 落地特效相对地面抬高（避免埋进方块）
var DRAGON_MUTE_RANGE = 64;             // 静默音效影响玩家距离
var DRAGON_MUTE_RETRY_TICKS = [1, 5];   // 移除后再清音效的延迟

// -------------------------------------------------------------------
// 8. 龙 — 阵法与落地爆炸
// -------------------------------------------------------------------
var DRAGON_CIRCLE_RADIUS = 12;           // 诞生/命中阵法半径
var DRAGON_LAND_CIRCLE_RADIUS = 16;     // 落地额外法阵半径
var DRAGON_AOE_RADIUS = 10;             // 兼容旧名：爆炸伤害半径
var DRAGON_BLAST_COUNT = 3;             // 爆炸次数
var DRAGON_BLAST_INTERVAL = 15;         // 爆炸间隔（tick，10=0.5秒）
var DRAGON_BLAST_OFFSET = 1;            // 爆炸中心随机水平偏移范围
var DRAGON_BLAST_Y = 3;               // 爆炸相对落地特效中心的高度
var DRAGON_BLAST_ONLY_FIRST_DAMAGES = true; // 仅第一次爆炸有伤害
var DRAGON_BLAST_PITCHES = [1.0, 0.8, 0.6]; // 三次爆炸音调（依次降低）
// 爆炸粒子（更密、更大 + 中心紫球）
var DRAGON_BLAST_CHERRY_COUNT = 160;    // 外圈樱花数量
var DRAGON_BLAST_CHERRY_SPREAD = 7.5;   // 外圈樱花水平散布
var DRAGON_BLAST_CHERRY_Y = 2.8;        // 外圈樱花垂直散布
var DRAGON_BLAST_DUST_BIG = 160;        // 大型紫尘数量
var DRAGON_BLAST_DUST_BIG_SPREAD = 7.0; // 大型紫尘散布
var DRAGON_BLAST_DUST = 120;            // 普通紫尘数量
var DRAGON_BLAST_DUST_SPREAD = 6.0;     // 普通紫尘散布
var DRAGON_BLAST_EXPLOSION_COUNT = 8;   // 原版爆炸粒子数
var DRAGON_BLAST_EXPLOSION_SPREAD = 3.5;// 原版爆炸粒子散布
var DRAGON_BLAST_SPHERE_POINTS = 64;    // 飞散射线数量
var DRAGON_BLAST_SPHERE_RADIUS = 16;   // 紫球最终扩散半径（格）
var DRAGON_BLAST_SPHERE_PER_POINT = 3;  // 每条射线每帧紫尘数
var DRAGON_BLAST_SPHERE_UP_BIAS = 0.3; // 飞散偏上（0=全球，1=仅上半球）
var DRAGON_BLAST_SPHERE_BURST_TICKS = 10;   // 向外扩散动画帧数（DUST 无速度，靠逐帧位移）
var DRAGON_BLAST_SPHERE_BURST_PERIOD = 1;   // 动画帧间隔 tick
var DRAGON_BLAST_SPHERE_TRAIL_STEPS = 2;    // 每帧在轨迹上补点，增强「在飞」感
// -------------------------------------------------------------------
// 9. 额外召唤祝灵（龙落地后 / 斥命未引爆即死亡 / 死亡被动）
//     散开距离、高度差统一用本区；召唤位置均为玩家头顶附近
// -------------------------------------------------------------------
var DRAGON_POST_ZHU_LING_COUNT = 4;     // 第三次爆炸后生成数量
var DRAGON_POST_ZHU_LING_DELAY = 3;     // 相对第三次爆炸后再延迟 tick
var DRAGON_POST_ZHU_LING_SPREAD = 3;    // 玩家头顶周围散开距离（格）
var DRAGON_POST_ZHU_LING_Y_STEP = 0.5;  // 彼此微调高度差，避免重叠
var CHIMING_DEATH_ZHU_LING_ENABLED = true; // 带斥命未引爆就死亡时，按层数召唤祝灵
var CHIMING_DEATH_BYPASS_MAX = true;       // 斥命死亡召唤是否突破祝灵同时上限
var CHIMING_DEATH_SKIP_PASSIVE = true;     // 触发斥命死亡召唤时不再额外「死亡被动+1」

// -------------------------------------------------------------------
// 10. 被动：视野内死亡召唤祝灵
// -------------------------------------------------------------------
var DEATH_PASSIVE_ENABLED = true;       // 是否启用死亡被动（无斥命时 +1 祝灵）
var DEATH_PASSIVE_RANGE = 32;           // 被动触发距离（格）
var DEATH_PASSIVE_FOV_DEG = 120;        // 被动视野锥角度
// 生成位置/散开：统一使用第 9 区 DRAGON_POST_ZHU_LING_SPREAD / Y_STEP（在玩家处）

// -------------------------------------------------------------------
// 11. 任务周期（tick）
// -------------------------------------------------------------------
var TASK_CHARGE_PERIOD = 1;             // 蓄力条刷新周期
var TASK_CHIMING_DECAY_PERIOD = 20;     // 斥命衰减检查周期
var TASK_RING_PERIOD = 5;               // 斥命环重绘周期

// -------------------------------------------------------------------
// 12. 台词（支持 &#RRGGBB 渐变，运行时转 §x）
// -------------------------------------------------------------------
var MSG_CHIMING_FULL = "&#ff0099我&#fc0ea4将&#fa1cae剥&#f729b9夺&#f537c4你&#f245cf曾&#f053d9拥&#ed61e4有&#eb6eef过&#e87cfa的&#e77cfe所&#e76efc有&#e661f9苦&#e653f7痛&#e645f5与&#e537f2欢&#e529f0欣&#e51cee.&#e40eeb.&#e400e9."; // 斥命叠满台词
var MSG_DRAGON_LINE1 = "      &#e400e9.&#e40deb.&#e51aed.&#e527f0愿&#e534f2你&#e642f4破&#e64ff6碎&#e65cf8的&#e669fb灵&#e776fd魂&#e783ff与&#e976f5过&#ec69eb往&#ee5ce0能与&#f14fd6所&#f342cc爱&#f534c2之&#f827b8人&#fa1aad重&#fd0da3逢&#ff0099。"; // 召唤龙台词1
var MSG_DRAGON_LINE2 = "&#ff00e6[ &#ff0de7九&#ff1ae9环&#ff27ea固&#ff34eb化&#ff42ed废&#ff4fee墟&#ff5cef术&#ff69f0式 &#ff76f2· &#ff83f3赐&#ff76e5如&#ff69d8绸&#ff5cca纱&#ff4fbd迸&#ff42af裂&#ff34a1般&#ff2794的&#ff1a86永&#ff0d79梦 &#ff006b]"; // 召唤龙台词2
var MSG_ZHU_LING_CAP = "§7祝灵已达上限 §f";           // 祝灵上限提示前缀
var MSG_RITUAL_OK_PREFIX = "§d赐梦仪式 §f引爆 §c";   // 仪式成功前缀
var MSG_RITUAL_OK_MID = " §f个目标";                 // 仪式成功中段
var MSG_RITUAL_DRAGON_SUFFIX = " §5龙×";             // 仪式出龙后缀
var MSG_RITUAL_NONE = "§7视野内没有可引爆的斥命";     // 仪式无目标提示

// -------------------------------------------------------------------
// 13. 粒子颜色（RGB + 大小）
// -------------------------------------------------------------------
var COLOR_PURPLE = [170, 60, 255];      // 普通紫尘 RGB
var COLOR_PURPLE_BIG = [150, 40, 230];  // 大型紫尘 RGB
var COLOR_LIGHT_PURPLE = [220, 170, 255]; // 浅紫尘 RGB
var SIZE_PURPLE = 1.4;                  // 普通紫尘大小
var SIZE_PURPLE_BIG = 2.4;              // 大型紫尘大小
var SIZE_LIGHT_PURPLE = 1.3;            // 浅紫尘大小
// 斥命环 1~8 层：浅紫 → 深紫 → 大红  [r, g, b, size]
var RING_COLOR_RGB = [
    [230, 200, 255, 1.35], // 1层
    [210, 160, 255, 1.35], // 2层
    [190, 120, 245, 1.4],  // 3层
    [170, 80, 235, 1.4],   // 4层
    [150, 50, 210, 1.45],  // 5层
    [175, 35, 160, 1.45],  // 6层
    [210, 25, 90, 1.5],    // 7层
    [230, 20, 40, 1.55]    // 8层
];

// ===================================================================
// 【配置区结束】以下为运行时初始化，一般无需改
// ===================================================================

var LEFT_RELEASE_CD_MS = CHARGE_RELEASE_CD_MS; // 兼容旧变量名

var SLOWNESS = PotionEffectType.getByName("SLOWNESS");
var RESISTANCE = PotionEffectType.getByName("RESISTANCE");
if (RESISTANCE == null) {
    try { RESISTANCE = PotionEffectType.getByName("DAMAGE_RESISTANCE"); } catch (e) {}
}

var EXPLOSION_PARTICLE = (function () {
    try { return Particle.valueOf("EXPLOSION"); } catch (e) {}
    try { return Particle.valueOf("EXPLOSION_LARGE"); } catch (e2) {}
    try { return Particle.valueOf("EXPLOSION_EMITTER"); } catch (e3) {}
    return null;
})();

var CHERRY = (function () {
    try { return Particle.valueOf("CHERRY_LEAVES"); } catch (e) {}
    try { return Particle.valueOf("FALLING_SPORE_BLOSSOM"); } catch (e2) {}
    return Particle.CLOUD;
})();

var PURPLE_DUST = new DustOptions(Color.fromRGB(COLOR_PURPLE[0], COLOR_PURPLE[1], COLOR_PURPLE[2]), SIZE_PURPLE);
var PURPLE_BIG = new DustOptions(Color.fromRGB(COLOR_PURPLE_BIG[0], COLOR_PURPLE_BIG[1], COLOR_PURPLE_BIG[2]), SIZE_PURPLE_BIG);
var LIGHT_PURPLE = new DustOptions(Color.fromRGB(COLOR_LIGHT_PURPLE[0], COLOR_LIGHT_PURPLE[1], COLOR_LIGHT_PURPLE[2]), SIZE_LIGHT_PURPLE);

var RING_COLORS = [];
for (var __ri = 0; __ri < RING_COLOR_RGB.length; __ri++) {
    var __rc = RING_COLOR_RGB[__ri];
    RING_COLORS.push(new DustOptions(Color.fromRGB(__rc[0], __rc[1], __rc[2]), __rc[3]));
}

// === 状态 ===
var chargeProgressMap = new java.util.HashMap(); // uuid -> ticks（>0 表示正在蓄力）
var chargeFullMap = new java.util.HashMap();     // uuid -> boolean
var leftReleaseCdMap = new java.util.HashMap();  // uuid -> ms
// chimingMap: entityUuid -> { byOwner: { ownerUuid: {stacks, lastGain} }, maxBurst }
var chimingMap = new java.util.HashMap();
var zhuLingCountMap = new java.util.HashMap();   // playerUuid -> count
var ritualCdMap = new java.util.HashMap();       // uuid -> ms
var holdingTrackMap = new java.util.HashMap();   // playerUuid -> 上一tick是否手持本武器

function isHoldingItem(player) {
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(item);
    return sfItem != null && sfItem.getId() === ITEM_ID;
}

function getAbilityPower() {
    try {
        return getAddonConfig().getInt(ABILITY_POWER_CONFIG_KEY, ABILITY_POWER_DEFAULT);
    } catch (e) {
        return ABILITY_POWER_DEFAULT;
    }
}

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

/** 仅对指定玩家播放音效（不影响他人） */
function playSoundForPlayer(player, loc, sound, vol, pitch) {
    if (player == null || !player.isOnline() || sound == null) return;
    try {
        var at = loc != null ? loc : player.getLocation();
        player.playSound(at, sound, vol, pitch);
    } catch (e) {}
}

/**
 * 播放龙吼：在落地目标附近播一次世界音，并在召唤者耳边再播一次（避免 30 格高空衰减听不见）。
 */
function playDragonGrowl(owner, hearLoc) {
    var vol = DRAGON_GROWL_VOL;
    var pitch = DRAGON_GROWL_PITCH;
    if (hearLoc != null) {
        try { hearLoc.getWorld().playSound(hearLoc, DRAGON_GROWL_SOUND, vol, pitch); } catch (e0) {}
        try { hearLoc.getWorld().playSound(hearLoc, DRAGON_GROWL_SOUND_ALT, vol * 0.85, pitch); } catch (e1) {}
    }
    if (DRAGON_GROWL_EXTRA_FOR_OWNER && owner != null && owner.isOnline()) {
        // 耳边播放：用玩家自身坐标，不受高空距离衰减影响
        var ear = owner.getLocation();
        playSoundForPlayer(owner, ear, DRAGON_GROWL_SOUND, vol, pitch);
        playSoundForPlayer(owner, ear, DRAGON_GROWL_SOUND_ALT, vol * 0.85, pitch);
    }
}

/**
 * 获取地面表面高度（龙最终落地用）。
 * getHighestBlockYAt 返回的是方块 Y，表面在 +1。
 */
function getGroundY(world, x, z, fallbackY) {
    try {
        var blockY = world.getHighestBlockYAt(Math.floor(x), Math.floor(z));
        if (blockY <= world.getMinHeight()) return fallbackY;
        return blockY + 1.0;
    } catch (e) {
        return fallbackY;
    }
}

function playZhuLingHitBlast(world, loc, owner) {
    var radius = ZHU_LING_HIT_BLAST_RADIUS;
    var dmg = ZHU_LING_HIT_BLAST_DAMAGE * getAbilityPower();
    spawnCherry(world, loc, 35, radius * 0.9, radius * 0.5, radius * 0.9, 0.04);
    spawnDust(world, loc, 45, radius * 0.85, radius * 0.45, radius * 0.85, 0.02, PURPLE_BIG);
    spawnDust(world, loc, 25, radius * 0.7, radius * 0.35, radius * 0.7, 0.03, PURPLE_DUST);
    if (EXPLOSION_PARTICLE != null) {
        try { world.spawnParticle(EXPLOSION_PARTICLE, loc, 2, radius * 0.4, radius * 0.25, radius * 0.4, 0); } catch (e) {}
    }
    world.playSound(loc, "entity.generic.explode", 0.9, 1.35);
    world.playSound(loc, "entity.splash_potion.break", 0.7, 1.1);
    aoeDamage(world, loc, owner, radius, dmg);
}

function spawnDust(world, loc, count, dx, dy, dz, speed, dust) {
    try {
        world.spawnParticle(Particle.DUST, loc, count, dx, dy, dz, speed, dust);
    } catch (e) {}
}

function spawnCherry(world, loc, count, dx, dy, dz, speed) {
    try {
        world.spawnParticle(CHERRY, loc, count, dx, dy, dz, speed);
    } catch (e) {}
}

/** 预生成紫球飞散方向（单位向量） */
function buildSphereBurstDirections(count, upBias) {
    var dirs = [];
    if (upBias < 0) upBias = 0;
    if (upBias > 1) upBias = 1;
    for (var i = 0; i < count; i++) {
        var theta = Math.random() * Math.PI * 2;
        var cosPhi = (2 * Math.random() - 1) * (1 - upBias) + upBias;
        if (cosPhi > 1) cosPhi = 1;
        if (cosPhi < -1) cosPhi = -1;
        var phi = Math.acos(cosPhi);
        var dx = Math.sin(phi) * Math.cos(theta);
        var dy = Math.cos(phi);
        var dz = Math.sin(phi) * Math.sin(theta);
        dirs.push({ dx: dx, dy: dy, dz: dz, dust: i % 3 });
    }
    return dirs;
}

/**
 * 紫球爆炸：DUST 粒子不支持速度向量，改为逐 tick 沿射线向外位移生成，
 * 视觉上呈现紫色粒子从中心向外飞散。
 */
function playSphereBurstDispersal(world, center) {
    var core = center.clone();
    var cx = core.getX();
    var cy = core.getY();
    var cz = core.getZ();
    var dirs = buildSphereBurstDirections(DRAGON_BLAST_SPHERE_POINTS, DRAGON_BLAST_SPHERE_UP_BIAS);
    var maxR = DRAGON_BLAST_SPHERE_RADIUS;
    var totalTicks = Math.max(4, DRAGON_BLAST_SPHERE_BURST_TICKS);
    var period = Math.max(1, DRAGON_BLAST_SPHERE_BURST_PERIOD);
    var trailSteps = Math.max(0, DRAGON_BLAST_SPHERE_TRAIL_STEPS);

    spawnDust(world, core, 28, 0.28, 0.28, 0.28, 0.14, PURPLE_BIG);
    spawnDust(world, core, 18, 0.16, 0.16, 0.16, 0.2, LIGHT_PURPLE);

    var tick = 0;
    var taskRef = null;
    var BurstTask = Java.extend(BukkitRunnable, {
        run: function () {
            tick++;
            var t = tick / totalTicks;
            // easeOutCubic：先快后慢，像冲击波扩散
            var eased = 1 - Math.pow(1 - t, 3);
            var radius = maxR * eased;
            var prevT = Math.max(0, (tick - 1) / totalTicks);
            var prevEased = 1 - Math.pow(1 - prevT, 3);
            var prevRadius = maxR * prevEased;

            for (var i = 0; i < dirs.length; i++) {
                var d = dirs[i];
                var dust = d.dust === 0 ? PURPLE_BIG : (d.dust === 1 ? PURPLE_DUST : LIGHT_PURPLE);

                var px = cx + d.dx * radius;
                var py = cy + d.dy * radius;
                var pz = cz + d.dz * radius;
                var front = new Location(world, px, py, pz);
                spawnDust(world, front, DRAGON_BLAST_SPHERE_PER_POINT, 0.05, 0.05, 0.05, 0, dust);

                for (var s = 1; s <= trailSteps; s++) {
                    var st = s / (trailSteps + 1);
                    var rTrail = prevRadius + (radius - prevRadius) * st;
                    var tp = new Location(world, cx + d.dx * rTrail, cy + d.dy * rTrail, cz + d.dz * rTrail);
                    spawnDust(world, tp, 1, 0.03, 0.03, 0.03, 0, dust);
                }

                if (i % 10 === 0 && tick % 2 === 0) {
                    spawnCherry(world, front, 1, 0.04, 0.04, 0.04, 0.01);
                }
            }

            if (tick >= totalTicks) {
                try { taskRef.cancel(); } catch (e) {}
            }
        }
    });
    taskRef = new BurstTask().runTaskTimer(plugin, 0, period);
}

/** &#RRGGBB → §x§R§R§G§G§B§B */
function colorize(str) {
    return String(str).replace(/&#([0-9a-fA-F]{6})/g, function (m, hex) {
        hex = hex.toLowerCase();
        var out = "§x";
        for (var i = 0; i < 6; i++) out += "§" + hex.charAt(i);
        return out;
    });
}

function sendColored(player, msg) {
    if (player == null) return;
    try { player.sendMessage(colorize(msg)); } catch (e) {}
}

function inPlayerView(player, loc, range, fovDeg) {
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();
    var to = loc.toVector().subtract(eye.toVector());
    var dist = to.length();
    if (dist < 0.2 || dist > range) return false;
    var halfCos = Math.cos((fovDeg / 2) * Math.PI / 180);
    return dir.dot(to.normalize()) >= halfCos;
}

function findNearestTarget(fromLoc, owner, range) {
    var world = fromLoc.getWorld();
    var bestAny = null;
    var bestAnyDist = range;
    var bestChiming = null;
    var bestChimingDist = range;
    var list = world.getNearbyEntities(fromLoc, range, range, range);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (owner != null && ent.getUniqueId().equals(owner.getUniqueId())) continue;
        if (ent.hasMetadata(META_ZHU_LING) || ent.hasMetadata(META_DRAGON)) continue;
        if (ent.getType() === EntityType.ARMOR_STAND) continue;
        var stacks = getChimingStacks(ent);
        // 层数已满：祝灵不再索敌
        if (CHIMING_FULL_NO_TARGET && stacks >= CHIMING_RING_MAX) continue;
        var d = ent.getLocation().distance(fromLoc);
        if (d > range) continue;
        if (d < bestAnyDist) {
            bestAnyDist = d;
            bestAny = ent;
        }
        if (ZHU_LING_PRIORITIZE_CHIMING && stacks > 0 && d < bestChimingDist) {
            bestChimingDist = d;
            bestChiming = ent;
        }
    }
    // 有斥命目标时优先；否则退回最近任意目标
    return bestChiming != null ? bestChiming : bestAny;
}

// ===================================================================
// 蓄力条：◆ 逐渐增加；未满黑色，满条紫色
// ===================================================================
function buildChargeBar(progress, full) {
    var filled = Math.floor((progress / CHARGE_TICKS) * CHARGE_SEGMENTS);
    if (filled > CHARGE_SEGMENTS) filled = CHARGE_SEGMENTS;
    var color = full ? CHARGE_BAR_COLOR_FULL : CHARGE_BAR_COLOR_CHARGING;
    var bar = color;
    for (var i = 0; i < filled; i++) bar += "◆";
    return bar.length > color.length ? bar : CHARGE_BAR_EMPTY;
}

function resetCharge(uuid) {
    chargeProgressMap.put(uuid, 0);
    chargeFullMap.put(uuid, false);
}

function onLeftClickCharge(player) {
    var uuid = player.getUniqueId().toString();
    // 已在蓄力中：忽略重复左键
    if (chargeProgressMap.containsKey(uuid) && chargeProgressMap.get(uuid) > 0) return;
    // 左键进入蓄力，满后由 tick 自动释放
    chargeProgressMap.put(uuid, 1);
    chargeFullMap.put(uuid, false);
    player.sendActionBar(buildChargeBar(1, false));
    player.getWorld().playSound(player.getLocation(), CHARGE_START_SOUND, CHARGE_START_SOUND_VOL, CHARGE_START_SOUND_PITCH);
    playChargeStartFx(player);
}

/** 蓄力开场：半径内随机樱花 → 成功后脚下紫色爆发 */
function playChargeStartFx(player) {
    var world = player.getWorld();
    var feet = player.getLocation().clone();
    var center = player.getLocation().clone().add(0, player.getHeight() * 0.5, 0);
    var radius = CHARGE_FX_CHERRY_RADIUS;
    var count = CHARGE_FX_CHERRY_COUNT;
    var ox = CHARGE_FX_OFFSET_X * 2;
    var oy = CHARGE_FX_OFFSET_Y * 2;

    for (var i = 0; i < count; i++) {
        var theta = Math.random() * Math.PI * 2;
        var phi = Math.acos(2 * Math.random() - 1);
        var r = radius * Math.cbrt(Math.random());
        var p = new Location(
            world,
            center.getX() + r * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * ox,
            center.getY() + r * Math.cos(phi) + (Math.random() - 0.5) * oy,
            center.getZ() + r * Math.sin(phi) * Math.sin(theta)
        );
        spawnCherry(world, p, CHARGE_FX_CHERRY_PER_POINT, CHARGE_FX_CHERRY_SPREAD, CHARGE_FX_CHERRY_SPREAD, CHARGE_FX_CHERRY_SPREAD, 0.0);
    }
    world.playSound(center, CHARGE_FX_SOUND_CHERRY_1, 1.0, 1.25);
    try { world.playSound(center, CHARGE_FX_SOUND_CHERRY_2, 0.9, 1.05); } catch (e0) {}

    var burstFeet = feet.clone().add(0, CHARGE_FX_BURST_Y, 0);
    var BurstTask = Java.extend(BukkitRunnable, {
        run: function () {
            try {
                spawnDust(world, burstFeet, 55, 1.1, 0.35, 1.1, 0.08, PURPLE_BIG);
                spawnDust(world, burstFeet, 40, 0.9, 0.25, 0.9, 0.12, PURPLE_DUST);
                spawnDust(world, burstFeet, 25, 0.7, 0.45, 0.7, 0.05, LIGHT_PURPLE);
                if (EXPLOSION_PARTICLE != null) {
                    try { world.spawnParticle(EXPLOSION_PARTICLE, burstFeet, 2, 0.35, 0.15, 0.35, 0); } catch (e1) {}
                }
                world.spawnParticle(Particle.CLOUD, burstFeet, 18, 0.7, 0.2, 0.7, 0.04);
                world.playSound(burstFeet, CHARGE_FX_SOUND_BURST_1, 0.85, 1.25);
                world.playSound(burstFeet, CHARGE_FX_SOUND_BURST_2, 0.9, 0.7);
            } catch (ex) {}
        }
    });
    new BurstTask().runTaskLater(plugin, CHARGE_FX_BURST_DELAY_TICKS);
}

function autoReleaseZhuLing(player) {
    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (leftReleaseCdMap.containsKey(uuid) && (now - leftReleaseCdMap.get(uuid)) < LEFT_RELEASE_CD_MS) {
        resetCharge(uuid);
        return;
    }
    leftReleaseCdMap.put(uuid, now);
    resetCharge(uuid);
    player.sendActionBar(CHARGE_BAR_COLOR_FULL + "◆◆◆◆◆◆◆◆◆◆");
    player.getWorld().playSound(player.getLocation(), CHARGE_FULL_SOUND, CHARGE_FULL_SOUND_VOL, CHARGE_FULL_SOUND_PITCH);
    playSoundForPlayer(player, player.getLocation(), CHARGE_RELEASE_SPLASH_SOUND, CHARGE_RELEASE_SPLASH_VOL, CHARGE_RELEASE_SPLASH_PITCH);
    var spawnAt = player.getLocation().clone().add(0, player.getHeight() + ZHU_LING_SPAWN_ABOVE_HEAD, 0);
    summonZhuLing(player, spawnAt, player, false);
}

function tickChargeBars() {
    var online = Bukkit.getOnlinePlayers().iterator();
    while (online.hasNext()) {
        var player = online.next();
        var uuid = player.getUniqueId().toString();
        var holding = isHoldingItem(player);
        var wasHolding = holdingTrackMap.containsKey(uuid) ? holdingTrackMap.get(uuid) === true : false;

        // 从手持本武器切换到其他物品：清空自己施加的斥命
        if (wasHolding && !holding) {
            onPlayerUnequipWeapon(player);
            if (chargeProgressMap.containsKey(uuid) && chargeProgressMap.get(uuid) > 0) {
                resetCharge(uuid);
                player.sendActionBar(" ");
            }
        }
        holdingTrackMap.put(uuid, holding);

        if (!holding) {
            if (chargeProgressMap.containsKey(uuid) && chargeProgressMap.get(uuid) > 0) {
                resetCharge(uuid);
                player.sendActionBar(" ");
            }
            continue;
        }
        var progress = chargeProgressMap.containsKey(uuid) ? chargeProgressMap.get(uuid) : 0;
        if (progress <= 0) continue;

        progress++;
        if (progress >= CHARGE_TICKS) {
            autoReleaseZhuLing(player);
        } else {
            chargeProgressMap.put(uuid, progress);
            player.sendActionBar(buildChargeBar(progress, false));
        }
    }
}

// ===================================================================
// 斥命（按施加者分别记账）
// ===================================================================
function sumChimingData(data) {
    if (data == null) return 0;
    // 兼容旧结构
    if (typeof data.stacks === "number" && !data.byOwner) return data.stacks;
    var total = 0;
    if (!data.byOwner) return 0;
    for (var oid in data.byOwner) {
        if (!data.byOwner.hasOwnProperty(oid)) continue;
        total += data.byOwner[oid].stacks;
    }
    return total;
}

function getChimingStacks(entity) {
    var id = entity.getUniqueId().toString();
    if (!chimingMap.containsKey(id)) return 0;
    return sumChimingData(chimingMap.get(id));
}

function ensureChimingData(id) {
    if (!chimingMap.containsKey(id)) {
        chimingMap.put(id, { byOwner: {}, maxBurst: false });
    }
    var data = chimingMap.get(id);
    if (!data.byOwner) {
        data.byOwner = {};
        if (typeof data.stacks === "number" && data.stacks > 0) {
            // 旧数据无来源，放入占位键，切换物品不会误清
            data.byOwner["__legacy__"] = { stacks: data.stacks, lastGain: data.lastGain || Date.now() };
        }
        delete data.stacks;
        delete data.lastGain;
    }
    return data;
}

function refreshChimingEntity(entityId, data) {
    var total = sumChimingData(data);
    if (total < CHIMING_RING_MAX) data.maxBurst = false;
    if (total <= 0) {
        chimingMap.remove(entityId);
        return;
    }
    chimingMap.put(entityId, data);
    var ent = Bukkit.getEntity(UUID.fromString(entityId));
    if (ent != null && !ent.isDead() && ent instanceof LivingEntity) {
        applyChimingSlow(ent, total);
    }
}

function addChiming(entity, amount, viewer) {
    if (!(entity instanceof LivingEntity) || entity.isDead()) return;
    if (viewer == null) return;
    var ownerId = viewer.getUniqueId().toString();
    var id = entity.getUniqueId().toString();
    var now = Date.now();
    var data = ensureChimingData(id);
    var before = sumChimingData(data);
    if (CHIMING_FULL_CAP_STACKS && before >= CHIMING_RING_MAX) return;

    var entry = data.byOwner[ownerId];
    if (!entry) entry = { stacks: 0, lastGain: now };
    entry.stacks = entry.stacks + amount;
    entry.lastGain = now;
    data.byOwner[ownerId] = entry;

    var after = sumChimingData(data);
    if (CHIMING_FULL_CAP_STACKS && after > CHIMING_RING_MAX) {
        // 超出部分从本次施加者扣回
        var overflow = after - CHIMING_RING_MAX;
        entry.stacks = Math.max(0, entry.stacks - overflow);
        data.byOwner[ownerId] = entry;
        after = CHIMING_RING_MAX;
    }
    if (after < CHIMING_RING_MAX) data.maxBurst = false;
    chimingMap.put(id, data);
    applyChimingSlow(entity, after);

    if (before < CHIMING_RING_MAX && after >= CHIMING_RING_MAX && !data.maxBurst) {
        data.maxBurst = true;
        chimingMap.put(id, data);
        playChimingFullFx(entity, viewer);
    }
}

function playChimingFullFx(entity, viewer) {
    var world = entity.getWorld();
    var loc = entity.getLocation().add(0, entity.getHeight() * 0.5, 0);
    spawnCherry(world, loc, CHIMING_FULL_CHERRY_1, 2.8, 1.6, 2.8, 0.08);
    spawnCherry(world, loc, CHIMING_FULL_CHERRY_2, 1.8, 1.0, 1.8, 0.04);
    spawnDust(world, loc, CHIMING_FULL_DUST, 2.0, 1.2, 2.0, 0, PURPLE_BIG);
    world.playSound(loc, "entity.generic.explode", 1.0, 1.5);
    world.playSound(loc, "block.cherry_wood.break", 1.1, 0.8);
    if (viewer != null) sendColored(viewer, MSG_CHIMING_FULL);
}

function clearChiming(entity) {
    var id = entity.getUniqueId().toString();
    chimingMap.remove(id);
}

/** 清空某玩家施加在所有敌人上的斥命层数（切换手持时用） */
function clearChimingOwnedBy(ownerUuid) {
    if (ownerUuid == null) return;
    var it = chimingMap.entrySet().iterator();
    while (it.hasNext()) {
        var entry = it.next();
        var data = entry.getValue();
        if (!data) { it.remove(); continue; }
        // 兼容旧结构：无 byOwner 则无法判定来源，跳过以免误清别人的
        if (!data.byOwner) continue;
        if (!data.byOwner[ownerUuid]) continue;
        delete data.byOwner[ownerUuid];
        var total = sumChimingData(data);
        if (total <= 0) {
            it.remove();
            continue;
        }
        if (total < CHIMING_RING_MAX) data.maxBurst = false;
        entry.setValue(data);
        var ent = Bukkit.getEntity(UUID.fromString(entry.getKey()));
        if (ent != null && !ent.isDead() && ent instanceof LivingEntity) {
            applyChimingSlow(ent, total);
        }
    }
}

function onPlayerUnequipWeapon(player) {
    if (!CHIMING_CLEAR_ON_UNEQUIP || player == null) return;
    try {
        clearChimingOwnedBy(player.getUniqueId().toString());
    } catch (e) {}
}

function applyChimingSlow(entity, stacks) {
    if (SLOWNESS == null || stacks <= 0) return;
    var amp = Math.max(0, stacks - 1);
    entity.addPotionEffect(new PotionEffect(SLOWNESS, CHIMING_SLOW_TICKS, amp, false, true, true));
}

function ringColorForStacks(stacks) {
    var idx = Math.min(CHIMING_RING_MAX, Math.max(1, stacks)) - 1;
    return RING_COLORS[idx];
}

function drawChimingRing(entity) {
    var stacks = getChimingStacks(entity);
    if (stacks <= 0) return;
    var world = entity.getWorld();
    var loc = entity.getLocation();
    var width = 1.0;
    try { width = Math.max(0.8, entity.getWidth()); } catch (e) {}
    var radius = width * CHIMING_RING_WIDTH_FACTOR + CHIMING_RING_BASE + Math.min(stacks, CHIMING_RING_MAX) * CHIMING_RING_PER_STACK;
    var y = loc.getY() + Math.max(0.45, entity.getHeight() * 0.55);
    var dust = ringColorForStacks(stacks);
    var points = CHIMING_RING_POINTS_BASE + Math.min(stacks, CHIMING_RING_MAX);
    for (var i = 0; i < points; i++) {
        var a = (2 * Math.PI * i) / points;
        var p = new Location(world, loc.getX() + Math.cos(a) * radius, y, loc.getZ() + Math.sin(a) * radius);
        spawnDust(world, p, 1, 0, 0, 0, 0, dust);
    }
}

function tickChimingDecay() {
    var now = Date.now();
    var it = chimingMap.entrySet().iterator();
    while (it.hasNext()) {
        var entry = it.next();
        var data = entry.getValue();
        if (data == null) { it.remove(); continue; }
        // 迁移旧结构
        if (!data.byOwner) {
            data = ensureChimingData(entry.getKey());
        }
        var total = sumChimingData(data);
        if (CHIMING_FULL_NO_DECAY && total >= CHIMING_RING_MAX) continue;

        var changed = false;
        for (var oid in data.byOwner) {
            if (!data.byOwner.hasOwnProperty(oid)) continue;
            var od = data.byOwner[oid];
            if (now - od.lastGain < CHIMING_DECAY_MS) continue;
            od.stacks = od.stacks - 1;
            od.lastGain = now;
            if (od.stacks <= 0) delete data.byOwner[oid];
            else data.byOwner[oid] = od;
            changed = true;
        }
        if (!changed) continue;

        total = sumChimingData(data);
        if (total < CHIMING_RING_MAX) data.maxBurst = false;
        if (total <= 0) {
            it.remove();
            continue;
        }
        entry.setValue(data);
        var ent = Bukkit.getEntity(UUID.fromString(entry.getKey()));
        if (ent == null || ent.isDead() || !(ent instanceof LivingEntity)) {
            it.remove();
            continue;
        }
        applyChimingSlow(ent, total);
    }
}

function onChimingDamaged(event) {
    try {
        if (event.isCancelled()) return;
        var entity = event.getEntity();
        if (!(entity instanceof LivingEntity) || entity.isDead()) return;
        if (entity.hasMetadata(META_CHIMING_EXTRA)) return;
        var stacks = getChimingStacks(entity);
        if (stacks <= 0) return;
        var extra = stacks * CHIMING_EXTRA_FACTOR * getAbilityPower();
        if (extra <= 0) return;
        entity.setMetadata(META_CHIMING_EXTRA, new FixedMetadataValue(plugin, true));
        try {
            entity.setNoDamageTicks(0);
            entity.damage(extra);
        } finally {
            try { entity.removeMetadata(META_CHIMING_EXTRA, plugin); } catch (e2) {}
        }
    } catch (e) {}
}

// ===================================================================
// 祝灵（悦灵）
// ===================================================================
function getZhuLingCount(playerUuid) {
    return zhuLingCountMap.containsKey(playerUuid) ? zhuLingCountMap.get(playerUuid) : 0;
}

function addZhuLingCount(playerUuid, delta) {
    var n = getZhuLingCount(playerUuid) + delta;
    if (n <= 0) zhuLingCountMap.remove(playerUuid);
    else zhuLingCountMap.put(playerUuid, n);
}

function summonZhuLing(owner, spawnLoc, preferNearEntity, bypassMax) {
    if (owner == null || !owner.isOnline()) return;
    var ownerId = owner.getUniqueId().toString();
    if (!bypassMax && getZhuLingCount(ownerId) >= ZHU_LING_MAX) {
        owner.sendActionBar(MSG_ZHU_LING_CAP + ZHU_LING_MAX);
        return;
    }
    var world = spawnLoc.getWorld();
    var allay = null;
    try {
        allay = world.spawnEntity(spawnLoc, EntityType.ALLAY);
    } catch (e) {
        plugin.getLogger().warning("[咀梦] 无法生成悦灵: " + e);
        return;
    }
    if (allay == null) return;

    try { allay.setAI(false); } catch (e1) {}
    try { allay.setGravity(false); } catch (e2) {}
    try { allay.setSilent(true); } catch (e3) {}
    try { allay.setInvulnerable(true); } catch (e4) {}
    try { allay.setCollidable(false); } catch (e5) {}
    try { allay.setRemoveWhenFarAway(true); } catch (e6) {}
    // 抗性提升 10，持续 10 秒
    if (RESISTANCE != null) {
        try {
            allay.addPotionEffect(new PotionEffect(RESISTANCE, ZHU_LING_RESIST_TICKS, ZHU_LING_RESIST_LEVEL, false, true, true));
        } catch (eR) {}
    }
    allay.setMetadata(META_ZHU_LING, new FixedMetadataValue(plugin, ownerId));
    addZhuLingCount(ownerId, 1);

    world.playSound(spawnLoc, ZHU_LING_SPAWN_SOUND, 0.9, 1.4);
    spawnCherry(world, spawnLoc, 12, 0.3, 0.3, 0.3, 0.01);
    spawnDust(world, spawnLoc, 8, 0.25, 0.25, 0.25, 0, LIGHT_PURPLE);

    var searchFrom = preferNearEntity != null ? preferNearEntity.getLocation() : spawnLoc;
    var target = findNearestTarget(searchFrom, owner, ZHU_LING_SEARCH_RANGE);
    var ticksAlive = 0;
    var hit = false;
    var taskRef = null;

    var FlyTask = Java.extend(BukkitRunnable, {
        run: function () {
            try {
                if (allay == null || allay.isDead() || !allay.isValid()) {
                    if (!hit) addZhuLingCount(ownerId, -1);
                    try { taskRef.cancel(); } catch (e) {}
                    return;
                }
                ticksAlive++;
                var loc = allay.getLocation();
                spawnCherry(world, loc, ZHU_LING_TRAIL_CHERRY, 0.08, 0.08, 0.08, 0.0);
                spawnDust(world, loc, ZHU_LING_TRAIL_DUST, 0.05, 0.05, 0.05, 0, LIGHT_PURPLE);

                if (target == null || target.isDead() || !target.isValid() ||
                    (CHIMING_FULL_NO_TARGET && getChimingStacks(target) >= CHIMING_RING_MAX)) {
                    target = findNearestTarget(loc, owner, ZHU_LING_SEARCH_RANGE);
                }

                if (target != null && !target.isDead()) {
                    var aim = target.getLocation().add(0, target.getHeight() * 0.5, 0);
                    var dir = aim.toVector().subtract(loc.toVector());
                    if (dir.lengthSquared() > 1e-6) {
                        dir.normalize().multiply(ZHU_LING_SPEED);
                        var next = loc.clone().add(dir);
                        next.setDirection(dir);
                        allay.teleport(next);
                    }
                    if (loc.distance(aim) <= ZHU_LING_HIT_RANGE) {
                        hit = true;
                        addChiming(target, 1, owner);
                        drawChimingRing(target);
                        playZhuLingHitBlast(world, aim, owner);
                        spawnCherry(world, aim, ZHU_LING_HIT_CHERRY, 0.4, 0.4, 0.4, 0.02);
                        spawnDust(world, aim, ZHU_LING_HIT_DUST, 0.35, 0.35, 0.35, 0, ringColorForStacks(getChimingStacks(target)));
                        world.playSound(aim, ZHU_LING_HIT_SOUND, 0.7, 1.8);
                        try { allay.remove(); } catch (eR) {}
                        addZhuLingCount(ownerId, -1);
                        try { taskRef.cancel(); } catch (eC) {}
                        return;
                    }
                }

                if (ticksAlive >= ZHU_LING_LIFE_TICKS) {
                    spawnCherry(world, loc, 10, 0.3, 0.3, 0.3, 0.01);
                    try { allay.remove(); } catch (eR2) {}
                    addZhuLingCount(ownerId, -1);
                    try { taskRef.cancel(); } catch (eC2) {}
                }
            } catch (ex) {
                try { if (allay != null) allay.remove(); } catch (e3) {}
                if (!hit) addZhuLingCount(ownerId, -1);
                try { taskRef.cancel(); } catch (e4) {}
            }
        }
    });
    taskRef = new FlyTask().runTaskTimer(plugin, 1, 1);
}

// ===================================================================
// 大型阵法粒子（直径 = radius*2；龙用直径 10 → radius 5）
// ===================================================================
function drawMagicCircle(world, center, radius, dust) {
    if (dust == null) dust = PURPLE_BIG;
    var y = center.getY() + 0.05;
    var rings = 4;
    for (var ring = 1; ring <= rings; ring++) {
        var r = radius * (ring / rings);
        var points = Math.max(24, Math.floor(18 + r * 14));
        for (var i = 0; i < points; i++) {
            var a = (2 * Math.PI * i) / points;
            var p = new Location(world, center.getX() + Math.cos(a) * r, y, center.getZ() + Math.sin(a) * r);
            spawnDust(world, p, 1, 0, 0, 0, 0, dust);
            if (i % 2 === 0) spawnCherry(world, p, 1, 0, 0, 0, 0);
        }
    }
    // 外圈加粗描边（直径边缘）
    var edgePoints = Math.max(48, Math.floor(radius * 20));
    for (var e = 0; e < edgePoints; e++) {
        var ea = (2 * Math.PI * e) / edgePoints;
        var ep = new Location(world,
            center.getX() + Math.cos(ea) * radius,
            y,
            center.getZ() + Math.sin(ea) * radius);
        spawnDust(world, ep, 1, 0, 0, 0, 0, PURPLE_DUST);
        spawnCherry(world, ep, 1, 0.02, 0.02, 0.02, 0);
    }
    // 放射线
    for (var s = 0; s < 12; s++) {
        var ang = (2 * Math.PI * s) / 12;
        for (var d = 0.4; d <= radius; d += 0.35) {
            var sp = new Location(world,
                center.getX() + Math.cos(ang) * d,
                y,
                center.getZ() + Math.sin(ang) * d);
            spawnDust(world, sp, 1, 0, 0, 0, 0, LIGHT_PURPLE);
        }
    }
    spawnCherry(world, center.clone().add(0, 0.25, 0), 50, radius * 0.35, 0.25, radius * 0.35, 0.01);
    spawnDust(world, center.clone().add(0, 0.35, 0), 40, radius * 0.3, 0.2, radius * 0.3, 0, dust);
}

/** 直径 10 米圆形阵法 */
function drawDragonCircle(world, center) {
    drawMagicCircle(world, center, DRAGON_CIRCLE_RADIUS, PURPLE_BIG);
    world.playSound(center, "block.beacon.activate", 1.15, 0.55);
    world.playSound(center, "block.enchantment_table.use", 1.0, 0.65);
}

function hideDragonBossBar(dragon) {
    try {
        var bar = dragon.getBossBar();
        if (bar == null) return;
        try { bar.setVisible(false); } catch (e0) {}
        var ps = new java.util.ArrayList(bar.getPlayers());
        for (var i = 0; i < ps.size(); i++) {
            try { bar.removePlayer(ps.get(i)); } catch (e1) {}
        }
    } catch (e) {}
}

function muteDragonSoundsNear(world, loc) {
    try {
        var list = world.getPlayers();
        for (var i = 0; i < list.size(); i++) {
            var p = list.get(i);
            if (p.getLocation().distanceSquared(loc) > DRAGON_MUTE_RANGE * DRAGON_MUTE_RANGE) continue;
            // 只清死亡/扑翅等恼人残留；不要 stop growl，否则会掐掉我们主动播的龙吼
            try { p.stopSound("entity.ender_dragon.death"); } catch (e1) {}
            try { p.stopSound("entity.ender_dragon.flap"); } catch (e4) {}
        }
    } catch (e) {}
}

/**
 * 静默移除真末影龙：不走死亡流程，避免死亡动画与死亡音效。
 * 使用 remove()（DISCARD）而非 setHealth(0)。
 */
function silentRemoveDragon(dragon, world, loc) {
    if (dragon == null) return;
    try { dragon.setSilent(true); } catch (e1) {}
    try { dragon.setInvisible(true); } catch (e2) {}
    try { dragon.setInvulnerable(true); } catch (e3) {}
    hideDragonBossBar(dragon);
    muteDragonSoundsNear(world, loc);
    try {
        dragon.remove();
    } catch (e4) {
        try {
            dragon.teleport(new Location(world, loc.getX(), world.getMinHeight() + 1, loc.getZ()));
            dragon.remove();
        } catch (e5) {}
    }
    // 再清一次残留音效（部分客户端会晚一拍播放）
    var MuteTask = Java.extend(BukkitRunnable, {
        run: function () {
            muteDragonSoundsNear(world, loc);
        }
    });
    new MuteTask().runTaskLater(plugin, DRAGON_MUTE_RETRY_TICKS[0]);
    new MuteTask().runTaskLater(plugin, DRAGON_MUTE_RETRY_TICKS[1]);
}

function setupFeastDragon(dragon) {
    // 保留 AI 但锁定 HOVER，避免完全关 AI 导致传送失效
    try {
        var EnderDragon = Java.type("org.bukkit.entity.EnderDragon");
        dragon.setPhase(EnderDragon.Phase.HOVER);
    } catch (e0) {}
    try { dragon.setGravity(false); } catch (e2) {}
    try { dragon.setSilent(true); } catch (e3) {}
    try { dragon.setInvulnerable(true); } catch (e4) {}
    try { dragon.setPersistent(false); } catch (e5) {}
    try { dragon.setRemoveWhenFarAway(true); } catch (e6) {}
    try { dragon.setCollidable(false); } catch (e7) {}
    try { dragon.setAware(false); } catch (e8) {}
    dragon.setMetadata(META_DRAGON, new FixedMetadataValue(plugin, true));
    hideDragonBossBar(dragon);
}

/** 强制龙位置 + 头朝下（yaw+180 / pitch=90，末影龙模型朝向修正） */
function forceDragonTransform(dragon, world, x, y, z, yaw) {
    var faceYaw = yaw + DRAGON_YAW_OFFSET;
    var loc = new Location(world, x, y, z, faceYaw, DRAGON_PITCH);
    var ok = false;
    try {
        ok = dragon.teleport(loc);
    } catch (e1) {
        try { dragon.teleport(loc); ok = true; } catch (e2) {}
    }
    try { dragon.setRotation(faceYaw, DRAGON_PITCH); } catch (e3) {}
    try {
        var cur = dragon.getLocation();
        var vy = y - cur.getY();
        if (vy > -0.15) vy = DRAGON_VELOCITY_MIN_DOWN;
        dragon.setVelocity(new Vector(
            (x - cur.getX()) * 0.85,
            vy,
            (z - cur.getZ()) * 0.85
        ));
    } catch (e4) {}
    try {
        var EnderDragon = Java.type("org.bukkit.entity.EnderDragon");
        dragon.setPhase(EnderDragon.Phase.HOVER);
    } catch (e5) {}
    return ok;
}

// ===================================================================
// 宴死者之龙（真实末影龙）
// ===================================================================
function aoeDamage(world, center, owner, radius, dmg) {
    var item = owner != null ? owner.getInventory().getItemInMainHand() : null;
    var list = world.getNearbyEntities(center, radius, radius, radius);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (owner != null && ent.getUniqueId().equals(owner.getUniqueId())) continue;
        if (ent.hasMetadata(META_ZHU_LING) || ent.hasMetadata(META_DRAGON)) continue;
        ent.setNoDamageTicks(0);
        if (owner != null) ent.damage(dmg, owner);
        else ent.damage(dmg);
        if (owner != null) notifyAbilityDamage(owner, item, dmg);
    }
}

function playLargeBlastFx(world, loc, owner, blastIndex) {
    if (blastIndex == null || blastIndex < 0) blastIndex = 0;
    var blastPitch = DRAGON_BLAST_PITCHES[blastIndex];
    if (blastPitch == null) blastPitch = DRAGON_BLAST_PITCHES[DRAGON_BLAST_PITCHES.length - 1];

    // 大范围密集外爆：樱花 + 紫尘
    spawnCherry(world, loc, DRAGON_BLAST_CHERRY_COUNT,
        DRAGON_BLAST_CHERRY_SPREAD, DRAGON_BLAST_CHERRY_Y, DRAGON_BLAST_CHERRY_SPREAD, 0.08);
    spawnDust(world, loc, DRAGON_BLAST_DUST_BIG,
        DRAGON_BLAST_DUST_BIG_SPREAD, DRAGON_BLAST_DUST_BIG_SPREAD * 0.45, DRAGON_BLAST_DUST_BIG_SPREAD, 0.02, PURPLE_BIG);
    spawnDust(world, loc, DRAGON_BLAST_DUST,
        DRAGON_BLAST_DUST_SPREAD, DRAGON_BLAST_DUST_SPREAD * 0.4, DRAGON_BLAST_DUST_SPREAD, 0.04, PURPLE_DUST);
    spawnDust(world, loc, Math.floor(DRAGON_BLAST_DUST * 0.55),
        DRAGON_BLAST_DUST_SPREAD * 0.7, DRAGON_BLAST_DUST_SPREAD * 0.55, DRAGON_BLAST_DUST_SPREAD * 0.7, 0.06, LIGHT_PURPLE);

    if (EXPLOSION_PARTICLE != null) {
        try {
            world.spawnParticle(EXPLOSION_PARTICLE, loc, DRAGON_BLAST_EXPLOSION_COUNT,
                DRAGON_BLAST_EXPLOSION_SPREAD, DRAGON_BLAST_EXPLOSION_SPREAD * 0.5, DRAGON_BLAST_EXPLOSION_SPREAD, 0);
        } catch (e) {}
    }
    try { world.spawnParticle(Particle.FLASH, loc, 2, 0.4, 0.2, 0.4, 0, Color.fromRGB(255, 200, 255)); } catch (e2) {}

    // 中心紫球：由一点向四周爆炸飞散（非静态球壳）
    playSphereBurstDispersal(world, loc);

    world.playSound(loc, "entity.generic.explode", 1.8, blastPitch);
    world.playSound(loc, "entity.dragon_fireball.explode", 1.2, blastPitch);
    try { world.playSound(loc, "entity.generic.explode", 1.4, blastPitch); } catch (e3) {}

    // 额外为召唤者播放一次爆炸声 + 重生锚破碎（三次爆炸各播一次）
    if (DRAGON_BLAST_EXTRA_FOR_OWNER && owner != null) {
        playSoundForPlayer(owner, loc, "entity.generic.explode", 1.8, blastPitch);
        playSoundForPlayer(owner, loc, "entity.dragon_fireball.explode", 1.2, blastPitch);
        playSoundForPlayer(owner, loc, "entity.generic.explode", 1.4, blastPitch);
        playSoundForPlayer(owner, loc, DRAGON_BLAST_ANCHOR_BREAK_SOUND, DRAGON_BLAST_ANCHOR_BREAK_VOL, DRAGON_BLAST_ANCHOR_BREAK_PITCH * blastPitch);
    }
}

/** 落地后：直径20米法阵 + 三次爆炸（仅第一次有伤害）+ 法阵内随机5只祝灵 */
function playDragonLandingAftermath(owner, landLoc) {
    var world = landLoc.getWorld();
    var center = landLoc.clone();

    drawMagicCircle(world, center, DRAGON_LAND_CIRCLE_RADIUS, PURPLE_BIG);
    world.playSound(center, "block.beacon.activate", 1.3, 0.45);
    world.playSound(center, "block.respawn_anchor.charge", 1.0, 0.6);

    var blastDmg = DRAGON_DAMAGE_FACTOR * getAbilityPower();
    var blastRadius = DRAGON_LAND_CIRCLE_RADIUS;

    function doBlast(index) {
        var offset = center.clone().add(
            (Math.random() - 0.5) * DRAGON_BLAST_OFFSET,
            DRAGON_BLAST_Y,
            (Math.random() - 0.5) * DRAGON_BLAST_OFFSET
        );
        playLargeBlastFx(world, offset, owner, index);
        if (index === 0 || !DRAGON_BLAST_ONLY_FIRST_DAMAGES) {
            aoeDamage(world, center, owner, blastRadius, blastDmg);
        }
    }

    doBlast(0);
    for (var i = 1; i < DRAGON_BLAST_COUNT; i++) {
        (function (idx) {
            var T = Java.extend(BukkitRunnable, {
                run: function () {
                    try { doBlast(idx); } catch (e) {}
                }
            });
            new T().runTaskLater(plugin, DRAGON_BLAST_INTERVAL * idx);
        })(i);
    }

    // 第三次爆炸后：在玩家头顶分开生成祝灵
    var thirdDelay = DRAGON_BLAST_INTERVAL * (DRAGON_BLAST_COUNT - 1);
    var SpawnTask = Java.extend(BukkitRunnable, {
        run: function () {
            try {
                if (owner == null || !owner.isOnline()) return;
                var head = owner.getLocation().clone().add(0, owner.getHeight() + ZHU_LING_SPAWN_ABOVE_HEAD, 0);
                var s = DRAGON_POST_ZHU_LING_SPREAD;
                var offsets = [
                    [s, 0.0],
                    [-s, 0.0],
                    [0.0, s],
                    [0.0, -s]
                ];
                var nMax = Math.min(DRAGON_POST_ZHU_LING_COUNT, offsets.length);
                for (var n = 0; n < nMax; n++) {
                    var zlLoc = head.clone().add(offsets[n][0], DRAGON_POST_ZHU_LING_Y_STEP * n, offsets[n][1]);
                    summonZhuLing(owner, zlLoc, null, true);
                }
            } catch (e) {}
        }
    });
    new SpawnTask().runTaskLater(plugin, thirdDelay + DRAGON_POST_ZHU_LING_DELAY);
}

function startDragonFall(dragon, world, base, landY, startY, owner) {
    var fallPerTick = DRAGON_FALL_PER_SEC / 20.0;
    var posY = startY;
    var yaw = base.getYaw();
    var taskRef = null;
    var landed = false;

    forceDragonTransform(dragon, world, base.getX(), startY, base.getZ(), yaw);

    var FallTask = Java.extend(BukkitRunnable, {
        run: function () {
            try {
                if (landed) return;
                if (dragon == null || !dragon.isValid() || dragon.isDead()) {
                    try { taskRef.cancel(); } catch (e) {}
                    return;
                }
                hideDragonBossBar(dragon);

                posY -= fallPerTick;
                forceDragonTransform(dragon, world, base.getX(), posY, base.getZ(), yaw);

                var fxLoc = new Location(world, base.getX(), posY, base.getZ());
                spawnCherry(world, fxLoc, 18, 1.8, 1.2, 1.8, 0.02);
                spawnDust(world, fxLoc, 22, 1.6, 1.0, 1.6, 0, PURPLE_DUST);
                spawnDust(world, fxLoc.clone().add(0, -1, 0), 10, 1.2, 0.6, 1.2, 0, PURPLE_BIG);

                // 落到地面高度才结算，不因碰到生物提前消失
                if (posY <= landY + DRAGON_LAND_Y_SLOP) {
                    landed = true;
                    // 龙实体落到地面表面；特效抬高，避免埋进方块
                    forceDragonTransform(dragon, world, base.getX(), landY, base.getZ(), yaw);
                    var fxLocLand = new Location(world, base.getX(), landY + DRAGON_LAND_FX_LIFT, base.getZ());
                    drawDragonCircle(world, fxLocLand);
                    spawnCherry(world, fxLocLand, 90, 3.5, 1.2, 3.5, 0.05);
                    spawnDust(world, fxLocLand, 100, 3.2, 1.0, 3.2, 0, PURPLE_BIG);
                    silentRemoveDragon(dragon, world, fxLocLand);
                    playDragonLandingAftermath(owner, fxLocLand);
                    try { taskRef.cancel(); } catch (eC) {}
                }
            } catch (ex) {
                try { silentRemoveDragon(dragon, world, base); } catch (e2) {}
                try { taskRef.cancel(); } catch (e3) {}
            }
        }
    });
    taskRef = new FallTask().runTaskTimer(plugin, 1, 1);
}

function summonFeastDragon(owner, target) {
    if (target == null) return;
    // 允许目标已死亡：只用位置/身高快照，避免满层引爆先击杀导致不出龙
    var world = target.getWorld();
    var base = target.getLocation().clone();
    var height = 1.8;
    try { height = Math.max(0.6, target.getHeight()); } catch (eH) {}
    var yaw = 0;
    try { yaw = target.getLocation().getYaw(); } catch (eY) {}
    var headY = base.getY() + height;
    var startY = headY + DRAGON_HEIGHT;
    var landY = DRAGON_LAND_ON_GROUND
        ? getGroundY(world, base.getX(), base.getZ(), base.getY())
        : headY;
    var start = new Location(world, base.getX(), startY, base.getZ());
    start.setPitch(90);
    start.setYaw(yaw);

    if (owner != null) {
        sendColored(owner, MSG_DRAGON_LINE1);
        sendColored(owner, MSG_DRAGON_LINE2);
    }

    // ① 诞生前：先生成直径 10 米圆形阵法（高空视觉）
    // 龙吼在目标附近 + 召唤者耳边播放，避免在 30 格高空播导致听不见
    drawDragonCircle(world, start.clone());
    var growlAt = new Location(world, base.getX(), landY + DRAGON_LAND_FX_LIFT, base.getZ());
    playDragonGrowl(owner, growlAt);

    var BirthTask = Java.extend(BukkitRunnable, {
        run: function () {
            try {
                // ② 阵法后再生成真实末影龙
                var dragon = null;
                try {
                    var entClass = EntityType.ENDER_DRAGON.getEntityClass();
                    dragon = world.spawn(start, entClass);
                } catch (eSpawn) {
                    try {
                        dragon = world.spawnEntity(start, EntityType.ENDER_DRAGON);
                    } catch (eSpawn2) {
                        plugin.getLogger().warning("[咀梦] 无法生成末影龙: " + eSpawn2);
                        aoeDamage(world, base, owner, DRAGON_AOE_RADIUS, DRAGON_DAMAGE_FACTOR * getAbilityPower());
                        drawDragonCircle(world, new Location(world, base.getX(), landY + DRAGON_LAND_FX_LIFT, base.getZ()));
                        return;
                    }
                }
                if (dragon == null) return;

                setupFeastDragon(dragon);
                try { dragon.teleport(start); } catch (eT) {}
                // 龙诞生时再吼一次（仍在地面附近 + 耳边）
                playDragonGrowl(owner, growlAt);
                startDragonFall(dragon, world, base, landY, startY, owner);
            } catch (ex) {
                plugin.getLogger().warning("[咀梦] 龙诞生流程异常: " + ex);
            }
        }
    });
    new BirthTask().runTaskLater(plugin, DRAGON_BIRTH_DELAY_TICKS);
}

// ===================================================================
// 赐梦仪式（右键）
// ===================================================================
function castDreamRitual(player) {
    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (ritualCdMap.containsKey(uuid) && (now - ritualCdMap.get(uuid)) < RITUAL_CD_MS) return;
    ritualCdMap.put(uuid, now);

    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var power = getAbilityPower();
    var count = 0;
    var dragonCount = 0;

    var list = world.getNearbyEntities(eye, RITUAL_RANGE, RITUAL_RANGE, RITUAL_RANGE);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (ent.getUniqueId().equals(player.getUniqueId())) continue;
        if (ent.hasMetadata(META_ZHU_LING) || ent.hasMetadata(META_DRAGON)) continue;
        var center = ent.getLocation().add(0, ent.getHeight() * 0.5, 0);
        if (!inPlayerView(player, center, RITUAL_RANGE, RITUAL_FOV_DEG)) continue;
        var stacks = getChimingStacks(ent);
        if (stacks <= 0) continue;

        var dmg = stacks * RITUAL_DAMAGE_FACTOR * power;
        var needDragon = stacks >= CHIMING_DRAGON_STACKS;
        clearChiming(ent);

        // 先出龙再结算引爆伤害，避免满层伤害直接打死目标导致不出龙
        if (needDragon) {
            dragonCount++;
            summonFeastDragon(player, ent);
        }

        ent.setNoDamageTicks(0);
        ent.damage(dmg, player);
        notifyAbilityDamage(player, player.getInventory().getItemInMainHand(), dmg);
        count++;

        spawnCherry(world, center, 25, 0.5, 0.5, 0.5, 0.03);
        spawnDust(world, center, 30, 0.55, 0.55, 0.55, 0, PURPLE_BIG);
        world.playSound(center, RITUAL_HIT_SOUND, 0.7, 1.4);
    }

    world.playSound(eye, RITUAL_SOUND_1, 1.0, 0.7);
    world.playSound(eye, RITUAL_SOUND_2, 0.9, 0.8);
    if (count > 0) {
        player.sendActionBar(MSG_RITUAL_OK_PREFIX + count + MSG_RITUAL_OK_MID +
            (dragonCount > 0 ? (MSG_RITUAL_DRAGON_SUFFIX + dragonCount) : ""));
    } else {
        player.sendActionBar(MSG_RITUAL_NONE);
    }
}

function onUse(event) {
    try {
        var player = event.getPlayer();
        if (!isHoldingItem(player)) return;
        castDreamRitual(player);
    } catch (e) {
        plugin.getLogger().warning("[咀梦] onUse异常: " + e);
    }
}

// ===================================================================
// 死亡被动：视野内生物死亡 → 召唤祝灵
// 若死亡时仍带斥命（未仪式引爆）：按层数同时召唤等量祝灵
// ===================================================================
/**
 * 在玩家头顶附近按第 9 区散开配置同时召唤多只祝灵
 */
function spawnZhuLingBurstAtPlayer(owner, count, bypassMax) {
    if (owner == null || !owner.isOnline() || count <= 0) return;
    var head = owner.getLocation().clone().add(0, owner.getHeight() + ZHU_LING_SPAWN_ABOVE_HEAD, 0);
    var s = DRAGON_POST_ZHU_LING_SPREAD;
    for (var n = 0; n < count; n++) {
        var ang = (count === 1) ? 0 : ((Math.PI * 2 * n) / count);
        var zlLoc = head.clone().add(
            Math.cos(ang) * s,
            DRAGON_POST_ZHU_LING_Y_STEP * n,
            Math.sin(ang) * s
        );
        summonZhuLing(owner, zlLoc, null, bypassMax);
    }
}

function onEntityDeath(event) {
    try {
        var entity = event.getEntity();
        if (!(entity instanceof LivingEntity)) return;

        // 宴死者之龙：禁止掉落，尽量取消死亡并静默移除（防死亡动画/音效）
        if (entity.hasMetadata(META_DRAGON)) {
            try { event.getDrops().clear(); } catch (e0) {}
            try { event.setDroppedExp(0); } catch (e1) {}
            try { event.setCancelled(true); } catch (e2) {}
            muteDragonSoundsNear(entity.getWorld(), entity.getLocation());
            silentRemoveDragon(entity, entity.getWorld(), entity.getLocation());
            return;
        }
        if (entity.hasMetadata(META_ZHU_LING)) {
            try { event.getDrops().clear(); } catch (e3) {}
            try { event.setDroppedExp(0); } catch (e4) {}
            return;
        }
        if (entity instanceof Player) return;

        var deathLoc = entity.getLocation();
        var stacks = getChimingStacks(entity);
        var chimingDeathHandled = false;

        // 斥命未引爆就死完：按层数在玩家处同时召唤等量祝灵（第 9 区散开）
        if (CHIMING_DEATH_ZHU_LING_ENABLED && stacks > 0) {
            clearChiming(entity);
            var holders = Bukkit.getOnlinePlayers().iterator();
            while (holders.hasNext()) {
                var holder = holders.next();
                if (!isHoldingItem(holder)) continue;
                if (!holder.getWorld().equals(deathLoc.getWorld())) continue;
                if (!inPlayerView(holder, deathLoc, DEATH_PASSIVE_RANGE, DEATH_PASSIVE_FOV_DEG)) continue;
                spawnZhuLingBurstAtPlayer(holder, stacks, CHIMING_DEATH_BYPASS_MAX);
                chimingDeathHandled = true;
            }
        } else if (stacks > 0) {
            clearChiming(entity);
        }

        if (!DEATH_PASSIVE_ENABLED) return;
        if (chimingDeathHandled && CHIMING_DEATH_SKIP_PASSIVE) return;

        var players = Bukkit.getOnlinePlayers().iterator();
        while (players.hasNext()) {
            var player = players.next();
            if (!isHoldingItem(player)) continue;
            if (!player.getWorld().equals(deathLoc.getWorld())) continue;
            if (!inPlayerView(player, deathLoc, DEATH_PASSIVE_RANGE, DEATH_PASSIVE_FOV_DEG)) continue;
            // 死亡被动 +1：同样在玩家处，沿用第 9 区散开
            spawnZhuLingBurstAtPlayer(player, 1, false);
        }
    } catch (e) {}
}

function onDragonDamage(event) {
    try {
        var entity = event.getEntity();
        if (entity != null && entity.hasMetadata(META_DRAGON)) {
            event.setCancelled(true);
        }
    } catch (e) {}
}

function protectVisualDragon(event) {
    try {
        var ent = event.getEntity();
        if (ent != null && ent.hasMetadata(META_DRAGON)) {
            event.setCancelled(true);
            try { event.blockList().clear(); } catch (e) {}
        }
    } catch (e2) {}
}

function tickRingDisplay() {
    var it = chimingMap.entrySet().iterator();
    while (it.hasNext()) {
        var entry = it.next();
        var ent = Bukkit.getEntity(UUID.fromString(entry.getKey()));
        if (ent == null || ent.isDead() || !(ent instanceof LivingEntity)) {
            it.remove();
            continue;
        }
        drawChimingRing(ent);
    }
}

// ===================================================================
// 事件注册（热重载安全）
// ===================================================================
var jiumengListener = new (Java.extend(Listener, {}))();
var RunnableImpl = Java.extend(Java.type("java.lang.Runnable"));

var initListener = new RunnableImpl({
    run: function () {
        // 热重载：卸掉上一份监听器（Metadata 可跨 eval 保留引用）
        try {
            if (plugin.hasMetadata(META_JIUME_LISTENER)) {
                var oldL = plugin.getMetadata(META_JIUME_LISTENER).get(0).value();
                if (oldL != null) {
                    try { PlayerInteractEvent.getHandlerList().unregister(oldL); } catch (e) {}
                    try { PlayerItemHeldEvent.getHandlerList().unregister(oldL); } catch (e) {}
                    try { EntityDamageEvent.getHandlerList().unregister(oldL); } catch (e) {}
                    try { EntityDamageByEntityEvent.getHandlerList().unregister(oldL); } catch (e) {}
                    try { EntityDeathEvent.getHandlerList().unregister(oldL); } catch (e) {}
                    try { EntityExplodeEvent.getHandlerList().unregister(oldL); } catch (e) {}
                    try { EntityChangeBlockEvent.getHandlerList().unregister(oldL); } catch (e) {}
                }
                try { plugin.removeMetadata(META_JIUME_LISTENER, plugin); } catch (eR) {}
            }
        } catch (eOld) {}
        try {
            plugin.setMetadata(META_JIUME_LISTENER, new FixedMetadataValue(plugin, jiumengListener));
        } catch (eSet) {}

        Bukkit.getPluginManager().registerEvent(
            PlayerInteractEvent, jiumengListener, EventPriority.NORMAL,
            function (l, event) {
                try {
                    var player = event.getPlayer();
                    if (!isHoldingItem(player)) return;
                    var hand = event.getHand();
                    if (hand == null || hand.name() !== "HAND") return;
                    var action = event.getAction().name();
                    if (action !== "LEFT_CLICK_AIR" && action !== "LEFT_CLICK_BLOCK") return;
                    event.setCancelled(true);
                    onLeftClickCharge(player);
                } catch (e) {
                    plugin.getLogger().warning("[咀梦] 交互异常: " + e);
                }
            },
            plugin
        );

        // 切换快捷栏：若离开本武器则清空自己施加的斥命
        Bukkit.getPluginManager().registerEvent(
            PlayerItemHeldEvent, jiumengListener, EventPriority.MONITOR,
            function (l, event) {
                try {
                    var player = event.getPlayer();
                    var uuid = player.getUniqueId().toString();
                    var inv = player.getInventory();
                    var prev = inv.getItem(event.getPreviousSlot());
                    var wasWeapon = false;
                    if (prev != null && prev.getType() !== Material.AIR) {
                        var sfPrev = SlimefunItem.getByItem(prev);
                        wasWeapon = sfPrev != null && sfPrev.getId() === ITEM_ID;
                    }
                    if (!wasWeapon) return;
                    // 延迟 1 tick 再判断新手持（槽位切换后物品才稳定）
                    var ClearTask = Java.extend(BukkitRunnable, {
                        run: function () {
                            try {
                                if (!isHoldingItem(player)) {
                                    holdingTrackMap.put(uuid, false);
                                    onPlayerUnequipWeapon(player);
                                }
                            } catch (e2) {}
                        }
                    });
                    new ClearTask().runTaskLater(plugin, 1);
                } catch (e) {}
            },
            plugin
        );

        // 左键近战命中实体时同样进入蓄力
        Bukkit.getPluginManager().registerEvent(
            EntityDamageByEntityEvent, jiumengListener, EventPriority.MONITOR,
            function (l, event) {
                try {
                    if (event.isCancelled()) return;
                    var damager = event.getDamager();
                    if (!(damager instanceof Player)) return;
                    if (!isHoldingItem(damager)) return;
                    onLeftClickCharge(damager);
                } catch (e) {}
            },
            plugin, true
        );

        Bukkit.getPluginManager().registerEvent(
            EntityDamageEvent, jiumengListener, EventPriority.HIGHEST,
            function (l, event) { onDragonDamage(event); },
            plugin, true
        );

        Bukkit.getPluginManager().registerEvent(
            EntityDamageEvent, jiumengListener, EventPriority.MONITOR,
            function (l, event) { onChimingDamaged(event); },
            plugin, true
        );

        Bukkit.getPluginManager().registerEvent(
            EntityDeathEvent, jiumengListener, EventPriority.HIGHEST,
            function (l, event) { onEntityDeath(event); },
            plugin
        );

        Bukkit.getPluginManager().registerEvent(
            EntityExplodeEvent, jiumengListener, EventPriority.HIGHEST,
            function (l, event) { protectVisualDragon(event); },
            plugin
        );

        Bukkit.getPluginManager().registerEvent(
            EntityChangeBlockEvent, jiumengListener, EventPriority.HIGHEST,
            function (l, event) { protectVisualDragon(event); },
            plugin
        );
    }
});
Bukkit.getScheduler().runTask(plugin, initListener);

var startTasks = new RunnableImpl({
    run: function () {
        // 取消上一轮定时任务（本文件变量 + Metadata，避免 Graal 挂 plugin 字段失败）
        function cancelIdList(ids) {
            if (ids == null) return;
            try {
                for (var i = 0; i < ids.length; i++) {
                    try { Bukkit.getScheduler().cancelTask(Number(ids[i])); } catch (eC) {}
                }
            } catch (e1) {}
        }
        cancelIdList(jiumengTaskIds);
        try {
            if (plugin.hasMetadata(META_JIUME_TASKS)) {
                cancelIdList(plugin.getMetadata(META_JIUME_TASKS).get(0).value());
                plugin.removeMetadata(META_JIUME_TASKS, plugin);
            }
        } catch (e0) {}
        jiumengTaskIds = [];

        var ChargeTask = Java.extend(BukkitRunnable, {
            run: function () { try { tickChargeBars(); } catch (e) {} }
        });
        jiumengTaskIds.push(new ChargeTask().runTaskTimer(plugin, TASK_CHARGE_PERIOD, TASK_CHARGE_PERIOD).getTaskId());

        var DecayTask = Java.extend(BukkitRunnable, {
            run: function () { try { tickChimingDecay(); } catch (e) {} }
        });
        jiumengTaskIds.push(new DecayTask().runTaskTimer(plugin, TASK_CHIMING_DECAY_PERIOD, TASK_CHIMING_DECAY_PERIOD).getTaskId());

        var RingTask = Java.extend(BukkitRunnable, {
            run: function () { try { tickRingDisplay(); } catch (e) {} }
        });
        jiumengTaskIds.push(new RingTask().runTaskTimer(plugin, TASK_RING_PERIOD, TASK_RING_PERIOD).getTaskId());

        try {
            plugin.setMetadata(META_JIUME_TASKS, new FixedMetadataValue(plugin, jiumengTaskIds));
        } catch (eMeta) {}
    }
});
Bukkit.getScheduler().runTask(plugin, startTasks);
