package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_tstyj1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TStyj1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_tstyj1 {
    private Machines_tstyj1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("tstyj1", Items_tstyj1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("tstyj1", Items_tstyj1.DATA),
            250,
            25,
            RecipeUtil.intArray(java.util.List.of(11, 12, 13, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(29, 30, 31, 32, 33, 38, 39, 40, 41, 42))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(11, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND_SHOVEL, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSyjt", 1), 16), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("BUCKET_OF_OIL", 1), 16), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSas", 1), 16)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(11, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND_HOE, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), 16), new RecipeUtil.GltcOutputSlot(30, new org.bukkit.inventory.ItemStack(org.bukkit.Material.ENDER_EYE, 1), 16), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSlx", 1), 16)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(11, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND_SWORD, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLAZE_POWDER, 1), 16), new RecipeUtil.GltcOutputSlot(30, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHER_WART, 1), 16), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSzc", 1), 16)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("FKR_炽热星涡砍刀", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("TSas", 1), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("TSlx", 1), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TSzc", 1), 100)), true);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk1", 1), RecipeUtil.deferredSlimefun("TSgj1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.GLASS, 1), null, null, null, null });
        GltcMenuData.register("tstyj1", GltcMenuData_TStyj1.DATA);
        machine.applyMenu("tstyj1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#a8ffaa光锥帷幕解压井&7-&eI");
        machine.register(addon);
    }
}
