package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_鼓风机电容2;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_鼓风机电容2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_鼓风机电容2 {
    private Generators_FD_鼓风机电容2() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("FD_鼓风机电容2", Items_FD_鼓风机电容2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_鼓风机电容2", Items_FD_鼓风机电容2.DATA),
            8000,
            24,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(3, RecipeUtil.deferredSlimefun("EAE_压缩微尘", 1));
        gen.addFuel(3, RecipeUtil.deferredSlimefun("EAE_压缩腐尘", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv2", 1), RecipeUtil.deferredSlimefun("FD_鼓风机电容", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), null, null, null, null, null });
        GltcMenuData.register("FD_鼓风机电容2", GltcMenuData_FD_鼓风机电容2.DATA);
        gen.applyMenu("FD_鼓风机电容2", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#cad2c3尘&#c6cabd埃&#c3c2b7鼓&#bfbab1风&#bcb3ab机&#b8aba5发&#b4a39f电&#b19b99电&#ad9393容&f-&eII");
        gen.register(addon);
    }
}
