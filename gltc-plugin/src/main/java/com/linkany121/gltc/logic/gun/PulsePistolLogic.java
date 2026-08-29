package com.linkany121.gltc.logic.gun;

import org.bukkit.Color;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

/** {@code FKR_通古斯防御型脉冲手铳} — cylinder beam. */
public final class PulsePistolLogic extends AbstractGunLogic {

    // ===== 配置区（通古斯防御型脉冲手铳，改完需重新打包 jar 并重启生效）=====
    private static final double SIT_MULT = 6;               // 光束伤害倍率
    private static final long COOLDOWN_MS = 1000;           // 射击冷却（毫秒），1000 = 1 秒
    private static final double RANGE = 40;                 // 光束射程（格）
    private static final double BEAM_DIAMETER = 2.0;        // 光束直径（格），越大扫中更多目标
    private static final int WHITE_CIRCLE_POINTS = 12;      // 光束外白圈粒子数量
    private static final double WHITE_CIRCLE_RADIUS = 0.55; // 光束外白圈半径（格）

    private static final Particle.DustOptions BEAM_DUST =
        new Particle.DustOptions(Color.fromRGB(0, 230, 255), 1.2f);
    private static final Particle.DustOptions WHITE_DUST =
        new Particle.DustOptions(Color.fromRGB(255, 255, 255), 1.0f);

    private final GunCombat.CooldownMap cd = new GunCombat.CooldownMap();

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
            GunCombat.sendActionBar(player, "§b脉冲手铳充能中...");
            player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7f, 1.0f);
            return;
        }
        cd.mark(player.getUniqueId(), now);
        GunCombat.scheduleReloadSound(player, COOLDOWN_MS);

        World world = player.getWorld();
        Location start = player.getEyeLocation();
        Vector dir = start.getDirection().normalize();
        double beamRadius = BEAM_DIAMETER / 2.0;
        RayTraceResult blockHit = world.rayTraceBlocks(start, dir, RANGE, FluidCollisionMode.NEVER, false);
        double endDist = RANGE;
        if (blockHit != null) {
            endDist = start.toVector().distance(blockHit.getHitPosition());
        }
        Location endLoc = start.clone().add(dir.clone().multiply(endDist));
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
            GunCombat.dealSit(living, player, hand, SIT_MULT);
        }

        Vector anyVec = new Vector(0, 1, 0);
        if (Math.abs(dir.getX()) < 0.01 && Math.abs(dir.getZ()) < 0.01) {
            anyVec = new Vector(1, 0, 0);
        }
        Vector perp1 = dir.clone().crossProduct(anyVec).normalize();
        Vector perp2 = perp1.clone().crossProduct(dir).normalize();
        Vector[] whiteOffsets = new Vector[WHITE_CIRCLE_POINTS];
        for (int j = 0; j < WHITE_CIRCLE_POINTS; j++) {
            double angle = (j / (double) WHITE_CIRCLE_POINTS) * Math.PI * 2;
            whiteOffsets[j] = perp1.clone().multiply(Math.cos(angle) * WHITE_CIRCLE_RADIUS)
                .add(perp2.clone().multiply(Math.sin(angle) * WHITE_CIRCLE_RADIUS));
        }

        Location tracer = start.clone();
        Vector stepVec = dir.clone().multiply(0.5);
        int steps = (int) Math.floor(endDist / 0.5);
        for (int i = 0; i < steps; i++) {
            world.spawnParticle(Particle.DUST, tracer, 2, 0, 0, 0, 0, BEAM_DUST);
            if (i % 4 == 0) {
                world.spawnParticle(Particle.ELECTRIC_SPARK, tracer, 15, 0.4, 0.4, 0.4, 0);
            }
            for (Vector off : whiteOffsets) {
                world.spawnParticle(Particle.DUST, tracer.clone().add(off), 1, 0, 0, 0, 0, WHITE_DUST);
            }
            tracer.add(stepVec);
        }
        if (blockHit != null) {
            var hp = blockHit.getHitPosition();
            Location hitLoc = new Location(world, hp.getX(), hp.getY(), hp.getZ());
            world.spawnParticle(Particle.DUST, hitLoc, 20, 0.2, 0.2, 0.2, 0.1, BEAM_DUST);
            world.spawnParticle(Particle.ELECTRIC_SPARK, hitLoc, 30, 0.3, 0.3, 0.3, 0.1);
        }
        world.spawnParticle(Particle.DUST, start, 20, 0.15, 0.15, 0.15, 0, BEAM_DUST);
        world.spawnParticle(Particle.ELECTRIC_SPARK, start, 5, 0.1, 0.1, 0.1, 0.05);
        world.playSound(start, "entity.lightning_bolt.thunder", 0.4f, 1.8f);
        world.playSound(start, "block.beacon.activate", 0.6f, 2.0f);
        world.playSound(start, "entity.blaze.shoot", 0.3f, 1.5f);
        world.playSound(start, "entity.warden.sonic_boom", 0.4f, 0.9f);
        world.playSound(start, "block.end_gateway.spawn", 0.5f, 1.2f);
        world.playSound(start, "item.trident.thunder", 0.3f, 0.7f);
    }
}
