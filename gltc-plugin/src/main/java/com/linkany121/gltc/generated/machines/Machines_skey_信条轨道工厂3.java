package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_信条轨道工厂3;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_信条轨道工厂3;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_信条轨道工厂3 {
    private Machines_skey_信条轨道工厂3() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_信条轨道工厂3", Items_skey_信条轨道工厂3.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_信条轨道工厂3", Items_skey_信条轨道工厂3.DATA),
            51200,
            5120,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 11, 12, 14, 15)),
            RecipeUtil.intArray(java.util.List.of(27, 29, 31, 33, 35, 36, 38, 40, 42, 44, 45, 47, 49, 51, 53))
        );
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_能源土", 64), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(27, RecipeUtil.deferredSlimefun("skey_离子锁定气", 16), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("skey_突变轻烯片岩", 16), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("skey_GVS中坚矿族石料", 16), 100), new RecipeUtil.GltcOutputSlot(33, RecipeUtil.deferredSlimefun("skey_致密尘埃颗粒", 16), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("skey_迷迭色流体", 16), 100), new RecipeUtil.GltcOutputSlot(36, RecipeUtil.deferredSlimefun("skey_离子锁定气", 16), 60), new RecipeUtil.GltcOutputSlot(38, RecipeUtil.deferredSlimefun("skey_突变轻烯片岩", 16), 60), new RecipeUtil.GltcOutputSlot(40, RecipeUtil.deferredSlimefun("skey_GVS中坚矿族石料", 16), 60), new RecipeUtil.GltcOutputSlot(42, RecipeUtil.deferredSlimefun("skey_致密尘埃颗粒", 16), 60), new RecipeUtil.GltcOutputSlot(44, RecipeUtil.deferredSlimefun("skey_迷迭色流体", 16), 60), new RecipeUtil.GltcOutputSlot(45, RecipeUtil.deferredSlimefun("skey_离子锁定气", 16), 30), new RecipeUtil.GltcOutputSlot(47, RecipeUtil.deferredSlimefun("skey_突变轻烯片岩", 16), 30), new RecipeUtil.GltcOutputSlot(49, RecipeUtil.deferredSlimefun("skey_GVS中坚矿族石料", 16), 30), new RecipeUtil.GltcOutputSlot(51, RecipeUtil.deferredSlimefun("skey_致密尘埃颗粒", 16), 30), new RecipeUtil.GltcOutputSlot(53, RecipeUtil.deferredSlimefun("skey_迷迭色流体", 16), 30)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey3", 1), RecipeUtil.deferredSlimefun("skey_信条轨道工厂2", 1), RecipeUtil.deferredSlimefun("skey_框架2", 1), null, null, null, null, null, null });
        GltcMenuData.register("skey_信条轨道工厂3", GltcMenuData_skey_信条轨道工厂3.DATA);
        machine.applyMenu("skey_信条轨道工厂3", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#2293fa信&#3f94fc条&#5c95fe轨&#6d8aff道&#7275ff工&#7660ff厂-&eIII");
        machine.register(addon);
    }
}
