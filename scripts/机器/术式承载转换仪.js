// ===================================================================
// 术式承载转换仪 v2 — 刻录 / 镶嵌 GUI（machines.yml script）
// 单排：0 法杖 | 1 技能核心 | 2 黑玻璃 | 3–8 术式槽
// 背包左/右键自动放入；核心/术式显示名为 items.yml 去前缀彩名
// ===================================================================

// === Java 类型导入 ===
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
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

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var STAFF_META = null;
var KEY_SPELLS = null;
var KEY_SELECTED = null;
var PersistentDataType = null;
var NamespacedKey = null;
var KEY_GUI_PLACEHOLDER = null;
try { PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType"); } catch (ePdc) {}
try {
    NamespacedKey = Java.type("org.bukkit.NamespacedKey");
    KEY_GUI_PLACEHOLDER = new NamespacedKey("gltc", "engraving_placeholder");
} catch (eKey) {}

// === 播报 / 法杖显示名 ===
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var STAFF_LABEL = "§x§7§4§c§5§f§fN§x§7§a§b§1§f§fT§x§8§0§9§c§f§fC§x§8§7§8§8§f§f外§x§8§d§7§3§f§f置§x§9§7§6§9§f§f粒§x§a§5§6§a§f§f子§x§b§4§6§b§f§f控§x§c§2§6§c§f§f制§x§d§0§6§d§f§f仪";

// === GUI 布局（可调，改后须同步 refresh / 点击判定）===
var STAFF_SLOT   = 0;                    // 法杖格
var CORE_SLOT    = 1;                    // 技能核心格
var SPELL_SLOTS  = [3, 4, 5, 6, 7, 8];   // 术式槽 rawSlot
var FILLER_SLOTS = [2];                  // 黑玻璃间隔
var INV_SIZE     = 9;                    // 单排
var GUI_TITLE    = "§x§c§9§a§0§f§f术§x§b§8§8§a§f§f式§x§a§7§7§4§f§f承§x§9§6§6§0§f§f载§x§8§5§6§0§f§f转§x§7§4§5§0§f§f换§x§6§3§4§0§f§f仪";

// === 空槽占位材质 ===
var MAT_STAFF_EMPTY = Material.WOODEN_SWORD; // 空法杖占位
var MAT_CORE_EMPTY  = Material.GRAY_WOOL;    // 空核心占位
var MAT_FILLER      = Material.BLACK_STAINED_GLASS_PANE;
var MAT_SPELL_LOCKED = Material.OBSIDIAN;
var MAT_SPELL_EMPTY  = Material.LIGHT_GRAY_SHULKER_BOX;

// === GUI 音效 ===
var SND_OPEN         = "block.end_portal_frame.fill"; // 打开刻录界面
var SND_OPEN_VOL     = 0.75;
var SND_OPEN_PITCH   = 1.05;
var SND_CLICK        = "block.note_block.bell";        // 置入/取回/嵌入
var SND_CLICK_VOL    = 0.8;
var SND_CLICK_PITCH  = 1.25;
var SND_ENGRAVE      = "block.end_portal_frame.fill"; // 刻录术式成功
var SND_ENGRAVE_VOL  = 0.9;
var SND_ENGRAVE_PITCH = 0.95;

function playGuiSound(player, sound, vol, pitch) {
    if (!player) return;
    try { player.playSound(player.getLocation(), sound, vol, pitch); } catch (e) {}
}

function ensureStaffMetaApi() {
    if (STAFF_META != null) return STAFF_META;
    STAFF_META = evalExport("施术道具/_staffMeta.js");
    if (STAFF_META) {
        KEY_SPELLS = STAFF_META.KEY_SPELLS;
        KEY_SELECTED = STAFF_META.KEY_SELECTED;
    }
    return STAFF_META;
}

/** 取消点击事件后改背包必须延后 1 tick，否则 Paper 会回滚导致吞物品 */
function runNextTick(fn) {
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try { fn(); } catch (eRun) {
                Bukkit.getLogger().warning("[GLTC刻录仪] 延后任务异常: " + eRun);
            }
        });
    } catch (e0) {
        try { fn(); } catch (e1) {}
    }
}

function markPlaceholder(stack) {
    if (!stack || !KEY_GUI_PLACEHOLDER || !PersistentDataType) return stack;
    try {
        var m = stack.getItemMeta();
        if (!m) return stack;
        m.getPersistentDataContainer().set(KEY_GUI_PLACEHOLDER, PersistentDataType.BYTE, java.lang.Byte.valueOf(1));
        stack.setItemMeta(m);
    } catch (e) {}
    return stack;
}

function hasPlaceholderMark(stack) {
    if (!stack || !KEY_GUI_PLACEHOLDER || !PersistentDataType) return false;
    try {
        var m = stack.getItemMeta();
        if (!m) return false;
        return m.getPersistentDataContainer().has(KEY_GUI_PLACEHOLDER, PersistentDataType.BYTE);
    } catch (e) { return false; }
}

var activeInventories = new java.util.HashSet();
var _listenerRegistered = false;
var SPELL_CFG = null;
var STAFF_CFG = null;
var SKILL_CORE_CFG = null;

