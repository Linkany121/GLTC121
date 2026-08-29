package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import com.linkany121.gltc.logic.common.GltcDataPaths;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.attribute.AttributeModifier;
import org.bukkit.entity.Player;
import org.bukkit.inventory.EquipmentSlotGroup;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;

import javax.annotation.Nullable;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Mage stats / gear persistence + attribute apply (from {@code 核心.js}).
 */
public final class MageService {

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    private static final UUID MOD_MELEE = UUID.fromString("a1111111-1111-4111-8111-111111111101");  // 筋力解放属性修饰符 UUID
    private static final UUID MOD_HP = UUID.fromString("a1111111-1111-4111-8111-111111111102");     // 肌脂提升属性修饰符 UUID
    private static final UUID MOD_ARMOR = UUID.fromString("a1111111-1111-4111-8111-111111111103");  // 骨骼结构属性修饰符 UUID
    private static final UUID MOD_TOUGH = UUID.fromString("a1111111-1111-4111-8111-111111111104");  // 体态掌控属性修饰符 UUID
    private static final UUID MOD_SPEED = UUID.fromString("a1111111-1111-4111-8111-111111111105");  // 心肺强化属性修饰符 UUID
    private static final UUID MOD_REACH = UUID.fromString("a1111111-1111-4111-8111-111111111106");  // 体态协调属性修饰符 UUID
    // 以上 UUID 用于「清除旧加成再套新加成」，一般不要改动；出现属性叠加/无法清除时整组换新即可。

    private static final Pattern SLOT_OBJ = Pattern.compile(
        "\\{\\s*\"ugwId\"\\s*:\\s*(null|\"([^\"]*)\")\\s*,\\s*\"sfId\"\\s*:\\s*(null|\"([^\"]*)\")\\s*,\\s*\"item\"\\s*:\\s*(null|\"([^\"]*)\")\\s*\\}"
    );
    private static final Pattern SLOT_STR = Pattern.compile("\"([A-Za-z0-9+/=]+)\"");

    private static MageService instance;

    private final GltcPlugin plugin;
    private final ConcurrentHashMap<String, MageStats> statsCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, MageBonuses> equipBonusCache = new ConcurrentHashMap<>();

    private MageService(GltcPlugin plugin) {
        this.plugin = plugin;
    }

