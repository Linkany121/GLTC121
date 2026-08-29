package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.UUID;

/**
 * {@code VASA_送花} — 1 环 · 沃土奥法：发射一朵随机单格花，抛物线飞行，命中造成粒子伤害。
 *
 * <p>弹体为[已投射]状态，打开术式选择 GUI 不会被清除；冷却由 {@link StaffCastLogic} 统一结算。
 */
public final class SongHuaSpell implements MageSpell {

    public static final String SPELL_ID = "VASA_送花";

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    private static final long COOLDOWN_MS = 2000L;          // 施放冷却（毫秒），2000 = 2 秒
    private static final double COEFFICIENT = 1.0;          // 伤害系数，最终伤害 = 系数 × 粒子强度 × GLI
    private static final float DISPLAY_SCALE = 1.2f;        // 花模型显示缩放（1.0 = 原大小）
    private static final double SPAWN_OFFSET = 0.85;        // 花从眼前生成处与玩家的距离（格）
    private static final double HIT_HALF = 0.5;             // 命中判定半宽（格）
    private static final double FLY_PER_TICK = 24.0 / 20.0; // 每 tick 飞行格数，24/20 = 24 格/秒
    private static final double MAX_DISTANCE = 28.0;        // 最大飞行距离（格），超出即消散
    private static final double GRAVITY_PER_TICK = 0.03;    // 每 tick 向下重力加速度（抛物线），调大下坠更快

    private static final Material[] FLOWER_POOL = {
        Material.DANDELION, Material.POPPY, Material.BLUE_ORCHID, Material.ALLIUM,
        Material.AZURE_BLUET, Material.OXEYE_DAISY, Material.CORNFLOWER,
        Material.LILY_OF_THE_VALLEY
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
    public void onRightClick(Player player, ItemStack staff) {
        if (player == null) {
            return;
        }
        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();
        Location start = eye.clone().add(dir.clone().multiply(SPAWN_OFFSET));
        ItemDisplay display = MageSpellUtil.spawnDisplay(world, start, randomFlower(), DISPLAY_SCALE);
        if (display == null) {
            return;
        }
        MageSpellUtil.playSound(world, start, "block.grass.place", 0.75f, 1.35f);

        UUID casterId = player.getUniqueId();
        double damage = MageSpellUtil.calcDamage(player, COEFFICIENT);

        final String[] tokenRef = {null};
        final BukkitRunnable task = new BukkitRunnable() {
            private double velY = dir.getY() * FLY_PER_TICK;
            private double traveled;
            private final Location loc = start.clone();
            private final Vector step = new Vector(dir.getX() * FLY_PER_TICK, 0, dir.getZ() * FLY_PER_TICK);

            @Override
            public void run() {
                Player caster = Bukkit.getPlayer(casterId);
                if (caster == null || !caster.isOnline()) {
                    finish(caster);
                    return;
                }
                Location prev = loc.clone();
                loc.add(step);
                loc.setY(loc.getY() + velY);
                velY -= GRAVITY_PER_TICK;
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
    }

    private static Material randomFlower() {
        return FLOWER_POOL[(int) Math.floor(Math.random() * FLOWER_POOL.length)];
    }
}
