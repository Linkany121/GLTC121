// ==================== FKR_锻造锤 · 运行特效 ====================
// 功能：所有【正在加工】的锻造锤，每 1 秒播放一次铁砧锻造声 +
//       铁傀儡死亡声，并播撒爆炸状的火焰粒子与烟雾。
//
// 方案：登记制 —— 周期性轻量扫描同步“加工中”位置集合，
//       特效 tick 只遍历该集合（避免每次扫全部已加载 SF 方块）。
// ===============================================================

var MACHINE_ID = "FKR_锻造锤";  // 目标机器ID
var PROGRESS_SLOT = 11;          // 机器GUI中的进度条槽位（对应菜单 progressbar）
var EFFECT_INTERVAL_TICKS = 20;  // 特效播放间隔（20tick = 1秒）
var RESCAN_EVERY = 5;            // 每 N 次特效 tick 做一次全量同步
var RANGE = 2.0;                 // 粒子散落范围

// ---------- 常用对象 ----------
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var StorageCacheUtils = Java.type("com.xzavier0722.mc.plugin.slimefun4.storage.util.StorageCacheUtils");
var Slimefun = Java.type("io.github.thebusybiscuit.slimefun4.implementation.Slimefun");
var PLUGIN = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
var RunnableImpl = Java.extend(Java.type("java.lang.Runnable"));

// 爆炸粒子枚举：1.21 起为 EXPLOSION，旧版为 EXPLOSION_LARGE，防御式获取
var EXPLOSION_PARTICLE = null;
try {
    EXPLOSION_PARTICLE = Particle.valueOf("EXPLOSION");
} catch (e) {
    try {
        EXPLOSION_PARTICLE = Particle.valueOf("EXPLOSION_LARGE");
    } catch (e2) {}
}

// ---------- 获取 Slimefun 数据库管理器（兼容静态/实例两种写法） ----------
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

function getActiveMap() {
    if (PLUGIN.gltcForgeActive == null) {
        PLUGIN.gltcForgeActive = new java.util.concurrent.ConcurrentHashMap();
    }
    return PLUGIN.gltcForgeActive;
}

function locKey(loc) {
    return loc.getWorld().getName() + "," + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ();
}

function locFromKey(key) {
    try {
        var parts = String(key).split(",");
        if (parts.length !== 4) return null;
        var world = Bukkit.getWorld(parts[0]);
        if (world == null) return null;
        return world.getBlockAt(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])).getLocation();
    } catch (e) {
        return null;
    }
}

// ---------- 判断机器是否正在加工 ----------
function isProcessing(loc) {
    try {
        var menu = StorageCacheUtils.getMenu(loc);
        if (menu == null) return false;
        var item = menu.getItemInSlot(PROGRESS_SLOT);
        if (item == null || item.getType() === Material.AIR) return false;
        // 空闲时进度条槽显示 "空闲中"，加工时会被替换为进度显示
        var meta = item.getItemMeta();
        if (meta != null && meta.hasDisplayName()) {
            if (meta.getDisplayName().indexOf("空闲中") >= 0) return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// ---------- 播放锻造特效 ----------
function playForgeEffects(loc) {
    try {
        var world = loc.getWorld();
        if (world == null) return;
        var x = loc.getBlockX() + 0.5;
        var y = loc.getBlockY() + 1.0;
        var z = loc.getBlockZ() + 0.5;

        // 铁砧锻造声 + 铁傀儡死亡声
        world.playSound(loc, "block.anvil.use", 1.0, 0.9);
        world.playSound(loc, "entity.iron_golem.death", 1.0, 1.0);

        // 爆炸状火焰粒子与烟雾（每个粒子独立容错，避免单个失败影响整体）
        if (EXPLOSION_PARTICLE != null) {
            try { world.spawnParticle(EXPLOSION_PARTICLE, x, y, z, 1, RANGE, 0.8, RANGE, 0.0); } catch (e) {}
        }
        try { world.spawnParticle(Particle.FLAME, x, y, z, 80, RANGE, 1.2, RANGE, 0.15); } catch (e) {}
        try { world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, x, y, z, 40, 0.5, 1.0, 0.5, 0.05); } catch (e) {}
    } catch (e) {}
}

function rescanActiveMachines() {
    var active = getActiveMap();
    active.clear();
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
                        active.put(locKey(loc), true);
                    }
                }
            }
        }
    } catch (e) {}
}

// ---------- 主循环：登记集合上播放特效；每隔 RESCAN_EVERY 次同步加工中列表 ----------
function tickAllMachines() {
    try {
        if (PLUGIN.gltcForgeTickCount == null) PLUGIN.gltcForgeTickCount = 0;
        PLUGIN.gltcForgeTickCount = Number(PLUGIN.gltcForgeTickCount) + 1;
        var active = getActiveMap();
        if (PLUGIN.gltcForgeTickCount % RESCAN_EVERY === 1 || active.isEmpty()) {
            rescanActiveMachines();
            active = getActiveMap();
        }
        var keys = active.keySet().toArray();
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var loc = locFromKey(key);
            if (loc == null || !isProcessing(loc)) {
                active.remove(key);
                continue;
            }
            playForgeEffects(loc);
        }
    } catch (e) {}
}

// ---------- 启动 ----------
function start() {
    // 重复加载（/rsc reload）时先取消旧任务，避免叠加
    try {
        if (PLUGIN.forgeHammerTaskId != null) {
            Bukkit.getScheduler().cancelTask(PLUGIN.forgeHammerTaskId);
            PLUGIN.forgeHammerTaskId = null;
        }
    } catch (e) {}

    var task = new RunnableImpl({
        run: function() {
            tickAllMachines();
        }
    });
    var taskId = Bukkit.getScheduler().scheduleSyncRepeatingTask(PLUGIN, task, EFFECT_INTERVAL_TICKS, EFFECT_INTERVAL_TICKS);
    try {
        PLUGIN.forgeHammerTaskId = taskId;
    } catch (e) {}
}

start();
