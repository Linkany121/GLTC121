package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;
import org.bukkit.util.Vector;

import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Core skill {@code light_ruin} (辉墨摇篮 / 光影废墟) — fire when opening the cast GUI.
 * <p>效果对齐旧 JS 版「水墨爆开」：开场核心炸裂 → 冲击波墨墙扩散（1s）→ 终爆冲击环；
 * 命中造成 10× 系数（术士公式：系数 × 粒子强度 × GLI）脉冲伤害 + 击退，30s 冷却。
 * <p>打开施术界面时同时召唤两圈环绕粒子跟随玩家：腰间 0.8 大小 DUST_COLOR_TRANSITION，
 * 下方 2 格处 TRIAL_SPAWNER_DETECTION_OMINOUS，半径 1.5、各 48 个。
 */
public final class LightRuinSkill {

    public static final String SKILL_ID = "light_ruin";
    public static final String SKILL_NAME = "光影废墟";
    public static final String SKILL_HINT = "§f光影废墟 §7· §f打开施术界面时触发（30s）";

    // ===== 配置区（光影废墟核心技能，改完需重新打包 jar 并重启生效）=====
    // --- 基础 ---
    private static final long COOLDOWN_MS = 30_000L;    // 技能冷却（毫秒），30000 = 30 秒，调小触发更频繁
    private static final double COEFFICIENT = 10.0;     // 脉冲伤害系数，最终伤害 = 系数 × 释放者粒子强度 × GLI
    private static final double RADIUS = 13.0;          // 冲击波最终扩散半径（格）
    private static final int EXPAND_TICKS = 20;         // 扩散总时长（tick，20 = 1 秒），调大扩散更慢
    private static final double SEARCH_Y = 4.0;         // 搜敌竖直半高（格），超出此高度的实体不受伤
    private static final double SEARCH_PAD = 1.25;      // 搜敌水平外扩（格）
    private static final double HIT_SLACK = 1.2;        // 波前命中冗余（格），调大更容易命中
    // --- 击退 ---
    private static final double KB = 2.55;              // 被命中实体水平击退力度（越大弹得越远）
    private static final double KB_Y = 0.8;             // 击退垂直分量（0.8 ≈ 小幅向上弹起）
    // --- 水墨粒子颜色（RGB，可自行换色）---
    private static final int INK_R = 18, INK_G = 18, INK_B = 28;        // 主墨色
    private static final int INK_DEEP_R = 8, INK_DEEP_G = 8, INK_DEEP_B = 14;   // 深墨色
    private static final int FLASH_R = 235, FLASH_G = 235, FLASH_B = 245;       // 白闪色
    private static final int SILVER_R = 160, SILVER_G = 175, SILVER_B = 200;    // 银白色
    private static final float INK_SIZE = 2.15f;        // 主墨 DUST 粒子大小（越大墨点越粗）
    private static final float INK_DEEP_SIZE = 1.7f;    // 深墨 DUST 粒子大小
    private static final float FLASH_SIZE = 1.55f;      // 白闪 DUST 粒子大小
    private static final float SILVER_SIZE = 1.25f;     // 银白 DUST 粒子大小
    // --- 波前墨墙环绘制 ---
    private static final int RING_POINTS_BASE = 32;     // 环上最少点数
    private static final int RING_POINTS_PER_R = 8;     // 每格半径追加点数（点数越多墨墙越密）
    private static final double RING_INNER_RATIO = 0.5; // 内环（墨漩）半径比例
    private static final double RING_MID_RATIO = 0.3;   // 中环（银色残影）半径比例
    private static final double RING_BASE_Y = 0.2;      // 环相对脚底抬高（格）
    private static final double RING_MIN_RADIUS = 0.2;  // 小于此半径不画环
    private static final int RING_DRAW_EVERY = 3;       // 每 3 tick 画一次波前墨墙（越小越密）
    private static final int SPLASH_PER_TICK = 3;       // 每 2 tick 波前碎墨溅射数量
    private static final int WAVE_SPIKE_COUNT = 3;      // 每 2 tick 波前上冲墨刺数量
    // --- 开场炸裂 ---
    private static final int BURST_RAY_COUNT = 12;      // 开场放射墨迹条数
    private static final double BURST_RAY_LEN = 2.8;    // 放射墨迹长度（格）
    private static final double BURST_PILLAR_H = 3.0;   // 开场墨柱高度（格）
    // --- 终爆 ---
    private static final int FINALE_SHOCK_RINGS = 2;    // 终爆冲击环层数
    // --- 开场音效（仅此两个）---
    private static final String SND_OPEN_MACE = "item.mace.smash_ground_heavy";  // 开场重击音效 ID
    private static final float SND_OPEN_MACE_VOL = 1.2f;                          // 音量
    private static final float SND_OPEN_MACE_PITCH = 0.9f;                        // 音调
    private static final String SND_OPEN_ANCHOR = "block.respawn_anchor.deplete"; // 开场共鸣音效 ID
    private static final float SND_OPEN_ANCHOR_VOL = 1.0f;
    private static final float SND_OPEN_ANCHOR_PITCH = 0.7f;

