package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_OST_回收器;
import com.linkany121.gltc.generated.menus.GltcMenuData_OST_回收器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_OST_回收器 {
    private Machines_OST_回收器() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_B2,
            GltcItemBuilder.slimefunStack("OST_回收器", Items_OST_回收器.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("OST_回收器", Items_OST_回收器.DATA),
            90,
            9,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("AL_A2", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("OST_基础逻素", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("AL_A1", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("OST_基础逻素2", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("AL_A3", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("OST_基础逻素3", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSbd", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("OST_高级逻素", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSnd", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("OST_高级逻素2", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgd", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("OST_高级逻素3", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("AL_B1", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("OST_魔力逻素", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntost1", 1), RecipeUtil.deferredSlimefun("TSwk1", 1), RecipeUtil.deferredSlimefun("TSgj1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIRT, 1), null, null, null, null });
        GltcMenuData.register("OST_回收器", GltcMenuData_OST_回收器.DATA);
        machine.applyMenu("OST_回收器", "&#10eb15O&#19c917S&#22a719T &#00ffa7超&#0dffb5级&#19ffc2无&#26ffd0敌&#32ffdd霹&#3fffeb雳&#4cfff8炫&#5ffdf0酷&#7afad2雷&#95f6b4霆&#aff397究&#caef79极&#e4ec5b奥&#ffe83d义&#ffdc39阿&#ffd035米&#ffc431洛&#ffb82c索&#ffac28一&#ffa024把&#ff9225十&#ff822b手&#ff7131粘&#ff6137液&#ff513d回&#ff4043收&#ff3049器");
        machine.register(addon);
    }
}
