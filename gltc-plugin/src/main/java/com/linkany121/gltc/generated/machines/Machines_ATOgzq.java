package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATOgzq;
import com.linkany121.gltc.generated.menus.GltcMenuData_ATOgzq;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_ATOgzq {
    private Machines_ATOgzq() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATOgzq", Items_ATOgzq.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("ATOgzq", Items_ATOgzq.DATA),
            8,
            4,
            RecipeUtil.intArray(java.util.List.of(3, 4, 5)),
            RecipeUtil.intArray(java.util.List.of(21, 22, 23))
        );
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.LAVA_BUCKET, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("TSyjt", 1), 100), new RecipeUtil.GltcOutputSlot(22, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BUCKET, 1), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.WATER_BUCKET, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("TSjst", 1), 100), new RecipeUtil.GltcOutputSlot(22, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BUCKET, 1), 100)), false);
        machine.addGltcRecipe(1, java.util.List.of(new RecipeUtil.GltcInputSlot(3, new org.bukkit.inventory.ItemStack(org.bukkit.Material.MAGMA_BLOCK, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("TSyjt", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.BUCKET, 1), null, new org.bukkit.inventory.ItemStack(org.bukkit.Material.CLAY_BALL, 1), RecipeUtil.deferredSlimefun("ATOcd1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CLAY_BALL, 1), RecipeUtil.deferredSlimefun("TSgd", 1), RecipeUtil.deferredSlimefun("TSgd", 1), RecipeUtil.deferredSlimefun("TSgd", 1) });
        GltcMenuData.register("ATOgzq", GltcMenuData_ATOgzq.DATA);
        machine.applyMenu("ATOgzq", "&#ff5300A&#ff5b00T&#ff6300O &#5c9cf0简单灌装器&7(I)");
        machine.register(addon);
    }
}
