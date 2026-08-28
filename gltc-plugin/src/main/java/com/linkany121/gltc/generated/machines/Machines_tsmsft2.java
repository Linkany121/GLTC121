package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tsmsft2;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSmsft2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tsmsft2 {
    private Machines_tsmsft2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tsmsft2", Items_tsmsft2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tsmsft2", Items_tsmsft2.DATA),
            800,
            40,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(60, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2yk", 48), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("AL_B1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2yy", 48), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TS2jjwz", 3), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts2", 1), RecipeUtil.deferredSlimefun("tsmsft1", 1), RecipeUtil.deferredSlimefun("TSwk3", 1), RecipeUtil.deferredSlimefun("TSgj3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), null, null, null, null });
        GltcMenuData.register("tsmsft2", GltcMenuData_TSmsft2.DATA);
        machine.applyMenu("tsmsft2", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#774cdc重型沸腾魔素热馏塔&7-&eII");
        machine.register(addon);
    }
}
