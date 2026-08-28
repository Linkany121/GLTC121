package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_重力集束熔炼房;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_重力集束熔炼房;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_重力集束熔炼房 {
    private Machines_skey_重力集束熔炼房() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_重力集束熔炼房", Items_skey_重力集束熔炼房.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_重力集束熔炼房", Items_skey_重力集束熔炼房.DATA),
            1280,
            128,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_黯饮重银", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_活泼肥料", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_工业起泡银", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_红墨钴锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgwhs", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_红磁流钴锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_黄镎锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("LScs1", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_忒弥斯锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_深空铂粉", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSthyy", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_纯净铂锭", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey1", 1), RecipeUtil.deferredSlimefun("TSwk4", 1), RecipeUtil.deferredSlimefun("TSgj5", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.TINTED_GLASS, 1), null, null, null, null, null });
        GltcMenuData.register("skey_重力集束熔炼房", GltcMenuData_skey_重力集束熔炼房.DATA);
        machine.applyMenu("skey_重力集束熔炼房", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#ff9090重&#f68282力&#ed7575集&#e36767束&#da5959熔&#d14c4c炼&#c83e3e房-&eI");
        machine.register(addon);
    }
}
