package com.linkany121.gltc.logic.skey;

import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_I;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_V;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_X;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.NeedItem;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.OrderData;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.hex;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.stripColor;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.translateCodes;

/** Order generation pools / pricing — faithful port of 舰体订单发布机.js */
public final class ShipOrderCatalog {

    // ===== 配置区（舰体订单生成池与定价，改完需重新打包 jar 并重启生效）=====
    // LEVEL_NAMES         等级 → 显示名/主题色（1=I级蓝 / 2=V级橙 / 3=X级红）。
    // CURRENCY_STYLE       货币代号 → 显示名/主题色。
    // LEVEL_CURRENCY       等级 → 订单奖励使用的货币代号。
    // LEVEL_CATEGORIES     各等级订单可刷出的物品种类（1/2 级为食物/矿物/装备/机器，3 级仅矿物/机器）。
    // LEVEL_COUNTS         各类物品单张订单需求数量区间 {下限, 上限}（如矿物 1~6 个）。
    // STAGE1_PRICES / STAGE2_PRICES  一阶/二阶订单各货币单价表：prices(食物价, 矿物价, 装备价, 机器价)，
    //   每项 Map.of(1,x, 2,y, 3,z) 表示 I/V/X 级订单中该物品每 1 个按多少等货币结算。
    //   想调价：改对应数字即可；想改订单产出物：改下方 VANILLA_POOLS / SF_POOLS 的物品池。
    private static final Map<Integer, LevelStyle> LEVEL_NAMES = Map.of(
        1, new LevelStyle("I级", C_I),
        2, new LevelStyle("V级", C_V),
        3, new LevelStyle("X级", C_X)
    );

    private static final Map<String, CurrencyStyle> CURRENCY_STYLE = Map.of(
        "I", new CurrencyStyle("I等货币", C_I),
        "V", new CurrencyStyle("V等货币", C_V),
        "X", new CurrencyStyle("X等货币", C_X)
    );

    private static final Map<Integer, String> LEVEL_CURRENCY = Map.of(1, "I", 2, "V", 3, "X");

    private static final Map<Integer, String[]> LEVEL_CATEGORIES = Map.of(
        1, new String[]{"食物", "矿物", "装备", "机器"},
        2, new String[]{"食物", "矿物", "装备", "机器"},
        3, new String[]{"矿物", "机器"}
    );

    private static final Map<String, int[]> LEVEL_COUNTS = Map.of(
        "食物", new int[]{1, 3},
        "矿物", new int[]{1, 6},
        "装备", new int[]{1, 1},
        "机器", new int[]{1, 1}
    );

    private static final Map<String, Map<Integer, Integer>> STAGE1_PRICES = prices(
        Map.of(1, 1, 2, 2, 3, 5),
        Map.of(1, 1, 2, 1, 3, 3),
        Map.of(1, 1, 2, 2, 3, 6),
        Map.of(1, 2, 2, 4, 3, 5)
    );

    private static final Map<String, Map<Integer, Integer>> STAGE2_PRICES = prices(
        Map.of(1, 1, 2, 2, 3, 3),
        Map.of(1, 1, 2, 2, 3, 3),
        Map.of(1, 1, 2, 2, 3, 4),
        Map.of(1, 2, 2, 3, 3, 5)
    );

