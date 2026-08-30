package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_vasa_夜幕指标级;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcMultiBlockMachine;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_vasa_夜幕指标级 {
    private Machines_vasa_夜幕指标级() {}
    public static void register(SlimefunAddon addon) {
        GltcMultiBlockMachine machine = GltcMultiBlockMachine.create(
            GltcItemGroups.B_C1,
            GltcItemBuilder.slimefunStack("vasa_夜幕指标级", Items_vasa_夜幕指标级.DATA),
            RecipeUtil.resolveRecipeType("PF_CC23_SJS"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("vasa_夜幕指标级", Items_vasa_夜幕指标级.DATA),
            15000,
            1500,
            RecipeUtil.intArray(java.util.List.of(4)),
            RecipeUtil.intArray(java.util.List.of(10, 11, 12, 13, 14, 15, 16, 19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43))
        );
        machine.applyMenu("vasa_夜幕指标级", "&#415fff“&#5a69ff夜&#7474ff幕&#8d7eff指&#a688ff标&#bc88fb”&#cc75ef级&#db61e3巨&#ea4dd6型&#fa3aca极&#f432ce奥&#e231da超&#d130e7算&#c02ef3中&#af2dff心");
        machine.register(addon);
    }
}
