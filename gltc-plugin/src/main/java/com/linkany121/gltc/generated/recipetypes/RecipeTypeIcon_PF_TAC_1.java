package com.linkany121.gltc.generated.recipetypes;

import com.linkany121.gltc.item.GltcItemBuilder;
import org.bukkit.inventory.ItemStack;

public final class RecipeTypeIcon_PF_TAC_1 {
    private RecipeTypeIcon_PF_TAC_1() {}
    public static ItemStack icon() { return GltcItemBuilder.stack(RecipeTypeIcon_PF_TAC_1.DATA); }
    @SuppressWarnings("unchecked")
    public static final java.util.Map<String, Object> DATA = java.util.Map.ofEntries(
        java.util.Map.entry("glow", true),
        java.util.Map.entry("material", "beacon"),
        java.util.Map.entry("name", "&dTAC &e星图定位器"),
        java.util.Map.entry("lore", java.util.List.of("&7你需精准定位遥远却不再闪烁的群星。")),
        java.util.Map.entry("material_type", "mc")
    );
}
