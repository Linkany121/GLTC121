package com.linkany121.gltc.util;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

public final class IdCanonicalizer {

    private static final Map<String, String> CANONICAL = new HashMap<>();

    private IdCanonicalizer() {
    }

    public static void register(String id) {
        if (id == null || id.isBlank()) {
            return;
        }
        String key = id.toLowerCase(Locale.ROOT);
        CANONICAL.putIfAbsent(key, id);
    }

    public static String canonical(String id) {
        if (id == null) {
            return "";
        }
        return CANONICAL.getOrDefault(id.toLowerCase(Locale.ROOT), id);
    }

    /** Slimefun Beta+ requires uppercase ASCII in item ids. */
    public static String slimefunId(String id) {
        return canonical(id).toUpperCase(Locale.ROOT);
    }

    public static Map<String, String> snapshot() {
        return Map.copyOf(CANONICAL);
    }
}
