package com.linkany121.gltc.generated.simplemb;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATO_GS;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcSimpleMultiBlock;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;

public final class SimpleMb_ATO_GS {
    private SimpleMb_ATO_GS() {}
    public static void register(SlimefunAddon addon) {
        GltcSimpleMultiBlock machine = new GltcSimpleMultiBlock(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATO_GS", Items_ATO_GS.DATA),
            RecipeUtil.resolveCraftingRecipe(new Object[] { null, null, null, null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CAULDRON, 1), null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.ENCHANTING_TABLE, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.DISPENSER, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLAST_FURNACE, 1) }),
            5
        );
        machine.addMbRecipe(java.util.Map.ofEntries(java.util.Map.entry(1, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHER_WART, 1)), java.util.Map.entry(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLAZE_POWDER, 1)), java.util.Map.entry(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1))), RecipeUtil.deferredSlimefun("AL_B1", 3));
        machine.register(addon);
    }
}
