package com.linkany121.gltc.logic.prop;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.event.ClickEvent;
import net.kyori.adventure.text.event.HoverEvent;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Registry;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.Event;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryCloseEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.persistence.PersistentDataType;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@code ATO_音效库} — browse / preview all vanilla sounds (excludes music).
 */
public final class AtoSoundBrowserLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "ATO_音效库";

    // ===== 配置区（音效浏览器 GUI，改完需重新打包 jar 并重启生效）=====
    private static final String TITLE_PREFIX = "§8ATO音效库 ";  // 面板标题前缀（分页标题 = 前缀 + 页数）
    private static final int PAGE_SIZE = 45;         // 每页展示音效数量
    private static final int PREV_SLOT = 52;         // 上一页按钮位置（54 格面板）
    private static final int NEXT_SLOT = 53;         // 下一页按钮位置
    private static final int PITCH_UP_SLOT = 50;     // 音调升高按钮位置
    private static final int PITCH_DOWN_SLOT = 51;   // 音调降低按钮位置
    private static final float PITCH_MIN = 0.5f;     // 可调音调下限
    private static final float PITCH_MAX = 2.0f;     // 可调音调上限
    private static final float PITCH_STEP = 0.1f;    // 每次点按音调增减步长
    private static final NamespacedKey SOUND_KEY = new NamespacedKey("gltc", "sound_browser_id");

    private final Set<UUID> openPlayers = ConcurrentHashMap.newKeySet();
    private final Map<UUID, Integer> pageMap = new ConcurrentHashMap<>();
    private final Map<UUID, Float> pitchMap = new ConcurrentHashMap<>();
    private final Set<UUID> pageSwitching = ConcurrentHashMap.newKeySet();

    private volatile List<SoundEntry> soundCache;
    private GltcPlugin plugin;
    private final Map<UUID, Long> lastOpenMs = new ConcurrentHashMap<>();

    public void register(GltcPlugin plugin) {
        this.plugin = plugin;
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        openPlayers.clear();
        pageMap.clear();
        pitchMap.clear();
        pageSwitching.clear();
        lastOpenMs.clear();
        soundCache = null;
        plugin = null;
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        openFor(event.getPlayer());
        return true;
    }

    @Override
    public void onPlace(BlockPlaceEvent event) {
        event.setCancelled(true);
        openFor(event.getPlayer());
    }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = false)
    public void onInteract(PlayerInteractEvent event) {
        Action action = event.getAction();
        if (action != Action.RIGHT_CLICK_AIR && action != Action.RIGHT_CLICK_BLOCK) {
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
        event.setCancelled(true);
        event.setUseItemInHand(Event.Result.DENY);
        event.setUseInteractedBlock(Event.Result.DENY);
        openFor(event.getPlayer());
    }

    private void openFor(Player player) {
        long now = System.currentTimeMillis();
        Long prev = lastOpenMs.put(player.getUniqueId(), now);
        if (prev != null && now - prev < 250L) {
            return;
        }
        try {
            openMain(player);
        } catch (Throwable t) {
            player.sendMessage("§c无法打开音效库: " + t.getMessage());
            GltcPlugin pl = plugin != null ? plugin : GltcPlugin.getInstance();
            if (pl != null) {
                pl.getLogger().warning("[ATO音效库] 打开失败: " + t);
            }
        }
    }

    private void openMain(Player player) {
        loadAllSounds();
        pageMap.put(player.getUniqueId(), 0);
        pitchMap.putIfAbsent(player.getUniqueId(), 1.0f);
        openMenu(player, buildMenu(player, 0));
    }

    private void openMenu(Player player, Inventory inv) {
        UUID id = player.getUniqueId();
        pageSwitching.add(id);
        player.openInventory(inv);
        pageSwitching.remove(id);
        openPlayers.add(id);
    }

    private void reopen(Player player) {
        int page = pageMap.getOrDefault(player.getUniqueId(), 0);
        openMenu(player, buildMenu(player, page));
    }

    private Inventory buildMenu(Player player, int page) {
        List<SoundEntry> sounds = loadAllSounds();
        int totalPages = Math.max(1, (int) Math.ceil(sounds.size() / (double) PAGE_SIZE));
        if (page < 0) {
            page = 0;
        }
        if (page >= totalPages) {
            page = totalPages - 1;
        }
        float pitch = getPitch(player);
        GuiHolder holder = new GuiHolder();
        Inventory inv = Bukkit.createInventory(holder, 54, makeTitle(page, totalPages, pitch));
        holder.inventory = inv;

        int start = page * PAGE_SIZE;
        int end = Math.min(start + PAGE_SIZE, sounds.size());
        for (int i = start; i < end; i++) {
            inv.setItem(i - start, buildSoundItem(sounds.get(i)));
        }

        ItemStack black = pane("BLACK_STAINED_GLASS_PANE", "§8 ", List.of(
            "§7共 §f" + sounds.size() + " §7个音效",
            "§7当前页 §f" + (page + 1) + "/" + totalPages,
            "§7当前音调 §b" + formatPitch(pitch)
        ));
        for (int s = 45; s <= 49; s++) {
            inv.setItem(s, black.clone());
        }

        inv.setItem(PITCH_UP_SLOT, pane("LIGHT_BLUE_STAINED_GLASS_PANE", "§b⬆ 调高音调", List.of(
            "§7当前: §b" + formatPitch(pitch),
            "§7范围: §f" + PITCH_MIN + " ~ " + PITCH_MAX,
            "§7步进: §f+" + PITCH_STEP
        )));
        inv.setItem(PITCH_DOWN_SLOT, pane("PURPLE_STAINED_GLASS_PANE", "§d⬇ 调低音调", List.of(
            "§7当前: §b" + formatPitch(pitch),
            "§7范围: §f" + PITCH_MIN + " ~ " + PITCH_MAX,
            "§7步进: §f-" + PITCH_STEP
        )));
        inv.setItem(PREV_SLOT, pane("LIME_STAINED_GLASS_PANE", "§a← 上一页", List.of(
            page > 0 ? "§7前往第 §f" + page + " §7页" : "§8已是第一页"
        )));
        inv.setItem(NEXT_SLOT, pane("LIME_STAINED_GLASS_PANE", "§a下一页 →", List.of(
            page < totalPages - 1 ? "§7前往第 §f" + (page + 2) + " §7页" : "§8已是最后一页"
        )));

        return inv;
    }

    private ItemStack buildSoundItem(SoundEntry entry) {
        SourceInfo src = getSourceInfo(entry.id);
        ZhInfo zh = getChineseInfo(entry.id);
        Material mat = guessMaterial(entry.id);
        ItemStack it = new ItemStack(mat);
        ItemMeta meta = it.getItemMeta();
        if (meta != null) {
            meta.setDisplayName("§e" + zh.name);
            meta.setLore(List.of(
                "§7" + zh.desc,
                "§7来源: §b" + src.label,
                "§7ID: §f" + entry.id,
                "",
                "§a左键 §7播放此音效",
                "§d右键 §7复制 ID 到剪贴板"
            ));
            meta.getPersistentDataContainer().set(SOUND_KEY, PersistentDataType.STRING, entry.id);
            it.setItemMeta(meta);
        }
        return it;
    }

    @EventHandler(priority = EventPriority.NORMAL, ignoreCancelled = false)
    public void onClick(InventoryClickEvent e) {
        if (!(e.getWhoClicked() instanceof Player p)) {
            return;
        }
        if (!openPlayers.contains(p.getUniqueId())) {
            return;
        }
        if (!isOurGui(e.getView().getTopInventory())) {
            return;
        }
        Inventory topInv = e.getView().getTopInventory();
        Inventory clickedInv = e.getClickedInventory();
        if (clickedInv != topInv) {
            if (clickedInv == e.getView().getBottomInventory() && e.isShiftClick()) {
                e.setCancelled(true);
            }
            return;
        }
        e.setCancelled(true);
        int slot = e.getSlot();
        ItemStack cur = e.getCurrentItem();
        if (cur == null || cur.getType() == Material.AIR) {
            return;
        }

        UUID id = p.getUniqueId();
        if (slot == PREV_SLOT) {
            int page = pageMap.getOrDefault(id, 0);
            if (page > 0) {
                pageMap.put(id, page - 1);
                reopen(p);
            }
            return;
        }
        if (slot == NEXT_SLOT) {
            int page = pageMap.getOrDefault(id, 0);
            int total = Math.max(1, (int) Math.ceil(loadAllSounds().size() / (double) PAGE_SIZE));
            if (page < total - 1) {
                pageMap.put(id, page + 1);
                reopen(p);
            }
            return;
        }
        if (slot == PITCH_UP_SLOT) {
            setPitch(p, getPitch(p) + PITCH_STEP);
            reopen(p);
            return;
        }
        if (slot == PITCH_DOWN_SLOT) {
            setPitch(p, getPitch(p) - PITCH_STEP);
            reopen(p);
            return;
        }
        if (slot >= 45) {
            return;
        }

        String soundId = null;
        ItemMeta meta = cur.getItemMeta();
        if (meta != null) {
            soundId = meta.getPersistentDataContainer().get(SOUND_KEY, PersistentDataType.STRING);
        }
        if (soundId == null) {
            int page = pageMap.getOrDefault(id, 0);
            int idx = page * PAGE_SIZE + slot;
            List<SoundEntry> sounds = loadAllSounds();
            if (idx >= 0 && idx < sounds.size()) {
                soundId = sounds.get(idx).id;
            }
        }
        if (soundId == null) {
            return;
        }

        SoundEntry entry = findEntryById(soundId);
        if (entry == null) {
            entry = new SoundEntry(null, soundId);
        }

        if (e.isRightClick()) {
            copySoundId(p, soundId);
            return;
        }
        if (e.isLeftClick()) {
            playEntry(p, entry);
        }
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onClose(InventoryCloseEvent e) {
        if (!(e.getPlayer() instanceof Player p)) {
            return;
        }
        UUID id = p.getUniqueId();
        if (pageSwitching.contains(id)) {
            return;
        }
        openPlayers.remove(id);
        pageMap.remove(id);
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onDrag(InventoryDragEvent e) {
        if (!(e.getWhoClicked() instanceof Player p)) {
            return;
        }
        if (!openPlayers.contains(p.getUniqueId())) {
            return;
        }
        if (!isOurGui(e.getView().getTopInventory())) {
            return;
        }
        int topSize = e.getView().getTopInventory().getSize();
        for (int raw : e.getRawSlots()) {
            if (raw < topSize) {
                e.setCancelled(true);
                return;
            }
        }
    }

    private void playEntry(Player player, SoundEntry entry) {
        float pitch = getPitch(player);
        boolean ok = false;
        if (entry.sound != null) {
            try {
                player.playSound(player.getLocation(), entry.sound, 1.0f, pitch);
                ok = true;
            } catch (Throwable ignored) {
            }
        }
        if (!ok) {
            try {
                player.playSound(player.getLocation(), entry.id, 1.0f, pitch);
                ok = true;
            } catch (Throwable ignored) {
            }
        }
        if (!ok) {
            player.sendMessage("§c无法播放: §f" + entry.id);
            return;
        }
        try {
            player.sendActionBar(Component.text(
                "♪ " + entry.id + "  音调" + formatPitch(pitch), NamedTextColor.AQUA));
        } catch (Throwable t) {
            player.sendMessage("§b♪ §f" + entry.id + " §7音调 §b" + formatPitch(pitch));
        }
    }

    private void copySoundId(Player player, String soundId) {
        try {
            Component msg = Component.text("[ATO音效库] ", NamedTextColor.GOLD)
                .append(Component.text("点击复制 ID: ", NamedTextColor.GRAY))
                .append(
                    Component.text(soundId, NamedTextColor.AQUA)
                        .clickEvent(ClickEvent.copyToClipboard(soundId))
                        .hoverEvent(HoverEvent.showText(
                            Component.text("点击复制到系统剪贴板", NamedTextColor.YELLOW)))
                );
            player.sendMessage(msg);
            player.sendMessage("§a已发送可复制消息，点击聊天栏中的 ID 即可复制。");
        } catch (Throwable t) {
            player.sendMessage("§6[ATO音效库] §7音效 ID: §b" + soundId);
        }
    }

    private List<SoundEntry> loadAllSounds() {
        List<SoundEntry> cached = soundCache;
        if (cached != null) {
            return cached;
        }
        List<SoundEntry> list = new ArrayList<>();
        try {
            for (Sound s : Registry.SOUNDS) {
                addSound(list, s);
            }
        } catch (Throwable ignored) {
        }
        if (list.isEmpty()) {
            try {
                Object raw = Sound.class.getMethod("values").invoke(null);
                if (raw instanceof Object[] arr) {
                    for (Object o : arr) {
                        if (o instanceof Sound s) {
                            addSound(list, s);
                        }
                    }
                }
            } catch (Throwable ignored) {
            }
        }
        list.sort(Comparator.comparing(e -> e.id));
        soundCache = list;
        return list;
    }

    private static void addSound(List<SoundEntry> list, Sound s) {
        String id = getSoundId(s);
        if (isMusicSound(id)) {
            return;
        }
        list.add(new SoundEntry(s, id));
    }

    @Nullable
    private SoundEntry findEntryById(String id) {
        for (SoundEntry e : loadAllSounds()) {
            if (e.id.equals(id)) {
                return e;
            }
        }
        return null;
    }

    private float getPitch(Player player) {
        return pitchMap.getOrDefault(player.getUniqueId(), 1.0f);
    }

    private float setPitch(Player player, float pitch) {
        pitch = Math.round(pitch * 10f) / 10f;
        if (pitch < PITCH_MIN) {
            pitch = PITCH_MIN;
        }
        if (pitch > PITCH_MAX) {
            pitch = PITCH_MAX;
        }
        pitchMap.put(player.getUniqueId(), pitch);
        return pitch;
    }

    private static String formatPitch(float pitch) {
        return String.format(Locale.ROOT, "%.1f", Math.round(pitch * 10f) / 10f);
    }

    private static String makeTitle(int page, int totalPages, float pitch) {
        return TITLE_PREFIX + "§7" + (page + 1) + "/" + totalPages + " §b音调" + formatPitch(pitch);
    }

    private static boolean isOurGui(Inventory inventory) {
        if (inventory == null) {
            return false;
        }
        InventoryHolder holder = inventory.getHolder();
        return holder instanceof GuiHolder;
    }

    private static final class GuiHolder implements InventoryHolder {
        private Inventory inventory;

        @Override
        public Inventory getInventory() {
            return inventory;
        }
    }

    private static ItemStack pane(String matName, String name, List<String> lore) {
        Material mat = Material.matchMaterial(matName);
        if (mat == null || !mat.isItem()) {
            mat = Material.NOTE_BLOCK;
        }
        ItemStack it = new ItemStack(mat);
        ItemMeta meta = it.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(name);
            meta.setLore(lore);
            it.setItemMeta(meta);
        }
        return it;
    }

    private static String getSoundId(Sound sound) {
        try {
            return sound.getKey().toString();
        } catch (Throwable t) {
            try {
                return "minecraft:" + sound.name().toLowerCase(Locale.ROOT).replace('_', '.');
            } catch (Throwable t2) {
                return String.valueOf(sound);
            }
        }
    }

    private static String getSoundPath(String soundId) {
        String id = soundId == null ? "" : soundId;
        int colon = id.indexOf(':');
        if (colon >= 0) {
            id = id.substring(colon + 1);
        }
        return id;
    }

    private static boolean isMusicSound(String soundId) {
        String path = getSoundPath(soundId).toLowerCase(Locale.ROOT);
        if (path.startsWith("music.")) {
            return true;
        }
        if (path.startsWith("music_disc.")) {
            return true;
        }
        if (path.startsWith("record.")) {
            return true;
        }
        return path.contains(".music_disc.");
    }

    private static SourceInfo getSourceInfo(String soundId) {
        String path = getSoundPath(soundId);
        String[] parts = path.split("\\.");
        String root = parts.length > 0 ? parts[0] : "unknown";
        String label = AtoSoundBrowserZh.SOURCE_NAMES.getOrDefault(root, "其他 " + root);
        return new SourceInfo(root, label, path);
    }

    private static String zhToken(String token) {
        if (token == null || token.isEmpty()) {
            return "";
        }
        String t = token.toLowerCase(Locale.ROOT);
        if (AtoSoundBrowserZh.ZH_WORD.containsKey(t)) {
            return AtoSoundBrowserZh.ZH_WORD.get(t);
        }
        if (AtoSoundBrowserZh.ZH_ACTION_NAME.containsKey(t)) {
            return AtoSoundBrowserZh.ZH_ACTION_NAME.get(t);
        }
        String[] bits = t.split("_");
        if (bits.length > 1) {
            StringBuilder out = new StringBuilder();
            for (String bit : bits) {
                String w = AtoSoundBrowserZh.ZH_WORD.get(bit);
                if (w == null) {
                    w = AtoSoundBrowserZh.ZH_ACTION_NAME.get(bit);
                }
                out.append(w != null ? w : bit);
            }
            return out.toString();
        }
        return t;
    }

    private static ZhInfo getChineseInfo(String soundId) {
        String path = getSoundPath(soundId);
        String[] parts = path.split("\\.");
        String root = parts.length > 0 ? parts[0] : "";
        String subject = "";
        String action = "";

        if (parts.length >= 3) {
            StringBuilder mid = new StringBuilder();
            for (int i = 1; i < parts.length - 1; i++) {
                mid.append(zhToken(parts[i]));
            }
            subject = mid.toString();
            action = parts[parts.length - 1];
        } else if (parts.length == 2) {
            subject = zhToken(parts[1]);
        }

        String actionName = action.isEmpty()
            ? ""
            : AtoSoundBrowserZh.ZH_ACTION_NAME.getOrDefault(action, zhToken(action));

        String name;
        if (!subject.isEmpty() && !actionName.isEmpty()) {
            name = subject + "：" + actionName;
        } else if (!subject.isEmpty()) {
            String srcLabel = AtoSoundBrowserZh.SOURCE_NAMES.get(root);
            String prefix = srcLabel != null ? srcLabel.split(" ")[0] + "：" : "";
            name = prefix + subject;
        } else {
            String zt = zhToken(root);
            name = !zt.isEmpty() ? zt : path;
        }

        String desc;
        if (!subject.isEmpty() && !action.isEmpty() && AtoSoundBrowserZh.ZH_ACTION_DESC.containsKey(action)) {
            desc = subject + AtoSoundBrowserZh.ZH_ACTION_DESC.get(action) + "的音效";
        } else if (!subject.isEmpty() && !actionName.isEmpty()) {
            desc = subject + "「" + actionName + "」相关的音效";
        } else if (!subject.isEmpty()) {
            String srcLabel = AtoSoundBrowserZh.SOURCE_NAMES.get(root);
            String cat = srcLabel != null ? srcLabel.split(" ")[0] : "游戏";
            desc = cat + "「" + subject + "」相关的音效";
        } else {
            String srcLabel = AtoSoundBrowserZh.SOURCE_NAMES.get(root);
            String cat = srcLabel != null ? srcLabel.split(" ")[0] : "游戏";
            desc = cat + "分类下的音效";
        }

        if (name.length() > 30) {
            name = name.substring(0, 28) + "…";
        }
        return new ZhInfo(name, desc);
    }

    @Nullable
    private static Material resolveMat(String name) {
        if (name == null || name.isEmpty()) {
            return null;
        }
        try {
            Material m = Material.matchMaterial(name);
            if (m != null && m.isItem() && m != Material.AIR) {
                return m;
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    private static Material guessMaterial(String soundId) {
        String path = getSoundPath(soundId);
        String[] parts = path.split("\\.");
        String root = parts.length > 0 ? parts[0] : "";
        String second = parts.length > 1 ? parts[1] : "";
        Material mat;

        if (path.contains("note_block")) {
            return Material.NOTE_BLOCK;
        }
        if (path.contains("music_disc") || "record".equals(root) || second.contains("disc")) {
            mat = resolveMat("MUSIC_DISC_CAT");
            if (mat != null) {
                return mat;
            }
        }
        if ("ui".equals(root)) {
            mat = resolveMat("COMPASS");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }
        if ("weather".equals(root)) {
            mat = resolveMat("WATER_BUCKET");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }
        if ("ambient".equals(root)) {
            mat = resolveMat("GRASS_BLOCK");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }
        if ("enchant".equals(root)) {
            mat = resolveMat("ENCHANTING_TABLE");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }
        if ("particle".equals(root)) {
            mat = resolveMat("BLAZE_POWDER");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }
        if ("event".equals(root)) {
            mat = resolveMat("BELL");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }
        if ("music".equals(root)) {
            mat = resolveMat("JUKEBOX");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }

        if ("entity".equals(root)) {
            String icon = AtoSoundBrowserZh.ENTITY_ICON.get(second);
            if (icon != null) {
                mat = resolveMat(icon);
                if (mat != null) {
                    return mat;
                }
            }
            mat = resolveMat(second.toUpperCase(Locale.ROOT) + "_SPAWN_EGG");
            if (mat != null) {
                return mat;
            }
            mat = resolveMat(second.toUpperCase(Locale.ROOT));
            if (mat != null) {
                return mat;
            }
            mat = resolveMat("EGG");
            return mat != null ? mat : Material.NOTE_BLOCK;
        }

        if ("block".equals(root)) {
            String blockName = second.toUpperCase(Locale.ROOT);
            mat = resolveMat(blockName);
            if (mat != null) {
                return mat;
            }
            mat = resolveMat(blockName + "_BLOCK");
            if (mat != null) {
                return mat;
            }
            return switch (second) {
                case "water" -> orNote(resolveMat("WATER_BUCKET"));
                case "lava" -> orNote(resolveMat("LAVA_BUCKET"));
                case "fire", "campfire" -> orNote(resolveMat("CAMPFIRE"));
                case "portal", "end_portal" -> orNote(resolveMat("END_PORTAL_FRAME"));
                case "nether_portal" -> orNote(resolveMat("OBSIDIAN"));
                case "crop", "sweet_berry_bush" -> orNote(resolveMat("WHEAT"));
                case "wool" -> orNote(resolveMat("WHITE_WOOL"));
                case "metal" -> orNote(resolveMat("IRON_BLOCK"));
                case "wood", "wood_hanging_sign" -> orNote(resolveMat("OAK_PLANKS"));
                case "glass", "glass_pane" -> orNote(resolveMat("GLASS"));
                case "anvil" -> orNote(resolveMat("ANVIL"));
                case "chest" -> orNote(resolveMat("CHEST"));
                case "beacon" -> orNote(resolveMat("BEACON"));
                default -> orNote(resolveMat("STONE"));
            };
        }

        if ("item".equals(root)) {
            mat = resolveMat(second.toUpperCase(Locale.ROOT));
            if (mat != null) {
                return mat;
            }
            return switch (second) {
                case "armor" -> orNote(resolveMat("IRON_CHESTPLATE"));
                case "axe" -> orNote(resolveMat("IRON_AXE"));
                case "bottle" -> orNote(resolveMat("GLASS_BOTTLE"));
                case "book" -> orNote(resolveMat("BOOK"));
                case "bucket" -> orNote(resolveMat("BUCKET"));
                case "crossbow" -> orNote(resolveMat("CROSSBOW"));
                case "elytra" -> orNote(resolveMat("ELYTRA"));
                case "firecharge" -> orNote(resolveMat("FIRE_CHARGE"));
                case "flintandsteel" -> orNote(resolveMat("FLINT_AND_STEEL"));
                case "hoe" -> orNote(resolveMat("IRON_HOE"));
                case "shield" -> orNote(resolveMat("SHIELD"));
                case "shovel" -> orNote(resolveMat("IRON_SHOVEL"));
                case "totem" -> orNote(resolveMat("TOTEM_OF_UNDYING"));
                case "trident" -> orNote(resolveMat("TRIDENT"));
                default -> orNote(resolveMat("STICK"));
            };
        }

        return Material.NOTE_BLOCK;
    }

    private static Material orNote(@Nullable Material mat) {
        return mat != null ? mat : Material.NOTE_BLOCK;
    }

    private record SoundEntry(@Nullable Sound sound, String id) {
    }

    private record SourceInfo(String root, String label, String path) {
    }

    private record ZhInfo(String name, String desc) {
    }
}
