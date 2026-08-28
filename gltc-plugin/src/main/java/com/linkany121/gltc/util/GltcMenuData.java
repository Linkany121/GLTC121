package com.linkany121.gltc.util;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

public final class GltcMenuData {

    private static final Map<String, Map<String, Object>> MENUS = new HashMap<>();

    private GltcMenuData() {
    }

    public static void register(String id, Map<String, Object> menu) {
        MENUS.put(id, menu);
    }

    public static Map<String, Object> get(String id) {
        return MENUS.get(id);
    }

    public static Map<String, Map<String, Object>> all() {
        return Collections.unmodifiableMap(MENUS);
    }
}