var FILLER = (function() {
    var s = new ItemStack(MAT_FILLER);
    var m = s.getItemMeta();
    m.setDisplayName("§0");
    s.setItemMeta(m);
    return s;
})();

var STAFF_PLACEHOLDER = (function() {
    var s = new ItemStack(MAT_STAFF_EMPTY);
    var m = s.getItemMeta();
    m.setDisplayName("§6§l" + STAFF_LABEL);
    m.setLore(java.util.Arrays.asList(
        "§7待放入 " + STAFF_LABEL,
        "§e点击左/右键自动放入或取回"
    ));
    s.setItemMeta(m);
    return markPlaceholder(s);
})();

var CORE_PLACEHOLDER = (function() {
    var s = new ItemStack(MAT_CORE_EMPTY);
    var m = s.getItemMeta();
    m.setDisplayName("§7§l[ 施术技能核心 ]");
    m.setLore(java.util.Arrays.asList(
        "§7嵌入后解锁可刻录术式位置与核心技能",
        "§e点击左/右键自动放入或取回"
    ));
    s.setItemMeta(m);
    return markPlaceholder(s);
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
                for (var i = 0; i < list.length; i++) candidates.push(new File(list[i], "scripts/" + rel));
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
    // 与全局缓存共用，避免重复加载术式登记刷屏
    try {
        var cache = PLUGIN.gltcEvalCache;
        if (cache == null) {
            cache = new java.util.concurrent.ConcurrentHashMap();
            PLUGIN.gltcEvalCache = cache;
        }
        var hit = cache.get(String(rel).replace(/\\/g, "/"));
        if (hit != null) return hit;
    } catch (eC) {}
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        var body = String(code).replace(/\s+$/, "");
        if (!/\breturn\s+/.test(body.slice(-80))) {
            if (/\(\s*\{[\s\S]*\}\s*\)\s*;?\s*$/.test(body)) {
                body = body.replace(/\(\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/, "return ({\n$1\n});");
            } else if (/(?:^|[\n;])\s*([A-Za-z_$][\w$]*)\s*;\s*$/.test(body)) {
                body = body.replace(/([A-Za-z_$][\w$]*)\s*;\s*$/, "return $1;");
            }
        }
        var result = (0, eval)("(function(){\n" + body + "\n})();");
        if (result != null) {
            try { PLUGIN.gltcEvalCache.put(String(rel).replace(/\\/g, "/"), result); } catch (eP) {}
        }
        return result;
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC刻录仪] 加载失败 " + rel + ": " + e);
        return null;
    }
}

function loadApis() {
    if (!STAFF_CFG) STAFF_CFG = evalExport("施术道具/登记.js");
    if (!SPELL_CFG) SPELL_CFG = evalExport("术式/登记.js");
    if (!SKILL_CORE_CFG) SKILL_CORE_CFG = evalExport("施术道具/技能核心登记.js");
    ensureStaffMetaApi();
    var ok = !!(SPELL_CFG && STAFF_CFG && SKILL_CORE_CFG && STAFF_META
        && typeof SPELL_CFG.isSpellBook === "function"
        && typeof STAFF_META.readStaffMeta === "function");
    if (!ok) {
        try {
            if (!PLUGIN.gltcEngraveApiWarned) {
                PLUGIN.gltcEngraveApiWarned = true;
                Bukkit.getLogger().warning("[GLTC刻录仪] API未就绪"
                    + " staff=" + !!STAFF_CFG
                    + " spell=" + !!SPELL_CFG
                    + " spellBook=" + !!(SPELL_CFG && typeof SPELL_CFG.isSpellBook === "function")
                    + " core=" + !!SKILL_CORE_CFG
                    + " meta=" + !!(STAFF_META && typeof STAFF_META.readStaffMeta === "function"));
            }
        } catch (eW) {}
    }
    return ok;
}

function getSlimefunId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var sf = SoftItemByItem(stack);
        return sf != null ? String(sf.getId()) : null;
    } catch (e) { return null; }
}

function SoftItemByItem(stack) {
    try { return SlimefunItem.getByItem(stack); } catch (e) { return null; }
}

function SoftItemById(id) {
    try { return SlimefunItem.getById(String(id)); } catch (e) { return null; }
}

function toJavaInt(n) {
    ensureStaffMetaApi();
    if (STAFF_META && STAFF_META.toJavaInt) return STAFF_META.toJavaInt(n);
    return java.lang.Integer.parseInt(String(Math.floor(Number(n) || 0)), 10);
}

function isStaff(stack) {
    if (!loadApis()) return false;
    var id = getSlimefunId(stack);
    return !!(id && STAFF_CFG.STAFF_REGISTRY[id]);
}

function isSkillCore(stack) {
    if (!loadApis() || !stack || stack.getType() === Material.AIR) return false;
    var id = getSlimefunId(stack);
    return !!(id && SKILL_CORE_CFG.isSkillCoreItem && SKILL_CORE_CFG.isSkillCoreItem(id));
}

function isCorePlaceholder(stack) {
    if (!stack || stack.getType() === Material.AIR) return true;
    if (isSkillCore(stack)) return false;
    if (hasPlaceholderMark(stack)) return true;
    return stack.getType() === MAT_CORE_EMPTY;
}

