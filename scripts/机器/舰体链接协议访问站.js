// ============================================
// 舰体链接协议访问站
// 右键机器 → 机器上方4格生成全息面板：
//   - 显示玩家当前 I/V/X 舰体货币余额
//   - 3x3 网格分页显示交易选项（上一页/下一页切换）
//   - 首行 / 最下方 / 翻页处粒子特效
// 点击交易选项 → 扣除货币 → 给予物品（默认 1个I等货币 兑换 钻石）
// 全程不使用容器/背包 GUI
// ============================================

var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var StorageCacheUtils = Java.type("com.xzavier0722.mc.plugin.slimefun4.storage.util.StorageCacheUtils");
var Bukkit = Java.type("org.bukkit.Bukkit");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var TextDisplay = Java.type("org.bukkit.entity.TextDisplay");
var Interaction = Java.type("org.bukkit.entity.Interaction");
var Color = Java.type("org.bukkit.Color");
var Location = Java.type("org.bukkit.Location");
var PlayerInteractEntityEvent = Java.type("org.bukkit.event.player.PlayerInteractEntityEvent");
var BlockBreakEvent = Java.type("org.bukkit.event.block.BlockBreakEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var TextAlignment = Java.type("org.bukkit.entity.TextDisplay$TextAlignment");
var Billboard = Java.type("org.bukkit.entity.Display$Billboard");
var Particle = Java.type("org.bukkit.Particle");
var UUID = Java.type("java.util.UUID");

// ---------------- 可调参数 ----------------
var MACHINE_ID = "skey_舰体链接协议访问站";   // 机器ID
var HOLO_OFFSET_Y = 4.0;                       // 全息面板在机器上方的高度（格）
var HOLO_LINE_GAP = 0.3;                       // 全息每行间距（格）
var HOLO_VIEW_RANGE = 32;                      // 全息可视距离（格）
var PER_PAGE = 9;                              // 每页交易项目数（3x3）
var TRADE_X_GAP = 3.0;                         // 交易项横向间距（格）

// 交易配置（可自由增删条目，超过9个自动分页）
var TRADES = [
    // ---- 权限凭证（单价购买）----
    {
        id: "perm1",
        name: "权限凭证1",
        material: "SF:skey_权限凭证1",
        amount: 1,
        cost: {I: 36, V: 0, X: 0},
        color: "55ffef"
    },
    {
        id: "perm2",
        name: "权限凭证2",
        material: "SF:skey_权限凭证2",
        amount: 1,
        cost: {I: 0, V: 24, X: 0},
        color: "ff8f4d"
    },
    {
        id: "perm3",
        name: "权限凭证3",
        material: "SF:skey_权限凭证3",
        amount: 1,
        cost: {I: 0, V: 0, X: 24},
        color: "ff3d3d"
    },
    // ---- 权限凭证（16个打包购买）----
    {
        id: "perm1_x16",
        name: "权限凭证1",
        material: "SF:skey_权限凭证1",
        amount: 16,
        cost: {I: 576, V: 0, X: 0},
        color: "55ffef"
    },
    {
        id: "perm2_x16",
        name: "权限凭证2",
        material: "SF:skey_权限凭证2",
        amount: 16,
        cost: {I: 0, V: 384, X: 0},
        color: "ff8f4d"
    },
    {
        id: "perm3_x16",
        name: "权限凭证3",
        material: "SF:skey_权限凭证3",
        amount: 16,
        cost: {I: 0, V: 0, X: 384},
        color: "ff3d3d"
    }
];

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var DATA_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/舰体货币");
if (!DATA_DIR.exists()) DATA_DIR.mkdirs();

// 实体标记 Key：用于识别/清理本机器生成的全息与热区
var HOLO_KEY = new NamespacedKey("gltc", "shiplink_holo");
var TRADE_KEY = new NamespacedKey("gltc", "shiplink_trade");
var PAGE_KEY = new NamespacedKey("gltc", "shiplink_page");
var OWNER_KEY = new NamespacedKey("gltc", "shiplink_owner");

// 玩家面板管理：playerUUID -> {key: 机器坐标, page: 当前页, task: 粒子任务}
// 挂在插件对象上跨脚本副本共享（脚本被重复加载时每份副本的局部变量互不相通）
// 惰性初始化避免 PLUGIN 未赋值问题
var _playerPanelsLocal = {};
function getPlayerPanels() {
    try {
        if (PLUGIN == null || PLUGIN.gltcShiplinkPanels == null) {
            PLUGIN.gltcShiplinkPanels = {};
        }
        return PLUGIN.gltcShiplinkPanels;
    } catch (e) {
        return _playerPanelsLocal;
    }
}
var _playerPanels = getPlayerPanels();

// 右键冷却去重：0.2秒内同一玩家的重复右键/点击只处理一次（不提示）
// 时间戳以字符串存玩家实体的 PersistentDataContainer，跨脚本副本共享、按玩家隔离、不依赖 PLUGIN
// 用 STRING 而非 LONG：GraalJS 的 Date.now() 返回 Double，直接塞 LONG 会类型不匹配
var COOLDOWN_KEY = new NamespacedKey("gltc", "shiplink_last_use");
var COOLDOWN_MS = 200;

function checkCooldown(player) {
    var pdc = player.getPersistentDataContainer();
    var now = Math.floor(Date.now());   // 整数时间戳(ms)
    var last = 0;
    if (pdc.has(COOLDOWN_KEY, PersistentDataType.STRING)) {
        try { last = parseInt(pdc.get(COOLDOWN_KEY, PersistentDataType.STRING)); } catch (e) { last = 0; }
    }
    if (now - last < COOLDOWN_MS) return false;
    pdc.set(COOLDOWN_KEY, PersistentDataType.STRING, String(now));
    return true;
}

// ---------------- 颜色工具 ----------------
function hex(color) {
    var s = "§x";
    for (var i = 0; i < color.length; i++) {
        s += "§" + color.charAt(i).toLowerCase();
    }
    return s;
}
var C_I = hex("6f7dff");      // I等货币 蓝
var C_V = hex("ff8f4d");      // V等货币 橙
var C_X = hex("ff3d3d");      // X等货币 红
var C_GOLD = hex("fff5b3");   // 描述正文 淡金
var C_TITLE = hex("2998ff");  // 标题 蓝

// 消息前缀（与舰体订单发布机一致）
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] ";

