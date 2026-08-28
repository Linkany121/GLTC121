package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATO_捕网;
import com.linkany121.gltc.generated.menus.GltcMenuData_ATO_捕网;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_ATO_捕网 {
    private Machines_ATO_捕网() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATO_捕网", Items_ATO_捕网.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("ATO_捕网", Items_ATO_捕网.DATA),
            50,
            5,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("GG板子", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_B1", 1), 100), new RecipeUtil.GltcOutputSlot(20, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHER_WART, 1), 50), new RecipeUtil.GltcOutputSlot(21, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLAZE_POWDER, 1), 50), new RecipeUtil.GltcOutputSlot(22, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), 50)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("AL_A2", 1), RecipeUtil.deferredSlimefun("GG板子", 1), RecipeUtil.deferredSlimefun("AL_A2", 1), null, null, null, null, null, null });
        GltcMenuData.register("ATO_捕网", GltcMenuData_ATO_捕网.DATA);
        machine.applyMenu("ATO_捕网", "&#ff5300A&#ff5b00T&#ff6300O &#be9bd3临&#bc96cf时&#b990cb涵&#b78bc8粒&#b485c4子&#b280c0群&#b07bbd捕&#ad75b9捉&#ab70b5网");
        machine.register(addon);
    }
}
