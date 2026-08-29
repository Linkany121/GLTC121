package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.metadata.FixedMetadataValue;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Particles / sounds / AoE helpers for {@link JiumeWeaponLogic}.
 */
final class JiumeFx {

    // ===== 配置区（咀嚼曾世的晚梦 特效配色，改完需重新打包 jar 并重启生效）=====
    // PURPLE_DUST 紫 / PURPLE_BIG 大紫 / LIGHT_PURPLE 浅紫 / RING_COLORS 环形渐变色数组（按层由浅到深，最后为血红）。
    // 想换特效颜色：改对应 Color.fromRGB(红,绿,蓝) 数值即可。
    static final Particle CHERRY = resolveCherry();
    static final Particle EXPLOSION = resolveExplosion();

    static final Particle.DustOptions PURPLE_DUST =
        new Particle.DustOptions(Color.fromRGB(170, 60, 255), 1.4f);
    static final Particle.DustOptions PURPLE_BIG =
        new Particle.DustOptions(Color.fromRGB(150, 40, 230), 2.4f);
    static final Particle.DustOptions LIGHT_PURPLE =
        new Particle.DustOptions(Color.fromRGB(220, 170, 255), 1.3f);

    static final Particle.DustOptions[] RING_COLORS = {
        new Particle.DustOptions(Color.fromRGB(230, 200, 255), 1.35f),
        new Particle.DustOptions(Color.fromRGB(210, 160, 255), 1.35f),
        new Particle.DustOptions(Color.fromRGB(190, 120, 245), 1.4f),
        new Particle.DustOptions(Color.fromRGB(170, 80, 235), 1.4f),
        new Particle.DustOptions(Color.fromRGB(150, 50, 210), 1.45f),
        new Particle.DustOptions(Color.fromRGB(175, 35, 160), 1.45f),
        new Particle.DustOptions(Color.fromRGB(210, 25, 90), 1.5f),
        new Particle.DustOptions(Color.fromRGB(230, 20, 40), 1.55f)
    };

    private static final Pattern HEX = Pattern.compile("&#([0-9a-fA-F]{6})");

    private JiumeFx() {
    }

    static void spawnDust(World world, Location loc, int count, double dx, double dy, double dz,
                          double speed, Particle.DustOptions dust) {
        try {
            world.spawnParticle(Particle.DUST, loc, count, dx, dy, dz, speed, dust);
        } catch (Throwable ignored) {
        }
    }

    static void spawnCherry(World world, Location loc, int count, double dx, double dy, double dz, double speed) {
        try {
            world.spawnParticle(CHERRY, loc, count, dx, dy, dz, speed);
        } catch (Throwable ignored) {
        }
    }

    static void playSoundAt(World world, Location loc, String sound, float vol, float pitch) {
        if (world == null || loc == null || sound == null) {
            return;
        }
        try {
            world.playSound(loc, sound, vol, pitch);
        } catch (Throwable ignored) {
        }
    }

    static void playSoundForPlayer(Player player, @Nullable Location loc, String sound, float vol, float pitch) {
        if (player == null || !player.isOnline() || sound == null) {
            return;
        }
        try {
            Location at = loc != null ? loc : player.getLocation();
            player.playSound(at, sound, vol, pitch);
        } catch (Throwable ignored) {
        }
    }

    static void playDragonGrowl(@Nullable Player owner, @Nullable Location hearLoc) {
        float vol = (float) JiumeWeaponLogic.DRAGON_GROWL_VOL;
        float pitch = (float) JiumeWeaponLogic.DRAGON_GROWL_PITCH;
        if (hearLoc != null) {
            playSoundAt(hearLoc.getWorld(), hearLoc, JiumeWeaponLogic.DRAGON_GROWL_SOUND, vol, pitch);
            playSoundAt(hearLoc.getWorld(), hearLoc, JiumeWeaponLogic.DRAGON_GROWL_SOUND_ALT, vol * 0.85f, pitch);
        }
        if (JiumeWeaponLogic.DRAGON_GROWL_EXTRA_FOR_OWNER && owner != null && owner.isOnline()) {
            Location ear = owner.getLocation();
            playSoundForPlayer(owner, ear, JiumeWeaponLogic.DRAGON_GROWL_SOUND, vol, pitch);
            playSoundForPlayer(owner, ear, JiumeWeaponLogic.DRAGON_GROWL_SOUND_ALT, vol * 0.85f, pitch);
        }
    }

