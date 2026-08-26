/**
 * 彼岸钢™智能调控终端 —— 管理员术士数据面板
 * 仅 OP / gltc.admin / vasa.admin 可打开
 * 操作只改内存草稿；关闭面板时才写盘一次
 * 左键 +1（Shift +10）· 右键 -1（Shift -10）· 重置需连点两次确认
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var InventoryDragEvent = Java.type("org.bukkit.event.inventory.InventoryDragEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var ClickType = Java.type("org.bukkit.event.inventory.ClickType");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GUI_TITLE = "§c§l彼岸钢™ · 智能调控终端";
var MENU_ITEM_ID = "VASA_彼岸钢调控终端";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";

var SLOT_INFO = 4;
var SLOT_LEVEL = 11;
var SLOT_MAGE_PTS = 13;
var SLOT_BODY_PTS = 15;
var SLOT_RESET = 22;

var activeInventories = new java.util.HashSet();
/** inv -> { uuid, stats, dirty, resetAll } */
var sessionByInv = new java.util.HashMap();
var resetConfirmUntil = {};
var _listenerRegistered = false;
var ADMIN_MAGE_API = null;

/**
 * 优先复用监听已加载的 GLTC_MAGE_API；勿直接 eval 污染共享作用域。
 */
function loadMageCore() {
    function probe(api) {
        if (api == null) return false;
        try {
            return api.getPlayerStats != null && api.savePlayerStats != null && api.adminResetAllData != null;
        } catch (e0) {
            return false;
        }
    }
    if (probe(ADMIN_MAGE_API)) return true;
    try {
        if (typeof GLTC_MAGE_API !== "undefined" && probe(GLTC_MAGE_API)) {
            ADMIN_MAGE_API = GLTC_MAGE_API;
            return true;
        }
    } catch (eG) {}
    try {
        if (probe(PLUGIN.gltcMageApi)) {
            ADMIN_MAGE_API = PLUGIN.gltcMageApi;
            return true;
        }
    } catch (eP) {}
    try {
        var RSC0 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC0.INSTANCE != null && probe(RSC0.INSTANCE.gltcMageApi)) {
            ADMIN_MAGE_API = RSC0.INSTANCE.gltcMageApi;
            return true;
        }
    } catch (eR) {}
    try {
        var File = java.io.File;
        var Files = java.nio.file.Files;
        var StandardCharsets = java.nio.charset.StandardCharsets;
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var dataDir = PLUGIN.getDataFolder();
        var file = new File(dataDir.getAbsolutePath() + "/addons/GLTC_联合协议/scripts/术士系统/核心.js");
        if (!file.exists()) file = new File(dataDir.getAbsolutePath() + "/addons/GLTC121/scripts/术士系统/核心.js");
        if (file.exists()) {
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
            var body = String(code).replace(/\s+$/, "");
            if (!/\breturn\s+/.test(body.slice(-80))) {
                body = body.replace(/([A-Za-z_$][\w$]*)\s*;\s*$/, "return $1;");
            }
            var exported = (0, eval)("(function(){\n" + body + "\n})();");
            if (probe(exported)) {
                ADMIN_MAGE_API = exported;
                return true;
            }
        }
    } catch (eEval) {
        try { Bukkit.getLogger().warning("[GLTC调控终端] 隔离加载核心失败: " + eEval); } catch (eL) {}
    }
    return false;
}

loadMageCore();

function isAdmin(player) {
    try {
        if (player.isOp()) return true;
        if (player.hasPermission("gltc.admin")) return true;
        if (player.hasPermission("vasa.admin")) return true;
        if (player.hasPermission("gltc.mage.admin")) return true;
    } catch (e) {}
    return false;
}

function cloneData(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return obj; }
}

function pane(mat, name, loreArr) {
    var item = new ItemStack(mat);
    var meta = item.getItemMeta();
    meta.setDisplayName(name);
    if (loreArr && loreArr.length) meta.setLore(java.util.Arrays.asList(loreArr));
    item.setItemMeta(meta);
    return item;
}

function filler() {
    return pane(Material.GRAY_STAINED_GLASS_PANE, "§0", []);
}

function getSession(inv) {
    try { return sessionByInv.get(inv); } catch (e) { return null; }
}

