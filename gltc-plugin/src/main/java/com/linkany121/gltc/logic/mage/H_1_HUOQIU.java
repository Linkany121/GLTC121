package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.UUID;

/**
 * {@code VASA_火球术} — 瞬发火焰弹，物理伤害模型。
 *
 * <p>对齐旧 JS 版表现：飞行体为 ItemDisplay 火球实体（FIRE_CHARGE），命中时爆炸粒子；
 * 伤害 = 系数 × 释放者粒子强度 × GLI；火球飞行体属于[已投射]状态，打开术式选择 GUI 不会被清除。
 */
public final class H_1_HUOQIU implements MageSpell {

    public static final String SPELL_ID = "VASA_火球术";

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    private static final long COOLDOWN_MS = 3000L;      // 施放冷却（毫秒），3000 = 3 秒，调大冷却更长
    private static final double COEFFICIENT = 1.0;      // 伤害系数，最终伤害 = 系数 × 粒子强度 × GLI
    private static final double FLY_SPEED = 1.6;        // 火球每 tick 飞行格数（1 秒 = 20 tick），1.6 ≈ 32 格/秒
    private static final double MAX_DISTANCE = 24.0;    // 最大飞行距离（格），超出即消散
    private static final double HIT_HALF = 0.55;        // 命中判定半宽（格），调大更容易命中
    private static final double SPAWN_OFFSET = 0.8;     // 火球生成处与玩家的距离（格）
    // --- 弹体显示（对齐旧 JS 版）---
    private static final Material DISPLAY_MATERIAL = Material.FIRE_CHARGE; // 弹体显示材质（火球）
    private static final float DISPLAY_SCALE = 0.85f;   // 弹体显示缩放（越小火球越小）
    // --- 拖尾粒子 ---
    private static final int TRAIL_COUNT = 2;           // 每 tick 拖尾粒子数
    private static final double TRAIL_SPREAD = 0.1;     // 拖尾粒子扩散
    private static final double TRAIL_SPEED = 0.01;     // 拖尾粒子额外速度
    // --- 发射音效 ---
    private static final String SOUND_CAST = "entity.blaze.shoot";  // 发射音效 ID
    private static final float SOUND_CAST_VOL = 0.85f;              // 音量
    private static final float SOUND_CAST_PITCH = 1.15f;            // 音调
    // --- 命中爆炸 ---
    private static final String SOUND_HIT = "entity.generic.explode"; // 命中爆炸音效 ID
    private static final float SOUND_HIT_VOL = 0.55f;
    private static final float SOUND_HIT_PITCH = 1.3f;
    private static final int HIT_SMOKE_COUNT = 12;      // EXPLOSION 粒子不可用时的烟雾回退数量
    private static final double HIT_SMOKE_SPREAD = 0.2; // 回退烟雾扩散

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
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();
        Location start = eye.clone().add(dir.clone().multiply(SPAWN_OFFSET));
        World world = start.getWorld();
        if (world == null) {
            return;
        }
        MageSpellUtil.playSound(world, start, SOUND_CAST, SOUND_CAST_VOL, SOUND_CAST_PITCH);

        // 生成 ItemDisplay 火球实体（与旧 JS 版一致）
        ItemDisplay display = MageSpellUtil.spawnDisplay(world, start, DISPLAY_MATERIAL, DISPLAY_SCALE);

        UUID casterId = player.getUniqueId();
        double damage = calcReleaseDamage(player);

        // 火球为[已投射]状态：开 GUI / 切术不清除，仅自然结束或下线清除
        final String[] tokenRef = {null};
        final BukkitRunnable task = new BukkitRunnable() {
            private double traveled;
            private final Location loc = start.clone();
            private final Vector step = dir.clone().multiply(FLY_SPEED);

            @Override
            public void run() {
                Player caster = Bukkit.getPlayer(casterId);
                if (caster == null || !caster.isOnline() || traveled >= MAX_DISTANCE) {
                    finish(caster);
                    return;
                }
                loc.add(step);
                traveled += FLY_SPEED;
                if (MageSpellUtil.displayAlive(display)) {
                    MageSpellUtil.moveDisplay(display, loc);
                }
                try {
                    world.spawnParticle(Particle.FLAME, loc, TRAIL_COUNT,
                        TRAIL_SPREAD, TRAIL_SPREAD, TRAIL_SPREAD, TRAIL_SPEED);
                } catch (Throwable ignored) {
                }
                if (loc.getBlock().getType().isSolid()) {
                    explode(loc);
                    finish(caster);
                    return;
                }
                LivingEntity hit = findHit(world, loc, casterId);
                if (hit != null) {
                    explode(loc);
                    if (caster != null) {
                        MageSpellDamage.dealPhysicalSpellDamage(caster, hit, SPELL_ID, damage);
                    }
                    finish(caster);
                }
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
        tokenRef[0] = MageSpellRuntime.begin(
            player,
            SPELL_ID,
            () -> {
                if (!task.isCancelled()) {
                    task.cancel();
                }
                MageSpellUtil.removeDisplay(display);
            },
            MageSpellRuntime.Persistence.PROJECTED
        );
        task.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
    }

    /** 术式伤害 = 系数 × 释放者粒子强度 × GLI。 */
    private static double calcReleaseDamage(Player player) {
        MageService svc = MageService.get();
        if (svc == null) {
            return COEFFICIENT;
        }
        try {
            return svc.calcSpellDamage(player, COEFFICIENT);
        } catch (Throwable ignored) {
            return COEFFICIENT;
        }
    }

    private static LivingEntity findHit(World world, Location loc, UUID casterId) {
        for (Entity ent : world.getNearbyEntities(loc, HIT_HALF, HIT_HALF, HIT_HALF)) {
            if (!(ent instanceof LivingEntity living) || living.isDead()) {
                continue;
            }
            if (living instanceof Player p && p.getUniqueId().equals(casterId)) {
                continue;
            }
            EntityType type = living.getType();
            if (type == EntityType.ARMOR_STAND || type == EntityType.ITEM_DISPLAY) {
                continue;
            }
            return living;
        }
        return null;
    }

    /** 命中爆炸：EXPLOSION 粒子，不可用时回退烟雾。 */
    private static void explode(Location loc) {
        World world = loc.getWorld();
        if (world == null) {
            return;
        }
        MageSpellUtil.playSound(world, loc, SOUND_HIT, SOUND_HIT_VOL, SOUND_HIT_PITCH);
        try {
            world.spawnParticle(Particle.EXPLOSION, loc, 1, 0, 0, 0, 0);
        } catch (Throwable ignored) {
            MageSpellUtil.particle(world, Particle.SMOKE, loc, HIT_SMOKE_COUNT,
                HIT_SMOKE_SPREAD, HIT_SMOKE_SPREAD, HIT_SMOKE_SPREAD, 0.02);
        }
    }

    public void clearPlayer(UUID uuid) {
        // 冷却由 StaffCastLogic 统一管理；此处仅兜底清除
        if (uuid != null) {
            MageSpellRuntime.purgePlayer(uuid);
        }
    }
}
