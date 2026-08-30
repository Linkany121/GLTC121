package com.linkany121.gltc.generated.generators;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_爆破式电阱分解座;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_爆破式电阱分解座;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcGenerator;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.inventory.ItemStack;

public final class Generators_skey_爆破式电阱分解座 {
    private Generators_skey_爆破式电阱分解座() {}
    public static void register(SlimefunAddon addon) {
        GltcGenerator gen = GltcGenerator.create(
            GltcItemGroups.B_B0,
            GltcItemBuilder.slimefunStack("skey_爆破式电阱分解座", Items_skey_爆破式电阱分解座.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_爆破式电阱分解座", Items_skey_爆破式电阱分解座.DATA),
            3250000,
            4096,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6, 11, 12, 13, 14, 15, 20, 21, 23, 24)),
            RecipeUtil.intArray(java.util.List.of(38, 39, 40, 41, 42, 47, 48, 49, 50, 51))
        );
        gen.addFuel(12, RecipeUtil.deferredSlimefun("skey_电动力阱", 1));
        gen.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey2", 1), RecipeUtil.deferredSlimefun("skey_框架2", 1), RecipeUtil.deferredSlimefun("skey_高能胶", 16), new org.bukkit.inventory.ItemStack(org.bukkit.Material.REDSTONE_TORCH, 1), null, null, null, null, null });
        GltcMenuData.register("skey_爆破式电阱分解座", GltcMenuData_skey_爆破式电阱分解座.DATA);
        gen.applyMenu("skey_爆破式电阱分解座", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#ffd84c &#ff3f3f爆&#ff5246破&#ff654d式&#ff7854电&#ff8c5a阱&#ff9f61分&#ffb268解&#ffc56f座");
        gen.register(addon);
    }
}
