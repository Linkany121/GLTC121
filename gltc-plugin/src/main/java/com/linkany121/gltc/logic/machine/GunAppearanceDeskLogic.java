package com.linkany121.gltc.logic.machine;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.logic.common.GltcMessages;
import com.linkany121.gltc.logic.gun.GunRegistry;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryCreativeEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataContainer;
import org.bukkit.persistence.PersistentDataType;

import javax.annotation.Nullable;
import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * {@code FKR_枪械外观客制化组装桌} — GUI to switch FKR gun item materials.
 * Mirrors {@code scripts/机器/枪械外观客制化组装桌.js}.
 */
public final class GunAppearanceDeskLogic implements GltcMachineLogic, Listener {

    public static final String MACHINE_ID = "FKR_枪械外观客制化组装桌";

    // ===== 配置区（枪械外观客制化组装桌，改完需重新打包 jar 并重启生效）=====
    private static final String GUI_TITLE = "§c§lFKRT §a枪械外观客制化组装桌";  // 面板标题（事件按标题匹配，勿与其它 GUI 重名）
    private static final int GUN_SLOT = 31;    // 枪械放置槽位置（45 格面板 0~44）
    private static final int CONFIRM_SLOT = 35; // 确认更换按钮位置

    private static final NamespacedKey SF_ITEM_KEY = new NamespacedKey("slimefun", "slimefun_item");  // 识别 Slimefun 物品的 NBT 键（一般不要改动）
    private static final NamespacedKey APPEARANCE_KEY = new NamespacedKey("gltc", "gun_appearance");  // 读写枪械外观的 NBT 键（一般不要改动）

    private static final Map<Integer, AppearanceOption> APPEARANCE_SLOTS = Map.of(  // 槽位 → 外观选项（材质 / 显示名 / 说明），可增删改
        11, new AppearanceOption(Material.GOLDEN_HOE, "§6§l金锄外观",
            "§7点击将枪械材质切换为 §6金锄"),
        13, new AppearanceOption(Material.IRON_SWORD, "§f§l铁剑外观",
            "§7点击将枪械材质切换为 §f铁剑"),
        15, new AppearanceOption(Material.CROSSBOW, "§7§l弩外观",
            "§7点击将枪械材质切换为 §7弩(原始)")
    );

    private static final Map<String, Material> APPEARANCE_MATERIALS = Map.of(  // 外观键 → 切换后的 Material 材质（新增外观需同步补一条）
        "GOLDEN_HOE", Material.GOLDEN_HOE,
        "IRON_SWORD", Material.IRON_SWORD,
        "CROSSBOW", Material.CROSSBOW
    );

    private static final Map<String, String> APPEARANCE_NAMES = Map.of(  // 外观键 → 显示名（用于物品 lore 记录）
        "GOLDEN_HOE", "金锄",
        "IRON_SWORD", "铁剑",
        "CROSSBOW", "弩"
    );

    private final Set<Inventory> activeInventories = new HashSet<>();
    private final Map<Inventory, String> appearanceSelectionMap = new HashMap<>();

    private final ItemStack whiteItem;
    private final ItemStack confirmButton;
    private final ItemStack gunPlaceholder;

    public GunAppearanceDeskLogic() {
        whiteItem = named(Material.WHITE_STAINED_GLASS_PANE, "§0", null);
        confirmButton = named(Material.LIME_STAINED_GLASS_PANE, "§a§l✔ 确认更换外观", List.of(
            "§7将需要更换材质的枪械放入，",
            "§7点击上方按钮选择意愿材质后，",
            "§7点击此处确认更换。",
            "§c§o注意：切换材质不影响枪械性能、冷却与模型数据。"
        ));
        gunPlaceholder = named(Material.LIGHT_GRAY_STAINED_GLASS_PANE, "§7§l[ 枪械放置槽 ]", List.of(
            "§7将FKR枪械放入此槽位"
        ));
    }

