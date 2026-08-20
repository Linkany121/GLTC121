/**
 * GLTC 术士装备菜单
 * 布局：上方数值/加点 · 倒数第二行装备 · 右下角 GLI
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
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GUI_TITLE = "§d§l驭粒接口 · 术士装备";
var MENU_ITEM_ID = "VASA_驭粒终端";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";

/**
 * 数值区（整体左移一格；潜能在各自行最右）：
 *  9 等级  10 粒子强度  11 容量  12 心血管  13 折射  14 当前粒子  ···  17 术士潜能
 *  18 最终减伤  19~24 原版白值六项  ···  26 体能潜能
 *  35 重置所有潜能（体能潜能正下方）
 *  53 粒子浓度 GLI
 */
var STAT_SLOTS = {
    level: 9,
    particlePower: 10,
    capacity: 11,
    cardio: 12,
    refraction: 13,
    mana: 14,
    magePts: 17,
    bodyPts: 26,
    resetPts: 35,
    finalDR: 18,
    melee: 19,
    maxHealth: 20,
    armor: 21,
    toughness: 22,
    speed: 23,
    reach: 24,
    gli: 53
};

// 点击加点映射
var MAGE_CLICK = {
    10: "particlePower",
    11: "pituitaryCapacity",
    12: "cardiovascular",
    13: "particleRefraction",
    18: "finalDamageReduction"
};
var BODY_CLICK = {
    19: "meleeDamage",
    20: "maxHealth",
    21: "armor",
    22: "toughness",
    23: "speed",
    24: "reach"
};

var activeInventories = new java.util.HashSet();
var _listenerRegistered = false;
var MAGE_API = null;

function loadMageCore() {
    if (MAGE_API && typeof MAGE_API.getTotalStats === "function") return true;
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/术士系统/核心.js"),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/术士系统/核心.js")
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) candidates.push(new File(list[i], "scripts/术士系统/核心.js"));
            }
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) {
        var file = candidates[c];
        if (!file.exists()) continue;
        try {
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
            var exported = (0, eval)(code);
            if (exported && typeof exported.getTotalStats === "function") {
                MAGE_API = exported;
                return true;
            }
        } catch (e2) {
            Bukkit.getLogger().warning("[GLTC术士] 加载核心失败: " + e2);
        }
    }
    return false;
}

loadMageCore();

function getSlotDefs() {
    var cfg = MAGE_API.getGearConfig();
    return cfg ? cfg.EQUIP_SLOT_DEFS : [];
}

function getSeparatorSlot() {
    var cfg = MAGE_API.getGearConfig();
    return cfg ? cfg.SEPARATOR_GUI_SLOT : 37;
}

function categoryDisplayName(cat) {
    var cfg = MAGE_API.getGearConfig();
    if (cfg && cfg.CATEGORY_NAMES && cfg.CATEGORY_NAMES[cat]) return cfg.CATEGORY_NAMES[cat];
    return cat;
}

function pane(mat, name, loreArr) {
    var item = new ItemStack(mat);
    var meta = item.getItemMeta();
    meta.setDisplayName(name);
    if (loreArr && loreArr.length) meta.setLore(java.util.Arrays.asList(loreArr));
    item.setItemMeta(meta);
    return item;
}

function formatPct(v) {
    return (Math.round(v * 1000) / 10).toFixed(1) + "%";
}

function formatNum(v) {
    return String(Math.round(v * 1000) / 1000);
}

function buildEmptySlot(slotDef) {
    return pane(Material.OBSIDIAN, "§5" + slotDef.label, [
        "§7类型：§f" + categoryDisplayName(slotDef.category),
        "§e左键拿起对应类型饰品后点此装备",
        "§e空手点击已装备槽可卸下"
    ]);
}

function buildSeparator() {
    return pane(Material.BLUE_STAINED_GLASS_PANE, "§9分隔", [
        "§7左侧：§b潜能模块",
        "§7右侧：§d强化组件 §7/ §a术式辅助"
    ]);
}

