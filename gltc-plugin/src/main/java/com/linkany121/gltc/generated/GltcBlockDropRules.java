package com.linkany121.gltc.generated;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.util.IdCanonicalizer;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.implementation.SlimefunItems;
import org.bukkit.inventory.ItemStack;
import org.bukkit.Material;

/** Auto-generated. Do not edit. */

public final class GltcBlockDropRules {
    private GltcBlockDropRules() {}
    public record Rule(Material material, int chance, String itemId, int minAmount, int maxAmount, int weight) {
        public int rollAmount() {
            if (minAmount >= maxAmount) {
                return minAmount;
            }
            return java.util.concurrent.ThreadLocalRandom.current().nextInt(minAmount, maxAmount + 1);
        }
    }
    public static final java.util.List<Rule> RULES = java.util.List.of(
        new Rule(org.bukkit.Material.DIRT, 15, "UMPV_一堆种子", 1, 3, 15),
        new Rule(org.bukkit.Material.DIRT, 15, "UMPV_一堆药材", 1, 3, 15)
    );
}
