
var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var InventoryDragEvent = Java.type("org.bukkit.event.inventory.InventoryDragEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var Particle = Java.type("org.bukkit.Particle");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;

// ---------------- 可调参数 ----------------
var MACHINE_ID = "skey_舰体订单发布机";     // 机器ID
var ORDER_ITEM_ID = "skey_订单";             // 生成的订单物品ID
var INPUT_ITEM_ID = "skey_空白订单";         // 消耗的材料ID
var GUI_TITLE = "§b舰体订单发布机";

// 第1行（0-8）中间7格：空白订单投入槽
var INPUT_SLOTS = [1, 2, 3, 4, 5, 6, 7];
// 第2行（9-17）：左=生成1个/生成7个，中=书架说明书，右=生成28个
var BUTTON_1_SLOT = 10;
var BUTTON_7_SLOT = 11;
var INFO_SLOT = 13;
var BUTTON_28_SLOT = 15;
// 第3~6行（18-26 / 27-35 / 36-44 / 45-53）中间各7格：订单输出区（共28格）
var OUTPUT_SLOTS = [
    19, 20, 21, 22, 23, 24, 25,
    28, 29, 30, 31, 32, 33, 34,
    37, 38, 39, 40, 41, 42, 43,
    46, 47, 48, 49, 50, 51, 52
];

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var DATA_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/舰体货币");
if (!DATA_DIR.exists()) DATA_DIR.mkdirs();

var SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");
// 订单数据 PDC Key（供日后交付机器读取）
var ORDER_LEVEL_KEY = new NamespacedKey("gltc", "order_level");
var ORDER_ITEMS_KEY = new NamespacedKey("gltc", "order_items");
var ORDER_REWARD_I_KEY = new NamespacedKey("gltc", "order_reward_i");
var ORDER_REWARD_V_KEY = new NamespacedKey("gltc", "order_reward_v");
var ORDER_REWARD_X_KEY = new NamespacedKey("gltc", "order_reward_x");

var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] ";

// #RRGGBB → §x§R§R§G§G§B§B（脚本内 setLore 只认 § 码）
function hex(color) {
    var s = "§x";
    for (var i = 0; i < color.length; i++) {
        s += "§" + color.charAt(i).toLowerCase();
    }
    return s;
}

var C_I = hex("6f7dff");      // I级/ I等货币 蓝
var C_V = hex("ff8f4d");      // V级/ V等货币 橙
var C_X = hex("ff3d3d");      // X级/ X等货币 红
var C_GOLD = hex("fff5b3");   // 描述正文 淡金

// 将 RSC 配置中的 & 颜色码转换为运行时 § 码（含 &#RRGGBB hex）
function translateCodes(s) {
    if (!s) return "";
    var out = String(s);
    out = out.replace(/&#([0-9a-fA-F]{6})/g, function(full, h) {
        var r = "§x";
        for (var i = 0; i < 6; i++) r += "§" + h.charAt(i);
        return r;
    });
    out = out.replace(/&([0-9a-fk-or])/g, "§$1");
    return out;
}

// ---------------- 舰体货币数据读写（模仿能源流信用点系统） ----------------

/**
 * 读取玩家舰体货币 {I, V, X}
 */
function getShipCurrency(uuid) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    if (!file.exists()) return {I: 0, V: 0, X: 0};
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
        var data = JSON.parse(charBuffer.toString());
        return {I: data.I || 0, V: data.V || 0, X: data.X || 0};
    } catch (e) {
        return {I: 0, V: 0, X: 0};
    }
}

/**
 * 保存玩家舰体货币
 */
function setShipCurrency(uuid, data) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    try {
        var lines = new java.util.ArrayList();
        lines.add(JSON.stringify({I: data.I || 0, V: data.V || 0, X: data.X || 0}, null, 2));
        Files.write(file.toPath(), lines, StandardCharsets.UTF_8);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC] 保存舰体货币失败 uuid=" + uuid + ": " + e);
    }
}

/**
 * 增加玩家某档舰体货币
 * @param type "I" | "V" | "X"
 */
// 全局共享锁（挂在插件对象上，与接收机/访问站共用），防止并发读写同一货币文件丢更新
function getCurrencyLock() {
    if (PLUGIN.gltcCurrencyLock == null) PLUGIN.gltcCurrencyLock = new java.lang.Object();
    return PLUGIN.gltcCurrencyLock;
}

function addShipCurrency(uuid, type, amount) {
    return Java.synchronized(getCurrencyLock(), function() {
        var data = getShipCurrency(uuid);
        if (type === "I") data.I += amount;
        else if (type === "V") data.V += amount;
        else if (type === "X") data.X += amount;
        setShipCurrency(uuid, data);
        return data;
    })();
}

// ---------------- 订单随机生成参数 ----------------

var LEVEL_NAMES = {
    1: {text: "I级", color: C_I},
    2: {text: "V级", color: C_V},
    3: {text: "X级", color: C_X}
};

var CURRENCY_STYLE = {
    "I": {name: "I等货币", color: C_I},
    "V": {name: "V等货币", color: C_V},
    "X": {name: "X等货币", color: C_X}
};

