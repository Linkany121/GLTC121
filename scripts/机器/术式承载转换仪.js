/**
 * 术式承载转换仪
 * 交互：左键点背包物品自动放入；左键点菜单槽位卸回背包
 *
 * 布局（3 行 / 27 格，白玻璃填充）：
 *  第二行：
 *    9  提示（附魔台）
 *   10  施术道具槽
 *   12~17 术式载体槽（6）
 *
 * 注意：不 eval 施术核心（避免重复注册监听 / Graal 挂载 JS 对象到 Plugin 失效）
 */

var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Enchantment = Java.type("org.bukkit.enchantments.Enchantment");
var ItemFlag = Java.type("org.bukkit.inventory.ItemFlag");
var Player = Java.type("org.bukkit.entity.Player");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var InventoryDragEvent = Java.type("org.bukkit.event.inventory.InventoryDragEvent");
var ClickType = Java.type("org.bukkit.event.inventory.ClickType");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var GUI_TITLE = null; // 下方 colorize 后赋值
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
var KEY_SPELLS = new NamespacedKey("gltc", "staff_spells");
var KEY_SELECTED = new NamespacedKey("gltc", "staff_selected");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";

var INV_SIZE = 27;
/** 第二行：提示 / 施术道具 / （空）/ 术式槽×6 */
var INFO_SLOT = 9;
var STAFF_SLOT = 10;
var SPELL_SLOTS = [12, 13, 14, 15, 16, 17];

var activeInventories = new java.util.HashSet();
var _listenerRegistered = false;
var SPELL_CFG = null;
var STAFF_CFG = null;

var FILLER;
(function() {
    FILLER = new ItemStack(Material.WHITE_STAINED_GLASS_PANE);
    var meta = FILLER.getItemMeta();
    meta.setDisplayName("§f");
    FILLER.setItemMeta(meta);
})();

var STAFF_PLACEHOLDER;
(function() {
    STAFF_PLACEHOLDER = new ItemStack(Material.OBSIDIAN);
    var meta = STAFF_PLACEHOLDER.getItemMeta();
    meta.setDisplayName("§5§l[ 施术道具槽 ]");
    meta.setLore(java.util.Arrays.asList(
        "§7放入施术道具",
        "§e左键点击将自动置入或取回"
    ));
    STAFF_PLACEHOLDER.setItemMeta(meta);
})();

function findScriptFile(rel) {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + rel),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + rel)
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) {
                    candidates.push(new File(list[i], "scripts/" + rel));
                }
            }
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists()) return candidates[c];
    }
    return null;
}

function evalExport(rel) {
    var file = findScriptFile(rel);
    if (!file) return null;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        return (0, eval)(code);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC转换仪] 加载失败 " + rel + ": " + e);
        return null;
    }
}

function loadApis() {
    if (!SPELL_CFG || typeof SPELL_CFG.getSchoolShulkerMaterial !== "function") {
        SPELL_CFG = evalExport("术式/登记.js");
    }
    if (!STAFF_CFG || !STAFF_CFG.STAFF_REGISTRY) {
        STAFF_CFG = evalExport("施术道具/登记.js");
    }
    return !!(SPELL_CFG && STAFF_CFG && typeof SPELL_CFG.isSpellBook === "function");
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
    try {
        var sf = SoftItemByItem(stack);
        return sf ? sf.getId() : null;
    } catch (e2) {}
    return null;
}

function SoftItemByItem(stack) {
    return SlimefunItem.getByItem(stack);
}

function SoftItemById(id) {
    try { return SlimefunItem.getById(id); } catch (e) { return null; }
}

function toJavaInt(n) {
    var v = Math.floor(Number(n));
    if (!isFinite(v)) v = 0;
    return java.lang.Integer.parseInt(String(v), 10);
}

function isStaff(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    if (stack.getType() === Material.OBSIDIAN) return false;
    var id = getSlimefunId(stack);
    return !!(id && STAFF_CFG && STAFF_CFG.STAFF_REGISTRY && STAFF_CFG.STAFF_REGISTRY[id]);
}

