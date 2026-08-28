package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_HInet_网络入门工具包;
import com.linkany121.gltc.generated.menus.GltcMenuData_HInet_网络入门工具包;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_HInet_网络入门工具包 {
    private Machines_HInet_网络入门工具包() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_C2,
            GltcItemBuilder.slimefunStack("HInet_网络入门工具包", Items_HInet_网络入门工具包.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("HInet_网络入门工具包", Items_HInet_网络入门工具包.DATA),
            240,
            24,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(5, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSwk1", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_CONFIGURATOR", 1), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("NTW_WIRELESS_CONFIGURATOR", 1), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ITEM_MOVER", 1), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("NTW_EXPANSION_DUE_MACHINE_CONFIGURATOR", 1), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("NTW_CRAYON", 1), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("NTW_PROBE", 1), 100), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("NTW_EXPANSION_STATUS_VIEWER", 1), 100), new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("NTW_EXPANSION_CARGO_NODE_QUICK_TOOL", 1), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("NTW_CONTROLLER", 1), 100)), false);
        machine.addGltcRecipe(5, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgj1", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_EXPANSION_DRAWER_MANAGER", 1), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("NTW_EXPANSION_QUANTUM_MANAGER", 1), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("NTW_GRID", 1), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("NTW_CRAFTING_GRID", 1), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("NTW_EXPANSION_SMART_NETWORK_CRAFTING_GRID_NEW_STYLE", 1), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("NTW_REMOTE_ULTIMATE", 1), 100), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("NTW_EXPANSION_HANGING_GRID_NEW_STYLE", 1), 100)), false);
        machine.addGltcRecipe(5, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl2", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_RAKE_3", 1), 100)), false);
        machine.addGltcRecipe(5, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl1", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_CELL", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("nthinet1", 1), RecipeUtil.deferredSlimefun("TSwk1", 1), RecipeUtil.deferredSlimefun("TSgj1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLUE_STAINED_GLASS, 1), null, null, null, null });
        GltcMenuData.register("HInet_网络入门工具包", GltcMenuData_HInet_网络入门工具包.DATA);
        machine.applyMenu("HInet_网络入门工具包", "&#a0ff40H&#93ff76I&#86ffabn&#69dfd5e&#4cbefft &#819cff网&#81a5ff络&#81aeff入&#82b7ff门&#82bfff工&#82c8ff具&#82d1ff包");
        machine.register(addon);
    }
}
