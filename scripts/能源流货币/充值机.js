
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var Particle = Java.type("org.bukkit.Particle");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;

// ---------------- 可调参数 ----------------
var CARD_ID = "GLTC_银行卡";
var MACHINE_ID = "ATO_能源流储蓄站";
var GUI_TITLE = "§c能源流信用储蓄站";

// 可兑换物品ID → 信用点价格
var EXCHANGE_RATES = {
    "AL_A1": 0.5, "AL_A2": 0.5, "AL_A3": 0.5, "AL_A4": 0.5, "AL_A5": 0.5, "AL_A6": 0.5,
    "AL_B1": 1, "TSTL": 1, "TSSY": 1, "TSG": 1,
    "TSHH": 2, "TSYY": 2, "TSBD": 2, "TSTLS": 2, "TSND": 2, "TSJJ": 2, "TSGD": 2, "TSXT": 2,
    "TSTJ": 3, "TSDBG": 3, "TSBTL": 3, "TSJLD": 3, "TSYM": 3, "TSLD": 3, "TSYD": 3, "TSDD": 3,
    "TSPJD": 4, "TSCH": 4, "TSSKD": 4, "TSLKS": 4, "TSYMY": 4, "TSDJL": 4, "TSGWHS": 4, "TSTHYY": 4
};

// 物品ID → 中文名
var ITEM_NAMES = {
    "AL_A1": "基本地层物质", "AL_A2": "基本金属物质", "AL_A3": "基本有机物质",
    "AL_A4": "简单晶体单元", "AL_A5": "简单编织单元", "AL_A6": "简单能量单元",
    "AL_B1": "基础涵粒子容器",
    "TSTL": "银泰拉矿", "TSSY": "水源质层岩", "TSG": "锆居石",
    "TSHH": "花海磺英", "TSYY": "忧郁物质", "TSBD": "铋锭", "TSTLS": "蓝泰拉石",
    "TSND": "烙锭", "TSJJ": "水源结晶", "TSGD": "锆锭", "TSXT": "变质稀土淀粉",
    "TSTJ": "天界魔素", "TSDBG": "钴蛋白锭", "TSBTL": "变态磷", "TSJLD": "氢晶镎锭",
    "TSYM": "燕麦冰淇淋", "TSLD": "缄默镧锭", "TSYD": "噪点镱锭", "TSDD": "锚定铥锭",
    "TSPJD": "榆芒珀金锭", "TSCH": "炽花旋索", "TSSKD": "斯卡蒂钙锭", "TSLKS": "熔融倪克斯胶",
    "TSYMY": "燕麦源质", "TSDJL": "巨角鹿王锭", "TSGWHS": "高温厥化石", "TSTHYY": "氮化云英"
};

// 输入槽位（20格）
var INPUT_SLOTS = [2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 29, 30, 31, 32, 33];

// 确认按钮槽位
var CONFIRM_SLOT = 35;

// 紫色信息面板槽位（最后一个槽）
var PURPLE_SLOT = 53;

// 白色玻璃板背景槽位（不含53，53为紫色面板）
var WHITE_SLOTS = [0, 8, 9, 17, 18, 26, 27, 45, 47, 48, 49, 50, 51];

// 黑色玻璃板背景槽位
var BLACK_SLOTS = [1, 7, 10, 16, 19, 25, 28, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 46, 52];

// 所有背景槽位（含紫色面板）
var BG_SLOTS = WHITE_SLOTS.concat(BLACK_SLOTS).concat([PURPLE_SLOT]);

// ---------------- 全局状态 ----------------
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var DATA_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/信用点");
if (!DATA_DIR.exists()) DATA_DIR.mkdirs();

var CARD_OWNER_KEY = new NamespacedKey("gltc", "card_owner");
var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] ";

// 从物品 PDC 读取 Slimefun ID（比 getByItem 更可靠）
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
    var sf = SlimefunItem.getByItem(stack);
    return sf ? sf.getId() : null;
}

// 白色玻璃板背景物品
var WHITE_ITEM;
(function() {
    WHITE_ITEM = new ItemStack(Material.WHITE_STAINED_GLASS_PANE);
    var meta = WHITE_ITEM.getItemMeta();
    meta.setDisplayName("§0");
    WHITE_ITEM.setItemMeta(meta);
})();

// 黑色玻璃板背景物品
var BLACK_ITEM;
(function() {
    BLACK_ITEM = new ItemStack(Material.BLACK_STAINED_GLASS_PANE);
    var meta = BLACK_ITEM.getItemMeta();
    meta.setDisplayName("§0");
    BLACK_ITEM.setItemMeta(meta);
})();

// 紫色信息面板物品（显示可兑换物品与价格）
var PURPLE_ITEM;
(function() {
    PURPLE_ITEM = new ItemStack(Material.PURPLE_STAINED_GLASS_PANE);
    var meta = PURPLE_ITEM.getItemMeta();
    meta.setDisplayName("§d§l▣ 可兑换物品清单");
    var lore = java.util.Arrays.asList(
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
    );
    meta.setLore(lore);
    PURPLE_ITEM.setItemMeta(meta);
})();

