package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;

import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * {@code VASA_驭粒终端} — player equip + potential allocation GUI.
 */
public final class YuLiTerminalLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "VASA_驭粒终端";

    // ===== 配置区（驭粒终端 GUI，改完需重新打包 jar 并重启生效）=====
    private static final String GUI_TITLE =
        "§x§a§2§d§e§f§f此§x§9§9§c§c§f§f岸§x§8§f§b§a§f§f雪§x§8§6§a§8§f§f™§x§7§d§9§6§f§f智§x§8§2§8§8§f§f能§x§9§7§7§f§f§f监§x§a§c§7§5§f§f控§x§c§1§6§c§f§f终§x§d§6§6§2§f§f端";  // 面板标题，需与 装备菜单.js 一致
    private static final String PREFIX =
        "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";  // 消息前缀（彩色文本，通常无需改动）

    // ---- 与 装备菜单.js lore 常用色一致 ----
    private static final String C_DESC = "§x§f§f§f§5§b§3"; // #fff5b3 说明行配色
    private static final String C_POT = "§x§9§d§f§9§f§f"; // #9df9ff 潜能使用行配色
    private static final String C_GEAR = "§x§4§4§a§5§f§f"; // #44a5ff 组件提供行配色
    private static final String C_CAP = "§x§f§f§6§7§a§7"; // #ff67a7 上限行配色

    // ---- 与 装备菜单.js STAT_LABELS / PCT_STAT_KEYS 一致 ----
    private static final Map<String, String> STAT_LABELS = Map.ofEntries(  // 属性键 → 中文显示名（与 装备菜单.js 一致）
        Map.entry("particlePower", "粒子强度"),
        Map.entry("cardiovascular", "心血管强度"),
        Map.entry("particleRefraction", "粒子折射"),
        Map.entry("finalDamageReduction", "最终减伤"),
        Map.entry("meleeDamage", "筋力解放"),
        Map.entry("maxHealth", "肌脂提升"),
        Map.entry("armor", "骨骼结构"),
        Map.entry("toughness", "体态掌控"),
        Map.entry("speed", "心肺强化"),
        Map.entry("reach", "体态协调"),
        Map.entry("magePotential", "术士潜能"),
        Map.entry("bodyPotential", "体能潜能"));
    private static final Set<String> PCT_STAT_KEYS =
        Set.of("cardiovascular", "particleRefraction", "finalDamageReduction");  // 以百分比显示的属性键

    private static final int SLOT_RESET = 8;     // 54 格面板（0~53）：重置按钮
    private static final int SLOT_LEVEL = 9;     // 等级显示
    private static final int SLOT_PP = 10;       // 粒子强度按钮
    private static final int SLOT_CARDIO = 11;   // 心血管强度按钮
    private static final int SLOT_REFRACT = 12;  // 粒子折射按钮
    private static final int SLOT_FINAL_DR = 13; // 最终减伤按钮
    private static final int SLOT_MAGE_PTS = 17; // 术士潜能显示
    private static final int SLOT_MELEE = 18;    // 筋力解放按钮
    private static final int SLOT_HP = 19;       // 肌脂提升按钮
    private static final int SLOT_ARMOR = 20;    // 骨骼结构按钮
    private static final int SLOT_TOUGH = 21;    // 体态掌控按钮
    private static final int SLOT_SPEED = 22;    // 心肺强化按钮
    private static final int SLOT_REACH = 23;    // 体态协调按钮
    private static final int SLOT_BODY_PTS = 26; // 体能潜能显示
    private static final int SLOT_GLI = 53;      // GLI 显示位

    private static final Map<Integer, String> MAGE_CLICK = Map.of(  // 术士槽位 → 属性键映射（调整布局时与 SLOT_* 同步修改）
        SLOT_PP, "particlePower",
        SLOT_CARDIO, "cardiovascular",
        SLOT_REFRACT, "particleRefraction",
        SLOT_FINAL_DR, "finalDamageReduction"
    );
    private static final Map<Integer, String> BODY_CLICK = Map.of(  // 体能槽位 → 属性键映射
        SLOT_MELEE, "meleeDamage",
        SLOT_HP, "maxHealth",
        SLOT_ARMOR, "armor",
        SLOT_TOUGH, "toughness",
        SLOT_SPEED, "speed",
        SLOT_REACH, "reach"
    );

    private static YuLiTerminalLogic instance;

    private final Map<Inventory, Session> sessions = new IdentityHashMap<>();

    private YuLiTerminalLogic() {
    }

    public static void register(GltcPlugin plugin) {
        unregister();
        YuLiTerminalLogic logic = new YuLiTerminalLogic();
        instance = logic;
        GltcLogicRegistry.registerItem(ITEM_ID, logic);
        Bukkit.getPluginManager().registerEvents(logic, plugin);
    }

    public static void unregister() {
        YuLiTerminalLogic logic = instance;
        if (logic == null) {
            return;
        }
        instance = null;
        HandlerList.unregisterAll(logic);
        logic.sessions.clear();
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        openMenu(event.getPlayer());
        return true;
    }

    private void openMenu(Player player) {
        MageService svc = MageService.get();
        if (svc == null) {
            player.sendMessage(PREFIX + "§c术士核心未加载。");
            return;
        }
        UUID uuid = player.getUniqueId();
        svc.invalidateCache(uuid);
        Inventory inv = Bukkit.createInventory(null, 54, GUI_TITLE);
        Session session = new Session(uuid, svc.getPlayerStats(uuid), false);
        synchronized (sessions) {
            sessions.put(inv, session);
        }
        paint(inv, player, session);
        player.openInventory(inv);
        try {
            player.playSound(player.getLocation(), "block.vault.open_shutter", 1.0f, 1.0f);
        } catch (Throwable ignored) {
        }
    }

    private void paint(Inventory inv, Player player, Session session) {
        // 与 装备菜单.js 一致：黑色玻璃背景
        ItemStack filler = MageItems.named(Material.BLACK_STAINED_GLASS_PANE, "§0", List.of());
        for (int i = 0; i < 54; i++) {
            inv.setItem(i, filler);
        }
        inv.setItem(MageEquipSlots.SEPARATOR_GUI_SLOT, buildSeparator());
        MageService svc = MageService.get();
        if (svc == null) {
            return;
        }
        MageGear gear = svc.getPlayerGear(session.uuid);
        for (int i = 0; i < MageEquipSlots.slotCount(); i++) {
            MageEquipSlots.SlotDef def = MageEquipSlots.slotDef(i);
            MageGear.Slot slot = gear.slots.get(i);
            if (slot != null) {
                ItemStack equipped = svc.getGearSlotItem(slot);
                if (equipped != null) {
                    inv.setItem(def.gui(), equipped.clone());
                    continue;
                }
            }
            inv.setItem(def.gui(), buildEmptySlot(def));
        }
        refreshStats(inv, player, session);
    }

    /** 与 装备菜单.js buildSeparator() 一致：黑色玻璃、§0、无 lore */
    private static ItemStack buildSeparator() {
        return MageItems.named(Material.BLACK_STAINED_GLASS_PANE, "§0", List.of());
    }

    /** 与 装备菜单.js buildEmptySlot() 一致：§5 名称 + 指定 lore */
    private static ItemStack buildEmptySlot(MageEquipSlots.SlotDef def) {
        return MageItems.skull(def.skullHash(), "§5" + def.label(), List.of(
            "§7类型：§f" + MageEquipSlots.CATEGORY_NAMES.getOrDefault(def.category(), def.category()),
            "§e左键/右键点击背包中组件自动装备",
            "§e左键点击已装备槽可卸下到背包"
        ));
    }

    private void refreshStats(Inventory inv, Player player, Session session) {
        MageService svc = MageService.get();
        if (svc == null) {
            return;
        }
        MageStats base = session.stats;
        MageBonuses equip = MageService.equipStatBonusesOnly(svc.getEquipmentBonuses(session.uuid));
        MageStats total = svc.buildTotalStats(session.uuid, base, true);
        String saveTip = session.dirty ? C_DESC + "※ 有未保存修改，关闭后写入" : null;

        inv.setItem(SLOT_RESET, MageItems.named(Material.BARRIER, "§c重置所有潜能", List.of(
            C_DESC + "将已分配潜能全部退回",
            C_DESC + "术士潜能 / 体能潜能各自返还",
            "§e左键确认重置",
            C_DESC + "关闭面板时写入并刷新全部加成"
        )));
        inv.setItem(SLOT_LEVEL, MageItems.named(Material.EXPERIENCE_BOTTLE,
            "§d术士等级 §f+ " + formatNum(total.mageLevel), List.of(
                C_DESC + "驭粒熟练度：" + formatNum(total.proficiency),
                C_DESC + "环数 ＞ 术士等级：侵蚀等级 = 环数 - 等级",
                C_DESC + "侵蚀时：术式冷却 × 侵蚀等级；自伤 = 侵蚀 × 20% 最大生命（脉冲）",
                C_DESC + "术士等级提升时获得潜能"
            )));
        inv.setItem(SLOT_PP, attrPane(Material.AMETHYST_SHARD, "§b", "粒子强度",
            List.of("提升自身粒子的强度与控制能力", "最终伤害 = 强度 × 术式系数 × GLI"),
            total.particlePower, base.particlePower, base.getSpent("particlePower"),
            equip.get("particlePower"), false, "particlePower"));
        inv.setItem(SLOT_CARDIO, attrPane(Material.REDSTONE, "§c", "心血管强度",
            List.of("提升供氧与心血管系统强度，减少术式冷却",
                "当前术式的最终冷却比例： " + formatPct(Math.max(0.01, 1 - total.cardiovascular))),
            total.cardiovascular, base.cardiovascular, base.getSpent("cardiovascular"),
            equip.get("cardiovascular"), true, "cardiovascular"));
        inv.setItem(SLOT_REFRACT, attrPane(Material.PRISMARINE_CRYSTALS, "§3", "粒子折射",
            List.of("折射粒子射流，减少受到的粒子伤害"),
            total.particleRefraction, base.particleRefraction, base.getSpent("particleRefraction"),
            equip.get("particleRefraction"), true, "particleRefraction"));
        inv.setItem(SLOT_FINAL_DR, attrPane(Material.SHIELD, "§6", "最终减伤",
            List.of("影响常规伤害与粒子伤害", "无法影响脉冲伤害"),
            total.finalDamageReduction, base.finalDamageReduction, base.getSpent("finalDamageReduction"),
            equip.get("finalDamageReduction"), true, "finalDamageReduction"));
        List<String> magePtsLore = new ArrayList<>(List.of(
            C_DESC + "用于提升驭粒相关能力的潜能，",
            C_DESC + "术士等级提升时能获得。",
            C_DESC + "潜能组件加成在装配时直接并入此数值"
        ));
        if (saveTip != null) {
            magePtsLore.add(saveTip);
        }
        inv.setItem(SLOT_MAGE_PTS, MageItems.named(Material.PURPLE_DYE,
            "§d术士潜能 §f+ " + formatNum(total.magePotential), magePtsLore));
        inv.setItem(SLOT_MELEE, attrPane(Material.IRON_SWORD, "§f", "筋力解放",
            List.of("解放肌肉与神经协调上限", "提升近战伤害白值"),
            total.meleeDamage, base.meleeDamage, base.getSpent("meleeDamage"),
            equip.get("meleeDamage"), false, "meleeDamage"));
        inv.setItem(SLOT_HP, attrPane(Material.GOLDEN_APPLE, "§f", "肌脂提升",
            List.of("提升脂肪与肌肉的糅合强度", "提升血量白值"),
            total.maxHealth, base.maxHealth, base.getSpent("maxHealth"),
            equip.get("maxHealth"), false, "maxHealth"));
        inv.setItem(SLOT_ARMOR, attrPane(Material.IRON_CHESTPLATE, "§f", "骨骼结构",
            List.of("优化、改进自身的整体骨骼结构", "提升防御值白值"),
            total.armor, base.armor, base.getSpent("armor"),
            equip.get("armor"), false, "armor"));
        inv.setItem(SLOT_TOUGH, attrPane(Material.NETHERITE_CHESTPLATE, "§f", "体态掌控",
            List.of("进一步擢升椎反应与身体协调", "提升韧性白值"),
            total.toughness, base.toughness, base.getSpent("toughness"),
            equip.get("toughness"), false, "toughness"));
        inv.setItem(SLOT_SPEED, attrPane(Material.SUGAR, "§f", "心肺强化",
            List.of("全方位强化氧转化与肌肉活性", "提升速度白值"),
            total.speed, base.speed, base.getSpent("speed"),
            equip.get("speed"), false, "speed"));
        inv.setItem(SLOT_REACH, attrPane(Material.STICK, "§f", "体态协调",
            List.of("掌握自己的全身系统与核心稳定", "提升手长白值"),
            total.reach, base.reach, base.getSpent("reach"),
            equip.get("reach"), false, "reach"));
        List<String> bodyPtsLore = new ArrayList<>(List.of(
            C_DESC + "用于提升通用身体机能的潜能，",
            C_DESC + "术士等级提升时能获得。",
            C_DESC + "潜能组件加成在装配时直接并入此数值"
        ));
        if (saveTip != null) {
            bodyPtsLore.add(saveTip);
        }
        inv.setItem(SLOT_BODY_PTS, MageItems.named(Material.LIME_DYE,
            "§a体能潜能 §f+ " + formatNum(total.bodyPotential), bodyPtsLore));
        inv.setItem(SLOT_GLI, MageItems.named(Material.END_CRYSTAL,
            "§d粒子浓度 GLI §f+ " + formatNum(svc.getGli()), List.of(
                C_DESC + "管理员可配置，无法提升",
                C_DESC + "ParticleConcentration"
            )));
    }

    /** 与 装备菜单.js buildAttrPane() 一致的结构与配色。 */
    private ItemStack attrPane(Material mat, String color, String title, List<String> descs,
                               double total, double base, int spent, double equip,
                               boolean pct, String key) {
        MagePointDefs.PointOpt opt = MagePointDefs.optionAny(key);
        double per = opt != null ? opt.per() : 0;
        Integer maxPts = opt != null ? opt.maxPoints() : null;
        Double hardCap = MagePointDefs.HARD_CAPS.get(key);
        String name = color + title + " §f+ " + formatStat(total, pct);
        List<String> lore = new ArrayList<>();
        for (String d : descs) {
            lore.add(C_DESC + d);
        }
        lore.add(" ");
        lore.add(C_DESC + "当前总计来源：");
        lore.add(C_POT + "存档基础 §f" + formatStat(base, pct));
        if (spent > 0) {
            lore.add(C_POT + "其中潜能 §f" + spent + " §7× §f" + formatStat(per, pct));
        }
        if (equip != 0) {
            lore.add(C_GEAR + "组件提供 §f" + formatStat(equip, pct));
        }
        lore.add(C_CAP + "可使用潜能上限：§c" + potMaxLabel(maxPts));
        lore.add(C_CAP + "全局上限：§c" + hardCapLabel(hardCap, pct));
        return MageItems.named(mat, name, lore);
    }

    /** 与 装备菜单.js formatPct() 一致：保留 1 位小数。 */
    private static String formatPct(double v) {
        return String.format("%.1f", Math.round(v * 1000) / 10.0) + "%";
    }

    /** 与 装备菜单.js formatPotMaxLabel() 一致。 */
    private static String potMaxLabel(Integer maxPts) {
        return (maxPts == null || maxPts <= 0) ? "无" : maxPts + "点";
    }

    /** 与 装备菜单.js formatHardCapLabel() 一致。 */
    private static String hardCapLabel(Double hardCap, boolean pct) {
        if (hardCap == null || !Double.isFinite(hardCap)) {
            return "无";
        }
        return pct ? formatPct(hardCap) : formatNum(hardCap);
    }

    /** 与 装备菜单.js formatBonusAnnounce() 一致。 */
    private static String formatBonusAnnounce(MageBonuses bonuses) {
        if (bonuses == null) {
            return "";
        }
        List<String> parts = new ArrayList<>();
        for (String k : MagePointDefs.ALL_STAT_KEYS) {
            double v = bonuses.get(k);
            if (v == 0) {
                continue;
            }
            String label = STAT_LABELS.getOrDefault(k, k);
            parts.add(label + " §f+" + (PCT_STAT_KEYS.contains(k) ? formatPct(v) : formatNum(v)));
        }
        return String.join("§7，", parts);
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onClick(InventoryClickEvent event) {
        if (!(event.getWhoClicked() instanceof Player player)) {
            return;
        }
        Inventory top = event.getView().getTopInventory();
        Session session;
        synchronized (sessions) {
            session = sessions.get(top);
        }
        if (session == null) {
            return;
        }
        event.setCancelled(true);
        MageService svc = MageService.get();
        if (svc == null) {
            return;
        }

        // Bag left-click UGW → equip
        if (event.getClickedInventory() != null
            && event.getClickedInventory() == event.getView().getBottomInventory()
            && event.isLeftClick()) {
            tryEquip(player, top, session, event.getSlot());
            return;
        }

        if (event.getClickedInventory() == null || event.getClickedInventory() != top) {
            return;
        }
        int raw = event.getRawSlot();

        int equipIdx = MageEquipSlots.equipIndexByGui(raw);
        if (equipIdx >= 0 && event.isLeftClick()) {
            unequip(player, top, session, equipIdx);
            return;
        }

        if (raw == SLOT_RESET) {
            MageService.ResetResult rr = svc.resetAllPotentialsOnData(session.stats);
            if (!rr.ok()) {
                player.sendMessage(PREFIX + "§c" + rr.msg());
                return;
            }
            session.dirty = true;
            player.sendMessage(PREFIX + "§a已重置潜能：§d术士 +" + rr.mage() + " §7/ §a体能 +" + rr.body()
                + " §7(现有 §d" + rr.mageLeft() + " §7/ §a" + rr.bodyLeft() + "§7)");
            refreshStats(top, player, session);
            return;
        }
        String mageKey = MAGE_CLICK.get(raw);
        if (mageKey != null) {
            MageService.SpendResult r = svc.spendPotentialOnData(session.stats, "mage", mageKey);
            if (!r.ok()) {
                player.sendMessage(PREFIX + "§c" + r.msg());
                return;
            }
            session.dirty = true;
            player.sendMessage(PREFIX + "§a术士潜能：§f" + r.msg() + " §7(剩余 " + r.left() + ")");
            refreshStats(top, player, session);
            return;
        }
        String bodyKey = BODY_CLICK.get(raw);
        if (bodyKey != null) {
            MageService.SpendResult r = svc.spendPotentialOnData(session.stats, "body", bodyKey);
            if (!r.ok()) {
                player.sendMessage(PREFIX + "§c" + r.msg());
                return;
            }
            session.dirty = true;
            player.sendMessage(PREFIX + "§a体能潜能：§f" + r.msg() + " §7(剩余 " + r.left() + ")");
            refreshStats(top, player, session);
        }
    }

    private void tryEquip(Player player, Inventory top, Session session, int bagSlot) {
        MageService svc = MageService.get();
        if (svc == null) {
            return;
        }
        Inventory bottom = player.getOpenInventory().getBottomInventory();
        ItemStack stack = bottom.getItem(bagSlot);
        if (stack == null || stack.getType() == Material.AIR) {
            return;
        }
        if (!svc.isMageAccessory(stack)) {
            player.sendMessage(PREFIX + "§c无法识别为术士组件。");
            return;
        }
        String kind = svc.ugwKind(stack);
        if ("regular".equals(kind)) {
            MageService.OwnerCheck check = svc.validateRegularUgwOwner(player, stack);
            if (!check.valid()) {
                player.sendMessage(PREFIX + "§c" + check.msg());
                return;
            }
            // [常规UGW]装备时去重：同 uid 只保留一件，多出的直接删除
            int removed = svc.dedupeUgwOnEquip(player, stack);
            if (removed > 0) {
                player.sendMessage(PREFIX + "§e检测到重复的常规术士组件，已清除 §c" + removed + " §e件。");
                paint(top, player, session);
            }
        }
        MageGear gear = svc.getPlayerGear(session.uuid);
        int idx = -1;
        for (int i = 0; i < MageEquipSlots.slotCount(); i++) {
            if (gear.slots.get(i) != null) {
                continue;
            }
            if (svc.canEquipInSlot(stack, i, session.uuid)) {
                idx = i;
                break;
            }
        }
        if (idx < 0) {
            player.sendMessage(PREFIX + "§c没有可装配的空槽（类型不匹配或已满）。");
            return;
        }
        ItemStack one = takeOne(bottom, bagSlot);
        if (one == null) {
            return;
        }
        MageBonuses bonuses = svc.getSlotBonuses(new MageGear.Slot(
            MageItems.getUgwId(one), MageItems.getSlimefunId(one), null));
        // Prefer registry bonuses from live stack
        MageEquipSlots.GearEntry entry = MageEquipSlots.getGearEntry(MageItems.getSlimefunId(one));
        if (entry != null) {
            bonuses = MageBonuses.empty();
            bonuses.mergeMap(entry.bonuses());
        }
        int dm = (int) Math.floor(bonuses.get("magePotential"));
        int db = (int) Math.floor(bonuses.get("bodyPotential"));
        if (dm != 0 || db != 0) {
            svc.applyEquipPotentialChange(session.stats, dm, db);
            session.dirty = true;
        }
        String b64 = MageItems.itemToBase64(one);
        gear.slots.set(idx, new MageGear.Slot(MageItems.getUgwId(one), MageItems.getSlimefunId(one), b64));
        svc.savePlayerGear(session.uuid, gear);
        MageEquipSlots.SlotDef def = MageEquipSlots.slotDef(idx);
        top.setItem(def.gui(), one.clone());
        refreshStats(top, player, session);
        String name = entry != null ? entry.name() : def.label();
        // 与 装备菜单.js announceEquip() 一致：有加成则播报提升明细，无加成则简单提示
        String bonusText = formatBonusAnnounce(bonuses);
        if (!bonusText.isEmpty()) {
            player.sendMessage(PREFIX + "§a已装配 §e" + name + " §7→ 提升 " + bonusText);
        } else {
            player.sendMessage(PREFIX + "§a已装备至 §e" + def.label());
        }
    }

    private void unequip(Player player, Inventory top, Session session, int idx) {
        MageService svc = MageService.get();
        if (svc == null) {
            return;
        }
        MageGear gear = svc.getPlayerGear(session.uuid);
        MageGear.Slot slot = gear.slots.get(idx);
        if (slot == null) {
            return;
        }
        ItemStack item = svc.getGearSlotItem(slot);
        MageBonuses bonuses = svc.getSlotBonuses(slot);
        int dm = (int) Math.floor(bonuses.get("magePotential"));
        int db = (int) Math.floor(bonuses.get("bodyPotential"));
        if (dm != 0 || db != 0) {
            svc.applyEquipPotentialChange(session.stats, -dm, -db);
            session.dirty = true;
        }
        gear.slots.set(idx, null);
        svc.savePlayerGear(session.uuid, gear);
        MageEquipSlots.SlotDef def = MageEquipSlots.slotDef(idx);
        top.setItem(def.gui(), buildEmptySlot(def));
        if (item != null) {
            MageItems.giveOrDrop(player, item);
        }
        refreshStats(top, player, session);
        player.sendMessage(PREFIX + "§e已卸下 §f" + def.label());
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onDrag(InventoryDragEvent event) {
        Inventory top = event.getView().getTopInventory();
        synchronized (sessions) {
            if (sessions.containsKey(top)) {
                event.setCancelled(true);
            }
        }
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onClose(InventoryCloseEvent event) {
        if (!(event.getPlayer() instanceof Player player)) {
            return;
        }
        Inventory inv = event.getInventory();
        Session session;
        synchronized (sessions) {
            session = sessions.remove(inv);
        }
        if (session == null) {
            return;
        }
        MageService svc = MageService.get();
        if (svc == null) {
            return;
        }
        Bukkit.getScheduler().runTask(GltcPlugin.getInstance(), () -> {
            if (!player.isOnline()) {
                return;
            }
            if (session.dirty) {
                boolean ok = svc.savePlayerStats(session.uuid, session.stats);
                player.sendMessage(ok ? PREFIX + "§a潜能改动已写入。" : PREFIX + "§c潜能写入失败。");
            }
            svc.applyMageAttributes(player);
        });
    }

    private static ItemStack takeOne(Inventory inv, int slot) {
        ItemStack stack = inv.getItem(slot);
        if (stack == null || stack.getType() == Material.AIR) {
            return null;
        }
        ItemStack one = stack.clone();
        one.setAmount(1);
        if (stack.getAmount() <= 1) {
            inv.setItem(slot, null);
        } else {
            stack.setAmount(stack.getAmount() - 1);
            inv.setItem(slot, stack);
        }
        return one;
    }

    private static String formatNum(double v) {
        if (Math.abs(v - Math.rint(v)) < 1e-9) {
            return String.valueOf((long) Math.rint(v));
        }
        return String.format("%.3f", v).replaceAll("0+$", "").replaceAll("\\.$", "");
    }

    private static String formatStat(double v, boolean pct) {
        if (pct) {
            return (Math.round(v * 1000) / 10.0) + "%";
        }
        return formatNum(v);
    }

    private static final class Session {
        final UUID uuid;
        final MageStats stats;
        boolean dirty;

        Session(UUID uuid, MageStats stats, boolean dirty) {
            this.uuid = uuid;
            this.stats = stats;
            this.dirty = dirty;
        }
    }
}
