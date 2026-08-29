package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
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
import org.bukkit.metadata.FixedMetadataValue;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

import javax.annotation.Nullable;

/**
 * Shared particles / AoE / raycast for {@link HuanjianhuWeaponLogic}.
 */
final class HuanjianhuFx {

    // ===== 配置区（隐兰狂玉唤剑葫 特效配色，改完需重新打包 jar 并重启生效）=====
    // 想换特效颜色：改对应 Color.fromRGB(红,绿,蓝) 三个数值即可。
    static final Particle.DustOptions WHITE_DUST =
        new Particle.DustOptions(Color.fromRGB(255, 255, 255), 1.0f);  // 白色
    static final Particle.DustOptions RED_DUST =
        new Particle.DustOptions(Color.fromRGB(255, 60, 60), 1.5f);
    static final Particle.DustOptions RED_DUST_BIG =
        new Particle.DustOptions(Color.fromRGB(255, 40, 40), 2.2f);
    static final Particle.DustOptions BLACK_DUST =
        new Particle.DustOptions(Color.fromRGB(18, 18, 18), 1.3f);
    static final Particle.DustOptions DARK_RED_DUST =
        new Particle.DustOptions(Color.fromRGB(120, 8, 18), 1.5f);
    static final Particle.DustOptions DARK_RED_DUST2 =
        new Particle.DustOptions(Color.fromRGB(90, 4, 12), 1.2f);
    static final Particle.DustOptions THUNDER_DUST =
        new Particle.DustOptions(Color.fromRGB(130, 90, 255), 1.6f);
    static final Particle.DustOptions THUNDER_DUST2 =
        new Particle.DustOptions(Color.fromRGB(255, 220, 90), 1.4f);
    static final Particle.DustOptions THUNDER_WHITE =
        new Particle.DustOptions(Color.fromRGB(255, 255, 255), 1.5f);

    private HuanjianhuFx() {
    }

    static void spawnDust(
        World world, Location loc, int count,
        double dx, double dy, double dz, double speed,
        Particle.DustOptions dust
    ) {
        try {
            world.spawnParticle(Particle.DUST, loc, count, dx, dy, dz, speed, dust);
        } catch (Throwable ignored) {
        }
    }

    /** AoE flat damage + summary notify (matches JS {@code aoeDamageParam}). */
    static boolean aoeDamage(World world, Location hitPoint, Player player, double radius, double dmg) {
        if (player == null || !player.isOnline()) {
            return false;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return false;
        }
        ItemStack item = player.getInventory().getItemInMainHand();
        int hitCount = 0;
        double totalDamage = 0;
        player.setMetadata(HuanjianhuWeaponLogic.META_ABILITY_DAMAGE, new FixedMetadataValue(plugin, true));
        try {
            for (Entity ent : world.getNearbyEntities(hitPoint, radius, radius, radius)) {
                if (!(ent instanceof LivingEntity living) || living.isDead()) {
                    continue;
                }
                if (living.getUniqueId().equals(player.getUniqueId())) {
                    continue;
                }
                living.setNoDamageTicks(0);
                living.damage(dmg, player);
                hitCount++;
                totalDamage += dmg;
            }
        } finally {
            player.removeMetadata(HuanjianhuWeaponLogic.META_ABILITY_DAMAGE, plugin);
        }
        if (hitCount > 0) {
            GltcDamageNotify.notifyAbilityDamageSummary(player, item, totalDamage, hitCount);
            return true;
        }
        return false;
    }

