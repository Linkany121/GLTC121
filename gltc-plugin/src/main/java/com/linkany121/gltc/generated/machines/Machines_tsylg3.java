package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tsylg3;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSylg3;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tsylg3 {
    private Machines_tsylg3() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tsylg3", Items_tsylg3.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tsylg3", Items_tsylg3.DATA),
            1200,
            120,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSxt", 1), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSyjt", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSld", 1), 99), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSdd", 1), 99), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSyd", 1), 99), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSld", 1), 80), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TSdd", 1), 80), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSyd", 1), 80)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSym", 1), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSjj", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSskd", 1), 99), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSlks", 1), 99), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSymy", 1), 99), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSskd", 1), 80), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TSymy", 1), 80), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSymy", 1), 80)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSch", 1), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("AL_B1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSdjl", 1), 99), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSgwhs", 1), 99), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSthyy", 1), 99), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSdjl", 1), 80), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TSgwhs", 1), 80), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSthyy", 1), 80)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("tsylg2", 1), RecipeUtil.deferredSlimefun("TSwk3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), null, null, null, null, null });
        GltcMenuData.register("tsylg3", GltcMenuData_TSylg3.DATA);
        machine.applyMenu("tsylg3", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ff6b6b匡喀斯升压馏罐&7-&eIII");
        machine.register(addon);
    }
}
