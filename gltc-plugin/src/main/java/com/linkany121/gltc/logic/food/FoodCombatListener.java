package com.linkany121.gltc.logic.food;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Particle;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.entity.EntityDamageEvent;
import org.bukkit.event.entity.EntityRegainHealthEvent;
import org.bukkit.metadata.FixedMetadataValue;
import org.bukkit.metadata.MetadataValue;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.Color;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/** Combat side-effects for special UMPV dishes (baoxiang / soup / golden rice). */
public final class FoodCombatListener implements Listener {

    public static final String META_BAOXIANG = "gltc_baoxiang";  // 百香烤整身虐王排状态标记键
    public static final String META_SOUP = "gltc_soup";          // 灼金香烹餮汤锅状态标记键
    public static final String META_GOLDEN_RICE = "gltc_goldenrice"; // 黄金炒饭状态标记键

    // ===== 配置区（特殊料理战斗效果，改完需重新打包 jar 并重启生效）=====
    private static final long COOLDOWN_MS = 300;   // 各料理效果的触发防抖（毫秒），防止同帧多次结算
    private static final long MAP_TTL_MS = 5000;   // 冷却记录的有效时长（毫秒），超时自动清理
    // dust18 / dust15 为料理特效金色粒子（RGB 226,207,69，尺寸 1.8 / 1.5），改颜色改 fromRGB 三个数值即可。

    private final GltcPlugin plugin;
    private final Map<UUID, Long> baoxiangCd = new ConcurrentHashMap<>();
    private final Map<UUID, Long> soupCd = new ConcurrentHashMap<>();
    private final Map<UUID, Long> riceCd = new ConcurrentHashMap<>();
    private int cleanupCounter;
    private final Particle.DustOptions dust18 = new Particle.DustOptions(Color.fromRGB(226, 207, 69), 1.8f);
    private final Particle.DustOptions dust15 = new Particle.DustOptions(Color.fromRGB(226, 207, 69), 1.5f);

    public FoodCombatListener(GltcPlugin plugin) {
        this.plugin = plugin;
    }

    public void register() {
        plugin.getServer().getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        baoxiangCd.clear();
        soupCd.clear();
        riceCd.clear();
    }

    public static void setTimedMeta(Player player, String key, long durationMs) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        long end = System.currentTimeMillis() + durationMs;
        player.setMetadata(key, new FixedMetadataValue(plugin, end));
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onDamage(EntityDamageEvent event) {
        try {
            handle(event);
        } catch (Throwable t) {
            plugin.getLogger().log(Level.WARNING, "[GLTC食物] 战斗效果异常", t);
        }
    }

    private void handle(EntityDamageEvent event) {
        Player victim = event.getEntity() instanceof Player p ? p : null;
        Player attacker = null;
        if (event instanceof EntityDamageByEntityEvent by) {
            attacker = resolvePlayerDamager(by.getDamager());
        }
        if (victim == null && attacker == null) {
            return;
        }
        long now = System.currentTimeMillis();
        maybeCleanup(now);

        if (victim != null) {
            long end = getEndTime(victim, META_BAOXIANG);
            if (end > 0 && !onCd(baoxiangCd, victim.getUniqueId(), now)) {
                markCd(baoxiangCd, victim.getUniqueId(), now);
                var loc = victim.getLocation();
                var world = loc.getWorld();
                world.playSound(loc, org.bukkit.Sound.ENTITY_ENDER_DRAGON_GROWL, 0.5f, 1.2f);
                world.spawnParticle(Particle.CLOUD, loc.clone().add(0, 0.5, 0), 12, 0.2, 0.2, 0.2, 0.05);
                world.spawnParticle(Particle.LAVA, loc.clone().add(0, 0.5, 0), 6, 0.2, 0.2, 0.2, 0.05);
                applyNearby(world, loc, 4.0, victim, target -> {
                    addSafe(target, PotionEffectType.SLOWNESS, 60, 2);
                    addSafe(target, PotionEffectType.POISON, 60, 9);
                    addSafe(target, PotionEffectType.BLINDNESS, 60, 0);
                });
                sendActionBar(victim, "§e咆哮§7剩余时间：§f" + formatRemaining(end, now));
            }
        }

        if (attacker == null) {
            return;
        }

        if (attacker.hasMetadata(META_SOUP) && isSweep(event)) {
            long soupEnd = getEndTime(attacker, META_SOUP);
            if (soupEnd > 0 && !onCd(soupCd, attacker.getUniqueId(), now)) {
                markCd(soupCd, attacker.getUniqueId(), now);
                var loc = attacker.getLocation();
                var world = loc.getWorld();
                world.playSound(loc, org.bukkit.Sound.ENTITY_BLAZE_SHOOT, 0.8f, 1.2f);
                burstRing(world, loc.getX(), loc.getY() + 0.5, loc.getZ(), 1.6, 14, dust18, 0.25, 0.15);
                heal(attacker, attacker.getMaxHealth() * 0.1);
                applyNearby(world, loc, 3.5, attacker, target -> addSafe(target, PotionEffectType.LEVITATION, 20, 2));
                sendActionBar(attacker, "§6黄金蒸汽§7剩余时间：§f" + formatRemaining(soupEnd, now));
            }
        }

        if (!(event.getEntity() instanceof LivingEntity living) || living == attacker) {
            return;
        }
        if (!attacker.hasMetadata(META_GOLDEN_RICE)) {
            return;
        }
        long riceEnd = getEndTime(attacker, META_GOLDEN_RICE);
        if (riceEnd <= 0 || onCd(riceCd, attacker.getUniqueId(), now)) {
            return;
        }
        markCd(riceCd, attacker.getUniqueId(), now);
        double extra = living.getMaxHealth() * 0.1;
        if (extra <= 0) {
            return;
        }
        event.setDamage(event.getDamage() + extra);
        sendActionBar(attacker, "§6烫伤 §c+" + (int) Math.floor(extra));
        var loc = living.getLocation();
        var world = living.getWorld();
        world.playSound(loc, org.bukkit.Sound.ENTITY_BREEZE_WIND_BURST, 0.8f, 1.2f);
        world.spawnParticle(
            Particle.DUST,
            loc.getX(), loc.getY() + living.getHeight() + 0.5, loc.getZ(),
            12, 0.3, 0.6, 0.3, 0, dust15
        );
    }

