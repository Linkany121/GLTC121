package com.linkany121.gltc.logic.mage;

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
import org.bukkit.util.Transformation;
import org.joml.AxisAngle4f;
import org.joml.Vector3f;

import javax.annotation.Nullable;
import java.util.UUID;

/**
 * 术式通用工具：伤害计算 / 音效 / 粒子 / 目标判定 / ItemDisplay 弹体管理。
 */
public final class MageSpellUtil {

    private MageSpellUtil() {
    }

    /** 术式伤害 = 系数 × 释放者粒子强度 × GLI。 */
    public static double calcDamage(Player player, double coefficient) {
        MageService svc = MageService.get();
        if (svc != null) {
            try {
                return svc.calcSpellDamage(player, coefficient);
            } catch (Throwable ignored) {
            }
        }
        return coefficient;
    }

    /** 世界音效（字符串 ID，兼容 Paper Sound 接口）。 */
    public static void playSound(World world, Location loc, String sound, float vol, float pitch) {
        if (world == null || loc == null || sound == null) {
            return;
        }
        try {
            world.playSound(loc, sound, vol, pitch);
        } catch (Throwable ignored) {
        }
    }

    /** 安全生成粒子（缺失 data 类型时静默跳过，避免报错）。 */
    public static void particle(World world, Particle particle, Location loc, int count,
                                double dx, double dy, double dz, double speed) {
        if (world == null || particle == null || loc == null) {
            return;
        }
        try {
            world.spawnParticle(particle, loc, count, dx, dy, dz, speed);
        } catch (Throwable ignored) {
        }
    }

    /** 兼容回退：HAPPY_VILLAGER → END_ROD。 */
    public static Particle happyVillager() {
        try {
            return Particle.HAPPY_VILLAGER;
        } catch (Throwable ignored) {
        }
        return Particle.END_ROD;
    }

    /** 是否可作为术式命中目标（排除施法者自身 / 装饰实体）。 */
    public static boolean isTarget(Entity ent, @Nullable UUID casterId) {
        if (!(ent instanceof LivingEntity living) || living.isDead()) {
            return false;
        }
        if (living instanceof Player p && p.getUniqueId().equals(casterId)) {
            return false;
        }
        EntityType type = living.getType();
        return type != EntityType.ARMOR_STAND && type != EntityType.ITEM_DISPLAY;
    }

    /** 立方体范围内查找第一个命中目标。 */
    @Nullable
    public static LivingEntity findHit(World world, Location loc, @Nullable UUID casterId, double half) {
        if (world == null || loc == null) {
            return null;
        }
        for (Entity ent : world.getNearbyEntities(loc, half, half, half)) {
            if (isTarget(ent, casterId)) {
                return (LivingEntity) ent;
            }
        }
        return null;
    }

    // -------------------------------------------------------------------------
    // ItemDisplay 弹体（与 旧术式体系 的 spawnFlyingItemDisplay 等价）
    // -------------------------------------------------------------------------

    /** 生成一个 ItemDisplay 弹体（固定变换 + 指定缩放）。 */
    @Nullable
    public static ItemDisplay spawnDisplay(World world, Location loc, Material material, float scale) {
        if (world == null || loc == null || material == null) {
            return null;
        }
        try {
            return world.spawn(loc, ItemDisplay.class, d -> {
                d.setItemStack(new ItemStack(material));
                d.setItemDisplayTransform(ItemDisplay.ItemDisplayTransform.FIXED);
                try {
                    d.setTransformation(new Transformation(
                        new Vector3f(),
                        new AxisAngle4f(),
                        new Vector3f(scale, scale, scale),
                        new AxisAngle4f()
                    ));
                } catch (Throwable ignored) {
                }
                d.setViewRange(64f);
                d.setPersistent(false);
            });
        } catch (Throwable ignored) {
            return null;
        }
    }

    public static void moveDisplay(@Nullable ItemDisplay display, Location loc) {
        if (display == null || loc == null || !display.isValid()) {
            return;
        }
        try {
            display.teleport(loc);
        } catch (Throwable ignored) {
        }
    }

    public static boolean displayAlive(@Nullable ItemDisplay display) {
        return display != null && display.isValid() && !display.isDead();
    }

    public static void removeDisplay(@Nullable ItemDisplay display) {
        if (display == null) {
            return;
        }
        try {
            if (display.isValid() && !display.isDead()) {
                display.remove();
            }
        } catch (Throwable ignored) {
        }
    }
}
