package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_TSmlq2;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSmlq2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_TSmlq2 {
    private Machines_TSmlq2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("TSmlq2", Items_TSmlq2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("TSmlq2", Items_TSmlq2.DATA),
            4000,
            1000,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15, 20, 21, 22, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSzzrz", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSymy", 8), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSstklp", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TStgs", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TStgs", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSkajd", 8), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSxwhd", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSzjg", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts3", 1), RecipeUtil.deferredSlimefun("TSmlq1", 1), RecipeUtil.deferredSlimefun("TSgj5", 1), RecipeUtil.deferredSlimefun("TSxl5", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BEACON, 1), null, null, null, null });
        GltcMenuData.register("TSmlq2", GltcMenuData_TSmlq2.DATA);
        machine.applyMenu("TSmlq2", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ff1ac2主&#ff17a1序&#ff147f星&#ff115e风&#ff0e3c暴&#ff0b1b反&#ff1709应&#ff3007模&#ff4905拟&#ff6204仓&#ff7c02-&#ff9500II");
        machine.register(addon);
    }
}
