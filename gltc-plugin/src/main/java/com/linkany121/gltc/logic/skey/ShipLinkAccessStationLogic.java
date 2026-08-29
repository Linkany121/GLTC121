package com.linkany121.gltc.logic.skey;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.logic.common.GltcMessages;
import com.linkany121.gltc.util.TextUtil;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import me.mrCookieSlime.Slimefun.api.BlockStorage;
import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.block.data.Directional;
import org.bukkit.entity.Display;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Interaction;
import org.bukkit.entity.Player;
import org.bukkit.entity.TextDisplay;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.player.PlayerInteractEntityEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.ItemStack;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.scheduler.BukkitTask;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_GOLD;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_I;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_TITLE;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_V;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.C_X;
import static com.linkany121.gltc.logic.skey.ShipOrderSupport.hex;

/** {@code skey_舰体链接协议访问站} — hologram trade panel (no chest GUI). */
public final class ShipLinkAccessStationLogic implements GltcMachineLogic, Listener {

    public static final String MACHINE_ID = "skey_舰体链接协议访问站";

    // ===== 配置区（舰体链接协议访问站，改完需重新打包 jar 并重启生效）=====
    private static final double HOLO_OFFSET_Y = 4.0;   // 全息交易面板相对机器的垂直偏移（格）
    private static final double HOLO_LINE_GAP = 0.3;   // 全息面板每行文字间距（格）
    private static final float HOLO_VIEW_RANGE = 32;   // 全息文字可见距离（格）
    private static final int PER_PAGE = 9;             // 每页展示交易数量
    private static final double TRADE_X_GAP = 3.0;     // 相邻交易展示柱的水平间距（格）
    private static final long COOLDOWN_MS = 200L;      // 交易点击防抖（毫秒）

    private static final NamespacedKey HOLO_KEY = new NamespacedKey("gltc", "shiplink_holo");
    private static final NamespacedKey TRADE_KEY = new NamespacedKey("gltc", "shiplink_trade");
    private static final NamespacedKey PAGE_KEY = new NamespacedKey("gltc", "shiplink_page");
    private static final NamespacedKey OWNER_KEY = new NamespacedKey("gltc", "shiplink_owner");
    private static final NamespacedKey COOLDOWN_KEY = new NamespacedKey("gltc", "shiplink_last_use");

    // 交易表：每项 Trade(键, 显示名, "SF:物品ID", 数量, 所需I货币, 所需V货币, 所需X货币, 主题色hex)。
    // 0 表示该项不收对应货币。要调价/加交易直接增删该列表即可。
    private static final List<Trade> TRADES = List.of(
        new Trade("perm1", "权限凭证1", "SF:skey_权限凭证1", 1, 36, 0, 0, "55ffef"),
        new Trade("perm2", "权限凭证2", "SF:skey_权限凭证2", 1, 0, 24, 0, "ff8f4d"),
        new Trade("perm3", "权限凭证3", "SF:skey_权限凭证3", 1, 0, 0, 24, "ff3d3d"),
        new Trade("perm1_x16", "权限凭证1", "SF:skey_权限凭证1", 16, 576, 0, 0, "55ffef"),
        new Trade("perm2_x16", "权限凭证2", "SF:skey_权限凭证2", 16, 0, 384, 0, "ff8f4d"),
        new Trade("perm3_x16", "权限凭证3", "SF:skey_权限凭证3", 16, 0, 0, 384, "ff3d3d")
    );

    private final Map<String, PanelState> playerPanels = new ConcurrentHashMap<>();
    private GltcPlugin plugin;

    public void register(GltcPlugin plugin) {
        this.plugin = plugin;
        Bukkit.getPluginManager().registerEvents(this, plugin);
        Bukkit.getScheduler().runTask(plugin, this::removeAllHolograms);
    }

