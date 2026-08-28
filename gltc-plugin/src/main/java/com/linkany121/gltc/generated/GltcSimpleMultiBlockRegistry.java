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
import com.linkany121.gltc.generated.simplemb.SimpleMb_ATO_GT;
import com.linkany121.gltc.generated.simplemb.SimpleMb_ATO_GS;

/** Auto-generated. Do not edit. */

public final class GltcSimpleMultiBlockRegistry {
    private GltcSimpleMultiBlockRegistry() {}
    public static void register(SlimefunAddon addon) {
        SimpleMb_ATO_GT.register(addon);
        SimpleMb_ATO_GS.register(addon);
    }
}
