/**
 * ATO 音效检视终端
 * 右键打开 GUI：浏览全部原版音效，左键试听，右键复制 ID
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Sound = Java.type("org.bukkit.Sound");
var Listener = Java.type("org.bukkit.event.Listener");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var InventoryCloseEvent = Java.type("org.bukkit.event.inventory.InventoryCloseEvent");
var InventoryDragEvent = Java.type("org.bukkit.event.inventory.InventoryDragEvent");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var LISTENER_KEY = "gltcSoundBrowserListener";
var TITLE_PREFIX = "§8ATO音效库 ";
var PAGE_SIZE = 45;
var PREV_SLOT = 52;
var NEXT_SLOT = 53;
var PITCH_UP_SLOT = 50;
var PITCH_DOWN_SLOT = 51;
var PITCH_MIN = 0.5;
var PITCH_MAX = 2.0;
var PITCH_STEP = 0.1;
var SOUND_KEY = new NamespacedKey("gltc", "sound_browser_id");

var openPlayers = new java.util.HashSet();
var PAGE_MAP = new java.util.HashMap();
var PITCH_MAP = new java.util.HashMap();
var PAGE_SWITCHING = new java.util.HashSet();
var SOUND_CACHE = null;
var registered = false;

var SOURCE_NAMES = {
    ambient: "环境 Ambient",
    block: "方块 Block",
    enchant: "附魔 Enchant",
    entity: "实体 Entity",
    event: "事件 Event",
    item: "物品 Item",
    music: "音乐 Music",
    particle: "粒子 Particle",
    ui: "界面 UI",
    weather: "天气 Weather",
    intentionally_empty: "空占位"
};

/** 路径单词 → 中文 */
var ZH_WORD = {
    ambient: "环境", underwater: "水下", loop: "循环", additions: "附加", rare: "稀有",
    ultra_rare: "极稀有", cave: "洞穴", basalt_deltas: "玄武岩三角洲", crimson_forest: "绯红森林",
    nether_wastes: "下界荒地", soul_sand_valley: "灵魂沙峡谷", warped_forest: "诡异森林",
    weather: "天气", rain: "雨", thunder: "雷电", end_flash: "末地闪光",
    block: "方块", item: "物品", entity: "实体", event: "事件", enchant: "附魔",
    particle: "粒子", ui: "界面", music: "音乐",
    break: "破坏", place: "放置", hit: "击打", fall: "落地", step: "脚步",
    ambient_land: "着陆", death: "死亡", hurt: "受伤", splash: "溅起", swim: "游泳",
    attack: "攻击", shoot: "射击", explode: "爆炸", ignite: "点燃", extinguish: "熄灭",
    open: "打开", close: "关闭", click: "点击", button: "按钮", toast: "提示",
    drink: "饮用", eat: "进食", pickup: "拾取", throw: "投掷", drop: "丢弃",
    equip: "装备", shear: "剪毛", flap: "振翅", fly: "飞行", land: "着陆",
    roar: "咆哮", growl: "低吼", snore: "打鼾", scream: "尖叫", laugh: "笑声",
    celebrate: "庆祝", trade: "交易", yes: "同意", no: "拒绝", work: "工作",
    convert: "转化", cure: "治愈", infect: "感染", teleport: "传送", stare: "凝视",
    scream: "尖叫", portal: "传送门", spawn: "生成", despawn: "消失",
    charge: "蓄力", primed: "引信", use: "使用", finish: "完成", insert: "放入",
    tip: "翻倒", empty: "倒空", fill: "装满", brew: "酿造", smelt: "熔炼",
    craft: "合成", grind: "研磨", smith: "锻造", anvil: "铁砧", enchant: "附魔",
    levelup: "升级", orb: "经验球", burp: "饱嗝", hiccup: "打嗝",
    breath: "呼吸", inhale: "吸气", exhale: "呼气", sniff: "嗅探",
    dig: "挖掘", climb: "攀爬", jump: "跳跃", slide: "滑行", roll: "翻滚",
    shake: "摇晃", rustle: "沙沙", creak: "吱嘎", chime: "钟鸣", bell: "铃铛",
    note: "音符", note_block: "音符盒", jukebox: "唱片机", goat_horn: "山羊角",
    wooden_door: "木门", iron_door: "铁门", wooden_trapdoor: "木活板门",
    fence_gate: "栅栏门", chest: "箱子", ender_chest: "末影箱", shulker_box: "潜影盒",
    barrel: "木桶", hopper: "漏斗", dispenser: "发射器", dropper: "投掷器",
    piston: "活塞", comparator: "比较器", lever: "拉杆", tripwire: "绊线",
    pressure_plate: "压力板", button: "按钮", beacon: "信标", conduit: "潮涌核心",
    sculk: "幽匿", sculk_sensor: "幽匿感测体", sculk_shrieker: "幽匿尖啸体",
    sculk_catalyst: "幽匿催发体", calibrated_sculk_sensor: "校频幽匿感测体",
    amethyst_block: "紫水晶块", amethyst_cluster: "紫水晶簇", budding_amethyst: "紫水晶母岩",
    stone: "石头", deepslate: "深板岩", netherrack: "下界岩", end_stone: "末地石",
    dirt: "泥土", grass: "草", sand: "沙子", gravel: "沙砾", snow: "雪",
    ice: "冰", glass: "玻璃", wool: "羊毛", wood: "木头", metal: "金属",
    ladder: "梯子", scaffold: "脚手架", honey: "蜂蜜", slime: "黏液",
    lava: "岩浆", water: "水", fire: "火", campfire: "营火", candle: "蜡烛",
    crop: "作物", pumpkin: "南瓜", melon: "西瓜", sweet_berry_bush: "甜浆果丛",
    nether_wart: "下界疣", chorus: "紫颂", bamboo: "竹子", azalea: "杜鹃",
    roots: "根系", fungi: "菌类", nylium: "菌岩", wart: "疣块",
    ancient_debris: "远古残骸", lodestone: "磁石", respawn_anchor: "重生锚",
    crying_obsidian: "哭泣的黑曜石", obsidian: "黑曜石", bedrock: "基岩",
    tnt: "TNT", powder_snow: "细雪", pointed_dripstone: "滴水石锥",
    dripstone_block: "滴水石块", big_dripleaf: "大型垂滴叶", small_dripleaf: "小型垂滴叶",
    hanging_roots: "垂根", moss: "苔藓", spore_blossom: "孢子花",
    frogspawn: "青蛙卵", mangrove_roots: "红树根", mud: "泥巴",
    decorated_pot: "饰纹陶罐", brush: "刷子", sniffer_egg: "嗅探兽蛋",
    trial_spawner: "试炼刷怪笼", vault: "宝库", crafter: "合成器",
    copper: "铜", copper_bulb: "铜灯", copper_door: "铜门", copper_grate: "铜格栅",
    copper_trapdoor: "铜活板门", oxidized: "氧化", waxed: "涂蜡",
    heavy_core: "沉重核心", mace: "锤", wind_charge: "风弹",
    generic: "通用", player: "玩家", villager: "村民", wandering_trader: "流浪商人",
    iron_golem: "铁傀儡", snow_golem: "雪傀儡", allay: "悦灵", armadillo: "犰狳",
    axolotl: "美西螈", bat: "蝙蝠", bee: "蜜蜂", blaze: "烈焰人",
    bogged: "沼骸", breeze: "旋风人", camel: "骆驼", cat: "猫",
    cave_spider: "洞穴蜘蛛", chicken: "鸡", cod: "鳕鱼", cow: "牛",
    creeper: "苦力怕", dolphin: "海豚", donkey: "驴", drowned: "溺尸",
    elder_guardian: "远古守卫者", ender_dragon: "末影龙", enderman: "末影人",
    endermite: "末影螨", evoker: "唤魔者", fox: "狐狸", frog: "青蛙",
    ghast: "恶魂", giant: "巨人", glow_squid: "发光鱿鱼", goat: "山羊",
    guardian: "守卫者", hoglin: "疣猪兽", horse: "马", husk: "尸壳",
    illusioner: "幻术师", llama: "羊驼", magma_cube: "岩浆怪", mooshroom: "哞菇",
    mule: "骡", ocelot: "豹猫", panda: "熊猫", parrot: "鹦鹉",
    phantom: "幻翼", pig: "猪", piglin: "猪灵", piglin_brute: "猪灵蛮兵",
    pillager: "掠夺者", polar_bear: "北极熊", pufferfish: "河豚", rabbit: "兔子",
    ravager: "劫掠兽", salmon: "鲑鱼", sheep: "绵羊", shulker: "潜影贝",
    silverfish: "蠹虫", skeleton: "骷髅", skeleton_horse: "骷髅马", slime: "史莱姆",
    sniffer: "嗅探兽", spider: "蜘蛛", squid: "鱿鱼", stray: "流浪者",
    strider: "炽足兽", tadpole: "蝌蚪", trader_llama: "行商羊驼",
    tropical_fish: "热带鱼", turtle: "海龟", vex: "恼鬼", vindicator: "卫道士",
    warden: "监守者", witch: "女巫", wither: "凋灵", wither_skeleton: "凋灵骷髅",
    wolf: "狼", zoglin: "僵尸疣猪兽", zombie: "僵尸", zombie_horse: "僵尸马",
    zombie_villager: "僵尸村民", zombified_piglin: "僵尸猪灵",
    boat: "船", minecart: "矿车", fishing_bobber: "浮漂", arrow: "箭",
    spectral_arrow: "光灵箭", snowball: "雪球", egg: "鸡蛋", ender_pearl: "末影珍珠",
    eye_of_ender: "末影之眼", experience_orb: "经验球", firework_rocket: "烟花火箭",
    item_frame: "物品展示框", glow_item_frame: "荧光物品展示框", leash_knot: "拴绳结",
    lightning_bolt: "闪电", painting: "画", potion: "药水", trident: "三叉戟",
    firework: "烟花", armor: "盔甲", axe: "斧", hoe: "锄", shovel: "铲",
    sword: "剑", shield: "盾", crossbow: "弩", bow: "弓", elytra: "鞘翅",
    bundle: "收纳袋", book: "书", bottle: "瓶子", bucket: "桶",
    chorus_fruit: "紫颂果", dye: "染料", firecharge: "火焰弹", flintandsteel: "打火石",
    glow_ink_sac: "荧光墨囊", honeycomb: "蜜脾", honey_bottle: "蜂蜜瓶",
    lodestone_compass: "磁石指针", nether_wart: "下界疣", spyglass: "望远镜",
    totem: "图腾", armor_equip: "装备盔甲", brush: "刷洗",
    raid: "袭击", raid_horn: "袭击号角", mob_effect: "状态效果",
    click_fail: "点击失败", cartography_table: "制图台", loom: "织布机",
    stonecutter: "切石机", smithing_table: "锻造台", grindstone: "砂轮",
    blastfurnace: "高炉", smoker: "烟熏炉", furnace: "熔炉", brewing_stand: "酿造台",
    compost: "堆肥", bee_nest: "蜂巢", beehive: "蜂箱",
    door: "门", trapdoor: "活板门", gate: "门扉", sign: "告示牌",
    hanging_sign: "悬挂告示牌", glow_lichen: "发光地衣", vine: "藤蔓",
    weeping_vines: "垂泪藤", twisting_vines: "缠怨藤",
    netherite: "下界合金", diamond: "钻石", gold: "金", iron: "铁",
    leather: "皮革", chain: "锁链", turtle_egg: "海龟蛋",
    attack_wooden_door: "敲打木门", attack_iron_door: "敲打铁门",
    break_wooden_door: "砸坏木门", destroy_egg: "破坏蛋",
    converted_to_drowned: "转化为溺尸", convert_to_drowned: "转化为溺尸",
    prepared_convert: "准备转化", cast: "抛竿", retrieve: "收竿",
    bobber: "浮漂", reel: "卷线", splash: "落水",
    small: "小型", large: "大型", medium: "中型",
    add_item: "放入物品", take_item: "取出物品",
    activate: "激活", deactivate: "关闭", power: "充能",
    shatter: "碎裂", resonate: "共鸣", chime: "叮咚",
    mirror: "镜像", reflect: "反射", deflect: "弹开",
    inhale: "吸入", sonic_boom: "声波轰鸣", dig: "挖掘",
    emerge: "破土", heartbeat: "心跳", listening: "聆听",
    nearby_close: "邻近靠近", nearby_closer: "更近", nearby_closest: "最近",
    roar: "咆哮", sniff: "嗅探", tendril_clicks: "触须咔哒",
    agitated: "躁动", angry: "愤怒", retreat: "撤退", step_lava: "熔岩脚步",
    step_sand: "沙地脚步", eat: "进食", milk: "挤奶", saddle: "上鞍",
    gallop: "疾驰", soft: "轻踏", wood: "木制", land: "落地",
    armor: "护甲", breathe: "呼吸", flop: "扑腾",
    squirt: "喷射", glow: "发光", sting: "叮刺", pollinate: "授粉",
    loop_additions: "循环附加", mood: "氛围",
    intentionally_empty: "空占位",
    raid_horn: "袭击号角", illager: "灾厄村民",
    firework_blast: "烟花爆破", firework_blast_far: "远处烟花爆破",
    firework_large_blast: "大型烟花爆破", firework_large_blast_far: "远处大型烟花爆破",
    firework_launch: "烟花发射", firework_twinkle: "烟花闪烁",
    firework_twinkle_far: "远处烟花闪烁",
    bolt: "闪电", impact: "撞击",
    ui_toast_challenge_complete: "挑战完成提示",
    ui_toast_in: "提示出现", ui_toast_out: "提示消失",
    button_click_on: "按钮开启", button_click_off: "按钮关闭",
    hotbar_select: "快捷栏选择", inventory: "物品栏"
};