function isStaffPlaceholder(stack) {
    if (!stack || stack.getType() === Material.AIR) return true;
    // 真法杖绝不当占位符（避免误判吞物品）
    if (isStaff(stack)) return false;
    if (hasPlaceholderMark(stack)) return true;
    return stack.getType() === MAT_STAFF_EMPTY;
}

/** 术式载体：登记 book:true，或 items.yml 流派色潜影盒（名称含「术式载体」） */
function isSpellCarrier(stack) {
    if (!loadApis() || !stack || stack.getType() === Material.AIR) return false;
    var id = getSlimefunId(stack);
    if (!id || STAFF_CFG.STAFF_REGISTRY[id]) return false;
    if (SPELL_CFG.isSpellBook(id)) return true;
    try {
        var t = String(stack.getType().name());
        if (t.indexOf("SHULKER_BOX") < 0) return false;
        var meta = stack.getItemMeta();
        if (meta && meta.hasDisplayName()) {
            var dn = stripColor(String(meta.getDisplayName()));
            if (dn.indexOf("术式载体") >= 0) return true;
        }
        if (meta && meta.hasLore()) {
            var lore = meta.getLore();
            for (var i = 0; i < lore.size(); i++) {
                if (stripColor(String(lore.get(i))).indexOf("术式承载转换仪") >= 0) return true;
            }
        }
    } catch (e) {}
    return false;
}

function skipColorIndex(s, i) {
    if (i >= s.length || s.charAt(i) !== "§") return i;
    if (i + 1 < s.length && (s.charAt(i + 1) === "x" || s.charAt(i + 1) === "X")) {
        return Math.min(s.length, i + 14);
    }
    return Math.min(s.length, i + 2);
}

/**
 * items.yml 显示名去前缀：
 * - 「术式载体 丨 xxx」→ xxx（保留颜色）
 * - 「施术技能核心 xxx」→ xxx（保留颜色）
 */
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

function sfShortDisplay(itemId, fallback) {
    try {
        var sf = SoftItemById(itemId);
        if (sf) {
            var meta = sf.getItem().getItemMeta();
            if (meta && meta.hasDisplayName()) {
                var short = shortItemDisplayName(String(meta.getDisplayName()));
                if (short && stripColor(short).length > 0) return short;
            }
        }
    } catch (e) {}
    if (fallback != null && String(fallback).length) return String(fallback);
    return itemId ? String(itemId) : "";
}

function coreDisplayName(coreId) {
    var fb = coreId;
    try {
        if (SKILL_CORE_CFG && SKILL_CORE_CFG.getCoreName) fb = SKILL_CORE_CFG.getCoreName(coreId);
    } catch (e) {}
    return sfShortDisplay(coreId, fb);
}

function spellDisplayName(spellId) {
    var fb = spellId;
    try {
        if (SPELL_CFG && SPELL_CFG.getSpellName) fb = SPELL_CFG.getSpellName(spellId);
    } catch (e) {}
    return sfShortDisplay(spellId, fb);
}

function pane(mat, name, loreArr, glow) {
    var item = new ItemStack(mat || MAT_SPELL_EMPTY, 1);
    var meta = item.getItemMeta();
    meta.setDisplayName(name || " ");
    if (loreArr && loreArr.length) meta.setLore(java.util.Arrays.asList(loreArr));
    if (glow) {
        try { meta.addEnchant(Enchantment.UNBREAKING, 1, true); } catch (e0) {}
        try { meta.addItemFlags(ItemFlag.HIDE_ENCHANTS); } catch (e1) {}
    }
    item.setItemMeta(meta);
    return item;
}

function spellLockedPane(index) {
    return pane(MAT_SPELL_LOCKED, "§8[未解锁] §7#" + (index + 1), [
        "§7需嵌入核心或提升核心等级以解锁"
    ], false);
}

function spellEmptyPane(index) {
    return pane(MAT_SPELL_EMPTY, "§7[未装填] §8#" + (index + 1), [
        "§7左键点击术式载体自动刻录",
        "§8空槽"
    ], false);
}

function coreEmptyPane() {
    return CORE_PLACEHOLDER.clone();
}

function coreFilledItem(coreId) {
    var item = createCleanSkillCore(coreId);
    if (item) {
        try {
            var meta = item.getItemMeta();
            if (meta && meta.hasDisplayName()) {
                var short = shortItemDisplayName(String(meta.getDisplayName()));
                if (short && stripColor(short).length > 0) meta.setDisplayName(short);
                var lore = meta.hasLore() ? meta.getLore() : new java.util.ArrayList();
                if (lore == null) lore = new java.util.ArrayList();
                lore.add("§7已嵌入");
                lore.add("§e左键卸下核心到背包");
                meta.setLore(lore);
                item.setItemMeta(meta);
            }
        } catch (eMeta) {}
        return item;
    }
    var mat = Material.BROWN_GLAZED_TERRACOTTA;
    try {
        if (SKILL_CORE_CFG && SKILL_CORE_CFG.getCoreMaterial) {
            var matName = SKILL_CORE_CFG.getCoreMaterial(coreId);
            if (matName) mat = Material.valueOf(matName);
        }
    } catch (e0) {}
    return pane(mat, "§d§l" + coreDisplayName(coreId), [
        "§7已嵌入",
        "§e左键卸下核心到背包"
    ], true);
}

