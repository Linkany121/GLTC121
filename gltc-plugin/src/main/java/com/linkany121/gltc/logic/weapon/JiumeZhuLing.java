package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import com.linkany121.gltc.logic.gun.GunCombat;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import javax.annotation.Nullable;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;

/**
 * 祝灵 (Allay) summon / homing for {@link JiumeWeaponLogic}.
 */
final class JiumeZhuLing {

    private static final PotionEffectType RESISTANCE = resolveResistance();
    private static final Map<UUID, Integer> COUNT = new ConcurrentHashMap<>();

    private JiumeZhuLing() {
    }

    static int getCount(UUID playerUuid) {
        return COUNT.getOrDefault(playerUuid, 0);
    }

    static void addCount(UUID playerUuid, int delta) {
        if (playerUuid == null) {
            return;
        }
        int n = getCount(playerUuid) + delta;
        if (n <= 0) {
            COUNT.remove(playerUuid);
        } else {
            COUNT.put(playerUuid, n);
        }
    }

    static void clearCount(UUID playerUuid) {
        if (playerUuid != null) {
            COUNT.remove(playerUuid);
        }
    }

    static void clearAll() {
        COUNT.clear();
    }

    static void spawnBurstAtPlayer(Player owner, int count, boolean bypassMax) {
        if (owner == null || !owner.isOnline() || count <= 0) {
            return;
        }
        Location head = owner.getLocation().clone()
            .add(0, owner.getHeight() + JiumeWeaponLogic.ZHU_LING_SPAWN_ABOVE_HEAD, 0);
        double s = JiumeWeaponLogic.DRAGON_POST_ZHU_LING_SPREAD;
        for (int n = 0; n < count; n++) {
            double ang = (count == 1) ? 0 : ((Math.PI * 2 * n) / count);
            Location zlLoc = head.clone().add(
                Math.cos(ang) * s,
                JiumeWeaponLogic.DRAGON_POST_ZHU_LING_Y_STEP * n,
                Math.sin(ang) * s
            );
            summon(owner, zlLoc, null, bypassMax);
        }
    }

