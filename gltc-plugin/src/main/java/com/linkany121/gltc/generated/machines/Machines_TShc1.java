package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_TShc1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TShc1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_TShc1 {
    private Machines_TShc1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("TShc1", Items_TShc1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("TShc1", Items_TShc1.DATA),
            180,
            18,
            RecipeUtil.intArray(java.util.List.of(3, 4, 5, 12, 13, 14, 21, 22, 23)),
            RecipeUtil.intArray(java.util.List.of(39, 40, 41))
        );
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSnd", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSwk1", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSpjd", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSwk2", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TShel", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TS2pbgj", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSwk3", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSkajd", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TS2pbgj", 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSwk4", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSbd", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSgj1", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSlks", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TSdbg", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSgj2", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSgls", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TS2rglz", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSgj3", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSxwhd", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TS2sky", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSgj4", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSgd", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TStls", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSxl1", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSjld", 8), false), new RecipeUtil.GltcInputSlot(4, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSxl2", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSgwhs", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TS2gfzlm", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSxl3", 1), 100)), false);
        machine.addGltcRecipe(4, java.util.List.of(new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("TSmbh", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("TS2gfztl", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("TSxl4", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.ANVIL, 3), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CRAFTING_TABLE, 3), new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND_BLOCK, 3), null, null, null, null, null });
        GltcMenuData.register("TShc1", GltcMenuData_TShc1.DATA);
        machine.applyMenu("TShc1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#94edff微型蓝硅车床&7-&eI");
        machine.register(addon);
    }
}
