package com.linkany121.gltc.generated.script;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_舰体链接协议访问站;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.script.GltcScriptedMachine;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Scripted_skey_舰体链接协议访问站 {
    public static final String SCRIPT_ID = "机器/舰体链接协议访问站";
    private Scripted_skey_舰体链接协议访问站() {}
    public static void register(SlimefunAddon addon) {
        GltcScriptedMachine machine = GltcScriptedMachine.create(
            GltcItemGroups.B_B0,
            GltcItemBuilder.slimefunStack("skey_舰体链接协议访问站", Items_skey_舰体链接协议访问站.DATA),
            RecipeUtil.resolveRecipeType("ENHANCED_CRAFTING_TABLE"),
            RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey3", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.CRAFTING_TABLE, 1), RecipeUtil.deferredSlimefun("ntskey3", 1), null, null, null, null, null, null }),
            GltcItemBuilder.slimefunStack("skey_舰体链接协议访问站", Items_skey_舰体链接协议访问站.DATA),
            100,
            0,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.applyMenu("skey_舰体链接协议访问站", "skey_舰体链接协议访问站");
        machine.register(addon);
    }
}
