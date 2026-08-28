package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATOrh1;
import com.linkany121.gltc.generated.menus.GltcMenuData_ATOrh1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_ATOrh1 {
    private Machines_ATOrh1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATOrh1", Items_ATOrh1.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("ATOrh1", Items_ATOrh1.DATA),
            64,
            32,
            RecipeUtil.intArray(java.util.List.of(3, 4, 5)),
            RecipeUtil.intArray(java.util.List.of(21, 22, 23))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHER_WART, 3), false), new RecipeUtil.GltcInputSlot(4, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLAZE_POWDER, 3), false), new RecipeUtil.GltcInputSlot(5, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_B1", 12), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLESTONE, 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A1", 12), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_INGOT, 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A2", 3), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CARROT, 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A3", 3), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIORITE, 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A4", 3), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.WHITE_WOOL, 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A5", 3), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A6", 3), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE_TORCH, 1), null, RecipeUtil.deferredSlimefun("ATOsh2", 1), RecipeUtil.deferredSlimefun("TSdjl", 1), RecipeUtil.deferredSlimefun("ATOcd2", 1), RecipeUtil.deferredSlimefun("TSas", 1), RecipeUtil.deferredSlimefun("TSas", 1), RecipeUtil.deferredSlimefun("TSas", 1) });
        GltcMenuData.register("ATOrh1", GltcMenuData_ATOrh1.DATA);
        machine.applyMenu("ATOrh1", "&#ff5300A&#ff5b00T&#ff6300O &b沉淀/升华复合驱动仓&7(III)");
        machine.register(addon);
    }
}
