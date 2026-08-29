
const CATEGORIES = [
    {
        id: '矿物',
        name: '§x§F§F§0§0§0§0⚡ §x§F§F§A§5§0§0矿§x§F§F§D§7§0§0物 §x§3§C§A§F§F§F⚡',
        lore: '§x§F§F§B§6§C§1❀ §x§F§F§B§6§C§1全部矿物、原矿 §x§C§D§5§B§9§9❀',
        icon: 'DIAMOND',
        slot: 10
    }
];

const MAIN_TITLE = '§x§7§7§f§7§f§f协§x§6§0§f§a§d§a议§x§4§9§f§d§b§5内§x§6§3§f§f§9§3容§x§b§0§f§f§7§5：§x§f§c§f§f§5§7矿物';
const SHOP_LISTENER_KEY = 'gltcEnergyShop_矿物';

const BORDER_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 17, 18, 26, 27, 35, 36, 44, 45, 46, 47, 51, 52, 53];
const PAGE_SIZE = 28;
const ITEM_SLOTS = [10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43];
const PREV_SLOT = 48;
const NEXT_SLOT = 50;

const ITEM_NAMES = {
    COAL: '煤炭', REDSTONE: '红石粉', LAPIS_LAZULI: '青金石', QUARTZ: '下界石英',
    COPPER_INGOT: '铜锭', IRON_INGOT: '铁锭', GOLD_INGOT: '金锭', AMETHYST_SHARD: '紫水晶碎片',
    DIAMOND: '钻石', EMERALD: '绿宝石', NETHERITE_SCRAP: '下界合金碎片', NETHERITE_INGOT: '下界合金锭',
    COAL_ORE: '煤矿石', COPPER_ORE: '铜矿石', IRON_ORE: '铁矿石', GOLD_ORE: '金矿石',
    REDSTONE_ORE: '红石矿石', LAPIS_ORE: '青金石矿石', DIAMOND_ORE: '钻石矿石',
    EMERALD_ORE: '绿宝石矿石', NETHER_QUARTZ_ORE: '下界石英矿石', NETHER_GOLD_ORE: '下界金矿石', ANCIENT_DEBRIS: '远古残骸'
};

