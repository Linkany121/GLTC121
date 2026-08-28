package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_空白订单打印机;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_空白订单打印机;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_空白订单打印机 {
    private Machines_skey_空白订单打印机() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_空白订单打印机", Items_skey_空白订单打印机.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_空白订单打印机", Items_skey_空白订单打印机.DATA),
            1280,
            128,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(10, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_长生原木", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_空白订单", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("skey_长生原木", 1), RecipeUtil.deferredSlimefun("skey_长生原木", 1), RecipeUtil.deferredSlimefun("skey_长生原木", 1), null, RecipeUtil.deferredSlimefun("skey_框架1", 1), null, null, null, null });
        GltcMenuData.register("skey_空白订单打印机", GltcMenuData_skey_空白订单打印机.DATA);
        machine.applyMenu("skey_空白订单打印机", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#bff3ff空&#d4f7ff白&#eafbff订&#ffffff单&#d7fff0打&#aeffe2印&#86ffd3机");
        machine.register(addon);
    }
}
