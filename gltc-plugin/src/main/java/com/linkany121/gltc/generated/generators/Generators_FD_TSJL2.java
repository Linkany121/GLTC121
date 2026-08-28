package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_TSJL2;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_TSJL2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_TSJL2 {
    private Generators_FD_TSJL2() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_D1c,
            GltcItemBuilder.slimefunStack("FD_TSJL2", Items_FD_TSJL2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_TSJL2", Items_FD_TSJL2.DATA),
            4000,
            80,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(10, RecipeUtil.deferredSlimefun("TSjj", 1));
        gen.addFuel(20, RecipeUtil.deferredSlimefun("TSbtl", 1));
        gen.addFuel(30, RecipeUtil.deferredSlimefun("TSgwhs", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts2", 1), RecipeUtil.deferredSlimefun("FD_TSJL", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), RecipeUtil.deferredSlimefun("TSgj1", 1), null, null, null, null, null });
        GltcMenuData.register("FD_TSJL2", GltcMenuData_FD_TSJL2.DATA);
        gen.applyMenu("FD_TSJL2", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ffbd61精致燃烧发电盒&f-&eII");
        gen.register(addon);
    }
}
