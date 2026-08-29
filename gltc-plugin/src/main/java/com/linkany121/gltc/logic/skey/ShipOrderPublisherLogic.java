package com.linkany121.gltc.logic.skey;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.logic.common.GltcMessages;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryCreativeEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** {@code skey_舰体订单发布机} */
public final class ShipOrderPublisherLogic implements GltcMachineLogic, Listener {

    public static final String MACHINE_ID = "skey_舰体订单发布机";

    // ===== 配置区（舰体订单发布机 GUI，改完需重新打包 jar 并重启生效）=====
    private static final String GUI_TITLE = "§b舰体订单发布机";  // 面板标题（事件按标题匹配）

    private static final int[] INPUT_SLOTS = {1, 2, 3, 4, 5, 6, 7};  // 投入「空白订单」的槽位（54 格面板）
    private static final int BUTTON_1_SLOT = 10;   // 生成 1 张订单按钮
    private static final int BUTTON_7_SLOT = 11;   // 生成 7 张订单按钮
    private static final int INFO_SLOT = 13;       // 说明展示位
    private static final int BUTTON_28_SLOT = 15;  // 生成 28 张订单按钮
    private static final int[] OUTPUT_SLOTS = {    // 订单输出槽位
        19, 20, 21, 22, 23, 24, 25,
        28, 29, 30, 31, 32, 33, 34,
        37, 38, 39, 40, 41, 42, 43,
        46, 47, 48, 49, 50, 51, 52
    };
    private static final int[] BORDER_SLOTS = {0, 8, 9, 12, 14, 16, 17, 18, 26, 27, 35, 36, 44, 45, 53};  // 装饰玻璃位置（纯视觉）

    private final Set<Inventory> activeInventories = new HashSet<>();
    private final ItemStack bgItem;
    private final ItemStack infoItem;
    private final ItemStack button1;
    private final ItemStack button7;
    private final ItemStack button28;

    public ShipOrderPublisherLogic() {
        bgItem = ShipOrderSupport.pane(Material.BLUE_STAINED_GLASS_PANE, "§0", null);
        infoItem = ShipOrderSupport.pane(Material.BOOKSHELF, "§b§l▣ 舰体订单发布机", List.of(
            "§7第1行投入 §e空白订单§7，",
            "§7按下按钮将分别生成：§a1张§7 / §e7张§7 / §c28张 §7订单。",
            "§7订单等级 I/V/X 级，报酬以 I/V/X 等货币结算。"
        ));
        button1 = ShipOrderSupport.pane(Material.LIME_STAINED_GLASS_PANE, "§a§l✔ 生成 1 张",
            List.of("§7消耗 §e1张空白订单§7 生成1张订单"));
        button7 = ShipOrderSupport.pane(Material.YELLOW_STAINED_GLASS_PANE, "§e§l✔ 生成 7 张",
            List.of("§7消耗 §e7张空白订单§7 生成7张订单"));
        button28 = ShipOrderSupport.pane(Material.RED_STAINED_GLASS_PANE, "§c§l✔ 生成 28 张",
            List.of("§7消耗 §e28张空白订单§7 生成28张订单", "§7将填满下方全部输出区"));
    }

    public void register(GltcPlugin plugin) {
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        activeInventories.clear();
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        if (event.getClickedBlock().isEmpty()) {
            return false;
        }
        Player player = event.getPlayer();
        Inventory inv = Bukkit.createInventory(null, 54, GUI_TITLE);
        for (int slot : BORDER_SLOTS) {
            inv.setItem(slot, bgItem.clone());
        }
        inv.setItem(BUTTON_1_SLOT, button1.clone());
        inv.setItem(BUTTON_7_SLOT, button7.clone());
        inv.setItem(INFO_SLOT, infoItem.clone());
        inv.setItem(BUTTON_28_SLOT, button28.clone());
        activeInventories.add(inv);
        player.openInventory(inv);
        return true;
    }