    public void unregister() {
        removeAllHolograms();
        HandlerList.unregisterAll(this);
        playerPanels.clear();
        plugin = null;
    }

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        if (!checkCooldown(player)) {
            return true;
        }
        Block block = getClickedBlock(event);
        if (block == null) {
            player.sendMessage(GltcMessages.prefixed("§c未获取到点击方块"));
            return true;
        }
        Location loc = block.getLocation();
        if (!isOurMachine(loc)) {
            player.sendMessage(GltcMessages.prefixed(
                "§c不是本机器: " + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ()));
            return true;
        }
        try {
            String myUuid = player.getUniqueId().toString();
            String owner = getPanelOwner(loc);
            if (owner != null) {
                if (owner.equals(myUuid)) {
                    removeAllPanelEntities(loc);
                    cancelPanelTask(myUuid);
                    try {
                        player.playSound(loc.clone().add(0.5, 0.5, 0.5), Sound.BLOCK_BEACON_DEACTIVATE, 1.0f, 1.0f);
                    } catch (Throwable ignored) {
                    }
                    player.sendMessage(GltcMessages.prefixed("§7面板已关闭"));
                    return true;
                }
                String ownerName = Bukkit.getOfflinePlayer(UUID.fromString(owner)).getName();
                if (ownerName == null) {
                    ownerName = "未知玩家";
                }
                removeAllPanelEntities(loc);
                cancelPanelTask(owner);
                try {
                    player.playSound(loc.clone().add(0.5, 0.5, 0.5), Sound.BLOCK_BEACON_DEACTIVATE, 1.0f, 1.0f);
                } catch (Throwable ignored) {
                }
                player.sendMessage(GltcMessages.prefixed("§c此面板属于玩家 " + ownerName + "，已关闭，请重新打开自己的面板"));
            }
            showAccessPanel(loc, player, 0);
            try {
                player.playSound(loc.clone().add(0.5, 0.5, 0.5), Sound.BLOCK_BEACON_ACTIVATE, 1.0f, 1.0f);
            } catch (Throwable ignored) {
            }
            player.sendMessage(GltcMessages.prefixed("§a面板已打开"));
        } catch (Throwable t) {
            player.sendMessage(GltcMessages.prefixed("§c面板生成错误: " + t));
            if (plugin != null) {
                plugin.getLogger().warning("[舰体链接协议] 面板错误: " + t);
            }
        }
        return true;
    }

    @Override
    public void onBreak(BlockBreakEvent event, ItemStack item, List<ItemStack> drops) {
        cleanupBreak(event.getBlock().getLocation());
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onBlockBreak(BlockBreakEvent event) {
        Location loc = event.getBlock().getLocation();
        if (isOurMachine(loc) || hasPanel(loc)) {
            cleanupBreak(loc);
        }
    }

    private void cleanupBreak(Location loc) {
        String owner = getPanelOwner(loc);
        removeAllPanelEntities(loc);
        if (owner != null) {
            cancelPanelTask(owner);
            playerPanels.remove(owner);
        }
    }

    @EventHandler(priority = EventPriority.NORMAL)
    public void onEntityInteract(PlayerInteractEntityEvent event) {
        try {
            if (event.getHand() != null && event.getHand() != EquipmentSlot.HAND) {
                return;
            }
            Entity ent = resolvePanelInteractTarget(event.getRightClicked());
            if (ent == null) {
                return;
            }
            Player who = event.getPlayer();
            event.setCancelled(true);
            if (!checkCooldown(who)) {
                return;
            }
            var pdc = ent.getPersistentDataContainer();
            String ownerUuid = pdcGet(pdc, OWNER_KEY);
            if (ownerUuid != null) {
                String myUuid = who.getUniqueId().toString();
                if (!ownerUuid.equals(myUuid)) {
                    String ownerName = Bukkit.getOfflinePlayer(UUID.fromString(ownerUuid)).getName();
                    if (ownerName == null) {
                        ownerName = "未知玩家";
                    }
                    removeAllPanelEntities(ent.getLocation());
                    cancelPanelTask(ownerUuid);
                    who.sendMessage(GltcMessages.prefixed(
                        "§c此面板属于玩家 " + ownerName + "，已关闭，请右键机器重新打开自己的面板"));
                    return;
                }
            }

            String pageAction = pdcGet(pdc, PAGE_KEY);
            if (pageAction != null) {
                if (!"toggle".equals(pageAction)) {
                    return;
                }
                if (ownerUuid == null) {
                    ownerUuid = who.getUniqueId().toString();
                }
                String mKey = pdcGet(pdc, HOLO_KEY);
                Location mloc = parseMachineKey(mKey);
                if (mloc == null) {
                    return;
                }
                PanelState p = playerPanels.get(ownerUuid);
                int curPage = p != null ? p.page : 0;
                int totalPages = totalPages();
                int newPage = Math.floorMod(curPage + 1, totalPages);
                showAccessPanel(mloc, who, newPage);
                who.sendMessage(GltcMessages.prefixed("§a第 " + (newPage + 1) + "/" + totalPages + " 页"));
                return;
            }

            String tradeId = pdcGet(pdc, TRADE_KEY);
            if (tradeId != null) {
                Trade trade = findTrade(tradeId);
                if (trade == null) {
                    who.sendMessage(GltcMessages.prefixed("§c交易配置错误"));
                    return;
                }
                doTrade(who, trade);
            }
        } catch (Throwable t) {
            if (plugin != null) {
                plugin.getLogger().warning("[舰体链接协议] 点击错误: " + t);
            }
        }
    }

    private void showAccessPanel(Location loc, Player player, int page) {
        String ownerUuid = player.getUniqueId().toString();
        int totalPages = totalPages();
        int pg = Math.max(0, Math.min(page, totalPages - 1));

        removePlayerPanel(ownerUuid);
        removeHolograms(loc);

        World world = loc.getWorld();
        if (world == null) {
            return;
        }
        String key = machineKey(loc);
        ShipCurrencyService currency = ShipCurrencyService.get();
        ShipCurrencyService.Balance data = currency != null
            ? currency.get(player.getUniqueId())
            : ShipCurrencyService.Balance.ZERO;

        PanelState state = new PanelState(key, pg, null, new ArrayList<>());
        playerPanels.put(ownerUuid, state);

        Location base = loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5);
        double bx = base.getX();
        double bz = base.getZ();
        double y = base.getY();
        double titleY = y;

        double dirX = 0;
        double dirZ = -1;
        try {
            if (loc.getBlock().getBlockData() instanceof Directional directional) {
                BlockFace facing = directional.getFacing();
                switch (facing) {
                    case NORTH -> dirZ = -1;
                    case SOUTH -> dirZ = 1;
                    case EAST -> dirX = 1;
                    case WEST -> dirX = -1;
                    default -> dirZ = -1;
                }
            }
        } catch (Throwable ignored) {
        }
        double leftX = -dirZ;
        double leftZ = dirX;
        double rightX = dirZ;
        double rightZ = -dirX;

        spawnText(world, atY(base, y), C_TITLE + "§l✦ 舰体链接协议访问站 ✦", key, ownerUuid);
        y -= HOLO_LINE_GAP;
        spawnText(world, atY(base, y), C_GOLD + "欢迎您！工程师 " + player.getName(), key, ownerUuid);
        y -= HOLO_LINE_GAP;
        spawnText(world, atY(base, y), "  " + C_I + "◆ I等货币 " + C_GOLD + ": §f" + data.i, key, ownerUuid);
        y -= HOLO_LINE_GAP;
        spawnText(world, atY(base, y), "  " + C_V + "◆ V等货币 " + C_GOLD + ": §f" + data.v, key, ownerUuid);
        y -= HOLO_LINE_GAP;
        spawnText(world, atY(base, y), "  " + C_X + "◆ X等货币 " + C_GOLD + ": §f" + data.x, key, ownerUuid);
        y -= HOLO_LINE_GAP;
        spawnText(world, atY(base, y), "§8§m                      §r", key, ownerUuid);
        y -= HOLO_LINE_GAP;

        int startIdx = pg * PER_PAGE;
        int endIdx = Math.min(startIdx + PER_PAGE, TRADES.size());
        double rowY1 = y;
        double rowY2 = y - HOLO_LINE_GAP;
        double rowY3 = y - HOLO_LINE_GAP * 2;
        double[] rowYs = {rowY1, rowY2, rowY3};

        for (int i = startIdx; i < endIdx; i++) {
            Trade t = TRADES.get(i);
            String c = hex(t.color);
            int idxInPage = i - startIdx;
            int row = idxInPage / 3;
            int col = idxInPage % 3;
            double off = (col - 1) * TRADE_X_GAP;
            double x = bx + leftX * off;
            double z = bz + leftZ * off;
            double yy = rowYs[row];
            String line = c + "§l[ §f" + t.name + " §8x" + t.amount + " §r" + c + " ◆ " + costShort(t) + " " + c + "]";
            spawnText(world, new Location(world, x, yy, z), line, key, ownerUuid);
            spawnTradeHitbox(world, new Location(world, x, yy - 0.05, z), key, t.id, ownerUuid);
        }

        double bottomY = rowY3 - HOLO_LINE_GAP;
        double pageY = bottomY - HOLO_LINE_GAP;
        String pageText = "§8[ " + C_TITLE + "◀ §r§8| " + C_GOLD + "第 " + (pg + 1) + "/" + totalPages
            + " 页 §r§8| " + C_TITLE + "▶ §8]";
        spawnText(world, atY(base, pageY), pageText, key, ownerUuid);

        float hitboxW = (float) (1.6 + totalPages * 0.35);
        Interaction pih = world.spawn(new Location(world, bx, pageY - 0.05, bz), Interaction.class);
        pih.setInteractionWidth(hitboxW);
        pih.setInteractionHeight(0.35f);
        pih.setInvulnerable(true);
        var ppdc = pih.getPersistentDataContainer();
        ppdc.set(HOLO_KEY, PersistentDataType.STRING, key);
        ppdc.set(PAGE_KEY, PersistentDataType.STRING, "toggle");
        ppdc.set(OWNER_KEY, PersistentDataType.STRING, ownerUuid);
        trackEntity(ownerUuid, pih.getUniqueId());

        spawnText(world, atY(base, bottomY), "§8§o点击交易项兑换 · 点击下方页码条切换页面", key, ownerUuid);
        startParticleTask(world, loc, bx, bz, titleY, bottomY, pageY, ownerUuid, leftX, leftZ, rightX, rightZ);
    }

    private void doTrade(Player player, Trade trade) {
        ItemStack reward = buildReward(trade);
        if (reward == null) {
            player.sendMessage(GltcMessages.prefixed("§c兑换物品配置错误，请联系管理员。"));
            return;
        }
        ShipCurrencyService currency = ShipCurrencyService.get();
        if (currency == null) {
            player.sendMessage(GltcMessages.prefixed("§c舰体货币系统未加载。"));
            return;
        }
        UUID uuid = player.getUniqueId();
        ShipCurrencyService.Balance[] holder = new ShipCurrencyService.Balance[1];
        Boolean ok = currency.modify(uuid, d -> {
            if (d.i < trade.costI || d.v < trade.costV || d.x < trade.costX) {
                return Boolean.FALSE;
            }
            d.i -= trade.costI;
            d.v -= trade.costV;
            d.x -= trade.costX;
            holder[0] = d.copy();
            return Boolean.TRUE;
        });
        if (ok == null || !ok) {
            player.sendMessage(GltcMessages.prefixed("§c货币不足！需要 " + C_GOLD + costText(trade) + "§r§c。"));
            try {
                player.playSound(player.getLocation(), Sound.BLOCK_NOTE_BLOCK_BASS, 1.0f, 0.6f);
            } catch (Throwable ignored) {
            }
            return;
        }
        ShipOrderSupport.giveOrDrop(player, reward);
        try {
            player.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, player.getLocation(), 15, 0.4, 0.4, 0.4, 0.2);
        } catch (Throwable ignored) {
        }
        try {
            player.getWorld().playSound(player.getLocation(), Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 0.8f, 1.5f);
        } catch (Throwable ignored) {
        }

        PanelState p = playerPanels.get(uuid.toString());
        if (p != null) {
            Location mloc = parseMachineKey(p.key);
            if (mloc != null) {
                showAccessPanel(mloc, player, p.page);
            }
        }
        ShipCurrencyService.Balance data = holder[0] != null ? holder[0] : currency.get(uuid);
        player.sendMessage(GltcMessages.prefixed(
            "§a兑换成功！获得 §f" + trade.name + " x" + trade.amount
                + "§r" + C_GOLD + "，剩余 I等货币: §f" + data.i
                + C_GOLD + " V等货币: §f" + data.v
                + C_GOLD + " X等货币: §f" + data.x));
    }

    @Nullable
    private static ItemStack buildReward(Trade trade) {
        if (trade.material.startsWith("SF:")) {
            String id = trade.material.substring(3);
            SlimefunItem sf = ShipOrderSupport.getItemById(id);
            if (sf == null) {
                return null;
            }
            ItemStack it = sf.getItem().clone();
            it.setAmount(trade.amount);
            return it;
        }
        Material mat = Material.getMaterial(trade.material);
        if (mat == null) {
            return null;
        }
        return new ItemStack(mat, trade.amount);
    }

    private void spawnText(World world, Location loc, String text, String machineKey, String ownerUuid) {
        TextDisplay td = world.spawn(loc, TextDisplay.class);
        td.text(TextUtil.color(text));
        td.setAlignment(TextDisplay.TextAlignment.CENTER);
        td.setBillboard(Display.Billboard.CENTER);
        td.setBackgroundColor(Color.fromARGB(80, 0, 0, 0));
        td.setSeeThrough(false);
        td.setDefaultBackground(false);
        td.setViewRange(HOLO_VIEW_RANGE);
        td.setGravity(false);
        td.setInvulnerable(true);
        var pdc = td.getPersistentDataContainer();
        pdc.set(HOLO_KEY, PersistentDataType.STRING, machineKey);
        pdc.set(OWNER_KEY, PersistentDataType.STRING, ownerUuid);
        trackEntity(ownerUuid, td.getUniqueId());
    }

    private void spawnTradeHitbox(World world, Location loc, String machineKey, String tradeId, String ownerUuid) {
        Interaction ih = world.spawn(loc, Interaction.class);
        ih.setInteractionWidth(1.1f);
        ih.setInteractionHeight(0.3f);
        ih.setInvulnerable(true);
        var pdc = ih.getPersistentDataContainer();
        pdc.set(HOLO_KEY, PersistentDataType.STRING, machineKey);
        pdc.set(TRADE_KEY, PersistentDataType.STRING, tradeId);
        pdc.set(OWNER_KEY, PersistentDataType.STRING, ownerUuid);
        trackEntity(ownerUuid, ih.getUniqueId());
    }

    private void startParticleTask(
        World world, Location mloc, double bx, double bz,
        double titleY, double bottomY, double midY, String ownerUuid,
        double leftX, double leftZ, double rightX, double rightZ
    ) {
        if (plugin == null) {
            return;
        }
        String mKey = machineKey(mloc);
        BukkitTask[] self = new BukkitTask[1];
        self[0] = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            try {
                boolean alive = false;
                for (Entity ent : world.getNearbyEntities(mloc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5)) {
                    String h = pdcGet(ent.getPersistentDataContainer(), HOLO_KEY);
                    if (mKey.equals(h)) {
                        alive = true;
                        break;
                    }
                }
                if (!alive) {
                    if (self[0] != null) {
                        self[0].cancel();
                    }
                    return;
                }
                double ringY = mloc.getY() + 0.2;
                double cx = mloc.getX() + 0.5;
                double cz = mloc.getZ() + 0.5;
                for (int ri = 0; ri < 24; ri++) {
                    double ang = (2 * Math.PI * ri) / 24;
                    world.spawnParticle(Particle.GLOW,
                        new Location(world, cx + Math.cos(ang) * 1.2, ringY, cz + Math.sin(ang) * 1.2),
                        1, 0, 0, 0, 0);
                }
                world.spawnParticle(Particle.END_ROD,
                    new Location(world, bx + leftX * 1.6, titleY, bz + leftZ * 1.6), 1, 0, 0, 0, 0.02);
                world.spawnParticle(Particle.END_ROD,
                    new Location(world, bx + rightX * 1.6, titleY, bz + rightZ * 1.6), 1, 0, 0, 0, 0.02);
                world.spawnParticle(Particle.ENCHANT,
                    new Location(world, bx, bottomY, bz), 1, 0.9, 0.1, 0.9, 0.05);
                world.spawnParticle(Particle.SOUL_FIRE_FLAME,
                    new Location(world, bx + leftX * 1.2, midY, bz + leftZ * 1.2), 1, 0, 0, 0, 0.02);
                world.spawnParticle(Particle.SOUL_FIRE_FLAME,
                    new Location(world, bx + rightX * 1.2, midY, bz + rightZ * 1.2), 1, 0, 0, 0, 0.02);
            } catch (Throwable ignored) {
            }
        }, 0L, 5L);
        PanelState p = playerPanels.get(ownerUuid);
        if (p != null) {
            p.task = self[0];
        }
    }

    private void trackEntity(String ownerUuid, UUID entityId) {
        PanelState p = playerPanels.get(ownerUuid);
        if (p != null) {
            p.entityIds.add(entityId.toString());
        }
    }

    private void removePlayerPanel(String ownerUuid) {
        PanelState p = playerPanels.get(ownerUuid);
        if (p == null) {
            return;
        }
        String oldKey = p.key;
        List<String> entityIds = p.entityIds;
        cancelPanelTask(ownerUuid);
        removeEntitiesByIds(entityIds);
        playerPanels.remove(ownerUuid);
        Location loc = parseMachineKey(oldKey);
        if (loc != null) {
            removeAllPanelEntities(loc);
        }
    }

    private void removeAllHolograms() {
        for (String uuid : new ArrayList<>(playerPanels.keySet())) {
            try {
                removePlayerPanel(uuid);
            } catch (Throwable ignored) {
            }
        }
    }

    private void cancelPanelTask(String ownerUuid) {
        PanelState p = playerPanels.get(ownerUuid);
        if (p != null && p.task != null) {
            try {
                p.task.cancel();
            } catch (Throwable ignored) {
            }
            p.task = null;
        }
    }

    private static void removeEntitiesByIds(@Nullable List<String> ids) {
        if (ids == null) {
            return;
        }
        for (String id : ids) {
            try {
                Entity ent = Bukkit.getEntity(UUID.fromString(id));
                if (ent != null) {
                    ent.remove();
                }
            } catch (Throwable ignored) {
            }
        }
    }

    private static void removeHolograms(Location loc) {
        String key = machineKey(loc);
        World world = loc.getWorld();
        if (world == null) {
            return;
        }
        for (Entity ent : world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5)) {
            String h = pdcGet(ent.getPersistentDataContainer(), HOLO_KEY);
            if (key.equals(h)) {
                ent.remove();
            }
        }
    }

    private static void removeAllPanelEntities(Location loc) {
        World world = loc.getWorld();
        if (world == null) {
            return;
        }
        for (Entity ent : world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5)) {
            if (pdcGet(ent.getPersistentDataContainer(), HOLO_KEY) != null) {
                ent.remove();
            }
        }
    }

    @Nullable
    private static String getPanelOwner(Location loc) {
        String key = machineKey(loc);
        World world = loc.getWorld();
        if (world == null) {
            return null;
        }
        for (Entity ent : world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5)) {
            var pdc = ent.getPersistentDataContainer();
            String owner = pdcGet(pdc, OWNER_KEY);
            String holo = pdcGet(pdc, HOLO_KEY);
            if (owner != null && key.equals(holo)) {
                return owner;
            }
        }
        return null;
    }

    private static boolean hasPanel(Location loc) {
        String key = machineKey(loc);
        World world = loc.getWorld();
        if (world == null) {
            return false;
        }
        for (Entity ent : world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5)) {
            if (key.equals(pdcGet(ent.getPersistentDataContainer(), HOLO_KEY))) {
                return true;
            }
        }
        return false;
    }

    @Nullable
    private static Entity resolvePanelInteractTarget(Entity ent) {
        if (ent == null) {
            return null;
        }
        if (isPanelInteraction(ent)) {
            return ent;
        }
        if (!(ent instanceof TextDisplay)) {
            return null;
        }
        String mKey = pdcGet(ent.getPersistentDataContainer(), HOLO_KEY);
        if (mKey == null) {
            return null;
        }
        World world = ent.getWorld();
        Location loc = ent.getLocation();
        Entity best = null;
        double bestDist = Double.MAX_VALUE;
        Collection<Entity> nearby = world.getNearbyEntities(loc, 0.75, 0.75, 0.75);
        for (Entity cand : nearby) {
            if (!isPanelInteraction(cand)) {
                continue;
            }
            String ck = pdcGet(cand.getPersistentDataContainer(), HOLO_KEY);
            if (!mKey.equals(ck)) {
                continue;
            }
            double d = cand.getLocation().distanceSquared(loc);
            if (d < bestDist) {
                bestDist = d;
                best = cand;
            }
        }
        return best;
    }

    private static boolean isPanelInteraction(Entity ent) {
        if (!(ent instanceof Interaction)) {
            return false;
        }
        String holo = pdcGet(ent.getPersistentDataContainer(), HOLO_KEY);
        return holo != null && !holo.isEmpty();
    }

    private static boolean isOurMachine(Location loc) {
        String id = BlockStorage.checkID(loc);
        return id != null && id.equalsIgnoreCase(MACHINE_ID);
    }

    private static boolean checkCooldown(Player player) {
        var pdc = player.getPersistentDataContainer();
        long now = System.currentTimeMillis();
        long last = 0L;
        if (pdc.has(COOLDOWN_KEY, PersistentDataType.STRING)) {
            try {
                last = Long.parseLong(pdc.get(COOLDOWN_KEY, PersistentDataType.STRING));
            } catch (Exception ignored) {
            }
        }
        if (now - last < COOLDOWN_MS) {
            return false;
        }
        pdc.set(COOLDOWN_KEY, PersistentDataType.STRING, String.valueOf(now));
        return true;
    }

    @Nullable
    private static Block getClickedBlock(PlayerRightClickEvent event) {
        try {
            Optional<Block> opt = event.getClickedBlock();
            return opt.orElse(null);
        } catch (Throwable t) {
            return null;
        }
    }

    private static String machineKey(Location loc) {
        return loc.getWorld().getName() + "," + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ();
    }

    @Nullable
    private static Location parseMachineKey(@Nullable String key) {
        if (key == null) {
            return null;
        }
        String[] parts = key.split(",");
        if (parts.length != 4) {
            return null;
        }
        World world = Bukkit.getWorld(parts[0]);
        if (world == null) {
            return null;
        }
        try {
            return world.getBlockAt(Integer.parseInt(parts[1]), Integer.parseInt(parts[2]), Integer.parseInt(parts[3]))
                .getLocation();
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Location atY(Location base, double y) {
        Location nl = base.clone();
        nl.setY(y);
        return nl;
    }

    private static int totalPages() {
        return Math.max(1, (int) Math.ceil(TRADES.size() / (double) PER_PAGE));
    }

    @Nullable
    private static Trade findTrade(String id) {
        for (Trade t : TRADES) {
            if (t.id.equals(id)) {
                return t;
            }
        }
        return null;
    }

    private static String costText(Trade t) {
        List<String> parts = new ArrayList<>();
        if (t.costI > 0) {
            parts.add(C_I + t.costI + "个I等货币");
        }
        if (t.costV > 0) {
            parts.add(C_V + t.costV + "个V等货币");
        }
        if (t.costX > 0) {
            parts.add(C_X + t.costX + "个X等货币");
        }
        return String.join("§r" + C_GOLD + " + ", parts);
    }

    private static String costShort(Trade t) {
        List<String> parts = new ArrayList<>();
        if (t.costI > 0) {
            parts.add(t.costI + "I");
        }
        if (t.costV > 0) {
            parts.add(t.costV + "V");
        }
        if (t.costX > 0) {
            parts.add(t.costX + "X");
        }
        return String.join("+", parts);
    }

    @Nullable
    private static String pdcGet(org.bukkit.persistence.PersistentDataContainer pdc, NamespacedKey key) {
        try {
            if (pdc.has(key, PersistentDataType.STRING)) {
                return pdc.get(key, PersistentDataType.STRING);
            }
        } catch (Throwable ignored) {
        }
        return null;
    }

    private static final class PanelState {
        final String key;
        int page;
        @Nullable BukkitTask task;
        final List<String> entityIds;

        PanelState(String key, int page, @Nullable BukkitTask task, List<String> entityIds) {
            this.key = key;
            this.page = page;
            this.task = task;
            this.entityIds = entityIds;
        }
    }

    private record Trade(String id, String name, String material, int amount, int costI, int costV, int costX, String color) {
    }
}
