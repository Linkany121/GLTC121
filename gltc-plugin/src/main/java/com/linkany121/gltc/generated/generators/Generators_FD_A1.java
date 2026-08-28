package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FD_A1;
import com.linkany121.gltc.generated.menus.GltcMenuData_FD_A1;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_FD_A1 {
    private Generators_FD_A1() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("FD_A1", Items_FD_A1.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FD_A1", Items_FD_A1.DATA),
            80,
            8,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(18, RecipeUtil.deferredSlimefun("AL_A6", 1));
        gen.setDeferredCraftingRecipe(new Object[] { null, RecipeUtil.deferredSlimefun("AL_A1", 1), null, RecipeUtil.deferredSlimefun("AL_A2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BUCKET, 1), RecipeUtil.deferredSlimefun("AL_A2", 1), null, RecipeUtil.deferredSlimefun("AL_A4", 1), null });
        GltcMenuData.register("FD_A1", GltcMenuData_FD_A1.DATA);
        gen.applyMenu("FD_A1", "&#ff5300A&#ff5b00T&#ff6300O &e临时能量释放器");
        gen.register(addon);
    }
}
