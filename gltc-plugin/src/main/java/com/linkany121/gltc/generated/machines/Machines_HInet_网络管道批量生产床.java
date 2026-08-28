package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_HInet_网络管道批量生产床;
import com.linkany121.gltc.generated.menus.GltcMenuData_HInet_网络管道批量生产床;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_HInet_网络管道批量生产床 {
    private Machines_HInet_网络管道批量生产床() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_C2,
            GltcItemBuilder.slimefunStack("HInet_网络管道批量生产床", Items_HInet_网络管道批量生产床.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("HInet_网络管道批量生产床", Items_HInet_网络管道批量生产床.DATA),
            1280,
            128,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSwk2", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSgj2", 1), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TSxl2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_BRIDGE", 1), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("NTW_MONITOR", 1), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("NTW_INPUT_ONLY_MONITOR", 1), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("NTW_OUTPUT_ONLY_MONITOR", 1), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("NTW_PUSHER", 1), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("NTW_GRABBER", 1), 100), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("NTW_VANILLA_GRABBER", 1), 100), new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("NTW_VANILLA_PUSHER", 1), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_IMPORT", 1), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_EXPORT", 1), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_PURGER", 1), 100), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_GREEDY_BLOCK", 1), 100), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("NTW_NETWORK_WIRELESS_RECEIVER", 1), 100), new RecipeUtil.GltcOutputSlot(34, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_WIRELESS_TRANSMITTER", 1), 100), new RecipeUtil.GltcOutputSlot(37, RecipeUtil.deferredSlimefun("NTW_CONTROL_X", 1), 100), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("NTW_CONTROL_V", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("NTW_GREEDY_BLOCK", 1), 100), new RecipeUtil.GltcOutputSlot(40, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_VACUUM", 1), 100), new RecipeUtil.GltcOutputSlot(41, RecipeUtil.deferredSlimefun("NTW_TRASH", 1), 100), new RecipeUtil.GltcOutputSlot(42, RecipeUtil.deferredSlimefun("NTW_EXPANSION_SMART_GRABBER", 1), 100), new RecipeUtil.GltcOutputSlot(43, RecipeUtil.deferredSlimefun("NTW_EXPANSION_SMART_PUSHER", 1), 100), new RecipeUtil.GltcOutputSlot(46, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_LINE_TRANSFER_PLUS_PUSHER", 1), 100), new RecipeUtil.GltcOutputSlot(47, RecipeUtil.deferredSlimefun("NTW_EXPANSION_ADVANCED_LINE_TRANSFER_PLUS_GRABBER", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("nthinet2", 1), RecipeUtil.deferredSlimefun("TSwk1", 1), RecipeUtil.deferredSlimefun("TSgj1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.PURPLE_STAINED_GLASS, 1), null, null, null, null });
        GltcMenuData.register("HInet_网络管道批量生产床", GltcMenuData_HInet_网络管道批量生产床.DATA);
        machine.applyMenu("HInet_网络管道批量生产床", "&#a0ff40H&#93ff76I&#86ffabn&#69dfd5e&#4cbefft &#7389ff网&#7785ff络&#7b82ff管&#7f7eff道&#837aff批&#8676ff量&#8a73ff生&#8e6fff产&#926bff床");
        machine.register(addon);
    }
}
