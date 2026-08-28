package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATO_地热;
import com.linkany121.gltc.generated.menus.GltcMenuData_ATO_地热;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_ATO_地热 {
    private Machines_ATO_地热() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATO_地热", Items_ATO_地热.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("ATO_地热", Items_ATO_地热.DATA),
            50,
            5,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("GG板子", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("AL_A1", 1), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("AL_A2", 1), 50), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("AL_A4", 1), 50), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("TSyjt", 1), 100), new RecipeUtil.GltcOutputSlot(23, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLESTONE, 1), 100), new RecipeUtil.GltcOutputSlot(24, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COAL, 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("AL_A1", 1), RecipeUtil.deferredSlimefun("GG板子", 1), RecipeUtil.deferredSlimefun("AL_A1", 1), null, null, null, null, null, null });
        GltcMenuData.register("ATO_地热", GltcMenuData_ATO_地热.DATA);
        machine.applyMenu("ATO_地热", "&#ff5300A&#ff5b00T&#ff6300O &#ddcf6a地&#dbc672热&#dabe7a熔&#d8b583融&#d6ac8b转&#d5a493换&#d39b9b器");
        machine.register(addon);
    }
}