/** 动作短名（用于物品名） */
var ZH_ACTION_NAME = {
    ambient: "环境音", hurt: "受伤", death: "死亡", step: "脚步", break: "破坏",
    place: "放置", hit: "击打", fall: "落地", attack: "攻击", shoot: "射击",
    explode: "爆炸", open: "打开", close: "关闭", click: "点击", use: "使用",
    splash: "溅水", swim: "游泳", fly: "飞行", land: "着陆", roar: "咆哮",
    growl: "低吼", scream: "尖叫", teleport: "传送", spawn: "生成",
    equip: "装备", drink: "饮用", eat: "进食", throw: "投掷", pickup: "拾取",
    ignite: "点燃", extinguish: "熄灭", charge: "蓄力", primed: "引信",
    convert: "转化", infect: "感染", shear: "剪毛", flap: "振翅",
    celebrate: "庆祝", trade: "交易", work: "工作", snore: "打鼾",
    inhale: "吸气", exhale: "呼气", sniff: "嗅探", dig: "挖掘",
    jump: "跳跃", climb: "攀爬", slide: "滑行", shake: "摇晃",
    fill: "装满", empty: "倒空", insert: "放入", finish: "完成",
    activate: "激活", deactivate: "停用", shatter: "碎裂", resonate: "共鸣",
    heartbeat: "心跳", sonic_boom: "声波轰鸣", emerge: "破土而出",
    listening: "聆听", nearby_close: "邻近", nearby_closer: "更近",
    nearby_closest: "最近", tendril_clicks: "触须声", angry: "愤怒",
    retreat: "撤退", gallop: "疾驰", milk: "挤奶", saddle: "上鞍",
    sting: "叮刺", pollinate: "授粉", squirt: "喷射", flop: "扑腾",
    breathe: "呼吸", glow: "发光", burp: "饱嗝", levelup: "升级",
    add_item: "放入", take_item: "取出", tip: "翻倒", brew: "酿造",
    cast: "抛竿", retrieve: "收竿", reel_in: "收线", bobber_splash: "浮漂落水",
    attack_wooden_door: "敲木门", attack_iron_door: "敲铁门",
    break_wooden_door: "砸木门", destroy_egg: "破坏蛋",
    converted_to_drowned: "变溺尸", prepare_convert_to_drowned: "准备变溺尸"
};

