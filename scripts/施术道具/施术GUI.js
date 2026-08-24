/**
 * 施术 GUI — 单排箱子界面（工作区.yml）
 * 第 0 格：施术道具技能展示
 * 第 2–7 格：术式承载槽（未解锁 / 未装填 / 已装填 / 已选择）
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var InventoryType = Java.type("org.bukkit.event.inventory.InventoryType");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GUI_TITLE = "§8施术";
var GUI_LISTENER_VER = 1;

var SLOT_SKILL = 0;
var SLOT_SPELL_START = 2;
var SLOT_SPELL_COUNT = 6;

var openGuiMap = new java.util.concurrent.ConcurrentHashMap();

function javaUuid(uuid) {
    return java.lang.String.valueOf(String(uuid));
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

function spellMaterial(spellId, spellCfg) {
    if (spellCfg) {
        try {
            if (typeof spellCfg.getSpellSchool === "function" && typeof spellCfg.getSchoolShulkerMaterial === "function") {
                var school = spellCfg.getSpellSchool(spellId);
                return spellCfg.getSchoolShulkerMaterial(school);
            }
        } catch (e) {}
    }
    return Material.LIME_SHULKER_BOX;
}

function buildSlotItem(state, spellId, slotIndex, selectedIndex, spellCfg) {
    var mat;
    var name;
    var lore = new java.util.ArrayList();
    if (state === "locked") {
        mat = Material.OBSIDIAN;
        name = "§8[未解锁]";
        lore.add("§7此槽位未开放");
    } else if (state === "empty") {
        mat = Material.LIGHT_GRAY_SHULKER_BOX;
        name = "§7[未装填]";
        lore.add("§7可在术式承载转换仪刻录术式");
    } else {
        var spellName = spellId;
        if (spellCfg && typeof spellCfg.getSpellName === "function") {
            spellName = spellCfg.getSpellName(spellId) || spellId;
        }
        var isSel = slotIndex === selectedIndex;
        mat = spellMaterial(spellId, spellCfg);
        name = (isSel ? "§b§l" : "§a") + "[已" + (isSel ? "选择" : "装填") + "] §f" + spellName;
        if (isSel) lore.add("§e当前选中术式");
        else lore.add("§7点击选择此术式");
    }
    var stack = new ItemStack(mat, 1);
    var meta = stack.getItemMeta();
    if (meta) {
        meta.setDisplayName(name);
        meta.setLore(lore);
        if (state === "filled" && slotIndex === selectedIndex) {
            try { meta.addEnchant(org.bukkit.enchantments.Enchantment.UNBREAKING, 1, true); } catch (eEn) {}
            try { meta.addItemFlags(org.bukkit.inventory.ItemFlag.HIDE_ENCHANTS); } catch (eFl) {}
        }
        stack.setItemMeta(meta);
    }
    return stack;
}

function buildSkillSlot(staffHand, hooks) {
    if (staffHand != null && staffHand.getType() !== Material.AIR) {
        var clone = staffHand.clone();
        clone.setAmount(1);
        var meta = clone.getItemMeta();
        if (meta) {
            var lore = meta.hasLore() ? meta.getLore() : new java.util.ArrayList();
            if (lore == null) lore = new java.util.ArrayList();
            lore.add("§8§m----------------");
            lore.add("§x§f§f§f§5§b§3施术道具技能");
            if (hooks && hooks.skillHint) lore.add(String(hooks.skillHint));
            else lore.add("§7蹲下开 GUI 时 / 右键 可触发");
            meta.setLore(lore);
            clone.setItemMeta(meta);
        }
        return clone;
    }
    return pane("§x§f§f§f§5§b§3施术道具技能", Material.STICK);
}

function buildInventory(player, ctx) {
    var inv = Bukkit.createInventory(null, 9, GUI_TITLE);
    var hand = player.getInventory().getItemInMainHand();
    var data = ctx.getStaffMeta(hand);
    if (!data) {
        for (var i = 0; i < 9; i++) inv.setItem(i, pane(" ", Material.BARRIER));
        return inv;
    }
    var hooks = ctx.getStaffHooks ? ctx.getStaffHooks(player) : null;
    inv.setItem(SLOT_SKILL, buildSkillSlot(hand, hooks));
    inv.setItem(1, pane(" ", Material.BLACK_STAINED_GLASS_PANE));
    inv.setItem(8, pane(" ", Material.BLACK_STAINED_GLASS_PANE));

    for (var s = 0; s < SLOT_SPELL_COUNT; s++) {
        var guiSlot = SLOT_SPELL_START + s;
        var state;
        var spellId = "";
        if (s >= data.capacity) state = "locked";
        else if (!data.spells[s]) state = "empty";
        else {
            state = "filled";
            spellId = data.spells[s];
        }
        inv.setItem(guiSlot, buildSlotItem(state, spellId, s, data.selected, ctx.SPELL_CFG));
    }
    return inv;
}

function guiSlotToSpellIndex(rawSlot) {
    if (rawSlot < SLOT_SPELL_START || rawSlot >= SLOT_SPELL_START + SLOT_SPELL_COUNT) return -1;
    return rawSlot - SLOT_SPELL_START;
}

function open(player, ctx) {
    if (!player || !(player instanceof Player)) return false;
    if (!ctx || typeof ctx.getStaffMeta !== "function") return false;
    var hand = player.getInventory().getItemInMainHand();
    var data = ctx.getStaffMeta(hand);
    if (!data) return false;

    if (typeof ctx.scheduleNotifySpellContextChange === "function") {
        ctx.scheduleNotifySpellContextChange(player, "", "gui");
    } else if (typeof ctx.notifySpellContextChange === "function") {
        ctx.notifySpellContextChange(player, "", "gui");
    }

    var inv = buildInventory(player, ctx);
    openGuiMap.put(javaUuid(player.getUniqueId()), java.lang.Boolean.TRUE);
    player.openInventory(inv);
    return true;
}

function scheduleClosePlayerInventory(player) {
    if (!player) return;
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try { if (player.isOnline()) player.closeInventory(); } catch (e) {}
        });
    } catch (eSch) {
        try { player.closeInventory(); } catch (e) {}
    }
}

function scheduleCloseInventory(player) {
    scheduleClosePlayerInventory(player);
}

function handleClick(event, ctx) {
    if (!event.getView || event.getView().getTitle() !== GUI_TITLE) return false;
    event.setCancelled(true);
    var who = event.getWhoClicked();
    if (!(who instanceof Player)) return true;
    if (event.getClickedInventory() == null) return true;
    if (event.getClickedInventory().getType() === InventoryType.PLAYER) return true;

    var raw = event.getRawSlot();
    var spellIndex = guiSlotToSpellIndex(raw);
    if (spellIndex < 0) return true;

    var hand = who.getInventory().getItemInMainHand();
    var data = ctx.getStaffMeta(hand);
    if (!data) {
        scheduleCloseInventory(who);
        return true;
    }
    if (spellIndex >= data.capacity) return true;
    if (!data.spells[spellIndex]) return true;

    if (typeof ctx.setSelectedSpell === "function") {
        ctx.setSelectedSpell(who, spellIndex);
    }
    scheduleCloseInventory(who);
    return true;
}

function registerListeners(ctxProvider) {
    try {
        if (PLUGIN.gltcSpellGuiListener != null
            && Number(PLUGIN.gltcSpellGuiListenerVer) === GUI_LISTENER_VER) return;
    } catch (e0) {}

    try {
        if (PLUGIN.gltcSpellGuiListener != null) {
            try { InventoryClickEvent.getHandlerList().unregister(PLUGIN.gltcSpellGuiListener); } catch (eU0) {}
            try { InventoryCloseEvent.getHandlerList().unregister(PLUGIN.gltcSpellGuiListener); } catch (eU1) {}
        }
    } catch (eU) {}

    var ListenerClass = Java.extend(Listener, {});
    var listener = new ListenerClass();
    PLUGIN.gltcSpellGuiListener = listener;
    PLUGIN.gltcSpellGuiListenerVer = GUI_LISTENER_VER;

    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listener, EventPriority.HIGH,
        function(l, event) {
            try {
                var ctx = ctxProvider();
                if (ctx) handleClick(event, ctx);
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listener, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                if (p != null) openGuiMap.remove(javaUuid(p.getUniqueId()));
            } catch (e2) {}
        }, PLUGIN
    );
}

function isGuiOpen(player) {
    if (!player) return false;
    try {
        if (openGuiMap.containsKey(javaUuid(player.getUniqueId()))) return true;
        return player.getOpenInventory().getTitle() === GUI_TITLE;
    } catch (e) { return false; }
}

({
    GUI_TITLE: GUI_TITLE,
    SLOT_SPELL_START: SLOT_SPELL_START,
    SLOT_SPELL_COUNT: SLOT_SPELL_COUNT,
    open: open,
    handleClick: handleClick,
    buildInventory: buildInventory,
    registerListeners: registerListeners,
    isGuiOpen: isGuiOpen
});
