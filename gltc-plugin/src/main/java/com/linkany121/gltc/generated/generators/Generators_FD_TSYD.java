package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_TSYD;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_TSYD;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_TSYD {
    private Generators_FD_TSYD() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_D1c,
            GltcItemBuilder.slimefunStack("FD_TSYD", Items_FD_TSYD.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_TSYD", Items_FD_TSYD.DATA),
            360,
            32,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(2, RecipeUtil.deferredSlimefun("BUCKET_OF_OIL", 1));
        gen.addFuel(4, RecipeUtil.deferredSlimefun("TSas", 1));
        gen.addFuel(12, RecipeUtil.deferredSlimefun("TS2jbyg", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CAULDRON, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE_TORCH, 1), null, null, null, null });
        GltcMenuData.register("FD_TSYD", GltcMenuData_FD_TSYD.DATA);
        gen.applyMenu("FD_TSYD", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ffbd61粒子内燃发电机");
        gen.register(addon);
    }
}
