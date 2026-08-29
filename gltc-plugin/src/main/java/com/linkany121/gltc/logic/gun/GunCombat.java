package com.linkany121.gltc.logic.gun;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.Color;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

import javax.annotation.Nullable;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Shared gun helpers (raycast / cooldown / tracers / SIT damage). */
public final class GunCombat {

    public static final Particle.DustOptions BLACK_DUST =
        new Particle.DustOptions(Color.fromRGB(0, 0, 0), 0.7f);

    private GunCombat() {
    }

    public static void sendActionBar(Player player, String msg) {
        if (player == null || !player.isOnline()) {
            return;
        }
        try {
            player.sendActionBar(LegacyComponentSerializer.legacySection().deserialize(msg));
        } catch (Throwable t) {
            player.sendMessage(msg);
        }
    }

    public static double dealSit(LivingEntity target, Player player, @Nullable ItemStack item, double sitMult) {
        return GltcDamageNotify.dealSitDamage(target, player, item, sitMult);
    }

    @Nullable
    public static RayTraceResult rayTraceLiving(World world, Location start, Vector dir, double range, Player shooter) {
        Vector d = dir.clone().normalize();
        return world.rayTrace(
            start,
            d,
            range,
            FluidCollisionMode.NEVER,
            false,
            0.3,
            ent -> ent instanceof LivingEntity && ent != shooter
        );
    }

    public static void scheduleReloadSound(Player player, long cooldownMs) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null || player == null) {
            return;
        }
        long ticks = Math.max(1L, cooldownMs / 50L);
        new BukkitRunnable() {
            @Override
            public void run() {
                if (player.isOnline()) {
                    player.getWorld().playSound(player.getLocation(), "block.iron_door.close", 0.7f, 1.0f);
                }
            }
        }.runTaskLater(plugin, ticks);
    }

    public static void spawnBlackTracer(World world, Location start, Vector dir, double endDist, double step) {
        Location tracer = start.clone();
        Vector stepVec = dir.clone().normalize().multiply(step);
        int steps = (int) Math.floor(endDist / step);
        for (int i = 0; i < steps; i++) {
            world.spawnParticle(Particle.DUST, tracer, 2, 0.02, 0.02, 0.02, 0, BLACK_DUST);
            tracer.add(stepVec);
        }
    }

    public static void spawnHitBurst(World world, Location hitLoc, Particle.DustOptions dust) {
        world.spawnParticle(Particle.DUST, hitLoc, 12, 0.15, 0.15, 0.15, 0.05, dust);
        world.spawnParticle(Particle.SMOKE, hitLoc, 5, 0.1, 0.1, 0.1, 0.02);
    }

    /** Simple per-player cooldown map helper. */
    public static final class CooldownMap {
        private final Map<UUID, Long> map = new ConcurrentHashMap<>();

        public boolean onCooldown(UUID id, long now, long cooldownMs) {
            Long last = map.get(id);
            return last != null && (now - last) < cooldownMs;
        }

        public void mark(UUID id, long now) {
            map.put(id, now);
        }

        public long remainingMs(UUID id, long now, long cooldownMs) {
            Long last = map.get(id);
            if (last == null) {
                return 0;
            }
            return Math.max(0, cooldownMs - (now - last));
        }

        public void clear(UUID id) {
            map.remove(id);
        }

        public void clearAll() {
            map.clear();
        }
    }
}
