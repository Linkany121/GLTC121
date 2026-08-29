package com.linkany121.gltc.logic.credit;

import com.linkany121.gltc.GltcPlugin;
import io.github.thebusybiscuit.slimefun4.api.items.groups.NestedItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.groups.SubItemGroup;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

/**
 * Sub item group for an energy-flow shop. It mirrors the RSC button groups
 * ({@code SHOP_ZiW} etc.) under the {@code SHOP_A} nested group: clicking the
 * group's icon inside the Slimefun guide opens the matching buy GUI directly
 * (see {@link ShopGuideClickListener}).
 */
public final class ShopButtonGroup extends SubItemGroup {

    /** PDC tag written on the group icon so the guide click interceptor can find it. */
    public static final NamespacedKey SHOP_ID_KEY = new NamespacedKey(GltcPlugin.getInstance(), "gltc_shop_id");

    private final String shopId;

    public ShopButtonGroup(NamespacedKey key, NestedItemGroup parent, ItemStack icon, int tier, String shopId) {
        super(key, parent, icon, tier);
        this.shopId = shopId;
        ItemMeta meta = icon.getItemMeta();
        if (meta != null) {
            meta.getPersistentDataContainer().set(SHOP_ID_KEY, PersistentDataType.STRING, shopId);
            icon.setItemMeta(meta);
        }
    }

    public String getShopId() {
        return shopId;
    }
}
