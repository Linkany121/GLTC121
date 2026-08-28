package com.linkany121.gltc.machine;

import com.linkany121.gltc.util.MachineSlotContext;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import me.mrCookieSlime.CSCoreLibPlugin.general.Inventory.ChestMenu.AdvancedMenuClickHandler;
import me.mrCookieSlime.CSCoreLibPlugin.general.Inventory.ClickAction;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenu;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenuPreset;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.ItemStack;

import java.util.List;

public class GltcWorkbench extends GltcRecipeMachine {

    private int craftClickSlot = 25;

    public static GltcWorkbench create(
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
            return new GltcWorkbench(
                itemGroup, item, recipeType, recipe, recipeOutput,
                energyCapacity, energyPerCraft, inputSlots, outputSlots
            );
        } finally {
            MachineSlotContext.end();
        }
    }

    public GltcWorkbench(
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

    public void setCraftClickSlot(int craftClickSlot) {
        this.craftClickSlot = craftClickSlot;
    }

    public void addInstantRecipe(
        List<RecipeUtil.GltcInputSlot> inputs,
        List<RecipeUtil.GltcOutputSlot> outputs,
        boolean noConsume
    ) {
        addGltcRecipe(0, inputs, outputs, noConsume);
    }

    @Override
    protected boolean shouldRegisterMachineRecipes() {
        return false;
    }

    @Override
    protected void tick(Block b) {
        // Workbenches craft manually via the click slot (RSC WorkbenchMachineTicker).
    }

    @Override
    protected void configureMenuPreset(BlockMenuPreset preset) {
        preset.addMenuClickHandler(craftClickSlot, new AdvancedMenuClickHandler() {
            @Override
            public boolean onClick(Player p, int slot, ItemStack cursor, ClickAction action) {
                return false;
            }

            @Override
            public boolean onClick(InventoryClickEvent e, Player p, int slot, ItemStack cursor, ClickAction action) {
                if (e.getInventory().getHolder() instanceof BlockMenu inv) {
                    craftOnce(inv);
                }
                return false;
            }
        });
    }

    /**
     * Match + canFit first, then charge, then consume + chance push.
     * (Improves on RSC's charge-before-match so failed clicks do not drain energy.)
     */
    private void craftOnce(BlockMenu inv) {
        Block block = inv.getLocation().getBlock();
        for (GltcMachineRecipe gltcRecipe : gltcRecipes) {
            gltcRecipe.resolve();
            if (!matchesGltcRecipe(inv, gltcRecipe)) {
                continue;
            }
            if (!canFitGltcOutputs(inv, gltcRecipe)) {
                return;
            }
            if (!takeCharge(block.getLocation())) {
                return;
            }
            consumeGltcInputs(inv, gltcRecipe);
            pushGltcOutputs(inv, gltcRecipe);
            return;
        }
    }
}
