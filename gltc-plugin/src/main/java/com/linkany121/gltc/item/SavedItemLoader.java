package com.linkany121.gltc.item;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Material;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.inventory.ItemStack;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;

public final class SavedItemLoader {

    private static final Map<String, ItemStack> CACHE = new HashMap<>();

    private SavedItemLoader() {
    }

    public static void loadAll(GltcPlugin plugin) {
        CACHE.clear();
        try (InputStream stream = plugin.getResource("saveditems_manifest.txt")) {
            if (stream == null) {
                plugin.getLogger().warning("[SavedItem] 缺少 saveditems_manifest.txt，请重新运行 codegen");
                return;
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                reader.lines()
                    .map(String::trim)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .forEach(key -> loadFile(plugin, key));
            }
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[SavedItem] 读取清单失败", ex);
        }
        plugin.getLogger().info("[SavedItem] 已加载 " + CACHE.size() + " 个模板");
    }

    private static void loadFile(GltcPlugin plugin, String key) {
        String resourcePath = "saveditems/" + key + ".yml";
        try (InputStream stream = plugin.getResource(resourcePath)) {
            if (stream == null) {
                plugin.getLogger().warning("[SavedItem] 缺失: " + key);
                CACHE.put(key, new ItemStack(Material.STONE));
                return;
            }
            YamlConfiguration yaml = YamlConfiguration.loadConfiguration(
                new InputStreamReader(stream, StandardCharsets.UTF_8)
            );
            ItemStack stack = deserializeItem(yaml);
            if (stack == null) {
                plugin.getLogger().warning("[SavedItem] 无法解析: " + key);
                CACHE.put(key, new ItemStack(Material.STONE));
                return;
            }
            CACHE.put(key, stack);
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[SavedItem] 失败: " + key, ex);
            CACHE.put(key, new ItemStack(Material.STONE));
        }
    }

    private static ItemStack deserializeItem(YamlConfiguration yaml) {
        ItemStack stack = yaml.getItemStack("item");
        if (stack != null) {
            return stack;
        }

        ConfigurationSection section = yaml.getConfigurationSection("item");
        if (section == null) {
            return null;
        }

        stack = section.getItemStack(".");
        if (stack != null) {
            return stack;
        }

        String type = section.getString("type");
        if (type != null && !type.isBlank()) {
            Material material = Material.matchMaterial(type.toUpperCase());
            if (material == null) {
                material = Material.matchMaterial(type.toLowerCase());
            }
            if (material != null) {
                section.set("material", material.name());
                return section.getItemStack(".");
            }
        }

        return null;
    }

    public static ItemStack get(String path) {
        ItemStack cached = CACHE.get(path);
        if (cached == null) {
            return new ItemStack(Material.STONE);
        }
        return cached.clone();
    }
}
