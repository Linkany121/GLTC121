package com.linkany121.gltc.generated.machines;

import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.items.Items_OST_旧日魔法帽模拟器;
import com.linkany121.gltc.generated.menus.GltcMenuData_OST_旧日魔法帽模拟器;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import org.bukkit.inventory.ItemStack;

public final class Machines_OST_旧日魔法帽模拟器 {
    private Machines_OST_旧日魔法帽模拟器() {}
    public static void register(SlimefunAddon addon) {
        GltcRecipeMachine machine = GltcRecipeMachine.create(
            GltcItemGroups.DLC_B2,
            GltcItemBuilder.slimefunStack("OST_旧日魔法帽模拟器", Items_OST_旧日魔法帽模拟器.DATA),
            RecipeUtil.resolveRecipeType("PF_KEW"),
            RecipeUtil.resolveCraftingRecipe(new Object[0]),
            GltcItemBuilder.slimefunStack("OST_旧日魔法帽模拟器", Items_OST_旧日魔法帽模拟器.DATA),
            160,
            16,
            RecipeUtil.intArray(java.util.List.of(2, 3, 4, 5, 6)),
            RecipeUtil.intArray(java.util.List.of(19, 20, 21, 22, 23, 24, 25, 28, 29, 30, 31, 32, 33, 34, 37, 38, 39, 40, 41, 42, 43, 46, 47, 48, 49, 50, 51, 52))
        );
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素", 2), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("OST_基础逻素2", 2), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("OST_基础逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("STAFF_ELEMENTAL", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("MAGIC_LUMP_1", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("MAGIC_LUMP_2", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("ENDER_LUMP_1", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("ENDER_LUMP_2", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素2", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("INFUSED_MAGNET", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("MAGICAL_ZOMBIE_PILLS", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("INFUSED_HOPPER", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("REINFORCED_SPAWNER", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_基础逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("BROKEN_SPAWNER", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("INFERNAL_BONEMEAL", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("FLASK_OF_KNOWLEDGE", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("COMMON_TALISMAN", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 2), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("OST_高级逻素2", 2), false), new RecipeUtil.GltcInputSlot(4, RecipeUtil.deferredSlimefun("OST_高级逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("BLANK_RUNE", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("MAGIC_LUMP_3", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("ENDER_LUMP_3", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素2", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("MAGICAL_BOOK_COVER", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("RAINBOW_LEATHER", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("SYNTHETIC_SHULKER_SHELL", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("NECROTIC_SKULL", 16), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("ESSENCE_OF_AFTERLIFE", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_高级逻素3", 2), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("LAVA_CRYSTAL", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("STRANGE_NETHER_GOO", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("ELYTRA_SCALE", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("MAGICAL_GLASS", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_魔力逻素", 2), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("STAFF_ELEMENTAL", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("STAFF_ELEMENTAL_WIND", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("STAFF_ELEMENTAL_FIRE", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("STAFF_ELEMENTAL_WATER", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("STAFF_ELEMENTAL_STORM", 16), 100)), false);
        machine.addGltcRecipe(6, java.util.List.of(new RecipeUtil.GltcInputSlot(2, RecipeUtil.deferredSlimefun("OST_魔力逻素", 2), false), new RecipeUtil.GltcInputSlot(3, RecipeUtil.deferredSlimefun("BLANK_RUNE", 4), false)), java.util.List.of(new RecipeUtil.GltcOutputSlot(19, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_AIR", 16), 100), new RecipeUtil.GltcOutputSlot(20, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_FIRE", 16), 100), new RecipeUtil.GltcOutputSlot(21, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_EARTH", 16), 100), new RecipeUtil.GltcOutputSlot(22, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_WATER", 16), 100), new RecipeUtil.GltcOutputSlot(23, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_LIGHTNING", 16), 100), new RecipeUtil.GltcOutputSlot(24, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_ENDER", 16), 100), new RecipeUtil.GltcOutputSlot(25, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_RAINBOW", 16), 100), new RecipeUtil.GltcOutputSlot(28, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_ENCHANTMENT", 16), 100), new RecipeUtil.GltcOutputSlot(29, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_SOULBOUND", 16), 100), new RecipeUtil.GltcOutputSlot(30, RecipeUtil.deferredSlimefun("ANCIENT_RUNE_VILLAGERS", 16), 100)), false);
        machine.setDeferredCraftingRecipe(new Object[] { RecipeUtil.deferredSlimefun("ntost1", 1), RecipeUtil.deferredSlimefun("TSwk2", 1), RecipeUtil.deferredSlimefun("TSgj2", 1), RecipeUtil.deferredSlimefun("TSxl2", 1), new org.bukkit.inventory.ItemStack(org.bukkit.Material.PURPLE_WOOL, 1), null, null, null, null });
        GltcMenuData.register("OST_旧日魔法帽模拟器", GltcMenuData_OST_旧日魔法帽模拟器.DATA);
        machine.applyMenu("OST_旧日魔法帽模拟器", "&#10eb15O&#19c917S&#22a719T &#d2a8cc旧&#cc9bcb日&#c68ecb魔&#c081ca法&#bb74ca帽&#b567c9模&#af5ac9拟&#a94dc8器");
        machine.register(addon);
    }
}
