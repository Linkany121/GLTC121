package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.boss.BarColor;
import org.bukkit.boss.BarStyle;
import org.bukkit.boss.BossBar;
import org.bukkit.block.Block;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
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
import org.bukkit.metadata.FixedMetadataValue;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/**
 * {@code FKR_风墟龙冕} — air slash / wind vein / vertical qi port of {@code 武器/风墟龙冕.js}.
 */
public final class FengxuWeaponLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "FKR_风墟龙冕";

    private static final String META_SWORD_QI_DAMAGE = "fx_sword_qi_damage";

    // ===== 配置区（FKR_风墟龙冕，改完需重新打包 jar 并重启生效）=====
    // === 气斩参数（左/右键横扫）===
    private static final long AIR_SLASH_COOLDOWN_MS = 500;          // 气斩冷却（毫秒），500 = 0.5 秒
    private static final double SIT_AIR_SLASH_MULT = 4;             // 气斩伤害倍率，实际伤害 = GltcAbilityPower.calcDamage(此值)
    private static final double AIR_SLASH_SPEED = 1.1;              // 气斩飞行速度（格/tick）
    private static final double AIR_SLASH_RANGE = 16;               // 气斩最大射程（格）
    private static final double AIR_SLASH_HALF_LENGTH_START = 0.5;  // 剑气初始半长（格，飞行中逐渐变长）
    private static final double AIR_SLASH_HALF_LENGTH_MAX = 4;      // 剑气最大半长（格）
    private static final double AIR_SLASH_GROW_DISTANCE = 16;       // 剑气在多少格飞行距离内长满
    private static final int AIR_SLASH_LEVITATION_TICKS = 10;       // 命中后的失重时长（tick）
    private static final int AIR_SLASH_LEVITATION_LEVEL = 5;        // 命中后的失重等级
    private static final double AIR_SLASH_PARTICLE_GAP = 0.3;       // 剑气粒子间隔（越小越密，越耗性能）
    private static final double AIR_SLASH_CHERRY_PARTICLE_GAP = 0.1; // 樱花粒子间隔（越小越密）
    private static final int AIR_SLASH_CLOUD_COUNT = 1;             // 云粒子每点数量
    private static final double AIR_SLASH_CLOUD_OFFSET = 0.08;      // 云粒子散布偏移（格）
    private static final double AIR_SLASH_END_ROD_INTERVAL = 1.5;   // 末地烛间隔（格）
    private static final int AIR_SLASH_END_ROD_COUNT = 1;           // 末地烛每点数量

    // === 竖直剑气参数（潜行右键）===
    private static final double SIT_VERTICAL_MULT = 12;             // 竖直剑气伤害倍率
    private static final double VERTICAL_SPEED = 0.7;               // 竖直剑气上升速度（格/tick）
    private static final double VERTICAL_RANGE = 24;                // 竖直剑气作用半径（格）
    private static final double VERTICAL_HALF_HEIGHT_START = 1.5;   // 剑气初始半高（格）
    private static final double VERTICAL_HALF_HEIGHT_MAX = 7;       // 剑气最大半高（格）
    private static final double VERTICAL_GROW_DISTANCE = 24;        // 剑气长满所需的飞行距离（格）
    private static final int VERTICAL_LEVITATION_TICKS = 10;        // 命中后失重时长（tick）
    private static final int VERTICAL_LEVITATION_LEVEL = 18;        // 命中后失重等级
    private static final int VERTICAL_BLINDNESS_TICKS = 40;         // 命中后致盲时长（tick），40 = 2 秒
    private static final int VERTICAL_BLINDNESS_LEVEL = 0;          // 命中后致盲等级
    private static final double VERTICAL_PARTICLE_GAP = 0.15;       // 剑气粒子间隔（越小越密）
    private static final int VERTICAL_CLOUD_COUNT = 2;              // 云粒子每点数量
    private static final double VERTICAL_CLOUD_OFFSET = 0.03;       // 云粒子散布偏移（格）
    private static final int VERTICAL_END_ROD_COUNT = 1;            // 末地烛每点数量
    private static final double VERTICAL_END_ROD_OFFSET = 0.02;     // 末地烛散布偏移（格）

    // === 风脉系统参数 ===
    private static final int WIND_VEIN_MAX = 3;
    private static final int SPEED_DURATION_TICKS = 100;
    private static final int SPEED_UNLOCK_TICKS = 240;
    private static final int SPEED_AMPLIFIER = 1;
    private static final long WIND_VEIN_DECAY_MS = 5000;

    // === 击退参数 ===
    private static final double AIR_SLASH_KNOCKBACK = 0.6;
    private static final double VERTICAL_KNOCKBACK = 1.4;

    private static final String MSG_UNLOCK =
        "§x§f§f§f§9§6§f此§x§e§f§f§a§7§3剑§x§d§f§f§a§7§7曾§x§c§f§f§b§7§b守§x§b§f§f§c§7§f万§x§a§f§f§c§8§3仞§x§9§f§f§d§8§7群§x§8§f§f§e§8§b山§x§7§f§f§e§8§f，§x§6§f§f§f§9§3今§x§6§7§f§f§9§f朝§x§5§f§f§f§a§b—§x§5§7§f§f§b§7—§x§4§f§f§f§c§3—§x§4§6§f§f§c§f锋§x§3§e§f§f§d§b芒§x§3§6§f§f§e§7重§x§2§e§f§f§f§3现§x§2§6§f§f§f§f！";
    private static final String MSG_VERTICAL =
        "§x§f§f§8§c§4§b§l我§x§f§f§9§9§4§a§l曾§x§f§e§a§6§4§9§l屠§x§f§e§b§2§4§9§l尽§x§f§e§b§f§4§8§l，§x§f§d§c§c§4§7§l犯§x§f§d§d§9§4§6§l疆§x§f§d§e§5§4§6§l狂§x§f§c§f§2§4§5§l鳞§x§f§c§f§f§4§4§l！";
    private static final String MSG_VEIN_FULL =
        "§x§4§b§f§f§c§9风§x§4§a§f§b§c§f脉§x§4§9§f§7§d§5满§x§4§9§f§4§d§b溢§x§4§8§f§0§e§1，§x§4§7§e§c§e§7升§x§4§6§e§8§e§d龙§x§4§6§e§5§f§3解§x§4§5§e§1§f§9放§x§4§4§d§d§f§f！";

    private static final int[] AIR_SLASH_ANGLES = {0, 40, -40};
    private static final int[] VERTICAL_ANGLES = {0, -30, 30};

    private static final Particle CHERRY = resolveCherry();

    private static FengxuWeaponLogic instance;

    private final Map<UUID, Integer> angleIndexMap = new ConcurrentHashMap<>();
    private final Map<UUID, Integer> windVeinMap = new ConcurrentHashMap<>();
    private final Map<UUID, Long> windVeinDecayMap = new ConcurrentHashMap<>();
    private final Map<UUID, BossBar> windVeinBarMap = new ConcurrentHashMap<>();
    private final Map<UUID, Long> leftClickCdMap = new ConcurrentHashMap<>();
    private final Map<UUID, Boolean> cherryModeMap = new ConcurrentHashMap<>();

    private BukkitTask windVeinDecayTask;

    private FengxuWeaponLogic() {
    }

    public static void register(GltcPlugin plugin) {
        if (plugin == null) {
            return;
        }
        unregister();
        FengxuWeaponLogic logic = new FengxuWeaponLogic();
        instance = logic;
        GltcLogicRegistry.registerItem(ITEM_ID, logic);
        Bukkit.getPluginManager().registerEvents(logic, plugin);
        logic.startWindVeinDecay();
    }

    public static void unregister() {
        FengxuWeaponLogic logic = instance;
        if (logic == null) {
            return;
        }
        instance = null;
        HandlerList.unregisterAll(logic);
        if (logic.windVeinDecayTask != null) {
            logic.windVeinDecayTask.cancel();
            logic.windVeinDecayTask = null;
        }
        for (UUID uuid : new HashSet<>(logic.windVeinBarMap.keySet())) {
            logic.removeWindVeinBar(uuid);
        }
        logic.angleIndexMap.clear();
        logic.windVeinMap.clear();
        logic.windVeinDecayMap.clear();
        logic.leftClickCdMap.clear();
        logic.cherryModeMap.clear();
    }

    public static FengxuWeaponLogic getInstance() {
        return instance;
    }

    // -------------------------------------------------------------------------
    // GltcItemLogic — right-click (vertical qi / cherry toggle)
    // -------------------------------------------------------------------------

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        if (!isHoldingItem(player)) {
            return false;
        }
        UUID uuid = player.getUniqueId();

        if (player.isSneaking()) {
            boolean enabled = !isCherryMode(uuid);
            cherryModeMap.put(uuid, enabled);
            if (enabled) {
                sendActionBar(player, "§d[樱花] §f粒子特效已切换为樱花");
                try {
                    player.getWorld().spawnParticle(
                        CHERRY, player.getLocation().add(0, 1.2, 0), 24, 0.45, 0.5, 0.45, 0.02
                    );
                    player.getWorld().playSound(player.getLocation(), "block.cherry_leaves.place", 1.0f, 1.2f);
                } catch (Throwable ignored) {
                }
            } else {
                sendActionBar(player, "§b[风墟] §f粒子特效已恢复默认");
                try {
                    player.getWorld().playSound(player.getLocation(), "block.fire.extinguish", 0.7f, 1.6f);
                } catch (Throwable ignored) {
                }
            }
            return true;
        }

        int stacks = windVeinMap.getOrDefault(uuid, 0);
        if (stacks < WIND_VEIN_MAX) {
            sendActionBar(player, "§b[风脉] §7不足 §f" + stacks + "/" + WIND_VEIN_MAX);
            return true;
        }

        windVeinMap.put(uuid, 0);
        windVeinDecayMap.remove(uuid);
        removeWindVeinBar(uuid);
        releaseVerticalSwordQi(player);
        return true;
    }

    @Override
    public void onWeaponHit(EntityDamageByEntityEvent event, Player player, ItemStack item) {
        if (event.isCancelled() || !isHoldingItem(player)) {
            return;
        }
        if (event.getEntity().hasMetadata(META_SWORD_QI_DAMAGE)) {
            return;
        }
        tryAirSlash(player);
    }

    // -------------------------------------------------------------------------
    // Listener — left-click air/block + entity hit + cleanup
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
        tryAirSlash(player);
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onEntityDamage(EntityDamageByEntityEvent event) {
        if (!(event.getDamager() instanceof Player player)) {
            return;
        }
        if (!isHoldingItem(player)) {
            return;
        }
        if (event.getEntity().hasMetadata(META_SWORD_QI_DAMAGE)) {
            return;
        }
        tryAirSlash(player);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onItemHeld(PlayerItemHeldEvent event) {
        ItemStack prev = event.getPlayer().getInventory().getItem(event.getPreviousSlot());
        if (wasHolding(prev)) {
            clearWeaponState(event.getPlayer());
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        clearWeaponState(event.getPlayer());
    }

    // -------------------------------------------------------------------------
    // Air slash
    // -------------------------------------------------------------------------

    private void tryAirSlash(Player player) {
        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        Long last = leftClickCdMap.get(uuid);
        if (last != null && (now - last) < AIR_SLASH_COOLDOWN_MS) {
            return;
        }
        leftClickCdMap.put(uuid, now);

        int angleIdx = angleIndexMap.getOrDefault(uuid, 0);
        int angle = AIR_SLASH_ANGLES[angleIdx % AIR_SLASH_ANGLES.length];
        angleIndexMap.put(uuid, (angleIdx + 1) % AIR_SLASH_ANGLES.length);

        releaseAirSlash(player, angle);
    }

    private void releaseAirSlash(Player player, int angleDeg) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        World world = player.getWorld();
        Location eyeLoc = player.getEyeLocation().clone();
        Vector dir = eyeLoc.getDirection().normalize();
        boolean cherry = isCherryMode(player.getUniqueId());

        Vector worldUp = new Vector(0, 1, 0);
        Vector right = dir.clone().crossProduct(worldUp);
        if (right.lengthSquared() < 0.001) {
            right = new Vector(1, 0, 0);
        } else {
            right.normalize();
        }
        Vector up = right.clone().crossProduct(dir).normalize();

        double angleRad = angleDeg * Math.PI / 180.0;
        Vector slashDir = right.clone().multiply(Math.cos(angleRad))
            .add(up.clone().multiply(Math.sin(angleRad))).normalize();

        world.playSound(eyeLoc, "block.fire.extinguish", 1.0f, 1.6f);
        world.playSound(eyeLoc, "entity.player.attack.sweep", 0.6f, 1.8f);
        world.playSound(eyeLoc, "entity.wither.shoot", 0.8f, 1.2f);

        double[] distance = {0};
        boolean[] veinAwarded = {false};
        Set<UUID> hitEntities = new HashSet<>();

        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    if (distance[0] >= AIR_SLASH_RANGE) {
                        cancel();
                        return;
                    }

                    Location center = eyeLoc.clone().add(dir.clone().multiply(distance[0]));
                    if (isBlockBlocking(center.getBlock())) {
                        spawnWeaponParticle(world, center, Particle.CLOUD, 15, 0.5, 0.5, 0.5, 0.05, cherry);
                        spawnWeaponParticle(world, center, Particle.POOF, 10, 0.3, 0.3, 0.3, 0.03, cherry);
                        cancel();
                        return;
                    }

                    double grow = Math.min(1.0, distance[0] / AIR_SLASH_GROW_DISTANCE);
                    double halfLength = AIR_SLASH_HALF_LENGTH_START
                        + (AIR_SLASH_HALF_LENGTH_MAX - AIR_SLASH_HALF_LENGTH_START) * grow;

                    double particleGap = cherry ? AIR_SLASH_CHERRY_PARTICLE_GAP : AIR_SLASH_PARTICLE_GAP;
                    int totalSteps = (int) Math.round(halfLength * 2 / particleGap);
                    for (int pi = 0; pi <= totalSteps; pi++) {
                        Location pLoc = center.clone().add(
                            slashDir.clone().multiply(-halfLength + pi * particleGap)
                        );
                        spawnWeaponParticle(
                            world, pLoc, Particle.CLOUD, AIR_SLASH_CLOUD_COUNT,
                            AIR_SLASH_CLOUD_OFFSET, AIR_SLASH_CLOUD_OFFSET, AIR_SLASH_CLOUD_OFFSET, 0.0, cherry
                        );
                        if (pi % AIR_SLASH_END_ROD_INTERVAL == 0) {
                            spawnWeaponParticle(
                                world, pLoc, Particle.END_ROD, AIR_SLASH_END_ROD_COUNT,
                                0.02, 0.02, 0.02, 0.0, cherry
                            );
                        }
                    }

                    for (Entity ent : world.getNearbyEntities(
                        center, halfLength + 0.8, 1.2, 1.2
                    )) {
                        if (!(ent instanceof LivingEntity living) || living.equals(player)) {
                            continue;
                        }
                        UUID entId = living.getUniqueId();
                        if (hitEntities.contains(entId)) {
                            continue;
                        }

                        Location entLoc = living.getLocation().add(0, living.getHeight() / 2.0, 0);
                        Vector toEnt = entLoc.toVector().subtract(center.toVector());
                        double projLen = toEnt.dot(slashDir);
                        if (Math.abs(projLen) > halfLength + 0.5) {
                            continue;
                        }
                        Vector closest = center.toVector().add(slashDir.clone().multiply(projLen));
                        if (closest.distance(entLoc.toVector()) > 1.2) {
                            continue;
                        }

                        hitEntities.add(entId);
                        ItemStack hand = player.getInventory().getItemInMainHand();
                        living.setMetadata(META_SWORD_QI_DAMAGE, new FixedMetadataValue(plugin, true));
                        try {
                            GltcDamageNotify.dealSitDamage(living, player, hand, SIT_AIR_SLASH_MULT);
                        } finally {
                            living.removeMetadata(META_SWORD_QI_DAMAGE, plugin);
                        }

                        Vector knockDir = dir.clone();
                        knockDir.setY(0);
                        if (knockDir.lengthSquared() < 0.001) {
                            knockDir = new Vector(1, 0, 0);
                        }
                        knockDir.normalize();
                        living.setVelocity(living.getVelocity().add(knockDir.multiply(AIR_SLASH_KNOCKBACK)));
                        living.addPotionEffect(new PotionEffect(
                            PotionEffectType.LEVITATION,
                            AIR_SLASH_LEVITATION_TICKS,
                            AIR_SLASH_LEVITATION_LEVEL,
                            false, true, true
                        ));
                        spawnWeaponParticle(world, entLoc, Particle.CLOUD, 8, 0.3, 0.3, 0.3, 0.03, cherry);
                        if (!veinAwarded[0]) {
                            veinAwarded[0] = true;
                            awardWindVein(player);
                        }
                    }

                    distance[0] += AIR_SLASH_SPEED;
                } catch (Throwable t) {
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // -------------------------------------------------------------------------
    // Vertical sword qi
    // -------------------------------------------------------------------------

    private void releaseVerticalSwordQi(Player player) {
        World world = player.getWorld();
        Location eyeLoc = player.getEyeLocation().clone();
        Vector baseDir = eyeLoc.getDirection().normalize();
        baseDir.setY(0);
        if (baseDir.lengthSquared() < 0.001) {
            baseDir = new Vector(0, 0, 1);
        }
        baseDir.normalize();

        sendActionBar(player, MSG_VERTICAL);
        player.sendMessage(MSG_VERTICAL);
        world.playSound(eyeLoc, "entity.ender_dragon.growl", 2.0f, 0.8f);
        world.playSound(eyeLoc, "block.fire.extinguish", 2.0f, 0.7f);
        world.playSound(eyeLoc, "entity.player.attack.sweep", 1.5f, 0.5f);
        world.playSound(eyeLoc, "entity.wither.shoot", 1.0f, 1.2f);

        for (int angle : VERTICAL_ANGLES) {
            double angleRad = angle * Math.PI / 180.0;
            Vector beamDir = rotateAroundY(baseDir, angleRad);
            fireVerticalBeam(world, eyeLoc, beamDir, player);
        }
    }

    private void fireVerticalBeam(World world, Location start, Vector dir, Player player) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        boolean cherry = isCherryMode(player.getUniqueId());
        double[] distance = {0};
        Set<UUID> hitEntities = new HashSet<>();
        Vector flightDir = dir.clone();

        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    if (distance[0] >= VERTICAL_RANGE) {
                        cancel();
                        return;
                    }

                    Location center = start.clone().add(flightDir.clone().multiply(distance[0]));
                    if (isBlockBlocking(center.getBlock())) {
                        spawnWeaponParticle(world, center, Particle.CLOUD, 20, 0.8, 1.0, 0.8, 0.05, cherry);
                        spawnWeaponParticle(world, center, Particle.POOF, 15, 0.5, 0.5, 0.5, 0.03, cherry);
                        cancel();
                        return;
                    }

                    double grow = Math.min(1.0, distance[0] / VERTICAL_GROW_DISTANCE);
                    double halfHeight = VERTICAL_HALF_HEIGHT_START
                        + (VERTICAL_HALF_HEIGHT_MAX - VERTICAL_HALF_HEIGHT_START) * grow;

                    for (double h = -halfHeight; h <= halfHeight; h += VERTICAL_PARTICLE_GAP) {
                        Location pLoc = center.clone().add(0, h, 0);
                        spawnWeaponParticle(
                            world, pLoc, Particle.CLOUD, VERTICAL_CLOUD_COUNT,
                            VERTICAL_CLOUD_OFFSET, VERTICAL_CLOUD_OFFSET, VERTICAL_CLOUD_OFFSET, 0.0, cherry
                        );
                        spawnWeaponParticle(
                            world, pLoc, Particle.END_ROD, VERTICAL_END_ROD_COUNT,
                            VERTICAL_END_ROD_OFFSET, VERTICAL_END_ROD_OFFSET, VERTICAL_END_ROD_OFFSET, 0.0, cherry
                        );
                    }

                    for (Entity ent : world.getNearbyEntities(center, 1.5, halfHeight + 1.0, 1.5)) {
                        if (!(ent instanceof LivingEntity living) || living.equals(player)) {
                            continue;
                        }
                        UUID entId = living.getUniqueId();
                        if (hitEntities.contains(entId)) {
                            continue;
                        }
                        hitEntities.add(entId);

                        ItemStack hand = player.getInventory().getItemInMainHand();
                        living.setMetadata(META_SWORD_QI_DAMAGE, new FixedMetadataValue(plugin, true));
                        try {
                            GltcDamageNotify.dealSitDamage(living, player, hand, SIT_VERTICAL_MULT);
                        } finally {
                            living.removeMetadata(META_SWORD_QI_DAMAGE, plugin);
                        }

                        living.setVelocity(living.getVelocity().add(flightDir.clone().multiply(VERTICAL_KNOCKBACK)));
                        living.addPotionEffect(new PotionEffect(
                            PotionEffectType.LEVITATION,
                            VERTICAL_LEVITATION_TICKS,
                            VERTICAL_LEVITATION_LEVEL,
                            false, true, true
                        ));
                        living.addPotionEffect(new PotionEffect(
                            PotionEffectType.BLINDNESS,
                            VERTICAL_BLINDNESS_TICKS,
                            VERTICAL_BLINDNESS_LEVEL,
                            false, true, true
                        ));

                        Location entLoc = living.getLocation().add(0, living.getHeight() / 2.0, 0);
                        spawnWeaponParticle(world, entLoc, Particle.CLOUD, 15, 0.5, 0.5, 0.5, 0.05, cherry);
                        spawnWeaponParticle(world, entLoc, Particle.END_ROD, 8, 0.3, 0.3, 0.3, 0.03, cherry);
                        world.playSound(entLoc, "entity.player.attack.sweep", 1.0f, 0.8f);
                    }

                    distance[0] += VERTICAL_SPEED;
                } catch (Throwable t) {
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0L, 1L);
    }

    // -------------------------------------------------------------------------
    // Wind vein
    // -------------------------------------------------------------------------

    private void awardWindVein(Player player) {
        try {
            if (!player.isOnline()) {
                return;
            }
            UUID uuid = player.getUniqueId();
            int stacks = windVeinMap.getOrDefault(uuid, 0);
            ensureDecayTask();
            windVeinDecayMap.put(uuid, System.currentTimeMillis());
            if (stacks >= WIND_VEIN_MAX) {
                return;
            }
            stacks++;
            windVeinMap.put(uuid, stacks);
            updateWindVeinBar(uuid, player, stacks, 5);

            int speedTicks = (stacks >= WIND_VEIN_MAX) ? SPEED_UNLOCK_TICKS : SPEED_DURATION_TICKS;
            applyStackedSpeed(player, speedTicks, SPEED_AMPLIFIER);

            if (stacks >= WIND_VEIN_MAX) {
                sendActionBar(player, MSG_VEIN_FULL);
                player.sendMessage(MSG_UNLOCK);
                player.getWorld().playSound(player.getLocation(), "block.beacon.power_select", 1.2f, 1.5f);
            }
        } catch (Throwable t) {
            GltcPlugin plugin = GltcPlugin.getInstance();
            if (plugin != null) {
                plugin.getLogger().log(Level.WARNING, "[风龙冠] 风脉结算异常", t);
            }
        }
    }

    private static void applyStackedSpeed(Player player, int addTicks, int amplifier) {
        if (player == null || addTicks <= 0) {
            return;
        }
        try {
            PotionEffect cur = player.getPotionEffect(PotionEffectType.SPEED);
            int baseTicks = (cur != null) ? cur.getDuration() : 0;
            int curAmp = (cur != null) ? cur.getAmplifier() : -1;
            int finalAmp = (curAmp > amplifier) ? curAmp : amplifier;
            int finalTicks = baseTicks + addTicks;
            player.addPotionEffect(new PotionEffect(
                PotionEffectType.SPEED, finalTicks, finalAmp, false, true, true
            ), true);
        } catch (Throwable ignored) {
        }
    }

    private void ensureDecayTask() {
        if (windVeinDecayTask == null || windVeinDecayTask.isCancelled()) {
            startWindVeinDecay();
        }
    }

    private void startWindVeinDecay() {
        if (windVeinDecayTask != null) {
            try {
                windVeinDecayTask.cancel();
            } catch (Throwable ignored) {
            }
            windVeinDecayTask = null;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }

        windVeinDecayTask = new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    long now = System.currentTimeMillis();
                    Set<UUID> seen = new HashSet<>();
                    for (Map.Entry<UUID, Integer> entry : new HashSet<>(windVeinMap.entrySet())) {
                        UUID uuid = entry.getKey();
                        int stacks = entry.getValue();
                        seen.add(uuid);
                        if (stacks <= 0) {
                            windVeinMap.remove(uuid);
                            windVeinDecayMap.remove(uuid);
                            removeWindVeinBar(uuid);
                            continue;
                        }
                        Long lastDecayObj = windVeinDecayMap.get(uuid);
                        long lastDecay = lastDecayObj != null ? lastDecayObj : now;
                        if (lastDecayObj == null) {
                            windVeinDecayMap.put(uuid, now);
                        }
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
                        long remainMs = WIND_VEIN_DECAY_MS - (now - lastDecay);
                        int remainSec = Math.max(1, (int) Math.ceil(remainMs / 1000.0));
                        Entity entity = Bukkit.getEntity(uuid);
                        if (entity instanceof Player p && p.isOnline()) {
                            updateWindVeinBar(uuid, p, stacks, remainSec);
                        }
                    }

                    Iterator<Map.Entry<UUID, BossBar>> barIt = windVeinBarMap.entrySet().iterator();
                    while (barIt.hasNext()) {
                        Map.Entry<UUID, BossBar> barEntry = barIt.next();
                        UUID barUuid = barEntry.getKey();
                        Entity barEntity = Bukkit.getEntity(barUuid);
                        Player barPlayer = (barEntity instanceof Player p) ? p : null;
                        if (barPlayer == null || !barPlayer.isOnline() || !seen.contains(barUuid)) {
                            try {
                                barEntry.getValue().removeAll();
                            } catch (Throwable ignored) {
                            }
                            barIt.remove();
                        }
                    }
                } catch (Throwable t) {
                    GltcPlugin p = GltcPlugin.getInstance();
                    if (p != null) {
                        p.getLogger().log(Level.WARNING, "[风龙冠] 风脉衰减任务异常", t);
                    }
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    private void updateWindVeinBar(UUID uuid, Player player, int stacks, int remainSec) {
        try {
            BossBar bar = windVeinBarMap.get(uuid);
            if (bar == null) {
                bar = Bukkit.createBossBar(
                    "§b[风脉] §f" + stacks + "/" + WIND_VEIN_MAX,
                    BarColor.WHITE,
                    BarStyle.SOLID
                );
                windVeinBarMap.put(uuid, bar);
            }
            bar.addPlayer(player);
            bar.setTitle("§b[风脉] §f" + stacks + "/" + WIND_VEIN_MAX + " §7(" + remainSec + "s)");
            bar.setProgress(Math.max(0.05, Math.min(1.0, stacks / (double) WIND_VEIN_MAX)));
            bar.setVisible(true);
        } catch (Throwable t) {
            GltcPlugin plugin = GltcPlugin.getInstance();
            if (plugin != null) {
                plugin.getLogger().log(Level.WARNING, "[风龙冠] 风脉BossBar更新异常", t);
            }
        }
    }

    private void removeWindVeinBar(UUID uuid) {
        try {
            BossBar bar = windVeinBarMap.remove(uuid);
            if (bar != null) {
                bar.removeAll();
                bar.setVisible(false);
            }
        } catch (Throwable t) {
            GltcPlugin plugin = GltcPlugin.getInstance();
            if (plugin != null) {
                plugin.getLogger().log(Level.WARNING, "[风龙冠] 风脉BossBar移除异常", t);
            }
        }
    }

    private void clearWeaponState(Player player) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        angleIndexMap.remove(uuid);
        windVeinMap.remove(uuid);
        windVeinDecayMap.remove(uuid);
        leftClickCdMap.remove(uuid);
        cherryModeMap.remove(uuid);
        removeWindVeinBar(uuid);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static boolean isHoldingItem(Player player) {
        ItemStack item = player.getInventory().getItemInMainHand();
        return wasHolding(item);
    }

    private static boolean wasHolding(ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        SlimefunItem sfItem = SlimefunItem.getByItem(stack);
        return sfItem != null && ITEM_ID.equals(sfItem.getId());
    }

    private boolean isCherryMode(UUID uuid) {
        return Boolean.TRUE.equals(cherryModeMap.get(uuid));
    }

    private static boolean isBlockBlocking(Block block) {
        Material type = block.getType();
        if (type.isAir()) {
            return false;
        }
        try {
            return !block.isPassable();
        } catch (Throwable t) {
            return type.isSolid();
        }
    }

    private static Vector rotateAroundY(Vector vec, double angleRad) {
        double s = Math.sin(angleRad);
        double c = Math.cos(angleRad);
        double x = vec.getX();
        double z = vec.getZ();
        return new Vector(x * c - z * s, vec.getY(), x * s + z * c);
    }

    private static void spawnWeaponParticle(
        World world,
        Location loc,
        Particle particle,
        int count,
        double dx,
        double dy,
        double dz,
        double speed,
        boolean cherry
    ) {
        try {
            if (cherry) {
                for (int i = 0; i < count; i++) {
                    double ox = (Math.random() * 2 - 1) * 0.3;
                    double oy = (Math.random() * 2 - 1) * 0.3;
                    world.spawnParticle(CHERRY, loc.clone().add(ox, oy, 0), 1, 0, 0, 0, speed);
                }
            } else {
                world.spawnParticle(particle, loc, count, dx, dy, dz, speed);
            }
        } catch (Throwable ignored) {
        }
    }

    private static void sendActionBar(Player player, String msg) {
        if (player == null || !player.isOnline()) {
            return;
        }
        try {
            player.sendActionBar(LegacyComponentSerializer.legacySection().deserialize(msg));
        } catch (Throwable t) {
            player.sendMessage(msg);
        }
    }

    private static Particle resolveCherry() {
        try {
            return Particle.valueOf("CHERRY_LEAVES");
        } catch (IllegalArgumentException e) {
            try {
                return Particle.valueOf("FALLING_SPORE_BLOSSOM");
            } catch (IllegalArgumentException e2) {
                return Particle.CLOUD;
            }
        }
    }
}