    static double getGroundY(World world, double x, double z, double fallbackY) {
        try {
            int blockY = world.getHighestBlockYAt((int) Math.floor(x), (int) Math.floor(z));
            if (blockY <= world.getMinHeight()) {
                return fallbackY;
            }
            return blockY + 1.0;
        } catch (Throwable t) {
            return fallbackY;
        }
    }

    static String colorize(String str) {
        if (str == null) {
            return "";
        }
        Matcher m = HEX.matcher(str);
        StringBuilder out = new StringBuilder();
        while (m.find()) {
            String hex = m.group(1).toLowerCase();
            StringBuilder repl = new StringBuilder("§x");
            for (int i = 0; i < 6; i++) {
                repl.append('§').append(hex.charAt(i));
            }
            m.appendReplacement(out, Matcher.quoteReplacement(repl.toString()));
        }
        m.appendTail(out);
        return out.toString();
    }

    static void sendColored(Player player, String msg) {
        if (player == null) {
            return;
        }
        try {
            player.sendMessage(colorize(msg));
        } catch (Throwable ignored) {
        }
    }

    static boolean inPlayerView(Player player, Location loc, double range, double fovDeg) {
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();
        Vector to = loc.toVector().subtract(eye.toVector());
        double dist = to.length();
        if (dist < 0.2 || dist > range) {
            return false;
        }
        double halfCos = Math.cos((fovDeg / 2.0) * Math.PI / 180.0);
        return dir.dot(to.normalize()) >= halfCos;
    }

    static void drawMagicCircle(World world, Location center, double radius, Particle.DustOptions dust) {
        Particle.DustOptions d = dust != null ? dust : PURPLE_BIG;
        double y = center.getY() + 0.05;
        int rings = 4;
        for (int ring = 1; ring <= rings; ring++) {
            double r = radius * (ring / (double) rings);
            int points = Math.max(24, (int) Math.floor(18 + r * 14));
            for (int i = 0; i < points; i++) {
                double a = (2 * Math.PI * i) / points;
                Location p = new Location(world, center.getX() + Math.cos(a) * r, y, center.getZ() + Math.sin(a) * r);
                spawnDust(world, p, 1, 0, 0, 0, 0, d);
                if (i % 2 == 0) {
                    spawnCherry(world, p, 1, 0, 0, 0, 0);
                }
            }
        }
        int edgePoints = Math.max(48, (int) Math.floor(radius * 20));
        for (int e = 0; e < edgePoints; e++) {
            double ea = (2 * Math.PI * e) / edgePoints;
            Location ep = new Location(world,
                center.getX() + Math.cos(ea) * radius, y, center.getZ() + Math.sin(ea) * radius);
            spawnDust(world, ep, 1, 0, 0, 0, 0, PURPLE_DUST);
            spawnCherry(world, ep, 1, 0.02, 0.02, 0.02, 0);
        }
        for (int s = 0; s < 12; s++) {
            double ang = (2 * Math.PI * s) / 12;
            for (double dist = 0.4; dist <= radius; dist += 0.35) {
                Location sp = new Location(world,
                    center.getX() + Math.cos(ang) * dist, y, center.getZ() + Math.sin(ang) * dist);
                spawnDust(world, sp, 1, 0, 0, 0, 0, LIGHT_PURPLE);
            }
        }
        spawnCherry(world, center.clone().add(0, 0.25, 0), 50, radius * 0.35, 0.25, radius * 0.35, 0.01);
        spawnDust(world, center.clone().add(0, 0.35, 0), 40, radius * 0.3, 0.2, radius * 0.3, 0, d);
    }

