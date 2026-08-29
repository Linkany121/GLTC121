package com.linkany121.gltc.logic.prop;

import com.linkany121.gltc.logic.GltcItemLogic;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.Vector;

/**
 * {@code FKR_炽古花盆} — place a 3×5 torchflower patch ahead of the player.
 */
public final class ChiGuFlowerPotLogic implements GltcItemLogic {

    public static final String ITEM_ID = "FKR_炽古花盆";

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return true;
        }
        SlimefunItem sf = SlimefunItem.getByItem(hand);
        if (sf == null || !ITEM_ID.equals(sf.getId())) {
            return true;
        }

        Location loc = player.getLocation();
        Vector dir = loc.getDirection();
        double x = dir.getX();
        double z = dir.getZ();
        double len = Math.sqrt(x * x + z * z);
        if (len < 0.001) {
            return true;
        }
        x /= len;
        z /= len;

        double leftX = -z;
        double leftZ = x;

        World world = player.getWorld();
        int baseY = loc.getBlockY() + 1;
        int centerX = loc.getBlockX() + (int) Math.round(x);
        int centerZ = loc.getBlockZ() + (int) Math.round(z);

        for (int i = -1; i <= 1; i++) {
            for (int j = -2; j <= 2; j++) {
                int bx = centerX + (int) Math.round(x * i) + (int) Math.round(leftX * j);
                int bz = centerZ + (int) Math.round(z * i) + (int) Math.round(leftZ * j);
                Block block = world.getBlockAt(bx, baseY, bz);
                if (!block.isEmpty() && block.getType() != Material.TORCHFLOWER) {
                    return true;
                }
            }
        }

        for (int i = -1; i <= 1; i++) {
            for (int j = -2; j <= 2; j++) {
                int bx = centerX + (int) Math.round(x * i) + (int) Math.round(leftX * j);
                int bz = centerZ + (int) Math.round(z * i) + (int) Math.round(leftZ * j);
                world.getBlockAt(bx, baseY, bz).setType(Material.TORCHFLOWER);
            }
        }
        return true;
    }
}
