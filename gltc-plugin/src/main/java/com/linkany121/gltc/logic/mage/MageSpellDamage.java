package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcMessages;
import org.bukkit.Location;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.damage.DamageSource;
import org.bukkit.damage.DamageType;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

import javax.annotation.Nullable;

/**
 * 术式伤害结算 + 播报（术式运行时 v2 的 Java 实现）。
 *
 * <p>三种伤害类型（由术式实现决定）：
 * <ul>
 *   <li>物理：使用[近战伤害]模型，受[原版减伤]与[最终减伤]影响，不受[粒子折射]影响。</li>
 *   <li>粒子：使用[虚空伤害]模型，受[粒子折射]与[最终减伤]影响，不受[原版减伤]影响。</li>
 *   <li>脉冲：使用[虚空伤害]模型，不受任何因素影响，造成绝对真实的伤害。</li>
 * </ul>
 *
 * <p>减伤归属：粒子折射 / 最终减伤均为受击玩家自身的 GLTC 数值（怪物无此属性不减免）。
 */
public final class MageSpellDamage {

    /** 伤害类型。 */
    public enum SpellDamageType {
        PHYSICAL("物理"),
        PARTICLE("粒子"),
        PULSE("脉冲");

        private final String label;

        SpellDamageType(String label) {
            this.label = label;
        }

        public String label() {
            return label;
        }
    }

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    /** 侵蚀反噬自伤比例：释放术式时按「当前最大生命 × 此值 × 侵蚀等级」对自身造成脉冲伤害。 */
    private static final double EROSION_HP_PCT = 0.2;  // 0.2 = 每级侵蚀损失 20% 最大生命，调小侵蚀代价更低
    /** 粒子/脉冲伤害的击退力度（原版虚空伤害无击退，此处手动补上，模拟近战受击反馈）。 */
    private static final double BYPASS_KNOCKBACK = 0.35;

    private static final String C_MSG = "§x§f§f§f§5§b§3"; // #fff5b3 常规文字
    private static final String C_TARGET = "§c";             // 受伤者 &c
    private static final String C_DMG = "§x§f§f§0§0§0§0§l"; // #ff0000&l 伤害值（纯红加粗）

    public static final String LABEL_PHYSICAL =
        "§x§d§7§9§5§8§6物§x§c§f§8§3§7§7理§x§c§6§7§1§6§8伤§x§b§e§5§f§5§9害";
    public static final String LABEL_PARTICLE =
        "§x§9§6§8§6§d§7粒§x§9§5§7§7§c§f子§x§9§3§6§8§c§6伤§x§9§2§5§9§b§e害";
    public static final String LABEL_PULSE =
        "§x§e§a§7§2§c§9脉§x§e§5§6§5§a§1冲§x§d§f§5§7§7§a伤§x§d§a§4§a§5§2害";

    // 死亡播报专用词（复用伤害类型渐变色，文字不同）
    public static final String LABEL_PARTICLE_SPELL =
        "§x§9§6§8§6§d§7粒§x§9§5§7§7§c§f子§x§9§3§6§8§c§6术§x§9§2§5§9§b§e式"; // 粒子术式
    public static final String LABEL_PULSE_FIELD =
        "§x§e§a§7§2§c§9立§x§e§5§6§5§a§1场§x§d§f§5§7§7§a脉§x§d§a§4§a§5§2冲"; // 立场脉冲

    private MageSpellDamage() {
    }

    // -------------------------------------------------------------------------
    // 侵蚀
    // -------------------------------------------------------------------------

    /** 侵蚀等级 = 环数 - 术士等级（≤0 无侵蚀）。 */
    public static int calcErosion(Player player, int ringCount) {
        if (player == null || ringCount <= 0) {
            return 0;
        }
        MageService svc = MageService.get();
        int level = 0;
        if (svc != null) {
            try {
                level = svc.getTotalStats(player).mageLevel;
            } catch (Throwable ignored) {
            }
        }
        return Math.max(0, ringCount - level);
    }

