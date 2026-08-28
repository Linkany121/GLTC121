// ===================================================================
// 枪械集成枪 PDC — 存储当前选中的枪械 ID
// ===================================================================

var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");

var KEY_SELECTED_GUN = new NamespacedKey("gltc", "integration_gun_id");
var LORE_MARKER = "§8§m----------------";
var LORE_PREFIX_PLAIN = "[已装载]";

function stripColor(str) {
    return String(str || "").replace(/§x(§[0-9a-fA-F]){6}/g, "").replace(/§./g, "");
}

function gunDisplayName(gunId) {
    if (!gunId) return "§7未选择";
    try {
        var sf = SlimefunItem.getById(String(gunId));
        if (sf) {
            var meta = sf.getItem().getItemMeta();
            if (meta && meta.hasDisplayName()) return String(meta.getDisplayName());
        }
    } catch (e) {}
    return String(gunId);
}

function readSelectedGunId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var meta = stack.getItemMeta();
        if (!meta) return null;
        var pdc = meta.getPersistentDataContainer();
        if (!pdc.has(KEY_SELECTED_GUN, PersistentDataType.STRING)) return null;
        var v = String(pdc.get(KEY_SELECTED_GUN, PersistentDataType.STRING)).trim();
        return v.length ? v : null;
    } catch (e) { return null; }
}

function stripIntegrationLore(lore) {
    if (!lore) return new java.util.ArrayList();
    var out = new java.util.ArrayList();
    for (var i = 0; i < lore.size(); i++) {
        var line = String(lore.get(i));
        if (line.indexOf(LORE_MARKER) >= 0) break;
        if (stripColor(line).indexOf(LORE_PREFIX_PLAIN) >= 0) continue;
        out.add(line);
    }
    return out;
}

function buildIntegrationLore(baseLore, gunId) {
    var lore = stripIntegrationLore(baseLore);
    lore.add(LORE_MARKER);
    if (gunId) {
        lore.add("§f[§x§9§6§d§6§a§7已装载§f] " + gunDisplayName(gunId));
        lore.add("§7蹲下右键打开枪械选择界面");
    } else {
        lore.add("§7[未装载] §7请先蹲下右键选择枪械");
    }
    return lore;
}

function writeSelectedGun(stack, gunId, gunCfg) {
    if (!stack || stack.getType() === Material.AIR) return false;
    if (gunId && gunCfg && typeof gunCfg.isRegisteredGun === "function" && !gunCfg.isRegisteredGun(gunId)) {
        return false;
    }
    var meta = stack.getItemMeta();
    if (!meta) return false;
    var pdc = meta.getPersistentDataContainer();
    if (gunId) {
        pdc.set(KEY_SELECTED_GUN, PersistentDataType.STRING, String(gunId));
    } else {
        try { pdc.remove(KEY_SELECTED_GUN); } catch (eR) {}
    }
    meta.setLore(buildIntegrationLore(meta.hasLore() ? meta.getLore() : null, gunId));
    stack.setItemMeta(meta);
    return true;
}

function readIntegrationMeta(stack, integrationGunId) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var sf = SlimefunItem.getByItem(stack);
        if (!sf || String(sf.getId()) !== String(integrationGunId)) return null;
    } catch (eId) { return null; }
    return {
        itemId: String(integrationGunId),
        selectedGunId: readSelectedGunId(stack)
    };
}

function isHoldingGunOrIntegration(player, gunId, integrationGunId) {
    if (player == null || !player.isOnline()) return false;
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return false;
    try {
        var sf = SlimefunItem.getByItem(item);
        if (!sf) return false;
        if (String(sf.getId()) === String(gunId)) return true;
        if (integrationGunId && String(sf.getId()) === String(integrationGunId)) {
            return readSelectedGunId(item) === String(gunId);
        }
    } catch (e) {}
    return false;
}

return {
    KEY_SELECTED_GUN: KEY_SELECTED_GUN,
    gunDisplayName: gunDisplayName,
    readSelectedGunId: readSelectedGunId,
    writeSelectedGun: writeSelectedGun,
    readIntegrationMeta: readIntegrationMeta,
    isHoldingGunOrIntegration: isHoldingGunOrIntegration,
    buildIntegrationLore: buildIntegrationLore,
    stripIntegrationLore: stripIntegrationLore
};
