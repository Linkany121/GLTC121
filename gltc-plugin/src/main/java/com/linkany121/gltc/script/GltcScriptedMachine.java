package com.linkany121.gltc.script;

import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.MachineSlotContext;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import org.bukkit.inventory.ItemStack;

public class GltcScriptedMachine extends GltcRecipeMachine {

    public static final String SCRIPT_ID = "SCRIPT_ID_PLACEHOLDER";

    public static GltcScriptedMachine create(
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
            return new GltcScriptedMachine(
                itemGroup, item, recipeType, recipe, recipeOutput,
                energyCapacity, energyPerCraft, inputSlots, outputSlots
            );
        } finally {
            MachineSlotContext.end();
        }
    }

    public GltcScriptedMachine(
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
}