// ---------------- 舰体货币读写（与订单机一致） ----------------

// 全局共享锁（挂在插件对象上，与发布机/接收机共用），防止并发读写同一货币文件丢更新
function getCurrencyLock() {
    if (PLUGIN.gltcCurrencyLock == null) PLUGIN.gltcCurrencyLock = new java.lang.Object();
    return PLUGIN.gltcCurrencyLock;
}

function getShipCurrency(uuid) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    if (!file.exists()) return {I: 0, V: 0, X: 0};
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
        var data = JSON.parse(charBuffer.toString());
        return {I: data.I || 0, V: data.V || 0, X: data.X || 0};
    } catch (e) {
        return {I: 0, V: 0, X: 0};
    }
}

function setShipCurrency(uuid, data) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    try {
        var lines = new java.util.ArrayList();
        lines.add(JSON.stringify({I: data.I || 0, V: data.V || 0, X: data.X || 0}, null, 2));
        Files.write(file.toPath(), lines, StandardCharsets.UTF_8);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC] 保存舰体货币失败 uuid=" + uuid + ": " + e);
    }
}

// 原子执行"读-改-写"：在共享锁内读取、修改并写回，避免并发时丢更新
function modifyShipCurrency(uuid, modifier) {
    return Java.synchronized(getCurrencyLock(), function() {
        var data = getShipCurrency(uuid);
        var result = modifier(data);
        setShipCurrency(uuid, data);
        return result;
    })();
}

// ---------------- 位置工具 ----------------
function getMachineKey(loc) {
    return loc.getWorld().getName() + "," + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ();
}

function isOurMachine(loc) {
    var sf = StorageCacheUtils.getSfItem(loc);
    // Slimefun 会规范化 ID 大小写（如 skey_ 会被存为 SKEY_），用忽略大小写比较
    return sf != null && sf.getId().toUpperCase() === MACHINE_ID.toUpperCase();
}

function getTotalPages() {
    return Math.max(1, Math.ceil(TRADES.length / PER_PAGE));
}

// 获取位于 (baseX, y, baseZ) 的坐标
function atY(base, y) {
    var nl = base.clone();
    nl.setY(y);
    return nl;
}

function locXYZ(world, x, y, z) {
    return new Location(world, x, y, z);
}

// ---------------- 全息实体清理 ----------------

// 清理指定机器位置的所有本机全息/热区实体（仅在机器上方数格范围内查找）
function removeHolograms(loc) {
    var key = getMachineKey(loc);
    var world = loc.getWorld();
    var nearby = world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5);
    for (var it = nearby.iterator(); it.hasNext();) {
        var ent = it.next();
        try {
            var pdc = ent.getPersistentDataContainer();
            if (pdc.has(HOLO_KEY, PersistentDataType.STRING) &&
                pdc.get(HOLO_KEY, PersistentDataType.STRING) === key) {
                ent.remove();
            }
        } catch (e) {}
    }
}

