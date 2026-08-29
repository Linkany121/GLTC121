package com.linkany121.gltc.multiblock;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.util.IdCanonicalizer;
import com.linkany121.gltc.util.SmbRotationUtil;
import com.linkany121.gltc.util.TextUtil;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import me.mrCookieSlime.Slimefun.api.BlockStorage;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.NamespacedKey;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.entity.BlockDisplay;
import org.bukkit.entity.Display;
import org.bukkit.entity.Entity;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.persistence.PersistentDataType;
import org.bukkit.util.Transformation;
import org.bukkit.util.Vector;
import org.joml.AxisAngle4f;
import org.joml.Vector3f;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Super multiblock runtime — facing / layer persistence follows RSC
 * ({@code HorizonDirection}, {@code LayerIndex} in BlockStorage).
 */
public final class GltcSuperMultiBlockManager {

    /** Layer index meaning "show every layer at once". */
    public static final int ALL_LAYERS = -1;

    /** RSC uses -999 for "all layers"; we accept both when reading. */
    private static final int RSC_ALL_LAYERS = -999;

    private static final String BS_FACING = "HorizonDirection";
    private static final String BS_LAYER = "LayerIndex";

    private static final int REFRESH_RADIUS = 20;

    private static NamespacedKey displayKey() {
        return new NamespacedKey(GltcPlugin.getInstance(), "smb_display");
    }

    private static NamespacedKey coreKey() {
        return new NamespacedKey(GltcPlugin.getInstance(), "smb_core");
    }

    private static final Map<String, CoreState> CORES = new ConcurrentHashMap<>();
    private static final Map<String, Set<UUID>> DISPLAYS = new ConcurrentHashMap<>();
    private static final Map<String, Integer> DISPLAY_LAYERS = new ConcurrentHashMap<>();
    private static final Map<String, Boolean> FORMED = new ConcurrentHashMap<>();
    /** Last facing-inference attempt per core (limits how often we scan the structure). */
    private static final Map<String, Long> INFER_ATTEMPTS = new ConcurrentHashMap<>();
    private static final long INFER_INTERVAL_MS = 20_000L;

    private record CoreState(Location location, String machineId, BlockFace facing) {
    }

    private GltcSuperMultiBlockManager() {
    }

    public static void onCorePlaced(Location core, String machineId) {
        onCorePlaced(core, machineId, BlockFace.SOUTH);
    }

    public static void onCorePlaced(Location core, String machineId, BlockFace facing) {
        Location blockLoc = core.getBlock().getLocation();
        BlockFace normalized = normalizeFacing(facing);
        persistFacing(blockLoc, normalized);
        String key = blockKey(blockLoc);
        CORES.put(key, new CoreState(blockLoc, machineId, normalized));
        int layer = readPersistedLayer(blockLoc);
        DISPLAY_LAYERS.put(key, layer);
        persistLayer(blockLoc, layer);
        FORMED.put(key, false);
        INFER_ATTEMPTS.put(key, 0L);
        GltcPlugin plugin = GltcPlugin.getInstance();
        Bukkit.getScheduler().runTask(plugin, () -> refresh(blockLoc, machineId, null));
    }

    /**
     * Restore a core into memory from BlockStorage (restart / chunk load).
     * Facing comes from RSC key {@code HorizonDirection}; missing → SOUTH (YAML authored facing).
     * Display refresh always runs on the main thread (Slimefun tickers are async).
     */
    public static void ensureCoreLoaded(Location core, String machineId) {
        Location blockLoc = core.getBlock().getLocation();
        if (!loadCoreState(blockLoc, machineId)) {
            return;
        }
        runOnMain(() -> refresh(blockLoc, machineId, null));
    }

    /**
     * Memory-only restore — safe from Slimefun async tickers.
     * Does not spawn/remove Display entities.
     *
     * @return true if this call newly registered the core
     */
    private static boolean loadCoreState(Location core, String machineId) {
        if (GltcSuperMultiBlockData.get(machineId) == null) {
            return false;
        }
        Location blockLoc = core.getBlock().getLocation();
        String key = blockKey(blockLoc);
        if (CORES.containsKey(key)) {
            return false;
        }
        BlockFace facing = readPersistedFacing(blockLoc);
        CoreState previous = CORES.putIfAbsent(key, new CoreState(blockLoc, machineId, facing));
        if (previous != null) {
            return false;
        }
        int layer = readPersistedLayer(blockLoc);
        DISPLAY_LAYERS.put(key, layer);
        FORMED.put(key, false);
        INFER_ATTEMPTS.put(key, 0L);
        return true;
    }

