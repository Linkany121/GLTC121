package com.linkany121.gltc.logic.food;

import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import javax.annotation.Nullable;

final class FoodConsumeHelper {

    private FoodConsumeHelper() {
    }

    static void consumeOne(ItemStack hand) {
        hand.setAmount(hand.getAmount() - 1);
    }

    static void addFood(Player player, int food) {
        player.setFoodLevel(Math.min(20, player.getFoodLevel() + food));
        player.setSaturation(Math.min(20f, player.getSaturation() + food));
    }

    static void eatSounds(Player player) {
        player.getWorld().playSound(player.getLocation(), Sound.ENTITY_GENERIC_EAT, 1f, 1f);
        player.getWorld().playSound(player.getLocation(), Sound.ENTITY_PLAYER_BURP, 1f, 1f);
    }

    static void addEffect(Player player, String typeName, int durationTicks, int amplifier) {
        PotionEffectType type = resolve(typeName);
        if (type == null) {
            return;
        }
        int amp = Math.max(0, Math.min(255, amplifier));
        player.addPotionEffect(new PotionEffect(type, durationTicks, amp, true, true, true));
    }

    /** effects entries: name, durationMinutes, level (1-based like JS). */
    static void addEffectsMinutesLevel(Player player, Object[][] effects) {
        for (Object[] e : effects) {
            String name = (String) e[0];
            int minutes = (Integer) e[1];
            int level = (Integer) e[2];
            addEffect(player, name, minutes * 60 * 20, level - 1);
        }
    }

    static void clearEffects(Player player) {
        for (PotionEffect effect : player.getActivePotionEffects()) {
            player.removePotionEffect(effect.getType());
        }
    }

    @Nullable
    static PotionEffectType resolve(String name) {
        PotionEffectType type = PotionEffectType.getByName(name);
        if (type != null) {
            return type;
        }
        // legacy aliases
        if ("JUMP".equalsIgnoreCase(name)) {
            type = PotionEffectType.getByName("JUMP_BOOST");
        } else if ("FAST_DIGGING".equalsIgnoreCase(name) || "HASTE".equalsIgnoreCase(name)) {
            type = PotionEffectType.getByName("HASTE");
            if (type == null) {
                type = PotionEffectType.getByName("FAST_DIGGING");
            }
        } else if ("INCREASE_DAMAGE".equalsIgnoreCase(name)) {
            type = PotionEffectType.getByName("STRENGTH");
        }
        return type;
    }
}
