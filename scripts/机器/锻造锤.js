// ==================== FKR_锻造锤 · 运行特效 ====================
// 功能：所有【正在加工】的锻造锤，每 1 秒播放一次铁砧锻造声 +
//       铁傀儡死亡声，并播撒爆炸状的火焰粒子与烟雾。
//
// 挂载于 recipe_machines.yml → FKR_锻造锤 → script: 机器/锻造锤
// ===============================================================

var MACHINE_ID = "FKR_锻造锤";
var PROGRESS_SLOT = 11;
var EFFECT_INTERVAL_TICKS = 20;
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

// ---------- 判断机器是否正在加工 ----------
function isProcessing(loc) {
    try {
        // 优先：RSC 配方机运行态（不依赖 GUI 是否打开、进度条名称是否变化）
        var sfItem = StorageCacheUtils.getSfItem(loc);
        if (sfItem != null) {
            try {
                if (AdvancedCustomMachine.class.isInstance(sfItem)) {
                    var machine = Java.cast(sfItem, AdvancedCustomMachine);
                    var ticker = machine.getTicker();
                    if (ticker != null) {
                        var processor = ticker.getAdvancedMachineProcessor();
                        if (processor != null) {
                            var op = processor.getOperation(loc);
                            if (op != null && !op.isFinished()) return true;
                        }
                    }
                }
            } catch (eProc) {}
        }

        // 兜底：进度条槽位（空闲时显示「空闲中」）
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

function tickAllMachines() {
    try {
        if (_databaseManager == null) return;
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
                    var loc = bd.getLocation();
                    if (isProcessing(loc)) {
                        playForgeEffects(loc);
                    }
                }
            }
        }
    } catch (e) {}
}

function startForgeHammerEffects() {
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
            tickAllMachines();
        }
    });
    var taskId = Bukkit.getScheduler().scheduleSyncRepeatingTask(
        PLUGIN, task, EFFECT_INTERVAL_TICKS, EFFECT_INTERVAL_TICKS
    );
    if (taskId === -1) return false;
    setTaskIdField(taskId);
    return true;
}

startForgeHammerEffects();