    @EventHandler(priority = EventPriority.NORMAL)
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
        Inventory clicked = event.getClickedInventory();
        int slot = event.getRawSlot();
        if (clicked != top) {
            return;
        }
        if (slot == BUTTON_1_SLOT || slot == BUTTON_7_SLOT || slot == BUTTON_28_SLOT) {
            event.setCancelled(true);
            if (event.isShiftClick()) {
                return;
            }
            int count = slot == BUTTON_1_SLOT ? 1 : (slot == BUTTON_7_SLOT ? 7 : 28);
            processGenerate(player, top, count);
            return;
        }
        if (isFreeSlot(slot)) {
            return;
        }
        event.setCancelled(true);
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onDrag(InventoryDragEvent event) {
        Inventory top = event.getView().getTopInventory();
        if (!activeInventories.contains(top)) {
            return;
        }
        int topSize = top.getSize();
        for (int raw : event.getRawSlots()) {
            if (raw < topSize && !isFreeSlot(raw)) {
                event.setCancelled(true);
                return;
            }
        }
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onClose(InventoryCloseEvent event) {
        Inventory inv = event.getInventory();
        if (!activeInventories.contains(inv)) {
            return;
        }
        if (event.getPlayer() instanceof Player player) {
            returnSlots(player, inv, INPUT_SLOTS);
            returnSlots(player, inv, OUTPUT_SLOTS);
        }
        activeInventories.remove(inv);
    }

    private void processGenerate(Player player, Inventory inv, int count) {
        int total = countBlankOrders(inv);
        if (total < count) {
            player.sendMessage(GltcMessages.prefixed(
                "§c空白订单不足！需要 §e" + count + "张§c，当前仅 §e" + total + "§c张。"));
            return;
        }
        // 与 舰体订单发布机.js 一致：先在内存生成全部订单，确认至少成功一张后再消耗空白订单，避免吞材料
        List<ItemStack> items = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ShipOrderSupport.OrderData order = ShipOrderCatalog.generateOrder(count);
            if (order == null) {
                continue;
            }
            items.add(ShipOrderCatalog.buildOrderItem(order));
        }
        if (items.isEmpty()) {
            player.sendMessage(GltcMessages.prefixed(
                "§c生成订单失败：无法获取 §e" + ShipOrderSupport.ORDER_ITEM_ID + " §c物品！空白订单未消耗。"));
            return;
        }
        consumeBlankOrders(inv, count);
        placeOrders(player, inv, items);

        try {
            player.getWorld().spawnParticle(Particle.ENCHANT, player.getLocation(), 30, 0.4, 0.4, 0.4, 0.6);
        } catch (Throwable ignored) {
        }
        try {
            player.getWorld().playSound(player.getLocation(), Sound.BLOCK_ENCHANTMENT_TABLE_USE, 0.8f, 1.2f);
        } catch (Throwable ignored) {
        }
        try {
            player.getWorld().playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 0.6f, 1.3f);
        } catch (Throwable ignored) {
        }
        player.sendMessage(GltcMessages.prefixed("§b对接成功！已接收 §f" + items.size() + "§b 张订单！"));
    }

    private static int countBlankOrders(Inventory inv) {
        int total = 0;
        for (int slot : INPUT_SLOTS) {
            ItemStack it = inv.getItem(slot);
            if (ShipOrderSupport.isBlankOrder(it)) {
                total += it.getAmount();
            }
        }
        return total;
    }

    private static void consumeBlankOrders(Inventory inv, int count) {
        int remain = count;
        for (int i = 0; i < INPUT_SLOTS.length && remain > 0; i++) {
            ItemStack it = inv.getItem(INPUT_SLOTS[i]);
            if (!ShipOrderSupport.isBlankOrder(it)) {
                continue;
            }
            if (it.getAmount() <= remain) {
                remain -= it.getAmount();
                inv.setItem(INPUT_SLOTS[i], null);
            } else {
                it.setAmount(it.getAmount() - remain);
                remain = 0;
            }
        }
    }

    private static void placeOrders(Player player, Inventory inv, List<ItemStack> orderItems) {
        for (ItemStack orderItem : orderItems) {
            boolean placed = false;
            for (int slot : OUTPUT_SLOTS) {
                ItemStack cur = inv.getItem(slot);
                if (cur == null || cur.getType() == Material.AIR) {
                    inv.setItem(slot, orderItem);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                ShipOrderSupport.giveOrDrop(player, orderItem);
            }
        }
    }

    private static void returnSlots(Player player, Inventory inv, int[] slots) {
        for (int slot : slots) {
            ItemStack it = inv.getItem(slot);
            if (it == null || it.getType() == Material.AIR) {
                continue;
            }
            ShipOrderSupport.giveOrDrop(player, it);
            inv.setItem(slot, null);
        }
    }

    private static boolean isFreeSlot(int slot) {
        for (int s : INPUT_SLOTS) {
            if (s == slot) {
                return true;
            }
        }
        for (int s : OUTPUT_SLOTS) {
            if (s == slot) {
                return true;
            }
        }
        return false;
    }
}
