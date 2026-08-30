package com.linkany121.gltc.item;

import io.github.thebusybiscuit.slimefun4.api.items.groups.NestedItemGroup;
import org.bukkit.NamespacedKey;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

/**
 * Nested item group that keeps its original icon lore.
 *
 * <p>Vanilla {@link NestedItemGroup} inherits {@code ItemGroup#getItem(Player)},
 * which replaces the icon lore with a fixed "open this group" hint. RSC's custom
 * group classes instead return the raw icon whenever it carries lore of its own;
 * we mirror that behaviour here so the guide shows the configured lore.</p>
 */
public class GltcNestedItemGroup extends NestedItemGroup {

    public GltcNestedItemGroup(NamespacedKey key, ItemStack item, int tier) {
        super(key, item, tier);
    }

    @Override
    public ItemStack getItem(Player p) {
        if (this.item != null && this.item.hasItemMeta()) {
            ItemMeta meta = this.item.getItemMeta();
            if (meta != null && meta.hasLore()) {
                return this.item;
            }
        }
        return super.getItem(p);
    }
}
