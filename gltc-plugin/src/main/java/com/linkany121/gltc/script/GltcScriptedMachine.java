package com.linkany121.gltc.script;

import com.linkany121.gltc.logic.GltcLogicRegistry;
import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.MachineSlotContext;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.core.handlers.BlockBreakHandler;
import io.github.thebusybiscuit.slimefun4.core.handlers.BlockPlaceHandler;
import io.github.thebusybiscuit.slimefun4.core.handlers.BlockUseHandler;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

import javax.annotation.Nullable;

/**
 * Former RSC scripted machine shell. Dispatches to {@link GltcMachineLogic} when registered.
 */
public class GltcScriptedMachine extends GltcRecipeMachine {

    @Nullable
    private final String scriptId;
    private boolean handlersBound;

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
        return create(
            itemGroup, item, recipeType, recipe, recipeOutput,
            energyCapacity, energyPerCraft, inputSlots, outputSlots, null
        );
    }

    public static GltcScriptedMachine create(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int energyCapacity,
        int energyPerCraft,
        int[] inputSlots,
        int[] outputSlots,
        @Nullable String scriptId
    ) {
        MachineSlotContext.begin(inputSlots, outputSlots);
        try {
            return new GltcScriptedMachine(
                itemGroup, item, recipeType, recipe, recipeOutput,
                energyCapacity, energyPerCraft, inputSlots, outputSlots, scriptId
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
        this(itemGroup, item, recipeType, recipe, recipeOutput,
            energyCapacity, energyPerCraft, inputSlots, outputSlots, null);
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
        int[] outputSlots,
        @Nullable String scriptId
    ) {
        super(itemGroup, item, recipeType, recipe, recipeOutput, energyCapacity, energyPerCraft, inputSlots, outputSlots);
        this.scriptId = scriptId;
    }

    @Nullable
    public String getScriptId() {
        return scriptId;
    }

    @Override
    public void preRegister() {
        super.preRegister();
        bindHandlers();
    }

    private void bindHandlers() {
        if (handlersBound) {
            return;
        }
        handlersBound = true;

        addItemHandler((BlockUseHandler) e -> {
            GltcMachineLogic logic = GltcLogicRegistry.machine(getId());
            if (logic == null) {
                return;
            }
            if (logic.onUse(e, this)) {
                e.cancel();
            }
        });

        addItemHandler(new BlockPlaceHandler(false) {
            @Override
            public void onPlayerPlace(org.bukkit.event.block.BlockPlaceEvent e) {
                GltcMachineLogic logic = GltcLogicRegistry.machine(getId());
                if (logic != null) {
                    logic.onPlace(e);
                }
            }
        });

        addItemHandler(new BlockBreakHandler(false, false) {
            @Override
            public void onPlayerBreak(
                org.bukkit.event.block.BlockBreakEvent e,
                ItemStack item,
                java.util.List<ItemStack> drops
            ) {
                GltcMachineLogic logic = GltcLogicRegistry.machine(getId());
                if (logic != null) {
                    logic.onBreak(e, item, drops);
                }
            }
        });
    }

    @Override
    protected boolean canOpenMachine(Block b, Player p) {
        return GltcLogicRegistry.machine(getId()) == null;
    }
}
