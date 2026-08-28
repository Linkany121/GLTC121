package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_FKR_锻造锤;
import com.linkany121.gltc.generated.menus.GltcMenuData_FKR_锻造锤;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_FKR_锻造锤 {
    private Machines_FKR_锻造锤() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_G2,
            GltcItemBuilder.slimefunStack("FKR_锻造锤", Items_FKR_锻造锤.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("FKR_锻造锤", Items_FKR_锻造锤.DATA),
            3200,
            320,
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 28, 29, 30, 37, 38, 39)),
            RecipeUtil.intArray(java.util.List.of(26, 35, 44, 53))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_武器工具模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSbd", 18), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_铋铲", 1), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("FKR_铋镐", 1), 100), new RecipeUtil.GltcOutputSlot(44, RecipeUtil.deferredSlimefun("FKR_铋斧", 1), 100), new RecipeUtil.GltcOutputSlot(53, RecipeUtil.deferredSlimefun("FKR_铋剑", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_武器工具模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSmbh", 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_棉铂华镀层手斧", 1), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("FKR_棉铂华淬火匕首", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_武器工具模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSkajd", 12), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_致密苦艾合金铲", 1), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("FKR_致密苦艾合金镐", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_武器工具模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSxwhd", 18), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_炽热星涡重斧", 1), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("FKR_炽热星涡砍刀", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_护具模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSpjd", 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_榆芒珀金头盔", 1), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("FKR_榆芒珀金肩甲", 1), 100), new RecipeUtil.GltcOutputSlot(44, RecipeUtil.deferredSlimefun("FKR_榆芒珀金护胫", 1), 100), new RecipeUtil.GltcOutputSlot(53, RecipeUtil.deferredSlimefun("FKR_榆芒珀金短靴", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_护具模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TShel", 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_玛瑙镀煌头盔", 1), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("FKR_玛瑙镀煌板甲", 1), 100), new RecipeUtil.GltcOutputSlot(44, RecipeUtil.deferredSlimefun("FKR_玛瑙镀煌护腿", 1), 100), new RecipeUtil.GltcOutputSlot(53, RecipeUtil.deferredSlimefun("FKR_玛瑙镀煌重靴", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_护具模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSzjg", 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_终界寒子素钢盔", 1), 100), new RecipeUtil.GltcOutputSlot(35, RecipeUtil.deferredSlimefun("FKR_终界寒子素钢甲", 1), 100), new RecipeUtil.GltcOutputSlot(44, RecipeUtil.deferredSlimefun("FKR_终界寒子素钢裙", 1), 100), new RecipeUtil.GltcOutputSlot(53, RecipeUtil.deferredSlimefun("FKR_终界寒子素钢靴", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSwk2", 24), false), new RecipeUtil.GltcInputSlot(21, RecipeUtil.deferredSlimefun("TSxl5", 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_伏地", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSlx", 64), false), new RecipeUtil.GltcInputSlot(21, RecipeUtil.deferredSlimefun("TSxl5", 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_风墟龙冕", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), true), new RecipeUtil.GltcInputSlot(20, new org.bukkit.inventory.ItemStack(org.bukkit.Material.NETHERITE_BLOCK, 48), false), new RecipeUtil.GltcInputSlot(21, RecipeUtil.deferredSlimefun("TSxl5", 24), false), new RecipeUtil.GltcInputSlot(28, RecipeUtil.deferredSlimefun("TSzjg", 32), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_无锋破军", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSgj5", 48), false), new RecipeUtil.GltcInputSlot(21, RecipeUtil.deferredSlimefun("TSxl5", 48), false), new RecipeUtil.GltcInputSlot(28, RecipeUtil.deferredSlimefun("LScs3", 32), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_隐兰狂玉唤剑葫", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("UMPV_浮沉盐海的阖眸", 8), false), new RecipeUtil.GltcInputSlot(21, RecipeUtil.deferredSlimefun("TSxl5", 24), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_ASPL", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(19, RecipeUtil.deferredSlimefun("FKR_特殊模板", 1), true), new RecipeUtil.GltcInputSlot(20, RecipeUtil.deferredSlimefun("TSgj5", 64), false), new RecipeUtil.GltcInputSlot(21, RecipeUtil.deferredSlimefun("LSyq4", 32), false), new RecipeUtil.GltcInputSlot(28, RecipeUtil.deferredSlimefun("LScs3", 32), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(26, RecipeUtil.deferredSlimefun("FKR_咀嚼曾世的晚梦", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntfkr1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.IRON_BLOCK, 1), null, null, null, null });
        GltcMenuData.register("FKR_锻造锤", GltcMenuData_FKR_锻造锤.DATA);
        machine.applyMenu("FKR_锻造锤", "&#a30000F&#e00000K&#ff0000R&#ff0000T &#ff5300灼&#ff3700尔&#ff1c00格&#ff0000涅&#de0000巨&#be0000恒&#9d0000星&#8a1c1c锻&#783939造&#655555锤");
        machine.register(addon);
    }
}
