package com.linkany121.gltc.logic.mage;

import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 生物类型 → 中文名（术式伤害播报 / 死亡播报共用）。
 */
public final class EntityNameZh {

    private static final Map<String, String> ZH = build();

    private EntityNameZh() {
    }

    private static Map<String, String> build() {
        Map<String, String> map = new LinkedHashMap<>();
        // 亡灵
        map.put("ZOMBIE", "僵尸");
        map.put("HUSK", "尸壳");
        map.put("DROWNED", "溺尸");
        map.put("ZOMBIE_VILLAGER", "僵尸村民");
        map.put("ZOMBIE_HORSE", "僵尸马");
        map.put("SKELETON", "骷髅");
        map.put("STRAY", "流浪者");
        map.put("WITHER_SKELETON", "凋灵骷髅");
        map.put("SKELETON_HORSE", "骷髅马");
        map.put("PHANTOM", "幻翼");
        map.put("WITHER", "凋灵");
        map.put("ZOMBIFIED_PIGLIN", "僵尸猪灵");
        map.put("ZOGLIN", "僵尸疣猪兽");
        // 主动敌对
        map.put("CREEPER", "苦力怕");
        map.put("SPIDER", "蜘蛛");
        map.put("CAVE_SPIDER", "洞穴蜘蛛");
        map.put("ENDERMAN", "末影人");
        map.put("ENDERMITE", "末影螨");
        map.put("SHULKER", "潜影贝");
        map.put("BLAZE", "烈焰人");
        map.put("GHAST", "恶魂");
        map.put("SILVERFISH", "蠹虫");
        map.put("SLIME", "史莱姆");
        map.put("MAGMA_CUBE", "岩浆怪");
        map.put("GUARDIAN", "守卫者");
        map.put("ELDER_GUARDIAN", "远古守卫者");
        map.put("ENDER_DRAGON", "末影龙");
        map.put("WARDEN", "监守者");
        // 灾厄村民
        map.put("PILLAGER", "掠夺者");
        map.put("VINDICATOR", "卫道士");
        map.put("EVOKER", "唤魔者");
        map.put("VEX", "恼鬼");
        map.put("RAVAGER", "劫掠兽");
        map.put("WITCH", "女巫");
        // 下界
        map.put("PIGLIN", "猪灵");
        map.put("PIGLIN_BRUTE", "猪灵蛮兵");
        map.put("HOGLIN", "疣猪兽");
        map.put("STRIDER", "炽足兽");
        // 中立 / 友好
        map.put("IRON_GOLEM", "铁傀儡");
        map.put("SNOW_GOLEM", "雪傀儡");
        map.put("BAT", "蝙蝠");
        map.put("BEE", "蜜蜂");
        map.put("CAT", "猫");
        map.put("CHICKEN", "鸡");
        map.put("COD", "鳕鱼");
        map.put("COW", "牛");
        map.put("DOLPHIN", "海豚");
        map.put("DONKEY", "驴");
        map.put("FOX", "狐狸");
        map.put("FROG", "青蛙");
        map.put("GLOW_SQUID", "发光鱿鱼");
        map.put("GOAT", "山羊");
        map.put("HORSE", "马");
        map.put("LLAMA", "羊驼");
        map.put("MOOSHROOM", "哞菇");
        map.put("MULE", "骡");
        map.put("OCELOT", "豹猫");
        map.put("PARROT", "鹦鹉");
        map.put("PIG", "猪");
        map.put("POLAR_BEAR", "北极熊");
        map.put("PUFFERFISH", "河豚");
        map.put("RABBIT", "兔子");
        map.put("SALMON", "鲑鱼");
        map.put("SHEEP", "羊");
        map.put("SQUID", "鱿鱼");
        map.put("TADPOLE", "蝌蚪");
        map.put("TROPICAL_FISH", "热带鱼");
        map.put("TURTLE", "海龟");
        map.put("WOLF", "狼");
        map.put("AXOLOTL", "美西螈");
        map.put("ALLAY", "悦灵");
        map.put("CAMEL", "骆驼");
        map.put("SNIFFER", "嗅探兽");
        // 1.21
        map.put("BREEZE", "旋风人");
        map.put("BOGGED", "沼骸");
        return Collections.unmodifiableMap(map);
    }

    /**
     * 目标显示名：自定义名 → 玩家名 → 类型中文映射 → 原版英文回退。
     */
    public static String name(LivingEntity entity) {
        if (entity == null) {
            return "目标";
        }
        try {
            if (entity.getCustomName() != null && !entity.getCustomName().isBlank()) {
                return entity.getCustomName();
            }
        } catch (Throwable ignored) {
        }
        if (entity instanceof Player p) {
            return p.getName();
        }
        try {
            String zh = ZH.get(entity.getType().name().toUpperCase(Locale.ROOT));
            if (zh != null) {
                return zh;
            }
        } catch (Throwable ignored) {
        }
        try {
            String n = entity.getName();
            if (n != null && !n.isBlank()) {
                return n;
            }
        } catch (Throwable ignored) {
        }
        try {
            return entity.getType().name().toLowerCase(Locale.ROOT);
        } catch (Throwable ignored) {
            return "目标";
        }
    }
}
