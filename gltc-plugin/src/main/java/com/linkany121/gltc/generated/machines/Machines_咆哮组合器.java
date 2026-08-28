package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_咆哮组合器;
import com.linkany121.gltc.generated.menus.GltcMenuData_咆哮组合器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcWorkbench;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_咆哮组合器 {
    private Machines_咆哮组合器() {}
    public static void register(SlimefunAddon addon) {
        GltcWorkbench machine = GltcWorkbench.create(
            GltcItemGroups.Z_PX,
            GltcItemBuilder.slimefunStack("咆哮组合器", Items_咆哮组合器.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("咆哮组合器", Items_咆哮组合器.DATA),
            24000,
            1200,
            RecipeUtil.intArray(java.util.List.of(10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 29, 30, 31, 32, 33)),
            RecipeUtil.intArray(java.util.List.of(16))
        );
        machine.setCraftClickSlot(25);
        machine.addInstantRecipe(java.util.List.of(new RecipeUtil.GltcInputSlot(10, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SHULKER_SHELL, 1), false), new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("TSgj5", 48), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("TSxl5", 48), false), new RecipeUtil.GltcInputSlot(13, RecipeUtil.deferredSlimefun("LScs3", 48), false), new RecipeUtil.GltcInputSlot(14, RecipeUtil.deferredSlimefun("UMPV_果冻", 48), false), new RecipeUtil.GltcInputSlot(15, RecipeUtil.deferredSlimefun("skey_权限凭证2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("咆哮外壳", 1), 100)), false);
        machine.addInstantRecipe(java.util.List.of(new RecipeUtil.GltcInputSlot(10, RecipeUtil.deferredSlimefun("咆哮外壳", 1), false), new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("ntost3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("OST_咆哮盒", 1), 100)), false);
        machine.addInstantRecipe(java.util.List.of(new RecipeUtil.GltcInputSlot(10, RecipeUtil.deferredSlimefun("咆哮外壳", 1), false), new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("ntts3", 1), false), new RecipeUtil.GltcInputSlot(12, RecipeUtil.deferredSlimefun("ntls3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("YSJ_咆哮盒", 1), 100)), false);
        machine.addInstantRecipe(java.util.List.of(new RecipeUtil.GltcInputSlot(10, RecipeUtil.deferredSlimefun("咆哮外壳", 1), false), new RecipeUtil.GltcInputSlot(11, RecipeUtil.deferredSlimefun("nteae3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(16, RecipeUtil.deferredSlimefun("EAE_咆哮盒", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("TSgj5", 64), RecipeUtil.deferredSlimefun("TSxl5", 64), RecipeUtil.deferredSlimefun("FKR_隐兰狂玉唤剑葫", 1), null, null, null, null, null, null });
        GltcMenuData.register("咆哮组合器", GltcMenuData_咆哮组合器.DATA);
        machine.applyMenu("咆哮组合器", "&#ffffffn&#eadefbu&#d6bcf7l&#c19bf4l&#ac7af0G&#9759ec#&#9646d9 &#a741b7咆&#b83d95哮&#c93974组&#da3452合&#eb3030器");
        machine.register(addon);
    }
}