// 等级 → 报酬货币类型：每一级订单交付后只提供与自己等级相同的报酬
var LEVEL_CURRENCY = {
    1: "I",
    2: "V",
    3: "X"
};

// 订单级 → 允许的需求类别（三级订单目前无食物与装备）
var LEVEL_CATEGORIES = {
    1: ["食物", "矿物", "装备", "机器"],   // 一级：原版物品
    2: ["食物", "矿物", "装备", "机器"],   // 二级：第一阶段势力
    3: ["矿物", "机器"]                     // 三级：skey 第二阶段
};

// 二级订单定价区：第一阶段势力物品（类别{品质等级: 价值}）
var STAGE1_PRICES = {
    "食物": {1: 1, 2: 2, 3: 5},
    "矿物": {1: 1, 2: 1, 3: 3},
    "装备": {1: 1, 2: 2, 3: 6},
    "机器": {1: 2, 2: 4, 3: 5}
};

// 三级订单定价区：skey（第二阶段）势力物品（类别{品质等级: 价值}）
var STAGE2_PRICES = {
    "食物": {1: 1, 2: 2, 3: 3},
    "矿物": {1: 1, 2: 2, 3: 3},
    "装备": {1: 1, 2: 2, 3: 4},
    "机器": {1: 2, 2: 3, 3: 5}
};

// 势力物品需求数量区间：类别[min, max]（装备与机器固定1）
var LEVEL_COUNTS = {
    "食物": [1, 3],
    "矿物": [1, 6],
    "装备": [1, 1],
    "机器": [1, 1]
};

// 一级订单：原版物品池（每个价值1~3，数量5~16）
var VANILLA_POOLS = {
    "食物": ["apple", "bread", "cooked_beef", "cooked_porkchop", "cooked_chicken", "cooked_cod", "cooked_salmon", "baked_potato", "cooked_mutton", "cooked_rabbit", "pumpkin_pie", "cookie", "melon_slice", "carrot", "golden_carrot", "mushroom_stew", "beetroot_soup", "dried_kelp", "sweet_berries", "honey_bottle"],
    "矿物": ["iron_ingot", "gold_ingot", "copper_ingot", "diamond", "emerald", "coal", "redstone", "lapis_lazuli", "quartz", "amethyst_shard", "raw_iron", "raw_gold", "raw_copper", "iron_block", "gold_block", "copper_block", "diamond_block", "emerald_block", "coal_block", "redstone_block", "netherite_ingot", "netherite_scrap", "ancient_debris", "obsidian"],
    "装备": ["iron_sword", "iron_pickaxe", "iron_axe", "iron_helmet", "iron_chestplate", "iron_leggings", "iron_boots", "diamond_sword", "diamond_pickaxe", "diamond_axe", "diamond_helmet", "diamond_chestplate", "diamond_leggings", "diamond_boots", "bow", "crossbow", "shield", "golden_sword", "golden_pickaxe", "trident"],
    "机器": ["furnace", "blast_furnace", "smoker", "crafting_table", "piston", "sticky_piston", "dispenser", "dropper", "hopper", "observer", "redstone_repeater", "redstone_comparator", "tnt", "note_block", "jukebox", "beacon", "enchanting_table", "anvil", "brewing_stand", "cauldron", "stonecutter", "smithing_table", "target", "daylight_detector", "redstone_lamp", "chest", "barrel", "lever", "redstone_torch"]
};

