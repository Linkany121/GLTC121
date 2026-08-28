package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATOcd2;
import com.linkany121.gltc.generated.menus.GltcMenuData_ATOcd2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_ATOcd2 {
    private Machines_ATOcd2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATOcd2", Items_ATOcd2.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("ATOcd2", Items_ATOcd2.DATA),
            18,
            9,
            RecipeUtil.intArray(java.util.List.of(3, 4, 5)),
            RecipeUtil.intArray(java.util.List.of(21, 22, 23))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLESTONE, 6), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A1", 3), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_INGOT, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A2", 1), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CARROT, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A3", 1), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIORITE, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A4", 1), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.WHITE_WOOL, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A5", 1), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A6", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { null, RecipeUtil.deferredSlimefun("TSlks", 1), null, RecipeUtil.deferredSlimefun("TSbtl", 1), RecipeUtil.deferredSlimefun("ATOcd1", 1), RecipeUtil.deferredSlimefun("TSbtl", 1), RecipeUtil.deferredSlimefun("TSjld", 1), RecipeUtil.deferredSlimefun("TSjld", 1), RecipeUtil.deferredSlimefun("TSjld", 1) });
        GltcMenuData.register("ATOcd2", GltcMenuData_ATOcd2.DATA);
        machine.applyMenu("ATOcd2", "&#ff5300A&#ff5b00T&#ff6300O &#5c9cf0杂质沉淀仪&7(II)");
        machine.register(addon);
    }
}