function isStaffPlaceholder(stack) {
    return !stack || stack.getType() === Material.AIR || stack.getType() === Material.OBSIDIAN;
}

function pane(mat, name, loreArr, glow) {
    var item = new ItemStack(mat);
    var meta = item.getItemMeta();
    meta.setDisplayName(name);
    if (loreArr) meta.setLore(java.util.Arrays.asList(loreArr));
    if (glow) {
        try {
            var ench = Enchantment.DURABILITY;
            try { if (Enchantment.UNBREAKING != null) ench = Enchantment.UNBREAKING; } catch (eU) {}
            meta.addEnchant(ench, 1, true);
            meta.addItemFlags(ItemFlag.HIDE_ENCHANTS);
        } catch (eG) {}
    }
    item.setItemMeta(meta);
    return item;
}

function spellLockedPane(index) {
    var mat = Material.OBSIDIAN;
    try {
        if (SPELL_CFG && typeof SPELL_CFG.getLockedSpellShulkerMaterial === "function") {
            mat = SPELL_CFG.getLockedSpellShulkerMaterial();
        }
    } catch (e) {}
    return pane(mat, "§8未解锁 §7#" + (index + 1), [
        "§7施术道具存储等级不足"
    ]);
}

function spellEmptyPane(index) {
    var mat = Material.LIGHT_GRAY_SHULKER_BOX;
    try {
        if (SPELL_CFG && typeof SPELL_CFG.getEmptySpellShulkerMaterial === "function") {
            mat = SPELL_CFG.getEmptySpellShulkerMaterial();
        }
    } catch (e) {}
    return pane(mat, "§5术式槽 §f#" + (index + 1), [
        "§7[ 未装填 ]",
        "§e左键点击背包中术式载体自动刻录",
        "§e左键点击已写入槽可卸下到背包"
    ]);
}

/** 展示板：流派色潜影盒；不是真实术式书，关闭界面不会掉落 */
function spellFilledPane(index, spellId) {
    var name = SPELL_CFG.getSpellName(spellId);
    var school = "";
    try { school = SPELL_CFG.getSpellSchool(spellId) || ""; } catch (e0) {}
    var schoolName = school;
    try {
        if (typeof SPELL_CFG.getSchoolDisplayName === "function") {
            schoolName = SPELL_CFG.getSchoolDisplayName(school);
        }
    } catch (e1) {}
    var mat = Material.LIGHT_GRAY_SHULKER_BOX;
    try {
        if (typeof SPELL_CFG.getSchoolShulkerMaterial === "function") {
            mat = SPELL_CFG.getSchoolShulkerMaterial(school);
        }
    } catch (e2) {}
    return pane(mat, "§b" + name + " §7#" + (index + 1), [
        "§7已刻录施术道具",
        "§7流派：§f" + (schoolName || "未知"),
        "§8ID: §f" + spellId,
        "§e左键点击卸下术式载体到背包"
    ], true);
}

function createCleanSpellBook(spellId) {
    try {
        var sf = SoftItemById(spellId);
        if (!sf) return null;
        var book = sf.getItem().clone();
        book.setAmount(1);
        return book;
    } catch (e) {
        return null;
    }
}

function giveOrDrop(player, item) {
    if (!item || item.getType() === Material.AIR) return;
    var left = player.getInventory().addItem(item);
    var it = left.values().iterator();
    while (it.hasNext()) player.getWorld().dropItemNaturally(player.getLocation(), it.next());
}

function getStaff(inv) {
    var stack = inv.getItem(STAFF_SLOT);
    if (isStaffPlaceholder(stack) || !isStaff(stack)) return null;
    return stack;
}