const ITEMS = {
    矿物: [
        { type: 'vanilla', id: 'COAL', price: [{ id: 'AL_A1', amount: 2 }], giveAmount: 1 },
        { type: 'vanilla', id: 'REDSTONE', price: [{ id: 'AL_A1', amount: 4 }], giveAmount: 1 },
        { type: 'vanilla', id: 'LAPIS_LAZULI', price: [{ id: 'AL_A1', amount: 4 }], giveAmount: 1 },
        { type: 'vanilla', id: 'QUARTZ', price: [{ id: 'AL_A1', amount: 4 }], giveAmount: 1 },
        { type: 'vanilla', id: 'COPPER_INGOT', price: [{ id: 'AL_A1', amount: 4 }], giveAmount: 1 },
        { type: 'vanilla', id: 'IRON_INGOT', price: [{ id: 'AL_A1', amount: 4 }], giveAmount: 1 },
        { type: 'vanilla', id: 'GOLD_INGOT', price: [{ id: 'AL_A1', amount: 4 }], giveAmount: 1 },
        { type: 'vanilla', id: 'AMETHYST_SHARD', price: [{ id: 'AL_A1', amount: 4 }], giveAmount: 1 },
        { type: 'vanilla', id: 'DIAMOND', price: [{ id: 'AL_A1', amount: 12 }], giveAmount: 1 },
        { type: 'vanilla', id: 'EMERALD', price: [{ id: 'AL_A1', amount: 12 }], giveAmount: 1 },
        { type: 'vanilla', id: 'ANCIENT_DEBRIS', price: [{ id: 'AL_A1', amount: 64 }], giveAmount: 1 },
        { type: 'vanilla', id: 'NETHERITE_SCRAP', price: [{ id: 'AL_A1', amount: 32 }], giveAmount: 1 },
        { type: 'vanilla', id: 'NETHERITE_INGOT', price: [{ id: 'AL_A1', amount: 128 }], giveAmount: 1 },
        { type: 'vanilla', id: 'COAL_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'COPPER_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'IRON_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'GOLD_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'REDSTONE_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'LAPIS_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'DIAMOND_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'EMERALD_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'NETHER_QUARTZ_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 },
        { type: 'vanilla', id: 'NETHER_GOLD_ORE', price: [{ id: 'AL_A1', amount: 80 }], giveAmount: 1 }
    ]
};

const Bukkit = Java.type('org.bukkit.Bukkit');
const Material = Java.type('org.bukkit.Material');
const ItemStack = Java.type('org.bukkit.inventory.ItemStack');
const ClickEvent = Java.type('org.bukkit.event.inventory.InventoryClickEvent');
const CloseEvent = Java.type('org.bukkit.event.inventory.InventoryCloseEvent');
const EventPriority = Java.type('org.bukkit.event.EventPriority');
const SlimefunItem = Java.type('io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem');
const Listener = Java.type('org.bukkit.event.Listener');

// ---- 信用点系统（共用 _信用点.js）----
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
    addPath(new File(basePath + "/addons/rsc版GLTC_联合协议/scripts/能源流/_信用点.js"));
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

const BATCH_MULTIPLIER = 3;
const COOLDOWN_MAP = new java.util.HashMap();
const COOLDOWN_MS = 200;

function isOnCooldown(player) {
    const last = COOLDOWN_MAP.get(player);
    if (!last) return false;
    if (Date.now() - last < COOLDOWN_MS) return true;
    COOLDOWN_MAP.remove(player);
    return false;
}
function setCooldown(player) { COOLDOWN_MAP.put(player, Date.now()); }

function item(mat, name, lore) {
    const it = new ItemStack(Material.getMaterial(mat));
    const meta = it.getItemMeta();
    meta.setDisplayName(name);
    if (lore) meta.setLore(Array.isArray(lore) ? lore : [lore]);
    it.setItemMeta(meta);
    return it;
}
function borderItem() { return item('BLUE_STAINED_GLASS_PANE', '§6 '); }
function applyBorder(inv) { const b = borderItem(); BORDER_SLOTS.forEach(s => inv.setItem(s, b.clone())); }

function canAddItem(player, itemStack, amount) {
    const maxStack = itemStack.getMaxStackSize();
    let remaining = amount;
    const inv = player.getInventory();
    for (let i = 0; i < 36; i++) {
        const stack = inv.getItem(i);
        if (stack == null) { remaining -= maxStack; if (remaining <= 0) return true; continue; }
        if (stack.isSimilar(itemStack)) {
            const space = maxStack - stack.getAmount();
            if (space > 0) { remaining -= space; if (remaining <= 0) return true; }
        }
    }
    return false;
}


function getBuyMessage(priceList, times, totalGive, itemId, balance, batchMul) {
    var CREDIT = loadCreditApi();
    var _unitPrice = CREDIT ? CREDIT.calcShopCreditCost(priceList) : 0;
    var creditCost = _unitPrice * times * (batchMul || 1);
    var itemName = ITEM_NAMES[itemId] || itemId;
    
    var prefix = (
        '§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T' +
        '§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合' +
        '§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f]' +
        '§x§F§F§B§A§6§8协§x§F§0§D§8§7§3议§x§E§2§F§5§7§D流' +
        '§x§A§F§F§A§5对§x§6§B§F§F§D§B接§x§4§1§F§1§F§F成' +
        '§x§4§C§C§5§F§F功§x§5§7§9§A§F§F，'
    );
    if (times > 1) {
        var _mul = batchMul || 1;
        return prefix + '§x§F§F§F§5§B§3本次兑换消耗§c' + _mul + '§x§F§F§F§5§B§3倍信用点，总计消耗§c' + _mul + '*' + times + '*' + _unitPrice + '=' + creditCost + '△ §x§F§F§F§5§B§3信用点，获得§a' + totalGive + ' §x§F§F§F§5§B§3个 §e' + itemName + ' §x§F§F§F§5§B§3。§x§F§F§F§5§B§3当前余额：§b' + balance + '△';
    } else {
        return prefix + '§x§F§F§F§5§B§3消耗 §b' + creditCost + '△ §x§F§F§F§5§B§3信用点兑换了 §a' + totalGive + ' §x§F§F§F§5§B§3个 §e' + itemName + ' §x§F§F§F§5§B§3。§x§F§F§F§5§B§3当前余额：§b' + balance + '△';
    }
}

function getFailMessage(neededAmount) {
    var prefix = (
        '§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T' +
        '§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合' +
        '§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f]' +
        '§x§F§F§9§4§9§4协§x§D§C§8§3§C§2议§x§B§9§7§3§F§0流' +
        '§x§B§0§5§D§E§E对§x§B§5§4§6§D§5接§x§B§6§3§7§B§2失' +
        '§x§B§1§3§B§7§B败§x§A§C§3§F§4§5，'
    );
    if (neededAmount < 0) return prefix + '§x§E§7§9§3§9§8背包中没有已绑定的银行卡。';
    return prefix + '§x§E§7§9§3§9§8信用点不足，需要 §b' + neededAmount + '△§x§E§7§9§3§9§8。';
}

function buildMineralMenu(page) {
    var CREDIT = loadCreditApi();
    if (!CREDIT) return null;
    page = page || 0;
    const list = ITEMS['矿物'];
    if (!list || !list.length) return null;
    const totalPages = Math.ceil(list.length / PAGE_SIZE);
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;

    const inv = Bukkit.createInventory(null, 54, MAIN_TITLE);
    applyBorder(inv);
    inv.setItem(4, item('LIGHT_BLUE_GLAZED_TERRACOTTA', '§b协议面板用法', [
        '§7使用 §b信用点 §7购买（需持有已绑定的银行卡）',
        '§7点击即购买1次（获得标注数量），Shift+点击直接购买64个。',
        '§e第 ' + (page + 1) + '/' + totalPages + ' 页，共' + list.length + '种'
    ]));
    if (totalPages > 1) {
        if (page > 0) inv.setItem(PREV_SLOT, item('ARROW', '§e← 上一页', ['§7点击返回上一页']));
        if (page < totalPages - 1) inv.setItem(NEXT_SLOT, item('ARROW', '§e下一页 →', ['§7点击前往下一页']));
    }
    inv.setItem(49, item('BARRIER', '§c关闭', '§7关闭菜单'));

    const startIdx = page * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, list.length);
    for (let i = startIdx; i < endIdx; i++) {
        const e = list[i];
        const slot = ITEM_SLOTS[i - startIdx];
        let displayItem = null;
        if (e.type === 'vanilla') {
            const mat = Material.getMaterial(e.id);
            if (mat) {
                displayItem = new ItemStack(mat, 1);
                const meta = displayItem.getItemMeta();
                var _creditCost = CREDIT.calcShopCreditCost(e.price);
                var _give = e.giveAmount || 1;
                meta.setLore([
                    '§x§F§F§F§5§B§3点击即消耗 §b' + _creditCost + '△ §x§F§F§F§5§B§3信用点兑换 §e' + _give + ' §x§F§F§F§5§B§3个。',
                    '§x§F§F§C§2§7§Bshift+点击将购买64个，但所需信用点将翻§c' + BATCH_MULTIPLIER + '§x§F§F§C§2§7§B倍！'
                ]);
                displayItem.setItemMeta(meta);
            }
        } else {
            const sf = SlimefunItem.getById(e.id);
            if (sf) {
                displayItem = sf.getItem().clone();
                const meta = displayItem.getItemMeta();
                var _creditCost = CREDIT.calcShopCreditCost(e.price);
                var _give = e.giveAmount || 1;
                meta.setLore([
                    '§x§F§F§F§5§B§3点击即消耗 §b' + _creditCost + '△ §x§F§F§F§5§B§3信用点兑换 §e' + _give + ' §x§F§F§F§5§B§3个。',
                    '§x§F§F§C§2§7§Bshift+点击将购买64个，但所需信用点将翻§c' + BATCH_MULTIPLIER + '§x§F§F§C§2§7§B倍！'
                ]);
                displayItem.setItemMeta(meta);
            }
        }
        if (displayItem) inv.setItem(slot, displayItem);
        else inv.setItem(slot, item('BARRIER', '§c无效物品', ['§7ID: ' + e.id]));
    }
    return inv;
}

