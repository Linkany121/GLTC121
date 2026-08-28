package com.linkany121.gltc.listener;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.generated.GltcBlockDropRules;
import com.linkany121.gltc.util.GltcDropItems;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.inventory.ItemStack;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

/**
 * RSC DropFromBlockListener parity:
 * - exact Material match only (dirt ≠ grass)
 * - chance: {@code random.nextInt(100) < chance}
 * - drop immediately at block location
 * - no creative / silk-touch special cases
 */
public final class GltcBlockDropListener implements Listener {

    private static final Random RANDOM = new Random();
    private static final Map<Material, List<GltcBlockDropRules.Rule>> INDEX = buildIndex();
    private static final Map<String, ItemStack> TEMPLATE_CACHE = new ConcurrentHashMap<>();
    private static boolean warmed;

    private static Map<Material, List<GltcBlockDropRules.Rule>> buildIndex() {
        Map<Material, List<GltcBlockDropRules.Rule>> index = new EnumMap<>(Material.class);
        for (GltcBlockDropRules.Rule rule : GltcBlockDropRules.RULES) {
            index.computeIfAbsent(rule.material(), ignored -> new ArrayList<>()).add(rule);
        }
        return index;
    }

    /** Resolve drop ItemStacks once after all Slimefun items are registered. */
    public static void warmUp() {
        int ok = 0;
        int fail = 0;
        for (GltcBlockDropRules.Rule rule : GltcBlockDropRules.RULES) {
            ItemStack stack = GltcDropItems.cloneDrop(rule.itemId());
            if (stack == null) {
                fail++;
                GltcPlugin.getInstance().getLogger().warning(
                    "[BlockDrop] 启动时无法解析掉落物: " + rule.itemId()
                );
                continue;
            }
            TEMPLATE_CACHE.put(rule.itemId(), stack);
            ok++;
        }
        warmed = true;
        GltcPlugin.getInstance().getLogger().info(
            "[BlockDrop] 已加载 " + INDEX.size() + " 种方块 / " + ok + " 条掉落规则"
                + (fail > 0 ? ("（失败 " + fail + "）") : "")
        );
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = false)
    public void onBlockBreak(BlockBreakEvent event) {
        if (!warmed) {
            warmUp();
        }

        Block block = event.getBlock();
        List<GltcBlockDropRules.Rule> rules = INDEX.get(block.getType());
        if (rules == null || rules.isEmpty()) {
            return;
        }

        for (GltcBlockDropRules.Rule rule : rules) {
            if (!matchChance(rule.chance())) {
                continue;
            }
            ItemStack template = TEMPLATE_CACHE.get(rule.itemId());
            if (template == null) {
                template = GltcDropItems.cloneDrop(rule.itemId());
                if (template == null) {
                    GltcPlugin.getInstance().getLogger().warning(
                        "[BlockDrop] 无法解析掉落物 ID: " + rule.itemId()
                    );
                    continue;
                }
                TEMPLATE_CACHE.put(rule.itemId(), template.clone());
            }
            ItemStack drop = template.clone();
            drop.setAmount(rule.rollAmount());
            // RSC: immediate natural drop at the broken block.
            block.getWorld().dropItemNaturally(block.getLocation(), drop);
        }
    }

    private static boolean matchChance(int chance) {
        if (chance >= 100) {
            return true;
        }
        if (chance <= 0) {
            return false;
        }
        return RANDOM.nextInt(100) < chance;
    }
}
