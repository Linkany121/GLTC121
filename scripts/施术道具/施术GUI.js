// ===================================================================
// 施术 GUI v2 — 单排箱子（工作区规范）
// 格位：0 道具技能 | 1 分隔 | 2–7 术式槽 | 8 边框
// 术式显示名：items.yml name 去「术式载体」前缀（保留颜色）
// ===================================================================

// === Java 类型导入 ===
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

// === GUI 布局（可调）===
var GUI_TITLE         = "§8施术";           // 箱子标题（须与点击判定一致）
var SLOT_SKILL        = 0;                  // 道具技能格
var SLOT_DIVIDER      = 1;                  // 左分隔黑玻璃
var SLOT_SPELL_START  = 2;                  // 术式槽起始
var SLOT_SPELL_COUNT  = 6;                  // 术式槽数量（= 最大刻录上限）
var SLOT_BORDER_END   = 8;                  // 右边框黑玻璃
var INV_SIZE          = 9;                  // 单排

// === 占位材质 ===
var MAT_LOCKED        = Material.OBSIDIAN;              // 未解锁
var MAT_EMPTY         = Material.LIGHT_GRAY_SHULKER_BOX;// 未装填
var MAT_DIVIDER       = Material.BLACK_STAINED_GLASS_PANE;
var MAT_FALLBACK_SPELL = Material.LIME_SHULKER_BOX;     // 流派色不可用时
var MAT_SKILL_FALLBACK = Material.STICK;                // 无法克隆法杖时
var MAT_ERROR         = Material.BARRIER;               // 异常填充

// === GUI 音效 ===
var SND_OPEN          = "block.end_portal_frame.fill"; // 打开施术界面
var SND_OPEN_VOL      = 0.75;
var SND_OPEN_PITCH    = 1.15;
var SND_SELECT        = "block.note_block.bell";        // 选定术式
var SND_SELECT_VOL    = 0.85;
var SND_SELECT_PITCH  = 1.35;

var openGuiMap = new java.util.concurrent.ConcurrentHashMap();
// 热重载靠 PLUGIN.gltcSpellGuiListener 卸载，不再依赖模块级 flag 防重入
var _listenerRegistered = false;

function javaUuid(uuid) {
    return java.lang.String.valueOf(String(uuid));
}

function playGuiSound(player, sound, vol, pitch) {
    if (!player) return;
    try { player.playSound(player.getLocation(), sound, vol, pitch); } catch (e) {}
}

function stripColor(str) {
    return String(str).replace(/§x(§[0-9a-fA-F]){6}/g, "").replace(/§./g, "");
}

function skipColorIndex(s, i) {
    if (i >= s.length || s.charAt(i) !== "§") return i;
    if (i + 1 < s.length && (s.charAt(i + 1) === "x" || s.charAt(i + 1) === "X")) {
        return Math.min(s.length, i + 14);
    }
    return Math.min(s.length, i + 2);
}

/** items.yml name 去「术式载体 丨」/「施术技能核心」前缀，保留颜色 */
function shortItemDisplayName(coloredDn) {
    var dn = String(coloredDn || "");
    if (!dn) return "";
    var sepIdx = dn.indexOf("丨");
    if (sepIdx < 0) sepIdx = dn.indexOf("|");
    if (sepIdx >= 0) {
        return dn.substring(sepIdx + 1).replace(/^\s+/, "");
    }
    var plain = stripColor(dn);
    var prefixes = ["施术技能核心", "术式载体"];
    for (var p = 0; p < prefixes.length; p++) {
        var pref = prefixes[p];
        var at = plain.indexOf(pref);
        if (at < 0) continue;
        var need = at + pref.length;
        var ci = 0;
        var pc = 0;
        while (ci < dn.length && pc < need) {
            if (dn.charAt(ci) === "§") {
                ci = skipColorIndex(dn, ci);
                continue;
            }
            pc++;
            ci++;
        }
        return dn.substring(ci).replace(/^\s+/, "");
    }
    return dn;
}

