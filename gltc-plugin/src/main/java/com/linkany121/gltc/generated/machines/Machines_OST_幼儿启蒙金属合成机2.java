package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_OST_幼儿启蒙金属合成机2;
import com.linkany121.gltc.generated.menus.GltcMenuData_OST_幼儿启蒙金属合成机2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_OST_幼儿启蒙金属合成机2 {
    private Machines_OST_幼儿启蒙金属合成机2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_B2,
            GltcItemBuilder.slimefunStack("OST_幼儿启蒙金属合成机2", Items_OST_幼儿启蒙金属合成机2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("OST_幼儿启蒙金属合成机2", Items_OST_幼儿启蒙金属合成机2.DATA),
            1280,
            128,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("OST_高级逻素2", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("OST_高级逻素3", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("HARDENED_METAL_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("REINFORCED_ALLOY_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("REDSTONE_ALLOY", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("IRON_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("IRON_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("GOLD_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("GOLD_4K", 64), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("COPPER_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("COPPER_INGOT", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素2", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TIN_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("TIN_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("SILVER_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("SILVER_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("LEAD_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("LEAD_INGOT", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素3", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ZINC_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("ZINC_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("MAGNESIUM_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("MAGNESIUM_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("ALUMINUM_DUST", 64), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("ALUMINUM_INGOT", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("STEEL_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("DAMASCUS_STEEL_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("BRONZE_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("DURALUMIN_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("BILLON_INGOT", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素2", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("BRASS_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("ALUMINUM_BRASS_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("ALUMINUM_BRONZE_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("CORINTHIAN_BRONZE_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("SOLDER_INGOT", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素3", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("NICKEL_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("COBALT_INGOT", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("FERROSILICON", 64), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("GOLD_24K", 64), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("GILDED_IRON", 64), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntost2", 1), RecipeUtil.deferredSlimefun("OST_幼儿启蒙金属合成机", 1), RecipeUtil.deferredSlimefun("TSwk3", 1), RecipeUtil.deferredSlimefun("TSgj3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), null, null, null, null });
        GltcMenuData.register("OST_幼儿启蒙金属合成机2", GltcMenuData_OST_幼儿启蒙金属合成机2.DATA);
        machine.applyMenu("OST_幼儿启蒙金属合成机2", "&#10eb15O&#19c917S&#22a719T &#e7e4bc幼&#e0ddb5儿&#dad7af启&#d3d0a8蒙&#cccaa1金&#c5c39a属&#bfbc94合&#b8b68d成&#b1af86机&f-&eII");
        machine.register(addon);
    }
}