    // === 打开施术界面时的环绕粒子（跟随玩家）===
    private static final double RING_RADIUS = 1.5;        // 两圈粒子的半径（格）
    private static final int RING_COUNT = 48;             // 每圈粒子数量（越多越密，越耗性能）
    private static final double RING_WAIST_Y = 0.8;       // 腰间圈相对脚部的高度（格）
    private static final double RING_BELOW_DROP = -2.0;   // 下方圈相对腰间圈的垂直偏移（-2.0 = 向下 2 格）
    private static final float RING_DUST_SIZE = 0.8f;     // 腰间 DUST_COLOR_TRANSITION 粒子大小
    private static final Color RING_DUST_FROM = Color.fromRGB(0xA0, 0x75, 0xFD);  // 腰间粒子渐变起始色（RGB）
    private static final Color RING_DUST_TO = Color.fromRGB(0xE8, 0xD5, 0xFF);    // 腰间粒子渐变结束色（RGB）

    // 墨色 DustOptions 预构建（DUST 粒子带 data 才显示颜色）
    private static final Particle.DustOptions DUST_INK = new Particle.DustOptions(
        Color.fromRGB(INK_R, INK_G, INK_B), INK_SIZE);
    private static final Particle.DustOptions DUST_INK_DEEP = new Particle.DustOptions(
        Color.fromRGB(INK_DEEP_R, INK_DEEP_G, INK_DEEP_B), INK_DEEP_SIZE);
    private static final Particle.DustOptions DUST_FLASH = new Particle.DustOptions(
        Color.fromRGB(FLASH_R, FLASH_G, FLASH_B), FLASH_SIZE);
    private static final Particle.DustOptions DUST_SILVER = new Particle.DustOptions(
        Color.fromRGB(SILVER_R, SILVER_G, SILVER_B), SILVER_SIZE);

    private static final Random RND = new Random();

    private final Map<UUID, Long> cooldownUntil = new ConcurrentHashMap<>();
    /** uuid → 环绕粒子任务。 */
    private final Map<UUID, BukkitTask> ringTasks = new ConcurrentHashMap<>();

    public void tryTrigger(Player player, ItemStack staff) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        Long until = cooldownUntil.get(uuid);
        if (until != null && now < until) {
            long left = (until - now + 999) / 1000;
            sendActionBar(player, "§7" + SKILL_NAME + "冷却 §f" + left + "s");
            return;
        }
        cooldownUntil.put(uuid, now + COOLDOWN_MS);

        World world = player.getWorld();
        Location center = player.getLocation();
        Vector origin = center.toVector();
        // 开场炸裂（核心墨潮 + 墨柱 + 冲击环 + 放射墨刃）
        MageSpellUtil.playSound(world, center, SND_OPEN_MACE, SND_OPEN_MACE_VOL, SND_OPEN_MACE_PITCH);
        MageSpellUtil.playSound(world, center, SND_OPEN_ANCHOR, SND_OPEN_ANCHOR_VOL, SND_OPEN_ANCHOR_PITCH);
        spawnBurstCore(world, center);

