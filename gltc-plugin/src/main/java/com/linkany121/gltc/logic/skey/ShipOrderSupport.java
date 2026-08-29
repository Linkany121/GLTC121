package com.linkany121.gltc.logic.skey;

import com.linkany121.gltc.util.TextUtil;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Shared PDC keys, colors, and order item helpers for ship order machines. */
public final class ShipOrderSupport {

    // ===== 配置区（舰体订单通用常量，改完需重新打包 jar 并重启生效）=====
    public static final String ORDER_ITEM_ID = "skey_订单";       // 已生成订单物品 ID
    public static final String BLANK_ORDER_ID = "skey_空白订单";   // 空白订单物品 ID
    public static final int ORDER_MODEL_ID = 1210238;              // 订单物品自定义模型 ID
    // 下方 NamespacedKey 为订单读写数据的 NBT 键（一般不要改动，改动会读不出旧订单）
    public static final NamespacedKey SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
    public static final NamespacedKey ORDER_LEVEL_KEY = new NamespacedKey("gltc", "order_level");
    public static final NamespacedKey ORDER_ITEMS_KEY = new NamespacedKey("gltc", "order_items");
    public static final NamespacedKey ORDER_REWARD_I_KEY = new NamespacedKey("gltc", "order_reward_i");
    public static final NamespacedKey ORDER_REWARD_V_KEY = new NamespacedKey("gltc", "order_reward_v");
    public static final NamespacedKey ORDER_REWARD_X_KEY = new NamespacedKey("gltc", "order_reward_x");
    // 订单主题色（十六进制彩字）：I=蓝 #6f7dff / V=橙 #ff8f4d / X=红 #ff3d3d / 金色 #fff5b3 / 标题蓝 #2998ff
    public static final String C_I = TextUtil.legacySection("&#6f7dff");
    public static final String C_V = TextUtil.legacySection("&#ff8f4d");
    public static final String C_X = TextUtil.legacySection("&#ff3d3d");
    public static final String C_GOLD = TextUtil.legacySection("&#fff5b3");
    public static final String C_TITLE = TextUtil.legacySection("&#2998ff");

    private static final Pattern STRIP_HEX_SECTION = Pattern.compile("§x(?:§[0-9a-fA-F]){6}", Pattern.CASE_INSENSITIVE);
    private static final Pattern STRIP_HEX_AMP = Pattern.compile("&x(?:&[0-9a-fA-F]){6}", Pattern.CASE_INSENSITIVE);
    private static final Pattern STRIP_INLINE_HEX = Pattern.compile("&#[0-9a-fA-F]{6}");
    private static final Pattern STRIP_CODE = Pattern.compile("[&§][0-9a-fA-FkKxXoOrRlLmMnN]");

    private ShipOrderSupport() {
    }

    public static String hex(String color) {
        return TextUtil.legacySection("&#" + color);
    }

    public static String translateCodes(@Nullable String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        return TextUtil.legacySection(s);
    }

    public static String stripColor(@Nullable String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        String out = STRIP_HEX_SECTION.matcher(s).replaceAll("");
        out = STRIP_HEX_AMP.matcher(out).replaceAll("");
        out = STRIP_INLINE_HEX.matcher(out).replaceAll("");
        out = STRIP_CODE.matcher(out).replaceAll("");
        return out.replace("§", "");
    }

    public static boolean idEquals(@Nullable String a, @Nullable String b) {
        return a != null && b != null && a.equalsIgnoreCase(b);
    }

