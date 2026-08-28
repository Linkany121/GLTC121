package com.linkany121.gltc.generated.simplemb;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATO_GT;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcSimpleMultiBlock;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;

public final class SimpleMb_ATO_GT {
    private SimpleMb_ATO_GT() {}
    public static void register(SlimefunAddon addon) {
        GltcSimpleMultiBlock machine = new GltcSimpleMultiBlock(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATO_GT", Items_ATO_GT.DATA),
            RecipeUtil.resolveCraftingRecipe(new Object[] { null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLESTONE_WALL, 1), null, null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_BLOCK, 1), null, null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DISPENSER, 1), null }),
            5
        );
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLESTONE, 2))), RecipeUtil.deferredSlimefun("AL_A1", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, RecipeUtil.deferredSlimefun("IRON_INGOT", 1))), RecipeUtil.deferredSlimefun("AL_A2", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CARROT, 1))), RecipeUtil.deferredSlimefun("AL_A3", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIORITE, 1))), RecipeUtil.deferredSlimefun("AL_A4", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.WHITE_WOOL, 1))), RecipeUtil.deferredSlimefun("AL_A5", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 1))), RecipeUtil.deferredSlimefun("AL_A6", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 16)), java.util.Map.entry(2, RecipeUtil.deferredSlimefun("IRON_INGOT", 16))), RecipeUtil.deferredSlimefun("BASIC_CIRCUIT_BOARD", 2));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND, 8))), new org.bukkit.inventory.ItemStack(org.bukkit.Material.COAL_BLOCK, 48));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, RecipeUtil.deferredSlimefun("AL_A6", 1)), java.util.Map.entry(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 1)), java.util.Map.entry(3, RecipeUtil.deferredSlimefun("AL_A6", 1))), RecipeUtil.deferredSlimefun("GLTC_能源调节器", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, RecipeUtil.deferredSlimefun("AL_A6", 1)), java.util.Map.entry(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1)), java.util.Map.entry(3, RecipeUtil.deferredSlimefun("AL_A6", 1))), RecipeUtil.deferredSlimefun("GLTC_能源调节器2", 1));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(2, RecipeUtil.deferredSlimefun("AL_A6", 1)), java.util.Map.entry(5, new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE, 1)), java.util.Map.entry(8, RecipeUtil.deferredSlimefun("AL_A6", 1))), RecipeUtil.deferredSlimefun("GLTC_能源连接器", 16));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(2, RecipeUtil.deferredSlimefun("AL_A6", 1)), java.util.Map.entry(5, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1)), java.util.Map.entry(8, RecipeUtil.deferredSlimefun("AL_A6", 1))), RecipeUtil.deferredSlimefun("GLTC_能源连接器2", 16));
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, RecipeUtil.deferredSlimefun("IRON_INGOT", 1)), java.util.Map.entry(2, RecipeUtil.deferredSlimefun("AL_A3", 1))), RecipeUtil.deferredSlimefun("GLTC_银行卡", 1));
        machine.register(addon);
    }
}
