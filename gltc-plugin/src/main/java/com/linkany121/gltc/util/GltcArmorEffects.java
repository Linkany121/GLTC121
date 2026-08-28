package com.linkany121.gltc.util;

import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;
import org.bukkit.NamespacedKey;
import org.bukkit.Registry;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.logging.Level;

/**
 * Armor potion effect parsing — mirrors RSC ArmorReader.
 */
public final class GltcArmorEffects {

    private GltcArmorEffects() {
    }

    public static PotionEffect[] of(String... effectSpecs) {
        if (effectSpecs == null || effectSpecs.length == 0) {
            return new PotionEffect[0];
        }
        int durationTicks = armorEffectDurationTicks();
        List<PotionEffect> effects = new ArrayList<>();
        for (String spec : effectSpecs) {
            if (spec == null || spec.isBlank()) {
                continue;
            }
            String[] split = spec.trim().split("\\s+");
            if (split.length != 2) {
                continue;
            }
            PotionEffectType type = resolveEffectType(split[0]);
            if (type == null) {
                continue;
            }
            int amplifier;
            try {
                amplifier = Integer.parseInt(split[1]);
            } catch (NumberFormatException ex) {
                continue;
            }
            if (amplifier < 0) {
                continue;
            }
            effects.add(new PotionEffect(type, durationTicks, amplifier));
        }
        return effects.toArray(PotionEffect[]::new);
    }

    private static PotionEffectType resolveEffectType(String raw) {
        String key = raw.trim().toLowerCase(Locale.ROOT).replace(' ', '_');
        PotionEffectType type = Registry.POTION_EFFECT_TYPE.get(NamespacedKey.minecraft(key));
        if (type != null) {
            return type;
        }
        return PotionEffectType.getByName(raw.trim().toUpperCase(Locale.ROOT));
    }

    private static int armorEffectDurationTicks() {
        int interval = 10;
        try {
            interval = Slimefun.getCfg().getInt("options.armor-update-interval");
        } catch (Throwable ex) {
            var plugin = com.linkany121.gltc.GltcPlugin.getInstance();
            if (plugin != null) {
                plugin.getLogger().log(Level.WARNING, "[Armor] 读取 armor-update-interval 失败，使用默认 10", ex);
            }
        }
        return (interval + 3) * 20;
    }
}