    private static final Map<String, String[]> VANILLA_POOLS = Map.of(
        "食物", arr("apple", "bread", "cooked_beef", "cooked_porkchop", "cooked_chicken", "cooked_cod",
            "cooked_salmon", "baked_potato", "cooked_mutton", "cooked_rabbit", "pumpkin_pie", "cookie",
            "melon_slice", "carrot", "golden_carrot", "mushroom_stew", "beetroot_soup", "dried_kelp",
            "sweet_berries", "honey_bottle"),
        "矿物", arr("iron_ingot", "gold_ingot", "copper_ingot", "diamond", "emerald", "coal", "redstone",
            "lapis_lazuli", "quartz", "amethyst_shard", "raw_iron", "raw_gold", "raw_copper", "iron_block",
            "gold_block", "copper_block", "diamond_block", "emerald_block", "coal_block", "redstone_block",
            "netherite_ingot", "netherite_scrap", "ancient_debris", "obsidian"),
        "装备", arr("iron_sword", "iron_pickaxe", "iron_axe", "iron_helmet", "iron_chestplate", "iron_leggings",
            "iron_boots", "diamond_sword", "diamond_pickaxe", "diamond_axe", "diamond_helmet", "diamond_chestplate",
            "diamond_leggings", "diamond_boots", "bow", "crossbow", "shield", "golden_sword", "golden_pickaxe", "trident"),
        "机器", arr("furnace", "blast_furnace", "smoker", "crafting_table", "piston", "sticky_piston", "dispenser",
            "dropper", "hopper", "observer", "redstone_repeater", "redstone_comparator", "tnt", "note_block",
            "jukebox", "beacon", "enchanting_table", "anvil", "brewing_stand", "cauldron", "stonecutter",
            "smithing_table", "target", "daylight_detector", "redstone_lamp", "chest", "barrel", "lever", "redstone_torch")
    );

    private static final Map<String, Map<Integer, String[]>> STAGE1_POOLS = stage1Pools();
    private static final Map<String, Map<Integer, String[]>> STAGE2_POOLS = stage2Pools();

    private static final Map<String, String> CATEGORY_NAMES = Map.of(
        "食物", hex("ff8f6c") + "食物",
        "矿物", hex("7ad3ed") + "矿物",
        "装备", hex("96d6a7") + "装备",
        "机器", hex("ffd258") + "机器"
    );

    private static final Map<String, String> VANILLA_CN = vanillaCn();

    private static final String[] STAFF_NAMES = {
        "时任行政舰长", "GEG首席工程师", "夏氏人员组联络员", "C7仓物资管理员", "能源系统管理部",
        "滞域体系研发部", "窗口维系部", "K区甲板维护部", "群山反应堆控制部", "新生星系联络部",
        "衍生窗口观测部", "舰体民生管理部", "行政管理部", "工农作业部", "特种器材开发部",
        "月砧", "菜粥", "洛水", "小C", "洛水", "卷心菜大帝", "土豆", "牛子豪", "谶欢", "鬼鬼", "香蕉哥"
    };

    private static final String[] STAFF_PHRASES = {
        "你出生在新生星系，可能不懂人之领有多大：整个银河系都曾是它的影子。",
        "你需要的话我能给你整点铱钢壳子，对，造星门的那个。",
        "兄弟，打金不？",
        "我们这边...算了你尽快吧，不太急。",
        "要我说，星门的崩溃就是人为的，不过都外界都过去几亿年了，不好说啊...",
        "工程师，可以的话多捎点...嗨，多大点事。",
        "这个订单我费了老大劲才说服他们让我上，能快点吗？",
        "..吃吃吃就知道吃！...诶忘闭麦了...需求发给你了。",
        "你问星门？那玩意可牛逼了，你现在和我们交易的系统就是那玩意的超超超级迷你版。",
        "人之领没了...还刚好在我们陷入滞留域的时候，巧合...？",
        "大崩溃？一时半会真说不清楚啊，你做好铱产线之后再联系我们。",
        "自从新生星系有联系之后，舰体上下真是开心坏了。",
        "最近咋样？这批要是方便就帮我留点，不急。",
        "工程师，这种你那边多不多？有的话下次一起带过来。",
        "上次那批不错，这批你再帮我盯着点，不过不用赶。",
        "我这边库存还行，你那边要是有富余的，分我点就行。",
        "这玩意最近挺抢手啊，你手里还有吗？没有就算了。",
        "兄弟，这批不急着用，你先忙你的，空了再弄。",
        "我就是问问，这种你还有没有存货，有就给我留一些。",
        "工程师，这批质量咋样？好的话我就多要点，不着急送。",
        "听说你那边刚到了一批？我这边需求不大，随便来点。",
        "这批我先预定了，但不用马上送，等你有空再说。",
        "最近辛苦了，这批不用太赶，下周之前给我就行。",
        "我这边不催你，这批你看着安排，有就行。",
        "你先把手头急的忙完，再管我这。",
        "这些东西我盼了好久了，兄弟，现在还有吗？",
        "别问了哥们，钱就这么多了，我这边真的急。",
        "我快撑不住了，就等您老嘞。",
        "有这批就稳了，谢了哥们。",
        "我需要这些东西，越快越好。",
        "如果你手头有，就全给我吧。",
        "东西一到就通知我，兄弟，有点急。",
        "我这边缺口很大，有多少来多少。",
        "工程师，这些东西用处很大。",
        "自从知道新生星系的事之后，我们的人都高兴坏了，哈哈。",
        "船上没有什么空间搞这玩意，我馋这些玩意很久了。",
        "需求发你了，就等这批物资了，辛苦快点！",
        "务必尽快送达！",
        "这些东西能补充一些库存，但不急缺。",
        "有最好，没有的话就算了。",
        "辛苦你保证这批物资的质量，用途比较重要。",
        "星期四到了啊...你懂我意思吧？",
        "霍，可以啊工程师，这玩意你也有。"
    };

