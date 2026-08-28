package com.linkany121.gltc.generated.script;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_ATO_能源流储蓄站;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.script.GltcScriptedMachine;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Scripted_ATO_能源流储蓄站 {
    public static final String SCRIPT_ID = "能源流货币/充值机";
    private Scripted_ATO_能源流储蓄站() {}
    public static void register(SlimefunAddon addon) {
        GltcScriptedMachine machine = GltcScriptedMachine.create(
            GltcItemGroups.A_B2,
            GltcItemBuilder.slimefunStack("ATO_能源流储蓄站", Items_ATO_能源流储蓄站.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("AL_A1", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CRAFTING_TABLE, 1), RecipeUtil.deferredSlimefun("AL_A1", 1), null, null, null, null, null, null }),
            GltcItemBuilder.slimefunStack("ATO_能源流储蓄站", Items_ATO_能源流储蓄站.DATA),
            100,
            0,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.applyMenu("ATO_能源流储蓄站", "ATO_能源流储蓄站");
        machine.register(addon);
    }
}
