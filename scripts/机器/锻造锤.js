// ==================== FKR_锻造锤 · 运行特效 ====================
// 功能：锻造锤【正在加工】时，约每 1 秒播放铁砧锻造声 + 铁傀儡死亡声，
//       并播撒爆炸状的火焰粒子与烟雾。
//
// 挂载于 recipe_machines.yml → FKR_锻造锤 → script: 机器/锻造锤
//
// 实现：维护已登记锻造锤坐标表，仅对表内机器做加工检测（非全服 SF 扫描）。
//       onTick（若 RSC 支持）用于即时登记；定时任务负责特效与低频补扫。
// ===============================================================

var MACHINE_ID = "FKR_锻造锤";
var PROGRESS_SLOT = 11;
var EFFECT_INTERVAL_TICKS = 20;
var TASK_INTERVAL_TICKS = 20;
var RESCAN_INTERVAL_TICKS = 1200; // 60s 补扫新放置的锻造锤
var EMPTY_RESCAN_INTERVAL_TICKS = 200; // 尚未发现任何锻造锤时，较低频探测
var RANGE = 2.0;

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var StorageCacheUtils = Java.type("com.xzavier0722.mc.plugin.slimefun4.storage.util.StorageCacheUtils");
var Slimefun = Java.type("io.github.thebusybiscuit.slimefun4.implementation.Slimefun");
var AdvancedCustomMachine = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.customs.AdvancedCustomMachine");
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var RunnableImpl = Java.extend(Java.type("java.lang.Runnable"));

var EXPLOSION_PARTICLE = null;
try {
    EXPLOSION_PARTICLE = Particle.valueOf("EXPLOSION");
} catch (e) {
    try {
        EXPLOSION_PARTICLE = Particle.valueOf("EXPLOSION_LARGE");
    } catch (e2) {}
}

var _databaseManager = null;
try {
    _databaseManager = Slimefun.getDatabaseManager();
} catch (e) {
    try {
        _databaseManager = Slimefun.getInstance().getDatabaseManager();
    } catch (e2) {
        _databaseManager = null;
    }
}

var _trackedHammers = new java.util.concurrent.ConcurrentHashMap();
var _lastEffectTick = new java.util.concurrent.ConcurrentHashMap();
var _lastRescanTick = 0;

function getTaskIdField() {
    try {
        var existing = PLUGIN.gltcForgeHammerTaskId;
        if (existing != null) return Number(existing);
    } catch (e0) {}
    return null;
}

function setTaskIdField(taskId) {
    try { PLUGIN.gltcForgeHammerTaskId = taskId; } catch (e) {}
}

function locKey(loc) {
    return loc.getWorld().getUID().toString() + ":" + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ();
}

function trackHammer(loc) {
    if (loc == null) return;
    _trackedHammers.put(locKey(loc), loc);
}

function untrackHammer(loc) {
    if (loc == null) return;
    var key = locKey(loc);
    _trackedHammers.remove(key);
    _lastEffectTick.remove(key);
}

function isStillHammer(loc) {
    try {
        if (!StorageCacheUtils.isBlock(loc, MACHINE_ID)) return false;
        return true;
    } catch (e) {
        return false;
    }
}

function isProcessingByOperation(loc) {
    try {
        var sfItem = StorageCacheUtils.getSfItem(loc);
        if (sfItem == null || !AdvancedCustomMachine.class.isInstance(sfItem)) return false;
        var machine = Java.cast(sfItem, AdvancedCustomMachine);
        var ticker = machine.getTicker();
        if (ticker == null) return false;
        var processor = ticker.getAdvancedMachineProcessor();
        if (processor == null) return false;
        var op = processor.getOperation(loc);
        return op != null && !op.isFinished();
    } catch (e) {
        return false;
    }
}

