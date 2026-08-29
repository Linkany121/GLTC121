package com.linkany121.gltc.logic.credit;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.generated.GltcItemGroups;
import io.github.thebusybiscuit.slimefun4.api.player.PlayerProfile;
import io.github.thebusybiscuit.slimefun4.core.guide.GuideHistory;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

/**
 * Intercepts clicks on the energy-flow shop sub item groups inside the
 * Slimefun guide and opens the matching buy GUI instead of the group's item
 * list (same behaviour as the original RSC button groups).
 * <p>
 * Slimefun's ChestMenu already pushes the clicked sub group into the guide
 * history (so re-opening the guide would land inside the placeholder-only
 * item list), therefore the history is reset to the {@code SHOP_A} page. Both
 * the shop and the history fix run one tick later so they always win over any
 * page Slimefun opened in the same tick.
 */
public final class ShopGuideClickListener implements Listener {

    @EventHandler(priority = EventPriority.HIGHEST)
    public void onGuideClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        ItemStack current = event.getCurrentItem();
        if (current == null || !current.hasItemMeta()) {
            return;
        }
        ItemMeta meta = current.getItemMeta();
        String shopId = meta.getPersistentDataContainer()
            .get(ShopButtonGroup.SHOP_ID_KEY, PersistentDataType.STRING);
        if (shopId == null) {
            return;
        }
        event.setCancelled(true);
        Bukkit.getScheduler().runTask(GltcPlugin.getInstance(), () -> {
            PlayerProfile.find(player).ifPresent(profile -> {
                GuideHistory history = profile.getGuideHistory();
                history.clear();
                history.add(GltcItemGroups.SHOP_A, 1);
            });
            EnergyShopGui.open(player, shopId);
        });
    }
}
