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
import com.linkany121.gltc.generated.items.Items_TSstxkl;
import com.linkany121.gltc.generated.items.Items_TSstklp;
import com.linkany121.gltc.generated.items.Items_TSstxts;
import com.linkany121.gltc.generated.items.Items_TSstjsz;
import com.linkany121.gltc.generated.items.Items_TSstmyl;
import org.bukkit.entity.EntityType;

/** Auto-generated. Do not edit. */

public final class GltcMobDropRules {
    private GltcMobDropRules() {}
    public record Rule(EntityType entityType, int chance, String itemId, int amount) {}
    public static final java.util.List<Rule> RULES = java.util.List.of(
        new Rule(EntityType.SNOW_GOLEM, 60, "TSstxkl", 1),
        new Rule(EntityType.CREEPER, 60, "TSstklp", 1),
        new Rule(EntityType.SNIFFER, 60, "TSstxts", 1),
        new Rule(EntityType.WARDEN, 60, "TSstjsz", 1),
        new Rule(EntityType.ENDER_DRAGON, 99, "TSstmyl", 1)
    );
}
