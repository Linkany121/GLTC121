package com.linkany121.gltc.logic.gun;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcMessages;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryType;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Integration gun selection GUI — mirrors {@code 枪械GUI.js}. */
public final class IntegrationGunGui implements Listener {

    // ===== 配置区（集成枪械选择 GUI，改完需重新打包 jar 并重启生效）=====
    public static final String GUI_TITLE = "§8枪械选择";  // 面板标题（事件按标题匹配，勿与其它 GUI 重名）
    private static final int SLOT_GUN_COUNT = 6;          // 可展示的枪械槽位数（需 ≥ GunRegistry 中枪械数量）
    private static final int INV_SIZE = 9;                // 面板大小（9 = 1 行）

    private final GltcPlugin plugin;
    private final Set<UUID> openPlayers = ConcurrentHashMap.newKeySet();

    public IntegrationGunGui(GltcPlugin plugin) {
        this.plugin = plugin;
    }

    public void register() {
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        openPlayers.clear();
    }

    public boolean open(Player player) {
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (!IntegrationGunMeta.isIntegrationStack(hand)) {
            return false;
        }
        Inventory inv = Bukkit.createInventory(null, INV_SIZE, GUI_TITLE);
        String selected = IntegrationGunMeta.readSelectedGunId(hand);
        List<String> guns = GunRegistry.listGuns();
        for (int g = 0; g < SLOT_GUN_COUNT; g++) {
            if (g < guns.size()) {
                inv.setItem(g, buildGunSlot(guns.get(g), selected));
            } else {
                inv.setItem(g, pane("§8空", Material.GRAY_STAINED_GLASS_PANE));
            }
        }
        for (int b = 6; b < INV_SIZE; b++) {
            inv.setItem(b, pane(" ", Material.BLACK_STAINED_GLASS_PANE));
        }
        openPlayers.add(player.getUniqueId());
        player.openInventory(inv);
        player.playSound(player.getLocation(), "block.iron_trapdoor.open", 0.8f, 1.1f);
        return true;
    }

    public boolean setSelectedGun(Player player, String gunId) {
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (!IntegrationGunMeta.isIntegrationStack(hand)) {
            return false;
        }
        if (!GunRegistry.isRegisteredGun(gunId)) {
            return false;
        }
        if (!IntegrationGunMeta.writeSelectedGun(hand, gunId)) {
            return false;
        }
        player.getInventory().setItemInMainHand(hand);
        // 与 枪械集成枪.js MSG_PREFIX + MSG_GUN_SWITCHED 一致（武器/枪械系前缀）
        player.sendMessage(GltcMessages.WEAPON_PREFIX + "§a已装载枪械：§f" + IntegrationGunMeta.gunDisplayName(gunId));
        return true;
    }

    private static ItemStack buildGunSlot(String gunId, String selectedGunId) {
        ItemStack stack;
        SlimefunItem sf = SlimefunItem.getById(gunId);
        if (sf != null) {
            stack = sf.getItem().clone();
            stack.setAmount(1);
        } else {
            stack = new ItemStack(Material.IRON_HORSE_ARMOR, 1);
        }
        ItemMeta meta = stack.getItemMeta();
        if (meta == null) {
            return stack;
        }
        boolean isSel = gunId.equals(selectedGunId);
        String dn = IntegrationGunMeta.gunDisplayName(gunId);
        meta.setDisplayName((isSel ? "§b§l[已选择] " : "§a[可选] ") + dn);
        meta.setLore(List.of(isSel ? "§e当前装载枪械" : "§7点击装载此枪械"));
        if (isSel) {
            try {
                meta.addEnchant(Enchantment.UNBREAKING, 1, true);
                meta.addItemFlags(ItemFlag.HIDE_ENCHANTS);
            } catch (Throwable ignored) {
            }
        }
        stack.setItemMeta(meta);
        return stack;
    }

    private static ItemStack pane(String name, Material mat) {
        ItemStack stack = new ItemStack(mat, 1);
        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name == null ? " " : name);
            meta.setLore(List.of());
            stack.setItemMeta(meta);
        }
        return stack;
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onClick(InventoryClickEvent event) {
        if (event.getView().getTitle() == null || !GUI_TITLE.equals(event.getView().getTitle())) {
            return;
        }
        event.setCancelled(true);
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        if (event.getClickedInventory() == null || event.getClickedInventory().getType() == InventoryType.PLAYER) {
            return;
        }
        int raw = event.getRawSlot();
        if (raw < 0 || raw >= SLOT_GUN_COUNT) {
            return;
        }
        List<String> guns = GunRegistry.listGuns();
        if (raw >= guns.size()) {
            return;
        }
        setSelectedGun(player, guns.get(raw));
        player.playSound(player.getLocation(), "block.note_block.pling", 0.9f, 1.4f);
        Bukkit.getScheduler().runTask(plugin, () -> {
            if (player.isOnline()) {
                player.closeInventory();
            }
        });
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onClose(InventoryCloseEvent event) {
        if (event.getPlayer() instanceof Player player) {
            openPlayers.remove(player.getUniqueId());
        }
    }
}
