
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var InventoryDragEvent = Java.type("org.bukkit.event.inventory.InventoryDragEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var Particle = Java.type("org.bukkit.Particle");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;

// ---------------- 可调参数 ----------------
var ORDER_ITEM_ID = "SKEY_订单";              // 订单物品ID（发布机生成的非粘液订单）
var GUI_TITLE = "§b舰体订单接收机";

// 3行菜单（0-26）
var INFO_SLOT = 10;                            // 第2行第2格：说明面板（书架）
var ORDER_SLOTS = [12, 13, 14];                // 第2行第4,5,6格：订单放置槽（从左到右交付）
var CONFIRM_SLOT = 16;                         // 第2行第8格：绿色玻璃确认按钮

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var DATA_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/舰体货币");
if (!DATA_DIR.exists()) DATA_DIR.mkdirs();

var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
// 订单 PDC Key（与发布机脚本保持一致）
var ORDER_LEVEL_KEY = new NamespacedKey("gltc", "order_level");
var ORDER_ITEMS_KEY = new NamespacedKey("gltc", "order_items");
var ORDER_REWARD_I_KEY = new NamespacedKey("gltc", "order_reward_i");
var ORDER_REWARD_V_KEY = new NamespacedKey("gltc", "order_reward_v");
var ORDER_REWARD_X_KEY = new NamespacedKey("gltc", "order_reward_x");

var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] ";

// #RRGGBB → §x§R§R§G§G§B§B
function hex(color) {
    var s = "§x";
    for (var i = 0; i < color.length; i++) {
        s += "§" + color.charAt(i).toLowerCase();
    }
    return s;
}

var C_I = hex("6f7dff");
var C_V = hex("ff8f4d");
var C_X = hex("ff3d3d");
var C_GOLD = hex("fff5b3");

// ---------------- 舰体货币数据读写（与发布机一致） ----------------

function getShipCurrency(uuid) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    if (!file.exists()) return {I: 0, V: 0, X: 0};
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
        var data = JSON.parse(charBuffer.toString());
        return {I: data.I || 0, V: data.V || 0, X: data.X || 0};
    } catch (e) {
        return {I: 0, V: 0, X: 0};
    }
}

function setShipCurrency(uuid, data) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    try {
        var lines = new java.util.ArrayList();
        lines.add(JSON.stringify({I: data.I || 0, V: data.V || 0, X: data.X || 0}, null, 2));
        Files.write(file.toPath(), lines, StandardCharsets.UTF_8);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC] 保存舰体货币失败 uuid=" + uuid + ": " + e);
    }
}

// 全局共享锁（挂在插件对象上，与发布机/访问站共用），防止并发读写同一货币文件丢更新
function getCurrencyLock() {
    if (PLUGIN.gltcCurrencyLock == null) PLUGIN.gltcCurrencyLock = new java.lang.Object();
    return PLUGIN.gltcCurrencyLock;
}

function addShipCurrency(uuid, type, amount) {
    return Java.synchronized(getCurrencyLock(), function() {
        var data = getShipCurrency(uuid);
        if (type === "I") data.I += amount;
        else if (type === "V") data.V += amount;
        else if (type === "X") data.X += amount;
        setShipCurrency(uuid, data);
        return data;
    })();
}

// ---------------- 工具函数 ----------------

function stripColor(s) {
    if (!s) return "";
    var out = String(s);
    out = out.replace(/§x(?:§[0-9a-fA-F]){6}/g, "");
    out = out.replace(/&x(?:&[0-9a-fA-F]){6}/g, "");
    out = out.replace(/&#[0-9a-fA-F]{6}/g, "");
    out = out.replace(/&[0-9a-fA-FkKxXoOrRlLmMnN]/g, "");
    out = out.replace(/§[0-9a-fA-FkKxXoOrRlLmMnN]/g, "");
    out = out.replace(/§/g, "");
    return out;
}

function getSlimefunId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var meta = stack.getItemMeta();
        if (meta) {
            var pdc = meta.getPersistentDataContainer();
            if (pdc.has(SF_ITEM_KEY, PersistentDataType.STRING)) {
                return pdc.get(SF_ITEM_KEY, PersistentDataType.STRING);
            }
        }
    } catch (e) {}
    try {
        var sf = SlimefunItem.getByItem(stack);
        return sf ? sf.getId() : null;
    } catch (e) {
        return null;
    }
}

