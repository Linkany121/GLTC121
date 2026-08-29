package com.linkany121.gltc.logic.prop;

import com.linkany121.gltc.logic.GltcItemLogic;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.entity.Warden;
import org.bukkit.inventory.ItemStack;

/**
 * {@code FKR_深渊召来} — consume one, spawn a 1-HP warden with sculk particles.
 */
public final class AbyssCallLogic implements GltcItemLogic {

    public static final String ITEM_ID = "FKR_深渊召来";

    /** 前缀与 scripts/道具工具/深渊召来.js 一致：FKR 武器/道具套系渐变 e017e8→4b95ff。 */
    private static final String SUCCESS_MSG =
        "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联"
            + "§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§x§f§f§f§5§b§3成功展开极度脆弱的低智能守卫雕像。";

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

        Location loc = player.getLocation();
        World world = player.getWorld();
        Warden warden = world.spawn(loc, Warden.class);
        warden.setHealth(1.0);

        world.spawnParticle(
            Particle.SCULK_SOUL,
            loc.getX(), loc.getY() + 1.0, loc.getZ(),
            10, 0.5, 0.5, 0.5, 0.1
        );

        player.sendMessage(SUCCESS_MSG);
        return true;
    }
}
