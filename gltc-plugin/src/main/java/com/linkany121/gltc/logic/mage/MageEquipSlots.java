package com.linkany121.gltc.logic.mage;

import javax.annotation.Nullable;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Equip slot defs + simple-UGW registry (from {@code 装备加成.js}).
 */
public final class MageEquipSlots {

    // ===== 配置区（术士装备槽 + 简易 UGW 组件加成表，改完需重新打包重启）=====
    public static final int SEPARATOR_GUI_SLOT = 37;  // 驭粒终端 54 格面板中分隔符玻璃的位置

    // 装备槽定义：每项 = new SlotDef(槽位key, GUI槽位, 类型, 显示名, 头颅hash)。
    //   36 潜能激发模组 / 38 核心心区组件 / 39 生控中枢组件 / 40 粒术中转组件 / 41~44 术式辅助组件 I~IV。
    // 调整装备槽数量/位置时改这里，需同步驭粒终端面板（YuLiTerminalLogic）。
    public static final List<SlotDef> SLOTS = List.of(
        new SlotDef("potential", 36, "potential", "潜能激发模组",
            "2933ccaaeefa83a61f5f3fc9430a708d577890960709c7b9c66f2150bd523561"),
        new SlotDef("core_heart", 38, "core_heart", "核心心区组件",
            "f78d374329d3add928b778b587509c082b8d286aef42309d8f69e6ba2967f908"),
        new SlotDef("bio_hub", 39, "bio_hub", "生控中枢组件",
            "ecf682be108d1c9d14b54de18f0bf4f48eb4c39a51ef657501da7fbec3102145"),
        new SlotDef("particle_hub", 40, "particle_hub", "粒术中转组件",
            "6c34d12f7ac939b1151d12146d0239ef0188e403ee1966d3db199e664ff38283"),
        new SlotDef("assist_1", 41, "assist", "术式辅助组件 · I",
            "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba"),
        new SlotDef("assist_2", 42, "assist", "术式辅助组件 · II",
            "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba"),
        new SlotDef("assist_3", 43, "assist", "术式辅助组件 · III",
            "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba"),
        new SlotDef("assist_4", 44, "assist", "术式辅助组件 · IV",
            "f340d50d7d1293ba16d23c6d07ab066cdc1575c68bca69e96f0bb6d1ce1bf1ba")
    );

    public static final Map<String, String> CATEGORY_NAMES = Map.of(  // 组件类型 → 面板显示名
        "potential", "A · 潜能模组",
        "core_heart", "B · 核心心区组件",
        "bio_hub", "C · 生控中枢组件",
        "particle_hub", "D · 粒术中转组件",
        "assist", "E · 术式辅助组件"
    );

    public static final Map<String, String> CATEGORY_LETTER = Map.of(  // 组件类型 → 首字母
        "potential", "A",
        "core_heart", "B",
        "bio_hub", "C",
        "particle_hub", "D",
        "assist", "E"
    );

    public static final Map<Character, String> LETTER_TO_CATEGORY = Map.of(  // 首字母 → 组件类型（按 UGW 物品 ID 首字母识别）
        'A', "potential",
        'B', "core_heart",
        'C', "bio_hub",
        'D', "particle_hub",
        'E', "assist"
    );

    // 简易 UGW 组件加成表：组件 Slimefun ID → GearEntry(类型, 显示名, 属性加成)。
    // 加成键与 MagePointDefs 属性一致（magePotential=1.0 = 提供 1 点术士潜能）。
    // 要加新组件：在此追加一行；要调加成：直接改 Map 数值。
    private static final Map<String, GearEntry> GEAR_REGISTRY;

    static {
        Map<String, GearEntry> reg = new LinkedHashMap<>();
        // —— 学徒 H1 制式（新手组件）——
        reg.put("VASA_uA01", new GearEntry("potential", "学徒H1制式脑丘激活器",
            Map.of("magePotential", 1.0, "bodyPotential", 1.0)));
        reg.put("VASA_uB01", new GearEntry("core_heart", "学徒H1制式心脉稳定器",
            Map.of("cardiovascular", 0.05, "speed", 0.01)));
        reg.put("VASA_uC01", new GearEntry("bio_hub", "学徒H1制式脖脊辅助器",
            Map.of("finalDamageReduction", 0.05, "armor", 5.0)));
        reg.put("VASA_uD01", new GearEntry("particle_hub", "学徒H1制式腕部血管镀层",
            Map.of("particlePower", 0.1, "particleRefraction", 0.05)));
        reg.put("VASA_uE011", new GearEntry("assist", "学徒H1制式防护片",
            Map.of("armor", 3.0, "toughness", 3.0)));
        reg.put("VASA_uE012", new GearEntry("assist", "学徒H1制式肋间刺激器",
            Map.of("particlePower", 0.1, "meleeDamage", 3.0)));

        // —— 微光集训制式（进阶组件）——
        reg.put("VASA_uA02", new GearEntry("potential", "微光集训制式脑丘激活器",
            Map.of("magePotential", 3.0, "bodyPotential", 2.0)));
        reg.put("VASA_uB02", new GearEntry("core_heart", "微光集训制式心肺泵",
            Map.of("cardiovascular", 0.10, "speed", 0.01, "maxHealth", 10.0)));
        reg.put("VASA_uC02", new GearEntry("bio_hub", "微光集训制式脊椎软体",
            Map.of("armor", 8.0, "toughness", 8.0)));
        reg.put("VASA_uD02", new GearEntry("particle_hub", "微光集训制式附腕回路",
            Map.of("particlePower", 0.4, "particleRefraction", 0.10)));
        reg.put("VASA_uE021", new GearEntry("assist", "微光集训制式场维持器",
            Map.of("finalDamageReduction", 0.04, "particleRefraction", 0.03)));
        reg.put("VASA_uE022", new GearEntry("assist", "微光集训制式肋间刺激器",
            Map.of("particlePower", 0.2, "speed", 0.004)));
        GEAR_REGISTRY = Collections.unmodifiableMap(reg);
    }

    private MageEquipSlots() {
    }

    public static int slotCount() {
        return SLOTS.size();
    }

    @Nullable
    public static SlotDef slotDef(int index) {
        if (index < 0 || index >= SLOTS.size()) {
            return null;
        }
        return SLOTS.get(index);
    }

    public static int equipIndexByGui(int guiSlot) {
        for (int i = 0; i < SLOTS.size(); i++) {
            if (SLOTS.get(i).gui() == guiSlot) {
                return i;
            }
        }
        return -1;
    }

    public static Map<String, GearEntry> gearRegistry() {
        return GEAR_REGISTRY;
    }

    @Nullable
    public static GearEntry getGearEntry(@Nullable String itemId) {
        if (itemId == null || itemId.isEmpty()) {
            return null;
        }
        GearEntry direct = GEAR_REGISTRY.get(itemId);
        if (direct != null) {
            return direct;
        }
        String lower = itemId.toLowerCase(Locale.ROOT);
        for (Map.Entry<String, GearEntry> e : GEAR_REGISTRY.entrySet()) {
            if (e.getKey().toLowerCase(Locale.ROOT).equals(lower)) {
                return e.getValue();
            }
        }
        return null;
    }

    public record SlotDef(String key, int gui, String category, String label, String skullHash) {
    }

    public record GearEntry(String category, String name, Map<String, Double> bonuses) {
        public GearEntry {
            bonuses = bonuses == null ? Map.of() : Map.copyOf(bonuses);
        }
    }
}