    static void summon(Player owner, Location spawnLoc, @Nullable LivingEntity preferNear, boolean bypassMax) {
        if (owner == null || !owner.isOnline() || spawnLoc == null) {
            return;
        }
        UUID ownerId = owner.getUniqueId();
        if (!bypassMax && getCount(ownerId) >= JiumeWeaponLogic.ZHU_LING_MAX) {
            GunCombat.sendActionBar(owner, JiumeWeaponLogic.MSG_ZHU_LING_CAP + JiumeWeaponLogic.ZHU_LING_MAX);
            return;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        World world = spawnLoc.getWorld();
        if (world == null) {
            return;
        }

        LivingEntity allay;
        try {
            Entity spawned = world.spawnEntity(spawnLoc, EntityType.ALLAY);
            if (!(spawned instanceof LivingEntity living)) {
                spawned.remove();
                return;
            }
            allay = living;
        } catch (Throwable t) {
            plugin.getLogger().log(Level.WARNING, "[咀梦] 无法生成悦灵", t);
            return;
        }

        try {
            allay.setAI(false);
        } catch (Throwable ignored) {
        }
        try {
            allay.setGravity(false);
        } catch (Throwable ignored) {
        }
        try {
            allay.setSilent(true);
        } catch (Throwable ignored) {
        }
        try {
            allay.setInvulnerable(true);
        } catch (Throwable ignored) {
        }
        try {
            allay.setCollidable(false);
        } catch (Throwable ignored) {
        }
        try {
            allay.setRemoveWhenFarAway(true);
        } catch (Throwable ignored) {
        }
        if (RESISTANCE != null) {
            try {
                allay.addPotionEffect(new PotionEffect(
                    RESISTANCE,
                    JiumeWeaponLogic.ZHU_LING_RESIST_TICKS,
                    JiumeWeaponLogic.ZHU_LING_RESIST_LEVEL,
                    false, true, true
                ));
            } catch (Throwable ignored) {
            }
        }
        JiumeFx.setMeta(allay, JiumeWeaponLogic.META_ZHU_LING, ownerId.toString());
        addCount(ownerId, 1);

        JiumeFx.playSoundAt(world, spawnLoc, JiumeWeaponLogic.ZHU_LING_SPAWN_SOUND, 0.9f, 1.4f);
        JiumeFx.spawnCherry(world, spawnLoc, 12, 0.3, 0.3, 0.3, 0.01);
        JiumeFx.spawnDust(world, spawnLoc, 8, 0.25, 0.25, 0.25, 0, JiumeFx.LIGHT_PURPLE);

        Location searchFrom = preferNear != null ? preferNear.getLocation() : spawnLoc;
        LivingEntity[] target = {findNearestTarget(searchFrom, owner, JiumeWeaponLogic.ZHU_LING_SEARCH_RANGE)};
        int[] ticksAlive = {0};
        boolean[] hit = {false};
        JiumeChiming chiming = JiumeWeaponLogic.chiming();

        JiumeFx.track(new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    if (allay.isDead() || !allay.isValid()) {
                        if (!hit[0]) {
                            addCount(ownerId, -1);
                        }
                        cancel();
                        return;
                    }
                    ticksAlive[0]++;
                    Location loc = allay.getLocation();
                    JiumeFx.spawnCherry(world, loc, JiumeWeaponLogic.ZHU_LING_TRAIL_CHERRY, 0.08, 0.08, 0.08, 0.0);
                    JiumeFx.spawnDust(world, loc, JiumeWeaponLogic.ZHU_LING_TRAIL_DUST, 0.05, 0.05, 0.05, 0, JiumeFx.LIGHT_PURPLE);

                    LivingEntity cur = target[0];
                    if (cur == null || cur.isDead() || !cur.isValid()
                        || (JiumeWeaponLogic.CHIMING_FULL_NO_TARGET
                        && chiming.getStacks(cur) >= JiumeWeaponLogic.CHIMING_RING_MAX)) {
                        target[0] = findNearestTarget(loc, owner, JiumeWeaponLogic.ZHU_LING_SEARCH_RANGE);
                        cur = target[0];
                    }

                    if (cur != null && !cur.isDead()) {
                        Location aim = cur.getLocation().add(0, cur.getHeight() * 0.5, 0);
                        Vector dir = aim.toVector().subtract(loc.toVector());
                        Location hitLoc = loc.clone();
                        if (dir.lengthSquared() > 1e-6) {
                            dir.normalize().multiply(JiumeWeaponLogic.ZHU_LING_SPEED);
                            Location next = loc.clone().add(dir);
                            next.setDirection(dir);
                            allay.teleport(next);
                            hitLoc = next;
                        }
                        if (hitLoc.distance(aim) <= JiumeWeaponLogic.ZHU_LING_HIT_RANGE * 1.5) {
                            hit[0] = true;
                            try {
                                cur.setNoDamageTicks(0);
                                cur.damage(JiumeWeaponLogic.ZHU_LING_HIT_BLAST_DAMAGE * GltcAbilityPower.getSit(), owner);
                            } catch (Throwable ignored) {
                            }
                            chiming.add(cur, 1, owner);
                            chiming.drawRing(cur);
                            JiumeFx.playZhuLingHitBlast(world, aim, owner);
                            JiumeFx.spawnCherry(world, aim, JiumeWeaponLogic.ZHU_LING_HIT_CHERRY, 0.4, 0.4, 0.4, 0.02);
                            int stacks = chiming.getStacks(cur);
                            int idx = Math.min(JiumeWeaponLogic.CHIMING_RING_MAX, Math.max(1, stacks)) - 1;
                            JiumeFx.spawnDust(world, aim, JiumeWeaponLogic.ZHU_LING_HIT_DUST, 0.35, 0.35, 0.35, 0,
                                JiumeFx.RING_COLORS[idx]);
                            JiumeFx.playSoundAt(world, aim, JiumeWeaponLogic.ZHU_LING_HIT_SOUND, 0.7f, 1.8f);
                            try {
                                allay.remove();
                            } catch (Throwable ignored) {
                            }
                            addCount(ownerId, -1);
                            cancel();
                            return;
                        }
                    }

                    if (ticksAlive[0] >= JiumeWeaponLogic.ZHU_LING_LIFE_TICKS) {
                        JiumeFx.spawnCherry(world, loc, 10, 0.3, 0.3, 0.3, 0.01);
                        try {
                            allay.remove();
                        } catch (Throwable ignored) {
                        }
                        addCount(ownerId, -1);
                        cancel();
                    }
                } catch (Throwable ex) {
                    try {
                        allay.remove();
                    } catch (Throwable ignored) {
                    }
                    if (!hit[0]) {
                        addCount(ownerId, -1);
                    }
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 1, 1));
    }

    @Nullable
    static LivingEntity findNearestTarget(Location fromLoc, @Nullable Player owner, double range) {
        if (fromLoc == null || fromLoc.getWorld() == null) {
            return null;
        }
        World world = fromLoc.getWorld();
        LivingEntity bestAny = null;
        double bestAnyDist = range;
        LivingEntity bestChiming = null;
        double bestChimingDist = range;
        JiumeChiming chiming = JiumeWeaponLogic.chiming();

        for (Entity ent : world.getNearbyEntities(fromLoc, range, range, range)) {
            if (!(ent instanceof LivingEntity living) || living.isDead()) {
                continue;
            }
            if (owner != null && living.getUniqueId().equals(owner.getUniqueId())) {
                continue;
            }
            if (living.hasMetadata(JiumeWeaponLogic.META_ZHU_LING)
                || living.hasMetadata(JiumeWeaponLogic.META_DRAGON)) {
                continue;
            }
            if (living.getType() == EntityType.ARMOR_STAND) {
                continue;
            }
            int stacks = chiming.getStacks(living);
            if (JiumeWeaponLogic.CHIMING_FULL_NO_TARGET && stacks >= JiumeWeaponLogic.CHIMING_RING_MAX) {
                continue;
            }
            double d = living.getLocation().distance(fromLoc);
            if (d > range) {
                continue;
            }
            if (d < bestAnyDist) {
                bestAnyDist = d;
                bestAny = living;
            }
            if (JiumeWeaponLogic.ZHU_LING_PRIORITIZE_CHIMING && stacks > 0 && d < bestChimingDist) {
                bestChimingDist = d;
                bestChiming = living;
            }
        }
        return bestChiming != null ? bestChiming : bestAny;
    }

    @Nullable
    private static PotionEffectType resolveResistance() {
        PotionEffectType t = PotionEffectType.getByName("RESISTANCE");
        if (t == null) {
            t = PotionEffectType.getByName("DAMAGE_RESISTANCE");
        }
        return t;
    }
}
