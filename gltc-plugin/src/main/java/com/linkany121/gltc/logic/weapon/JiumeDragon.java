package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.boss.BossBar;
import org.bukkit.entity.EnderDragon;
import org.bukkit.entity.Entity;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.logging.Level;

/**
 * 宴死者之龙 (EnderDragon fall / blast) for {@link JiumeWeaponLogic}.
 */
final class JiumeDragon {

    private JiumeDragon() {
    }

    static void summonFeastDragon(Player owner, LivingEntity target) {
        if (target == null) {
            return;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        World world = target.getWorld();
        Location base = target.getLocation().clone();
        double height = 1.8;
        try {
            height = Math.max(0.6, target.getHeight());
        } catch (Throwable ignored) {
        }
        float yaw = 0;
        try {
            yaw = target.getLocation().getYaw();
        } catch (Throwable ignored) {
        }
        double headY = base.getY() + height;
        double startY = headY + JiumeWeaponLogic.DRAGON_HEIGHT;
        double landY = JiumeWeaponLogic.DRAGON_LAND_ON_GROUND
            ? JiumeFx.getGroundY(world, base.getX(), base.getZ(), base.getY())
            : base.getY();
        Location start = new Location(world, base.getX(), startY, base.getZ());
        start.setPitch(90);
        start.setYaw(yaw);

        if (owner != null) {
            JiumeFx.sendColored(owner, JiumeWeaponLogic.MSG_DRAGON_LINE1);
            JiumeFx.sendColored(owner, JiumeWeaponLogic.MSG_DRAGON_LINE2);
        }

        JiumeFx.drawDragonCircle(world, start.clone());
        Location growlAt = new Location(world, base.getX(), landY + JiumeWeaponLogic.DRAGON_LAND_FX_LIFT, base.getZ());
        JiumeFx.playDragonGrowl(owner, growlAt);

        JiumeFx.track(new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    EnderDragon dragon = null;
                    try {
                        Class<? extends Entity> cls = EntityType.ENDER_DRAGON.getEntityClass();
                        if (cls != null && EnderDragon.class.isAssignableFrom(cls)) {
                            @SuppressWarnings("unchecked")
                            Class<? extends EnderDragon> dCls = (Class<? extends EnderDragon>) cls;
                            dragon = world.spawn(start, dCls);
                        }
                    } catch (Throwable eSpawn) {
                        try {
                            Entity e = world.spawnEntity(start, EntityType.ENDER_DRAGON);
                            if (e instanceof EnderDragon ed) {
                                dragon = ed;
                            } else {
                                e.remove();
                            }
                        } catch (Throwable eSpawn2) {
                            plugin.getLogger().log(Level.WARNING, "[咀梦] 无法生成末影龙，改用纯特效下落", eSpawn2);
                            startDragonFall(null, world, base, landY, startY, owner, target);
                            return;
                        }
                    }
                    if (dragon == null) {
                        startDragonFall(null, world, base, landY, startY, owner, target);
                        return;
                    }
                    setupFeastDragon(dragon);
                    try {
                        dragon.teleport(start);
                    } catch (Throwable ignored) {
                    }
                    JiumeFx.playDragonGrowl(owner, growlAt);
                    startDragonFall(dragon, world, base, landY, startY, owner, target);
                } catch (Throwable ex) {
                    plugin.getLogger().log(Level.WARNING, "[咀梦] 龙诞生流程异常", ex);
                    try {
                        startDragonFall(null, world, base, landY, startY, owner, target);
                    } catch (Throwable ignored) {
                    }
                }
            }
        }.runTaskLater(plugin, JiumeWeaponLogic.DRAGON_BIRTH_DELAY_TICKS));
    }

    private static void setupFeastDragon(EnderDragon dragon) {
        try {
            dragon.setPhase(EnderDragon.Phase.HOVER);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setGravity(false);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setSilent(true);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setInvulnerable(true);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setPersistent(true);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setRemoveWhenFarAway(false);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setCollidable(false);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setAware(false);
        } catch (Throwable ignored) {
        }
        JiumeFx.setMeta(dragon, JiumeWeaponLogic.META_DRAGON, true);
        hideDragonBossBar(dragon);
    }

    private static void hideDragonBossBar(EnderDragon dragon) {
        try {
            BossBar bar = dragon.getBossBar();
            if (bar == null) {
                return;
            }
            try {
                bar.setVisible(false);
            } catch (Throwable ignored) {
            }
            List<Player> ps = new ArrayList<>(bar.getPlayers());
            for (Player p : ps) {
                try {
                    bar.removePlayer(p);
                } catch (Throwable ignored) {
                }
            }
        } catch (Throwable ignored) {
        }
    }

    static void muteDragonSoundsNear(World world, Location loc) {
        if (world == null || loc == null) {
            return;
        }
        double rangeSq = JiumeWeaponLogic.DRAGON_MUTE_RANGE * JiumeWeaponLogic.DRAGON_MUTE_RANGE;
        try {
            for (Player p : world.getPlayers()) {
                if (p.getLocation().distanceSquared(loc) > rangeSq) {
                    continue;
                }
                try {
                    p.stopSound("entity.ender_dragon.death");
                } catch (Throwable ignored) {
                }
                try {
                    p.stopSound("entity.ender_dragon.flap");
                } catch (Throwable ignored) {
                }
            }
        } catch (Throwable ignored) {
        }
    }

    static void silentRemoveDragon(@Nullable EnderDragon dragon, World world, Location loc) {
        if (dragon == null) {
            return;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        try {
            dragon.setSilent(true);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setInvisible(true);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setInvulnerable(true);
        } catch (Throwable ignored) {
        }
        hideDragonBossBar(dragon);
        muteDragonSoundsNear(world, loc);
        try {
            dragon.remove();
        } catch (Throwable e4) {
            try {
                dragon.teleport(new Location(world, loc.getX(), world.getMinHeight() + 1, loc.getZ()));
                dragon.remove();
            } catch (Throwable ignored) {
            }
        }
        if (plugin != null) {
            for (int delay : JiumeWeaponLogic.DRAGON_MUTE_RETRY_TICKS) {
                JiumeFx.track(new BukkitRunnable() {
                    @Override
                    public void run() {
                        muteDragonSoundsNear(world, loc);
                    }
                }.runTaskLater(plugin, delay));
            }
        }
    }

    private static boolean forceDragonTransform(EnderDragon dragon, World world, double x, double y, double z, float yaw) {
        float faceYaw = yaw + (float) JiumeWeaponLogic.DRAGON_YAW_OFFSET;
        Location loc = new Location(world, x, y, z, faceYaw, (float) JiumeWeaponLogic.DRAGON_PITCH);
        boolean ok = false;
        try {
            ok = dragon.teleport(loc);
        } catch (Throwable e1) {
            try {
                dragon.teleport(loc);
                ok = true;
            } catch (Throwable ignored) {
            }
        }
        try {
            dragon.setRotation(faceYaw, (float) JiumeWeaponLogic.DRAGON_PITCH);
        } catch (Throwable ignored) {
        }
        try {
            dragon.setVelocity(new Vector(0, 0, 0));
        } catch (Throwable ignored) {
        }
        try {
            dragon.setPhase(EnderDragon.Phase.HOVER);
        } catch (Throwable ignored) {
        }
        return ok;
    }

    private static boolean isUsable(@Nullable EnderDragon dragon) {
        if (dragon == null) {
            return false;
        }
        try {
            return dragon.isValid() && !dragon.isDead();
        } catch (Throwable t) {
            return false;
        }
    }

    private static void startDragonFall(
        @Nullable EnderDragon dragonIn,
        World world,
        Location base,
        double landY,
        double startY,
        @Nullable Player owner,
        @Nullable LivingEntity target
    ) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        double fallPerTick = JiumeWeaponLogic.DRAGON_FALL_PER_SEC / 20.0;
        double[] posY = {startY};
        boolean[] landingDone = {false};
        int[] tickCount = {0};
        EnderDragon[] dragon = {dragonIn};
        Track track = new Track(base.getX(), base.getZ(), landY, base.getYaw());
        UUID dragonTargetUuid = target != null ? target.getUniqueId() : null;

        Runnable doLand = () -> {
            if (landingDone[0]) {
                return;
            }
            landingDone[0] = true;
            finishDragonLanding(world, owner, track, dragon[0], dragonTargetUuid);
            dragon[0] = null;
        };

        if (isUsable(dragon[0])) {
            forceDragonTransform(dragon[0], world, track.x, startY + JiumeWeaponLogic.DRAGON_LAND_ENTITY_OFFSET, track.z, track.yaw);
        }

        JiumeFx.track(new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    if (landingDone[0]) {
                        cancel();
                        return;
                    }
                    tickCount[0]++;
                    refreshTrack(track, target, base);

                    if (!isUsable(dragon[0])) {
                        dragon[0] = null;
                    } else {
                        hideDragonBossBar(dragon[0]);
                    }

                    posY[0] -= fallPerTick;
                    double dragonEntityY = posY[0] + JiumeWeaponLogic.DRAGON_LAND_ENTITY_OFFSET;
                    LivingEntity antiPushTarget = null;
                    Vector antiPushVel = null;
                    if (isUsable(dragon[0]) && target != null) {
                        try {
                            if (!target.isDead() && target.isValid()) {
                                antiPushTarget = target;
                                antiPushVel = target.getVelocity().clone();
                            }
                        } catch (Throwable ignored) {
                        }
                    }
                    if (isUsable(dragon[0])) {
                        forceDragonTransform(dragon[0], world, track.x, dragonEntityY, track.z, track.yaw);
                        if (posY[0] <= track.landY + JiumeWeaponLogic.DRAGON_REMOVE_ABOVE_LAND) {
                            silentRemoveDragon(dragon[0], world, new Location(world, track.x, dragonEntityY, track.z));
                            dragon[0] = null;
                        }
                    }
                    if (antiPushTarget != null && antiPushVel != null) {
                        LivingEntity apT = antiPushTarget;
                        Vector apV = antiPushVel;
                        Runnable fix = () -> {
                            try {
                                if (apT.isDead()) {
                                    return;
                                }
                                Vector cur = apT.getVelocity();
                                double dx = cur.getX() - apV.getX();
                                double dy = cur.getY() - apV.getY();
                                double dz = cur.getZ() - apV.getZ();
                                if (dx * dx + dy * dy + dz * dz > 0.04) {
                                    JiumeFx.restoreEntityVelocity(apT, apV, 0);
                                }
                            } catch (Throwable ignored) {
                            }
                        };
                        JiumeFx.track(new BukkitRunnable() {
                            @Override
                            public void run() {
                                fix.run();
                            }
                        }.runTaskLater(plugin, 0));
                        JiumeFx.track(new BukkitRunnable() {
                            @Override
                            public void run() {
                                fix.run();
                            }
                        }.runTaskLater(plugin, 1));
                    }
                    spawnFallTrail(world, track.x, posY[0], track.z);

                    if (posY[0] <= track.landY + JiumeWeaponLogic.DRAGON_LAND_Y_SLOP
                        || tickCount[0] >= JiumeWeaponLogic.DRAGON_FALL_MAX_TICKS) {
                        doLand.run();
                        cancel();
                    }
                } catch (Throwable ex) {
                    try {
                        refreshTrack(track, target, base);
                    } catch (Throwable ignored) {
                    }
                    doLand.run();
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 1, 1));
    }

    private static void refreshTrack(Track track, @Nullable LivingEntity target, Location fallbackBase) {
        if (target != null) {
            try {
                if (!target.isDead() && target.isValid()) {
                    Location loc = target.getLocation();
                    track.x = loc.getX();
                    track.z = loc.getZ();
                    track.landY = loc.getY();
                    track.yaw = loc.getYaw();
                    return;
                }
            } catch (Throwable ignored) {
            }
        }
        if (fallbackBase != null) {
            track.x = fallbackBase.getX();
            track.z = fallbackBase.getZ();
            track.landY = fallbackBase.getY();
            track.yaw = fallbackBase.getYaw();
        }
    }

    private static void spawnFallTrail(World world, double x, double posY, double z) {
        Location fxLoc = new Location(world, x, posY, z);
        JiumeFx.spawnCherry(world, fxLoc, 18, 1.8, 1.2, 1.8, 0.02);
        JiumeFx.spawnDust(world, fxLoc, 22, 1.6, 1.0, 1.6, 0, JiumeFx.PURPLE_DUST);
        JiumeFx.spawnDust(world, fxLoc.clone().add(0, -1, 0), 10, 1.2, 0.6, 1.2, 0, JiumeFx.PURPLE_BIG);
    }

    private static void finishDragonLanding(
        World world,
        @Nullable Player owner,
        Track track,
        @Nullable EnderDragon dragon,
        @Nullable UUID dragonTargetUuid
    ) {
        Location fxLocLand = new Location(world, track.x, track.landY + JiumeWeaponLogic.DRAGON_LAND_FX_LIFT, track.z);
        double dragonLandY = track.landY + JiumeWeaponLogic.DRAGON_LAND_ENTITY_OFFSET;
        if (isUsable(dragon)) {
            forceDragonTransform(dragon, world, track.x, dragonLandY, track.z, track.yaw);
            hideDragonBossBar(dragon);
        }
        JiumeFx.drawDragonCircle(world, fxLocLand);
        JiumeFx.spawnCherry(world, fxLocLand, 90, 3.5, 1.2, 3.5, 0.05);
        JiumeFx.spawnDust(world, fxLocLand, 100, 3.2, 1.0, 3.2, 0, JiumeFx.PURPLE_BIG);
        if (isUsable(dragon)) {
            silentRemoveDragon(dragon, world, fxLocLand);
        }
        playLandingAftermath(owner, fxLocLand, dragonTargetUuid);
    }

    private static void playLandingAftermath(@Nullable Player owner, Location landLoc, @Nullable UUID dragonTargetUuid) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        World world = landLoc.getWorld();
        Location center = landLoc.clone();

        JiumeFx.drawMagicCircle(world, center, JiumeWeaponLogic.DRAGON_LAND_CIRCLE_RADIUS, JiumeFx.PURPLE_BIG);
        JiumeFx.playSoundAt(world, center, "block.beacon.activate", 1.3f, 0.45f);
        JiumeFx.playSoundAt(world, center, "block.respawn_anchor.charge", 1.0f, 0.6f);

        double blastDmg = JiumeWeaponLogic.DRAGON_DAMAGE_FACTOR * GltcAbilityPower.getSit();
        double blastRadius = JiumeWeaponLogic.DRAGON_LAND_CIRCLE_RADIUS;

        for (int i = 0; i < JiumeWeaponLogic.DRAGON_BLAST_COUNT; i++) {
            final int index = i;
            Runnable blast = () -> {
                Location offset = center.clone().add(
                    (Math.random() - 0.5) * JiumeWeaponLogic.DRAGON_BLAST_OFFSET,
                    JiumeWeaponLogic.DRAGON_BLAST_Y,
                    (Math.random() - 0.5) * JiumeWeaponLogic.DRAGON_BLAST_OFFSET
                );
                JiumeFx.playLargeBlastFx(world, offset, owner, index);
                if (index == 0 || !JiumeWeaponLogic.DRAGON_BLAST_ONLY_FIRST_DAMAGES) {
                    JiumeFx.aoeDamage(world, center, owner, blastRadius, blastDmg,
                        new JiumeFx.AoeOptions()
                            .hitZhuLing(true)
                            .knockback(JiumeWeaponLogic.DRAGON_BLAST_KNOCKBACK)
                            .noKnockbackUuid(dragonTargetUuid));
                }
            };
            if (index == 0) {
                blast.run();
            } else {
                JiumeFx.track(new BukkitRunnable() {
                    @Override
                    public void run() {
                        try {
                            blast.run();
                        } catch (Throwable ignored) {
                        }
                    }
                }.runTaskLater(plugin, (long) JiumeWeaponLogic.DRAGON_BLAST_INTERVAL * index));
            }
        }

        long thirdDelay = (long) JiumeWeaponLogic.DRAGON_BLAST_INTERVAL * (JiumeWeaponLogic.DRAGON_BLAST_COUNT - 1);
        JiumeFx.track(new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    if (owner == null || !owner.isOnline()) {
                        return;
                    }
                    Location head = owner.getLocation().clone()
                        .add(0, owner.getHeight() + JiumeWeaponLogic.ZHU_LING_SPAWN_ABOVE_HEAD, 0);
                    double s = JiumeWeaponLogic.DRAGON_POST_ZHU_LING_SPREAD;
                    double[][] offsets = {{s, 0.0}, {-s, 0.0}, {0.0, s}, {0.0, -s}};
                    int nMax = Math.min(JiumeWeaponLogic.DRAGON_POST_ZHU_LING_COUNT, offsets.length);
                    for (int n = 0; n < nMax; n++) {
                        Location zlLoc = head.clone().add(
                            offsets[n][0],
                            JiumeWeaponLogic.DRAGON_POST_ZHU_LING_Y_STEP * n,
                            offsets[n][1]
                        );
                        JiumeZhuLing.summon(owner, zlLoc, null, true);
                    }
                } catch (Throwable ignored) {
                }
            }
        }.runTaskLater(plugin, thirdDelay + JiumeWeaponLogic.DRAGON_POST_ZHU_LING_DELAY));
    }

    private static final class Track {
        double x;
        double z;
        double landY;
        float yaw;

        Track(double x, double z, double landY, float yaw) {
            this.x = x;
            this.z = z;
            this.landY = landY;
            this.yaw = yaw;
        }
    }
}
