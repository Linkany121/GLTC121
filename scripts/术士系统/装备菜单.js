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
var PlayerDropItemEvent = Java.type("org.bukkit.event.player.PlayerDropItemEvent");
var PlayerSwapHandItemsEvent = Java.type("org.bukkit.event.player.PlayerSwapHandItemsEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var ClickType = Java.type("org.bukkit.event.inventory.ClickType");
var Arrays = Java.type("java.util.Arrays");
var HashSet = Java.type("java.util.HashSet");
var HashMap = Java.type("java.util.HashMap");
var JBase64 = Java.type("java.util.Base64");
var JUUID = Java.type("java.util.UUID");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GUI_TITLE = "§x§a§2§d§e§f§f此§x§9§9§c§c§f§f岸§x§8§f§b§a§f§f雪§x§8§6§a§8§f§f™§x§7§d§9§6§f§f智§x§8§2§8§8§f§f能§x§9§7§7§f§f§f监§x§a§c§7§5§f§f控§x§c§1§6§c§f§f终§x§d§6§6§2§f§f端";
var MENU_ITEM_ID = "VASA_驭粒终端";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";

/**
 * 数值区布局：
 *  8 重置潜能（右上角）
 *  9 等级  10 粒子强度  11 心血管  12 折射  13 最终减伤  ···  17 术士潜能
 *  18~23 原版白值六项  ···  26 体能潜能
 *  53 粒子浓度 GLI
 */
var STAT_SLOTS = {
    level: 9,
    particlePower: 10,
    cardio: 11,
    refraction: 12,
    finalDR: 13,
    magePts: 17,
    melee: 18,
    maxHealth: 19,
    armor: 20,
    toughness: 21,
    speed: 22,
    reach: 23,
    bodyPts: 26,
    resetPts: 8,
    gli: 53
};

// 点击加点映射
var MAGE_CLICK = {
    10: "particlePower",
    11: "cardiovascular",
    12: "particleRefraction",
    13: "finalDamageReduction"
};
var BODY_CLICK = {
    18: "meleeDamage",
    19: "maxHealth",
    20: "armor",
    21: "toughness",
    22: "speed",
    23: "reach"
};

var activeInventories = new HashSet();
/** inv -> { uuid, stats, dirty }  加点草稿，关闭时写盘 */
var sessionByInv = new HashMap();
var _listenerRegistered = false;
var MENU_MAGE_API = null;
/** hash -> 已生成头颅（clone 用）；避免重复 Java.type / JAR 扫描 */
var _skullItemCache = new HashMap();
var _skullJavaReady = false;
var _skullTypes = {
    ProfileProperty: null,
    PlayerProfile: null,
    GameProfile: null,
    Property: null,
    CraftItemStack: null,
    DataComponents: null,
    ResolvableProfile: null
};

/** 模块加载时一次性解析 Java 类，避免在 GUI 事件里反复 classpath 扫描 */
function initSkullJavaTypes() {
    if (_skullJavaReady) return;
    _skullJavaReady = true;
    try { _skullTypes.ProfileProperty = Java.type("org.bukkit.profile.ProfileProperty"); } catch (e0) {}
    if (_skullTypes.ProfileProperty == null) {
        try { _skullTypes.ProfileProperty = Java.type("com.destroystokyo.paper.profile.ProfileProperty"); } catch (e1) {}
    }
    try { _skullTypes.PlayerProfile = Java.type("org.bukkit.profile.PlayerProfile"); } catch (e2) {}
    try { _skullTypes.GameProfile = Java.type("com.mojang.authlib.GameProfile"); } catch (e3) {}
    try { _skullTypes.Property = Java.type("com.mojang.authlib.properties.Property"); } catch (e4) {}
    try { _skullTypes.CraftItemStack = Java.type("org.bukkit.craftbukkit.inventory.CraftItemStack"); } catch (e5) {}
    try { _skullTypes.DataComponents = Java.type("net.minecraft.core.component.DataComponents"); } catch (e6) {}
    try { _skullTypes.ResolvableProfile = Java.type("net.minecraft.world.item.component.ResolvableProfile"); } catch (e7) {}
}
initSkullJavaTypes();

function loadMageCore() {
    function probe(api) {
        if (api == null) return false;
        try {
            var cfg = api.getGearConfig != null ? api.getGearConfig() : null;
            if (cfg != null && cfg.EQUIP_SLOT_DEFS != null) return true;
        } catch (e0) {}
        try {
            if (typeof api.getGearConfig === "function") {
                var cfg2 = api.getGearConfig();
                if (cfg2 != null) return true;
            }
        } catch (e1) {}
        return false;
    }
    if (probe(MENU_MAGE_API)) return true;
    MENU_MAGE_API = null;
    // 物品脚本独立 Graal 上下文：监听 cache / PLUGIN 字段里的 JS 对象不可调用，直接本上下文加载
    try {
        var loader = PLUGIN.gltcScriptLoader;
        if (loader && loader.evalScriptExport) {
            var fromLoader = loader.evalScriptExport("术士系统/核心.js", { isolated: true, cache: false });
            if (probe(fromLoader)) {
                MENU_MAGE_API = fromLoader;
                return true;
            }
        }
    } catch (eLoader) {}
    try {
        var File = java.io.File;
        var Files = java.nio.file.Files;
        var StandardCharsets = java.nio.charset.StandardCharsets;
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var dataDir = null;
        try { dataDir = PLUGIN.getDataFolder(); } catch (eDf) {}
        if (dataDir == null) {
            try {
                var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
                if (RSC.INSTANCE != null) dataDir = RSC.INSTANCE.getDataFolder();
            } catch (eR) {}
        }
        if (dataDir != null) {
            var candidates = [
                new File(dataDir.getAbsolutePath() + "/addons/GLTC_联合协议/scripts/术士系统/核心.js"),
                new File(dataDir.getAbsolutePath() + "/addons/GLTC121/scripts/术士系统/核心.js")
            ];
            for (var i = 0; i < candidates.length; i++) {
                if (!candidates[i].exists()) continue;
                var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(candidates[i].toPath()))).toString();
                var exported = (0, eval)(code);
                if (probe(exported)) {
                    MENU_MAGE_API = exported;
                    return true;
                }
            }
        }
    } catch (eEval) {
        try { Bukkit.getLogger().warning("[GLTC装备菜单] 本地加载术士核心失败: " + eEval); } catch (eL) {}
    }
    return false;
}

