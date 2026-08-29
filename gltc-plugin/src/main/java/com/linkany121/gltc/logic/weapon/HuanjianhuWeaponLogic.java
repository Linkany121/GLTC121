package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.gun.GunCombat;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.boss.BarColor;
import org.bukkit.boss.BarStyle;
import org.bukkit.boss.BossBar;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** {@code FKR_隐兰狂玉唤剑葫} — 剑光 / 焰眸 / 心霆 / 剑霆. */
public final class HuanjianhuWeaponLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "FKR_隐兰狂玉唤剑葫";
    public static final String META_ABILITY_DAMAGE = "gltc_huanjianhu_ability_damage";

    // ===== 配置区（FKR_隐兰狂玉唤剑葫，改完需重新打包 jar 并重启生效）=====
    // --- 心霆（左键积攒 → 化剑状态）---
    public static final int XINTING_MAX = 9;              // 心霆层数上限（9 层满后左键进入化剑状态）
    public static final int XINTING_DECAY_TICKS = 80;     // 每多少 tick 衰减一层心霆（80 = 4 秒一层）
    public static final int XINTING_STATE_TICKS = 200;    // 化剑状态持续时长（tick），200 = 10 秒
    public static final int XINTING_LEVITATION_LEVEL = 1; // 化剑状态施加的失重等级
    public static final int XINTING_SLOW_FALL_TICKS = 300; // 化剑状态缓降时长（tick），300 = 15 秒
    public static final int XINTING_SLOW_FALL_LEVEL = 0;  // 化剑状态缓降等级

    public static final double AOE_RADIUS = 3;            // 化剑期间攻击的 AOE 半径（格）

    // --- 剑光（普攻）---
    public static final double SIT_JIANGUANG_MULT = 7;    // 剑光伤害倍率
    public static final double JIANGUANG_RANGE = 26;      // 剑光射程（格）
    public static final double JIANGUANG_SWORD_DROP_HEIGHT = 10;  // 剑光光剑坠落的起始高度（格）
    public static final int JIANGUANG_SWORD_DROP_TICK = 8;       // 剑光光剑下落用时（tick）
    public static final long JIANGUANG_CD_MS = 300;       // 剑光冷却（毫秒），300 = 0.3 秒

    // --- 焰眸（潜行右键）---
    public static final long YANMOU_COOLDOWN_MS = 6000;   // 焰眸冷却（毫秒），6000 = 6 秒
    public static final int YANMOU_INTERVAL_TICK = 10;    // 每多少 tick 召唤一批剑（10 = 0.5 秒）
    public static final int YANMOU_DURATION_TICK = 60;    // 焰眸总共持续时长（tick），60 = 3 秒
    public static final double SIT_YANMOU_TOTAL_MULT = 50; // 焰眸总伤害倍率（分摊到每把剑）
    public static final double YANMOU_FORWARD = 15;       // 焰眸瞄准点相对玩家的前方距离（格）
    public static final double YANMOU_HEIGHT_ABOVE = 15;  // 剑群生成高度相对瞄准点（格）
    public static final double YANMOU_RADIUS = 7.5;       // 剑群散布半径（格）
    public static final int YANMOU_SWORD_DROP_TICK = 10;  // 剑落下动画用时（tick）
    public static final int YANMOU_CAST_TICK = 10;        // 施法前摇（tick）

    // --- 剑霆（重击）---
    public static final double SIT_JIANTING_MULT = 10;    // 剑霆伤害倍率
    public static final double JIANTING_RANGE = 32;       // 剑霆作用半径（格）
    public static final double JIANTING_AOE_RADIUS = 5;   // 每道雷的 AOE 半径（格）
    public static final int JIANTING_RAY_COUNT = 24;      // 剑霆射线数量（越多越密集）
    public static final int JIANTING_RAY_LENGTH = 3;      // 每道雷射线长度（格）
    public static final double JIANTING_RAY_STEP = 1;     // 每道雷射线步长（格）
    public static final int JIANTING_THUNDER_COUNT = 6;   // 落雷数量

    public static final String MSG_XINTING_BAR_STACK = "§c[心霆] §f{stacks}/{max}";
    public static final String MSG_XINTING_BAR_STATE = "§c[此身既化剑，心跳响雷鼓！] §f{secs}秒";
    public static final String MSG_XINTING_TITLE = "§c[此身既化剑，心跳响雷鼓！]";
    public static final String MSG_XINTING_SUBTITLE = "§7无尽雷霆斥己身！";
    public static final String MSG_XINTING_STACK_GAINED = "§c[心霆] §f{stacks}/{max}";
    public static final String MSG_XINTING_ACTIVATED = "§c此身既化剑，心跳响雷鼓！";
    public static final String MSG_XINTING_ENDED = "§b万敌既死，奔雷还空。";
    public static final String MSG_XINTING_RIGHT_BLOCKED = "§7无尽雷霆斥己身！";
    public static final String MSG_FLAME_EYE_COOLDOWN = "§c焰眸冷却中... {secs}秒";

    private static HuanjianhuWeaponLogic instance;

    private final Map<UUID, Integer> xinTingStacks = new ConcurrentHashMap<>();
    private final Map<UUID, Integer> xinTingState = new ConcurrentHashMap<>();
    private final Map<UUID, Integer> xinTingDecayTick = new ConcurrentHashMap<>();
    private final Map<UUID, BossBar> xinTingBar = new ConcurrentHashMap<>();
    private final Map<UUID, Long> yanmouCd = new ConcurrentHashMap<>();
    private final Map<UUID, Long> leftClickCd = new ConcurrentHashMap<>();
    private final Map<UUID, BukkitTask> xinTingStateTasks = new ConcurrentHashMap<>();

    private BukkitTask decayTask;
    private BukkitTask barTicker;
    private GltcPlugin plugin;

    public static HuanjianhuWeaponLogic getInstance() {
        return instance;
    }

    public void register(GltcPlugin plugin) {
        unregister();
        this.plugin = plugin;
        instance = this;
        Bukkit.getPluginManager().registerEvents(this, plugin);
        startXinTingDecay();
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        if (decayTask != null) {
            decayTask.cancel();
            decayTask = null;
        }
        stopBarTicker();
        for (BukkitTask t : xinTingStateTasks.values()) {
            t.cancel();
        }
        xinTingStateTasks.clear();
        HuanjianhuYanmou.clearAll();
        for (UUID id : new HashSet<>(xinTingBar.keySet())) {
            removeXinTingBar(id);
        }
        xinTingStacks.clear();
        xinTingState.clear();
        xinTingDecayTick.clear();
        yanmouCd.clear();
        leftClickCd.clear();
        if (instance == this) {
            instance = null;
        }
        plugin = null;
    }

    public static Map<UUID, Long> yanmouCdMap() {
        return instance != null ? instance.yanmouCd : Map.of();
    }

    public static void addXinTingStack(Player player) {
        if (instance == null || player == null) {
            return;
        }
        instance.doAddXinTingStack(player);
    }

    public static boolean isXinTingState(Player player) {
        if (instance == null || player == null) {
            return false;
        }
        Integer left = instance.xinTingState.get(player.getUniqueId());
        return left != null && left > 0;
    }

    private void doAddXinTingStack(Player player) {
        UUID uuid = player.getUniqueId();
        int stacks = xinTingStacks.getOrDefault(uuid, 0) + 1;
        if (stacks >= XINTING_MAX) {
            xinTingStacks.put(uuid, 0);
            triggerXinTingState(player);
        } else {
            xinTingStacks.put(uuid, stacks);
            updateXinTingBar(uuid, player, stacks);
            GunCombat.sendActionBar(player, fmt(MSG_XINTING_STACK_GAINED, stacks, XINTING_MAX));
        }
    }

    private void triggerXinTingState(Player player) {
        UUID uuid = player.getUniqueId();
        player.addPotionEffect(new PotionEffect(
            PotionEffectType.LEVITATION, XINTING_STATE_TICKS, XINTING_LEVITATION_LEVEL, true, false, false
        ));
        player.addPotionEffect(new PotionEffect(
            PotionEffectType.SLOW_FALLING, XINTING_SLOW_FALL_TICKS, XINTING_SLOW_FALL_LEVEL, true, false, false
        ));
        xinTingState.put(uuid, XINTING_STATE_TICKS);
        xinTingStacks.put(uuid, 0);
        xinTingDecayTick.remove(uuid);

        BossBar stateBar = xinTingBar.get(uuid);
        if (stateBar == null) {
            stateBar = Bukkit.createBossBar(fmtState(10), BarColor.PURPLE, BarStyle.SOLID);
            xinTingBar.put(uuid, stateBar);
        }
        stateBar.addPlayer(player);
        stateBar.setColor(BarColor.PURPLE);
        stateBar.setTitle(fmtState(10));
        stateBar.setProgress(1.0);
        stateBar.setVisible(true);
        startBarTicker();

        player.sendTitle(MSG_XINTING_TITLE, MSG_XINTING_SUBTITLE, 10, 70, 20);
        GunCombat.sendActionBar(player, MSG_XINTING_ACTIVATED);
        player.getWorld().playSound(player.getLocation(), "block.beacon.power_select", 1.0f, 1.2f);
        player.getWorld().playSound(player.getLocation(), "entity.lightning_bolt.thunder", 1.0f, 1.0f);
        HuanjianhuFx.spawnDust(
            player.getWorld(), player.getLocation().add(0, 1, 0),
            200, 2, 2, 2, 0, HuanjianhuFx.THUNDER_DUST
        );
        player.getWorld().spawnParticle(
            Particle.ELECTRIC_SPARK, player.getLocation().add(0, 1, 0), 60, 2, 2, 2, 0.05
        );

        BukkitTask old = xinTingStateTasks.remove(uuid);
        if (old != null) {
            old.cancel();
        }
        if (plugin == null) {
            return;
        }
        final int[] left = {XINTING_STATE_TICKS};
        BukkitTask task = new BukkitRunnable() {
            @Override
            public void run() {
                if (!player.isOnline()) {
                    xinTingState.remove(uuid);
                    cancel();
                    xinTingStateTasks.remove(uuid);
                    return;
                }
                left[0]--;
                xinTingState.put(uuid, left[0]);
                if (left[0] <= 0) {
                    xinTingState.remove(uuid);
                    GunCombat.sendActionBar(player, MSG_XINTING_ENDED);
                    cancel();
                    xinTingStateTasks.remove(uuid);
                } else if (left[0] % 20 == 0) {
                    player.getWorld().spawnParticle(
                        Particle.ELECTRIC_SPARK, player.getLocation().add(0, 1, 0), 20, 1.2, 1.2, 1.2, 0.03
                    );
                }
            }
        }.runTaskTimer(plugin, 0L, 1L);
        xinTingStateTasks.put(uuid, task);
    }

    private void startXinTingDecay() {
        if (plugin == null) {
            return;
        }
        if (decayTask != null) {
            decayTask.cancel();
        }
        decayTask = new BukkitRunnable() {
            @Override
            public void run() {
                Iterator<Map.Entry<UUID, Integer>> it = xinTingStacks.entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry<UUID, Integer> entry = it.next();
                    int stacks = entry.getValue();
                    if (stacks <= 0) {
                        continue;
                    }
                    stacks--;
                    UUID uuid = entry.getKey();
                    if (stacks <= 0) {
                        entry.setValue(0);
                        xinTingDecayTick.remove(uuid);
                        removeXinTingBar(uuid);
                    } else {
                        entry.setValue(stacks);
                        xinTingDecayTick.put(uuid, 0);
                        Player player = Bukkit.getPlayer(uuid);
                        if (player != null && player.isOnline()) {
                            updateXinTingBar(uuid, player, stacks);
                        }
                    }
                }
            }
        }.runTaskTimer(plugin, XINTING_DECAY_TICKS, XINTING_DECAY_TICKS);
    }

    private void updateXinTingBar(UUID uuid, Player player, int stacks) {
        BossBar bar = xinTingBar.get(uuid);
        if (bar == null) {
            bar = Bukkit.createBossBar(fmt(MSG_XINTING_BAR_STACK, stacks, XINTING_MAX), BarColor.RED, BarStyle.SOLID);
            xinTingBar.put(uuid, bar);
        }
        try {
            bar.removeAll();
        } catch (Throwable ignored) {
        }
        bar.addPlayer(player);
        bar.setTitle(fmt(MSG_XINTING_BAR_STACK, stacks, XINTING_MAX));
        bar.setColor(BarColor.RED);
        bar.setProgress(1.0);
        bar.setVisible(true);
        startBarTicker();
    }

    private void startBarTicker() {
        if (plugin == null) {
            return;
        }
        if (barTicker != null) {
            return;
        }
        barTicker = new BukkitRunnable() {
            @Override
            public void run() {
                if (xinTingBar.isEmpty()) {
                    stopBarTicker();
                    return;
                }
                for (UUID uuid : new HashSet<>(xinTingBar.keySet())) {
                    BossBar bar = xinTingBar.get(uuid);
                    if (bar == null) {
                        continue;
                    }
                    Player player = Bukkit.getPlayer(uuid);
                    if (player == null || !player.isOnline()) {
                        removeXinTingBar(uuid);
                        continue;
                    }
                    int left = xinTingState.getOrDefault(uuid, 0);
                    if (left > 0) {
                        int secs = Math.max(1, (int) Math.ceil(left / 20.0));
                        bar.setColor(BarColor.PURPLE);
                        bar.setTitle(fmtState(secs));
                        bar.setProgress(Math.max(0.05, Math.min(1.0, left / (double) XINTING_STATE_TICKS)));
                        bar.setVisible(true);
                        bar.addPlayer(player);
                    } else {
                        int stacks = xinTingStacks.getOrDefault(uuid, 0);
                        if (stacks <= 0) {
                            removeXinTingBar(uuid);
                            continue;
                        }
                        int decayTick = xinTingDecayTick.getOrDefault(uuid, 0);
                        double prog = 1.0 - (decayTick / (double) XINTING_DECAY_TICKS);
                        bar.setColor(BarColor.RED);
                        bar.setTitle(fmt(MSG_XINTING_BAR_STACK, stacks, XINTING_MAX));
                        bar.setProgress(Math.max(0.05, Math.min(1.0, prog)));
                        bar.setVisible(true);
                        bar.addPlayer(player);
                        xinTingDecayTick.put(uuid, decayTick + 1);
                    }
                }
                if (xinTingBar.isEmpty()) {
                    stopBarTicker();
                }
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    private void stopBarTicker() {
        if (barTicker != null) {
            barTicker.cancel();
            barTicker = null;
        }
    }

    private void removeXinTingBar(UUID uuid) {
        BossBar bar = xinTingBar.remove(uuid);
        if (bar != null) {
            bar.removeAll();
            bar.setVisible(false);
        }
        if (xinTingBar.isEmpty()) {
            stopBarTicker();
        }
    }

    private void clearWeaponState(Player player) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        xinTingStacks.remove(uuid);
        xinTingState.remove(uuid);
        xinTingDecayTick.remove(uuid);
        leftClickCd.remove(uuid);
        yanmouCd.remove(uuid);
        HuanjianhuYanmou.cancelTask(uuid);
        BukkitTask st = xinTingStateTasks.remove(uuid);
        if (st != null) {
            st.cancel();
        }
        removeXinTingBar(uuid);
    }

    private static boolean isHolding(Player player) {
        return isHuanjianhu(player.getInventory().getItemInMainHand());
    }

    private static boolean isHuanjianhu(ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        if (sf != null) {
            String id = sf.getId();
            if (ITEM_ID.equals(id) || id.endsWith(ITEM_ID) || id.contains("隐兰狂玉唤剑葫")) {
                return true;
            }
        }
        try {
            if (stack.hasItemMeta() && stack.getItemMeta().hasDisplayName()
                && stack.getItemMeta().getDisplayName().contains("唤剑葫")) {
                return true;
            }
        } catch (Throwable ignored) {
        }
        return false;
    }

    private void handleLeftClick(Player player) {
        if (player == null || !player.isOnline()) {
            return;
        }
        if (player.hasMetadata(META_ABILITY_DAMAGE)) {
            return;
        }
        if (!isHolding(player)) {
            return;
        }
        long now = System.currentTimeMillis();
        Long last = leftClickCd.get(player.getUniqueId());
        if (last != null && now - last < JIANGUANG_CD_MS) {
            return;
        }
        leftClickCd.put(player.getUniqueId(), now);
        try {
            if (isXinTingState(player)) {
                HuanjianhuJianting.cast(player);
            } else {
                HuanjianhuJianguang.cast(player);
            }
        } catch (Throwable t) {
            if (plugin != null) {
                plugin.getLogger().warning("[隐兰狂玉唤剑葫] 左键施展异常: " + t.getMessage());
            }
        }
    }

    private void handleRightClick(Player player) {
        if (player == null || !player.isOnline() || !isHolding(player)) {
            return;
        }
        if (isXinTingState(player)) {
            GunCombat.sendActionBar(player, MSG_XINTING_RIGHT_BLOCKED);
            return;
        }
        HuanjianhuYanmou.cast(player, yanmouCd);
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        handleRightClick(event.getPlayer());
        return true;
    }

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onInteract(PlayerInteractEvent event) {
        if (event.getHand() != EquipmentSlot.HAND) {
            return;
        }
        Player player = event.getPlayer();
        if (!isHolding(player)) {
            return;
        }
        Action action = event.getAction();
        if (action == Action.LEFT_CLICK_AIR || action == Action.LEFT_CLICK_BLOCK) {
            // 只要左键（含点击空气/方块）即触发，不依赖命中敌人。
            // 与 隐兰狂玉唤剑葫.js 一致：HIGHEST 优先级且不忽略已取消事件。
            handleLeftClick(player);
            return;
        }
        if (action == Action.RIGHT_CLICK_AIR || action == Action.RIGHT_CLICK_BLOCK) {
            event.setCancelled(true);
            handleRightClick(player);
        }
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onMelee(EntityDamageByEntityEvent event) {
        if (!(event.getDamager() instanceof Player player)) {
            return;
        }
        if (player.hasMetadata(META_ABILITY_DAMAGE)) {
            return;
        }
        if (!isHolding(player)) {
            return;
        }
        handleLeftClick(player);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onHeld(PlayerItemHeldEvent event) {
        ItemStack prev = event.getPlayer().getInventory().getItem(event.getPreviousSlot());
        if (isHuanjianhu(prev)) {
            clearWeaponState(event.getPlayer());
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        clearWeaponState(event.getPlayer());
    }

    private static String fmt(String tpl, int stacks, int max) {
        return tpl.replace("{stacks}", String.valueOf(stacks)).replace("{max}", String.valueOf(max));
    }

    private static String fmtState(int secs) {
        return MSG_XINTING_BAR_STATE.replace("{secs}", String.valueOf(secs));
    }
}