    public static void init(GltcPlugin plugin) {
        instance = new MageService(plugin);
        try {
            Files.createDirectories(GltcDataPaths.mageStatsDir(plugin));
            Files.createDirectories(GltcDataPaths.mageEquipDir(plugin));
        } catch (IOException ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC术士] 创建目录失败", ex);
        }
    }

    @Nullable
    public static MageService get() {
        return instance;
    }

    public static void shutdown() {
        MageService svc = instance;
        instance = null;
        if (svc != null) {
            svc.statsCache.clear();
            svc.equipBonusCache.clear();
        }
    }

    public void invalidateCache(UUID uuid) {
        if (uuid == null) {
            return;
        }
        String key = uuid.toString();
        statsCache.remove(key);
        equipBonusCache.remove(key);
    }

    // -------------------------------------------------------------------------
    // Stats
    // -------------------------------------------------------------------------

    public MageStats getPlayerStats(UUID uuid) {
        String key = uuid.toString();
        MageStats cached = statsCache.get(key);
        if (cached != null) {
            return cached.copy();
        }
        MageStats data = readStatsFile(uuid);
        if (data == null) {
            data = MageStats.defaults();
            savePlayerStats(uuid, data);
            return data.copy();
        }
        data.ensureSpentFields();
        data.clampMeta();
        statsCache.put(key, data.copy());
        return data.copy();
    }

    public boolean savePlayerStats(UUID uuid, MageStats data) {
        if (uuid == null || data == null) {
            return false;
        }
        data.ensureSpentFields();
        data.clampMeta();
        enrichTotals(uuid, data);
        boolean ok = writeStatsFile(uuid, data);
        if (ok) {
            statsCache.put(uuid.toString(), data.copy());
        } else {
            statsCache.remove(uuid.toString());
        }
        return ok;
    }

    private void enrichTotals(UUID uuid, MageStats copy) {
        MageBonuses equip = equipStatBonusesOnly(getEquipmentBonuses(uuid));
        copy.totals.clear();
        for (String sk : MagePointDefs.ALL_STAT_KEYS) {
            copy.totals.put(sk, copy.getStat(sk) + equip.get(sk));
        }
    }

    // -------------------------------------------------------------------------
    // Gear
    // -------------------------------------------------------------------------

    public MageGear getPlayerGear(UUID uuid) {
        MageGear gear = readGearFile(uuid);
        gear.ensureSize(MageEquipSlots.slotCount());
        return gear;
    }

    public boolean savePlayerGear(UUID uuid, MageGear data) {
        if (uuid == null || data == null) {
            return false;
        }
        data.ensureSize(MageEquipSlots.slotCount());
        boolean ok = writeGearFile(uuid, data);
        equipBonusCache.remove(uuid.toString());
        if (ok) {
            try {
                MageStats stats = getPlayerStats(uuid);
                savePlayerStats(uuid, stats);
            } catch (Exception ignored) {
            }
        }
        return ok;
    }

    public MageBonuses getEquipmentBonuses(UUID uuid) {
        String key = uuid.toString();
        MageBonuses cached = equipBonusCache.get(key);
        if (cached != null) {
            return cached.copy();
        }
        MageBonuses total = MageBonuses.empty();
        MageGear gear = getPlayerGear(uuid);
        boolean dirty = false;
        for (int i = 0; i < gear.slots.size(); i++) {
            MageGear.Slot slot = gear.slots.get(i);
            if (slot == null) {
                continue;
            }
            if (slot.sfId() == null || slot.sfId().isEmpty()) {
                ItemStack item = getGearSlotItem(slot);
                String inferred = MageItems.getSlimefunId(item);
                if (inferred != null) {
                    gear.slots.set(i, new MageGear.Slot(slot.ugwId(), inferred, slot.item()));
                    dirty = true;
                    slot = gear.slots.get(i);
                }
            }
            total.merge(getSlotBonuses(slot));
        }
        if (dirty) {
            writeGearFile(uuid, gear);
        }
        equipBonusCache.put(key, total.copy());
        return total.copy();
    }

    public MageBonuses getSlotBonuses(@Nullable MageGear.Slot slot) {
        MageBonuses b = MageBonuses.empty();
        if (slot == null) {
            return b;
        }
        ItemStack item = getGearSlotItem(slot);
        String gearId = slot.sfId() != null ? slot.sfId() : MageItems.getSlimefunId(item);
        MageEquipSlots.GearEntry entry = MageEquipSlots.getGearEntry(gearId);
        if (entry != null) {
            b.mergeMap(entry.bonuses());
        }
        return b;
    }

    @Nullable
    public ItemStack getGearSlotItem(@Nullable MageGear.Slot slot) {
        if (slot == null) {
            return null;
        }
        return MageItems.itemFromBase64(slot.item());
    }

    public static MageBonuses equipStatBonusesOnly(MageBonuses full) {
        return full == null ? MageBonuses.empty() : full.withoutPotential();
    }

    // -------------------------------------------------------------------------
    // Totals / potential
    // -------------------------------------------------------------------------

    public MageStats buildTotalStats(UUID uuid, MageStats base, boolean includeEquip) {
        MageBonuses equip = includeEquip ? equipStatBonusesOnly(getEquipmentBonuses(uuid)) : MageBonuses.empty();
        MageStats out = MageStats.defaults();
        out.mageLevel = Math.max(0, Math.min(8, base.mageLevel));
        out.proficiency = Math.max(0, Math.min(8, base.proficiency));
        out.magePotential = Math.max(0, base.magePotential);
        out.bodyPotential = Math.max(0, base.bodyPotential);
        for (String sk : MagePointDefs.ALL_STAT_KEYS) {
            double sum = base.getStat(sk) + equip.get(sk);
            out.setStat(sk, MagePointDefs.clampHard(sk, sum));
            out.setSpent(sk, base.getSpent(sk));
        }
        return out;
    }

    public MageStats getTotalStats(Player player) {
        UUID uuid = player.getUniqueId();
        return buildTotalStats(uuid, getPlayerStats(uuid), true);
    }

    public SpendResult spendPotentialOnData(MageStats data, String pool, String statKey) {
        MagePointDefs.PointOpt opt = MagePointDefs.option(pool, statKey);
        if (opt == null) {
            return SpendResult.fail("无效属性");
        }
        data.ensureSpentFields();
        boolean body = "body".equals(pool);
        int left = body ? data.bodyPotential : data.magePotential;
        if (left < 1) {
            return SpendResult.fail("潜能点不足");
        }
        int spentNow = data.getSpent(statKey);
        if (opt.maxPoints() != null && spentNow >= opt.maxPoints()) {
            return SpendResult.fail(opt.label() + " 潜能已达上限（" + opt.maxPoints() + " 点）");
        }
        if (body) {
            data.bodyPotential = left - 1;
        } else {
            data.magePotential = left - 1;
        }
        data.setStat(statKey, data.getStat(statKey) + opt.per());
        data.setSpent(statKey, spentNow + 1);
        String shown;
        if (MagePointDefs.isPercentStat(statKey)) {
            // 与 核心.js 一致：整数除法，如 心血管强度 +1% / 粒子折射 +2%
            shown = (Math.round(opt.per() * 1000) / 10) + "%";
        } else {
            // 与 JS String(double) 一致：整数值不带尾缀 .0（如 肌脂提升 +8、骨骼结构 +2）
            double per = opt.per();
            shown = per == Math.floor(per) ? String.valueOf((long) per) : String.valueOf(per);
        }
        int rem = body ? data.bodyPotential : data.magePotential;
        return SpendResult.ok(opt.label() + " +" + shown, rem);
    }

    public ResetResult resetAllPotentialsOnData(MageStats data) {
        data.ensureSpentFields();
        int refundMage = 0;
        int refundBody = 0;
        for (String mk : MagePointDefs.MAGE_POINT_OPTIONS.keySet()) {
            refundMage += data.getSpent(mk);
        }
        for (String bk : MagePointDefs.BODY_POINT_OPTIONS.keySet()) {
            refundBody += data.getSpent(bk);
        }
        if (refundMage <= 0 && refundBody <= 0) {
            return ResetResult.fail("没有已分配的潜能");
        }
        MageStats defs = MageStats.defaults();
        for (String mk : MagePointDefs.MAGE_POINT_OPTIONS.keySet()) {
            data.setStat(mk, defs.getStat(mk));
            data.setSpent(mk, 0);
        }
        for (String bk : MagePointDefs.BODY_POINT_OPTIONS.keySet()) {
            data.setStat(bk, defs.getStat(bk));
            data.setSpent(bk, 0);
        }
        data.magePotential += refundMage;
        data.bodyPotential += refundBody;
        return ResetResult.ok(refundMage, refundBody, data.magePotential, data.bodyPotential);
    }

    public void applyEquipPotentialChange(MageStats data, int deltaMage, int deltaBody) {
        if (data == null) {
            return;
        }
        applyOnePool(data, "mage", deltaMage);
        applyOnePool(data, "body", deltaBody);
    }

    private void applyOnePool(MageStats data, String pool, int delta) {
        if (delta == 0) {
            return;
        }
        boolean body = "body".equals(pool);
        int cur = body ? data.bodyPotential : data.magePotential;
        int next = cur + delta;
        while (next < 0) {
            if (!revertOnePoolSpend(data, pool)) {
                break;
            }
            next++;
        }
        if (body) {
            data.bodyPotential = Math.max(0, next);
        } else {
            data.magePotential = Math.max(0, next);
        }
    }

    private boolean revertOnePoolSpend(MageStats data, String pool) {
        Map<String, MagePointDefs.PointOpt> table =
            "body".equals(pool) ? MagePointDefs.BODY_POINT_OPTIONS : MagePointDefs.MAGE_POINT_OPTIONS;
        MageStats defs = MageStats.defaults();
        String[] keys = table.keySet().toArray(new String[0]);
        for (int i = keys.length - 1; i >= 0; i--) {
            String sk = keys[i];
            int spent = data.getSpent(sk);
            if (spent <= 0) {
                continue;
            }
            MagePointDefs.PointOpt opt = table.get(sk);
            data.setSpent(sk, spent - 1);
            data.setStat(sk, data.getStat(sk) - opt.per());
            double floor = defs.getStat(sk);
            if (data.getStat(sk) < floor) {
                data.setStat(sk, floor);
            }
            return true;
        }
        return false;
    }

    public AdminResetResult adminResetAllData(Player player) {
        UUID uuid = player.getUniqueId();
        MageGear gear = getPlayerGear(uuid);
        int returned = 0;
        for (int i = 0; i < gear.slots.size(); i++) {
            MageGear.Slot slot = gear.slots.get(i);
            if (slot == null) {
                continue;
            }
            ItemStack item = getGearSlotItem(slot);
            if (item != null) {
                MageItems.giveOrDrop(player, item);
                returned++;
            }
            gear.slots.set(i, null);
        }
        savePlayerGear(uuid, gear);
        MageStats fresh = MageStats.defaults();
        savePlayerStats(uuid, fresh);
        invalidateCache(uuid);
        applyMageAttributes(player);
        return new AdminResetResult(true, returned, fresh.mageLevel);
    }

    public double getGli() {
        return GltcAbilityPower.getParticleConcentration();
    }

    public double calcSpellDamage(Player player, double spellCoefficient) {
        MageStats stats = getTotalStats(player);
        return stats.particlePower * spellCoefficient * getGli();
    }

    public long calcSpellCooldownMs(Player player, long baseCooldownMs, int erosion) {
        long base = Math.max(0, baseCooldownMs);
        double cardio = MagePointDefs.clampHard("cardiovascular", getTotalStats(player).cardiovascular);
        double mult = Math.max(0.01, 1 - cardio);
        long cd = Math.max(50, (long) Math.floor(base * mult));
        if (erosion > 0) {
            cd = Math.max(50, cd * erosion);
        }
        return cd;
    }

    // -------------------------------------------------------------------------
    // Equip validation
    // -------------------------------------------------------------------------

    public boolean canEquipInSlot(ItemStack stack, int slotIndex, UUID playerUuid) {
        MageEquipSlots.SlotDef def = MageEquipSlots.slotDef(slotIndex);
        if (def == null || stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        MageEquipSlots.GearEntry entry = MageEquipSlots.getGearEntry(MageItems.getSlimefunId(stack));
        if (entry != null) {
            return entry.category().equals(def.category());
        }
        String ugwId = MageItems.getUgwId(stack);
        if (ugwId == null || ugwId.isEmpty()) {
            return false;
        }
        Character letter = ugwId.charAt(0);
        String cat = MageEquipSlots.LETTER_TO_CATEGORY.get(letter);
        if (cat == null || !cat.equals(def.category())) {
            return false;
        }
        String creator = MageItems.getUgwCreator(stack);
        return creator == null || playerUuid == null || creator.equals(playerUuid.toString());
    }

    public boolean isMageAccessory(ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        if (MageEquipSlots.getGearEntry(MageItems.getSlimefunId(stack)) != null) {
            return true;
        }
        String ugwId = MageItems.getUgwId(stack);
        return ugwId != null && !ugwId.isEmpty()
            && MageEquipSlots.LETTER_TO_CATEGORY.containsKey(ugwId.charAt(0));
    }

    public String ugwKind(ItemStack stack) {
        if (MageEquipSlots.getGearEntry(MageItems.getSlimefunId(stack)) != null) {
            return "simple";
        }
        String ugwId = MageItems.getUgwId(stack);
        if (ugwId != null && !ugwId.isEmpty()) {
            return "regular";
        }
        return null;
    }

    public OwnerCheck validateRegularUgwOwner(Player player, ItemStack stack) {
        String creator = MageItems.getUgwCreator(stack);
        if (creator != null && !creator.equals(player.getUniqueId().toString())) {
            return OwnerCheck.fail("该组件的制作者不是你，无法装备。");
        }
        return OwnerCheck.ok();
    }

    /**
     * [常规UGW]装备时去重：同 uid 的 UGW 只保留一件（已装备槽与背包均去重）。
     * [简易UGW]（由粘液 id 提供固定加成）不去重。
     *
     * @return 移除的件数
     */
    public int dedupeUgwOnEquip(Player player, ItemStack stack) {
        if (player == null || stack == null || stack.getType() == Material.AIR) {
            return 0;
        }
        if (!"regular".equals(ugwKind(stack))) {
            return 0;
        }
        String ugwId = MageItems.getUgwId(stack);
        if (ugwId == null || ugwId.isEmpty()) {
            return 0;
        }
        UUID uuid = player.getUniqueId();
        int removed = 0;

        // 已装备槽去重：同 uid 只保留第一件
        MageGear gear = getPlayerGear(uuid);
        boolean gearChanged = false;
        boolean keepSlot = true;
        for (int i = 0; i < gear.slots.size(); i++) {
            MageGear.Slot slot = gear.slots.get(i);
            if (slot == null) {
                continue;
            }
            String sid = slot.ugwId();
            if (sid == null || sid.isEmpty()) {
                ItemStack item = getGearSlotItem(slot);
                sid = item != null ? MageItems.getUgwId(item) : null;
            }
            if (!ugwId.equals(sid)) {
                continue;
            }
            if (keepSlot) {
                keepSlot = false;
            } else {
                gear.slots.set(i, null);
                gearChanged = true;
                removed++;
            }
        }
        if (gearChanged) {
            savePlayerGear(uuid, gear);
            invalidateCache(uuid);
        }

        // 背包去重：同 uid 只保留一件
        Inventory inv = player.getInventory();
        boolean keepItem = false;
        for (int s = 0; s < inv.getSize(); s++) {
            ItemStack item = inv.getItem(s);
            if (item == null || item.getType() == Material.AIR) {
                continue;
            }
            if (!ugwId.equals(MageItems.getUgwId(item))) {
                continue;
            }
            if (keepItem) {
                keepItem = true;
                continue;
            }
            inv.setItem(s, null);
            removed++;
        }
        return removed;
    }

    // -------------------------------------------------------------------------
    // Attributes
    // -------------------------------------------------------------------------

    public void applyMageAttributes(Player player) {
        if (player == null || !player.isOnline()) {
            return;
        }
        MageStats stats = getTotalStats(player);
        addMod(player, Attribute.GENERIC_ATTACK_DAMAGE, MOD_MELEE, "gltc_mage_melee", stats.meleeDamage);
        AttributeInstance hpInst = addMod(player, Attribute.GENERIC_MAX_HEALTH, MOD_HP, "gltc_mage_hp", stats.maxHealth);
        if (hpInst != null) {
            try {
                if (player.getHealth() > hpInst.getValue()) {
                    player.setHealth(hpInst.getValue());
                }
            } catch (Throwable ignored) {
            }
        }
        addMod(player, Attribute.GENERIC_ARMOR, MOD_ARMOR, "gltc_mage_armor", stats.armor);
        addMod(player, Attribute.GENERIC_ARMOR_TOUGHNESS, MOD_TOUGH, "gltc_mage_tough", stats.toughness);
        addMod(player, Attribute.GENERIC_MOVEMENT_SPEED, MOD_SPEED, "gltc_mage_speed", stats.speed);
        addMod(player, Attribute.PLAYER_ENTITY_INTERACTION_RANGE, MOD_REACH, "gltc_mage_reach", stats.reach);
    }

    @Nullable
    private AttributeInstance addMod(Player player, @Nullable Attribute attr, UUID uuid, String name, double amount) {
        if (attr == null) {
            return null;
        }
        AttributeInstance inst = player.getAttribute(attr);
        if (inst == null) {
            return null;
        }
        clearMod(inst, uuid, name);
        if (amount == 0 || !Double.isFinite(amount)) {
            return inst;
        }
        try {
            NamespacedKey key = new NamespacedKey("gltc", name);
            inst.addModifier(new AttributeModifier(key, amount, AttributeModifier.Operation.ADD_NUMBER, EquipmentSlotGroup.ANY));
        } catch (Throwable t) {
            try {
                inst.addModifier(new AttributeModifier(uuid, name, amount, AttributeModifier.Operation.ADD_NUMBER));
            } catch (Throwable ignored) {
            }
        }
        return inst;
    }

    private static void clearMod(AttributeInstance inst, UUID uuid, String name) {
        try {
            for (AttributeModifier mod : inst.getModifiers()) {
                try {
                    if (mod.getUniqueId().equals(uuid)) {
                        inst.removeModifier(mod);
                        continue;
                    }
                } catch (Throwable ignored) {
                }
                try {
                    if (name.equals(mod.getName()) || (mod.getKey() != null && name.equals(mod.getKey().getKey()))) {
                        inst.removeModifier(mod);
                    }
                } catch (Throwable ignored) {
                }
            }
        } catch (Throwable ignored) {
        }
    }

    // -------------------------------------------------------------------------
    // IO
    // -------------------------------------------------------------------------

    @Nullable
    private MageStats readStatsFile(UUID uuid) {
        Path file = GltcDataPaths.mageStatsFile(plugin, uuid);
        if (!Files.isRegularFile(file)) {
            return null;
        }
        try {
            String text = Files.readString(file, StandardCharsets.UTF_8);
            MageStats s = MageStats.defaults();
            s.mageLevel = readInt(text, "mageLevel", 0);
            s.proficiency = readInt(text, "proficiency", 0);
            s.magePotential = readInt(text, "magePotential", 0);
            s.bodyPotential = readInt(text, "bodyPotential", 0);
            for (String sk : MagePointDefs.ALL_STAT_KEYS) {
                s.setStat(sk, readDbl(text, sk, s.getStat(sk)));
                s.setSpent(sk, readInt(text, sk + "Spent", 0));
            }
            return s;
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC术士] 读取属性失败 uuid=" + uuid, ex);
            return null;
        }
    }

    private boolean writeStatsFile(UUID uuid, MageStats data) {
        Path file = GltcDataPaths.mageStatsFile(plugin, uuid);
        try {
            Files.createDirectories(file.getParent());
            StringBuilder sb = new StringBuilder(512);
            sb.append("{\n");
            appendInt(sb, "mageLevel", data.mageLevel, false);
            appendInt(sb, "proficiency", data.proficiency, true);
            appendInt(sb, "magePotential", data.magePotential, true);
            appendInt(sb, "bodyPotential", data.bodyPotential, true);
            for (String sk : MagePointDefs.ALL_STAT_KEYS) {
                appendDbl(sb, sk, data.getStat(sk), true);
                appendInt(sb, sk + "Spent", data.getSpent(sk), true);
                Double tot = data.totals.get(sk);
                if (tot != null) {
                    appendDbl(sb, sk + "Total", tot, true);
                }
            }
            sb.append("\n}\n");
            Path tmp = file.resolveSibling(file.getFileName() + ".tmp");
            Files.writeString(tmp, sb.toString(), StandardCharsets.UTF_8);
            try {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException e) {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
            }
            return true;
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC术士] 保存属性失败 uuid=" + uuid, ex);
            return false;
        }
    }

    private MageGear readGearFile(UUID uuid) {
        int need = MageEquipSlots.slotCount();
        MageGear gear = new MageGear(need);
        Path file = GltcDataPaths.mageEquipFile(plugin, uuid);
        if (!Files.isRegularFile(file)) {
            return gear;
        }
        try {
            String text = Files.readString(file, StandardCharsets.UTF_8);
            int idxSlots = text.indexOf("\"slots\"");
            if (idxSlots < 0) {
                return gear;
            }
            int arrStart = text.indexOf('[', idxSlots);
            int arrEnd = text.indexOf(']', arrStart);
            if (arrStart < 0 || arrEnd < 0) {
                return gear;
            }
            String arr = text.substring(arrStart + 1, arrEnd);
            java.util.List<MageGear.Slot> parsed = new java.util.ArrayList<>();
            Matcher m = SLOT_OBJ.matcher(arr);
            int last = 0;
            while (m.find()) {
                // fill nulls between objects if any bare nulls — approximate by count
                String between = arr.substring(last, m.start());
                int nulls = countNullTokens(between);
                for (int n = 0; n < nulls; n++) {
                    parsed.add(null);
                }
                String ugw = m.group(1).equals("null") ? null : m.group(2);
                String sf = m.group(3).equals("null") ? null : m.group(4);
                String item = m.group(5).equals("null") ? null : m.group(6);
                parsed.add(new MageGear.Slot(ugw, sf, item));
                last = m.end();
            }
            String tail = arr.substring(last);
            int trailingNulls = countNullTokens(tail);
            for (int n = 0; n < trailingNulls; n++) {
                parsed.add(null);
            }
            // If no objects found, try legacy string slots
            if (parsed.isEmpty()) {
                Matcher sm = SLOT_STR.matcher(arr);
                while (sm.find()) {
                    parsed.add(new MageGear.Slot(null, null, sm.group(1)));
                }
            }
            for (int i = 0; i < need; i++) {
                gear.slots.set(i, i < parsed.size() ? parsed.get(i) : null);
            }
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC术士] 读取装备失败 uuid=" + uuid, ex);
        }
        return gear;
    }

    private boolean writeGearFile(UUID uuid, MageGear data) {
        Path file = GltcDataPaths.mageEquipFile(plugin, uuid);
        try {
            Files.createDirectories(file.getParent());
            StringBuilder sb = new StringBuilder(256);
            sb.append("{\n  \"slots\": [\n");
            for (int i = 0; i < data.slots.size(); i++) {
                MageGear.Slot s = data.slots.get(i);
                sb.append("    ");
                if (s == null) {
                    sb.append("null");
                } else {
                    sb.append("{");
                    sb.append("\"ugwId\": ").append(jsonStrOrNull(s.ugwId())).append(", ");
                    sb.append("\"sfId\": ").append(jsonStrOrNull(s.sfId())).append(", ");
                    sb.append("\"item\": ").append(jsonStrOrNull(s.item()));
                    sb.append("}");
                }
                if (i + 1 < data.slots.size()) {
                    sb.append(",");
                }
                sb.append("\n");
            }
            sb.append("  ]\n}\n");
            Path tmp = file.resolveSibling(file.getFileName() + ".tmp");
            Files.writeString(tmp, sb.toString(), StandardCharsets.UTF_8);
            try {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException e) {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
            }
            return true;
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC术士] 保存装备失败 uuid=" + uuid, ex);
            return false;
        }
    }

    private static int countNullTokens(String between) {
        int c = 0;
        Matcher nm = Pattern.compile("\\bnull\\b").matcher(between);
        while (nm.find()) {
            c++;
        }
        return c;
    }

    private static String jsonStrOrNull(@Nullable String v) {
        if (v == null) {
            return "null";
        }
        return "\"" + v.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static void appendInt(StringBuilder sb, String key, int v, boolean comma) {
        if (comma) {
            sb.append(",\n");
        }
        sb.append("  \"").append(key).append("\": ").append(v);
    }

    private static void appendDbl(StringBuilder sb, String key, double v, boolean comma) {
        if (comma) {
            sb.append(",\n");
        }
        sb.append("  \"").append(key).append("\": ").append(trimNum(v));
    }

    private static String trimNum(double v) {
        if (Math.abs(v - Math.rint(v)) < 1e-9) {
            return String.valueOf((long) Math.rint(v));
        }
        return String.valueOf(v);
    }

    private static int readInt(String text, String key, int def) {
        Matcher m = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?[0-9]+)").matcher(text);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return def;
    }

    private static double readDbl(String text, String key, double def) {
        Matcher m = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)").matcher(text);
        if (m.find()) {
            try {
                return Double.parseDouble(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return def;
    }

    // -------------------------------------------------------------------------
    // Result types
    // -------------------------------------------------------------------------

    public record SpendResult(boolean ok, String msg, int left) {
        static SpendResult ok(String msg, int left) {
            return new SpendResult(true, msg, left);
        }

        static SpendResult fail(String msg) {
            return new SpendResult(false, msg, 0);
        }
    }

    public record ResetResult(boolean ok, String msg, int mage, int body, int mageLeft, int bodyLeft) {
        static ResetResult ok(int mage, int body, int mageLeft, int bodyLeft) {
            return new ResetResult(true, "", mage, body, mageLeft, bodyLeft);
        }

        static ResetResult fail(String msg) {
            return new ResetResult(false, msg, 0, 0, 0, 0);
        }
    }

    public record AdminResetResult(boolean ok, int returned, int level) {
    }

    public record OwnerCheck(boolean valid, String msg) {
        static OwnerCheck ok() {
            return new OwnerCheck(true, "");
        }

        static OwnerCheck fail(String msg) {
            return new OwnerCheck(false, msg);
        }
    }
}
