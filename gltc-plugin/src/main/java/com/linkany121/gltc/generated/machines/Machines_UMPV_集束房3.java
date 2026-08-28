package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_UMPV_集束房3;
import com.linkany121.gltc.generated.menus.GltcMenuData_UMPV_集束房3;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_UMPV_集束房3 {
    private Machines_UMPV_集束房3() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("UMPV_集束房3", Items_UMPV_集束房3.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("UMPV_集束房3", Items_UMPV_集束房3.DATA),
            900,
            90,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(20, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_被动生物DNA集束片", 1), true), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("AL_A3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_生岩兽肉排", 2), 90), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_生餮头兽肉片", 2), 90), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_生完整全料羽兽", 2), 50), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("UMPV_极地高酷鲁毛兽卵", 2), 30)), false);
        machine.addGltcRecipe(20, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_水生生物DNA集束片", 1), true), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("AL_A3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_生比诺丁鱼", 2), 90), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_生古域鲸海鱼", 2), 90), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_霓斯那庭大海骡", 2), 50), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("UMPV_奇迹海域特产鱼子酱", 2), 30)), false);
        machine.addGltcRecipe(20, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_敌意生物DNA集束片", 1), true), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("AL_A3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_生野兽排肉", 2), 90), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_弃拉泊齿兽腿肉", 2), 70), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_剧毒厄索斯内脏肉排", 2), 50), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("UMPV_完整幼年虐王兽颈脊肉条", 2), 30)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv3", 1), RecipeUtil.deferredSlimefun("UMPV_集束房2", 1), RecipeUtil.deferredSlimefun("TSgj4", 1), RecipeUtil.deferredSlimefun("TSxl4", 1), null, null, null, null, null });
        GltcMenuData.register("UMPV_集束房3", GltcMenuData_UMPV_集束房3.DATA);
        machine.applyMenu("UMPV_集束房3", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#ffa99d插&#ffa78f槽&#ffa580式&#ffa372t&#ffa0633&#ff9e55#&#ff9c46D&#ff984bN&#ff9162A&#ff8a79液&#ff8390电&#ff7ca8集&#ff75bf束&#ff6ed6房&f-&eIII");
        machine.register(addon);
    }
}