/** 动作描述（用于 lore） */
var ZH_ACTION_DESC = {
    ambient: "空闲时随机播放",
    hurt: "受伤时播放",
    death: "死亡时播放",
    step: "行走踩踏时播放",
    break: "被破坏时播放",
    place: "被放置时播放",
    hit: "被挖掘击中时播放",
    fall: "从高处落下时播放",
    attack: "发动攻击时播放",
    shoot: "发射投射物时播放",
    explode: "发生爆炸时播放",
    open: "被打开时播放",
    close: "被关闭时播放",
    click: "被点击/切换时播放",
    use: "被使用时播放",
    splash: "入水溅起时播放",
    swim: "游泳移动时播放",
    fly: "飞行时播放",
    land: "着陆时播放",
    roar: "咆哮时播放",
    growl: "发出低吼时播放",
    scream: "尖叫时播放",
    teleport: "传送时播放",
    spawn: "生成时播放",
    equip: "装备穿戴时播放",
    drink: "饮用时播放",
    eat: "进食时播放",
    throw: "投掷时播放",
    pickup: "拾取时播放",
    ignite: "被点燃时播放",
    extinguish: "熄灭时播放",
    charge: "蓄力时播放",
    primed: "引信点燃时播放",
    convert: "发生转化时播放",
    infect: "感染时播放",
    shear: "被剪毛时播放",
    flap: "振翅时播放",
    celebrate: "庆祝时播放",
    trade: "交易时播放",
    work: "工作时播放",
    snore: "打鼾时播放",
    inhale: "吸气时播放",
    exhale: "呼气时播放",
    sniff: "嗅探时播放",
    dig: "挖掘时播放",
    jump: "跳跃时播放",
    climb: "攀爬时播放",
    slide: "滑行时播放",
    shake: "摇晃时播放",
    fill: "被装满时播放",
    empty: "被倒空时播放",
    insert: "放入物品时播放",
    finish: "完成时播放",
    activate: "激活时播放",
    deactivate: "停用时播放",
    shatter: "碎裂时播放",
    resonate: "共鸣时播放",
    heartbeat: "心跳律动时播放",
    sonic_boom: "释放声波轰鸣时播放",
    emerge: "破土而出时播放",
    listening: "进入聆听状态时播放",
    angry: "进入愤怒状态时播放",
    retreat: "撤退时播放",
    gallop: "疾驰时播放",
    milk: "被挤奶时播放",
    saddle: "装上鞍具时播放",
    sting: "叮刺时播放",
    pollinate: "授粉时播放",
    squirt: "喷射时播放",
    flop: "在陆地扑腾时播放",
    breathe: "呼吸时播放",
    glow: "发光时播放",
    burp: "吃饱打嗝时播放",
    levelup: "升级时播放",
    add_item: "放入物品时播放",
    take_item: "取出物品时播放",
    tip: "翻倒时播放",
    brew: "酿造时播放",
    cast: "抛出鱼钩时播放",
    retrieve: "收回鱼钩时播放",
    attack_wooden_door: "敲打木门时播放",
    attack_iron_door: "敲打铁门时播放",
    break_wooden_door: "砸坏木门时播放",
    destroy_egg: "破坏蛋时播放",
    converted_to_drowned: "转化为溺尸时播放"
};