    static void drawFallingSword(World world, Location loc, Particle.DustOptions dustOpt, double s) {
        double bladeLen = 1.5 * s;
        double maxHalfW = 0.18 * s;
        double guardHalf = 0.42 * s;
        double handleLen = 0.42 * s;
        double step = 0.2;

        for (double y = 0; y <= bladeLen; y += step) {
            world.spawnParticle(Particle.END_ROD, loc.clone().add(0, y, 0), 1, 0, 0, 0, 0);
        }
        for (double y2 = 0; y2 <= bladeLen; y2 += step) {
            double t = y2 / bladeLen;
            double hw = maxHalfW * Math.pow(Math.max(t, 0.05), 0.7);
            world.spawnParticle(Particle.END_ROD, loc.clone().add(-hw, y2, 0), 1, 0, 0, 0, 0);
            world.spawnParticle(Particle.END_ROD, loc.clone().add(hw, y2, 0), 1, 0, 0, 0, 0);
        }
        for (double gx = -guardHalf; gx <= guardHalf + 0.001; gx += step) {
            world.spawnParticle(Particle.END_ROD, loc.clone().add(gx, bladeLen, 0), 1, 0, 0, 0, 0);
        }
        double handleStart = bladeLen + 0.12 * s;
        for (double hy = handleStart; hy <= handleStart + handleLen; hy += step) {
            world.spawnParticle(Particle.END_ROD, loc.clone().add(0, hy, 0), 1, 0, 0, 0, 0);
        }
        spawnDust(world, loc, 2, 0.03, 0.03, 0.03, 0, dustOpt);
        spawnDust(world, loc.clone().add(0, bladeLen, 0), 2, 0.08, 0.02, 0.08, 0, dustOpt);
    }

    static void drawFlameSword(World world, Location loc, double s) {
        double bladeLen = 1.2 * s;
        double guardHalf = 0.35 * s;
        double handleLen = 0.4 * s;
        double step = 0.15;
        for (double y = 0; y <= bladeLen; y += step) {
            world.spawnParticle(Particle.FLAME, loc.clone().add(0, y, 0), 1, 0, 0, 0, 0);
            spawnDust(world, loc.clone().add(0, y, 0), 1, 0, 0, 0, 0, RED_DUST);
        }
        for (double x = -guardHalf; x <= guardHalf; x += step) {
            world.spawnParticle(Particle.FLAME, loc.clone().add(x, bladeLen, 0), 1, 0, 0, 0, 0);
            spawnDust(world, loc.clone().add(x, bladeLen, 0), 1, 0, 0, 0, 0, RED_DUST);
        }
        for (double y2 = bladeLen + 0.1; y2 <= bladeLen + handleLen; y2 += step) {
            world.spawnParticle(Particle.FLAME, loc.clone().add(0, y2, 0), 1, 0, 0, 0, 0);
            spawnDust(world, loc.clone().add(0, y2, 0), 1, 0, 0, 0, 0, RED_DUST);
        }
    }

    @FunctionalInterface
    interface SwordImpact {
        void onImpact(World world, Location loc, Player owner, boolean hitAny);
    }

