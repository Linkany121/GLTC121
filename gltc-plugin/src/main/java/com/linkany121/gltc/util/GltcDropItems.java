package com.linkany121.gltc.util;

import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;

import javax.annotation.Nullable;
import java.util.Locale;

public final class GltcDropItems {

    private GltcDropItems() {
    }

    @Nullable
    public static SlimefunItem resolve(String itemId) {
        if (itemId == null || itemId.isBlank()) {
            return null;
        }
        SlimefunItem item = SlimefunItem.getById(IdCanonicalizer.slimefunId(itemId));
        if (item == null) {
            item = SlimefunItem.getById(IdCanonicalizer.canonical(itemId));
        }
        if (item == null) {
            item = SlimefunItem.getById(itemId);
        }
        if (item == null) {
            item = SlimefunItem.getById(itemId.toUpperCase(Locale.ROOT));
        }
        if (item == null) {
            String needle = itemId.toLowerCase(Locale.ROOT);
            for (SlimefunItem registered : Slimefun.getRegistry().getAllSlimefunItems()) {
                if (registered.getId().equalsIgnoreCase(itemId)
                    || registered.getId().toLowerCase(Locale.ROOT).equals(needle)) {
                    return registered;
                }
            }
        }
        return item;
    }

    @Nullable
    public static ItemStack cloneDrop(String itemId) {
        SlimefunItem item = resolve(itemId);
        if (item == null || item.getItem() == null) {
            return null;
        }
        ItemStack stack = item.getItem().clone();
        if (stack.getType() == Material.AIR) {
            return null;
        }
        return stack;
    }
}