function zhToken(token) {
    if (!token) return "";
    var t = String(token).toLowerCase();
    if (ZH_WORD[t]) return ZH_WORD[t];
    if (ZH_ACTION_NAME[t]) return ZH_ACTION_NAME[t];
    var bits = t.split("_");
    if (bits.length > 1) {
        var out = "";
        for (var i = 0; i < bits.length; i++) {
            out += ZH_WORD[bits[i]] || ZH_ACTION_NAME[bits[i]] || bits[i];
        }
        return out;
    }
    return t;
}

function getChineseInfo(soundId) {
    var path = getSoundPath(soundId);
    var parts = path.split(".");
    var root = parts[0] || "";
    var name;
    var desc;
    var subject = "";
    var action = "";

    if (parts.length >= 3) {
        var mid = [];
        for (var i = 1; i < parts.length - 1; i++) mid.push(zhToken(parts[i]));
        subject = mid.join("");
        action = parts[parts.length - 1];
    } else if (parts.length === 2) {
        subject = zhToken(parts[1]);
        action = "";
    }

    var actionName = action ? (ZH_ACTION_NAME[action] || zhToken(action)) : "";
    if (subject && actionName) name = subject + "：" + actionName;
    else if (subject) name = (SOURCE_NAMES[root] ? SOURCE_NAMES[root].split(" ")[0] + "：" : "") + subject;
    else name = zhToken(root) || path;

    if (subject && action && ZH_ACTION_DESC[action]) {
        desc = subject + ZH_ACTION_DESC[action] + "的音效";
    } else if (subject && actionName) {
        desc = subject + "「" + actionName + "」相关的音效";
    } else if (subject) {
        desc = (SOURCE_NAMES[root] ? SOURCE_NAMES[root].split(" ")[0] : "游戏") + "「" + subject + "」相关的音效";
    } else {
        desc = (SOURCE_NAMES[root] ? SOURCE_NAMES[root].split(" ")[0] : "游戏") + "分类下的音效";
    }

    if (name.length > 30) name = name.substring(0, 28) + "…";
    return { name: name, desc: desc };
}

