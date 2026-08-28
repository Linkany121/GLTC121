package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATOsh1;
import com.linkany121.gltc.generated.menus.GltcMenuData_ATOsh1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_ATOsh1 {
    private Machines_ATOsh1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATOsh1", Items_ATOsh1.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("ATOsh1", Items_ATOsh1.DATA),
            6,
            3,
            RecipeUtil.intArray(java.util.List.of(3, 4, 5)),
            RecipeUtil.intArray(java.util.List.of(21, 22, 23))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHER_WART, 1), false), new RecipeUtil.GltcInputSlot(4, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLAZE_POWDER, 1), false), new RecipeUtil.GltcInputSlot(5, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_B1", 4), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND, 1), null, RecipeUtil.deferredSlimefun("AL_A4", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.ENCHANTING_TABLE, 1), RecipeUtil.deferredSlimefun("AL_A4", 1), RecipeUtil.deferredSlimefun("TSnd", 1), RecipeUtil.deferredSlimefun("TSnd", 1), RecipeUtil.deferredSlimefun("TSnd", 1) });
        GltcMenuData.register("ATOsh1", GltcMenuData_ATOsh1.DATA);
        machine.applyMenu("ATOsh1", "&#ff5300A&#ff5b00T&#ff6300O &#5c9cf0颗粒升华器&7(I)");
        machine.register(addon);
    }
}
