package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_EAE_陈轩石匠一型2;
import com.linkany121.gltc.generated.menus.GltcMenuData_EAE_陈轩石匠一型2;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_EAE_陈轩石匠一型2 {
    private Machines_EAE_陈轩石匠一型2() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_F2,
            GltcItemBuilder.slimefunStack("EAE_陈轩石匠一型2", Items_EAE_陈轩石匠一型2.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("EAE_陈轩石匠一型2", Items_EAE_陈轩石匠一型2.DATA),
            4000,
            400,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(30, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLESTONE, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, new org.bukkit.inventory.ItemStack(org.bukkit.Material.STONE, 64), 10), new RecipeUtil.GltcOutputSlot(20, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DIORITE, 64), 10), new RecipeUtil.GltcOutputSlot(21, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GRANITE, 64), 10), new RecipeUtil.GltcOutputSlot(22, new org.bukkit.inventory.ItemStack(org.bukkit.Material.ANDESITE, 64), 10), new RecipeUtil.GltcOutputSlot(23, new org.bukkit.inventory.ItemStack(org.bukkit.Material.TUFF, 64), 10), new RecipeUtil.GltcOutputSlot(24, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DEEPSLATE, 64), 10), new RecipeUtil.GltcOutputSlot(25, new org.bukkit.inventory.ItemStack(org.bukkit.Material.COBBLED_DEEPSLATE, 64), 10), new RecipeUtil.GltcOutputSlot(28, new org.bukkit.inventory.ItemStack(org.bukkit.Material.MOSSY_COBBLESTONE, 64), 10), new RecipeUtil.GltcOutputSlot(29, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SANDSTONE, 64), 10), new RecipeUtil.GltcOutputSlot(30, new org.bukkit.inventory.ItemStack(org.bukkit.Material.RED_SANDSTONE, 64), 10), new RecipeUtil.GltcOutputSlot(31, new org.bukkit.inventory.ItemStack(org.bukkit.Material.PRISMARINE, 64), 10), new RecipeUtil.GltcOutputSlot(32, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DARK_PRISMARINE, 64), 10), new RecipeUtil.GltcOutputSlot(33, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHERRACK, 64), 10), new RecipeUtil.GltcOutputSlot(34, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BLACKSTONE, 64), 10), new RecipeUtil.GltcOutputSlot(37, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BASALT, 64), 10), new RecipeUtil.GltcOutputSlot(38, new org.bukkit.inventory.ItemStack(org.bukkit.Material.DRIPSTONE_BLOCK, 64), 10), new RecipeUtil.GltcOutputSlot(39, new org.bukkit.inventory.ItemStack(org.bukkit.Material.END_STONE, 64), 10), new RecipeUtil.GltcOutputSlot(40, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CALCITE, 64), 10), new RecipeUtil.GltcOutputSlot(41, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BONE_BLOCK, 64), 10), new RecipeUtil.GltcOutputSlot(42, new org.bukkit.inventory.ItemStack(org.bukkit.Material.MAGMA_BLOCK, 64), 10), new RecipeUtil.GltcOutputSlot(43, new org.bukkit.inventory.ItemStack(org.bukkit.Material.OBSIDIAN, 64), 10), new RecipeUtil.GltcOutputSlot(46, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CRYING_OBSIDIAN, 64), 10), new RecipeUtil.GltcOutputSlot(47, new org.bukkit.inventory.ItemStack(org.bukkit.Material.GILDED_BLACKSTONE, 64), 10), new RecipeUtil.GltcOutputSlot(48, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SMOOTH_STONE, 64), 10)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("nteae2", 1), RecipeUtil.deferredSlimefun("EAE_陈轩石匠一型", 1), RecipeUtil.deferredSlimefun("TSwk3", 1), RecipeUtil.deferredSlimefun("TSgj3", 1), RecipeUtil.deferredSlimefun("TSxl3", 1), null, null, null, null });
        GltcMenuData.register("EAE_陈轩石匠一型2", GltcMenuData_EAE_陈轩石匠一型2.DATA);
        machine.applyMenu("EAE_陈轩石匠一型2", "&#eac92fE&#df7b21A&#d42d13E &#49A998陈轩石匠一型&f-&eII");
        machine.register(addon);
    }
}
