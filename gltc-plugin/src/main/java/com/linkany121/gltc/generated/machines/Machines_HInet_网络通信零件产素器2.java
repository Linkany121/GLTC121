package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_HInet_网络通信零件产素器2;
import com.linkany121.gltc.generated.menus.GltcMenuData_HInet_网络通信零件产素器2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_HInet_网络通信零件产素器2 {
    private Machines_HInet_网络通信零件产素器2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_C2,
            GltcItemBuilder.slimefunStack("HInet_网络通信零件产素器2", Items_HInet_网络通信零件产素器2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("HInet_网络通信零件产素器2", Items_HInet_网络通信零件产素器2.DATA),
            2000,
            200,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_OPTIC_CABLE", 4), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("NTW_SYNTHETIC_EMERALD_SHARD", 4), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("NTW_OPTIC_GLASS", 4), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("NTW_OPTIC_STAR", 4), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_RADIOACTIVE_OPTIC_STAR", 4), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("NTW_SHRINKING_BASE", 4), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("NTW_SIMPLE_NANOBOTS", 4), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("NTW_ADVANCED_NANOBOTS", 4), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("NTW_AI_CORE", 4), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NTW_EMPOWERED_AI_CORE", 4), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("NTW_EMPOWERED_AI_CORE", 4), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("NTW_INTERDIMENSIONAL_PRESENCE", 4), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSlx", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PRINTED_CALCULATION_CIRCUIT", 4), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("CALCULATION_PROCESSOR", 4), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("CRYSTAL_FLUIX", 4), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("FLUIX_DUST", 4), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("CHARGED_CRYSTAL_CERTUS_QUARTZ", 4), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("FORMATION_CORE", 4), 100), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("PARALLEL_PROCESSOR", 4), 100), new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("ME_STORAGE_HOUSING", 4), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("ME_GLASS_CABLE", 4), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("FLUIX_PEARL", 4), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("ENGINEERING_PROCESSOR", 4), 100), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("PRINTED_ENGINEERING_CIRCUIT", 4), 100), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("PRINTED_SILICON", 4), 100), new RecipeUtil.GltcOutputSlot(34, RecipeUtil.deferredSlimefun("LOGIC_PROCESSOR", 4), 100), new RecipeUtil.GltcOutputSlot(37, RecipeUtil.deferredSlimefun("PRINTED_LOGIC_CIRCUIT", 4), 100), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("ANNIHILATION_CORE", 4), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("SKY_STONE_DUST", 4), 100), new RecipeUtil.GltcOutputSlot(40, RecipeUtil.deferredSlimefun("QUARTZ_DUST", 4), 100), new RecipeUtil.GltcOutputSlot(41, RecipeUtil.deferredSlimefun("CERTUS_QUARTZ_DUST", 4), 100), new RecipeUtil.GltcOutputSlot(42, RecipeUtil.deferredSlimefun("CRYSTAL_CERTUS_QUARTZ", 4), 100), new RecipeUtil.GltcOutputSlot(43, RecipeUtil.deferredSlimefun("WIRELESS_RECEIVER", 4), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("nthinet3", 1), RecipeUtil.deferredSlimefun("HInet_网络通信零件产素器", 1), RecipeUtil.deferredSlimefun("TSgj3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), null, null, null, null, null });
        GltcMenuData.register("HInet_网络通信零件产素器2", GltcMenuData_HInet_网络通信零件产素器2.DATA);
        machine.applyMenu("HInet_网络通信零件产素器2", "&#a0ff40H&#93ff76I&#86ffabn&#69dfd5e&#4cbefft &#b1fff8网&#b1fbf9络&#b0f8fa通&#b0f4fb信&#aff0fc零&#afecfc件&#aee9fd产&#aee5fe素&#ade1ff器&f-&eII");
        machine.register(addon);
    }
}
