package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_TSmlq1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSmlq1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_TSmlq1 {
    private Machines_TSmlq1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("TSmlq1", Items_TSmlq1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("TSmlq1", Items_TSmlq1.DATA),
            2500,
            400,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15, 20, 21, 22, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSzzrz", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSymy", 8), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSstklp", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TStgs", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TStgs", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSkajd", 8), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSxwhd", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSzjg", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts2", 1), RecipeUtil.deferredSlimefun("TSwk4", 1), RecipeUtil.deferredSlimefun("TSgj4", 1), RecipeUtil.deferredSlimefun("TSxl4", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.OBSIDIAN, 1), null, null, null, null });
        GltcMenuData.register("TSmlq1", GltcMenuData_TSmlq1.DATA);
        machine.applyMenu("TSmlq1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ff3dcb主&#e434d4序&#ca2ade星&#af21e7风&#9418f1暴&#790ffa反&#7916ed应&#942dca模&#af45a7拟&#ca5c84仓&#e47460-&#ff8b3dI");
        machine.register(addon);
    }
}