var ENTITY_ICON = {
    allay: "ALLAY_SPAWN_EGG",
    armadillo: "ARMADILLO_SPAWN_EGG",
    axolotl: "AXOLOTL_SPAWN_EGG",
    bat: "BAT_SPAWN_EGG",
    bee: "BEE_SPAWN_EGG",
    blaze: "BLAZE_SPAWN_EGG",
    bogged: "BOGGED_SPAWN_EGG",
    breeze: "BREEZE_SPAWN_EGG",
    camel: "CAMEL_SPAWN_EGG",
    cat: "CAT_SPAWN_EGG",
    cave_spider: "CAVE_SPIDER_SPAWN_EGG",
    chicken: "CHICKEN_SPAWN_EGG",
    cod: "COD_SPAWN_EGG",
    cow: "COW_SPAWN_EGG",
    creeper: "CREEPER_HEAD",
    dolphin: "DOLPHIN_SPAWN_EGG",
    donkey: "DONKEY_SPAWN_EGG",
    drowned: "DROWNED_SPAWN_EGG",
    elder_guardian: "ELDER_GUARDIAN_SPAWN_EGG",
    ender_dragon: "DRAGON_HEAD",
    enderman: "ENDERMAN_SPAWN_EGG",
    endermite: "ENDERMITE_SPAWN_EGG",
    evoker: "EVOKER_SPAWN_EGG",
    fox: "FOX_SPAWN_EGG",
    frog: "FROG_SPAWN_EGG",
    ghast: "GHAST_SPAWN_EGG",
    giant: "ZOMBIE_SPAWN_EGG",
    glow_squid: "GLOW_SQUID_SPAWN_EGG",
    goat: "GOAT_SPAWN_EGG",
    guardian: "GUARDIAN_SPAWN_EGG",
    hoglin: "HOGLIN_SPAWN_EGG",
    horse: "HORSE_SPAWN_EGG",
    husk: "HUSK_SPAWN_EGG",
    illusioner: "ILLUSIONER_SPAWN_EGG",
    iron_golem: "IRON_BLOCK",
    llama: "LLAMA_SPAWN_EGG",
    magma_cube: "MAGMA_CUBE_SPAWN_EGG",
    minecart: "MINECART",
    mooshroom: "MOOSHROOM_SPAWN_EGG",
    mule: "MULE_SPAWN_EGG",
    ocelot: "OCELOT_SPAWN_EGG",
    panda: "PANDA_SPAWN_EGG",
    parrot: "PARROT_SPAWN_EGG",
    phantom: "PHANTOM_SPAWN_EGG",
    pig: "PIG_SPAWN_EGG",
    piglin: "PIGLIN_HEAD",
    piglin_brute: "PIGLIN_BRUTE_SPAWN_EGG",
    pillager: "PILLAGER_SPAWN_EGG",
    player: "PLAYER_HEAD",
    polar_bear: "POLAR_BEAR_SPAWN_EGG",
    pufferfish: "PUFFERFISH_SPAWN_EGG",
    rabbit: "RABBIT_SPAWN_EGG",
    ravager: "RAVAGER_SPAWN_EGG",
    salmon: "SALMON_SPAWN_EGG",
    sheep: "SHEEP_SPAWN_EGG",
    shulker: "SHULKER_SPAWN_EGG",
    silverfish: "SILVERFISH_SPAWN_EGG",
    skeleton: "SKELETON_SKULL",
    skeleton_horse: "SKELETON_HORSE_SPAWN_EGG",
    slime: "SLIME_SPAWN_EGG",
    sniffer: "SNIFFER_SPAWN_EGG",
    snow_golem: "SNOW_BLOCK",
    spider: "SPIDER_SPAWN_EGG",
    squid: "SQUID_SPAWN_EGG",
    stray: "STRAY_SPAWN_EGG",
    strider: "STRIDER_SPAWN_EGG",
    tadpole: "TADPOLE_SPAWN_EGG",
    trader_llama: "TRADER_LLAMA_SPAWN_EGG",
    tropical_fish: "TROPICAL_FISH_SPAWN_EGG",
    turtle: "TURTLE_SPAWN_EGG",
    vex: "VEX_SPAWN_EGG",
    villager: "VILLAGER_SPAWN_EGG",
    vindicator: "VINDICATOR_SPAWN_EGG",
    wandering_trader: "WANDERING_TRADER_SPAWN_EGG",
    warden: "WARDEN_SPAWN_EGG",
    witch: "WITCH_SPAWN_EGG",
    wither: "WITHER_SKELETON_SKULL",
    wither_skeleton: "WITHER_SKELETON_SKULL",
    wolf: "WOLF_SPAWN_EGG",
    zoglin: "ZOGLIN_SPAWN_EGG",
    zombie: "ZOMBIE_HEAD",
    zombie_horse: "ZOMBIE_HORSE_SPAWN_EGG",
    zombie_villager: "ZOMBIE_VILLAGER_SPAWN_EGG",
    zombified_piglin: "ZOMBIFIED_PIGLIN_SPAWN_EGG",
    boat: "OAK_BOAT",
    fishing_bobber: "FISHING_ROD",
    item: "ITEM_FRAME",
    experience_orb: "EXPERIENCE_BOTTLE",
    firework_rocket: "FIREWORK_ROCKET",
    arrow: "ARROW",
    snowball: "SNOWBALL",
    egg: "EGG",
    ender_pearl: "ENDER_PEARL",
    eye_of_ender: "ENDER_EYE",
    potion: "POTION",
    lightning_bolt: "LIGHTNING_ROD",
    tnt: "TNT",
    generic: "STONE"
};

function getRscPlugin() {
    return Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer") || PLUGIN;
}

function item(matName, name, lore) {
    var mat = Material.matchMaterial(matName);
    if (mat == null || !mat.isItem()) mat = Material.NOTE_BLOCK;
    var it = new ItemStack(mat);
    var meta = it.getItemMeta();
    meta.setDisplayName(name);
    if (lore) meta.setLore(Array.isArray(lore) ? lore : [lore]);
    it.setItemMeta(meta);
    return it;
}

function resolveMat(name) {
    if (!name) return null;
    try {
        var m = Material.matchMaterial(String(name));
        if (m != null && m.isItem() && m !== Material.AIR) return m;
    } catch (e0) {}
    return null;
}

function getSoundId(sound) {
    try {
        if (sound.getKey) return String(sound.getKey().toString());
    } catch (e0) {}
    try {
        var n = String(sound.name()).toLowerCase();
        return "minecraft:" + n.replace(/_/g, ".");
    } catch (e1) {}
    return String(sound);
}

function getSoundPath(soundId) {
    var id = String(soundId || "");
    if (id.indexOf(":") >= 0) id = id.substring(id.indexOf(":") + 1);
    return id;
}

function getSourceInfo(soundId) {
    var path = getSoundPath(soundId);
    var parts = path.split(".");
    var root = parts[0] || "unknown";
    var label = SOURCE_NAMES[root] || ("其他 " + root);
    return { root: root, label: label, path: path };
}

