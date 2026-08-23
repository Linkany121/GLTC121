/**
 * 能源流信用点 — 充值机 / 银行卡 / 各兑换商店共用
 * 统一 ReentrantLock、原子写盘、限购与扣款同事务
 * 使用 IIFE 包裹，避免被 eval 到商店脚本时与外层 const Bukkit 等冲突
 */
(function() {
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");
var StandardCopyOption = java.nio.file.StandardCopyOption;

var PLUGIN = (function() {
    try {
        var p = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        if (p != null) return p;
    } catch (e) {}
    try {
        return Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
    } catch (e2) {}
    return null;
})();

var DATA_DIR = null;
var LIMIT_DIR = null;

function resolvePlugin() {
    if (PLUGIN != null) return PLUGIN;
    try {
        var p = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        if (p != null) { PLUGIN = p; return p; }
    } catch (e) {}
    try {
        PLUGIN = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
    } catch (e2) {}
    return PLUGIN;
}

function ensureDataDirs() {
    var p = resolvePlugin();
    if (p == null) return false;
    if (DATA_DIR == null) {
        DATA_DIR = new File(p.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/信用点");
        if (!DATA_DIR.exists()) DATA_DIR.mkdirs();
    }
    if (LIMIT_DIR == null) {
        LIMIT_DIR = new File(p.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/限购");
        if (!LIMIT_DIR.exists()) LIMIT_DIR.mkdirs();
    }
    return true;
}

var CARD_OWNER_KEY = new NamespacedKey("gltc", "card_owner");
var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
var CARD_ID = "GLTC_银行卡";

// 材料 → 信用点（充值机存入）
var DEPOSIT_RATES = {
    "AL_A1": 0.5, "AL_A2": 0.5, "AL_A3": 0.5, "AL_A4": 0.5, "AL_A5": 0.5, "AL_A6": 0.5,
    "AL_B1": 1, "TSTL": 1, "TSSY": 1, "TSG": 1,
    "TSHH": 2, "TSYY": 2, "TSBD": 2, "TSTLS": 2, "TSND": 2, "TSJJ": 2, "TSGD": 2, "TSXT": 2,
    "TSTJ": 3, "TSDBG": 3, "TSBTL": 3, "TSJLD": 3, "TSYM": 3, "TSLD": 3, "TSYD": 3, "TSDD": 3,
    "TSPJD": 4, "TSCH": 4, "TSSKD": 4, "TSLKS": 4, "TSYMY": 4, "TSDJL": 4, "TSGWHS": 4, "TSTHYY": 4
};

// 商店标价中材料 ID → 信用点单价
var SHOP_EXCHANGE_RATES = {
    "AL_A1": 1, "AL_A2": 1, "AL_A3": 1, "AL_A4": 1, "AL_A5": 1, "AL_A6": 1,
    "AL_B1": 2, "TSTL": 2, "TSSY": 2, "TSG": 2,
    "TSHH": 3, "TSYY": 3, "TSBD": 3, "TSTLS": 3, "TSND": 3, "TSJJ": 3, "TSGD": 3, "TSXT": 3,
    "TSTJ": 4, "TSDBG": 4, "TSBTL": 4, "TSJLD": 4, "TSYM": 4, "TSLD": 4, "TSYD": 4, "TSDD": 4,
    "TSPJD": 5, "TSCH": 5, "TSSKD": 5, "TSLKS": 5, "TSYMY": 5, "TSDJL": 5, "TSGWHS": 5, "TSTHYY": 5
};

function getCreditLock() {
    var p = resolvePlugin();
    if (p == null) return new java.lang.Object();
    var ReentrantLock = Java.type("java.util.concurrent.locks.ReentrantLock");
    try {
        if (p.gltcCreditLock == null || !ReentrantLock.class.isInstance(p.gltcCreditLock)) {
            p.gltcCreditLock = new ReentrantLock();
        }
        return p.gltcCreditLock;
    } catch (e) {
        if (p.gltcCreditLock == null) p.gltcCreditLock = new java.lang.Object();
        return p.gltcCreditLock;
    }
}

function withCreditLock(fn) {
    var lock = getCreditLock();
    try {
        var ReentrantLock = Java.type("java.util.concurrent.locks.ReentrantLock");
        if (ReentrantLock.class.isInstance(lock)) {
            lock.lock();
            try { return fn(); } finally { lock.unlock(); }
        }
    } catch (e0) {}
    try {
        if (typeof Java.synchronized === "function") {
            return Java.synchronized(lock, fn)();
        }
    } catch (e1) {}
    return fn();
}

function normalizeCredit(value) {
    var n = Number(value);
    if (!isFinite(n) || n < 0) return 0;
    return n;
}

function atomicWriteJson(file, obj) {
    var tmp = new File(file.getAbsolutePath() + ".tmp");
    var lines = new java.util.ArrayList();
    lines.add(JSON.stringify(obj, null, 2));
    Files.write(tmp.toPath(), lines, StandardCharsets.UTF_8);
    try {
        Files.move(tmp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    } catch (e) {
        try { Files.move(tmp.toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING); } catch (e2) {
            throw e2;
        }
    }
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
    var sf = SlimefunItem.getByItem(stack);
    return sf ? sf.getId() : null;
}

function getCreditUnlocked(uuid) {
    if (!ensureDataDirs()) return 0;
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    if (!file.exists()) return 0;
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
        return normalizeCredit(JSON.parse(charBuffer.toString()).credit);
    } catch (e) {
        try {
            Bukkit.getLogger().warning("[GLTC信用点] 读取失败 uuid=" + uuid + ": " + e);
        } catch (e2) {}
        return 0;
    }
}

function setCreditUnlocked(uuid, credit) {
    if (!ensureDataDirs()) return false;
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    var value = normalizeCredit(credit);
    try {
        atomicWriteJson(file, { credit: value });
        return true;
    } catch (e) {
        try {
            Bukkit.getLogger().warning("[GLTC信用点] 写入失败 uuid=" + uuid + ": " + e);
        } catch (e2) {}
        return false;
    }
}

function getCredit(uuid) {
    return withCreditLock(function() { return getCreditUnlocked(uuid); });
}

function setCredit(uuid, credit) {
    return withCreditLock(function() { return setCreditUnlocked(uuid, credit); });
}

function addCredit(uuid, amount) {
    return withCreditLock(function() {
        var cur = getCreditUnlocked(uuid);
        var next = normalizeCredit(cur + amount);
        if (!setCreditUnlocked(uuid, next)) return null;
        return next;
    });
}

function trySpendCredit(uuid, cost) {
    return withCreditLock(function() {
        var need = normalizeCredit(cost);
        var cur = getCreditUnlocked(uuid);
        if (cur < need) return false;
        return setCreditUnlocked(uuid, cur - need);
    });
}

function getLimitCountUnlocked(uuid, itemId) {
    if (!ensureDataDirs()) return 0;
    var file = new File(LIMIT_DIR.getAbsolutePath() + "/" + uuid + ".json");
    if (!file.exists()) return 0;
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
        var data = JSON.parse(charBuffer.toString());
        return (data && data[itemId]) || 0;
    } catch (e) {
        try {
            Bukkit.getLogger().warning("[GLTC限购] 读取失败 uuid=" + uuid + ": " + e);
        } catch (e2) {}
        return 0;
    }
}

function setLimitCountUnlocked(uuid, itemId, count) {
    if (!ensureDataDirs()) return false;
    var file = new File(LIMIT_DIR.getAbsolutePath() + "/" + uuid + ".json");
    try {
        var data = {};
        if (file.exists()) {
            var bytes = Files.readAllBytes(file.toPath());
            var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
            data = JSON.parse(charBuffer.toString()) || {};
        }
        data[itemId] = count;
        atomicWriteJson(file, data);
        return true;
    } catch (e) {
        try {
            Bukkit.getLogger().warning("[GLTC限购] 写入失败 uuid=" + uuid + " item=" + itemId + ": " + e);
        } catch (e2) {}
        return false;
    }
}

function getLimitCount(uuid, itemId) {
    return withCreditLock(function() { return getLimitCountUnlocked(uuid, itemId); });
}

/**
 * 商店扣款；若提供 limitItemId + limitMax，在同一锁内校验并更新限购
 * @returns {{ok:boolean, reason?:string, balance?:number, bought?:number, left?:number, needed?:number}}
 */
function trySpendForShop(uuid, cost, limitItemId, limitMax, buyCount) {
    return withCreditLock(function() {
        var bought = 0;
        if (limitItemId && limitMax > 0) {
            bought = getLimitCountUnlocked(uuid, limitItemId);
            var left = limitMax - bought;
            if (left <= 0 || buyCount > left) {
                return { ok: false, reason: "limit", bought: bought, left: Math.max(0, left) };
            }
        }
        var need = normalizeCredit(cost);
        var cur = getCreditUnlocked(uuid);
        if (cur < need) {
            return { ok: false, reason: "credit", needed: need };
        }
        if (!setCreditUnlocked(uuid, cur - need)) {
            return { ok: false, reason: "io" };
        }
        if (limitItemId && limitMax > 0) {
            if (!setLimitCountUnlocked(uuid, limitItemId, bought + buyCount)) {
                setCreditUnlocked(uuid, cur);
                return { ok: false, reason: "io" };
            }
        }
        return { ok: true, balance: cur - need };
    });
}

function calcShopCreditCost(priceList) {
    var total = 0;
    for (var i = 0; i < priceList.length; i++) {
        total += priceList[i].amount * (SHOP_EXCHANGE_RATES[priceList[i].id] || 0);
    }
    return total;
}

function calcDepositCredit(itemId, amount) {
    return amount * (DEPOSIT_RATES[itemId] || 0);
}

function getCardOwner(item) {
    var meta = item.getItemMeta();
    if (!meta) return null;
    var pdc = meta.getPersistentDataContainer();
    return pdc.has(CARD_OWNER_KEY, PersistentDataType.STRING)
        ? pdc.get(CARD_OWNER_KEY, PersistentDataType.STRING) : null;
}

function bindCard(item, uuid) {
    var meta = item.getItemMeta();
    if (!meta) return false;
    meta.getPersistentDataContainer().set(CARD_OWNER_KEY, PersistentDataType.STRING, uuid);
    item.setItemMeta(meta);
    return true;
}

function updateCardLore(item, playerName, credit) {
    var meta = item.getItemMeta();
    if (!meta) return;
    var lore = meta.getLore();
    if (!lore || lore.size() < 6) return;
    lore.set(4, "§f[§e凭证持有者§f]§b " + playerName);
    lore.set(5, "§f[§e信用点余额§f]§b " + credit + "△");
    meta.setLore(lore);
    item.setItemMeta(meta);
}

function updateAllCardsLore(inv, uuid, name, credit) {
    for (var i = 0; i < inv.getSize(); i++) {
        var stack = inv.getItem(i);
        if (!stack || stack.getType() === Material.AIR) continue;
        var id = getSlimefunId(stack);
        if (!id || id !== CARD_ID) continue;
        var owner = getCardOwner(stack);
        if (owner && owner === uuid) updateCardLore(stack, name, credit);
    }
}

function findCard(inv, uuid) {
    for (var i = 0; i < inv.getSize(); i++) {
        var stack = inv.getItem(i);
        if (!stack || stack.getType() === Material.AIR) continue;
        if (getSlimefunId(stack) !== CARD_ID) continue;
        var owner = getCardOwner(stack);
        if (owner && owner === uuid) return true;
    }
    return false;
}

function hasBoundCard(inv, uuid) {
    return findCard(inv, uuid);
}

function giveItems(player, itemProto, amount) {
    var maxStack = itemProto.getMaxStackSize();
    var give = amount;
    while (give > 0) {
        var copy = itemProto.clone();
        copy.setAmount(Math.min(maxStack, give));
        var left = player.getInventory().addItem(copy);
        if (!left.isEmpty()) {
            var it = left.values().iterator();
            while (it.hasNext()) {
                player.getWorld().dropItemNaturally(player.getLocation(), it.next());
            }
        }
        give -= Math.min(maxStack, give);
    }
}

return ({
    PLUGIN: PLUGIN,
    CARD_ID: CARD_ID,
    CARD_OWNER_KEY: CARD_OWNER_KEY,
    SF_ITEM_KEY: SF_ITEM_KEY,
    DEPOSIT_RATES: DEPOSIT_RATES,
    SHOP_EXCHANGE_RATES: SHOP_EXCHANGE_RATES,
    getSlimefunId: getSlimefunId,
    getCredit: getCredit,
    setCredit: setCredit,
    addCredit: addCredit,
    trySpendCredit: trySpendCredit,
    getLimitCount: getLimitCount,
    trySpendForShop: trySpendForShop,
    calcShopCreditCost: calcShopCreditCost,
    calcDepositCredit: calcDepositCredit,
    getCardOwner: getCardOwner,
    bindCard: bindCard,
    updateCardLore: updateCardLore,
    updateAllCardsLore: updateAllCardsLore,
    findCard: findCard,
    hasBoundCard: hasBoundCard,
    giveItems: giveItems
});
})();