function refreshGui(inv, player) {
    var session = getSession(inv);
    if (!session || !session.stats) return;
    var data = session.stats;
    var uuid = session.uuid;
    var level = Number(data.mageLevel) || 0;
    var magePts = Number(data.magePotential) || 0;
    var bodyPts = Number(data.bodyPotential) || 0;

    for (var i = 0; i < 27; i++) inv.setItem(i, filler());

    inv.setItem(SLOT_INFO, pane(Material.BOOK, "§c§l调控说明", [
        "§7仅对自己生效 · §e关闭面板时才写入文件",
        "§e左键 §f+1  §eShift+左键 §f+10",
        "§e右键 §f-1  §eShift+右键 §f-10",
        "§c重置需在 5 秒内连点两次确认",
        session.dirty ? "§a※ 有未保存修改，关闭后写入" : "§8当前与存档一致",
        "§8权限: OP / gltc.admin / vasa.admin"
    ]));

    inv.setItem(SLOT_LEVEL, pane(Material.EXPERIENCE_BOTTLE, "§d术士等级 §f" + level + "§7/§f8", [
        "§7当前等级：§f" + level,
        "§e左键 §a+1 §8· §e右键 §c-1",
        "§eShift+左/右键 §f±10（仍钳制 0~8）",
        "§8不自动发放潜能 · 关闭时保存"
    ]));

    inv.setItem(SLOT_MAGE_PTS, pane(Material.AMETHYST_SHARD, "§b术士潜能 §f" + magePts, [
        "§7未分配术士潜能点数",
        "§e左键 §a+1 §8· §e右键 §c-1",
        "§eShift+左/右键 §f±10",
        "§8下限 0 · 关闭时保存"
    ]));

    inv.setItem(SLOT_BODY_PTS, pane(Material.IRON_CHESTPLATE, "§a体能潜能 §f" + bodyPts, [
        "§7未分配体能潜能点数",
        "§e左键 §a+1 §8· §e右键 §c-1",
        "§eShift+左/右键 §f±10",
        "§8下限 0 · 关闭时保存"
    ]));

    var confirmLeft = 0;
    var until = resetConfirmUntil[uuid];
    if (until != null && Date.now() < until) {
        confirmLeft = Math.ceil((until - Date.now()) / 1000);
    }
    inv.setItem(SLOT_RESET, pane(Material.BARRIER, "§c§l重置全部数据", [
        "§7恢复默认数值、清空装备槽",
        "§7已装备组件会在关闭时归还",
        "§7并刷新属性缓存",
        confirmLeft > 0
            ? ("§e请在 §c" + confirmLeft + "§e 秒内再点一次确认")
            : "§c点击一次进入确认，再点一次标记重置",
        session.resetAll ? "§4已标记重置 · 关闭面板后执行并写盘" : "§8关闭面板时才会真正写入",
        "§4此操作不可撤销"
    ]));
}

function deltaFromClick(event) {
    var click = event.getClick();
    var shift = event.isShiftClick();
    var step = shift ? 10 : 1;
    if (click === ClickType.LEFT || click === ClickType.SHIFT_LEFT) return step;
    if (click === ClickType.RIGHT || click === ClickType.SHIFT_RIGHT) return -step;
    return 0;
}

function adjustDraftLevel(session, delta) {
    delta = Math.floor(Number(delta) || 0);
    if (!delta) return { ok: false, msg: "无效增量" };
    var old = Number(session.stats.mageLevel) || 0;
    var next = old + delta;
    if (next < 0) next = 0;
    if (next > 8) next = 8;
    if (next === old) return { ok: false, msg: "已达等级边界 (0~8)", level: old };
    session.stats.mageLevel = next;
    session.dirty = true;
    return { ok: true, level: next, from: old };
}

function adjustDraftPotential(session, pool, delta) {
    delta = Math.floor(Number(delta) || 0);
    if (!delta) return { ok: false, msg: "无效增量" };
    function bump(field) {
        session.stats[field] = Math.max(0, (Number(session.stats[field]) || 0) + delta);
    }
    if (pool === "body") bump("bodyPotential");
    else bump("magePotential");
    session.dirty = true;
    return {
        ok: true,
        magePotential: session.stats.magePotential || 0,
        bodyPotential: session.stats.bodyPotential || 0
    };
}

function commitSession(player, session) {
    if (!session || !loadMageCore()) return;
    var uuid = session.uuid;
    if (!session.dirty && !session.resetAll) {
        player.sendMessage(GLTC_PREFIX + "§7调控终端已关闭，无改动。");
        return;
    }
    if (session.resetAll) {
        var rr = ADMIN_MAGE_API.adminResetAllData(player);
        if (rr.ok) {
            try { ADMIN_MAGE_API.applyMageAttributes(player); } catch (e1) {}
            player.sendMessage(GLTC_PREFIX + "§c已重置并写入全部术士数据"
                + (rr.returned > 0 ? (" §7(归还装备 §e" + rr.returned + " §7件)") : ""));
        } else {
            player.sendMessage(GLTC_PREFIX + "§c重置写入失败");
        }
        return;
    }
    var ok = ADMIN_MAGE_API.savePlayerStats(uuid, session.stats);
    try { ADMIN_MAGE_API.applyMageAttributes(player); } catch (e4) {}
    if (ok) player.sendMessage(GLTC_PREFIX + "§a调控数据已写入并存档生效。");
    else player.sendMessage(GLTC_PREFIX + "§c写入存档失败。");
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    if (!isAdmin(player)) {
        player.sendMessage(GLTC_PREFIX + "§c仅管理员可使用彼岸钢™智能调控终端。");
        return;
    }
    if (!loadMageCore()) {
        player.sendMessage(GLTC_PREFIX + "§c术士核心加载失败。");
        return;
    }

    var uuid = String(player.getUniqueId().toString());
    var base = ADMIN_MAGE_API.getPlayerStats(uuid);
    var inv = Bukkit.createInventory(null, 27, GUI_TITLE);
    var session = {
        uuid: uuid,
        stats: cloneData(base),
        dirty: false,
        resetAll: false
    };
    sessionByInv.put(inv, session);
    activeInventories.add(inv);
    refreshGui(inv, player);
    player.openInventory(inv);
}

