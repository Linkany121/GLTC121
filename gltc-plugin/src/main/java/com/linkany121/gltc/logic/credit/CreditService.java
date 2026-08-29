package com.linkany121.gltc.logic.credit;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcDataPaths;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

import javax.annotation.Nullable;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;
import java.util.logging.Level;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Energy-flow credit points — balances, card binding, deposit rates, shop spend helpers.
 */
public final class CreditService {

    public static final String CARD_ID = "GLTC_银行卡";

    // ===== 配置区（信用点系统，改完需重新打包 jar 并重启生效）=====
    // DEPOSIT_RATES：储蓄站充值汇率，物品 ID → 每 1 个换得的信用点△（与 充值机.js 一致）。
    // SHOP_EXCHANGE_RATES：能源商店购买汇率，物品 ID → 商店出售价△/个（与 scripts/能源流 商店定义一致）。
    // 改动方式：直接增删下面 static 块中的 put(id, 价格) 行即可。
    private static final Pattern CREDIT_FIELD = Pattern.compile("\"credit\"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)"); // 解析信用点存档正则（一般不要改动）
    private static final Pattern LIMIT_ENTRY = Pattern.compile("\"([^\"]+)\"\\s*:\\s*([0-9]+)");             // 解析购买限额正则（一般不要改动）

    private static final Map<String, Double> DEPOSIT_RATES;
    private static final Map<String, Double> SHOP_EXCHANGE_RATES;

    static {
        Map<String, Double> deposit = new HashMap<>();
        for (String id : List.of("AL_A1", "AL_A2", "AL_A3", "AL_A4", "AL_A5", "AL_A6")) {  // 基本地层/金属/有机物质、晶体/编织/能量单元
            deposit.put(id, 0.5);  // 每 1 个存入换 0.5△
        }
        deposit.put("AL_B1", 1.0); // 基础涵粒子容器，每个 1△
        for (String id : List.of("TSTL", "TSSY", "TSG")) {  // 银泰拉矿/水源质层岩/锆居石
            deposit.put(id, 1.0);
        }
        for (String id : List.of("TSHH", "TSYY", "TSBD", "TSTLS", "TSND", "TSJJ", "TSGD", "TSXT")) {  // 二段材料
            deposit.put(id, 2.0);
        }
        for (String id : List.of("TSTJ", "TSDBG", "TSBTL", "TSJLD", "TSYM", "TSLD", "TSYD", "TSDD")) {  // 三段材料
            deposit.put(id, 3.0);
        }
        for (String id : List.of("TSPJD", "TSCH", "TSSKD", "TSLKS", "TSYMY", "TSDJL", "TSGWHS", "TSTHYY")) {  // 四段材料
            deposit.put(id, 4.0);
        }
        DEPOSIT_RATES = Collections.unmodifiableMap(deposit);

        Map<String, Double> shop = new HashMap<>();
        for (String id : List.of("AL_A1", "AL_A2", "AL_A3", "AL_A4", "AL_A5", "AL_A6")) {  // 基础物质商店售价
            shop.put(id, 1.0);  // 每 1 个卖 1△
        }
        shop.put("AL_B1", 2.0); // 基础涵粒子容器，每个 2△
        for (String id : List.of("TSTL", "TSSY", "TSG")) {  // 银泰拉矿等
            shop.put(id, 2.0);
        }
        for (String id : List.of("TSHH", "TSYY", "TSBD", "TSTLS", "TSND", "TSJJ", "TSGD", "TSXT")) {  // 二段材料
            shop.put(id, 3.0);
        }
        for (String id : List.of("TSTJ", "TSDBG", "TSBTL", "TSJLD", "TSYM", "TSLD", "TSYD", "TSDD")) {  // 三段材料
            shop.put(id, 4.0);
        }
        for (String id : List.of("TSPJD", "TSCH", "TSSKD", "TSLKS", "TSYMY", "TSDJL", "TSGWHS", "TSTHYY")) {  // 四段材料
            shop.put(id, 5.0);
        }
        SHOP_EXCHANGE_RATES = Collections.unmodifiableMap(shop);
    }

    private static CreditService instance;

    private final GltcPlugin plugin;
    private final NamespacedKey cardOwnerKey;
    private final ReentrantLock lock = new ReentrantLock();

    private CreditService(GltcPlugin plugin) {
        this.plugin = plugin;
        this.cardOwnerKey = new NamespacedKey(plugin, "card_owner");
    }