function spellDisplayName(spellId, spellCfg) {
    try {
        var sf = SlimefunItem.getById(String(spellId));
        if (sf) {
            var meta = sf.getItem().getItemMeta();
            if (meta && meta.hasDisplayName()) {
                var short = shortItemDisplayName(String(meta.getDisplayName()));
                if (short && stripColor(short).length > 0) return short;
            }
        }
    } catch (e) {}
    if (spellCfg && typeof spellCfg.getSpellName === "function") {
        try {
            var fb = spellCfg.getSpellName(spellId);
            if (fb) return String(fb);
        } catch (e2) {}
    }
    return spellId ? String(spellId) : "";
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
                return spellCfg.getSchoolShulkerMaterial(spellCfg.getSpellSchool(spellId));
            }
        } catch (e) {}
    }
    return MAT_FALLBACK_SPELL;
}

function buildSlotItem(state, spellId, slotIndex, selectedIndex, spellCfg) {
    var mat, name;
    var lore = new java.util.ArrayList();
    if (state === "locked") {
        mat = MAT_LOCKED;
        name = "§8[未解锁]";
        lore.add("§7未嵌入技能核心时无法刻录");
        lore.add("§7可在术式承载转换仪嵌入核心后提升");
    } else if (state === "empty") {
        mat = MAT_EMPTY;
        name = "§7[未装填]";
        lore.add("§7槽位已解锁，但尚未刻录术式");
        lore.add("§7可在术式承载转换仪刻录术式载体");
    } else {
        var spellName = spellDisplayName(spellId, spellCfg);
        var isSel = slotIndex === selectedIndex;
        mat = spellMaterial(spellId, spellCfg);
        name = (isSel ? "§b§l[已选择] " : "§a[已装填] ") + spellName;
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
            lore.add("§x§f§f§f§5§b§3核心提供技能");
            if (hooks && hooks.skillHint) lore.add(String(hooks.skillHint));
            else lore.add("§7选择术式时可触发核心特效");
            meta.setLore(lore);
            clone.setItemMeta(meta);
        }
        return clone;
    }
    return pane("§x§f§f§f§5§b§3核心提供技能", MAT_SKILL_FALLBACK);
}

function buildInventory(player, ctx) {
    var inv = Bukkit.createInventory(null, INV_SIZE, GUI_TITLE);
    var hand = player.getInventory().getItemInMainHand();
    var data = ctx.getStaffMeta(hand);
    if (!data) {
        for (var i = 0; i < INV_SIZE; i++) inv.setItem(i, pane(" ", MAT_ERROR));
        return inv;
    }
    var hooks = ctx.getStaffHooks ? ctx.getStaffHooks(player) : null;
    inv.setItem(SLOT_SKILL, buildSkillSlot(hand, hooks));
    inv.setItem(SLOT_DIVIDER, pane(" ", MAT_DIVIDER));
    inv.setItem(SLOT_BORDER_END, pane(" ", MAT_DIVIDER));
    for (var s = 0; s < SLOT_SPELL_COUNT; s++) {
        var guiSlot = SLOT_SPELL_START + s;
        var state, spellId = "";
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
    if (!ctx.getStaffMeta(hand)) return false;
    if (typeof ctx.onGuiOpen === "function") ctx.onGuiOpen(player);
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
    var spellIndex = guiSlotToSpellIndex(event.getRawSlot());
    if (spellIndex < 0) return true;
    var hand = who.getInventory().getItemInMainHand();
    var data = ctx.getStaffMeta(hand);
    if (!data) {
        scheduleClose(who);
        return true;
    }
    if (spellIndex >= data.capacity || !data.spells[spellIndex]) return true;
    if (typeof ctx.setSelectedSpell === "function") ctx.setSelectedSpell(who, spellIndex);
    playGuiSound(who, SND_SELECT, SND_SELECT_VOL, SND_SELECT_PITCH);
    scheduleClose(who);
    return true;
}

function registerListeners(getCtx) {
    // 热重载安全：先卸旧监听（模块级 _listenerRegistered 会被清缓存重置）
    try {
        var old = PLUGIN.gltcSpellGuiListener;
        if (old != null) {
            try { InventoryClickEvent.getHandlerList().unregister(old); } catch (eU0) {}
            try {
                var InventoryCloseEvent0 = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
                InventoryCloseEvent0.getHandlerList().unregister(old);
            } catch (eU1) {}
        }
    } catch (eOld) {}
    _listenerRegistered = true;
    var ListenerClass = Java.extend(Listener, {});
    var listener = new ListenerClass();
    try { PLUGIN.gltcSpellGuiListener = listener; } catch (eSet) {}
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

({
    GUI_TITLE: GUI_TITLE,
    open: open,
    isOpen: isOpen,
    registerListeners: registerListeners,
    scheduleClose: scheduleClose
});
