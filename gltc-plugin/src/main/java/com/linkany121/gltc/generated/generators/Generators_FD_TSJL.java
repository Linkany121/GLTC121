package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_TSJL;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_TSJL;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_TSJL {
    private Generators_FD_TSJL() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_D1c,
            GltcItemBuilder.slimefunStack("FD_TSJL", Items_FD_TSJL.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_TSJL", Items_FD_TSJL.DATA),
            200,
            16,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(10, RecipeUtil.deferredSlimefun("TSjj", 1));
        gen.addFuel(20, RecipeUtil.deferredSlimefun("TSbtl", 1));
        gen.addFuel(30, RecipeUtil.deferredSlimefun("TSgwhs", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CAULDRON, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.TRIPWIRE_HOOK, 1), null, null, null, null });
        GltcMenuData.register("FD_TSJL", GltcMenuData_FD_TSJL.DATA);
        gen.applyMenu("FD_TSJL", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ffbd61精致燃烧发电盒");
        gen.register(addon);
    }
}
