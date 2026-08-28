package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tsgxdy3;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSgxdy3;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tsgxdy3 {
    private Machines_tsgxdy3() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tsgxdy3", Items_tsgxdy3.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tsgxdy3", Items_tsgxdy3.DATA),
            1200,
            120,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TStl", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSbd", 2), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TStls", 2), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TStls", 2), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TStls", 2), 30)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSsy", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSnd", 2), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSjj", 2), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSjj", 2), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSjj", 2), 30)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSg", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSgd", 2), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSxt", 2), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSxt", 2), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSxt", 2), 30)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TShh", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSdbg", 2), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSbtl", 2), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSbtl", 2), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSbtl", 2), 30)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSyy", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSjld", 2), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSym", 2), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSym", 2), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSym", 2), 30)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TStj", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSpjd", 2), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSch", 2), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSch", 2), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSch", 2), 30)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("tsgxdy2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), null, null, null, null, null });
        GltcMenuData.register("tsgxdy3", GltcMenuData_TSgxdy3.DATA);
        machine.applyMenu("tsgxdy3", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ffe59e光辉析锻仪&7-&eIII");
        machine.register(addon);
    }
}
