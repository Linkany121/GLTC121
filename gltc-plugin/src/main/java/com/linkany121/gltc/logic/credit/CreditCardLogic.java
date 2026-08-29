package com.linkany121.gltc.logic.credit;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.common.GltcDataPaths;
import com.linkany121.gltc.logic.common.GltcMessages;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;

import java.nio.file.Files;
import java.util.UUID;

/** {@code GLTC_银行卡} — bind / query balance. */
public final class CreditCardLogic implements GltcItemLogic {

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        CreditService credit = CreditService.get();
        Player player = event.getPlayer();
        if (credit == null) {
            // 与 信用卡.js 一致：该消息不带 GLTC 前缀
            player.sendMessage("§c信用点系统未加载，请联系管理员。");
            return true;
        }

        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return true;
        }
        if (!CreditService.CARD_ID.equals(credit.getSlimefunId(hand))) {
            return true;
        }
        if (hand.getAmount() != 1) {
            player.sendMessage(GltcMessages.prefixed("§c请将凭证数量分离为1张后再使用！"));
            return true;
        }

        UUID uuid = player.getUniqueId();
        String name = player.getName();
        String owner = credit.getCardOwner(hand);

        if (owner == null) {
            if (credit.hasBoundCard(player.getInventory(), uuid)) {
                player.sendMessage(GltcMessages.prefixed("§c你已经持有一张已绑定的凭证！一人一卡，请勿多持。"));
                return true;
            }
            credit.bindCard(hand, uuid);
            GltcPlugin plugin = GltcPlugin.getInstance();
            boolean hadFile = plugin != null && Files.isRegularFile(GltcDataPaths.creditFile(plugin, uuid));
            if (hadFile) {
                double existing = credit.getCredit(uuid);
                credit.updateCardLore(hand, name, existing);
                player.sendMessage(GltcMessages.prefixed(
                    "§a凭证已重新绑定至 §e" + name + " §a，已同步信用点数据，当前余额：§b"
                        + CreditService.formatCredit(existing) + "△"
                ));
            } else {
                credit.setCredit(uuid, 0);
                credit.updateCardLore(hand, name, 0);
                player.sendMessage(GltcMessages.prefixed("§a凭证已绑定至 §e" + name + " §a，初始信用点：§b0△"));
            }
            return true;
        }

        if (!owner.equals(uuid.toString())) {
            player.sendMessage(GltcMessages.prefixed("§c一人一卡，请将不属于你的凭证归还！"));
            return true;
        }

        double bal = credit.getCredit(uuid);
        credit.updateCardLore(hand, name, bal);
        player.sendMessage(GltcMessages.prefixed(
            "§e" + name + " §a凭证余额：§b" + CreditService.formatCredit(bal) + "△"
        ));
        return true;
    }
}
