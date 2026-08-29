package com.linkany121.gltc.logic.mage;

import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

/**
 * Spell registered by slimefun / spell carrier id (e.g. {@code VASA_火球术}).
 */
public interface MageSpell {

    String id();

    String displayName();

    /** Stand right-click cast while holding staff. */
    void onRightClick(Player player, ItemStack staff);

    /**
     * Optional stand left-click hook (secondary action).
     *
     * @return {@code true} if the left-click was handled
     */
    default boolean onLeftClick(Player player, ItemStack staff) {
        return false;
    }

    /** 环数：环数 - 术士等级 = 侵蚀等级（&gt;0 时自伤 + 冷却 × 侵蚀等级）。 */
    default int ringCount() {
        return 1;
    }

    /** 术式基础冷却（毫秒）；最终冷却 = 基础冷却 × (1 - 心血管强度)。 */
    default long baseCooldownMs() {
        return 1000L;
    }

    /** 术式伤害系数：术式伤害 = 系数 × 释放者粒子强度 × GLI。 */
    default double coefficient() {
        return 1.0;
    }

    /** 伤害类型（由术式实现决定）。 */
    default MageSpellDamage.SpellDamageType damageType() {
        return MageSpellDamage.SpellDamageType.PHYSICAL;
    }
}