    static void drawDragonCircle(World world, Location center) {
        drawMagicCircle(world, center, JiumeWeaponLogic.DRAGON_CIRCLE_RADIUS, PURPLE_BIG);
        playSoundAt(world, center, "block.beacon.activate", 1.15f, 0.55f);
        playSoundAt(world, center, "block.enchantment_table.use", 1.0f, 0.65f);
    }

    static void playZhuLingHitBlast(World world, Location loc, Player owner) {
        double radius = JiumeWeaponLogic.ZHU_LING_HIT_BLAST_RADIUS;
        double dmg = JiumeWeaponLogic.ZHU_LING_HIT_BLAST_DAMAGE * GltcAbilityPower.getSit();
        spawnCherry(world, loc, 35, radius * 0.9, radius * 0.5, radius * 0.9, 0.04);
        spawnDust(world, loc, 45, radius * 0.85, radius * 0.45, radius * 0.85, 0.02, PURPLE_BIG);
        spawnDust(world, loc, 25, radius * 0.7, radius * 0.35, radius * 0.7, 0.03, PURPLE_DUST);
        if (EXPLOSION != null) {
            try {
                world.spawnParticle(EXPLOSION, loc, 2, radius * 0.4, radius * 0.25, radius * 0.4, 0);
            } catch (Throwable ignored) {
            }
        }
        playSoundAt(world, loc, "entity.generic.explode", 0.9f, 1.35f);
        playSoundAt(world, loc, "entity.splash_potion.break", 0.7f, 1.1f);
        aoeDamage(world, loc, owner, radius, dmg, null);
    }

    static void playSphereBurstDispersal(World world, Location center) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        Location core = center.clone();
        double cx = core.getX();
        double cy = core.getY();
        double cz = core.getZ();
        List<double[]> dirs = buildSphereBurstDirections(
            JiumeWeaponLogic.DRAGON_BLAST_SPHERE_POINTS, JiumeWeaponLogic.DRAGON_BLAST_SPHERE_UP_BIAS);
        double maxR = JiumeWeaponLogic.DRAGON_BLAST_SPHERE_RADIUS;
        int totalTicks = Math.max(4, JiumeWeaponLogic.DRAGON_BLAST_SPHERE_BURST_TICKS);
        int period = Math.max(1, JiumeWeaponLogic.DRAGON_BLAST_SPHERE_BURST_PERIOD);
        int trailSteps = Math.max(0, JiumeWeaponLogic.DRAGON_BLAST_SPHERE_TRAIL_STEPS);

        spawnDust(world, core, 28, 0.28, 0.28, 0.28, 0.14, PURPLE_BIG);
        spawnDust(world, core, 18, 0.16, 0.16, 0.16, 0.2, LIGHT_PURPLE);

