package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.UUID;

/**
 * {@code VASA_调试术式} — 无/特殊流派调试术式：
 * 同时发射 3 个缓慢向前飞行的粒子球（白/蓝/红），速度各不相同；
 * 每个球分别对应一种伤害类型：白球=物理、蓝球=粒子、红球=脉冲，命中时各造成 1 倍系数伤害。
 *
 * <p>弹体为[已投射]状态，打开术式选择 GUI 不会被清除。
 */
public final class TiaoShiShuShiSpell implements MageSpell {

    public static final String SPELL_ID = "VASA_调试术式";

    // ===== 配置区（本术式为调试用，改完需重新打包 jar 并重启生效）=====
    private static final long COOLDOWN_MS = 1000L;      // 施放冷却（毫秒），1000 = 1 秒
    private static final double COEFFICIENT = 1.0;      // 伤害系数，最终伤害 = 系数 × 粒子强度 × GLI（每球 1 倍）
    private static final double SPAWN_OFFSET = 0.85;    // 粒子球生成处与玩家的距离（格）
    private static final double HIT_HALF = 0.5;         // 命中判定半宽（格）
    private static final double MAX_DISTANCE = 24.0;    // 粒子球最大飞行距离（格）

    /** 三个粒子球速度（格/tick）：4 / 6 / 8 格每秒，速度不一致但都较缓慢。 */
    private static final double[] BALL_SPEEDS = {0.2, 0.3, 0.4};

    /** 三个粒子球颜色：白 / 蓝 / 红。 */
    private static final Color[] BALL_COLORS = {Color.WHITE, Color.BLUE, Color.RED};

    /** 三个粒子球对应的伤害类型：白=物理、蓝=粒子、红=脉冲。 */
    private static final MageSpellDamage.SpellDamageType[] BALL_TYPES = {
        MageSpellDamage.SpellDamageType.PHYSICAL,
        MageSpellDamage.SpellDamageType.PARTICLE,
        MageSpellDamage.SpellDamageType.PULSE
    };

    private static final float DUST_SIZE = 1.0f;
    private static final int DUST_COUNT = 10;
    private static final double DUST_SPREAD = 0.35;

    @Override
    public String id() {
        return SPELL_ID;
    }

    @Override
    public String displayName() {
        return StaffPdc.spellDisplayName(SPELL_ID);
    }

    @Override
    public long baseCooldownMs() {
        return COOLDOWN_MS;
    }

    @Override
    public double coefficient() {
        return COEFFICIENT;
    }

    @Override
    public MageSpellDamage.SpellDamageType damageType() {
        return MageSpellDamage.SpellDamageType.PHYSICAL;
    }

    @Override
    public void onRightClick(Player player, ItemStack staff) {
        if (player == null) {
            return;
        }
        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();
        Location spawn = eye.clone().add(dir.clone().multiply(SPAWN_OFFSET));
        double damage = MageSpellUtil.calcDamage(player, COEFFICIENT);

        for (int i = 0; i < BALL_SPEEDS.length; i++) {
            launchBall(player, world, spawn, dir, BALL_SPEEDS[i], BALL_COLORS[i], BALL_TYPES[i], damage);
        }
        MageSpellUtil.playSound(world, spawn, "entity.experience_orb.pickup", 0.4f, 1.6f);
    }

    private static void launchBall(Player player, World world, Location base, Vector dir,
                                   double speed, Color color,
                                   MageSpellDamage.SpellDamageType type, double damage) {
        UUID casterId = player.getUniqueId();
        Location loc = base.clone();
        final String[] tokenRef = {null};
        final BukkitRunnable task = new BukkitRunnable() {
            private double traveled;
            private final Vector step = dir.clone().multiply(speed);

            @Override
            public void run() {
                Player caster = Bukkit.getPlayer(casterId);
                if (caster == null || !caster.isOnline()) {
                    finish(caster);
                    return;
                }
                Location prev = loc.clone();
                loc.add(step);
                traveled += prev.distance(loc);
                spawnDust(world, loc, color);

                boolean hitSolid = loc.getBlock().getType().isSolid();
                LivingEntity hit = MageSpellUtil.findHit(world, loc, casterId, HIT_HALF);
                if (hit == null && !hitSolid && traveled < MAX_DISTANCE) {
                    return;
                }
                if (hit != null) {
                    dealBallDamage(caster, hit, type, damage);
                }
                finish(caster);
            }

            private void finish(Player caster) {
                cancel();
                String token = tokenRef[0];
                if (token != null) {
                    MageSpellRuntime.end(caster, token, false);
                }
            }
        };
        tokenRef[0] = MageSpellRuntime.begin(player, SPELL_ID, () -> {
            if (!task.isCancelled()) {
                task.cancel();
            }
        }, MageSpellRuntime.Persistence.PROJECTED);
        task.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
    }

    /** 在弹体位置生成带颜色的 DUST 粒子球。 */
    private static void spawnDust(World world, Location loc, Color color) {
        try {
            world.spawnParticle(Particle.DUST, loc, DUST_COUNT, DUST_SPREAD, DUST_SPREAD, DUST_SPREAD,
                0, new Particle.DustOptions(color, DUST_SIZE));
        } catch (Throwable ignored) {
            MageSpellUtil.particle(world, Particle.END_ROD, loc, 4, 0.2, 0.2, 0.2, 0.01);
        }
    }

    /** 按球对应的伤害类型结算 1 倍系数伤害（物理/粒子/脉冲三选一）。 */
    private static void dealBallDamage(Player caster, LivingEntity hit,
                                       MageSpellDamage.SpellDamageType type, double damage) {
        switch (type) {
            case PHYSICAL -> MageSpellDamage.dealPhysicalSpellDamage(caster, hit, SPELL_ID, damage);
            case PARTICLE -> MageSpellDamage.dealParticleSpellDamage(caster, hit, SPELL_ID, damage);
            case PULSE -> MageSpellDamage.dealPulseSpellDamage(caster, hit, SPELL_ID, damage);
        }
    }
}
