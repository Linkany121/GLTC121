package com.linkany121.gltc.logic.machine;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.block.Block;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

/**
 * {@code skey_深红远星级} — periodic red ring / helix FX at structure center.
 * Port of {@code scripts/多方块特效/深红远星.js}.
 * {@link #onTick} returns {@code false} so default recipe tick still runs ({@code callSuper}).
 */
public final class CrimsonFarStarLogic implements GltcMachineLogic {

    public static final String MACHINE_ID = "skey_深红远星级";

    // ===== 配置区（深红远星级 中心特效，改完需重新打包 jar 并重启生效）=====
    private static final long INTERVAL_MS = 2400L;  // 两次特效触发的间隔（毫秒），2400 = 每 2.4 秒一次，调小特效更频繁也越耗性能

    private final Map<String, Long> lastTrigger = new ConcurrentHashMap<>();

    @Override
    public boolean onTick(Location location, GltcRecipeMachine machine) {
        try {
            Block block = location.getBlock();
            Location loc = block.getLocation();
            String key = locKey(loc);
            long now = System.currentTimeMillis();
            long last = lastTrigger.getOrDefault(key, 0L);
            if (now - last < INTERVAL_MS) {
                return false;
            }
            lastTrigger.put(key, now);

            int dirX = 0;
            int dirZ = 0;
            boolean found = false;
            if (block.getRelative(1, 0, 0).getType() == Material.IRON_BLOCK) {
                dirX = 1;
                found = true;
            } else if (block.getRelative(-1, 0, 0).getType() == Material.IRON_BLOCK) {
                dirX = -1;
                found = true;
            } else if (block.getRelative(0, 0, 1).getType() == Material.IRON_BLOCK) {
                dirZ = 1;
                found = true;
            } else if (block.getRelative(0, 0, -1).getType() == Material.IRON_BLOCK) {
                dirZ = -1;
                found = true;
            }

            final double centerX = found ? loc.getX() + dirX * 7 : loc.getX();
            final double centerZ = found ? loc.getZ() + dirZ * 7 : loc.getZ();
            final double centerY = loc.getY() + 5;
            final String worldName = block.getWorld().getName();

            GltcPlugin plugin = GltcPlugin.getInstance();
            if (plugin == null) {
                return false;
            }
            Bukkit.getScheduler().runTask(plugin, () -> spawnEffects(worldName, centerX, centerY, centerZ));
        } catch (Throwable e) {
            // 与 深红远星.js 一致：外层错误广播给全服
            Bukkit.broadcastMessage("§c[深红远星-错误] " + e);
        }
        return false;
    }

    private static void spawnEffects(String worldName, double centerX, double centerY, double centerZ) {
        try {
            World world = Bukkit.getWorld(worldName);
            if (world == null) {
                return;
            }
            double cx = centerX + 0.5;
            double cy = centerY + 0.5;
            double cz = centerZ + 0.5;
            Location soundAt = new Location(world, cx, cy, cz);

            world.playSound(soundAt, "entity.generic.explode", 0.25f, 1.2f);
            world.playSound(soundAt, "block.beacon.activate", 0.25f, 1.2f);

            Color red = Color.RED;
            Color darkRed = Color.fromRGB(139, 0, 0);
            Color orange = Color.fromRGB(255, 80, 0);

            for (int ring = 0; ring < 3; ring++) {
                double radius = 1.5 + ring * 1.5;
                int steps = 25 + ring * 25;
                float dustSize = (float) (2.5 - ring * 0.5);
                Color dustColor = ring == 0 ? red : (ring == 1 ? orange : darkRed);
                Particle.DustOptions dustOpt = new Particle.DustOptions(dustColor, dustSize);

                for (int i = 0; i < steps; i++) {
                    double angle = (2 * Math.PI * i) / steps;
                    double px = cx + Math.cos(angle) * radius;
                    double pz = cz + Math.sin(angle) * radius;
                    world.spawnParticle(Particle.DUST, px, cy, pz, 0, 0, 0, 0, 1, dustOpt);
                }
            }

            int helixSteps = 50;
            double helixRadius = 2.0;
            double helixHeight = 4.0;
            Particle.DustOptions helixDust = new Particle.DustOptions(red, 1.8f);
            for (int i = 0; i < helixSteps; i++) {
                double t = (double) i / helixSteps;
                double angle = t * Math.PI * 4;
                double px = cx + Math.cos(angle) * helixRadius;
                double py = cy + t * helixHeight;
                double pz = cz + Math.sin(angle) * helixRadius;
                world.spawnParticle(Particle.DUST, px, py, pz, 0, 0, 0, 0, 1, helixDust);
            }

            int burstCount = 30;
            Particle.DustOptions burstDust = new Particle.DustOptions(red, 1.5f);
            ThreadLocalRandom rng = ThreadLocalRandom.current();
            for (int i = 0; i < burstCount; i++) {
                double theta = Math.acos(2 * rng.nextDouble() - 1);
                double phi = 2 * Math.PI * rng.nextDouble();
                double r = 2.5;
                double px = cx + r * Math.sin(theta) * Math.cos(phi);
                double py = cy + r * Math.sin(theta) * Math.sin(phi);
                double pz = cz + r * Math.cos(theta);
                world.spawnParticle(Particle.DUST, px, py, pz, 0, 0, 0, 0, 1, burstDust);
            }
        } catch (Throwable e2) {
            Bukkit.broadcastMessage("§c[深红远星-主线程错误] " + e2);
        }
    }

    private static String locKey(Location loc) {
        World world = loc.getWorld();
        String worldId = world != null ? world.getUID().toString() : "?";
        return worldId + ":" + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ();
    }
}
