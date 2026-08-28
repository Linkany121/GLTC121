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
import com.linkany121.gltc.generated.items.Items_GLTC_能源调节器;
import com.linkany121.gltc.generated.items.Items_GLTC_能源调节器2;
import com.linkany121.gltc.generated.items.Items_GLTC_能源连接器;
import com.linkany121.gltc.generated.items.Items_GLTC_能源连接器2;
import com.linkany121.gltc.generated.GltcItemGroups;
import io.github.thebusybiscuit.slimefun4.implementation.items.electric.EnergyConnector;
import io.github.thebusybiscuit.slimefun4.implementation.items.electric.EnergyRegulator;

/** Auto-generated. Do not edit. */

public final class GltcSupers {
    private GltcSupers() {}
    public static void register(SlimefunAddon addon) {
        new EnergyRegulator(GltcItemGroups.A_B2, GltcItemBuilder.slimefunStack("GLTC_能源调节器", Items_GLTC_能源调节器.DATA), RecipeUtil.resolveRecipeType("PF_ATO_GT"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("AL_A6", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 1), RecipeUtil.deferredSlimefun("AL_A6", 1), null, null, null, null, null, null })).register(addon);
        new EnergyRegulator(GltcItemGroups.A_B2, GltcItemBuilder.slimefunStack("GLTC_能源调节器2", Items_GLTC_能源调节器2.DATA), RecipeUtil.resolveRecipeType("PF_ATO_GT"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("AL_A6", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), RecipeUtil.deferredSlimefun("AL_A6", 1), null, null, null, null, null, null })).register(addon);
        new EnergyConnector(GltcItemGroups.A_B2, GltcItemBuilder.slimefunStack("GLTC_能源连接器", Items_GLTC_能源连接器.DATA), RecipeUtil.resolveRecipeType("PF_ATO_GT"), RecipeUtil.resolveCraftingRecipe(new Object[] { null, RecipeUtil.deferredSlimefun("AL_A6", 1), null, null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 1), null, null, RecipeUtil.deferredSlimefun("AL_A6", 1), null }), GltcItemBuilder.slimefunStack("GLTC_能源连接器", Items_GLTC_能源连接器.DATA)).register(addon);
        new EnergyConnector(GltcItemGroups.A_B2, GltcItemBuilder.slimefunStack("GLTC_能源连接器2", Items_GLTC_能源连接器2.DATA), RecipeUtil.resolveRecipeType("PF_ATO_GT"), RecipeUtil.resolveCraftingRecipe(new Object[] { null, RecipeUtil.deferredSlimefun("AL_A6", 1), null, null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), null, null, RecipeUtil.deferredSlimefun("AL_A6", 1), null }), GltcItemBuilder.slimefunStack("GLTC_能源连接器2", Items_GLTC_能源连接器2.DATA)).register(addon);
    }
}
