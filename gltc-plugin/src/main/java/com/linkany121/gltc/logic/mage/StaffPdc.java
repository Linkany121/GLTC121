package com.linkany121.gltc.logic.mage;

import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Staff PDC + lore sync ({@code gltc/staff_*}). Shared by converter and future cast logic.
 */
public final class StaffPdc {

    public static final String STAFF_ID = "VASA_通用施术道具";

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    public static final int MAX_SPELL_SLOTS = 6;  // 法杖最大术式槽位数。改大需同步调整施术 GUI 布局（StaffCastLogic 的 SLOT_SPELL_*）及 CORES 中各核心槽数

    public static final NamespacedKey KEY_SPELLS = new NamespacedKey("gltc", "staff_spells");
    public static final NamespacedKey KEY_SELECTED = new NamespacedKey("gltc", "staff_selected");
    public static final NamespacedKey KEY_SKILL_CORE = new NamespacedKey("gltc", "staff_skill_core");
    public static final NamespacedKey KEY_SPELL_ID = new NamespacedKey("gltc", "spell_id");
    public static final NamespacedKey KEY_GUI_PLACEHOLDER = new NamespacedKey("gltc", "engraving_placeholder");

    private static final NamespacedKey SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
    private static final Pattern HEX_AMP = Pattern.compile("&#([0-9a-fA-F]{6})");
    private static final Pattern AMP_CODE = Pattern.compile("&([0-9a-fk-or])", Pattern.CASE_INSENSITIVE);
    private static final Pattern STRIP_HEX = Pattern.compile("§x(§[0-9a-fA-F]){6}");
    private static final Pattern STRIP_CODE = Pattern.compile("§.");

    private static final Map<String, CoreDef> CORES;  // 技能核心定义表：核心物品ID → CoreDef(显示名, 可刻录术式槽数, 技能ID)

    static {
        Map<String, CoreDef> map = new LinkedHashMap<>();
        map.put("VASA_施术技能核心_入门", new CoreDef("入门", 2, null));           // 入门核心：2 术式槽，无绑定技能
        map.put("VASA_施术技能核心_辉墨摇篮", new CoreDef("辉墨摇篮", 6, "light_ruin")); // 辉墨摇篮核心：6 术式槽，绑定光影废墟技能
        // 新增核心：在此追加一行，并在 items.yml / GltcItemsRegistry 添加对应物品
        CORES = Collections.unmodifiableMap(map);
    }

    private StaffPdc() {
    }

    public static Map<String, CoreDef> cores() {
        return CORES;
    }

    public static boolean isStaffId(@Nullable String id) {
        return STAFF_ID.equals(id);
    }

    public static boolean isSkillCoreId(@Nullable String id) {
        return id != null && CORES.containsKey(id);
    }

    public static int spellSlotsForCore(@Nullable String coreId) {
        if (coreId == null) {
            return 0;
        }
        CoreDef def = CORES.get(coreId);
        return def != null ? def.spellSlots() : 0;
    }

