
var Bukkit = Java.type("org.bukkit.Bukkit");
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

var CARD_ID = "GLTC_银行卡";
var GUI_TITLE = "§c能源流信用储蓄站";

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

var INPUT_SLOTS = [2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 29, 30, 31, 32, 33];
var CONFIRM_SLOT = 35;
var PURPLE_SLOT = 53;
var WHITE_SLOTS = [0, 8, 9, 17, 18, 26, 27, 45, 47, 48, 49, 50, 51];
var BLACK_SLOTS = [1, 7, 10, 16, 19, 25, 28, 34, 36, 37, 38, 39, 40, 41, 42, 43, 44, 46, 52];

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] ";

function loadCreditApi() {
    var Bukkit = Java.type("org.bukkit.Bukkit");
    var plugin = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
    var inst = null;
    try {
        inst = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
    } catch (e0) {}
    if (plugin != null && plugin.gltcCreditApi != null) return plugin.gltcCreditApi;
    if (inst != null && inst.gltcCreditApi != null) {
        if (plugin != null) plugin.gltcCreditApi = inst.gltcCreditApi;
        return inst.gltcCreditApi;
    }
    if (plugin == null) return null;

    var File = java.io.File;
    var Files = java.nio.file.Files;
    var StandardCharsets = java.nio.charset.StandardCharsets;
    var ByteBuffer = Java.type("java.nio.ByteBuffer");
    var basePath = plugin.getDataFolder().getAbsolutePath();
    var candidates = [];
    var seen = {};
    function addPath(file) {
        if (!file) return;
        var p = String(file.getAbsolutePath());
        if (seen[p]) return;
        seen[p] = true;
        candidates.push(file);
    }
    addPath(new File(basePath + "/addons/GLTC_联合协议/scripts/能源流/_信用点.js"));
    addPath(new File(basePath + "/addons/GLTC121/scripts/能源流/_信用点.js"));
    try {
        var addonsDir = new File(basePath + "/addons");
        var list = addonsDir.listFiles();
        if (list) {
            for (var i = 0; i < list.length; i++) {
                addPath(new File(list[i].getAbsolutePath() + "/scripts/能源流/_信用点.js"));
            }
        }
    } catch (e1) {}
    for (var c = 0; c < candidates.length; c++) {
        var file = candidates[c];
        if (!file.exists()) continue;
        try {
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
            var exported = (0, eval)(code);
            plugin.gltcCreditApi = exported;
            if (inst != null) inst.gltcCreditApi = exported;
            return exported;
        } catch (e2) {
            try {
                Bukkit.getLogger().warning("[GLTC信用点] 加载 " + file.getAbsolutePath() + " 失败: " + e2);
            } catch (e3) {}
        }
    }
    return null;
}
function getRscPlugin() { return Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer"); }


var WHITE_ITEM;
(function() {
    WHITE_ITEM = new ItemStack(Material.WHITE_STAINED_GLASS_PANE);
    var meta = WHITE_ITEM.getItemMeta();
    meta.setDisplayName("§0");
    WHITE_ITEM.setItemMeta(meta);
})();

var BLACK_ITEM;
(function() {
    BLACK_ITEM = new ItemStack(Material.BLACK_STAINED_GLASS_PANE);
    var meta = BLACK_ITEM.getItemMeta();
    meta.setDisplayName("§0");
    BLACK_ITEM.setItemMeta(meta);
})();

var PURPLE_ITEM;
(function() {
    PURPLE_ITEM = new ItemStack(Material.PURPLE_STAINED_GLASS_PANE);
    var meta = PURPLE_ITEM.getItemMeta();
    meta.setDisplayName("§d§l▣ 可兑换物品清单");
    meta.setLore(java.util.Arrays.asList(
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
    PURPLE_ITEM.setItemMeta(meta);
})();

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

var activeInventories = new java.util.HashSet();
var processingPlayers = new java.util.HashSet();

function isInputSlot(slot) {
    for (var i = 0; i < INPUT_SLOTS.length; i++) {
        if (INPUT_SLOTS[i] === slot) return true;
    }
    return false;
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var inv = Bukkit.createInventory(null, 54, GUI_TITLE);
    for (var i = 0; i < WHITE_SLOTS.length; i++) inv.setItem(WHITE_SLOTS[i], WHITE_ITEM.clone());
    for (var i = 0; i < BLACK_SLOTS.length; i++) inv.setItem(BLACK_SLOTS[i], BLACK_ITEM.clone());
    inv.setItem(CONFIRM_SLOT, CONFIRM_BUTTON.clone());
    inv.setItem(PURPLE_SLOT, PURPLE_ITEM.clone());

    activeInventories.add(inv);
    player.openInventory(inv);
}

function processExchange(player, inv) {
    var CREDIT = loadCreditApi();
    if (!CREDIT) {
        player.sendMessage(GLTC_PREFIX + "§c信用点系统未加载，请联系管理员。");
        return;
    }
    if (processingPlayers.contains(player)) {
        player.sendMessage(GLTC_PREFIX + "§c正在处理上一次兑换，请稍候…");
        return;
    }

    var itemCounts = {};
    var totalItems = 0;
    var depositRates = CREDIT.DEPOSIT_RATES;

    for (var i = 0; i < INPUT_SLOTS.length; i++) {
        var stack = inv.getItem(INPUT_SLOTS[i]);
        if (!stack || stack.getType() === Material.AIR) continue;
        var id = CREDIT.getSlimefunId(stack);
        if (!id || !depositRates[id]) continue;
        var amt = stack.getAmount();
        itemCounts[id] = (itemCounts[id] || 0) + amt;
        totalItems += amt;
    }

    if (totalItems <= 0) {
        player.sendMessage(GLTC_PREFIX + "§c输入槽中没有可兑换的材料！");
        return;
    }

    var uuid = player.getUniqueId().toString();
    if (!CREDIT.findCard(player.getInventory(), uuid)) {
        player.sendMessage(GLTC_PREFIX + "§c背包中没有已绑定的 §e能源流信用储蓄凭证(银行卡)§c！");
        return;
    }

    var gainedCredit = 0;
    for (var id in itemCounts) {
        gainedCredit += CREDIT.calcDepositCredit(id, itemCounts[id]);
    }

    processingPlayers.add(player);
    try {
        var newCredit = CREDIT.addCredit(uuid, gainedCredit);
        if (newCredit == null) {
            player.sendMessage(GLTC_PREFIX + "§c信用点写入失败，请重试！");
            return;
        }

        for (var j = 0; j < INPUT_SLOTS.length; j++) {
            var stack2 = inv.getItem(INPUT_SLOTS[j]);
            if (!stack2 || stack2.getType() === Material.AIR) continue;
            var sid = CREDIT.getSlimefunId(stack2);
            if (!sid || !depositRates[sid]) continue;
            inv.setItem(INPUT_SLOTS[j], null);
        }

        CREDIT.updateAllCardsLore(player.getInventory(), uuid, player.getName(), newCredit);

        var loc = player.getLocation();
        try { loc.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, loc, 10, 0.4, 0.4, 0.4, 0.15); } catch (e) {}
        try { loc.getWorld().playSound(loc, "entity.experience_orb.pickup", 0.6, 1.3); } catch (e) {}

        var parts = [];
        for (var id2 in itemCounts) {
            parts.push("§b" + itemCounts[id2] + "个 §e" + (ITEM_NAMES[id2] || id2));
        }
        player.sendMessage(GLTC_PREFIX + "§a本次转化了 " + parts.join("§a，") + "§a，总共转化 §b" + totalItems + "次§a，获得 §b" + gainedCredit + "△ §a信用点！当前余额：§b" + newCredit + "△");
    } finally {
        processingPlayers.remove(player);
    }
}

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
                } else if (!isInputSlot(slot)) {
                    event.setCancelled(true);
                }
            }
        }, PLUGIN
    );

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

function tick(info) {}

registerListeners();