// 强力清理：仅清除面板区域内带本机标记（HOLO_KEY）的实体（文字/热区），
// 不触碰区域内其它玩家装饰的全息文字，避免误删
function removeAllPanelEntities(loc) {
    var world = loc.getWorld();
    var nearby = world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5);
    for (var it = nearby.iterator(); it.hasNext();) {
        var ent = it.next();
        try {
            var pdc = ent.getPersistentDataContainer();
            if (pdc.has(HOLO_KEY, PersistentDataType.STRING)) {
                ent.remove();
            }
        } catch (e) {}
    }
}

function removeEntitiesByIds(ids) {
    if (ids == null) return;
    for (var i = 0; i < ids.length; i++) {
        try {
            var ent = Bukkit.getEntity(UUID.fromString(ids[i]));
            if (ent != null) ent.remove();
        } catch (e) {}
    }
}

// 取消玩家面板的粒子定时任务（不删面板记录）
function cancelPanelTask(ownerUuid) {
    var p = _playerPanels[ownerUuid];
    if (p != null && p.task != null) {
        try { p.task.cancel(); } catch (e) {}
        p.task = null;
    }
}

// 清除指定玩家打开的面板（同一玩家同时只能有一个面板）
function removePlayerPanel(ownerUuid) {
    var p = _playerPanels[ownerUuid];
    if (p == null) return;
    var oldKey = p.key;
    var entityIds = p.entityIds;
    cancelPanelTask(ownerUuid);
    removeEntitiesByIds(entityIds);
    delete _playerPanels[ownerUuid];
    if (oldKey == null) return;
    var parts = oldKey.split(",");
    if (parts.length !== 4) return;
    var world = Bukkit.getWorld(parts[0]);
    if (world == null) return;
    var loc = world.getBlockAt(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])).getLocation();
    removeAllPanelEntities(loc);
}

// 清除指定玩家的全部本机面板实体（优先按登记 UUID，再按面板位置附近兜底）
function removePlayerAllEntities(ownerUuid) {
    var p = _playerPanels[ownerUuid];
    if (p == null) return;
    removeEntitiesByIds(p.entityIds);
    if (p.key != null) {
        var parts = String(p.key).split(",");
        if (parts.length === 4) {
            var world = Bukkit.getWorld(parts[0]);
            if (world != null) {
                var loc = world.getBlockAt(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])).getLocation();
                removeAllPanelEntities(loc);
            }
        }
    }
}

// 脚本加载时清理：只清已登记面板，禁止全世界 getEntities
function removeAllHolograms() {
    var keys = [];
    for (var uuid in _playerPanels) {
        if (_playerPanels.hasOwnProperty(uuid)) keys.push(uuid);
    }
    for (var i = 0; i < keys.length; i++) {
        try { removePlayerPanel(keys[i]); } catch (e) {}
    }
    _playerPanels = {};
    try { PLUGIN.gltcShipLinkPanels = _playerPanels; } catch (e2) {}
}

// 读取指定机器位置面板的归属玩家UUID（无面板返回 null）
function getPanelOwner(loc) {
    var key = getMachineKey(loc);
    var world = loc.getWorld();
    var nearby = world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5);
    for (var it = nearby.iterator(); it.hasNext();) {
        var ent = it.next();
        try {
            var pdc = ent.getPersistentDataContainer();
            if (pdc.has(OWNER_KEY, PersistentDataType.STRING) &&
                pdc.has(HOLO_KEY, PersistentDataType.STRING) &&
                pdc.get(HOLO_KEY, PersistentDataType.STRING) === key) {
                return pdc.get(OWNER_KEY, PersistentDataType.STRING);
            }
        } catch (e) {}
    }
    return null;
}

// 判断指定机器位置是否已有面板（用于切换开关）
function hasPanel(loc) {
    var key = getMachineKey(loc);
    var world = loc.getWorld();
    var nearby = world.getNearbyEntities(loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5);
    for (var it = nearby.iterator(); it.hasNext();) {
        var ent = it.next();
        try {
            var pdc = ent.getPersistentDataContainer();
            if (pdc.has(HOLO_KEY, PersistentDataType.STRING) &&
                pdc.get(HOLO_KEY, PersistentDataType.STRING) === key) {
                return true;
            }
        } catch (e) {}
    }
    return false;
}

// ---------------- 全息生成 ----------------