const openPlayers = new java.util.HashSet();
const PAGE_MAP = new java.util.HashMap();
const PAGE_SWITCHING = new java.util.HashSet();
let registered = false;

function ensureListener() {
    if (registered) return;
    var rscPlugin = getRscPlugin();
    if (!rscPlugin) return;
    const DragEvent = Java.type('org.bukkit.event.inventory.InventoryDragEvent');
    var _oldShopL = rscPlugin[SHOP_LISTENER_KEY];
    if (_oldShopL) {
        ClickEvent.getHandlerList().unregister(_oldShopL);
        CloseEvent.getHandlerList().unregister(_oldShopL);
        DragEvent.getHandlerList().unregister(_oldShopL);
        rscPlugin[SHOP_LISTENER_KEY] = null;
    }
    const L = Java.extend(Listener, {});
    const listener = new L();

    Bukkit.getPluginManager().registerEvent(ClickEvent, listener, EventPriority.NORMAL, (l, e) => {
        try {
            var CREDIT = loadCreditApi();
            if (!CREDIT) return;
            const p = e.getWhoClicked();
            if (!openPlayers.contains(p)) return;
            if (e.getView().getTitle() !== MAIN_TITLE) return;
            const topInv = e.getView().getTopInventory();
            const clickedInv = e.getClickedInventory();
            if (clickedInv !== topInv) {
                if (clickedInv === e.getView().getBottomInventory() && e.isShiftClick()) e.setCancelled(true);
                return;
            }
            e.setCancelled(true);
            const slot = e.getSlot();
            const it = e.getCurrentItem();
            if (!it || it.getType() === Material.AIR) return;

            if (slot === PREV_SLOT && it.getItemMeta().getDisplayName() === '§e← 上一页') {
                const cur = PAGE_MAP.get(p) || 0;
                if (cur > 0) { PAGE_MAP.put(p, cur - 1); const inv = buildMineralMenu(cur - 1); if (inv) openMenu(p, inv); else p.sendMessage('§c无法创建兑换菜单，请联系管理员。'); }
                return;
            }
            if (slot === NEXT_SLOT && it.getItemMeta().getDisplayName() === '§e下一页 →') {
                const cur = PAGE_MAP.get(p) || 0;
                const totalPages = Math.ceil(ITEMS['矿物'].length / PAGE_SIZE);
                if (cur < totalPages - 1) { PAGE_MAP.put(p, cur + 1); const inv = buildMineralMenu(cur + 1); if (inv) openMenu(p, inv); else p.sendMessage('§c无法创建兑换菜单，请联系管理员。'); }
                return;
            }
            if (slot === 49 && it.getItemMeta().getDisplayName() === '§c关闭') { p.closeInventory(); return; }
            if (slot === 4 || BORDER_SLOTS.includes(slot)) return;

            const list = ITEMS['矿物'];
            const page = PAGE_MAP.get(p) || 0;
            let itemIndex = -1;
            for (let i = 0; i < ITEM_SLOTS.length; i++) {
                if (ITEM_SLOTS[i] === slot) { itemIndex = page * PAGE_SIZE + i; break; }
            }
            if (itemIndex < 0 || itemIndex >= list.length) return;
            const config = list[itemIndex];
            if (!config || !config.price) { p.sendMessage('§c价格配置错误'); return; }
            if (isOnCooldown(p)) { p.sendMessage('§c操作过快，请稍后再试'); return; }

            let itemProto = null;
            if (config.type === 'vanilla') {
                const mat = Material.getMaterial(config.id);
                if (mat) itemProto = new ItemStack(mat);
            } else {
                const sf = SlimefunItem.getById(config.id);
                if (sf) itemProto = sf.getItem().clone();
            }
            if (!itemProto) { p.sendMessage('§c物品配置错误'); return; }

            const isShift = e.isShiftClick();
            const giveAmount = config.giveAmount || 1;
            let times = isShift ? Math.ceil(64 / giveAmount) : 1;
            const totalGive = times * giveAmount;
            var _batchMul = isShift ? BATCH_MULTIPLIER : 1;
            var _creditCost = CREDIT.calcShopCreditCost(config.price) * times * _batchMul;

            var _uuid = p.getUniqueId().toString();
            if (!CREDIT || !CREDIT.findCard(p.getInventory(), _uuid)) {
                p.sendMessage(getFailMessage(-1));
                return;
            }
            if (!canAddItem(p, itemProto, totalGive)) {
                p.sendMessage('§c背包空间不足');
                return;
            }

            var spend = CREDIT.trySpendForShop(_uuid, _creditCost, null, 0, 0);
            if (!spend.ok) {
                if (spend.reason === 'credit') {
                    p.sendMessage(getFailMessage(_creditCost));
                } else {
                    p.sendMessage('§c交易失败，请重试。');
                }
                return;
            }
            CREDIT.giveItems(p, itemProto, totalGive);
            CREDIT.updateAllCardsLore(p.getInventory(), _uuid, p.getName(), spend.balance);
            p.sendMessage(getBuyMessage(config.price, times, totalGive, config.id, spend.balance, _batchMul));
            setCooldown(p);
        } catch (err) { print("矿物兑换错误: " + err); }
    }, rscPlugin);

    Bukkit.getPluginManager().registerEvent(CloseEvent, listener, EventPriority.NORMAL, (l, e) => {
        const p = e.getPlayer();
        if (PAGE_SWITCHING.contains(p)) return;
        openPlayers.remove(p);
        COOLDOWN_MAP.remove(p);
        PAGE_MAP.remove(p);
    }, rscPlugin);

    Bukkit.getPluginManager().registerEvent(DragEvent, listener, EventPriority.NORMAL, (l, e) => {
        if (!openPlayers.contains(e.getWhoClicked())) return;
        if (e.getView().getTitle() !== MAIN_TITLE) return;
        const topSize = e.getView().getTopInventory().getSize();
        const itSlots = e.getRawSlots().iterator();
        while (itSlots.hasNext()) if (itSlots.next() < topSize) { e.setCancelled(true); return; }
    }, rscPlugin);
    rscPlugin[SHOP_LISTENER_KEY] = listener; registered = true;
}

function openMenu(p, inv) { PAGE_SWITCHING.add(p); p.openInventory(inv); PAGE_SWITCHING.remove(p); openPlayers.add(p); ensureListener(); }
function openMain(p) {
    var CREDIT = loadCreditApi();
    if (!CREDIT) { p.sendMessage('§c信用点系统未加载，请联系管理员。'); return; }
    PAGE_MAP.put(p, 0); const inv = buildMineralMenu(0); if (inv) openMenu(p, inv); else p.sendMessage('§c无法创建兑换菜单，请联系管理员。'); }

function onButtonGroupClick(player, slot, clickedItem, clickAction, guideMode) { try { openMain(player); return true; } catch (err) { player.sendMessage('§c无法打开矿物兑换菜单'); return false; } }
function onUse(e) { try { openMain(e.getPlayer()); } catch (err) { e.getPlayer().sendMessage('§c无法打开矿物兑换菜单'); } return false; }