    public static void init(GltcPlugin plugin) {
        instance = new CreditService(plugin);
        try {
            Files.createDirectories(GltcDataPaths.creditDir(plugin));
            Files.createDirectories(GltcDataPaths.creditLimitDir(plugin));
        } catch (IOException ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC信用点] 创建目录失败", ex);
        }
    }

    @Nullable
    public static CreditService get() {
        return instance;
    }

    public static void shutdown() {
        instance = null;
    }

    public Map<String, Double> depositRates() {
        return DEPOSIT_RATES;
    }

    public Map<String, Double> shopExchangeRates() {
        return SHOP_EXCHANGE_RATES;
    }

    public NamespacedKey cardOwnerKey() {
        return cardOwnerKey;
    }

    @Nullable
    public String getSlimefunId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        return sf != null ? sf.getId() : null;
    }

    public double normalize(double value) {
        if (!Double.isFinite(value) || value < 0) {
            return 0;
        }
        return value;
    }

    public double getCredit(UUID uuid) {
        lock.lock();
        try {
            return getCreditUnlocked(uuid);
        } finally {
            lock.unlock();
        }
    }

    public boolean setCredit(UUID uuid, double credit) {
        lock.lock();
        try {
            return setCreditUnlocked(uuid, credit);
        } finally {
            lock.unlock();
        }
    }

    @Nullable
    public Double addCredit(UUID uuid, double amount) {
        lock.lock();
        try {
            double next = normalize(getCreditUnlocked(uuid) + amount);
            if (!setCreditUnlocked(uuid, next)) {
                return null;
            }
            return next;
        } finally {
            lock.unlock();
        }
    }

    public boolean trySpendCredit(UUID uuid, double cost) {
        lock.lock();
        try {
            double need = normalize(cost);
            double cur = getCreditUnlocked(uuid);
            if (cur < need) {
                return false;
            }
            return setCreditUnlocked(uuid, cur - need);
        } finally {
            lock.unlock();
        }
    }

    public double calcDepositCredit(String itemId, int amount) {
        return amount * DEPOSIT_RATES.getOrDefault(itemId, 0.0);
    }

    public double calcShopCreditCost(List<PriceLine> priceList) {
        double total = 0;
        for (PriceLine line : priceList) {
            total += line.amount() * SHOP_EXCHANGE_RATES.getOrDefault(line.id(), 0.0);
        }
        return total;
    }

    public int getLimitCount(UUID uuid, String itemId) {
        lock.lock();
        try {
            return getLimitCountUnlocked(uuid, itemId);
        } finally {
            lock.unlock();
        }
    }

    public ShopSpendResult trySpendForShop(
        UUID uuid,
        double cost,
        @Nullable String limitItemId,
        int limitMax,
        int buyCount
    ) {
        lock.lock();
        try {
            int bought = 0;
            if (limitItemId != null && limitMax > 0) {
                bought = getLimitCountUnlocked(uuid, limitItemId);
                int left = limitMax - bought;
                if (left <= 0 || buyCount > left) {
                    return ShopSpendResult.limit(bought, Math.max(0, left));
                }
            }
            double need = normalize(cost);
            double cur = getCreditUnlocked(uuid);
            if (cur < need) {
                return ShopSpendResult.credit(need);
            }
            if (!setCreditUnlocked(uuid, cur - need)) {
                return ShopSpendResult.io();
            }
            if (limitItemId != null && limitMax > 0) {
                if (!setLimitCountUnlocked(uuid, limitItemId, bought + buyCount)) {
                    setCreditUnlocked(uuid, cur);
                    return ShopSpendResult.io();
                }
            }
            return ShopSpendResult.ok(cur - need);
        } finally {
            lock.unlock();
        }
    }

    @Nullable
    public String getCardOwner(@Nullable ItemStack item) {
        if (item == null) {
            return null;
        }
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return null;
        }
        var pdc = meta.getPersistentDataContainer();
        if (!pdc.has(cardOwnerKey, PersistentDataType.STRING)) {
            return null;
        }
        return pdc.get(cardOwnerKey, PersistentDataType.STRING);
    }

    public boolean bindCard(ItemStack item, UUID uuid) {
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return false;
        }
        meta.getPersistentDataContainer().set(cardOwnerKey, PersistentDataType.STRING, uuid.toString());
        item.setItemMeta(meta);
        return true;
    }

    public void updateCardLore(ItemStack item, String playerName, double credit) {
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return;
        }
        List<String> lore = meta.getLore();
        if (lore == null || lore.size() < 6) {
            return;
        }
        lore.set(4, "§f[§e凭证持有者§f]§b " + playerName);
        lore.set(5, "§f[§e信用点余额§f]§b " + formatCredit(credit) + "△");
        meta.setLore(lore);
        item.setItemMeta(meta);
    }

    public void updateAllCardsLore(Inventory inv, UUID uuid, String name, double credit) {
        String idStr = uuid.toString();
        for (int i = 0; i < inv.getSize(); i++) {
            ItemStack stack = inv.getItem(i);
            if (stack == null || stack.getType() == Material.AIR) {
                continue;
            }
            if (!CARD_ID.equals(getSlimefunId(stack))) {
                continue;
            }
            String owner = getCardOwner(stack);
            if (owner != null && owner.equals(idStr)) {
                updateCardLore(stack, name, credit);
            }
        }
    }

    public boolean hasBoundCard(Inventory inv, UUID uuid) {
        String idStr = uuid.toString();
        for (int i = 0; i < inv.getSize(); i++) {
            ItemStack stack = inv.getItem(i);
            if (stack == null || stack.getType() == Material.AIR) {
                continue;
            }
            if (!CARD_ID.equals(getSlimefunId(stack))) {
                continue;
            }
            String owner = getCardOwner(stack);
            if (owner != null && owner.equals(idStr)) {
                return true;
            }
        }
        return false;
    }

    public void giveItems(Player player, ItemStack prototype, int amount) {
        int maxStack = prototype.getMaxStackSize();
        int give = amount;
        while (give > 0) {
            ItemStack copy = prototype.clone();
            int n = Math.min(maxStack, give);
            copy.setAmount(n);
            var left = player.getInventory().addItem(copy);
            for (ItemStack drop : left.values()) {
                player.getWorld().dropItemNaturally(player.getLocation(), drop);
            }
            give -= n;
        }
    }

    public static String formatCredit(double credit) {
        if (Math.abs(credit - Math.rint(credit)) < 1e-9) {
            return String.valueOf((long) Math.rint(credit));
        }
        return String.format("%.1f", credit);
    }

    private double getCreditUnlocked(UUID uuid) {
        Path file = GltcDataPaths.creditFile(plugin, uuid);
        if (!Files.isRegularFile(file)) {
            return 0;
        }
        try {
            String text = Files.readString(file, StandardCharsets.UTF_8);
            Matcher m = CREDIT_FIELD.matcher(text);
            if (m.find()) {
                return normalize(Double.parseDouble(m.group(1)));
            }
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC信用点] 读取失败 uuid=" + uuid, ex);
        }
        return 0;
    }

    private boolean setCreditUnlocked(UUID uuid, double credit) {
        Path file = GltcDataPaths.creditFile(plugin, uuid);
        double value = normalize(credit);
        try {
            Files.createDirectories(file.getParent());
            Path tmp = file.resolveSibling(file.getFileName() + ".tmp");
            String json = "{\n  \"credit\": " + value + "\n}\n";
            Files.writeString(tmp, json, StandardCharsets.UTF_8);
            try {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException e) {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
            }
            return true;
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC信用点] 写入失败 uuid=" + uuid, ex);
            return false;
        }
    }

    private int getLimitCountUnlocked(UUID uuid, String itemId) {
        Path file = GltcDataPaths.creditLimitFile(plugin, uuid);
        if (!Files.isRegularFile(file)) {
            return 0;
        }
        try {
            String text = Files.readString(file, StandardCharsets.UTF_8);
            Matcher m = LIMIT_ENTRY.matcher(text);
            while (m.find()) {
                if (itemId.equals(m.group(1))) {
                    return Integer.parseInt(m.group(2));
                }
            }
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC限购] 读取失败 uuid=" + uuid, ex);
        }
        return 0;
    }

    private boolean setLimitCountUnlocked(UUID uuid, String itemId, int count) {
        Path file = GltcDataPaths.creditLimitFile(plugin, uuid);
        try {
            Map<String, Integer> data = new HashMap<>();
            if (Files.isRegularFile(file)) {
                String text = Files.readString(file, StandardCharsets.UTF_8);
                Matcher m = LIMIT_ENTRY.matcher(text);
                while (m.find()) {
                    data.put(m.group(1), Integer.parseInt(m.group(2)));
                }
            }
            data.put(itemId, count);
            StringBuilder sb = new StringBuilder("{\n");
            boolean first = true;
            for (Map.Entry<String, Integer> e : data.entrySet()) {
                if (!first) {
                    sb.append(",\n");
                }
                first = false;
                sb.append("  \"").append(e.getKey()).append("\": ").append(e.getValue());
            }
            sb.append("\n}\n");
            Files.createDirectories(file.getParent());
            Path tmp = file.resolveSibling(file.getFileName() + ".tmp");
            Files.writeString(tmp, sb.toString(), StandardCharsets.UTF_8);
            try {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException e) {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
            }
            return true;
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC限购] 写入失败 uuid=" + uuid, ex);
            return false;
        }
    }

    public record PriceLine(String id, int amount) {
    }

    public record ShopSpendResult(boolean ok, @Nullable String reason, double balance, int bought, int left, double needed) {
        static ShopSpendResult ok(double balance) {
            return new ShopSpendResult(true, null, balance, 0, 0, 0);
        }

        static ShopSpendResult limit(int bought, int left) {
            return new ShopSpendResult(false, "limit", 0, bought, left, 0);
        }

        static ShopSpendResult credit(double needed) {
            return new ShopSpendResult(false, "credit", 0, 0, 0, needed);
        }

        static ShopSpendResult io() {
            return new ShopSpendResult(false, "io", 0, 0, 0, 0);
        }
    }
}
