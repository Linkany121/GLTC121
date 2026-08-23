var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
var APPEARANCE_KEY = new NamespacedKey("gltc", "gun_appearance");
function copyPdcStringEntries(fromPdc, toPdc) {
    var keys = fromPdc.getKeys();
    var it = keys.iterator();
    while (it.hasNext()) {
        var key = it.next();
        try {
            if (fromPdc.has(key, PersistentDataType.STRING)) {
                toPdc.set(key, PersistentDataType.STRING, fromPdc.get(key, PersistentDataType.STRING));
            }
        } catch (e) {}
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
function applyGunAppearance(stack, targetMaterial, appearanceCode) {
    if (!stack || stack.getType() === Material.AIR || targetMaterial == null) return false;
    try {
        var oldMeta = stack.getItemMeta();
        if (oldMeta == null) return false;
        var displayName = oldMeta.hasDisplayName() ? oldMeta.getDisplayName() : null;
        var lore = oldMeta.hasLore() ? oldMeta.getLore() : null;
        var customModelData = oldMeta.hasCustomModelData() ? oldMeta.getCustomModelData() : null;
        var oldPdc = oldMeta.getPersistentDataContainer();
        var preserved = false;
        try { preserved = stack.setType(targetMaterial, true); } catch (ePaper) {}
        if (!preserved) stack.setType(targetMaterial);
        var meta = stack.getItemMeta();
        if (meta == null) return false;
        if (displayName != null) meta.setDisplayName(displayName);
        if (lore != null) meta.setLore(lore);
        if (customModelData != null) {
            try { meta.setCustomModelData(customModelData); } catch (eCmd) {}
        }
        copyPdcStringEntries(oldPdc, meta.getPersistentDataContainer());
        if (appearanceCode) {
            meta.getPersistentDataContainer().set(APPEARANCE_KEY, PersistentDataType.STRING, appearanceCode);
        }
        stack.setItemMeta(meta);
        return true;
    } catch (e) {
        return false;
    }
}

var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCreativeEvent = Java.type("org.bukkit.event.inventory.InventoryCreativeEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var InventoryDragEvent = Java.type("org.bukkit.event.inventory.InventoryDragEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var Particle = Java.type("org.bukkit.Particle");
var GUI_TITLE = "§c§lFKRT §a枪械外观客制化组装桌";
var GUN_SLOT = 31;
var APPEARANCE_SLOTS = {
    11: { material: Material.GOLDEN_HOE, name: "§6§l金锄外观", desc: "§7点击将枪械材质切换为 §6金锄" },
    13: { material: Material.IRON_SWORD, name: "§f§l铁剑外观", desc: "§7点击将枪械材质切换为 §f铁剑" },
    15: { material: Material.CROSSBOW, name: "§7§l弩外观", desc: "§7点击将枪械材质切换为 §7弩(原始)" }
};
var CONFIRM_SLOT = 35;
var GUN_IDS = [
    "FKR_通古斯制式步枪",
    "FKR_通古斯战壕霰弹",
    "FKR_通古斯涡轮式单兵机枪",
    "FKR_通古斯防御型脉冲手铳",
    "FKR_通古斯制式轨道信标投递器",
    "FKR_通古斯过载式步枪"
];
var APPEARANCE_MATERIALS = {
    "GOLDEN_HOE": Material.GOLDEN_HOE,
    "IRON_SWORD": Material.IRON_SWORD,
    "CROSSBOW": Material.CROSSBOW
};
var APPEARANCE_NAMES = {
    "GOLDEN_HOE": "金锄",
    "IRON_SWORD": "铁剑",
    "CROSSBOW": "弩"
};
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] ";
var activeInventories = new java.util.HashSet();
var appearanceSelectionMap = new java.util.HashMap();

function getActiveInventories() {
    return activeInventories;
}

function getAppearanceMap() {
    return appearanceSelectionMap;
}

function shouldCancelGunDrag(event, topInv) {
    var topSize = topInv.getSize();
    var rawSlots = event.getRawSlots();
    var it = rawSlots.iterator();
    while (it.hasNext()) {
        var raw = it.next();
        if (raw < topSize && raw !== GUN_SLOT) return true;
    }
    return false;
}
function idEquals(a, b) {
    if (!a || !b) return false;
    return String(a).toLowerCase() === String(b).toLowerCase();
}
function isGun(stack) {
    var id = getSlimefunId(stack);
    if (!id) return false;
    for (var i = 0; i < GUN_IDS.length; i++) {
        if (idEquals(id, GUN_IDS[i])) return true;
    }
    return false;
}
var WHITE_ITEM;
(function() {
    WHITE_ITEM = new ItemStack(Material.WHITE_STAINED_GLASS_PANE);
    var meta = WHITE_ITEM.getItemMeta();
    meta.setDisplayName("§0");
    WHITE_ITEM.setItemMeta(meta);
})();
var CONFIRM_BUTTON;
(function() {
    CONFIRM_BUTTON = new ItemStack(Material.LIME_STAINED_GLASS_PANE);
    var meta = CONFIRM_BUTTON.getItemMeta();
    meta.setDisplayName("§a§l✔ 确认更换外观");
    meta.setLore(java.util.Arrays.asList(
        "§7将需要更换材质的枪械放入，",
        "§7点击上方按钮选择意愿材质后，",
        "§7点击此处确认更换。",
        "§c§o注意：切换材质不影响枪械性能、冷却与模型数据。"
    ));
    CONFIRM_BUTTON.setItemMeta(meta);
})();
function buildAppearanceButton(slot, selectedMatName) {
    var cfg = APPEARANCE_SLOTS[slot];
    var item = new ItemStack(cfg.material);
    var meta = item.getItemMeta();
    meta.setDisplayName(cfg.name);
    var lore = java.util.Arrays.asList(
        cfg.desc,
        "",
        selectedMatName ? ("§a§l● 已选: " + APPEARANCE_NAMES[selectedMatName]) : "§7○ 未选择"
    );
    meta.setLore(lore);
    item.setItemMeta(meta);
    return item;
}
var GUN_PLACEHOLDER;
(function() {
    GUN_PLACEHOLDER = new ItemStack(Material.LIGHT_GRAY_STAINED_GLASS_PANE);
    var meta = GUN_PLACEHOLDER.getItemMeta();
    meta.setDisplayName("§7§l[ 枪械放置槽 ]");
    meta.setLore(java.util.Arrays.asList(
        "§7将FKR枪械放入此槽位"
    ));
    GUN_PLACEHOLDER.setItemMeta(meta);
})();
function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var inv = Bukkit.createInventory(null, 54, GUI_TITLE);
    for (var i = 0; i < 54; i++) {
        inv.setItem(i, WHITE_ITEM.clone());
    }
    inv.setItem(11, buildAppearanceButton(11, null));
    inv.setItem(13, buildAppearanceButton(13, null));
    inv.setItem(15, buildAppearanceButton(15, null));
    inv.setItem(GUN_SLOT, GUN_PLACEHOLDER.clone());
    inv.setItem(CONFIRM_SLOT, CONFIRM_BUTTON.clone());
    getActiveInventories().add(inv);
    getAppearanceMap().put(inv, null);
    player.openInventory(inv);
}
function processChange(player, inv) {
    var gunStack = inv.getItem(GUN_SLOT);
    var selectedMatName = getAppearanceMap().get(inv);
    if (!selectedMatName) {
        player.sendMessage(GLTC_PREFIX + "§c请先选择一个目标材质！");
        return;
    }
    if (!gunStack || gunStack.getType() === Material.AIR) {
        player.sendMessage(GLTC_PREFIX + "§c请先投入枪械！");
        return;
    }
    if (gunStack.getType() === Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
        player.sendMessage(GLTC_PREFIX + "§c请先投入枪械！");
        return;
    }
    if (!isGun(gunStack)) {
        player.sendMessage(GLTC_PREFIX + "§c请投入枪械！");
        return;
    }
    var sfId = getSlimefunId(gunStack);
    if (!sfId) {
        player.sendMessage(GLTC_PREFIX + "§c无法识别枪械ID！");
        return;
    }
    var targetMaterial = APPEARANCE_MATERIALS[selectedMatName];
    if (!targetMaterial) {
        player.sendMessage(GLTC_PREFIX + "§c外观材质无效！");
        return;
    }
    try {
        if (!applyGunAppearance(gunStack, targetMaterial, selectedMatName)) {
            player.sendMessage(GLTC_PREFIX + "§c更换外观时发生错误！");
            return;
        }
        var loc = player.getLocation();
        try { loc.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, loc, 10, 0.4, 0.4, 0.4, 0.15); } catch (e) {}
        try { loc.getWorld().playSound(loc, "block.anvil.use", 0.8, 1.5); } catch (e) {}
        try { loc.getWorld().playSound(loc, "item.flintandsteel.use", 0.6, 1.2); } catch (e) {}
        player.sendMessage(GLTC_PREFIX + "§a成功将 §e" + sfId + " §a的外观更换为 §e" + APPEARANCE_NAMES[selectedMatName] + "§a！");
    } catch (e) {
        player.sendMessage(GLTC_PREFIX + "§c更换外观时发生错误: " + e);
    }
}
function refreshAppearanceButtons(inv, selectedMatName) {
    inv.setItem(11, buildAppearanceButton(11, selectedMatName));
    inv.setItem(13, buildAppearanceButton(13, selectedMatName));
    inv.setItem(15, buildAppearanceButton(15, selectedMatName));
}
function registerListeners() {
    if (PLUGIN.gltcGunAppearanceRegistered === true) {
        try {
            InventoryClickEvent.getHandlerList().unregister(PLUGIN.gltcGunAppearanceListener);
            InventoryDragEvent.getHandlerList().unregister(PLUGIN.gltcGunAppearanceListener);
            InventoryCloseEvent.getHandlerList().unregister(PLUGIN.gltcGunAppearanceListener);
        } catch (eUnreg) {}
    }

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    PLUGIN.gltcGunAppearanceListener = listenerInstance;
    PLUGIN.gltcGunAppearanceRegistered = true;
    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            if (event instanceof InventoryCreativeEvent) return;
            var topInv = event.getView().getTopInventory();
            if (!getActiveInventories().contains(topInv)) return;
            var player = event.getWhoClicked();
            if (!(player instanceof Player)) return;
            var clickedInv = event.getClickedInventory();
            var slot = event.getRawSlot();
            if (clickedInv === topInv) {
                if (APPEARANCE_SLOTS.hasOwnProperty(slot)) {
                    event.setCancelled(true);
                    var matName = null;
                    if (slot === 11) matName = "GOLDEN_HOE";
                    else if (slot === 13) matName = "IRON_SWORD";
                    else if (slot === 15) matName = "CROSSBOW";
                    if (matName) {
                        getAppearanceMap().put(topInv, matName);
                        refreshAppearanceButtons(topInv, matName);
                        try { player.playSound(player.getLocation(), "ui.button.click", 0.5, 1.5); } catch (e) {}
                    }
                    return;
                }
                if (slot === CONFIRM_SLOT) {
                    event.setCancelled(true);
                    processChange(player, topInv);
                    return;
                }
                if (slot === GUN_SLOT) {
                    var current = event.getCurrentItem();
                    if (current && current.getType() === Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
                        event.setCancelled(true);
                        var cursor = event.getCursor();
                        if (cursor && cursor.getType() !== Material.AIR) {
                            if (isGun(cursor)) {
                                event.setCurrentItem(cursor.clone());
                                event.getCursor().setAmount(0);
                                try { player.playSound(player.getLocation(), "item.flintandsteel.use", 0.5, 1.2); } catch (e) {}
                            } else {
                                player.sendMessage(GLTC_PREFIX + "§c此处只能放入FKR枪械！");
                            }
                        }
                    } else {
                        event.setCancelled(true);
                        var current2 = event.getCurrentItem();
                        var cursor2 = event.getCursor();
                        if (cursor2 && cursor2.getType() === Material.AIR) {
                            event.setCursor(current2.clone());
                            event.setCurrentItem(GUN_PLACEHOLDER.clone());
                        } else if (isGun(cursor2)) {
                            var tmp = cursor2.clone();
                            event.setCursor(current2.clone());
                            event.setCurrentItem(tmp);
                        } else {
                            player.sendMessage(GLTC_PREFIX + "§c此处只能放入FKR枪械！");
                        }
                    }
                    return;
                }
                event.setCancelled(true);
                return;
            }
            if (event.isShiftClick()) {
                event.setCancelled(true);
                var clicked = event.getCurrentItem();
                if (clicked && clicked.getType() !== Material.AIR && isGun(clicked)) {
                    var gunSlotItem = topInv.getItem(GUN_SLOT);
                    if (!gunSlotItem || gunSlotItem.getType() === Material.AIR || gunSlotItem.getType() === Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
                        topInv.setItem(GUN_SLOT, clicked.clone());
                        event.setCurrentItem(null);
                        try { player.playSound(player.getLocation(), "item.flintandsteel.use", 0.5, 1.2); } catch (e) {}
                    } else {
                        player.sendMessage(GLTC_PREFIX + "§c枪械槽位已被占用！");
                    }
                }
            }
        }, PLUGIN
    );
    Bukkit.getPluginManager().registerEvent(
        InventoryDragEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var topInv = event.getView().getTopInventory();
            if (!getActiveInventories().contains(topInv)) return;
            if (shouldCancelGunDrag(event, topInv)) event.setCancelled(true);
        }, PLUGIN
    );
    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var inv = event.getInventory();
            var activeInventories = getActiveInventories();
            if (!activeInventories.contains(inv)) return;

            var player = event.getPlayer();
            if (player instanceof Player) {
                var gunItem = inv.getItem(GUN_SLOT);
                if (gunItem && gunItem.getType() !== Material.AIR && gunItem.getType() !== Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
                    var leftover = player.getInventory().addItem(gunItem);
                    var dropIt = leftover.values().iterator();
                    while (dropIt.hasNext()) {
                        player.getWorld().dropItemNaturally(player.getLocation(), dropIt.next());
                    }
                    inv.setItem(GUN_SLOT, null);
                }
            }
            activeInventories.remove(inv);
            getAppearanceMap().remove(inv);
        }, PLUGIN
    );
}
function tick(info) {
}
(function scheduleAppearanceListeners() {
    var RunnableImpl = Java.extend(Java.type("java.lang.Runnable"));
    Bukkit.getScheduler().runTask(PLUGIN, new RunnableImpl({
        run: function() {
            registerListeners();
        }
    }));
})();