// 确认按钮物品
var CONFIRM_BUTTON;
(function() {
    CONFIRM_BUTTON = new ItemStack(Material.LIME_STAINED_GLASS_PANE);
    var meta = CONFIRM_BUTTON.getItemMeta();
    meta.setDisplayName("§a§l✔ 确认兑换");
    meta.setLore(java.util.Arrays.asList(
        "§7将可兑换材料放入输入槽",
        "§7点击此处将全部材料兑换为能源流信用点",
        "§7§o需要背包中存在已绑定的银行卡"
    ));
    CONFIRM_BUTTON.setItemMeta(meta);
})();

// 活跃的 GUI 实例集合
var activeInventories = new java.util.HashSet();

// ---------------- 信用点数据读写（与能源流商店共用 gltcCreditLock） ----------------

function getCreditLock() {
    if (PLUGIN.gltcCreditLock == null) PLUGIN.gltcCreditLock = new java.lang.Object();
    return PLUGIN.gltcCreditLock;
}

function getPlayerCreditUnlocked(uuid) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    if (!file.exists()) return 0;
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
        return JSON.parse(charBuffer.toString()).credit || 0;
    } catch (e) { return 0; }
}

function setPlayerCreditUnlocked(uuid, credit) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    try {
        var lines = new java.util.ArrayList();
        lines.add(JSON.stringify({credit: credit}, null, 2));
        Files.write(file.toPath(), lines, StandardCharsets.UTF_8);
        return true;
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC] 保存信用点失败: " + e);
        return false;
    }
}

function getPlayerCredit(uuid) {
    return Java.synchronized(getCreditLock(), function() {
        return getPlayerCreditUnlocked(uuid);
    })();
}

function setPlayerCredit(uuid, credit) {
    return Java.synchronized(getCreditLock(), function() {
        return setPlayerCreditUnlocked(uuid, credit);
    })();
}

function addPlayerCredit(uuid, amount) {
    return Java.synchronized(getCreditLock(), function() {
        var cur = getPlayerCreditUnlocked(uuid);
        var next = cur + amount;
        if (!setPlayerCreditUnlocked(uuid, next)) return null;
        return next;
    })();
}

// ---------------- 卡片辅助 ----------------

function getCardOwner(item) {
    var meta = item.getItemMeta();
    if (!meta) return null;
    var pdc = meta.getPersistentDataContainer();
    return pdc.has(CARD_OWNER_KEY, PersistentDataType.STRING)
        ? pdc.get(CARD_OWNER_KEY, PersistentDataType.STRING) : null;
}

function updateCardLore(item, playerName, credit) {
    var meta = item.getItemMeta();
    if (!meta) return;
    var lore = meta.getLore();
    if (!lore || lore.size() < 5) return;
    lore.set(4, "§f[§e凭证持有者§f]§b " + playerName);
    lore.set(5, "§f[§e信用点余额§f]§b " + credit + "△");
    meta.setLore(lore);
    item.setItemMeta(meta);
}

function findBoundCard(inv, playerUuid) {
    for (var i = 0; i < inv.getSize(); i++) {
        var stack = inv.getItem(i);
        if (!stack || stack.getType() === Material.AIR) continue;
        var id = getSlimefunId(stack);
        if (!id || id !== CARD_ID) continue;
        var owner = getCardOwner(stack);
        if (owner && owner === playerUuid) return {item: stack, credit: getPlayerCredit(playerUuid), slot: i};
    }
    return null;
}

function syncAllCards(inv, uuid, name, newCredit) {
    for (var i = 0; i < inv.getSize(); i++) {
        var stack = inv.getItem(i);
        if (!stack || stack.getType() === Material.AIR) continue;
        var id = getSlimefunId(stack);
        if (!id || id !== CARD_ID) continue;
        var owner = getCardOwner(stack);
        if (owner && owner === uuid) updateCardLore(stack, name, newCredit);
    }
}

// ---------------- 判断槽位类型 ----------------

function isInputSlot(slot) {
    for (var i = 0; i < INPUT_SLOTS.length; i++) {
        if (INPUT_SLOTS[i] === slot) return true;
    }
    return false;
}

// ---------------- onUse: 右键机器时创建并打开自定义界面 ----------------

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var inv = Bukkit.createInventory(null, 54, GUI_TITLE);

    for (var i = 0; i < WHITE_SLOTS.length; i++) {
        inv.setItem(WHITE_SLOTS[i], WHITE_ITEM.clone());
    }
    for (var i = 0; i < BLACK_SLOTS.length; i++) {
        inv.setItem(BLACK_SLOTS[i], BLACK_ITEM.clone());
    }
    inv.setItem(CONFIRM_SLOT, CONFIRM_BUTTON.clone());
    inv.setItem(PURPLE_SLOT, PURPLE_ITEM.clone());

    activeInventories.add(inv);
    player.openInventory(inv);
}

