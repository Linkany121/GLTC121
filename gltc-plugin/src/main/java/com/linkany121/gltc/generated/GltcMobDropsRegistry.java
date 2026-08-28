package com.linkany121.gltc.generated;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.util.IdCanonicalizer;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.implementation.SlimefunItems;
import org.bukkit.inventory.ItemStack;
import com.linkany121.gltc.generated.items.Items_TSstxkl;
import com.linkany121.gltc.generated.items.Items_TSstklp;
import com.linkany121.gltc.generated.items.Items_TSstxts;
import com.linkany121.gltc.generated.items.Items_TSstjsz;
import com.linkany121.gltc.generated.items.Items_TSstmyl;
import com.linkany121.gltc.generated.GltcItemGroups;

/** Auto-generated. Do not edit. */

public final class GltcMobDropsRegistry {
    private GltcMobDropsRegistry() {}
    public static void register(SlimefunAddon addon) {
        new SlimefunItem(GltcItemGroups.A_E1a, GltcItemBuilder.slimefunStack("TSstxkl", Items_TSstxkl.DATA), RecipeUtil.resolveRecipeType("NULL"), new ItemStack[0], GltcItemBuilder.slimefunStack("TSstxkl", Items_TSstxkl.DATA)).register(addon);
        new SlimefunItem(GltcItemGroups.A_E1a, GltcItemBuilder.slimefunStack("TSstklp", Items_TSstklp.DATA), RecipeUtil.resolveRecipeType("NULL"), new ItemStack[0], GltcItemBuilder.slimefunStack("TSstklp", Items_TSstklp.DATA)).register(addon);
        new SlimefunItem(GltcItemGroups.A_E1a, GltcItemBuilder.slimefunStack("TSstxts", Items_TSstxts.DATA), RecipeUtil.resolveRecipeType("NULL"), new ItemStack[0], GltcItemBuilder.slimefunStack("TSstxts", Items_TSstxts.DATA)).register(addon);
        new SlimefunItem(GltcItemGroups.A_E1a, GltcItemBuilder.slimefunStack("TSstjsz", Items_TSstjsz.DATA), RecipeUtil.resolveRecipeType("NULL"), new ItemStack[0], GltcItemBuilder.slimefunStack("TSstjsz", Items_TSstjsz.DATA)).register(addon);
        new SlimefunItem(GltcItemGroups.A_E1a, GltcItemBuilder.slimefunStack("TSstmyl", Items_TSstmyl.DATA), RecipeUtil.resolveRecipeType("NULL"), new ItemStack[0], GltcItemBuilder.slimefunStack("TSstmyl", Items_TSstmyl.DATA)).register(addon);
    }
}
