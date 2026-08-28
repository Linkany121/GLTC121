package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_LIScssp1;
import com.linkany121.gltc.generated.menus.GltcMenuData_LIScssp1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_LIScssp1 {
    private Machines_LIScssp1() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_E2,
            GltcItemBuilder.slimefunStack("LIScssp1", Items_LIScssp1.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("LIScssp1", Items_LIScssp1.DATA),
            2560,
            256,
            RecipeUtil.intArray(java.util.List.of(10)),
            RecipeUtil.intArray(java.util.List.of(13, 14, 21, 22, 23, 30, 31, 32, 39, 40))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(10, RecipeUtil.deferredSlimefun("LSyq10", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(13, RecipeUtil.deferredSlimefun("LScs1", 1), 100), new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("LScs2", 1), 50), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("LScs3", 1), 10)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(10, RecipeUtil.deferredSlimefun("LScs2", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(13, RecipeUtil.deferredSlimefun("LSyq1", 1), 5), new RecipeUtil.GltcOutputSlot(14, RecipeUtil.deferredSlimefun("LSyq2", 1), 5), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("LSyq3", 1), 5), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("LSyq4", 1), 5), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("LSyq5", 1), 5), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("LSyq6", 1), 5), new RecipeUtil.GltcOutputSlot(31, RecipeUtil.deferredSlimefun("LSyq7", 1), 5), new RecipeUtil.GltcOutputSlot(32, RecipeUtil.deferredSlimefun("LSyq8", 1), 5), new RecipeUtil.GltcOutputSlot(39, RecipeUtil.deferredSlimefun("LSyq9", 1), 5), new RecipeUtil.GltcOutputSlot(40, RecipeUtil.deferredSlimefun("LSyq10", 1), 5)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(10, RecipeUtil.deferredSlimefun("LScs1", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(13, RecipeUtil.deferredSlimefun("LScs3", 1), 80)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntls3", 1), RecipeUtil.deferredSlimefun("TSwk4", 1), RecipeUtil.deferredSlimefun("TSgj4", 1), RecipeUtil.deferredSlimefun("TSxl4", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.TRAPPED_CHEST, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.APPLE, 1), null, null, null });
        GltcMenuData.register("LIScssp1", GltcMenuData_LIScssp1.DATA);
        machine.applyMenu("LIScssp1", "&#e0ffe7L&#a1ffc9S&#63ffacI&#24ff8eA &#ff1e8e“&#f121a1上&#e425b4帝&#d628c7的&#c82bd9暗&#bb2fec房&#ad32ff”");
        machine.register(addon);
    }
}
