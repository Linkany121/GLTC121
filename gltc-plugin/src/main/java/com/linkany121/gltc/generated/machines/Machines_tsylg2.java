package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tsylg2;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSylg2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tsylg2 {
    private Machines_tsylg2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tsylg2", Items_tsylg2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tsylg2", Items_tsylg2.DATA),
            84,
            42,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSxt", 1), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSyjt", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSld", 1), 80), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSdd", 1), 80), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSyd", 1), 80), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSld", 1), 60), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TSdd", 1), 60), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSyd", 1), 60)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSym", 1), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSjj", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSskd", 1), 80), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSlks", 1), 80), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSymy", 1), 80), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSskd", 1), 60), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TSymy", 1), 60), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSymy", 1), 60)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSch", 1), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("AL_B1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSdjl", 1), 80), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSgwhs", 1), 80), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSthyy", 1), 80), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TSdjl", 1), 60), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TSgwhs", 1), 60), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSthyy", 1), 60)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("tsylg1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.FLINT, 1), null, null, null, null });
        GltcMenuData.register("tsylg2", GltcMenuData_TSylg2.DATA);
        machine.applyMenu("tsylg2", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ff6b6b匡喀斯升压馏罐&7-&eII");
        machine.register(addon);
    }
}
