package com.linkany121.gltc.guide;

import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.machine.GltcSimpleMultiBlock;
import com.linkany121.gltc.machine.GltcWorkbench;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.ItemStack;

import java.util.List;

public final class GltcRecipeGuideListener implements Listener {

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = false)
    public void onGuideClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        ItemStack clicked = event.getCurrentItem();
        if (clicked == null || !GltcRecipeGuideHelper.isTagged(clicked)) {
            return;
        }

        String machineId = GltcRecipeGuideHelper.machineId(clicked);
        SlimefunItem machine = machineId != null ? SlimefunItem.getById(machineId) : null;
        if (machine == null) {
            return;
        }

        int index = GltcRecipeGuideHelper.recipeIndex(clicked);
        if (index < 0) {
            return;
        }

        event.setCancelled(true);
        openRecipeDetail(player, machine, index);
    }

    private void openRecipeDetail(Player player, SlimefunItem machine, int index) {
        if (machine instanceof GltcRecipeMachine recipeMachine) {
            List<GltcRecipeMachine.GltcMachineRecipe> recipes = recipeMachine.getGltcRecipes();
            if (index >= recipes.size()) {
                return;
            }
            GltcRecipeMachine.GltcMachineRecipe recipe = recipes.get(index);
            GltcRecipeDetailMenu.open(
                player,
                recipeMachine,
                recipeMachine.getMenuMachineId() != null ? recipeMachine.getMenuMachineId() : machine.getId(),
                machine.getItem(),
                recipe,
                recipeMachine.getInputSlots(),
                recipeMachine.getOutputSlots(),
                recipeMachine instanceof GltcWorkbench ? -1 : findProgressSlot(recipeMachine),
                machine instanceof GltcWorkbench
            );
            return;
        }
        if (machine instanceof GltcSimpleMultiBlock simpleMb) {
            List<GltcSimpleMultiBlock.MbRecipe> recipes = simpleMb.getMbRecipes();
            if (index >= recipes.size()) {
                return;
            }
            GltcRecipeDetailMenu.openSimpleMb(player, simpleMb, recipes.get(index));
        }
    }

    private static int findProgressSlot(GltcRecipeMachine machine) {
        if (machine.getMenuMachineId() == null) {
            return 22;
        }
        return com.linkany121.gltc.util.GltcMenuHelper.findProgressBarSlot(machine.getMenuMachineId());
    }
}