function registerListeners() {
    if (_listenerRegistered) return;
    _listenerRegistered = true;

    try {
        if (PLUGIN.gltcAdminTerminalListener != null) {
            try { InventoryClickEvent.getHandlerList().unregister(PLUGIN.gltcAdminTerminalListener); } catch (e0) {}
            try { InventoryDragEvent.getHandlerList().unregister(PLUGIN.gltcAdminTerminalListener); } catch (e1) {}
            try { InventoryCloseEvent.getHandlerList().unregister(PLUGIN.gltcAdminTerminalListener); } catch (e2) {}
        }
    } catch (e) {}

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    try { PLUGIN.gltcAdminTerminalListener = listenerInstance; } catch (e3) {}

    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listenerInstance, EventPriority.HIGH,
        function (l, event) {
            var top = event.getView().getTopInventory();
            if (!activeInventories.contains(top)) return;
            event.setCancelled(true);

            var player = event.getWhoClicked();
            if (!(player instanceof Player)) return;
            if (!isAdmin(player)) {
                player.closeInventory();
                player.sendMessage(GLTC_PREFIX + "§c权限已失效。");
                return;
            }
            if (!loadMageCore()) return;
            if (event.getClickedInventory() !== top) return;

            var session = getSession(top);
            if (!session) return;

            var raw = event.getRawSlot();
            var delta = deltaFromClick(event);
            var uuid = session.uuid;

            if (raw === SLOT_LEVEL && delta !== 0) {
                var r = adjustDraftLevel(session, delta);
                if (r.ok) player.sendMessage(GLTC_PREFIX + "§a术士等级：§f" + r.from + " §7→ §e" + r.level + " §8(待关闭保存)");
                else player.sendMessage(GLTC_PREFIX + "§c" + (r.msg || "调整失败"));
                refreshGui(top, player);
                return;
            }

            if (raw === SLOT_MAGE_PTS && delta !== 0) {
                var rm = adjustDraftPotential(session, "mage", delta);
                if (rm.ok) player.sendMessage(GLTC_PREFIX + "§a术士潜能：§e" + rm.magePotential + " §8(待关闭保存)");
                else player.sendMessage(GLTC_PREFIX + "§c" + (rm.msg || "调整失败"));
                refreshGui(top, player);
                return;
            }

            if (raw === SLOT_BODY_PTS && delta !== 0) {
                var rb = adjustDraftPotential(session, "body", delta);
                if (rb.ok) player.sendMessage(GLTC_PREFIX + "§a体能潜能：§e" + rb.bodyPotential + " §8(待关闭保存)");
                else player.sendMessage(GLTC_PREFIX + "§c" + (rb.msg || "调整失败"));
                refreshGui(top, player);
                return;
            }

            if (raw === SLOT_RESET) {
                var now = Date.now();
                var until = resetConfirmUntil[uuid];
                if (until == null || now > until) {
                    resetConfirmUntil[uuid] = now + 5000;
                    player.sendMessage(GLTC_PREFIX + "§e请在 §c5 §e秒内再次点击确认重置。");
                    refreshGui(top, player);
                    return;
                }
                delete resetConfirmUntil[uuid];
                var defs = (typeof ADMIN_MAGE_API.defaultStats === "function")
                    ? ADMIN_MAGE_API.defaultStats()
                    : { mageLevel: 0, magePotential: 0, bodyPotential: 0 };
                session.stats = cloneData(defs);
                session.resetAll = true;
                session.dirty = true;
                player.sendMessage(GLTC_PREFIX + "§c已标记重置，§e关闭面板后写入并生效。");
                refreshGui(top, player);
            }
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryDragEvent, listenerInstance, EventPriority.HIGH,
        function (l, event) {
            if (!activeInventories.contains(event.getInventory())) return;
            event.setCancelled(true);
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listenerInstance, EventPriority.NORMAL,
        function (l, event) {
            var inv = event.getInventory();
            if (!activeInventories.contains(inv)) return;
            activeInventories.remove(inv);
            var session = null;
            try { session = sessionByInv.remove(inv); } catch (e0) {
                try { session = sessionByInv.get(inv); sessionByInv.remove(inv); } catch (e1) {}
            }
            try {
                var p = event.getPlayer();
                if (p instanceof Player) {
                    delete resetConfirmUntil[String(p.getUniqueId().toString())];
                    if (session) commitSession(p, session);
                }
            } catch (e) {}
        }, PLUGIN
    );
}

registerListeners();

function tick(info) {}
