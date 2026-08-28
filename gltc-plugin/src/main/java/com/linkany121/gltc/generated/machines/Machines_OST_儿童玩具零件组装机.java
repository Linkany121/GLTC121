package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_OST_儿童玩具零件组装机;
import com.linkany121.gltc.generated.menus.GltcMenuData_OST_儿童玩具零件组装机;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_OST_儿童玩具零件组装机 {
    private Machines_OST_儿童玩具零件组装机() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_B2,
            GltcItemBuilder.slimefunStack("OST_儿童玩具零件组装机", Items_OST_儿童玩具零件组装机.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("OST_儿童玩具零件组装机", Items_OST_儿童玩具零件组装机.DATA),
            160,
            16,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("CARBON", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("SILICON", 32), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("SULFATE", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素2", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("CARBONADO", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("SYNTHETIC_EMERALD", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("SYNTHETIC_DIAMOND", 32), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("SYNTHETIC_SAPPHIRE", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ELECTRO_MAGNET", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("ELECTRIC_MOTOR", 32), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("HEATING_COIL", 32), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("COOLING_UNIT", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素2", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("POWER_CRYSTAL", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("SOLAR_PANEL", 32), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("ANDROID_MEMORY_CORE", 32), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("STEEL_PLATE", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("REINFORCED_PLATE", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("ADVANCED_CIRCUIT_BOARD", 32), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("BASIC_CIRCUIT_BOARD", 32), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("MAGNET", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("HOLOGRAM_PROJECTOR", 3), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgj3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("CARBONADO_MULTI_TOOL", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSwk3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("CARBONADO_EDGED_FURNACE", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSpjd", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("RADIANT_BACKPACK", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSwk2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ELEVATOR_PLATE", 12), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntost1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.LIGHT_GRAY_WOOL, 1), null, null, null, null });
        GltcMenuData.register("OST_儿童玩具零件组装机", GltcMenuData_OST_儿童玩具零件组装机.DATA);
        machine.applyMenu("OST_儿童玩具零件组装机", "&#10eb15O&#19c917S&#22a719T &#99c2b9儿&#97beb8童&#94bab7玩&#92b6b6具&#90b2b5零&#8daeb4件&#8baab3组&#88a6b2装&#86a2b1机");
        machine.register(addon);
    }
}