// 二级订单：第一阶段势力物品池（类别{品质等级: [物品ID]}）
var STAGE1_POOLS = {
    "食物": {
        1: ["UMPV_酥脆大薯条", "UMPV_炭烤海螺", "UMPV_大盘煎蛋", "UMPV_久蒸大米饭", "UMPV_猛炸大薯条", "UMPV_肉糜煎蛋", "UMPV_烤厄索斯菜卷", "UMPV_酱烤岩兽串", "UMPV_瓜片炒餮头肉", "UMPV_翠玉卷心瓜片"],
        2: ["UMPV_屑切菜香肉盘", "UMPV_蘑菇萝卜厚炖", "UMPV_蛋炒鱼肉丝", "UMPV_狂野人生烤串", "UMPV_深海野兽", "UMPV_水煮虐王兽肉汤", "UMPV_大锅炖肉土豆"],
        3: ["UMPV_浮沉盐海的阖眸", "UMPV_菌萝香炖稻焖饭", "UMPV_苔香辣卤海鲜汤", "UMPV_海陆双菌酒生煎", "UMPV_黄金焗酱烤整羽", "UMPV_见手金果炸全腿", "UMPV_百香爆烤整身虐王排", "UMPV_灼金香烹餮汤锅", "UMPV_疯狂星期四", "UMPV_黄金炒饭"]
    },
    "矿物": {
        1: ["TSTl", "TSsy", "TSg", "TShh", "TSyy", "TSbd", "TStls", "TSnd", "TSjj", "TSgd", "TSxt"],
        2: ["TSTJ", "TSdbg", "TSbtl", "TSjld", "TSym", "TSld", "TSyd", "TSdd", "TSskd", "TSlks", "TSymy", "TSdjl", "TSgwhs", "TSthyy", "TSPJD", "TSCH", "TSSKD"],
        3: ["TShel", "TSmbh", "TSgls"]
    },
    "装备": {
        1: ["FKR_铋铲", "FKR_铋镐", "FKR_铋斧", "FKR_铋剑"],
        2: ["FKR_棉铂华镀层手斧", "FKR_棉铂华淬火匕首", "FKR_致密苦艾合金铲", "FKR_致密苦艾合金镐"],
        3: ["FKR_炽热星涡重斧", "FKR_炽热星涡砍刀", "FKR_通古斯制式步枪", "FKR_通古斯战壕霰弹", "FKR_通古斯涡轮式单兵机枪", "FKR_通古斯防御型脉冲手铳", "FKR_通古斯制式轨道信标投递器", "FKR_通古斯过载式步枪", "FKR_伏地", "FKR_ASPL", "FKR_隐兰狂玉唤剑葫"]
    },
    "机器": {
        1: ["tac1", "tac2", "tac3", "ATOcd1", "ATOcd2", "ATOsh1", "ATOsh2", "ATOrh1", "ATOgzq", "TACdw1", "TAChx1", "TACbz1"],
        2: ["tscyzj1", "tsgxdy1", "tsylg1", "tstyj1", "tszspt1", "tsmsft1", "tssyyl1", "tslhfy1", "TShjl1", "TSmlq1", "TSfj1", "TShc1", "LISlyj1", "LISyp1", "LISls1", "EAE_家用单元合成器", "EAE_一体融合器", "FKR_锻造锤", "UMPV_种子分析仪", "UMPV_密堆培育仓", "UMPV_富集舱", "UMPV_集束房", "UMPV_药草成分萃取台", "UMPV_厨房", "UMPV_营养分解机", "UMPV_营养分解机2"],
        3: ["OST_回收器", "OST_幼儿启蒙金属合成机", "OST_儿童玩具零件组装机", "OST_古代机器人益趣合成箱", "OST_工程师入门工具生产器", "OST_旧日魔法帽模拟器", "OST_弱辐益智科学套件", "HInet_网络通信零件产素器", "HInet_网络入门工具包", "HInet_网络管道批量生产床", "HInet_网络存储磁块转化器"]
    }
};

// 三级订单：skey（第二阶段）物品池（类别{品质等级: [物品ID]}）
var STAGE2_POOLS = {
    "矿物": {
        1: ["skey_能源土", "skey_离子锁定气", "skey_突变轻烯片岩", "skey_红铁原矿", "skey_火镎矿"],
        2: ["skey_GVS中坚矿族石料", "skey_致密尘埃颗粒", "skey_迷迭色流体", "skey_红铁锭"],
        3: ["skey_漩涡锭", "skey_毡星锭", "skey_红磁流钴锭", "skey_忒弥斯锭", "skey_纯净铂锭", "skey_禁闭纯钛合金", "skey_錾制重金锭", "skey_磁耀锇钢锭", "skey_镀铂电气合金锭", "skey_充能锿", "skey_伊甸红锭", "skey_深境燃子素钢锭", "skey_至纯风暴铱"]
    },
    "机器": {
        1: ["skey_小帮手1", "skey_信条轨道工厂"],
        2: ["skey_小帮手2", "skey_专注型合金锻炉", "skey_光刻机"],
        3: ["skey_小帮手3", "skey_十一号反应炉", "skey_重力集束熔炼房", "skey_红巨压力合成器", "skey_重型工业成型母机", "skey_深红远星级", "skey_灼热苍穹级", "skey_四目伏羲级"]
    }
};

var CATEGORY_NAMES = {
    "食物": hex("ff8f6c") + "食物",
    "矿物": hex("7ad3ed") + "矿物",
    "装备": hex("96d6a7") + "装备",
    "机器": hex("ffd258") + "机器"
};

// ---------------- 工具函数 ----------------

