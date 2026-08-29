package com.linkany121.gltc.logic.common;

import com.linkany121.gltc.GltcPlugin;

/**
 * 异能强度 (SIT) from config — gun / ability weapon damage = multiplier × SIT.
 * 数值来源：config.yml 的 StarbyssAdjustment（见 GltcConfigKeys），改 config 即可调全服伤害。
 */
public final class GltcAbilityPower {

    private GltcAbilityPower() {
    }

    public static int getSit() {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return GltcConfigKeys.STARBYSS_ADJUSTMENT_DEFAULT;
        }
        return Math.max(0, plugin.getConfig().getInt(
            GltcConfigKeys.STARBYSS_ADJUSTMENT,
            GltcConfigKeys.STARBYSS_ADJUSTMENT_DEFAULT
        ));
    }

    public static double calcDamage(double multiplier) {
        return multiplier * getSit();
    }

    public static String formatDamage(double damage) {
        double rounded = Math.round(damage * 10.0) / 10.0;
        if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
            return String.valueOf(Math.round(rounded));
        }
        return String.format("%.1f", rounded);
    }

    public static double getParticleConcentration() {
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return GltcConfigKeys.PARTICLE_CONCENTRATION_DEFAULT;
        }
        double v = plugin.getConfig().getDouble(
            GltcConfigKeys.PARTICLE_CONCENTRATION,
            GltcConfigKeys.PARTICLE_CONCENTRATION_DEFAULT
        );
        if (v < 0.01) {
            return 0.01;
        }
        if (v > 100) {
            return 100;
        }
        return v;
    }
}
