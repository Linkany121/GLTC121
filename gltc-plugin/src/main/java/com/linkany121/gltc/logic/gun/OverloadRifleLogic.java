package com.linkany121.gltc.logic.gun;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Color;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** {@code FKR_通古斯过载式步枪} — burst then beam; second click aborts. */
public final class OverloadRifleLogic extends AbstractGunLogic {

    // ===== 配置区（通古斯过载式步枪，改完需重新打包 jar 并重启生效）=====
    // 机制：充能连发 → 打完接光束；充能期间连点第二次会中止。
    private static final double SIT_PER_BULLET = 0.6;   // 每发充能弹的伤害倍率
    private static final double SIT_BEAM_MULT = 20;     // 最终光束的伤害倍率
    private static final double RANGE = 60;             // 充能弹与光束的射程（格）
    private static final long COOLDOWN_MS = 5000;       // 射击完成/中止后的再装填时长（毫秒），5000 = 5 秒
    private static final int BULLET_INTERVAL = 2;       // 每多少 tick 射一发充能弹（2 = 每秒 10 发）
    private static final int MAX_BULLETS = 10;          // 充能弹数量（打完自动转光束）
    private static final double BEAM_RADIUS = 2.0;      // 光束作用半径（格）

    private static final Particle.DustOptions BULLET_DUST =
        new Particle.DustOptions(Color.fromRGB(255, 180, 0), 1.0f);
    private static final Particle.DustOptions BEAM_CORE =
        new Particle.DustOptions(Color.fromRGB(255, 120, 0), 1.5f);
    private static final Particle.DustOptions BEAM_RING =
        new Particle.DustOptions(Color.fromRGB(255, 0, 0), 1.2f);

    private final GunCombat.CooldownMap cd = new GunCombat.CooldownMap();
    private final Set<UUID> firing = ConcurrentHashMap.newKeySet();
    private final Map<UUID, BukkitTask> tasks = new ConcurrentHashMap<>();

    @Override
    public void clearGunState(Player player) {
        if (player == null) {
            return;
        }
        UUID id = player.getUniqueId();
        cd.clear(id);
        firing.remove(id);
        BukkitTask t = tasks.remove(id);
        if (t != null) {
            t.cancel();
        }
    }

    @Override
    protected void fire(Player player, ItemStack hand) {
        UUID uuid = player.getUniqueId();
        if (firing.contains(uuid)) {
            firing.remove(uuid);
            cd.mark(uuid, System.currentTimeMillis());
            BukkitTask task = tasks.remove(uuid);
            if (task != null) {
                task.cancel();
            }
            GunCombat.sendActionBar(player, "§c中止，进入再装填...");
            GunCombat.scheduleReloadSound(player, COOLDOWN_MS);
            return;
        }
        long now = System.currentTimeMillis();
        if (cd.onCooldown(uuid, now, COOLDOWN_MS)) {
            long remaining = (long) Math.ceil(cd.remainingMs(uuid, now, COOLDOWN_MS) / 1000.0);
            GunCombat.sendActionBar(player, "§c再装填中..." + remaining + "秒");
            player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7f, 1.0f);
            return;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        firing.add(uuid);
        GunCombat.sendActionBar(player, "§e进入充能！");
        final int[] bulletCount = {0};
        BukkitTask task = new BukkitRunnable() {
            @Override
            public void run() {
                if (!player.isOnline()) {
                    cleanup(uuid);
                    return;
                }
                if (!firing.contains(uuid)) {
                    BukkitTask idle = tasks.remove(uuid);
                    if (idle != null) {
                        idle.cancel();
                    }
                    return;
                }
                ItemStack main = player.getInventory().getItemInMainHand();
                if (main.getType() == Material.AIR) {
                    cleanup(uuid);
                    return;
                }
                if (bulletCount[0] < MAX_BULLETS) {
                    fireBullet(player, bulletCount[0]);
                    bulletCount[0]++;
                    GunCombat.sendActionBar(player, "§e充能射击中 §f" + bulletCount[0] + "§e/§f" + MAX_BULLETS);
                } else {
                    firing.remove(uuid);
                    fireBeam(player);
                    adjustPitch(player, 3);
                    cd.mark(uuid, System.currentTimeMillis());
                    GunCombat.sendActionBar(player, "§c已完全激发光束脉冲，进入再装填...");
                    GunCombat.scheduleReloadSound(player, COOLDOWN_MS);
                    BukkitTask done = tasks.remove(uuid);
                    if (done != null) {
                        done.cancel();
                    }
                }
            }
        }.runTaskTimer(plugin, 0L, BULLET_INTERVAL);
        tasks.put(uuid, task);
    }