function refreshStatIcons(inv, player) {
    var total = MAGE_API.getTotalStats(player, true);
    var gli = MAGE_API.getGLI();
    var tipMage = "§e左键消耗 §d1 术士潜能 §e加点";
    var tipBody = "§e左键消耗 §a1 体能潜能 §e加点";

    inv.setItem(STAT_SLOTS.level, pane(Material.EXPERIENCE_BOTTLE, "§d术士等级 §f" + total.mageLevel, [
        "§7驭粒熟练：§f" + total.proficiency,
        "§8升级获得术士潜能与体能潜能"
    ]));
    inv.setItem(STAT_SLOTS.particlePower, pane(Material.AMETHYST_SHARD, "§b粒子强度 §f" + formatNum(total.particlePower), [
        "§7最终伤害 = 强度 × 术式系数 × GLI", tipMage, "§8每点 +0.1"
    ]));
    inv.setItem(STAT_SLOTS.capacity, pane(Material.GLASS_BOTTLE, "§b松垂体容量 §f" + formatNum(total.pituitaryCapacity), [
        "§7施术消耗粒子", tipMage, "§8每点 +6"
    ]));
    inv.setItem(STAT_SLOTS.cardio, pane(Material.REDSTONE, "§c心血管强度 §f" + formatPct(total.cardiovascular), [
        "§7冷却 = 术式冷却 × (1 - 本值)", tipMage, "§8每点 +1%"
    ]));
    inv.setItem(STAT_SLOTS.refraction, pane(Material.PRISMARINE_CRYSTALS, "§3粒子折射 §f" + formatPct(total.particleRefraction), [
        "§7减少受到的粒子伤害", tipMage, "§8每点 +1%"
    ]));
    inv.setItem(STAT_SLOTS.mana, pane(Material.LAPIS_LAZULI, "§9当前粒子 §f" + formatNum(total.currentParticles) + " §7/ §f" + formatNum(total.pituitaryCapacity), [
        "§7内存缓存，退出/定时落盘",
        "§8不写入术士数值主文件"
    ]));
    inv.setItem(STAT_SLOTS.magePts, pane(Material.PURPLE_DYE, "§d术士潜能 §f" + total.magePotential, [
        "§7用于：强度/容量/心血管/折射/最终减伤",
        "§8升级按 4,4,12,4,4,12,4,12 获得"
    ]));
    inv.setItem(STAT_SLOTS.bodyPts, pane(Material.LIME_DYE, "§a体能潜能 §f" + total.bodyPotential, [
        "§7用于：近战/血/防/韧/速/手长",
        "§8升级按 4,4,12,4,4,12,4,12 获得"
    ]));
    inv.setItem(STAT_SLOTS.resetPts, pane(Material.BARRIER, "§c重置所有潜能", [
        "§7将已分配点数全部退回",
        "§7术士潜能 / 体能潜能各自返还",
        "§e左键确认重置"
    ]));

    inv.setItem(STAT_SLOTS.finalDR, pane(Material.SHIELD, "§6最终减伤 §f" + formatPct(total.finalDamageReduction), [
        "§7影响普通伤害与粒子伤害",
        "§c不影响脉冲伤害",
        tipMage, "§8每点 +1%"
    ]));
    inv.setItem(STAT_SLOTS.melee, pane(Material.IRON_SWORD, "§f近战伤害 §f+" + formatNum(total.meleeDamage), [tipBody, "§8每点 +2"]));
    inv.setItem(STAT_SLOTS.maxHealth, pane(Material.GOLDEN_APPLE, "§f血量白值 §f+" + formatNum(total.maxHealth), [tipBody, "§8每点 +10"]));
    inv.setItem(STAT_SLOTS.armor, pane(Material.IRON_CHESTPLATE, "§f防御白值 §f+" + formatNum(total.armor), [tipBody, "§8每点 +1"]));
    inv.setItem(STAT_SLOTS.toughness, pane(Material.NETHERITE_CHESTPLATE, "§f韧性白值 §f+" + formatNum(total.toughness), [tipBody, "§8每点 +0.5"]));
    inv.setItem(STAT_SLOTS.speed, pane(Material.SUGAR, "§f速度白值 §f+" + formatNum(total.speed), [tipBody, "§8每点 +0.01"]));
    inv.setItem(STAT_SLOTS.reach, pane(Material.STICK, "§f手长白值 §f+" + formatNum(total.reach), [tipBody, "§8每点 +0.2"]));

    inv.setItem(STAT_SLOTS.gli, pane(Material.END_CRYSTAL, "§d粒子浓度 GLI §f" + formatNum(gli), [
        "§7服主配置，玩家不可提升",
        "§8ParticleConcentration"
    ]));
}

