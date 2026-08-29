package com.linkany121.gltc.logic.food;

import com.linkany121.gltc.logic.GltcItemLogic;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

/** Shared handler for {@code 食物/通用药效}. */
public final class GenericPotionFoodLogic implements GltcItemLogic {

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return false;
        }
        String id = item.getId();
        switch (id) {
            case "UMPV_板蓝根" -> {
                FoodConsumeHelper.consumeOne(hand);
                heal(player, 4);
                FoodConsumeHelper.clearEffects(player);
            }
            case "UMPV_满穗线香" -> {
                FoodConsumeHelper.consumeOne(hand);
                FoodConsumeHelper.addEffect(player, "REGENERATION", 60 * 20, 0);
            }
            case "UMPV_末嫦娥" -> {
                FoodConsumeHelper.consumeOne(hand);
                FoodConsumeHelper.addEffect(player, "FIRE_RESISTANCE", 60 * 20, 0);
                FoodConsumeHelper.addEffect(player, "NIGHT_VISION", 60 * 20, 0);
            }
            case "UMPV_琼华古冶散" -> {
                FoodConsumeHelper.consumeOne(hand);
                FoodConsumeHelper.addEffect(player, "ABSORPTION", 60 * 20, 1);
                FoodConsumeHelper.addEffect(player, "POISON", 20, 2);
                FoodConsumeHelper.addEffect(player, "SLOWNESS", 20, 2);
            }
            case "UMPV_原神丸" -> {
                FoodConsumeHelper.consumeOne(hand);
                FoodConsumeHelper.addEffect(player, "INSTANT_DAMAGE", 30 * 20, 49);
            }
            case "UMPV_半满之月" -> {
                FoodConsumeHelper.consumeOne(hand);
                heal(player, 10);
                FoodConsumeHelper.clearEffects(player);
                FoodConsumeHelper.addEffect(player, "FIRE_RESISTANCE", 5 * 60 * 20, 0);
                FoodConsumeHelper.addEffect(player, "NIGHT_VISION", 5 * 60 * 20, 0);
                FoodConsumeHelper.addEffect(player, "REGENERATION", 5 * 60 * 20, 1);
            }
            case "UMPV_辟风兽角" -> {
                FoodConsumeHelper.consumeOne(hand);
                FoodConsumeHelper.addEffect(player, "SPEED", 5 * 60 * 20, 9);
                FoodConsumeHelper.addEffect(player, "LUCK", 5 * 60 * 20, 0);
            }
            case "UMPV_悠久的群天之甘露" -> {
                FoodConsumeHelper.consumeOne(hand);
                FoodConsumeHelper.addEffect(player, "SPEED", 60 * 20, 99);
                FoodConsumeHelper.addEffect(player, "JUMP_BOOST", 60 * 20, 2);
            }
            case "UMPV_龙心" -> {
                FoodConsumeHelper.consumeOne(hand);
                double max = player.getMaxHealth();
                int healAmt = (int) Math.floor(max * 0.3 + 20);
                player.setHealth(Math.min(max, player.getHealth() + healAmt));
                player.sendMessage(ChatColor.GOLD + "磅礴迸发的龙心使你回复" + ChatColor.RED + healAmt + ChatColor.GOLD + "生命值");
                FoodConsumeHelper.clearEffects(player);
                FoodConsumeHelper.addEffect(player, "RESISTANCE", 30 * 20, 2);
                FoodConsumeHelper.addEffect(player, "REGENERATION", 3 * 60 * 20, 4);
                FoodConsumeHelper.addEffect(player, "ABSORPTION", 3 * 60 * 20, 9);
                FoodConsumeHelper.addEffect(player, "FIRE_RESISTANCE", 15 * 60 * 20, 0);
                FoodConsumeHelper.addEffect(player, "NIGHT_VISION", 15 * 60 * 20, 0);
                FoodConsumeHelper.addEffect(player, "STRENGTH", 15 * 60 * 20, 1);
            }
            case "UMPV_果冻" -> {
                FoodConsumeHelper.consumeOne(hand);
                for (PotionEffectType type : PotionEffectType.values()) {
                    if (type != null) {
                        player.addPotionEffect(new PotionEffect(type, 3 * 20, 0, true, true, true));
                    }
                }
            }
            default -> {
                return false;
            }
        }
        return true;
    }

    private static void heal(Player player, double amount) {
        player.setHealth(Math.min(player.getMaxHealth(), player.getHealth() + amount));
    }
}
