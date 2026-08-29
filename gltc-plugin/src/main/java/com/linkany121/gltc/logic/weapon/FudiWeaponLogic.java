package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
import com.linkany121.gltc.logic.gun.GunCombat;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Color;
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
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** {@code FKR_伏地} — FOV mark + full-cooldown smash fall. */
public final class FudiWeaponLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "FKR_伏地";

    // ===== 配置区（FKR_伏地 视野标记 + 满冷却坠击，改完需重新打包 jar 并重启生效）=====
    private static final double SIT_MARK_MULT = 4;   // 标记瞬间伤害倍率，实际伤害 = GltcAbilityPower.calcDamage(此值)
    private static final double SIT_HIT_MULT = 4;    // 坠击命中时伤害倍率
    private static final long COOLDOWN_MS = 3000;    // 技能冷却（毫秒），3000 = 3 秒
    private static final double RANGE = 20;          // 标记/命中的作用半径（格）
    private static final double FOV_DEG = 100;       // 前方视野角（度），只标记视野内的目标
    private static final int SLOWNESS_TICKS = 60;    // 命中后减速时长（tick），60 = 3 秒
    private static final int SLOWNESS_LEVEL = 2;     // 减速等级
    private static final long MARK_DURATION_MS = 4500;  // 标记持续时长（毫秒），4500 = 4.5 秒，期间可触发坠击
    private static final double FALL_HEIGHT = 5;     // 坠击从天而降的起始高度（格）
    private static final double FALL_SPEED = 0.4;    // 坠击下落速度（格/tick）
    private static final int FALL_CLUSTER_COUNT = 12; // 坠击时生成的光柱/粒子簇数量
    private static final double RAY_STEP = 0.2;      // 标记射线步长（格），越小判定越精细

    private static final Particle.DustOptions WHITE = new Particle.DustOptions(Color.WHITE, 1.2f);
    private static final Particle.DustOptions GRAY =
        new Particle.DustOptions(Color.fromRGB(120, 120, 125), 1.2f);
    private static final Particle.DustOptions RED =
        new Particle.DustOptions(Color.fromRGB(220, 30, 40), 1.2f);
    private static final Particle.DustOptions PURPLE =
        new Particle.DustOptions(Color.fromRGB(150, 60, 220), 1.2f);
    private static final Particle.DustOptions BLACK = new Particle.DustOptions(Color.BLACK, 1.2f);

    private final Map<UUID, Long> cdMap = new ConcurrentHashMap<>();
    private final Map<UUID, Long> marked = new ConcurrentHashMap<>();
    private BukkitTask markTask;
    private GltcPlugin plugin;

    public void register(GltcPlugin plugin) {
        this.plugin = plugin;
        Bukkit.getPluginManager().registerEvents(this, plugin);
        markTask = new BukkitRunnable() {
            @Override
            public void run() {
                long now = System.currentTimeMillis();
                Iterator<Map.Entry<UUID, Long>> it = marked.entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry<UUID, Long> entry = it.next();
                    if (now > entry.getValue()) {
                        it.remove();
                        continue;
                    }
                    Entity ent = Bukkit.getEntity(entry.getKey());
                    if (!(ent instanceof LivingEntity living) || living.isDead()) {
                        it.remove();
                        continue;
                    }
                    markRing(living);
                }
                cdMap.entrySet().removeIf(e -> now - e.getValue() > COOLDOWN_MS);
            }
        }.runTaskTimer(plugin, 5L, 5L);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        if (markTask != null) {
            markTask.cancel();
            markTask = null;
        }
        cdMap.clear();
        marked.clear();
        plugin = null;
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return true;
        }
        SlimefunItem sf = SlimefunItem.getByItem(hand);
        if (sf == null || !ITEM_ID.equals(sf.getId())) {
            return true;
        }
        long now = System.currentTimeMillis();
        if (cdMap.containsKey(player.getUniqueId())
            && now - cdMap.get(player.getUniqueId()) < COOLDOWN_MS) {
            GunCombat.sendActionBar(player, "§c术式组件充能中...");
            return true;
        }
        cdMap.put(player.getUniqueId(), now);
        showScanRange(player);

        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();
        double halfCos = Math.cos(FOV_DEG / 2 * Math.PI / 180);
        long expire = now + MARK_DURATION_MS;
        int count = 0;
        for (Entity ent : world.getNearbyEntities(eye, RANGE, RANGE, RANGE)) {
            if (!(ent instanceof LivingEntity living) || ent == player || living.isDead()) {
                continue;
            }
            Location entCenter = living.getLocation().add(0, living.getHeight() / 2, 0);
            Vector to = entCenter.toVector().subtract(eye.toVector());
            double dist = to.length();
            if (dist < 0.5 || dist > RANGE) {
                continue;
            }
            if (dir.dot(to.normalize()) < halfCos) {
                continue;
            }
            marked.put(living.getUniqueId(), expire);
            GltcDamageNotify.dealSitDamage(living, player, hand, SIT_MARK_MULT);
            living.addPotionEffect(new PotionEffect(
                PotionEffectType.SLOWNESS, SLOWNESS_TICKS, SLOWNESS_LEVEL, false, true, true
            ));
            markRing(living);
            count++;
        }
        world.playSound(eye, "entity.wither.ambient", 1.0f, 0.9f);
        world.playSound(eye, "block.anvil.land", 1.0f, 0.7f);
        if (count > 0) {
            world.playSound(eye, "entity.wither.shoot", 1.2f, 0.7f);
            GunCombat.sendActionBar(player, "§f引力组件标记了 §e" + count + " §f个敌人");
        } else {
            GunCombat.sendActionBar(player, "§7视野内未发现敌人");
        }
        return true;
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onDamage(EntityDamageByEntityEvent event) {
        if (!(event.getEntity() instanceof LivingEntity entity) || entity.isDead()) {
            return;
        }
        if (!(event.getDamager() instanceof Player player)) {
            return;
        }
        ItemStack item = player.getInventory().getItemInMainHand();
        if (item.getType() == Material.AIR) {
            return;
        }
        SlimefunItem sf = SlimefunItem.getByItem(item);
        if (sf == null || !ITEM_ID.equals(sf.getId())) {
            return;
        }
        try {
            if (player.getAttackCooldown() < 0.98f) {
                return;
            }
        } catch (Throwable ignored) {
        }
        UUID eid = entity.getUniqueId();
        Long exp = marked.get(eid);
        if (exp == null) {
            return;
        }
        if (System.currentTimeMillis() > exp) {
            marked.remove(eid);
            return;
        }
        marked.remove(eid);
        summonBlackBlock(entity, player);
    }

    private void summonBlackBlock(LivingEntity target, Player player) {
        GltcPlugin pl = plugin != null ? plugin : GltcPlugin.getInstance();
        if (pl == null) {
            return;
        }
        World world = target.getWorld();
        Location tLoc = target.getLocation();
        final double[] dropY = {
            Math.min(tLoc.getY() + target.getHeight() + FALL_HEIGHT, world.getMaxHeight() - 4)
        };
        double groundY = tLoc.getY() + 0.5;
        new BukkitRunnable() {
            @Override
            public void run() {
                if (target.isDead()) {
                    cancel();
                    return;
                }
                Location tNow = target.getLocation();
                Location current = new Location(world, tNow.getX(), dropY[0], tNow.getZ());
                for (int i = 0; i < FALL_CLUSTER_COUNT; i++) {
                    double ox = (Math.random() - 0.5) * 1.1;
                    double oy = (Math.random() - 0.5) * 1.1;
                    double oz = (Math.random() - 0.5) * 1.1;
                    Location p = new Location(world, current.getX() + ox, current.getY() + oy, current.getZ() + oz);
                    Particle.DustOptions dust = switch (i % 3) {
                        case 0 -> BLACK;
                        case 1 -> RED;
                        default -> PURPLE;
                    };
                    world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, dust);
                }
                dropY[0] -= FALL_SPEED;
                if (dropY[0] <= groundY) {
                    ItemStack weaponItem = player.getInventory().getItemInMainHand();
                    GltcDamageNotify.dealSitDamage(target, player, weaponItem, SIT_HIT_MULT);
                    Location hitLoc = target.getLocation().add(0, 0.5, 0);
                    world.playSound(hitLoc, "block.anvil.land", 2.0f, 0.6f);
                    world.playSound(hitLoc, "entity.generic.explode", 1.5f, 0.5f);
                    for (int j = 0; j < 30; j++) {
                        Location b = new Location(
                            world,
                            hitLoc.getX() + (Math.random() - 0.5) * 2.6,
                            hitLoc.getY() + Math.random() * 1.6,
                            hitLoc.getZ() + (Math.random() - 0.5) * 2.6
                        );
                        Particle.DustOptions dust = switch (j % 3) {
                            case 0 -> BLACK;
                            case 1 -> RED;
                            default -> PURPLE;
                        };
                        world.spawnParticle(Particle.DUST, b, 1, 0, 0, 0, 0, dust);
                    }
                    world.spawnParticle(Particle.EXPLOSION, hitLoc, 1, 0, 0, 0, 0);
                    world.spawnParticle(Particle.CLOUD, hitLoc, 20, 0.8, 0.4, 0.8, 0.05);
                    cancel();
                }
            }
        }.runTaskTimer(pl, 1L, 1L);
    }

    private static void showScanRange(Player player) {
        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();
        Vector right = dir.clone().crossProduct(new Vector(0, 1, 0));
        if (right.lengthSquared() < 1e-9) {
            right = new Vector(1, 0, 0);
        }
        right.normalize();
        Vector up = right.clone().crossProduct(dir).normalize();
        double half = FOV_DEG / 2;
        double deg2rad = Math.PI / 180;
        for (int side = -1; side <= 1; side += 2) {
            Vector d = rotateAroundAxis(dir, up, side * half * deg2rad).normalize();
            for (double r = 0.3; r <= RANGE; r += RAY_STEP) {
                Location p = eye.clone().add(d.clone().multiply(r));
                world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, WHITE);
                world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, GRAY);
            }
        }
        Location foot = player.getLocation().clone();
        foot.setY(foot.getY() + 0.1);
        world.spawnParticle(Particle.EXPLOSION, foot, 1, 0, 0, 0, 0);
        world.spawnParticle(Particle.CLOUD, foot, 15, 0.8, 0.2, 0.8, 0.05);
        world.spawnParticle(Particle.DUST, foot, 20, 0.8, 0.2, 0.8, 0, GRAY);
    }

    private static void markRing(LivingEntity ent) {
        World world = ent.getWorld();
        Location loc = ent.getLocation();
        double width = Math.max(0.8, ent.getWidth());
        double radius = width * 0.55 + 0.3;
        double y = loc.getY() + Math.max(0.5, ent.getHeight() * 0.5);
        for (int i = 0; i < 20; i++) {
            double a = (2 * Math.PI * i) / 20;
            Location pLoc = new Location(world, loc.getX() + Math.cos(a) * radius, y, loc.getZ() + Math.sin(a) * radius);
            world.spawnParticle(Particle.DUST, pLoc, 1, 0, 0, 0, 0, RED);
        }
        Location ground = new Location(world, loc.getX(), loc.getY() + 0.15, loc.getZ());
        world.spawnParticle(Particle.DUST, ground, 14, radius, 0.1, radius, 0, GRAY);
        world.spawnParticle(Particle.CLOUD, ground, 5, radius, 0.1, radius, 0.03);
    }

    private static Vector rotateAroundAxis(Vector vec, Vector axis, double angle) {
        double s = Math.sin(angle);
        double c = Math.cos(angle);
        double x = vec.getX(), y = vec.getY(), z = vec.getZ();
        double ax = axis.getX(), ay = axis.getY(), az = axis.getZ();
        double dot = x * ax + y * ay + z * az;
        return new Vector(
            x * c + (1 - c) * dot * ax + s * (ay * z - az * y),
            y * c + (1 - c) * dot * ay + s * (az * x - ax * z),
            z * c + (1 - c) * dot * az + s * (ax * y - ay * x)
        );
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onHeld(PlayerItemHeldEvent event) {
        ItemStack prev = event.getPlayer().getInventory().getItem(event.getPreviousSlot());
        if (isFudi(prev)) {
            cdMap.remove(event.getPlayer().getUniqueId());
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        cdMap.remove(event.getPlayer().getUniqueId());
    }

    private static boolean isFudi(ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        return sf != null && ITEM_ID.equals(sf.getId());
    }
}
