package com.linkany121.gltc.listener;

import com.linkany121.gltc.machine.GltcRecipeMachine;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import me.mrCookieSlime.Slimefun.api.BlockStorage;
import org.bukkit.block.Block;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockExplodeEvent;
import org.bukkit.event.entity.EntityExplodeEvent;
import org.bukkit.event.world.ChunkUnloadEvent;

/** Clears in-memory craft state when a GLTC recipe machine is broken / exploded / unloaded. */
public final class GltcMachineBreakListener implements Listener {

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBreak(BlockBreakEvent event) {
        clearIfMachine(event.getBlock());
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onBlockExplode(BlockExplodeEvent event) {
        for (Block block : event.blockList()) {
            clearIfMachine(block);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onEntityExplode(EntityExplodeEvent event) {
        for (Block block : event.blockList()) {
            clearIfMachine(block);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onChunkUnload(ChunkUnloadEvent event) {
        GltcRecipeMachine.clearAllInChunk(event.getChunk());
    }

    private static void clearIfMachine(Block block) {
        String id = BlockStorage.checkID(block.getLocation());
        if (id == null) {
            return;
        }
        if (SlimefunItem.getById(id) instanceof GltcRecipeMachine machine) {
            machine.clearActiveRecipe(block);
        }
    }
}
