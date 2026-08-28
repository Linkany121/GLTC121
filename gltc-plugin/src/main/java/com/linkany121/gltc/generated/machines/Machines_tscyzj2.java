package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tscyzj2;
import com.linkany121.gltc.generated.menus.GltcMenuData_TScyzj2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tscyzj2 {
    private Machines_tscyzj2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tscyzj2", Items_tscyzj2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tscyzj2", Items_tscyzj2.DATA),
            32,
            16,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("AL_A1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TStl", 1), 30), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSsy", 1), 30), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSg", 1), 30), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TShh", 1), 20), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TSyy", 1), 20), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TStj", 1), 10)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("AL_A4", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSzmkw", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("tscyzj1", 1), RecipeUtil.deferredSlimefun("TSgj1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), null, null, null, null, null });
        GltcMenuData.register("tscyzj2", GltcMenuData_TScyzj2.DATA);
        machine.applyMenu("tscyzj2", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#bfa8ff深度层岩钻机&7-&eII");
        machine.register(addon);
    }
}
