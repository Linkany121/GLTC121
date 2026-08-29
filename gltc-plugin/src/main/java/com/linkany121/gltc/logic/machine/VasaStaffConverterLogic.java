package com.linkany121.gltc.logic.machine;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.logic.common.GltcMessages;
import com.linkany121.gltc.logic.mage.StaffPdc;
import com.linkany121.gltc.logic.mage.StaffPdc.StaffData;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.ClickType;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryCreativeEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import javax.annotation.Nullable;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * {@code VASA_术式承载转换仪} — embed skill cores and engrave spell carriers onto the staff.
 * Spec: {@code 便利/工作区.yml} §五; mirrors former {@code scripts/机器/术式承载转换仪.js}.
 */
public final class VasaStaffConverterLogic implements GltcMachineLogic, Listener {

    public static final String MACHINE_ID = "VASA_术式承载转换仪";

    // ===== 配置区（术式承载转换仪，改完需重新打包 jar 并重启生效）=====
    private static final String GUI_TITLE =
        "§x§c§9§a§0§f§f术§x§b§8§8§a§f§f式§x§a§7§7§4§f§f承§x§9§6§6§0§f§f载§x§8§5§6§0§f§f转§x§7§4§5§0§f§f换§x§6§3§4§0§f§f仪";  // 面板标题（事件按标题匹配）
    private static final String STAFF_LABEL =
        "§x§7§4§c§5§f§fN§x§7§a§b§1§f§fT§x§8§0§9§c§f§fC§x§8§7§8§8§f§f外§x§8§d§7§3§f§f置§x§9§7§6§9§f§f粒§x§a§5§6§a§f§f子§x§b§4§6§b§f§f控§x§c§2§6§c§f§f制§x§d§0§6§d§f§f仪";  // 法杖显示名（与 items.yml 一致）

    private static final int STAFF_SLOT = 0;      // 法杖放置槽（9 格面板 0~8）
    private static final int CORE_SLOT = 1;       // 技能核心放置槽
    private static final int FILLER_SLOT = 2;     // 填充玻璃槽（纯装饰）
    private static final int[] SPELL_SLOTS = {3, 4, 5, 6, 7, 8};  // 术式刻录槽位数组（改槽位数需与 StaffPdc.MAX_SPELL_SLOTS 保持一致）
    private static final int INV_SIZE = 9;        // 面板大小（9 = 1 行）

    private final Set<Inventory> activeInventories = new HashSet<>();
    private final ItemStack filler;
    private final ItemStack staffPlaceholder;
    private final ItemStack corePlaceholder;

    @Nullable
    private GltcPlugin plugin;

    public VasaStaffConverterLogic() {
        filler = named(Material.BLACK_STAINED_GLASS_PANE, "§0", null);
        staffPlaceholder = StaffPdc.markPlaceholder(named(
            Material.WOODEN_SWORD,
            "§6§l" + STAFF_LABEL,
            List.of("§7待放入 " + STAFF_LABEL, "§e左键放入或取回")
        ));
        corePlaceholder = StaffPdc.markPlaceholder(named(
            Material.GRAY_WOOL,
            "§7§l[ 施术技能核心 ]",
            List.of("§7嵌入后解锁可刻录术式位置与核心技能", "§e左键放入或卸下")
        ));
    }

