package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATOsh2;
import com.linkany121.gltc.generated.menus.GltcMenuData_ATOsh2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_ATOsh2 {
    private Machines_ATOsh2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATOsh2", Items_ATOsh2.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("ATOsh2", Items_ATOsh2.DATA),
            18,
            9,
            RecipeUtil.intArray(java.util.List.of(3, 4, 5)),
            RecipeUtil.intArray(java.util.List.of(21, 22, 23))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHER_WART, 1), false), new RecipeUtil.GltcInputSlot(4, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLAZE_POWDER, 1), false), new RecipeUtil.GltcInputSlot(5, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_B1", 4), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { null, RecipeUtil.deferredSlimefun("TSthyy", 1), null, RecipeUtil.deferredSlimefun("TSbtl", 1), RecipeUtil.deferredSlimefun("ATOsh1", 1), RecipeUtil.deferredSlimefun("TSbtl", 1), RecipeUtil.deferredSlimefun("TSdbg", 1), RecipeUtil.deferredSlimefun("TSdbg", 1), RecipeUtil.deferredSlimefun("TSdbg", 1) });
        GltcMenuData.register("ATOsh2", GltcMenuData_ATOsh2.DATA);
        machine.applyMenu("ATOsh2", "&#ff5300A&#ff5b00T&#ff6300O &#5c9cf0颗粒升华器&7(II)");
        machine.register(addon);
    }
}
