package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import com.linkany121.gltc.logic.gun.GunCombat;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.metadata.FixedMetadataValue;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/**
 * 焰眸 (right-click) — red array + falling flame swords.
 */
final class HuanjianhuYanmou {

    private static final String META_YANMOU_DEDUP = "gltc_huanjianhu_yanmou_dedup";

    private static final Map<UUID, BukkitTask> YANMOU_TASKS = new ConcurrentHashMap<>();

    private HuanjianhuYanmou() {
    }

    static void cancelTask(UUID uuid) {
        BukkitTask task = YANMOU_TASKS.remove(uuid);
        if (task != null) {
            task.cancel();
        }
    }

    static void clearAll() {
        for (UUID uuid : new java.util.HashSet<>(YANMOU_TASKS.keySet())) {
            cancelTask(uuid);
        }
    }

    static void cast(Player player, Map<UUID, Long> yanmouCdMap) {
        if (player == null || !player.isOnline()) {
            return;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        if (player.hasMetadata(META_YANMOU_DEDUP)) {
            return;
        }

        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        Long last = yanmouCdMap.get(uuid);
        if (last != null && (now - last) < HuanjianhuWeaponLogic.YANMOU_COOLDOWN_MS) {
            long remain = (long) Math.ceil(
                (HuanjianhuWeaponLogic.YANMOU_COOLDOWN_MS - (now - last)) / 1000.0
            );
            GunCombat.sendActionBar(player,
                HuanjianhuWeaponLogic.MSG_FLAME_EYE_COOLDOWN.replace("{secs}", String.valueOf(remain)));
            return;
        }

        try {
            player.setMetadata(META_YANMOU_DEDUP, new FixedMetadataValue(plugin, true));
            Bukkit.getScheduler().runTaskLater(plugin, () -> {
                try {
                    player.removeMetadata(META_YANMOU_DEDUP, plugin);
                } catch (Throwable ignored) {
                }
            }, 2L);
        } catch (Throwable ignored) {
        }

        try {
            World world = player.getWorld();
            Location eye = player.getEyeLocation();

            LivingEntity farthest = null;
            double farthestDist = 0;
            Vector forwardXZ = eye.getDirection().clone();
            forwardXZ.setY(0);
            if (forwardXZ.lengthSquared() < 0.001) {
                forwardXZ = new Vector(1, 0, 0);
            }
            forwardXZ.normalize();

            for (Entity ent : world.getNearbyEntities(eye, 20, 20, 20)) {
                if (!(ent instanceof LivingEntity living) || living.isDead()) {
                    continue;
                }
                if (living.getUniqueId().equals(player.getUniqueId())) {
                    continue;
                }
                Location eLoc = living.getLocation();
                Vector rel = eLoc.toVector().subtract(eye.toVector());
                Vector relXZ = rel.clone();
                relXZ.setY(0);
                if (relXZ.dot(forwardXZ) <= 0) {
                    continue;
                }
                double dist = rel.length();
                if (dist <= 20 && dist > farthestDist) {
                    farthestDist = dist;
                    farthest = living;
                }
            }

            Location circleCenter;
            if (farthest != null) {
                Location fLoc = farthest.getLocation();
                int fgY = world.getHighestBlockYAt(fLoc.getBlockX(), fLoc.getBlockZ());
                circleCenter = new Location(
                    world, fLoc.getX(),
                    fgY + 0.5 + HuanjianhuWeaponLogic.YANMOU_HEIGHT_ABOVE,
                    fLoc.getZ()
                );
            } else {
                double centerX = eye.getX() + forwardXZ.getX() * HuanjianhuWeaponLogic.YANMOU_FORWARD;
                double centerZ = eye.getZ() + forwardXZ.getZ() * HuanjianhuWeaponLogic.YANMOU_FORWARD;
                int ngY = world.getHighestBlockYAt((int) Math.floor(centerX), (int) Math.floor(centerZ));
                circleCenter = new Location(
                    world, centerX,
                    ngY + 0.5 + HuanjianhuWeaponLogic.YANMOU_HEIGHT_ABOVE,
                    centerZ
                );
            }
            double radius = HuanjianhuWeaponLogic.YANMOU_RADIUS;

            cancelTask(uuid);

            Location circleFinal = circleCenter;
            BukkitTask task = new BukkitRunnable() {
                int phase = 0;
                int phaseTick = 0;
                int tick = 0;

                @Override
                public void run() {
                    try {
                        Player owner = Bukkit.getPlayer(uuid);
                        if (owner == null || !owner.isOnline()) {
                            cancel();
                            YANMOU_TASKS.remove(uuid);
                            return;
                        }

                        if (phase == 0) {
                            Location start = owner.getLocation().clone().add(0, 1.5, 0);
                            Location end = circleFinal.clone();
                            double t = phaseTick / (double) HuanjianhuWeaponLogic.YANMOU_CAST_TICK;
                            if (t > 1) {
                                t = 1;
                            }
                            Location ballPos = start.clone().add(
                                end.clone().subtract(start).multiply(t)
                            );
                            drawYanmouRedOrb(world, ballPos);
                            phaseTick++;
                            if (phaseTick >= HuanjianhuWeaponLogic.YANMOU_CAST_TICK) {
                                phase = 1;
                                phaseTick = 0;
                            }
                            return;
                        }

                        if (phase == 1) {
                            double curR = radius * (phaseTick / (double) HuanjianhuWeaponLogic.YANMOU_CAST_TICK);
                            if (curR > 0) {
                                drawYanmouRunes(world, circleFinal, Math.max(curR, 0.3));
                            }
                            phaseTick++;
                            if (phaseTick >= HuanjianhuWeaponLogic.YANMOU_CAST_TICK) {
                                phase = 2;
                                phaseTick = 0;
                            }
                            return;
                        }

                        if (tick >= HuanjianhuWeaponLogic.YANMOU_DURATION_TICK) {
                            cancel();
                            YANMOU_TASKS.remove(uuid);
                            return;
                        }
                        drawYanmouRunes(world, circleFinal, radius);

                        if (tick % HuanjianhuWeaponLogic.YANMOU_INTERVAL_TICK == 0) {
                            fireRound(world, circleFinal, radius, owner);
                        }
                        tick++;
                    } catch (Throwable ex) {
                        plugin.getLogger().log(Level.WARNING, "[隐兰狂玉唤剑葫] 焰眸tick异常", ex);
                    }
                }
            }.runTaskTimer(plugin, 0, 1);

            YANMOU_TASKS.put(uuid, task);
            yanmouCdMap.put(uuid, now);
            world.playSound(player.getLocation(), "block.beacon.power_select", 1.0f, 0.8f);
            world.playSound(circleCenter, "block.beacon.power_select", 1.2f, 0.6f);
            HuanjianhuWeaponLogic.addXinTingStack(player);
        } catch (Throwable ex) {
            cancelTask(uuid);
            plugin.getLogger().log(Level.WARNING, "[隐兰狂玉唤剑葫] 焰眸施展异常", ex);
            GunCombat.sendActionBar(player, "§c焰眸施展失败");
        }
    }

    private static void fireRound(World world, Location circleCenter, double radius, Player owner) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        List<Location> dropLocs = new ArrayList<>();
        double searchY = circleCenter.getY() - HuanjianhuWeaponLogic.YANMOU_HEIGHT_ABOVE;
        Location searchCenter = circleCenter.clone();
        searchCenter.setY(searchY + HuanjianhuWeaponLogic.YANMOU_HEIGHT_ABOVE / 2.0);
        double searchRadius = Math.max(radius, HuanjianhuWeaponLogic.YANMOU_HEIGHT_ABOVE + radius);

        for (Entity ent : world.getNearbyEntities(searchCenter, radius, searchRadius, radius)) {
            if (!(ent instanceof LivingEntity living) || living.isDead()) {
                continue;
            }
            if (living.getUniqueId().equals(owner.getUniqueId())) {
                continue;
            }
            Location eLoc = living.getLocation();
            double dx = eLoc.getX() - circleCenter.getX();
            double dz = eLoc.getZ() - circleCenter.getZ();
            if (dx * dx + dz * dz > radius * radius) {
                continue;
            }
            dropLocs.add(eLoc.clone());
        }

        if (dropLocs.isEmpty()) {
            for (int rs = 0; rs < 5; rs++) {
                double ra = Math.random() * 2 * Math.PI;
                double rr = Math.sqrt(Math.random()) * radius * 0.9;
                double rx = circleCenter.getX() + Math.cos(ra) * rr;
                double rz = circleCenter.getZ() + Math.sin(ra) * rr;
                dropLocs.add(new Location(
                    world, rx,
                    world.getHighestBlockYAt((int) Math.floor(rx), (int) Math.floor(rz)) - 0.5,
                    rz
                ));
            }
        }

        int dropCount = dropLocs.size();
        if (dropCount > 5) {
            dropCount = 5;
        }
        if (dropCount <= 0) {
            return;
        }

        double roundDamage = GltcAbilityPower.calcDamage(
            HuanjianhuWeaponLogic.SIT_YANMOU_TOTAL_MULT / dropCount
        );
        for (int dl = 0; dl < dropCount; dl++) {
            try {
                Location fallTarget = dropLocs.get(dl).clone();
                fallTarget.setY(
                    world.getHighestBlockYAt(fallTarget.getBlockX(), fallTarget.getBlockZ()) - 0.5
                );
                double dropHeight = circleCenter.getY() - fallTarget.getY();
                if (dropHeight < 3) {
                    dropHeight = 3;
                }
                int dropTicks = Math.max(
                    HuanjianhuWeaponLogic.YANMOU_SWORD_DROP_TICK,
                    (int) Math.floor(dropHeight * 1.5)
                );
                HuanjianhuFx.summonFlameSwordDrop(
                    world, fallTarget, owner, dropHeight, dropTicks,
                    HuanjianhuWeaponLogic.AOE_RADIUS, roundDamage
                );
            } catch (Throwable dropEx) {
                if (plugin != null) {
                    plugin.getLogger().log(Level.WARNING, "[隐兰狂玉唤剑葫] 焰眸落剑异常", dropEx);
                }
            }
        }
    }