function rand(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function pickOne(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 去除物品名称/描述中的颜色代码
function stripColor(s) {
    if (!s) return "";
    var out = String(s);
    out = out.replace(/§x(?:§[0-9a-fA-F]){6}/g, "");
    out = out.replace(/&x(?:&[0-9a-fA-F]){6}/g, "");
    out = out.replace(/&#[0-9a-fA-F]{6}/g, "");
    out = out.replace(/&[0-9a-fA-FkKxXoOrRlLmMnN]/g, "");
    out = out.replace(/§[0-9a-fA-FkKxXoOrRlLmMnN]/g, "");
    out = out.replace(/§/g, "");
    return out;
}

// 从物品 PDC 读取 Slimefun ID（比 getByItem 更可靠）
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
        var sf = SlimefunItem.getByItem(stack);
        return sf ? sf.getId() : null;
    } catch (e) {
        return null;
    }
}

// 获取物品去色显示名（无则返回 null）
function getItemDisplayName(stack) {
    if (!stack) return null;
    try {
        var meta = stack.getItemMeta();
        if (meta && meta.hasDisplayName()) {
            var name = stripColor(meta.getDisplayName());
            return name || null;
        }
    } catch (e) {}
    return null;
}

// ID 大小写不敏感比较（RSC 注册物品时会把 ID 规范为大写）
function idEquals(actualId, expectedId) {
    if (!actualId || !expectedId) return false;
    return actualId.toLowerCase() === expectedId.toLowerCase();
}

// 按 ID 获取 SlimefunItem（带大写兜底）
function getItemById(id) {
    if (!id) return null;
    try {
        var sf = SlimefunItem.getById(id);
        if (sf) return sf;
        return SlimefunItem.getById(id.toUpperCase());
    } catch (e) {
        return null;
    }
}

// 判断是否为空白订单（粘液物品，按 ID 匹配）
function isBlankOrder(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    var id = getSlimefunId(stack);
    return !!id && idEquals(id, INPUT_ITEM_ID);
}

// 判断是否为订单物品：ID匹配 → 材质+名称兜底（双保险）
function isOrder(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    var id = getSlimefunId(stack);
    if (id && idEquals(id, ORDER_ITEM_ID)) return true;
    if (stack.getType() !== Material.BOOK) return false;
    var name = getItemDisplayName(stack);
    return name !== null && name.indexOf("订单") >= 0;
}

// 原版物品中文名映射表
var VANILLA_CN = {
    // 食物
    "apple": "苹果", "bread": "面包", "cooked_beef": "牛排", "cooked_porkchop": "熟猪排",
    "cooked_chicken": "熟鸡肉", "cooked_cod": "熟鳕鱼", "cooked_salmon": "熟鲑鱼",
    "baked_potato": "烤马铃薯", "cooked_mutton": "熟羊肉", "cooked_rabbit": "熟兔肉",
    "pumpkin_pie": "南瓜派", "cookie": "曲奇", "melon_slice": "西瓜片", "carrot": "胡萝卜",
    "golden_carrot": "金胡萝卜", "mushroom_stew": "蘑菇煲", "beetroot_soup": "甜菜汤",
    "dried_kelp": "干海带", "sweet_berries": "甜浆果", "honey_bottle": "蜂蜜瓶",
    // 矿物
    "iron_ingot": "铁锭", "gold_ingot": "金锭", "copper_ingot": "铜锭", "diamond": "钻石",
    "emerald": "绿宝石", "coal": "煤炭", "redstone": "红石粉", "lapis_lazuli": "青金石",
    "quartz": "下界石英", "amethyst_shard": "紫水晶碎片", "raw_iron": "粗铁", "raw_gold": "粗金",
    "raw_copper": "粗铜", "iron_block": "铁块", "gold_block": "金块", "copper_block": "铜块",
    "diamond_block": "钻石块", "emerald_block": "绿宝石块", "coal_block": "煤炭块",
    "redstone_block": "红石块", "netherite_ingot": "下界合金锭", "netherite_scrap": "下界合金碎片",
    "ancient_debris": "远古残骸", "obsidian": "黑曜石",
    // 装备
    "iron_sword": "铁剑", "iron_pickaxe": "铁镐", "iron_axe": "铁斧", "iron_helmet": "铁头盔",
    "iron_chestplate": "铁胸甲", "iron_leggings": "铁护腿", "iron_boots": "铁靴子",
    "diamond_sword": "钻石剑", "diamond_pickaxe": "钻石镐", "diamond_axe": "钻石斧",
    "diamond_helmet": "钻石头盔", "diamond_chestplate": "钻石胸甲", "diamond_leggings": "钻石护腿",
    "diamond_boots": "钻石靴子", "bow": "弓", "crossbow": "弩", "shield": "盾牌",
    "golden_sword": "金剑", "golden_pickaxe": "金镐", "trident": "三叉戟",
    // 机器 / 功能方块与红石组件
    "furnace": "熔炉", "blast_furnace": "高炉", "smoker": "烟熏炉", "crafting_table": "工作台",
    "piston": "活塞", "sticky_piston": "粘性活塞", "dispenser": "发射器", "dropper": "投掷器",
    "hopper": "漏斗", "observer": "侦测器", "redstone_repeater": "红石中继器",
    "redstone_comparator": "红石比较器", "tnt": "TNT", "note_block": "音符盒", "jukebox": "唱片机",
    "beacon": "信标", "enchanting_table": "附魔台", "anvil": "铁砧", "brewing_stand": "酿造台",
    "cauldron": "炼药锅", "stonecutter": "切石机", "smithing_table": "锻造台", "target": "标靶",
    "daylight_detector": "日光传感器", "redstone_lamp": "红石灯", "chest": "箱子", "barrel": "木桶",
    "lever": "拉杆", "redstone_torch": "红石火把"
};

// 原版物品显示名：优先中文映射，未收录则回退为英文可读名
function getMcItemName(id) {
    var cn = VANILLA_CN[id];
    if (cn) return cn;
    return String(id).replace(/_/g, " ").replace(/\b\w/g, function(c) {
        return c.toUpperCase();
    });
}

// 获取物品显示名：isMc=true 时按原版材质名，否则取粘液物品去色名，失败回退ID
function getItemName(id, isMc) {
    if (isMc) return getMcItemName(id);
    try {
        var sf = getItemById(id);
        if (sf) {
            var meta = sf.getItem().getItemMeta();
            if (meta && meta.hasDisplayName()) {
                var name = stripColor(meta.getDisplayName());
                if (name) return name;
            }
        }
    } catch (e) {}
    return id;
}

// ---------------- 订单生成 ----------------

// 等级随机：生成1张均匀分布；生成7张时 2级概率50%；生成28张时 3级概率50%
function rollLevel(count) {
    var r = Math.random();
    if (count >= 28) {
        if (r < 0.50) return 3;
        if (r < 0.75) return 1;
        return 2;
    }
    if (count >= 7) {
        if (r < 0.50) return 2;
        if (r < 0.75) return 1;
        return 3;
    }
    if (r < 0.3333) return 1;
    if (r < 0.6667) return 2;
    return 3;
}

// 随机选取符合订单等级的物品（1~3种，不同种类不重复）
function pickItemsForLevel(level, count) {
    var categories = LEVEL_CATEGORIES[level];
    var items = [];
    var seen = {};
    var attempts = 0;
    while (items.length < count && attempts < 200) {
        attempts++;
        var cat = pickOne(categories);
        var id, tier = 0;
        if (level === 1) {
            // 原版物品：无品质等级，每个价值1~3，数量3~9（装备固定1个）
            id = pickOne(VANILLA_POOLS[cat]);
            if (seen[id]) continue;
            seen[id] = true;
            var amount = cat === "装备" ? 1 : rand(3, 9);
            items.push({category: cat, itemId: id, isMc: true, amount: amount, value: rand(1, 3), tier: 0});
        } else {
            // 势力物品：按品质等级抽取，价格与数量按等级固定
            var poolMap = level === 2 ? STAGE1_POOLS : STAGE2_POOLS;
            var priceMap = level === 2 ? STAGE1_PRICES : STAGE2_PRICES;
            tier = rand(1, 3);
            var pool = poolMap[cat][tier];
            if (!pool || pool.length === 0) continue;
            id = pickOne(pool);
            if (seen[cat + "|" + id]) continue;
            seen[cat + "|" + id] = true;
            var range = LEVEL_COUNTS[cat];
            var value = priceMap[cat][tier];
            items.push({category: cat, itemId: id, isMc: false, amount: rand(range[0], range[1]), value: value, tier: tier});
        }
    }
    return items;
}

function generateOrder(count) {
    var level = rollLevel(count);
    var itemCount = rand(1, 3);
    var items = pickItemsForLevel(level, itemCount);
    if (items.length === 0) return null;

    // 报酬 = 所有物品价值之和；每出现一种物品，报酬提升20%（向上取整）
    var value = 0;
    for (var i = 0; i < items.length; i++) value += items[i].value;
    // 物品数量>1时，按"第2种起每种+20%"逐次向上取整叠加
    if (items.length > 1) {
        var boosted = value;
        for (var j = 1; j < items.length; j++) {
            boosted = Math.ceil(boosted * 1.20);
        }
        value = boosted;
    }

    return {
        level: level,
        items: items,
        rewardType: LEVEL_CURRENCY[level],
        rewardAmount: value
    };
}

// 报酬文本：每一级订单只显示对应等级的单一货币
function buildRewardText(level, amount) {
    var cs = CURRENCY_STYLE;
    var name = cs[LEVEL_CURRENCY[level]].name;
    return cs[LEVEL_CURRENCY[level]].color + name + " §fx" + amount;
}
var STAFF_NAMES = ["时任行政舰长", "GEG首席工程师", "夏氏人员组联络员", "C7仓物资管理员", "能源系统管理部", "滞域体系研发部", "窗口维系部", "K区甲板维护部","群山反应堆控制部","新生星系联络部","衍生窗口观测部","舰体民生管理部","行政管理部","工农作业部","特种器材开发部","月砧","菜粥","洛水","小C","洛水","卷心菜大帝","土豆","牛子豪","谶欢", "鬼鬼", "香蕉哥"];
var STAFF_PHRASES = ["你出生在新生星系，可能不懂人之领有多大：整个银河系都曾是它的影子。", "你需要的话我能给你整点铱钢壳子，对，造星门的那个。", "兄弟，打金不？", "我们这边...算了你尽快吧，不太急。", "要我说，星门的崩溃就是人为的，不过都外界都过去几亿年了，不好说啊...", "工程师，可以的话多捎点...嗨，多大点事。", "这个订单我费了老大劲才说服他们让我上，能快点吗？", "..吃吃吃就知道吃！...诶忘闭麦了...需求发给你了。", "你问星门？那玩意可牛逼了，你现在和我们交易的系统就是那玩意的超超超级迷你版。", "人之领没了...还刚好在我们陷入滞留域的时候，巧合...？", "大崩溃？一时半会真说不清楚啊，你做好铱产线之后再联系我们。", "自从新生星系有联系之后，舰体上下真是开心坏了。", "最近咋样？这批要是方便就帮我留点，不急。", "工程师，这种你那边多不多？有的话下次一起带过来。", "上次那批不错，这批你再帮我盯着点，不过不用赶。", "我这边库存还行，你那边要是有富余的，分我点就行。", "这玩意最近挺抢手啊，你手里还有吗？没有就算了。", "兄弟，这批不急着用，你先忙你的，空了再弄。", "我就是问问，这种你还有没有存货，有就给我留一些。", "工程师，这批质量咋样？好的话我就多要点，不着急送。", "听说你那边刚到了一批？我这边需求不大，随便来点。", "这批我先预定了，但不用马上送，等你有空再说。", "最近辛苦了，这批不用太赶，下周之前给我就行。", "我这边不催你，这批你看着安排，有就行。", "你先把手头急的忙完，再管我这。", "这些东西我盼了好久了，兄弟，现在还有吗？", "别问了哥们，钱就这么多了，我这边真的急。", "我快撑不住了，就等您老嘞。", "有这批就稳了，谢了哥们。", "我需要这些东西，越快越好。", "如果你手头有，就全给我吧。", "东西一到就通知我，兄弟，有点急。", "我这边缺口很大，有多少来多少。", "工程师，这些东西用处很大。", "自从知道新生星系的事之后，我们的人都高兴坏了，哈哈。", "船上没有什么空间搞这玩意，我馋这些玩意很久了。", "需求发你了，就等这批物资了，辛苦快点！", "务必尽快送达！", "这些东西能补充一些库存，但不急缺。", "有最好，没有的话就算了。", "辛苦你保证这批物资的质量，用途比较重要。", "星期四到了啊...你懂我意思吧？", "霍，可以啊工程师，这玩意你也有。"];

// 订单物品模板：与 items.yml 中 skey_订单 的名称/描述保持一致（普通物品，非粘液物品）
var ORDER_NAME_TEMPLATE = "&#2998ff舰&#21a6ff体&#19b5ff需&#10c3ff求&#08d2ff订&#00e0ff单";
var ORDER_LORE_TEMPLATE = [
    "&b归属&9：&#6f7dffS&#8f9affe&#afb7ffk&#cfd4fft&#eff1ffh&#fbfbfbi&#f2f2f2y&#e9e9e9远&#e1e1e1航&#d8d8d8舰",
    "&#fff5b3一张订单，上面写着舰体当前所需的物质需求。",
    "&f————————————————————",
    "&f[&b订单等级&f]&#fff5b3%等级%",
    "&f[&b订单回报&f]&#fff5b3%报酬%",
    "&f[&b需求内容&f]",
    "%交易内容%",
    "&f————————————————————",
    "%话语%"
];

// 生成舰体人员的随机话语（1~2行）
function buildStaffDialogue(order) {
    var lines = new java.util.ArrayList();
    var count = rand(1, 2);
    for (var i = 0; i < count; i++) {
        var name = pickOne(STAFF_NAMES);
        var phrase = pickOne(STAFF_PHRASES);
        lines.add(translateCodes("&b" + name + "&f：&#fff5b3" + phrase));
    }
    return lines;
}

// 根据随机结果生成一张订单（普通 book 物品，非粘液物品），并将数据写入 PDC
function buildOrderItem(order) {
    var item = new ItemStack(Material.BOOK);
    var meta = item.getItemMeta();

    var lv = LEVEL_NAMES[order.level];
    var levelText = lv.color + lv.text;
    var rewardText = buildRewardText(order.level, order.rewardAmount);

    meta.setDisplayName(translateCodes(ORDER_NAME_TEMPLATE));

    var lore = new java.util.ArrayList();
    for (var li = 0; li < ORDER_LORE_TEMPLATE.length; li++) {
        var line = ORDER_LORE_TEMPLATE[li];
        if (line.indexOf("%交易内容%") >= 0) {
            // 交易内容占位：每个物品单独一行
            for (var mi = 0; mi < order.items.length; mi++) {
                var it = order.items[mi];
                lore.add(translateCodes(
                    CATEGORY_NAMES[it.category] + " §8▶ §e" + getItemName(it.itemId, it.isMc) + " §fx" + it.amount
                ));
            }
            continue;
        }
        if (line.indexOf("%话语%") >= 0) {
            // 舰体人员随机话语（1~2行）
            var dialogue = buildStaffDialogue(order);
            for (var dl = 0; dl < dialogue.size(); dl++) {
                lore.add(dialogue.get(dl));
            }
            continue;
        }
        line = line.replace("%等级%", levelText);
        line = line.replace("%报酬%", rewardText);
        lore.add(translateCodes(line));
    }
    meta.setLore(lore);

    var pdc = meta.getPersistentDataContainer();
    pdc.set(ORDER_LEVEL_KEY, PersistentDataType.INTEGER, order.level);
    pdc.set(ORDER_ITEMS_KEY, PersistentDataType.STRING, JSON.stringify(order.items));
    pdc.set(ORDER_REWARD_I_KEY, PersistentDataType.INTEGER, order.rewardType === "I" ? order.rewardAmount : 0);
    pdc.set(ORDER_REWARD_V_KEY, PersistentDataType.INTEGER, order.rewardType === "V" ? order.rewardAmount : 0);
    pdc.set(ORDER_REWARD_X_KEY, PersistentDataType.INTEGER, order.rewardType === "X" ? order.rewardAmount : 0);

    item.setItemMeta(meta);
    return item;
}

// ---------------- GUI 构建 ----------------

var BG_ITEM;
(function() {
    BG_ITEM = new ItemStack(Material.BLUE_STAINED_GLASS_PANE);
    var meta = BG_ITEM.getItemMeta();
    meta.setDisplayName("§0");
    BG_ITEM.setItemMeta(meta);
})();

// 输入槽不再放置占位符物品：留空，玩家可直接放入/取出空白订单

var INFO_ITEM;
(function() {
    INFO_ITEM = new ItemStack(Material.BOOKSHELF);
    var meta = INFO_ITEM.getItemMeta();
    meta.setDisplayName("§b§l▣ 舰体订单发布机");
    meta.setLore(java.util.Arrays.asList(
        "§7第1行投入 §e空白订单§7，",
        "§7按下按钮将分别生成：§a1张§7 / §e7张§7 / §c28张 §7订单。",
        "§7订单等级 I/V/X 级，报酬以 I/V/X 等货币结算。"
    ));
    INFO_ITEM.setItemMeta(meta);
})();

var BUTTON_ITEMS = {};
(function() {
    var defs = {
        1:  {mat: Material.LIME_STAINED_GLASS_PANE, name: "§a§l✔ 生成 1 张", lore: ["§7消耗 §e1张空白订单§7 生成1张订单"]},
        7:  {mat: Material.YELLOW_STAINED_GLASS_PANE, name: "§e§l✔ 生成 7 张", lore: ["§7消耗 §e7张空白订单§7 生成7张订单"]},
        28: {mat: Material.RED_STAINED_GLASS_PANE, name: "§c§l✔ 生成 28 张", lore: ["§7消耗 §e28张空白订单§7 生成28张订单", "§7将填满下方全部输出区"]}
    };
    for (var n in defs) {
        var d = defs[n];
        var it = new ItemStack(d.mat);
        var meta = it.getItemMeta();
        meta.setDisplayName(d.name);
        meta.setLore(java.util.Arrays.asList(d.lore));
        it.setItemMeta(meta);
        BUTTON_ITEMS[n] = it;
    }
})();

var activeInventories = new java.util.HashSet();
var _listenerRegistered = false;

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var inv = Bukkit.createInventory(null, 54, GUI_TITLE);
    // 仅边框填底色，输出区保持空白
    var BORDER_SLOTS = [0, 8, 9, 12, 14, 16, 17, 18, 26, 27, 35, 36, 44, 45, 53];
    for (var b = 0; b < BORDER_SLOTS.length; b++) {
        inv.setItem(BORDER_SLOTS[b], BG_ITEM.clone());
    }
    // 第1行：空白订单投入槽（留空，玩家直接放入空白订单）
    // 第2行：说明书 + 生成按钮
    inv.setItem(BUTTON_1_SLOT, BUTTON_ITEMS[1].clone());
    inv.setItem(BUTTON_7_SLOT, BUTTON_ITEMS[7].clone());
    inv.setItem(INFO_SLOT, INFO_ITEM.clone());
    inv.setItem(BUTTON_28_SLOT, BUTTON_ITEMS[28].clone());
    // 第3~6行：输出区初始为空

    activeInventories.add(inv);
    player.openInventory(inv);
}

