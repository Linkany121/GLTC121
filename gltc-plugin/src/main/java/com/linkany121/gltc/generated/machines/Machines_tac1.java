package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tac1;
import com.linkany121.gltc.generated.menus.GltcMenuData_tac1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tac1 {
    private Machines_tac1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_C2,
            GltcItemBuilder.slimefunStack("tac1", Items_tac1.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tac1", Items_tac1.DATA),
            3,
            3,
            RecipeUtil.intArray(java.util.List.of(3, 4, 5)),
            RecipeUtil.intArray(java.util.List.of(21, 22, 23))
        );
        machine.addGltcRecipe(50, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("AL_A4", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("al_xt1", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { null, RecipeUtil.deferredSlimefun("AL_A2", 1), null, RecipeUtil.deferredSlimefun("AL_A6", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_BLOCK, 1), RecipeUtil.deferredSlimefun("AL_A6", 1), null, RecipeUtil.deferredSlimefun("AL_B1", 1), null });
        GltcMenuData.register("tac1", GltcMenuData_tac1.DATA);
        machine.applyMenu("tac1", "&dTAC &e星图定位器 &7(临时)");
        machine.register(addon);
    }
}
