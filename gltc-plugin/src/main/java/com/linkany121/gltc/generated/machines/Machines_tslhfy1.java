package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tslhfy1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSlhfy1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tslhfy1 {
    private Machines_tslhfy1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tslhfy1", Items_tslhfy1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tslhfy1", Items_tslhfy1.DATA),
            1600,
            80,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2rglz", 6), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TS2jjwz", 1), false), new RecipeUtil.GltcInputSlot(13, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GLASS_BOTTLE, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2sky", 1), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TS2gfzlm", 6), false), new RecipeUtil.GltcInputSlot(12, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GLOW_INK_SAC, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TS2gfztl", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.SOUL_LANTERN, 1), null, null, null, null, null });
        GltcMenuData.register("tslhfy1", GltcMenuData_TSlhfy1.DATA);
        machine.applyMenu("tslhfy1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#3acfb1灵焰粘合器&7-&eI");
        machine.register(addon);
    }
}
