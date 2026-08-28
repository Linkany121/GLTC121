package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FKR_星轨发射器;
import com.linkany121.gltc.generated.menus.GltcMenuData_FKR_星轨发射器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_FKR_星轨发射器 {
    private Machines_FKR_星轨发射器() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_G2,
            GltcItemBuilder.slimefunStack("FKR_星轨发射器", Items_FKR_星轨发射器.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FKR_星轨发射器", Items_FKR_星轨发射器.DATA),
            9000,
            900,
            RecipeUtil.intArray(java.util.List.of(0, 1, 2, 9, 10, 11, 18, 19, 20)),
            RecipeUtil.intArray(java.util.List.of(25))
        );
        machine.addGltcRecipe(60, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("TSwk4", 8), false), new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("TSgj4", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSxl4", 8), false), new RecipeUtil.GltcInputSlot(9, RecipeUtil.deferredSlimefun("TSgj5", 2), false), new RecipeUtil.GltcInputSlot(10, RecipeUtil.deferredSlimefun("TSxl5", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("FKR_星轨信标", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntfkr3", 1), RecipeUtil.deferredSlimefun("TSwk4", 1), RecipeUtil.deferredSlimefun("TSgj4", 1), RecipeUtil.deferredSlimefun("TSxl4", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BEACON, 1), null, null, null, null });
        GltcMenuData.register("FKR_星轨发射器", GltcMenuData_FKR_星轨发射器.DATA);
        machine.applyMenu("FKR_星轨发射器", "&#a30000F&#e00000K&#ff0000R&#ff0000T &#f87fbbR&#ed78c33&#e272cc.&#d76bd4J&#cd65dcE&#c25ee4F&#b758ed行&#ac51f5星&#a057f5级&#945ef4星&#8864f4轨&#7b6bf3遥&#6f71f3测&#6378f2站&#577ef2点");
        machine.register(addon);
    }
}
