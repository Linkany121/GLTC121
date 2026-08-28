package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_TShjl1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TShjl1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_TShjl1 {
    private Machines_TShjl1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("TShjl1", Items_TShjl1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("TShjl1", Items_TShjl1.DATA),
            120,
            18,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15, 20, 21, 22, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSbd", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSld", 9), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSdbg", 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TSlx", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TShel", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 1), 25)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSnd", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSyd", 9), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSjld", 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TSas", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSmbh", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 1), 25)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSgd", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSdd", 9), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSpjd", 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TSzc", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSgls", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 1), 25)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSmbh", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TShel", 8), false), new RecipeUtil.GltcInputSlot(13, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SHORT_GRASS, 8), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSkajd", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 1), 25)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSgls", 8), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSdjl", 12), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("TSskd", 12), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("TS2jbyg", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TSxwhd", 1), 100), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSzzrz", 1), 25)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts2", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHERITE_SCRAP, 1), null, null, null, null });
        GltcMenuData.register("TShjl1", GltcMenuData_TShjl1.DATA);
        machine.applyMenu("TShjl1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#ffb042旋&#f28e3c室&#e66c35聚&#d94a2f温&#cc2828加&#c02424压&#b42020搅&#a71b1b拌&#9b1717炉&7-&eI");
        machine.register(addon);
    }
}
