package com.linkany121.gltc.logic.credit;

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
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** {@code ATO_能源流储蓄站} — deposit materials for credit. */
public final class CreditChargerLogic implements GltcMachineLogic, Listener {

    public static final String MACHINE_ID = "ATO_能源流储蓄站";

    // ===== 配置区（能源流储蓄站，改完需重新打包 jar 并重启生效）=====
    /** 与 充值机.js GUI_TITLE 一致。 */
    private static final String GUI_TITLE = "§c能源流拇指终端站点";  // 面板标题（需与 充值机.js 一致）

    private static final int[] INPUT_SLOTS = {  // 可放入待充物品的槽位（54 格面板 0~53）
        2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 29, 30, 31, 32, 33
    };
    private static final int CONFIRM_SLOT = 35;   // 确认充值按钮的位置
    private static final int PURPLE_SLOT = 53;    // 紫色「可兑换清单」展示位
    private static final int[] WHITE_SLOTS = {0, 8, 9, 17, 18, 26, 27, 45, 47, 48, 49, 50, 51};  // 白色装饰玻璃位置（纯视觉）
    private static final int[] BLACK_SLOTS = {    // 黑色装饰玻璃位置（纯视觉）
        1, 7, 10, 16, 19, 25, 28, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 46, 52
    };

    private static final Map<String, String> ITEM_NAMES = Map.ofEntries(  // 物品 ID → 中文名（仅用于消息/清单显示，与 充值机.js 一致）
        Map.entry("AL_A1", "基本地层物质"), Map.entry("AL_A2", "基本金属物质"),
        Map.entry("AL_A3", "基本有机物质"), Map.entry("AL_A4", "简单晶体单元"),
        Map.entry("AL_A5", "简单编织单元"), Map.entry("AL_A6", "简单能量单元"),
        Map.entry("AL_B1", "基础涵粒子容器"),
        Map.entry("TSTL", "银泰拉矿"), Map.entry("TSSY", "水源质层岩"), Map.entry("TSG", "锆居石"),
        Map.entry("TSHH", "花海磺英"), Map.entry("TSYY", "忧郁物质"), Map.entry("TSBD", "铋锭"),
        Map.entry("TSTLS", "蓝泰拉石"), Map.entry("TSND", "烙锭"), Map.entry("TSJJ", "水源结晶"),
        Map.entry("TSGD", "锆锭"), Map.entry("TSXT", "变质稀土淀粉"),
        Map.entry("TSTJ", "天界魔素"), Map.entry("TSDBG", "钴蛋白锭"), Map.entry("TSBTL", "变态磷"),
        Map.entry("TSJLD", "氢晶镎锭"), Map.entry("TSYM", "燕麦冰淇淋"), Map.entry("TSLD", "缄默镧锭"),
        Map.entry("TSYD", "噪点镱锭"), Map.entry("TSDD", "锚定铥锭"),
        Map.entry("TSPJD", "榆芒珀金锭"), Map.entry("TSCH", "炽花旋索"), Map.entry("TSSKD", "斯卡蒂钙锭"),
        Map.entry("TSLKS", "熔融倪克斯胶"), Map.entry("TSYMY", "燕麦源质"), Map.entry("TSDJL", "巨角鹿王锭"),
        Map.entry("TSGWHS", "高温厥化石"), Map.entry("TSTHYY", "氮化云英")
    );

    private final Set<Inventory> activeInventories = new HashSet<>();
    private final Set<UUID> processingPlayers = new HashSet<>();

    private final ItemStack whiteItem;
    private final ItemStack blackItem;
    private final ItemStack purpleItem;
    private final ItemStack confirmButton;

    public CreditChargerLogic() {
        whiteItem = pane(Material.WHITE_STAINED_GLASS_PANE, "§0", null);
        blackItem = pane(Material.BLACK_STAINED_GLASS_PANE, "§0", null);
        purpleItem = pane(Material.PURPLE_STAINED_GLASS_PANE, "§d§l▣ 可兑换物品清单", List.of(
            "§e━━━ §f0.5△/个 §e━━━",
            "§f基本地层物质  基本金属物质",
            "§f基本有机物质  简单晶体单元",
            "§f简单编织单元  简单能量单元",
            "§e━━━ §f1△/个 §e━━━",
            "§f基础涵粒子容器  银泰拉矿",
            "§f水源质层岩  锆居石",
            "§e━━━ §f2△/个 §e━━━",
            "§f花海磺英  忧郁物质  铋锭",
            "§f蓝泰拉石  烙锭  水源结晶",
            "§f锆锭  变质稀土淀粉",
            "§e━━━ §f3△/个 §e━━━",
            "§f天界魔素  钴蛋白锭  变态磷",
            "§f氢晶镎锭  燕麦冰淇淋  缄默镧锭",
            "§f噪点镱锭  锚定铥锭",
            "§e━━━ §f4△/个 §e━━━",
            "§f榆芒珀金锭  炽花旋索  斯卡蒂钙锭",
            "§f熔融倪克斯胶  燕麦源质  巨角鹿王锭",
            "§f高温厥化石  氮化云英"
        ));
        confirmButton = pane(Material.LIME_STAINED_GLASS_PANE, "§a§l✔ 确认兑换", List.of(
            "§7将可兑换材料放入输入槽",
            "§7点击此处将全部材料兑换为能源流信用点",
            "§7§o需要背包中存在已绑定的银行卡"
        ));
    }