// ---------------- 核心生成逻辑 ----------------

function countInputLogs(inv) {
    var total = 0;
    for (var i = 0; i < INPUT_SLOTS.length; i++) {
        var it = inv.getItem(INPUT_SLOTS[i]);
        if (isBlankOrder(it)) total += it.getAmount();
    }
    return total;
}

function consumeLogs(inv, count) {
    var remain = count;
    for (var i = 0; i < INPUT_SLOTS.length && remain > 0; i++) {
        var it = inv.getItem(INPUT_SLOTS[i]);
        if (!isBlankOrder(it)) continue;
        if (it.getAmount() <= remain) {
            remain -= it.getAmount();
            inv.setItem(INPUT_SLOTS[i], null);
        } else {
            it.setAmount(it.getAmount() - remain);
            remain = 0;
        }
    }
}

function placeOrders(player, inv, orderItems) {
    // 先填满输出槽
    for (var i = 0; i < orderItems.length; i++) {
        var placed = false;
        for (var j = 0; j < OUTPUT_SLOTS.length; j++) {
            var slot = OUTPUT_SLOTS[j];
            var cur = inv.getItem(slot);
            if (!cur || cur.getType() === Material.AIR) {
                inv.setItem(slot, orderItems[i]);
                placed = true;
                break;
            }
        }
        if (!placed) {
            // 输出槽已满：放入玩家背包，背包满则掉落（用 Java 迭代器遍历，避免 for...in 对 HashMap 取 null）
            var leftover = player.getInventory().addItem(orderItems[i]);
            var dropIt = leftover.values().iterator();
            while (dropIt.hasNext()) {
                player.getWorld().dropItemNaturally(player.getLocation(), dropIt.next());
            }
        }
    }
}