loadMageCore();

function getSlotDefs() {
    var cfg = MENU_MAGE_API.getGearConfig();
    return cfg ? cfg.EQUIP_SLOT_DEFS : [];
}

function getSeparatorSlot() {
    var cfg = MENU_MAGE_API.getGearConfig();
    return cfg ? cfg.SEPARATOR_GUI_SLOT : 37;
}

function categoryDisplayName(cat) {
    var cfg = MENU_MAGE_API.getGearConfig();
    if (cfg && cfg.CATEGORY_NAMES && cfg.CATEGORY_NAMES[cat]) return cfg.CATEGORY_NAMES[cat];
    return cat;
}

function pane(mat, name, loreArr) {
    var item = new ItemStack(mat);
    var meta = item.getItemMeta();
    meta.setDisplayName(name);
    if (loreArr && loreArr.length) meta.setLore(Arrays.asList(loreArr));
    item.setItemMeta(meta);
    return item;
}

/**
 * Graal 下 JS 字符串没有 getBytes；纹理 JSON 为纯 ASCII，按码点转 byte[] 即可。
 */
function toUtf8Bytes(str) {
    str = String(str);
    var arr = [];
    for (var i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i) & 0xff);
    }
    return Java.to(arr, "byte[]");
}

/** 用材质 hash 生成玩家头（Paper 1.21 兼容；失败再回退反射/NMS） */
function skullFromHash(hash) {
    if (hash == null || String(hash).length < 8) return null;
    var hashStr = String(hash).replace(/^http:\/\/textures\.minecraft\.net\/texture\//, "");
    try {
        var cached = _skullItemCache.get(hashStr);
        if (cached != null) return cached.clone();
    } catch (eCache) {}

    initSkullJavaTypes();
    var json = '{"textures":{"SKIN":{"url":"http://textures.minecraft.net/texture/' + hashStr + '"}}}';
    var b64 = JBase64.getEncoder().encodeToString(toUtf8Bytes(json));
    var uid = JUUID.nameUUIDFromBytes(toUtf8Bytes("gltc-slot-" + hashStr));
    var built = null;

    if (built == null) {
        try {
            var head = new ItemStack(Material.PLAYER_HEAD, 1);
            var meta = head.getItemMeta();
            var profile = null;
            try { profile = Bukkit.createProfile(uid, "GLTC"); } catch (e0) {
                try { profile = Bukkit.createPlayerProfile(uid, "GLTC"); } catch (e1) {}
            }
            var ProfilePropertyClass = _skullTypes.ProfileProperty;
            if (profile != null && ProfilePropertyClass != null) {
                var property = null;
                try { property = new ProfilePropertyClass("textures", b64, ""); } catch (e4) {
                    try { property = new ProfilePropertyClass("textures", b64); } catch (e5) {}
                }
                if (property != null) {
                    try {
                        profile.getClass().getMethod("setProperty", ProfilePropertyClass).invoke(profile, property);
                    } catch (e6) {
                        try { profile.setProperty(property); } catch (e7) {}
                    }
                    var PlayerProfileClass = _skullTypes.PlayerProfile;
                    try {
                        if (PlayerProfileClass != null) {
                            meta.getClass().getMethod("setPlayerProfile", PlayerProfileClass).invoke(meta, profile);
                        } else {
                            throw new Error("no PlayerProfile");
                        }
                    } catch (e8) {
                        try { meta.setPlayerProfile(profile); } catch (e9) {
                            try { meta.setOwnerProfile(profile); } catch (e10) {}
                        }
                    }
                    head.setItemMeta(meta);
                    built = head;
                }
            }
        } catch (eA) {}
    }

    // 方案 B：GameProfile 写入 SkullMeta.profile
    if (built == null) {
        try {
            var GameProfile = _skullTypes.GameProfile;
            var Property = _skullTypes.Property;
            if (GameProfile != null && Property != null) {
                var headB = new ItemStack(Material.PLAYER_HEAD, 1);
                var metaB = headB.getItemMeta();
                var gp = new GameProfile(uid, "GLTC");
                gp.getProperties().put("textures", new Property("textures", b64));
                var cls = metaB.getClass();
                var fields = ["profile", "playerProfile", "serializedProfile"];
                for (var fi = 0; fi < fields.length; fi++) {
                    try {
                        var field = cls.getDeclaredField(fields[fi]);
                        field.setAccessible(true);
                        field.set(metaB, gp);
                        headB.setItemMeta(metaB);
                        built = headB;
                        break;
                    } catch (eF) {}
                }
                if (built == null) {
                    try {
                        var f2 = cls.getSuperclass().getDeclaredField("profile");
                        f2.setAccessible(true);
                        f2.set(metaB, gp);
                        headB.setItemMeta(metaB);
                        built = headB;
                    } catch (eF2) {}
                }
            }
        } catch (eB) {}
    }

    // 方案 C：1.21 DataComponents.PROFILE
    if (built == null) {
        try {
            var CraftItemStack = _skullTypes.CraftItemStack;
            var DataComponents = _skullTypes.DataComponents;
            var ResolvableProfile = _skullTypes.ResolvableProfile;
            var GameProfileC = _skullTypes.GameProfile;
            var PropertyC = _skullTypes.Property;
            if (CraftItemStack != null && DataComponents != null && ResolvableProfile != null
                && GameProfileC != null && PropertyC != null) {
                var headC = new ItemStack(Material.PLAYER_HEAD, 1);
                var nmsItem = CraftItemStack.asNMSCopy(headC);
                var gpC = new GameProfileC(uid, "GLTC");
                gpC.getProperties().put("textures", new PropertyC("textures", b64));
                var resolvable = null;
                try { resolvable = new ResolvableProfile(gpC); } catch (eR) {
                    try { resolvable = ResolvableProfile.createResolved(gpC); } catch (eR2) {}
                }
                if (resolvable != null) {
                    nmsItem.set(DataComponents.PROFILE, resolvable);
                    built = CraftItemStack.asBukkitCopy(nmsItem);
                }
            }
        } catch (eC) {}
    }

    if (built != null) {
        try { _skullItemCache.put(hashStr, built.clone()); } catch (ePut) {}
        return built;
    }
    try {
        Bukkit.getLogger().warning("[GLTC术士] 空槽头颅生成失败 hash=" + hashStr.substring(0, 12) + "...");
    } catch (eLog) {}
    return null;
}

function buildEmptySlot(slotDef) {
    var name = "§5" + slotDef.label;
    var loreArr = [
        "§7类型：§f" + categoryDisplayName(slotDef.category),
        "§e左键/右键点击背包中组件自动装备",
        "§e左键点击已装备槽可卸下到背包"
    ];
    var hash = slotDef ? slotDef.skullHash : null;
    var skull = hash ? skullFromHash(hash) : null;
    if (skull != null) {
        try {
            var meta = skull.getItemMeta();
            if (meta != null) {
                meta.setDisplayName(name);
                meta.setLore(Arrays.asList(loreArr));
                skull.setItemMeta(meta);
            }
        } catch (eMeta) {}
        return skull;
    }
    // 最后兜底仍给头颅外形，避免再变黑曜石
    return pane(Material.PLAYER_HEAD, name, loreArr);
}

function formatPct(v) {
    return (Math.round(Number(v) * 1000) / 10).toFixed(1) + "%";
}

function formatNum(v) {
    return String(Math.round(Number(v) * 1000) / 1000);
}

/** 属性当前值展示：百分比类用 %，其余用数值 */
function formatStatVal(v, isPct) {
    return isPct ? formatPct(v) : formatNum(v);
}

/** 读取选项上的潜能点数上限；无则 null（避免 && 落到 false） */
function optMaxPoints(opt) {
    if (!opt) return null;
    var m = Number(opt.maxPoints);
    if (!isFinite(m) || m <= 0) return null;
    return Math.floor(m);
}

/** 潜能上限文案：有则「N点」，无则「无」 */
function formatPotMaxLabel(maxPts) {
    if (typeof maxPts !== "number" || !isFinite(maxPts) || maxPts <= 0) return "无";
    return Math.floor(maxPts) + "点";
}

/** 全局硬顶文案：百分比带 %，常规数值原样，无则「无」 */
function formatHardCapLabel(hardCap, isPct) {
    if (typeof hardCap !== "number" || !isFinite(hardCap)) return "无";
    if (isPct) return formatPct(hardCap);
    return formatNum(hardCap);
}

/** lore 常用色 */
var C_DESC = "§x§f§f§f§5§b§3";       // #fff5b3
var C_POT = "§x§9§d§f§9§f§f";        // #9df9ff 潜能使用
var C_GEAR = "§x§4§4§a§5§f§f";       // #44a5ff 组件提供
var C_CAP = "§x§f§f§6§7§a§7";        //rgb(255, 114, 173) 上限行

/**
 * 可加点属性：
 * name：名称 + 当前数据
 * lore：描述 / （空行）当前总计来源 / 潜能使用 / 组件提供 / 潜能上限 / 全局上限
 */
function buildAttrPane(mat, color, title, totalVal, descs, spentPts, per, equipVal, isPct, maxPts, hardCap) {
    var name = color + title + " §f+ " + formatStatVal(totalVal, isPct);
    var lore = [];
    var i;
    for (i = 0; i < descs.length; i++) lore.push(C_DESC + String(descs[i]));
    lore.push(" ");
    lore.push(C_DESC + "当前总计来源：");
    lore.push(C_POT + "潜能使用 §f" + Math.max(0, Math.floor(Number(spentPts) || 0))
        + " §7x §f" + formatStatVal(per, isPct));
    lore.push(C_GEAR + "组件提供 §f" + formatStatVal(equipVal, isPct));
    lore.push(C_CAP + "可使用潜能上限：§c" + formatPotMaxLabel(maxPts));
    lore.push(C_CAP + "全局上限：§c" + formatHardCapLabel(hardCap, !!isPct));
    return pane(mat, name, lore);
}

function descLine(text) {
    return C_DESC + text;
}

function buildSeparator() {
    return pane(Material.BLUE_STAINED_GLASS_PANE, "§9", [
    ]);
}

function cloneData(obj) {
    try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return obj; }
}