function spellFilledPane(index, spellId) {
    var name = spellDisplayName(spellId);
    var school = "";
    try { if (SPELL_CFG) school = SPELL_CFG.getSpellSchool(spellId) || ""; } catch (e1) {}
    var schoolName = school;
    try {
        if (SPELL_CFG && typeof SPELL_CFG.getSchoolDisplayName === "function") {
            schoolName = SPELL_CFG.getSchoolDisplayName(school);
        }
    } catch (e2) {}
    var mat = MAT_SPELL_EMPTY;
    try {
        if (SPELL_CFG && typeof SPELL_CFG.getSchoolShulkerMaterial === "function") {
            mat = SPELL_CFG.getSchoolShulkerMaterial(school);
        }
    } catch (e3) {}
    return pane(mat, name + " §7#" + (index + 1), [
        "§7已刻录术式载体",
        "§7流派：§f" + (schoolName || "未知"),
        "§8ID: §f" + spellId,
        "§e左键点击卸下术式载体到背包"
    ], true);
}

function createCleanSpellCarrier(spellId) {
    try {
        var sf = SoftItemById(spellId);
        if (!sf) return null;
        var item = sf.getItem().clone();
        item.setAmount(1);
        return item;
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

function parseSpellsRaw(raw, cap) {
    ensureStaffMetaApi();
    if (STAFF_META && STAFF_META.parseSpellsRaw) return STAFF_META.parseSpellsRaw(raw, cap);
    return [];
}

function readStaffMeta(stack) {
    ensureStaffMetaApi();
    if (!STAFF_META || !STAFF_META.readStaffMeta) return null;
    return STAFF_META.readStaffMeta(stack, STAFF_CFG, isStaff, SKILL_CORE_CFG);
}

function writeStaffSkillCore(stack, skillCoreId) {
    ensureStaffMetaApi();
    if (!STAFF_META || !STAFF_META.writeStaffSkillCore) return false;
    return STAFF_META.writeStaffSkillCore(stack, skillCoreId);
}

function createCleanSkillCore(coreId) {
    try {
        var sf = SoftItemById(coreId);
        if (!sf) return null;
        var item = sf.getItem().clone();
        item.setAmount(1);
        return item;
    } catch (e) { return null; }
}

function ejectSpellsAboveCapacity(player, staff, data) {
    if (!data || !staff) return;
    var changed = false;
    for (var i = data.capacity; i < SPELL_SLOTS.length; i++) {
        if (!data.spells[i]) continue;
        var carrier = createCleanSpellCarrier(data.spells[i]);
        if (carrier) giveOrDrop(player, carrier);
        data.spells[i] = null;
        if (data.selected === i) data.selected = -1;
        changed = true;
    }
    if (changed) {
        writeStaffMeta(staff, data.spells, data.selected);
    }
}

function colorize(str) {
    var out = String(str);
    out = out.replace(/&#([0-9a-fA-F]{6})/g, function(full, h) {
        var r = "§x";
        for (var i = 0; i < 6; i++) r += "§" + h.charAt(i);
        return r;
    });
    out = out.replace(/&([0-9a-fk-or])/gi, "§$1");
    return out;
}

function stripColor(str) {
    return String(str).replace(/§x(§[0-9a-fA-F]){6}/g, "").replace(/§./g, "");
}

var LORE_HEADER_MARK = "已刻录术式";
var LORE_CORE_MARK = "当前核心";
var LORE_EMPTY_SLOT = colorize("&f[&7未刻录&f]&f");
var LORE_SPELL_HEADER = colorize("&f[&e已刻录术式&f]&#e1ccbd：");
var LORE_CORE_EMPTY = colorize("&f[&#96bed6当前核心&f] &7未镶嵌核心");
var LORE_NO_CORE_HINT = colorize("&f[&8未嵌入核心&f]&f");

function isSpellSlotLorePlain(plain) {
    if (!plain) return false;
    if (plain.indexOf("未刻录") >= 0) return true;
    if (plain.indexOf("未嵌入核心") >= 0) return true;
    if (plain.indexOf("已刻录术式") >= 0) return false;
    if (plain.indexOf("当前核心") >= 0) return false;
    return /^\s*\[[^\]]+\]\s*$/.test(plain);
}

function spellSlotLoreLine(spellId) {
    if (!spellId) return LORE_EMPTY_SLOT;
    return colorize("&f[") + spellDisplayName(spellId) + colorize("&f]");
}

/** 与 items.yml 一致：当前核心行用短显示名（去「施术技能核心」前缀） */
function coreLoreLine(coreId) {
    if (!coreId) return LORE_CORE_EMPTY;
    return colorize("&f[&#96bed6当前核心&f] ") + coreDisplayName(coreId);
}

/**
 * 同步法杖 lore：当前核心行 + 已刻录术式段（对齐 items.yml）
 * capacity<=0 时显示「未嵌入核心」占位行
 */
