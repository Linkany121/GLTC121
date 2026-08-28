package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FKR_零件灌钮组装车床;
import com.linkany121.gltc.generated.menus.GltcMenuData_FKR_零件灌钮组装车床;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_FKR_零件灌钮组装车床 {
    private Machines_FKR_零件灌钮组装车床() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_G2,
            GltcItemBuilder.slimefunStack("FKR_零件灌钮组装车床", Items_FKR_零件灌钮组装车床.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FKR_零件灌钮组装车床", Items_FKR_零件灌钮组装车床.DATA),
            3200,
            320,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSwk2", 2), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSgj2", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_发射器装件", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgj3", 4), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TStgs", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_通古斯弹药集成匣", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TS2tj3", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSxl5", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_玻璃粘合装载器", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("占位符a1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("占位符a1", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("FKR_发射器装件", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("FKR_通古斯弹药集成匣", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_通古斯制式步枪", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("FKR_通古斯制式步枪", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("FKR_通古斯弹药集成匣", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_通古斯战壕霰弹", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("FKR_通古斯战壕霰弹", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("FKR_通古斯弹药集成匣", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_通古斯涡轮式单兵机枪", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("FKR_通古斯制式步枪", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("FKR_玻璃粘合装载器", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_通古斯防御型脉冲手铳", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("FKR_通古斯防御型脉冲手铳", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("FKR_星轨信标", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_通古斯过载式步枪", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("FKR_通古斯制式步枪", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("FKR_玻璃粘合装载器", 1), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("FKR_星轨信标", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("FKR_通古斯制式轨道信标投递器", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntfkr2", 1), RecipeUtil.deferredSlimefun("TSwk3", 1), RecipeUtil.deferredSlimefun("TSgj3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLACK_BED, 1), null, null, null, null });
        GltcMenuData.register("FKR_零件灌钮组装车床", GltcMenuData_FKR_零件灌钮组装车床.DATA);
        machine.applyMenu("FKR_零件灌钮组装车床", "&#a30000F&#e00000K&#ff0000R&#ff0000T &#ebbd77零&#ecb573件&#eead6e灌&#efa56a钮&#f09c66组&#f19462装&#f38c5d车&#f48459床");
        machine.register(addon);
    }
}