function getSession(inv) {
    try { return sessionByInv.get(inv); } catch (e) { return null; }
}

function getSessionBase(session, player) {
    if (session && session.stats) return session.stats;
    return MENU_MAGE_API.getPlayerStats(player.getUniqueId().toString());
}

function getSpentPts(base, pool, statKey) {
    try {
        if (typeof MENU_MAGE_API.ensureSpentMaps === "function") MENU_MAGE_API.ensureSpentMaps(base);
    } catch (e0) {}
    var sf = statKey + "Spent";
    if (base[sf] != null) return Math.max(0, Math.floor(Number(base[sf]) || 0));
    var map = pool === "body" ? base.bodySpent : base.mageSpent;
    if (!map) return 0;
    return Math.max(0, Math.floor(Number(map[statKey]) || 0));
}

function gearSlotItem(slot) {
    if (!slot) return null;
    if (typeof MENU_MAGE_API.getGearSlotItem === "function") return MENU_MAGE_API.getGearSlotItem(slot);
    var b64 = typeof slot === "string" ? slot : slot.item;
    return b64 ? MENU_MAGE_API.itemFromBase64(b64) : null;
}

function getEquipBonuses(player) {
    try {
        if (typeof MENU_MAGE_API.getEquipmentBonuses === "function") {
            return MENU_MAGE_API.getEquipmentBonuses(player.getUniqueId().toString()) || {};
        }
    } catch (e) {}
    return {};
}

