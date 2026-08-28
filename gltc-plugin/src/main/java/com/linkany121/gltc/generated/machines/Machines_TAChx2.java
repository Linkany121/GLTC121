package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_TAChx2;
import com.linkany121.gltc.generated.menus.GltcMenuData_TAChx2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_TAChx2 {
    private Machines_TAChx2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_C2,
            GltcItemBuilder.slimefunStack("TAChx2", Items_TAChx2.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("TAChx2", Items_TAChx2.DATA),
            320,
            32,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7)),
            RecipeUtil.intArray(java.util.List.of(27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(30, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("al_xt1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(27, RecipeUtil.deferredSlimefun("al_xt2", 1), 30), new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("al_xt3", 1), 40), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("al_xt4", 1), 40), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("al_xt5", 1), 40), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("al_xt奥史莱特", 1), 40), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("al_xt缪尔罗素", 1), 40), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("al_xt魔药联合", 1), 40), new RecipeUtil.GltcOutputSlot(34, RecipeUtil.deferredSlimefun("al_xt乎维米亚", 1), 40), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("al_xt远征舰", 1), 40), new RecipeUtil.GltcOutputSlot(36, RecipeUtil.deferredSlimefun("al_xt环夜谷", 1), 40)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("TAChx1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), null, null, null, null, null });
        GltcMenuData.register("TAChx2", GltcMenuData_TAChx2.DATA);
        machine.applyMenu("TAChx2", "&dTAC &#9c81e3电&#8372d5力&#6b62c6唤&#5253b8醒&#3944aa器&7-&eII");
        machine.register(addon);
    }
}