function processGenerate(player, inv, count) {
    var total = countInputLogs(inv);
    if (total < count) {
        player.sendMessage(GLTC_PREFIX + "§c空白订单不足！需要 §e" + count + "张§c，当前仅 §e" + total + "§c张。");
        return;
    }
    consumeLogs(inv, count);

    var items = [];
    for (var i = 0; i < count; i++) {
        var order = generateOrder(count);
        if (!order) continue;
        var oi = buildOrderItem(order);
        if (oi) items.push(oi);
    }
    if (items.length === 0) {
        player.sendMessage(GLTC_PREFIX + "§c生成订单失败：无法获取 §e" + ORDER_ITEM_ID + " §c物品！");
        return;
    }
    placeOrders(player, inv, items);

    // 特效
    var loc = player.getLocation();
    try { loc.getWorld().spawnParticle(Particle.ENCHANTMENT_TABLE, loc, 30, 0.4, 0.4, 0.4, 0.6); } catch (e) {}
    try { loc.getWorld().playSound(loc, "block.enchantment_table.use", 0.8, 1.2); } catch (e) {}
    try { loc.getWorld().playSound(loc, "entity.experience_orb.pickup", 0.6, 1.3); } catch (e) {}

    player.sendMessage(GLTC_PREFIX + "§b对接成功！已接收 §f" + items.length + "§b 张订单！");
}

