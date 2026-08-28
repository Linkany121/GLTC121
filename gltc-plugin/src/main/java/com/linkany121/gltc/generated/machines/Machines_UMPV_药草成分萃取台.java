package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_UMPV_药草成分萃取台;
import com.linkany121.gltc.generated.menus.GltcMenuData_UMPV_药草成分萃取台;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_UMPV_药草成分萃取台 {
    private Machines_UMPV_药草成分萃取台() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.A_H2,
            GltcItemBuilder.slimefunStack("UMPV_药草成分萃取台", Items_UMPV_药草成分萃取台.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("UMPV_药草成分萃取台", Items_UMPV_药草成分萃取台.DATA),
            320,
            32,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_夜明华巧片", 5), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("UMPV_啜滑嗅幽茎", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_板蓝根", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_香炼盈穗烧", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_满穗线香", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_碳碾树末根", 5), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("UMPV_玉兔染黄草", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_末嫦娥", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_奇珏霸王荚", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_琼华古冶散", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_猛毒镇毒骨", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_原神丸", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_板蓝根", 3), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("UMPV_满穗线香", 3), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("UMPV_末嫦娥", 3), false), new RecipeUtil.GltcInputSlot(5, RecipeUtil.deferredSlimefun("UMPV_甜香朱露瓤", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_半满之月", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_原神丸", 3), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("UMPV_玉兔染黄草", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_辟风兽角", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_辟风兽角", 3), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("UMPV_龙心", 3), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_悠久的群天之甘露", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_半满之月", 3), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("UMPV_琼华古冶散", 3), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("UMPV_原神丸", 3), false), new RecipeUtil.GltcInputSlot(5, RecipeUtil.deferredSlimefun("UMPV_古金甘露巢", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_龙心", 1), 100)), false);
        machine.addGltcRecipe(8, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("UMPV_百香爆烤整身虐王排", 5), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("UMPV_疯狂星期四", 5), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("UMPV_黄金炒饭", 5), false), new RecipeUtil.GltcInputSlot(5, RecipeUtil.deferredSlimefun("UMPV_悠久的群天之甘露", 5), false), new RecipeUtil.GltcInputSlot(6, RecipeUtil.deferredSlimefun("UMPV_龙心", 5), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("UMPV_果冻", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntumpv2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.BREWING_STAND, 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), null, null, null, null, null });
        GltcMenuData.register("UMPV_药草成分萃取台", GltcMenuData_UMPV_药草成分萃取台.DATA);
        machine.applyMenu("UMPV_药草成分萃取台", "&#ff40faU&#f34ffcM&#e65dfdP&#da6cffV &#b6ff3f药&#91f53d草&#6cea3b成&#47e039分&#4bc87a萃&#4eafbc取&#5297fd台");
        machine.register(addon);
    }
}
