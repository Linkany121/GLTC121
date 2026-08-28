package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_四目伏羲级;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_四目伏羲级;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcMultiBlockMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_四目伏羲级 {
    private Machines_skey_四目伏羲级() {}
    public static void register(SlimefunAddon addon) {
        GltcMultiBlockMachine machine = GltcMultiBlockMachine.create(
            GltcItemGroups.B_B0,
            GltcItemBuilder.slimefunStack("skey_四目伏羲级", Items_skey_四目伏羲级.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_四目伏羲级", Items_skey_四目伏羲级.DATA),
            10,
            1,
            RecipeUtil.intArray(java.util.List.of(1, 2, 6, 7)),
            RecipeUtil.intArray(java.util.List.of(18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 41, 42, 43, 44))
        );
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_超浓缩铀", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_权限凭证1", 1), false), new RecipeUtil.GltcInputSlot(6, RecipeUtil.deferredSlimefun("skey_残余临界冷却剂", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(18, RecipeUtil.deferredSlimefun("skey_光盐化钍", 1), 10), new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("skey_光盐化钔", 1), 10), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("skey_光盐化钚", 1), 10), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("skey_光盐化𫓧", 1), 10), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("skey_光盐化𫟼", 1), 10), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("skey_光盐化𬭳", 1), 10), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("skey_电动力阱", 2), 60), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("skey_电动力阱", 3), 20)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_超浓缩铀", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_权限凭证2", 1), false), new RecipeUtil.GltcInputSlot(6, RecipeUtil.deferredSlimefun("skey_残余临界冷却剂", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(18, RecipeUtil.deferredSlimefun("skey_光盐化钍", 1), 20), new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("skey_光盐化钔", 1), 20), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("skey_光盐化钚", 1), 20), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("skey_光盐化𫓧", 1), 20), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("skey_光盐化𫟼", 1), 20), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("skey_光盐化𬭳", 1), 20), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("skey_电动力阱", 2), 90), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("skey_电动力阱", 3), 30)), false);
        machine.addGltcRecipe(12, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_超浓缩铀", 1), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_权限凭证3", 1), false), new RecipeUtil.GltcInputSlot(6, RecipeUtil.deferredSlimefun("skey_残余临界冷却剂", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(18, RecipeUtil.deferredSlimefun("skey_光盐化钍", 1), 35), new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("skey_光盐化钔", 1), 35), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("skey_光盐化钚", 1), 35), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("skey_光盐化𫓧", 1), 35), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("skey_光盐化𫟼", 1), 35), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("skey_光盐化𬭳", 1), 35), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("skey_电动力阱", 2), 100), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("skey_电动力阱", 5), 50)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey2", 1), RecipeUtil.deferredSlimefun("skey_框架2", 8), RecipeUtil.deferredSlimefun("skey_芯盘1", 1), null, null, null, null, null, null });
        GltcMenuData.register("skey_四目伏羲级", GltcMenuData_skey_四目伏羲级.DATA);
        machine.applyMenu("skey_四目伏羲级", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#ffd84c“&#ffc540四&#ffb235目&#ff9e29伏&#ff8b1d羲&#ff7812”&#ff6506级&#fd6800重&#fa8100核&#f79a00裂&#f4b300变&#f1cd00反&#eee600应&#ebff00堆");
        machine.register(addon);
    }
}