function readStaffMeta(stack) {
    if (!isStaff(stack)) return null;
    var id = getSlimefunId(stack);
    var entry = STAFF_CFG.getStaffEntry(id);
    if (!entry) return null;
    var cap = STAFF_CFG.clampSlots(entry.spellSlots);
    var meta = stack.getItemMeta();
    if (!meta) return null;
    var pdc = meta.getPersistentDataContainer();
    var spells = [];
    var i;
    var ok = false;
    if (pdc.has(KEY_SPELLS, PersistentDataType.STRING)) {
        try {
            var parsed = JSON.parse(pdc.get(KEY_SPELLS, PersistentDataType.STRING));
            if (parsed && parsed.length != null) {
                for (i = 0; i < cap; i++) spells.push(parsed[i] ? String(parsed[i]) : "");
                ok = (spells.length === cap);
            }
        } catch (e) {}
    }
    if (!ok) {
        spells = [];
        var defaults = entry.defaultSpells || [];
        for (i = 0; i < cap; i++) spells.push(defaults[i] ? String(defaults[i]) : "");
        writeStaffMeta(stack, spells, 0);
    }
    var selected = 0;
    meta = stack.getItemMeta();
    pdc = meta.getPersistentDataContainer();
    if (pdc.has(KEY_SELECTED, PersistentDataType.INTEGER)) {
        try { selected = pdc.get(KEY_SELECTED, PersistentDataType.INTEGER); } catch (e2) { selected = 0; }
    }
    if (selected < 0 || selected >= cap) selected = 0;
    return { staffId: id, capacity: cap, spells: spells, selected: selected };
}

function writeStaffMeta(stack, spells, selected) {
    var meta = stack.getItemMeta();
    if (!meta) return false;
    var pdc = meta.getPersistentDataContainer();
    var arr = [];
    for (var i = 0; i < spells.length; i++) arr.push(spells[i] ? String(spells[i]) : "");
    pdc.set(KEY_SPELLS, PersistentDataType.STRING, JSON.stringify(arr));
    pdc.set(KEY_SELECTED, PersistentDataType.INTEGER, toJavaInt(selected));
    stack.setItemMeta(meta);
    syncStaffSpellLore(stack, arr, arr.length);
    return true;
}

/** &#RRGGBB / &码 → § 序列（与物品 yml 一致） */
function colorize(str) {
    var out = String(str);
    out = out.replace(/&#([0-9a-fA-F]{6})/g, function (full, h) {
        var r = "§x";
        for (var i = 0; i < 6; i++) r += "§" + h.charAt(i);
        return r;
    });
    out = out.replace(/&([0-9a-fk-or])/gi, "§$1");
    return out;
}

GUI_TITLE = colorize("&#c9a0ff术&#b88aff式&#a774ff承&#9660ff载&#8560ff转&#7450ff换&#6340ff仪");

function stripColor(str) {
    return String(str).replace(/§x(§[0-9a-fA-F]){6}/g, "").replace(/§./g, "");
}

var LORE_HEADER_MARK = "已刻录术式";
var LORE_EMPTY_SLOT = colorize("&f[&7未刻录&f]&f");
var LORE_SPELL_HEADER = colorize("&f[&e已刻录术式&f]&#e1ccbd：");

function isSpellSlotLorePlain(plain) {
    if (!plain) return false;
    if (plain.indexOf("未刻录") >= 0) return true;
    if (plain.indexOf("已刻录术式") >= 0) return false;
    return /^\s*\[[^\]]+\]\s*$/.test(plain);
}

/** 从术式书 lore 抽出带色术式名；失败则纯名 */
function spellSlotLoreLine(spellId) {
    if (!spellId) return LORE_EMPTY_SLOT;
    try {
        var sf = SoftItemById(spellId);
        if (sf) {
            var book = sf.getItem();
            var bm = book.getItemMeta();
            if (bm && bm.hasLore()) {
                var bl = bm.getLore();
                for (var i = 0; i < bl.size(); i++) {
                    var line = String(bl.get(i));
                    if (stripColor(line).indexOf("[术式]") < 0) continue;
                    var rb = line.lastIndexOf("]");
                    if (rb >= 0 && rb < line.length - 1) {
                        return colorize("&f[") + line.substring(rb + 1) + colorize("&f]");
                    }
                }
            }
        }
    } catch (e) {}
    var name = "未知";
    try { if (SPELL_CFG) name = SPELL_CFG.getSpellName(spellId) || spellId; } catch (e2) { name = String(spellId); }
    return colorize("&f[&b" + name + "&f]");
}

