package com.linkany121.gltc.multiblock;

import io.github.thebusybiscuit.slimefun4.api.events.SlimefunBlockPlaceEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import me.mrCookieSlime.Slimefun.api.BlockStorage;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenu;
import org.bukkit.Location;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.event.Event;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.inventory.InventoryOpenEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.world.ChunkUnloadEvent;
import org.bukkit.event.world.WorldUnloadEvent;
import org.bukkit.inventory.EquipmentSlot;

/**
 * SMB interact / place / break — menu and layer-switch flags follow RSC CustomSuperMultiBlockMachine.
 */
public final class GltcSuperMultiBlockListener implements Listener {

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onSlimefunPlace(SlimefunBlockPlaceEvent event) {
        SlimefunItem item = event.getSlimefunItem();
        Player player = event.getPlayer();
        if (GltcSuperMultiBlockData.get(item.getId()) != null) {
            GltcSuperMultiBlockManager.onCorePlaced(
                event.getBlockPlaced().getLocation(),
                item.getId(),
                com.linkany121.gltc.util.SmbRotationUtil.facingFromPlayer(player.getFacing())
            );
            return;
        }
        GltcSuperMultiBlockManager.refreshNearby(event.getBlockPlaced().getLocation(), player);
    }

    /**
     * Vanilla place fallback for cores that somehow skip SlimefunBlockPlaceEvent.
     * Skips when the placed block already has SF id (Slimefun place path already handled).
     */
    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlace(BlockPlaceEvent event) {
        Player player = event.getPlayer();
        String existingId = BlockStorage.checkID(event.getBlockPlaced().getLocation());
        if (existingId != null && GltcSuperMultiBlockData.get(existingId) != null) {
            // Already handled by onSlimefunPlace (or will be).
            GltcSuperMultiBlockManager.refreshNearby(event.getBlockPlaced().getLocation(), player);
            return;
        }
        SlimefunItem item = SlimefunItem.getByItem(event.getItemInHand());
        if (item != null && GltcSuperMultiBlockData.get(item.getId()) != null) {
            GltcSuperMultiBlockManager.onCorePlaced(
                event.getBlockPlaced().getLocation(),
                item.getId(),
                com.linkany121.gltc.util.SmbRotationUtil.facingFromPlayer(player.getFacing())
            );
            return;
        }
        GltcSuperMultiBlockManager.refreshNearby(event.getBlockPlaced().getLocation(), player);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBreak(BlockBreakEvent event) {
        Block block = event.getBlock();
        String id = BlockStorage.checkID(block.getLocation());
        if (id != null && GltcSuperMultiBlockData.get(id) != null) {
            GltcSuperMultiBlockManager.onCoreRemoved(block.getLocation());
        }
        GltcSuperMultiBlockManager.refreshNearby(block.getLocation(), event.getPlayer());
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onChunkUnload(ChunkUnloadEvent event) {
        GltcSuperMultiBlockManager.clearChunk(event.getChunk());
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onWorldUnload(WorldUnloadEvent event) {
        GltcSuperMultiBlockManager.clearWorld(event.getWorld());
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = false)
    public void onCoreInteract(PlayerInteractEvent event) {
        if (event.getHand() != EquipmentSlot.HAND) {
            return;
        }
        Block block = event.getClickedBlock();
        if (block == null) {
            return;
        }

        String id = BlockStorage.checkID(block.getLocation());
        if (id != null) {
            GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(id);
            if (definition != null) {
                handleCoreInteract(event, block, id, definition);
                return;
            }
        }

        // RSC: clicking structure parts can open the core menu when formed.
        if (event.getAction() != Action.RIGHT_CLICK_BLOCK) {
            return;
        }
        GltcSuperMultiBlockManager.CoreHit hit = GltcSuperMultiBlockManager.findCoreForPart(block.getLocation());
        if (hit == null) {
            return;
        }
        GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(hit.machineId());
        if (definition == null || !definition.openMenuWhenClickedParts()) {
            return;
        }
        GltcSuperMultiBlockManager.ensureCoreLoaded(hit.core(), hit.machineId());
        if (!GltcSuperMultiBlockManager.isFormed(hit.core(), hit.machineId())) {
            return;
        }
        BlockMenu menu = BlockStorage.getInventory(hit.core());
        if (menu != null && event.getPlayer() != null) {
            event.setCancelled(true);
            event.setUseInteractedBlock(Event.Result.DENY);
            event.setUseItemInHand(Event.Result.DENY);
            menu.open(event.getPlayer());
        }
    }

    private static void handleCoreInteract(
        PlayerInteractEvent event,
        Block block,
        String id,
        GltcSuperMultiBlockData.Definition definition
    ) {
        GltcSuperMultiBlockManager.ensureCoreLoaded(block.getLocation(), id);
        boolean formed = GltcSuperMultiBlockManager.isFormed(block.getLocation(), id);

        // Layer switch: RSC uses right-click when noMenuWhenNotFormed, else left-click.
        boolean layerClick = definition.noMenuWhenNotFormed()
            ? event.getAction() == Action.RIGHT_CLICK_BLOCK
            : event.getAction() == Action.LEFT_CLICK_BLOCK;

        if (!formed && layerClick && definition.allowSwitchDisplayLayer()) {
            Player player = event.getPlayer();
            GltcSuperMultiBlockManager.switchDisplayLayer(player, block.getLocation(), id);
            event.setCancelled(true);
            event.setUseInteractedBlock(Event.Result.DENY);
            event.setUseItemInHand(Event.Result.DENY);
        }
    }

    @EventHandler(priority = EventPriority.LOWEST, ignoreCancelled = true)
    public void onInventoryOpen(InventoryOpenEvent event) {
        if (!(event.getPlayer() instanceof Player player)) {
            return;
        }
        if (!(event.getInventory().getHolder() instanceof BlockMenu menu)) {
            return;
        }
        Location location = menu.getLocation();
        if (location == null) {
            return;
        }
        String id = BlockStorage.checkID(location);
        if (id == null) {
            return;
        }
        GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(id);
        if (definition == null) {
            return;
        }
        GltcSuperMultiBlockManager.ensureCoreLoaded(location, id);
        if (!definition.noMenuWhenNotFormed()) {
            return;
        }
        if (GltcSuperMultiBlockManager.isFormed(location, id)) {
            return;
        }
        event.setCancelled(true);
        player.closeInventory();
    }
}
