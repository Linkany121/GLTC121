package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.UUID;

/**
 * {@code VASA_微风花流} — 2 环 · 沃土奥法：扇形发射 3 朵随机色郁金香，直线飞行，
 * 命中造成粒子伤害并使目标失明。
 *
 * <p>每朵郁金香弹体为独立[已投射]会话，打开术式选择 GUI 不会被清除。
 */
public final class W_2_WEIFENGHUALU implements MageSpell {

    public static final String SPELL_ID = "VASA_微风花流";

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    private static final long COOLDOWN_MS = 3000L;          // 施放冷却（毫秒），3000 = 3 秒
    private static final double COEFFICIENT = 1.2;          // 伤害系数，最终伤害 = 系数 × 粒子强度 × GLI
    private static final float DISPLAY_SCALE = 1.25f;       // 郁金香模型缩放（1.0 = 原大小）
    private static final double SPAWN_OFFSET = 0.85;        // 弹体从眼前生成处与玩家的距离（格）
    private static final double HIT_HALF = 0.6;             // 命中判定半宽（格）
    private static final double FLY_PER_TICK = 24.0 / 20.0; // 每 tick 飞行格数，24/20 = 24 格/秒
    private static final double MAX_DISTANCE = 28.0;        // 最大飞行距离（格）
    private static final int PROJECTILE_COUNT = 3;          // 一次发射的郁金香数量（扇形散射）
    private static final double SPREAD_OFFSET = 0.3;        // 相邻弹体水平偏移（格），调大扇形越开
    private static final double SPREAD_JITTER = 0.12;       // 每朵花额外随机散射幅度（格），调大散射更散
    private static final double SPEED_VARIANCE = 0.15;      // 每朵花速度差异比例（±15%），调大前后差距更明显
    private static final int BLINDNESS_TICKS = 2 * 20;      // 命中后失明时长（tick），40 = 2 秒

    private static final Material[] TULIP_POOL = {
        Material.RED_TULIP, Material.ORANGE_TULIP,
        Material.WHITE_TULIP, Material.PINK_TULIP
    };

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
        return MageSpellDamage.SpellDamageType.PARTICLE;
    }

    @Override
    public int ringCount() {
        return 2; // 微风花流：2环（术士等级 < 2 时越环侵蚀）
    }

    @Override
    public void onRightClick(Player player, ItemStack staff) {
        if (player == null) {
            return;
        }
        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();
        Location spawnLoc = eye.clone().add(dir.clone().multiply(SPAWN_OFFSET));
        double damage = MageSpellUtil.calcDamage(player, COEFFICIENT);

        boolean ok = false;
        for (int i = 0; i < PROJECTILE_COUNT; i++) {
            double offset = (i - 1) * SPREAD_OFFSET + (Math.random() - 0.5) * 2 * SPREAD_JITTER;
            if (launchTulip(player, world, spawnLoc, dir, offset, damage)) {
                ok = true;
            }
        }
        if (ok) {
            MageSpellUtil.playSound(world, spawnLoc, "block.grass.break", 0.8f, 1.25f);
        }
    }

    private static boolean launchTulip(Player player, World world, Location base,
                                       Vector dir, double offsetAmount, double damage) {
        Location loc = base.clone();
        if (Math.abs(offsetAmount) > 0.0001) {
            Vector perp = perpOffset(dir, offsetAmount);
            loc.add(perp);
        }
        ItemDisplay display = MageSpellUtil.spawnDisplay(world, loc, randomTulip(), DISPLAY_SCALE);
        if (display == null) {
            return false;
        }

        UUID casterId = player.getUniqueId();
        final String[] tokenRef = {null};
        final BukkitRunnable task = new BukkitRunnable() {
            private double traveled;
            private final Vector step = dir.clone().multiply(FLY_PER_TICK * (1 + (Math.random() - 0.5) * 2 * SPEED_VARIANCE));

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
                MageSpellUtil.moveDisplay(display, loc);
                MageSpellUtil.particle(world, MageSpellUtil.happyVillager(), loc, 2, 0.1, 0.1, 0.1, 0.01);

                boolean hitSolid = loc.getBlock().getType().isSolid();
                LivingEntity hit = MageSpellUtil.findHit(world, loc, casterId, HIT_HALF);
                if (hit == null && !hitSolid && traveled < MAX_DISTANCE) {
                    return;
                }
                if (hit != null) {
                    MageSpellDamage.dealParticleSpellDamage(caster, hit, SPELL_ID, damage);
                    applyBlindness(hit);
                }
                finish(caster);
            }

            private void finish(Player caster) {
                cancel();
                MageSpellUtil.removeDisplay(display);
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
            MageSpellUtil.removeDisplay(display);
        }, MageSpellRuntime.Persistence.PROJECTED);
        task.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
        return true;
    }

    /** 垂直于视线方向的水平偏移向量。 */
    private static Vector perpOffset(Vector dir, double amount) {
        double px = -dir.getZ();
        double pz = dir.getX();
        double len = Math.sqrt(px * px + pz * pz);
        if (len < 1.0e-6) {
            len = 1.0;
        }
        return new Vector(px / len * amount, 0, pz / len * amount);
    }

    private static Material randomTulip() {
        return TULIP_POOL[(int) Math.floor(Math.random() * TULIP_POOL.length)];
    }

    private static void applyBlindness(LivingEntity target) {
        try {
            target.addPotionEffect(new PotionEffect(PotionEffectType.BLINDNESS, BLINDNESS_TICKS, 0, false, true, true));
        } catch (Throwable ignored) {
        }
    }
}
