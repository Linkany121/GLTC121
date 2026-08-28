package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_OST_弱辐益智科学套件;
import com.linkany121.gltc.generated.menus.GltcMenuData_OST_弱辐益智科学套件;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_OST_弱辐益智科学套件 {
    private Machines_OST_弱辐益智科学套件() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_B2,
            GltcItemBuilder.slimefunStack("OST_弱辐益智科学套件", Items_OST_弱辐益智科学套件.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("OST_弱辐益智科学套件", Items_OST_弱辐益智科学套件.DATA),
            640,
            64,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 3), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("OST_高级逻素2", 3), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("OST_高级逻素3", 3), false), new RecipeUtil.GltcInputSlot(5, RecipeUtil.deferredSlimefun("OST_魔力逻素", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("URANIUM", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("BOOSTED_URANIUM", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("NEPTUNIUM", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("PLUTONIUM", 16), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("BLISTERING_INGOT", 16), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("BLISTERING_INGOT_2", 16), 100), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("BLISTERING_INGOT_3", 16), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntost1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.LIME_WOOL, 1), null, null, null, null });
        GltcMenuData.register("OST_弱辐益智科学套件", GltcMenuData_OST_弱辐益智科学套件.DATA);
        machine.applyMenu("OST_弱辐益智科学套件", "&#10eb15O&#19c917S&#22a719T &#a8d2b0弱&#96c99d辐&#84c08a益&#72b777智&#61ad64科&#4fa451学&#3d9b3e套&#2b922b件");
        machine.register(addon);
    }
}