    @Nullable
    public static String getSlimefunId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null) {
                PersistentDataContainer pdc = meta.getPersistentDataContainer();
                if (pdc.has(SF_ITEM_KEY, PersistentDataType.STRING)) {
                    return pdc.get(SF_ITEM_KEY, PersistentDataType.STRING);
                }
            }
        } catch (Throwable ignored) {
        }
        try {
            SlimefunItem sf = SlimefunItem.getByItem(stack);
            return sf != null ? sf.getId() : null;
        } catch (Throwable t) {
            return null;
        }
    }

    public static boolean isStaff(@Nullable ItemStack stack) {
        return isStaffId(getSlimefunId(stack));
    }

    public static boolean isSkillCore(@Nullable ItemStack stack) {
        return isSkillCoreId(getSlimefunId(stack));
    }

    /**
     * Spell carrier: {@code VASA_*} excluding staff / cores / terminals / converter / UGW modules.
     * Prefer optional PDC {@code gltc:spell_id}, else slimefun id.
     */
    public static boolean isSpellCarrier(@Nullable ItemStack stack) {
        return resolveSpellId(stack) != null;
    }

    @Nullable
    public static String resolveSpellId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        String fromPdc = readSpellIdPdc(stack);
        if (fromPdc != null && isSpellCarrierId(fromPdc)) {
            return fromPdc;
        }
        String id = getSlimefunId(stack);
        return isSpellCarrierId(id) ? id : null;
    }

    public static boolean isSpellCarrierId(@Nullable String id) {
        if (id == null || !id.startsWith("VASA_")) {
            return false;
        }
        if (isStaffId(id) || isSkillCoreId(id) || id.startsWith("VASA_施术技能核心")) {
            return false;
        }
        if ("VASA_驭粒终端".equals(id) || "VASA_彼岸钢调控终端".equals(id)) {
            return false;
        }
        if ("VASA_术式承载转换仪".equals(id)) {
            return false;
        }
        // UGW modules: VASA_uA01 / VASA_uE011 …
        if (id.length() > 6 && id.charAt(5) == 'u') {
            char t = id.charAt(6);
            if (t >= 'A' && t <= 'E') {
                return false;
            }
        }
        return true;
    }

    @Nullable
    public static StaffData read(@Nullable ItemStack stack) {
        if (!isStaff(stack)) {
            return null;
        }
        String coreId = null;
        String[] spells = new String[MAX_SPELL_SLOTS];
        int selected = 0;
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null) {
                PersistentDataContainer pdc = meta.getPersistentDataContainer();
                if (pdc.has(KEY_SKILL_CORE, PersistentDataType.STRING)) {
                    String v = pdc.get(KEY_SKILL_CORE, PersistentDataType.STRING);
                    if (v != null && !v.isBlank()) {
                        coreId = v.trim();
                    }
                }
                if (pdc.has(KEY_SPELLS, PersistentDataType.STRING)) {
                    spells = parseSpellsRaw(pdc.get(KEY_SPELLS, PersistentDataType.STRING));
                }
                if (pdc.has(KEY_SELECTED, PersistentDataType.INTEGER)) {
                    Integer sel = pdc.get(KEY_SELECTED, PersistentDataType.INTEGER);
                    selected = sel != null ? sel : 0;
                }
            }
        } catch (Throwable ignored) {
        }
        int capacity = spellSlotsForCore(coreId);
        if (selected < 0 || selected >= capacity || spells[selected] == null || spells[selected].isEmpty()) {
            int filled = firstFilledIndex(spells, capacity);
            selected = filled >= 0 ? filled : 0;
        }
        return new StaffData(coreId, capacity, spells, selected);
    }

    public static boolean writeSpells(ItemStack stack, String[] spells, int selected) {
        if (stack == null) {
            return false;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return false;
        }
        PersistentDataContainer pdc = meta.getPersistentDataContainer();
        pdc.set(KEY_SPELLS, PersistentDataType.STRING, serializeSpells(spells));
        if (selected >= 0) {
            pdc.set(KEY_SELECTED, PersistentDataType.INTEGER, selected);
        } else {
            try {
                pdc.remove(KEY_SELECTED);
            } catch (Throwable ignored) {
            }
        }
        stack.setItemMeta(meta);
        syncLore(stack, read(stack));
        return true;
    }

    /** Update selected spell index; keeps existing spell list. */
    public static boolean writeSelected(ItemStack stack, int selected) {
        StaffData data = read(stack);
        if (data == null) {
            return false;
        }
        return writeSpells(stack, data.spells(), selected);
    }

    public static boolean writeSkillCore(ItemStack stack, @Nullable String skillCoreId) {
        if (stack == null) {
            return false;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return false;
        }
        PersistentDataContainer pdc = meta.getPersistentDataContainer();
        if (skillCoreId != null && !skillCoreId.isBlank()) {
            pdc.set(KEY_SKILL_CORE, PersistentDataType.STRING, skillCoreId.trim());
        } else {
            try {
                pdc.remove(KEY_SKILL_CORE);
            } catch (Throwable ignored) {
            }
        }
        stack.setItemMeta(meta);
        syncLore(stack, read(stack));
        return true;
    }

    public static void syncLore(ItemStack stack, @Nullable StaffData data) {
        if (data == null) {
            syncLore(stack, null, new String[MAX_SPELL_SLOTS], 0);
            return;
        }
        syncLore(stack, data.skillCoreId(), data.spells(), data.capacity());
    }

    public static void syncLore(
        ItemStack stack,
        @Nullable String skillCoreId,
        String[] spells,
        int capacity
    ) {
        if (stack == null) {
            return;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return;
        }
        List<String> old = meta.hasLore() ? meta.getLore() : null;
        List<String> before = new ArrayList<>();
        List<String> after = new ArrayList<>();
        int phase = 0;
        if (old != null) {
            for (String raw : old) {
                String plain = stripColor(raw);
                if (phase == 0) {
                    if (plain.contains("当前核心") || plain.contains("已刻录术式")) {
                        phase = 1;
                        continue;
                    }
                    before.add(raw);
                } else if (phase == 1) {
                    if (plain.contains("当前核心") || plain.contains("已刻录术式")) {
                        continue;
                    }
                    if (isSpellSlotLorePlain(plain)) {
                        continue;
                    }
                    phase = 2;
                    after.add(raw);
                } else {
                    after.add(raw);
                }
            }
        }
        List<String> rebuilt = new ArrayList<>(before);
        rebuilt.add(coreLoreLine(skillCoreId));
        rebuilt.add("§f[§e已刻录术式§f]：");
        if (capacity <= 0) {
            rebuilt.add("§f[§8未嵌入核心§f]§f");
        } else {
            for (int i = 0; i < capacity; i++) {
                String sid = spells != null && i < spells.length ? spells[i] : null;
                rebuilt.add(spellSlotLoreLine(sid));
            }
        }
        rebuilt.addAll(after);
        meta.setLore(rebuilt);
        stack.setItemMeta(meta);
    }

    public static ItemStack markPlaceholder(ItemStack stack) {
        if (stack == null) {
            return null;
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return stack;
        }
        meta.getPersistentDataContainer().set(KEY_GUI_PLACEHOLDER, PersistentDataType.BYTE, (byte) 1);
        stack.setItemMeta(meta);
        return stack;
    }

    public static boolean hasPlaceholderMark(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta == null) {
                return false;
            }
            return meta.getPersistentDataContainer().has(KEY_GUI_PLACEHOLDER, PersistentDataType.BYTE);
        } catch (Throwable t) {
            return false;
        }
    }

    @Nullable
    public static ItemStack createSfClone(@Nullable String id) {
        if (id == null || id.isBlank()) {
            return null;
        }
        try {
            SlimefunItem sf = SlimefunItem.getById(id);
            if (sf == null) {
                return null;
            }
            ItemStack item = sf.getItem().clone();
            item.setAmount(1);
            return item;
        } catch (Throwable t) {
            return null;
        }
    }

    public static String displayNameOf(@Nullable String id, String fallback) {
        try {
            SlimefunItem sf = SlimefunItem.getById(id);
            if (sf != null) {
                ItemMeta meta = sf.getItem().getItemMeta();
                if (meta != null && meta.hasDisplayName()) {
                    String shortName = shortItemDisplayName(meta.getDisplayName());
                    if (!stripColor(shortName).isBlank()) {
                        return shortName;
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        if (fallback != null && !fallback.isBlank()) {
            return fallback;
        }
        return id != null ? id : "";
    }

    public static String coreDisplayName(@Nullable String coreId) {
        if (coreId == null) {
            return "";
        }
        CoreDef def = CORES.get(coreId);
        String fb = def != null ? def.name() : coreId;
        return displayNameOf(coreId, fb);
    }

    public static String spellDisplayName(@Nullable String spellId) {
        return displayNameOf(spellId, spellId);
    }

    public static String colorize(String input) {
        if (input == null) {
            return "";
        }
        Matcher hex = HEX_AMP.matcher(input);
        StringBuffer sb = new StringBuffer();
        while (hex.find()) {
            String h = hex.group(1);
            StringBuilder r = new StringBuilder("§x");
            for (int i = 0; i < 6; i++) {
                r.append('§').append(h.charAt(i));
            }
            hex.appendReplacement(sb, Matcher.quoteReplacement(r.toString()));
        }
        hex.appendTail(sb);
        return AMP_CODE.matcher(sb.toString()).replaceAll("§$1");
    }

    public static String stripColor(String str) {
        if (str == null) {
            return "";
        }
        return STRIP_CODE.matcher(STRIP_HEX.matcher(str).replaceAll("")).replaceAll("");
    }

    public static String[] parseSpellsRaw(@Nullable String raw) {
        String[] spells = new String[MAX_SPELL_SLOTS];
        Arrays.fill(spells, null);
        if (raw == null) {
            return spells;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return spells;
        }
        if (trimmed.startsWith("[")) {
            String inner = trimmed.endsWith("]")
                ? trimmed.substring(1, trimmed.length() - 1)
                : trimmed.substring(1);
            List<String> parts = splitCsvRespectingQuotes(inner);
            for (int i = 0; i < MAX_SPELL_SLOTS && i < parts.size(); i++) {
                String v = parts.get(i).trim();
                if (v.startsWith("\"") && v.endsWith("\"") && v.length() >= 2) {
                    v = v.substring(1, v.length() - 1);
                }
                spells[i] = v.isEmpty() || "null".equalsIgnoreCase(v) ? null : v;
            }
            return spells;
        }
        String[] parts = trimmed.split(",", -1);
        for (int i = 0; i < MAX_SPELL_SLOTS && i < parts.length; i++) {
            String v = parts[i].trim();
            spells[i] = v.isEmpty() ? null : v;
        }
        return spells;
    }

    public static String serializeSpells(String[] spells) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < MAX_SPELL_SLOTS; i++) {
            if (i > 0) {
                sb.append(',');
            }
            if (spells != null && i < spells.length && spells[i] != null && !spells[i].isEmpty()) {
                sb.append(spells[i]);
            }
        }
        return sb.toString();
    }

    private static List<String> splitCsvRespectingQuotes(String inner) {
        List<String> parts = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuote = false;
        for (int i = 0; i < inner.length(); i++) {
            char c = inner.charAt(i);
            if (c == '"') {
                inQuote = !inQuote;
                cur.append(c);
            } else if (c == ',' && !inQuote) {
                parts.add(cur.toString());
                cur.setLength(0);
            } else {
                cur.append(c);
            }
        }
        parts.add(cur.toString());
        return parts;
    }

    private static int firstFilledIndex(String[] spells, int capacity) {
        for (int i = 0; i < capacity; i++) {
            if (spells[i] != null && !spells[i].isEmpty()) {
                return i;
            }
        }
        return -1;
    }

    @Nullable
    private static String readSpellIdPdc(ItemStack stack) {
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta == null) {
                return null;
            }
            PersistentDataContainer pdc = meta.getPersistentDataContainer();
            if (!pdc.has(KEY_SPELL_ID, PersistentDataType.STRING)) {
                return null;
            }
            String v = pdc.get(KEY_SPELL_ID, PersistentDataType.STRING);
            return v != null && !v.isBlank() ? v.trim() : null;
        } catch (Throwable t) {
            return null;
        }
    }

    private static String coreLoreLine(@Nullable String coreId) {
        if (coreId == null || coreId.isBlank()) {
            return "§f[当前核心] §7未镶嵌核心";
        }
        return "§f[当前核心] " + coreDisplayName(coreId);
    }

    private static String spellSlotLoreLine(@Nullable String spellId) {
        if (spellId == null || spellId.isEmpty()) {
            return "§f[§7未刻录§f]§f";
        }
        return "§f[" + spellDisplayName(spellId) + "§f]";
    }

    private static boolean isSpellSlotLorePlain(String plain) {
        if (plain == null || plain.isEmpty()) {
            return false;
        }
        if (plain.contains("未刻录") || plain.contains("未嵌入核心")) {
            return true;
        }
        if (plain.contains("已刻录术式") || plain.contains("当前核心")) {
            return false;
        }
        return plain.trim().matches("\\[[^\\]]*]");
    }

    private static String shortItemDisplayName(String coloredDn) {
        String dn = coloredDn == null ? "" : coloredDn;
        int sep = dn.indexOf('丨');
        if (sep < 0) {
            sep = dn.indexOf('|');
        }
        if (sep >= 0) {
            return dn.substring(sep + 1).replaceFirst("^\\s+", "");
        }
        String plain = stripColor(dn);
        for (String pref : List.of("施术技能核心", "术式载体")) {
            int at = plain.indexOf(pref);
            if (at < 0) {
                continue;
            }
            int need = at + pref.length();
            int ci = 0;
            int pc = 0;
            while (ci < dn.length() && pc < need) {
                if (dn.charAt(ci) == '§') {
                    if (ci + 1 < dn.length() && (dn.charAt(ci + 1) == 'x' || dn.charAt(ci + 1) == 'X')) {
                        ci = Math.min(dn.length(), ci + 14);
                    } else {
                        ci = Math.min(dn.length(), ci + 2);
                    }
                    continue;
                }
                pc++;
                ci++;
            }
            return dn.substring(ci).replaceFirst("^\\s+", "");
        }
        return dn;
    }

    public record CoreDef(String name, int spellSlots, @Nullable String skillId) {
    }

    public record StaffData(
        @Nullable String skillCoreId,
        int capacity,
        String[] spells,
        int selected
    ) {
        public StaffData {
            if (spells == null) {
                spells = new String[MAX_SPELL_SLOTS];
            } else if (spells.length != MAX_SPELL_SLOTS) {
                String[] copy = new String[MAX_SPELL_SLOTS];
                System.arraycopy(spells, 0, copy, 0, Math.min(spells.length, MAX_SPELL_SLOTS));
                spells = copy;
            }
        }

        public int findEmptySlot() {
            for (int i = 0; i < capacity; i++) {
                if (spells[i] == null || spells[i].isEmpty()) {
                    return i;
                }
            }
            return -1;
        }

        public boolean containsSpell(String spellId) {
            if (spellId == null) {
                return false;
            }
            for (int i = 0; i < capacity; i++) {
                if (spellId.equals(spells[i])) {
                    return true;
                }
            }
            return false;
        }
    }
}