function guessMaterial(soundId) {
    var path = getSoundPath(soundId);
    var parts = path.split(".");
    var root = parts[0] || "";
    var second = parts[1] || "";
    var mat;

    if (path.indexOf("note_block") >= 0) return Material.NOTE_BLOCK;
    if (path.indexOf("music_disc") >= 0 || root === "record" || second.indexOf("disc") >= 0) {
        mat = resolveMat("MUSIC_DISC_CAT");
        if (mat) return mat;
    }
    if (root === "ui") return resolveMat("COMPASS") || Material.NOTE_BLOCK;
    if (root === "weather") return resolveMat("WATER_BUCKET") || Material.NOTE_BLOCK;
    if (root === "ambient") return resolveMat("GRASS_BLOCK") || Material.NOTE_BLOCK;
    if (root === "enchant") return resolveMat("ENCHANTING_TABLE") || Material.NOTE_BLOCK;
    if (root === "particle") return resolveMat("BLAZE_POWDER") || Material.NOTE_BLOCK;
    if (root === "event") return resolveMat("BELL") || Material.NOTE_BLOCK;
    if (root === "music") return resolveMat("JUKEBOX") || Material.NOTE_BLOCK;

    if (root === "entity") {
        if (ENTITY_ICON[second]) {
            mat = resolveMat(ENTITY_ICON[second]);
            if (mat) return mat;
        }
        mat = resolveMat(second.toUpperCase() + "_SPAWN_EGG");
        if (mat) return mat;
        mat = resolveMat(second.toUpperCase());
        if (mat) return mat;
        return resolveMat("EGG") || Material.NOTE_BLOCK;
    }

    if (root === "block") {
        var blockName = second.toUpperCase();
        mat = resolveMat(blockName);
        if (mat) return mat;
        mat = resolveMat(blockName + "_BLOCK");
        if (mat) return mat;
        if (second === "water") return resolveMat("WATER_BUCKET") || Material.NOTE_BLOCK;
        if (second === "lava") return resolveMat("LAVA_BUCKET") || Material.NOTE_BLOCK;
        if (second === "fire" || second === "campfire") return resolveMat("CAMPFIRE") || Material.NOTE_BLOCK;
        if (second === "portal" || second === "end_portal") return resolveMat("END_PORTAL_FRAME") || Material.NOTE_BLOCK;
        if (second === "nether_portal") return resolveMat("OBSIDIAN") || Material.NOTE_BLOCK;
        if (second === "crop" || second === "sweet_berry_bush") return resolveMat("WHEAT") || Material.NOTE_BLOCK;
        if (second === "wool") return resolveMat("WHITE_WOOL") || Material.NOTE_BLOCK;
        if (second === "metal") return resolveMat("IRON_BLOCK") || Material.NOTE_BLOCK;
        if (second === "wood" || second === "wood_hanging_sign") return resolveMat("OAK_PLANKS") || Material.NOTE_BLOCK;
        if (second === "glass" || second === "glass_pane") return resolveMat("GLASS") || Material.NOTE_BLOCK;
        if (second === "anvil") return resolveMat("ANVIL") || Material.NOTE_BLOCK;
        if (second === "chest") return resolveMat("CHEST") || Material.NOTE_BLOCK;
        if (second === "beacon") return resolveMat("BEACON") || Material.NOTE_BLOCK;
        return resolveMat("STONE") || Material.NOTE_BLOCK;
    }

    if (root === "item") {
        mat = resolveMat(second.toUpperCase());
        if (mat) return mat;
        if (second === "armor") return resolveMat("IRON_CHESTPLATE") || Material.NOTE_BLOCK;
        if (second === "axe") return resolveMat("IRON_AXE") || Material.NOTE_BLOCK;
        if (second === "bottle") return resolveMat("GLASS_BOTTLE") || Material.NOTE_BLOCK;
        if (second === "book") return resolveMat("BOOK") || Material.NOTE_BLOCK;
        if (second === "bucket") return resolveMat("BUCKET") || Material.NOTE_BLOCK;
        if (second === "crossbow") return resolveMat("CROSSBOW") || Material.NOTE_BLOCK;
        if (second === "elytra") return resolveMat("ELYTRA") || Material.NOTE_BLOCK;
        if (second === "firecharge") return resolveMat("FIRE_CHARGE") || Material.NOTE_BLOCK;
        if (second === "flintandsteel") return resolveMat("FLINT_AND_STEEL") || Material.NOTE_BLOCK;
        if (second === "hoe") return resolveMat("IRON_HOE") || Material.NOTE_BLOCK;
        if (second === "shield") return resolveMat("SHIELD") || Material.NOTE_BLOCK;
        if (second === "shovel") return resolveMat("IRON_SHOVEL") || Material.NOTE_BLOCK;
        if (second === "totem") return resolveMat("TOTEM_OF_UNDYING") || Material.NOTE_BLOCK;
        if (second === "trident") return resolveMat("TRIDENT") || Material.NOTE_BLOCK;
        return resolveMat("STICK") || Material.NOTE_BLOCK;
    }

    return Material.NOTE_BLOCK;
}

function isMusicSound(soundId) {
    var path = getSoundPath(soundId).toLowerCase();
    if (path.indexOf("music.") === 0) return true;
    if (path.indexOf("music_disc.") === 0) return true;
    if (path.indexOf("record.") === 0) return true;
    if (path.indexOf(".music_disc.") >= 0) return true;
    return false;
}

function loadAllSounds() {
    if (SOUND_CACHE) return SOUND_CACHE;
    var list = [];
    function addSound(s) {
        var id = getSoundId(s);
        if (isMusicSound(id)) return;
        list.push({ sound: s, id: id });
    }
    try {
        if (typeof Sound.values === "function") {
            var vals = Sound.values();
            for (var i = 0; i < vals.length; i++) addSound(vals[i]);
        }
    } catch (e0) {}
    if (list.length === 0) {
        try {
            var Registry = Java.type("org.bukkit.Registry");
            var it = Registry.SOUNDS.iterator();
            while (it.hasNext()) addSound(it.next());
        } catch (e1) {}
    }
    list.sort(function (a, b) {
        return String(a.id).localeCompare(String(b.id));
    });
    SOUND_CACHE = list;
    return list;
}

function getPitch(player) {
    var p = PITCH_MAP.get(player.getUniqueId());
    if (p == null) return 1.0;
    return Number(p);
}