    private static final String ORDER_NAME_TEMPLATE = "&#2998ff舰&#21a6ff体&#19b5ff需&#10c3ff求&#08d2ff订&#00e0ff单";
    private static final String[] ORDER_LORE_TEMPLATE = {
        "&b归属&9：&#6f7dffS&#8f9affe&#afb7ffk&#cfd4fft&#eff1ffh&#fbfbfbi&#f2f2f2y&#e9e9e9远&#e1e1e1航&#d8d8d8舰",
        "&#fff5b3一张订单，上面写着舰体当前所需的物质需求。",
        "&f——————————————————",
        "&f[&b订单等级&f]&#fff5b3%等级%",
        "&f[&b订单回报&f]&#fff5b3%报酬%",
        "&f[&b需求内容&f]",
        "%交易内容%",
        "&f——————————————————",
        "&f[&e!&f]&#e1ccbd需在舰体订单发布器中获取。",
        "%话语%"
    };

    private ShipOrderCatalog() {
    }

    @Nullable
    public static OrderData generateOrder(int batchCount) {
        int level = rollLevel(batchCount);
        int itemCount = rand(1, 3);
        List<NeedItem> items = pickItemsForLevel(level, itemCount);
        if (items.isEmpty()) {
            return null;
        }
        int value = 0;
        for (NeedItem it : items) {
            value += it.value();
        }
        if (items.size() > 1) {
            int boosted = value;
            for (int j = 1; j < items.size(); j++) {
                boosted = (int) Math.ceil(boosted * 1.20);
            }
            value = boosted;
        }
        return new OrderData(level, items, LEVEL_CURRENCY.get(level), value);
    }

    public static ItemStack buildOrderItem(OrderData order) {
        ItemStack item = new ItemStack(Material.BOOK);
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return item;
        }
        LevelStyle lv = LEVEL_NAMES.get(order.level());
        String levelText = lv.color() + lv.text();
        String rewardText = buildRewardText(order.level(), order.rewardAmount());

        meta.setDisplayName(translateCodes(ORDER_NAME_TEMPLATE));
        try {
            meta.setCustomModelData(ShipOrderSupport.ORDER_MODEL_ID);
        } catch (Throwable ignored) {
        }