// ---------------- 核心兑换逻辑（仅在站点中发生） ----------------

function processExchange(player, inv) {
    // 按物品ID统计数量
    var itemCounts = {}; // id -> count
    var totalItems = 0;

    for (var i = 0; i < INPUT_SLOTS.length; i++) {
        var stack = inv.getItem(INPUT_SLOTS[i]);
        if (!stack || stack.getType() === Material.AIR) continue;
        var id = getSlimefunId(stack);
        if (!id || !EXCHANGE_RATES[id]) continue;
        var amt = stack.getAmount();
        itemCounts[id] = (itemCounts[id] || 0) + amt;
        totalItems += amt;
    }

    if (totalItems <= 0) {
        player.sendMessage(GLTC_PREFIX + "§c输入槽中没有可兑换的材料！");
        return;
    }

    var uuid = player.getUniqueId().toString();
    var card = findBoundCard(player.getInventory(), uuid);
    if (!card) {
        player.sendMessage(GLTC_PREFIX + "§c背包中没有已绑定的 §e能源流信用储蓄凭证(银行卡)§c！");
        return;
    }

    var gainedCredit = 0;
    for (var id in itemCounts) {
        gainedCredit += itemCounts[id] * EXCHANGE_RATES[id];
    }

    // 先原子加信用点，成功后再清空输入槽（避免写失败已扣材料）
    var newCredit = addPlayerCredit(uuid, gainedCredit);
    if (newCredit == null) {
        player.sendMessage(GLTC_PREFIX + "§c信用点写入失败，请重试！");
        return;
    }

    for (var i = 0; i < INPUT_SLOTS.length; i++) {
        var stack = inv.getItem(INPUT_SLOTS[i]);
        if (!stack || stack.getType() === Material.AIR) continue;
        var sid = getSlimefunId(stack);
        if (!sid || !EXCHANGE_RATES[sid]) continue;
        inv.setItem(INPUT_SLOTS[i], null);
    }

    syncAllCards(player.getInventory(), uuid, player.getName(), newCredit);

    // 特效
    var loc = player.getLocation();
    try { loc.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, loc, 10, 0.4, 0.4, 0.4, 0.15); } catch (e) {}
    try { loc.getWorld().playSound(loc, "entity.experience_orb.pickup", 0.6, 1.3); } catch (e) {}

    // 构建汇总消息
    var parts = [];
    for (var id in itemCounts) {
        parts.push("§b" + itemCounts[id] + "个 §e" + (ITEM_NAMES[id] || id));
    }
    var summary = parts.join("§a，");

    player.sendMessage(GLTC_PREFIX + "§a本次转化了 " + summary + "§a，总共转化 §b" + totalItems + "次§a，获得 §b" + gainedCredit + "△ §a信用点！当前余额：§b" + newCredit + "△");
}

// ---------------- 事件监听注册 ----------------

function registerListeners() {
    try {
        if (PLUGIN.gltcRechargeListener != null) {
            InventoryClickEvent.getHandlerList().unregister(PLUGIN.gltcRechargeListener);
            InventoryCloseEvent.getHandlerList().unregister(PLUGIN.gltcRechargeListener);
            PLUGIN.gltcRechargeListener = null;
        }
    } catch (e0) {}

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    PLUGIN.gltcRechargeListener = listenerInstance;

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
                if (slot === CONFIRM_SLOT) {
                    event.setCancelled(true);
                    var clickedItem = event.getCurrentItem();
                    if (!clickedItem || clickedItem.getType() === Material.AIR) return;
                    var meta = clickedItem.getItemMeta();
                    if (!meta || !meta.hasDisplayName() || meta.getDisplayName() !== "§a§l✔ 确认兑换") return;
                    processExchange(player, topInv);
                } else if (isInputSlot(slot)) {
                    // 输入槽：允许自由放入/取出
                } else {
                    // 背景槽/紫色面板：禁止交互
                    event.setCancelled(true);
                }
            }
            // 底部背包：不拦截，允许shift-click移入输入槽
        }, PLUGIN
    );

    // InventoryCloseEvent
    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var inv = event.getInventory();
            if (!activeInventories.contains(inv)) return;

            var player = event.getPlayer();
            if (player instanceof Player) {
                for (var i = 0; i < INPUT_SLOTS.length; i++) {
                    var item = inv.getItem(INPUT_SLOTS[i]);
                    if (item && item.getType() !== Material.AIR) {
                        var leftover = player.getInventory().addItem(item);
                        var dropIt = leftover.values().iterator();
                        while (dropIt.hasNext()) {
                            player.getWorld().dropItemNaturally(player.getLocation(), dropIt.next());
                        }
                        inv.setItem(INPUT_SLOTS[i], null);
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