function setPitch(player, pitch) {
    pitch = Math.round(pitch * 10) / 10;
    if (pitch < PITCH_MIN) pitch = PITCH_MIN;
    if (pitch > PITCH_MAX) pitch = PITCH_MAX;
    PITCH_MAP.put(player.getUniqueId(), pitch);
    return pitch;
}

function formatPitch(pitch) {
    return (Math.round(Number(pitch) * 10) / 10).toFixed(1);
}

function makeTitle(page, totalPages, pitch) {
    return TITLE_PREFIX + "§7" + (page + 1) + "/" + totalPages + " §b音调" + formatPitch(pitch);
}

function isOurGui(title) {
    return title != null && String(title).indexOf("ATO音效库") >= 0;
}

function buildSoundItem(entry) {
    var src = getSourceInfo(entry.id);
    var zh = getChineseInfo(entry.id);
    var mat = guessMaterial(entry.id);
    var it = new ItemStack(mat);
    var meta = it.getItemMeta();
    meta.setDisplayName("§e" + zh.name);
    meta.setLore([
        "§7" + zh.desc,
        "§7来源: §b" + src.label,
        "§7ID: §f" + entry.id,
        "",
        "§a左键 §7播放此音效",
        "§d右键 §7复制 ID 到剪贴板"
    ]);
    try {
        meta.getPersistentDataContainer().set(SOUND_KEY, PersistentDataType.STRING, entry.id);
    } catch (e0) {}
    it.setItemMeta(meta);
    return it;
}

function buildMenu(player, page) {
    var sounds = loadAllSounds();
    var totalPages = Math.max(1, Math.ceil(sounds.length / PAGE_SIZE));
    if (page < 0) page = 0;
    if (page >= totalPages) page = totalPages - 1;
    var pitch = getPitch(player);
    var inv = Bukkit.createInventory(null, 54, makeTitle(page, totalPages, pitch));

    var start = page * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, sounds.length);
    for (var i = start; i < end; i++) {
        inv.setItem(i - start, buildSoundItem(sounds[i]));
    }

    var black = item("BLACK_STAINED_GLASS_PANE", "§8 ", [
        "§7共 §f" + sounds.length + " §7个音效",
        "§7当前页 §f" + (page + 1) + "/" + totalPages,
        "§7当前音调 §b" + formatPitch(pitch)
    ]);
    for (var s = 45; s <= 49; s++) inv.setItem(s, black.clone());

    inv.setItem(PITCH_UP_SLOT, item("LIGHT_BLUE_STAINED_GLASS_PANE", "§b⬆ 调高音调", [
        "§7当前: §b" + formatPitch(pitch),
        "§7范围: §f" + PITCH_MIN + " ~ " + PITCH_MAX,
        "§7步进: §f+" + PITCH_STEP
    ]));
    inv.setItem(PITCH_DOWN_SLOT, item("PURPLE_STAINED_GLASS_PANE", "§d⬇ 调低音调", [
        "§7当前: §b" + formatPitch(pitch),
        "§7范围: §f" + PITCH_MIN + " ~ " + PITCH_MAX,
        "§7步进: §f-" + PITCH_STEP
    ]));
    inv.setItem(PREV_SLOT, item("LIME_STAINED_GLASS_PANE", "§a← 上一页", [
        page > 0 ? "§7前往第 §f" + page + " §7页" : "§8已是第一页"
    ]));
    inv.setItem(NEXT_SLOT, item("LIME_STAINED_GLASS_PANE", "§a下一页 →", [
        page < totalPages - 1 ? "§7前往第 §f" + (page + 2) + " §7页" : "§8已是最后一页"
    ]));

    return inv;
}

function openMenu(player, inv) {
    PAGE_SWITCHING.add(player);
    player.openInventory(inv);
    PAGE_SWITCHING.remove(player);
    openPlayers.add(player);
    ensureListener();
}

function reopen(player) {
    var page = PAGE_MAP.get(player) || 0;
    openMenu(player, buildMenu(player, page));
}

function playEntry(player, entry) {
    var pitch = getPitch(player);
    try {
        player.playSound(player.getLocation(), entry.sound, 1.0, pitch);
    } catch (e0) {
        try {
            player.playSound(player.getLocation(), entry.id, 1.0, pitch);
        } catch (e1) {
            player.sendMessage("§c无法播放: §f" + entry.id);
            return;
        }
    }
    try {
        var Component = Java.type("net.kyori.adventure.text.Component");
        var NamedTextColor = Java.type("net.kyori.adventure.text.format.NamedTextColor");
        player.sendActionBar(Component.text("♪ " + entry.id + "  音调" + formatPitch(pitch), NamedTextColor.AQUA));
    } catch (e2) {
        player.sendMessage("§b♪ §f" + entry.id + " §7音调 §b" + formatPitch(pitch));
    }
}

function findEntryById(id) {
    var sounds = loadAllSounds();
    for (var i = 0; i < sounds.length; i++) {
        if (sounds[i].id === id) return sounds[i];
    }
    return null;
}

