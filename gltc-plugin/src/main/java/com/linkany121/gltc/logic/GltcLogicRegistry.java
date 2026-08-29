package com.linkany121.gltc.logic;

import javax.annotation.Nullable;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Maps Slimefun item/machine IDs to Java logic implementations.
 * Lookups are case-insensitive on ASCII letters to match Slimefun id quirks.
 */
public final class GltcLogicRegistry {

    private static final Map<String, GltcItemLogic> ITEMS = new ConcurrentHashMap<>();
    private static final Map<String, GltcMachineLogic> MACHINES = new ConcurrentHashMap<>();

    private GltcLogicRegistry() {
    }

    public static void registerItem(String slimefunId, GltcItemLogic logic) {
        if (slimefunId == null || logic == null) {
            return;
        }
        ITEMS.put(normalize(slimefunId), logic);
    }

    public static void registerMachine(String slimefunId, GltcMachineLogic logic) {
        if (slimefunId == null || logic == null) {
            return;
        }
        MACHINES.put(normalize(slimefunId), logic);
    }

    @Nullable
    public static GltcItemLogic item(String slimefunId) {
        if (slimefunId == null) {
            return null;
        }
        GltcItemLogic direct = ITEMS.get(normalize(slimefunId));
        if (direct != null) {
            return direct;
        }
        for (Map.Entry<String, GltcItemLogic> e : ITEMS.entrySet()) {
            if (e.getKey().equalsIgnoreCase(slimefunId)) {
                return e.getValue();
            }
        }
        return null;
    }

    @Nullable
    public static GltcMachineLogic machine(String slimefunId) {
        if (slimefunId == null) {
            return null;
        }
        GltcMachineLogic direct = MACHINES.get(normalize(slimefunId));
        if (direct != null) {
            return direct;
        }
        for (Map.Entry<String, GltcMachineLogic> e : MACHINES.entrySet()) {
            if (e.getKey().equalsIgnoreCase(slimefunId)) {
                return e.getValue();
            }
        }
        return null;
    }

    public static Map<String, GltcItemLogic> itemsView() {
        return Collections.unmodifiableMap(ITEMS);
    }

    public static Map<String, GltcMachineLogic> machinesView() {
        return Collections.unmodifiableMap(MACHINES);
    }

    public static void clear() {
        ITEMS.clear();
        MACHINES.clear();
    }

    private static String normalize(String id) {
        return id.trim();
    }
}