function spawnTextDisplay(world, loc, text, machineKey, ownerUuid) {
    var td = world.spawn(loc, TextDisplay.class);
    td.setText(text);
    td.setAlignment(TextAlignment.CENTER);
    td.setBillboard(Billboard.CENTER);           // 始终面向玩家
    td.setBackgroundColor(Color.fromARGB(80, 0, 0, 0)); // 半透明黑底
    td.setSeeThrough(false);
    td.setDefaultBackground(false);
    td.setViewRange(HOLO_VIEW_RANGE);
    td.setGravity(false);
    td.setInvulnerable(true);
    // 打上机器标记与归属标记，确保可被清理与归属识别
    var pdc = td.getPersistentDataContainer();
    if (machineKey != null) {
        pdc.set(HOLO_KEY, PersistentDataType.STRING, machineKey);
    }
    if (ownerUuid != null) {
        pdc.set(OWNER_KEY, PersistentDataType.STRING, ownerUuid);
        var panel = _playerPanels[ownerUuid];
        if (panel != null) {
            if (panel.entityIds == null) panel.entityIds = [];
            try { panel.entityIds.push(td.getUniqueId().toString()); } catch (eId) {}
        }
    }
    return td;
}

// 生成交易选项的点击热区（Interaction 实体，贴合文字大小防误触）
function spawnTradeHitbox(world, loc, machineKey, tradeId, ownerUuid) {
    var ih = world.spawn(loc, Interaction.class);
    ih.setInteractionWidth(1.1);
    ih.setInteractionHeight(0.3);
    ih.setInvulnerable(true);
    var pdc = ih.getPersistentDataContainer();
    pdc.set(HOLO_KEY, PersistentDataType.STRING, machineKey);
    pdc.set(TRADE_KEY, PersistentDataType.STRING, tradeId);
    if (ownerUuid != null) {
        pdc.set(OWNER_KEY, PersistentDataType.STRING, ownerUuid);
        var panel = _playerPanels[ownerUuid];
        if (panel != null) {
            if (panel.entityIds == null) panel.entityIds = [];
            try { panel.entityIds.push(ih.getUniqueId().toString()); } catch (eId) {}
        }
    }
    return ih;
}

function costText(cost) {
    var parts = [];
    if (cost.I > 0) parts.push(C_I + cost.I + "个I等货币");
    if (cost.V > 0) parts.push(C_V + cost.V + "个V等货币");
    if (cost.X > 0) parts.push(C_X + cost.X + "个X等货币");
    return parts.join("§r" + C_GOLD + " + ");
}

// 短价格格式（网格内紧凑显示）："1I" / "2V+1X"
function costShort(cost) {
    var parts = [];
    if (cost.I > 0) parts.push(cost.I + "I");
    if (cost.V > 0) parts.push(cost.V + "V");
    if (cost.X > 0) parts.push(cost.X + "X");
    return parts.join("+");
}

// 在面板区域生成粒子特效（定时任务，随面板关闭而取消）
// leftX/leftZ = 玩家左侧向量，rightX/rightZ = 玩家右侧向量
// mloc = 机器方块位置，任务每轮检查面板实体是否还存在，面板被清除时自动停止（防残留）
function startParticleTask(world, mloc, bx, bz, titleY, bottomY, midY, ownerUuid, leftX, leftZ, rightX, rightZ) {
    var mKey = getMachineKey(mloc);
    var task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                // 自检：该机器位置是否还有本机面板实体，没有则自动停止粒子
                var alive = false;
                var nearby = world.getNearbyEntities(mloc.clone().add(0.5, HOLO_OFFSET_Y, 0.5), 5, 6, 5);
                for (var it = nearby.iterator(); it.hasNext();) {
                    var ent = it.next();
                    try {
                        var pdc = ent.getPersistentDataContainer();
                        if (pdc.has(HOLO_KEY, PersistentDataType.STRING) &&
                            pdc.get(HOLO_KEY, PersistentDataType.STRING) === mKey) {
                            alive = true;
                            break;
                        }
                    } catch (e) {}
                }
                if (!alive) {
                    try { task.cancel(); } catch (e) {}
                    return;
                }

                // 机器底座一圈亮蓝色环形粒子（GLOW发光粒子，24个点均匀分布在圆环上，半径1.2）
                var ringY = mloc.getY() + 0.2;
                var cx = mloc.getX() + 0.5;
                var cz = mloc.getZ() + 0.5;
                var RING_RADIUS = 1.2;
                var RING_POINTS = 24;
                for (var ri = 0; ri < RING_POINTS; ri++) {
                    var ang = (2 * Math.PI * ri) / RING_POINTS;
                    world.spawnParticle(Particle.GLOW, locXYZ(world, cx + Math.cos(ang) * RING_RADIUS, ringY, cz + Math.sin(ang) * RING_RADIUS), 1, 0, 0, 0, 0);
                }
                // 首行两侧：白色上升粒子（沿玩家左右方向，外扩0.3格至1.6）
                world.spawnParticle(Particle.END_ROD, locXYZ(world, bx + leftX * 1.6, titleY, bz + leftZ * 1.6), 1, 0, 0, 0, 0.02);
                world.spawnParticle(Particle.END_ROD, locXYZ(world, bx + rightX * 1.6, titleY, bz + rightZ * 1.6), 1, 0, 0, 0, 0.02);
                // 最下方：淡紫色魔法粒子
                world.spawnParticle(Particle.ENCHANTMENT_TABLE, locXYZ(world, bx, bottomY, bz), 1, 0.9, 0.1, 0.9, 0.05);
                // 页码条两侧：蓝色火焰粒子（沿玩家左右方向，位于页码条外侧）
                world.spawnParticle(Particle.SOUL_FIRE_FLAME, locXYZ(world, bx + leftX * 1.2, midY, bz + leftZ * 1.2), 1, 0, 0, 0, 0.02);
                world.spawnParticle(Particle.SOUL_FIRE_FLAME, locXYZ(world, bx + rightX * 1.2, midY, bz + rightZ * 1.2), 1, 0, 0, 0, 0.02);
            } catch (e) {}
        }
    })), 0, 5);

    var p = _playerPanels[ownerUuid];
    if (p != null) {
        p.task = task;
    }
}

