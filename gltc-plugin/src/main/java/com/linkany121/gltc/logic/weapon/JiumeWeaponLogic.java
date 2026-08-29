package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
import com.linkany121.gltc.logic.gun.GunCombat;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.entity.EntityChangeBlockEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.EntityExplodeEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import javax.annotation.Nullable;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/**
 * {@code FKR_咀嚼曾世的晚梦} — charge / 祝灵 / 斥命 / 赐梦仪式 / 宴死者之龙.
 * Port of {@code scripts/武器/咀梦.js}.
 */
public final class JiumeWeaponLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "FKR_咀嚼曾世的晚梦";

    public static final String META_ZHU_LING = "gltc_jiumeng_zhuling";
    public static final String META_DRAGON = "gltc_jiumeng_dragon";
    public static final String META_CHIMING_EXTRA = "gltc_jiumeng_chiming_extra";

    // ===== 配置区（FKR_咀嚼曾世的晚梦，改完需重新打包 jar 并重启生效）=====
    // --- damage factors ---
    public static final double CHIMING_EXTRA_FACTOR = 0.1;   // 斥命附加伤害比例（0.1 = 每次攻击附加 10% 伤害）
    public static final double RITUAL_DAMAGE_FACTOR = 1.0;   // 赐梦仪式引爆伤害倍率
    public static final double DRAGON_DAMAGE_FACTOR = 100.0; // 宴死者之龙落地伤害倍率（100 = 极高）

    // --- charge ---
    public static final int CHARGE_TICKS = 20;               // 充能蓄力时长（tick），20 = 1 秒
    public static final int CHARGE_SEGMENTS = 16;            // 充能进度条分段数（越长越细腻）
    public static final String CHARGE_BAR_EMPTY = "§8·";     // 充能条空格符号
    public static final String CHARGE_BAR_COLOR_CHARGING = "§0";  // 充能中进度条颜色
    public static final String CHARGE_BAR_COLOR_FULL = "§d";      // 充满进度条颜色
    public static final long CHARGE_RELEASE_CD_MS = 100L;    // 充能释放后的冷却（毫秒）
    public static final String CHARGE_START_SOUND = "block.note_block.hat";  // 开始充能音效
    public static final float CHARGE_START_SOUND_VOL = 0.5f; // 开始充能音量
    public static final float CHARGE_START_SOUND_PITCH = 1.2f; // 开始充能音高
    public static final String CHARGE_FULL_SOUND = "block.note_block.chime"; // 充满音效
    public static final float CHARGE_FULL_SOUND_VOL = 0.8f;  // 充满音量
    public static final float CHARGE_FULL_SOUND_PITCH = 1.6f; // 充满音高
    public static final String CHARGE_RELEASE_SPLASH_SOUND = "entity.splash_potion.break"; // 释放音效
    public static final float CHARGE_RELEASE_SPLASH_VOL = 1.0f; // 释放音量
    public static final float CHARGE_RELEASE_SPLASH_PITCH = 1.0f; // 释放音高

    public static final double CHARGE_FX_CHERRY_RADIUS = 14.0; // 充能樱花环半径（格）
    public static final int CHARGE_FX_CHERRY_COUNT = 150;      // 充能樱花粒子数量
    public static final int CHARGE_FX_CHERRY_PER_POINT = 2;    // 每点樱花粒子数
    public static final double CHARGE_FX_OFFSET_X = 0.1;       // 特效中心水平偏移（格）
    public static final double CHARGE_FX_OFFSET_Y = 0.4;       // 特效中心垂直偏移（格）
    public static final double CHARGE_FX_CHERRY_SPREAD = 0.08; // 樱花粒子散布（格）
    public static final int CHARGE_FX_BURST_DELAY_TICKS = 5;   // 充满爆发的延迟（tick）
    public static final double CHARGE_FX_BURST_Y = 0.15;       // 爆发特效高度偏移（格）
    public static final String CHARGE_FX_SOUND_CHERRY_1 = "block.cherry_wood.place";   // 充能音效 1
    public static final String CHARGE_FX_SOUND_CHERRY_2 = "block.cherry_leaves.place"; // 充能音效 2
    public static final String CHARGE_FX_SOUND_BURST_1 = "entity.splash_potion.break"; // 爆发音效 1
    public static final String CHARGE_FX_SOUND_BURST_2 = "block.amethyst_block.break"; // 爆发音效 2

    // --- zhu ling ---
    public static final int ZHU_LING_MAX = 16;                  // 同一玩家祝灵（Allay 随从）上限
    public static final int ZHU_LING_LIFE_TICKS = 120;          // 祝灵存活时长（tick），120 = 6 秒
    public static final double ZHU_LING_SPEED = 0.6;            // 祝灵追踪速度（格/tick）
    public static final double ZHU_LING_HIT_RANGE = 2.5;        // 祝灵命中判定范围（格）
    public static final double ZHU_LING_SEARCH_RANGE = 32;      // 祝灵索敌范围（格）
    public static final double ZHU_LING_SPAWN_ABOVE_HEAD = 1.0; // 祝灵生成高度（头顶上方格数）
    public static final int ZHU_LING_RESIST_TICKS = 130;        // 祝灵给玩家附加抗性提升时长（tick）
    public static final int ZHU_LING_RESIST_LEVEL = 10;         // 抗性提升等级（10 ≈ 极高）
    public static final int ZHU_LING_TRAIL_CHERRY = 1;          // 祝灵移动时樱花粒子数
    public static final int ZHU_LING_TRAIL_DUST = 1;            // 祝灵移动时 DUST 粒子数
    public static final int ZHU_LING_HIT_CHERRY = 16;           // 祝灵命中时樱花粒子数
    public static final int ZHU_LING_HIT_DUST = 16;             // 祝灵命中时 DUST 粒子数
    public static final String ZHU_LING_SPAWN_SOUND = "entity.allay.ambient_without_item"; // 祝灵生成音效
    public static final String ZHU_LING_HIT_SOUND = "entity.allay.hurt";  // 祝灵命中音效
    public static final double ZHU_LING_HIT_BLAST_RADIUS = 1.4; // 祝灵命中爆炸半径（格）
    public static final double ZHU_LING_HIT_BLAST_DAMAGE = 1.0; // 祝灵命中爆炸伤害倍率
    public static final boolean ZHU_LING_PRIORITIZE_CHIMING = true; // 是否优先攻击带斥命的目标

    // --- chiming ---
    public static final long CHIMING_DECAY_MS = 5000L;          // 斥命层数衰减间隔（毫秒），5000 = 每 5 秒掉一层
    public static final int CHIMING_RING_MAX = 8;               // 斥命层数上限（叠满进入满层状态）
    public static final int CHIMING_DRAGON_STACKS = 8;          // 满层时召唤龙所需的层数门槛
    public static final boolean CHIMING_FULL_NO_TARGET = true;  // 满层且无目标时不衰减
    public static final boolean CHIMING_FULL_NO_DECAY = true;   // 满层时不衰减
    public static final boolean CHIMING_FULL_CAP_STACKS = true; // 满层时封顶不再叠加
    public static final boolean CHIMING_CLEAR_ON_UNEQUIP = true; // 卸下武器时清空斥命层数
    public static final int CHIMING_SLOW_TICKS = 120;           // 斥命命中减速时长（tick），120 = 6 秒
    public static final int CHIMING_FULL_SLOW_TICKS = 200;      // 满层命中减速时长（tick），200 = 10 秒
    public static final int CHIMING_FULL_SLOW_LEVEL = 2;        // 满层命中减速等级
    public static final double CHIMING_RING_BASE = 0.4;         // 斥命环绕粒子环基础半径（格）
    public static final double CHIMING_RING_WIDTH_FACTOR = 0.6; // 环宽系数
    public static final double CHIMING_RING_PER_STACK = 0.08;   // 每层斥命增加的环半径（格）
    public static final int CHIMING_RING_POINTS_BASE = 12;      // 环基础粒子点数
    public static final int CHIMING_FULL_CHERRY_1 = 100;        // 满层特效樱花粒子数 1
    public static final int CHIMING_FULL_CHERRY_2 = 50;         // 满层特效樱花粒子数 2
    public static final int CHIMING_FULL_DUST = 32;             // 满层特效 DUST 粒子数

    // --- ritual ---
    public static final double RITUAL_RANGE = 32;    // 赐梦仪式作用半径（格）
    public static final double RITUAL_FOV_DEG = 120; // 赐梦仪式前方视野角（度）
    public static final long RITUAL_CD_MS = 800L;    // 仪式冷却（毫秒），800 = 0.8 秒
    public static final String RITUAL_SOUND_1 = "block.enchantment_table.use";  // 仪式施法音效 1
    public static final String RITUAL_SOUND_2 = "entity.evoker.prepare_attack"; // 仪式施法音效 2
    public static final String RITUAL_HIT_SOUND = "entity.generic.explode";     // 仪式引爆命中音效

    // --- dragon spawn / fall ---
    public static final double DRAGON_HEIGHT = 30;            // 龙生成高度（目标头顶上方格数）
    public static final double DRAGON_FALL_PER_SEC = 30;      // 龙下坠速度（格/秒）
    public static final int DRAGON_BIRTH_DELAY_TICKS = 20;    // 龙出现前的延迟（tick），20 = 1 秒
    public static final double DRAGON_YAW_OFFSET = 180.0;     // 龙朝向偏移（度）
    public static final double DRAGON_PITCH = 90.0;           // 龙俯仰角（度）
    public static final double DRAGON_LAND_Y_SLOP = 0.1;      // 落地高度判定容差（格）
    public static final String DRAGON_GROWL_SOUND = "entity.ender_dragon.growl";    // 龙叫声
    public static final String DRAGON_GROWL_SOUND_ALT = "entity.ender_dragon.ambient"; // 龙叫声备选
    public static final double DRAGON_GROWL_VOL = 2.5;        // 龙叫音量
    public static final double DRAGON_GROWL_PITCH = 1.1;      // 龙叫音高
    public static final boolean DRAGON_GROWL_EXTRA_FOR_OWNER = true;   // 是否给持有者额外播一遍龙叫
    public static final boolean DRAGON_BLAST_EXTRA_FOR_OWNER = true;   // 是否给持有者额外播爆炸音效
    public static final String DRAGON_BLAST_ANCHOR_BREAK_SOUND = "block.respawn_anchor.deplete"; // 落地锚点破碎音效
    public static final double DRAGON_BLAST_ANCHOR_BREAK_VOL = 1.2;    // 锚点破碎音量
    public static final double DRAGON_BLAST_ANCHOR_BREAK_PITCH = 0.85; // 锚点破碎音高
    public static final boolean DRAGON_LAND_ON_GROUND = false; // 龙是否在地面生成（false = 空中生成）
    public static final double DRAGON_LAND_FX_LIFT = 0.3;      // 落地特效高度提升（格）
    public static final double DRAGON_LAND_ENTITY_OFFSET = -2.0; // 龙实体相对落地点的垂直偏移（格）
    public static final double DRAGON_REMOVE_ABOVE_LAND = 12.0; // 落地后多久从上方移除实体（格判定）
    public static final int DRAGON_FALL_MAX_TICKS = 200;       // 龙下坠最长时长（tick），超时自动处理
    public static final double DRAGON_MUTE_RANGE = 64;         // 龙叫静默范围（格，范围内其他人听不到）
    public static final int[] DRAGON_MUTE_RETRY_TICKS = {1, 5}; // 静默重试间隔（tick 数组）

    // --- dragon blast ---
    public static final double DRAGON_CIRCLE_RADIUS = 12;          // 龙落地爆炸圈半径（格）
    public static final double DRAGON_LAND_CIRCLE_RADIUS = 16;     // 落地瞬间圈半径（格）
    public static final int DRAGON_BLAST_COUNT = 3;                // 爆炸波数
    public static final int DRAGON_BLAST_INTERVAL = 15;            // 波与波间隔（tick）
    public static final double DRAGON_BLAST_OFFSET = 1;            // 爆炸圈中心偏移（格）
    public static final double DRAGON_BLAST_Y = 3;                 // 爆炸圈高度（格）
    public static final boolean DRAGON_BLAST_ONLY_FIRST_DAMAGES = true; // 只有第一波结算伤害
    public static final double DRAGON_BLAST_KNOCKBACK = 1.2;       // 爆炸圈击退力度
    public static final float[] DRAGON_BLAST_PITCHES = {1.0f, 0.8f, 0.6f}; // 各波爆炸音高
    public static final int DRAGON_BLAST_CHERRY_COUNT = 160;       // 爆炸圈樱花粒子数
    public static final double DRAGON_BLAST_CHERRY_SPREAD = 7.5;   // 樱花散布（格）
    public static final double DRAGON_BLAST_CHERRY_Y = 2.8;        // 樱花高度（格）
    public static final int DRAGON_BLAST_DUST_BIG = 160;           // 大 DUST 粒子数
    public static final double DRAGON_BLAST_DUST_BIG_SPREAD = 7.0; // 大 DUST 散布（格）
    public static final int DRAGON_BLAST_DUST = 120;               // DUST 粒子数
    public static final double DRAGON_BLAST_DUST_SPREAD = 6.0;     // DUST 散布（格）
    public static final int DRAGON_BLAST_EXPLOSION_COUNT = 8;      // 爆炸粒子簇数
    public static final double DRAGON_BLAST_EXPLOSION_SPREAD = 3.5; // 爆炸粒子散布（格）
    public static final int DRAGON_BLAST_SPHERE_POINTS = 64;       // 球形特效点数
    public static final double DRAGON_BLAST_SPHERE_RADIUS = 16;    // 球形特效半径（格）
    public static final int DRAGON_BLAST_SPHERE_PER_POINT = 3;     // 每点粒子数
    public static final double DRAGON_BLAST_SPHERE_UP_BIAS = 0.3;  // 球体向上偏移（格）
    public static final int DRAGON_BLAST_SPHERE_BURST_TICKS = 10;  // 球体爆发时长（tick）
    public static final int DRAGON_BLAST_SPHERE_BURST_PERIOD = 1;  // 球体爆发间隔（tick）
    public static final int DRAGON_BLAST_SPHERE_TRAIL_STEPS = 2;   // 球体拖尾步数

    public static final int DRAGON_POST_ZHU_LING_COUNT = 4;   // 龙落地后召唤祝灵数量
    public static final int DRAGON_POST_ZHU_LING_DELAY = 3;   // 召唤延迟（tick）
    public static final double DRAGON_POST_ZHU_LING_SPREAD = 3;   // 祝灵散布半径（格）
    public static final double DRAGON_POST_ZHU_LING_Y_STEP = 0.5; // 祝灵生成高度步进（格）
    public static final boolean CHIMING_DEATH_ZHU_LING_ENABLED = true;
    public static final boolean CHIMING_DEATH_BYPASS_MAX = true;
    public static final boolean CHIMING_DEATH_SKIP_PASSIVE = true;

    // --- 死亡被动（击杀敌人触发）---
    public static final boolean DEATH_PASSIVE_ENABLED = true;   // 是否启用击杀被动
    public static final double DEATH_PASSIVE_RANGE = 32;        // 被动作用半径（格）
    public static final double DEATH_PASSIVE_FOV_DEG = 120;     // 被动前方视野角（度）

    // --- 任务周期（各后台任务运行间隔）---
    public static final int TASK_CHARGE_PERIOD = 1;         // 充能进度条任务间隔（tick）
    public static final int TASK_CHIMING_DECAY_PERIOD = 20; // 斥命衰减任务间隔（tick）
    public static final int TASK_RING_PERIOD = 5;           // 斥命环绕粒子任务间隔（tick）

    // --- 消息（&#rrggbb 为十六进制彩字，可自由修改文案）---
    public static final String MSG_CHIMING_FULL =            // 斥命满层提示文案
        "&#ff0099我&#fc0ea4将&#fa1cae剥&#f729b9夺&#f537c4你&#f245cf曾&#f053d9拥&#ed61e4有&#eb6eef过&#e87cfa的&#e77cfe所&#e76efc有&#e661f9苦&#e653f7痛&#e645f5与&#e537f2欢&#e529f0欣&#e51cee.&#e40eeb.&#e400e9.";
    public static final String MSG_DRAGON_LINE1 =            // 召唤龙第 1 行文案
        "      &#e400e9.&#e40deb.&#e51aed.&#e527f0愿&#e534f2你&#e642f4破&#e64ff6碎&#e65cf8的&#e669fb灵&#e776fd魂&#e783ff与&#e976f5过&#ec69eb往&#ee5ce0能与&#f14fd6所&#f342cc爱&#f534c2之&#f827b8人&#fa1aad重&#fd0da3逢&#ff0099。";
    public static final String MSG_DRAGON_LINE2 =            // 召唤龙第 2 行文案
        "&#ff00e6[ &#ff0de7九&#ff1ae9环&#ff27ea固&#ff34eb化&#ff42ed废&#ff4fee墟&#ff5cef术&#ff69f0式 &#ff76f2· &#ff83f3赐&#ff76e5如&#ff69d8绸&#ff5cca纱&#ff4fbd迸&#ff42af裂&#ff34a1般&#ff2794的&#ff1a86永&#ff0d79梦 &#ff006b]";
    public static final String MSG_ZHU_LING_CAP = "§7祝灵已达上限 §f"; // 祝灵达上限提示
    public static final String MSG_RITUAL_OK_PREFIX = "§d赐梦仪式 §f引爆 §c"; // 仪式成功前缀
    public static final String MSG_RITUAL_OK_MID = " §f个目标";             // 仪式成功中段
    public static final String MSG_RITUAL_DRAGON_SUFFIX = " §5龙×";         // 仪式成功龙计数后缀
    public static final String MSG_RITUAL_NONE = "§7视野内没有可引爆的斥命"; // 仪式无目标提示

    private static final Set<EntityDamageEvent.DamageCause> CHIMING_EXTRA_BLOCKED = EnumSet.of(  // 下列伤害类型不触发斥命附加伤害
        EntityDamageEvent.DamageCause.FALL,
        EntityDamageEvent.DamageCause.FIRE,
        EntityDamageEvent.DamageCause.FIRE_TICK,
        EntityDamageEvent.DamageCause.LAVA,
        EntityDamageEvent.DamageCause.DROWNING,
        EntityDamageEvent.DamageCause.SUFFOCATION,
        EntityDamageEvent.DamageCause.STARVATION,
        EntityDamageEvent.DamageCause.POISON,
        EntityDamageEvent.DamageCause.WITHER,
        EntityDamageEvent.DamageCause.VOID,
        EntityDamageEvent.DamageCause.LIGHTNING,
        EntityDamageEvent.DamageCause.HOT_FLOOR,
        EntityDamageEvent.DamageCause.CRAMMING,
        EntityDamageEvent.DamageCause.DRYOUT,
        EntityDamageEvent.DamageCause.FREEZE,
        EntityDamageEvent.DamageCause.SONIC_BOOM,
        EntityDamageEvent.DamageCause.MELTING,
        EntityDamageEvent.DamageCause.FALLING_BLOCK,
        EntityDamageEvent.DamageCause.CONTACT
    );

    private static JiumeWeaponLogic instance;

    private final JiumeChiming chiming = new JiumeChiming();
    private final Map<UUID, Integer> chargeProgressMap = new ConcurrentHashMap<>();
    private final Map<UUID, Long> leftReleaseCdMap = new ConcurrentHashMap<>();
    private final Map<UUID, Boolean> holdingTrackMap = new ConcurrentHashMap<>();
    private final Map<UUID, Long> ritualCdMap = new ConcurrentHashMap<>();
    private final Set<BukkitTask> trackedTasks = ConcurrentHashMap.newKeySet();

    private BukkitTask chargeTask;
    private BukkitTask decayTask;
    private BukkitTask ringTask;

    private JiumeWeaponLogic() {
    }

    public static void register(GltcPlugin plugin) {
        if (plugin == null) {
            return;
        }
        unregister();
        JiumeWeaponLogic logic = new JiumeWeaponLogic();
        instance = logic;
        GltcLogicRegistry.registerItem(ITEM_ID, logic);
        Bukkit.getPluginManager().registerEvents(logic, plugin);
        logic.startTasks(plugin);
    }

    public static void unregister() {
        JiumeWeaponLogic logic = instance;
        if (logic == null) {
            return;
        }
        instance = null;
        HandlerList.unregisterAll(logic);
        logic.cancelAllTasks();
        logic.chargeProgressMap.clear();
        logic.leftReleaseCdMap.clear();
        logic.holdingTrackMap.clear();
        logic.ritualCdMap.clear();
        logic.chiming.clearAll();
        JiumeZhuLing.clearAll();
    }

    @Nullable
    public static JiumeWeaponLogic getInstance() {
        return instance;
    }

    static JiumeChiming chiming() {
        JiumeWeaponLogic logic = instance;
        return logic != null ? logic.chiming : new JiumeChiming();
    }

    public void trackTask(BukkitTask task) {
        if (task != null) {
            trackedTasks.add(task);
        }
    }

    private void startTasks(GltcPlugin plugin) {
        chargeTask = Bukkit.getScheduler().runTaskTimer(plugin, this::tickChargeBars, TASK_CHARGE_PERIOD, TASK_CHARGE_PERIOD);
        decayTask = Bukkit.getScheduler().runTaskTimer(plugin, chiming::tickDecay, TASK_CHIMING_DECAY_PERIOD, TASK_CHIMING_DECAY_PERIOD);
        ringTask = Bukkit.getScheduler().runTaskTimer(plugin, chiming::tickRingDisplay, TASK_RING_PERIOD, TASK_RING_PERIOD);
        trackTask(chargeTask);
        trackTask(decayTask);
        trackTask(ringTask);
    }

    private void cancelAllTasks() {
        if (chargeTask != null) {
            chargeTask.cancel();
            chargeTask = null;
        }
        if (decayTask != null) {
            decayTask.cancel();
            decayTask = null;
        }
        if (ringTask != null) {
            ringTask.cancel();
            ringTask = null;
        }
        for (BukkitTask t : new HashSet<>(trackedTasks)) {
            try {
                t.cancel();
            } catch (Throwable ignored) {
            }
        }
        trackedTasks.clear();
    }

    // -------------------------------------------------------------------------
    // GltcItemLogic — right-click ritual
    // -------------------------------------------------------------------------

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        if (player == null || !isHoldingItem(player)) {
            return false;
        }
        try {
            castDreamRitual(player);
        } catch (Throwable t) {
            GltcPlugin plugin = GltcPlugin.getInstance();
            if (plugin != null) {
                plugin.getLogger().log(Level.WARNING, "[咀梦] onUse异常", t);
            }
        }
        return true;
    }

    // -------------------------------------------------------------------------
    // Listeners
    // -------------------------------------------------------------------------

    @EventHandler(priority = EventPriority.NORMAL)
    public void onInteract(PlayerInteractEvent event) {
        Action action = event.getAction();
        if (action != Action.LEFT_CLICK_AIR && action != Action.LEFT_CLICK_BLOCK) {
            return;
        }
        if (event.getHand() != EquipmentSlot.HAND) {
            return;
        }
        Player player = event.getPlayer();
        if (!isHoldingItem(player)) {
            return;
        }
        event.setCancelled(true);
        onLeftClickCharge(player);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onEntityHitCharge(EntityDamageByEntityEvent event) {
        if (!(event.getDamager() instanceof Player player)) {
            return;
        }
        if (!isHoldingItem(player)) {
            return;
        }
        onLeftClickCharge(player);
    }

    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void onDragonDamage(EntityDamageEvent event) {
        if (event.getEntity().hasMetadata(META_DRAGON)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onChimingDamaged(EntityDamageEvent event) {
        try {
            Entity entity = event.getEntity();
            if (!(entity instanceof LivingEntity living) || living.isDead()) {
                return;
            }
            if (living.hasMetadata(META_CHIMING_EXTRA)) {
                return;
            }
            if (living.hasMetadata(META_ZHU_LING) || living.hasMetadata(META_DRAGON)) {
                return;
            }
            EntityDamageEvent.DamageCause cause = event.getCause();
            if (cause != null && CHIMING_EXTRA_BLOCKED.contains(cause)) {
                return;
            }
            int stacks = chiming.getStacks(living);
            if (stacks <= 0) {
                return;
            }
            double extra = stacks * CHIMING_EXTRA_FACTOR * GltcAbilityPower.getSit();
            if (extra <= 0) {
                return;
            }
            JiumeFx.setMeta(living, META_CHIMING_EXTRA, true);
            try {
                living.setNoDamageTicks(0);
                living.damage(extra);
            } finally {
                JiumeFx.removeMeta(living, META_CHIMING_EXTRA);
            }
        } catch (Throwable ignored) {
        }
    }

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onEntityDeath(EntityDeathEvent event) {
        try {
            LivingEntity entity = event.getEntity();
            if (entity.hasMetadata(META_DRAGON)) {
                try {
                    event.getDrops().clear();
                } catch (Throwable ignored) {
                }
                try {
                    event.setDroppedExp(0);
                } catch (Throwable ignored) {
                }
                try {
                    event.setCancelled(true);
                } catch (Throwable ignored) {
                }
                JiumeDragon.muteDragonSoundsNear(entity.getWorld(), entity.getLocation());
                if (entity instanceof org.bukkit.entity.EnderDragon dragon) {
                    JiumeDragon.silentRemoveDragon(dragon, entity.getWorld(), entity.getLocation());
                } else {
                    try {
                        entity.remove();
                    } catch (Throwable ignored) {
                    }
                }
                return;
            }
            if (entity.hasMetadata(META_ZHU_LING)) {
                try {
                    event.getDrops().clear();
                } catch (Throwable ignored) {
                }
                try {
                    event.setDroppedExp(0);
                } catch (Throwable ignored) {
                }
                return;
            }
            if (entity instanceof Player) {
                return;
            }

            Location deathLoc = entity.getLocation();
            int stacks = chiming.getStacks(entity);
            boolean chimingDeathHandled = false;

            if (CHIMING_DEATH_ZHU_LING_ENABLED && stacks > 0) {
                chiming.clear(entity);
                for (Player holder : Bukkit.getOnlinePlayers()) {
                    if (!isHoldingItem(holder)) {
                        continue;
                    }
                    if (!holder.getWorld().equals(deathLoc.getWorld())) {
                        continue;
                    }
                    if (!JiumeFx.inPlayerView(holder, deathLoc, DEATH_PASSIVE_RANGE, DEATH_PASSIVE_FOV_DEG)) {
                        continue;
                    }
                    JiumeZhuLing.spawnBurstAtPlayer(holder, stacks, CHIMING_DEATH_BYPASS_MAX);
                    chimingDeathHandled = true;
                }
            } else if (stacks > 0) {
                chiming.clear(entity);
            }

            if (!DEATH_PASSIVE_ENABLED) {
                return;
            }
            if (chimingDeathHandled && CHIMING_DEATH_SKIP_PASSIVE) {
                return;
            }

            for (Player player : Bukkit.getOnlinePlayers()) {
                if (!isHoldingItem(player)) {
                    continue;
                }
                if (!player.getWorld().equals(deathLoc.getWorld())) {
                    continue;
                }
                if (!JiumeFx.inPlayerView(player, deathLoc, DEATH_PASSIVE_RANGE, DEATH_PASSIVE_FOV_DEG)) {
                    continue;
                }
                JiumeZhuLing.spawnBurstAtPlayer(player, 1, false);
            }
        } catch (Throwable ignored) {
        }
    }

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onDragonExplode(EntityExplodeEvent event) {
        if (event.getEntity().hasMetadata(META_DRAGON)) {
            event.setCancelled(true);
            try {
                event.blockList().clear();
            } catch (Throwable ignored) {
            }
        }
    }

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onDragonChangeBlock(EntityChangeBlockEvent event) {
        if (event.getEntity().hasMetadata(META_DRAGON)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onItemHeld(PlayerItemHeldEvent event) {
        Player player = event.getPlayer();
        ItemStack prev = player.getInventory().getItem(event.getPreviousSlot());
        if (!wasHolding(prev)) {
            return;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        JiumeFx.track(new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    if (!isHoldingItem(player)) {
                        holdingTrackMap.put(uuid, false);
                        onPlayerUnequipWeapon(player);
                    }
                } catch (Throwable ignored) {
                }
            }
        }.runTaskLater(plugin, 1));
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        onPlayerQuit(event.getPlayer());
    }

    // -------------------------------------------------------------------------
    // Charge
    // -------------------------------------------------------------------------

    private void onLeftClickCharge(Player player) {
        UUID uuid = player.getUniqueId();
        Integer progress = chargeProgressMap.get(uuid);
        if (progress != null && progress > 0) {
            return;
        }
        chargeProgressMap.put(uuid, 1);
        GunCombat.sendActionBar(player, buildChargeBar(1, false));
        JiumeFx.playSoundAt(player.getWorld(), player.getLocation(),
            CHARGE_START_SOUND, CHARGE_START_SOUND_VOL, CHARGE_START_SOUND_PITCH);
        playChargeStartFx(player);
    }

    private void playChargeStartFx(Player player) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        World world = player.getWorld();
        Location feet = player.getLocation().clone();
        Location center = player.getLocation().clone().add(0, player.getHeight() * 0.5, 0);
        double radius = CHARGE_FX_CHERRY_RADIUS;
        double ox = CHARGE_FX_OFFSET_X * 2;
        double oy = CHARGE_FX_OFFSET_Y * 2;

        for (int i = 0; i < CHARGE_FX_CHERRY_COUNT; i++) {
            double theta = Math.random() * Math.PI * 2;
            double phi = Math.acos(2 * Math.random() - 1);
            double r = radius * Math.cbrt(Math.random());
            Location p = new Location(
                world,
                center.getX() + r * Math.sin(phi) * Math.cos(theta) + (Math.random() - 0.5) * ox,
                center.getY() + r * Math.cos(phi) + (Math.random() - 0.5) * oy,
                center.getZ() + r * Math.sin(phi) * Math.sin(theta)
            );
            JiumeFx.spawnCherry(world, p, CHARGE_FX_CHERRY_PER_POINT,
                CHARGE_FX_CHERRY_SPREAD, CHARGE_FX_CHERRY_SPREAD, CHARGE_FX_CHERRY_SPREAD, 0.0);
        }
        JiumeFx.playSoundAt(world, center, CHARGE_FX_SOUND_CHERRY_1, 1.0f, 1.25f);
        JiumeFx.playSoundAt(world, center, CHARGE_FX_SOUND_CHERRY_2, 0.9f, 1.05f);

        Location burstFeet = feet.clone().add(0, CHARGE_FX_BURST_Y, 0);
        if (plugin != null) {
            JiumeFx.track(new BukkitRunnable() {
                @Override
                public void run() {
                    try {
                        JiumeFx.spawnDust(world, burstFeet, 55, 1.1, 0.35, 1.1, 0.08, JiumeFx.PURPLE_BIG);
                        JiumeFx.spawnDust(world, burstFeet, 40, 0.9, 0.25, 0.9, 0.12, JiumeFx.PURPLE_DUST);
                        JiumeFx.spawnDust(world, burstFeet, 25, 0.7, 0.45, 0.7, 0.05, JiumeFx.LIGHT_PURPLE);
                        if (JiumeFx.EXPLOSION != null) {
                            try {
                                world.spawnParticle(JiumeFx.EXPLOSION, burstFeet, 2, 0.35, 0.15, 0.35, 0);
                            } catch (Throwable ignored) {
                            }
                        }
                        world.spawnParticle(Particle.CLOUD, burstFeet, 18, 0.7, 0.2, 0.7, 0.04);
                        JiumeFx.playSoundAt(world, burstFeet, CHARGE_FX_SOUND_BURST_1, 0.85f, 1.25f);
                        JiumeFx.playSoundAt(world, burstFeet, CHARGE_FX_SOUND_BURST_2, 0.9f, 0.7f);
                    } catch (Throwable ignored) {
                    }
                }
            }.runTaskLater(plugin, CHARGE_FX_BURST_DELAY_TICKS));
        }
    }

    private void autoReleaseZhuLing(Player player) {
        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        Long last = leftReleaseCdMap.get(uuid);
        if (last != null && (now - last) < CHARGE_RELEASE_CD_MS) {
            resetCharge(uuid);
            return;
        }
        leftReleaseCdMap.put(uuid, now);
        resetCharge(uuid);
        GunCombat.sendActionBar(player, CHARGE_BAR_COLOR_FULL + "◆◆◆◆◆◆◆◆◆◆");
        JiumeFx.playSoundAt(player.getWorld(), player.getLocation(),
            CHARGE_FULL_SOUND, CHARGE_FULL_SOUND_VOL, CHARGE_FULL_SOUND_PITCH);
        JiumeFx.playSoundForPlayer(player, player.getLocation(),
            CHARGE_RELEASE_SPLASH_SOUND, CHARGE_RELEASE_SPLASH_VOL, CHARGE_RELEASE_SPLASH_PITCH);
        Location spawnAt = player.getLocation().clone()
            .add(0, player.getHeight() + ZHU_LING_SPAWN_ABOVE_HEAD, 0);
        JiumeZhuLing.summon(player, spawnAt, player, false);
    }

    private void tickChargeBars() {
        for (Player player : Bukkit.getOnlinePlayers()) {
            UUID uuid = player.getUniqueId();
            boolean holding = isHoldingItem(player);
            boolean wasHolding = Boolean.TRUE.equals(holdingTrackMap.get(uuid));

            if (wasHolding && !holding) {
                onPlayerUnequipWeapon(player);
                Integer p = chargeProgressMap.get(uuid);
                if (p != null && p > 0) {
                    resetCharge(uuid);
                    GunCombat.sendActionBar(player, " ");
                }
            }
            holdingTrackMap.put(uuid, holding);

            if (!holding) {
                Integer p = chargeProgressMap.get(uuid);
                if (p != null && p > 0) {
                    resetCharge(uuid);
                    GunCombat.sendActionBar(player, " ");
                }
                continue;
            }

            int progress = chargeProgressMap.getOrDefault(uuid, 0);
            if (progress <= 0) {
                continue;
            }
            progress++;
            if (progress >= CHARGE_TICKS) {
                autoReleaseZhuLing(player);
            } else {
                chargeProgressMap.put(uuid, progress);
                GunCombat.sendActionBar(player, buildChargeBar(progress, false));
            }
        }
    }

    private static String buildChargeBar(int progress, boolean full) {
        int filled = (int) Math.floor((progress / (double) CHARGE_TICKS) * CHARGE_SEGMENTS);
        if (filled > CHARGE_SEGMENTS) {
            filled = CHARGE_SEGMENTS;
        }
        String color = full ? CHARGE_BAR_COLOR_FULL : CHARGE_BAR_COLOR_CHARGING;
        StringBuilder bar = new StringBuilder(color);
        for (int i = 0; i < filled; i++) {
            bar.append('◆');
        }
        return bar.length() > color.length() ? bar.toString() : CHARGE_BAR_EMPTY;
    }

    private void resetCharge(UUID uuid) {
        chargeProgressMap.put(uuid, 0);
    }

    // -------------------------------------------------------------------------
    // Ritual
    // -------------------------------------------------------------------------

    private void castDreamRitual(Player player) {
        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        Long last = ritualCdMap.get(uuid);
        if (last != null && (now - last) < RITUAL_CD_MS) {
            return;
        }
        ritualCdMap.put(uuid, now);

        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        int power = GltcAbilityPower.getSit();
        int count = 0;
        int dragonCount = 0;
        double ritualTotalDmg = 0;

        for (Entity e : world.getNearbyEntities(eye, RITUAL_RANGE, RITUAL_RANGE, RITUAL_RANGE)) {
            if (!(e instanceof LivingEntity ent) || ent.isDead()) {
                continue;
            }
            if (ent.getUniqueId().equals(uuid)) {
                continue;
            }
            if (ent.hasMetadata(META_ZHU_LING) || ent.hasMetadata(META_DRAGON)) {
                continue;
            }
            Location center = ent.getLocation().add(0, ent.getHeight() * 0.5, 0);
            if (!JiumeFx.inPlayerView(player, center, RITUAL_RANGE, RITUAL_FOV_DEG)) {
                continue;
            }
            int stacks = chiming.getStacksForOwner(ent, player);
            if (stacks <= 0) {
                continue;
            }

            double dmg = stacks * RITUAL_DAMAGE_FACTOR * power;
            boolean needDragon = stacks >= CHIMING_DRAGON_STACKS;
            chiming.consumeForOwner(ent, player);

            if (needDragon) {
                dragonCount++;
                JiumeDragon.summonFeastDragon(player, ent);
            }

            Vector savedVel = null;
            if (needDragon) {
                try {
                    savedVel = ent.getVelocity().clone();
                } catch (Throwable ignored) {
                }
            }
            ent.setNoDamageTicks(0);
            ent.damage(dmg, player);
            if (savedVel != null && !ent.isDead()) {
                JiumeFx.restoreEntityVelocity(ent, savedVel, 1);
            }
            ritualTotalDmg += dmg;
            count++;

            JiumeFx.spawnCherry(world, center, 25, 0.5, 0.5, 0.5, 0.03);
            JiumeFx.spawnDust(world, center, 30, 0.55, 0.55, 0.55, 0, JiumeFx.PURPLE_BIG);
            JiumeFx.playSoundAt(world, center, RITUAL_HIT_SOUND, 0.7f, 1.4f);
        }

        JiumeFx.playSoundAt(world, eye, RITUAL_SOUND_1, 1.0f, 0.7f);
        JiumeFx.playSoundAt(world, eye, RITUAL_SOUND_2, 0.9f, 0.8f);
        if (count > 0) {
            GltcDamageNotify.notifyAbilityDamageSummary(
                player, player.getInventory().getItemInMainHand(), ritualTotalDmg, count);
            String bar = MSG_RITUAL_OK_PREFIX + count + MSG_RITUAL_OK_MID
                + (dragonCount > 0 ? (MSG_RITUAL_DRAGON_SUFFIX + dragonCount) : "");
            GunCombat.sendActionBar(player, bar);
        } else {
            GunCombat.sendActionBar(player, MSG_RITUAL_NONE);
        }
    }

    // -------------------------------------------------------------------------
    // Cleanup helpers
    // -------------------------------------------------------------------------

    private void onPlayerUnequipWeapon(Player player) {
        if (!CHIMING_CLEAR_ON_UNEQUIP || player == null) {
            return;
        }
        try {
            chiming.clearOwnedBy(player.getUniqueId());
        } catch (Throwable ignored) {
        }
    }

    private void onPlayerQuit(Player player) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        chargeProgressMap.remove(uuid);
        leftReleaseCdMap.remove(uuid);
        ritualCdMap.remove(uuid);
        holdingTrackMap.remove(uuid);
        JiumeZhuLing.clearCount(uuid);
        try {
            chiming.clearOwnedBy(uuid);
        } catch (Throwable ignored) {
        }
    }

    static boolean isHoldingItem(Player player) {
        if (player == null || !player.isOnline()) {
            return false;
        }
        return wasHolding(player.getInventory().getItemInMainHand());
    }

    private static boolean wasHolding(ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        SlimefunItem sfItem = SlimefunItem.getByItem(stack);
        return sfItem != null && ITEM_ID.equals(sfItem.getId());
    }
}
