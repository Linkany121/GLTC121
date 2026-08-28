package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_植械突触分解机2;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_植械突触分解机2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_FD_植械突触分解机2 {
    private Machines_FD_植械突触分解机2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("FD_植械突触分解机2", Items_FD_植械突触分解机2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_植械突触分解机2", Items_FD_植械突触分解机2.DATA),
            1280,
            128,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_一堆种子", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_一堆药材", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_浅香红脆果", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_白卷卷心菜", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_鎏明金脆果", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_香甜辣瓜片", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_浮空兰蔬", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_涟音绿化根", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_沙海小萝卜", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_深坑马铃薯", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_宝珠玉色根茎", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 4), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_黯色片香菌", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_螺剑菇", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_猎斑化见手青", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 4), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_宝色浆果", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 4), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_传统烨金稻", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 4), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_镀铑夜明灼叶草", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 8), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_玉兔染黄草", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_啜滑嗅幽茎", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_猛毒镇毒骨", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_奇珏霸王荚", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_碳碾树末根", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_甜香朱露瓤", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_夜明华巧片", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_香炼盈穗烧", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_古金甘露巢", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_生岩兽肉排", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_生餮头兽肉片", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_生完整全料羽兽", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_极地高酷鲁毛兽卵", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 4), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_生比诺丁鱼", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_生古域鲸海鱼", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_霓斯那庭大海骡", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_奇迹海域特产鱼子酱", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 4), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_生野兽排肉", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_弃拉泊齿兽腿肉", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_剧毒厄索斯内脏肉排", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 2), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_完整幼年虐王兽颈脊肉条", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 4), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_酥脆大薯条", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_炭烤海螺", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_大盘煎蛋", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_久蒸大米饭", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 24), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_猛炸大薯条", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 24), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_肉糜煎蛋", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 24), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_烤厄索斯菜卷", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 24), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_酱烤岩兽串", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 24), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_瓜片炒餮头肉", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 24), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_翠玉卷心瓜片", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 24), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_屑切菜香肉盘", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_蘑菇萝卜厚炖", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_蛋炒鱼肉丝", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_狂野人生烤串", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_深海野兽", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_水煮虐王兽肉汤", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_大锅炖肉土豆", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_浮沉盐海的阖眸", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 40), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_菌萝香炖稻焖饭", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 40), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_苔香辣卤海鲜汤", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 40), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_海陆双菌酒生煎", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 40), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_黄金焗酱烤整羽", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 40), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_见手金果炸全腿", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 40), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_百香爆烤整身虐王排", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 56), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_灼金香烹餮汤锅", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 56), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_疯狂星期四", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 56), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_黄金炒饭", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_板蓝根", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_满穗线香", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_末嫦娥", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_琼华古冶散", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 16), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_原神丸", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_半满之月", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 48), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_辟风兽角", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 32), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_悠久的群天之甘露", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_龙心", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 64), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_果冻", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("UMPV_富营养的胶泥", 64), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv2", 1), RecipeUtil.deferredSlimefun("FD_植械突触分解机", 1), RecipeUtil.deferredSlimefun("TSgj3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), null, null, null, null, null });
        GltcMenuData.register("FD_植械突触分解机2", GltcMenuData_FD_植械突触分解机2.DATA);
        machine.applyMenu("FD_植械突触分解机2", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#acff26植&#99fd26械&#85fb26突&#72fa26触&#5ef825分&#4bf625解&#37f425机&f-&eII");
        machine.register(addon);
    }
}