    /** Registers GUI listeners only; parent Bootstrap should {@code registerMachine}. */
    public void register(GltcPlugin plugin) {
        this.plugin = plugin;
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        activeInventories.clear();
        plugin = null;
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        if (event.getClickedBlock().isEmpty()) {
            return false;
        }
        Player player = event.getPlayer();
        Inventory inv = Bukkit.createInventory(null, INV_SIZE, GUI_TITLE);
        refreshGui(inv);
        activeInventories.add(inv);
        player.openInventory(inv);
        playSound(player, "block.end_portal_frame.fill", 0.75f, 1.05f);
        return true;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onClick(InventoryClickEvent event) {
        if (event instanceof InventoryCreativeEvent) {
            return;
        }
        Inventory top = event.getView().getTopInventory();
        if (!activeInventories.contains(top)) {
            return;
        }
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }

        ClickType click = event.getClick();
        if (click == ClickType.DOUBLE_CLICK
            || click == ClickType.NUMBER_KEY
            || click == ClickType.SWAP_OFFHAND
            || click == ClickType.DROP
            || click == ClickType.CONTROL_DROP
            || click == ClickType.CREATIVE
            || click == ClickType.SHIFT_LEFT
            || click == ClickType.SHIFT_RIGHT) {
            event.setCancelled(true);
            return;
        }

        Inventory clicked = event.getClickedInventory();
        int raw = event.getRawSlot();
        int bagSlot = event.getSlot();

        if (clicked == top) {
            event.setCancelled(true);
            refundCursor(player, event);
            if (click != ClickType.LEFT && click != ClickType.RIGHT) {
                return;
            }
            if (raw == STAFF_SLOT) {
                runNextTick(() -> unequipStaff(player, top));
                return;
            }
            if (raw == CORE_SLOT) {
                runNextTick(() -> unequipCore(player, top));
                return;
            }
            int idx = spellIndex(raw);
            if (idx >= 0 && click == ClickType.LEFT) {
                runNextTick(() -> unequipSpell(player, top, idx));
            }
            return;
        }

        if (clicked != null && clicked != top) {
            event.setCancelled(true);
            refundCursor(player, event);
            if (click != ClickType.LEFT && click != ClickType.RIGHT) {
                return;
            }
            ItemStack cur = event.getCurrentItem();
            if (cur == null || cur.getType() == Material.AIR) {
                return;
            }
            final String action;
            if (StaffPdc.isStaff(cur)) {
                action = "staff";
            } else if (StaffPdc.isSkillCore(cur)) {
                action = "core";
            } else if (StaffPdc.isSpellCarrier(cur)) {
                action = "spell";
            } else {
                return;
            }
            runNextTick(() -> {
                if (!activeInventories.contains(top) || !player.isOnline()) {
                    return;
                }
                Inventory bottom = player.getOpenInventory().getBottomInventory();
                switch (action) {
                    case "staff" -> placeStaff(player, top, bottom, bagSlot);
                    case "core" -> placeCore(player, top, bottom, bagSlot);
                    case "spell" -> placeSpell(player, top, bottom, bagSlot);
                    default -> {
                    }
                }
            });
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onDrag(InventoryDragEvent event) {
        if (activeInventories.contains(event.getInventory())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onClose(InventoryCloseEvent event) {
        Inventory inv = event.getInventory();
        if (!activeInventories.contains(inv)) {
            return;
        }
        activeInventories.remove(inv);
        if (!(event.getPlayer() instanceof Player player)) {
            return;
        }
        ItemStack staff = inv.getItem(STAFF_SLOT);
        if (isRealStaff(staff)) {
            ItemStack give = staff.clone();
            clearGui(inv);
            giveOrDrop(player, give);
        } else {
            clearGui(inv);
        }
    }

    private void refreshGui(Inventory inv) {
        inv.setItem(FILLER_SLOT, filler.clone());
        ItemStack staff = getStaff(inv);
        if (staff == null) {
            ItemStack raw = inv.getItem(STAFF_SLOT);
            if (raw == null || raw.getType() == Material.AIR || isStaffPlaceholder(raw)) {
                inv.setItem(STAFF_SLOT, staffPlaceholder.clone());
            }
            inv.setItem(CORE_SLOT, corePlaceholder.clone());
            for (int i = 0; i < SPELL_SLOTS.length; i++) {
                inv.setItem(SPELL_SLOTS[i], spellLockedPane(i));
            }
            return;
        }
        StaffData data = StaffPdc.read(staff);
        inv.setItem(STAFF_SLOT, staff);
        if (data == null) {
            inv.setItem(CORE_SLOT, corePlaceholder.clone());
            for (int i = 0; i < SPELL_SLOTS.length; i++) {
                inv.setItem(SPELL_SLOTS[i], spellLockedPane(i));
            }
            return;
        }
        if (data.skillCoreId() != null) {
            inv.setItem(CORE_SLOT, coreFilledItem(data.skillCoreId()));
        } else {
            inv.setItem(CORE_SLOT, corePlaceholder.clone());
        }
        for (int i = 0; i < SPELL_SLOTS.length; i++) {
            if (i >= data.capacity()) {
                inv.setItem(SPELL_SLOTS[i], spellLockedPane(i));
            } else if (data.spells()[i] != null && !data.spells()[i].isEmpty()) {
                inv.setItem(SPELL_SLOTS[i], spellFilledPane(i, data.spells()[i]));
            } else {
                inv.setItem(SPELL_SLOTS[i], spellEmptyPane(i));
            }
        }
    }

    private void unequipStaff(Player player, Inventory top) {
        if (!activeInventories.contains(top)) {
            return;
        }
        ItemStack current = top.getItem(STAFF_SLOT);
        if (!isRealStaff(current)) {
            return;
        }
        ItemStack give = current.clone();
        top.setItem(STAFF_SLOT, staffPlaceholder.clone());
        refreshGui(top);
        giveOrDrop(player, give);
        playSound(player, "block.note_block.bell", 0.8f, 0.9f);
        player.sendMessage(GltcMessages.prefixed("§e已取回 " + STAFF_LABEL + "§e。"));
    }

    private void placeStaff(Player player, Inventory top, Inventory bottom, int slot) {
        if (!activeInventories.contains(top)) {
            return;
        }
        ItemStack stack = bottom.getItem(slot);
        if (!StaffPdc.isStaff(stack)) {
            return;
        }
        ItemStack current = top.getItem(STAFF_SLOT);
        if (isRealStaff(current)) {
            player.sendMessage(GltcMessages.prefixed("§c请先取下当前 " + STAFF_LABEL + "§c。"));
            return;
        }
        ItemStack one = takeOne(bottom, slot);
        if (one == null) {
            return;
        }
        StaffData data = StaffPdc.read(one);
        StaffPdc.syncLore(one, data);
        top.setItem(STAFF_SLOT, one);
        refreshGui(top);
        if (getStaff(top) == null) {
            giveOrDrop(player, one);
            top.setItem(STAFF_SLOT, staffPlaceholder.clone());
            refreshGui(top);
            player.sendMessage(GltcMessages.prefixed("§c置入失败，已退回。"));
            return;
        }
        player.sendMessage(GltcMessages.prefixed("§a已置入 " + STAFF_LABEL + "§a。"));
        playSound(player, "block.note_block.bell", 0.8f, 1.25f);
    }

    private void unequipCore(Player player, Inventory top) {
        if (!activeInventories.contains(top)) {
            return;
        }
        ItemStack staff = getStaff(top);
        if (staff == null) {
            player.sendMessage(GltcMessages.prefixed("§c请先放入 " + STAFF_LABEL + "§c。"));
            return;
        }
        StaffData data = StaffPdc.read(staff);
        if (data == null || data.skillCoreId() == null) {
            return;
        }
        String coreId = data.skillCoreId();
        ItemStack coreItem = StaffPdc.createSfClone(coreId);
        if (coreItem == null) {
            player.sendMessage(GltcMessages.prefixed("§c无法生成技能核心：" + coreId));
            return;
        }
        if (!StaffPdc.writeSkillCore(staff, null)) {
            player.sendMessage(GltcMessages.prefixed("§c卸下核心失败。"));
            return;
        }
        data = StaffPdc.read(staff);
        if (data != null) {
            ejectOverflow(player, staff, data);
            data = StaffPdc.read(staff);
            StaffPdc.syncLore(staff, data);
        } else {
            StaffPdc.syncLore(staff, null, new String[StaffPdc.MAX_SPELL_SLOTS], 0);
        }
        top.setItem(STAFF_SLOT, staff);
        refreshGui(top);
        giveOrDrop(player, coreItem);
        playSound(player, "block.note_block.bell", 0.8f, 0.9f);
        player.sendMessage(GltcMessages.prefixed("§e已卸下施术技能核心 " + StaffPdc.coreDisplayName(coreId)));
    }

    private void placeCore(Player player, Inventory top, Inventory bottom, int slot) {
        if (!activeInventories.contains(top)) {
            return;
        }
        ItemStack stack = bottom.getItem(slot);
        if (!StaffPdc.isSkillCore(stack)) {
            return;
        }
        ItemStack staff = getStaff(top);
        if (staff == null) {
            player.sendMessage(GltcMessages.prefixed("§c请先放入 " + STAFF_LABEL + "§c。"));
            return;
        }
        String coreId = StaffPdc.getSlimefunId(stack);
        if (!StaffPdc.isSkillCoreId(coreId)) {
            player.sendMessage(GltcMessages.prefixed("§c无法识别技能核心。"));
            return;
        }
        StaffData data = StaffPdc.read(staff);
        if (data == null) {
            player.sendMessage(GltcMessages.prefixed("§c无法读取 " + STAFF_LABEL + " §c数据。"));
            return;
        }
        if (data.skillCoreId() != null) {
            if (data.skillCoreId().equals(coreId)) {
                player.sendMessage(GltcMessages.prefixed("§c已嵌入相同的核心。"));
            } else {
                player.sendMessage(GltcMessages.prefixed("§c请先卸下当前施术技能核心。"));
            }
            return;
        }
        ItemStack one = takeOne(bottom, slot);
        if (one == null) {
            return;
        }
        if (!StaffPdc.writeSkillCore(staff, coreId)) {
            giveOrDrop(player, one);
            player.sendMessage(GltcMessages.prefixed("§c嵌入失败，已退回核心。"));
            return;
        }
        data = StaffPdc.read(staff);
        if (data == null || !coreId.equals(data.skillCoreId())) {
            StaffPdc.writeSkillCore(staff, null);
            giveOrDrop(player, one);
            top.setItem(STAFF_SLOT, staff);
            refreshGui(top);
            player.sendMessage(GltcMessages.prefixed("§c嵌入校验失败，已退回核心。"));
            return;
        }
        StaffPdc.syncLore(staff, data);
        top.setItem(STAFF_SLOT, staff);
        refreshGui(top);
        int slots = StaffPdc.spellSlotsForCore(coreId);
        player.sendMessage(GltcMessages.prefixed(
            "§a已嵌入 " + StaffPdc.coreDisplayName(coreId) + " §7→ 刻录上限 §e" + slots
        ));
        playSound(player, "block.note_block.bell", 0.8f, 1.25f);
    }

    private void unequipSpell(Player player, Inventory top, int idx) {
        if (!activeInventories.contains(top)) {
            return;
        }
        ItemStack staff = getStaff(top);
        if (staff == null) {
            player.sendMessage(GltcMessages.prefixed("§c请先放入 " + STAFF_LABEL + "§c。"));
            return;
        }
        StaffData data = StaffPdc.read(staff);
        if (data == null || idx < 0 || idx >= data.capacity()) {
            return;
        }
        String spellId = data.spells()[idx];
        if (spellId == null || spellId.isEmpty()) {
            return;
        }
        ItemStack carrier = StaffPdc.createSfClone(spellId);
        if (carrier == null) {
            player.sendMessage(GltcMessages.prefixed("§c无法生成术式载体：" + spellId));
            return;
        }
        data.spells()[idx] = null;
        int selected = data.selected();
        if (selected == idx) {
            selected = 0;
        }
        StaffPdc.writeSpells(staff, data.spells(), selected);
        top.setItem(STAFF_SLOT, staff);
        refreshGui(top);
        giveOrDrop(player, carrier);
        playSound(player, "block.note_block.bell", 0.8f, 0.9f);
        player.sendMessage(GltcMessages.prefixed("§e已卸下术式载体 " + StaffPdc.spellDisplayName(spellId)));
    }

    private void placeSpell(Player player, Inventory top, Inventory bottom, int slot) {
        if (!activeInventories.contains(top)) {
            return;
        }
        ItemStack stack = bottom.getItem(slot);
        String spellId = StaffPdc.resolveSpellId(stack);
        if (spellId == null) {
            return;
        }
        ItemStack staff = getStaff(top);
        if (staff == null) {
            player.sendMessage(GltcMessages.prefixed("§c请先放入 " + STAFF_LABEL + "§c。"));
            return;
        }
        StaffData data = StaffPdc.read(staff);
        if (data == null) {
            player.sendMessage(GltcMessages.prefixed("§c无法读取 " + STAFF_LABEL + " §c数据。"));
            return;
        }
        if (data.capacity() <= 0) {
            player.sendMessage(GltcMessages.prefixed("§c请先嵌入施术技能核心。"));
            return;
        }
        if (data.containsSpell(spellId)) {
            player.sendMessage(GltcMessages.prefixed("§c该术式已刻录。"));
            return;
        }
        int empty = data.findEmptySlot();
        if (empty < 0) {
            player.sendMessage(GltcMessages.prefixed("§c术式槽已满或未嵌入技能核心。"));
            return;
        }
        ItemStack one = takeOne(bottom, slot);
        if (one == null) {
            return;
        }
        data.spells()[empty] = spellId;
        int selected = data.selected();
        if (selected < 0 || selected >= data.capacity()
            || data.spells()[selected] == null || data.spells()[selected].isEmpty()) {
            selected = empty;
        }
        if (!StaffPdc.writeSpells(staff, data.spells(), selected)) {
            giveOrDrop(player, one);
            player.sendMessage(GltcMessages.prefixed("§c刻录失败，已退回术式载体。"));
            return;
        }
        top.setItem(STAFF_SLOT, staff);
        refreshGui(top);
        playSound(player, "block.end_portal_frame.fill", 0.9f, 0.95f);
        player.sendMessage(GltcMessages.prefixed(
            "§a已刻录 " + StaffPdc.spellDisplayName(spellId) + " §7→ 槽位 " + (empty + 1)
        ));
    }

    private void ejectOverflow(Player player, ItemStack staff, StaffData data) {
        boolean changed = false;
        String[] spells = data.spells();
        int selected = data.selected();
        for (int i = data.capacity(); i < StaffPdc.MAX_SPELL_SLOTS; i++) {
            if (spells[i] == null || spells[i].isEmpty()) {
                continue;
            }
            ItemStack carrier = StaffPdc.createSfClone(spells[i]);
            if (carrier != null) {
                giveOrDrop(player, carrier);
            }
            spells[i] = null;
            if (selected == i) {
                selected = 0;
            }
            changed = true;
        }
        if (changed) {
            StaffPdc.writeSpells(staff, spells, selected);
        }
    }

    @Nullable
    private ItemStack getStaff(Inventory inv) {
        ItemStack stack = inv.getItem(STAFF_SLOT);
        return isRealStaff(stack) ? stack : null;
    }

    private boolean isRealStaff(@Nullable ItemStack stack) {
        return stack != null
            && stack.getType() != Material.AIR
            && !isStaffPlaceholder(stack)
            && StaffPdc.isStaff(stack);
    }

    private boolean isStaffPlaceholder(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return true;
        }
        if (StaffPdc.isStaff(stack)) {
            return false;
        }
        if (StaffPdc.hasPlaceholderMark(stack)) {
            return true;
        }
        return stack.getType() == Material.WOODEN_SWORD;
    }

    private static int spellIndex(int raw) {
        for (int i = 0; i < SPELL_SLOTS.length; i++) {
            if (SPELL_SLOTS[i] == raw) {
                return i;
            }
        }
        return -1;
    }

    private ItemStack coreFilledItem(String coreId) {
        ItemStack item = StaffPdc.createSfClone(coreId);
        if (item != null) {
            ItemMeta meta = item.getItemMeta();
            if (meta != null) {
                if (meta.hasDisplayName()) {
                    String shortName = shortDisplay(meta.getDisplayName());
                    if (!StaffPdc.stripColor(shortName).isBlank()) {
                        meta.setDisplayName(shortName);
                    }
                }
                List<String> lore = meta.hasLore() ? new java.util.ArrayList<>(meta.getLore()) : new java.util.ArrayList<>();
                lore.add("§7已嵌入");
                lore.add("§e左键卸下核心到背包");
                meta.setLore(lore);
                item.setItemMeta(meta);
            }
            return item;
        }
        return glowPane(
            Material.BROWN_GLAZED_TERRACOTTA,
            "§d§l" + StaffPdc.coreDisplayName(coreId),
            List.of("§7已嵌入", "§e左键卸下核心到背包")
        );
    }

    private static ItemStack spellLockedPane(int index) {
        return named(Material.OBSIDIAN, "§8[未解锁] §7#" + (index + 1), List.of(
            "§7需嵌入核心或提升核心等级以解锁"
        ));
    }

    private static ItemStack spellEmptyPane(int index) {
        return named(Material.LIGHT_GRAY_SHULKER_BOX, "§7[未装填] §8#" + (index + 1), List.of(
            "§7左键点击术式载体自动刻录",
            "§8空槽"
        ));
    }

    private static ItemStack spellFilledPane(int index, String spellId) {
        return glowPane(
            spellCarrierMaterial(spellId),
            StaffPdc.spellDisplayName(spellId) + " §7#" + (index + 1),
            List.of(
                "§7已刻录术式载体",
                "§8ID: §f" + spellId,
                "§e左键点击卸下术式载体到背包"
            )
        );
    }

    // -------------------------------------------------------------------------
    // 流派 → 潜影盒颜色（与旧术式体系 登记.js SCHOOL_SHULKER 一致）
    // -------------------------------------------------------------------------

    /** 流派关键词 → 潜影盒材质。 */
    private static final Map<String, Material> SCHOOL_COLORS = Map.ofEntries(
        Map.entry("拓尔奥沓", Material.YELLOW_SHULKER_BOX),
        Map.entry("金律", Material.YELLOW_SHULKER_BOX),
        Map.entry("焱招", Material.RED_SHULKER_BOX),
        Map.entry("赤焰", Material.RED_SHULKER_BOX),
        Map.entry("环夜谷", Material.BLUE_SHULKER_BOX),
        Map.entry("沃土", Material.LIME_SHULKER_BOX),
        Map.entry("无/特殊", Material.MAGENTA_SHULKER_BOX),
        Map.entry("无流派", Material.MAGENTA_SHULKER_BOX)
    );

    /** 流派匹配顺序（具体到宽泛，保证含多种关键词时选中最具体的一个）。 */
    private static final String[] SCHOOL_KEY_ORDER = {
        "拓尔奥沓", "金律", "焱招", "赤焰", "环夜谷", "沃土", "无/特殊", "无流派"
    };

    /** 已刻录槽位材质：优先取载体物品本体材质（items.yml 已按流派着色），否则按 lore 流派映射。 */
    private static Material spellCarrierMaterial(String spellId) {
        ItemStack carrier = StaffPdc.createSfClone(spellId);
        if (carrier != null && carrier.getType() != Material.AIR) {
            Material mat = carrier.getType();
            if (mat != Material.LIGHT_GRAY_SHULKER_BOX && mat != Material.OBSIDIAN) {
                return mat;
            }
        }
        String school = schoolFromCarrier(carrier);
        Material mat = school != null ? SCHOOL_COLORS.get(school) : null;
        return mat != null ? mat : Material.LIGHT_GRAY_SHULKER_BOX;
    }

    @Nullable
    private static String schoolFromCarrier(@Nullable ItemStack carrier) {
        if (carrier == null) {
            return null;
        }
        ItemMeta meta = carrier.getItemMeta();
        if (meta == null || !meta.hasLore()) {
            return null;
        }
        for (String line : meta.getLore()) {
            String plain = StaffPdc.stripColor(line);
            if (!plain.contains("流派")) {
                continue;
            }
            for (String key : SCHOOL_KEY_ORDER) {
                if (plain.contains(key)) {
                    return key;
                }
            }
        }
        return null;
    }

    private static String shortDisplay(String colored) {
        String dn = colored == null ? "" : colored;
        int sep = dn.indexOf('丨');
        if (sep < 0) {
            sep = dn.indexOf('|');
        }
        if (sep >= 0) {
            return dn.substring(sep + 1).replaceFirst("^\\s+", "");
        }
        String plain = StaffPdc.stripColor(dn);
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

    private static void clearGui(Inventory inv) {
        for (int i = 0; i < INV_SIZE; i++) {
            inv.setItem(i, null);
        }
    }

    private static void giveOrDrop(Player player, ItemStack item) {
        if (item == null || item.getType() == Material.AIR) {
            return;
        }
        var left = player.getInventory().addItem(item);
        for (ItemStack drop : left.values()) {
            player.getWorld().dropItemNaturally(player.getLocation(), drop);
        }
    }

    @Nullable
    private static ItemStack takeOne(Inventory inv, int slot) {
        ItemStack stack = inv.getItem(slot);
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        ItemStack one = stack.clone();
        one.setAmount(1);
        if (stack.getAmount() <= 1) {
            inv.setItem(slot, null);
        } else {
            stack.setAmount(stack.getAmount() - 1);
            inv.setItem(slot, stack);
        }
        return one;
    }

    private static void refundCursor(Player player, InventoryClickEvent event) {
        try {
            ItemStack cursor = event.getCursor();
            if (cursor != null && cursor.getType() != Material.AIR) {
                ItemStack copy = cursor.clone();
                event.setCursor(null);
                giveOrDrop(player, copy);
            }
        } catch (Throwable ignored) {
        }
    }

    private void runNextTick(Runnable fn) {
        GltcPlugin pl = plugin != null ? plugin : GltcPlugin.getInstance();
        if (pl == null) {
            try {
                fn.run();
            } catch (Throwable ignored) {
            }
            return;
        }
        Bukkit.getScheduler().runTask(pl, () -> {
            try {
                fn.run();
            } catch (Throwable t) {
                pl.getLogger().warning("[GLTC刻录仪] 延后任务异常: " + t);
            }
        });
    }

    private static void playSound(Player player, String sound, float vol, float pitch) {
        try {
            player.playSound(player.getLocation(), sound, vol, pitch);
        } catch (Throwable ignored) {
        }
    }

    private static ItemStack named(Material mat, String name, @Nullable List<String> lore) {
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

    private static ItemStack glowPane(Material mat, String name, List<String> lore) {
        ItemStack stack = named(mat, name, lore);
        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            try {
                meta.addEnchant(Enchantment.UNBREAKING, 1, true);
            } catch (Throwable ignored) {
            }
            try {
                meta.addItemFlags(ItemFlag.HIDE_ENCHANTS);
            } catch (Throwable ignored) {
            }
            stack.setItemMeta(meta);
        }
        return stack;
    }
}