    @Nullable
    public static String getSlimefunId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null) {
                var pdc = meta.getPersistentDataContainer();
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

    @Nullable
    public static SlimefunItem getItemById(@Nullable String id) {
        if (id == null || id.isEmpty()) {
            return null;
        }
        try {
            SlimefunItem sf = SlimefunItem.getById(id);
            if (sf != null) {
                return sf;
            }
            return SlimefunItem.getById(id.toUpperCase());
        } catch (Throwable t) {
            return null;
        }
    }

    @Nullable
    public static String getItemDisplayName(@Nullable ItemStack stack) {
        if (stack == null) {
            return null;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null && meta.hasDisplayName()) {
                String name = stripColor(meta.getDisplayName());
                return name.isEmpty() ? null : name;
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    public static boolean isBlankOrder(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        String id = getSlimefunId(stack);
        return id != null && idEquals(id, BLANK_ORDER_ID);
    }

    public static boolean isOrder(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        String id = getSlimefunId(stack);
        if (id != null && idEquals(id, ORDER_ITEM_ID)) {
            return true;
        }
        if (stack.getType() != Material.BOOK) {
            return false;
        }
        String name = getItemDisplayName(stack);
        return name != null && name.contains("订单");
    }

    public static boolean matchNeed(NeedItem need, @Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        if (need.isMc()) {
            Material mat = Material.matchMaterial(need.itemId());
            return mat != null && stack.getType() == mat;
        }
        String id = getSlimefunId(stack);
        return id != null && idEquals(id, need.itemId());
    }

    @Nullable
    public static OrderData readOrderData(@Nullable ItemStack item) {
        if (item == null) {
            return null;
        }
        try {
            ItemMeta meta = item.getItemMeta();
            if (meta == null) {
                return null;
            }
            var pdc = meta.getPersistentDataContainer();
            if (!pdc.has(ORDER_LEVEL_KEY, PersistentDataType.INTEGER)) {
                return null;
            }
            Integer level = pdc.get(ORDER_LEVEL_KEY, PersistentDataType.INTEGER);
            String itemsJson = pdc.get(ORDER_ITEMS_KEY, PersistentDataType.STRING);
            List<NeedItem> items = NeedItem.parseList(itemsJson);
            if (level == null || items.isEmpty()) {
                return null;
            }
            int rI = nz(pdc.get(ORDER_REWARD_I_KEY, PersistentDataType.INTEGER));
            int rV = nz(pdc.get(ORDER_REWARD_V_KEY, PersistentDataType.INTEGER));
            int rX = nz(pdc.get(ORDER_REWARD_X_KEY, PersistentDataType.INTEGER));
            String rewardType = rI > 0 ? "I" : (rV > 0 ? "V" : "X");
            int rewardAmount = rI > 0 ? rI : (rV > 0 ? rV : rX);
            return new OrderData(level, items, rewardType, rewardAmount);
        } catch (Throwable t) {
            return null;
        }
    }

    private static int nz(@Nullable Integer v) {
        return v == null ? 0 : v;
    }

    public static ItemStack pane(Material mat, String name, @Nullable List<String> lore) {
        ItemStack stack = new ItemStack(mat);
        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            if (lore != null) {
                meta.setLore(lore);
            }
            stack.setItemMeta(meta);
        }
        return stack;
    }

    public static void giveOrDrop(org.bukkit.entity.Player player, ItemStack stack) {
        var left = player.getInventory().addItem(stack);
        for (ItemStack drop : left.values()) {
            player.getWorld().dropItemNaturally(player.getLocation(), drop);
        }
    }

    public record NeedItem(String category, String itemId, boolean isMc, int amount, int value, int tier) {
        public String toJsonObject() {
            return "{\"category\":\"" + esc(category) + "\",\"itemId\":\"" + esc(itemId)
                + "\",\"isMc\":" + isMc + ",\"amount\":" + amount + ",\"value\":" + value + ",\"tier\":" + tier + "}";
        }

        public static String toJsonArray(List<NeedItem> items) {
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < items.size(); i++) {
                if (i > 0) {
                    sb.append(',');
                }
                sb.append(items.get(i).toJsonObject());
            }
            return sb.append(']').toString();
        }

        public static List<NeedItem> parseList(@Nullable String json) {
            List<NeedItem> out = new ArrayList<>();
            if (json == null || json.isBlank()) {
                return out;
            }
            Matcher m = Pattern.compile("\\{([^{}]+)\\}").matcher(json);
            while (m.find()) {
                String body = m.group(1);
                String category = strField(body, "category");
                String itemId = strField(body, "itemId");
                if (category == null || itemId == null) {
                    continue;
                }
                boolean isMc = boolField(body, "isMc");
                int amount = intField(body, "amount", 1);
                int value = intField(body, "value", 0);
                int tier = intField(body, "tier", 0);
                out.add(new NeedItem(category, itemId, isMc, amount, value, tier));
            }
            return out;
        }

        private static String esc(String s) {
            return s.replace("\\", "\\\\").replace("\"", "\\\"");
        }

        @Nullable
        private static String strField(String body, String key) {
            Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"").matcher(body);
            if (!m.find()) {
                return null;
            }
            return m.group(1).replace("\\\"", "\"").replace("\\\\", "\\");
        }

        private static boolean boolField(String body, String key) {
            Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*(true|false)").matcher(body);
            return m.find() && "true".equals(m.group(1));
        }

        private static int intField(String body, String key, int def) {
            Matcher m = Pattern.compile("\"" + key + "\"\\s*:\\s*(-?[0-9]+)").matcher(body);
            if (!m.find()) {
                return def;
            }
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException e) {
                return def;
            }
        }
    }

    public record OrderData(int level, List<NeedItem> items, String rewardType, int rewardAmount) {
    }
}
