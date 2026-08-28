package com.linkany121.gltc.item;

import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import org.bukkit.inventory.ItemStack;

public class GltcSlimefunItem extends SlimefunItem {

    private final Object[] deferredRecipe;

    public GltcSlimefunItem(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        Object[] deferredRecipe,
        ItemStack recipeOutput
    ) {
        super(itemGroup, item, recipeType, new ItemStack[9], recipeOutput);
        this.deferredRecipe = deferredRecipe != null ? deferredRecipe : new Object[9];
    }

    @Override
    public void preRegister() {
        GltcRecipeFixup.applyRecipe(this, deferredRecipe);
    }

    public void refreshResolvedRecipe() {
        ItemStack[] current = getRecipe();
        ItemStack[] resolved = RecipeUtil.resolveCraftingRecipe(deferredRecipe);
        if (GltcRecipeFixup.sameRecipe(current, resolved) && !GltcRecipeFixup.containsBarrier(resolved)) {
            return;
        }
        GltcRecipeFixup.applyRecipe(this, deferredRecipe);
        if (!GltcRecipeFixup.containsBarrier(resolved)) {
            GltcRecipeFixup.registerRecipeIfNeeded(this, resolved);
        }
    }
}
