package com.linkany121.gltc.food;

import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

public class GltcFoodItem extends SlimefunItem {

    private static final NamespacedKey NUTRITION_KEY = new NamespacedKey("gltc", "nutrition");
    private final int nutrition;

    public GltcFoodItem(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int nutrition
    ) {
        super(itemGroup, withNutrition(item, nutrition), recipeType, recipe, withNutritionItem(recipeOutput, nutrition));
        this.nutrition = nutrition;
    }

    public int getNutrition() {
        return nutrition;
    }

    private static SlimefunItemStack withNutrition(SlimefunItemStack item, int nutrition) {
        if (item == null) {
            return null;
        }

        ItemStack template = new ItemStack(item.getType(), item.getAmount());
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            ItemMeta copy = meta.clone();
            copy.getPersistentDataContainer().set(NUTRITION_KEY, PersistentDataType.INTEGER, nutrition);
            template.setItemMeta(copy);
        }
        return new SlimefunItemStack(item.getItemId(), template);
    }

    private static ItemStack withNutritionItem(ItemStack output, int nutrition) {
        if (output == null) {
            return null;
        }
        if (output instanceof SlimefunItemStack slimefunStack) {
            return withNutrition(slimefunStack, nutrition);
        }

        ItemStack template = output.clone();
        ItemMeta meta = template.getItemMeta();
        if (meta != null) {
            meta.getPersistentDataContainer().set(NUTRITION_KEY, PersistentDataType.INTEGER, nutrition);
            template.setItemMeta(meta);
        }
        return template;
    }
}
