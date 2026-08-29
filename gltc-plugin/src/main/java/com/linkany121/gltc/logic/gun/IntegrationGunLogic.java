package com.linkany121.gltc.logic.gun;

import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import com.linkany121.gltc.logic.common.GltcMessages;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

import javax.annotation.Nullable;

/** {@code FKR_枪械集成枪} — sneak = GUI, stand = fire selected gun. */
public final class IntegrationGunLogic implements GltcItemLogic {

    private final IntegrationGunGui gui;

    public IntegrationGunLogic(IntegrationGunGui gui) {
        this.gui = gui;
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (!IntegrationGunMeta.isIntegrationStack(hand)) {
            return true;
        }
        if (player.isSneaking()) {
            gui.open(player);
            return true;
        }
        fireSelected(player, event);
        return true;
    }

    public boolean fireSelected(Player player, PlayerRightClickEvent event) {
        ItemStack hand = player.getInventory().getItemInMainHand();
        String gunId = IntegrationGunMeta.readSelectedGunId(hand);
        if (gunId == null) {
            // 与 枪械集成枪.js MSG_PREFIX + MSG_NO_GUN_SELECTED 一致（武器/枪械系前缀）
            player.sendMessage(GltcMessages.WEAPON_PREFIX + "§c请先蹲下右键选择要装载的枪械！");
            return false;
        }
        GltcItemLogic logic = GltcLogicRegistry.item(gunId);
        if (!(logic instanceof AbstractGunLogic gun)) {
            player.sendMessage(GltcMessages.WEAPON_PREFIX + "§c所选枪械逻辑未注册。");
            return false;
        }
        gun.onUse(event, itemOrNull(gunId));
        return true;
    }

    @Nullable
    private static SlimefunItem itemOrNull(String gunId) {
        try {
            return SlimefunItem.getById(gunId);
        } catch (Throwable t) {
            return null;
        }
    }

    public static void clearSelectedGunState(Player player, @Nullable String gunId) {
        if (player == null || gunId == null) {
            return;
        }
        GltcItemLogic logic = GltcLogicRegistry.item(gunId);
        if (logic instanceof AbstractGunLogic gun) {
            gun.clearGunState(player);
        }
    }

    public static void clearFromHand(Player player, @Nullable ItemStack stack) {
        if (player == null || stack == null || stack.getType() == Material.AIR) {
            return;
        }
        if (!IntegrationGunMeta.isIntegrationStack(stack)) {
            return;
        }
        clearSelectedGunState(player, IntegrationGunMeta.readSelectedGunId(stack));
    }
}
