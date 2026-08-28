package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tsmsft1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSmsft1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tsmsft1 {
    private Machines_tsmsft1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tsmsft1", Items_tsmsft1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tsmsft1", Items_tsmsft1.DATA),
            400,
            20,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(60, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2yk", 32), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("AL_B1", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2yy", 32), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TS2jjwz", 3), 80)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.OBSIDIAN, 1), null, null, null, null, null });
        GltcMenuData.register("tsmsft1", GltcMenuData_TSmsft1.DATA);
        machine.applyMenu("tsmsft1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#774cdc沸腾魔素热馏塔&7-&eI");
        machine.register(addon);
    }
}
