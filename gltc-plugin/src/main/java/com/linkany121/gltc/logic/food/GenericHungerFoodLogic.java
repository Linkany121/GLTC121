package com.linkany121.gltc.logic.food;

import com.linkany121.gltc.logic.GltcItemLogic;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

/** Shared handler for {@code 食物/通用饥饿值}. */
public final class GenericHungerFoodLogic implements GltcItemLogic {

    // ===== 配置区（通用饥饿值食物表，改完需重新打包 jar 并重启生效）=====
    // 每项 = 食物 Slimefun ID → FoodDef(恢复饥饿值格数, 额外效果数组)。
    // 额外效果数组元素 = {药水效果名, 持续秒数, 等级}，null 表示无效果。
    // put(id, 6) = 恢复 6 格饥饿值无效果；FoodDef(5, {...}) = 恢复 5 格并附加药水效果。
    // 要调整某道菜：直接改对应行的数字即可。
    public static final Map<String, FoodDef> DEFS;

    static {
        Map<String, FoodDef> m = new HashMap<>();
        put(m, "UMPV_酥脆大薯条", 6);
        put(m, "UMPV_炭烤海螺", 6);
        put(m, "UMPV_大盘煎蛋", 6);
        put(m, "UMPV_久蒸大米饭", 8);
        put(m, "UMPV_猛炸大薯条", 8);
        put(m, "UMPV_肉糜煎蛋", 8);
        put(m, "UMPV_烤厄索斯菜卷", 8);
        put(m, "UMPV_酱烤岩兽串", 8);
        put(m, "UMPV_瓜片炒餮头肉", 8);
        put(m, "UMPV_翠玉卷心瓜片", 8);
        m.put("UMPV_屑切菜香肉盘", new FoodDef(5, new Object[][]{
            {"SATURATION", 30, 1}, {"JUMP", 30, 1}
        }));
        m.put("UMPV_蘑菇萝卜厚炖", new FoodDef(5, new Object[][]{
            {"SATURATION", 30, 1}, {"REGENERATION", 30, 1}
        }));
        m.put("UMPV_蛋炒鱼肉丝", new FoodDef(5, new Object[][]{
            {"SATURATION", 30, 1}, {"NIGHT_VISION", 30, 1}
        }));
        m.put("UMPV_狂野人生烤串", new FoodDef(5, new Object[][]{
            {"SATURATION", 30, 1}, {"WEAKNESS", 30, 1}, {"FIRE_RESISTANCE", 30, 1}
        }));
        m.put("UMPV_深海野兽", new FoodDef(5, new Object[][]{
            {"SATURATION", 30, 1}, {"WATER_BREATHING", 30, 1}
        }));
        m.put("UMPV_水煮虐王兽肉汤", new FoodDef(5, new Object[][]{
            {"SATURATION", 30, 1}, {"STRENGTH", 30, 1}
        }));
        m.put("UMPV_大锅炖肉土豆", new FoodDef(5, new Object[][]{
            {"SATURATION", 30, 1}, {"REGENERATION", 30, 1}
        }));
        m.put("UMPV_菌萝香炖稻焖饭", new FoodDef(6, new Object[][]{
            {"SATURATION", 60, 1}, {"RESISTANCE", 60, 1}
        }));
        m.put("UMPV_苔香辣卤海鲜汤", new FoodDef(6, new Object[][]{
            {"SATURATION", 60, 1}, {"REGENERATION", 60, 2}
        }));
        m.put("UMPV_海陆双菌酒生煎", new FoodDef(6, new Object[][]{
            {"SATURATION", 60, 1}, {"FIRE_RESISTANCE", 60, 1}, {"JUMP", 60, 2}
        }));
        m.put("UMPV_黄金焗酱烤整羽", new FoodDef(6, new Object[][]{
            {"SATURATION", 60, 1}, {"STRENGTH", 60, 2}
        }));
        m.put("UMPV_见手金果炸全腿", new FoodDef(6, new Object[][]{
            {"SATURATION", 60, 1}, {"WATER_BREATHING", 60, 1}, {"FIRE_RESISTANCE", 60, 1}
        }));
        DEFS = Collections.unmodifiableMap(m);
    }

    private static void put(Map<String, FoodDef> m, String id, int food) {
        m.put(id, new FoodDef(food, null));
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return false;
        }
        FoodDef def = DEFS.get(item.getId());
        if (def == null) {
            return false;
        }
        FoodConsumeHelper.consumeOne(hand);
        FoodConsumeHelper.addFood(player, def.food);
        FoodConsumeHelper.eatSounds(player);
        if (def.effects != null) {
            FoodConsumeHelper.addEffectsMinutesLevel(player, def.effects);
        }
        return true;
    }

    public record FoodDef(int food, Object[][] effects) {
    }
}