function hardCapOf(statKey, isPct) {
    try {
        var caps = MENU_MAGE_API.HARD_CAPS;
        if (!caps || caps[statKey] == null) return null;
        return caps[statKey];
    } catch (e) {
        return null;
    }
}

function refreshStatIcons(inv, player) {
    var session = getSession(inv);
    var base = getSessionBase(session, player);
    try {
        if (typeof MENU_MAGE_API.ensureSpentMaps === "function") MENU_MAGE_API.ensureSpentMaps(base);
    } catch (eEns) {}

    var total;
    if (session && session.dirty && session.stats && typeof MENU_MAGE_API.getTotalStatsFromBase === "function") {
        total = MENU_MAGE_API.getTotalStatsFromBase(player, session.stats);
    } else {
        try { MENU_MAGE_API.invalidatePlayerCache(player.getUniqueId().toString()); } catch (eInv) {}
        total = MENU_MAGE_API.getTotalStats(player, true);
    }
    var equip = getEquipBonuses(player);
    var mageOpt = MENU_MAGE_API.MAGE_POINT_OPTIONS || {};
    var bodyOpt = MENU_MAGE_API.BODY_POINT_OPTIONS || {};
    var gli = MENU_MAGE_API.getGLI();
    var saveTip = (session && session.dirty) ? descLine("※ 有未保存修改，关闭后写入") : null;

    inv.setItem(STAT_SLOTS.level, pane(Material.EXPERIENCE_BOTTLE, "§d术士等级 §f+ " + formatNum(total.mageLevel), [
        descLine("驭粒熟练度：" + formatNum(total.proficiency)),
        descLine("环数 ＞ 术士等级：侵蚀等级 = 环数 - 等级"),
        descLine("侵蚀时：术式冷却 × 侵蚀等级；自伤 = 侵蚀 × 20% 最大生命（脉冲）"),
        descLine("术士等级提升时获得潜能")
    ]));

    inv.setItem(STAT_SLOTS.particlePower, buildAttrPane(
        Material.AMETHYST_SHARD, "§b", "粒子强度", total.particlePower,
        ["提升自身粒子的强度与控制能力","最终伤害 = 强度 × 术式系数 × GLI"],
        getSpentPts(base, "mage", "particlePower"),
        (mageOpt.particlePower && mageOpt.particlePower.per) || 0.1,
        Number(equip.particlePower) || 0, false,
        optMaxPoints(mageOpt.particlePower),
        hardCapOf("particlePower", false)
    ));
    inv.setItem(STAT_SLOTS.cardio, buildAttrPane(
        Material.REDSTONE, "§c", "心血管强度", total.cardiovascular,
        [
            "提升供氧与心血管系统强度，减少术式冷却",
            "当前术式的最终冷却比例： " + formatPct(Math.max(0.01, 1 - (Number(total.cardiovascular) || 0)))
        ],
        getSpentPts(base, "mage", "cardiovascular"),
        (mageOpt.cardiovascular && mageOpt.cardiovascular.per) || 0.01,
        Number(equip.cardiovascular) || 0, true,
        optMaxPoints(mageOpt.cardiovascular) || 32,
        hardCapOf("cardiovascular", true)
    ));
    inv.setItem(STAT_SLOTS.refraction, buildAttrPane(
        Material.PRISMARINE_CRYSTALS, "§3", "粒子折射", total.particleRefraction,
        ["折射粒子射流，减少受到的粒子伤害"],
        getSpentPts(base, "mage", "particleRefraction"),
        (mageOpt.particleRefraction && mageOpt.particleRefraction.per) || 0.02,
        Number(equip.particleRefraction) || 0, true,
        optMaxPoints(mageOpt.particleRefraction) || 24,
        hardCapOf("particleRefraction", true)
    ));
    inv.setItem(STAT_SLOTS.finalDR, buildAttrPane(
        Material.SHIELD, "§6", "最终减伤", total.finalDamageReduction,
        ["影响常规伤害与粒子伤害", "无法影响脉冲伤害"],
        getSpentPts(base, "mage", "finalDamageReduction"),
        (mageOpt.finalDamageReduction && mageOpt.finalDamageReduction.per) || 0.02,
        Number(equip.finalDamageReduction) || 0, true,
        optMaxPoints(mageOpt.finalDamageReduction) || 24,
        hardCapOf("finalDamageReduction", true)
    ));

    var magePtsLore = [
        descLine("用于提升驭粒相关能力的潜能，"),
        descLine("术士等级提升时能获得。")
    ];
    if (saveTip) magePtsLore.push(saveTip);
    inv.setItem(STAT_SLOTS.magePts, pane(Material.PURPLE_DYE, "§d术士潜能 §f+ " + formatNum(total.magePotential), magePtsLore));

    var bodyPtsLore = [
        descLine("用于提升通用身体机能的潜能，"),
        descLine("术士等级提升时能获得。")
    ];
    if (saveTip) bodyPtsLore.push(saveTip);
    inv.setItem(STAT_SLOTS.bodyPts, pane(Material.LIME_DYE, "§a体能潜能 §f+ " + formatNum(total.bodyPotential), bodyPtsLore));

    inv.setItem(STAT_SLOTS.resetPts, pane(Material.BARRIER, "§c重置所有潜能", [
        descLine("将已分配潜能全部退回"),
        descLine("术士潜能 / 体能潜能各自返还"),
        "§e左键确认重置",
        descLine("关闭面板时写入并刷新全部加成")
    ]));

    inv.setItem(STAT_SLOTS.melee, buildAttrPane(
        Material.IRON_SWORD, "§f", "筋力解放", total.meleeDamage,
        ["解放肌肉与神经协调上限","提升近战伤害白值"],
        getSpentPts(base, "body", "meleeDamage"),
        (bodyOpt.meleeDamage && bodyOpt.meleeDamage.per) || 0.6,
        Number(equip.meleeDamage) || 0, false,
        optMaxPoints(bodyOpt.meleeDamage),
        hardCapOf("meleeDamage", false)
    ));
    inv.setItem(STAT_SLOTS.maxHealth, buildAttrPane(
        Material.GOLDEN_APPLE, "§f", "肌脂提升", total.maxHealth,
        ["提升脂肪与肌肉的糅合强度","提升血量白值"],
        getSpentPts(base, "body", "maxHealth"),
        (bodyOpt.maxHealth && bodyOpt.maxHealth.per) || 8,
        Number(equip.maxHealth) || 0, false,
        optMaxPoints(bodyOpt.maxHealth),
        hardCapOf("maxHealth", false)
    ));
    inv.setItem(STAT_SLOTS.armor, buildAttrPane(
        Material.IRON_CHESTPLATE, "§f", "骨骼结构", total.armor,
        ["优化、改进自身的整体骨骼结构","提升防御值白值"],
        getSpentPts(base, "body", "armor"),
        (bodyOpt.armor && bodyOpt.armor.per) || 2,
        Number(equip.armor) || 0, false,
        optMaxPoints(bodyOpt.armor) || 16,
        hardCapOf("armor", false)
    ));
    inv.setItem(STAT_SLOTS.toughness, buildAttrPane(
        Material.NETHERITE_CHESTPLATE, "§f", "体态掌控", total.toughness,
        ["进一步擢升椎反应与身体协调","提升韧性白值"],
        getSpentPts(base, "body", "toughness"),
        (bodyOpt.toughness && bodyOpt.toughness.per) || 0.4,
        Number(equip.toughness) || 0, false,
        optMaxPoints(bodyOpt.toughness) || 25,
        hardCapOf("toughness", false)
    ));
    inv.setItem(STAT_SLOTS.speed, buildAttrPane(
        Material.SUGAR, "§f", "心肺强化", total.speed,
        ["全方位强化氧转化与肌肉活性","提升速度白值"],
        getSpentPts(base, "body", "speed"),
        (bodyOpt.speed && bodyOpt.speed.per) || 0.005,
        Number(equip.speed) || 0, false,
        optMaxPoints(bodyOpt.speed) || 48,
        hardCapOf("speed", false)
    ));
    inv.setItem(STAT_SLOTS.reach, buildAttrPane(
        Material.STICK, "§f", "体态协调", total.reach,
        ["掌握自己的全身系统与核心稳定","提升手长白值"],
        getSpentPts(base, "body", "reach"),
        (bodyOpt.reach && bodyOpt.reach.per) || 0.1,
        Number(equip.reach) || 0, false,
        optMaxPoints(bodyOpt.reach),
        hardCapOf("reach", false)
    ));

    inv.setItem(STAT_SLOTS.gli, pane(Material.END_CRYSTAL, "§d粒子浓度 GLI §f+ " + formatNum(gli), [
        descLine("管理员可配置，无法提升"),
        descLine("ParticleConcentration")
    ]));
}

