package com.linkany121.gltc.generated;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.util.IdCanonicalizer;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.implementation.SlimefunItems;
import org.bukkit.inventory.ItemStack;
import com.linkany121.gltc.generated.items.Items_ATO_音效库;
import com.linkany121.gltc.generated.items.Items_GLTC_银行卡;
import com.linkany121.gltc.generated.items.Items_FKR_深渊召来;
import com.linkany121.gltc.generated.items.Items_FKR_炽古花盆;
import com.linkany121.gltc.generated.items.Items_FKR_钢铁靶;
import com.linkany121.gltc.generated.items.Items_FKR_通古斯制式步枪;
import com.linkany121.gltc.generated.items.Items_FKR_通古斯战壕霰弹;
import com.linkany121.gltc.generated.items.Items_FKR_通古斯涡轮式单兵机枪;
import com.linkany121.gltc.generated.items.Items_FKR_通古斯防御型脉冲手铳;
import com.linkany121.gltc.generated.items.Items_FKR_通古斯制式轨道信标投递器;
import com.linkany121.gltc.generated.items.Items_FKR_通古斯过载式步枪;
import com.linkany121.gltc.generated.items.Items_FKR_枪械集成枪;
import com.linkany121.gltc.generated.items.Items_FKR_伏地;
import com.linkany121.gltc.generated.items.Items_FKR_风墟龙冕;
import com.linkany121.gltc.generated.items.Items_FKR_无锋破军;
import com.linkany121.gltc.generated.items.Items_FKR_ASPL;
import com.linkany121.gltc.generated.items.Items_FKR_隐兰狂玉唤剑葫;
import com.linkany121.gltc.generated.items.Items_FKR_咀嚼曾世的晚梦;
import com.linkany121.gltc.generated.items.Items_VASA_驭粒终端;
import com.linkany121.gltc.generated.items.Items_VASA_彼岸钢调控终端;
import com.linkany121.gltc.generated.items.Items_VASA_通用施术道具;
import com.linkany121.gltc.generated.items.Items_OST_轮椅宣言;
import com.linkany121.gltc.generated.items.Items_UMPV_酥脆大薯条;
import com.linkany121.gltc.generated.items.Items_UMPV_炭烤海螺;
import com.linkany121.gltc.generated.items.Items_UMPV_大盘煎蛋;
import com.linkany121.gltc.generated.items.Items_UMPV_久蒸大米饭;
import com.linkany121.gltc.generated.items.Items_UMPV_猛炸大薯条;
import com.linkany121.gltc.generated.items.Items_UMPV_肉糜煎蛋;
import com.linkany121.gltc.generated.items.Items_UMPV_烤厄索斯菜卷;
import com.linkany121.gltc.generated.items.Items_UMPV_酱烤岩兽串;
import com.linkany121.gltc.generated.items.Items_UMPV_瓜片炒餮头肉;
import com.linkany121.gltc.generated.items.Items_UMPV_翠玉卷心瓜片;
import com.linkany121.gltc.generated.items.Items_UMPV_屑切菜香肉盘;
import com.linkany121.gltc.generated.items.Items_UMPV_蘑菇萝卜厚炖;
import com.linkany121.gltc.generated.items.Items_UMPV_蛋炒鱼肉丝;
import com.linkany121.gltc.generated.items.Items_UMPV_狂野人生烤串;
import com.linkany121.gltc.generated.items.Items_UMPV_深海野兽;
import com.linkany121.gltc.generated.items.Items_UMPV_水煮虐王兽肉汤;
import com.linkany121.gltc.generated.items.Items_UMPV_大锅炖肉土豆;
import com.linkany121.gltc.generated.items.Items_UMPV_浮沉盐海的阖眸;
import com.linkany121.gltc.generated.items.Items_UMPV_菌萝香炖稻焖饭;
import com.linkany121.gltc.generated.items.Items_UMPV_苔香辣卤海鲜汤;
import com.linkany121.gltc.generated.items.Items_UMPV_海陆双菌酒生煎;
import com.linkany121.gltc.generated.items.Items_UMPV_黄金焗酱烤整羽;
import com.linkany121.gltc.generated.items.Items_UMPV_见手金果炸全腿;
import com.linkany121.gltc.generated.items.Items_UMPV_百香爆烤整身虐王排;
import com.linkany121.gltc.generated.items.Items_UMPV_灼金香烹餮汤锅;
import com.linkany121.gltc.generated.items.Items_UMPV_疯狂星期四;
import com.linkany121.gltc.generated.items.Items_UMPV_黄金炒饭;
import com.linkany121.gltc.generated.items.Items_UMPV_板蓝根;
import com.linkany121.gltc.generated.items.Items_UMPV_满穗线香;
import com.linkany121.gltc.generated.items.Items_UMPV_末嫦娥;
import com.linkany121.gltc.generated.items.Items_UMPV_琼华古冶散;
import com.linkany121.gltc.generated.items.Items_UMPV_原神丸;
import com.linkany121.gltc.generated.items.Items_UMPV_半满之月;
import com.linkany121.gltc.generated.items.Items_UMPV_辟风兽角;
import com.linkany121.gltc.generated.items.Items_UMPV_悠久的群天之甘露;
import com.linkany121.gltc.generated.items.Items_UMPV_龙心;
import com.linkany121.gltc.generated.items.Items_UMPV_果冻;
import com.linkany121.gltc.generated.items.Items_ATO_能源流储蓄站;
import com.linkany121.gltc.generated.items.Items_FKR_枪械外观客制化组装桌;
import com.linkany121.gltc.generated.items.Items_skey_舰体订单发布机;
import com.linkany121.gltc.generated.items.Items_skey_舰体订单接收机;
import com.linkany121.gltc.generated.items.Items_skey_舰体链接协议访问站;
import com.linkany121.gltc.generated.items.Items_VASA_术式承载转换仪;
import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.script.GltcScriptedMachine;

