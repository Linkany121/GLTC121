package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_光刻机;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_光刻机;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_光刻机 {
    private Machines_skey_光刻机() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_光刻机", Items_skey_光刻机.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_光刻机", Items_skey_光刻机.DATA),
            20480,
            2048,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_红铁锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_富纤维硅晶", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_权限凭证1", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_芯盘1", 1), 100)), false);
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_芯盘1", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_漩涡锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_权限凭证2", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_芯盘2", 1), 100)), false);
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_芯盘2", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_毡星锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_权限凭证3", 1), true)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_芯盘3", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey2", 1), RecipeUtil.deferredSlimefun("skey_框架2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BEACON, 1), null, null, null, null, null, null });
        GltcMenuData.register("skey_光刻机", GltcMenuData_skey_光刻机.DATA);
        machine.applyMenu("skey_光刻机", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#ec71ffT&#ee6fef-&#f06dde7&#f26bce破&#f469be梏&#f667ae三&#f7649d号&#f9628d光&#fb607d蚀&#fd5e6c刻&#ff5c5c机");
        machine.register(addon);
    }
}