// 在机器上方4格生成完整全息面板（支持分页）
function showAccessPanel(loc, player, page) {
    var ownerUuid = player.getUniqueId().toString();
    var totalPages = getTotalPages();
    if (page == null) page = 0;
    if (page < 0) page = 0;
    if (page > totalPages - 1) page = totalPages - 1;

    // 同一玩家同时只能打开一个面板
    removePlayerPanel(ownerUuid);

    removeHolograms(loc);
    var world = loc.getWorld();
    var key = getMachineKey(loc);
    var data = getShipCurrency(ownerUuid);

    // 记录该玩家的面板位置与页码（先建记录再生成，便于登记 entityIds）
    _playerPanels[ownerUuid] = {key: key, page: page, task: null, entityIds: []};

    // 面板起始位置：机器方块中心上方 HOLO_OFFSET_Y 格
    var base = loc.clone().add(0.5, HOLO_OFFSET_Y, 0.5);
    var bx = base.getX();
    var bz = base.getZ();
    var y = base.getY();
    var titleY = y;

    // 固定按机器自身朝向计算左右向量（机器方块为 lectern，有 facing 状态）
    // 方向约定：机器朝向为"前方"，面板正对机器前方
    // 通过 BlockData 的 Directional 接口读取朝向，避免依赖 CraftBlock 特有方法
    var BlockFace = Java.type("org.bukkit.block.BlockFace");
    var dirX = 0, dirZ = 0;
    try {
        var blockData = loc.getBlock().getBlockData();
        if (blockData instanceof Java.type("org.bukkit.block.data.Directional")) {
            var facing = blockData.getFacing();
            switch (facing) {
                case BlockFace.NORTH: dirZ = -1; break;  // 面向北
                case BlockFace.SOUTH: dirZ = 1;  break;  // 面向南
                case BlockFace.EAST:  dirX = 1;  break;  // 面向东
                case BlockFace.WEST:  dirX = -1; break;  // 面向西
                default: dirZ = -1; break;               // 默认北
            }
        } else {
            dirZ = -1; // 非朝向方块，默认北
        }
    } catch (e) {
        dirZ = -1; // 读取失败，默认北
    }
    var leftX = -dirZ;              // 左侧向量（垂直于前方，朝左）
    var leftZ = dirX;
    var rightX = dirZ;              // 右侧向量
    var rightZ = -dirX;

    // 标题行
    spawnTextDisplay(world, atY(base, y), C_TITLE + "§l✦ 舰体链接协议访问站 ✦", key, ownerUuid);
    y -= HOLO_LINE_GAP;

    // 欢迎行（单独一行显示归属玩家）
    var ownerName = player.getName();
    spawnTextDisplay(world, atY(base, y), C_GOLD + "欢迎您！工程师 " + ownerName, key, ownerUuid);
    y -= HOLO_LINE_GAP;

    // 余额区
    var lineI = "  " + C_I + "◆ I等货币 " + C_GOLD + ": §f" + data.I;
    var lineV = "  " + C_V + "◆ V等货币 " + C_GOLD + ": §f" + data.V;
    var lineX = "  " + C_X + "◆ X等货币 " + C_GOLD + ": §f" + data.X;
    spawnTextDisplay(world, atY(base, y), lineI, key, ownerUuid);
    y -= HOLO_LINE_GAP;
    spawnTextDisplay(world, atY(base, y), lineV, key, ownerUuid);
    y -= HOLO_LINE_GAP;
    spawnTextDisplay(world, atY(base, y), lineX, key, ownerUuid);
    y -= HOLO_LINE_GAP;

    // 分隔线
    spawnTextDisplay(world, atY(base, y), "§8§m                      §r", key, ownerUuid);
    y -= HOLO_LINE_GAP;

    // ---- 交易区 3x3 网格 ----
    var startIdx = page * PER_PAGE;
    var endIdx = Math.min(startIdx + PER_PAGE, TRADES.length);

    // 三行交易项 y 坐标
    var rowY1 = y;
    var rowY2 = y - HOLO_LINE_GAP;
    var rowY3 = y - HOLO_LINE_GAP * 2;
    var rowYs = [rowY1, rowY2, rowY3];

    for (var i = startIdx; i < endIdx; i++) {
        var t = TRADES[i];
        var c = hex(t.color);
        var idxInPage = i - startIdx;
        var row = Math.floor(idxInPage / 3);
        var col = idxInPage % 3;
        // 交易项横向位置沿玩家左右方向排列
        var off = (col - 1) * TRADE_X_GAP;
        var x = bx + leftX * off;
        var z = bz + leftZ * off;
        var yy = rowYs[row];

        // 格式：物品名 x1 ◆ 价格（括号与◆用对应货币颜色）
        var line = c + "§l[ §f" + t.name + " §8x" + t.amount + " §r" + c + " ◆ " + costShort(t.cost) + " " + c + "]";
        spawnTextDisplay(world, locXYZ(world, x, yy, z), line, key, ownerUuid);
        // 交易项点击热区
        spawnTradeHitbox(world, locXYZ(world, x, yy - 0.05, z), key, t.id, ownerUuid);
    }

    // ---- 底部页码条（显示所有页码，点击跳转；当前页高亮）----
    var bottomY = rowY3 - HOLO_LINE_GAP;
    var pageY = bottomY - HOLO_LINE_GAP;

    // 页码条：单一交互区，显示 [上一页] 当前页/总页数 [下一页]，点击整体循环切换
    var pageText = "§8[ " + C_TITLE + "◀ §r§8| " + C_GOLD + "第 " + (page + 1) + "/" + totalPages + " 页 §r§8| " + C_TITLE + "▶ §8]";
    spawnTextDisplay(world, atY(base, pageY), pageText, key, ownerUuid);

    // 单一可交互热区：覆盖整个页码条，每次点击切到下一页（循环）
    var hitboxW = 1.6 + totalPages * 0.35;
    var pih = world.spawn(locXYZ(world, bx, pageY - 0.05, bz), Interaction.class);
    pih.setInteractionWidth(hitboxW);
    pih.setInteractionHeight(0.35);
    pih.setInvulnerable(true);
    var ppdc = pih.getPersistentDataContainer();
    ppdc.set(HOLO_KEY, PersistentDataType.STRING, key);
    ppdc.set(PAGE_KEY, PersistentDataType.STRING, "toggle");
    if (ownerUuid != null) {
        ppdc.set(OWNER_KEY, PersistentDataType.STRING, ownerUuid);
    }

    // 提示行
    spawnTextDisplay(world, atY(base, bottomY), "§8§o点击交易项兑换 · 点击下方页码条切换页面", key, ownerUuid);

    // 粒子特效（首行 / 最下方 / 页码处）
    startParticleTask(world, loc, bx, bz, titleY, bottomY, pageY, ownerUuid, leftX, leftZ, rightX, rightZ);
}