/**
 * 参照辉墨摇篮：在 lore「已刻录术式」标题下写入与槽位数量一致的行。
 * 无该段时自动追加到 lore 末尾。
 */
function syncStaffSpellLore(stack, spells, capacity) {
    if (!stack || capacity <= 0) return;
    var meta = stack.getItemMeta();
    if (!meta) return;

    var old = meta.hasLore() ? meta.getLore() : null;
    var before = new java.util.ArrayList();
    var after = new java.util.ArrayList();
    var phase = 0; // 0 标题前 · 1 跳过旧槽位行 · 2 标题段之后
    var skipped = 0;

    if (old != null) {
        for (var i = 0; i < old.size(); i++) {
            var raw = old.get(i);
            var plain = stripColor(String(raw));
            if (phase === 0) {
                if (plain.indexOf(LORE_HEADER_MARK) >= 0) {
                    phase = 1;
                    skipped = 0;
                    continue;
                }
                before.add(raw);
            } else if (phase === 1) {
                if (skipped < capacity && isSpellSlotLorePlain(plain)) {
                    skipped++;
                    continue;
                }
                phase = 2;
                after.add(raw);
            } else {
                after.add(raw);
            }
        }
    }

    var rebuilt = new java.util.ArrayList();
    var a;
    for (a = 0; a < before.size(); a++) rebuilt.add(before.get(a));
    rebuilt.add(LORE_SPELL_HEADER);
    for (var c = 0; c < capacity; c++) rebuilt.add(spellSlotLoreLine(spells[c] || ""));
    for (a = 0; a < after.size(); a++) rebuilt.add(after.get(a));

    meta.setLore(rebuilt);
    stack.setItemMeta(meta);
}

function refreshGui(inv) {
    var staff = getStaff(inv);
    if (!staff) {
        inv.setItem(STAFF_SLOT, STAFF_PLACEHOLDER.clone());
        for (var i = 0; i < SPELL_SLOTS.length; i++) {
            inv.setItem(SPELL_SLOTS[i], spellLockedPane(i));
        }
        inv.setItem(INFO_SLOT, pane(Material.ENCHANTING_TABLE, colorize("&#c9a0ff术&#b88aff式&#a774ff承&#9660ff载&#8560ff转&#7450ff换&#6340ff仪"), [
            "§71. 左键点击背包中施术道具自动放入",
            "§72. 左键点击背包中术式书自动写入空槽",
            "§73. 左键点击菜单中槽位卸回背包",
            "§74. 关闭界面自动归还施术道具"
        ]));
        return;
    }

    var data = readStaffMeta(staff);
    if (data) {
        syncStaffSpellLore(staff, data.spells, data.capacity);
    }
    inv.setItem(STAFF_SLOT, staff);
    var cap = data ? data.capacity : 0;
    var spells = data ? data.spells : [];
    var filled = 0;
    for (var s = 0; s < SPELL_SLOTS.length; s++) {
        if (s >= cap) {
            inv.setItem(SPELL_SLOTS[s], spellLockedPane(s));
            continue;
        }
        if (spells[s]) {
            filled++;
            inv.setItem(SPELL_SLOTS[s], spellFilledPane(s, spells[s]));
        } else {
            inv.setItem(SPELL_SLOTS[s], spellEmptyPane(s));
        }
    }
    inv.setItem(INFO_SLOT, pane(Material.ENCHANTING_TABLE, colorize("&#c9a0ff术&#b88aff式&#a774ff承&#9660ff载&#8560ff转&#7450ff换&#6340ff仪"), [
        "§7存储：§f" + filled + "§7/§f" + cap,
        "§8关闭后施术道具回到背包",
        "§e左键背包物品自动放入 · 左键槽位卸回"
    ]));
}

function spellIndex(raw) {
    for (var i = 0; i < SPELL_SLOTS.length; i++) {
        if (SPELL_SLOTS[i] === raw) return i;
    }
    return -1;
}

function clearCursor(event) {
    try { event.setCursor(null); } catch (e) {
        try {
            var c = event.getCursor();
            if (c) c.setAmount(0);
        } catch (e2) {}
    }
}

