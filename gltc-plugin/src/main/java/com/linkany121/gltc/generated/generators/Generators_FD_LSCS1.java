package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_LSCS1;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_LSCS1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_LSCS1 {
    private Generators_FD_LSCS1() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_E2,
            GltcItemBuilder.slimefunStack("FD_LSCS1", Items_FD_LSCS1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_LSCS1", Items_FD_LSCS1.DATA),
            4000,
            300,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(20, RecipeUtil.deferredSlimefun("LScs1", 1));
        gen.addFuel(40, RecipeUtil.deferredSlimefun("LScs2", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntls3", 1), RecipeUtil.deferredSlimefun("LIScssp1", 1), RecipeUtil.deferredSlimefun("TSxl5", 1), RecipeUtil.deferredSlimefun("TSgj5", 1), null, null, null, null, null });
        GltcMenuData.register("FD_LSCS1", GltcMenuData_FD_LSCS1.DATA);
        gen.applyMenu("FD_LSCS1", "&#14ff00世&#4cff00纪&#84ff00末&#bcff00的&#f4ff00残&#f7bf00余&#fa8000消&#fc4000化&#ff0000盒");
        gen.register(addon);
    }
}