// ---------------- 交易执行 ----------------

function findTrade(tradeId) {
    for (var i = 0; i < TRADES.length; i++) {
        if (TRADES[i].id === tradeId) return TRADES[i];
    }
    return null;
}

function buildReward(trade) {
    if (trade.material.indexOf("SF:") === 0) {
        var id = trade.material.substring(3);
        // Slimefun 内部 ID 为大小写规范化存储（skey_ → SKEY_），先原样再试大写
        var sf = SlimefunItem.getById(id);
        if (sf == null) sf = SlimefunItem.getById(id.toUpperCase());
        if (sf == null) return null;
        var it = sf.getItem().clone();
        it.setAmount(trade.amount);
        return it;
    }
    var mat = Material.getMaterial(trade.material);
    if (mat == null) return null;
    return new ItemStack(mat, trade.amount);
}

function doTrade(player, trade) {
    var uuid = player.getUniqueId().toString();

    var reward = buildReward(trade);
    if (reward == null) {
        player.sendMessage(GLTC_PREFIX + "§c兑换物品配置错误，请联系管理员。");
        return;
    }

    // 原子执行"余额校验 + 扣款"，避免并发点击时重复扣减/透支
    var data = modifyShipCurrency(uuid, function(d) {
        if (d.I < (trade.cost.I || 0) ||
            d.V < (trade.cost.V || 0) ||
            d.X < (trade.cost.X || 0)) {
            return null;
        }
        d.I -= (trade.cost.I || 0);
        d.V -= (trade.cost.V || 0);
        d.X -= (trade.cost.X || 0);
        return d;
    });

    if (data == null) {
        player.sendMessage(GLTC_PREFIX + "§c货币不足！需要 " + C_GOLD + costText(trade.cost) + "§r§c。");
        player.playSound(player.getLocation(), "block.note_block.bass", 1.0, 0.6);
        return;
    }

    // 发物品（背包满则掉落）
    var leftover = player.getInventory().addItem(reward);
    if (!leftover.isEmpty()) {
        var dropIt = leftover.values().iterator();
        while (dropIt.hasNext()) {
            player.getWorld().dropItemNaturally(player.getLocation(), dropIt.next());
        }
    }

    // 特效
    var loc = player.getLocation();
    try { loc.getWorld().spawnParticle(Particle.HAPPY_VILLAGER, loc, 15, 0.4, 0.4, 0.4, 0.2); } catch (e) {}
    try { loc.getWorld().playSound(loc, "entity.experience_orb.pickup", 0.8, 1.5); } catch (e) {}

    // 交易后刷新面板余额
    var p = _playerPanels[uuid];
    if (p != null) {
        var parts = p.key.split(",");
        var world = Bukkit.getWorld(parts[0]);
        if (world != null) {
            var mloc = world.getBlockAt(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])).getLocation();
            showAccessPanel(mloc, player, p.page);
        }
    }

    player.sendMessage(GLTC_PREFIX + "§a兑换成功！获得 §f" + trade.name + " x" + trade.amount +
        "§r" + C_GOLD + "，剩余 I等货币: §f" + data.I + C_GOLD + " V等货币: §f" + data.V + C_GOLD + " X等货币: §f" + data.X);
}