    static void drawYanmouRunes(World world, Location circleCenter, double r) {
        int n = 90;
        for (int i = 0; i < n; i++) {
            double a = (i / (double) n) * 2 * Math.PI;
            Location pl = circleCenter.clone().add(Math.cos(a) * r, 0, Math.sin(a) * r);
            HuanjianhuFx.spawnDust(world, pl, 1, 0, 0, 0, 0, HuanjianhuFx.RED_DUST_BIG);
            world.spawnParticle(Particle.FLAME, pl, 1, 0, 0, 0, 0);
            Location plUp = pl.clone().add(0, 0.6, 0);
            HuanjianhuFx.spawnDust(world, plUp, 1, 0, 0, 0, 0, HuanjianhuFx.RED_DUST_BIG);
            world.spawnParticle(Particle.FLAME, plUp, 1, 0, 0, 0, 0);
        }
        double[] innerRadii = {r * 0.66, r * 0.4, r * 0.16};
        for (int rr = 0; rr < innerRadii.length; rr++) {
            int nr = 60 - rr * 12;
            for (int j = 0; j < nr; j++) {
                double a2 = (j / (double) nr) * 2 * Math.PI;
                Location pl2 = circleCenter.clone().add(
                    Math.cos(a2) * innerRadii[rr], 0, Math.sin(a2) * innerRadii[rr]
                );
                HuanjianhuFx.spawnDust(world, pl2, 1, 0, 0, 0, 0, HuanjianhuFx.RED_DUST);
                world.spawnParticle(Particle.FLAME, pl2, 1, 0, 0, 0, 0);
            }
        }
        world.spawnParticle(Particle.FLAME, circleCenter, 20, 1.2, 0.4, 1.2, 0.03);
        HuanjianhuFx.spawnDust(world, circleCenter, 30, 1.2, 0.4, 1.2, 0, HuanjianhuFx.RED_DUST);
    }

    static void drawYanmouRedOrb(World world, Location loc) {
        for (int i = 0; i < 14; i++) {
            double theta = Math.random() * 2 * Math.PI;
            double phi = Math.acos(2 * Math.random() - 1);
            double or = 0.8;
            double ox = loc.getX() + or * Math.sin(phi) * Math.cos(theta);
            double oy = loc.getY() + or * Math.cos(phi);
            double oz = loc.getZ() + or * Math.sin(phi) * Math.sin(theta);
            HuanjianhuFx.spawnDust(
                world, new Location(world, ox, oy, oz), 1, 0, 0, 0, 0, HuanjianhuFx.RED_DUST
            );
        }
        world.spawnParticle(Particle.FLAME, loc, 3, 0.5, 0.5, 0.5, 0);
    }
}
