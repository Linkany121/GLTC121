package com.linkany121.gltc.logic.gun;

import com.linkany121.gltc.logic.GltcItemLogic;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

/** Base for Tunguska guns — cancel use, clear state on swap/quit. */
public abstract class AbstractGunLogic implements GltcItemLogic {

    public abstract void clearGunState(Player player);

    protected abstract void fire(Player player, ItemStack hand);

    @Override
    public final boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return true;
        }
        fire(player, hand);
        return true;
    }
}