function takeOneFromInventorySlot(inv, slot) {
    var stack = inv.getItem(slot);
    if (!stack || stack.getType() === Material.AIR) return null;
    var one = stack.clone();
    one.setAmount(1);
    if (stack.getAmount() <= 1) inv.setItem(slot, null);
    else {
        stack.setAmount(stack.getAmount() - 1);
        inv.setItem(slot, stack);
    }
    return one;
}

function findEmptySpellSlot(data) {
    if (!data) return -1;
    for (var i = 0; i < data.capacity; i++) {
        if (!data.spells[i]) return i;
    }
    return -1;
}

function unequipStaffToInv(player, topInv) {
    var current = topInv.getItem(STAFF_SLOT);
    if (isStaffPlaceholder(current) || !isStaff(current)) return;
    giveOrDrop(player, current.clone());
    topInv.setItem(STAFF_SLOT, STAFF_PLACEHOLDER.clone());
    refreshGui(topInv);
    player.sendMessage(GLTC_PREFIX + "§e已取回施术道具");
}

function placeStaffFromInv(player, topInv, bottom, slot) {
    var stack = bottom.getItem(slot);
    if (!isStaff(stack)) return false;
    var one = takeOneFromInventorySlot(bottom, slot);
    if (!one) return false;
    readStaffMeta(one);
    var current = topInv.getItem(STAFF_SLOT);
    if (current && isStaff(current)) {
        giveOrDrop(player, current.clone());
        player.sendMessage(GLTC_PREFIX + "§a已更换施术道具");
    } else {
        player.sendMessage(GLTC_PREFIX + "§a已放入施术道具");
    }
    topInv.setItem(STAFF_SLOT, one);
    refreshGui(topInv);
    try { player.playSound(player.getLocation(), "item.flintandsteel.use", 0.5, 1.2); } catch (e) {}
    return true;
}

function unequipSpellToInv(player, topInv, idx) {
    var staff = getStaff(topInv);
    if (!staff) {
        player.sendMessage(GLTC_PREFIX + "§c请先放入施术道具。");
        return;
    }
    var data = readStaffMeta(staff);
    if (!data || idx >= data.capacity) {
        player.sendMessage(GLTC_PREFIX + "§c该槽位未解锁。");
        return;
    }
    var spells = [];
    for (var si = 0; si < data.capacity; si++) spells.push(data.spells[si] || "");
    if (!spells[idx]) return;
    var takeId = spells[idx];
    spells[idx] = "";
    writeStaffMeta(staff, spells, data.selected || 0);
    topInv.setItem(STAFF_SLOT, staff);
    var out = createCleanSpellBook(takeId);
    if (out) giveOrDrop(player, out);
    refreshGui(topInv);
    player.sendMessage(GLTC_PREFIX + "§e已卸下：§b" + SPELL_CFG.getSpellName(takeId));
}

function placeSpellFromInv(player, topInv, bottom, slot) {
    var stack = bottom.getItem(slot);
    if (!stack || stack.getType() === Material.AIR) return false;
    var bookId = getSlimefunId(stack);
    if (!SPELL_CFG.isSpellBook(bookId)) return false;

    var staff = getStaff(topInv);
    if (!staff) {
        player.sendMessage(GLTC_PREFIX + "§c请先放入施术道具。");
        return true;
    }
    var data = readStaffMeta(staff);
    if (!data || data.capacity <= 0) {
        player.sendMessage(GLTC_PREFIX + "§c该施术道具没有可用术式槽。");
        return true;
    }
    var idx = findEmptySpellSlot(data);
    if (idx < 0) {
        player.sendMessage(GLTC_PREFIX + "§c没有空闲术式槽。");
        return true;
    }
    var newSpell = SPELL_CFG.getSpellIdFromBook(bookId);
    if (!newSpell) {
        player.sendMessage(GLTC_PREFIX + "§c无法识别该术式书。");
        return true;
    }
    if (!takeOneFromInventorySlot(bottom, slot)) return true;

    var spells = [];
    for (var si = 0; si < data.capacity; si++) spells.push(data.spells[si] || "");
    spells[idx] = newSpell;
    writeStaffMeta(staff, spells, data.selected || 0);
    topInv.setItem(STAFF_SLOT, staff);
    refreshGui(topInv);
    player.sendMessage(GLTC_PREFIX + "§a已写入：§b" + SPELL_CFG.getSpellName(newSpell));
    try { player.playSound(player.getLocation(), "block.enchantment_table.use", 0.7, 1.2); } catch (e) {}
    return true;
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;
    if (!loadApis()) {
        player.sendMessage(GLTC_PREFIX + "§c施术登记未加载，无法打开转换仪。");
        return;
    }

    var inv = Bukkit.createInventory(null, INV_SIZE, GUI_TITLE);
    for (var i = 0; i < INV_SIZE; i++) inv.setItem(i, FILLER.clone());
    refreshGui(inv);
    activeInventories.add(inv);
    player.openInventory(inv);
}

