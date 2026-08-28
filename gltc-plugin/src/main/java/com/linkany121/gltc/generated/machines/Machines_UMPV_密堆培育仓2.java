package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_UMPV_密堆培育仓2;
import com.linkany121.gltc.generated.menus.GltcMenuData_UMPV_密堆培育仓2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_UMPV_密堆培育仓2 {
    private Machines_UMPV_密堆培育仓2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("UMPV_密堆培育仓2", Items_UMPV_密堆培育仓2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("UMPV_密堆培育仓2", Items_UMPV_密堆培育仓2.DATA),
            1600,
            160,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_淡绿鸧种子", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_浅香红脆果", 3), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_白卷卷心菜", 3), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_鎏明金脆果", 3), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_块结香颗粒", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_浮空兰蔬", 3), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_香甜辣瓜片", 3), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_涟音绿化根", 3), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_九里绕黄根茎", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_深坑马铃薯", 3), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_沙海小萝卜", 3), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_宝珠玉色根茎", 3), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_腐糯粉状菌丝", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_黯色片香菌", 3), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_螺剑菇", 3), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_猎斑化见手青", 3), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_铑金化石稻谷块", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_宝色浆果", 3), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_传统烨金稻", 3), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_镀铑夜明灼叶草", 3), 30)), true);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv2", 1), RecipeUtil.deferredSlimefun("UMPV_密堆培育仓", 1), RecipeUtil.deferredSlimefun("LISls3", 1), RecipeUtil.deferredSlimefun("TSgj4", 1), RecipeUtil.deferredSlimefun("TSxl4", 1), null, null, null, null });
        GltcMenuData.register("UMPV_密堆培育仓2", GltcMenuData_UMPV_密堆培育仓2.DATA);
        machine.applyMenu("UMPV_密堆培育仓2", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#15e111可&#26e520密&#36e92f堆&#47ec3e式&#57f04d生&#68f45c态&#79f86b培&#89fb7a育&#9aff89仓&f-&eII");
        machine.register(addon);
    }
}