function getItemDisplayName(stack) {
    if (!stack) return null;
    try {
        var meta = stack.getItemMeta();
        if (meta && meta.hasDisplayName()) {
            var name = stripColor(meta.getDisplayName());
            return name || null;
        }
    } catch (e) {}
    return null;
}

function idEquals(a, b) {
    if (!a || !b) return false;
    return a.toLowerCase() === b.toLowerCase();
}

// 是否为订单物品（发布机生成的非粘液 book 订单）
function isOrder(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    var id = getSlimefunId(stack);
    if (id && idEquals(id, ORDER_ITEM_ID)) return true;
    if (stack.getType() !== Material.BOOK) return false;
    var name = getItemDisplayName(stack);
    return name !== null && name.indexOf("订单") >= 0;
}

// 物品与订单需求项是否匹配（原版按材质，粘液按ID）
function matchNeed(need, stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    if (need.isMc) {
        try {
            var mat = Material.matchMaterial(need.itemId);
            return mat !== null && stack.getType() === mat;
        } catch (e) {
            return false;
        }
    }
    var id = getSlimefunId(stack);
    return !!id && idEquals(id, need.itemId);
}

// 从订单物品 PDC 读取需求与报酬数据
function readOrderData(item) {
    try {
        var meta = item.getItemMeta();
        var pdc = meta.getPersistentDataContainer();
        if (!pdc.has(ORDER_LEVEL_KEY, PersistentDataType.INTEGER)) return null;
        var level = pdc.get(ORDER_LEVEL_KEY, PersistentDataType.INTEGER);
        var itemsJson = pdc.get(ORDER_ITEMS_KEY, PersistentDataType.STRING);
        var items = JSON.parse(itemsJson);
        if (!items || items.length === 0) return null;
        var rI = pdc.get(ORDER_REWARD_I_KEY, PersistentDataType.INTEGER) || 0;
        var rV = pdc.get(ORDER_REWARD_V_KEY, PersistentDataType.INTEGER) || 0;
        var rX = pdc.get(ORDER_REWARD_X_KEY, PersistentDataType.INTEGER) || 0;
        var rewardType = rI > 0 ? "I" : (rV > 0 ? "V" : "X");
        var rewardAmount = rI > 0 ? rI : (rV > 0 ? rV : rX);
        return {level: level, items: items, rewardType: rewardType, rewardAmount: rewardAmount};
    } catch (e) {
        return null;
    }
}

var CURRENCY_NAME = {
    "I": "I等货币",
    "V": "V等货币",
    "X": "X等货币"
};

var CURRENCY_COLOR = {
    "I": C_I,
    "V": C_V,
    "X": C_X
};

// ---------------- GUI 构建 ----------------

var BG_ITEM;
(function() {
    BG_ITEM = new ItemStack(Material.BLUE_STAINED_GLASS_PANE);
    var meta = BG_ITEM.getItemMeta();
    meta.setDisplayName("§0");
    BG_ITEM.setItemMeta(meta);
})();

var INFO_ITEM;
(function() {
    INFO_ITEM = new ItemStack(Material.BOOKSHELF);
    var meta = INFO_ITEM.getItemMeta();
    meta.setDisplayName("§b§l▣ 舰体订单接收机");
    meta.setLore(java.util.Arrays.asList(
        "§7中间可放置订单，",
        "§7点击 §a✔确认交付 §7时，从左到右依次结算；",
        "§7每次按下只交付 §e1张 §7订单。",
        "§7交付时自动从 §e背包中§7 搜索并扣除物资，",
        "§7报酬按订单等级发放 I/V/X 等舰体货币，",
        "§7关闭菜单会自动返还所有订单。"
    ));
    INFO_ITEM.setItemMeta(meta);
})();