    /** 释放术式时若侵蚀等级 &gt; 0：对玩家自身造成 20% 最大生命值 × 侵蚀等级的脉冲伤害。 */
    public static void applyErosionSelfDamage(Player player, int erosion, @Nullable String spellName) {
        if (player == null || erosion <= 0) {
            return;
        }
        double maxHp = getMaxHealth(player);
        double amount = maxHp * EROSION_HP_PCT * erosion;
        try {
            GltcPlugin.getInstance().getLogger().info(
                "[GLTC侵蚀] 自伤 " + player.getName() + " 术式=" + spellName
                    + " 侵蚀=" + erosion + " 最大生命=" + maxHp + " 自伤=" + amount);
        } catch (Throwable ignored) {
        }
        dealSpellDamage(player, player, spellName, SpellDamageType.PULSE, amount, true);
    }

    // -------------------------------------------------------------------------
    // 伤害结算
    // -------------------------------------------------------------------------

    /** 物理伤害：受[最终减伤]影响，不受[粒子折射]影响；原版护甲自然结算。 */
    public static double dealPhysicalSpellDamage(Player caster, LivingEntity target,
                                                 @Nullable String spellId, double rawAmount) {
        return dealSpellDamage(caster, target, spellId, SpellDamageType.PHYSICAL, rawAmount, false);
    }

    /** 粒子伤害：受[粒子折射]与[最终减伤]影响；虚空模型绕过护甲。 */
    public static double dealParticleSpellDamage(Player caster, LivingEntity target,
                                                 @Nullable String spellId, double rawAmount) {
        return dealSpellDamage(caster, target, spellId, SpellDamageType.PARTICLE, rawAmount, false);
    }

    /** 脉冲伤害：不受任何减伤影响（绝对真实伤害）。 */
    public static double dealPulseSpellDamage(Player caster, LivingEntity target,
                                              @Nullable String spellId, double rawAmount) {
        return dealSpellDamage(caster, target, spellId, SpellDamageType.PULSE, rawAmount, false);
    }

    /**
     * 应用脉冲（虚空）伤害，不播报；用于非术式来源（如施术技能核心的光影废墟 AOE）。
     * 不受任何减伤影响。
     */
    public static double applyPulseDamage(Player attacker, LivingEntity target, double rawAmount) {
        if (attacker == null || target == null || !(rawAmount > 0)) {
            return 0;
        }
        try {
            if (target.isDead() || !target.isValid()) {
                return 0;
            }
        } catch (Throwable ignored) {
        }
        double hpBefore = getHealth(target);
        applyBypassDamage(target, rawAmount, attacker);
        return Math.max(0, hpBefore - getHealth(target));
    }

    private static double dealSpellDamage(Player caster, LivingEntity target, @Nullable String spellId,
                                          SpellDamageType type, double rawAmount, boolean erosionKind) {
        if (caster == null || target == null || !(rawAmount > 0)) {
            return 0;
        }
        try {
            if (target.isDead() || !target.isValid()) {
                return 0;
            }
        } catch (Throwable ignored) {
        }
        double finalAmount = rawAmount;
        if (type == SpellDamageType.PHYSICAL) {
            // 物理：最终减伤（受击玩家）
            finalAmount = rawAmount * (1 - targetFinalReduction(target));
        } else if (type == SpellDamageType.PARTICLE) {
            // 粒子：粒子折射 × 最终减伤
            finalAmount = rawAmount
                * (1 - targetParticleRefraction(target))
                * (1 - targetFinalReduction(target));
        }
        // 脉冲：不乘任何减伤
        if (!(finalAmount > 0)) {
            return 0;
        }
        String displayName = spellId == null || spellId.isBlank()
            ? "未知术式"
            : StaffPdc.spellDisplayName(spellId);
        // 记录死亡归属必须在 damage() 之前：死亡事件在 damage() 内部同步触发，
        // 若此时未记录归属，死亡播报会命中不到记录而泄漏原版死亡消息。
        SpellDeathAnnouncer.recordHit(caster, target, displayName, type, erosionKind);
        // 伤害播报同样必须在 damage() 之前：否则目标被直接击杀时，
        // 死亡事件在 damage() 内部同步触发，死亡播报会先于伤害播报出现。
        announceHit(caster, spellId, displayName, target, finalAmount, type, erosionKind);
        double hpBefore = getHealth(target);
        if (type == SpellDamageType.PHYSICAL) {
            // 近战伤害模型：原版护甲/韧性/保护自然减免
            target.setNoDamageTicks(0);
            target.damage(finalAmount, caster);
        } else {
            applyBypassDamage(target, finalAmount, caster);
            // 虚空伤害无原版击退/受击动画，手动补上以对齐近战受击反馈
            applyHitFeedback(target, caster);
        }
        return Math.max(0, hpBefore - getHealth(target));
    }

