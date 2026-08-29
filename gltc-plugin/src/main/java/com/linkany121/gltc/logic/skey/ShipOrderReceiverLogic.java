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
import org.bukkit.inventory.PlayerInventory;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_I;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_V;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_X;

/** {@code skey_舰体订单接收机} */
public final class ShipOrderReceiverLogic implements GltcMachineLogic, Listener {

    public static final String MACHINE_ID = "skey_舰体订单接收机";

    // ===== 配置区（舰体订单接收机 GUI，改完需重新打包 jar 并重启生效）=====
    private static final String GUI_TITLE = "§b舰体订单接收机";  // 面板标题（事件按标题匹配）
    private static final int INFO_SLOT = 10;    // 说明展示位（27 格面板）
    private static final int[] ORDER_SLOTS = {12, 13, 14};  // 可放入订单的槽位
    private static final int CONFIRM_SLOT = 16;  // 确认提交按钮位置
    private static final int[] BORDER_SLOTS = {  // 装饰玻璃位置（纯视觉）
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26
    };

    private final Set<Inventory> activeInventories = new HashSet<>();
    private final ItemStack bgItem;
    private final ItemStack infoItem;
    private final ItemStack confirmButton;

    public ShipOrderReceiverLogic() {
        bgItem = ShipOrderSupport.pane(Material.BLUE_STAINED_GLASS_PANE, "§0", null);
        infoItem = ShipOrderSupport.pane(Material.BOOKSHELF, "§b§l▣ 舰体订单接收机", List.of(
            "§7中间可放置订单，",
            "§7点击 §a✔确认交付 §7时，从左到右依次结算；",
            "§7每次按下只交付 §e1张 §7订单。",
            "§7交付时自动从 §e背包中§7 搜索并扣除物资，",
            "§7报酬按订单等级发放 I/V/X 等舰体货币，",
            "§7关闭菜单会自动返还所有订单。"
        ));
        confirmButton = ShipOrderSupport.pane(Material.LIME_STAINED_GLASS_PANE, "§a§l✔ 确认交付", List.of(
            "§7交付 §e1张 §7订单，",
            "§7自动检索背包物资并结算。"
        ));
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
        Inventory inv = Bukkit.createInventory(null, 27, GUI_TITLE);
        for (int slot : BORDER_SLOTS) {
            inv.setItem(slot, bgItem.clone());
        }
        inv.setItem(INFO_SLOT, infoItem.clone());
        inv.setItem(CONFIRM_SLOT, confirmButton.clone());
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
        if (slot == CONFIRM_SLOT) {
            event.setCancelled(true);
            if (event.isShiftClick()) {
                return;
            }
            processDeliver(player, top);
            return;
        }
        if (isOrderSlot(slot)) {
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
            if (raw < topSize && !isOrderSlot(raw)) {
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
            for (int slot : ORDER_SLOTS) {
                ItemStack it = inv.getItem(slot);
                if (it == null || it.getType() == Material.AIR) {
                    continue;
                }
                ShipOrderSupport.giveOrDrop(player, it);
                inv.setItem(slot, null);
            }
        }
        activeInventories.remove(inv);
    }

    private void processDeliver(Player player, Inventory inv) {
        // 与 舰体订单接收机.js 一致：前置校验舰体货币模块，不可用则不扣任何物资
        if (ShipCurrencyService.get() == null) {
            player.sendMessage(GltcMessages.prefixed(
                "§c舰体货币系统加载失败，无法结算订单报酬！请联系管理员检查 _舰体货币.js。"));
            return;
        }
        for (int slot : ORDER_SLOTS) {
            ItemStack orderStack = inv.getItem(slot);
            if (!ShipOrderSupport.isOrder(orderStack)) {
                continue;
            }
            ShipOrderSupport.OrderData data = ShipOrderSupport.readOrderData(orderStack);
            if (data == null) {
                continue;
            }
            String err = deliverOne(player, data);
            if (err != null) {
                continue;
            }
            if (orderStack.getAmount() > 1) {
                orderStack.setAmount(orderStack.getAmount() - 1);
            } else {
                inv.setItem(slot, null);
            }

            int totalNeeds = 0;
            for (ShipOrderSupport.NeedItem n : data.items()) {
                totalNeeds += n.amount();
            }

            try {
                player.getWorld().spawnParticle(Particle.ENCHANT, player.getLocation(), 30, 0.4, 0.4, 0.4, 0.6);
            } catch (Throwable ignored) {
            }
            try {
                player.getWorld().playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 0.6f, 1.3f);
            } catch (Throwable ignored) {
            }

            ShipCurrencyService currency = ShipCurrencyService.get();
            ShipCurrencyService.Balance bal = currency != null
                ? currency.get(player.getUniqueId())
                : ShipCurrencyService.Balance.ZERO;
            String color = currencyColor(data.rewardType());
            String name = currencyName(data.rewardType());
            player.sendMessage(GltcMessages.prefixed(
                "§3对接成功！本次交付 §e" + totalNeeds + "§3 个物品，获得 "
                    + color + name + "§3 ×" + data.rewardAmount() + "§3！"));
            player.sendMessage(GltcMessages.prefixed(
                "§3当前舰体货币："
                    + C_I + "I等 " + bal.i + " §7| "
                    + C_V + "V等 " + bal.v + " §7| "
                    + C_X + "X等 " + bal.x));
            return;
        }

        boolean hasOrder = false;
        for (int slot : ORDER_SLOTS) {
            if (ShipOrderSupport.isOrder(inv.getItem(slot))) {
                hasOrder = true;
                break;
            }
        }
        if (!hasOrder) {
            player.sendMessage(GltcMessages.prefixed("§e请先放入舰体订单！"));
        } else {
            player.sendMessage(GltcMessages.prefixed("§c没有可交付的订单！（背包中物资不足或订单数据异常）。"));
        }
    }