var CONFIRM_BUTTON;
(function() {
    CONFIRM_BUTTON = new ItemStack(Material.LIME_STAINED_GLASS_PANE);
    var meta = CONFIRM_BUTTON.getItemMeta();
    meta.setDisplayName("§a§l✔ 确认交付");
    meta.setLore(java.util.Arrays.asList(
        "§7交付 §e1张 §7订单，",
        "§7自动检索背包物资并结算。"
    ));
    CONFIRM_BUTTON.setItemMeta(meta);
})();

var activeInventories = new java.util.HashSet();
var _listenerRegistered = false;

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var inv = Bukkit.createInventory(null, 27, GUI_TITLE);
    // 边框装饰：第1、3行全部 + 第2行两侧(9,11,15,17)
    var BORDER_SLOTS = [0,1,2,3,4,5,6,7,8, 9,11,15,17, 18,19,20,21,22,23,24,25,26];
    for (var b = 0; b < BORDER_SLOTS.length; b++) {
        inv.setItem(BORDER_SLOTS[b], BG_ITEM.clone());
    }
    inv.setItem(INFO_SLOT, INFO_ITEM.clone());
    inv.setItem(CONFIRM_SLOT, CONFIRM_BUTTON.clone());
    // 第2行中间3格（12,13,14）：订单放置槽，留空

    activeInventories.add(inv);
    player.openInventory(inv);
}

// ---------------- 交付结算 ----------------

// 统计玩家背包中某需求项的总数量
function countInPlayerInventory(player, need) {
    var inv = player.getInventory();
    var total = 0;
    for (var i = 0; i < inv.getSize(); i++) {
        var s = inv.getItem(i);
        if (matchNeed(need, s)) total += s.getAmount();
    }
    return total;
}

// 从玩家背包扣除某需求项（先校验充足，再扣除）
function takeFromPlayerInventory(player, need) {
    var remain = need.amount;
    var inv = player.getInventory();
    for (var i = 0; i < inv.getSize() && remain > 0; i++) {
        var s = inv.getItem(i);
        if (!matchNeed(need, s)) continue;
        if (s.getAmount() <= remain) {
            remain -= s.getAmount();
            inv.setItem(i, null);
        } else {
            s.setAmount(s.getAmount() - remain);
            remain = 0;
        }
    }
    return remain === 0;
}

// 单张订单交付：返回 null=成功，字符串=失败原因
function deliverOne(player, data) {
    var needs = data.items;
    // 先校验背包物资是否全部充足
    for (var i = 0; i < needs.length; i++) {
        var avail = countInPlayerInventory(player, needs[i]);
        if (avail < needs[i].amount) {
            return "§c背包中 §e" + needs[i].itemId + " §f×" + needs[i].amount + " §c不足（当前 §e" + avail + "§c）！";
        }
    }
    // 扣除物资
    var deliveredCount = 0;
    for (var i = 0; i < needs.length; i++) {
        if (takeFromPlayerInventory(player, needs[i])) {
            deliveredCount += needs[i].amount;
        }
    }
    // 发放货币
    var uuid = player.getUniqueId().toString();
    addShipCurrency(uuid, data.rewardType, data.rewardAmount);
    return null;
}

