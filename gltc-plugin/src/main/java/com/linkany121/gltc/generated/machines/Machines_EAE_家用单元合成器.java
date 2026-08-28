package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_EAE_家用单元合成器;
import com.linkany121.gltc.generated.menus.GltcMenuData_EAE_家用单元合成器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_EAE_家用单元合成器 {
    private Machines_EAE_家用单元合成器() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_F2,
            GltcItemBuilder.slimefunStack("EAE_家用单元合成器", Items_EAE_家用单元合成器.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("EAE_家用单元合成器", Items_EAE_家用单元合成器.DATA),
            640,
            64,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GUNPOWDER, 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TSstklp", 64), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GLASS, 64), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GLASS_BOTTLE, 64), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GLASS_BOTTLE, 32), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, com.linkany121.gltc.item.SavedItemLoader.get("BC_原版_水瓶"), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BUCKET, 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, new org.bukkit.inventory.ItemStack(org.bukkit.Material.WATER_BUCKET, 8), 100), new RecipeUtil.GltcOutputSlot(20, new org.bukkit.inventory.ItemStack(org.bukkit.Material.LAVA_BUCKET, 8), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgd", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("EAE_合金滤芯", 1), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSkajd", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("EAE_有机合金滤芯", 3), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIAMOND_BLOCK, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TS2tj1", 16), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TStgs", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TS2tj2", 16), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSzjg", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("TS2tj3", 16), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("nteae1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CRAFTING_TABLE, 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), null, null, null });
        GltcMenuData.register("EAE_家用单元合成器", GltcMenuData_EAE_家用单元合成器.DATA);
        machine.applyMenu("EAE_家用单元合成器", "&#eac92fE&#df7b21A&#d42d13E &#24c257家&#35c44f用&#47c746单&#58c93e元&#69cb35合&#7bce2d成&#8cd024器");
        machine.register(addon);
    }
}
