package com.linkany121.gltc.logic.machine;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.GltcMenuHelper;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.core.machines.MachineOperation;
import me.mrCookieSlime.CSCoreLibPlugin.Configuration.Config;
import me.mrCookieSlime.Slimefun.api.BlockStorage;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenu;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.World;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.block.BlockPlaceEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.scheduler.BukkitTask;

import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@code FKR_锻造锤} — anvil/golem FX while crafting.
 * Port of {@code scripts/机器/锻造锤.js}.
 * Call {@link #register(GltcPlugin)} / {@link #unregister()} from Bootstrap.
 */
public final class ForgeHammerLogic implements GltcMachineLogic {

    public static final String MACHINE_ID = "FKR_锻造锤";

    // ===== 配置区（锻造锤 特效，改完需重新打包 jar 并重启生效）=====
    private static final int PROGRESS_SLOT = 11;             // 机器界面中进度格的位置（0~26），用于判断是否在工作
    private static final int EFFECT_INTERVAL_TICKS = 20;     // 工作期间播放一次特效的最小间隔（tick），20 = 1 秒
    private static final int TASK_INTERVAL_TICKS = 20;       // 全局扫描任务运行间隔（tick）
    private static final int RESCAN_INTERVAL_TICKS = 1200;   // 已登记锻造锤的重新扫描间隔（tick），1200 = 60 秒
    private static final int EMPTY_RESCAN_INTERVAL_TICKS = 200; // 未登记到锻造锤时的重扫间隔（tick，更快补扫）
    private static final double RANGE = 2.0;                 // 检测「锻造锤机器」方块的范围（格）

    private static final Particle EXPLOSION_PARTICLE = resolveExplosionParticle();

    private final ConcurrentHashMap<String, Location> trackedHammers = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> lastEffectTick = new ConcurrentHashMap<>();

    private volatile int lastRescanTick;
    private BukkitTask effectTask;

    public void register(GltcPlugin plugin) {
        startEffectTask(plugin);
    }

    public void unregister() {
        if (effectTask != null) {
            effectTask.cancel();
            effectTask = null;
        }
        trackedHammers.clear();
        lastEffectTick.clear();
        lastRescanTick = 0;
    }

    @Override
    public boolean onTick(Location location, GltcRecipeMachine machine) {
        trackHammer(location);
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin == null) {
            return false;
        }
        Location loc = location.clone();
        Bukkit.getScheduler().runTask(plugin, () -> {
            try {
                if (isProcessing(loc, machine)) {
                    maybePlayEffects(loc);
                }
            } catch (Throwable ignored) {
            }
        });
        return false;
    }

    @Override
    public void onPlace(BlockPlaceEvent event) {
        try {
            trackHammer(event.getBlock().getLocation());
        } catch (Throwable ignored) {
        }
    }

    @Override
    public void onBreak(BlockBreakEvent event, ItemStack item, List<ItemStack> drops) {
        try {
            untrackHammer(event.getBlock().getLocation());
        } catch (Throwable ignored) {
        }
    }

    private void startEffectTask(GltcPlugin plugin) {
        if (plugin == null) {
            return;
        }
        if (effectTask != null) {
            effectTask.cancel();
            effectTask = null;
        }
        effectTask = Bukkit.getScheduler().runTaskTimer(
            plugin, this::runEffectCycle, TASK_INTERVAL_TICKS, TASK_INTERVAL_TICKS
        );
        Bukkit.getScheduler().runTaskLater(plugin, () -> {
            rescanForgeHammers();
            lastRescanTick = Bukkit.getCurrentTick();
        }, 1L);
    }

    private void runEffectCycle() {
        int now = Bukkit.getCurrentTick();
        int rescanInterval = trackedHammers.isEmpty()
            ? EMPTY_RESCAN_INTERVAL_TICKS
            : RESCAN_INTERVAL_TICKS;
        if (lastRescanTick == 0 || now - lastRescanTick >= rescanInterval) {
            rescanForgeHammers();
            lastRescanTick = now;
        }
        tickTrackedHammers();
    }

    private void tickTrackedHammers() {
        Iterator<Map.Entry<String, Location>> it = trackedHammers.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Location> entry = it.next();
            Location loc = entry.getValue();
            try {
                if (!isStillHammer(loc)) {
                    it.remove();
                    lastEffectTick.remove(entry.getKey());
                    continue;
                }
                if (isProcessing(loc, null)) {
                    maybePlayEffects(loc);
                }
            } catch (Throwable ignored) {
                it.remove();
                lastEffectTick.remove(entry.getKey());
            }
        }
    }

    private void rescanForgeHammers() {
        try {
            for (World world : Bukkit.getWorlds()) {
                Map<Location, Config> storage = BlockStorage.getRawStorage(world);
                if (storage == null || storage.isEmpty()) {
                    continue;
                }
                for (Map.Entry<Location, Config> entry : storage.entrySet()) {
                    Config cfg = entry.getValue();
                    if (cfg == null) {
                        continue;
                    }
                    String id = cfg.getString("id");
                    if (id != null && MACHINE_ID.equalsIgnoreCase(id)) {
                        trackHammer(entry.getKey());
                    }
                }
            }
        } catch (Throwable ignored) {
        }
    }

    private static boolean isStillHammer(Location loc) {
        try {
            String id = BlockStorage.checkID(loc);
            return id != null && MACHINE_ID.equalsIgnoreCase(id);
        } catch (Throwable ignored) {
            return false;
        }
    }

    private boolean isProcessing(Location loc, GltcRecipeMachine known) {
        if (isProcessingByOperation(loc, known)) {
            return true;
        }
        return isProcessingByProgressBar(loc, known);
    }

    private boolean isProcessingByOperation(Location loc, GltcRecipeMachine known) {
        try {
            GltcRecipeMachine machine = known;
            if (machine == null) {
                SlimefunItem sf = BlockStorage.check(loc);
                if (!(sf instanceof GltcRecipeMachine recipeMachine)) {
                    return false;
                }
                machine = recipeMachine;
            }
            MachineOperation op = machine.getMachineProcessor().getOperation(loc.getBlock());
            return op != null && !op.isFinished();
        } catch (Throwable ignored) {
            return false;
        }
    }

    private boolean isProcessingByProgressBar(Location loc, GltcRecipeMachine known) {
        try {
            BlockMenu menu = BlockStorage.getInventory(loc);
            if (menu == null) {
                return false;
            }
            int slot = progressSlot(known);
            ItemStack item = menu.getItemInSlot(slot);
            if (item == null || item.getType() == Material.AIR) {
                return false;
            }
            ItemMeta meta = item.getItemMeta();
            if (meta != null && meta.hasDisplayName()) {
                if (meta.getDisplayName().contains("空闲中")) {
                    return false;
                }
            }
            return true;
        } catch (Throwable ignored) {
            return false;
        }
    }

    private static int progressSlot(GltcRecipeMachine known) {
        if (known != null) {
            try {
                return GltcMenuHelper.findProgressBarSlot(known.getId());
            } catch (Throwable ignored) {
            }
        }
        int fromMenu = GltcMenuHelper.findProgressBarSlot(MACHINE_ID);
        return fromMenu > 0 ? fromMenu : PROGRESS_SLOT;
    }

    private void maybePlayEffects(Location loc) {
        String key = locKey(loc);
        int now = Bukkit.getCurrentTick();
        Integer last = lastEffectTick.get(key);
        if (last != null && now - last < EFFECT_INTERVAL_TICKS) {
            return;
        }
        lastEffectTick.put(key, now);
        playForgeEffects(loc);
    }

    private static void playForgeEffects(Location loc) {
        try {
            World world = loc.getWorld();
            if (world == null) {
                return;
            }
            double x = loc.getBlockX() + 0.5;
            double y = loc.getBlockY() + 1.0;
            double z = loc.getBlockZ() + 0.5;

            try {
                world.playSound(loc, Sound.BLOCK_ANVIL_USE, 1.0f, 0.9f);
            } catch (Throwable ignored) {
            }
            try {
                world.playSound(loc, Sound.ENTITY_IRON_GOLEM_DEATH, 1.0f, 1.0f);
            } catch (Throwable ignored) {
            }

            if (EXPLOSION_PARTICLE != null) {
                try {
                    world.spawnParticle(EXPLOSION_PARTICLE, x, y, z, 1, RANGE, 0.8, RANGE, 0.0);
                } catch (Throwable ignored) {
                }
            }
            try {
                world.spawnParticle(Particle.FLAME, x, y, z, 80, RANGE, 1.2, RANGE, 0.15);
            } catch (Throwable ignored) {
            }
            try {
                world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, x, y, z, 40, 0.5, 1.0, 0.5, 0.05);
            } catch (Throwable ignored) {
            }
        } catch (Throwable ignored) {
        }
    }

    private void trackHammer(Location loc) {
        if (loc == null || loc.getWorld() == null) {
            return;
        }
        trackedHammers.put(locKey(loc), loc.clone());
    }

    private void untrackHammer(Location loc) {
        if (loc == null) {
            return;
        }
        String key = locKey(loc);
        trackedHammers.remove(key);
        lastEffectTick.remove(key);
    }

    private static String locKey(Location loc) {
        return loc.getWorld().getUID() + ":" + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ();
    }

    private static Particle resolveExplosionParticle() {
        try {
            return Particle.valueOf("EXPLOSION");
        } catch (IllegalArgumentException ignored) {
            try {
                return Particle.valueOf("EXPLOSION_LARGE");
            } catch (IllegalArgumentException ignored2) {
                return null;
            }
        }
    }
}