        List<String> lore = new ArrayList<>();
        for (String template : ORDER_LORE_TEMPLATE) {
            if (template.contains("%交易内容%")) {
                for (NeedItem it : order.items()) {
                    lore.add(translateCodes(
                        CATEGORY_NAMES.get(it.category()) + " §8▶ §e"
                            + getItemName(it.itemId(), it.isMc()) + " §fx" + it.amount()
                    ));
                }
                continue;
            }
            if (template.contains("%话语%")) {
                lore.addAll(buildStaffDialogue());
                continue;
            }
            String line = template.replace("%等级%", levelText).replace("%报酬%", rewardText);
            lore.add(translateCodes(line));
        }
        meta.setLore(lore);

        var pdc = meta.getPersistentDataContainer();
        pdc.set(ShipOrderSupport.ORDER_LEVEL_KEY, org.bukkit.persistence.PersistentDataType.INTEGER, order.level());
        pdc.set(ShipOrderSupport.ORDER_ITEMS_KEY, org.bukkit.persistence.PersistentDataType.STRING, NeedItem.toJsonArray(order.items()));
        pdc.set(ShipOrderSupport.ORDER_REWARD_I_KEY, org.bukkit.persistence.PersistentDataType.INTEGER,
            "I".equals(order.rewardType()) ? order.rewardAmount() : 0);
        pdc.set(ShipOrderSupport.ORDER_REWARD_V_KEY, org.bukkit.persistence.PersistentDataType.INTEGER,
            "V".equals(order.rewardType()) ? order.rewardAmount() : 0);
        pdc.set(ShipOrderSupport.ORDER_REWARD_X_KEY, org.bukkit.persistence.PersistentDataType.INTEGER,
            "X".equals(order.rewardType()) ? order.rewardAmount() : 0);

