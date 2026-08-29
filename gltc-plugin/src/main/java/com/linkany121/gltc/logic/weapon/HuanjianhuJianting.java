package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

/**
 * 剑霆 (XinTing-state left-click) — radial burst + thunder AoE.
 */
final class HuanjianhuJianting {

    private HuanjianhuJianting() {
    }

    static void cast(Player player) {
        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();

        Location footLoc = player.getLocation().add(0, 0.3, 0);
        HuanjianhuFx.spawnDust(world, footLoc, 140, 2.4, 1.0, 2.4, 0, HuanjianhuFx.THUNDER_DUST);
        HuanjianhuFx.spawnDust(world, footLoc, 80, 2.0, 0.8, 2.0, 0, HuanjianhuFx.THUNDER_DUST2);
        world.spawnParticle(Particle.ELECTRIC_SPARK, footLoc, 60, 2.2, 1.0, 2.2, 0.05);
        world.spawnParticle(Particle.CLOUD, footLoc, 40, 1.4, 0.6, 1.4, 0.08);
        world.playSound(footLoc, "block.fire.extinguish", 1.0f, 1.6f);
        world.playSound(footLoc, "entity.player.attack.sweep", 0.6f, 1.8f);
        world.playSound(footLoc, "entity.wither.shoot", 0.8f, 1.2f);

        HuanjianhuFx.RayHit ray = HuanjianhuFx.rayTraceLivingAhead(
            world, eye, dir, HuanjianhuWeaponLogic.JIANTING_RANGE, player
        );
        Location endLoc;
        if (ray.entity != null) {
            endLoc = ray.entity.getLocation().clone().add(0, ray.entity.getHeight() * 0.5, 0);
        } else if (ray.loc != null) {
            endLoc = ray.loc.clone();
        } else {
            endLoc = eye.clone().add(dir.clone().multiply(HuanjianhuWeaponLogic.JIANTING_RANGE));
        }

        playJiantingRadialBurst(world, endLoc);

        try {
            world.spawnParticle(Particle.FLASH, endLoc, 2, 0.2, 0.2, 0.2, 0);
        } catch (Throwable ignored) {
        }
        HuanjianhuFx.spawnDust(world, endLoc, 180, 2.8, 2.8, 2.8, 0.35, HuanjianhuFx.THUNDER_DUST2);
        HuanjianhuFx.spawnDust(world, endLoc, 200, 3.2, 3.2, 3.2, 0.40, HuanjianhuFx.THUNDER_DUST);
        HuanjianhuFx.spawnDust(world, endLoc, 160, 3.0, 3.0, 3.0, 0.38, HuanjianhuFx.THUNDER_WHITE);
        HuanjianhuFx.spawnDust(world, endLoc, 80, 1.2, 1.2, 1.2, 0.15, HuanjianhuFx.DARK_RED_DUST);
        world.spawnParticle(Particle.ELECTRIC_SPARK, endLoc, 120, 3.0, 3.0, 3.0, 0.12);
        world.spawnParticle(Particle.END_ROD, endLoc, 40, 1.5, 1.5, 1.5, 0.08);
        try {
            world.spawnParticle(Particle.EXPLOSION, endLoc, 3, 0.6, 0.6, 0.6, 0);
        } catch (Throwable eExp) {
            try {
                world.spawnParticle(Particle.valueOf("EXPLOSION_LARGE"), endLoc, 2, 0.4, 0.4, 0.4, 0);
            } catch (Throwable ignored) {
            }
        }

        for (int t = 0; t < HuanjianhuWeaponLogic.JIANTING_THUNDER_COUNT; t++) {
            Location strikeLoc = endLoc.clone().add(
                (Math.random() - 0.5) * 4.0,
                (Math.random() - 0.5) * 2.0,
                (Math.random() - 0.5) * 4.0
            );
            world.strikeLightningEffect(strikeLoc);
        }

        double thunderDmg = GltcAbilityPower.calcDamage(HuanjianhuWeaponLogic.SIT_JIANTING_MULT);
        boolean hitAny = HuanjianhuFx.aoeDamage(
            world, endLoc, player, HuanjianhuWeaponLogic.JIANTING_AOE_RADIUS, thunderDmg
        );

        world.playSound(endLoc, "entity.lightning_bolt.thunder", 1.6f, 0.65f);
        world.playSound(endLoc, "entity.generic.explode", 1.7f, 0.75f);
        world.playSound(endLoc, "block.respawn_anchor.explode", 1.5f, 0.8f);
        if (hitAny) {
            world.playSound(player.getLocation(), "entity.lightning_bolt.thunder", 1.0f, 0.9f);
        }
    }

    private static void playJiantingRadialBurst(World world, Location center) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        double cx = center.getX();
        double cy = center.getY();
        double cz = center.getZ();
        RayDir[] dirs = buildJiantingRayDirections(HuanjianhuWeaponLogic.JIANTING_RAY_COUNT);
        Particle.DustOptions[] dustByIdx = {
            HuanjianhuFx.BLACK_DUST, HuanjianhuFx.DARK_RED_DUST, HuanjianhuFx.RED_DUST
        };
        double segStep = 0.22;

        HuanjianhuFx.spawnDust(world, center, 5, 0.04, 0.04, 0.04, 0, HuanjianhuFx.DARK_RED_DUST2);
        HuanjianhuFx.spawnDust(world, center, 3, 0.02, 0.02, 0.02, 0, HuanjianhuFx.BLACK_DUST);
        try {
            world.spawnParticle(Particle.SMOKE, center, 2, 0.05, 0.05, 0.05, 0.01);
        } catch (Throwable ignored) {
        }

        new BukkitRunnable() {
            int tick = 0;

            @Override
            public void run() {
                tick++;
                double prevR = (tick - 1) * HuanjianhuWeaponLogic.JIANTING_RAY_STEP;
                double curR = tick * HuanjianhuWeaponLogic.JIANTING_RAY_STEP;

                for (RayDir d : dirs) {
                    Particle.DustOptions dust = dustByIdx[d.colorIdx];
                    for (double r = prevR + segStep; r <= curR + 0.001; r += segStep) {
                        Location pl = new Location(
                            world, cx + d.dx * r, cy + d.dy * r, cz + d.dz * r
                        );
                        HuanjianhuFx.spawnDust(world, pl, 1, 0, 0, 0, 0, dust);
                    }
                }

                if (tick >= HuanjianhuWeaponLogic.JIANTING_RAY_LENGTH) {
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0, 1);
    }

    private static RayDir[] buildJiantingRayDirections(int count) {
        RayDir[] dirs = new RayDir[count];
        for (int i = 0; i < count; i++) {
            double theta = Math.random() * 2 * Math.PI;
            double phi = Math.acos(2 * Math.random() - 1);
            dirs[i] = new RayDir(
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta),
                i % 3
            );
        }
        return dirs;
    }

    private record RayDir(double dx, double dy, double dz, int colorIdx) {
    }
}
