package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_OST_工程师入门工具生产器;
import com.linkany121.gltc.generated.menus.GltcMenuData_OST_工程师入门工具生产器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_OST_工程师入门工具生产器 {
    private Machines_OST_工程师入门工具生产器() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_B2,
            GltcItemBuilder.slimefunStack("OST_工程师入门工具生产器", Items_OST_工程师入门工具生产器.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("OST_工程师入门工具生产器", Items_OST_工程师入门工具生产器.DATA),
            160,
            16,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgd", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ENERGY_REGULATOR", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ENERGY_CONNECTOR", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("SMALL_CAPACITOR", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("MEDIUM_CAPACITOR", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("BIG_CAPACITOR", 16), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素2", 6), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("LARGE_CAPACITOR", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("CARBONADO_EDGED_CAPACITOR", 16), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素3", 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ENERGIZED_CAPACITOR", 16), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSnd", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("CARGO_MANAGER", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("CARGO_NODE", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("CARGO_NODE_OUTPUT", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("CARGO_NODE_INPUT", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("CARGO_NODE_OUTPUT_ADVANCED", 16), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素2", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ENHANCED_AUTO_CRAFTER", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("ARMOR_AUTO_CRAFTER", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("VANILLA_AUTO_CRAFTER", 16), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("CARGO_MOTOR", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("CRAFTING_MOTOR", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("CRAFTER_SMART_PORT", 16), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntost1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.RED_WOOL, 1), null, null, null, null });
        GltcMenuData.register("OST_工程师入门工具生产器", GltcMenuData_OST_工程师入门工具生产器.DATA);
        machine.applyMenu("OST_工程师入门工具生产器", "&#10eb15O&#19c917S&#22a719T &#d2a8a8工&#d19e9e程&#d09494师&#cf8a8a入&#ce8080门&#cc7575工&#cb6b6b具&#ca6161生&#c95757产&#c84d4d器");
        machine.register(addon);
    }
}