// ---------------- 事件监听注册 ----------------

function registerListeners() {
    if (_listenerRegistered) return;
    _listenerRegistered = true;

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();

    // InventoryClickEvent
    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var topInv = event.getView().getTopInventory();
            if (!activeInventories.contains(topInv)) return;

            var player = event.getWhoClicked();
            if (!(player instanceof Player)) return;

            var clickedInv = event.getClickedInventory();
            var slot = event.getRawSlot();

            if (clickedInv === topInv) {
                // 生成按钮：仅普通点击生效；忽略 shift 点击，防止连点刷单
                if (slot === BUTTON_1_SLOT || slot === BUTTON_7_SLOT || slot === BUTTON_28_SLOT) {
                    event.setCancelled(true);
                    if (event.isShiftClick()) return;
                    var count = slot === BUTTON_1_SLOT ? 1 : (slot === BUTTON_7_SLOT ? 7 : 28);
                    processGenerate(player, topInv, count);
                    return;
                }
                // 输入槽 / 输出槽：完全放行，交给原生交互（普通点击与 shift 移动均为原版安全逻辑）
                var isFree = false;
                for (var i = 0; i < INPUT_SLOTS.length; i++) {
                    if (INPUT_SLOTS[i] === slot) { isFree = true; break; }
                }
                if (!isFree) {
                    for (var j = 0; j < OUTPUT_SLOTS.length; j++) {
                        if (OUTPUT_SLOTS[j] === slot) { isFree = true; break; }
                    }
                }
                if (isFree) return;
                // 其它槽位（边框/书架说明书）：禁止交互
                event.setCancelled(true);
                return;
            }
            // 底部背包：不拦截任何点击
        }, PLUGIN
    );

    // InventoryDragEvent
    Bukkit.getPluginManager().registerEvent(
        InventoryDragEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var topInv = event.getView().getTopInventory();
            if (!activeInventories.contains(topInv)) return;
            event.setCancelled(true);
        }, PLUGIN
    );

    // InventoryCloseEvent
    Bukkit.getPluginManager().registerEvent(
        InventoryCloseEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            var inv = event.getInventory();
            if (!activeInventories.contains(inv)) return;

            var player = event.getPlayer();
            if (player instanceof Player) {
                // 无条件返还输入槽所有物品（保证绝不吞东西）
                for (var i = 0; i < INPUT_SLOTS.length; i++) {
                    var it = inv.getItem(INPUT_SLOTS[i]);
                    if (it && it.getType() !== Material.AIR) {
                        var leftover = player.getInventory().addItem(it);
                        var dropIt = leftover.values().iterator();
                        while (dropIt.hasNext()) {
                            player.getWorld().dropItemNaturally(player.getLocation(), dropIt.next());
                        }
                        inv.setItem(INPUT_SLOTS[i], null);
                    }
                }
                // 无条件返还输出槽所有物品
                for (var j = 0; j < OUTPUT_SLOTS.length; j++) {
                    var oi = inv.getItem(OUTPUT_SLOTS[j]);
                    if (oi && oi.getType() !== Material.AIR) {
                        var leftover2 = player.getInventory().addItem(oi);
                        var dropIt2 = leftover2.values().iterator();
                        while (dropIt2.hasNext()) {
                            player.getWorld().dropItemNaturally(player.getLocation(), dropIt2.next());
                        }
                        inv.setItem(OUTPUT_SLOTS[j], null);
                    }
                }
            }
            activeInventories.remove(inv);
        }, PLUGIN
    );
}

// ---------------- tick: 空实现 ----------------

function tick(info) {
}

// ---------------- 脚本加载时注册监听 ----------------

registerListeners();
