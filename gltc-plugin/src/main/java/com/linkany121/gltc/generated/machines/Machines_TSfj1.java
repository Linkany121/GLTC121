package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_TSfj1;
import com.linkany121.gltc.generated.menus.GltcMenuData_TSfj1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_TSfj1 {
    private Machines_TSfj1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_D2,
            GltcItemBuilder.slimefunStack("TSfj1", Items_TSfj1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("TSfj1", Items_TSfj1.DATA),
            600,
            60,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7)),
            RecipeUtil.intArray(java.util.List.of(27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("TSzmkw", 1), false), new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND, 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(27, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 3), 30), new RecipeUtil.GltcOutputSlot(28, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(29, new org.bukkit.inventory.ItemStack(org.bukkit.Material.LAPIS_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(30, new org.bukkit.inventory.ItemStack(org.bukkit.Material.EMERALD_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(31, new org.bukkit.inventory.ItemStack(org.bukkit.Material.STRING, 3), 40), new RecipeUtil.GltcOutputSlot(32, new org.bukkit.inventory.ItemStack(org.bukkit.Material.ICE, 3), 40), new RecipeUtil.GltcOutputSlot(33, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SAND, 3), 40), new RecipeUtil.GltcOutputSlot(34, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GRAVEL, 3), 40), new RecipeUtil.GltcOutputSlot(35, new org.bukkit.inventory.ItemStack(org.bukkit.Material.ANDESITE, 3), 40), new RecipeUtil.GltcOutputSlot(36, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIORITE, 3), 40), new RecipeUtil.GltcOutputSlot(37, new org.bukkit.inventory.ItemStack(org.bukkit.Material.OBSIDIAN, 3), 45), new RecipeUtil.GltcOutputSlot(38, new org.bukkit.inventory.ItemStack(org.bukkit.Material.END_STONE, 3), 45), new RecipeUtil.GltcOutputSlot(39, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GLOWSTONE, 3), 45), new RecipeUtil.GltcOutputSlot(40, new org.bukkit.inventory.ItemStack(org.bukkit.Material.TUFF, 3), 45), new RecipeUtil.GltcOutputSlot(41, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CALCITE, 3), 45)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("TSzmkw", 1), false), new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_INGOT, 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(27, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COAL_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(28, new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(29, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COPPER_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(30, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GOLD_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(31, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(32, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHER_QUARTZ_ORE, 3), 30), new RecipeUtil.GltcOutputSlot(33, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GRANITE, 3), 40), new RecipeUtil.GltcOutputSlot(34, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIRT, 3), 40), new RecipeUtil.GltcOutputSlot(35, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CLAY, 3), 40), new RecipeUtil.GltcOutputSlot(36, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BONE_MEAL, 3), 40), new RecipeUtil.GltcOutputSlot(37, new org.bukkit.inventory.ItemStack(org.bukkit.Material.FLINT, 3), 40), new RecipeUtil.GltcOutputSlot(38, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CRYING_OBSIDIAN, 3), 45), new RecipeUtil.GltcOutputSlot(39, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHERRACK, 3), 45), new RecipeUtil.GltcOutputSlot(40, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SOUL_SAND, 3), 45), new RecipeUtil.GltcOutputSlot(41, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLACKSTONE, 3), 45), new RecipeUtil.GltcOutputSlot(42, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BASALT, 3), 45)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("TSzmkw", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("SILVER_DUST", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(27, RecipeUtil.deferredSlimefun("GOLD_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("SILVER_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("COPPER_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("IRON_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("TIN_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("ALUMINUM_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("ZINC_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(34, RecipeUtil.deferredSlimefun("LEAD_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("MAGNESIUM_DUST", 3), 30), new RecipeUtil.GltcOutputSlot(36, RecipeUtil.deferredSlimefun("STONE_CHUNK", 3), 40), new RecipeUtil.GltcOutputSlot(37, RecipeUtil.deferredSlimefun("SALT", 3), 40), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("TINY_URANIUM", 3), 15), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("SULFATE", 3), 40)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntts1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.NOTE_BLOCK, 1), null, null, null, null });
        GltcMenuData.register("TSfj1", GltcMenuData_TSfj1.DATA);
        machine.applyMenu("TSfj1", "&#d5ff7aC&#8bff9e/&#57e6caT&#38b3ffS &#fffa66盛式分解柜&7-&eI");
        machine.register(addon);
    }
}