function registerListeners() {
    if (_listenerRegistered) return;
    _listenerRegistered = true;

    try {
        if (PLUGIN.gltcSpellConverterListener != null) {
            try { InventoryClickEvent.getHandlerList().unregister(PLUGIN.gltcSpellConverterListener); } catch (e0) {}
            try { InventoryDragEvent.getHandlerList().unregister(PLUGIN.gltcSpellConverterListener); } catch (e1) {}
            try { InventoryCloseEvent.getHandlerList().unregister(PLUGIN.gltcSpellConverterListener); } catch (e2) {}
        }
    } catch (e) {}

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    try { PLUGIN.gltcSpellConverterListener = listenerInstance; } catch (e3) {}

    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listenerInstance, EventPriority.HIGH,
        function(l, event) {
            var topInv = event.getView().getTopInventory();
            if (!activeInventories.contains(topInv)) return;

            var player = event.getWhoClicked();
            if (!(player instanceof Player)) return;
            if (!loadApis()) {
                event.setCancelled(true);
                return;
            }

            var clickedInv = event.getClickedInventory();
            var slot = event.getRawSlot();
            var click = event.getClick();

            // 菜单槽：仅左键卸下到背包
            if (clickedInv === topInv) {
                event.setCancelled(true);
                if (click !== ClickType.LEFT) return;
                if (slot === STAFF_SLOT) {
                    unequipStaffToInv(player, topInv);
                    return;
                }
                var idx = spellIndex(slot);
                if (idx >= 0) unequipSpellToInv(player, topInv, idx);
                return;
            }

            // 背包：左键施术道具/术式书 → 自动放入
            if (clickedInv != null) {
                var cur = event.getCurrentItem();
                if (cur && cur.getType() !== Material.AIR) {
                    var sfId = getSlimefunId(cur);
                    if (isStaff(cur) || SPELL_CFG.isSpellBook(sfId)) {
                        event.setCancelled(true);
                        if (click !== ClickType.LEFT) return;
                        if (isStaff(cur)) placeStaffFromInv(player, topInv, clickedInv, event.getSlot());
                        else placeSpellFromInv(player, topInv, clickedInv, event.getSlot());
                        return;
                    }
                }
                if (event.isShiftClick()) event.setCancelled(true);
            }
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryDragEvent, listenerInstance, EventPriority.HIGH,
        function(l, event) {
            if (!activeInventories.contains(event.getInventory())) return;
            event.setCancelled(true);
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var inv = event.getInventory();
            if (!activeInventories.contains(inv)) return;

            var player = event.getPlayer();
            if (player instanceof Player) {
                var staff = getStaff(inv);
                if (staff) {
                    giveOrDrop(player, staff.clone());
                    inv.setItem(STAFF_SLOT, null);
                }
            }
            for (var i = 0; i < SPELL_SLOTS.length; i++) inv.setItem(SPELL_SLOTS[i], null);
            inv.setItem(INFO_SLOT, null);
            activeInventories.remove(inv);
        }, PLUGIN
    );
}

function tick(info) {}
loadApis();
registerListeners();