function copySoundId(player, soundId) {
    var ok = false;
    try {
        var Component = Java.type("net.kyori.adventure.text.Component");
        var ClickEvent = Java.type("net.kyori.adventure.text.event.ClickEvent");
        var HoverEvent = Java.type("net.kyori.adventure.text.event.HoverEvent");
        var NamedTextColor = Java.type("net.kyori.adventure.text.format.NamedTextColor");
        var msg = Component.text("[ATO音效库] ", NamedTextColor.GOLD)
            .append(Component.text("点击复制 ID: ", NamedTextColor.GRAY))
            .append(
                Component.text(soundId, NamedTextColor.AQUA)
                    .clickEvent(ClickEvent.copyToClipboard(soundId))
                    .hoverEvent(HoverEvent.showText(Component.text("点击复制到系统剪贴板", NamedTextColor.YELLOW)))
            );
        player.sendMessage(msg);
        ok = true;
    } catch (e0) {}
    if (!ok) {
        try {
            var TextComponent = Java.type("net.md_5.bungee.api.chat.TextComponent");
            var BungeeClick = Java.type("net.md_5.bungee.api.chat.ClickEvent");
            var BungeeHover = Java.type("net.md_5.bungee.api.chat.HoverEvent");
            var ComponentBuilder = Java.type("net.md_5.bungee.api.chat.ComponentBuilder");
            var tc = new TextComponent("§6[ATO音效库] §7点击复制 ID: §b" + soundId);
            tc.setClickEvent(new BungeeClick(BungeeClick.Action.COPY_TO_CLIPBOARD, soundId));
            tc.setHoverEvent(new BungeeHover(
                BungeeHover.Action.SHOW_TEXT,
                new ComponentBuilder("点击复制到系统剪贴板").create()
            ));
            player.spigot().sendMessage(tc);
            ok = true;
        } catch (e1) {}
    }
    if (!ok) {
        player.sendMessage("§6[ATO音效库] §7音效 ID: §b" + soundId);
    } else {
        player.sendMessage("§a已发送可复制消息，点击聊天栏中的 ID 即可复制。");
    }
}

function ensureListener() {
    if (registered) return;
    var rsc = getRscPlugin();
    if (!rsc) return;

    var old = rsc[LISTENER_KEY];
    if (old) {
        try { InventoryClickEvent.getHandlerList().unregister(old); } catch (eU0) {}
        try { InventoryCloseEvent.getHandlerList().unregister(old); } catch (eU1) {}
        try { InventoryDragEvent.getHandlerList().unregister(old); } catch (eU2) {}
        rsc[LISTENER_KEY] = null;
    }

    var L = Java.extend(Listener, {});
    var listener = new L();

    Bukkit.getPluginManager().registerEvent(InventoryClickEvent, listener, EventPriority.NORMAL, function (l, e) {
        try {
            var p = e.getWhoClicked();
            if (!openPlayers.contains(p)) return;
            if (!isOurGui(e.getView().getTitle())) return;
            var topInv = e.getView().getTopInventory();
            var clickedInv = e.getClickedInventory();
            if (clickedInv !== topInv) {
                if (clickedInv === e.getView().getBottomInventory() && e.isShiftClick()) e.setCancelled(true);
                return;
            }
            e.setCancelled(true);
            var slot = e.getSlot();
            var cur = e.getCurrentItem();
            if (!cur || cur.getType() === Material.AIR) return;

            if (slot === PREV_SLOT) {
                var page = PAGE_MAP.get(p) || 0;
                if (page > 0) {
                    PAGE_MAP.put(p, page - 1);
                    reopen(p);
                }
                return;
            }
            if (slot === NEXT_SLOT) {
                var page2 = PAGE_MAP.get(p) || 0;
                var total = Math.max(1, Math.ceil(loadAllSounds().length / PAGE_SIZE));
                if (page2 < total - 1) {
                    PAGE_MAP.put(p, page2 + 1);
                    reopen(p);
                }
                return;
            }
            if (slot === PITCH_UP_SLOT) {
                setPitch(p, getPitch(p) + PITCH_STEP);
                reopen(p);
                return;
            }
            if (slot === PITCH_DOWN_SLOT) {
                setPitch(p, getPitch(p) - PITCH_STEP);
                reopen(p);
                return;
            }
            if (slot >= 45) return;

            var soundId = null;
            try {
                var meta = cur.getItemMeta();
                if (meta) soundId = meta.getPersistentDataContainer().get(SOUND_KEY, PersistentDataType.STRING);
            } catch (eKey) {}
            if (!soundId) {
                var page3 = PAGE_MAP.get(p) || 0;
                var idx = page3 * PAGE_SIZE + slot;
                var sounds = loadAllSounds();
                if (idx >= 0 && idx < sounds.length) soundId = sounds[idx].id;
            }
            if (!soundId) return;

            var entry = findEntryById(soundId);
            if (!entry) entry = { sound: soundId, id: soundId };

            if (e.isRightClick()) {
                copySoundId(p, soundId);
                return;
            }
            if (e.isLeftClick()) {
                playEntry(p, entry);
            }
        } catch (err) {
            print("[ATO音效库] 点击错误: " + err);
        }
    }, rsc);

    Bukkit.getPluginManager().registerEvent(InventoryCloseEvent, listener, EventPriority.NORMAL, function (l, e) {
        var p = e.getPlayer();
        if (PAGE_SWITCHING.contains(p)) return;
        openPlayers.remove(p);
        PAGE_MAP.remove(p);
    }, rsc);

    Bukkit.getPluginManager().registerEvent(InventoryDragEvent, listener, EventPriority.NORMAL, function (l, e) {
        if (!openPlayers.contains(e.getWhoClicked())) return;
        if (!isOurGui(e.getView().getTitle())) return;
        var topSize = e.getView().getTopInventory().getSize();
        var itSlots = e.getRawSlots().iterator();
        while (itSlots.hasNext()) {
            if (itSlots.next() < topSize) {
                e.setCancelled(true);
                return;
            }
        }
    }, rsc);

    rsc[LISTENER_KEY] = listener;
    registered = true;
}

function openMain(player) {
    loadAllSounds();
    PAGE_MAP.put(player, 0);
    if (PITCH_MAP.get(player.getUniqueId()) == null) setPitch(player, 1.0);
    openMenu(player, buildMenu(player, 0));
}

function onUse(event) {
    try {
        openMain(event.getPlayer());
    } catch (err) {
        event.getPlayer().sendMessage("§c无法打开音效库: " + err);
        print("[ATO音效库] 打开失败: " + err);
    }
    return false;
}
