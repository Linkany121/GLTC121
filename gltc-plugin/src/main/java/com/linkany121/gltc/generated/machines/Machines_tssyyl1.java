package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tssyyl1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSsyyl1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tssyyl1 {
    private Machines_tssyyl1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tssyyl1", Items_tssyyl1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tssyyl1", Items_tssyyl1.DATA),
            3000,
            167,
            RecipeUtil.intArray(java.util.List.of(0, 1, 2, 9, 11, 18, 20)),
            RecipeUtil.intArray(java.util.List.of(14, 16, 23, 25, 32, 33, 34))
        );
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("TS2yy", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 16), 100), new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("TS2pbgj", 1), 80), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("TS2gfzlm", 1), 80), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("TS2rglz", 1), 80)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("TS2yy", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 16), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.ENDER_EYE, 1), null, null, null, null, null });
        GltcMenuData.register("tssyyl1", GltcMenuData_TSsyyl1.DATA);
        machine.applyMenu("tssyyl1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#bd28e6深渊催化反应炉&7-&eI");
        machine.register(addon);
    }
}