    private static void runOnMain(Runnable task) {
        if (Bukkit.isPrimaryThread()) {
            task.run();
            return;
        }
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin != null && plugin.isEnabled()) {
            Bukkit.getScheduler().runTask(plugin, task);
        }
    }

    public static void switchDisplayLayer(Player player, Location core, String machineId) {
        GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(machineId);
        if (definition == null || !definition.allowSwitchDisplayLayer()) {
            return;
        }
        Location blockLoc = core.getBlock().getLocation();
        ensureCoreLoaded(blockLoc, machineId);
        String key = blockKey(blockLoc);
        int current = DISPLAY_LAYERS.getOrDefault(key, ALL_LAYERS);
        int next = current + 1;
        if (current == ALL_LAYERS) {
            next = 0;
        } else if (next >= definition.layerCount()) {
            next = ALL_LAYERS;
        }
        DISPLAY_LAYERS.put(key, next);
        persistLayer(blockLoc, next);
        if (definition.defaultNotice()) {
            if (next == ALL_LAYERS) {
                player.sendMessage(TextUtil.legacySection("&7结构投影层: &e全部"));
            } else {
                player.sendMessage(TextUtil.legacySection(
                    "&7结构投影层: &e" + (next + 1) + "&7/&e" + definition.layerCount()
                ));
            }
        }
        spawnProjectiles(blockLoc, machineId);
    }

    private static void spawnProjectiles(Location core, String machineId) {
        if (!Bukkit.isPrimaryThread()) {
            Location copy = core.getBlock().getLocation();
            runOnMain(() -> spawnProjectiles(copy, machineId));
            return;
        }

        GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(machineId);
        if (definition == null || !definition.displayProjectiles()) {
            return;
        }

        Location blockLoc = core.getBlock().getLocation();
        if (isFormed(blockLoc, machineId)) {
            removeProjectiles(blockLoc);
            FORMED.put(blockKey(blockLoc), true);
            return;
        }

        String key = blockKey(blockLoc);
        removeProjectiles(blockLoc);

        int layer = DISPLAY_LAYERS.getOrDefault(key, ALL_LAYERS);
        Set<UUID> ids = new HashSet<>();

        for (Map.Entry<Vector, GltcSuperMultiBlockData.PartSpec> entry : definition.parts().entrySet()) {
            if (entry.getKey().lengthSquared() == 0) {
                continue;
            }
            if (layer != ALL_LAYERS && layerOf(definition, entry.getKey()) != layer) {
                continue;
            }

            Vector rotated = worldOffset(blockLoc, entry.getKey());
            Location target = blockLoc.clone().add(rotated);
            GltcSuperMultiBlockData.PartSpec spec = entry.getValue();

            boolean matched = matchesPart(target.getBlock(), spec);
            float scale = matched ? 0.8f : 0.85f;
            float offset = (1.0f - scale) / 2.0f;

            // RSC: WATER/LAVA/AIR projections use ItemDisplay + bucket items.
            ItemStack fluidItem = fluidDisplayItem(spec);
            if (fluidItem != null) {
                ItemDisplay display = target.getWorld().spawn(target, ItemDisplay.class, entity -> {
                    entity.setItemStack(fluidItem);
                    entity.setTransformation(new Transformation(
                        new Vector3f(offset, offset, offset),
                        new AxisAngle4f(0, 0, 0, 1),
                        new Vector3f(scale, scale, scale),
                        new AxisAngle4f(0, 0, 0, 1)
                    ));
                    entity.setBrightness(new Display.Brightness(15, 15));
                    entity.setViewRange(64.0f);
                    entity.setGlowing(!matched);
                    entity.getPersistentDataContainer().set(displayKey(), PersistentDataType.BYTE, (byte) 1);
                    entity.getPersistentDataContainer().set(coreKey(), PersistentDataType.STRING, key);
                });
                ids.add(display.getUniqueId());
                continue;
            }

            Material material = resolveMaterial(spec);
            if (material == null || material.isAir()) {
                continue;
            }

            BlockDisplay display = target.getWorld().spawn(target, BlockDisplay.class, entity -> {
                entity.setBlock(material.createBlockData());
                entity.setTransformation(new Transformation(
                    new Vector3f(offset, offset, offset),
                    new AxisAngle4f(0, 0, 0, 1),
                    new Vector3f(scale, scale, scale),
                    new AxisAngle4f(0, 0, 0, 1)
                ));
                entity.setBrightness(new Display.Brightness(15, 15));
                entity.setViewRange(64.0f);
                entity.setGlowing(!matched);
                entity.getPersistentDataContainer().set(displayKey(), PersistentDataType.BYTE, (byte) 1);
                entity.getPersistentDataContainer().set(coreKey(), PersistentDataType.STRING, key);
            });
            ids.add(display.getUniqueId());
        }

        DISPLAYS.put(key, ids);
        FORMED.put(key, false);
    }

    private static ItemStack fluidDisplayItem(GltcSuperMultiBlockData.PartSpec spec) {
        if (spec.material() == null) {
            return null;
        }
        return switch (spec.material()) {
            case WATER -> new ItemStack(Material.WATER_BUCKET);
            case LAVA -> new ItemStack(Material.LAVA_BUCKET);
            case AIR, CAVE_AIR, VOID_AIR -> new ItemStack(Material.BUCKET);
            default -> null;
        };
    }

    private static int layerOf(GltcSuperMultiBlockData.Definition definition, Vector offset) {
        int yamlLayer = definition.coreLayer() - offset.getBlockY();
        if (definition.layerParts().containsKey(yamlLayer)) {
            return yamlLayer;
        }
        return Math.max(0, Math.min(definition.layerCount() - 1, yamlLayer));
    }

    public static void onCoreRemoved(Location core) {
        removeProjectiles(core);
        String key = blockKey(core);
        CORES.remove(key);
        DISPLAY_LAYERS.remove(key);
        FORMED.remove(key);
        INFER_ATTEMPTS.remove(key);
    }

    public static void clearAllDisplays() {
        for (Location loc : new HashSet<>(CORES.values().stream().map(CoreState::location).toList())) {
            removeProjectiles(loc);
        }
        DISPLAYS.clear();
        CORES.clear();
        DISPLAY_LAYERS.clear();
        FORMED.clear();
        INFER_ATTEMPTS.clear();
    }

    /** Drop in-memory SMB state for a whole world (unload). */
    public static void clearWorld(org.bukkit.World world) {
        if (world == null) {
            return;
        }
        String worldName = world.getName();
        for (Location loc : new HashSet<>(CORES.values().stream().map(CoreState::location).toList())) {
            if (loc.getWorld() != null && worldName.equals(loc.getWorld().getName())) {
                onCoreRemoved(loc);
            }
        }
    }

    /** Drop in-memory SMB state for one chunk (unload). */
    public static void clearChunk(org.bukkit.Chunk chunk) {
        if (chunk == null) {
            return;
        }
        String worldName = chunk.getWorld().getName();
        int cx = chunk.getX();
        int cz = chunk.getZ();
        for (Location loc : new HashSet<>(CORES.values().stream().map(CoreState::location).toList())) {
            if (loc.getWorld() == null || !worldName.equals(loc.getWorld().getName())) {
                continue;
            }
            if ((loc.getBlockX() >> 4) == cx && (loc.getBlockZ() >> 4) == cz) {
                onCoreRemoved(loc);
            }
        }
    }

    public static void refresh(Location core, String machineId) {
        refresh(core, machineId, null);
    }

    public static void refresh(Location core, String machineId, Player notifier) {
        if (!Bukkit.isPrimaryThread()) {
            Location copy = core.getBlock().getLocation();
            runOnMain(() -> refresh(copy, machineId, notifier));
            return;
        }
        if (GltcSuperMultiBlockData.get(machineId) == null) {
            return;
        }
        Location blockLoc = core.getBlock().getLocation();
        loadCoreState(blockLoc, machineId);
        String key = blockKey(blockLoc);
        boolean wasFormed = Boolean.TRUE.equals(FORMED.get(key));
        GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(machineId);
        boolean nowFormed = isFormed(blockLoc, machineId);
        if (!nowFormed && definition != null) {
            tryInferFacing(blockLoc, machineId, definition);
            nowFormed = isFormed(blockLoc, machineId);
        }
        if (nowFormed) {
            removeProjectiles(blockLoc);
            FORMED.put(key, true);
            if (!wasFormed && notifier != null && definition != null && definition.defaultNotice()) {
                notifier.sendMessage(TextUtil.legacySection("&a巨型多方块结构已搭建完成！"));
            }
            return;
        }
        FORMED.put(key, false);
        spawnProjectiles(blockLoc, machineId);
    }

    public static void refreshNearby(Location changed) {
        refreshNearby(changed, null);
    }

    public static void refreshNearby(Location changed, Player notifier) {
        if (changed.getWorld() == null) {
            return;
        }
        discoverCoresNear(changed);
        for (CoreState state : new HashSet<>(CORES.values())) {
            Location core = state.location();
            if (!core.getWorld().equals(changed.getWorld())) {
                continue;
            }
            if (core.distanceSquared(changed) > (long) REFRESH_RADIUS * REFRESH_RADIUS) {
                continue;
            }
            String id = BlockStorage.checkID(core);
            if (id == null || GltcSuperMultiBlockData.get(id) == null) {
                onCoreRemoved(core);
                continue;
            }
            // A block changed nearby — allow the facing to be re-inferred.
            INFER_ATTEMPTS.put(blockKey(core), 0L);
            refresh(core, id, notifier);
        }
    }

    /**
     * After restart CORES is empty — restore nearby cores from BlockStorage.
     * Uses an 8-block cube (~4.9k probes) instead of a 41³ walk.
     */
    private static void discoverCoresNear(Location center) {
        if (center.getWorld() == null) {
            return;
        }
        long radiusSq = (long) REFRESH_RADIUS * REFRESH_RADIUS;
        for (CoreState state : CORES.values()) {
            if (state.location().getWorld() != null
                && state.location().getWorld().equals(center.getWorld())
                && state.location().distanceSquared(center) <= radiusSq) {
                return;
            }
        }
        final int r = 8;
        for (int dx = -r; dx <= r; dx++) {
            for (int dy = -r; dy <= r; dy++) {
                for (int dz = -r; dz <= r; dz++) {
                    Location loc = center.clone().add(dx, dy, dz);
                    if (!BlockStorage.hasBlockInfo(loc)) {
                        continue;
                    }
                    String id = BlockStorage.checkID(loc);
                    if (id != null && GltcSuperMultiBlockData.get(id) != null) {
                        ensureCoreLoaded(loc, id);
                    }
                }
            }
        }
    }

    /**
     * Find an SMB core that includes {@code part} as a structure offset (for part-click menu).
     */
    public static CoreHit findCoreForPart(Location part) {
        if (part.getWorld() == null) {
            return null;
        }
        discoverCoresNear(part);
        Location partBlock = part.getBlock().getLocation();
        for (CoreState state : new HashSet<>(CORES.values())) {
            if (!state.location().getWorld().equals(partBlock.getWorld())) {
                continue;
            }
            if (state.location().distanceSquared(partBlock) > (long) REFRESH_RADIUS * REFRESH_RADIUS) {
                continue;
            }
            GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(state.machineId());
            if (definition == null) {
                continue;
            }
            for (Map.Entry<Vector, GltcSuperMultiBlockData.PartSpec> entry : definition.parts().entrySet()) {
                Vector rotated = worldOffset(state.location(), entry.getKey());
                Location expected = state.location().clone().add(rotated);
                if (expected.getBlockX() == partBlock.getBlockX()
                    && expected.getBlockY() == partBlock.getBlockY()
                    && expected.getBlockZ() == partBlock.getBlockZ()) {
                    return new CoreHit(state.location(), state.machineId());
                }
            }
            if (state.location().getBlockX() == partBlock.getBlockX()
                && state.location().getBlockY() == partBlock.getBlockY()
                && state.location().getBlockZ() == partBlock.getBlockZ()) {
                return new CoreHit(state.location(), state.machineId());
            }
        }
        return null;
    }

    public record CoreHit(Location core, String machineId) {
    }

    public static boolean isFormed(Location core, String machineId) {
        GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(machineId);
        return definition != null && isFormed(core, definition);
    }

    /** Whether crafting may run — honors {@code checkFormed} (RSC canTick). */
    public static boolean canTick(Location core, String machineId) {
        GltcSuperMultiBlockData.Definition definition = GltcSuperMultiBlockData.get(machineId);
        if (definition == null) {
            return false;
        }
        if (!definition.checkFormed()) {
            return true;
        }
        // Slimefun TickerTask is async — restore facing/state only; schedule display work on main.
        Location blockLoc = core.getBlock().getLocation();
        if (loadCoreState(blockLoc, machineId)) {
            runOnMain(() -> refresh(blockLoc, machineId, null));
        }
        boolean formed = isFormed(core, definition);
        if (!formed) {
            tryInferFacing(blockLoc, machineId, definition);
            formed = isFormed(core, definition);
        }
        return formed;
    }

    private static boolean isFormed(Location core, GltcSuperMultiBlockData.Definition definition) {
        return isFormedWithFacing(core, definition, facingOf(core));
    }

    private static boolean isFormedWithFacing(Location core, GltcSuperMultiBlockData.Definition definition, BlockFace facing) {
        for (Map.Entry<Vector, GltcSuperMultiBlockData.PartSpec> entry : definition.parts().entrySet()) {
            Vector rotated = SmbRotationUtil.rotateOffset(entry.getKey(), facing);
            Block block = core.clone().add(rotated).getBlock();
            if (!matchesPart(block, entry.getValue())) {
                return false;
            }
        }
        return true;
    }

    /**
     * After a restart, {@code HorizonDirection} may be missing or stale (e.g. the core was
     * placed before facing persistence existed). Instead of trusting it blindly, try to infer
     * the actual facing by matching the structure built around the core.
     *
     * @return true if a matching facing was found and applied
     */
    private static boolean tryInferFacing(Location blockLoc, String machineId, GltcSuperMultiBlockData.Definition definition) {
        String key = blockKey(blockLoc);
        long now = System.currentTimeMillis();
        Long last = INFER_ATTEMPTS.get(key);
        if (last != null && now - last < INFER_INTERVAL_MS) {
            return false;
        }
        INFER_ATTEMPTS.put(key, now);
        BlockFace inferred = inferFacing(blockLoc, definition);
        if (inferred == null) {
            return false;
        }
        applyFacing(blockLoc, machineId, inferred);
        return true;
    }

    private static BlockFace inferFacing(Location core, GltcSuperMultiBlockData.Definition definition) {
        BlockFace current = facingOf(core);
        if (isFormedWithFacing(core, definition, current)) {
            return current;
        }
        for (BlockFace f : new BlockFace[]{BlockFace.SOUTH, BlockFace.NORTH, BlockFace.EAST, BlockFace.WEST}) {
            if (isFormedWithFacing(core, definition, f)) {
                return f;
            }
        }
        return null;
    }

    /** Update the in-memory facing and persist it (persist happens on the main thread). */
    private static void applyFacing(Location blockLoc, String machineId, BlockFace facing) {
        String key = blockKey(blockLoc);
        CoreState state = CORES.get(key);
        if (state != null && state.facing() == facing) {
            return;
        }
        CORES.put(key, new CoreState(blockLoc, machineId, facing));
        BlockFace f = facing;
        runOnMain(() -> persistFacing(blockLoc, f));
    }

    private static Vector worldOffset(Location core, Vector templateOffset) {
        return SmbRotationUtil.rotateOffset(templateOffset, facingOf(core));
    }

    private static BlockFace facingOf(Location core) {
        String key = blockKey(core);
        CoreState state = CORES.get(key);
        if (state != null) {
            return state.facing();
        }
        return readPersistedFacing(core.getBlock().getLocation());
    }

    private static void persistFacing(Location core, BlockFace facing) {
        BlockStorage.addBlockInfo(core.getBlock(), BS_FACING, facing.name());
    }

    private static BlockFace readPersistedFacing(Location core) {
        String raw = BlockStorage.getLocationInfo(core, BS_FACING);
        if (raw == null || raw.isBlank()) {
            return BlockFace.SOUTH;
        }
        try {
            return normalizeFacing(BlockFace.valueOf(raw.toUpperCase()));
        } catch (IllegalArgumentException ex) {
            return BlockFace.SOUTH;
        }
    }

    private static void persistLayer(Location core, int layer) {
        int stored = layer == ALL_LAYERS ? RSC_ALL_LAYERS : layer;
        BlockStorage.addBlockInfo(core.getBlock(), BS_LAYER, String.valueOf(stored));
    }

    private static int readPersistedLayer(Location core) {
        String raw = BlockStorage.getLocationInfo(core, BS_LAYER);
        if (raw == null || raw.isBlank()) {
            return ALL_LAYERS;
        }
        try {
            int value = Integer.parseInt(raw.trim());
            if (value == RSC_ALL_LAYERS || value == ALL_LAYERS) {
                return ALL_LAYERS;
            }
            return Math.max(0, value);
        } catch (NumberFormatException ex) {
            return ALL_LAYERS;
        }
    }

    private static BlockFace normalizeFacing(BlockFace facing) {
        return switch (facing) {
            case NORTH, SOUTH, EAST, WEST -> facing;
            default -> BlockFace.SOUTH;
        };
    }

    private static boolean matchesPart(Block block, GltcSuperMultiBlockData.PartSpec spec) {
        if (spec.slimefunId() != null) {
            String placedId = BlockStorage.checkID(block.getLocation());
            if (placedId == null) {
                return false;
            }
            return placedId.equalsIgnoreCase(spec.slimefunId())
                || IdCanonicalizer.canonical(placedId).equalsIgnoreCase(IdCanonicalizer.canonical(spec.slimefunId()));
        }
        if (spec.material() == null) {
            return false;
        }
        Material actual = block.getType();
        if (actual == spec.material()) {
            return true;
        }
        if (spec.material() == Material.WATER) {
            return actual == Material.WATER || actual == Material.BUBBLE_COLUMN;
        }
        if (spec.material() == Material.LAVA) {
            return actual == Material.LAVA;
        }
        return false;
    }

    private static Material resolveMaterial(GltcSuperMultiBlockData.PartSpec spec) {
        if (spec.material() != null) {
            return spec.material();
        }
        if (spec.slimefunId() != null) {
            SlimefunItem item = SlimefunItem.getById(IdCanonicalizer.slimefunId(spec.slimefunId()));
            if (item == null) {
                item = SlimefunItem.getById(IdCanonicalizer.canonical(spec.slimefunId()));
            }
            if (item == null) {
                item = SlimefunItem.getById(spec.slimefunId());
            }
            if (item != null) {
                ItemStack stack = item.getItem();
                if (stack != null && stack.getType() != Material.AIR) {
                    return stack.getType();
                }
            }
            return Material.STONE;
        }
        return Material.STONE;
    }

    private static void removeProjectiles(Location core) {
        if (!Bukkit.isPrimaryThread()) {
            Location copy = core.getBlock().getLocation();
            runOnMain(() -> removeProjectiles(copy));
            return;
        }

        String key = blockKey(core);
        Set<UUID> ids = DISPLAYS.remove(key);
        if (ids != null) {
            for (UUID id : ids) {
                Entity entity = Bukkit.getEntity(id);
                if (entity != null) {
                    entity.remove();
                }
            }
        }

        if (core.getWorld() == null) {
            return;
        }
        for (Entity entity : core.getWorld().getNearbyEntities(core, REFRESH_RADIUS, REFRESH_RADIUS, REFRESH_RADIUS)) {
            if (!(entity instanceof Display display)) {
                continue;
            }
            String taggedCore = display.getPersistentDataContainer().get(coreKey(), PersistentDataType.STRING);
            if (key.equals(taggedCore)) {
                display.remove();
            }
        }
    }

    private static String blockKey(Location location) {
        Location block = location.getBlock().getLocation();
        if (block.getWorld() == null) {
            return "unknown;0;0;0";
        }
        return block.getWorld().getName() + ';' + block.getBlockX() + ';' + block.getBlockY() + ';' + block.getBlockZ();
    }
}
