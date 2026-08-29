package com.linkany121.gltc.logic.mage;

import javax.annotation.Nullable;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Potential spend tables + hard caps (from {@code 核心.js}).
 */
public final class MagePointDefs {

    // ===== 配置区（潜能表 + 属性硬上限，改完需重新打包 jar 并重启生效）=====
    /** 术士等级 → 升级时发放的潜能点（下标=等级，值=发放点数；当前未启用）。 */
    public static final int[] LEVEL_POTENTIAL = {0, 8, 4, 4, 10, 4, 4, 10, 12};  // 例：升到 1 级发 8 点、5 级发 4 点

    public static final Map<String, Double> HARD_CAPS = Map.of(  // 各属性全局硬上限（改动直接改数值）
        "cardiovascular", 0.99,       // 心血管强度 ≤ 99%（冷却减免不会超过 99%）
        "particleRefraction", 0.95,   // 粒子折射 ≤ 95%（粒子减伤上限）
        "finalDamageReduction", 0.90, // 最终减伤 ≤ 90%
        "armor", 160.0,               // 骨骼结构（护甲）≤ 160
        "toughness", 60.0             // 体态掌控（韧性）≤ 60
    );

    public static final Map<String, PointOpt> MAGE_POINT_OPTIONS;
    public static final Map<String, PointOpt> BODY_POINT_OPTIONS;
    public static final List<String> ALL_STAT_KEYS;

    static {
        // PointOpt(显示名, 每点效果, 每属性可加点数上限)；null 表示无上限。改动调整两个数值即可。
        Map<String, PointOpt> mage = new LinkedHashMap<>();
        mage.put("particlePower", new PointOpt("粒子强度", 0.1, null));         // 每点 +0.1，无上限，影响最终伤害
        mage.put("cardiovascular", new PointOpt("心血管强度", 0.01, 32));       // 每点 +0.01，上限 32 点，减少术式冷却
        mage.put("particleRefraction", new PointOpt("粒子折射", 0.02, 24));     // 每点 +0.02，上限 24 点，减少所受粒子伤害
        mage.put("finalDamageReduction", new PointOpt("最终减伤", 0.02, 24));   // 每点 +0.02，上限 24 点，减少所受常规/粒子伤害
        MAGE_POINT_OPTIONS = Map.copyOf(mage);

        Map<String, PointOpt> body = new LinkedHashMap<>();
        body.put("meleeDamage", new PointOpt("筋力解放", 0.6, null));   // 每点 +0.6，无上限，近战伤害白值
        body.put("maxHealth", new PointOpt("肌脂提升", 8.0, null));     // 每点 +8.0，无上限，最大生命白值
        body.put("armor", new PointOpt("骨骼结构", 2.0, 16));           // 每点 +2.0，上限 16 点
        body.put("toughness", new PointOpt("体态掌控", 0.4, 25));       // 每点 +0.4，上限 25 点
        body.put("speed", new PointOpt("心肺强化", 0.005, 48));         // 每点 +0.005，上限 48 点，移动速度白值
        body.put("reach", new PointOpt("体态协调", 0.1, null));         // 每点 +0.1，无上限，手长白值
        BODY_POINT_OPTIONS = Map.copyOf(body);

        java.util.ArrayList<String> keys = new java.util.ArrayList<>(MAGE_POINT_OPTIONS.keySet());
        keys.addAll(BODY_POINT_OPTIONS.keySet());
        ALL_STAT_KEYS = List.copyOf(keys);
    }

    private MagePointDefs() {
    }

    public static String spentField(String statKey) {
        return statKey + "Spent";
    }

    @Nullable
    public static PointOpt option(String pool, String statKey) {
        if ("body".equals(pool)) {
            return BODY_POINT_OPTIONS.get(statKey);
        }
        return MAGE_POINT_OPTIONS.get(statKey);
    }

    @Nullable
    public static PointOpt optionAny(String statKey) {
        PointOpt m = MAGE_POINT_OPTIONS.get(statKey);
        return m != null ? m : BODY_POINT_OPTIONS.get(statKey);
    }

    public static boolean isPercentStat(String statKey) {
        return "cardiovascular".equals(statKey)
            || "particleRefraction".equals(statKey)
            || "finalDamageReduction".equals(statKey);
    }

    public static double clampHard(String statKey, double v) {
        if (!Double.isFinite(v) || v < 0) {
            v = 0;
        }
        Double cap = HARD_CAPS.get(statKey);
        if (cap != null && v > cap) {
            return cap;
        }
        return v;
    }

    public record PointOpt(String label, double per, @Nullable Integer maxPoints) {
    }
}
