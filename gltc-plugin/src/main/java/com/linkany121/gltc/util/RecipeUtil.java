package com.linkany121.gltc.util;

import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import org.bukkit.Material;
import org.bukkit.inventory.ItemStack;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public final class RecipeUtil {

    private static final Pattern SLIMEFUN_ID = Pattern.compile(".*[A-Z_].*");

    private RecipeUtil() {
    }

    public record DeferredStack(String id, int amount) {
    }

    public static RecipeType resolveRecipeType(String name) {
        if (name == null || name.isBlank() || "NULL".equalsIgnoreCase(name) || "None".equalsIgnoreCase(name)) {
            return RecipeType.NULL;
        }
        if (name.startsWith("RecipeType.")) {
            name = name.substring("RecipeType.".length());
        }
        return switch (name) {
            case "ENHANCED_CRAFTING_TABLE" -> RecipeType.ENHANCED_CRAFTING_TABLE;
            case "MAGIC_WORKBENCH" -> RecipeType.MAGIC_WORKBENCH;
            case "ARMOR_FORGE" -> RecipeType.ARMOR_FORGE;
            case "GRIND_STONE" -> RecipeType.GRIND_STONE;
            case "SMELTERY" -> RecipeType.SMELTERY;
            case "ORE_CRUSHER" -> RecipeType.ORE_CRUSHER;
            case "COMPRESSOR" -> RecipeType.COMPRESSOR;
            case "PRESSURE_CHAMBER" -> RecipeType.PRESSURE_CHAMBER;
            case "HEATED_PRESSURE_CHAMBER" -> RecipeType.HEATED_PRESSURE_CHAMBER;
            case "FOOD_FABRICATOR" -> RecipeType.FOOD_FABRICATOR;
            case "FOOD_COMPOSTER" -> RecipeType.FOOD_COMPOSTER;
            case "ANCIENT_ALTAR" -> RecipeType.ANCIENT_ALTAR;
            case "SMOKER" -> com.linkany121.gltc.generated.GltcRecipeTypes.byName("SMOKER");
            default -> com.linkany121.gltc.generated.GltcRecipeTypes.byName(name);
        };
    }

    public static DeferredStack deferredSlimefun(String id, int amount) {
        return new DeferredStack(canonicalId(id), Math.max(1, amount));
    }

    public static ItemStack resolveMaterial(Object spec) {
        if (spec == null) {
            return null;
        }
        if (spec instanceof ItemStack stack) {
            return stack.clone();
        }
        if (spec instanceof DeferredStack deferred) {
            return slimefunIngredient(deferred.id(), deferred.amount());
        }
        return null;
    }

    public static ItemStack[] resolveCraftingRecipe(Object[] slots) {
        ItemStack[] recipe = new ItemStack[9];
        if (slots == null) {
            return recipe;
        }
        for (int i = 0; i < Math.min(slots.length, recipe.length); i++) {
            recipe[i] = resolveMaterial(slots[i]);
        }
        return recipe;
    }

    public static ItemStack[] craftingRecipe(Map<String, Object> recipeMap) {
        Object[] slots = new Object[9];
        if (recipeMap == null) {
            return resolveCraftingRecipe(slots);
        }
        for (Map.Entry<String, Object> entry : recipeMap.entrySet()) {
            int slot;
            try {
                slot = Integer.parseInt(entry.getKey()) - 1;
            } catch (NumberFormatException ex) {
                continue;
            }
            if (slot < 0 || slot > 8) {
                continue;
            }
            slots[slot] = materialSpec(asMap(entry.getValue()), 1);
        }
        return resolveCraftingRecipe(slots);
    }

    public static Object materialSpec(Map<String, Object> spec, int defaultAmount) {
        if (spec == null || spec.isEmpty()) {
            return null;
        }
        int amount = intVal(spec, "amount", defaultAmount);
        String type = effectiveMaterialType(spec);
        if ("slimefun".equals(type)) {
            return deferredSlimefun(str(spec, "material", "STONE"), amount);
        }
        if ("saveditem".equals(type)) {
            return com.linkany121.gltc.item.SavedItemLoader.get(str(spec, "material", "missing"));
        }
        Material material = Material.matchMaterial(str(spec, "material", "STONE").toUpperCase(Locale.ROOT));
        if (material == null) {
            material = Material.matchMaterial(str(spec, "material", "STONE"));
        }
        if (material == null) {
            SlimefunItem sfItem = resolveSlimefunItem(str(spec, "material", "STONE"));
            if (sfItem != null) {
                return deferredSlimefun(sfItem.getId(), amount);
            }
            material = Material.STONE;
        }
        return new ItemStack(material, amount);
    }

    public static ItemStack materialStack(Map<String, Object> spec, int defaultAmount) {
        return resolveMaterial(materialSpec(spec, defaultAmount));
    }

    public static List<Object> inputSpecs(Map<String, Object> inputs) {
        List<Object> list = new ArrayList<>();
        if (inputs == null) {
            return list;
        }
        inputs.entrySet().stream()
            .sorted(Map.Entry.comparingByKey((a, b) -> Integer.compare(parseInt(a, 0), parseInt(b, 0))))
            .forEach(entry -> {
                Object spec = materialSpec(asMap(entry.getValue()), 1);
                if (spec != null) {
                    list.add(spec);
                }
            });
        return list;
    }

    public static List<ItemStack> inputStacks(Map<String, Object> inputs) {
        List<ItemStack> list = new ArrayList<>();
        for (Object spec : inputSpecs(inputs)) {
            ItemStack stack = resolveMaterial(spec);
            if (stack != null) {
                list.add(stack);
            }
        }
        return list;
    }

    public static List<GltcOutputStack> outputSpecs(Map<String, Object> outputs) {
        List<GltcOutputStack> list = new ArrayList<>();
        if (outputs == null) {
            return list;
        }
        outputs.entrySet().stream()
            .sorted(Map.Entry.comparingByKey((a, b) -> Integer.compare(parseInt(a, 0), parseInt(b, 0))))
            .forEach(entry -> {
                Map<String, Object> spec = asMap(entry.getValue());
                Object stack = materialSpec(spec, 1);
                if (stack != null) {
                    int chance = intVal(spec, "chance", 100);
                    list.add(new GltcOutputStack(stack, chance));
                }
            });
        return list;
    }

    public static List<GltcOutputStack> outputStacks(Map<String, Object> outputs) {
        List<GltcOutputStack> list = new ArrayList<>();
        for (GltcOutputStack spec : outputSpecs(outputs)) {
            list.add(new GltcOutputStack(resolveMaterial(spec.stack()), spec.chance()));
        }
        return list;
    }

    public static ItemStack slimefunIngredient(String id, int amount) {
        SlimefunItem item = resolveSlimefunItem(id);
        if (item != null) {
            ItemStack stack = item.getItem().clone();
            stack.setAmount(Math.max(1, amount));
            return stack;
        }
        // RSC CommonUtils: try vanilla Material before failing (codegen may emit deferredSlimefun("IRON_INGOT")).
        Material vanilla = Material.matchMaterial(id == null ? "" : id.toUpperCase(Locale.ROOT));
        if (vanilla == null && id != null) {
            vanilla = Material.matchMaterial(id);
        }
        if (vanilla != null && vanilla.isItem() && !vanilla.isAir()) {
            return new ItemStack(vanilla, Math.max(1, amount));
        }
        // Prefer null over BARRIER so RecipeFixup can skip broken recipes.
        return null;
    }

    private static SlimefunItem resolveSlimefunItem(String id) {
        if (id == null || id.isBlank()) {
            return null;
        }
        String[] candidates = {
            IdCanonicalizer.slimefunId(id),
            IdCanonicalizer.canonical(id),
            id,
            id.toUpperCase(Locale.ROOT),
            id.toLowerCase(Locale.ROOT)
        };
        for (String candidate : candidates) {
            if (candidate == null || candidate.isBlank()) {
                continue;
            }
            SlimefunItem item = SlimefunItem.getById(candidate);
            if (item != null) {
                return item;
            }
        }
        String needle = id.toLowerCase(Locale.ROOT);
        for (SlimefunItem item : io.github.thebusybiscuit.slimefun4.implementation.Slimefun.getRegistry().getAllSlimefunItems()) {
            if (item.getId().equalsIgnoreCase(id) || item.getId().toLowerCase(Locale.ROOT).equals(needle)) {
                return item;
            }
        }
        return null;
    }

    public static String effectiveMaterialType(Map<String, Object> spec) {
        String type = str(spec, "material_type", "mc").toLowerCase(Locale.ROOT);
        if (!"mc".equals(type)) {
            return type;
        }
        String raw = str(spec, "material", "STONE");
        // Explicit mc + valid vanilla material must stay vanilla (iron_block, moss_block, …).
        Material vanilla = Material.matchMaterial(raw.toUpperCase(Locale.ROOT));
        if (vanilla == null) {
            vanilla = Material.matchMaterial(raw);
        }
        if (vanilla != null) {
            return "mc";
        }
        if (IdCanonicalizer.snapshot().containsKey(raw.toLowerCase(Locale.ROOT))) {
            return "slimefun";
        }
        if (containsNonAscii(raw)) {
            return "slimefun";
        }
        if (SLIMEFUN_ID.matcher(raw).matches() && raw.contains("_")) {
            return "slimefun";
        }
        return "mc";
    }

    private static boolean containsNonAscii(String value) {
        for (int i = 0; i < value.length(); i++) {
            if (value.charAt(i) > 127) {
                return true;
            }
        }
        return false;
    }

    public static int[] intArray(List<Integer> values) {
        return values.stream().mapToInt(Integer::intValue).toArray();
    }

    public static String canonicalId(String id) {
        return IdCanonicalizer.canonical(id);
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> asMap(Object value) {
        if (value instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private static int intVal(Map<String, Object> map, String key, int fallback) {
        Object value = map.get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value == null) {
            return fallback;
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private static String str(Map<String, Object> map, String key, String fallback) {
        Object value = map.get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private static int parseInt(String value, int fallback) {
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    public record GltcOutputStack(Object stack, int chance) {
        public ItemStack resolvedStack() {
            return RecipeUtil.resolveMaterial(stack);
        }
    }

    public record GltcInputSlot(int menuSlot, Object stack, boolean noConsume) {
        public ItemStack resolvedStack() {
            return RecipeUtil.resolveMaterial(stack);
        }
    }

    public record GltcOutputSlot(int menuSlot, Object stack, int chance) {
        public ItemStack resolvedStack() {
            return RecipeUtil.resolveMaterial(stack);
        }
    }
}
