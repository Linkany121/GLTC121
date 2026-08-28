package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_UMPV_密堆培育仓;
import com.linkany121.gltc.generated.menus.GltcMenuData_UMPV_密堆培育仓;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_UMPV_密堆培育仓 {
    private Machines_UMPV_密堆培育仓() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("UMPV_密堆培育仓", Items_UMPV_密堆培育仓.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("UMPV_密堆培育仓", Items_UMPV_密堆培育仓.DATA),
            160,
            16,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_淡绿鸧种子", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_浅香红脆果", 1), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_白卷卷心菜", 1), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_鎏明金脆果", 1), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_块结香颗粒", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_浮空兰蔬", 1), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_香甜辣瓜片", 1), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_涟音绿化根", 1), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_九里绕黄根茎", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_深坑马铃薯", 1), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_沙海小萝卜", 1), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_宝珠玉色根茎", 1), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_腐糯粉状菌丝", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_黯色片香菌", 1), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_螺剑菇", 1), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_猎斑化见手青", 1), 30)), true);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_铑金化石稻谷块", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_宝色浆果", 1), 70), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_传统烨金稻", 1), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_镀铑夜明灼叶草", 1), 30)), true);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_BLOCK, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIRT, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BONE_MEAL, 1), null, null, null, null, null });
        GltcMenuData.register("UMPV_密堆培育仓", GltcMenuData_UMPV_密堆培育仓.DATA);
        machine.applyMenu("UMPV_密堆培育仓", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#15e111可&#26e520密&#36e92f堆&#47ec3e式&#57f04d生&#68f45c态&#79f86b培&#89fb7a育&#9aff89仓");
        machine.register(addon);
    }
}