    private void cleanup(UUID uuid) {
        firing.remove(uuid);
        BukkitTask t = tasks.remove(uuid);
        if (t != null) {
            t.cancel();
        }
    }

    private void fireBullet(Player player, int bulletIndex) {
        World world = player.getWorld();
        ItemStack item = player.getInventory().getItemInMainHand();
        Location start = player.getEyeLocation();
        Vector dir = start.getDirection().normalize();
        RayTraceResult ray = GunCombat.rayTraceLiving(world, start, dir, RANGE, player);
        double endDist = RANGE;
        if (ray != null) {
            endDist = start.toVector().distance(ray.getHitPosition());
            if (ray.getHitEntity() instanceof LivingEntity living) {
                GunCombat.dealSit(living, player, item, SIT_PER_BULLET);
            }
        }
        Location tracer = start.clone();
        Vector stepVec = dir.clone().multiply(0.25);
        int steps = (int) Math.floor(endDist / 0.25);
        for (int i = 0; i < steps; i++) {
            world.spawnParticle(Particle.DUST, tracer, 2, 0, 0, 0, 0, BULLET_DUST);
            tracer.add(stepVec);
        }
        if (ray != null) {
            var hp = ray.getHitPosition();
            Location hitLoc = new Location(world, hp.getX(), hp.getY(), hp.getZ());
            world.spawnParticle(Particle.DUST, hitLoc, 12, 0.15, 0.15, 0.15, 0.05, BULLET_DUST);
            world.spawnParticle(Particle.SMOKE, hitLoc, 3, 0.1, 0.1, 0.1, 0.02);
        }
        float volume = (float) (0.3 + (bulletIndex / 10.0) * 0.9);
        float pitch = (float) (0.4 + (bulletIndex / 10.0) * 1.6);
        world.playSound(start, "block.respawn_anchor.charge", volume, pitch);
    }

