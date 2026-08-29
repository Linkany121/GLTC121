package com.linkany121.gltc.logic;

import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.entity.Player;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.inventory.ItemStack;

import java.util.List;

/**
 * Java behavior for a former RSC scripted item.
 * Register via {@link GltcLogicRegistry#registerItem(String, GltcItemLogic)}.
 */
public interface GltcItemLogic {

    /**
     * @return {@code true} to cancel the PlayerRightClickEvent (when supported)
     */
    default boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        return false;
    }

    default void onWeaponHit(EntityDamageByEntityEvent event, Player player, ItemStack item) {
    }

    default void onToolUse(BlockBreakEvent event, ItemStack item, int fortune, List<ItemStack> drops) {
    }

    default void onPlace(BlockPlaceEvent event) {
    }

    default void onBreak(BlockBreakEvent event, ItemStack item, List<ItemStack> drops) {
    }
}
