package com.linkany121.gltc.item;

import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.groups.FlexItemGroup;
import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import org.bukkit.ChatColor;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.plugin.java.JavaPlugin;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Moves items whose display name contains "存档信息" to the front of each item group.
 * <p>
 * Scripted items register before YAML items, so archives are often not first until this runs.
 * Slimefun may also finish adding items to groups after addon {@code onEnable}, so callers
 * should prefer {@link #schedule(JavaPlugin)}.
 * <p>
 * {@code ItemGroup.items} is {@code final} — mutate via clear/addAll or remove/add, never replace.
 */
public final class GltcGuideOrderFixup {

    private static final Pattern INLINE_HEX = Pattern.compile("&#[0-9a-fA-F]{6}");
    private static final Pattern LEGACY_HEX = Pattern.compile("§x(§[0-9a-fA-F]){6}", Pattern.CASE_INSENSITIVE);
    private static final Pattern LEGACY_CODE = Pattern.compile("§[0-9a-fk-or]", Pattern.CASE_INSENSITIVE);

    /**
     * Known archive IDs (Slimefun uppercases ASCII). Especially for groups where scripted
     * items previously pushed them down:
     * <ul>
     *   <li>ATO协会 物品 → {@code AL_Q_ATO}</li>
     *   <li>缪尔罗素…物品/道具 → {@code LS_FKR介绍}, {@code LS_FKR介绍2}</li>
     *   <li>缪尔罗素…枪械/异能武器 → {@code LS_FKR介绍_异能}</li>
     *   <li>环夜谷…物品 → {@code VASA介绍0}…{@code VASA介绍03}</li>
     * </ul>
     */
    private static final Set<String> ARCHIVE_IDS = Set.of(
        "AL_Q_ATO",
        "LS_FKR介绍",
        "LS_FKR介绍2",
        "LS_FKR介绍_异能",
        "VASA介绍0",
        "VASA介绍01",
        "VASA介绍02",
        "VASA介绍03"
    );

    private GltcGuideOrderFixup() {
    }

    /** Run now and again next tick / 1s later so late group population is covered. */
    public static void schedule(JavaPlugin plugin) {
        apply();
        plugin.getServer().getScheduler().runTask(plugin, GltcGuideOrderFixup::apply);
        plugin.getServer().getScheduler().runTaskLater(plugin, GltcGuideOrderFixup::apply, 20L);
    }

    public static void apply() {
        int groupsTouched = 0;
        int archivesMoved = 0;
        for (ItemGroup group : new ArrayList<>(Slimefun.getRegistry().getAllItemGroups())) {
            try {
                int moved = reorder(group);
                if (moved > 0) {
                    groupsTouched++;
                    archivesMoved += moved;
                }
            } catch (RuntimeException ex) {
                com.linkany121.gltc.GltcPlugin.getInstance().getLogger().warning(
                    "[GuideOrder] 跳过物品组 " + group.getKey() + ": " + ex.getMessage()
                );
            }
        }
        if (groupsTouched > 0) {
            com.linkany121.gltc.GltcPlugin.getInstance().getLogger().info(
                "[GuideOrder] 已将 " + archivesMoved + " 个存档信息物品提前（" + groupsTouched + " 个物品组）"
            );
        }
    }

    private static int reorder(ItemGroup group) {
        List<SlimefunItem> current = snapshot(group);
        if (current.isEmpty()) {
            return 0;
        }

        List<SlimefunItem> archives = new ArrayList<>();
        List<SlimefunItem> rest = new ArrayList<>();
        Set<SlimefunItem> seen = new HashSet<>();
        for (SlimefunItem item : current) {
            if (!seen.add(item)) {
                continue;
            }
            if (isArchiveItem(item)) {
                archives.add(item);
            } else {
                rest.add(item);
            }
        }
        if (archives.isEmpty()) {
            return 0;
        }

        boolean alreadyFront = true;
        for (int i = 0; i < archives.size(); i++) {
            if (i >= current.size() || current.get(i) != archives.get(i)) {
                alreadyFront = false;
                break;
            }
        }
        if (alreadyFront && current.size() == archives.size() + rest.size()) {
            return 0;
        }

        List<SlimefunItem> ordered = new ArrayList<>(archives.size() + rest.size());
        ordered.addAll(archives);
        ordered.addAll(rest);

        if (mutateViaField(group, ordered)) {
            return archives.size();
        }
        if (mutateViaRemoveAdd(group, current, ordered)) {
            return archives.size();
        }
        com.linkany121.gltc.GltcPlugin.getInstance().getLogger().warning(
            "[GuideOrder] 无法重排物品组 " + group.getKey()
        );
        return 0;
    }

    private static List<SlimefunItem> snapshot(ItemGroup group) {
        // NestedItemGroup / other FlexItemGroup types throw on getItems().
        if (group instanceof FlexItemGroup) {
            return List.of();
        }
        try {
            List<SlimefunItem> fromApi = group.getItems();
            if (fromApi != null && !fromApi.isEmpty()) {
                return new ArrayList<>(fromApi);
            }
        } catch (UnsupportedOperationException ignored) {
            return List.of();
        }
        try {
            Field field = findItemsField(group.getClass());
            if (field == null) {
                return List.of();
            }
            field.setAccessible(true);
            Object raw = field.get(group);
            if (!(raw instanceof List<?> list) || list.isEmpty()) {
                return List.of();
            }
            List<SlimefunItem> working = new ArrayList<>();
            for (Object entry : list) {
                if (entry instanceof SlimefunItem slimefunItem) {
                    working.add(slimefunItem);
                }
            }
            return working;
        } catch (ReflectiveOperationException ex) {
            return List.of();
        }
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static boolean mutateViaField(ItemGroup group, List<SlimefunItem> ordered) {
        try {
            Field field = findItemsField(group.getClass());
            if (field == null) {
                return false;
            }
            field.setAccessible(true);
            Object raw = field.get(group);
            if (!(raw instanceof List mutable)) {
                return false;
            }
            mutable.clear();
            mutable.addAll(ordered);
            return true;
        } catch (ReflectiveOperationException | UnsupportedOperationException | ClassCastException ex) {
            var plugin = com.linkany121.gltc.GltcPlugin.getInstance();
            if (plugin != null) {
                plugin.getLogger().log(java.util.logging.Level.WARNING,
                    "[GuideOrder] 反射重排失败: " + group.getKey(), ex);
            }
            return false;
        }
    }

    private static boolean mutateViaRemoveAdd(
        ItemGroup group,
        List<SlimefunItem> current,
        List<SlimefunItem> ordered
    ) {
        try {
            for (SlimefunItem item : current) {
                group.remove(item);
            }
            for (SlimefunItem item : ordered) {
                group.add(item);
            }
            return true;
        } catch (RuntimeException ex) {
            return false;
        }
    }

    private static boolean isArchiveItem(SlimefunItem item) {
        String id = item.getId();
        if (id != null) {
            if (ARCHIVE_IDS.contains(id)) {
                return true;
            }
            for (String known : ARCHIVE_IDS) {
                if (known.equalsIgnoreCase(id)) {
                    return true;
                }
            }
        }
        return plainItemName(item).contains("存档信息");
    }

    private static String plainItemName(SlimefunItem item) {
        ItemStack stack = item.getItem();
        if (stack != null) {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null && meta.hasDisplayName() && meta.displayName() != null) {
                String plain = PlainTextComponentSerializer.plainText().serialize(meta.displayName());
                if (plain != null && !plain.isBlank()) {
                    return plain;
                }
            }
        }
        String raw = item.getItemName();
        if (raw == null) {
            return "";
        }
        raw = INLINE_HEX.matcher(raw).replaceAll("");
        raw = LEGACY_HEX.matcher(raw).replaceAll("");
        raw = ChatColor.stripColor(raw);
        raw = LEGACY_CODE.matcher(raw).replaceAll("");
        return raw;
    }

    private static Field findItemsField(Class<?> type) {
        Class<?> cursor = type;
        while (cursor != null && cursor != Object.class) {
            try {
                return cursor.getDeclaredField("items");
            } catch (NoSuchFieldException ignored) {
                cursor = cursor.getSuperclass();
            }
        }
        return null;
    }
}