function paintMenu(inv, player) {
    var filler = pane(Material.BLACK_STAINED_GLASS_PANE, "§0", null);
    for (var i = 0; i < 54; i++) inv.setItem(i, filler.clone());

    inv.setItem(getSeparatorSlot(), buildSeparator());
    var uuid = player.getUniqueId().toString();
    var gear = MAGE_API.getPlayerGear(uuid);
    var defs = getSlotDefs();
    for (var s = 0; s < defs.length; s++) {
        var def = defs[s];
        var b64 = gear.slots[s];
        if (b64) {
            var item = MAGE_API.itemFromBase64(b64);
            if (item) { inv.setItem(def.gui, item); continue; }
        }
        inv.setItem(def.gui, buildEmptySlot(def));
    }
    refreshStatIcons(inv, player);
}

function openMageMenu(player) {
    if (!loadMageCore()) {
        player.sendMessage(GLTC_PREFIX + "§c术士核心未加载。");
        return;
    }
    if (!MAGE_API.getGearConfig()) {
        player.sendMessage(GLTC_PREFIX + "§c装备加成表未加载。");
        return;
    }
    var inv = Bukkit.createInventory(null, 54, GUI_TITLE);
    paintMenu(inv, player);
    activeInventories.add(inv);
    player.openInventory(inv);
    MAGE_API.applyMageAttributes(player);
}

function equipSlotIndex(rawSlot) {
    var defs = getSlotDefs();
    for (var i = 0; i < defs.length; i++) {
        if (defs[i].gui === rawSlot) return i;
    }
    return -1;
}

function giveOrDrop(player, item) {
    var left = player.getInventory().addItem(item);
    var it = left.values().iterator();
    while (it.hasNext()) player.getWorld().dropItemNaturally(player.getLocation(), it.next());
}

function trySpendClick(player, raw, inv) {
    if (raw === STAT_SLOTS.resetPts) {
        var rr = MAGE_API.resetAllPotentials(player);
        if (!rr.ok) { player.sendMessage(GLTC_PREFIX + "§c" + rr.msg); return true; }
        player.sendMessage(GLTC_PREFIX + "§a已重置潜能：§d术士 +" + rr.mage + " §7/ §a体能 +" + rr.body
            + " §7(现有 §d" + rr.mageLeft + " §7/ §a" + rr.bodyLeft + "§7)");
        refreshStatIcons(inv, player);
        return true;
    }
    if (MAGE_CLICK[raw]) {
        var r = MAGE_API.spendPotential(player, "mage", MAGE_CLICK[raw]);
        if (!r.ok) { player.sendMessage(GLTC_PREFIX + "§c" + r.msg); return true; }
        player.sendMessage(GLTC_PREFIX + "§a术士潜能：§f" + r.msg + " §7(剩余 " + r.left + ")");
        refreshStatIcons(inv, player);
        return true;
    }
    if (BODY_CLICK[raw]) {
        var r2 = MAGE_API.spendPotential(player, "body", BODY_CLICK[raw]);
        if (!r2.ok) { player.sendMessage(GLTC_PREFIX + "§c" + r2.msg); return true; }
        player.sendMessage(GLTC_PREFIX + "§a体能潜能：§f" + r2.msg + " §7(剩余 " + r2.left + ")");
        refreshStatIcons(inv, player);
        return true;
    }
    return false;
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(item);
        if (!sf || sf.getId() !== MENU_ITEM_ID) return;
    } catch (e2) { return; }
    openMageMenu(player);
}

