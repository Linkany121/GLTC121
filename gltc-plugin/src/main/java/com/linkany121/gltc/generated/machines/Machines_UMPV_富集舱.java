package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_UMPV_富集舱;
import com.linkany121.gltc.generated.menus.GltcMenuData_UMPV_富集舱;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_UMPV_富集舱 {
    private Machines_UMPV_富集舱() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("UMPV_富集舱", Items_UMPV_富集舱.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("UMPV_富集舱", Items_UMPV_富集舱.DATA),
            320,
            32,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_一堆药材", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_玉兔染黄草", 1), 30), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("UMPV_啜滑嗅幽茎", 1), 30), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("UMPV_猛毒镇毒骨", 1), 30), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("UMPV_奇珏霸王荚", 1), 30), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("UMPV_碳碾树末根", 1), 30), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("UMPV_甜香朱露瓤", 1), 30), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("UMPV_夜明华巧片", 1), 30), new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("UMPV_香炼盈穗烧", 1), 30), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("UMPV_古金甘露巢", 1), 30)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("AL_A3", 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_一堆药材", 1), 100)), true);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SHORT_GRASS, 1), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, new org.bukkit.inventory.ItemStack(org.bukkit.Material.SHORT_GRASS, 12), 100)), true);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv1", 1), RecipeUtil.deferredSlimefun("TSwk1", 1), RecipeUtil.deferredSlimefun("TSgj1", 1), RecipeUtil.deferredSlimefun("TSxl1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.AMETHYST_SHARD, 1), null, null, null, null });
        GltcMenuData.register("UMPV_富集舱", GltcMenuData_UMPV_富集舱.DATA);
        machine.applyMenu("UMPV_富集舱", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#fffb9d强&#e5faa0化&#ccf9a4追&#b2f7a7溯&#98f6ab型&#7ff5ae植&#65f4b2物&#4bf2b5富&#32f1b9集&#18f0bc舱");
        machine.register(addon);
    }
}
