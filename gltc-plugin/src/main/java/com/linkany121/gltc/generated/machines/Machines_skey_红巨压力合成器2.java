package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_红巨压力合成器2;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_红巨压力合成器2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_红巨压力合成器2 {
    private Machines_skey_红巨压力合成器2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_红巨压力合成器2", Items_skey_红巨压力合成器2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_红巨压力合成器2", Items_skey_红巨压力合成器2.DATA),
            64000,
            6400,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(32, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_逾限锿化合物", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_光盐化𫓧", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_残青草晶", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("skey_权限凭证1", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_充能锿", 1), 100)), false);
        machine.addGltcRecipe(32, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_风窒铱", 64), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_风窒铱", 64), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_风窒铱", 64), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("skey_权限凭证2", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_至纯风暴铱", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey3", 1), RecipeUtil.deferredSlimefun("skey_红巨压力合成器", 1), RecipeUtil.deferredSlimefun("skey_框架3", 1), null, null, null, null, null, null });
        GltcMenuData.register("skey_红巨压力合成器2", GltcMenuData_skey_红巨压力合成器2.DATA);
        machine.applyMenu("skey_红巨压力合成器2", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#ff3d66S&#ff47854&#ff50a32&#ff5ac2T&#ff64e1E&#fa61de红&#f151b9巨&#e84194压&#de306f力&#d5204a合&#cb1025成&#c20000器-&eII");
        machine.register(addon);
    }
}