    static void summonSwordDrop(
        World world,
        Location targetLoc,
        Player player,
        Particle.DustOptions dustOpt,
        double height,
        int dropTicks,
        double radius,
        double dmg,
        @Nullable SwordImpact impact
    ) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null || player == null) {
            return;
        }
        java.util.UUID ownerId = player.getUniqueId();
        Location startLoc = targetLoc.clone().add(0, height, 0);
        Location pos = startLoc.clone();
        double perTick = height / dropTicks;
        Location damageCenter = targetLoc.clone().add(0, 1.0, 0);

        new BukkitRunnable() {
            int tickCount = 0;
            boolean landed = false;

            @Override
            public void run() {
                if (landed) {
                    return;
                }
                Player owner = org.bukkit.Bukkit.getPlayer(ownerId);
                if (owner == null || !owner.isOnline()) {
                    landed = true;
                    cancel();
                    return;
                }
                drawFallingSword(world, pos, dustOpt, 1.0);
                tickCount++;
                pos.subtract(0, perTick, 0);
                if (tickCount >= dropTicks) {
                    landed = true;
                    cancel();
                    boolean hitAny = aoeDamage(world, damageCenter, owner, radius, dmg);
                    if (impact != null) {
                        impact.onImpact(world, targetLoc, owner, hitAny);
                    }
                }
            }
        }.runTaskTimer(plugin, 0, 1);
    }

    static void summonFlameSwordDrop(
        World world,
        Location targetLoc,
        Player player,
        double height,
        int dropTicks,
        double radius,
        double dmg
    ) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null || player == null) {
            return;
        }
        java.util.UUID ownerId = player.getUniqueId();
        Location startLoc = targetLoc.clone().add(0, height, 0);
        Location pos = startLoc.clone();
        double perTick = height / dropTicks;
        Location damageCenter = targetLoc.clone().add(0, 1.0, 0);

        new BukkitRunnable() {
            int tickCount = 0;
            boolean landed = false;

            @Override
            public void run() {
                if (landed) {
                    return;
                }
                Player owner = org.bukkit.Bukkit.getPlayer(ownerId);
                if (owner == null || !owner.isOnline()) {
                    landed = true;
                    cancel();
                    return;
                }
                drawFlameSword(world, pos, 1.0);
                tickCount++;
                pos.subtract(0, perTick, 0);
                if (tickCount >= dropTicks) {
                    landed = true;
                    cancel();
                    aoeDamage(world, damageCenter, owner, radius, dmg);
                    world.spawnParticle(Particle.FLAME, targetLoc, 20, 1.5, 1.5, 1.5, 0.03);
                    spawnDust(world, targetLoc, 40, 1.5, 1.5, 1.5, 0, RED_DUST_BIG);
                    world.playSound(targetLoc, "entity.generic.explode", 1.2f, 0.9f);
                }
            }
        }.runTaskTimer(plugin, 0, 1);
    }

    static final class RayHit {
        @Nullable Location loc;
        @Nullable LivingEntity entity;
        double distance;

        RayHit(double maxDistance) {
            this.distance = maxDistance;
        }
    }

    static RayHit rayTraceLivingAhead(
        World world, Location origin, Vector direction, double maxDistance, Player player
    ) {
        RayHit result = new RayHit(maxDistance);
        if (world == null || origin == null || direction == null) {
            return result;
        }
        Vector dir = direction.clone().normalize();
        double maxDist = maxDistance > 0 ? maxDistance : 1;

        try {
            RayTraceResult entHit = world.rayTraceEntities(origin, dir, maxDist, 0.5);
            if (entHit != null) {
                Entity hitEnt = entHit.getHitEntity();
                if (hitEnt instanceof LivingEntity living
                    && !living.isDead()
                    && !living.getUniqueId().equals(player.getUniqueId())) {
                    result.entity = living;
                    result.loc = living.getLocation();
                    result.distance = origin.toVector().distance(living.getLocation().toVector());
                    return result;
                }
            }
        } catch (Throwable ignored) {
        }

        try {
            RayTraceResult blockHit = world.rayTraceBlocks(
                origin, dir, maxDist, FluidCollisionMode.NEVER, true
            );
            if (blockHit != null && blockHit.getHitBlock() != null && isBlockSolid(blockHit.getHitBlock().getType())) {
                var hitPos = blockHit.getHitPosition();
                result.loc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
                result.distance = origin.distance(result.loc);
                return result;
            }
        } catch (Throwable ignored) {
        }

        double step = 0.4;
        int steps = (int) Math.ceil(maxDist / step);
        Vector stepVec = dir.clone().multiply(step);
        Location tracer = origin.clone();
        for (int s = 0; s < steps; s++) {
            tracer.add(stepVec);
            try {
                if (isBlockSolid(tracer.getBlock().getType())) {
                    result.loc = tracer.clone();
                    result.distance = (s + 1) * step;
                    return result;
                }
            } catch (Throwable ignored) {
            }
            try {
                LivingEntity found = null;
                for (Entity nearEnt : world.getNearbyEntities(tracer, 0.45, 0.45, 0.45)) {
                    if (!(nearEnt instanceof LivingEntity living) || living.isDead()) {
                        continue;
                    }
                    if (living.getUniqueId().equals(player.getUniqueId())) {
                        continue;
                    }
                    found = living;
                    break;
                }
                if (found != null) {
                    result.entity = found;
                    result.loc = found.getLocation();
                    result.distance = (s + 1) * step;
                    return result;
                }
            } catch (Throwable ignored) {
            }
        }
        result.loc = origin.clone().add(dir.clone().multiply(maxDist));
        result.distance = maxDist;
        return result;
    }

    private static boolean isBlockSolid(Material type) {
        if (type == null) {
            return false;
        }
        try {
            return !type.isAir();
        } catch (Throwable t) {
            return type != Material.AIR && type != Material.CAVE_AIR && type != Material.VOID_AIR;
        }
    }
}
