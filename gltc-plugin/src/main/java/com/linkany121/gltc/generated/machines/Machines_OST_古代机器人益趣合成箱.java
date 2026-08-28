package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_OST_古代机器人益趣合成箱;
import com.linkany121.gltc.generated.menus.GltcMenuData_OST_古代机器人益趣合成箱;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_OST_古代机器人益趣合成箱 {
    private Machines_OST_古代机器人益趣合成箱() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_B2,
            GltcItemBuilder.slimefunStack("OST_古代机器人益趣合成箱", Items_OST_古代机器人益趣合成箱.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("OST_古代机器人益趣合成箱", Items_OST_古代机器人益趣合成箱.DATA),
            1600,
            160,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 3), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("OST_高级逻素2", 3), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("OST_高级逻素3", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_3", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_3_BUTCHER", 32), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_3_FISHERMAN", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_MINER", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素2", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_FARMER", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_FISHERMAN", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_WOODCUTTER", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_BUTCHER", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_2", 32), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_2_FARMER", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素2", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_2_BUTCHER", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PROGRAMMABLE_ANDROID_2_FISHERMAN", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl1", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("GPS_TELEPORTATION_MATRIX", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("GPS_TELEPORTER_PYLON", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("GPS_ACTIVATION_DEVICE_SHARED", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("GPS_ACTIVATION_DEVICE_PERSONAL", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl2", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("GPS_TRANSMITTER", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("GPS_TRANSMITTER_2", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("GPS_TRANSMITTER_3", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("GPS_TRANSMITTER_4", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSnd", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("PORTABLE_GEO_SCANNER", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSwk2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("GEO_MINER", 16), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntost1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.YELLOW_WOOL, 1), null, null, null, null });
        GltcMenuData.register("OST_古代机器人益趣合成箱", GltcMenuData_OST_古代机器人益趣合成箱.DATA);
        machine.applyMenu("OST_古代机器人益趣合成箱", "&#10eb15O&#19c917S&#22a719T &#d2cea8古&#d2caa1代&#d2c79a机&#d2c393器&#d2c08c人&#d3bc84益&#d3b97d趣&#d3b576合&#d3b26f成&#d3ae68箱");
        machine.register(addon);
    }
}