/** Auto-generated. Do not edit. */

public final class GltcScriptedRegistry {
    private GltcScriptedRegistry() {}
    public static void register(SlimefunAddon addon) {
        java.util.List<com.linkany121.gltc.script.GltcScriptedItem> __scriptedItems = new java.util.ArrayList<>();
        // item script: 道具工具/音效浏览器
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_B1, GltcItemBuilder.slimefunStack("ATO_音效库", Items_ATO_音效库.DATA, 1), RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"), new Object[] { null, null, null, null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NOTE_BLOCK, 1), null, null, null, null }, GltcItemBuilder.slimefunStack("ATO_音效库", Items_ATO_音效库.DATA, 1)));
        // item script: 能源流货币/信用卡
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_B1, GltcItemBuilder.slimefunStack("GLTC_银行卡", Items_GLTC_银行卡.DATA, 1), RecipeUtil.resolveRecipeType("PF_ATO_GT"), new Object[] { RecipeUtil.deferredSlimefun("IRON_INGOT", 1), RecipeUtil.deferredSlimefun("AL_A3", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("GLTC_银行卡", Items_GLTC_银行卡.DATA, 1)));
        // item script: 道具工具/深渊召来
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1, GltcItemBuilder.slimefunStack("FKR_深渊召来", Items_FKR_深渊召来.DATA, 1), RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"), new Object[] { null, null, null, null, RecipeUtil.deferredSlimefun("TS2jbyg", 1), null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_深渊召来", Items_FKR_深渊召来.DATA, 1)));
        // item script: 道具工具/炽古花盆
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1, GltcItemBuilder.slimefunStack("FKR_炽古花盆", Items_FKR_炽古花盆.DATA, 1), RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"), new Object[] { null, RecipeUtil.deferredSlimefun("TSgj5", 1), null, null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BOOK, 1), null, null, RecipeUtil.deferredSlimefun("TSxl5", 1), null }, GltcItemBuilder.slimefunStack("FKR_炽古花盆", Items_FKR_炽古花盆.DATA, 1)));
        // item script: 道具工具/钢铁靶
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1, GltcItemBuilder.slimefunStack("FKR_钢铁靶", Items_FKR_钢铁靶.DATA, 1), RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"), new Object[] { null, RecipeUtil.deferredSlimefun("TSgj5", 1), null, null, RecipeUtil.deferredSlimefun("IRON_INGOT", 1), null, null, RecipeUtil.deferredSlimefun("TSxl5", 1), null }, GltcItemBuilder.slimefunStack("FKR_钢铁靶", Items_FKR_钢铁靶.DATA, 1)));
        // item script: 枪械/通古斯制式步枪
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_通古斯制式步枪", Items_FKR_通古斯制式步枪.DATA, 1), RecipeUtil.resolveRecipeType("PF_QXCC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_发射器装件", 1), RecipeUtil.deferredSlimefun("FKR_通古斯弹药集成匣", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_通古斯制式步枪", Items_FKR_通古斯制式步枪.DATA, 1)));
        // item script: 枪械/通古斯战壕霰弹
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_通古斯战壕霰弹", Items_FKR_通古斯战壕霰弹.DATA, 1), RecipeUtil.resolveRecipeType("PF_QXCC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_通古斯制式步枪", 1), RecipeUtil.deferredSlimefun("FKR_通古斯弹药集成匣", 3), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_通古斯战壕霰弹", Items_FKR_通古斯战壕霰弹.DATA, 1)));
        // item script: 枪械/通古斯涡轮式单兵机枪
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_通古斯涡轮式单兵机枪", Items_FKR_通古斯涡轮式单兵机枪.DATA, 1), RecipeUtil.resolveRecipeType("PF_QXCC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_通古斯战壕霰弹", 1), RecipeUtil.deferredSlimefun("FKR_通古斯弹药集成匣", 3), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_通古斯涡轮式单兵机枪", Items_FKR_通古斯涡轮式单兵机枪.DATA, 1)));
        // item script: 枪械/通古斯防御型脉冲手铳
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_通古斯防御型脉冲手铳", Items_FKR_通古斯防御型脉冲手铳.DATA, 1), RecipeUtil.resolveRecipeType("PF_QXCC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_通古斯制式步枪", 1), RecipeUtil.deferredSlimefun("FKR_玻璃粘合装载器", 2), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_通古斯防御型脉冲手铳", Items_FKR_通古斯防御型脉冲手铳.DATA, 1)));
        // item script: 枪械/通古斯制式轨道信标投递器
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_通古斯制式轨道信标投递器", Items_FKR_通古斯制式轨道信标投递器.DATA, 1), RecipeUtil.resolveRecipeType("PF_QXCC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_通古斯制式步枪", 1), RecipeUtil.deferredSlimefun("FKR_玻璃粘合装载器", 1), RecipeUtil.deferredSlimefun("FKR_星轨信标", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_通古斯制式轨道信标投递器", Items_FKR_通古斯制式轨道信标投递器.DATA, 1)));
        // item script: 枪械/通古斯过载式步枪
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_通古斯过载式步枪", Items_FKR_通古斯过载式步枪.DATA, 1), RecipeUtil.resolveRecipeType("PF_QXCC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_通古斯防御型脉冲手铳", 1), RecipeUtil.deferredSlimefun("FKR_星轨信标", 2), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_通古斯过载式步枪", Items_FKR_通古斯过载式步枪.DATA, 1)));
        // item script: 枪械/枪械集成枪
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_枪械集成枪", Items_FKR_枪械集成枪.DATA, 1), RecipeUtil.resolveRecipeType("NULL"), new Object[0], GltcItemBuilder.slimefunStack("FKR_枪械集成枪", Items_FKR_枪械集成枪.DATA, 1)));
        // item script: 武器/伏地
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_伏地", Items_FKR_伏地.DATA, 1), RecipeUtil.resolveRecipeType("PF_DZC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), RecipeUtil.deferredSlimefun("TSwk2", 24), RecipeUtil.deferredSlimefun("TSxl5", 24), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_伏地", Items_FKR_伏地.DATA, 1)));
        // item script: 武器/风墟龙冕
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_风墟龙冕", Items_FKR_风墟龙冕.DATA, 1), RecipeUtil.resolveRecipeType("PF_DZC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), RecipeUtil.deferredSlimefun("TSlx", 64), RecipeUtil.deferredSlimefun("TSxl5", 24), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_风墟龙冕", Items_FKR_风墟龙冕.DATA, 1)));
        // item script: 武器/破军
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_无锋破军", Items_FKR_无锋破军.DATA, 1), RecipeUtil.resolveRecipeType("PF_DZC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHERITE_BLOCK, 48), RecipeUtil.deferredSlimefun("TSxl5", 24), RecipeUtil.deferredSlimefun("TSzjg", 32), null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_无锋破军", Items_FKR_无锋破军.DATA, 1)));
        // item script: 武器/ASPL
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_ASPL", Items_FKR_ASPL.DATA, 1), RecipeUtil.resolveRecipeType("PF_DZC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), RecipeUtil.deferredSlimefun("UMPV_浮沉盐海的阖眸", 8), RecipeUtil.deferredSlimefun("TSxl5", 24), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_ASPL", Items_FKR_ASPL.DATA, 1)));
        // item script: 武器/隐兰狂玉唤剑葫
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_隐兰狂玉唤剑葫", Items_FKR_隐兰狂玉唤剑葫.DATA, 1), RecipeUtil.resolveRecipeType("PF_DZC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), RecipeUtil.deferredSlimefun("TSgj5", 48), RecipeUtil.deferredSlimefun("TSxl5", 48), RecipeUtil.deferredSlimefun("LScs3", 32), null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_隐兰狂玉唤剑葫", Items_FKR_隐兰狂玉唤剑葫.DATA, 1)));
        // item script: 武器/咀梦
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_G1c, GltcItemBuilder.slimefunStack("FKR_咀嚼曾世的晚梦", Items_FKR_咀嚼曾世的晚梦.DATA, 1), RecipeUtil.resolveRecipeType("PF_DZC"), new Object[] { RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), RecipeUtil.deferredSlimefun("TSgj5", 64), RecipeUtil.deferredSlimefun("LSyq4", 32), RecipeUtil.deferredSlimefun("LScs3", 32), null, null, null, null, null }, GltcItemBuilder.slimefunStack("FKR_咀嚼曾世的晚梦", Items_FKR_咀嚼曾世的晚梦.DATA, 1)));
        // item script: 术士系统/装备菜单
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.B_C0, GltcItemBuilder.slimefunStack("VASA_驭粒终端", Items_VASA_驭粒终端.DATA, 1), RecipeUtil.resolveRecipeType("None"), new Object[0], GltcItemBuilder.slimefunStack("VASA_驭粒终端", Items_VASA_驭粒终端.DATA, 1)));
        // item script: 术士系统/调控终端
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.B_C0, GltcItemBuilder.slimefunStack("VASA_彼岸钢调控终端", Items_VASA_彼岸钢调控终端.DATA, 1), RecipeUtil.resolveRecipeType("None"), new Object[0], GltcItemBuilder.slimefunStack("VASA_彼岸钢调控终端", Items_VASA_彼岸钢调控终端.DATA, 1)));
        // item script: 施术道具/通用施术
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.B_C0, GltcItemBuilder.slimefunStack("VASA_通用施术道具", Items_VASA_通用施术道具.DATA, 1), RecipeUtil.resolveRecipeType("None"), new Object[0], GltcItemBuilder.slimefunStack("VASA_通用施术道具", Items_VASA_通用施术道具.DATA, 1)));
        // item script: 道具工具/轮椅宣言
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.DLC_B1, GltcItemBuilder.slimefunStack("OST_轮椅宣言", Items_OST_轮椅宣言.DATA, 1), RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"), new Object[] { null, null, null, null, RecipeUtil.deferredSlimefun("AL_A5", 1), null, null, null, null }, GltcItemBuilder.slimefunStack("OST_轮椅宣言", Items_OST_轮椅宣言.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_酥脆大薯条", Items_UMPV_酥脆大薯条.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_深坑马铃薯", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BOWL, 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_酥脆大薯条", Items_UMPV_酥脆大薯条.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_炭烤海螺", Items_UMPV_炭烤海螺.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_霓斯那庭大海骡", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BOWL, 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_炭烤海螺", Items_UMPV_炭烤海螺.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_大盘煎蛋", Items_UMPV_大盘煎蛋.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_极地高酷鲁毛兽卵", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BOWL, 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_大盘煎蛋", Items_UMPV_大盘煎蛋.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_久蒸大米饭", Items_UMPV_久蒸大米饭.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_传统烨金稻", 1), RecipeUtil.deferredSlimefun("UMPV_涟音绿化根", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_久蒸大米饭", Items_UMPV_久蒸大米饭.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_猛炸大薯条", Items_UMPV_猛炸大薯条.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_深坑马铃薯", 1), RecipeUtil.deferredSlimefun("UMPV_宝色浆果", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_猛炸大薯条", Items_UMPV_猛炸大薯条.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_肉糜煎蛋", Items_UMPV_肉糜煎蛋.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_剧毒厄索斯内脏肉排", 1), RecipeUtil.deferredSlimefun("UMPV_极地高酷鲁毛兽卵", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_肉糜煎蛋", Items_UMPV_肉糜煎蛋.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_烤厄索斯菜卷", Items_UMPV_烤厄索斯菜卷.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_剧毒厄索斯内脏肉排", 1), RecipeUtil.deferredSlimefun("UMPV_白卷卷心菜", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_烤厄索斯菜卷", Items_UMPV_烤厄索斯菜卷.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_酱烤岩兽串", Items_UMPV_酱烤岩兽串.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生岩兽肉排", 1), RecipeUtil.deferredSlimefun("UMPV_镀铑夜明灼叶草", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BONE, 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_酱烤岩兽串", Items_UMPV_酱烤岩兽串.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_瓜片炒餮头肉", Items_UMPV_瓜片炒餮头肉.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_香甜辣瓜片", 1), RecipeUtil.deferredSlimefun("UMPV_生餮头兽肉片", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_瓜片炒餮头肉", Items_UMPV_瓜片炒餮头肉.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_翠玉卷心瓜片", Items_UMPV_翠玉卷心瓜片.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_香甜辣瓜片", 1), RecipeUtil.deferredSlimefun("UMPV_白卷卷心菜", 1), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_翠玉卷心瓜片", Items_UMPV_翠玉卷心瓜片.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_屑切菜香肉盘", Items_UMPV_屑切菜香肉盘.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_弃拉泊齿兽腿肉", 1), RecipeUtil.deferredSlimefun("UMPV_生岩兽肉排", 1), RecipeUtil.deferredSlimefun("UMPV_涟音绿化根", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_屑切菜香肉盘", Items_UMPV_屑切菜香肉盘.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_蘑菇萝卜厚炖", Items_UMPV_蘑菇萝卜厚炖.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生完整全料羽兽", 1), RecipeUtil.deferredSlimefun("UMPV_沙海小萝卜", 1), RecipeUtil.deferredSlimefun("UMPV_螺剑菇", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_蘑菇萝卜厚炖", Items_UMPV_蘑菇萝卜厚炖.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_蛋炒鱼肉丝", Items_UMPV_蛋炒鱼肉丝.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生比诺丁鱼", 1), RecipeUtil.deferredSlimefun("UMPV_极地高酷鲁毛兽卵", 1), RecipeUtil.deferredSlimefun("UMPV_浮空兰蔬", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_蛋炒鱼肉丝", Items_UMPV_蛋炒鱼肉丝.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_狂野人生烤串", Items_UMPV_狂野人生烤串.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生野兽排肉", 1), RecipeUtil.deferredSlimefun("UMPV_浮空兰蔬", 1), RecipeUtil.deferredSlimefun("UMPV_沙海小萝卜", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_狂野人生烤串", Items_UMPV_狂野人生烤串.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_深海野兽", Items_UMPV_深海野兽.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生野兽排肉", 1), RecipeUtil.deferredSlimefun("UMPV_生古域鲸海鱼", 1), RecipeUtil.deferredSlimefun("UMPV_黯色片香菌", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_深海野兽", Items_UMPV_深海野兽.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_水煮虐王兽肉汤", Items_UMPV_水煮虐王兽肉汤.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_完整幼年虐王兽颈脊肉条", 1), RecipeUtil.deferredSlimefun("UMPV_生比诺丁鱼", 1), RecipeUtil.deferredSlimefun("UMPV_黯色片香菌", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_水煮虐王兽肉汤", Items_UMPV_水煮虐王兽肉汤.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_大锅炖肉土豆", Items_UMPV_大锅炖肉土豆.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_深坑马铃薯", 1), RecipeUtil.deferredSlimefun("UMPV_生岩兽肉排", 1), RecipeUtil.deferredSlimefun("UMPV_螺剑菇", 1), null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_大锅炖肉土豆", Items_UMPV_大锅炖肉土豆.DATA, 1)));
        // item script: 食物/浮沉盐海的阖眸
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_浮沉盐海的阖眸", Items_UMPV_浮沉盐海的阖眸.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_霓斯那庭大海骡", 1), RecipeUtil.deferredSlimefun("UMPV_生古域鲸海鱼", 1), RecipeUtil.deferredSlimefun("UMPV_生比诺丁鱼", 1), RecipeUtil.deferredSlimefun("UMPV_奇迹海域特产鱼子酱", 1), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_浮沉盐海的阖眸", Items_UMPV_浮沉盐海的阖眸.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_菌萝香炖稻焖饭", Items_UMPV_菌萝香炖稻焖饭.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_传统烨金稻", 1), RecipeUtil.deferredSlimefun("UMPV_沙海小萝卜", 1), RecipeUtil.deferredSlimefun("UMPV_黯色片香菌", 1), RecipeUtil.deferredSlimefun("UMPV_宝色浆果", 1), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_菌萝香炖稻焖饭", Items_UMPV_菌萝香炖稻焖饭.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_苔香辣卤海鲜汤", Items_UMPV_苔香辣卤海鲜汤.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生野兽排肉", 1), RecipeUtil.deferredSlimefun("UMPV_霓斯那庭大海骡", 1), RecipeUtil.deferredSlimefun("UMPV_涟音绿化根", 1), RecipeUtil.deferredSlimefun("UMPV_香甜辣瓜片", 1), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_苔香辣卤海鲜汤", Items_UMPV_苔香辣卤海鲜汤.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_海陆双菌酒生煎", Items_UMPV_海陆双菌酒生煎.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_剧毒厄索斯内脏肉排", 1), RecipeUtil.deferredSlimefun("UMPV_生古域鲸海鱼", 1), RecipeUtil.deferredSlimefun("UMPV_猎斑化见手青", 1), RecipeUtil.deferredSlimefun("UMPV_螺剑菇", 1), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_海陆双菌酒生煎", Items_UMPV_海陆双菌酒生煎.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_黄金焗酱烤整羽", Items_UMPV_黄金焗酱烤整羽.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生完整全料羽兽", 1), RecipeUtil.deferredSlimefun("UMPV_宝珠玉色根茎", 1), RecipeUtil.deferredSlimefun("UMPV_鎏明金脆果", 1), RecipeUtil.deferredSlimefun("UMPV_宝色浆果", 1), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_黄金焗酱烤整羽", Items_UMPV_黄金焗酱烤整羽.DATA, 1)));
        // item script: 食物/通用饥饿值
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_见手金果炸全腿", Items_UMPV_见手金果炸全腿.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_弃拉泊齿兽腿肉", 1), RecipeUtil.deferredSlimefun("UMPV_宝珠玉色根茎", 1), RecipeUtil.deferredSlimefun("UMPV_浅香红脆果", 1), RecipeUtil.deferredSlimefun("UMPV_猎斑化见手青", 1), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_见手金果炸全腿", Items_UMPV_见手金果炸全腿.DATA, 1)));
        // item script: 食物/百香爆烤整身虐王排
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_百香爆烤整身虐王排", Items_UMPV_百香爆烤整身虐王排.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_完整幼年虐王兽颈脊肉条", 1), RecipeUtil.deferredSlimefun("UMPV_奇迹海域特产鱼子酱", 1), RecipeUtil.deferredSlimefun("UMPV_宝珠玉色根茎", 1), RecipeUtil.deferredSlimefun("UMPV_白卷卷心菜", 1), RecipeUtil.deferredSlimefun("UMPV_浅香红脆果", 1), null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_百香爆烤整身虐王排", Items_UMPV_百香爆烤整身虐王排.DATA, 1)));
        // item script: 食物/灼金香烹餮汤锅
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_灼金香烹餮汤锅", Items_UMPV_灼金香烹餮汤锅.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_生餮头兽肉片", 1), RecipeUtil.deferredSlimefun("UMPV_鎏明金脆果", 1), RecipeUtil.deferredSlimefun("UMPV_浮空兰蔬", 1), RecipeUtil.deferredSlimefun("UMPV_奇迹海域特产鱼子酱", 1), RecipeUtil.deferredSlimefun("UMPV_镀铑夜明灼叶草", 1), null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_灼金香烹餮汤锅", Items_UMPV_灼金香烹餮汤锅.DATA, 1)));
        // item script: 食物/疯狂星期四
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_疯狂星期四", Items_UMPV_疯狂星期四.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_深坑马铃薯", 1), RecipeUtil.deferredSlimefun("UMPV_生完整全料羽兽", 1), RecipeUtil.deferredSlimefun("UMPV_弃拉泊齿兽腿肉", 1), RecipeUtil.deferredSlimefun("UMPV_极地高酷鲁毛兽卵", 1), RecipeUtil.deferredSlimefun("UMPV_镀铑夜明灼叶草", 1), null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_疯狂星期四", Items_UMPV_疯狂星期四.DATA, 1)));
        // item script: 食物/黄金炒饭
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_黄金炒饭", Items_UMPV_黄金炒饭.DATA, 1), RecipeUtil.resolveRecipeType("PF_MLCF"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_传统烨金稻", 1), RecipeUtil.deferredSlimefun("UMPV_生岩兽肉排", 1), RecipeUtil.deferredSlimefun("UMPV_完整幼年虐王兽颈脊肉条", 1), RecipeUtil.deferredSlimefun("UMPV_鎏明金脆果", 1), RecipeUtil.deferredSlimefun("UMPV_浮空兰蔬", 1), RecipeUtil.deferredSlimefun("UMPV_镀铑夜明灼叶草", 1), null, null, null }, GltcItemBuilder.slimefunStack("UMPV_黄金炒饭", Items_UMPV_黄金炒饭.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_板蓝根", Items_UMPV_板蓝根.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_夜明华巧片", 5), RecipeUtil.deferredSlimefun("UMPV_啜滑嗅幽茎", 5), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_板蓝根", Items_UMPV_板蓝根.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_满穗线香", Items_UMPV_满穗线香.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_香炼盈穗烧", 5), null, null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_满穗线香", Items_UMPV_满穗线香.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_末嫦娥", Items_UMPV_末嫦娥.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_碳碾树末根", 5), RecipeUtil.deferredSlimefun("UMPV_玉兔染黄草", 5), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_末嫦娥", Items_UMPV_末嫦娥.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_琼华古冶散", Items_UMPV_琼华古冶散.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_奇珏霸王荚", 5), null, null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_琼华古冶散", Items_UMPV_琼华古冶散.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_原神丸", Items_UMPV_原神丸.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_猛毒镇毒骨", 5), null, null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_原神丸", Items_UMPV_原神丸.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_半满之月", Items_UMPV_半满之月.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_板蓝根", 3), RecipeUtil.deferredSlimefun("UMPV_满穗线香", 3), RecipeUtil.deferredSlimefun("UMPV_末嫦娥", 3), RecipeUtil.deferredSlimefun("UMPV_甜香朱露瓤", 5), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_半满之月", Items_UMPV_半满之月.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_辟风兽角", Items_UMPV_辟风兽角.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_原神丸", 3), RecipeUtil.deferredSlimefun("UMPV_玉兔染黄草", 5), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_辟风兽角", Items_UMPV_辟风兽角.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_悠久的群天之甘露", Items_UMPV_悠久的群天之甘露.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_辟风兽角", 3), RecipeUtil.deferredSlimefun("UMPV_龙心", 3), null, null, null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_悠久的群天之甘露", Items_UMPV_悠久的群天之甘露.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_龙心", Items_UMPV_龙心.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_半满之月", 3), RecipeUtil.deferredSlimefun("UMPV_琼华古冶散", 3), RecipeUtil.deferredSlimefun("UMPV_原神丸", 3), RecipeUtil.deferredSlimefun("UMPV_古金甘露巢", 5), null, null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_龙心", Items_UMPV_龙心.DATA, 1)));
        // item script: 食物/通用药效
        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.A_H1b2, GltcItemBuilder.slimefunStack("UMPV_果冻", Items_UMPV_果冻.DATA, 1), RecipeUtil.resolveRecipeType("PF_ZYT"), new Object[] { RecipeUtil.deferredSlimefun("UMPV_百香爆烤整身虐王排", 5), RecipeUtil.deferredSlimefun("UMPV_疯狂星期四", 5), RecipeUtil.deferredSlimefun("UMPV_黄金炒饭", 5), RecipeUtil.deferredSlimefun("UMPV_悠久的群天之甘露", 5), RecipeUtil.deferredSlimefun("UMPV_龙心", 5), null, null, null, null }, GltcItemBuilder.slimefunStack("UMPV_果冻", Items_UMPV_果冻.DATA, 1)));
        for (com.linkany121.gltc.script.GltcScriptedItem __item : __scriptedItems) {
            __item.register(addon);
        }
        // machine script: 能源流货币/充值机
        com.linkany121.gltc.generated.script.Scripted_ATO_能源流储蓄站.register(addon);
        // machine script: 机器/枪械外观客制化组装桌
        com.linkany121.gltc.generated.script.Scripted_FKR_枪械外观客制化组装桌.register(addon);
        // machine script: 机器/舰体订单发布机
        com.linkany121.gltc.generated.script.Scripted_skey_舰体订单发布机.register(addon);
        // machine script: 机器/舰体订单接收机
        com.linkany121.gltc.generated.script.Scripted_skey_舰体订单接收机.register(addon);
        // machine script: 机器/舰体链接协议访问站
        com.linkany121.gltc.generated.script.Scripted_skey_舰体链接协议访问站.register(addon);
        // machine script: 机器/术式承载转换仪
        com.linkany121.gltc.generated.script.Scripted_VASA_术式承载转换仪.register(addon);
    }
}
