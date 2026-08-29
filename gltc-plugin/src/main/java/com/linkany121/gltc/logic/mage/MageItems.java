package com.linkany121.gltc.logic.mage;

import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.SkullMeta;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.profile.PlayerProfile;
import org.bukkit.profile.PlayerTextures;
import org.bukkit.util.io.BukkitObjectInputStream;
import org.bukkit.util.io.BukkitObjectOutputStream;

import javax.annotation.Nullable;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/** Item helpers for mage gear / staff (SF id, UGW PDC, Base64, skulls). */
public final class MageItems {

    public static final NamespacedKey SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
    public static final NamespacedKey KEY_UGW_ID = new NamespacedKey("gltc", "ugw_id");
    public static final NamespacedKey KEY_UGW_CREATOR = new NamespacedKey("gltc", "ugw_creator");

    private MageItems() {
    }

    @Nullable
    public static String getSlimefunId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null) {
                var pdc = meta.getPersistentDataContainer();
                if (pdc.has(SF_ITEM_KEY, PersistentDataType.STRING)) {
                    String fromPdc = pdc.get(SF_ITEM_KEY, PersistentDataType.STRING);
                    if (fromPdc != null && !fromPdc.isEmpty()) {
                        return fromPdc;
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        try {
            SlimefunItem sf = SlimefunItem.getByItem(stack);
            if (sf != null) {
                return sf.getId();
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    @Nullable
    public static String getUgwId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null && meta.getPersistentDataContainer().has(KEY_UGW_ID, PersistentDataType.STRING)) {
                return meta.getPersistentDataContainer().get(KEY_UGW_ID, PersistentDataType.STRING);
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    @Nullable
    public static String getUgwCreator(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null && meta.getPersistentDataContainer().has(KEY_UGW_CREATOR, PersistentDataType.STRING)) {
                return meta.getPersistentDataContainer().get(KEY_UGW_CREATOR, PersistentDataType.STRING);
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    @Nullable
    public static String itemToBase64(@Nullable ItemStack item) {
        if (item == null || item.getType() == Material.AIR) {
            return null;
        }
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (BukkitObjectOutputStream oos = new BukkitObjectOutputStream(baos)) {
                oos.writeObject(item);
            }
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception ex) {
            return null;
        }
    }

    @Nullable
    public static ItemStack itemFromBase64(@Nullable String text) {
        if (text == null || text.isEmpty()) {
            return null;
        }
        try {
            byte[] raw = Base64.getDecoder().decode(text);
            try (BukkitObjectInputStream ois = new BukkitObjectInputStream(new ByteArrayInputStream(raw))) {
                Object obj = ois.readObject();
                return obj instanceof ItemStack stack ? stack : null;
            }
        } catch (Exception ex) {
            return null;
        }
    }

    public static ItemStack named(Material mat, String name, @Nullable List<String> lore) {
        ItemStack stack = new ItemStack(mat == null ? Material.STONE : mat, 1);
        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            if (lore != null && !lore.isEmpty()) {
                meta.setLore(lore);
            }
            stack.setItemMeta(meta);
        }
        return stack;
    }

    public static ItemStack skull(String hash, String name, @Nullable List<String> lore) {
        ItemStack stack = new ItemStack(Material.PLAYER_HEAD, 1);
        ItemMeta meta = stack.getItemMeta();
        if (meta instanceof SkullMeta skull) {
            skull.setDisplayName(name);
            if (lore != null && !lore.isEmpty()) {
                skull.setLore(lore);
            }
            try {
                PlayerProfile profile = Bukkit.createPlayerProfile(UUID.randomUUID());
                PlayerTextures textures = profile.getTextures();
                textures.setSkin(URI.create("http://textures.minecraft.net/texture/" + hash).toURL());
                profile.setTextures(textures);
                skull.setOwnerProfile(profile);
            } catch (Exception ignored) {
            }
            stack.setItemMeta(skull);
        } else if (meta != null) {
            meta.setDisplayName(name);
            if (lore != null && !lore.isEmpty()) {
                meta.setLore(lore);
            }
            stack.setItemMeta(meta);
        }
        return stack;
    }

    public static void giveOrDrop(org.bukkit.entity.Player player, @Nullable ItemStack item) {
        if (player == null || item == null || item.getType() == Material.AIR) {
            return;
        }
        var left = player.getInventory().addItem(item);
        for (ItemStack drop : left.values()) {
            player.getWorld().dropItemNaturally(player.getLocation(), drop);
        }
    }
}
