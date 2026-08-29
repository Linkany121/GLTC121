package com.linkany121.gltc.logic.common;

import com.linkany121.gltc.GltcPlugin;

import java.nio.file.Path;

/**
 * Unified data root under {@code plugins/GLTC/data/}.
 * Format choice for credit/mage files is fixed here when J2/J9 land (prefer JSON).
 */
public final class GltcDataPaths {

    private GltcDataPaths() {
    }

    public static Path dataRoot(GltcPlugin plugin) {
        return plugin.getDataFolder().toPath().resolve("data");
    }

    public static Path creditDir(GltcPlugin plugin) {
        return dataRoot(plugin).resolve("credit");
    }

    public static Path creditLimitDir(GltcPlugin plugin) {
        return dataRoot(plugin).resolve("credit-limits");
    }

    public static Path creditFile(GltcPlugin plugin, java.util.UUID uuid) {
        return creditDir(plugin).resolve(uuid.toString() + ".json");
    }

    public static Path creditLimitFile(GltcPlugin plugin, java.util.UUID uuid) {
        return creditLimitDir(plugin).resolve(uuid.toString() + ".json");
    }

    public static Path mageStatsDir(GltcPlugin plugin) {
        return dataRoot(plugin).resolve("mage").resolve("stats");
    }

    public static Path mageEquipDir(GltcPlugin plugin) {
        return dataRoot(plugin).resolve("mage").resolve("equip");
    }

    public static Path mageStatsFile(GltcPlugin plugin, java.util.UUID uuid) {
        return mageStatsDir(plugin).resolve(uuid.toString() + ".json");
    }

    public static Path mageEquipFile(GltcPlugin plugin, java.util.UUID uuid) {
        return mageEquipDir(plugin).resolve(uuid.toString() + ".json");
    }

    public static Path skeyDir(GltcPlugin plugin) {
        return dataRoot(plugin).resolve("skey");
    }

    public static Path skeyCurrencyDir(GltcPlugin plugin) {
        return skeyDir(plugin).resolve("currency");
    }

    public static Path skeyCurrencyFile(GltcPlugin plugin, java.util.UUID uuid) {
        return skeyCurrencyDir(plugin).resolve(uuid.toString() + ".json");
    }
}
