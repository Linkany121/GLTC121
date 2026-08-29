package com.linkany121.gltc.logic.weapon;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import javax.annotation.Nullable;
import java.util.Iterator;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 斥命 stacks (per-owner accounting) for {@link JiumeWeaponLogic}.
 */
final class JiumeChiming {

    private static final PotionEffectType SLOWNESS = resolveSlowness();

    private final Map<UUID, ChimingData> chimingMap = new ConcurrentHashMap<>();

    int getStacks(Entity entity) {
        if (entity == null) {
            return 0;
        }
        ChimingData data = chimingMap.get(entity.getUniqueId());
        return data == null ? 0 : data.sum();
    }

    int getStacksForOwner(Entity entity, Player owner) {
        if (entity == null || owner == null) {
            return 0;
        }
        ChimingData data = chimingMap.get(entity.getUniqueId());
        if (data == null) {
            return 0;
        }
        OwnerEntry entry = data.byOwner.get(owner.getUniqueId());
        return entry == null ? 0 : entry.stacks;
    }

    int consumeForOwner(LivingEntity entity, Player owner) {
        if (entity == null || owner == null) {
            return 0;
        }
        UUID id = entity.getUniqueId();
        ChimingData data = chimingMap.get(id);
        if (data == null) {
            return 0;
        }
        OwnerEntry entry = data.byOwner.remove(owner.getUniqueId());
        if (entry == null) {
            return 0;
        }
        int stacks = entry.stacks;
        int total = data.sum();
        if (total <= 0) {
            chimingMap.remove(id);
        } else {
            if (total < JiumeWeaponLogic.CHIMING_RING_MAX) {
                data.maxBurst = false;
            }
            applySlow(entity, total);
        }
        return stacks;
    }

    void add(LivingEntity entity, int amount, Player viewer) {
        if (entity == null || entity.isDead() || viewer == null || amount <= 0) {
            return;
        }
        UUID id = entity.getUniqueId();
        ChimingData data = chimingMap.computeIfAbsent(id, k -> new ChimingData());
        int before = data.sum();
        if (JiumeWeaponLogic.CHIMING_FULL_CAP_STACKS && before >= JiumeWeaponLogic.CHIMING_RING_MAX) {
            return;
        }

        long now = System.currentTimeMillis();
        OwnerEntry entry = data.byOwner.computeIfAbsent(viewer.getUniqueId(), k -> new OwnerEntry());
        entry.stacks += amount;
        entry.lastGain = now;

        int after = data.sum();
        if (JiumeWeaponLogic.CHIMING_FULL_CAP_STACKS && after > JiumeWeaponLogic.CHIMING_RING_MAX) {
            int overflow = after - JiumeWeaponLogic.CHIMING_RING_MAX;
            entry.stacks = Math.max(0, entry.stacks - overflow);
            if (entry.stacks <= 0) {
                data.byOwner.remove(viewer.getUniqueId());
            }
            after = JiumeWeaponLogic.CHIMING_RING_MAX;
        }
        if (after < JiumeWeaponLogic.CHIMING_RING_MAX) {
            data.maxBurst = false;
        }
        applySlow(entity, after);

        if (before < JiumeWeaponLogic.CHIMING_RING_MAX && after >= JiumeWeaponLogic.CHIMING_RING_MAX && !data.maxBurst) {
            data.maxBurst = true;
            playFullFx(entity, viewer);
        }
    }

    void clear(Entity entity) {
        if (entity != null) {
            chimingMap.remove(entity.getUniqueId());
        }
    }

