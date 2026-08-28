package com.linkany121.gltc.script;

import com.linkany121.gltc.item.GltcSlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import org.bukkit.inventory.ItemStack;

public class GltcScriptedItem extends GltcSlimefunItem {

    public static final String SCRIPT_ID = "SCRIPT_ID_PLACEHOLDER";

    public GltcScriptedItem(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        Object[] deferredRecipe,
        ItemStack recipeOutput
    ) {
        super(itemGroup, item, recipeType, deferredRecipe, recipeOutput);
    }
}
