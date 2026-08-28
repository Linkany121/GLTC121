// ===================================================================
// 枪械选择 GUI — 集成枪蹲下右键打开
// 格位：0–5 枪械 | 6–8 边框
// ===================================================================

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryType = Java.type("org.bukkit.event.inventory.InventoryType");
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

var GUI_TITLE        = "§8枪械选择";
var SLOT_GUN_START   = 0;
var SLOT_GUN_COUNT   = 6;
var SLOT_BORDER_START = 6;
var INV_SIZE         = 9;

var MAT_DIVIDER      = Material.BLACK_STAINED_GLASS_PANE;
var MAT_EMPTY        = Material.GRAY_STAINED_GLASS_PANE;
var MAT_FALLBACK     = Material.IRON_HORSE_ARMOR;

var SND_OPEN         = "block.iron_trapdoor.open";
var SND_OPEN_VOL     = 0.8;
var SND_OPEN_PITCH   = 1.1;
var SND_SELECT       = "block.note_block.pling";
var SND_SELECT_VOL   = 0.9;
var SND_SELECT_PITCH = 1.4;

var openGuiMap = new java.util.concurrent.ConcurrentHashMap();

function javaUuid(uuid) {
    return java.lang.String.valueOf(String(uuid));
}

function playGuiSound(player, sound, vol, pitch) {
    if (!player) return;
    try { player.playSound(player.getLocation(), sound, vol, pitch); } catch (e) {}
}

function pane(name, mat) {
    var stack = new ItemStack(mat || Material.GRAY_STAINED_GLASS_PANE, 1);
    var meta = stack.getItemMeta();
    if (meta) {
        meta.setDisplayName(name || " ");
        try { meta.setLore(java.util.Collections.emptyList()); } catch (e) {}
        stack.setItemMeta(meta);
    }
    return stack;
}

function buildGunSlot(gunId, slotIndex, selectedGunId, metaApi) {
    var sf = null;
    try { sf = SlimefunItem.getById(String(gunId)); } catch (e) {}
    var stack;
    if (sf) {
        stack = sf.getItem().clone();
        stack.setAmount(1);
    } else {
        stack = new ItemStack(MAT_FALLBACK, 1);
    }
    var meta = stack.getItemMeta();
    if (!meta) return stack;
    var dn = metaApi && metaApi.gunDisplayName ? metaApi.gunDisplayName(gunId) : String(gunId);
    var isSel = String(gunId) === String(selectedGunId);
    meta.setDisplayName((isSel ? "§b§l[已选择] " : "§a[可选] ") + dn);
    var lore = new java.util.ArrayList();
    if (isSel) {
        lore.add("§e当前装载枪械");
    } else {
        lore.add("§7点击装载此枪械");
    }
    meta.setLore(lore);
    if (isSel) {
        try { meta.addEnchant(org.bukkit.enchantments.Enchantment.UNBREAKING, 1, true); } catch (eEn) {}
        try { meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_ENCHANTS); } catch (eFl) {}
    }
    stack.setItemMeta(meta);
    return stack;
}

function buildInventory(player, ctx) {
    var inv = Bukkit.createInventory(null, INV_SIZE, GUI_TITLE);
    var hand = player.getInventory().getItemInMainHand();
    var data = ctx.getIntegrationMeta(hand);
    if (!data) {
        for (var i = 0; i < INV_SIZE; i++) inv.setItem(i, pane(" ", Material.BARRIER));
        return inv;
    }
    var guns = ctx.GUN_CFG.listGuns();
    for (var g = 0; g < SLOT_GUN_COUNT; g++) {
        if (g < guns.length) {
            inv.setItem(SLOT_GUN_START + g, buildGunSlot(guns[g].id, g, data.selectedGunId, ctx.META_API));
        } else {
            inv.setItem(SLOT_GUN_START + g, pane("§8空", MAT_EMPTY));
        }
    }
    for (var b = SLOT_BORDER_START; b < INV_SIZE; b++) {
        inv.setItem(b, pane(" ", MAT_DIVIDER));
    }
    return inv;
}

function guiSlotToGunIndex(rawSlot) {
    if (rawSlot < SLOT_GUN_START || rawSlot >= SLOT_GUN_START + SLOT_GUN_COUNT) return -1;
    return rawSlot - SLOT_GUN_START;
}

function open(player, ctx) {
    if (!player || !(player instanceof Player)) return false;
    if (!ctx || typeof ctx.getIntegrationMeta !== "function") return false;
    var hand = player.getInventory().getItemInMainHand();
    if (!ctx.getIntegrationMeta(hand)) return false;
    var inv = buildInventory(player, ctx);
    openGuiMap.put(javaUuid(player.getUniqueId()), java.lang.Boolean.TRUE);
    player.openInventory(inv);
    playGuiSound(player, SND_OPEN, SND_OPEN_VOL, SND_OPEN_PITCH);
    return true;
}

function isOpen(player) {
    if (!player) return false;
    try { return openGuiMap.containsKey(javaUuid(player.getUniqueId())); } catch (e) { return false; }
}

function scheduleClose(player) {
    if (!player) return;
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try { if (player.isOnline()) player.closeInventory(); } catch (e) {}
        });
    } catch (eSch) {
        try { player.closeInventory(); } catch (e) {}
    }
}

function handleClick(event, ctx) {
    if (!event.getView || event.getView().getTitle() !== GUI_TITLE) return false;
    event.setCancelled(true);
    var who = event.getWhoClicked();
    if (!(who instanceof Player)) return true;
    if (event.getClickedInventory() == null) return true;
    if (event.getClickedInventory().getType() === InventoryType.PLAYER) return true;
    var gunIndex = guiSlotToGunIndex(event.getRawSlot());
    if (gunIndex < 0) return true;
    var guns = ctx.GUN_CFG.listGuns();
    if (gunIndex >= guns.length) return true;
    var gunId = guns[gunIndex].id;
    if (typeof ctx.setSelectedGun === "function") ctx.setSelectedGun(who, gunId);
    playGuiSound(who, SND_SELECT, SND_SELECT_VOL, SND_SELECT_PITCH);
    scheduleClose(who);
    return true;
}

function registerListeners(getCtx) {
    try {
        var old = PLUGIN.gltcGunGuiListener;
        if (old != null) {
            try { InventoryClickEvent.getHandlerList().unregister(old); } catch (eU0) {}
            try {
                var InventoryCloseEvent0 = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
                InventoryCloseEvent0.getHandlerList().unregister(old);
            } catch (eU1) {}
        }
    } catch (eOld) {}
    var ListenerClass = Java.extend(Listener, {});
    var listener = new ListenerClass();
    try { PLUGIN.gltcGunGuiListener = listener; } catch (eSet) {}
    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listener, EventPriority.HIGH,
        function(l, event) {
            try {
                var ctx = typeof getCtx === "function" ? getCtx() : getCtx;
                if (!ctx) return;
                handleClick(event, ctx);
            } catch (e) {}
        }, PLUGIN
    );
    var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listener, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                if (p instanceof Player) openGuiMap.remove(javaUuid(p.getUniqueId()));
            } catch (e) {}
        }, PLUGIN
    );
}

return {
    GUI_TITLE: GUI_TITLE,
    open: open,
    isOpen: isOpen,
    registerListeners: registerListeners,
    scheduleClose: scheduleClose
};
