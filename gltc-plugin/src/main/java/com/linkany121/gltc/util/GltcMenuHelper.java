package com.linkany121.gltc.util;

import com.linkany121.gltc.item.GltcItemBuilder;
import io.github.thebusybiscuit.slimefun4.utils.ChestMenuUtils;
import me.mrCookieSlime.CSCoreLibPlugin.general.Inventory.ChestMenu;
import me.mrCookieSlime.CSCoreLibPlugin.general.Inventory.ClickAction;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.inventory.ItemStack;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenuPreset;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public final class GltcMenuHelper {

    /** Fourth row center slot in a 54-slot machine menu. */
    public static final int GENERATOR_PROGRESS_SLOT = 31;

    private static final int[] LEGACY_GENERATOR_DISPLAY_SLOTS = {13, 22};

    private static final ChestMenu.AdvancedMenuClickHandler OUTPUT_HANDLER = new ChestMenu.AdvancedMenuClickHandler() {
        @Override
        public boolean onClick(Player p, int slot, ItemStack cursor, ClickAction action) {
            return false;
        }

        @Override
        public boolean onClick(InventoryClickEvent e, Player p, int slot, ItemStack cursor, ClickAction action) {
            return cursor == null || cursor.getType() == Material.AIR;
        }
    };

    private static final ChestMenu.AdvancedMenuClickHandler BLOCKED_HANDLER = new ChestMenu.AdvancedMenuClickHandler() {
        @Override
        public boolean onClick(Player p, int slot, ItemStack cursor, ClickAction action) {
            return false;
        }

        @Override
        public boolean onClick(InventoryClickEvent e, Player p, int slot, ItemStack cursor, ClickAction action) {
            return false;
        }
    };

    private GltcMenuHelper() {
    }

    public static void setupMachineMenu(
        BlockMenuPreset preset,
        String machineId,
        int[] inputSlots,
        int[] outputSlots
    ) {
        setupMachineMenu(preset, machineId, inputSlots, outputSlots, findProgressBarSlot(machineId));
    }

    public static void setupMachineMenu(
        BlockMenuPreset preset,
        String machineId,
        int[] inputSlots,
        int[] outputSlots,
        int progressBarSlot
    ) {
        Set<Integer> input = new HashSet<>();
        for (int slot : inputSlots) {
            input.add(slot);
        }
        Set<Integer> output = new HashSet<>();
        for (int slot : outputSlots) {
            output.add(slot);
        }

        decorate(preset, machineId, input, output, progressBarSlot, Set.of());

        preset.addItem(progressBarSlot, getProgressBarIdleItem(machineId), BLOCKED_HANDLER);
        preset.addMenuClickHandler(progressBarSlot, BLOCKED_HANDLER);

        for (int slot : outputSlots) {
            preset.addMenuClickHandler(slot, OUTPUT_HANDLER);
        }
    }

    public static void setupGeneratorMenu(
        BlockMenuPreset preset,
        String machineId,
        int[] inputSlots,
        int[] outputSlots
    ) {
        Set<Integer> input = new HashSet<>();
        for (int slot : inputSlots) {
            input.add(slot);
        }
        Set<Integer> output = new HashSet<>();
        for (int slot : outputSlots) {
            output.add(slot);
        }

        Set<Integer> blocked = new HashSet<>();
        blocked.add(GENERATOR_PROGRESS_SLOT);
        for (int slot : LEGACY_GENERATOR_DISPLAY_SLOTS) {
            blocked.add(slot);
        }

        decorate(preset, machineId, input, output, GENERATOR_PROGRESS_SLOT, blocked);

        preset.addItem(GENERATOR_PROGRESS_SLOT, getProgressBarIdleItem(machineId), BLOCKED_HANDLER);
        preset.addMenuClickHandler(GENERATOR_PROGRESS_SLOT, BLOCKED_HANDLER);

        for (int slot : outputSlots) {
            preset.addMenuClickHandler(slot, OUTPUT_HANDLER);
        }

        for (int slot : LEGACY_GENERATOR_DISPLAY_SLOTS) {
            // Always seal AGenerator's default progress slot (22). Keep other legacy
            // slots free when they are real input slots (e.g. 13).
            if (output.contains(slot) || slot == GENERATOR_PROGRESS_SLOT) {
                continue;
            }
            if (slot != 22 && input.contains(slot)) {
                continue;
            }
            preset.addItem(slot, idleFallback(), BLOCKED_HANDLER);
            preset.addMenuClickHandler(slot, BLOCKED_HANDLER);
        }
    }

    public static ItemStack getProgressBarIdleItem(String machineId) {
        Map<String, Object> menu = GltcMenuData.get(machineId);
        if (menu == null) {
            return idleFallback();
        }
        Object slotsObj = menu.get("slots");
        if (!(slotsObj instanceof Map<?, ?> slots)) {
            return idleFallback();
        }
        for (Map.Entry<?, ?> entry : slots.entrySet()) {
            int slot;
            try {
                slot = Integer.parseInt(String.valueOf(entry.getKey()));
            } catch (NumberFormatException ignored) {
                continue;
            }
            if (slot != GENERATOR_PROGRESS_SLOT) {
                continue;
            }
            Map<String, Object> slotData = RecipeUtil.asMap(entry.getValue());
            if (!Boolean.TRUE.equals(slotData.get("progressbar"))) {
                continue;
            }
            ItemStack icon = GltcItemBuilder.stack(slotData);
            if (icon != null && icon.getType() != Material.AIR) {
                return icon;
            }
        }
        for (Map.Entry<?, ?> entry : slots.entrySet()) {
            Map<String, Object> slotData = RecipeUtil.asMap(entry.getValue());
            if (!Boolean.TRUE.equals(slotData.get("progressbar"))) {
                continue;
            }
            ItemStack icon = GltcItemBuilder.stack(slotData);
            if (icon != null && icon.getType() != Material.AIR) {
                return icon;
            }
        }
        return idleFallback();
    }

    public static int findProgressBarSlot(String machineId) {
        Map<String, Object> menu = GltcMenuData.get(machineId);
        if (menu == null) {
            return 22;
        }
        Object slotsObj = menu.get("slots");
        if (!(slotsObj instanceof Map<?, ?> slots)) {
            return 22;
        }
        for (Map.Entry<?, ?> entry : slots.entrySet()) {
            Map<String, Object> slotData = RecipeUtil.asMap(entry.getValue());
            if (!Boolean.TRUE.equals(slotData.get("progressbar"))) {
                continue;
            }
            try {
                return Integer.parseInt(String.valueOf(entry.getKey()));
            } catch (NumberFormatException ignored) {
            }
        }
        return 22;
    }

    public static ItemStack idlePane() {
        return idleFallback();
    }

    private static ItemStack idleFallback() {
        ItemStack item = new ItemStack(Material.BLACK_STAINED_GLASS_PANE);
        var meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(" ");
            item.setItemMeta(meta);
        }
        return item;
    }

    private static void decorate(
        BlockMenuPreset preset,
        String machineId,
        Set<Integer> inputSlots,
        Set<Integer> outputSlots,
        int progressBarSlot,
        Set<Integer> extraBlockedSlots
    ) {
        Map<String, Object> menu = GltcMenuData.get(machineId);
        if (menu == null) {
            return;
        }
        Object slotsObj = menu.get("slots");
        if (!(slotsObj instanceof Map<?, ?> slots)) {
            return;
        }
        for (Map.Entry<?, ?> entry : slots.entrySet()) {
            int slot;
            try {
                slot = Integer.parseInt(String.valueOf(entry.getKey()));
            } catch (NumberFormatException ex) {
                continue;
            }
            if (inputSlots.contains(slot) || outputSlots.contains(slot) || extraBlockedSlots.contains(slot)) {
                continue;
            }
            if (slot == progressBarSlot) {
                continue;
            }
            Map<String, Object> slotData = RecipeUtil.asMap(entry.getValue());
            if (Boolean.TRUE.equals(slotData.get("progressbar"))) {
                continue;
            }
            if (isLegacyGeneratorProgressDecoration(slotData)) {
                continue;
            }
            ItemStack icon = GltcItemBuilder.stack(slotData);
            preset.addItem(slot, icon, ChestMenuUtils.getEmptyClickHandler());
        }
    }

    private static boolean isLegacyGeneratorProgressDecoration(Map<String, Object> slotData) {
        Material material = Material.matchMaterial(
            String.valueOf(slotData.getOrDefault("material", "")).toUpperCase()
        );
        return material == Material.NETHER_STAR;
    }
}
