/**
 * GLTC 术士装备菜单
 * 布局：上方数值/加点 · 倒数第二行装备 · 右下角 当前粒子+GLI
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
var GUI_TITLE = "§x§a§2§d§e§f§f此§x§9§9§c§c§f§f岸§x§8§f§b§a§f§f雪§x§8§6§a§8§f§f™§x§7§d§9§6§f§f智§x§8§2§8§8§f§f能§x§9§7§7§f§f§f监§x§a§c§7§5§f§f控§x§c§1§6§c§f§f终§x§d§6§6§2§f§f端";
var MENU_ITEM_ID = "VASA_驭粒终端";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";

/**
 * 数值区布局：
 *  8 重置潜能（右上角）
 *  9 等级  10 粒子强度  11 容量  12 心血管  13 折射  14 最终减伤  ···  17 术士潜能
 *  18~23 原版白值六项  ···  26 体能潜能
 *  52 当前粒子  53 粒子浓度 GLI
 */
var STAT_SLOTS = {
    level: 9,
    particlePower: 10,
    capacity: 11,
    cardio: 12,
    refraction: 13,
    finalDR: 14,
    magePts: 17,
    melee: 18,
    maxHealth: 19,
    armor: 20,
    toughness: 21,
    speed: 22,
    reach: 23,
    bodyPts: 26,
    resetPts: 8,
    mana: 52,
    gli: 53
};

// 点击加点映射
var MAGE_CLICK = {
    10: "particlePower",
    11: "pituitaryCapacity",
    12: "cardiovascular",
    13: "particleRefraction",
    14: "finalDamageReduction"
};
var BODY_CLICK = {
    18: "meleeDamage",
    19: "maxHealth",
    20: "armor",
    21: "toughness",
    22: "speed",
    23: "reach"
};

var activeInventories = new java.util.HashSet();
/** inv -> { uuid, stats, dirty }  加点草稿，关闭时写盘 */
var sessionByInv = new java.util.HashMap();
var _listenerRegistered = false;
var MAGE_API = null;

function loadMageCore() {
    // 每次优先对齐全局单例（补充剂/施术可能已热更过核心）
    try {
        if (PLUGIN.gltcMageApi != null
            && typeof PLUGIN.gltcMageApi.spendPotentialOnData === "function"
            && typeof PLUGIN.gltcMageApi.getTotalStatsFromBase === "function"
            && typeof PLUGIN.gltcMageApi.getEquipmentBonuses === "function"
            && typeof PLUGIN.gltcMageApi.getCurrentParticles === "function") {
            MAGE_API = PLUGIN.gltcMageApi;
            return true;
        }
    } catch (ePref) {}
    if (MAGE_API && typeof MAGE_API.spendPotentialOnData === "function"
        && typeof MAGE_API.getTotalStatsFromBase === "function"
        && typeof MAGE_API.getEquipmentBonuses === "function"
        && typeof MAGE_API.getCurrentParticles === "function") return true;
    MAGE_API = null;
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
            if (exported && typeof exported.spendPotentialOnData === "function"
                && typeof exported.getTotalStatsFromBase === "function") {
                MAGE_API = exported;
                try { PLUGIN.gltcMageApi = exported; } catch (eSet) {}
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
    var json = '{"textures":{"SKIN":{"url":"http://textures.minecraft.net/texture/' + hashStr + '"}}}';
    var b64 = java.util.Base64.getEncoder().encodeToString(toUtf8Bytes(json));
    var uid = java.util.UUID.nameUUIDFromBytes(toUtf8Bytes("gltc-slot-" + hashStr));
    try {
        var head = new ItemStack(Material.PLAYER_HEAD, 1);
        var meta = head.getItemMeta();
        var profile = null;
        try { profile = Bukkit.createProfile(uid, "GLTC"); } catch (e0) {
            try { profile = Bukkit.createPlayerProfile(uid, "GLTC"); } catch (e1) {}
        }
        if (profile != null) {
            var ProfilePropertyClass = null;
            try { ProfilePropertyClass = Java.type("org.bukkit.profile.ProfileProperty"); } catch (e2) {
                try { ProfilePropertyClass = Java.type("com.destroystokyo.paper.profile.ProfileProperty"); } catch (e3) {}
            }
            if (ProfilePropertyClass != null) {
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
                    try {
                        meta.getClass().getMethod("setPlayerProfile", Java.type("org.bukkit.profile.PlayerProfile"))
                            .invoke(meta, profile);
                    } catch (e8) {
                        try { meta.setPlayerProfile(profile); } catch (e9) {
                            try { meta.setOwnerProfile(profile); } catch (e10) {}
                        }
                    }
                    head.setItemMeta(meta);
                    return head;
                }
            }
        }
    } catch (eA) {}

    // 方案 B：GameProfile 写入 SkullMeta.profile
    try {
        var headB = new ItemStack(Material.PLAYER_HEAD, 1);
        var metaB = headB.getItemMeta();
        var GameProfile = Java.type("com.mojang.authlib.GameProfile");
        var Property = Java.type("com.mojang.authlib.properties.Property");
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
                return headB;
            } catch (eF) {}
        }
        // 沿父类再找一次
        try {
            var f2 = cls.getSuperclass().getDeclaredField("profile");
            f2.setAccessible(true);
            f2.set(metaB, gp);
            headB.setItemMeta(metaB);
            return headB;
        } catch (eF2) {}
    } catch (eB) {}

    // 方案 C：1.21 DataComponents.PROFILE
    try {
        var headC = new ItemStack(Material.PLAYER_HEAD, 1);
        var CraftItemStack = Java.type("org.bukkit.craftbukkit.inventory.CraftItemStack");
        var nmsItem = CraftItemStack.asNMSCopy(headC);
        var DataComponents = Java.type("net.minecraft.core.component.DataComponents");
        var ResolvableProfile = Java.type("net.minecraft.world.item.component.ResolvableProfile");
        var GameProfileC = Java.type("com.mojang.authlib.GameProfile");
        var PropertyC = Java.type("com.mojang.authlib.properties.Property");
        var gpC = new GameProfileC(uid, "GLTC");
        gpC.getProperties().put("textures", new PropertyC("textures", b64));
        var resolvable = null;
        try { resolvable = new ResolvableProfile(gpC); } catch (eR) {
            try { resolvable = ResolvableProfile.createResolved(gpC); } catch (eR2) {}
        }
        if (resolvable != null) {
            nmsItem.set(DataComponents.PROFILE, resolvable);
            return CraftItemStack.asBukkitCopy(nmsItem);
        }
    } catch (eC) {}

    try {
        Bukkit.getLogger().warning("[GLTC术士] 空槽头颅生成失败 hash=" + hashStr.substring(0, 12) + "...");
    } catch (eLog) {}
    return null;
}