    // -------------------------------------------------------------------------
    // 减伤读取
    // -------------------------------------------------------------------------

    private static double targetFinalReduction(LivingEntity target) {
        if (!(target instanceof Player p)) {
            return 0;
        }
        MageService svc = MageService.get();
        if (svc == null) {
            return 0;
        }
        try {
            return MagePointDefs.clampHard("finalDamageReduction", svc.getTotalStats(p).finalDamageReduction);
        } catch (Throwable ignored) {
            return 0;
        }
    }

    private static double targetParticleRefraction(LivingEntity target) {
        if (!(target instanceof Player p)) {
            return 0;
        }
        MageService svc = MageService.get();
        if (svc == null) {
            return 0;
        }
        try {
            return MagePointDefs.clampHard("particleRefraction", svc.getTotalStats(p).particleRefraction);
        } catch (Throwable ignored) {
            return 0;
        }
    }

    // -------------------------------------------------------------------------
    // 伤害应用
    // -------------------------------------------------------------------------

    /**
     * 粒子/脉冲伤害：
     * 统一使用 {@link DamageType#GENERIC_KILL}（虚空模型，绕过护甲/附魔/难度倍率）。
     * 注意：粒子原使用 {@link DamageType#SONIC_BOOM} 音波模型，但困难难度下对玩家伤害 ×1.5（多造成伤害），故弃用。
     */
    private static void applyBypassDamage(LivingEntity target, double amount, Player attacker) {
        double hpBefore = getHealth(target);
        try {
            DamageType dt = DamageType.GENERIC_KILL;
            DamageSource.Builder b = DamageSource.builder(dt);
            if (attacker != null) {
                try {
                    b.withDirectEntity(attacker);
                } catch (Throwable ignored) {
                }
                try {
                    b.withCausingEntity(attacker);
                } catch (Throwable ignored) {
                }
            }
            target.setNoDamageTicks(0);
            target.damage(amount, b.build());
        } catch (Throwable ignored) {
        }
        // 兜底：damage() 抛异常或未实际扣血（如自伤被服务器保护拦截）时，直接扣血确保伤害生效
        if (getHealth(target) >= hpBefore - 0.0001) {
            setHealthBypass(target, amount);
        }
    }

    /** 直接扣血兜底（绕过所有伤害事件/护甲/减伤），仅在 damage() 无法生效时使用。 */
    private static void setHealthBypass(LivingEntity target, double amount) {
        try {
            double cur = Math.max(0, target.getHealth());
            target.setHealth(Math.max(0, cur - amount));
        } catch (Throwable ignored) {
        }
    }

    /**
     * 粒子/脉冲（虚空模型）伤害的受击反馈：原版虚空伤害不产生击退与受击动画，
     * 此处手动补上击退（沿施术者→目标方向）与受击动画（屏幕抖动/红屏），对齐近战手感。
     */
    private static void applyHitFeedback(LivingEntity target, @Nullable Player attacker) {
        if (target == null || target.isDead()) {
            return;
        }
        try {
            // 击退方向：从攻击者指向目标
            double dx = 0, dz = 0;
            if (attacker != null) {
                Location a = attacker.getLocation();
                Location t = target.getLocation();
                dx = t.getX() - a.getX();
                dz = t.getZ() - a.getZ();
                double len = Math.sqrt(dx * dx + dz * dz);
                if (len < 1.0e-4) {
                    // 重叠时用攻击者朝向
                    Vector dir = attacker.getLocation().getDirection();
                    dx = dir.getX();
                    dz = dir.getZ();
                    len = Math.sqrt(dx * dx + dz * dz);
                    if (len < 1.0e-4) {
                        dx = 0;
                        dz = 1;
                        len = 1;
                    }
                }
                dx /= len;
                dz /= len;
            }
            // 击退：knockback(strength, 来源X, 来源Z) —— 传攻击者位置，实体被推向相反方向
            target.knockback(BYPASS_KNOCKBACK, dx * -1, dz * -1);
        } catch (Throwable ignored) {
        }
        // 受击动画（红屏/屏幕抖动）：yaw 为伤害来源相对实体的朝向角度
        if (target instanceof Player) {
            try {
                float yaw = attacker != null
                    ? (float) Math.toDegrees(Math.atan2(
                        attacker.getLocation().getZ() - target.getLocation().getZ(),
                        attacker.getLocation().getX() - target.getLocation().getX()))
                    : 0f;
                target.playHurtAnimation(yaw);
            } catch (Throwable ignored) {
            }
        }
    }