function paintMenu(inv, player) {
    var filler = pane(Material.BLACK_STAINED_GLASS_PANE, "§0", null);
    for (var i = 0; i < 54; i++) inv.setItem(i, filler.clone());

    inv.setItem(getSeparatorSlot(), buildSeparator());
    var uuid = player.getUniqueId().toString();
    var gear = MENU_MAGE_API.getPlayerGear(uuid);
    var defs = getSlotDefs();
    for (var s = 0; s < defs.length; s++) {
        var def = defs[s];
        var item = gearSlotItem(gear.slots[s]);
        if (item) { inv.setItem(def.gui, item); continue; }
        inv.setItem(def.gui, buildEmptySlot(def));
    }
    refreshStatIcons(inv, player);
}

function syncAllRelatedData(player) {
    if (!player || !(player instanceof Player)) return;
    if (!loadMageCore() || !MENU_MAGE_API) return;
    var uuid = String(player.getUniqueId().toString());
    try { MENU_MAGE_API.invalidatePlayerCache(uuid); } catch (e0) {}
    try { MENU_MAGE_API.applyMageAttributes(player); } catch (e1) {}
}

function isMageMenuTop(inv) {
    try { return activeInventories.contains(inv); } catch (e) { return false; }
}

/** 取消点击后改物品须延后 1 tick，否则 Paper 回滚 */
function deferMenuAction(player, top, fn) {
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try {
                if (!player.isOnline() || !isMageMenuTop(top)) return;
                fn();
            } catch (eRun) {
                try { Bukkit.getLogger().warning("[GLTC装备菜单] 延后任务异常: " + eRun); } catch (eL) {}
            }
        });
    } catch (e0) {
        try { fn(); } catch (e1) {}
    }
}

