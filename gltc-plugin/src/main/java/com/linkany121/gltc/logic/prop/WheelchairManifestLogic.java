package com.linkany121.gltc.logic.prop;

import com.linkany121.gltc.logic.GltcItemLogic;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextColor;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

/**
 * {@code OST_轮椅宣言} — consume one, broadcast wheelchair message, strike 5 lightning bolts.
 */
public final class WheelchairManifestLogic implements GltcItemLogic {

    public static final String ITEM_ID = "OST_轮椅宣言";

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR || hand.getAmount() <= 0) {
            return true;
        }
        SlimefunItem sf = SlimefunItem.getByItem(hand);
        if (sf == null || !ITEM_ID.equals(sf.getId())) {
            return true;
        }

        hand.setAmount(hand.getAmount() - 1);

        Component broadcast = Component.text("[", NamedTextColor.WHITE)
            .append(Component.text("G", TextColor.color(0xff00ef)))
            .append(Component.text("L", TextColor.color(0xdb17f1)))
            .append(Component.text("T", TextColor.color(0xb62ef4)))
            .append(Component.text("C", TextColor.color(0x9245f6)))
            .append(Component.text("联", TextColor.color(0x6d5df8)))
            .append(Component.text("合", TextColor.color(0x4974fa)))
            .append(Component.text("协", TextColor.color(0x248bfd)))
            .append(Component.text("议", TextColor.color(0x00a2ff)))
            .append(Component.text("] ", NamedTextColor.WHITE))
            .append(Component.text(player.getName(), NamedTextColor.YELLOW))
            .append(Component.text(" 正在启用轮椅之力！", NamedTextColor.WHITE));
        Bukkit.getServer().sendMessage(broadcast);

        player.sendMessage("§e§l天雷降临！轮椅之力已激活！");

        World world = player.getWorld();
        Location loc = player.getLocation();
        for (int i = 0; i < 5; i++) {
            world.strikeLightning(loc);
        }
        return true;
    }
}