function processDeliver(player, inv) {
    // 从左到右找第一张可交付的订单
    for (var oi = 0; oi < ORDER_SLOTS.length; oi++) {
        var slot = ORDER_SLOTS[oi];
        var orderStack = inv.getItem(slot);
        if (!orderStack || !isOrder(orderStack)) continue;

        var data = readOrderData(orderStack);
        if (!data) continue;

        var err = deliverOne(player, data);
        if (err !== null) continue; // 这张物资不足，试下一张

        // 订单减1
        if (orderStack.getAmount() > 1) {
            orderStack.setAmount(orderStack.getAmount() - 1);
        } else {
            inv.setItem(slot, null);
        }

        // 统计本次交付的物品总数（需求数量之和）
        var totalNeeds = 0;
        for (var n = 0; n < data.items.length; n++) totalNeeds += data.items[n].amount;

        // 特效
        var loc = player.getLocation();
        try { loc.getWorld().spawnParticle(Particle.ENCHANTMENT_TABLE, loc, 30, 0.4, 0.4, 0.4, 0.6); } catch (e) {}
        try { loc.getWorld().playSound(loc, "entity.experience_orb.pickup", 0.6, 1.3); } catch (e) {}

        var bal = getShipCurrency(player.getUniqueId().toString());
        player.sendMessage(GLTC_PREFIX + "§3对接成功！本次交付 §e" + totalNeeds + "§3 个物品，获得 "
            + CURRENCY_COLOR[data.rewardType] + CURRENCY_NAME[data.rewardType] + "§3 ×" + data.rewardAmount + "§3！");
        player.sendMessage(GLTC_PREFIX + "§3当前舰体货币："
            + C_I + "I等 " + bal.I + " §7| "
            + C_V + "V等 " + bal.V + " §7| "
            + C_X + "X等 " + bal.X);
        return; // 每次按下只交付1张
    }

    // 没有可交付的订单
    var hasOrder = false;
    for (var oi = 0; oi < ORDER_SLOTS.length; oi++) {
        if (isOrder(inv.getItem(ORDER_SLOTS[oi]))) { hasOrder = true; break; }
    }
    if (!hasOrder) {
        player.sendMessage(GLTC_PREFIX + "§e请先放入舰体订单！");
    } else {
        player.sendMessage(GLTC_PREFIX + "§c没有可交付的订单！（背包中物资不足或订单数据异常）。");
    }
}

// ---------------- 事件监听注册 ----------------

function registerListeners() {
    if (_listenerRegistered) return;
    _listenerRegistered = true;

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();

    // InventoryClickEvent
    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var topInv = event.getView().getTopInventory();
            if (!activeInventories.contains(topInv)) return;

            var player = event.getWhoClicked();
            if (!(player instanceof Player)) return;

            var clickedInv = event.getClickedInventory();
            var slot = event.getRawSlot();

            if (clickedInv === topInv) {
                // 确认按钮：仅普通点击生效；忽略 shift 点击
                if (slot === CONFIRM_SLOT) {
                    event.setCancelled(true);
                    if (event.isShiftClick()) return;
                    processDeliver(player, topInv);
                    return;
                }
                // 订单槽：完全放行原生交互
                var isFree = false;
                for (var i = 0; i < ORDER_SLOTS.length; i++) {
                    if (ORDER_SLOTS[i] === slot) { isFree = true; break; }
                }
                if (isFree) return;
                // 其它槽位（边框/说明）：禁止交互
                event.setCancelled(true);
                return;
            }
            // 底部背包：不拦截任何点击
        }, PLUGIN
    );

    // InventoryDragEvent：UI 保护
    Bukkit.getPluginManager().registerEvent(
        InventoryDragEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var topInv = event.getView().getTopInventory();
            if (!activeInventories.contains(topInv)) return;
            event.setCancelled(true);
        }, PLUGIN
    );

    // InventoryCloseEvent：无条件返还所有订单
    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var inv = event.getInventory();
            if (!activeInventories.contains(inv)) return;

            var player = event.getPlayer();
            if (player instanceof Player) {
                for (var i = 0; i < ORDER_SLOTS.length; i++) {
                    var it = inv.getItem(ORDER_SLOTS[i]);
                    if (it && it.getType() !== Material.AIR) {
                        var leftover = player.getInventory().addItem(it);
                        var dropIt = leftover.values().iterator();
                        while (dropIt.hasNext()) {
                            player.getWorld().dropItemNaturally(player.getLocation(), dropIt.next());
                        }
                        inv.setItem(ORDER_SLOTS[i], null);
                    }
                }
            }
            activeInventories.remove(inv);
        }, PLUGIN
    );
}

// ---------------- tick: 空实现 ----------------

function tick(info) {
}

// ---------------- 脚本加载时注册监听 ----------------

registerListeners();
