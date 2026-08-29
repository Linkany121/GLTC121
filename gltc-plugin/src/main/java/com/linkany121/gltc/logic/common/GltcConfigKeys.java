package com.linkany121.gltc.logic.common;

/** Keys in {@code plugins/GLTC/config.yml}. */
public final class GltcConfigKeys {

    // ===== 配置区（对应 plugins/GLTC/config.yml 的键与默认值）=====
    // 改动方式：在 config.yml 中按同名字段设置值即可，无需改代码；不写则用下方 *_DEFAULT 默认值。
    public static final String PARTICLE_CONCENTRATION = "ParticleConcentration";  // 全局粒子浓度（术式伤害乘数），默认 1.0，可 0.01~100
    public static final String STARBYSS_ADJUSTMENT = "StarbyssAdjustment";        // 异能强度 SIT（枪械/异能武器基础伤害白值），默认 10
    public static final String DAMAGE_NOTIFY_MODE = "DamageNotifyMode";           // 伤害提示模式：chat / actionbar / none

    public static final double PARTICLE_CONCENTRATION_DEFAULT = 1.0;   // 默认粒子浓度：1.0 = 不增不减
    public static final int STARBYSS_ADJUSTMENT_DEFAULT = 10;          // 默认异能强度：10（最终伤害 = 倍率 × SIT）
    public static final String DAMAGE_NOTIFY_MODE_DEFAULT = "chat";    // 默认伤害提示：聊天框

    private GltcConfigKeys() {
    }
}