/** 延後到下一 tick，避免在 InventoryClick/Close 事件堆疊中阻塞主執行緒 */
function scheduleSyncAllRelatedData(player) {
    if (!player || !(player instanceof Player)) return;
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try { syncAllRelatedData(player); } catch (e) {}
        });
    } catch (eSch) {
        syncAllRelatedData(player);
    }
}

function openMageMenu(player) {
    if (!loadMageCore()) {
        player.sendMessage(GLTC_PREFIX + "§c术士核心未加载。");
        return;
    }
    if (!MENU_MAGE_API.getGearConfig()) {
        player.sendMessage(GLTC_PREFIX + "§c装备加成表未加载。");
        return;
    }
    var uuid = String(player.getUniqueId().toString());
    try { MENU_MAGE_API.invalidatePlayerCache(uuid); } catch (eInv) {}
    scheduleSyncAllRelatedData(player);
    var inv = Bukkit.createInventory(null, 54, GUI_TITLE);
    var stats = cloneData(MENU_MAGE_API.getPlayerStats(uuid));
    try {
        if (typeof MENU_MAGE_API.ensureSpentMaps === "function") MENU_MAGE_API.ensureSpentMaps(stats);
    } catch (e1) {}
    var session = {
        uuid: uuid,
        stats: stats,
        dirty: false
    };
    sessionByInv.put(inv, session);
    paintMenu(inv, player);
    activeInventories.add(inv);
    player.openInventory(inv);
    try { player.playSound(player.getLocation(), "minecraft:block.vault.open_shutter", 1.0, 1.0); } catch (eSnd) {}
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

/** 取走背包格中 1 个（堆叠则减 1） */
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

/** 找第一个空且类型匹配的装备槽 */
function findEmptyEquipSlot(stack, gear, playerUuid) {
    var defs = getSlotDefs();
    for (var i = 0; i < defs.length; i++) {
        if (gear.slots[i]) continue;
        if (MENU_MAGE_API.canEquipInSlot(stack, i, playerUuid)) return i;
    }
    return -1;
}

function tryEquipUgwFromBag(player, top, bagSlot) {
    if (!loadMageCore() || !MENU_MAGE_API) return;
    var bottom;
    try { bottom = player.getOpenInventory().getBottomInventory(); } catch (eInv) { return; }
    if (!bottom || !isMageMenuTop(top)) return;
    var stack = bottom.getItem(bagSlot);
    if (!stack || stack.getType() === Material.AIR) return;

    var kind = MENU_MAGE_API.getUgwKind(stack);
    if (!kind) return;

    var uuid = player.getUniqueId().toString();
    if (kind === "regular") {
        var ownerCheck = MENU_MAGE_API.validateRegularUgwOwner(player, stack);
        if (!ownerCheck.ok) {
            player.sendMessage(GLTC_PREFIX + "§c" + ownerCheck.msg);
            return;
        }
        var ugwId = MENU_MAGE_API.getUgwIdFromItem(stack);
        var removed = MENU_MAGE_API.dedupeRegularUgwInBag(player, ugwId, bagSlot);
        if (removed > 0) {
            player.sendMessage(GLTC_PREFIX + "§7已删除背包中 §e" + removed + " §7件重复的常规组件。");
        }
    }

    var gear = MENU_MAGE_API.getPlayerGear(uuid);
    var idx = findEmptyEquipSlot(stack, gear, uuid);
    if (idx < 0) {
        player.sendMessage(GLTC_PREFIX + "§c没有可装配的空槽（类型不匹配或已满）。");
        return;
    }
    var one = takeOneFromInventorySlot(bottom, bagSlot);
    if (!one) return;
    if (kind === "regular") one = MENU_MAGE_API.dedupeUgwOnEquip(player, one);
    one = MENU_MAGE_API.syncUgwLore(one);
    var defs = getSlotDefs();
    gear.slots[idx] = { ugwId: MENU_MAGE_API.getUgwIdFromItem(one), item: MENU_MAGE_API.itemToBase64(one) };
    MENU_MAGE_API.savePlayerGear(uuid, gear);
    try { MENU_MAGE_API.invalidatePlayerCache(uuid); } catch (e0) {}
    scheduleSyncAllRelatedData(player);
    top.setItem(defs[idx].gui, one.clone());
    refreshStatIcons(top, player);
    player.sendMessage(GLTC_PREFIX + "§a已装备至 §e" + defs[idx].label);
}

function unequipToPlayerInv(player, top, idx) {
    var uuid = player.getUniqueId().toString();
    var gear = MENU_MAGE_API.getPlayerGear(uuid);
    var slotEntry = gear.slots[idx];
    if (!slotEntry) return;
    var item = gearSlotItem(slotEntry);
    gear.slots[idx] = null;
    MENU_MAGE_API.savePlayerGear(uuid, gear);
    try { MENU_MAGE_API.invalidatePlayerCache(uuid); } catch (e0) {}
    scheduleSyncAllRelatedData(player);
    var defs = getSlotDefs();
    top.setItem(defs[idx].gui, buildEmptySlot(defs[idx]));
    if (item) {
        if (typeof MENU_MAGE_API.syncUgwLore === "function") item = MENU_MAGE_API.syncUgwLore(item);
        giveOrDrop(player, item);
    }
    refreshStatIcons(top, player);
    player.sendMessage(GLTC_PREFIX + "§e已卸下 §f" + defs[idx].label);
}

function trySpendClick(player, raw, inv) {
    var session = getSession(inv);
    if (!session || !session.stats) return false;

    if (raw === STAT_SLOTS.resetPts) {
        var rr = MENU_MAGE_API.resetAllPotentialsOnData(session.stats);
        if (!rr.ok) { player.sendMessage(GLTC_PREFIX + "§c" + rr.msg); return true; }
        session.dirty = true;
        player.sendMessage(GLTC_PREFIX + "§a已重置潜能：§d术士 +" + rr.mage + " §7/ §a体能 +" + rr.body
            + " §7(现有 §d" + rr.mageLeft + " §7/ §a" + rr.bodyLeft + "§7) §8(待关闭保存)");
        refreshStatIcons(inv, player);
        return true;
    }
    if (MAGE_CLICK[raw]) {
        var r = MENU_MAGE_API.spendPotentialOnData(session.stats, "mage", MAGE_CLICK[raw]);
        if (!r.ok) { player.sendMessage(GLTC_PREFIX + "§c" + r.msg); return true; }
        session.dirty = true;
        player.sendMessage(GLTC_PREFIX + "§a术士潜能：§f" + r.msg + " §7(剩余 " + r.left + ") §8(待关闭保存)");
        refreshStatIcons(inv, player);
        return true;
    }
    if (BODY_CLICK[raw]) {
        var r2 = MENU_MAGE_API.spendPotentialOnData(session.stats, "body", BODY_CLICK[raw]);
        if (!r2.ok) { player.sendMessage(GLTC_PREFIX + "§c" + r2.msg); return true; }
        session.dirty = true;
        player.sendMessage(GLTC_PREFIX + "§a体能潜能：§f" + r2.msg + " §7(剩余 " + r2.left + ") §8(待关闭保存)");
        refreshStatIcons(inv, player);
        return true;
    }
    return false;
}

function commitMageSession(player, session) {
    if (!session || !loadMageCore()) return;
    var uuid = session.uuid;
    if (session.dirty) {
        try { MENU_MAGE_API.invalidatePlayerCache(uuid); } catch (e0) {}
        var ok = MENU_MAGE_API.savePlayerStats(uuid, session.stats);
        if (ok) {
            player.sendMessage(GLTC_PREFIX + "§a潜能改动已写入。");
            // 通知监听上下文清缓存，并重发 Java 桥（闭包钉死最新 API）
            try {
                var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
                var store = RSC.INSTANCE != null ? RSC.INSTANCE.gltcJavaBridges : null;
                if (store == null) store = PLUGIN.gltcJavaBridges;
                if (store != null) {
                    var invBr = store.get("gltcMage_invalidateCache");
                    if (invBr != null && invBr.accept != null) invBr.accept(String(uuid));
                }
            } catch (eInvBr) {}
        } else {
            player.sendMessage(GLTC_PREFIX + "§c潜能写入失败。");
        }
    }
    scheduleSyncAllRelatedData(player);
}

/** 关闭面板时延后提交，避免在 InventoryClick/Close 嵌套中阻塞主线程 */
function scheduleCommitMageSession(player, session) {
    if (!player || !(player instanceof Player)) return;
    if (!session) {
        scheduleSyncAllRelatedData(player);
        return;
    }
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try {
                if (!player.isOnline()) return;
                commitMageSession(player, session);
            } catch (e) {}
        });
    } catch (eSch) {
        commitMageSession(player, session);
    }
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
            if (!loadMageCore()) return;

            // 禁止移动/拿起物品；仅允许 GUI 加点、卸下、背包左/右键装备 UGW
            event.setCancelled(true);

            var raw = event.getRawSlot();
            var clicked = event.getClickedInventory();
            var click = event.getClick();

            if (clicked === top) {
                if (trySpendClick(player, raw, top)) return;
                var idx = equipSlotIndex(raw);
                if (idx >= 0 && click === ClickType.LEFT) {
                    deferMenuAction(player, top, function() { unequipToPlayerInv(player, top, idx); });
                }
                return;
            }

            if (raw >= top.getSize() && (click === ClickType.LEFT || click === ClickType.RIGHT)) {
                var cur = event.getCurrentItem();
                if (cur && cur.getType() !== Material.AIR && MENU_MAGE_API.isMageAccessory(cur)) {
                    var bagSlot = event.getSlot();
                    deferMenuAction(player, top, function() {
                        tryEquipUgwFromBag(player, top, bagSlot);
                    });
                }
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
            activeInventories.remove(inv);
            var session = null;
            try { session = sessionByInv.remove(inv); } catch (e0) {
                try { session = sessionByInv.get(inv); sessionByInv.remove(inv); } catch (e1) {}
            }
            var p = event.getPlayer();
            if (p instanceof Player && MENU_MAGE_API) scheduleCommitMageSession(p, session);
        }, PLUGIN
    );

    function blockIfMenuOpen(event) {
        var p = event.getPlayer();
        if (!(p instanceof Player)) return;
        try {
            if (isMageMenuTop(p.getOpenInventory().getTopInventory())) event.setCancelled(true);
        } catch (e) {}
    }

    Bukkit.getPluginManager().registerEvent(
        PlayerDropItemEvent, listenerInstance, EventPriority.HIGH, blockIfMenuOpen, PLUGIN
    );
    Bukkit.getPluginManager().registerEvent(
        PlayerSwapHandItemsEvent, listenerInstance, EventPriority.HIGH, blockIfMenuOpen, PLUGIN
    );
}

registerListeners();
function tick(info) {}
