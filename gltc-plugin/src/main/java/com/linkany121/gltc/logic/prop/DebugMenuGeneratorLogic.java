package com.linkany121.gltc.logic.prop;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.Chest;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@code ATO_调试菜单生成器} — 右键点击箱子，在聊天栏输出箱内物品的排列格式与材质名称。
 * 支持普通箱子与大箱子（54 格）。
 */
public final class DebugMenuGeneratorLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "ATO_调试菜单生成器";

    private static final long COOLDOWN_MS = 500L;

    private GltcPlugin plugin;
    private final Map<UUID, Long> lastUseMs = new ConcurrentHashMap<>();

    public void register(GltcPlugin plugin) {
        this.plugin = plugin;
        org.bukkit.Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        lastUseMs.clear();
        plugin = null;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onInteract(PlayerInteractEvent event) {
        if (event.getAction() != Action.RIGHT_CLICK_BLOCK) {
            return;
        }
        ItemStack hand = event.getItem();
        if (hand == null || hand.getType() == Material.AIR) {
            return;
        }
        SlimefunItem sf = SlimefunItem.getByItem(hand);
        if (sf == null || GltcLogicRegistry.item(sf.getId()) != this) {
            return;
        }

        Player player = event.getPlayer();
        Block clicked = event.getClickedBlock();
        if (clicked == null || !(clicked.getState() instanceof Chest)) {
            return;
        }

        long now = System.currentTimeMillis();
        Long prev = lastUseMs.put(player.getUniqueId(), now);
        if (prev != null && now - prev < COOLDOWN_MS) {
            event.setCancelled(true);
            return;
        }

        event.setCancelled(true);
        dump(player, (Chest) clicked.getState());
    }

    private void dump(Player player, Chest chest) {
        Inventory inv = chest.getInventory();
        int size = inv.getSize();
        int rows = size / 9;

        player.sendMessage(Component.text("======== 调试菜单生成器 ========", NamedTextColor.GOLD));
        player.sendMessage(Component.text(
            (size > 27 ? "大箱子" : "箱子")
                + " · " + size + " 格 · " + rows + " 行", NamedTextColor.YELLOW));

        // 1) 可复制的完整格式：每行 "槽位=材质"
        StringBuilder sb = new StringBuilder();
        for (int slot = 0; slot < size; slot++) {
            ItemStack stack = inv.getItem(slot);
            if (stack == null || stack.getType() == Material.AIR) {
                continue;
            }
            sb.append(slot).append('=').append(resolveMaterial(stack));
            sb.append("; ");
        }
        String format = sb.toString().trim();
        if (format.endsWith(";")) {
            format = format.substring(0, format.length() - 1).trim();
        }

        if (format.isEmpty()) {
            player.sendMessage(Component.text("（箱子为空）", NamedTextColor.RED));
            return;
        }

        player.sendMessage(Component.text("排列格式（点击复制）: ", NamedTextColor.GRAY)
            .append(Component.text(format, NamedTextColor.AQUA)
                .clickEvent(ClickEvent.copyToClipboard(format))
                .hoverEvent(HoverEvent.showText(Component.text("点击复制排列格式", NamedTextColor.YELLOW)))));

        // 2) 网格视图（9 列）
        player.sendMessage(Component.text("网格视图:", NamedTextColor.GRAY));
        for (int r = 0; r < rows; r++) {
            StringBuilder line = new StringBuilder();
            for (int c = 0; c < 9; c++) {
                int slot = r * 9 + c;
                ItemStack stack = inv.getItem(slot);
                if (stack == null || stack.getType() == Material.AIR) {
                    line.append("·");
                } else {
                    line.append("■");
                }
                line.append(' ');
            }
            player.sendMessage(Component.text("  " + line.toString().trim(), NamedTextColor.WHITE));
        }

        player.sendMessage(Component.text("图例: ■=有物品  ·=空格", NamedTextColor.DARK_GRAY));
        player.sendMessage(Component.text("==================================", NamedTextColor.GOLD));
    }

    /** 解析材质名称；粘液物品输出其粘液 ID，原版物品输出小写材质名。 */
    private static String resolveMaterial(ItemStack stack) {
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        if (sf != null) {
            return sf.getId();
        }
        return stack.getType().name().toLowerCase(Locale.ROOT);
    }
}
