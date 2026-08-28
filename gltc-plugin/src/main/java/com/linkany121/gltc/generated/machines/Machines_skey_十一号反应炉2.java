package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_十一号反应炉2;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_十一号反应炉2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_十一号反应炉2 {
    private Machines_skey_十一号反应炉2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_十一号反应炉2", Items_skey_十一号反应炉2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_十一号反应炉2", Items_skey_十一号反应炉2.DATA),
            5120,
            512,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_红铁原矿", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_红墨钴锭", 3), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("skey_纳米红铁粉末", 3), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("skey_三方晶系钛粒", 3), 100)), false);
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_火镎矿", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_超浓缩铀", 3), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("skey_黄镎锭", 3), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("skey_活镎", 3), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("skey_逾限锿化合物", 1), 50)), false);
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_沉重耀斑石矿", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_黯饮重银", 3), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("skey_日耀锇锭", 3), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("skey_加涅厄卓片金", 3), 100)), false);
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_深空重冰原矿", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_富纤维硅晶", 3), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("skey_钠锂立方", 3), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("skey_深空铂粉", 3), 100), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("skey_风窒铱", 1), 40)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey2", 1), RecipeUtil.deferredSlimefun("skey_十一号反应炉", 1), RecipeUtil.deferredSlimefun("skey_框架1", 1), null, null, null, null, null, null });
        GltcMenuData.register("skey_十一号反应炉2", GltcMenuData_skey_十一号反应炉2.DATA);
        machine.applyMenu("skey_十一号反应炉2", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#ffcaab十&#fbc39b一&#f6bb8c号&#f2b47c大&#eeac6c型&#eaa55c反&#e59d4d应&#e1963d炉-&eII");
        machine.register(addon);
    }
}