    public void registerListener(GltcPlugin plugin) {
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregisterListener() {
        HandlerList.unregisterAll(this);
        activeInventories.clear();
        processingPlayers.clear();
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        if (event.getClickedBlock().isEmpty()) {
            return false;
        }
        Player player = event.getPlayer();
        Inventory inv = Bukkit.createInventory(null, 54, GUI_TITLE);
        for (int slot : WHITE_SLOTS) {
            inv.setItem(slot, whiteItem.clone());
        }
        for (int slot : BLACK_SLOTS) {
            inv.setItem(slot, blackItem.clone());
        }
        inv.setItem(CONFIRM_SLOT, confirmButton.clone());
        inv.setItem(PURPLE_SLOT, purpleItem.clone());
        activeInventories.add(inv);
        player.openInventory(inv);
        return true;
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onClick(InventoryClickEvent event) {
        Inventory top = event.getView().getTopInventory();
        if (!activeInventories.contains(top)) {
            return;
        }
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        Inventory clicked = event.getClickedInventory();
        int slot = event.getRawSlot();
        if (clicked == top) {
            if (slot == CONFIRM_SLOT) {
                event.setCancelled(true);
                ItemStack cur = event.getCurrentItem();
                if (cur == null || cur.getType() == Material.AIR) {
                    return;
                }
                ItemMeta meta = cur.getItemMeta();
                if (meta == null || !meta.hasDisplayName() || !"§a§l✔ 确认兑换".equals(meta.getDisplayName())) {
                    return;
                }
                processExchange(player, top);
            } else if (!isInputSlot(slot)) {
                event.setCancelled(true);
            }
        }
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onClose(InventoryCloseEvent event) {
        Inventory inv = event.getInventory();
        if (!activeInventories.contains(inv)) {
            return;
        }
        if (event.getPlayer() instanceof Player player) {
            for (int slot : INPUT_SLOTS) {
                ItemStack stack = inv.getItem(slot);
                if (stack == null || stack.getType() == Material.AIR) {
                    continue;
                }
                var left = player.getInventory().addItem(stack);
                for (ItemStack drop : left.values()) {
                    player.getWorld().dropItemNaturally(player.getLocation(), drop);
                }
                inv.setItem(slot, null);
            }
        }
        activeInventories.remove(inv);
    }

    private void processExchange(Player player, Inventory inv) {
        CreditService credit = CreditService.get();
        if (credit == null) {
            player.sendMessage(GltcMessages.prefixed("§c信用点系统未加载，请联系管理员。"));
            return;
        }
        if (processingPlayers.contains(player.getUniqueId())) {
            player.sendMessage(GltcMessages.prefixed("§c正在处理上一次兑换，请稍候…"));
            return;
        }

        Map<String, Integer> itemCounts = new HashMap<>();
        int totalItems = 0;
        Map<String, Double> rates = credit.depositRates();

        for (int slot : INPUT_SLOTS) {
            ItemStack stack = inv.getItem(slot);
            if (stack == null || stack.getType() == Material.AIR) {
                continue;
            }
            String id = credit.getSlimefunId(stack);
            if (id == null || !rates.containsKey(id)) {
                continue;
            }
            int amt = stack.getAmount();
            itemCounts.merge(id, amt, Integer::sum);
            totalItems += amt;
        }

        if (totalItems <= 0) {
            player.sendMessage(GltcMessages.prefixed("§c输入槽中没有可兑换的材料！"));
            return;
        }

        UUID uuid = player.getUniqueId();
        if (!credit.hasBoundCard(player.getInventory(), uuid)) {
            player.sendMessage(GltcMessages.prefixed("§c背包中没有已绑定的 §e能源流信用储蓄凭证(银行卡)§c！"));
            return;
        }

        double gained = 0;
        for (Map.Entry<String, Integer> e : itemCounts.entrySet()) {
            gained += credit.calcDepositCredit(e.getKey(), e.getValue());
        }

        processingPlayers.add(uuid);
        try {
            Double newCredit = credit.addCredit(uuid, gained);
            if (newCredit == null) {
                player.sendMessage(GltcMessages.prefixed("§c信用点写入失败，请重试！"));
                return;
            }
            for (int slot : INPUT_SLOTS) {
                ItemStack stack = inv.getItem(slot);
                if (stack == null || stack.getType() == Material.AIR) {
                    continue;
                }
                String sid = credit.getSlimefunId(stack);
                if (sid == null || !rates.containsKey(sid)) {
                    continue;
                }
                inv.setItem(slot, null);
            }
            credit.updateAllCardsLore(player.getInventory(), uuid, player.getName(), newCredit);
            try {
                player.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, player.getLocation(), 10, 0.4, 0.4, 0.4, 0.15);
            } catch (Throwable ignored) {
            }
            try {
                player.getWorld().playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 0.6f, 1.3f);
            } catch (Throwable ignored) {
            }

            List<String> parts = new ArrayList<>();
            for (Map.Entry<String, Integer> e : itemCounts.entrySet()) {
                parts.add("§b" + e.getValue() + "个 §e" + ITEM_NAMES.getOrDefault(e.getKey(), e.getKey()));
            }
            player.sendMessage(GltcMessages.prefixed(
                "§a本次转化了 " + String.join("§a，", parts)
                    + "§a，总共转化 §b" + totalItems + "次§a，获得 §b"
                    + CreditService.formatCredit(gained) + "△ §a信用点！当前余额：§b"
                    + CreditService.formatCredit(newCredit) + "△"
            ));
        } finally {
            processingPlayers.remove(uuid);
        }
    }

    private static boolean isInputSlot(int slot) {
        for (int s : INPUT_SLOTS) {
            if (s == slot) {
                return true;
            }
        }
        return false;
    }

    private static ItemStack pane(Material mat, String name, List<String> lore) {
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
}