    private static Player resolvePlayerDamager(org.bukkit.entity.Entity damager) {
        if (damager instanceof Player p) {
            return p;
        }
        if (damager instanceof Projectile proj && proj.getShooter() instanceof Player p) {
            return p;
        }
        return null;
    }

    private static boolean isSweep(EntityDamageEvent event) {
        var cause = event.getCause();
        return cause == EntityDamageEvent.DamageCause.ENTITY_SWEEP_ATTACK
            || "SWEEP_ATTACK".equals(cause.name())
            || "ENTITY_SWEEP_ATTACK".equals(cause.name());
    }

    private long getEndTime(Player player, String key) {
        if (!player.hasMetadata(key)) {
            return -1;
        }
        List<MetadataValue> list = player.getMetadata(key);
        if (list.isEmpty()) {
            return -1;
        }
        long end = list.get(0).asLong();
        if (System.currentTimeMillis() > end) {
            player.removeMetadata(key, plugin);
            return -1;
        }
        return end;
    }

    private static boolean onCd(Map<UUID, Long> map, UUID id, long now) {
        Long last = map.get(id);
        return last != null && now - last < COOLDOWN_MS;
    }

    private static void markCd(Map<UUID, Long> map, UUID id, long now) {
        map.put(id, now);
    }

    private void maybeCleanup(long now) {
        cleanupCounter++;
        if (cleanupCounter % 128 != 0
            && baoxiangCd.size() < 96
            && soupCd.size() < 96
            && riceCd.size() < 96) {
            return;
        }
        cleanup(baoxiangCd, now);
        cleanup(soupCd, now);
        cleanup(riceCd, now);
    }

    private static void cleanup(Map<UUID, Long> map, long now) {
        Iterator<Map.Entry<UUID, Long>> it = map.entrySet().iterator();
        while (it.hasNext()) {
            if (now - it.next().getValue() > MAP_TTL_MS) {
                it.remove();
            }
        }
    }

    private static void addSafe(LivingEntity e, PotionEffectType type, int duration, int amplifier) {
        if (type != null) {
            e.addPotionEffect(new PotionEffect(type, duration, amplifier, true, false, false));
        }
    }

    private static void applyNearby(
        org.bukkit.World world,
        org.bukkit.Location center,
        double radius,
        LivingEntity source,
        java.util.function.Consumer<LivingEntity> fn
    ) {
        double r2 = radius * radius;
        for (var ent : world.getNearbyEntities(center, radius, radius, radius)) {
            if (!(ent instanceof LivingEntity living) || living == source || living.isDead()) {
                continue;
            }
            if (living.getLocation().distanceSquared(center) > r2) {
                continue;
            }
            fn.accept(living);
        }
    }

    private static void burstRing(
        org.bukkit.World world,
        double cx, double cy, double cz,
        double radius, int count,
        Particle.DustOptions dust,
        double upSpeed, double outSpeed
    ) {
        double step = (2 * Math.PI) / count;
        for (int i = 0; i < count; i++) {
            double angle = step * i;
            double rx = Math.cos(angle) * radius;
            double rz = Math.sin(angle) * radius;
            world.spawnParticle(
                Particle.DUST,
                cx + rx, cy, cz + rz,
                0,
                rx * outSpeed * 0.75, upSpeed, rz * outSpeed * 0.75,
                0, dust
            );
        }
    }

    private static void heal(Player player, double amount) {
        if (amount <= 0) {
            return;
        }
        try {
            player.heal(amount, EntityRegainHealthEvent.RegainReason.MAGIC);
        } catch (Throwable t) {
            double max = player.getMaxHealth();
            player.setHealth(Math.min(max, player.getHealth() + amount));
        }
    }

    private static String formatRemaining(long end, long now) {
        int totalSec = (int) Math.max(0, (end - now) / 1000);
        return (totalSec / 60) + "§7分§f" + (totalSec % 60) + "§7秒";
    }

    private static void sendActionBar(Player player, String msg) {
        try {
            player.sendActionBar(LegacyComponentSerializer.legacySection().deserialize(msg));
        } catch (Throwable t) {
            player.sendMessage(msg);
        }
    }
}
