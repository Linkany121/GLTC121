
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

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


function getCardOwner(item) {
    var _c = loadCreditApi(); return _c ? _c.getCardOwner(item) : null;
}

function bindCard(item, uuid) {
    var _c = loadCreditApi(); return _c ? _c.bindCard(item, uuid) : false;
}

function updateCardLore(item, playerName, credit) {
    var _c = loadCreditApi(); if (_c) _c.updateCardLore(item, playerName, credit);
}

function getPlayerCredit(uuid) {
    var _c = loadCreditApi(); return _c ? _c.getCredit(uuid) : 0;
}

function setPlayerCredit(uuid, credit) {
    var _c = loadCreditApi(); return _c ? _c.setCredit(uuid, credit) : false;
}

function syncCardInInventory(inv, uuid, name) {
    var credit = -1;
    for (var i = 0; i < inv.getSize(); i++) {
        var stack = inv.getItem(i);
        if (!stack || stack.getType() === Material.AIR) continue;
        var _c = loadCreditApi();
        var id = _c ? _c.getSlimefunId(stack) : null;
        if (!id) {
            var sf = SlimefunItem.getByItem(stack);
            if (!sf || sf.getId() !== "GLTC_银行卡") continue;
        } else if (id !== "GLTC_银行卡") {
            continue;
        }
        var owner = getCardOwner(stack);
        if (!owner || owner !== uuid) continue;
        credit = getPlayerCredit(uuid);
        updateCardLore(stack, name, credit);
    }
    return credit;
}

function hasBoundCardInInventory(inv, uuid) {
    var _c = loadCreditApi(); return _c ? _c.hasBoundCard(inv, uuid) : false;
}

function onUse(event) {
    if (!loadCreditApi()) {
        event.getPlayer().sendMessage("§c信用点系统未加载，请联系管理员。");
        return;
    }

    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== "GLTC_银行卡") return;

    if (item.getAmount() !== 1) {
        player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §c请将凭证数量分离为1张后再使用！");
        return;
    }

    var uuid = player.getUniqueId().toString();
    var name = player.getName();
    var owner = getCardOwner(item);

    if (!owner) {
        if (hasBoundCardInInventory(player.getInventory(), uuid)) {
            player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §c你已经持有一张已绑定的凭证！一人一卡，请勿多持。");
            return;
        }
        bindCard(item, uuid);
        var dataFile = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/信用点/" + uuid + ".json");
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

    if (owner !== uuid) {
        player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §c一人一卡，请将不属于你的凭证归还！");
        return;
    }

    var credit = getPlayerCredit(uuid);
    updateCardLore(item, name, credit);
    player.sendMessage("§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] §e" + name + " §a凭证余额：§b" + credit + "△");
}