    private void fireBeam(Player player) {
        World world = player.getWorld();
        ItemStack item = player.getInventory().getItemInMainHand();
        Location start = player.getEyeLocation();
        Vector dir = start.getDirection().normalize();
        RayTraceResult blockHit = world.rayTraceBlocks(start, dir, RANGE, FluidCollisionMode.NEVER, false);
        double endDist = RANGE;
        if (blockHit != null) {
            endDist = start.toVector().distance(blockHit.getHitPosition());
        }
        Location endLoc = start.clone().add(dir.clone().multiply(endDist));
        double beamRadius = BEAM_RADIUS;
        double minX = Math.min(start.getX(), endLoc.getX()) - beamRadius;
        double minY = Math.min(start.getY(), endLoc.getY()) - beamRadius;
        double minZ = Math.min(start.getZ(), endLoc.getZ()) - beamRadius;
        double maxX = Math.max(start.getX(), endLoc.getX()) + beamRadius;
        double maxY = Math.max(start.getY(), endLoc.getY()) + beamRadius;
        double maxZ = Math.max(start.getZ(), endLoc.getZ()) + beamRadius;
        Location queryCenter = new Location(world, (minX + maxX) / 2.0, (minY + maxY) / 2.0, (minZ + maxZ) / 2.0);
        Vector startVec = start.toVector();
        for (Entity ent : world.getNearbyEntities(queryCenter, (maxX - minX) / 2.0, (maxY - minY) / 2.0, (maxZ - minZ) / 2.0)) {
            if (!(ent instanceof LivingEntity living) || ent == player) {
                continue;
            }
            if (living.getBoundingBox().expand(beamRadius).rayTrace(startVec, dir, endDist) == null) {
                continue;
            }
            GunCombat.dealSit(living, player, item, SIT_BEAM_MULT);
        }

        Vector anyVec = new Vector(0, 1, 0);
        if (Math.abs(dir.getX()) < 0.01 && Math.abs(dir.getZ()) < 0.01) {
            anyVec = new Vector(1, 0, 0);
        }
        Vector perp1 = dir.clone().crossProduct(anyVec).normalize();
        Vector perp2 = perp1.clone().crossProduct(dir).normalize();
        int ringPoints = 12;
        double ringRadius = 0.55;
        Vector[] ringOffsets = new Vector[ringPoints];
        for (int j = 0; j < ringPoints; j++) {
            double angle = (j / (double) ringPoints) * Math.PI * 2;
            ringOffsets[j] = perp1.clone().multiply(Math.cos(angle) * ringRadius)
                .add(perp2.clone().multiply(Math.sin(angle) * ringRadius));
        }
        Location tracer = start.clone();
        Vector stepVec = dir.clone().multiply(0.5);
        int steps = (int) Math.floor(endDist / 0.5);
        for (int i = 0; i < steps; i++) {
            world.spawnParticle(Particle.DUST, tracer, 3, 0, 0, 0, 0, BEAM_CORE);
            if (i % 4 == 0) {
                world.spawnParticle(Particle.ELECTRIC_SPARK, tracer, 15, 0.4, 0.4, 0.4, 0);
            }
            for (Vector off : ringOffsets) {
                world.spawnParticle(Particle.DUST, tracer.clone().add(off), 1, 0, 0, 0, 0, BEAM_RING);
            }
            tracer.add(stepVec);
        }
        Location wave = start.clone();
        Vector waveStep = dir.clone().multiply(1.0);
        int waveSteps = (int) Math.floor(endDist / 1.0);
        for (int w = 0; w < waveSteps; w++) {
            world.spawnParticle(Particle.SONIC_BOOM, wave, 1, 0, 0, 0, 0);
            wave.add(waveStep);
        }
        if (blockHit != null) {
            var hp = blockHit.getHitPosition();
            Location hitLoc = new Location(world, hp.getX(), hp.getY(), hp.getZ());
            world.spawnParticle(Particle.DUST, hitLoc, 25, 0.3, 0.3, 0.3, 0.15, BEAM_CORE);
            world.spawnParticle(Particle.ELECTRIC_SPARK, hitLoc, 40, 0.4, 0.4, 0.4, 0.15);
            world.spawnParticle(Particle.EXPLOSION, hitLoc, 3, 0.5, 0.5, 0.5, 0.1);
        }
        world.spawnParticle(Particle.DUST, start, 25, 0.2, 0.2, 0.2, 0, BEAM_CORE);
        world.spawnParticle(Particle.ELECTRIC_SPARK, start, 10, 0.15, 0.15, 0.15, 0.08);
        world.playSound(start, "block.beacon.activate", 3.0f, 0.6f);
        world.playSound(start, "item.mace.smash_ground_heavy", 3.0f, 1.0f);
    }

    private static void adjustPitch(Player player, float degrees) {
        Location loc = player.getLocation();
        float newPitch = loc.getPitch() - degrees;
        if (newPitch > 90) {
            newPitch = 90;
        }
        if (newPitch < -90) {
            newPitch = -90;
        }
        try {
            player.setRotation(loc.getYaw(), newPitch);
        } catch (Throwable t) {
            loc.setPitch(newPitch);
            player.teleport(loc);
        }
    }
}