    void clearOwnedBy(UUID ownerUuid) {
        if (ownerUuid == null || !JiumeWeaponLogic.CHIMING_CLEAR_ON_UNEQUIP) {
            return;
        }
        Iterator<Map.Entry<UUID, ChimingData>> it = chimingMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<UUID, ChimingData> entry = it.next();
            ChimingData data = entry.getValue();
            if (data == null || data.byOwner.remove(ownerUuid) == null) {
                continue;
            }
            int total = data.sum();
            if (total <= 0) {
                it.remove();
                continue;
            }
            if (total < JiumeWeaponLogic.CHIMING_RING_MAX) {
                data.maxBurst = false;
            }
            Entity ent = Bukkit.getEntity(entry.getKey());
            if (ent instanceof LivingEntity living && !living.isDead()) {
                applySlow(living, total);
            }
        }
    }

    void tickDecay() {
        long now = System.currentTimeMillis();
        Iterator<Map.Entry<UUID, ChimingData>> it = chimingMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<UUID, ChimingData> entry = it.next();
            ChimingData data = entry.getValue();
            if (data == null) {
                it.remove();
                continue;
            }
            int total = data.sum();
            if (JiumeWeaponLogic.CHIMING_FULL_NO_DECAY && total >= JiumeWeaponLogic.CHIMING_RING_MAX) {
                continue;
            }

            boolean changed = false;
            Iterator<Map.Entry<UUID, OwnerEntry>> owners = data.byOwner.entrySet().iterator();
            while (owners.hasNext()) {
                Map.Entry<UUID, OwnerEntry> oe = owners.next();
                OwnerEntry od = oe.getValue();
                if (now - od.lastGain < JiumeWeaponLogic.CHIMING_DECAY_MS) {
                    continue;
                }
                od.stacks -= 1;
                od.lastGain = now;
                if (od.stacks <= 0) {
                    owners.remove();
                }
                changed = true;
            }
            if (!changed) {
                continue;
            }

            total = data.sum();
            if (total < JiumeWeaponLogic.CHIMING_RING_MAX) {
                data.maxBurst = false;
            }
            if (total <= 0) {
                it.remove();
                continue;
            }
            Entity ent = Bukkit.getEntity(entry.getKey());
            if (!(ent instanceof LivingEntity living) || living.isDead()) {
                it.remove();
                continue;
            }
            applySlow(living, total);
        }
    }

    void tickRingDisplay() {
        Iterator<Map.Entry<UUID, ChimingData>> it = chimingMap.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<UUID, ChimingData> entry = it.next();
            Entity ent = Bukkit.getEntity(entry.getKey());
            if (!(ent instanceof LivingEntity living) || living.isDead()) {
                it.remove();
                continue;
            }
            drawRing(living);
        }
    }

    void drawRing(LivingEntity entity) {
        int stacks = getStacks(entity);
        if (stacks <= 0) {
            return;
        }
        Location loc = entity.getLocation();
        double width = 1.0;
        try {
            width = Math.max(0.8, entity.getWidth());
        } catch (Throwable ignored) {
        }
        double radius = width * JiumeWeaponLogic.CHIMING_RING_WIDTH_FACTOR
            + JiumeWeaponLogic.CHIMING_RING_BASE
            + Math.min(stacks, JiumeWeaponLogic.CHIMING_RING_MAX) * JiumeWeaponLogic.CHIMING_RING_PER_STACK;
        double y = loc.getY() + Math.max(0.45, entity.getHeight() * 0.55);
        var dust = ringColor(stacks);
        int points = JiumeWeaponLogic.CHIMING_RING_POINTS_BASE + Math.min(stacks, JiumeWeaponLogic.CHIMING_RING_MAX);
        for (int i = 0; i < points; i++) {
            double a = (2 * Math.PI * i) / points;
            Location p = new Location(loc.getWorld(),
                loc.getX() + Math.cos(a) * radius, y, loc.getZ() + Math.sin(a) * radius);
            JiumeFx.spawnDust(loc.getWorld(), p, 1, 0, 0, 0, 0, dust);
        }
    }

    void clearAll() {
        chimingMap.clear();
    }

    private void playFullFx(LivingEntity entity, @Nullable Player viewer) {
        Location loc = entity.getLocation().add(0, entity.getHeight() * 0.5, 0);
        var world = entity.getWorld();
        JiumeFx.spawnCherry(world, loc, JiumeWeaponLogic.CHIMING_FULL_CHERRY_1, 2.8, 1.6, 2.8, 0.08);
        JiumeFx.spawnCherry(world, loc, JiumeWeaponLogic.CHIMING_FULL_CHERRY_2, 1.8, 1.0, 1.8, 0.04);
        JiumeFx.spawnDust(world, loc, JiumeWeaponLogic.CHIMING_FULL_DUST, 2.0, 1.2, 2.0, 0, JiumeFx.PURPLE_BIG);
        JiumeFx.playSoundAt(world, loc, "entity.generic.explode", 1.0f, 1.5f);
        JiumeFx.playSoundAt(world, loc, "block.cherry_wood.break", 1.1f, 0.8f);
        if (viewer != null) {
            JiumeFx.sendColored(viewer, JiumeWeaponLogic.MSG_CHIMING_FULL);
        }
    }

    private static void applySlow(LivingEntity entity, int stacks) {
        if (SLOWNESS == null || stacks <= 0) {
            return;
        }
        int ticks;
        int amp;
        if (stacks >= JiumeWeaponLogic.CHIMING_RING_MAX) {
            ticks = JiumeWeaponLogic.CHIMING_FULL_SLOW_TICKS;
            amp = JiumeWeaponLogic.CHIMING_FULL_SLOW_LEVEL;
        } else {
            ticks = JiumeWeaponLogic.CHIMING_SLOW_TICKS;
            amp = Math.max(0, stacks - 1);
        }
        entity.addPotionEffect(new PotionEffect(SLOWNESS, ticks, amp, false, true, true));
    }

    private static org.bukkit.Particle.DustOptions ringColor(int stacks) {
        int idx = Math.min(JiumeWeaponLogic.CHIMING_RING_MAX, Math.max(1, stacks)) - 1;
        return JiumeFx.RING_COLORS[idx];
    }

    @Nullable
    private static PotionEffectType resolveSlowness() {
        PotionEffectType t = PotionEffectType.getByName("SLOWNESS");
        return t;
    }

    static final class ChimingData {
        final Map<UUID, OwnerEntry> byOwner = new ConcurrentHashMap<>();
        boolean maxBurst;

        int sum() {
            int total = 0;
            for (OwnerEntry e : byOwner.values()) {
                total += e.stacks;
            }
            return total;
        }
    }

    static final class OwnerEntry {
        int stacks;
        long lastGain;
    }
}
