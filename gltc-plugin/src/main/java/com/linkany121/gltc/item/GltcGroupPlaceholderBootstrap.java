package com.linkany121.gltc.item;

import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.items.groups.SubItemGroup;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.Locale;
import java.util.Set;

/**
 * Ensures designated placeholder item groups still appear in the Slimefun guide.
 */
public final class GltcGroupPlaceholderBootstrap {

    private static final Set<String> PLACEHOLDER_GROUPS = Set.of(
        "b_zw1",
        "b_zw2",
        "b_zw3",
        "b_zw4"
    );

    private GltcGroupPlaceholderBootstrap() {
    }

    public static void registerMissingPlaceholders(SlimefunAddon addon) {
        for (ItemGroup group : Slimefun.getRegistry().getAllItemGroups()) {
            if (!(group instanceof SubItemGroup) || !group.isRegistered() || !group.getItems().isEmpty()) {
                continue;
            }
            String groupId = group.getKey().getKey().toLowerCase(Locale.ROOT);
            if (!PLACEHOLDER_GROUPS.contains(groupId)) {
                continue;
            }
            new PlaceholderItem(group).register(addon);
        }
    }

    private static final class PlaceholderItem extends SlimefunItem {

        PlaceholderItem(ItemGroup group) {
            super(
                group,
                new SlimefunItemStack(
                    "GLTC_GROUP_PLACEHOLDER_" + group.getKey().getKey().toUpperCase(),
                    createIcon()
                ),
                RecipeType.NULL,
                new ItemStack[0],
                null
            );
        }

        private static ItemStack createIcon() {
            ItemStack item = new ItemStack(Material.GRAY_STAINED_GLASS_PANE);
            ItemMeta meta = item.getItemMeta();
            if (meta != null) {
                meta.setDisplayName(ChatColor.DARK_GRAY + "（空）");
                item.setItemMeta(meta);
            }
            return item;
        }
    }
}
