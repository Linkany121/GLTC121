package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_发酵电容2;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_发酵电容2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_发酵电容2 {
    private Generators_FD_发酵电容2() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("FD_发酵电容2", Items_FD_发酵电容2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_发酵电容2", Items_FD_发酵电容2.DATA),
            12000,
            32,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(1, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1));
        gen.addFuel(6, RecipeUtil.deferredSlimefun("UMPV_平凡肥料", 1));
        gen.addFuel(18, RecipeUtil.deferredSlimefun("UMPV_高效肥料", 1));
        gen.addFuel(48, RecipeUtil.deferredSlimefun("UMPV_活泼肥料", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv2", 1), RecipeUtil.deferredSlimefun("FD_发酵电容", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), null, null, null, null, null });
        GltcMenuData.register("FD_发酵电容2", GltcMenuData_FD_发酵电容2.DATA);
        gen.applyMenu("FD_发酵电容2", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#83bc49养&#8dc04a分&#98c44b发&#a2c84c酵&#adcc4d电&#b5ce4d容&#bccd4c发&#c2cc4a电&#c9cb49机&#cfca47组&f-&eII");
        gen.register(addon);
    }
}
