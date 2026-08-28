package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_skey_重力集束熔炼房3;
import com.linkany121.gltc.generated.menus.GltcMenuData_skey_重力集束熔炼房3;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_skey_重力集束熔炼房3 {
    private Machines_skey_重力集束熔炼房3() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_B1,
            GltcItemBuilder.slimefunStack("skey_重力集束熔炼房3", Items_skey_重力集束熔炼房3.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("skey_重力集束熔炼房3", Items_skey_重力集束熔炼房3.DATA),
            10240,
            1024,
            RecipeUtil.intArray(java.util.List.of(1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 15, 16)),
            RecipeUtil.intArray(java.util.List.of(28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_黯饮重银", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_活泼肥料", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_工业起泡银", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_红墨钴锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSgwhs", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_红磁流钴锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_黄镎锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("LScs1", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_忒弥斯锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_深空铂粉", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("TSthyy", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_纯净铂锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_三方晶系钛粒", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_工业起泡银", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_铽-65基质粉芯", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_禁闭纯钛合金", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_加涅厄卓片金", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_忒弥斯锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_放射钪磷尾矿", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_錾制重金锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_日耀锇锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_红磁流钴锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_粗制碇钕晶簇", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_磁耀锇钢锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_活镎", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_纯净铂锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_碳钆聚集砂", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("skey_钠锂立方", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_镀铂电气合金锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_禁闭纯钛合金", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_錾制重金锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_光盐化钚", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("skey_光盐化钔", 8), false), new RecipeUtil.GltcInputSlot(5, RecipeUtil.deferredSlimefun("skey_微晶十字盐砂", 8), false), new RecipeUtil.GltcInputSlot(6, RecipeUtil.deferredSlimefun("skey_深渊辐电结晶", 8), false), new RecipeUtil.GltcInputSlot(7, RecipeUtil.deferredSlimefun("skey_活花质", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_伊甸红锭", 1), 100)), false);
        machine.addGltcRecipe(24, java.util.List.of(new RecipeUtil.GltcInputSlot(1, RecipeUtil.deferredSlimefun("skey_磁耀锇钢锭", 8), false), new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_镀铂电气合金锭", 8), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("skey_光盐化𫟼", 8), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("skey_光盐化𬭳", 8), false), new RecipeUtil.GltcInputSlot(5, RecipeUtil.deferredSlimefun("skey_尘核心", 8), false), new RecipeUtil.GltcInputSlot(6, RecipeUtil.deferredSlimefun("skey_重核心", 8), false), new RecipeUtil.GltcInputSlot(7, RecipeUtil.deferredSlimefun("skey_高钙磷根系坨", 8), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("skey_深境燃子素钢锭", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntskey3", 1), RecipeUtil.deferredSlimefun("skey_重力集束熔炼房2", 1), RecipeUtil.deferredSlimefun("skey_框架2", 1), RecipeUtil.deferredSlimefun("skey_芯盘1", 1), null, null, null, null, null });
        GltcMenuData.register("skey_重力集束熔炼房3", GltcMenuData_skey_重力集束熔炼房3.DATA);
        machine.applyMenu("skey_重力集束熔炼房3", "&#6f7dffS&#9fa8ffe&#cfd4ffk&#ffffffy &#ff9090重&#f68282力&#ed7575集&#e36767束&#da5959熔&#d14c4c炼&#c83e3e房-&eIII");
        machine.register(addon);
    }
}
