package com.linkany121.gltc.logic.credit;

import com.linkany121.gltc.GltcPlugin;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Energy-flow credit shop GUI opened from SHOP_* guide buttons. */
public final class EnergyShopGui implements Listener {

    // ===== 配置区（能源商店 GUI，改完需重新打包 jar 并重启生效）=====
    private static final int PAGE_SIZE = 28;  // 每页展示商品数（需 ≤ ITEM_SLOTS 数量）
    private static final int[] ITEM_SLOTS = {  // 商品展示槽位（54 格面板 0~53）
        10, 11, 12, 13, 14, 15, 16,
        19, 20, 21, 22, 23, 24, 25,
        28, 29, 30, 31, 32, 33, 34,
        37, 38, 39, 40, 41, 42, 43
    };
    private static final int PREV_SLOT = 48;   // 上一页按钮位置
    private static final int CLOSE_SLOT = 49;  // 关闭按钮位置
    private static final int NEXT_SLOT = 50;   // 下一页按钮位置
    private static final long COOLDOWN_MS = 250L;  // 购买防抖（毫秒），防止连点重复购买
    private static final String SUCCESS_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f]§x§F§F§B§A§6§8协§x§F§0§D§8§7§3议§x§E§2§F§5§7§D流§x§A§F§F§A§5对§x§6§B§F§F§D§B接§x§4§1§F§1§F§F成§x§4§C§C§5§F§F功§x§5§7§9§A§F§F，";
    private static final String FAIL_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f]§x§F§F§9§4§9§4协§x§D§C§8§3§C§2议§x§B§9§7§3§F§0流§x§B§0§5§D§E§E对§x§B§5§4§6§D§5接§x§B§6§3§7§B§2失§x§B§1§3§B§7§B败§x§A§C§3§F§4§5，";

    private static EnergyShopGui instance;

    private final Map<UUID, Integer> pages = new ConcurrentHashMap<>();
    private final Map<UUID, Long> cooldown = new ConcurrentHashMap<>();

    private EnergyShopGui() {
    }

    public static void register(GltcPlugin plugin) {
        if (instance != null) {
            return;
        }
        instance = new EnergyShopGui();
        Bukkit.getPluginManager().registerEvents(instance, plugin);
    }

    public static void unregister() {
        if (instance != null) {
            HandlerList.unregisterAll(instance);
            instance = null;
        }
    }

    public static void open(Player player, String shopId) {
        EnergyShopCatalog.Shop shop = EnergyShopCatalog.SHOPS.get(shopId);
        if (shop == null) {
            player.sendMessage("§c能源流商店未加载。");
            return;
        }
        CreditService credit = CreditService.get();
        if (credit == null) {
            player.sendMessage("§c信用点系统未加载，请联系管理员。");
            return;
        }
        if (instance == null) {
            GltcPlugin plugin = GltcPlugin.getInstance();
            if (plugin != null) {
                register(plugin);
            }
        }
        if (instance != null) {
            instance.pages.put(player.getUniqueId(), 0);
            player.openInventory(instance.build(player, shop, 0));
        }
    }

    private Inventory build(Player player, EnergyShopCatalog.Shop shop, int page) {
        int totalPages = Math.max(1, (int) Math.ceil(shop.items().size() / (double) PAGE_SIZE));
        if (page < 0) {
            page = 0;
        }
        if (page >= totalPages) {
            page = totalPages - 1;
        }
        Holder holder = new Holder(shop.id(), page);
        Inventory inv = Bukkit.createInventory(holder, 54, shop.title());
        holder.inventory = inv;

        ItemStack glass = pane(Material.BLUE_STAINED_GLASS_PANE, "§6 ", null);
        for (int i = 0; i < 54; i++) {
            inv.setItem(i, glass.clone());
        }

        CreditService credit = CreditService.get();

        ItemStack info = pane(Material.LIGHT_BLUE_GLAZED_TERRACOTTA, "§b协议面板用法", List.of(
            "§7使用 §b信用点 §7购买（需持有已绑定的银行卡）",
            shop.usageLine(),
            "§e第 " + (page + 1) + "/" + totalPages + " 页，共" + shop.items().size() + "种"
        ));
        inv.setItem(4, info);

        int start = page * PAGE_SIZE;
        for (int i = 0; i < ITEM_SLOTS.length; i++) {
            int idx = start + i;
            if (idx >= shop.items().size()) {
                inv.setItem(ITEM_SLOTS[i], null);
                continue;
            }
            inv.setItem(ITEM_SLOTS[i], buildOffer(shop, shop.items().get(idx), credit, player));
        }

        if (totalPages > 1) {
            if (page > 0) {
                inv.setItem(PREV_SLOT, pane(Material.ARROW, "§e← 上一页", List.of("§7点击返回上一页")));
            }
            if (page < totalPages - 1) {
                inv.setItem(NEXT_SLOT, pane(Material.ARROW, "§e下一页 →", List.of("§7点击前往下一页")));
            }
        }
        inv.setItem(CLOSE_SLOT, pane(Material.BARRIER, "§c关闭", List.of("§7关闭菜单")));
        return inv;
    }

    private ItemStack buildOffer(
        EnergyShopCatalog.Shop shop,
        EnergyShopCatalog.Offer offer,
        CreditService credit,
        Player player
    ) {
        ItemStack proto = prototype(offer);
        if (proto == null) {
            return pane(Material.BARRIER, "§c无效物品", List.of("§7ID: " + offer.id()));
        }
        ItemStack show = proto.clone();
        if ("vanilla".equals(offer.type())) {
            show.setAmount(1);
        }
        ItemMeta meta = show.getItemMeta();
        if (meta != null) {
            double cost = credit == null
                ? 0
                : credit.calcShopCreditCost(List.of(new CreditService.PriceLine(offer.priceId(), offer.priceAmt())));
            String c = CreditService.formatCredit(cost);
            List<String> lore = new ArrayList<>();
            String shopId = shop.id();
            if ("plants".equals(shopId)) {
                lore.add("§x§F§F§F§5§B§3点击即消耗 §b" + c + "△ §x§F§F§F§5§B§3信用点兑换。");
            } else if ("minerals".equals(shopId)) {
                lore.add("§x§F§F§F§5§B§3点击即消耗 §b" + c + "△ §x§F§F§F§5§B§3信用点兑换 §e" + offer.giveAmount() + " §x§F§F§F§5§B§3个。");
            } else if ("slimefun".equals(shopId)) {
                lore.add("§x§F§F§F§5§B§3消耗 §b" + c + "△ §x§F§F§F§5§B§3信用点可获得 §e1 §x§F§F§F§5§B§3个。");
                lore.add("§x§F§F§C§2§7§Bshift+点击购买 64 个物品。");
                if (offer.limit() > 0 && credit != null) {
                    int bought = credit.getLimitCount(player.getUniqueId(), offer.id());
                    int left = Math.max(0, offer.limit() - bought);
                    lore.add("§x§F§F§6§B§3§3终身限购 §c" + offer.limit() + " §x§F§F§6§B§3§3个，已购 §b" + bought + " §x§F§F§6§B§3§3个，剩余 §e" + left + " §x§F§F§6§B§3§3个");
                }
            } else {
                lore.add("§x§F§F§F§5§B§3消耗 §b" + c + "△ §x§F§F§F§5§B§3信用点可获得 §e" + offer.giveAmount() + " §x§F§F§F§5§B§3个。");
            }
            if (!"slimefun".equals(shopId)) {
                lore.add("§x§F§F§C§2§7§Bshift+点击将购买64个，但所需信用点将翻§c" + shop.batchMultiplier() + "§x§F§F§C§2§7§B倍！");
            }
            meta.setLore(lore);
            show.setItemMeta(meta);
        }
        return show;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onClick(InventoryClickEvent event) {
        if (!(event.getView().getTopInventory().getHolder() instanceof Holder holder)) {
            return;
        }
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        event.setCancelled(true);
        Inventory top = event.getView().getTopInventory();
        if (event.getClickedInventory() != top) {
            return;
        }
        EnergyShopCatalog.Shop shop = EnergyShopCatalog.SHOPS.get(holder.shopId);
        if (shop == null) {
            return;
        }
        int slot = event.getSlot();
        int page = holder.page;
        int totalPages = Math.max(1, (int) Math.ceil(shop.items().size() / (double) PAGE_SIZE));
        if (slot == PREV_SLOT && page > 0) {
            pages.put(player.getUniqueId(), page - 1);
            player.openInventory(build(player, shop, page - 1));
            return;
        }
        if (slot == NEXT_SLOT && page < totalPages - 1) {
            pages.put(player.getUniqueId(), page + 1);
            player.openInventory(build(player, shop, page + 1));
            return;
        }
        if (slot == CLOSE_SLOT) {
            player.closeInventory();
            return;
        }
        int itemIndex = -1;
        for (int i = 0; i < ITEM_SLOTS.length; i++) {
            if (ITEM_SLOTS[i] == slot) {
                itemIndex = page * PAGE_SIZE + i;
                break;
            }
        }
        if (itemIndex < 0 || itemIndex >= shop.items().size()) {
            return;
        }
        buy(player, shop, shop.items().get(itemIndex), event.isShiftClick());
        player.openInventory(build(player, shop, page));
    }

    @EventHandler
    public void onClose(InventoryCloseEvent event) {
        if (event.getView().getTopInventory().getHolder() instanceof Holder) {
            pages.remove(event.getPlayer().getUniqueId());
        }
    }

    @EventHandler
    public void onDrag(InventoryDragEvent event) {
        if (event.getView().getTopInventory().getHolder() instanceof Holder) {
            int top = event.getView().getTopInventory().getSize();
            for (int raw : event.getRawSlots()) {
                if (raw < top) {
                    event.setCancelled(true);
                    return;
                }
            }
        }
    }

    private void buy(Player player, EnergyShopCatalog.Shop shop, EnergyShopCatalog.Offer offer, boolean shift) {
        CreditService credit = CreditService.get();
        if (credit == null) {
            player.sendMessage("§c信用点系统未加载，请联系管理员。");
            return;
        }
        long now = System.currentTimeMillis();
        Long last = cooldown.put(player.getUniqueId(), now);
        if (last != null && now - last < COOLDOWN_MS) {
            player.sendMessage("§c操作过快，请稍后再试");
            return;
        }
        if (!credit.hasBoundCard(player.getInventory(), player.getUniqueId())) {
            player.sendMessage(FAIL_PREFIX + "§x§E§7§9§3§9§8背包中没有已绑定的银行卡。");
            return;
        }
        ItemStack proto = prototype(offer);
        if (proto == null) {
            player.sendMessage("§c物品配置错误");
            return;
        }
        int give = Math.max(1, offer.giveAmount());
        int times;
        if (!shift) {
            times = 1;
        } else if ("slimefun".equals(shop.id())) {
            times = 64;
        } else if (give > 1) {
            times = Math.max(1, (int) Math.ceil(64.0 / give));
        } else {
            times = 64;
        }
        int batchMul = shift ? Math.max(1, shop.batchMultiplier()) : 1;
        int totalGive = times * give;
        double unit = credit.calcShopCreditCost(List.of(new CreditService.PriceLine(offer.priceId(), offer.priceAmt())));
        double cost = unit * times * batchMul;
        if (!canFit(player, proto, totalGive)) {
            player.sendMessage("§c背包空间不足");
            return;
        }
        String limitId = offer.limit() > 0 ? offer.id() : null;
        var spend = credit.trySpendForShop(
            player.getUniqueId(), cost, limitId, offer.limit(), times
        );
        if (!spend.ok()) {
            if ("credit".equals(spend.reason())) {
                player.sendMessage(FAIL_PREFIX + "§x§E§7§9§3§9§8信用点不足，需要 §b" + CreditService.formatCredit(cost) + "△§x§E§7§9§3§9§8。");
            } else if ("limit".equals(spend.reason())) {
                if (spend.left() <= 0) {
                    // 与 粘液科技.js 一致：已达终身购买上限
                    player.sendMessage("§c该物品每人终身限购 " + offer.limit() + " 个，您已达到购买上限。");
                } else {
                    player.sendMessage("§c该物品每人终身限购 " + offer.limit() + " 个，已购 " + spend.bought() + " 个，剩余 " + spend.left() + " 个。");
                }
            } else {
                player.sendMessage("§c交易失败，请重试。");
            }
            return;
        }
        credit.giveItems(player, proto, totalGive);
        credit.updateAllCardsLore(player.getInventory(), player.getUniqueId(), player.getName(), spend.balance());
        String itemName = EnergyShopCatalog.ITEM_NAMES.getOrDefault(offer.id(), offer.id());
        player.sendMessage(successMessage(shop, times, totalGive, unit, cost, itemName, spend.balance()));
    }

    private static String successMessage(
        EnergyShopCatalog.Shop shop,
        int times,
        int totalGive,
        double unit,
        double cost,
        String itemName,
        double balance
    ) {
        String g = "§x§F§F§F§5§B§3";
        String body;
        if (times <= 1) {
            body = g + "消耗 §b" + CreditService.formatCredit(cost) + "△ " + g + "信用点兑换了 §a" + totalGive + " " + g + "个 §e" + itemName + " " + g + "。";
        } else if ("slimefun".equals(shop.id())) {
            body = g + "总计消耗 §b" + CreditService.formatCredit(cost) + "△ " + g + "信用点兑换 §c" + times + " " + g + "次，获得 §a" + totalGive + " " + g + "个 §e" + itemName + " " + g + "。";
        } else {
            int mul = Math.max(1, shop.batchMultiplier());
            body = g + "本次兑换消耗§c" + mul + g + "倍信用点，总计消耗§c" + mul + "*" + times + "*" + CreditService.formatCredit(unit) + "=" + CreditService.formatCredit(cost) + "△ " + g + "信用点，获得§a" + totalGive + " " + g + "个 §e" + itemName + " " + g + "。";
        }
        return SUCCESS_PREFIX + body + g + "当前余额：§b" + CreditService.formatCredit(balance) + "△";
    }

    private static ItemStack prototype(EnergyShopCatalog.Offer offer) {
        if ("vanilla".equals(offer.type())) {
            Material mat = Material.matchMaterial(offer.id());
            return mat != null ? new ItemStack(mat) : null;
        }
        SlimefunItem sf = SlimefunItem.getById(offer.id());
        if (sf == null) {
            sf = SlimefunItem.getById(offer.id().toUpperCase());
        }
        return sf != null ? sf.getItem().clone() : null;
    }

    private static boolean canFit(Player player, ItemStack proto, int amount) {
        Inventory clone = Bukkit.createInventory(null, 36);
        ItemStack[] contents = player.getInventory().getStorageContents();
        for (int i = 0; i < contents.length && i < 36; i++) {
            if (contents[i] != null) {
                clone.setItem(i, contents[i].clone());
            }
        }
        int left = amount;
        while (left > 0) {
            ItemStack chunk = proto.clone();
            int n = Math.min(proto.getMaxStackSize(), left);
            chunk.setAmount(n);
            if (!clone.addItem(chunk).isEmpty()) {
                return false;
            }
            left -= n;
        }
        return true;
    }

    private static ItemStack pane(Material mat, String name, List<String> lore) {
        ItemStack it = new ItemStack(mat);
        ItemMeta meta = it.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            if (lore != null) {
                meta.setLore(lore);
            }
            it.setItemMeta(meta);
        }
        return it;
    }

    private static final class Holder implements InventoryHolder {
        private final String shopId;
        private final int page;
        private Inventory inventory;

        private Holder(String shopId, int page) {
            this.shopId = shopId;
            this.page = page;
        }

        @Override
        public Inventory getInventory() {
            return inventory;
        }
    }
}
