package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_UMPV_种子分析仪;
import com.linkany121.gltc.generated.menus.GltcMenuData_UMPV_种子分析仪;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_UMPV_种子分析仪 {
    private Machines_UMPV_种子分析仪() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("UMPV_种子分析仪", Items_UMPV_种子分析仪.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("UMPV_种子分析仪", Items_UMPV_种子分析仪.DATA),
            160,
            16,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(5, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_一堆种子", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_淡绿鸧种子", 1), 45), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_块结香颗粒", 1), 45), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_九里绕黄根茎", 1), 25), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("UMPV_腐糯粉状菌丝", 1), 25), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("UMPV_铑金化石稻谷块", 1), 15)), false);
        machine.addGltcRecipe(5, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIRT, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_一堆种子", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CAULDRON, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.ANVIL, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.WATER_BUCKET, 1), null, null, null, null, null });
        GltcMenuData.register("UMPV_种子分析仪", GltcMenuData_UMPV_种子分析仪.DATA);
        machine.applyMenu("UMPV_种子分析仪", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#6dff48种&#84ff65子&#9aff81分&#92e6c0析&#89cdff仪");
        machine.register(addon);
    }
}