    // -------------------------------------------------------------------------
    // 播报
    // -------------------------------------------------------------------------

    /**
     * 所有术式造成伤害时的播报（统一格式与颜色）：
     * {@code [GLTC联合协议] &#fff5b3使用 术式名 &#fff5b3对 &c目标名 &#fff5b3造成 &#ff0000&l伤害值 类型。}
     * 术式名使用术式自身颜色（物品显示名自带）。
     */
    public static void announceHit(Player caster, @Nullable String spellId, LivingEntity target,
                                   double finalDmg, SpellDamageType type, boolean erosionKind) {
        announceHit(caster, spellId, null, target, finalDmg, type, erosionKind);
    }

    /** 带显示名覆盖的重载：{@code displayNameOverride} 非空时优先使用（如核心技能"光影废墟"）。 */
    public static void announceHit(Player caster, @Nullable String spellId, @Nullable String displayNameOverride,
                                   LivingEntity target, double finalDmg, SpellDamageType type, boolean erosionKind) {
        if (caster == null || !(finalDmg > 0) || type == null) {
            return;
        }
        String amt = C_DMG + formatDamage(finalDmg);
        if (erosionKind) {
            // 侵蚀反噬：施法者即受害者
            caster.sendMessage(GltcMessages.PREFIX + C_MSG + "侵蚀反噬对 " + C_TARGET
                + targetName(target) + C_MSG + " 造成了 " + amt + C_MSG + " " + typeLabel(type));
            return;
        }
        String name = spellDisplayName(spellId, displayNameOverride);
        caster.sendMessage(GltcMessages.PREFIX + C_MSG + "使用 " + name
            + C_MSG + " 对 " + C_TARGET + targetName(target)
            + C_MSG + " 造成 " + amt + C_MSG + " " + typeLabel(type));
    }

    /** 术式显示名：优先 displayNameOverride，其次术式自身颜色（物品显示名），回退"未知术式"。 */
    private static String spellDisplayName(@Nullable String spellId, @Nullable String displayNameOverride) {
        if (displayNameOverride != null && !displayNameOverride.isBlank()) {
            return displayNameOverride;
        }
        if (spellId == null || spellId.isBlank()) {
            return "§f未知术式";
        }
        return StaffPdc.spellDisplayName(spellId);
    }

    private static String typeLabel(SpellDamageType type) {
        return switch (type) {
            case PHYSICAL -> LABEL_PHYSICAL;
            case PARTICLE -> LABEL_PARTICLE;
            case PULSE -> LABEL_PULSE;
        };
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private static double getMaxHealth(Player p) {
        try {
            AttributeInstance inst = p.getAttribute(Attribute.GENERIC_MAX_HEALTH);
            if (inst != null) {
                return inst.getValue();
            }
        } catch (Throwable ignored) {
        }
        try {
            return p.getMaxHealth();
        } catch (Throwable ignored) {
            return 20.0;
        }
    }

    private static double getHealth(LivingEntity e) {
        try {
            return Math.max(0, e.getHealth());
        } catch (Throwable ignored) {
            return 0;
        }
    }

    private static String targetName(LivingEntity target) {
        return EntityNameZh.name(target);
    }

    /** 与 {@code GltcAbilityPower.formatDamage} 一致：四舍五入保留 1 位小数。 */
    public static String formatDamage(double damage) {
        double rounded = Math.round(damage * 10.0) / 10.0;
        if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
            return String.valueOf(Math.round(rounded));
        }
        return String.format("%.1f", rounded);
    }
}
