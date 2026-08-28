package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tssyyl2;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSsyyl2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tssyyl2 {
    private Machines_tssyyl2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tssyyl2", Items_tssyyl2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tssyyl2", Items_tssyyl2.DATA),
            3000,
            167,
            RecipeUtil.intArray(java.util.List.of(0, 1, 2, 9, 11, 18, 20)),
            RecipeUtil.intArray(java.util.List.of(14, 16, 23, 25, 32, 33, 34))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("TS2yy", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 16), 100), new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("TS2pbgj", 3), 90), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("TS2gfzlm", 3), 90), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("TS2rglz", 3), 90)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("TS2yy", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 16), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts3", 1), RecipeUtil.deferredSlimefun("tssyyl1", 1), RecipeUtil.deferredSlimefun("TSwk4", 1), RecipeUtil.deferredSlimefun("TSxl5", 1), RecipeUtil.deferredSlimefun("TSgj5", 1), null, null, null, null });
        GltcMenuData.register("tssyyl2", GltcMenuData_TSsyyl2.DATA);
        machine.applyMenu("tssyyl2", "&#28c8adS&#24cdac.&#21d2aaT&#1dd7a9.&#19dca7E&#16e1a6.&#12e6a4V&#0feba3.&#0bf0a1E&#07f5a0.&#04fa9e重&#00ff9d构 &#bd28e6深渊催化反应炉&7-&eII");
        machine.register(addon);
    }
}