// ---------------- 事件监听 ----------------
// 监听器实例挂在插件对象上（跨脚本加载共享），注册前先注销旧的，
// 避免脚本被重复加载时 Bukkit 监听器叠加注册导致一次点击触发多次。

function registerListeners() {
    // 若之前已注册过（脚本被重复加载），先注销旧监听器
    if (PLUGIN.gltcShiplinkRegistered === true) {
        try {
            PlayerInteractEntityEvent.getHandlerList().unregister(PLUGIN.gltcShiplinkListener);
            BlockBreakEvent.getHandlerList().unregister(PLUGIN.gltcShiplinkListener);
        } catch (e) {}
    }

    var listenerInstance = new (Java.extend(Listener, {}))();
    PLUGIN.gltcShiplinkListener = listenerInstance;
    PLUGIN.gltcShiplinkRegistered = true;

    // 点击 Interaction 热区 → 交易或翻页
    Bukkit.getPluginManager().registerEvent(
        PlayerInteractEntityEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            try {
                var ent = event.getRightClicked();
                if (ent == null) return;
                var pdc = ent.getPersistentDataContainer();
                var who = event.getPlayer();
                if (!(who instanceof Player)) return;
                event.setCancelled(true);

                // 冷却去重：0.2秒内同一玩家的重复点击只处理一次（不提示）
                if (!checkCooldown(who)) return;

                // 归属判断：若面板属于其他玩家 → 提示并关闭，不执行操作
                if (pdc.has(OWNER_KEY, PersistentDataType.STRING)) {
                    var ownerUuid = pdc.get(OWNER_KEY, PersistentDataType.STRING);
                    var myUuid = who.getUniqueId().toString();
                    if (ownerUuid !== myUuid) {
                        var ownerName = Bukkit.getOfflinePlayer(ownerUuid).getName();
                        if (ownerName == null) ownerName = "未知玩家";
                        // 关闭此面板（清除区域全部全息文字 + 取消粒子任务）
                        var loc = ent.getLocation();
                        removeAllPanelEntities(loc);
                        cancelPanelTask(ownerUuid);
                        who.sendMessage(GLTC_PREFIX + "§c此面板属于玩家 " + ownerName + "，已关闭，请右键机器重新打开自己的面板");
                        return;
                    }
                }

                // 页码条切换（PAGE_KEY == "toggle"，每次点击循环切到下一页）
                if (pdc.has(PAGE_KEY, PersistentDataType.STRING)) {
                    var action = pdc.get(PAGE_KEY, PersistentDataType.STRING);
                    if (action !== "toggle") return;
                    var mKey = pdc.get(HOLO_KEY, PersistentDataType.STRING);
                    if (mKey == null) return;
                    var parts = mKey.split(",");
                    if (parts.length !== 4) return;
                    var world = Bukkit.getWorld(parts[0]);
                    if (world == null) return;
                    var mloc = world.getBlockAt(parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3])).getLocation();
                    var p = _playerPanels[ownerUuid];
                    var curPage = (p != null) ? p.page : 0;
                    var totalPages = getTotalPages();
                    var newPage = ((curPage + 1) % totalPages + totalPages) % totalPages;
                    showAccessPanel(mloc, who, newPage);
                    who.sendMessage(GLTC_PREFIX + "§a第 " + (newPage + 1) + "/" + totalPages + " 页");
                    return;
                }

                // 交易项
                if (pdc.has(TRADE_KEY, PersistentDataType.STRING)) {
                    var tradeId = pdc.get(TRADE_KEY, PersistentDataType.STRING);
                    var trade = findTrade(tradeId);
                    if (trade == null) {
                        who.sendMessage(GLTC_PREFIX + "§c交易配置错误");
                        return;
                    }
                    doTrade(who, trade);
                }
            } catch (e) {
                print("[舰体链接协议] 点击错误: " + e);
            }
        }, PLUGIN
    );

    // 机器被破坏 → 清理面板区域内全部本机全息/热区实体
    // 破坏事件中 Slimefun 缓存数据可能已被移除导致 isOurMachine 失效，
    // 因此同时用实体标记兜底（hasPanel），保证面板残留也能被清除
    Bukkit.getPluginManager().registerEvent(
        BlockBreakEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            try {
                var loc = event.getBlock().getLocation();
                if (isOurMachine(loc) || hasPanel(loc)) {
                    var owner = getPanelOwner(loc);
                    removeAllPanelEntities(loc);
                    // 取消该玩家面板的粒子任务（含删记录）
                    if (owner != null) cancelPanelTask(owner);
                }
            } catch (e) {}
        }, PLUGIN
    );
}

