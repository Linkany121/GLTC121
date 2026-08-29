package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
import com.linkany121.gltc.logic.gun.GunCombat;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/**
 * {@code FKR_无锋破军} — banners / heavy edge / crush / 60% armor ignore.
 * Port of {@code scripts/武器/破军.js}.
 */
public final class PojunWeaponLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "FKR_无锋破军";

    // ===== 配置区（FKR_无锋破军，改完需重新打包 jar 并重启生效）=====
    // --- banners ---
    private static final double BANNER_RADIUS = 14;          // 每次命中在玩家周围随机生成旌旗的半径（格）
    private static final double BANNER_TRIGGER_DIST = 1.2;   // 玩家靠近旌旗的水平触发距离（格）
    private static final long BANNER_LIFETIME_MS = 12000L;   // 旌旗存活时长（毫秒），12000 = 12 秒后消失
    private static final int BANNER_MAX_PER_PLAYER = 5;      // 同一玩家同时存在的旌旗上限（超出删最旧的）
    private static final double BANNER_HEIGHT = 5;           // 旌旗光柱高度（格）

    // --- heavy edge ---
    private static final int HEAVY_EDGE_MAX = 3;             // 叠加多少层重锋可释放镇压（右键触发）
    private static final long HEAVY_EDGE_DECAY_MS = 5000L;   // 重锋层数衰减间隔（毫秒），5000 = 每 5 秒掉一层
    private static final int SPEED_DURATION_TICKS = 200;     // 叠层时获得的加速时长（tick），200 = 10 秒
    private static final int SPEED_LEVEL = 1;                // 加速等级（1 = 速度 I）
    private static final int STRENGTH_DURATION_TICKS = 200;  // 力量效果叠加时长（tick），200 = 10 秒
    private static final int STRENGTH_LEVEL_ADD = 10;        // 每次叠加的力量等级增量

    // --- crush ---
    private static final double CRUSH_RANGE = 30;            // 镇压作用半径（格）
    private static final double CRUSH_FOV_DEG = 120;         // 镇压扇形视野角（度），120 = 前方 120° 内目标
    private static final double SIT_CRUSH_MULT = 50;         // 镇压伤害倍率，实际伤害 = GltcAbilityPower.calcDamage(此值)
    private static final int CRUSH_BLIND_TICKS = 120;        // 镇压致盲时长（tick），120 = 6 秒
    private static final int CRUSH_SLOWNESS_TICKS = 120;     // 镇压减速时长（tick），120 = 6 秒
    private static final int CRUSH_SLOWNESS_LEVEL = 99;      // 镇压减速等级（99 ≈ 几乎定身）
    private static final int CRUSH_SPEAR_COUNT = 40;         // 天上坠下的长矛数量
    private static final double CRUSH_SPEAR_HEIGHT = 30;     // 长矛起始高度（格，越高坠落动画越长）
    private static final double CRUSH_SPEAR_LENGTH = 4;      // 长矛本体长度（格）
    private static final double CRUSH_SPEAR_TILT_MIN = 5;    // 长矛倾斜角度下限（度，随机）
    private static final double CRUSH_SPEAR_TILT_MAX = 20;   // 长矛倾斜角度上限（度，随机）
    private static final int CRUSH_SPEAR_FALL_TICKS = 20;    // 长矛坠落动画时长（tick）
    private static final int CRUSH_SPEAR_HOLD_TICKS = 10;    // 长矛落地停留时长（tick）

    // --- attack ---
    private static final int ATTACK_SLOWNESS_TICKS = 20;     // 普通命中附加减速时长（tick），20 = 1 秒
    private static final int ATTACK_SLOWNESS_LEVEL = 2;      // 普通命中附加减速等级

    // --- armor ignore ---
    private static final double ARMOR_IGNORE_RATE = 0.6;

    private static final String MSG_HEAVY_FULL =
        "§x§f§f§2§a§0§d狼§x§f§e§4§2§0§d烟§x§f§e§5§9§0§d漫§x§f§d§7§1§0§d卷§x§f§d§8§9§0§d城§x§f§c§a§0§0§d头§x§f§c§b§8§0§d立§x§f§b§d§0§0§d—§x§f§b§e§7§0§d—§x§f§a§f§f§0§d—";
    private static final String MSG_CRUSH =
        "§             §x§f§f§d§8§0§d—§x§f§f§b§3§0§a—§x§f§f§8§e§0§8—§x§f§f§6§9§0§5沉§x§f§f§4§4§0§3对§x§f§f§1§f§0§0千§x§f§9§1§f§0§0锋§x§f§3§1§f§0§0不§x§e§c§2§0§0§0肯§x§e§6§2§0§0§0还§x§e§0§2§0§0§0！";

    private static final Particle.DustOptions GOLD_DUST =
        new Particle.DustOptions(Color.fromRGB(255, 180, 30), 1.2f);
    private static final Particle.DustOptions RED_DUST =
        new Particle.DustOptions(Color.fromRGB(220, 40, 40), 1.2f);
    private static final Particle.DustOptions GOLD_DUST_BIG =
        new Particle.DustOptions(Color.fromRGB(255, 190, 50), 2.5f);
    private static final Particle.DustOptions RED_DUST_BIG =
        new Particle.DustOptions(Color.fromRGB(230, 50, 50), 2.5f);
    private static final Particle.DustOptions DARK_RED_DUST =
        new Particle.DustOptions(Color.fromRGB(139, 0, 0), 1.0f);
    private static final Particle.DustOptions DARK_RED_DUST_BIG =
        new Particle.DustOptions(Color.fromRGB(150, 10, 10), 2.2f);

    private static final PotionEffectType TYPE_BLINDNESS = potion("BLINDNESS");
    private static final PotionEffectType TYPE_SLOWNESS = potion("SLOWNESS");
    private static final PotionEffectType TYPE_SPEED = potion("SPEED");
    private static final PotionEffectType TYPE_STRENGTH = potion("STRENGTH");

    private final Map<UUID, Integer> heavyEdgeMap = new ConcurrentHashMap<>();
    private final Map<UUID, Long> heavyEdgeTimeMap = new ConcurrentHashMap<>();
    private final Map<UUID, List<Banner>> bannerMap = new ConcurrentHashMap<>();

    private BukkitTask bannerTask;
    private BukkitTask heavyEdgeTask;
    private boolean registered;

    public void register(GltcPlugin plugin) {
        if (registered) {
            unregister();
        }
        Bukkit.getPluginManager().registerEvents(this, plugin);
        startBannerTask(plugin);
        startHeavyEdgeDecay(plugin);
        registered = true;
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        cancelTasks();
        heavyEdgeMap.clear();
        heavyEdgeTimeMap.clear();
        bannerMap.clear();
        registered = false;
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        if (player == null) {
            return true;
        }
        UUID uuid = player.getUniqueId();
        int stacks = heavyEdgeMap.getOrDefault(uuid, 0);
        if (stacks < HEAVY_EDGE_MAX) {
            GunCombat.sendActionBar(player,
                "§6[重锋] §f不足，需要 " + HEAVY_EDGE_MAX + " 层（当前 " + stacks + " 层）");
            return true;
        }
        heavyEdgeMap.remove(uuid);
        heavyEdgeTimeMap.remove(uuid);
        crush(player);
        return true;
    }

    @Override
    public void onWeaponHit(EntityDamageByEntityEvent event, Player player, ItemStack item) {
        if (event.isCancelled()) {
            return;
        }
        Entity targetEnt = event.getEntity();
        if (!(targetEnt instanceof LivingEntity target) || target.isDead()) {
            return;
        }
        try {
            ignoreArmor(event);
        } catch (Throwable t) {
            logger().log(Level.WARNING, "[破军] 护甲忽视异常", t);
        }
        if (!isAttackCooldownReady(player)) {
            return;
        }
        onHit(player, target);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onItemHeld(PlayerItemHeldEvent event) {
        try {
            ItemStack prev = event.getPlayer().getInventory().getItem(event.getPreviousSlot());
            if (wasHolding(prev)) {
                clearWeaponState(event.getPlayer());
            }
        } catch (Throwable ignored) {
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        try {
            clearWeaponState(event.getPlayer());
        } catch (Throwable ignored) {
        }
    }

    // =========================================================================
    // hit / banners
    // =========================================================================

    private void onHit(Player damager, LivingEntity target) {
        if (TYPE_SLOWNESS != null) {
            target.addPotionEffect(new PotionEffect(
                TYPE_SLOWNESS, ATTACK_SLOWNESS_TICKS, ATTACK_SLOWNESS_LEVEL, false, true, true
            ));
        }

        World world = damager.getWorld();
        Location pLoc = damager.getLocation();
        double ang = Math.random() * Math.PI * 2;
        double dist = Math.random() * BANNER_RADIUS;
        double x = pLoc.getX() + Math.cos(ang) * dist;
        double z = pLoc.getZ() + Math.sin(ang) * dist;
        double y = findGroundY(world, (int) Math.floor(x), (int) Math.floor(z), (int) Math.round(pLoc.getY()));
        Location bannerLoc = new Location(world, x, y, z);

        UUID uuid = damager.getUniqueId();
        List<Banner> list = bannerMap.computeIfAbsent(uuid, k -> new ArrayList<>());
        if (list.size() >= BANNER_MAX_PER_PLAYER) {
            list.remove(0);
        }
        list.add(new Banner(bannerLoc, System.currentTimeMillis()));
    }

    private void gainHeavyEdge(Player player) {
        UUID uuid = player.getUniqueId();
        int stacks = heavyEdgeMap.getOrDefault(uuid, 0);
        heavyEdgeTimeMap.put(uuid, System.currentTimeMillis());
        if (stacks < HEAVY_EDGE_MAX) {
            stacks++;
            heavyEdgeMap.put(uuid, stacks);
        }

        if (TYPE_SPEED != null) {
            player.addPotionEffect(new PotionEffect(
                TYPE_SPEED, SPEED_DURATION_TICKS, SPEED_LEVEL, false, true, true
            ));
        }
        if (TYPE_STRENGTH != null) {
            PotionEffect curStr = player.getPotionEffect(TYPE_STRENGTH);
            int baseLevel = curStr != null ? curStr.getAmplifier() : -1;
            int baseTicks = curStr != null ? curStr.getDuration() : 0;
            int newLevel = baseLevel + STRENGTH_LEVEL_ADD;
            int newTicks = baseTicks + STRENGTH_DURATION_TICKS;
            player.addPotionEffect(new PotionEffect(
                TYPE_STRENGTH, newTicks, newLevel, false, true, true
            ));
        }

        if (stacks >= HEAVY_EDGE_MAX) {
            GunCombat.sendActionBar(player, "§e重锋已满！§6右键可镇压周围目标！");
            player.sendMessage(MSG_HEAVY_FULL);
        } else {
            GunCombat.sendActionBar(player, "§6[重锋] §f" + stacks + "/" + HEAVY_EDGE_MAX);
        }
    }

    // =========================================================================
    // crush
    // =========================================================================

    private void crush(Player player) {
        World world = player.getWorld();
        Location eyeLoc = player.getEyeLocation();
        Vector viewDir = eyeLoc.getDirection().normalize();

        GunCombat.sendActionBar(player, "§c§l镇压！");
        player.sendMessage(MSG_CRUSH);
        world.playSound(eyeLoc, Sound.ENTITY_WITHER_SHOOT, 2.0f, 0.6f);
        world.playSound(eyeLoc, Sound.ENTITY_ENDER_DRAGON_GROWL, 1.5f, 0.7f);

        double fovCos = Math.cos(CRUSH_FOV_DEG / 2.0 * Math.PI / 180.0);
        for (Entity ent : world.getNearbyEntities(eyeLoc, CRUSH_RANGE, CRUSH_RANGE, CRUSH_RANGE)) {
            if (!(ent instanceof LivingEntity living) || living.equals(player)) {
                continue;
            }
            Location mid = living.getLocation().add(0, living.getHeight() / 2.0, 0);
            Vector toEnt = mid.toVector().subtract(eyeLoc.toVector());
            if (toEnt.lengthSquared() < 0.0001) {
                continue;
            }
            if (viewDir.dot(toEnt.normalize()) < fovCos) {
                continue;
            }
            if (TYPE_BLINDNESS != null) {
                living.addPotionEffect(new PotionEffect(
                    TYPE_BLINDNESS, CRUSH_BLIND_TICKS, 0, false, true, true
                ));
            }
            if (TYPE_SLOWNESS != null) {
                living.addPotionEffect(new PotionEffect(
                    TYPE_SLOWNESS, CRUSH_SLOWNESS_TICKS, CRUSH_SLOWNESS_LEVEL, false, true, true
                ));
            }
            world.spawnParticle(
                Particle.DUST,
                living.getLocation().add(0, 1, 0),
                5, 0.3, 0.5, 0.3, 0,
                DARK_RED_DUST
            );
        }

        spawnSpears(world, player, eyeLoc);
    }

    private void spawnSpears(World world, Player player, Location eyeLoc) {
        List<Spear> spears = new ArrayList<>(CRUSH_SPEAR_COUNT);
        for (int i = 0; i < CRUSH_SPEAR_COUNT; i++) {
            double ang = Math.random() * Math.PI * 2;
            double dist = 2 + Math.random() * (CRUSH_RANGE - 2);
            double bx = eyeLoc.getX() + Math.cos(ang) * dist;
            double bz = eyeLoc.getZ() + Math.sin(ang) * dist;
            double gy = findGroundY(world, (int) Math.floor(bx), (int) Math.floor(bz), (int) Math.floor(eyeLoc.getY()));
            Location target = new Location(world, bx, gy, bz);

            double tiltAng = Math.random() * Math.PI * 2;
            double tiltDeg = CRUSH_SPEAR_TILT_MIN
                + Math.random() * (CRUSH_SPEAR_TILT_MAX - CRUSH_SPEAR_TILT_MIN);
            double tiltRad = tiltDeg * Math.PI / 180.0;
            double dx = Math.sin(tiltRad) * Math.cos(tiltAng);
            double dz = Math.sin(tiltRad) * Math.sin(tiltAng);
            double dy = -Math.cos(tiltRad);
            Vector spearDir = new Vector(dx, dy, dz);
            Location start = target.clone().subtract(spearDir.clone().multiply(CRUSH_SPEAR_HEIGHT));
            spears.add(new Spear(start, target, spearDir));
        }

        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }

        final int[] elapsed = {0};
        Bukkit.getScheduler().runTaskTimer(plugin, task -> {
            try {
                elapsed[0]++;
                int tick = elapsed[0];
                if (tick <= CRUSH_SPEAR_FALL_TICKS) {
                    double curProgress = Math.min(1.0, tick / (double) CRUSH_SPEAR_FALL_TICKS);
                    for (Spear sp : spears) {
                        Location head = sp.start.clone()
                            .add(sp.dir.clone().multiply(CRUSH_SPEAR_HEIGHT * curProgress));
                        if (head.getY() < sp.target.getY()) {
                            continue;
                        }
                        for (int s = 0; s <= (int) (CRUSH_SPEAR_LENGTH * 2); s++) {
                            Location lp = head.clone().subtract(sp.dir.clone().multiply(s * 0.5));
                            if (lp.getY() < sp.target.getY() - 0.5) {
                                break;
                            }
                            world.spawnParticle(Particle.DUST, lp, 1, 0, 0, 0, 0, DARK_RED_DUST_BIG);
                            world.spawnParticle(Particle.DUST, lp.clone().add(0.22, 0, 0), 1, 0, 0, 0, 0, DARK_RED_DUST);
                            world.spawnParticle(Particle.DUST, lp.clone().add(-0.22, 0, 0), 1, 0, 0, 0, 0, DARK_RED_DUST);
                            world.spawnParticle(Particle.DUST, lp.clone().add(0, 0, 0.22), 1, 0, 0, 0, 0, DARK_RED_DUST);
                            world.spawnParticle(Particle.DUST, lp.clone().add(0, 0, -0.22), 1, 0, 0, 0, 0, DARK_RED_DUST);
                        }
                    }
                } else if (tick <= CRUSH_SPEAR_FALL_TICKS + CRUSH_SPEAR_HOLD_TICKS) {
                    for (Spear sp : spears) {
                        world.spawnParticle(
                            Particle.DUST, sp.target.clone().add(0, 0.3, 0),
                            4, 0.4, 0.2, 0.4, 0, DARK_RED_DUST
                        );
                        world.spawnParticle(
                            Particle.FLAME, sp.target.clone().add(0, 0.3, 0),
                            3, 0.4, 0.1, 0.4, 0.02
                        );
                    }
                } else {
                    for (Spear sp : spears) {
                        Location boom = sp.target.clone().add(0, 1, 0);
                        world.spawnParticle(Particle.DUST, boom, 60, 3.2, 3.2, 3.2, 0.18, DARK_RED_DUST_BIG);
                        world.spawnParticle(Particle.DUST, boom, 60, 3.2, 3.2, 3.2, 0.18, RED_DUST_BIG);
                        world.spawnParticle(Particle.DUST, boom, 40, 2.6, 2.6, 2.6, 0.12, GOLD_DUST_BIG);
                        world.spawnParticle(Particle.FLAME, boom, 35, 2.2, 2.6, 2.2, 0.1);
                        world.spawnParticle(Particle.CRIT, boom, 30, 3.2, 3.2, 3.2, 0.35);
                        world.spawnParticle(Particle.CLOUD, boom, 20, 2.0, 1.5, 2.0, 0.05);
                        world.playSound(sp.target, Sound.ENTITY_GENERIC_EXPLODE, 1.4f, 0.75f);
                        world.playSound(sp.target, Sound.BLOCK_ANVIL_LAND, 1.0f, 0.9f);
                    }
                    dealCrushDamage(player);
                    task.cancel();
                }
            } catch (Throwable t) {
                logger().log(Level.WARNING, "[破军] 长矛动画异常", t);
                task.cancel();
            }
        }, 0L, 1L);
    }

    private void dealCrushDamage(Player player) {
        if (!player.isOnline()) {
            return;
        }
        World world = player.getWorld();
        Location eyeLoc = player.getEyeLocation();
        Vector viewDir = eyeLoc.getDirection().normalize();
        double fovCos = Math.cos(CRUSH_FOV_DEG / 2.0 * Math.PI / 180.0);
        ItemStack item = player.getInventory().getItemInMainHand();
        double sitDmg = GltcAbilityPower.calcDamage(SIT_CRUSH_MULT);
        double totalDmg = 0;
        int hitCount = 0;

        for (Entity ent : world.getNearbyEntities(eyeLoc, CRUSH_RANGE, CRUSH_RANGE, CRUSH_RANGE)) {
            if (!(ent instanceof LivingEntity living) || living.equals(player)) {
                continue;
            }
            Location mid = living.getLocation().add(0, living.getHeight() / 2.0, 0);
            Vector toEnt = mid.toVector().subtract(eyeLoc.toVector());
            if (toEnt.lengthSquared() < 0.0001) {
                continue;
            }
            if (viewDir.dot(toEnt.normalize()) < fovCos) {
                continue;
            }
            living.setNoDamageTicks(0);
            living.damage(sitDmg, player);
            totalDmg += sitDmg;
            hitCount++;
            Location entLoc = living.getLocation().add(0, living.getHeight() / 2.0, 0);
            world.spawnParticle(Particle.DUST, entLoc, 25, 0.8, 1.2, 0.8, 0, RED_DUST_BIG);
            world.playSound(entLoc, Sound.ENTITY_PLAYER_ATTACK_CRIT, 1.5f, 0.7f);
        }
        GltcDamageNotify.notifyAbilityDamageSummary(player, item, totalDmg, hitCount);
    }

    // =========================================================================
    // periodic tasks
    // =========================================================================

    private void startBannerTask(GltcPlugin plugin) {
        if (bannerTask != null) {
            bannerTask.cancel();
            bannerTask = null;
        }
        bannerTask = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            try {
                long now = System.currentTimeMillis();
                Iterator<Map.Entry<UUID, List<Banner>>> it = bannerMap.entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry<UUID, List<Banner>> entry = it.next();
                    UUID uuid = entry.getKey();
                    List<Banner> list = entry.getValue();
                    List<Banner> out = new ArrayList<>();
                    Entity plEntity = Bukkit.getEntity(uuid);
                    Player pl = plEntity instanceof Player p ? p : null;

                    for (Banner banner : list) {
                        if (banner.loc == null) {
                            continue;
                        }
                        if (now - banner.born > BANNER_LIFETIME_MS) {
                            continue;
                        }
                        out.add(banner);
                        World bw = banner.loc.getWorld();
                        if (bw == null) {
                            continue;
                        }
                        renderBanner(bw, banner.loc, now);
                    }

                    if (out.isEmpty()) {
                        it.remove();
                    } else {
                        entry.setValue(out);
                    }

                    if (pl != null && pl.isOnline() && !out.isEmpty()) {
                        Location plLoc = pl.getLocation();
                        for (int i2 = 0; i2 < out.size(); i2++) {
                            Banner b = out.get(i2);
                            Location bLoc = b.loc;
                            if (bLoc == null) {
                                continue;
                            }
                            World bWorld = bLoc.getWorld();
                            if (bWorld == null || plLoc.getWorld() != bWorld) {
                                continue;
                            }
                            double dx = plLoc.getX() - bLoc.getX();
                            double dz = plLoc.getZ() - bLoc.getZ();
                            if (Math.abs(dx) <= BANNER_TRIGGER_DIST
                                && Math.abs(dz) <= BANNER_TRIGGER_DIST
                                && Math.abs(plLoc.getY() - bLoc.getY()) <= 1.5) {
                                bWorld.playSound(bLoc, Sound.ENTITY_PLAYER_ATTACK_CRIT, 1.2f, 0.6f);
                                bWorld.playSound(bLoc, Sound.BLOCK_ANVIL_LAND, 1.4f, 0.7f);
                                bWorld.playSound(bLoc, Sound.ENTITY_GENERIC_EXPLODE, 1.2f, 0.5f);
                                Location burst = bLoc.clone().add(0, 0.5, 0);
                                bWorld.spawnParticle(Particle.DUST, burst, 50, 2.0, 1.6, 2.0, 0.25, GOLD_DUST_BIG);
                                bWorld.spawnParticle(Particle.DUST, burst, 50, 2.0, 1.6, 2.0, 0.25, RED_DUST_BIG);
                                bWorld.spawnParticle(Particle.FLAME, burst, 25, 1.6, 1.4, 1.6, 0.15);
                                bWorld.spawnParticle(Particle.CRIT, burst, 20, 2.0, 1.6, 2.0, 0.4);
                                bWorld.spawnParticle(
                                    Particle.CLOUD, bLoc.clone().add(0, 0.3, 0),
                                    15, 1.5, 0.8, 1.5, 0.05
                                );
                                out.remove(i2);
                                if (out.isEmpty()) {
                                    it.remove();
                                } else {
                                    entry.setValue(out);
                                }
                                gainHeavyEdge(pl);
                                break;
                            }
                        }
                    }
                }
            } catch (Throwable t) {
                logger().log(Level.WARNING, "[破军] 旌旗任务异常", t);
            }
        }, 0L, 3L);
    }

    private static void renderBanner(World bw, Location loc, long now) {
        for (int ring = 0; ring < 3; ring++) {
            double rAng = (now / 250.0 + ring * 2.094);
            double rx = Math.cos(rAng) * 0.9;
            double rz = Math.sin(rAng) * 0.9;
            Location rLoc = loc.clone().add(rx, 0.15 + ring * 0.12, rz);
            bw.spawnParticle(Particle.DUST, rLoc, 1, 0, 0, 0, 0, GOLD_DUST);
        }
        int steps = (int) Math.floor(BANNER_HEIGHT / 0.3);
        for (int h = 0; h <= steps; h++) {
            double yOff = (h / (double) steps) * BANNER_HEIGHT;
            double helixAng = now / 150.0 + h * 0.8;
            double hx = Math.cos(helixAng) * 0.35;
            double hz = Math.sin(helixAng) * 0.35;
            Location pLoc = loc.clone().add(hx, yOff, hz);
            bw.spawnParticle(
                Particle.DUST, pLoc, 1, 0, 0, 0, 0,
                (h % 2 == 0) ? GOLD_DUST : RED_DUST
            );
        }
        double sway = Math.sin(now / 200.0);
        for (int f = 0; f < 6; f++) {
            double fOff = (f / 5.0) * 1.4;
            Location fLoc = loc.clone().add(sway * (0.4 + f * 0.15), BANNER_HEIGHT - 0.2, fOff - 0.7);
            bw.spawnParticle(
                Particle.DUST, fLoc, 1, 0.06, 0.06, 0.06, 0,
                (f % 2 == 0) ? RED_DUST : GOLD_DUST
            );
        }
        bw.spawnParticle(Particle.FLAME, loc.clone().add(0, BANNER_HEIGHT, 0), 1, 0.08, 0.08, 0.08, 0);
    }

    private void startHeavyEdgeDecay(GltcPlugin plugin) {
        if (heavyEdgeTask != null) {
            heavyEdgeTask.cancel();
            heavyEdgeTask = null;
        }
        heavyEdgeTask = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            try {
                long now = System.currentTimeMillis();
                for (UUID uuid : new ArrayList<>(heavyEdgeMap.keySet())) {
                    int stacks = heavyEdgeMap.getOrDefault(uuid, 0);
                    if (stacks <= 0) {
                        heavyEdgeMap.remove(uuid);
                        heavyEdgeTimeMap.remove(uuid);
                        continue;
                    }
                    Long lastObj = heavyEdgeTimeMap.get(uuid);
                    long last = lastObj != null ? lastObj : now;
                    if (lastObj == null) {
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
                            Entity plEntity = Bukkit.getEntity(uuid);
                            if (plEntity instanceof Player pl && pl.isOnline()) {
                                GunCombat.sendActionBar(pl,
                                    "§6[重锋] §7衰减 §f" + stacks + "/" + HEAVY_EDGE_MAX);
                            }
                        }
                    }
                }
            } catch (Throwable t) {
                logger().log(Level.WARNING, "[破军] 重锋衰减任务异常", t);
            }
        }, 0L, 20L);
    }

    private void cancelTasks() {
        if (bannerTask != null) {
            bannerTask.cancel();
            bannerTask = null;
        }
        if (heavyEdgeTask != null) {
            heavyEdgeTask.cancel();
            heavyEdgeTask = null;
        }
    }

    // =========================================================================
    // armor ignore
    // =========================================================================

    private void ignoreArmor(EntityDamageByEntityEvent event) {
        if (event.isCancelled()) {
            return;
        }
        if (!(event.getEntity() instanceof LivingEntity)) {
            return;
        }
        double original;
        try {
            original = event.getOriginalDamage(EntityDamageEvent.DamageModifier.BASE);
        } catch (Throwable t) {
            return;
        }
        if (original <= 0) {
            return;
        }
        double finalDmg = event.getDamage();
        double reduced = Math.max(0, original - finalDmg);
        if (reduced <= 0) {
            return;
        }
        double reductionRate = reduced / original;
        double newReductionRate = reductionRate * (1.0 - ARMOR_IGNORE_RATE);
        double newDamage = original * (1.0 - newReductionRate);
        event.setDamage(newDamage);
    }

    // =========================================================================
    // helpers
    // =========================================================================

    private void clearWeaponState(Player player) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        heavyEdgeMap.remove(uuid);
        heavyEdgeTimeMap.remove(uuid);
        bannerMap.remove(uuid);
    }

    private static boolean wasHolding(ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        SlimefunItem sfItem = SlimefunItem.getByItem(stack);
        return sfItem != null && isPojunItemId(sfItem.getId());
    }

    private static boolean isPojunItemId(String id) {
        if (id == null) {
            return false;
        }
        return id.equals(ITEM_ID) || id.endsWith(ITEM_ID) || id.contains("无锋破军");
    }

    private static boolean isAttackCooldownReady(Player player) {
        // EDBE may already have consumed the cooldown bar; prefer attack-strength scale.
        try {
            var method = player.getClass().getMethod("getAttackStrengthScale", float.class);
            Object v = method.invoke(player, 0.5f);
            if (v instanceof Number n && n.floatValue() >= 0.98f) {
                return true;
            }
        } catch (Throwable ignored) {
        }
        try {
            return player.getAttackCooldown() >= 0.98f;
        } catch (Throwable t) {
            return true;
        }
    }

    private static double findGroundY(World world, int x, int z, int yStart) {
        for (int y = yStart; y > yStart - 32; y--) {
            Material type = world.getBlockAt(x, y, z).getType();
            if (!type.isAir()) {
                return y + 1;
            }
        }
        return yStart;
    }

    private static PotionEffectType potion(String name) {
        PotionEffectType type = PotionEffectType.getByName(name);
        return type;
    }

    private static java.util.logging.Logger logger() {
        GltcPlugin plugin = GltcPlugin.getInstance();
        return plugin != null ? plugin.getLogger() : Bukkit.getLogger();
    }

    private static final class Banner {
        final Location loc;
        final long born;

        Banner(Location loc, long born) {
            this.loc = loc;
            this.born = born;
        }
    }

    private static final class Spear {
        final Location start;
        final Location target;
        final Vector dir;

        Spear(Location start, Location target, Vector dir) {
            this.start = start;
            this.target = target;
            this.dir = dir;
        }
    }
}
