package com.linkany121.gltc.logic;

import com.linkany121.gltc.machine.GltcRecipeMachine;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Location;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.inventory.ItemStack;

import java.util.List;

/**
 * Java behavior for a former RSC scripted machine.
 * Register via {@link GltcLogicRegistry#registerMachine(String, GltcMachineLogic)}.
 */
public interface GltcMachineLogic {

    /**
     * Item use or block right-click.
     * @return {@code true} to cancel the event when supported
     */
    default boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        return false;
    }

    /**
     * @return {@code true} if this tick was fully handled (skip default recipe tick)
     */
    default boolean onTick(Location location, GltcRecipeMachine machine) {
        return false;
    }

    default void onPlace(BlockPlaceEvent event) {
    }

    default void onBreak(BlockBreakEvent event, ItemStack item, List<ItemStack> drops) {
    }
}
