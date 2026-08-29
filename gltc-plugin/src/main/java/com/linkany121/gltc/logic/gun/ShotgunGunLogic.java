package com.linkany121.gltc.logic.gun;

import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;

/** {@code FKR_通古斯战壕霰弹} */
public final class ShotgunGunLogic extends AbstractGunLogic {

    // ===== 配置区（通古斯战壕霰弹，改完需重新打包 jar 并重启生效）=====
    private static final double SIT_PER_PELLET = 0.8;   // 每颗弹丸的伤害倍率（同一目标命中 n 颗 = 倍率 × n）
    private static final long COOLDOWN_MS = 500;        // 射击间隔（毫秒），500 = 0.5 秒
    private static final double RANGE = 40;             // 散射射程（格）
    private static final double SCATTER_ANGLE_DEG = 30; // 散射锥角（度），越大散布越开
    private static final int BULLET_COUNT = 8;          // 一次射出的弹丸数量（越多越密，越耗性能）

    private final GunCombat.CooldownMap cd = new GunCombat.CooldownMap();
    private final Random random = new Random();

    @Override
    public void clearGunState(Player player) {
        if (player != null) {
            cd.clear(player.getUniqueId());
        }
    }

    @Override
    protected void fire(Player player, ItemStack hand) {
        long now = System.currentTimeMillis();
        if (cd.onCooldown(player.getUniqueId(), now, COOLDOWN_MS)) {
            GunCombat.sendActionBar(player, "§c射击过于频繁！");
            player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7f, 1.0f);
            return;
        }
        cd.mark(player.getUniqueId(), now);
        GunCombat.scheduleReloadSound(player, COOLDOWN_MS);

        World world = player.getWorld();
        Location start = player.getEyeLocation();
        Vector baseDir = start.getDirection().normalize();
        double halfAngle = (SCATTER_ANGLE_DEG / 2.0) * Math.PI / 180.0;
        List<Vector> dirs = generateDirections(baseDir, halfAngle, BULLET_COUNT);

        Map<UUID, HitAcc> hits = new HashMap<>();
        for (Vector d : dirs) {
            RayTraceResult ray = GunCombat.rayTraceLiving(world, start, d, RANGE, player);
            if (ray == null || !(ray.getHitEntity() instanceof LivingEntity living)) {
                continue;
            }
            hits.computeIfAbsent(living.getUniqueId(), u -> new HitAcc(living)).count++;
        }
        for (HitAcc acc : hits.values()) {
            GunCombat.dealSit(acc.entity, player, hand, SIT_PER_PELLET * acc.count);
        }

        for (Vector d : dirs) {
            Location tracer = start.clone();
            Vector step = d.clone().multiply(0.7);
            int steps = (int) Math.floor(RANGE / 0.7);
            for (int i = 0; i < steps; i++) {
                world.spawnParticle(org.bukkit.Particle.DUST, tracer, 1, 0.02, 0.02, 0.02, 0, GunCombat.BLACK_DUST);
                tracer.add(step);
            }
        }
        world.playSound(start, "entity.generic.explode", 0.5f, 1.5f);
        world.playSound(start, "entity.firework_rocket.blast", 0.3f, 1.3f);
    }

    private List<Vector> generateDirections(Vector baseDir, double halfAngle, int count) {
        List<Vector> dirs = new ArrayList<>(count);
        Vector u;
        Vector v;
        if (Math.abs(baseDir.getX()) < 0.0001 && Math.abs(baseDir.getZ()) < 0.0001) {
            u = new Vector(1, 0, 0);
            v = new Vector(0, 0, 1);
        } else {
            u = baseDir.clone().crossProduct(new Vector(0, 1, 0)).normalize();
            v = baseDir.clone().crossProduct(u).normalize();
        }
        for (int i = 0; i < count; i++) {
            double theta = random.nextDouble() * halfAngle;
            double phi = random.nextDouble() * 2 * Math.PI;
            Vector dir = baseDir.clone().multiply(Math.cos(theta));
            dir.add(u.clone().multiply(Math.cos(phi) * Math.sin(theta)));
            dir.add(v.clone().multiply(Math.sin(phi) * Math.sin(theta)));
            dirs.add(dir.normalize());
        }
        return dirs;
    }

    private static final class HitAcc {
        final LivingEntity entity;
        int count;

        HitAcc(LivingEntity entity) {
            this.entity = entity;
        }
    }
}
