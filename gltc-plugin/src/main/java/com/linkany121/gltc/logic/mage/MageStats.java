package com.linkany121.gltc.logic.mage;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Persisted mage stats for one player (file base values; totals recomputed on save).
 */
public final class MageStats {

    // ===== 配置区（玩家存档字段，改动只影响新玩家默认值）=====
    public int mageLevel;          // 术士等级（钳制 0~8）
    public int proficiency;        // 驭粒熟练度（钳制 0~8）
    public int magePotential;      // 未分配术士潜能点
    public int bodyPotential;      // 未分配体能潜能点

    public double particlePower = 1;  // 粒子强度默认值，最终伤害 = 粒子强度 × 系数 × GLI，想改新档初始值改这里
    public int particlePowerSpent;    // 粒子强度已投入潜能点数
    // 其余 xxx / xxxSpent 为各属性当前值与其已投入潜能点数（单点效果见 MagePointDefs）
    public double cardiovascular;
    public int cardiovascularSpent;
    public double particleRefraction;
    public int particleRefractionSpent;
    public double finalDamageReduction;
    public int finalDamageReductionSpent;

    public double meleeDamage;
    public int meleeDamageSpent;
    public double maxHealth;
    public int maxHealthSpent;
    public double armor;
    public int armorSpent;
    public double toughness;
    public int toughnessSpent;
    public double speed;
    public int speedSpent;
    public double reach;
    public int reachSpent;

    /** Snapshot totals (base + equip), written for spell fallback readers. */
    public final Map<String, Double> totals = new LinkedHashMap<>();

    public static MageStats defaults() {
        return new MageStats();
    }

    public MageStats copy() {
        MageStats o = new MageStats();
        o.mageLevel = mageLevel;
        o.proficiency = proficiency;
        o.magePotential = magePotential;
        o.bodyPotential = bodyPotential;
        o.particlePower = particlePower;
        o.particlePowerSpent = particlePowerSpent;
        o.cardiovascular = cardiovascular;
        o.cardiovascularSpent = cardiovascularSpent;
        o.particleRefraction = particleRefraction;
        o.particleRefractionSpent = particleRefractionSpent;
        o.finalDamageReduction = finalDamageReduction;
        o.finalDamageReductionSpent = finalDamageReductionSpent;
        o.meleeDamage = meleeDamage;
        o.meleeDamageSpent = meleeDamageSpent;
        o.maxHealth = maxHealth;
        o.maxHealthSpent = maxHealthSpent;
        o.armor = armor;
        o.armorSpent = armorSpent;
        o.toughness = toughness;
        o.toughnessSpent = toughnessSpent;
        o.speed = speed;
        o.speedSpent = speedSpent;
        o.reach = reach;
        o.reachSpent = reachSpent;
        o.totals.putAll(totals);
        return o;
    }

    public void clampMeta() {
        mageLevel = Math.max(0, Math.min(8, mageLevel));
        proficiency = Math.max(0, Math.min(8, proficiency));
        magePotential = Math.max(0, magePotential);
        bodyPotential = Math.max(0, bodyPotential);
    }

    public double getStat(String key) {
        return switch (key) {
            case "particlePower" -> particlePower;
            case "cardiovascular" -> cardiovascular;
            case "particleRefraction" -> particleRefraction;
            case "finalDamageReduction" -> finalDamageReduction;
            case "meleeDamage" -> meleeDamage;
            case "maxHealth" -> maxHealth;
            case "armor" -> armor;
            case "toughness" -> toughness;
            case "speed" -> speed;
            case "reach" -> reach;
            default -> 0;
        };
    }

    public void setStat(String key, double value) {
        switch (key) {
            case "particlePower" -> particlePower = value;
            case "cardiovascular" -> cardiovascular = value;
            case "particleRefraction" -> particleRefraction = value;
            case "finalDamageReduction" -> finalDamageReduction = value;
            case "meleeDamage" -> meleeDamage = value;
            case "maxHealth" -> maxHealth = value;
            case "armor" -> armor = value;
            case "toughness" -> toughness = value;
            case "speed" -> speed = value;
            case "reach" -> reach = value;
            default -> {
            }
        }
    }

    public int getSpent(String key) {
        return switch (key) {
            case "particlePower" -> particlePowerSpent;
            case "cardiovascular" -> cardiovascularSpent;
            case "particleRefraction" -> particleRefractionSpent;
            case "finalDamageReduction" -> finalDamageReductionSpent;
            case "meleeDamage" -> meleeDamageSpent;
            case "maxHealth" -> maxHealthSpent;
            case "armor" -> armorSpent;
            case "toughness" -> toughnessSpent;
            case "speed" -> speedSpent;
            case "reach" -> reachSpent;
            default -> 0;
        };
    }

    public void setSpent(String key, int value) {
        int v = Math.max(0, value);
        switch (key) {
            case "particlePower" -> particlePowerSpent = v;
            case "cardiovascular" -> cardiovascularSpent = v;
            case "particleRefraction" -> particleRefractionSpent = v;
            case "finalDamageReduction" -> finalDamageReductionSpent = v;
            case "meleeDamage" -> meleeDamageSpent = v;
            case "maxHealth" -> maxHealthSpent = v;
            case "armor" -> armorSpent = v;
            case "toughness" -> toughnessSpent = v;
            case "speed" -> speedSpent = v;
            case "reach" -> reachSpent = v;
            default -> {
            }
        }
    }

    public void ensureSpentFields() {
        for (String sk : MagePointDefs.ALL_STAT_KEYS) {
            // getters already default to 0; no-op keep for API parity
            setSpent(sk, getSpent(sk));
        }
    }
}
