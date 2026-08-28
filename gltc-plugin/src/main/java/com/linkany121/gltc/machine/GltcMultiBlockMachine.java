package com.linkany121.gltc.machine;

import com.linkany121.gltc.multiblock.GltcSuperMultiBlockManager;
import com.linkany121.gltc.util.MachineSlotContext;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

import javax.annotation.Nonnull;

public class GltcMultiBlockMachine extends GltcRecipeMachine {

    public static GltcMultiBlockMachine create(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int energyCapacity,
        int energyPerCraft,
        int[] inputSlots,
        int[] outputSlots
    ) {
        MachineSlotContext.begin(inputSlots, outputSlots);
        try {
            return new GltcMultiBlockMachine(
                itemGroup, item, recipeType, recipe, recipeOutput,
                energyCapacity, energyPerCraft, inputSlots, outputSlots
            );
        } finally {
            MachineSlotContext.end();
        }
    }

    public GltcMultiBlockMachine(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int energyCapacity,
        int energyPerCraft,
        int[] inputSlots,
        int[] outputSlots
    ) {
        super(itemGroup, item, recipeType, recipe, recipeOutput, energyCapacity, energyPerCraft, inputSlots, outputSlots);
    }

    @Override
    protected boolean canProcess(Block b) {
        // RSC canTick: honors checkFormed + restores facing from BlockStorage after restart.
        return GltcSuperMultiBlockManager.canTick(b.getLocation(), getId());
    }

    @Override
    protected boolean canOpenMachine(@Nonnull Block b, @Nonnull Player p) {
        GltcSuperMultiBlockManager.ensureCoreLoaded(b.getLocation(), getId());
        var definition = com.linkany121.gltc.multiblock.GltcSuperMultiBlockData.get(getId());
        if (definition != null && !definition.noMenuWhenNotFormed()) {
            return true;
        }
        return GltcSuperMultiBlockManager.isFormed(b.getLocation(), getId());
    }
}