    /** Registers machine logic + GUI listeners. Safe to call after unregister. */
    public void register(GltcPlugin plugin) {
        GltcLogicRegistry.registerMachine(MACHINE_ID, this);
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        activeInventories.clear();
        appearanceSelectionMap.clear();
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        if (event.getClickedBlock().isEmpty()) {
            return false;
        }
        Player player = event.getPlayer();
        Inventory inv = Bukkit.createInventory(null, 54, GUI_TITLE);
        for (int i = 0; i < 54; i++) {
            inv.setItem(i, whiteItem.clone());
        }
        inv.setItem(11, buildAppearanceButton(11, null));
        inv.setItem(13, buildAppearanceButton(13, null));
        inv.setItem(15, buildAppearanceButton(15, null));
        inv.setItem(GUN_SLOT, gunPlaceholder.clone());
        inv.setItem(CONFIRM_SLOT, confirmButton.clone());
        activeInventories.add(inv);
        appearanceSelectionMap.put(inv, null);
        player.openInventory(inv);
        return true;
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onClick(InventoryClickEvent event) {
        if (event instanceof InventoryCreativeEvent) {
            return;
        }
        Inventory topInv = event.getView().getTopInventory();
        if (!activeInventories.contains(topInv)) {
            return;
        }
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        Inventory clickedInv = event.getClickedInventory();
        int slot = event.getRawSlot();

        if (clickedInv == topInv) {
            if (APPEARANCE_SLOTS.containsKey(slot)) {
                event.setCancelled(true);
                String matName = switch (slot) {
                    case 11 -> "GOLDEN_HOE";
                    case 13 -> "IRON_SWORD";
                    case 15 -> "CROSSBOW";
                    default -> null;
                };
                if (matName != null) {
                    appearanceSelectionMap.put(topInv, matName);
                    refreshAppearanceButtons(topInv, matName);
                    try {
                        player.playSound(player.getLocation(), "ui.button.click", 0.5f, 1.5f);
                    } catch (Throwable ignored) {
                    }
                }
                return;
            }
            if (slot == CONFIRM_SLOT) {
                event.setCancelled(true);
                processChange(player, topInv);
                return;
            }
            if (slot == GUN_SLOT) {
                ItemStack current = event.getCurrentItem();
                if (current != null && current.getType() == Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
                    event.setCancelled(true);
                    ItemStack cursor = event.getCursor();
                    if (cursor != null && cursor.getType() != Material.AIR) {
                        if (isGun(cursor)) {
                            event.setCurrentItem(cursor.clone());
                            event.getCursor().setAmount(0);
                            try {
                                player.playSound(player.getLocation(), "item.flintandsteel.use", 0.5f, 1.2f);
                            } catch (Throwable ignored) {
                            }
                        } else {
                            player.sendMessage(GltcMessages.prefixed("§c此处只能放入FKR枪械！"));
                        }
                    }
                } else {
                    event.setCancelled(true);
                    ItemStack current2 = event.getCurrentItem();
                    ItemStack cursor2 = event.getCursor();
                    if (cursor2 == null || cursor2.getType() == Material.AIR) {
                        if (current2 != null) {
                            event.setCursor(current2.clone());
                        }
                        event.setCurrentItem(gunPlaceholder.clone());
                    } else if (isGun(cursor2)) {
                        ItemStack tmp = cursor2.clone();
                        if (current2 != null) {
                            event.setCursor(current2.clone());
                        } else {
                            event.setCursor(null);
                        }
                        event.setCurrentItem(tmp);
                    } else {
                        player.sendMessage(GltcMessages.prefixed("§c此处只能放入FKR枪械！"));
                    }
                }
                return;
            }
            event.setCancelled(true);
            return;
        }

        if (event.isShiftClick()) {
            event.setCancelled(true);
            ItemStack clicked = event.getCurrentItem();
            if (clicked != null && clicked.getType() != Material.AIR && isGun(clicked)) {
                ItemStack gunSlotItem = topInv.getItem(GUN_SLOT);
                if (gunSlotItem == null
                    || gunSlotItem.getType() == Material.AIR
                    || gunSlotItem.getType() == Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
                    topInv.setItem(GUN_SLOT, clicked.clone());
                    event.setCurrentItem(null);
                    try {
                        player.playSound(player.getLocation(), "item.flintandsteel.use", 0.5f, 1.2f);
                    } catch (Throwable ignored) {
                    }
                } else {
                    player.sendMessage(GltcMessages.prefixed("§c枪械槽位已被占用！"));
                }
            }
        }
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onDrag(InventoryDragEvent event) {
        Inventory topInv = event.getView().getTopInventory();
        if (!activeInventories.contains(topInv)) {
            return;
        }
        if (shouldCancelGunDrag(event, topInv)) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onClose(InventoryCloseEvent event) {
        Inventory inv = event.getInventory();
        if (!activeInventories.contains(inv)) {
            return;
        }
        if (event.getPlayer() instanceof Player player) {
            ItemStack gunItem = inv.getItem(GUN_SLOT);
            if (gunItem != null
                && gunItem.getType() != Material.AIR
                && gunItem.getType() != Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
                Map<Integer, ItemStack> leftover = player.getInventory().addItem(gunItem);
                for (ItemStack drop : leftover.values()) {
                    player.getWorld().dropItemNaturally(player.getLocation(), drop);
                }
                inv.setItem(GUN_SLOT, null);
            }
        }
        activeInventories.remove(inv);
        appearanceSelectionMap.remove(inv);
    }

    private void processChange(Player player, Inventory inv) {
        ItemStack gunStack = inv.getItem(GUN_SLOT);
        String selectedMatName = appearanceSelectionMap.get(inv);
        if (selectedMatName == null) {
            player.sendMessage(GltcMessages.prefixed("§c请先选择一个目标材质！"));
            return;
        }
        if (gunStack == null || gunStack.getType() == Material.AIR) {
            player.sendMessage(GltcMessages.prefixed("§c请先投入枪械！"));
            return;
        }
        if (gunStack.getType() == Material.LIGHT_GRAY_STAINED_GLASS_PANE) {
            player.sendMessage(GltcMessages.prefixed("§c请先投入枪械！"));
            return;
        }
        if (!isGun(gunStack)) {
            player.sendMessage(GltcMessages.prefixed("§c请投入枪械！"));
            return;
        }
        String sfId = getSlimefunId(gunStack);
        if (sfId == null) {
            player.sendMessage(GltcMessages.prefixed("§c无法识别枪械ID！"));
            return;
        }
        Material targetMaterial = APPEARANCE_MATERIALS.get(selectedMatName);
        if (targetMaterial == null) {
            player.sendMessage(GltcMessages.prefixed("§c外观材质无效！"));
            return;
        }
        try {
            if (!applyGunAppearance(gunStack, targetMaterial, selectedMatName)) {
                player.sendMessage(GltcMessages.prefixed("§c更换外观时发生错误！"));
                return;
            }
            inv.setItem(GUN_SLOT, gunStack);
            var loc = player.getLocation();
            try {
                loc.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, loc, 10, 0.4, 0.4, 0.4, 0.15);
            } catch (Throwable ignored) {
            }
            try {
                loc.getWorld().playSound(loc, "block.anvil.use", 0.8f, 1.5f);
            } catch (Throwable ignored) {
            }
            try {
                loc.getWorld().playSound(loc, "item.flintandsteel.use", 0.6f, 1.2f);
            } catch (Throwable ignored) {
            }
            String appearanceName = APPEARANCE_NAMES.getOrDefault(selectedMatName, selectedMatName);
            player.sendMessage(GltcMessages.prefixed(
                "§a成功将 §e" + sfId + " §a的外观更换为 §e" + appearanceName + "§a！"
            ));
        } catch (Throwable t) {
            player.sendMessage(GltcMessages.prefixed("§c更换外观时发生错误: " + t));
        }
    }

    private void refreshAppearanceButtons(Inventory inv, @Nullable String selectedMatName) {
        inv.setItem(11, buildAppearanceButton(11, selectedMatName));
        inv.setItem(13, buildAppearanceButton(13, selectedMatName));
        inv.setItem(15, buildAppearanceButton(15, selectedMatName));
    }

    private ItemStack buildAppearanceButton(int slot, @Nullable String selectedMatName) {
        AppearanceOption cfg = APPEARANCE_SLOTS.get(slot);
        ItemStack item = new ItemStack(cfg.material);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(cfg.name);
            List<String> lore = Arrays.asList(
                cfg.desc,
                "",
                selectedMatName != null
                    ? ("§a§l● 已选: " + APPEARANCE_NAMES.getOrDefault(selectedMatName, selectedMatName))
                    : "§7○ 未选择"
            );
            meta.setLore(lore);
            item.setItemMeta(meta);
        }
        return item;
    }

    private static boolean shouldCancelGunDrag(InventoryDragEvent event, Inventory topInv) {
        int topSize = topInv.getSize();
        for (int raw : event.getRawSlots()) {
            if (raw < topSize && raw != GUN_SLOT) {
                return true;
            }
        }
        return false;
    }

    private static boolean isGun(ItemStack stack) {
        String id = getSlimefunId(stack);
        if (id == null) {
            return false;
        }
        for (String gunId : GunRegistry.listGuns()) {
            if (gunId.equalsIgnoreCase(id)) {
                return true;
            }
        }
        return false;
    }

    @Nullable
    private static String getSlimefunId(@Nullable ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        try {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null) {
                PersistentDataContainer pdc = meta.getPersistentDataContainer();
                if (pdc.has(SF_ITEM_KEY, PersistentDataType.STRING)) {
                    return pdc.get(SF_ITEM_KEY, PersistentDataType.STRING);
                }
            }
        } catch (Throwable ignored) {
        }
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        return sf != null ? sf.getId() : null;
    }