function syncStaffSpellLore(stack, spells, capacity, skillCoreId) {
    if (!stack) return;
    capacity = capacity != null ? Number(capacity) : 0;
    if (!(capacity > 0)) capacity = 0;
    spells = spells || [];
    var meta = stack.getItemMeta();
    if (!meta) return;
    var old = meta.hasLore() ? meta.getLore() : null;
    var before = new java.util.ArrayList();
    var after = new java.util.ArrayList();
    var phase = 0;
    if (old != null) {
        for (var i = 0; i < old.size(); i++) {
            var raw = old.get(i);
            var plain = stripColor(String(raw));
            if (phase === 0) {
                if (plain.indexOf(LORE_CORE_MARK) >= 0 || plain.indexOf(LORE_HEADER_MARK) >= 0) {
                    phase = 1;
                    continue;
                }
                before.add(raw);
            } else if (phase === 1) {
                if (plain.indexOf(LORE_CORE_MARK) >= 0) continue;
                if (plain.indexOf(LORE_HEADER_MARK) >= 0) continue;
                if (isSpellSlotLorePlain(plain)) continue;
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
    rebuilt.add(coreLoreLine(skillCoreId || null));
    rebuilt.add(LORE_SPELL_HEADER);
    if (capacity <= 0) {
        rebuilt.add(LORE_NO_CORE_HINT);
    } else {
        for (var c = 0; c < capacity; c++) rebuilt.add(spellSlotLoreLine(spells[c] || ""));
    }
    for (a = 0; a < after.size(); a++) rebuilt.add(after.get(a));
    meta.setLore(rebuilt);
    stack.setItemMeta(meta);
}

function syncStaffLoreFromData(stack, data) {
    if (!stack || !data) {
        syncStaffSpellLore(stack, [], 0, null);
        return;
    }
    syncStaffSpellLore(stack, data.spells || [], data.capacity || 0, data.skillCoreId || null);
}

function writeStaffMeta(stack, spells, selected) {
    ensureStaffMetaApi();
    if (STAFF_META && STAFF_META.writeStaffMeta) {
        if (!STAFF_META.writeStaffMeta(stack, spells, selected)) return false;
        var data = readStaffMeta(stack);
        if (data) syncStaffLoreFromData(stack, data);
        else syncStaffSpellLore(stack, spells, 0, null);
        return true;
    }
    if (!KEY_SPELLS || !PersistentDataType) return false;
    var meta = stack.getItemMeta();
    if (!meta) return false;
    var pdc = meta.getPersistentDataContainer();
    var arr = [];
    for (var i = 0; i < spells.length; i++) arr.push(spells[i] ? String(spells[i]) : "");
    pdc.set(KEY_SPELLS, PersistentDataType.STRING, JSON.stringify(arr));
    if (selected >= 0) pdc.set(KEY_SELECTED, PersistentDataType.INTEGER, toJavaInt(selected));
    else try { pdc.remove(KEY_SELECTED); } catch (eR) {}
    stack.setItemMeta(meta);
    var data2 = readStaffMeta(stack);
    if (data2) syncStaffLoreFromData(stack, data2);
    else syncStaffSpellLore(stack, arr, 0, null);
    return true;
}

function refreshGui(inv) {
    for (var f = 0; f < FILLER_SLOTS.length; f++) {
        inv.setItem(FILLER_SLOTS[f], FILLER.clone());
    }
    var staff = getStaff(inv);
    if (!staff) {
        // 若槽里有非占位物品却不是登记法杖，先还给玩家逻辑由调用方处理；此处只摆占位
        var raw = inv.getItem(STAFF_SLOT);
        if (raw && raw.getType() !== Material.AIR && !isStaffPlaceholder(raw) && !isStaff(raw)) {
            // 未知物品：保留原样，避免误删
        } else {
            inv.setItem(STAFF_SLOT, STAFF_PLACEHOLDER.clone());
        }
        inv.setItem(CORE_SLOT, CORE_PLACEHOLDER.clone());
        for (var i = 0; i < SPELL_SLOTS.length; i++) {
            inv.setItem(SPELL_SLOTS[i], spellLockedPane(i));
        }
        return;
    }
    var data = readStaffMeta(staff);
    if (!data) {
        // 绝不能用占位符覆盖真法杖（此前会吞掉）
        inv.setItem(STAFF_SLOT, staff);
        inv.setItem(CORE_SLOT, CORE_PLACEHOLDER.clone());
        for (var j = 0; j < SPELL_SLOTS.length; j++) inv.setItem(SPELL_SLOTS[j], spellLockedPane(j));
        return;
    }
    inv.setItem(STAFF_SLOT, staff);
    if (data.skillCoreId) {
        inv.setItem(CORE_SLOT, coreFilledItem(data.skillCoreId));
    } else {
        inv.setItem(CORE_SLOT, coreEmptyPane());
    }
    for (var s = 0; s < SPELL_SLOTS.length; s++) {
        if (s >= data.capacity) {
            inv.setItem(SPELL_SLOTS[s], spellLockedPane(s));
        } else if (data.spells[s]) {
            inv.setItem(SPELL_SLOTS[s], spellFilledPane(s, data.spells[s]));
        } else {
            inv.setItem(SPELL_SLOTS[s], spellEmptyPane(s));
        }
    }
}

function spellIndex(raw) {
    for (var i = 0; i < SPELL_SLOTS.length; i++) {
        if (SPELL_SLOTS[i] === raw) return i;
    }
    return -1;
}

function refundCursor(player, event) {
    try {
        var cursor = event.getCursor();
        if (cursor != null && cursor.getType() !== Material.AIR) {
            var copy = cursor.clone();
            event.setCursor(null);
            giveOrDrop(player, copy);
        }
    } catch (e) {}
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
    for (var i = 0; i < data.capacity; i++) {
        if (!data.spells[i]) return i;
    }
    return -1;
}

function unequipStaffToInv(player, topInv) {
    if (!activeInventories.contains(topInv)) return;
    var current = topInv.getItem(STAFF_SLOT);
    if (isStaffPlaceholder(current) || !isStaff(current)) return;
    var give = current.clone();
    topInv.setItem(STAFF_SLOT, STAFF_PLACEHOLDER.clone());
    refreshGui(topInv);
    giveOrDrop(player, give);
    playGuiSound(player, SND_CLICK, SND_CLICK_VOL, 0.9);
    player.sendMessage(GLTC_PREFIX + "§e已取回 " + STAFF_LABEL + "§e。");
}

function placeStaffFromInv(player, topInv, bottom, slot) {
    if (!activeInventories.contains(topInv)) return false;
    var stack = bottom.getItem(slot);
    if (!isStaff(stack)) return false;
    var current = topInv.getItem(STAFF_SLOT);
    if (isStaff(current) && !isStaffPlaceholder(current)) {
        player.sendMessage(GLTC_PREFIX + "§c请先取下当前 " + STAFF_LABEL + "§c。");
        return true;
    }
    var one = takeOneFromInventorySlot(bottom, slot);
    if (!one) return false;
    topInv.setItem(STAFF_SLOT, one);
    try {
        var data0 = readStaffMeta(one);
        if (data0) syncStaffLoreFromData(one, data0);
        else syncStaffSpellLore(one, [], 0, null);
        topInv.setItem(STAFF_SLOT, one);
    } catch (eSync) {}
    refreshGui(topInv);
    // 校验：写入后槽内必须仍是法杖
    if (!getStaff(topInv)) {
        giveOrDrop(player, one);
        topInv.setItem(STAFF_SLOT, STAFF_PLACEHOLDER.clone());
        refreshGui(topInv);
        player.sendMessage(GLTC_PREFIX + "§c置入失败，已退回。");
        return true;
    }
    player.sendMessage(GLTC_PREFIX + "§a已置入 " + STAFF_LABEL + "§a。");
    playGuiSound(player, SND_CLICK, SND_CLICK_VOL, SND_CLICK_PITCH);
    return true;
}

function unequipCoreToInv(player, topInv) {
    if (!activeInventories.contains(topInv)) return;
    var staff = getStaff(topInv);
    if (!staff) {
        player.sendMessage(GLTC_PREFIX + "§c请先放入 " + STAFF_LABEL + "§c。");
        return;
    }
    ensureStaffMetaApi();
    var data = readStaffMeta(staff);
    if (!data || !data.skillCoreId) return;
    var coreId = data.skillCoreId;
    var coreItem = createCleanSkillCore(coreId);
    if (!coreItem) {
        player.sendMessage(GLTC_PREFIX + "§c无法生成技能核心：" + coreId);
        return;
    }
    if (!writeStaffSkillCore(staff, null)) {
        player.sendMessage(GLTC_PREFIX + "§c卸下核心失败。");
        return;
    }
    data = readStaffMeta(staff);
    if (data) {
        ejectSpellsAboveCapacity(player, staff, data);
        syncStaffLoreFromData(staff, data);
    } else {
        syncStaffSpellLore(staff, [], 0, null);
    }
    topInv.setItem(STAFF_SLOT, staff);
    refreshGui(topInv);
    giveOrDrop(player, coreItem);
    playGuiSound(player, SND_CLICK, SND_CLICK_VOL, 0.9);
    player.sendMessage(GLTC_PREFIX + "§e已卸下施术技能核心 " + coreDisplayName(coreId));
}

function placeCoreFromInv(player, topInv, bottom, slot) {
    if (!activeInventories.contains(topInv)) return false;
    var stack = bottom.getItem(slot);
    if (!isSkillCore(stack)) return false;
    var staff = getStaff(topInv);
    if (!staff) {
        player.sendMessage(GLTC_PREFIX + "§c请先放入 " + STAFF_LABEL + "§c。");
        return true;
    }
    ensureStaffMetaApi();
    if (!STAFF_META || !STAFF_META.writeStaffSkillCore) {
        player.sendMessage(GLTC_PREFIX + "§c技能核心系统未加载。");
        return true;
    }
    var coreId = getSlimefunId(stack);
    if (!coreId || !SKILL_CORE_CFG.isSkillCoreItem(coreId)) {
        player.sendMessage(GLTC_PREFIX + "§c无法识别技能核心。");
        return true;
    }
    var data = readStaffMeta(staff);
    if (!data) {
        player.sendMessage(GLTC_PREFIX + "§c无法读取 " + STAFF_LABEL + " §c数据。");
        return true;
    }
    if (data.skillCoreId) {
        if (data.skillCoreId === coreId) {
            player.sendMessage(GLTC_PREFIX + "§c已嵌入相同的核心。");
            return true;
        }
        player.sendMessage(GLTC_PREFIX + "§c请先卸下当前施术技能核心。");
        return true;
    }
    var one = takeOneFromInventorySlot(bottom, slot);
    if (!one) return true;
    if (!writeStaffSkillCore(staff, coreId)) {
        giveOrDrop(player, one);
        player.sendMessage(GLTC_PREFIX + "§c嵌入失败，已退回核心。");
        return true;
    }
    data = readStaffMeta(staff);
    if (!data || data.skillCoreId !== coreId) {
        writeStaffSkillCore(staff, null);
        giveOrDrop(player, one);
        topInv.setItem(STAFF_SLOT, staff);
        refreshGui(topInv);
        player.sendMessage(GLTC_PREFIX + "§c嵌入校验失败，已退回核心。");
        return true;
    }
    syncStaffLoreFromData(staff, data);
    topInv.setItem(STAFF_SLOT, staff);
    refreshGui(topInv);
    var core = SKILL_CORE_CFG.getCoreEntry(coreId);
    player.sendMessage(GLTC_PREFIX + "§a已嵌入 " + coreDisplayName(coreId)
        + " §7→ 刻录上限 §e" + (core ? core.spellSlots : "?"));
    playGuiSound(player, SND_CLICK, SND_CLICK_VOL, SND_CLICK_PITCH);
    return true;
}

function unequipSpellToInv(player, topInv, idx) {
    if (!activeInventories.contains(topInv)) return;
    var staff = getStaff(topInv);
    if (!staff) {
        player.sendMessage(GLTC_PREFIX + "§c请先放入 " + STAFF_LABEL + "§c。");
        return;
    }
    var data = readStaffMeta(staff);
    if (!data || idx < 0 || idx >= data.capacity || !data.spells[idx]) return;
    var spellId = data.spells[idx];
    var carrier = createCleanSpellCarrier(spellId);
    if (!carrier) {
        player.sendMessage(GLTC_PREFIX + "§c无法生成术式载体：" + spellId);
        return;
    }
    data.spells[idx] = null;
    if (data.selected === idx) data.selected = -1;
    writeStaffMeta(staff, data.spells, data.selected);
    topInv.setItem(STAFF_SLOT, staff);
    refreshGui(topInv);
    giveOrDrop(player, carrier);
    playGuiSound(player, SND_CLICK, SND_CLICK_VOL, 0.9);
    player.sendMessage(GLTC_PREFIX + "§e已卸下术式载体 " + spellDisplayName(spellId));
}

function placeSpellFromInv(player, topInv, bottom, slot) {
    if (!activeInventories.contains(topInv)) return false;
    var stack = bottom.getItem(slot);
    if (!isSpellCarrier(stack)) return false;
    var staff = getStaff(topInv);
    if (!staff) {
        player.sendMessage(GLTC_PREFIX + "§c请先放入 " + STAFF_LABEL + "§c。");
        return true;
    }
    var spellId = getSlimefunId(stack);
    if (!spellId || !isSpellCarrier(stack)) return false;
    // 必须已在术式登记中（有 cast），禁止「仅有载体物品、无脚本」
    if (!SPELL_CFG || typeof SPELL_CFG.getSpell !== "function" || !SPELL_CFG.getSpell(spellId)) {
        player.sendMessage(GLTC_PREFIX + "§c该术式尚未实装，无法刻录。");
        return true;
    }
    var data = readStaffMeta(staff);
    if (!data) {
        player.sendMessage(GLTC_PREFIX + "§c无法读取 " + STAFF_LABEL + " §c数据。");
        return true;
    }
    if (data.capacity <= 0) {
        player.sendMessage(GLTC_PREFIX + "§c请先嵌入施术技能核心。");
        return true;
    }
    for (var i = 0; i < data.capacity; i++) {
        if (data.spells[i] === spellId) {
            player.sendMessage(GLTC_PREFIX + "§c该术式已刻录。");
            return true;
        }
    }
    var empty = findEmptySpellSlot(data);
    if (empty < 0) {
        player.sendMessage(GLTC_PREFIX + "§c术式槽已满或未嵌入技能核心。");
        return true;
    }
    var one = takeOneFromInventorySlot(bottom, slot);
    if (!one) return true;
    data.spells[empty] = spellId;
    if (data.selected < 0) data.selected = empty;
    if (!writeStaffMeta(staff, data.spells, data.selected)) {
        giveOrDrop(player, one);
        player.sendMessage(GLTC_PREFIX + "§c刻录失败，已退回术式载体。");
        return true;
    }
    topInv.setItem(STAFF_SLOT, staff);
    refreshGui(topInv);
    playGuiSound(player, SND_ENGRAVE, SND_ENGRAVE_VOL, SND_ENGRAVE_PITCH);
    player.sendMessage(GLTC_PREFIX + "§a已刻录 " + spellDisplayName(spellId) + " §7→ 槽位 " + (empty + 1));
    return true;
}

function openGui(player) {
    if (!loadApis()) {
        player.sendMessage(GLTC_PREFIX + "§c术式系统未加载。");
        return;
    }
    ensureStaffMetaApi();
    var inv = Bukkit.createInventory(null, INV_SIZE, GUI_TITLE);
    refreshGui(inv);
    activeInventories.add(inv);
    player.openInventory(inv);
    playGuiSound(player, SND_OPEN, SND_OPEN_VOL, SND_OPEN_PITCH);
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!(player instanceof Player)) return;
    openGui(player);
}

function registerListeners() {
    // 热重载安全：先卸旧监听
    try {
        var old = PLUGIN.gltcEngraveListener;
        if (old != null) {
            try { InventoryClickEvent.getHandlerList().unregister(old); } catch (eU0) {}
            try { InventoryDragEvent.getHandlerList().unregister(old); } catch (eU1) {}
            try { InventoryCloseEvent.getHandlerList().unregister(old); } catch (eU2) {}
        }
    } catch (eOld) {}
    _listenerRegistered = true;
    var ListenerClass = Java.extend(Listener, {});
    var listener = new ListenerClass();
    try { PLUGIN.gltcEngraveListener = listener; } catch (eSet) {}

    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listener, EventPriority.HIGH,
        function(l, event) {
            var top = event.getView().getTopInventory();
            if (!activeInventories.contains(top)) return;
            var player = event.getWhoClicked();
            if (!(player instanceof Player)) return;
            if (!loadApis()) {
                event.setCancelled(true);
                return;
            }

            var raw = event.getRawSlot();
            var clicked = event.getClickedInventory();
            var click = event.getClick();
            var bagSlot = event.getSlot();

            // 禁止一切拖放式操作
            if (click === ClickType.DOUBLE_CLICK || click === ClickType.NUMBER_KEY
                || click === ClickType.SWAP_OFFHAND || click === ClickType.DROP
                || click === ClickType.CONTROL_DROP || click === ClickType.CREATIVE
                || click === ClickType.SHIFT_LEFT || click === ClickType.SHIFT_RIGHT) {
                event.setCancelled(true);
                return;
            }

            if (clicked === top) {
                event.setCancelled(true);
                refundCursor(player, event);
                if (click !== ClickType.LEFT && click !== ClickType.RIGHT) return;
                // 延后 1 tick，避免取消事件回滚吞物品
                if (raw === STAFF_SLOT) {
                    runNextTick(function() { unequipStaffToInv(player, top); });
                    return;
                }
                if (raw === CORE_SLOT) {
                    runNextTick(function() { unequipCoreToInv(player, top); });
                    return;
                }
                var idx = spellIndex(raw);
                if (idx >= 0) {
                    if (click !== ClickType.LEFT) return;
                    runNextTick(function() { unequipSpellToInv(player, top, idx); });
                    return;
                }
                return;
            }

            // 背包：左/右键自动装填
            if (clicked != null && clicked !== top) {
                event.setCancelled(true);
                refundCursor(player, event);
                if (click !== ClickType.LEFT && click !== ClickType.RIGHT) return;
                var cur = event.getCurrentItem();
                if (!cur || cur.getType() === Material.AIR) return;
                var action = null;
                if (isStaff(cur)) action = "staff";
                else if (isSkillCore(cur)) action = "core";
                else if (isSpellCarrier(cur)) action = "spell";
                if (!action) return;
                runNextTick(function() {
                    if (!activeInventories.contains(top)) return;
                    if (!player.isOnline()) return;
                    var bottom = player.getOpenInventory().getBottomInventory();
                    if (action === "staff") placeStaffFromInv(player, top, bottom, bagSlot);
                    else if (action === "core") placeCoreFromInv(player, top, bottom, bagSlot);
                    else if (action === "spell") placeSpellFromInv(player, top, bottom, bagSlot);
                });
            }
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryDragEvent, listener, EventPriority.HIGH,
        function(l, event) {
            if (!activeInventories.contains(event.getInventory())) return;
            event.setCancelled(true);
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listener, EventPriority.MONITOR,
        function(l, event) {
            var inv = event.getInventory();
            if (!activeInventories.contains(inv)) return;
            activeInventories.remove(inv);
            var p = event.getPlayer();
            if (!(p instanceof Player)) return;
            var staff = inv.getItem(STAFF_SLOT);
            // 先清空 GUI，再归还，避免与下一 tick 取放互相覆盖
            if (isStaff(staff) && !isStaffPlaceholder(staff)) {
                var give = staff.clone();
                inv.setItem(STAFF_SLOT, null);
                inv.setItem(CORE_SLOT, null);
                for (var i = 0; i < SPELL_SLOTS.length; i++) inv.setItem(SPELL_SLOTS[i], null);
                for (var f = 0; f < FILLER_SLOTS.length; f++) inv.setItem(FILLER_SLOTS[f], null);
                giveOrDrop(p, give);
            } else {
                inv.setItem(STAFF_SLOT, null);
                inv.setItem(CORE_SLOT, null);
                for (var i2 = 0; i2 < SPELL_SLOTS.length; i2++) inv.setItem(SPELL_SLOTS[i2], null);
                for (var f2 = 0; f2 < FILLER_SLOTS.length; f2++) inv.setItem(FILLER_SLOTS[f2], null);
            }
        }, PLUGIN
    );
}

registerListeners();
function tick(info) {}