// ---------------- 机器交互入口（与舰体订单机一致） ----------------

// 从右键事件中获取被点击的方块（兼容 Optional<Block> 与直接 Block 两种返回）
function getClickedBlock(event) {
    try {
        var c = event.getClickedBlock();
        if (c == null) return null;
        // 若为 Optional
        if (typeof c.isPresent === 'function') {
            return c.isPresent() ? c.get() : null;
        }
        // 若直接是 Block
        return c;
    } catch (e) {
        return null;
    }
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    // 冷却去重：0.2秒内同一玩家的重复右键只处理一次（不提示）
    if (!checkCooldown(player)) return;

    var block = getClickedBlock(event);
    if (block == null) {
        player.sendMessage(GLTC_PREFIX + "§c未获取到点击方块");
        return;
    }
    var loc = block.getLocation();
    if (!isOurMachine(loc)) {
        player.sendMessage(GLTC_PREFIX + "§c不是本机器: " + loc.getBlockX() + "," + loc.getBlockY() + "," + loc.getBlockZ());
        return;
    }

    try {
        var myUuid = player.getUniqueId().toString();
        var owner = getPanelOwner(loc);

        // 已有面板
        if (owner != null) {
            // 若面板属于当前玩家 → 关闭（切换开关）
            if (owner === myUuid) {
                removeAllPanelEntities(loc);
                cancelPanelTask(myUuid);
                try { player.playSound(loc.clone().add(0.5, 0.5, 0.5), "block.beacon.deactivate", 1.0, 1.0); } catch (e) {}
                player.sendMessage(GLTC_PREFIX + "§7面板已关闭");
                return;
            }
            // 若面板属于其他玩家 → 提示归属并关闭，让玩家重新打开自己的
            var ownerName = Bukkit.getOfflinePlayer(owner).getName();
            if (ownerName == null) ownerName = "未知玩家";
            removeAllPanelEntities(loc);
            cancelPanelTask(owner);
            try { player.playSound(loc.clone().add(0.5, 0.5, 0.5), "block.beacon.deactivate", 1.0, 1.0); } catch (e) {}
            player.sendMessage(GLTC_PREFIX + "§c此面板属于玩家 " + ownerName + "，已关闭，请重新打开自己的面板");
        }

        // 打开自己的面板
        showAccessPanel(loc, player, 0);
        try { player.playSound(loc.clone().add(0.5, 0.5, 0.5), "block.beacon.activate", 1.0, 1.0); } catch (e) {}
        player.sendMessage(GLTC_PREFIX + "§a面板已打开");
    } catch (e) {
        player.sendMessage(GLTC_PREFIX + "§c面板生成错误: " + e);
        print("[舰体链接协议] 面板错误: " + e);
    }
}

// ---------------- 脚本加载 ----------------
// RSC 在异步线程（RSC-Load-Thread）加载脚本，而 getEntities / registerEvent 等
// 是主线程 API，必须延迟到主线程执行，否则触发 AsyncCatcher 错误。
// 用 Java.extend(Runnable) 创建显式 Runnable，避免 runTask 重载歧义。
var RunnableImpl = Java.extend(Java.type('java.lang.Runnable'));
var initAccessStation = new RunnableImpl({
    run: function() {
        removeAllHolograms();
        registerListeners();
    }
});
Bukkit.getScheduler().runTask(PLUGIN, initAccessStation);
