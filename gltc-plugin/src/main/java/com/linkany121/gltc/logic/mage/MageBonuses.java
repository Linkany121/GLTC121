package com.linkany121.gltc.logic.mage;

import javax.annotation.Nullable;
import java.util.LinkedHashMap;
import java.util.Map;

/** Flat bonus map for gear / staff / totals. */
public final class MageBonuses {

    private final Map<String, Double> values = new LinkedHashMap<>();

    public static MageBonuses empty() {
        MageBonuses b = new MageBonuses();
        for (String k : MagePointDefs.ALL_STAT_KEYS) {
            b.values.put(k, 0.0);
        }
        b.values.put("magePotential", 0.0);
        b.values.put("bodyPotential", 0.0);
        return b;
    }

    public MageBonuses copy() {
        MageBonuses b = new MageBonuses();
        b.values.putAll(values);
        return b;
    }

    public double get(String key) {
        return values.getOrDefault(key, 0.0);
    }

    public void set(String key, double value) {
        values.put(key, value);
    }

    public void add(String key, double delta) {
        values.put(key, get(key) + delta);
    }

    public void merge(@Nullable MageBonuses src) {
        if (src == null) {
            return;
        }
        for (Map.Entry<String, Double> e : src.values.entrySet()) {
            if (e.getValue() != null && e.getValue() != 0) {
                add(e.getKey(), e.getValue());
            }
        }
    }

    public void mergeMap(@Nullable Map<String, Double> src) {
        if (src == null) {
            return;
        }
        for (Map.Entry<String, Double> e : src.entrySet()) {
            if (e.getValue() != null && e.getValue() != 0) {
                add(e.getKey(), e.getValue());
            }
        }
    }

    /** Zero potential fields so they are not double-counted on totals. */
    public MageBonuses withoutPotential() {
        MageBonuses b = copy();
        b.set("magePotential", 0);
        b.set("bodyPotential", 0);
        return b;
    }

    public Map<String, Double> asMap() {
        return Map.copyOf(values);
    }

    public boolean hasAnyStat() {
        for (String k : MagePointDefs.ALL_STAT_KEYS) {
            if (get(k) != 0) {
                return true;
            }
        }
        return false;
    }
}
