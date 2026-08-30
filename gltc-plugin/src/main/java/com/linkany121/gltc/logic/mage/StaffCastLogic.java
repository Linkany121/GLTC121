package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.enchantments.Enchantment;
import org.bukkit.entity.Player;
import org.bukkit.event.Event;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.event.player.PlayerAnimationEvent;
import org.bukkit.event.player.PlayerAnimationType;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemFlag;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import javax.annotation.Nullable;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@code VASA_通用施术道具} — staff cast / spell-select GUI (workspace mage staff rules).
 */
public final class StaffCastLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = StaffPdc.STAFF_ID;

    // ===== 配置区（施术法杖 GUI，改完需重新打包 jar 并重启生效）=====
    private static final String GUI_TITLE = "§8施术";  // 术式选择面板标题（事件按标题匹配，勿与其它 GUI 重名）
    private static final int INV_SIZE = 9;             // 面板大小（9 = 1 行）
    private static final int SLOT_SKILL = 0;           // 0 槽：核心技能展示
    private static final int SLOT_DIVIDER = 1;         // 1 槽：分隔装饰
    private static final int SLOT_SPELL_START = 2;     // 2~7 槽：术式槽（共 StaffPdc.MAX_SPELL_SLOTS=6 个）
    private static final int SLOT_SPELL_COUNT = StaffPdc.MAX_SPELL_SLOTS;  // 术式槽数量（改槽位数需同步改 StaffPdc.MAX_SPELL_SLOTS）
    private static final int SLOT_BORDER_END = 8;      // 8 槽：尾部边框

    private static final long USE_DEBOUNCE_MS = 80L;        // 右键防抖（毫秒），防止一次点击触发多次
    private static final long LEFT_ANIM_DEBOUNCE_MS = 120L; // 左键挥臂动画触发术式的防抖（毫秒）

    private static StaffCastLogic instance;

    private final Set<UUID> openGui = ConcurrentHashMap.newKeySet();
    private final Map<UUID, Long> useDebounce = new ConcurrentHashMap<>();
    private final Map<UUID, Long> leftAnimDebounce = new ConcurrentHashMap<>();
    /** {@code uuid|spellId} → 冷却结束时间戳（毫秒）。 */
    private final Map<String, Long> castCdUntil = new ConcurrentHashMap<>();
    private final LightRuinSkill lightRuin = new LightRuinSkill();
    private H_1_HUOQIU fireballSpell;

    private StaffCastLogic() {
    }

    public static void register(GltcPlugin plugin) {
        if (plugin == null) {
            return;
        }
        unregister();
        StaffCastLogic logic = new StaffCastLogic();
        instance = logic;
        MageSpellRegistry.clear();
        H_1_HUOQIU fireball = new H_1_HUOQIU();
        logic.fireballSpell = fireball;
        MageSpellRegistry.register(fireball);
        MageSpellRegistry.register(new W_1_SONGHUA());
        MageSpellRegistry.register(new W_2_WEIFENGHUALU());
        MageSpellRegistry.register(new W_3_BIHUMAILUO());
        MageSpellRegistry.register(new W_4_HUARUHUAJUAN());
        MageSpellRegistry.register(new N_1_TIAOSHI());
        GltcLogicRegistry.registerItem(ITEM_ID, logic);
        Bukkit.getPluginManager().registerEvents(logic, plugin);
    }

    public static void unregister() {
        StaffCastLogic logic = instance;
        if (logic == null) {
            return;
        }
        instance = null;
        HandlerList.unregisterAll(logic);
        MageSpellRegistry.clear();
        logic.openGui.clear();
        logic.useDebounce.clear();
        logic.leftAnimDebounce.clear();
        logic.castCdUntil.clear();
        logic.fireballSpell = null;
    }

    @Nullable
    public static StaffCastLogic getInstance() {
        return instance;
    }

    // -------------------------------------------------------------------------
    // GltcItemLogic — Slimefun right-click (debounced with InteractEvent)
    // -------------------------------------------------------------------------

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        if (!isHoldingStaff(player)) {
            return false;
        }
        handleRightClick(player);
        return true;
    }

    // -------------------------------------------------------------------------
    // Listeners
    // -------------------------------------------------------------------------

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onInteract(PlayerInteractEvent event) {
        if (event.getHand() != null && event.getHand() != EquipmentSlot.HAND) {
            return;
        }
        Player player = event.getPlayer();
        if (!isHoldingStaff(player)) {
            return;
        }
        Action action = event.getAction();
        boolean left = action == Action.LEFT_CLICK_AIR || action == Action.LEFT_CLICK_BLOCK;
        boolean right = action == Action.RIGHT_CLICK_AIR || action == Action.RIGHT_CLICK_BLOCK;
        if (!left && !right) {
            return;
        }
        event.setCancelled(true);
        try {
            event.setUseItemInHand(Event.Result.DENY);
            event.setUseInteractedBlock(Event.Result.DENY);
        } catch (Throwable ignored) {
        }
        if (left) {
            handleLeftClick(player);
        } else {
            handleRightClick(player);
        }
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = true)
    public void onArmSwing(PlayerAnimationEvent event) {
        if (event.getAnimationType() != PlayerAnimationType.ARM_SWING) {
            return;
        }
        Player player = event.getPlayer();
        if (!isHoldingStaff(player) || player.isSneaking()) {
            return;
        }
        if (openGui.contains(player.getUniqueId())) {
            return;
        }
        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        Long prev = leftAnimDebounce.get(uuid);
        if (prev != null && now - prev < LEFT_ANIM_DEBOUNCE_MS) {
            return;
        }
        leftAnimDebounce.put(uuid, now);
        // Air left-click often skips InteractEvent — secondary dispatch only
        dispatchLeftSpell(player);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onItemHeld(PlayerItemHeldEvent event) {
        Player player = event.getPlayer();
        ItemStack prev = player.getInventory().getItem(event.getPreviousSlot());
        if (StaffPdc.isStaff(prev)) {
            clearStaffState(player);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        Player player = event.getPlayer();
        clearStaffState(player);
        MageSpellRuntime.purgePlayer(player.getUniqueId());
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = false)
    public void onGuiClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        if (!openGui.contains(player.getUniqueId())) {
            return;
        }
        if (!GUI_TITLE.equals(event.getView().getTitle())) {
            return;
        }
        event.setCancelled(true);
        if (event.getClickedInventory() == null
            || event.getClickedInventory() != event.getView().getTopInventory()) {
            return;
        }
        int raw = event.getRawSlot();
        if (raw < SLOT_SPELL_START || raw >= SLOT_SPELL_START + SLOT_SPELL_COUNT) {
            return;
        }
        int spellIndex = raw - SLOT_SPELL_START;
        ItemStack hand = player.getInventory().getItemInMainHand();
        StaffPdc.StaffData data = StaffPdc.read(hand);
        if (data == null || data.capacity() <= 0 || spellIndex >= data.capacity()) {
            return;
        }
        String spellId = data.spells()[spellIndex];
        if (spellId == null || spellId.isEmpty()) {
            return;
        }
        if (!StaffPdc.writeSelected(hand, spellIndex)) {
            return;
        }
        player.getInventory().setItemInMainHand(hand);
        // 选择术式：清除其它未投射的术式（已投射保留）
        MageSpellRuntime.clearUnprojected(player, spellId);
        try {
            player.playSound(player.getLocation(), "block.note_block.bell", 0.85f, 1.35f);
        } catch (Throwable ignored) {
        }
        player.closeInventory();
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = false)
    public void onGuiDrag(InventoryDragEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        if (openGui.contains(player.getUniqueId()) && GUI_TITLE.equals(event.getView().getTitle())) {
            event.setCancelled(true);
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onGuiClose(InventoryCloseEvent event) {
        if (!(event.getPlayer() instanceof Player player)) {
            return;
        }
        openGui.remove(player.getUniqueId());
        lightRuin.stopRing(player);
    }

    // -------------------------------------------------------------------------
    // Cast / GUI
    // -------------------------------------------------------------------------

    private void handleRightClick(Player player) {
        if (!requireSingleStaff(player)) {
            return;
        }
        if (!useDebounced(player)) {
            return;
        }
        if (player.isSneaking()) {
            openSpellGui(player);
            return;
        }
        tryCast(player);
    }

    private void handleLeftClick(Player player) {
        if (!requireSingleStaff(player)) {
            return;
        }
        if (openGui.contains(player.getUniqueId())) {
            return;
        }
        if (player.isSneaking()) {
            if (!useDebounced(player)) {
                return;
            }
            openSpellGui(player);
            return;
        }
        dispatchLeftSpell(player);
    }

    private void tryCast(Player player) {
        ItemStack hand = player.getInventory().getItemInMainHand();
        StaffPdc.StaffData data = StaffPdc.read(hand);
        if (data == null || data.capacity() <= 0) {
            return;
        }
        int sel = data.selected();
        if (sel < 0 || sel >= data.capacity()) {
            return;
        }
        String spellId = data.spells()[sel];
        if (spellId == null || spellId.isEmpty()) {
            return;
        }
        MageSpell spell = MageSpellRegistry.get(spellId);
        if (spell == null) {
            sendActionBar(player, "§c术式未实现: " + spellId);
            return;
        }
        UUID uuid = player.getUniqueId();
        String cdKey = castCdKey(uuid, spellId);
        long now = System.currentTimeMillis();
        Long until = castCdUntil.get(cdKey);
        if (until != null && now < until) {
            double left = (until - now) / 1000.0;
            sendActionBar(player, "§7" + StaffPdc.spellDisplayName(spellId)
                + " 冷却 §f" + String.format("%.1f", left) + "s");
            return;
        }
        // 侵蚀等级 = 环数 - 术士等级
        int ring = spell.ringCount();
        int erosion = MageSpellDamage.calcErosion(player, ring);
        try {
            GltcPlugin.getInstance().getLogger().info(
                "[GLTC侵蚀] 施术 " + player.getName() + " 术式=" + spellId
                    + " 环数=" + ring + " 侵蚀=" + erosion);
        } catch (Throwable ignored) {
        }
        long cd = computeCastCooldown(player, spell, erosion);
        castCdUntil.put(cdKey, now + cd);
        try {
            spell.onRightClick(player, hand);
        } catch (Throwable t) {
            castCdUntil.remove(cdKey);
            try {
                GltcPlugin.getInstance().getLogger().severe("术式施放异常 " + spellId + ": " + t);
            } catch (Throwable ignored) {
            }
            return;
        }
        // 侵蚀 > 0：对自身造成 20% 最大生命值 × 侵蚀等级 的脉冲伤害，冷却已乘侵蚀等级
        if (erosion > 0) {
            MageSpellDamage.applyErosionSelfDamage(player, erosion, spellId);
        }
    }

    private static String castCdKey(UUID uuid, String spellId) {
        return uuid + "|" + spellId;
    }

    private long computeCastCooldown(Player player, MageSpell spell, int erosion) {
        MageService svc = MageService.get();
        if (svc != null) {
            try {
                return svc.calcSpellCooldownMs(player, spell.baseCooldownMs(), erosion);
            } catch (Throwable ignored) {
            }
        }
        long base = Math.max(0, spell.baseCooldownMs());
        return Math.max(50, base);
    }

    private void dispatchLeftSpell(Player player) {
        ItemStack hand = player.getInventory().getItemInMainHand();
        StaffPdc.StaffData data = StaffPdc.read(hand);
        if (data == null || data.capacity() <= 0) {
            return;
        }
        int sel = data.selected();
        if (sel < 0 || sel >= data.capacity()) {
            return;
        }
        String spellId = data.spells()[sel];
        if (spellId == null || spellId.isEmpty()) {
            return;
        }
        MageSpell spell = MageSpellRegistry.get(spellId);
        if (spell == null) {
            return;
        }
        spell.onLeftClick(player, hand);
    }

    private void openSpellGui(Player player) {
        // 打开术式选择 GUI：清除所有[未投射]状态的术式（[已投射]不受影响）
        MageSpellRuntime.clearUnprojected(player, null);
        ItemStack hand = player.getInventory().getItemInMainHand();
        StaffPdc.StaffData data = StaffPdc.read(hand);
        Inventory inv = Bukkit.createInventory(null, INV_SIZE, GUI_TITLE);
        inv.setItem(SLOT_SKILL, buildSkillSlot(hand, data));
        inv.setItem(SLOT_DIVIDER, named(Material.BLACK_STAINED_GLASS_PANE, "§8 ", List.of()));
        int capacity = data != null ? data.capacity() : 0;
        int selected = data != null ? data.selected() : -1;
        String[] spells = data != null ? data.spells() : new String[StaffPdc.MAX_SPELL_SLOTS];
        for (int i = 0; i < SLOT_SPELL_COUNT; i++) {
            inv.setItem(SLOT_SPELL_START + i, buildSpellSlot(i, capacity, selected, spells));
        }
        inv.setItem(SLOT_BORDER_END, named(Material.BLACK_STAINED_GLASS_PANE, "§8 ", List.of()));
        openGui.add(player.getUniqueId());
        player.openInventory(inv);
        try {
            player.playSound(player.getLocation(), "block.end_portal_frame.fill", 0.75f, 1.15f);
        } catch (Throwable ignored) {
        }
        // 打开施术界面即触发核心技能（光影废墟）并启动环绕粒子
        triggerCoreSkillOnOpen(player, hand, data != null ? data.skillCoreId() : null);
    }

    private ItemStack buildSkillSlot(@Nullable ItemStack staffHand, @Nullable StaffPdc.StaffData data) {
        String hint = LightRuinSkill.SKILL_HINT;
        String skillId = null;
        if (data != null && data.skillCoreId() != null) {
            StaffPdc.CoreDef def = StaffPdc.cores().get(data.skillCoreId());
            if (def != null) {
                skillId = def.skillId();
            }
        }
        if (skillId == null) {
            hint = "§7无核心技能（嵌入辉墨摇篮等核心后生效）";
        } else if (!LightRuinSkill.SKILL_ID.equals(skillId)) {
            hint = "§7核心技能: §f" + skillId;
        }
        if (staffHand != null && staffHand.getType() != Material.AIR) {
            ItemStack clone = staffHand.clone();
            clone.setAmount(1);
            ItemMeta meta = clone.getItemMeta();
            if (meta != null) {
                List<String> lore = meta.hasLore() ? new java.util.ArrayList<>(meta.getLore()) : new java.util.ArrayList<>();
                lore.add("§8§m----------------");
                lore.add("§x§f§f§f§5§b§3核心提供技能");
                lore.add(hint);
                meta.setLore(lore);
                clone.setItemMeta(meta);
            }
            return clone;
        }
        return named(Material.STICK, "§x§f§f§f§5§b§3核心提供技能", List.of(hint));
    }

    private static ItemStack buildSpellSlot(int index, int capacity, int selected, String[] spells) {
        if (index >= capacity) {
            return named(Material.OBSIDIAN, "§8[未解锁]", List.of(
                "§7未嵌入技能核心时无法刻录",
                "§7可在术式承载转换仪嵌入核心后提升"
            ));
        }
        String spellId = spells != null && index < spells.length ? spells[index] : null;
        if (spellId == null || spellId.isEmpty()) {
            return named(Material.LIGHT_GRAY_SHULKER_BOX, "§7[未装填]", List.of(
                "§7槽位已解锁，但尚未刻录术式",
                "§7可在术式承载转换仪刻录术式载体"
            ));
        }
        String name = StaffPdc.spellDisplayName(spellId);
        boolean isSel = index == selected;
        Material mat = spellMaterial(spellId);
        ItemStack stack = named(
            mat,
            (isSel ? "§b§l[已选择] " : "§a[已装填] ") + name,
            List.of(isSel ? "§e当前选中术式" : "§7点击选择此术式")
        );
        if (isSel) {
            ItemMeta meta = stack.getItemMeta();
            if (meta != null) {
                try {
                    meta.addEnchant(Enchantment.UNBREAKING, 1, true);
                    meta.addItemFlags(ItemFlag.HIDE_ENCHANTS);
                } catch (Throwable ignored) {
                }
                stack.setItemMeta(meta);
            }
        }
        return stack;
    }

    private static Material spellMaterial(String spellId) {
        ItemStack clone = StaffPdc.createSfClone(spellId);
        if (clone != null && clone.getType() != Material.AIR) {
            return clone.getType();
        }
        return Material.LIME_SHULKER_BOX;
    }

    private void triggerCoreSkillOnOpen(Player player, ItemStack staff, @Nullable String coreId) {
        if (coreId == null) {
            return;
        }
        StaffPdc.CoreDef def = StaffPdc.cores().get(coreId);
        if (def == null || def.skillId() == null) {
            return;
        }
        if (LightRuinSkill.SKILL_ID.equals(def.skillId())) {
            lightRuin.tryTrigger(player, staff);
            lightRuin.startRing(player);
        }
    }

    private void clearStaffState(Player player) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();
        if (openGui.remove(uuid)) {
            try {
                player.closeInventory();
            } catch (Throwable ignored) {
            }
        }
        useDebounce.remove(uuid);
        leftAnimDebounce.remove(uuid);
        // 切出法杖：清除全部术式会话（未投射与已投射一并终止）
        MageSpellRuntime.clearAll(player);
        castCdUntil.keySet().removeIf(k -> k.startsWith(uuid + "|"));
        lightRuin.clearPlayer(uuid);
        if (fireballSpell != null) {
            fireballSpell.clearPlayer(uuid);
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private boolean useDebounced(Player player) {
        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        Long prev = useDebounce.get(uuid);
        if (prev != null && now - prev < USE_DEBOUNCE_MS) {
            return false;
        }
        useDebounce.put(uuid, now);
        return true;
    }

    private static boolean isHoldingStaff(Player player) {
        if (player == null) {
            return false;
        }
        ItemStack hand = player.getInventory().getItemInMainHand();
        return StaffPdc.isStaff(hand);
    }

    private static boolean requireSingleStaff(Player player) {
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (!StaffPdc.isStaff(hand)) {
            return false;
        }
        return hand.getAmount() == 1;
    }

    private static ItemStack named(Material mat, String name, List<String> lore) {
        ItemStack stack = new ItemStack(mat == null ? Material.STONE : mat, 1);
        ItemMeta meta = stack.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            if (lore != null && !lore.isEmpty()) {
                meta.setLore(lore);
            }
            stack.setItemMeta(meta);
        }
        return stack;
    }

    private static void sendActionBar(Player player, String msg) {
        try {
            player.sendActionBar(LegacyComponentSerializer.legacySection().deserialize(msg));
        } catch (Throwable t) {
            player.sendMessage(msg);
        }
    }
}
