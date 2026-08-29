package com.linkany121.gltc.machine;

import com.linkany121.gltc.util.MachineSlotContext;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.implementation.operations.CraftingOperation;
import io.github.thebusybiscuit.slimefun4.utils.SlimefunUtils;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenu;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;

import java.util.Arrays;

/**
 * RSC-style template machine:
 * - templateSlot must hold this machine's own item (not consumed)
 * - fasterIfMoreTemplates: each tick adds min(remaining, templateAmount) progress
 * - moreOutputIfMoreTemplates: multiply outputs by live template amount
 */
public class GltcTemplateMachine extends GltcRecipeMachine {

    private final int templateSlot;
    private final boolean fasterIfMoreTemplates;
    private final boolean moreOutputIfMoreTemplates;

    public static GltcTemplateMachine create(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int energyCapacity,
        int energyPerCraft,
        int[] inputSlots,
        int[] outputSlots,
        int templateSlot,
        boolean fasterIfMoreTemplates,
        boolean moreOutputIfMoreTemplates
    ) {
        MachineSlotContext.begin(inputSlots, outputSlots);
        try {
            return new GltcTemplateMachine(
                itemGroup, item, recipeType, recipe, recipeOutput,
                energyCapacity, energyPerCraft, inputSlots, outputSlots,
                templateSlot, fasterIfMoreTemplates, moreOutputIfMoreTemplates
            );
        } finally {
            MachineSlotContext.end();
        }
    }

    public GltcTemplateMachine(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int energyCapacity,
        int energyPerCraft,
        int[] inputSlots,
        int[] outputSlots,
        int templateSlot,
        boolean fasterIfMoreTemplates,
        boolean moreOutputIfMoreTemplates
    ) {
        super(itemGroup, item, recipeType, recipe, recipeOutput, energyCapacity, energyPerCraft, inputSlots, outputSlots);
        this.templateSlot = templateSlot;
        this.fasterIfMoreTemplates = fasterIfMoreTemplates;
        this.moreOutputIfMoreTemplates = moreOutputIfMoreTemplates;
    }

    public int getTemplateSlot() {
        return templateSlot;
    }

    public boolean isFasterIfMoreTemplates() {
        return fasterIfMoreTemplates;
    }

    public boolean isMoreOutputIfMoreTemplates() {
        return moreOutputIfMoreTemplates;
    }

    @Override
    protected int[] transportInsertSlots() {
        int[] inputs = getInputSlots();
        if (inputs == null || inputs.length == 0) {
            return inputs;
        }
        int[] filtered = Arrays.stream(inputs).filter(slot -> slot != templateSlot).toArray();
        return filtered.length > 0 ? filtered : inputs;
    }

    @Override
    protected boolean matchesGltcRecipe(BlockMenu inv, GltcMachineRecipe recipe) {
        if (!hasValidTemplate(inv)) {
            return false;
        }
        return super.matchesGltcRecipe(inv, recipe);
    }

    @Override
    protected boolean isOperationStillValid(BlockMenu inv, GltcMachineRecipe recipe) {
        return hasValidTemplate(inv);
    }

    @Override
    protected int progressStep(BlockMenu inv, GltcMachineRecipe recipe, CraftingOperation operation) {
        int base = Math.max(1, getSpeed());
        if (!fasterIfMoreTemplates) {
            return base;
        }
        ItemStack template = inv.getItemInSlot(templateSlot);
        if (template == null || template.getType() == Material.AIR) {
            return base;
        }
        return Math.max(1, base * template.getAmount());
    }

    @Override
    protected int templateAmount(BlockMenu inv) {
        // Used as output multiplier (and can-fit check). Speed uses progressStep separately.
        if (!moreOutputIfMoreTemplates) {
            return 1;
        }
        ItemStack template = inv.getItemInSlot(templateSlot);
        if (template == null || template.getType() == Material.AIR) {
            return 1;
        }
        return Math.max(1, template.getAmount());
    }

    private boolean hasValidTemplate(BlockMenu inv) {
        ItemStack template = inv.getItemInSlot(templateSlot);
        if (template == null || template.getType() == Material.AIR) {
            return false;
        }
        ItemStack self = getItem();
        if (self == null) {
            return false;
        }
        // Match by Slimefun ID first (reliable for custom heads / model data).
        SlimefunItem placed = SlimefunItem.getByItem(template);
        if (placed != null && placed.getId().equalsIgnoreCase(getId())) {
            return true;
        }
        return SlimefunUtils.isItemSimilar(template, self, false);
    }
}
