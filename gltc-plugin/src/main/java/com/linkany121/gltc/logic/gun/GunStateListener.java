package com.linkany121.gltc.logic.gun;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.ItemStack;

/** Clears gun cooldowns / firing tasks on slot change or quit. */
public final class GunStateListener implements Listener {

    private final GltcPlugin plugin;

    public GunStateListener(GltcPlugin plugin) {
        this.plugin = plugin;
    }

    public void register() {
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onHeld(PlayerItemHeldEvent event) {
        clearForStack(event.getPlayer(), event.getPlayer().getInventory().getItem(event.getPreviousSlot()));
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        clearForStack(event.getPlayer(), event.getPlayer().getInventory().getItemInMainHand());
    }

    private static void clearForStack(Player player, ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return;
        }
        IntegrationGunLogic.clearFromHand(player, stack);
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        if (sf == null) {
            return;
        }
        String id = sf.getId();
        if (!GunRegistry.isRegisteredGun(id)) {
            return;
        }
        GltcItemLogic logic = GltcLogicRegistry.item(id);
        if (logic instanceof AbstractGunLogic gun) {
            gun.clearGunState(player);
        }
    }
}
