package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_专注型合金锻炉;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_专注型合金锻炉;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_专注型合金锻炉 {
    private Machines_skey_专注型合金锻炉() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_专注型合金锻炉", Items_skey_专注型合金锻炉.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_专注型合金锻炉", Items_skey_专注型合金锻炉.DATA),
            6400,
            640,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_纳米红铁粉末", 16), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_红铁锭", 1), 100)), false);
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_红铁锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_光盐化钍", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_漩涡锭", 1), 100)), false);
        machine.addGltcRecipe(9, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_漩涡锭", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_毡星锭", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey2", 1), RecipeUtil.deferredSlimefun("skey_框架2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.END_CRYSTAL, 1), null, null, null, null, null, null });
        GltcMenuData.register("skey_专注型合金锻炉", GltcMenuData_skey_专注型合金锻炉.DATA);
        machine.applyMenu("skey_专注型合金锻炉", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#f4b0ffT&#ea89c6-&#df628e7&#d53b55专&#ca141c注&#cb0000型&#d80000合&#e50000金&#f20000锻&#ff0000炉");
        machine.register(addon);
    }
}
