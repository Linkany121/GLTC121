package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_YSJ_咆哮盒;
import com.linkany121.gltc.generated.menus.GltcMenuData_YSJ_咆哮盒;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcTemplateMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_YSJ_咆哮盒 {
    private Machines_YSJ_咆哮盒() {}
    public static void register(SlimefunAddon addon) {
        GltcTemplateMachine machine = GltcTemplateMachine.create(
            GltcItemGroups.Z_PX,
            GltcItemBuilder.slimefunStack("YSJ_咆哮盒", Items_YSJ_咆哮盒.DATA),
            RecipeUtil.resolveRecipeType("PF_PX"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("YSJ_咆哮盒", Items_YSJ_咆哮盒.DATA),
            5120,
            512,
            RecipeUtil.intArray(java.util.List.of(0, 1)),
            RecipeUtil.intArray(java.util.List.of(3, 4, 5, 6, 7, 8, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52)),
            1,
            true,
            true
        );
        machine.addGltcRecipe(30, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("AL_A2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(3, RecipeUtil.deferredSlimefun("LSyq10", 3), 100), new RecipeUtil.GltcOutputSlot(4, RecipeUtil.deferredSlimefun("TS2tj3", 3), 100), new RecipeUtil.GltcOutputSlot(5, RecipeUtil.deferredSlimefun("TSzzrz", 3), 100), new RecipeUtil.GltcOutputSlot(6, RecipeUtil.deferredSlimefun("AL_B1", 3), 100), new RecipeUtil.GltcOutputSlot(7, RecipeUtil.deferredSlimefun("TSyjt", 3), 100), new RecipeUtil.GltcOutputSlot(8, RecipeUtil.deferredSlimefun("TSjst", 3), 100), new RecipeUtil.GltcOutputSlot(12, RecipeUtil.deferredSlimefun("AL_A6", 3), 100), new RecipeUtil.GltcOutputSlot(13, RecipeUtil.deferredSlimefun("AL_A4", 3), 100), new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("AL_A5", 3), 100), new RecipeUtil.GltcOutputSlot(15, RecipeUtil.deferredSlimefun("AL_A3", 3), 100), new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("AL_A2", 3), 100), new RecipeUtil.GltcOutputSlot(17, RecipeUtil.deferredSlimefun("AL_A1", 3), 100)), true);
        machine.addGltcRecipe(30, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("AL_A1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(3, RecipeUtil.deferredSlimefun("AL_A1", 16), 100)), true);
        machine.addGltcRecipe(30, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("AL_B1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(3, RecipeUtil.deferredSlimefun("AL_B1", 16), 100)), true);
        machine.addGltcRecipe(30, java.util.List.of(new RecipeUtil.GltcInputSlot(0, RecipeUtil.deferredSlimefun("咆哮外壳", 64), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(3, RecipeUtil.deferredSlimefun("TACdw2", 1), 100), new RecipeUtil.GltcOutputSlot(4, RecipeUtil.deferredSlimefun("TAChx2", 1), 100), new RecipeUtil.GltcOutputSlot(5, RecipeUtil.deferredSlimefun("TACbz2", 1), 100), new RecipeUtil.GltcOutputSlot(6, RecipeUtil.deferredSlimefun("tscyzj3", 1), 100), new RecipeUtil.GltcOutputSlot(7, RecipeUtil.deferredSlimefun("tsgxdy3", 1), 100), new RecipeUtil.GltcOutputSlot(8, RecipeUtil.deferredSlimefun("tsylg3", 1), 100), new RecipeUtil.GltcOutputSlot(12, RecipeUtil.deferredSlimefun("tstyj1", 1), 100), new RecipeUtil.GltcOutputSlot(13, RecipeUtil.deferredSlimefun("tszspt2", 1), 100), new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("tsmsft3", 1), 100), new RecipeUtil.GltcOutputSlot(15, RecipeUtil.deferredSlimefun("tssyyl2", 1), 100), new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("tslhfy1", 1), 100), new RecipeUtil.GltcOutputSlot(17, RecipeUtil.deferredSlimefun("TShjl3", 1), 100), new RecipeUtil.GltcOutputSlot(18, RecipeUtil.deferredSlimefun("TSmlq2", 1), 100), new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TShc2", 1), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("LIScssp1", 1), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("LISls4", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("咆哮外壳", 1), RecipeUtil.deferredSlimefun("ntts3", 1), RecipeUtil.deferredSlimefun("ntls3", 1), null, null, null, null, null, null });
        GltcMenuData.register("YSJ_咆哮盒", GltcMenuData_YSJ_咆哮盒.DATA);
        machine.applyMenu("YSJ_咆哮盒", "&#2effb6A&#3ee2beC&#4dc4c5I&#5da7cdL&#6d89d5 &#7c6cdc御&#8c4fe4三&#9a3ed9家&#a73bbcG&#b4379f#&#c13481 &#cd3064咆&#da2d46哮&#e72929盒");
        machine.register(addon);
    }
}
