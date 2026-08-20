
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;

// 插件数据目录 → addon_configs/GLTC/玩家属性/信用点/
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var DATA_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/信用点");
if (!DATA_DIR.exists()) DATA_DIR.mkdirs();

// PDC Key：卡主UUID
var CARD_OWNER_KEY = new NamespacedKey("gltc", "card_owner");

// ---------------- 信用点数据读写 ----------------

function getCreditLock() {
    if (PLUGIN.gltcCreditLock == null) PLUGIN.gltcCreditLock = new java.lang.Object();
    return PLUGIN.gltcCreditLock;
}

function getPlayerCredit(uuid) {
    return Java.synchronized(getCreditLock(), function() {
        var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
        if (!file.exists()) return 0;
        try {
            var bytes = Files.readAllBytes(file.toPath());
            var ByteBuffer = Java.type("java.nio.ByteBuffer");
            var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
            return JSON.parse(charBuffer.toString()).credit || 0;
        } catch (e) {
            return 0;
        }
    })();
}

function setPlayerCredit(uuid, credit) {
    return Java.synchronized(getCreditLock(), function() {
        var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
        try {
            var lines = new java.util.ArrayList();
            lines.add(JSON.stringify({credit: credit}, null, 2));
            Files.write(file.toPath(), lines, StandardCharsets.UTF_8);
            return true;
        } catch (e) {
            Bukkit.getLogger().warning("[GLTC] 保存信用点失败 uuid=" + uuid + ": " + e);
            return false;
        }
    })();
}

// ---------------- 卡片绑定 ----------------

function getCardOwner(item) {
    var meta = item.getItemMeta();
    if (!meta) return null;
    var pdc = meta.getPersistentDataContainer();
    return pdc.has(CARD_OWNER_KEY, PersistentDataType.STRING) ? pdc.get(CARD_OWNER_KEY, PersistentDataType.STRING) : null;
}

function bindCard(item, uuid) {
    var meta = item.getItemMeta();
    if (!meta) return false;
    meta.getPersistentDataContainer().set(CARD_OWNER_KEY, PersistentDataType.STRING, uuid);
    item.setItemMeta(meta);
    return true;
}

// ---------------- 卡片 Lore 更新 ----------------

function updateCardLore(item, playerName, credit) {
    var meta = item.getItemMeta();
    if (!meta) return;
    var lore = meta.getLore();
    if (!lore || lore.size() < 5) return;
    // 第5行 = 持有者 (0-based: 4)
    lore.set(4, "§f[§e凭证持有者§f]§b " + playerName);
    // 第6行 = 余额   (0-based: 5)
    lore.set(5, "§f[§e信用点余额§f]§b " + credit + "△");
    meta.setLore(lore);
    item.setItemMeta(meta);
}

/**
 * 遍历背包中找到 GLTC_银行卡，根据卡主 UUID 同步 info 并刷新 lore
 * @returns {number} 信用点数，若背包无卡返回 -1
 */
function syncCardInInventory(inv, uuid, name) {
    var credit = -1;
    for (var i = 0; i < inv.getSize(); i++) {
        var stack = inv.getItem(i);
        if (!stack || stack.getType() === Material.AIR) continue;
        var sf = SlimefunItem.getByItem(stack);
        if (!sf || sf.getId() !== "GLTC_银行卡") continue;
        var owner = getCardOwner(stack);
        if (!owner || owner !== uuid) continue;
        credit = getPlayerCredit(uuid);
        updateCardLore(stack, name, credit);
    }
    return credit;
}

/**
 * 检查玩家背包中是否已存在一张绑定给该玩家的银行卡
 * 用于实现一人一卡限制
 */
function hasBoundCardInInventory(inv, uuid) {
    for (var i = 0; i < inv.getSize(); i++) {
        var stack = inv.getItem(i);
        if (!stack || stack.getType() === Material.AIR) continue;
        var sf = SlimefunItem.getByItem(stack);
        if (!sf || sf.getId() !== "GLTC_银行卡") continue;
        var o = getCardOwner(stack);
        if (o && o === uuid) return true;
    }
    return false;
}

// ---------------- onUse ----------------

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "GLTC_银行卡") return;

    // 数量必须为1，防止持有多个信用卡
    if (item.getAmount() !== 1) {
        player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §c请将凭证数量分离为1张后再使用！");
        return;
    }

    var uuid = player.getUniqueId().toString();
    var name = player.getName();
    var owner = getCardOwner(item);

    // 未绑定 → 检查玩家是否已有一张绑定的银行卡，一人一卡
    if (!owner) {
        if (hasBoundCardInInventory(player.getInventory(), uuid)) {
            player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §c你已经持有一张已绑定的凭证！一人一卡，请勿多持。");
            return;
        }
        bindCard(item, uuid);
        // 检查是否已有信用点数据（补办银行卡时同步已有数据）
        var dataFile = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
        if (dataFile.exists()) {
            var existingCredit = getPlayerCredit(uuid);
            updateCardLore(item, name, existingCredit);
            player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §a凭证已重新绑定至 §e" + name + " §a，已同步信用点数据，当前余额：§b" + existingCredit + "△");
        } else {
            setPlayerCredit(uuid, 0);
            updateCardLore(item, name, 0);
            player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §a凭证已绑定至 §e" + name + " §a，初始信用点：§b0△");
        }
        return;
    }

    // 绑定给了别人
    if (owner !== uuid) {
        player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §c一人一卡，请将不属于你的凭证归还！");
        return;
    }

    // 自己的卡 → 同步显示余额
    var credit = getPlayerCredit(uuid);
    updateCardLore(item, name, credit);
    player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §e" + name + " §a凭证余额：§b" + credit + "△");
}