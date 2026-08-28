package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tszspt1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSzspt1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tszspt1 {
    private Machines_tszspt1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tszspt1", Items_tszspt1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tszspt1", Items_tszspt1.DATA),
            500,
            50,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(300, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2tj1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2yk", 64), 90), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TS2yk", 64), 60), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TS2yk", 64), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TS2yk", 64), 60)), false);
        machine.addGltcRecipe(300, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2tj2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2yk", 64), 90), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TS2yk", 64), 60), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TS2yk", 64), 60), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TS2yk", 64), 60), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TS2yk", 64), 60)), false);
        machine.addGltcRecipe(300, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2tj3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2yk", 64), 95), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TS2yk", 64), 80), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TS2yk", 64), 70), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TS2yk", 64), 70)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.SEA_LANTERN, 1), null, null, null, null, null });
        GltcMenuData.register("tszspt1", GltcMenuData_TSzspt1.DATA);
        machine.applyMenu("tszspt1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#aa559e深渊棱镜平台&7-&eI");
        machine.register(addon);
    }
}
