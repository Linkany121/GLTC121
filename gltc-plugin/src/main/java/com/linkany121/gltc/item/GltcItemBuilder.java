package com.linkany121.gltc.item;

import com.linkany121.gltc.util.IdCanonicalizer;
import com.linkany121.gltc.util.TextUtil;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.inventory.meta.SkullMeta;
import org.bukkit.profile.PlayerProfile;
import org.bukkit.profile.PlayerTextures;

import java.net.MalformedURLException;
import java.net.URI;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

public final class GltcItemBuilder {

    private GltcItemBuilder() {
    }

    public static ItemStack stack(Map<String, Object> itemSection) {
        if (itemSection == null) {
            return new ItemStack(Material.STONE);
        }

        String materialType = str(itemSection, "material_type", "mc");
        ItemStack stack;
        if ("saveditem".equalsIgnoreCase(materialType)) {
            stack = SavedItemLoader.get(str(itemSection, "material", "missing"));
        } else {
            Material material = resolveMaterial(itemSection, materialType);
            stack = new ItemStack(material);
            if (material == Material.PLAYER_HEAD && stack.getItemMeta() instanceof SkullMeta skullMeta) {
                applySkull(skullMeta, itemSection, materialType);
                stack.setItemMeta(skullMeta);
            }
        }

        return applyMeta(stack, itemSection, materialType);
    }

    public static SlimefunItemStack slimefunStack(String id, Map<String, Object> itemSection, int amount) {
        ItemStack template = stack(itemSection);
        template.setAmount(Math.max(1, amount));
        return new SlimefunItemStack(IdCanonicalizer.slimefunId(id), template);
    }

    public static SlimefunItemStack slimefunStack(String id, Map<String, Object> itemSection) {
        return slimefunStack(id, itemSection, 1);
    }

    private static ItemStack applyMeta(ItemStack stack, Map<String, Object> itemSection, String materialType) {
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return stack;
        }

        if (itemSection.containsKey("name")) {
            meta.displayName(TextUtil.color(String.valueOf(itemSection.get("name"))));
        }

        List<String> loreLines = TextUtil.readStringList(itemSection, "lore");
        if (!loreLines.isEmpty()) {
            meta.lore(TextUtil.colorLore(loreLines));
        }

        if (bool(itemSection, "glow")) {
            meta.addEnchant(Enchantment.UNBREAKING, 1, true);
            meta.addItemFlags(ItemFlag.HIDE_ENCHANTS);
        }

        Integer modelId = intOrNull(itemSection, "modelId");
        if (modelId != null) {
            meta.setCustomModelData(modelId);
        }

        if (stack.getType() == Material.PLAYER_HEAD
            && meta instanceof SkullMeta skullMeta
            && "skull_hash".equalsIgnoreCase(materialType)) {
            applySkull(skullMeta, itemSection, materialType);
            stack.setItemMeta(skullMeta);
            return stack;
        }

        stack.setItemMeta(meta);
        return stack;
    }

    private static Material resolveMaterial(Map<String, Object> section, String materialType) {
        String raw = str(section, "material", "STONE");
        if ("skull_hash".equalsIgnoreCase(materialType)) {
            return Material.PLAYER_HEAD;
        }
        Material material = Material.matchMaterial(raw.toUpperCase(Locale.ROOT));
        if (material == null) {
            material = Material.matchMaterial(raw.toLowerCase(Locale.ROOT));
        }
        return material != null ? material : Material.STONE;
    }

    private static void applySkull(SkullMeta meta, Map<String, Object> section, String materialType) {
        if (!"skull_hash".equalsIgnoreCase(materialType)) {
            return;
        }
        String value = str(section, "material", "");
        if (value.isEmpty()) {
            return;
        }

        PlayerProfile profile = org.bukkit.Bukkit.createPlayerProfile(UUID.randomUUID());
        PlayerTextures textures = profile.getTextures();
        try {
            if (value.startsWith("eyJ")) {
                String json = new String(Base64.getDecoder().decode(value));
                int start = json.indexOf("\"url\":\"") + 7;
                int end = json.indexOf('"', start);
                if (start > 6 && end > start) {
                    textures.setSkin(URI.create(json.substring(start, end)).toURL());
                }
            } else {
                textures.setSkin(URI.create("http://textures.minecraft.net/texture/" + value).toURL());
            }
            profile.setTextures(textures);
            meta.setOwnerProfile(profile);
        } catch (MalformedURLException | IllegalArgumentException ex) {
            var plugin = com.linkany121.gltc.GltcPlugin.getInstance();
            if (plugin != null) {
                plugin.getLogger().warning("[ItemBuilder] 头颅材质解析失败: " + ex.getMessage());
            }
        }
    }

    private static String str(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private static boolean bool(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof Boolean b ? b : Boolean.parseBoolean(String.valueOf(value));
    }

    private static Integer intOrNull(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