    private static boolean applyGunAppearance(ItemStack stack, Material targetMaterial, @Nullable String appearanceCode) {
        if (stack == null || stack.getType() == Material.AIR || targetMaterial == null) {
            return false;
        }
        try {
            ItemMeta oldMeta = stack.getItemMeta();
            if (oldMeta == null) {
                return false;
            }
            String displayName = oldMeta.hasDisplayName() ? oldMeta.getDisplayName() : null;
            List<String> lore = oldMeta.hasLore() ? oldMeta.getLore() : null;
            Integer customModelData = oldMeta.hasCustomModelData() ? oldMeta.getCustomModelData() : null;
            PersistentDataContainer oldPdc = oldMeta.getPersistentDataContainer();

            boolean preserved = trySetTypePreserving(stack, targetMaterial);
            if (!preserved) {
                stack.setType(targetMaterial);
            }

            ItemMeta meta = stack.getItemMeta();
            if (meta == null) {
                return false;
            }
            if (displayName != null) {
                meta.setDisplayName(displayName);
            }
            if (lore != null) {
                meta.setLore(lore);
            }
            if (customModelData != null) {
                try {
                    meta.setCustomModelData(customModelData);
                } catch (Throwable ignored) {
                }
            }
            copyPdcStringEntries(oldPdc, meta.getPersistentDataContainer());
            if (appearanceCode != null) {
                meta.getPersistentDataContainer().set(APPEARANCE_KEY, PersistentDataType.STRING, appearanceCode);
            }
            stack.setItemMeta(meta);
            return true;
        } catch (Throwable t) {
            return false;
        }
    }

    private static boolean trySetTypePreserving(ItemStack stack, Material targetMaterial) {
        try {
            Method method = stack.getClass().getMethod("setType", Material.class, boolean.class);
            Object result = method.invoke(stack, targetMaterial, Boolean.TRUE);
            if (result instanceof Boolean b) {
                return b;
            }
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    private static void copyPdcStringEntries(PersistentDataContainer fromPdc, PersistentDataContainer toPdc) {
        for (NamespacedKey key : fromPdc.getKeys()) {
            try {
                if (fromPdc.has(key, PersistentDataType.STRING)) {
                    toPdc.set(key, PersistentDataType.STRING, fromPdc.get(key, PersistentDataType.STRING));
                }
            } catch (Throwable ignored) {
            }
        }
    }

    private static ItemStack named(Material mat, String name, @Nullable List<String> lore) {
        ItemStack stack = new ItemStack(mat);
        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            if (lore != null) {
                meta.setLore(lore);
            }
            stack.setItemMeta(meta);
        }
        return stack;
    }

    private record AppearanceOption(Material material, String name, String desc) {
    }
}
