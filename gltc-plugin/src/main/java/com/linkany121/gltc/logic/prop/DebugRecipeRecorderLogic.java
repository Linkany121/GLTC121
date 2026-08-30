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

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@code ATO_调试配方记录器} — 右键点击箱子，在聊天栏输出箱内物品的粘液 ID（可点击复制）。
 */
public final class DebugRecipeRecorderLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "ATO_调试配方记录器";

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
        List<String> lines = new ArrayList<>();
        int count = 0;

        for (int slot = 0; slot < size; slot++) {
            ItemStack stack = inv.getItem(slot);
            if (stack == null || stack.getType() == Material.AIR) {
                continue;
            }
            String id = resolveId(stack);
            lines.add(id);
            count++;
        }

        player.sendMessage(Component.text("======== 调试配方记录器 ========", NamedTextColor.GOLD));
        player.sendMessage(Component.text("箱子: ", NamedTextColor.GRAY)
            .append(Component.text((size > 27 ? "大箱子" : "箱子")
                + " · " + size + " 格 · 共 " + count + " 个物品", NamedTextColor.YELLOW)));

        if (lines.isEmpty()) {
            player.sendMessage(Component.text("（箱子为空）", NamedTextColor.RED));
            return;
        }

        // 单条可整体复制的 ID 列表
        String all = String.join(", ", lines);
        player.sendMessage(Component.text("全部 ID（点击复制）: ", NamedTextColor.GRAY)
            .append(Component.text(all, NamedTextColor.AQUA)
                .clickEvent(ClickEvent.copyToClipboard(all))
                .hoverEvent(HoverEvent.showText(Component.text("点击复制全部 ID", NamedTextColor.YELLOW)))));

        // 逐行可点击复制
        int idx = 1;
        for (String id : lines) {
            player.sendMessage(Component.text(String.format(Locale.ROOT, "%2d. ", idx++), NamedTextColor.DARK_GRAY)
                .append(Component.text(id, NamedTextColor.AQUA)
                    .clickEvent(ClickEvent.copyToClipboard(id))
                    .hoverEvent(HoverEvent.showText(Component.text("点击复制 " + id, NamedTextColor.YELLOW)))));
        }
        player.sendMessage(Component.text("==================================", NamedTextColor.GOLD));
    }

    /** 解析粘液 ID；普通原版物品回退为材质名（大写）。 */
    private static String resolveId(ItemStack stack) {
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        if (sf != null) {
            return sf.getId();
        }
        return stack.getType().name();
    }
}