function isProcessingByProgressBar(loc) {
    try {
        var menu = StorageCacheUtils.getMenu(loc);
        if (menu == null) return false;
        var item = menu.getItemInSlot(PROGRESS_SLOT);
        if (item == null || item.getType() === Material.AIR) return false;
        var meta = item.getItemMeta();
        if (meta != null && meta.hasDisplayName()) {
            if (String(meta.getDisplayName()).indexOf("空闲中") >= 0) return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

function isProcessing(loc) {
    if (isProcessingByOperation(loc)) return true;
    return isProcessingByProgressBar(loc);
}

function maybePlayEffects(loc) {
    var key = locKey(loc);
    var now = Bukkit.getCurrentTick();
    var last = _lastEffectTick.get(key);
    if (last != null && now - last < EFFECT_INTERVAL_TICKS) return;
    _lastEffectTick.put(key, now);
    playForgeEffects(loc);
}

function playForgeEffects(loc) {
    try {
        var world = loc.getWorld();
        if (world == null) return;
        var x = loc.getBlockX() + 0.5;
        var y = loc.getBlockY() + 1.0;
        var z = loc.getBlockZ() + 0.5;

        world.playSound(loc, "block.anvil.use", 1.0, 0.9);
        world.playSound(loc, "entity.iron_golem.death", 1.0, 1.0);

        if (EXPLOSION_PARTICLE != null) {
            try { world.spawnParticle(EXPLOSION_PARTICLE, x, y, z, 1, RANGE, 0.8, RANGE, 0.0); } catch (e) {}
        }
        try { world.spawnParticle(Particle.FLAME, x, y, z, 80, RANGE, 1.2, RANGE, 0.15); } catch (e) {}
        try { world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, x, y, z, 40, 0.5, 1.0, 0.5, 0.05); } catch (e) {}
    } catch (e) {}
}

function rescanForgeHammers() {
    if (_databaseManager == null) return;
    try {
        var controller = _databaseManager.getBlockDataController();
        var chunkDatas = controller.getAllLoadedChunkData();
        var cit = chunkDatas.iterator();
        while (cit.hasNext()) {
            var chunkData = cit.next();
            var blocks = chunkData.getAllBlockData();
            var bit = blocks.iterator();
            while (bit.hasNext()) {
                var bd = bit.next();
                if (bd.getSfId() === MACHINE_ID) {
                    trackHammer(bd.getLocation());
                }
            }
        }
    } catch (e) {}
}

function tickTrackedHammers() {
    var it = _trackedHammers.entrySet().iterator();
    while (it.hasNext()) {
        var entry = it.next();
        var loc = entry.getValue();
        try {
            if (!isStillHammer(loc)) {
                it.remove();
                _lastEffectTick.remove(entry.getKey());
                continue;
            }
            if (isProcessing(loc)) {
                maybePlayEffects(loc);
            }
        } catch (e) {
            it.remove();
            _lastEffectTick.remove(entry.getKey());
        }
    }
}

function runEffectCycle() {
    var now = Bukkit.getCurrentTick();
    var rescanInterval = _trackedHammers.isEmpty()
        ? EMPTY_RESCAN_INTERVAL_TICKS
        : RESCAN_INTERVAL_TICKS;
    if (_lastRescanTick === 0 || now - _lastRescanTick >= rescanInterval) {
        rescanForgeHammers();
        _lastRescanTick = now;
    }
    tickTrackedHammers();
}

function startEffectTask() {
    if (PLUGIN == null) return false;

    try {
        var oldId = getTaskIdField();
        if (oldId != null) {
            Bukkit.getScheduler().cancelTask(oldId);
            setTaskIdField(null);
        }
    } catch (e) {}

    var task = new RunnableImpl({
        run: function() {
            runEffectCycle();
        }
    });
    var taskId = Bukkit.getScheduler().scheduleSyncRepeatingTask(
        PLUGIN, task, TASK_INTERVAL_TICKS, TASK_INTERVAL_TICKS
    );
    if (taskId === -1) return false;
    setTaskIdField(taskId);

    Bukkit.getScheduler().runTaskLater(PLUGIN, new RunnableImpl({
        run: function() {
            rescanForgeHammers();
            _lastRescanTick = Bukkit.getCurrentTick();
        }
    }), 1);
    return true;
}

/**
 * RSC 配方机 tick 钩子（若版本支持）。
 * 在默认配方 tick 之后延迟检测，避免 operation 尚未创建。
 */
function onTick(location, ticker) {
    trackHammer(location);
    try {
        var loc = location;
        Bukkit.getScheduler().runTask(PLUGIN, new RunnableImpl({
            run: function() {
                try {
                    if (isProcessing(loc)) {
                        maybePlayEffects(loc);
                    }
                } catch (e) {}
            }
        }));
    } catch (e) {}
    return null;
}

function onPlace(event) {
    try {
        trackHammer(event.getBlock().getLocation());
    } catch (e) {}
}

function onBreak(event) {
    try {
        untrackHammer(event.getBlock().getLocation());
    } catch (e) {}
}

startEffectTask();
