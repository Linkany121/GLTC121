package com.linkany121.gltc.guide;

import com.linkany121.gltc.item.GltcItemBuilder;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.machine.GltcSimpleMultiBlock;
import com.linkany121.gltc.util.GltcMenuData;
import com.linkany121.gltc.util.RecipeUtil;
import com.linkany121.gltc.util.TextUtil;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.core.guide.SlimefunGuide;
import io.github.thebusybiscuit.slimefun4.api.player.PlayerProfile;
import io.github.thebusybiscuit.slimefun4.utils.ChestMenuUtils;
import me.mrCookieSlime.CSCoreLibPlugin.general.Inventory.ChestMenu;
import org.bukkit.ChatColor;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class GltcRecipeDetailMenu {

    private GltcRecipeDetailMenu() {
    }

    public static void open(
        Player player,
        SlimefunItem machine,
        String machineId,
        ItemStack machineItem,
        GltcRecipeMachine.GltcMachineRecipe recipe,
        int[] inputSlots,
        int[] outputSlots,
        int progressSlot,
        boolean instant
    ) {
        recipe.resolve();
        Map<String, Object> menu = GltcMenuData.get(machineId);
        String title = menu != null ? String.valueOf(menu.getOrDefault("title", machineId)) : machineId;

        ChestMenu chest = new ChestMenu(TextUtil.legacySection("&8配方详情 · " + title));
        chest.setEmptySlotsClickable(false);
        chest.setPlayerInventoryClickable(false);

        Set<Integer> inputSet = toSet(inputSlots);
        Set<Integer> outputSet = toSet(outputSlots);

        if (menu != null) {
            Object slotsObj = menu.get("slots");
            if (slotsObj instanceof Map<?, ?> slots) {
                for (Map.Entry<?, ?> entry : slots.entrySet()) {
                    int slot;
                    try {
                        slot = Integer.parseInt(String.valueOf(entry.getKey()));
                    } catch (NumberFormatException ex) {
                        continue;
                    }
                    if (slot < 0 || slot >= 54) {
                        continue;
                    }
                    Map<String, Object> slotData = RecipeUtil.asMap(entry.getValue());
                    if (Boolean.TRUE.equals(slotData.get("progressbar"))) {
                        continue;
                    }
                    if (inputSet.contains(slot) || outputSet.contains(slot)) {
                        continue;
                    }
                    ItemStack icon = GltcItemBuilder.stack(slotData);
                    chest.addItem(slot, icon, ChestMenuUtils.getEmptyClickHandler());
                }
            }
        } else {
            for (int slot = 0; slot < 54; slot++) {
                chest.addItem(slot, ChestMenuUtils.getBackground(), ChestMenuUtils.getEmptyClickHandler());
            }
        }

        chest.addItem(4, machineItem.clone(), ChestMenuUtils.getEmptyClickHandler());

        boolean recipeNoConsume = recipe.noConsume();
        for (RecipeUtil.GltcInputSlot input : recipe.resolvedInputSlots()) {
            ItemStack stack = input.resolvedStack();
            if (stack == null || stack.getType() == Material.AIR || stack.getType() == Material.BARRIER) {
                continue;
            }
            int slot = input.menuSlot();
            if (slot < 0 || slot >= 54) {
                continue;
            }
            ItemStack shown = stack.clone();
            appendLore(shown, loreLine("数量", String.valueOf(stack.getAmount())));
            appendLore(shown, loreLine("槽位", String.valueOf(slot)));
            boolean consumed = !recipeNoConsume && !input.noConsume();
            appendLore(shown, loreLine("消耗", consumed ? ChatColor.RED + "是" : ChatColor.GREEN + "否"));
            chest.addItem(slot, shown, ChestMenuUtils.getEmptyClickHandler());
        }

        for (RecipeUtil.GltcOutputSlot output : recipe.resolvedOutputSlots()) {
            ItemStack stack = output.resolvedStack();
            if (stack == null || stack.getType() == Material.AIR || stack.getType() == Material.BARRIER) {
                continue;
            }
            int slot = output.menuSlot();
            if (slot < 0 || slot >= 54) {
                continue;
            }
            ItemStack shown = stack.clone();
            appendLore(shown, loreLine("数量", String.valueOf(stack.getAmount())));
            appendLore(shown, loreLine("槽位", String.valueOf(slot)));
            if (output.chance() < 100) {
                appendLore(shown, loreLine("概率", output.chance() + "%"));
            }
            chest.addItem(slot, shown, ChestMenuUtils.getEmptyClickHandler());
        }

        if (!instant && recipe.seconds() > 0 && progressSlot >= 0 && progressSlot < 54) {
            ItemStack clock = new ItemStack(Material.CLOCK);
            ItemMeta meta = clock.getItemMeta();
            if (meta != null) {
                meta.setDisplayName(ChatColor.AQUA + "制作时间: " + recipe.seconds() + " 秒");
                clock.setItemMeta(meta);
            }
            chest.addItem(progressSlot, clock, ChestMenuUtils.getEmptyClickHandler());
        }

        int closeSlot = progressSlot == 49 ? 45 : 49;
        chest.addItem(closeSlot, named(Material.BARRIER, ChatColor.RED + "关闭"),
            (p, slot, item, action) -> {
                p.closeInventory();
                PlayerProfile.find(p).ifPresent(profile -> SlimefunGuide.displayItem(profile, machine, false));
                return false;
            });

        chest.open(player);
    }

    /** Compact 3×3 + output view for simple multiblock recipes. */
    public static void openSimpleMb(Player player, GltcSimpleMultiBlock machine, GltcSimpleMultiBlock.MbRecipe recipe) {
        recipe.resolve();
        ChestMenu chest = new ChestMenu(TextUtil.legacySection("&8配方详情 · " + machine.getId()));
        chest.setEmptySlotsClickable(false);
        chest.setPlayerInventoryClickable(false);

        for (int i = 0; i < 27; i++) {
            chest.addItem(i, ChestMenuUtils.getBackground(), ChestMenuUtils.getEmptyClickHandler());
        }

        ItemStack[] grid = recipe.grid();
        if (grid != null) {
            int[] gridSlots = {0, 1, 2, 9, 10, 11, 18, 19, 20};
            for (int i = 0; i < 9 && i < grid.length; i++) {
                ItemStack stack = grid[i];
                if (stack == null || stack.getType() == Material.AIR || stack.getType() == Material.BARRIER) {
                    continue;
                }
                chest.addItem(gridSlots[i], stack.clone(), ChestMenuUtils.getEmptyClickHandler());
            }
        }

        ItemStack output = recipe.output();
        if (output != null && output.getType() != Material.AIR && output.getType() != Material.BARRIER) {
            chest.addItem(16, output.clone(), ChestMenuUtils.getEmptyClickHandler());
        }

        chest.addItem(4, machine.getItem().clone(), ChestMenuUtils.getEmptyClickHandler());
        chest.addItem(22, named(Material.BARRIER, ChatColor.RED + "关闭"),
            (p, slot, item, action) -> {
                p.closeInventory();
                PlayerProfile.find(p).ifPresent(profile -> SlimefunGuide.displayItem(profile, machine, false));
                return false;
            });

        chest.open(player);
    }

    public static boolean needsDetailView(GltcRecipeMachine.GltcMachineRecipe recipe) {
        recipe.resolve();
        List<RecipeUtil.GltcInputSlot> inputs = recipe.resolvedInputSlots();
        List<RecipeUtil.GltcOutputSlot> outputs = recipe.resolvedOutputSlots();
        if (inputs.size() != 1 || outputs.size() != 1) {
            return true;
        }
        if (recipe.noConsume() || inputs.get(0).noConsume()) {
            return true;
        }
        if (outputs.get(0).chance() < 100) {
            return true;
        }
        return inputs.get(0).menuSlot() >= 0 || outputs.get(0).menuSlot() >= 0;
    }

    private static Set<Integer> toSet(int[] slots) {
        Set<Integer> set = new HashSet<>();
        if (slots != null) {
            for (int slot : slots) {
                set.add(slot);
            }
        }
        return set;
    }

    private static String loreLine(String label, String value) {
        return ChatColor.GRAY + label + ": " + ChatColor.WHITE + value;
    }

    private static ItemStack named(Material material, String name) {
        ItemStack item = new ItemStack(material);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            item.setItemMeta(meta);
        }
        return item;
    }

    private static void appendLore(ItemStack item, String line) {
        ItemMeta meta = item.getItemMeta();
        if (meta == null) {
            return;
        }
        List<String> lore = meta.getLore() != null ? new ArrayList<>(meta.getLore()) : new ArrayList<>();
        lore.add(line);
        meta.setLore(lore);
        item.setItemMeta(meta);
    }
}
