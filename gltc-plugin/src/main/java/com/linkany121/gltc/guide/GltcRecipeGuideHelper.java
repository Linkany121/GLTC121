package com.linkany121.gltc.guide;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.util.RecipeUtil;
import com.linkany121.gltc.util.TextUtil;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;

public final class GltcRecipeGuideHelper {

    public static final ItemStack MULTI_INPUT = tagged(
        Material.GREEN_STAINED_GLASS_PANE,
        ChatColor.GREEN + "多物品输入",
        ChatColor.DARK_GREEN + "> " + ChatColor.GREEN + "点击查看配方"
    );
    public static final ItemStack MULTI_OUTPUT = tagged(
        Material.GREEN_STAINED_GLASS_PANE,
        ChatColor.GREEN + "多物品输出",
        ChatColor.DARK_GREEN + "> " + ChatColor.GREEN + "点击查看配方"
    );

    private GltcRecipeGuideHelper() {
    }

    private static NamespacedKey recipeTypeKey() {
        return new NamespacedKey(GltcPlugin.getInstance(), "gltc_recipe_type");
    }

    private static NamespacedKey recipeIndexKey() {
        return new NamespacedKey(GltcPlugin.getInstance(), "gltc_recipe_index");
    }

    private static NamespacedKey machineIdKey() {
        return new NamespacedKey(GltcPlugin.getInstance(), "gltc_machine_id");
    }

    public static ItemStack tagRecipe(@Nonnull ItemStack item, @Nonnull String machineId, int recipeType, int index) {
        ItemStack copy = item.clone();
        ItemMeta meta = copy.getItemMeta();
        if (meta == null) {
            return copy;
        }
        PersistentDataContainer pdc = meta.getPersistentDataContainer();
        pdc.set(machineIdKey(), PersistentDataType.STRING, machineId);
        pdc.set(recipeTypeKey(), PersistentDataType.INTEGER, recipeType);
        pdc.set(recipeIndexKey(), PersistentDataType.INTEGER, index);
        copy.setItemMeta(meta);
        return copy;
    }

    public static boolean isTagged(@Nonnull ItemStack item) {
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return false;
        }
        PersistentDataContainer pdc = meta.getPersistentDataContainer();
        return pdc.has(recipeTypeKey(), PersistentDataType.INTEGER)
            && pdc.has(recipeIndexKey(), PersistentDataType.INTEGER);
    }

    @Nullable
    public static String machineId(@Nonnull ItemStack item) {
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return null;
        }
        return meta.getPersistentDataContainer().get(machineIdKey(), PersistentDataType.STRING);
    }

    public static int recipeIndex(@Nonnull ItemStack item) {
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return -1;
        }
        Integer index = meta.getPersistentDataContainer().get(recipeIndexKey(), PersistentDataType.INTEGER);
        return index != null ? index : -1;
    }

    public static ItemStack displayInput(@Nonnull String machineId, List<RecipeUtil.GltcInputSlot> inputs, int index) {
        List<RecipeUtil.GltcInputSlot> resolved = sanitizeInputs(inputs);
        if (resolved.isEmpty()) {
            return null;
        }
        if (resolved.size() == 1 && !resolved.get(0).noConsume()) {
            ItemStack stack = tagRecipe(resolved.get(0).resolvedStack().clone(), machineId, 1, index);
            appendClickHint(stack);
            return stack;
        }
        ItemStack pane = tagRecipe(MULTI_INPUT.clone(), machineId, 1, index);
        appendSummary(pane, resolved.size() + " 种输入");
        return pane;
    }

    public static ItemStack displayOutput(
        @Nonnull String machineId,
        List<RecipeUtil.GltcOutputSlot> outputs,
        int seconds,
        int index
    ) {
        List<RecipeUtil.GltcOutputSlot> resolved = sanitizeOutputs(outputs);
        if (resolved.isEmpty()) {
            return null;
        }
        boolean singleGuaranteed = resolved.size() == 1 && resolved.get(0).chance() >= 100;
        if (singleGuaranteed) {
            ItemStack out = tagRecipe(resolved.get(0).resolvedStack().clone(), machineId, 2, index);
            appendCraftTime(out, seconds);
            appendClickHint(out);
            return out;
        }
        ItemStack pane = tagRecipe(MULTI_OUTPUT.clone(), machineId, 2, index);
        appendSummary(pane, resolved.size() + " 种输出");
        appendCraftTime(pane, seconds);
        return pane;
    }

    private static void appendClickHint(ItemStack item) {
        appendSummary(item, ChatColor.DARK_GREEN + "> " + ChatColor.GREEN + "点击查看配方");
    }

    private static void appendSummary(ItemStack item, String line) {
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return;
        }
        List<String> lore = meta.getLore() != null ? new ArrayList<>(meta.getLore()) : new ArrayList<>();
        lore.add(ChatColor.GRAY + line);
        meta.setLore(lore);
        item.setItemMeta(meta);
    }

    private static void appendCraftTime(ItemStack item, int seconds) {
        if (seconds <= 0) {
            return;
        }
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return;
        }
        List<String> lore = meta.getLore() != null ? new ArrayList<>(meta.getLore()) : new ArrayList<>();
        lore.add(TextUtil.legacySection("&e制作时间: &b" + seconds + "&es"));
        meta.setLore(lore);
        item.setItemMeta(meta);
    }

    private static List<RecipeUtil.GltcInputSlot> sanitizeInputs(List<RecipeUtil.GltcInputSlot> stacks) {
        List<RecipeUtil.GltcInputSlot> result = new ArrayList<>();
        for (RecipeUtil.GltcInputSlot stack : stacks) {
            ItemStack item = stack.resolvedStack();
            if (item != null && item.getType() != Material.AIR && item.getType() != Material.BARRIER) {
                result.add(stack);
            }
        }
        return result;
    }

    private static List<RecipeUtil.GltcOutputSlot> sanitizeOutputs(List<RecipeUtil.GltcOutputSlot> stacks) {
        List<RecipeUtil.GltcOutputSlot> result = new ArrayList<>();
        for (RecipeUtil.GltcOutputSlot stack : stacks) {
            ItemStack item = stack.resolvedStack();
            if (item != null && item.getType() != Material.AIR && item.getType() != Material.BARRIER) {
                result.add(stack);
            }
        }
        return result;
    }

    private static ItemStack tagged(Material material, String name, String loreLine) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            meta.setLore(List.of(loreLine));
            item.setItemMeta(meta);
        }
        return item;
    }
}
