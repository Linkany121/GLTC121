package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_重型工业成型母机2;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_重型工业成型母机2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_重型工业成型母机2 {
    private Machines_skey_重型工业成型母机2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_重型工业成型母机2", Items_skey_重型工业成型母机2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_重型工业成型母机2", Items_skey_重型工业成型母机2.DATA),
            12800,
            1280,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_工业起泡银", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_红磁流钴锭", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_框架1", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_忒弥斯锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_惰性氡氧化合单元", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_液压1", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_纯净铂锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_黄金镀层熔浆", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_管道1", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_液压1", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_管道1", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_禁闭纯钛合金", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("skey_錾制重金锭", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_框架2", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_磁耀锇钢锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_G55溶胶气砖", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_液压2", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_镀铂电气合金锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_深境燃子素钢锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_焚风粒子电浆料", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_管道2", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_液压2", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_管道2", 1), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_伊甸红锭", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("skey_充能锿", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_框架3", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_框架3", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_至纯风暴铱", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_框架4", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey3", 1), RecipeUtil.deferredSlimefun("skey_重型工业成型母机", 1), RecipeUtil.deferredSlimefun("skey_框架2", 1), null, null, null, null, null, null });
        GltcMenuData.register("skey_重型工业成型母机2", GltcMenuData_skey_重型工业成型母机2.DATA);
        machine.applyMenu("skey_重型工业成型母机2", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#889ca0重&#aa8083型&#cc6466工&#ee4849业&#ff5242成&#ff8151型&#ffb161母&#ffe070机-&eII");
        machine.register(addon);
    }
}