        item.setItemMeta(meta);
        return item;
    }

    public static String buildRewardText(int level, int amount) {
        CurrencyStyle cs = CURRENCY_STYLE.get(LEVEL_CURRENCY.get(level));
        return cs.color() + cs.name() + " §fx" + amount;
    }

    private static List<String> buildStaffDialogue() {
        List<String> lines = new ArrayList<>();
        int count = rand(1, 2);
        for (int i = 0; i < count; i++) {
            lines.add(translateCodes("&b" + pick(STAFF_NAMES) + "&f：&#fff5b3" + pick(STAFF_PHRASES)));
        }
        return lines;
    }

    private static int rollLevel(int count) {
        double r = ThreadLocalRandom.current().nextDouble();
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

    private static List<NeedItem> pickItemsForLevel(int level, int count) {
        String[] categories = LEVEL_CATEGORIES.get(level);
        List<NeedItem> items = new ArrayList<>();
        Map<String, Boolean> seen = new HashMap<>();
        int attempts = 0;
        while (items.size() < count && attempts < 200) {
            attempts++;
            String cat = pick(categories);
            if (level == 1) {
                String id = pick(VANILLA_POOLS.get(cat));
                if (seen.putIfAbsent(id, true) != null) {
                    continue;
                }
                int amount = "装备".equals(cat) ? 1 : rand(3, 9);
                items.add(new NeedItem(cat, id, true, amount, rand(1, 3), 0));
            } else {
                Map<Integer, String[]> poolMap = level == 2 ? STAGE1_POOLS.get(cat) : STAGE2_POOLS.get(cat);
                Map<Integer, Integer> priceMap = level == 2 ? STAGE1_PRICES.get(cat) : STAGE2_PRICES.get(cat);
                if (poolMap == null || priceMap == null) {
                    continue;
                }
                int tier = rand(1, 3);
                String[] pool = poolMap.get(tier);
                if (pool == null || pool.length == 0) {
                    continue;
                }
                String id = pick(pool);
                String key = cat + "|" + id;
                if (seen.putIfAbsent(key, true) != null) {
                    continue;
                }
                int[] range = LEVEL_COUNTS.get(cat);
                int value = priceMap.getOrDefault(tier, 1);
                items.add(new NeedItem(cat, id, false, rand(range[0], range[1]), value, tier));
            }
        }
        return items;
    }

    private static String getItemName(String id, boolean isMc) {
        if (isMc) {
            String cn = VANILLA_CN.get(id);
            if (cn != null) {
                return cn;
            }
            String[] parts = id.split("_");
            StringBuilder sb = new StringBuilder();
            for (String p : parts) {
                if (!sb.isEmpty()) {
                    sb.append(' ');
                }
                if (!p.isEmpty()) {
                    sb.append(Character.toUpperCase(p.charAt(0))).append(p.substring(1));
                }
            }
            return sb.toString();
        }
        try {
            SlimefunItem sf = ShipOrderSupport.getItemById(id);
            if (sf != null) {
                ItemMeta meta = sf.getItem().getItemMeta();
                if (meta != null && meta.hasDisplayName()) {
                    String name = stripColor(meta.getDisplayName());
                    if (!name.isEmpty()) {
                        return name;
                    }
                }
            }
        } catch (Throwable ignored) {
        }
        return id;
    }

    private static int rand(int min, int max) {
        return min + ThreadLocalRandom.current().nextInt(max - min + 1);
    }

    private static String pick(String[] arr) {
        return arr[ThreadLocalRandom.current().nextInt(arr.length)];
    }

    private static String[] arr(String... a) {
        return a;
    }

    private static Map<String, Map<Integer, Integer>> prices(
        Map<Integer, Integer> food,
        Map<Integer, Integer> mineral,
        Map<Integer, Integer> equip,
        Map<Integer, Integer> machine
    ) {
        Map<String, Map<Integer, Integer>> m = new LinkedHashMap<>();
        m.put("食物", food);
        m.put("矿物", mineral);
        m.put("装备", equip);
        m.put("机器", machine);
        return m;
    }

    private static Map<String, Map<Integer, String[]>> stage1Pools() {
        Map<String, Map<Integer, String[]>> m = new LinkedHashMap<>();
        m.put("食物", Map.of(
            1, arr("UMPV_酥脆大薯条", "UMPV_炭烤海螺", "UMPV_大盘煎蛋", "UMPV_久蒸大米饭", "UMPV_猛炸大薯条",
                "UMPV_肉糜煎蛋", "UMPV_烤厄索斯菜卷", "UMPV_酱烤岩兽串", "UMPV_瓜片炒餮头肉", "UMPV_翠玉卷心瓜片"),
            2, arr("UMPV_屑切菜香肉盘", "UMPV_蘑菇萝卜厚炖", "UMPV_蛋炒鱼肉丝", "UMPV_狂野人生烤串", "UMPV_深海野兽",
                "UMPV_水煮虐王兽肉汤", "UMPV_大锅炖肉土豆"),
            3, arr("UMPV_浮沉盐海的阖眸", "UMPV_菌萝香炖稻焖饭", "UMPV_苔香辣卤海鲜汤", "UMPV_海陆双菌酒生煎",
                "UMPV_黄金焗酱烤整羽", "UMPV_见手金果炸全腿", "UMPV_百香爆烤整身虐王排", "UMPV_灼金香烹餮汤锅",
                "UMPV_疯狂星期四", "UMPV_黄金炒饭")
        ));
        m.put("矿物", Map.of(
            1, arr("TSTl", "TSsy", "TSg", "TShh", "TSyy", "TSbd", "TStls", "TSnd", "TSjj", "TSgd", "TSxt"),
            2, arr("TSTJ", "TSdbg", "TSbtl", "TSjld", "TSym", "TSld", "TSyd", "TSdd", "TSskd", "TSlks",
                "TSymy", "TSdjl", "TSgwhs", "TSthyy", "TSPJD", "TSCH", "TSSKD"),
            3, arr("TShel", "TSmbh", "TSgls")
        ));
        m.put("装备", Map.of(
            1, arr("FKR_铋铲", "FKR_铋镐", "FKR_铋斧", "FKR_铋剑"),
            2, arr("FKR_棉铂华镀层手斧", "FKR_棉铂华淬火匕首", "FKR_致密苦艾合金铲", "FKR_致密苦艾合金镐"),
            3, arr("FKR_炽热星涡重斧", "FKR_炽热星涡砍刀", "FKR_通古斯制式步枪", "FKR_通古斯战壕霰弹",
                "FKR_通古斯涡轮式单兵机枪", "FKR_通古斯防御型脉冲手铳", "FKR_通古斯制式轨道信标投递器",
                "FKR_通古斯过载式步枪", "FKR_伏地", "FKR_ASPL", "FKR_隐兰狂玉唤剑葫")
        ));
        m.put("机器", Map.of(
            1, arr("tac1", "tac2", "tac3", "ATOcd1", "ATOcd2", "ATOsh1", "ATOsh2", "ATOrh1", "ATOgzq",
                "TACdw1", "TAChx1", "TACbz1"),
            2, arr("tscyzj1", "tsgxdy1", "tsylg1", "tstyj1", "tszspt1", "tsmsft1", "tssyyl1", "tslhfy1",
                "TShjl1", "TSmlq1", "TSfj1", "TShc1", "LISlyj1", "LISyp1", "LISls1", "EAE_家用单元合成器",
                "EAE_一体融合器", "FKR_锻造锤", "UMPV_种子分析仪", "UMPV_密堆培育仓", "UMPV_富集舱",
                "UMPV_集束房", "UMPV_药草成分萃取台", "UMPV_厨房", "UMPV_营养分解机", "UMPV_营养分解机2"),
            3, arr("OST_回收器", "OST_幼儿启蒙金属合成机", "OST_儿童玩具零件组装机", "OST_古代机器人益趣合成箱",
                "OST_工程师入门工具生产器", "OST_旧日魔法帽模拟器", "OST_弱辐益智科学套件",
                "HInet_网络通信零件产素器", "HInet_网络入门工具包", "HInet_网络管道批量生产床", "HInet_网络存储磁块转化器")
        ));
        return m;
    }

    private static Map<String, Map<Integer, String[]>> stage2Pools() {
        Map<String, Map<Integer, String[]>> m = new LinkedHashMap<>();
        m.put("矿物", Map.of(
            1, arr("skey_能源土", "skey_离子锁定气", "skey_突变轻烯片岩", "skey_红铁原矿", "skey_火镎矿"),
            2, arr("skey_GVS中坚矿族石料", "skey_致密尘埃颗粒", "skey_迷迭色流体", "skey_红铁锭"),
            3, arr("skey_漩涡锭", "skey_毡星锭", "skey_红磁流钴锭", "skey_忒弥斯锭", "skey_纯净铂锭",
                "skey_禁闭纯钛合金", "skey_錾制重金锭", "skey_磁耀锇钢锭", "skey_镀铂电气合金锭",
                "skey_充能锿", "skey_伊甸红锭", "skey_深境燃子素钢锭", "skey_至纯风暴铱")
        ));
        m.put("机器", Map.of(
            1, arr("skey_小帮手1", "skey_信条轨道工厂"),
            2, arr("skey_小帮手2", "skey_专注型合金锻炉", "skey_光刻机"),
            3, arr("skey_小帮手3", "skey_十一号反应炉", "skey_重力集束熔炼房", "skey_红巨压力合成器",
                "skey_重型工业成型母机", "skey_深红远星级", "skey_灼热苍穹级", "skey_四目伏羲级")
        ));
        return m;
    }

    private static Map<String, String> vanillaCn() {
        Map<String, String> m = new HashMap<>();
        m.put("apple", "苹果"); m.put("bread", "面包"); m.put("cooked_beef", "牛排");
        m.put("cooked_porkchop", "熟猪排"); m.put("cooked_chicken", "熟鸡肉"); m.put("cooked_cod", "熟鳕鱼");
        m.put("cooked_salmon", "熟鲑鱼"); m.put("baked_potato", "烤马铃薯"); m.put("cooked_mutton", "熟羊肉");
        m.put("cooked_rabbit", "熟兔肉"); m.put("pumpkin_pie", "南瓜派"); m.put("cookie", "曲奇");
        m.put("melon_slice", "西瓜片"); m.put("carrot", "胡萝卜"); m.put("golden_carrot", "金胡萝卜");
        m.put("mushroom_stew", "蘑菇煲"); m.put("beetroot_soup", "甜菜汤"); m.put("dried_kelp", "干海带");
        m.put("sweet_berries", "甜浆果"); m.put("honey_bottle", "蜂蜜瓶");
        m.put("iron_ingot", "铁锭"); m.put("gold_ingot", "金锭"); m.put("copper_ingot", "铜锭");
        m.put("diamond", "钻石"); m.put("emerald", "绿宝石"); m.put("coal", "煤炭"); m.put("redstone", "红石粉");
        m.put("lapis_lazuli", "青金石"); m.put("quartz", "下界石英"); m.put("amethyst_shard", "紫水晶碎片");
        m.put("raw_iron", "粗铁"); m.put("raw_gold", "粗金"); m.put("raw_copper", "粗铜");
        m.put("iron_block", "铁块"); m.put("gold_block", "金块"); m.put("copper_block", "铜块");
        m.put("diamond_block", "钻石块"); m.put("emerald_block", "绿宝石块"); m.put("coal_block", "煤炭块");
        m.put("redstone_block", "红石块"); m.put("netherite_ingot", "下界合金锭");
        m.put("netherite_scrap", "下界合金碎片"); m.put("ancient_debris", "远古残骸"); m.put("obsidian", "黑曜石");
        m.put("iron_sword", "铁剑"); m.put("iron_pickaxe", "铁镐"); m.put("iron_axe", "铁斧");
        m.put("iron_helmet", "铁头盔"); m.put("iron_chestplate", "铁胸甲"); m.put("iron_leggings", "铁护腿");
        m.put("iron_boots", "铁靴子"); m.put("diamond_sword", "钻石剑"); m.put("diamond_pickaxe", "钻石镐");
        m.put("diamond_axe", "钻石斧"); m.put("diamond_helmet", "钻石头盔"); m.put("diamond_chestplate", "钻石胸甲");
        m.put("diamond_leggings", "钻石护腿"); m.put("diamond_boots", "钻石靴子"); m.put("bow", "弓");
        m.put("crossbow", "弩"); m.put("shield", "盾牌"); m.put("golden_sword", "金剑");
        m.put("golden_pickaxe", "金镐"); m.put("trident", "三叉戟");
        m.put("furnace", "熔炉"); m.put("blast_furnace", "高炉"); m.put("smoker", "烟熏炉");
        m.put("crafting_table", "工作台"); m.put("piston", "活塞"); m.put("sticky_piston", "粘性活塞");
        m.put("dispenser", "发射器"); m.put("dropper", "投掷器"); m.put("hopper", "漏斗");
        m.put("observer", "侦测器"); m.put("redstone_repeater", "红石中继器");
        m.put("redstone_comparator", "红石比较器"); m.put("tnt", "TNT"); m.put("note_block", "音符盒");
        m.put("jukebox", "唱片机"); m.put("beacon", "信标"); m.put("enchanting_table", "附魔台");
        m.put("anvil", "铁砧"); m.put("brewing_stand", "酿造台"); m.put("cauldron", "炼药锅");
        m.put("stonecutter", "切石机"); m.put("smithing_table", "锻造台"); m.put("target", "标靶");
        m.put("daylight_detector", "日光传感器"); m.put("redstone_lamp", "红石灯"); m.put("chest", "箱子");
        m.put("barrel", "木桶"); m.put("lever", "拉杆"); m.put("redstone_torch", "红石火把");
        return m;
    }

    private record LevelStyle(String text, String color) {
    }

    private record CurrencyStyle(String name, String color) {
    }
}