        double dmg = calcSkillDamage(player);
        Set<UUID> hitSet = ConcurrentHashMap.newKeySet();
        new BukkitRunnable() {
            private int tick;

            @Override
            public void run() {
                tick++;
                double t = Math.min(1.0, tick / (double) EXPAND_TICKS);
                double eased = t * t * (3 - 2 * t);   // smoothstep 缓动：先快后慢
                double radius = RADIUS * eased;
                // 波前墨墙
                if (tick % RING_DRAW_EVERY == 0) {
                    spawnInkRing(world, center, radius, 1.2 + t * 0.45);
                }
                if (tick % 2 == 0) {
                    // 波前上冲墨刺 + 碎墨溅射 + 中心残余漩涡
                    spawnWaveSpikes(world, center, radius);
                    for (int k = 0; k < SPLASH_PER_TICK; k++) {
                        double a = RND.nextDouble() * Math.PI * 2;
                        Location splash = new Location(world,
                            center.getX() + Math.cos(a) * radius,
                            center.getY() + 0.15 + RND.nextDouble() * 1.4,
                            center.getZ() + Math.sin(a) * radius);
                        safe(world, Particle.SQUID_INK, splash, 5, 0.12, 0.18, 0.12, 0.06);
                        safe(world, Particle.SMOKE, splash, 2, 0.08, 0.1, 0.08, 0.02);
                        if (k % 2 == 0) {
                            safeDust(world, splash, DUST_FLASH, 0.06, 0.08, 0.06);
                        }
                    }
                    Location vortex = center.clone().add(0, 0.6 + RND.nextDouble() * 0.8, 0);
                    safe(world, Particle.REVERSE_PORTAL, vortex, 8, 0.35, 0.5, 0.35, 0.04);
                    safe(world, Particle.SOUL, vortex, 3, 0.25, 0.4, 0.25, 0.02);
                }
                if (tick == 3 || tick == 7 || tick == 11) {
                    spawnInkRing(world, center, Math.max(0.6, radius * 0.55), 0.9);
                }
                // 隔 3 tick 搜敌（波前经过才结算，命中过的实体不重复受伤）
                if (tick % 3 == 0 || tick >= EXPAND_TICKS) {
                    double box = radius + SEARCH_PAD;
                    for (Entity ent : world.getNearbyEntities(center, box, SEARCH_Y, box)) {
                        if (!MageSpellUtil.isTarget(ent, uuid)) {
                            continue;
                        }
                        UUID id = ent.getUniqueId();
                        if (!hitSet.add(id)) {
                            continue;
                        }
                        double dx = ent.getLocation().getX() - center.getX();
                        double dz = ent.getLocation().getZ() - center.getZ();
                        if (Math.sqrt(dx * dx + dz * dz) > radius + HIT_SLACK) {
                            hitSet.remove(id);
                            continue;
                        }
                        LivingEntity living = (LivingEntity) ent;
                        // 脉冲伤害：虚空模型，不受任何减伤影响
                        double dealt = MageSpellDamage.applyPulseDamage(player, living, dmg);
                        // 播报与术式一致：逐次命中播报 + 记录死亡归属
                        if (dealt > 0) {
                            MageSpellDamage.announceHit(player, "light_ruin", SKILL_NAME, living,
                                dealt, MageSpellDamage.SpellDamageType.PULSE, false);
                            SpellDeathAnnouncer.recordHit(player, living, SKILL_NAME,
                                MageSpellDamage.SpellDamageType.PULSE);
                        }
                        // 击退：沿玩家向外方向
                        try {
                            Vector dir = living.getLocation().toVector().subtract(origin);
                            if (dir.lengthSquared() < 1.0e-4) {
                                dir = player.getLocation().getDirection().clone();
                                dir.setY(0);
                            }
                            if (dir.lengthSquared() > 1.0e-4) {
                                living.setVelocity(dir.normalize().multiply(KB).setY(KB_Y));
                            }
                        } catch (Throwable ignored) {
                        }
                        // 命中墨花
                        Location at = living.getLocation().add(0, 1, 0);
                        safe(world, Particle.SQUID_INK, at, 35, 0.35, 0.5, 0.35, 0.08);
                        safe(world, Particle.LARGE_SMOKE, at, 12, 0.3, 0.4, 0.3, 0.03);
                        safe(world, Particle.CRIT, at, 18, 0.25, 0.35, 0.25, 0.22);
                        safe(world, Particle.FLASH, at, 1, 0, 0, 0, 0);
                        safe(world, Particle.END_ROD, at, 8, 0.2, 0.35, 0.2, 0.05);
                        safeDust(world, at, DUST_INK, 0.25, 0.3, 0.25);
                        safeDust(world, at, DUST_FLASH, 0.2, 0.25, 0.2);
                    }
                }
                // 终爆
                if (tick >= EXPAND_TICKS) {
                    spawnFinale(world, center);
                    cancel();
                }
            }
        }.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
        sendActionBar(player, "§d" + SKILL_NAME);
    }

    /** 技能伤害 = 系数 × 释放者粒子强度 × GLI（术式伤害公式）。 */
    private static double calcSkillDamage(Player player) {
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

    // -------------------------------------------------------------------------
    // 水墨爆开 · 粒子绘制（与旧 JS 版一致）
    // -------------------------------------------------------------------------

    /** 开场核心炸裂：墨潮 + 白闪 + 音爆 + 竖直墨柱 + 地面冲击环 + 放射墨刃。 */
    private static void spawnBurstCore(World world, Location center) {
        Location c = center.clone().add(0, 1.05, 0);
        safe(world, Particle.SQUID_INK, c, 140, 0.7, 1.1, 0.7, 0.12);
        safe(world, Particle.LARGE_SMOKE, c, 55, 0.9, 0.7, 0.9, 0.05);
        safe(world, Particle.ASH, c, 80, 1.1, 1.2, 1.1, 0.03);
        safe(world, Particle.FLASH, c, 3, 0.15, 0.1, 0.15, 0);
        safe(world, Particle.EXPLOSION, c, 4, 0.35, 0.2, 0.35, 0);
        safe(world, Particle.SONIC_BOOM, c, 1, 0, 0, 0, 0);
        safe(world, Particle.SCULK_SOUL, c, 25, 0.6, 0.8, 0.6, 0.04);
        safe(world, Particle.REVERSE_PORTAL, c, 40, 0.5, 0.9, 0.5, 0.08);
        safeDust(world, c, DUST_INK, 0.9, 0.85, 0.9);
        safeDust(world, c, DUST_FLASH, 0.7, 0.7, 0.7);
        safeDust(world, c, DUST_SILVER, 0.5, 0.6, 0.5);
        // 竖直墨柱
        for (int h = 0; h < 10; h++) {
            Location col = center.clone().add(0, 0.2 + h * (BURST_PILLAR_H / 10.0), 0);
            safe(world, Particle.SQUID_INK, col, 8, 0.15, 0.08, 0.15, 0.03);
            if (h % 2 == 0) {
                safeDust(world, col, DUST_INK_DEEP, 0.1, 0.05, 0.1);
            }
            if (h % 3 == 0) {
                safe(world, Particle.END_ROD, col, 2, 0.05, 0.1, 0.05, 0.01);
            }
        }
        // 地面冲击环
        spawnInkRing(world, center, 1.2, 1.4);
        spawnInkRing(world, center, 2.4, 1.1);
        // 放射墨刃
        for (int i = 0; i < BURST_RAY_COUNT; i++) {
            double ang = (i / (double) BURST_RAY_COUNT) * Math.PI * 2;
            for (int step = 1; step <= 4; step++) {
                double len = (BURST_RAY_LEN / 4.0) * step;
                Location tip = new Location(world,
                    center.getX() + Math.cos(ang) * len,
                    center.getY() + 0.35 + (i % 3) * 0.22 + step * 0.08,
                    center.getZ() + Math.sin(ang) * len);
                safe(world, Particle.SQUID_INK, tip, 6, 0.12, 0.18, 0.12, 0.05);
                safe(world, Particle.SMOKE, tip, 3, 0.08, 0.12, 0.08, 0.02);
                if (step == 4) {
                    safeDust(world, tip, DUST_FLASH, 0.08, 0.08, 0.08);
                    safe(world, Particle.CRIT, tip, 4, 0.1, 0.1, 0.1, 0.2);
                }
            }
        }
    }

    /** 波前墨墙环：主墨墙 + 银白刃缘 + 升腾碎墨 + 双内环。 */
    private static void spawnInkRing(World world, Location center, double radius, double intensity) {
        if (radius < RING_MIN_RADIUS) {
            return;
        }
        intensity = intensity <= 0 ? 1 : intensity;
        int n = Math.max(RING_POINTS_BASE, (int) Math.floor(radius * RING_POINTS_PER_R * intensity));
        double baseY = center.getY() + RING_BASE_Y;
        double wallH = 0.35 + Math.min(1.8, radius * 0.12);
        for (int i = 0; i < n; i++) {
            double ang = (i / (double) n) * Math.PI * 2 + radius * 0.08;
            double x = center.getX() + Math.cos(ang) * radius;
            double z = center.getZ() + Math.sin(ang) * radius;
            Location at = new Location(world, x, baseY, z);
            Location atMid = new Location(world, x, baseY + wallH * 0.45, z);
            Location atHi = new Location(world, x, baseY + wallH + (i % 4) * 0.18, z);
            // 波前主墨墙
            safe(world, Particle.SQUID_INK, at, 5, 0.14, 0.1, 0.14, 0.045);
            safe(world, Particle.LARGE_SMOKE, at, 2, 0.1, 0.12, 0.1, 0.01);
            safeDust(world, at, DUST_INK, 0.12, 0.08, 0.12);
            if (i % 2 == 0) {
                safeDust(world, atMid, DUST_INK_DEEP, 0.08, 0.15, 0.08);
            }
            // 银白刃缘 + 升腾碎墨
            if (i % 3 == 0) {
                safeDust(world, atHi, DUST_FLASH, 0.06, 0.2, 0.06);
                safe(world, Particle.ASH, atHi, 3, 0.08, 0.25, 0.08, 0.0);
                safe(world, Particle.END_ROD, atHi, 1, 0.02, 0.15, 0.02, 0.01);
            }
            if (i % 4 == 0) {
                safe(world, Particle.SOUL, atMid, 1, 0.05, 0.2, 0.05, 0.01);
                safeDust(world, at, DUST_SILVER, 0.05, 0.05, 0.05);
            }
            // 波前外侧飞溅
            if (i % 5 == 0) {
                Location out = new Location(world,
                    center.getX() + Math.cos(ang) * (radius + 0.55),
                    baseY + 0.4,
                    center.getZ() + Math.sin(ang) * (radius + 0.55));
                safe(world, Particle.SQUID_INK, out, 4, 0.2, 0.25, 0.2, 0.08);
                safe(world, Particle.CRIT, out, 2, 0.1, 0.1, 0.1, 0.12);
            }
        }
        // 双内环：墨漩 + 银色残影
        if (radius > 1.0) {
            double[][] rings = {
                {radius * RING_INNER_RATIO, 10, 0.4},
                {radius * RING_MID_RATIO, 7, 0.7}
            };
            for (int ri = 0; ri < rings.length; ri++) {
                double rr = rings[ri][0];
                double dens = rings[ri][1];
                double ry = rings[ri][2];
                int n2 = Math.max(16, (int) Math.floor(rr * dens));
                for (int j = 0; j < n2; j++) {
                    double a2 = (j / (double) n2) * Math.PI * 2 + ri * 0.31;
                    Location at2 = new Location(world,
                        center.getX() + Math.cos(a2) * rr,
                        baseY + ry,
                        center.getZ() + Math.sin(a2) * rr);
                    safe(world, Particle.SQUID_INK, at2, 2, 0.06, 0.1, 0.06, 0.025);
                    if (j % 2 == 0) {
                        safeDust(world, at2, ri == 0 ? DUST_INK : DUST_SILVER, 0.05, 0.05, 0.05);
                    }
                }
            }
        }
    }

    /** 波前上冲墨刺：墨柱 + 白闪尖端。 */
    private static void spawnWaveSpikes(World world, Location center, double radius) {
        if (radius < 0.8) {
            return;
        }
        for (int s = 0; s < WAVE_SPIKE_COUNT; s++) {
            double ang = RND.nextDouble() * Math.PI * 2;
            double r = radius * (0.85 + RND.nextDouble() * 0.2);
            Location base = new Location(world,
                center.getX() + Math.cos(ang) * r,
                center.getY() + 0.1,
                center.getZ() + Math.sin(ang) * r);
            for (int h = 0; h < 6; h++) {
                Location p = base.clone().add(0, h * 0.35, 0);
                safe(world, Particle.SQUID_INK, p, 3, 0.08, 0.05, 0.08, 0.02);
                if (h % 2 == 0) {
                    safeDust(world, p, DUST_INK_DEEP, 0.04, 0.04, 0.04);
                }
            }
            Location tip = base.clone().add(0, 2.2, 0);
            safe(world, Particle.FLASH, tip, 1, 0, 0, 0, 0);
            safeDust(world, tip, DUST_FLASH, 0.1, 0.1, 0.1);
            safe(world, Particle.END_ROD, tip, 3, 0.05, 0.2, 0.05, 0.02);
        }
    }

    /** 终爆：多层冲击环 + 大爆炸 + 墨柱喷泉 + 外缘碎星爆点。 */
    private static void spawnFinale(World world, Location center) {
        Location c = center.clone().add(0, 0.75, 0);
        for (int ri = 0; ri < FINALE_SHOCK_RINGS; ri++) {
            double rr = RADIUS * (0.35 + ri * 0.22);
            spawnInkRing(world, center, rr, 1.5 - ri * 0.12);
        }
        safe(world, Particle.SQUID_INK, c, 180, 2.6, 1.5, 2.6, 0.12);
        safe(world, Particle.LARGE_SMOKE, c, 80, 2.8, 1.0, 2.8, 0.06);
        safe(world, Particle.ASH, c, 100, 2.5, 1.4, 2.5, 0.04);
        safe(world, Particle.EXPLOSION, c, 6, 0.7, 0.35, 0.7, 0);
        safe(world, Particle.FLASH, c, 4, 0.35, 0.2, 0.35, 0);
        safe(world, Particle.SONIC_BOOM, c, 2, 0.2, 0, 0.2, 0);
        safe(world, Particle.SCULK_SOUL, c, 40, 1.5, 1.0, 1.5, 0.05);
        safe(world, Particle.REVERSE_PORTAL, c, 50, 1.2, 1.2, 1.2, 0.1);
        safe(world, Particle.END_ROD, c, 35, 1.8, 1.5, 1.8, 0.08);
        safeDust(world, c, DUST_INK, 2.0, 1.2, 2.0);
        safeDust(world, c, DUST_FLASH, 1.5, 1.0, 1.5);
        safeDust(world, c, DUST_SILVER, 1.2, 0.8, 1.2);
        // 终爆墨柱喷泉
        for (int h = 0; h < 14; h++) {
            Location geyser = center.clone().add(
                (RND.nextDouble() - 0.5) * 1.2,
                0.3 + h * 0.32,
                (RND.nextDouble() - 0.5) * 1.2);
            safe(world, Particle.SQUID_INK, geyser, 10, 0.2, 0.1, 0.2, 0.06);
            if (h % 2 == 0) {
                safeDust(world, geyser, DUST_INK_DEEP, 0.1, 0.08, 0.1);
            }
            if (h % 3 == 0) {
                safe(world, Particle.END_ROD, geyser, 2, 0.08, 0.15, 0.08, 0.02);
            }
        }
        // 外缘碎星爆点
        for (int i = 0; i < 18; i++) {
            double ang = (i / 18.0) * Math.PI * 2;
            Location edge = new Location(world,
                center.getX() + Math.cos(ang) * RADIUS,
                center.getY() + 0.5 + (i % 4) * 0.35,
                center.getZ() + Math.sin(ang) * RADIUS);
            safe(world, Particle.SQUID_INK, edge, 12, 0.25, 0.4, 0.25, 0.08);
            safe(world, Particle.FLASH, edge, 1, 0, 0, 0, 0);
            safeDust(world, edge, DUST_FLASH, 0.15, 0.15, 0.15);
            safe(world, Particle.CRIT, edge, 6, 0.2, 0.25, 0.2, 0.25);
        }
    }

    /** 无 data 粒子（不抛异常）。 */
    private static void safe(World world, Particle particle, Location loc, int count,
                             double dx, double dy, double dz, double speed) {
        try {
            world.spawnParticle(particle, loc, count, dx, dy, dz, speed);
        } catch (Throwable ignored) {
        }
    }

    /** 带颜色 DUST 粒子（DUST 必须带 DustOptions data 才会显示颜色）。 */
    private static void safeDust(World world, Location loc, Particle.DustOptions dust,
                                 double dx, double dy, double dz) {
        try {
            world.spawnParticle(Particle.DUST, loc, 1, dx, dy, dz, 0, dust);
        } catch (Throwable ignored) {
        }
    }

    // -------------------------------------------------------------------------
    // 环绕粒子（打开施术界面时跟随玩家）
    // -------------------------------------------------------------------------

    /** 打开施术界面时启动两圈环绕粒子，跟随玩家直到界面关闭。 */
    public void startRing(Player player) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        stopRing(uuid);
        BukkitTask task = new BukkitRunnable() {
            @Override
            public void run() {
                Player p = Bukkit.getPlayer(uuid);
                if (p == null || !p.isOnline()) {
                    cancel();
                    ringTasks.remove(uuid);
                    return;
                }
                spawnRings(p);
            }
        }.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
        ringTasks.put(uuid, task);
    }

    /** 施术界面关闭时停止环绕粒子。 */
    public void stopRing(Player player) {
        if (player != null) {
            stopRing(player.getUniqueId());
        }
    }

    private void stopRing(UUID uuid) {
        BukkitTask task = ringTasks.remove(uuid);
        if (task != null) {
            task.cancel();
        }
    }

    /** 每 tick 在玩家腰间与脚下 2 格处各生成一圈 48 个环绕粒子（半径 1.5，跟随玩家）。 */
    private static void spawnRings(Player player) {
        World world = player.getWorld();
        Location waist = player.getLocation().add(0, RING_WAIST_Y, 0);
        Location below = waist.clone().add(0, RING_BELOW_DROP, 0);
        for (int i = 0; i < RING_COUNT; i++) {
            double angle = 2.0 * Math.PI * i / RING_COUNT;
            double dx = RING_RADIUS * Math.cos(angle);
            double dz = RING_RADIUS * Math.sin(angle);
            try {
                world.spawnParticle(Particle.DUST_COLOR_TRANSITION,
                    waist.clone().add(dx, 0, dz), 1, 0, 0, 0, 0,
                    new Particle.DustTransition(RING_DUST_FROM, RING_DUST_TO, RING_DUST_SIZE));
            } catch (Throwable ignored) {
            }
            try {
                world.spawnParticle(Particle.TRIAL_SPAWNER_DETECTION_OMINOUS,
                    below.clone().add(dx, 0, dz), 1, 0, 0, 0, 0, null);
            } catch (Throwable ignored) {
            }
        }
    }

    public void clearPlayer(UUID uuid) {
        if (uuid != null) {
            cooldownUntil.remove(uuid);
            stopRing(uuid);
        }
    }

    private static void sendActionBar(Player player, String msg) {
        try {
            player.sendActionBar(LegacyComponentSerializer.legacySection().deserialize(msg));
        } catch (Throwable t) {
            player.sendMessage(msg);
        }
    }
}