        int[] tick = {0};
        BukkitTask[] taskRef = {null};
        taskRef[0] = track(new BukkitRunnable() {
            @Override
            public void run() {
                tick[0]++;
                double t = tick[0] / (double) totalTicks;
                double eased = 1 - Math.pow(1 - t, 3);
                double radius = maxR * eased;
                double prevT = Math.max(0, (tick[0] - 1) / (double) totalTicks);
                double prevEased = 1 - Math.pow(1 - prevT, 3);
                double prevRadius = maxR * prevEased;

                for (int i = 0; i < dirs.size(); i++) {
                    double[] d = dirs.get(i);
                    Particle.DustOptions dust = d[3] == 0 ? PURPLE_BIG : (d[3] == 1 ? PURPLE_DUST : LIGHT_PURPLE);
                    Location front = new Location(world,
                        cx + d[0] * radius, cy + d[1] * radius, cz + d[2] * radius);
                    spawnDust(world, front, JiumeWeaponLogic.DRAGON_BLAST_SPHERE_PER_POINT, 0.05, 0.05, 0.05, 0, dust);
                    for (int s = 1; s <= trailSteps; s++) {
                        double st = s / (double) (trailSteps + 1);
                        double rTrail = prevRadius + (radius - prevRadius) * st;
                        Location tp = new Location(world,
                            cx + d[0] * rTrail, cy + d[1] * rTrail, cz + d[2] * rTrail);
                        spawnDust(world, tp, 1, 0.03, 0.03, 0.03, 0, dust);
                    }
                    if (i % 10 == 0 && tick[0] % 2 == 0) {
                        spawnCherry(world, front, 1, 0.04, 0.04, 0.04, 0.01);
                    }
                }
                if (tick[0] >= totalTicks) {
                    cancel();
                }
            }
        }.runTaskTimer(plugin, 0, period));
    }

    private static List<double[]> buildSphereBurstDirections(int count, double upBias) {
        List<double[]> dirs = new ArrayList<>(count);
        double bias = Math.max(0, Math.min(1, upBias));
        for (int i = 0; i < count; i++) {
            double theta = Math.random() * Math.PI * 2;
            double cosPhi = (2 * Math.random() - 1) * (1 - bias) + bias;
            cosPhi = Math.max(-1, Math.min(1, cosPhi));
            double phi = Math.acos(cosPhi);
            dirs.add(new double[]{
                Math.sin(phi) * Math.cos(theta),
                Math.cos(phi),
                Math.sin(phi) * Math.sin(theta),
                i % 3
            });
        }
        return dirs;
    }

    static void playLargeBlastFx(World world, Location loc, @Nullable Player owner, int blastIndex) {
        float[] pitches = JiumeWeaponLogic.DRAGON_BLAST_PITCHES;
        float blastPitch = blastIndex >= 0 && blastIndex < pitches.length
            ? pitches[blastIndex] : pitches[pitches.length - 1];

        spawnCherry(world, loc, JiumeWeaponLogic.DRAGON_BLAST_CHERRY_COUNT,
            JiumeWeaponLogic.DRAGON_BLAST_CHERRY_SPREAD, JiumeWeaponLogic.DRAGON_BLAST_CHERRY_Y,
            JiumeWeaponLogic.DRAGON_BLAST_CHERRY_SPREAD, 0.08);
        spawnDust(world, loc, JiumeWeaponLogic.DRAGON_BLAST_DUST_BIG,
            JiumeWeaponLogic.DRAGON_BLAST_DUST_BIG_SPREAD, JiumeWeaponLogic.DRAGON_BLAST_DUST_BIG_SPREAD * 0.45,
            JiumeWeaponLogic.DRAGON_BLAST_DUST_BIG_SPREAD, 0.02, PURPLE_BIG);
        spawnDust(world, loc, JiumeWeaponLogic.DRAGON_BLAST_DUST,
            JiumeWeaponLogic.DRAGON_BLAST_DUST_SPREAD, JiumeWeaponLogic.DRAGON_BLAST_DUST_SPREAD * 0.4,
            JiumeWeaponLogic.DRAGON_BLAST_DUST_SPREAD, 0.04, PURPLE_DUST);
        spawnDust(world, loc, (int) Math.floor(JiumeWeaponLogic.DRAGON_BLAST_DUST * 0.55),
            JiumeWeaponLogic.DRAGON_BLAST_DUST_SPREAD * 0.7, JiumeWeaponLogic.DRAGON_BLAST_DUST_SPREAD * 0.55,
            JiumeWeaponLogic.DRAGON_BLAST_DUST_SPREAD * 0.7, 0.06, LIGHT_PURPLE);

        if (EXPLOSION != null) {
            try {
                world.spawnParticle(EXPLOSION, loc, JiumeWeaponLogic.DRAGON_BLAST_EXPLOSION_COUNT,
                    JiumeWeaponLogic.DRAGON_BLAST_EXPLOSION_SPREAD,
                    JiumeWeaponLogic.DRAGON_BLAST_EXPLOSION_SPREAD * 0.5,
                    JiumeWeaponLogic.DRAGON_BLAST_EXPLOSION_SPREAD, 0);
            } catch (Throwable ignored) {
            }
        }
        try {
            // 与 咀梦.js 一致：FLASH 粒子须携带 Color data（粉白色 255,200,255）
            world.spawnParticle(Particle.FLASH, loc, 2, 0.4, 0.2, 0.4, 0, Color.fromRGB(255, 200, 255));
        } catch (Throwable ignored) {
        }

        playSphereBurstDispersal(world, loc);

        playSoundAt(world, loc, "entity.generic.explode", 1.8f, blastPitch);
        playSoundAt(world, loc, "entity.dragon_fireball.explode", 1.2f, blastPitch);
        playSoundAt(world, loc, "entity.generic.explode", 1.4f, blastPitch);

        if (JiumeWeaponLogic.DRAGON_BLAST_EXTRA_FOR_OWNER && owner != null) {
            playSoundForPlayer(owner, loc, "entity.generic.explode", 1.8f, blastPitch);
            playSoundForPlayer(owner, loc, "entity.dragon_fireball.explode", 1.2f, blastPitch);
            playSoundForPlayer(owner, loc, "entity.generic.explode", 1.4f, blastPitch);
            playSoundForPlayer(owner, loc, JiumeWeaponLogic.DRAGON_BLAST_ANCHOR_BREAK_SOUND,
                (float) JiumeWeaponLogic.DRAGON_BLAST_ANCHOR_BREAK_VOL,
                (float) (JiumeWeaponLogic.DRAGON_BLAST_ANCHOR_BREAK_PITCH * blastPitch));
        }
    }

    static void restoreEntityVelocity(LivingEntity ent, Vector savedVel, int delayTicks) {
        if (ent == null || savedVel == null) {
            return;
        }
        Runnable apply = () -> {
            try {
                if (!ent.isDead()) {
                    ent.setVelocity(savedVel);
                }
            } catch (Throwable ignored) {
            }
        };
        apply.run();
        int delay = Math.max(1, delayTicks);
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return;
        }
        track(new BukkitRunnable() {
            @Override
            public void run() {
                apply.run();
            }
        }.runTaskLater(plugin, delay));
    }

    static void damageEntityInAoe(LivingEntity ent, double dmg, @Nullable Player owner, boolean noKnockback) {
        boolean isZhuLing = ent.hasMetadata(JiumeWeaponLogic.META_ZHU_LING);
        boolean wasInvuln = false;
        Vector savedVel = null;
        if (noKnockback) {
            try {
                savedVel = ent.getVelocity().clone();
            } catch (Throwable ignored) {
            }
        }
        if (isZhuLing) {
            try {
                wasInvuln = ent.isInvulnerable();
                ent.setInvulnerable(false);
            } catch (Throwable ignored) {
            }
        }
        try {
            ent.setNoDamageTicks(0);
            if (owner != null) {
                ent.damage(dmg, owner);
            } else {
                ent.damage(dmg);
            }
        } finally {
            if (isZhuLing && !ent.isDead()) {
                try {
                    ent.setInvulnerable(wasInvuln || true);
                } catch (Throwable ignored) {
                }
            }
            if (noKnockback && savedVel != null && !ent.isDead()) {
                restoreEntityVelocity(ent, savedVel, 1);
            }
        }
        if (isZhuLing && ent.isDead()) {
            try {
                var meta = ent.getMetadata(JiumeWeaponLogic.META_ZHU_LING);
                if (meta != null && !meta.isEmpty()) {
                    Object v = meta.get(0).value();
                    if (v != null) {
                        JiumeZhuLing.addCount(UUID.fromString(String.valueOf(v)), -1);
                    }
                }
            } catch (Throwable ignored) {
            }
            try {
                ent.remove();
            } catch (Throwable ignored) {
            }
        }
    }

    static void applyAoeKnockback(LivingEntity ent, Location center, double strength) {
        if (ent == null || strength <= 0) {
            return;
        }
        try {
            Vector dir = ent.getLocation().toVector().subtract(center.toVector());
            dir.setY(dir.getY() + 0.25);
            if (dir.lengthSquared() < 0.01) {
                dir = new Vector((Math.random() - 0.5) * 0.4, 0.35, (Math.random() - 0.5) * 0.4);
            }
            dir.normalize().multiply(strength);
            ent.setVelocity(dir);
        } catch (Throwable ignored) {
        }
    }

    /** options: hitZhuLing, knockback, noKnockbackUuid — null means defaults. */
    static void aoeDamage(World world, Location center, @Nullable Player owner, double radius, double dmg,
                          @Nullable AoeOptions options) {
        boolean hitZhuLing = options != null && options.hitZhuLing;
        double knockback = options != null ? options.knockback : 0;
        UUID noKnockbackUuid = options != null ? options.noKnockbackUuid : null;
        ItemStack item = owner != null ? owner.getInventory().getItemInMainHand() : null;
        double totalDmg = 0;
        int hitCount = 0;
        for (Entity e : world.getNearbyEntities(center, radius, radius, radius)) {
            if (!(e instanceof LivingEntity ent) || ent.isDead()) {
                continue;
            }
            if (owner != null && ent.getUniqueId().equals(owner.getUniqueId())) {
                continue;
            }
            if (ent.hasMetadata(JiumeWeaponLogic.META_DRAGON)) {
                continue;
            }
            if (ent.hasMetadata(JiumeWeaponLogic.META_ZHU_LING) && !hitZhuLing) {
                continue;
            }
            boolean skipKb = noKnockbackUuid != null && ent.getUniqueId().equals(noKnockbackUuid);
            damageEntityInAoe(ent, dmg, owner, skipKb);
            if (knockback > 0 && !skipKb) {
                applyAoeKnockback(ent, center, knockback);
            }
            totalDmg += dmg;
            hitCount++;
        }
        if (owner != null) {
            GltcDamageNotify.notifyAbilityDamageSummary(owner, item, totalDmg, hitCount);
        }
    }

    static BukkitTask track(BukkitTask task) {
        JiumeWeaponLogic logic = JiumeWeaponLogic.getInstance();
        if (logic != null && task != null) {
            logic.trackTask(task);
        }
        return task;
    }

    static void setMeta(Entity entity, String key, Object value) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null || entity == null) {
            return;
        }
        entity.setMetadata(key, new FixedMetadataValue(plugin, value));
    }

    static void removeMeta(Entity entity, String key) {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null || entity == null) {
            return;
        }
        try {
            entity.removeMetadata(key, plugin);
        } catch (Throwable ignored) {
        }
    }

    static final class AoeOptions {
        boolean hitZhuLing;
        double knockback;
        @Nullable UUID noKnockbackUuid;

        AoeOptions hitZhuLing(boolean v) {
            this.hitZhuLing = v;
            return this;
        }

        AoeOptions knockback(double v) {
            this.knockback = v;
            return this;
        }

        AoeOptions noKnockbackUuid(@Nullable UUID v) {
            this.noKnockbackUuid = v;
            return this;
        }
    }

    private static Particle resolveCherry() {
        try {
            return Particle.valueOf("CHERRY_LEAVES");
        } catch (IllegalArgumentException e) {
            try {
                return Particle.valueOf("FALLING_SPORE_BLOSSOM");
            } catch (IllegalArgumentException e2) {
                return Particle.CLOUD;
            }
        }
    }

    @Nullable
    private static Particle resolveExplosion() {
        try {
            return Particle.valueOf("EXPLOSION");
        } catch (IllegalArgumentException e) {
            try {
                return Particle.valueOf("EXPLOSION_LARGE");
            } catch (IllegalArgumentException e2) {
                try {
                    return Particle.valueOf("EXPLOSION_EMITTER");
                } catch (IllegalArgumentException e3) {
                    return null;
                }
            }
        }
    }
}
