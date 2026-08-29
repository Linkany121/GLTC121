package com.linkany121.gltc.logic.gun;

import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;

/** Integration gun PDC + lore — mirrors {@code _gunMeta.js}. */
public final class IntegrationGunMeta {

    public static final NamespacedKey KEY_SELECTED_GUN = new NamespacedKey("gltc", "integration_gun_id");  // 集成枪当前装载枪械的 NBT 键（一般不要改动）
    private static final String LORE_MARKER = "§8§m----------------";  // lore 分隔线
    private static final String LORE_PREFIX_PLAIN = "[已装载]";        // 集成枪 lore 中已装载枪械的前缀

    private IntegrationGunMeta() {
    }

    public static String stripColor(String str) {
        if (str == null) {
            return "";
        }
        return str.replaceAll("§x(§[0-9a-fA-F]){6}", "").replaceAll("§.", "");
    }

    public static String gunDisplayName(@Nullable String gunId) {
        if (gunId == null || gunId.isBlank()) {
            return "§7未选择";
        }
        try {
            SlimefunItem sf = SlimefunItem.getById(gunId);
            if (sf != null) {
                ItemMeta meta = sf.getItem().getItemMeta();
                if (meta != null && meta.hasDisplayName()) {
                    return meta.getDisplayName();
                }
            }
        } catch (Throwable ignored) {
        }
        return gunId;
    }

    @Nullable
    public static String readSelectedGunId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return null;
        }
        if (!meta.getPersistentDataContainer().has(KEY_SELECTED_GUN, PersistentDataType.STRING)) {
            return null;
        }
        String v = meta.getPersistentDataContainer().get(KEY_SELECTED_GUN, PersistentDataType.STRING);
        if (v == null) {
            return null;
        }
        v = v.trim();
        return v.isEmpty() ? null : v;
    }

    public static List<String> stripIntegrationLore(@Nullable List<String> lore) {
        List<String> out = new ArrayList<>();
        if (lore == null) {
            return out;
        }
        for (String line : lore) {
            if (line.contains(LORE_MARKER)) {
                break;
            }
            if (stripColor(line).contains(LORE_PREFIX_PLAIN)) {
                continue;
            }
            out.add(line);
        }
        return out;
    }

    public static List<String> buildIntegrationLore(@Nullable List<String> baseLore, @Nullable String gunId) {
        List<String> lore = stripIntegrationLore(baseLore);
        lore.add(LORE_MARKER);
        if (gunId != null && !gunId.isBlank()) {
            lore.add("§f[§x§9§6§d§6§a§7已装载§f] " + gunDisplayName(gunId));
            lore.add("§7蹲下右键打开枪械选择界面");
        } else {
            lore.add("§7[未装载] §7请先蹲下右键选择枪械");
        }
        return lore;
    }

    public static boolean writeSelectedGun(ItemStack stack, @Nullable String gunId) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        if (gunId != null && !GunRegistry.isRegisteredGun(gunId)) {
            return false;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return false;
        }
        if (gunId != null) {
            meta.getPersistentDataContainer().set(KEY_SELECTED_GUN, PersistentDataType.STRING, gunId);
        } else {
            meta.getPersistentDataContainer().remove(KEY_SELECTED_GUN);
        }
        meta.setLore(buildIntegrationLore(meta.hasLore() ? meta.getLore() : null, gunId));
        stack.setItemMeta(meta);
        return true;
    }

    @Nullable
    public static String readIfIntegration(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        if (sf == null || !GunRegistry.INTEGRATION_GUN_ID.equals(sf.getId())) {
            return null;
        }
        return readSelectedGunId(stack);
    }

    public static boolean isIntegrationStack(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        return sf != null && GunRegistry.INTEGRATION_GUN_ID.equals(sf.getId());
    }
}
