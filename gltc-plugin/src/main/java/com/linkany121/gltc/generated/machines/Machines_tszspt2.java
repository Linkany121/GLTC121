package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tszspt2;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSzspt2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tszspt2 {
    private Machines_tszspt2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tszspt2", Items_tszspt2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tszspt2", Items_tszspt2.DATA),
            1500,
            150,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(600, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2tj2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TS2yk", 64), 70)), false);
        machine.addGltcRecipe(600, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2tj3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2yk", 64), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TS2yk", 64), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(40, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(41, RecipeUtil.deferredSlimefun("TS2yk", 64), 80)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts2", 1), RecipeUtil.deferredSlimefun("tszspt1", 1), RecipeUtil.deferredSlimefun("TSgj3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), null, null, null, null, null });
        GltcMenuData.register("tszspt2", GltcMenuData_TSzspt2.DATA);
        machine.applyMenu("tszspt2", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#aa559e深渊棱镜平台&7-&eII");
        machine.register(addon);
    }
}