function registerListeners() {
    if (_listenerRegistered) return;
    _listenerRegistered = true;
    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();

    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listenerInstance, EventPriority.HIGH,
        function(l, event) {
            var top = event.getView().getTopInventory();
            if (!activeInventories.contains(top)) return;
            var player = event.getWhoClicked();
            if (!(player instanceof Player)) return;

            var raw = event.getRawSlot();
            var clicked = event.getClickedInventory();
            var cursor = event.getCursor();
            var uuid = player.getUniqueId().toString();

            if (clicked === top) {
                // 加点
                if (trySpendClick(player, raw, top)) {
                    event.setCancelled(true);
                    return;
                }

                var idx = equipSlotIndex(raw);
                if (idx < 0) {
                    event.setCancelled(true);
                    return;
                }

                var click = event.getClick();
                if (click !== ClickType.LEFT && click !== ClickType.RIGHT) {
                    event.setCancelled(true);
                    return;
                }
                event.setCancelled(true);

                var defs = getSlotDefs();
                var gear = MAGE_API.getPlayerGear(uuid);
                var hasCursor = cursor && cursor.getType() !== Material.AIR;
                var equippedB64 = gear.slots[idx];

                if (hasCursor) {
                    if (!MAGE_API.isMageAccessory(cursor)) {
                        player.sendMessage(GLTC_PREFIX + "§c该物品未在装备加成表中登记。");
                        return;
                    }
                    if (!MAGE_API.canEquipInSlot(cursor, idx)) {
                        player.sendMessage(GLTC_PREFIX + "§c此槽只能装备：§e" + categoryDisplayName(defs[idx].category));
                        return;
                    }
                    if (cursor.getAmount() !== 1) {
                        player.sendMessage(GLTC_PREFIX + "§c请将饰品数量分离为 1 后再装备。");
                        return;
                    }
                    if (equippedB64) {
                        var old = MAGE_API.itemFromBase64(equippedB64);
                        if (old) giveOrDrop(player, old);
                    }
                    var one = cursor.clone();
                    one.setAmount(1);
                    gear.slots[idx] = MAGE_API.itemToBase64(one);
                    MAGE_API.savePlayerGear(uuid, gear);
                    event.setCursor(null);
                    top.setItem(defs[idx].gui, one.clone());
                    refreshStatIcons(top, player);
                    MAGE_API.applyMageAttributes(player);
                    player.sendMessage(GLTC_PREFIX + "§a已装备至 §e" + defs[idx].label);
                    return;
                }

                if (equippedB64) {
                    var item = MAGE_API.itemFromBase64(equippedB64);
                    gear.slots[idx] = null;
                    MAGE_API.savePlayerGear(uuid, gear);
                    top.setItem(defs[idx].gui, buildEmptySlot(defs[idx]));
                    if (item) giveOrDrop(player, item);
                    refreshStatIcons(top, player);
                    MAGE_API.applyMageAttributes(player);
                    player.sendMessage(GLTC_PREFIX + "§e已卸下 §f" + defs[idx].label);
                }
                return;
            }

            if (event.isShiftClick()) event.setCancelled(true);
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
            activeInventories.remove(inv);
            var p = event.getPlayer();
            if (p instanceof Player && MAGE_API) {
                MAGE_API.applyMageAttributes(p);
            }
        }, PLUGIN
    );
}

registerListeners();
function tick(info) {}
