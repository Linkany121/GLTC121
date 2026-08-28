package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_TShjl3;
import com.linkany121.gltc.generated.menus.GltcMenuData_TShjl3;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_TShjl3 {
    private Machines_TShjl3() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("TShjl3", Items_TShjl3.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("TShjl3", Items_TShjl3.DATA),
            1600,
            160,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15, 20, 21, 22, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSbd", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSld", 9), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSdbg", 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TSlx", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TShel", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 6), 50)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSnd", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSyd", 9), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSjld", 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TSas", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSmbh", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 6), 50)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSgd", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSdd", 9), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSpjd", 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TSzc", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSgls", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 6), 50)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSmbh", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TShel", 8), false), new RecipeUtil.GltcInputSlot(13, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SHORT_GRASS, 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSkajd", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 6), 50)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSgls", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSdjl", 12), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSskd", 12), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSxwhd", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 6), 50)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts3", 1), RecipeUtil.deferredSlimefun("TShjl2", 1), RecipeUtil.deferredSlimefun("TSgj5", 1), RecipeUtil.deferredSlimefun("TSxl5", 1), null, null, null, null, null });
        GltcMenuData.register("TShjl3", GltcMenuData_TShjl3.DATA);
        machine.applyMenu("TShjl3", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ffe042漩&#ffce40涡&#ffbc3e聚&#ffab3c变&#ff993a高&#ff8738压&#ff7536反&#ff6334应&#ff5232搅&#ff4030拌&#ff2e2e炉&7-&eIII");
        machine.register(addon);
    }
}
