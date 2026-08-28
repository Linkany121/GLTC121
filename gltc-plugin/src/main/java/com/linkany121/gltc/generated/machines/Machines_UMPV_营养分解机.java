package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_UMPV_营养分解机;
import com.linkany121.gltc.generated.menus.GltcMenuData_UMPV_营养分解机;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_UMPV_营养分解机 {
    private Machines_UMPV_营养分解机() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("UMPV_营养分解机", Items_UMPV_营养分解机.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("UMPV_营养分解机", Items_UMPV_营养分解机.DATA),
            160,
            16,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_平凡肥料", 8), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_高效肥料", 4), 60), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_活泼肥料", 2), 30)), true);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv2", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_BLOCK, 1), null, null, null, null });
        GltcMenuData.register("UMPV_营养分解机", GltcMenuData_UMPV_营养分解机.DATA);
        machine.applyMenu("UMPV_营养分解机", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#bc6c49营&#d6904b养&#f0b44d分&#dbbb51解&#c5c155机");
        machine.register(addon);
    }
}
