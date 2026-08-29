package com.linkany121.gltc.generated.script;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_VASA_术式承载转换仪;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.script.GltcScriptedMachine;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Scripted_VASA_术式承载转换仪 {
    public static final String SCRIPT_ID = "机器/术式承载转换仪";
    private Scripted_VASA_术式承载转换仪() {}
    public static void register(SlimefunAddon addon) {
        GltcScriptedMachine machine = GltcScriptedMachine.create(
            GltcItemGroups.B_C1,
            GltcItemBuilder.slimefunStack("VASA_术式承载转换仪", Items_VASA_术式承载转换仪.DATA),
            RecipeUtil.resolveRecipeType("None"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("VASA_术式承载转换仪", Items_VASA_术式承载转换仪.DATA),
            100,
            0,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52)),
            SCRIPT_ID
        );
        machine.setDeferredCraftingRecipe(new Object[0]);
        machine.applyMenu("VASA_术式承载转换仪", "VASA_术式承载转换仪");
        machine.register(addon);
    }
}
