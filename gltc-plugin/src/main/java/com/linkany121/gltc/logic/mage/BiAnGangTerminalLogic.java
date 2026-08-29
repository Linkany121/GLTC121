package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.ClickType;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;

import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@code VASA_彼岸钢调控终端} — admin mage level / potential panel.
 */
public final class BiAnGangTerminalLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "VASA_彼岸钢调控终端";

    // ===== 配置区（管理员调控终端 GUI，改完需重新打包 jar 并重启生效）=====
    /** 与 调控终端.js GUI_TITLE 一致。 */
    private static final String GUI_TITLE = "§c§l彼岸钢™ · 领域管控终端";  // 面板标题，需与 调控终端.js 一致否则事件不匹配
    private static final String PREFIX =
        "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";  // 消息前缀（彩色文本，通常无需改动）

    private static final int SLOT_INFO = 4;        // 面板 27 格中「说明」按钮位置（0~26）
    private static final int SLOT_LEVEL = 11;      // 「等级」按钮位置
    private static final int SLOT_MAGE_PTS = 13;   // 「术士潜能」按钮位置
    private static final int SLOT_BODY_PTS = 15;   // 「体能潜能」按钮位置
    private static final int SLOT_RESET = 22;      // 「重置」按钮位置（重置确认时限在下方逻辑中写死为 5 秒）

    private static BiAnGangTerminalLogic instance;

    private final Map<Inventory, Session> sessions = new IdentityHashMap<>();
    private final Map<UUID, Long> resetConfirmUntil = new ConcurrentHashMap<>();

    private BiAnGangTerminalLogic() {
    }

    public static void register(GltcPlugin plugin) {
        unregister();
        BiAnGangTerminalLogic logic = new BiAnGangTerminalLogic();
        instance = logic;
        GltcLogicRegistry.registerItem(ITEM_ID, logic);
        Bukkit.getPluginManager().registerEvents(logic, plugin);
    }

    public static void unregister() {
        BiAnGangTerminalLogic logic = instance;
        if (logic == null) {
            return;
        }
        instance = null;
        HandlerList.unregisterAll(logic);
        logic.sessions.clear();
        logic.resetConfirmUntil.clear();
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        if (!isAdmin(player)) {
            player.sendMessage(PREFIX + "§c仅管理员可使用彼岸钢™领域管控终端。");
            return true;
        }
        MageService svc = MageService.get();
        if (svc == null) {
            player.sendMessage(PREFIX + "§c术士核心加载失败。");
            return true;
        }
        UUID uuid = player.getUniqueId();
        MageStats stats = svc.getPlayerStats(uuid);
        Inventory inv = Bukkit.createInventory(null, 27, GUI_TITLE);
        Session session = new Session(uuid, stats.copy(), false, false);
        synchronized (sessions) {
            sessions.put(inv, session);
        }
        refreshGui(inv, session);
        player.openInventory(inv);
        return true;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        Inventory top = event.getView().getTopInventory();
        Session session;
        synchronized (sessions) {
            session = sessions.get(top);
        }
        if (session == null) {
            return;
        }
        event.setCancelled(true);
        if (!isAdmin(player)) {
            player.closeInventory();
            player.sendMessage(PREFIX + "§c权限已失效。");
            return;
        }
        if (event.getClickedInventory() == null || event.getClickedInventory() != top) {
            return;
        }
        int raw = event.getRawSlot();
        int delta = deltaFromClick(event);
        if (raw == SLOT_LEVEL && delta != 0) {
            int old = session.stats.mageLevel;
            int next = Math.max(0, Math.min(8, old + delta));
            if (next == old) {
                player.sendMessage(PREFIX + "§c已达等级边界 (0~8)");
            } else {
                session.stats.mageLevel = next;
                session.dirty = true;
                player.sendMessage(PREFIX + "§a术士等级：§f" + old + " §7→ §e" + next + " §8(待关闭保存)");
            }
            refreshGui(top, session);
            return;
        }
        if (raw == SLOT_MAGE_PTS && delta != 0) {
            session.stats.magePotential = Math.max(0, session.stats.magePotential + delta);
            session.dirty = true;
            player.sendMessage(PREFIX + "§a术士潜能：§e" + session.stats.magePotential + " §8(待关闭保存)");
            refreshGui(top, session);
            return;
        }
        if (raw == SLOT_BODY_PTS && delta != 0) {
            session.stats.bodyPotential = Math.max(0, session.stats.bodyPotential + delta);
            session.dirty = true;
            player.sendMessage(PREFIX + "§a体能潜能：§e" + session.stats.bodyPotential + " §8(待关闭保存)");
            refreshGui(top, session);
            return;
        }
        if (raw == SLOT_RESET) {
            long now = System.currentTimeMillis();
            Long until = resetConfirmUntil.get(session.uuid);
            if (until == null || now > until) {
                resetConfirmUntil.put(session.uuid, now + 5000L);
                player.sendMessage(PREFIX + "§e请在 §c5 §e秒内再次点击确认重置。");
                refreshGui(top, session);
                return;
            }
            resetConfirmUntil.remove(session.uuid);
            session.stats = MageStats.defaults();
            session.resetAll = true;
            session.dirty = true;
            player.sendMessage(PREFIX + "§c已标记重置，§e关闭面板后写入并生效。");
            refreshGui(top, session);
        }
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onDrag(InventoryDragEvent event) {
        Inventory top = event.getView().getTopInventory();
        synchronized (sessions) {
            if (sessions.containsKey(top)) {
                event.setCancelled(true);
            }
        }
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onClose(InventoryCloseEvent event) {
        if (!(event.getPlayer() instanceof Player player)) {
            return;
        }
        Inventory inv = event.getInventory();
        Session session;
        synchronized (sessions) {
            session = sessions.remove(inv);
        }
        resetConfirmUntil.remove(player.getUniqueId());
        if (session == null) {
            return;
        }
        commit(player, session);
    }

    private void commit(Player player, Session session) {
        MageService svc = MageService.get();
        if (svc == null) {
            return;
        }
        if (!session.dirty && !session.resetAll) {
            player.sendMessage(PREFIX + "§7调控终端已关闭，无改动。");
            return;
        }
        if (session.resetAll) {
            MageService.AdminResetResult rr = svc.adminResetAllData(player);
            if (rr.ok()) {
                player.sendMessage(PREFIX + "§c已重置并写入全部术士数据"
                    + (rr.returned() > 0 ? (" §7(归还装备 §e" + rr.returned() + " §7件)") : ""));
            } else {
                player.sendMessage(PREFIX + "§c重置写入失败");
            }
            return;
        }
        boolean ok = svc.savePlayerStats(session.uuid, session.stats);
        svc.applyMageAttributes(player);
        player.sendMessage(ok ? PREFIX + "§a调控数据已写入并存档生效。" : PREFIX + "§c写入存档失败。");
    }

    private void refreshGui(Inventory inv, Session session) {
        ItemStack filler = MageItems.named(Material.GRAY_STAINED_GLASS_PANE, "§0", List.of());
        for (int i = 0; i < 27; i++) {
            inv.setItem(i, filler);
        }
        MageStats data = session.stats;
        inv.setItem(SLOT_INFO, MageItems.named(Material.BOOK, "§c§l调控说明", List.of(
            "§7仅对自己生效 · §e关闭面板时才写入文件",
            "§e左键 §f+1  §eShift+左键 §f+10",
            "§e右键 §f-1  §eShift+右键 §f-10",
            "§c重置需在 5 秒内连点两次确认",
            session.dirty ? "§a※ 有未保存修改，关闭后写入" : "§8当前与存档一致",
            "§8权限: OP / gltc.admin / vasa.admin"
        )));
        inv.setItem(SLOT_LEVEL, MageItems.named(Material.EXPERIENCE_BOTTLE,
            "§d术士等级 §f" + data.mageLevel + "§7/§f8", List.of(
                "§7当前等级：§f" + data.mageLevel,
                "§e左键 §a+1 §8· §e右键 §c-1",
                "§eShift+左/右键 §f±10（仍钳制 0~8）",
                "§8不自动发放潜能 · 关闭时保存"
            )));
        inv.setItem(SLOT_MAGE_PTS, MageItems.named(Material.AMETHYST_SHARD,
            "§b术士潜能 §f" + data.magePotential, List.of(
                "§7未分配术士潜能点数",
                "§e左键 §a+1 §8· §e右键 §c-1",
                "§eShift+左/右键 §f±10",
                "§8下限 0 · 关闭时保存"
            )));
        inv.setItem(SLOT_BODY_PTS, MageItems.named(Material.IRON_CHESTPLATE,
            "§a体能潜能 §f" + data.bodyPotential, List.of(
                "§7未分配体能潜能点数",
                "§e左键 §a+1 §8· §e右键 §c-1",
                "§eShift+左/右键 §f±10",
                "§8下限 0 · 关闭时保存"
            )));
        long now = System.currentTimeMillis();
        Long until = resetConfirmUntil.get(session.uuid);
        int confirmLeft = (until != null && now < until) ? (int) Math.ceil((until - now) / 1000.0) : 0;
        inv.setItem(SLOT_RESET, MageItems.named(Material.BARRIER, "§c§l重置全部数据", List.of(
            "§7恢复默认数值、清空装备槽",
            "§7已装备组件会在关闭时归还",
            "§7并刷新属性缓存",
            confirmLeft > 0
                ? ("§e请在 §c" + confirmLeft + "§e 秒内再点一次确认")
                : "§c点击一次进入确认，再点一次标记重置",
            session.resetAll ? "§4已标记重置 · 关闭面板后执行并写盘" : "§8关闭面板时才会真正写入",
            "§4此操作不可撤销"
        )));
    }

    private static int deltaFromClick(InventoryClickEvent event) {
        ClickType click = event.getClick();
        int step = event.isShiftClick() ? 10 : 1;
        if (click == ClickType.LEFT || click == ClickType.SHIFT_LEFT) {
            return step;
        }
        if (click == ClickType.RIGHT || click == ClickType.SHIFT_RIGHT) {
            return -step;
        }
        return 0;
    }

    private static boolean isAdmin(Player player) {
        return player.isOp()
            || player.hasPermission("gltc.admin")
            || player.hasPermission("vasa.admin")
            || player.hasPermission("gltc.mage.admin");
    }

    private static final class Session {
        final UUID uuid;
        MageStats stats;
        boolean dirty;
        boolean resetAll;

        Session(UUID uuid, MageStats stats, boolean dirty, boolean resetAll) {
            this.uuid = uuid;
            this.stats = stats;
            this.dirty = dirty;
            this.resetAll = resetAll;
        }
    }
}
