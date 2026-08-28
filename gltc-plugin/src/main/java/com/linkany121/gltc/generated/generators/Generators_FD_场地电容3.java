package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_场地电容3;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_场地电容3;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_场地电容3 {
    private Generators_FD_场地电容3() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("FD_场地电容3", Items_FD_场地电容3.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_场地电容3", Items_FD_场地电容3.DATA),
            15000,
            1200,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(800, RecipeUtil.deferredSlimefun("FKR_星轨信标", 1));
        gen.addFuel(120, RecipeUtil.deferredSlimefun("TSxl3", 1));
        gen.addFuel(360, RecipeUtil.deferredSlimefun("TSxl4", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv1", 1), RecipeUtil.deferredSlimefun("FD_场地电容2", 1), RecipeUtil.deferredSlimefun("TSxl5", 1), RecipeUtil.deferredSlimefun("TSgj5", 1), null, null, null, null, null });
        GltcMenuData.register("FD_场地电容3", GltcMenuData_FD_场地电容3.DATA);
        gen.applyMenu("FD_场地电容3", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#8150ec强&#757cee电&#6aa8f1磁&#5ed3f3U&#52fff52&#55d8f3场&#58b0f1地&#5b89ef电&#5e61ed容&f-&eIII");
        gen.register(addon);
    }
}