function buildEmptySlot(slotDef) {
    var name = "§5" + slotDef.label;
    var loreArr = [
        "§7类型：§f" + categoryDisplayName(slotDef.category),
        "§e左键拿起对应类型组件后点此装备",
        "§e空手点击已装备槽可卸下"
    ];
    var hash = slotDef ? slotDef.skullHash : null;
    var skull = hash ? skullFromHash(hash) : null;
    if (skull != null) {
        try {
            var meta = skull.getItemMeta();
            if (meta != null) {
                meta.setDisplayName(name);
                meta.setLore(java.util.Arrays.asList(loreArr));
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
    return MAGE_API.getPlayerStats(player.getUniqueId().toString());
}

function getSpentPts(base, pool, statKey) {
    try {
        if (typeof MAGE_API.ensureSpentMaps === "function") MAGE_API.ensureSpentMaps(base);
    } catch (e0) {}
    var map = pool === "body" ? base.bodySpent : base.mageSpent;
    if (!map) return 0;
    return Math.max(0, Math.floor(Number(map[statKey]) || 0));
}

function getEquipBonuses(player) {
    try {
        if (typeof MAGE_API.getEquipmentBonuses === "function") {
            return MAGE_API.getEquipmentBonuses(player.getUniqueId().toString()) || {};
        }
    } catch (e) {}
    return {};
}

function hardCapOf(statKey, isPct) {
    try {
        var caps = MAGE_API.HARD_CAPS;
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
        if (typeof MAGE_API.ensureSpentMaps === "function") MAGE_API.ensureSpentMaps(base);
    } catch (eEns) {}

    var total;
    if (session && session.stats && typeof MAGE_API.getTotalStatsFromBase === "function") {
        total = MAGE_API.getTotalStatsFromBase(player, session.stats);
    } else {
        try { MAGE_API.invalidatePlayerCache(player.getUniqueId().toString()); } catch (eInv) {}
        total = MAGE_API.getTotalStats(player, true);
    }
    var equip = getEquipBonuses(player);
    var mageOpt = MAGE_API.MAGE_POINT_OPTIONS || {};
    var bodyOpt = MAGE_API.BODY_POINT_OPTIONS || {};
    var gli = MAGE_API.getGLI();
    var saveTip = (session && session.dirty) ? descLine("※ 有未保存修改，关闭后写入") : null;

    inv.setItem(STAT_SLOTS.level, pane(Material.EXPERIENCE_BOTTLE, "§d术士等级 §f+ " + formatNum(total.mageLevel), [
        descLine("驭粒熟练度：" + formatNum(total.proficiency)),
        descLine("环数 ＜ 术士等级：粒子消耗减半（取整，最低1）"),
        descLine("环数 ＞ 术士等级：释放时计算侵蚀等级：环数 - 术士等级"),
        descLine("释放时，粒子消耗*侵蚀等级倍，且受到侵蚀等级*20%最大生命的脉冲伤害"),
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
    inv.setItem(STAT_SLOTS.capacity, buildAttrPane(
        Material.GLASS_BOTTLE, "§b", "松垂体容量", total.pituitaryCapacity,
        ["提升粒子容量上限，施术会消耗粒子"],
        getSpentPts(base, "mage", "pituitaryCapacity"),
        (mageOpt.pituitaryCapacity && mageOpt.pituitaryCapacity.per) || 8,
        Number(equip.pituitaryCapacity) || 0, false,
        optMaxPoints(mageOpt.pituitaryCapacity),
        hardCapOf("pituitaryCapacity", false)
    ));
    inv.setItem(STAT_SLOTS.cardio, buildAttrPane(
        Material.REDSTONE, "§c", "心血管强度", total.cardiovascular,
        [
            "提升供氧与心血管系统强度，减少术式冷却",
            "当前术式的最终冷却比例： " + formatPct(Math.max(0.01, 1 - (Number(total.cardiovascular) || 0)))
        ],
        getSpentPts(base, "mage", "cardiovascular"),
        (mageOpt.cardiovascular && mageOpt.cardiovascular.per) || 0.02,
        Number(equip.cardiovascular) || 0, true,
        optMaxPoints(mageOpt.cardiovascular) || 20,
        hardCapOf("cardiovascular", true)
    ));
    inv.setItem(STAT_SLOTS.refraction, buildAttrPane(
        Material.PRISMARINE_CRYSTALS, "§3", "粒子折射", total.particleRefraction,
        ["折射粒子射流，减少受到的粒子伤害"],
        getSpentPts(base, "mage", "particleRefraction"),
        (mageOpt.particleRefraction && mageOpt.particleRefraction.per) || 0.03,
        Number(equip.particleRefraction) || 0, true,
        optMaxPoints(mageOpt.particleRefraction) || 20,
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

    var manaLore = [
        descLine("受松垂体容量影响，能通过引导术式与道具补充")
    ];
    if (saveTip) manaLore.push(saveTip);
    inv.setItem(STAT_SLOTS.mana, pane(Material.LAPIS_LAZULI,
        "§9当前粒子 §f+ " + formatNum(total.currentParticles) + "/" + formatNum(total.pituitaryCapacity), manaLore));

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
        (bodyOpt.meleeDamage && bodyOpt.meleeDamage.per) || 1,
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
        optMaxPoints(bodyOpt.armor) || 15,
        hardCapOf("armor", false)
    ));
    inv.setItem(STAT_SLOTS.toughness, buildAttrPane(
        Material.NETHERITE_CHESTPLATE, "§f", "体态掌控", total.toughness,
        ["进一步擢升椎反应与身体协调","提升韧性白值"],
        getSpentPts(base, "body", "toughness"),
        (bodyOpt.toughness && bodyOpt.toughness.per) || 0.5,
        Number(equip.toughness) || 0, false,
        optMaxPoints(bodyOpt.toughness) || 20,
        hardCapOf("toughness", false)
    ));
    inv.setItem(STAT_SLOTS.speed, buildAttrPane(
        Material.SUGAR, "§f", "心肺强化", total.speed,
        ["全方位强化氧转化与肌肉活性","提升速度白值"],
        getSpentPts(base, "body", "speed"),
        (bodyOpt.speed && bodyOpt.speed.per) || 0.01,
        Number(equip.speed) || 0, false,
        optMaxPoints(bodyOpt.speed) || 32,
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

function syncAllRelatedData(player, refillParticles) {
    if (!player || !(player instanceof Player)) return;
    if (!loadMageCore() || !MAGE_API) return;
    var uuid = String(player.getUniqueId().toString());
    try { MAGE_API.invalidatePlayerCache(uuid); } catch (e0) {}
    try { MAGE_API.applyMageAttributes(player); } catch (e1) {}
    try {
        if (refillParticles && typeof MAGE_API.refillParticlesToCap === "function") {
            MAGE_API.refillParticlesToCap(player);
        } else if (typeof MAGE_API.getTotalStats === "function") {
            var stats = MAGE_API.getTotalStats(player, true);
            var cur = Number(MAGE_API.getCurrentParticles(uuid)) || 0;
            var cap = Number(stats.pituitaryCapacity) || 0;
            if (cur > cap) MAGE_API.setCurrentParticles(uuid, cap);
        }
    } catch (e2) {}
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
    // 打开前刷新全部相关数据
    syncAllRelatedData(player, false);

    var uuid = String(player.getUniqueId().toString());
    var inv = Bukkit.createInventory(null, 54, GUI_TITLE);
    var stats = cloneData(MAGE_API.getPlayerStats(uuid));
    try {
        if (typeof MAGE_API.ensureSpentMaps === "function") MAGE_API.ensureSpentMaps(stats);
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
    var session = getSession(inv);
    if (!session || !session.stats) return false;

    if (raw === STAT_SLOTS.resetPts) {
        var rr = MAGE_API.resetAllPotentialsOnData(session.stats);
        if (!rr.ok) { player.sendMessage(GLTC_PREFIX + "§c" + rr.msg); return true; }
        session.dirty = true;
        player.sendMessage(GLTC_PREFIX + "§a已重置潜能：§d术士 +" + rr.mage + " §7/ §a体能 +" + rr.body
            + " §7(现有 §d" + rr.mageLeft + " §7/ §a" + rr.bodyLeft + "§7) §8(待关闭保存)");
        refreshStatIcons(inv, player);
        return true;
    }
    if (MAGE_CLICK[raw]) {
        var r = MAGE_API.spendPotentialOnData(session.stats, "mage", MAGE_CLICK[raw]);
        if (!r.ok) { player.sendMessage(GLTC_PREFIX + "§c" + r.msg); return true; }
        session.dirty = true;
        player.sendMessage(GLTC_PREFIX + "§a术士潜能：§f" + r.msg + " §7(剩余 " + r.left + ") §8(待关闭保存)");
        refreshStatIcons(inv, player);
        return true;
    }
    if (BODY_CLICK[raw]) {
        var r2 = MAGE_API.spendPotentialOnData(session.stats, "body", BODY_CLICK[raw]);
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
        try { MAGE_API.invalidatePlayerCache(uuid); } catch (e0) {}
        var ok = MAGE_API.savePlayerStats(uuid, session.stats);
        if (ok) player.sendMessage(GLTC_PREFIX + "§a潜能改动已写入。");
        else player.sendMessage(GLTC_PREFIX + "§c潜能写入失败。");
    }
    // 关闭时刷新属性；不再回满粒子（否则施术后关菜单会把消耗吞掉）
    syncAllRelatedData(player, false);
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
                        player.sendMessage(GLTC_PREFIX + "§c请将组件数量分离为 1 后再装备。");
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
                    try { MAGE_API.invalidatePlayerCache(uuid); } catch (eEq0) {}
                    try { MAGE_API.applyMageAttributes(player); } catch (eEq1) {}
                    event.setCursor(null);
                    top.setItem(defs[idx].gui, one.clone());
                    refreshStatIcons(top, player);
                    player.sendMessage(GLTC_PREFIX + "§a已装备至 §e" + defs[idx].label);
                    return;
                }

                if (equippedB64) {
                    var item = MAGE_API.itemFromBase64(equippedB64);
                    gear.slots[idx] = null;
                    MAGE_API.savePlayerGear(uuid, gear);
                    try { MAGE_API.invalidatePlayerCache(uuid); } catch (eUn0) {}
                    try { MAGE_API.applyMageAttributes(player); } catch (eUn1) {}
                    top.setItem(defs[idx].gui, buildEmptySlot(defs[idx]));
                    if (item) giveOrDrop(player, item);
                    refreshStatIcons(top, player);
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
            var session = null;
            try { session = sessionByInv.remove(inv); } catch (e0) {
                try { session = sessionByInv.get(inv); sessionByInv.remove(inv); } catch (e1) {}
            }
            var p = event.getPlayer();
            if (p instanceof Player && MAGE_API) {
                if (session) commitMageSession(p, session);
                else syncAllRelatedData(p, false);
            }
        }, PLUGIN
    );
}

registerListeners();
function tick(info) {}
