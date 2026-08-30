package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_vasa_单元化魔素提取器;
import com.linkany121.gltc.generated.menus.GltcMenuData_vasa_单元化魔素提取器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_vasa_单元化魔素提取器 {
    private Machines_vasa_单元化魔素提取器() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.B_C1,
            GltcItemBuilder.slimefunStack("vasa_单元化魔素提取器", Items_vasa_单元化魔素提取器.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW2"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("vasa_单元化魔素提取器", Items_vasa_单元化魔素提取器.DATA),
            4096,
            512,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43))
        );
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_奥术原木", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_奥术原木提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_盛槟花", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_盛槟花提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_龙文凯安必忧兰", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_龙文凯安必忧兰提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_悦鸧花", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_悦鸧花提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_绽晶古树菇", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_绽晶古树菇提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_龙蛋果", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_龙蛋果提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_十九劫天赐樱", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_十九劫天赐樱提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_叠霄竹", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_叠霄竹提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_荆棘剑麻", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_荆棘剑麻提取物", 1), 100)), false);
        machine.addGltcRecipe(3, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("skey_舞火酿歌", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("vasa_舞火酿歌提取物", 1), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntvasa1", 1), RecipeUtil.deferredSlimefun("skey_框架1", 1), RecipeUtil.deferredSlimefun("skey_高能胶", 12), RecipeUtil.deferredSlimefun("skey_长生原木", 12), null, null, null, null, null });
        GltcMenuData.register("vasa_单元化魔素提取器", GltcMenuData_vasa_单元化魔素提取器.DATA);
        machine.applyMenu("vasa_单元化魔素提取器", "&#eb00ffV&#c66bffA&#00f0ffS&#4b9effA &#801bff单&#902bff元&#a03cff化&#b04cff魔&#bf5dff素&#cf6dff提&#df7eff取&#ef8eff器");
        machine.register(addon);
    }
}
