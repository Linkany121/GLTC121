package com.linkany121.gltc.logic.food;

import com.linkany121.gltc.logic.GltcItemLogic;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Color;
import org.bukkit.FireworkEffect;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.Firework;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.FireworkMeta;
import org.bukkit.potion.PotionEffectType;

import java.util.concurrent.ThreadLocalRandom;

/** Special UMPV dishes with unique onUse behavior. */
public final class SpecialFoodLogic implements GltcItemLogic {

    /**
     * 特殊料理专属前缀（与 scripts/食物/灼金香烹餮汤锅.js、百香爆烤整身虐王排.js、黄金炒饭.js
     * 中 ff00ef→00a2ff 渐变一致，区别于 FKR 武器/道具套系的 e017e8→4b95ff）。
     */
    private static final String FOOD_PREFIX =
        "§f[§x§f§f§0§0§e§fG§x§d§b§1§7§f§1L§x§b§6§2§e§f§4T§x§9§2§4§5§f§6C"
            + "§x§6§d§5§d§f§8联§x§4§9§7§4§f§a合§x§2§4§8§b§f§d协§x§0§0§a§2§f§f议§f]";

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return false;
        }
        return switch (item.getId()) {
            case "UMPV_浮沉盐海的阖眸" -> fuchen(player, hand);
            case "UMPV_百香爆烤整身虐王排" -> baoxiang(player, hand);
            case "UMPV_灼金香烹餮汤锅" -> soup(player, hand);
            case "UMPV_疯狂星期四" -> thursday(player, hand);
            case "UMPV_黄金炒饭" -> goldenRice(player, hand);
            default -> false;
        };
    }

    private static boolean fuchen(Player player, ItemStack hand) {
        FoodConsumeHelper.consumeOne(hand);
        FoodConsumeHelper.addFood(player, 6);
        FoodConsumeHelper.eatSounds(player);
        FoodConsumeHelper.addEffectsMinutesLevel(player, new Object[][]{
            {"SATURATION", 60, 1},
            {"WIND_CHARGED", 1, 1},
            {"WEAVING", 1, 1},
            {"OOZING", 1, 1},
            {"INFESTATION", 1, 1}
        });
        return true;
    }

    private static boolean baoxiang(Player player, ItemStack hand) {
        FoodConsumeHelper.consumeOne(hand);
        FoodConsumeHelper.addFood(player, 8);
        FoodConsumeHelper.eatSounds(player);
        int duration = 60 * 60 * 20;
        FoodConsumeHelper.addEffect(player, "SATURATION", duration, 1);
        FoodConsumeHelper.addEffect(player, "RESISTANCE", duration, 0);
        FoodConsumeHelper.addEffect(player, "SPEED", duration, 1);
        PotionEffectType haste = FoodConsumeHelper.resolve("HASTE");
        if (haste != null) {
            player.addPotionEffect(new org.bukkit.potion.PotionEffect(haste, duration, 4, true, true, true));
        }
        FoodCombatListener.setTimedMeta(player, FoodCombatListener.META_BAOXIANG, 3 * 60 * 1000L);
        player.sendMessage(FOOD_PREFIX
            + "§x§f§f§f§5§b§3吃下世间绝味般的美食，你感到一股力量从体内涌出，让你想要肆意的咆哮。");
        return true;
    }

    private static boolean soup(Player player, ItemStack hand) {
        FoodConsumeHelper.consumeOne(hand);
        FoodConsumeHelper.addFood(player, 8);
        FoodConsumeHelper.eatSounds(player);
        int duration = 60 * 60 * 20;
        FoodConsumeHelper.addEffect(player, "SATURATION", duration, 1);
        FoodConsumeHelper.addEffect(player, "RESISTANCE", duration, 0);
        FoodConsumeHelper.addEffect(player, "REGENERATION", duration, 3);
        FoodCombatListener.setTimedMeta(player, FoodCombatListener.META_SOUP, 3 * 60 * 1000L);
        player.sendMessage(FOOD_PREFIX
            + "§x§f§f§f§5§b§3吃下世间绝味般的美食，你感到喉中滚烫的汤汁中蕴含着一往无前的气势。");
        return true;
    }

    private static boolean goldenRice(Player player, ItemStack hand) {
        FoodConsumeHelper.consumeOne(hand);
        player.setFoodLevel(Math.min(20, player.getFoodLevel() + 20));
        player.setSaturation(Math.min(20f, player.getSaturation() + 20));
        FoodConsumeHelper.eatSounds(player);
        int dur = 120 * 60 * 20;
        FoodConsumeHelper.addEffect(player, "SATURATION", dur, 4);
        FoodConsumeHelper.addEffect(player, "RESISTANCE", dur, 1);
        FoodConsumeHelper.addEffect(player, "HEALTH_BOOST", dur, 4);
        FoodConsumeHelper.addEffect(player, "REGENERATION", dur, 4);
        FoodConsumeHelper.addEffect(player, "WATER_BREATHING", dur, 0);
        FoodConsumeHelper.addEffect(player, "FIRE_RESISTANCE", dur, 0);
        FoodCombatListener.setTimedMeta(player, FoodCombatListener.META_GOLDEN_RICE, 60 * 1000L);
        player.sendMessage(FOOD_PREFIX
            + "§6吃下琳琅璀璨的传世杰作，四肢百骸仿佛被热流打通，使你神识清明，身轻如燕。");
        return true;
    }

    private static boolean thursday(Player player, ItemStack hand) {
        FoodConsumeHelper.consumeOne(hand);
        player.setFoodLevel(Math.min(20, player.getFoodLevel() + 6));
        player.setSaturation(Math.min(player.getFoodLevel(), player.getSaturation() + 6));
        player.getWorld().playSound(player.getLocation(), org.bukkit.Sound.ENTITY_GENERIC_EAT, 1f, 1f);
        int duration = 60 * 60 * 20;
        FoodConsumeHelper.addEffect(player, "SATURATION", duration, 1);
        FoodConsumeHelper.addEffect(player, "RESISTANCE", duration, 0);
        FoodConsumeHelper.addEffect(player, "STRENGTH", duration, 2);
        FoodConsumeHelper.addEffect(player, "SPEED", duration, 0);
        FoodConsumeHelper.addEffect(player, "HEALTH_BOOST", duration, 9);
        FoodConsumeHelper.addEffect(player, "FIRE_RESISTANCE", duration, 0);
        FoodConsumeHelper.addEffect(player, "GLOWING", duration, 0);
        FoodConsumeHelper.addEffect(player, "LUCK", duration, 4);

        var loc = player.getLocation().add(0, 1, 0);
        var world = player.getWorld();
        var red = new Particle.DustOptions(Color.fromRGB(255, 0, 0), 1f);
        var orange = new Particle.DustOptions(Color.fromRGB(255, 165, 0), 1f);
        for (int j = 0; j < 80; j++) {
            world.spawnParticle(Particle.DUST, loc, 0, 0.5, 0.5, 0.5, 0, j % 2 == 0 ? red : orange);
        }
        ThreadLocalRandom rng = ThreadLocalRandom.current();
        for (int k = 0; k < 4; k++) {
            var fireworkLoc = loc.clone().add(0.5 - rng.nextDouble(), 1, 0.5 - rng.nextDouble());
            Firework firework = (Firework) world.spawnEntity(fireworkLoc, EntityType.FIREWORK_ROCKET);
            FireworkMeta meta = firework.getFireworkMeta();
            meta.addEffect(FireworkEffect.builder()
                .withColor(Color.fromRGB(rng.nextInt(256), rng.nextInt(256), rng.nextInt(256)))
                .withFade(Color.fromRGB(255, 165, 0))
                .with(FireworkEffect.Type.BALL_LARGE)
                .build());
            meta.setPower(1);
            firework.setFireworkMeta(meta);
            firework.detonate();
        }
        return true;
    }
}
