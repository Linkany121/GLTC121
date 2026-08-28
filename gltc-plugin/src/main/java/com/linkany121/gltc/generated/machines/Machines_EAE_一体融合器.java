package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_EAE_一体融合器;
import com.linkany121.gltc.generated.menus.GltcMenuData_EAE_一体融合器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_EAE_一体融合器 {
    private Machines_EAE_一体融合器() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_F2,
            GltcItemBuilder.slimefunStack("EAE_一体融合器", Items_EAE_一体融合器.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("EAE_一体融合器", Items_EAE_一体融合器.DATA),
            1600,
            160,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(4, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_B1", 64), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLESTONE, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_A1", 64), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_INGOT, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_A2", 64), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CARROT, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_A3", 64), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIORITE, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_A4", 64), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.WHITE_WOOL, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_A5", 64), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_A6", 64), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.LAVA_BUCKET, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TSyjt", 64), 100), new RecipeUtil.GltcOutputSlot(20, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BUCKET, 1), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.WATER_BUCKET, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TSjst", 64), 100), new RecipeUtil.GltcOutputSlot(20, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BUCKET, 1), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.MAGMA_BLOCK, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TSyjt", 64), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("nteae2", 1), RecipeUtil.deferredSlimefun("ATOrh1", 1), RecipeUtil.deferredSlimefun("ATOgzq", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), null, null, null, null });
        GltcMenuData.register("EAE_一体融合器", GltcMenuData_EAE_一体融合器.DATA);
        machine.applyMenu("EAE_一体融合器", "&#eac92fE&#df7b21A&#d42d13E &#74bedaC&#7db2ce.&#86a6c3G&#8f9ab7C&#988fab一&#a083a0体&#a97794融&#b26b89合&#bb5f7d器");
        machine.register(addon);
    }
}