    /** @return null on success, error message otherwise */
    private static String deliverOne(Player player, ShipOrderSupport.OrderData data) {
        for (ShipOrderSupport.NeedItem need : data.items()) {
            int avail = countInPlayerInventory(player, need);
            if (avail < need.amount()) {
                return "§c背包中 §e" + need.itemId() + " §f×" + need.amount()
                    + " §c不足（当前 §e" + avail + "§c）！";
            }
        }
        List<List<ItemStack>> allTaken = new ArrayList<>();
        for (ShipOrderSupport.NeedItem need : data.items()) {
            TakeResult result = takeFromPlayerInventory(player, need);
            if (!result.ok()) {
                restoreTaken(player, allTaken);
                return "§c交付失败：物资扣除异常，已回滚已扣物品。";
            }
            allTaken.add(result.taken());
        }
        ShipCurrencyService currency = ShipCurrencyService.get();
        if (currency == null) {
            restoreTaken(player, allTaken);
            return "§c舰体货币系统加载失败，无法结算订单报酬！请联系管理员检查 _舰体货币.js。";
        }
        currency.add(player.getUniqueId(), data.rewardType(), data.rewardAmount());
        return null;
    }

    private static int countInPlayerInventory(Player player, ShipOrderSupport.NeedItem need) {
        PlayerInventory inv = player.getInventory();
        int total = 0;
        for (int i = 0; i < inv.getSize(); i++) {
            ItemStack s = inv.getItem(i);
            if (ShipOrderSupport.matchNeed(need, s)) {
                total += s.getAmount();
            }
        }
        return total;
    }

    private static TakeResult takeFromPlayerInventory(Player player, ShipOrderSupport.NeedItem need) {
        List<ItemStack> taken = new ArrayList<>();
        int remain = need.amount();
        PlayerInventory inv = player.getInventory();
        for (int i = 0; i < inv.getSize() && remain > 0; i++) {
            ItemStack s = inv.getItem(i);
            if (!ShipOrderSupport.matchNeed(need, s)) {
                continue;
            }
            int takeAmt = Math.min(s.getAmount(), remain);
            ItemStack piece = s.clone();
            piece.setAmount(takeAmt);
            taken.add(piece);
            if (s.getAmount() <= remain) {
                remain -= s.getAmount();
                inv.setItem(i, null);
            } else {
                s.setAmount(s.getAmount() - remain);
                remain = 0;
            }
        }
        return new TakeResult(remain == 0, taken);
    }

    private static void restoreTaken(Player player, List<List<ItemStack>> allTaken) {
        for (List<ItemStack> stacks : allTaken) {
            for (ItemStack stack : stacks) {
                ShipOrderSupport.giveOrDrop(player, stack);
            }
        }
    }

    private static boolean isOrderSlot(int slot) {
        for (int s : ORDER_SLOTS) {
            if (s == slot) {
                return true;
            }
        }
        return false;
    }

    private static String currencyName(String type) {
        return switch (type) {
            case "V" -> "V等货币";
            case "X" -> "X等货币";
            default -> "I等货币";
        };
    }

    private static String currencyColor(String type) {
        return switch (type) {
            case "V" -> C_V;
            case "X" -> C_X;
            default -> C_I;
        };
    }

    private record TakeResult(boolean ok, List<ItemStack> taken) {
    }
}
