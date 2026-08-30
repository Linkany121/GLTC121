package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_vasa_标准打印站;
import com.linkany121.gltc.generated.menus.GltcMenuData_vasa_标准打印站;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_vasa_标准打印站 {
    private Machines_vasa_标准打印站() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_C1,
            GltcItemBuilder.slimefunStack("vasa_标准打印站", Items_vasa_标准打印站.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("vasa_标准打印站", Items_vasa_标准打印站.DATA),
            4096,
            512,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43))
        );
        // 支持配方：待补充
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntvasa2", 1), RecipeUtil.deferredSlimefun("skey_框架2", 1), RecipeUtil.deferredSlimefun("skey_高能胶", 12), RecipeUtil.deferredSlimefun("skey_奥术原木", 16), null, null, null, null, null });
        GltcMenuData.register("vasa_标准打印站", GltcMenuData_vasa_标准打印站.DATA);
        machine.applyMenu("vasa_标准打印站", "&#eb00ffV&#c66bffA&#00f0ffS&#4b9effA &#26d8ff环&#2dc5ff夜&#33b2ff谷&#3a9fff标&#418bff准&#4878ff打&#4e65ff印&#5552ff站");
        machine.register(addon);
    }
}
