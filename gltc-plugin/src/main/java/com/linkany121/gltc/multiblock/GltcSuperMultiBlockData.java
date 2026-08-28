package com.linkany121.gltc.multiblock;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.util.IdCanonicalizer;
import org.bukkit.Material;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.util.Vector;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class GltcSuperMultiBlockData {

    public record PartSpec(Material material, String slimefunId, boolean core) {
    }

    /**
     * Flags mirror RSC SuperMultiBlockMachineReader defaults.
     */
    public record Definition(
        Map<Vector, PartSpec> parts,
        Map<Integer, Map<Vector, PartSpec>> layerParts,
        int coreLayer,
        int layerCount,
        boolean displayProjectiles,
        boolean allowSwitchDisplayLayer,
        boolean checkFormed,
        boolean openMenuWhenClickedParts,
        boolean noMenuWhenNotFormed,
        boolean defaultNotice
    ) {
    }

    private static final Map<String, Definition> DEFINITIONS = new HashMap<>();

    private GltcSuperMultiBlockData() {
    }

    public static void load(GltcPlugin plugin) {
        DEFINITIONS.clear();
        try (InputStream stream = plugin.getResource("super_multi_block_machines.yml")) {
            if (stream == null) {
                plugin.getLogger().warning("[SMB] 缺少 super_multi_block_machines.yml");
                return;
            }
            YamlConfiguration yaml = YamlConfiguration.loadConfiguration(new InputStreamReader(stream, StandardCharsets.UTF_8));
            for (String key : yaml.getKeys(false)) {
                ConfigurationSection section = yaml.getConfigurationSection(key);
                if (section == null) {
                    continue;
                }
                Definition definition = parseDefinition(key, section);
                if (definition != null) {
                    DEFINITIONS.put(key, definition);
                    DEFINITIONS.put(IdCanonicalizer.slimefunId(key), definition);
                }
            }
            plugin.getLogger().info("[SMB] 已加载 " + DEFINITIONS.size() / 2 + " 个多方块结构");
        } catch (Exception ex) {
            plugin.getLogger().log(java.util.logging.Level.WARNING, "[SMB] 结构加载失败", ex);
        }
    }

    public static Definition get(String machineId) {
        if (machineId == null) {
            return null;
        }
        Definition definition = DEFINITIONS.get(machineId);
        if (definition != null) {
            return definition;
        }
        return DEFINITIONS.get(IdCanonicalizer.canonical(machineId));
    }

    public static Set<String> machineIds() {
        return Collections.unmodifiableSet(DEFINITIONS.keySet());
    }

    private static Definition parseDefinition(String machineId, ConfigurationSection section) {
        List<List<String>> layers = readLayers(section.getList("structure"));
        ConfigurationSection mapping = section.getConfigurationSection("mapping");
        if (layers.isEmpty() || mapping == null) {
            return null;
        }

        Map<String, PartSpec> tokenSpecs = new HashMap<>();
        Vector coreOffset = null;
        for (String token : mapping.getKeys(false)) {
            ConfigurationSection part = mapping.getConfigurationSection(token);
            if (part == null) {
                continue;
            }
            boolean core = part.getBoolean("core", false);
            // Trust explicit material_type — do not reclassify vanilla ids like iron_block as slimefun.
            String type = part.getString("material_type", "mc").toLowerCase(Locale.ROOT);
            PartSpec spec;
            if ("slimefun".equals(type)) {
                spec = new PartSpec(null, IdCanonicalizer.canonical(part.getString("material", "")), core);
            } else {
                String rawMaterial = part.getString("material", "STONE");
                Material material = Material.matchMaterial(rawMaterial.toUpperCase(Locale.ROOT));
                if (material == null) {
                    material = Material.matchMaterial(rawMaterial);
                }
                spec = new PartSpec(material != null ? material : Material.STONE, null, core);
            }
            tokenSpecs.put(token.toLowerCase(Locale.ROOT), spec);
            if (core) {
                coreOffset = findTokenOffset(layers, token.toLowerCase(Locale.ROOT));
            }
        }

        if (coreOffset == null) {
            return null;
        }

        Map<Vector, PartSpec> parts = new HashMap<>();
        Map<Integer, Map<Vector, PartSpec>> layerParts = new HashMap<>();
        for (int layer = 0; layer < layers.size(); layer++) {
            Map<Vector, PartSpec> layerMap = new HashMap<>();
            List<String> rows = layers.get(layer);
            for (int z = 0; z < rows.size(); z++) {
                String[] tokens = rows.get(z).trim().split("\\s+");
                for (int x = 0; x < tokens.length; x++) {
                    String token = tokens[x].toLowerCase(Locale.ROOT);
                    if (token.isBlank() || token.equals("null") || token.chars().allMatch(ch -> ch == '_')) {
                        continue;
                    }
                    PartSpec spec = tokenSpecs.get(token);
                    if (spec == null || spec.core()) {
                        continue;
                    }
                    // YAML structure lists layers top-first (index 0 = highest Y).
                    int worldLayer = layers.size() - 1 - layer;
                    int coreWorldLayer = layers.size() - 1 - coreOffset.getBlockY();
                    Vector offset = transformTemplateOffset(
                        machineId,
                        new Vector(
                            x - coreOffset.getBlockX(),
                            worldLayer - coreWorldLayer,
                            z - coreOffset.getBlockZ()
                        )
                    );
                    parts.put(offset, spec);
                    layerMap.put(offset, spec);
                }
            }
            if (!layerMap.isEmpty()) {
                layerParts.put(layer, layerMap);
            }
        }

        // RSC defaults: displayProjectiles/checkFormed/openMenuWhenClickedParts/noMenuWhenNotFormed = true
        boolean displayProjectiles = section.getBoolean("displayProjectiles", true);
        boolean allowSwitchDisplayLayer = section.getBoolean("allowSwitchDisplayLayer", true);
        boolean checkFormed = section.getBoolean("checkFormed", true);
        boolean openMenuWhenClickedParts = section.getBoolean("openMenuWhenClickedParts", true);
        boolean noMenuWhenNotFormed = section.getBoolean("noMenuWhenNotFormed", true);
        boolean defaultNotice = section.getBoolean("defaultNotice", true);
        return new Definition(
            Collections.unmodifiableMap(parts),
            Collections.unmodifiableMap(layerParts),
            coreOffset.getBlockY(),
            layers.size(),
            displayProjectiles,
            allowSwitchDisplayLayer,
            checkFormed,
            openMenuWhenClickedParts,
            noMenuWhenNotFormed,
            defaultNotice
        );
    }

    /**
     * Template fixes relative to authored YAML:
     * - 深红/灼热: core on west edge with body +X was displayed as "turned right";
     *   rotate 90° CCW so body sits behind the core (−Z when facing south).
     * - 四目伏羲: swap front/back (negate Z).
     */
    private static Vector transformTemplateOffset(String machineId, Vector offset) {
        String id = IdCanonicalizer.canonical(machineId);
        if (id.contains("深红远星") || id.contains("灼热苍穹")) {
            return new Vector(offset.getBlockZ(), offset.getBlockY(), -offset.getBlockX());
        }
        if (id.contains("四目伏羲")) {
            return new Vector(offset.getBlockX(), offset.getBlockY(), -offset.getBlockZ());
        }
        return offset;
    }

    private static Vector findTokenOffset(List<List<String>> layers, String token) {
        for (int layer = 0; layer < layers.size(); layer++) {
            List<String> rows = layers.get(layer);
            for (int z = 0; z < rows.size(); z++) {
                String[] tokens = rows.get(z).trim().split("\\s+");
                for (int x = 0; x < tokens.length; x++) {
                    if (token.equals(tokens[x].toLowerCase(Locale.ROOT))) {
                        return new Vector(x, layer, z);
                    }
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static List<List<String>> readLayers(List<?> raw) {
        if (raw == null) {
            return List.of();
        }
        List<List<String>> layers = new java.util.ArrayList<>();
        for (Object layerObj : raw) {
            if (!(layerObj instanceof List<?> layer)) {
                continue;
            }
            List<String> rows = new java.util.ArrayList<>();
            for (Object rowObj : layer) {
                rows.add(String.valueOf(rowObj));
            }
            layers.add(rows);
        }
        return layers;
    }
}
