package com.linkany121.gltc.generated;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.util.IdCanonicalizer;
import com.linkany121.gltc.util.RecipeUtil;
import com.linkany121.gltc.util.GltcArmorEffects;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.implementation.SlimefunItems;
import org.bukkit.inventory.ItemStack;
import com.linkany121.gltc.generated.GltcItemGroups;
import io.github.thebusybiscuit.slimefun4.implementation.items.armor.SlimefunArmorPiece;
import com.linkany121.gltc.generated.items.Items_FKR_榆芒珀金头盔;
import com.linkany121.gltc.generated.items.Items_FKR_榆芒珀金肩甲;
import com.linkany121.gltc.generated.items.Items_FKR_榆芒珀金护胫;
import com.linkany121.gltc.generated.items.Items_FKR_榆芒珀金短靴;
import com.linkany121.gltc.generated.items.Items_FKR_玛瑙镀煌头盔;
import com.linkany121.gltc.generated.items.Items_FKR_玛瑙镀煌板甲;
import com.linkany121.gltc.generated.items.Items_FKR_玛瑙镀煌护腿;
import com.linkany121.gltc.generated.items.Items_FKR_玛瑙镀煌重靴;
import com.linkany121.gltc.generated.items.Items_fkr_占位符1;
import com.linkany121.gltc.generated.items.Items_FKR_终界寒子素钢盔;
import com.linkany121.gltc.generated.items.Items_FKR_终界寒子素钢甲;
import com.linkany121.gltc.generated.items.Items_FKR_终界寒子素钢裙;
import com.linkany121.gltc.generated.items.Items_FKR_终界寒子素钢靴;

/** Auto-generated. Do not edit. */

public final class GltcArmorSetsRegistry {
    private GltcArmorSetsRegistry() {}
    public static void register(SlimefunAddon addon) {
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_榆芒珀金头盔", Items_FKR_榆芒珀金头盔.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSpjd", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_榆芒珀金肩甲", Items_FKR_榆芒珀金肩甲.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSpjd", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_榆芒珀金护胫", Items_FKR_榆芒珀金护胫.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSpjd", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_榆芒珀金短靴", Items_FKR_榆芒珀金短靴.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSpjd", 24), null, null, null, null, null, null, null }), GltcArmorEffects.of("HASTE 0")).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_玛瑙镀煌头盔", Items_FKR_玛瑙镀煌头盔.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TShel", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_玛瑙镀煌板甲", Items_FKR_玛瑙镀煌板甲.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TShel", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_玛瑙镀煌护腿", Items_FKR_玛瑙镀煌护腿.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TShel", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_玛瑙镀煌重靴", Items_FKR_玛瑙镀煌重靴.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TShel", 24), null, null, null, null, null, null, null }), GltcArmorEffects.of("HEALTH_BOOST 0")).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("fkr_占位符1", Items_fkr_占位符1.DATA), RecipeUtil.resolveRecipeType("NULL"), new ItemStack[0], null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_终界寒子素钢盔", Items_FKR_终界寒子素钢盔.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSzjg", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_终界寒子素钢甲", Items_FKR_终界寒子素钢甲.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSzjg", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_终界寒子素钢裙", Items_FKR_终界寒子素钢裙.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSzjg", 24), null, null, null, null, null, null, null }), null).register(addon);
        new SlimefunArmorPiece(GltcItemGroups.A_G1b, GltcItemBuilder.slimefunStack("FKR_终界寒子素钢靴", Items_FKR_终界寒子素钢靴.DATA), RecipeUtil.resolveRecipeType("PF_DZC"), RecipeUtil.resolveCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("FKR_护具模板", 1), RecipeUtil.deferredSlimefun("TSzjg", 24), null, null, null, null, null, null, null }), GltcArmorEffects.of("STRENGTH 1", "HEALTH_BOOST 4")).register(addon);
    }
}
