package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_EAE_空气滤网风帆;
import com.linkany121.gltc.generated.menus.GltcMenuData_EAE_空气滤网风帆;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_EAE_空气滤网风帆 {
    private Machines_EAE_空气滤网风帆() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_F2,
            GltcItemBuilder.slimefunStack("EAE_空气滤网风帆", Items_EAE_空气滤网风帆.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("EAE_空气滤网风帆", Items_EAE_空气滤网风帆.DATA),
            320,
            32,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(60, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("EAE_合金滤芯", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("EAE_压缩微尘", 64), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("EAE_压缩腐尘", 64), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("EAE_压缩微尘", 64), 50), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("EAE_压缩腐尘", 64), 50), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("EAE_压缩微尘", 64), 20), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("EAE_压缩腐尘", 64), 20)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("nteae1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.WHITE_WOOL, 6), null, null, null, null });
        GltcMenuData.register("EAE_空气滤网风帆", GltcMenuData_EAE_空气滤网风帆.DATA);
        machine.applyMenu("EAE_空气滤网风帆", "&#eac92fE&#df7b21A&#d42d13E &#2efaffC&#30dff82&#32c3f1空&#34a8ea气&#368de4滤&#3872dd网&#3a56d6风&#3c3bcf帆&f-&eI");
        machine.register(addon);
    }
}
