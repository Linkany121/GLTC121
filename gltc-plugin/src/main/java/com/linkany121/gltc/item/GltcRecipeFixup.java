package com.linkany121.gltc.item;

import com.linkany121.gltc.machine.GltcSimpleMultiBlock;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.Arrays;

public final class GltcRecipeFixup {

    private static final java.util.Set<String> REGISTERED_RECIPES = java.util.concurrent.ConcurrentHashMap.newKeySet();

    private GltcRecipeFixup() {
    }

    /** Immediate + delayed refreshes so late-loading addons resolve deferred recipes. */
    public static void schedule(JavaPlugin plugin) {
        refreshAll();
        plugin.getServer().getScheduler().runTask(plugin, GltcRecipeFixup::refreshAll);
        plugin.getServer().getScheduler().runTaskLater(plugin, GltcRecipeFixup::refreshAll, 20L);
        plugin.getServer().getScheduler().runTaskLater(plugin, GltcRecipeFixup::refreshAll, 100L);
    }

    public static void refreshAll() {
        for (SlimefunItem item : Slimefun.getRegistry().getAllSlimefunItems()) {
            if (item instanceof GltcSlimefunItem gltcItem) {
                gltcItem.refreshResolvedRecipe();
            } else if (item instanceof DeferredCraftingHolder holder) {
                holder.refreshCraftingRecipe();
            } else if (item instanceof GltcSimpleMultiBlock simpleMb) {
                simpleMb.refreshRecipes();
            }
        }
    }

    public static void applyRecipe(SlimefunItem item, Object[] deferredRecipe) {
        item.setRecipe(RecipeUtil.resolveCraftingRecipe(deferredRecipe));
    }

    public static boolean containsBarrier(ItemStack[] recipe) {
        if (recipe == null) {
            return false;
        }
        for (ItemStack stack : recipe) {
            if (stack != null && stack.getType() == Material.BARRIER) {
                return true;
            }
        }
        return false;
    }

    public static boolean sameRecipe(ItemStack[] left, ItemStack[] right) {
        return Arrays.equals(left, right);
    }

    public static void registerRecipeIfNeeded(SlimefunItem item, ItemStack[] recipe) {
        RecipeType type = item.getRecipeType();
        if (type == null || type == RecipeType.NULL) {
            return;
        }
        try {
            if (item.isDisabled()) {
                return;
            }
        } catch (io.github.thebusybiscuit.slimefun4.api.exceptions.UnregisteredItemException ex) {
            return;
        }
        if (containsBarrier(recipe)) {
            return;
        }
        String key = type.hashCode() + "|" + item.getId() + "|" + Arrays.deepHashCode(recipe);
        if (!REGISTERED_RECIPES.add(key)) {
            return;
        }
        type.register(recipe, item.getRecipeOutput());
    }

    public static void clearRegistrationCache() {
        REGISTERED_RECIPES.clear();
    }
}
