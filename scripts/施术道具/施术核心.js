/**
 * 施术核心（选术环）
 * - 每位玩家独立 runTaskTimer：刷粒子 + 文字跟随（不依赖 Metadata / PLUGIN 自定义字段）
 * - 蹲下右键开关只走法杖 onUse；开环站立右键选槽走 Interact
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Player = Java.type("org.bukkit.entity.Player");
var TextDisplay = Java.type("org.bukkit.entity.TextDisplay");
var Color = Java.type("org.bukkit.Color");
var Location = Java.type("org.bukkit.Location");
var Particle = Java.type("org.bukkit.Particle");
var TextAlignment = Java.type("org.bukkit.entity.TextDisplay$TextAlignment");
var Billboard = Java.type("org.bukkit.entity.Display$Billboard");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var PlayerMoveEvent = Java.type("org.bukkit.event.player.PlayerMoveEvent");
var Action = Java.type("org.bukkit.event.block.Action");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var UUID = Java.type("java.util.UUID");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";

var KEY_SPELLS = new NamespacedKey("gltc", "staff_spells");
var KEY_SELECTED = new NamespacedKey("gltc", "staff_selected");
var KEY_RING = new NamespacedKey("gltc", "spell_ring");
var KEY_OWNER = new NamespacedKey("gltc", "spell_ring_owner");

// ======================== 选术环 · 可调配置 ========================
// 改完后重载插件 / 重新加载法杖脚本生效

/** 法术槽面板中心距玩家的水平距离（格） */
var PANEL_DIST = 2.0;
/** 粒子圆环半径（格） */
var RING_RADIUS = 2.0;
/** trial_spawner_detection_ominous 点数（地面圆环） */
var OMINOUS_POINTS = 32;
/** dust_color_transition 点数（腰线圆环，越大越密） */
var DUST_POINTS = 64;
/** dust_color_transition 粒子尺寸（越大越显眼，约 0.1~2） */
var DUST_SIZE = 0.95;
/** 面板/粒子基准高度：玩家脚底 Y + 此偏移（约腰线，dust 用） */
var WAIST_OFFSET = 1.4;
/** dust 相对 WAIST_OFFSET 再下沉的格数（正数=更低） */
var RING_PARTICLE_Y_DOWN = 0.2;
/** ominous 相对脚底的高度偏移（格；负数=更低，当前约再下 1 格） */
var OMINOUS_GROUND_Y = -1.0;
/** 同排法术槽之间的横向间距（格） */
var SLOT_GAP_X = 1.35;
/** 多行法术槽时，行与行之间的竖向间距（格） */
var SLOT_GAP_Y = 0.88;
/** 法术槽每行最多几个（超出自动换行向上叠） */
var MAX_PER_ROW = 3;
/** 信息行相对面板中心再向下的距离（格） */
var INFO_BELOW = 0.85;
/** 信息行两行之间的竖向间距（格） */
var INFO_LINE_GAP = 0.32;
/** 准星判定：槽位最远可选距离（格） */
var LOOK_MAX_DIST = 5.5;
/** 准星判定：视线与槽位方向夹角余弦下限（越大越要「正对」才算瞄中，0~1） */
var LOOK_MIN_DOT = 0.82;

/**
 * 法术槽整组吸附方位（仅东南西北，不随视角微调连续转）
 * MC 坐标：+Z 南，-Z 北，+X 东，-X 西
 * fx/fz = 面板中心相对玩家的方向；rx/rz = 槽位横向展开方向
 */
var CARDINALS = [
    { name: "南", fx: 0, fz: 1, rx: 1, rz: 0 },
    { name: "西", fx: -1, fz: 0, rx: 0, rz: 1 },
    { name: "北", fx: 0, fz: -1, rx: -1, rz: 0 },
    { name: "东", fx: 1, fz: 0, rx: 0, rz: -1 }
];

/** 环粒子 A：trial_spawner_detection_ominous（服务端无此枚举时回退） */
var PARTICLE_OMINOUS = null;
try { PARTICLE_OMINOUS = Particle.valueOf("TRIAL_SPAWNER_DETECTION_OMINOUS"); } catch (eOm) {}
/** 环粒子 B：dust_color_transition 所需类与枚举 */
var DustTransitionClass = null;
try { DustTransitionClass = Java.type("org.bukkit.Particle$DustTransition"); } catch (eDt) {}
var PARTICLE_TRANSITION = null;
try { PARTICLE_TRANSITION = Particle.valueOf("DUST_COLOR_TRANSITION"); } catch (ePt) {}

/** 选术环操作冷却（开/关/选槽/左键提示），毫秒；冷却内静默跳过 */
var RING_ACTION_CD_MS = 200;
/** 同一下右键防双触发（Interact + onUse），毫秒 */
var CLICK_DEBOUNCE_MS = 250;
/** 跟随任务周期（tick）：刷粒子 + 更新文字位置；2 = 约每秒 10 次 */
var RING_TICK_PERIOD = 1;
// ======================== 配置结束 ========================

var MAGE_API = null;
var STAFF_CFG = null;
var SPELL_CFG = null;
var castCdMap = new java.util.HashMap();

/** 本 eval 上下文内状态（法杖脚本唯一加载施术核心） */
var _ringOpen = {};          // uuid -> capacity
var _ringDisplays = {};      // uuid -> TextDisplay[]
var _ringTaskIds = {};       // uuid -> taskId
var _clickDebounce = {};
var _ringActionCd = {};
var _lastMovePulse = {};     // uuid -> ms

function shouldClickDebounce(player) {
    try {
        var uuid = String(player.getUniqueId().toString());
        var now = Date.now();
        var last = _clickDebounce[uuid];
        if (last != null && now - last < CLICK_DEBOUNCE_MS) return true;
        _clickDebounce[uuid] = now;
    } catch (e) {}
    return false;
}

function isRingActionOnCd(player) {
    try {
        var uuid = String(player.getUniqueId().toString());
        var last = _ringActionCd[uuid];
        if (last != null && Date.now() - last < RING_ACTION_CD_MS) return true;
    } catch (e) {}
    return false;
}

function markRingActionCd(player) {
    try { _ringActionCd[String(player.getUniqueId().toString())] = Date.now(); } catch (e) {}
}

function makeSyncRunnable(fn) {
    try {
        return new (Java.extend(java.lang.Runnable, { run: fn }))();
    } catch (e1) {
        try {
            var BR = Java.type("org.bukkit.scheduler.BukkitRunnable");
            return new (Java.extend(BR, { run: fn }))();
        } catch (e2) {
            return fn;
        }
    }
}

function scheduleRepeating(fn, delay, period) {
    var r = makeSyncRunnable(fn);
    try {
        return Bukkit.getScheduler().runTaskTimer(PLUGIN, r, delay, period);
    } catch (e1) {
        try {
            if (r.runTaskTimer) return r.runTaskTimer(PLUGIN, delay, period);
        } catch (e2) {}
        throw e1;
    }
}

function findScriptFile(rel) {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + rel),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + rel)
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) for (var i = 0; i < list.length; i++) candidates.push(new File(list[i], "scripts/" + rel));
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) if (candidates[c].exists()) return candidates[c];
    return null;
}

function evalScriptExport(rel) {
    var file = findScriptFile(rel);
    if (!file) return null;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        return (0, eval)(code);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC施术] 加载失败 " + rel + ": " + e);
        return null;
    }
}

function loadDeps() {
    if (!MAGE_API || typeof MAGE_API.getTotalStats !== "function") MAGE_API = evalScriptExport("术士系统/核心.js");
    if (!STAFF_CFG || !STAFF_CFG.STAFF_REGISTRY) STAFF_CFG = evalScriptExport("施术道具/登记.js");
    if (!SPELL_CFG || !SPELL_CFG.SPELL_REGISTRY) SPELL_CFG = evalScriptExport("术式/登记.js");
    return !!(MAGE_API && STAFF_CFG && SPELL_CFG);
}

function getSfId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(stack);
        return sf ? sf.getId() : null;
    } catch (e) {}
    return null;
}

function isMageStaffItem(stack) {
    if (!loadDeps()) return false;
    var id = getSfId(stack);
    return !!(id && STAFF_CFG.STAFF_REGISTRY[id]);
}

function toJavaInt(n) {
    var v = Math.floor(Number(n));
    if (!isFinite(v)) v = 0;
    return java.lang.Integer.parseInt(String(v), 10);
}

function writeStaffMeta(stack, spells, selected) {
    var meta = stack.getItemMeta();
    if (!meta) return false;
    var pdc = meta.getPersistentDataContainer();
    var arr = [];
    for (var i = 0; i < spells.length; i++) arr.push(spells[i] ? String(spells[i]) : "");
    pdc.set(KEY_SPELLS, PersistentDataType.STRING, JSON.stringify(arr));
    pdc.set(KEY_SELECTED, PersistentDataType.INTEGER, toJavaInt(selected));
    stack.setItemMeta(meta);
    return true;
}

function getStaffMeta(stack) {
    if (!loadDeps() || !isMageStaffItem(stack)) return null;
    var id = getSfId(stack);
    var entry = STAFF_CFG.getStaffEntry(id);
    var cap = Number(STAFF_CFG.clampSlots(entry.spellSlots)) || 2;
    var meta = stack.getItemMeta();
    if (!meta) return null;
    var pdc = meta.getPersistentDataContainer();
    var spells = [];
    var i;
    if (pdc.has(KEY_SPELLS, PersistentDataType.STRING)) {
        try {
            var parsed = JSON.parse(pdc.get(KEY_SPELLS, PersistentDataType.STRING));
            if (parsed && parsed.length != null) {
                for (i = 0; i < cap; i++) spells.push(parsed[i] ? String(parsed[i]) : "");
            }
        } catch (e) {}
    }
    var selected = 0;
    if (spells.length != cap) {
        spells = [];
        var defaults = entry.defaultSpells || [];
        for (i = 0; i < cap; i++) spells.push(defaults[i] ? String(defaults[i]) : "");
        writeStaffMeta(stack, spells, 0);
    } else if (pdc.has(KEY_SELECTED, PersistentDataType.INTEGER)) {
        try { selected = Number(pdc.get(KEY_SELECTED, PersistentDataType.INTEGER)) || 0; } catch (e2) {}
    }
    if (selected < 0 || selected >= cap) selected = 0;
    return { staffId: id, capacity: cap, spells: spells, selected: selected, entry: entry };
}

function setSelectedSpell(player, slotIndex) {
    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) return false;
    slotIndex = Number(slotIndex);
    if (slotIndex < 0 || slotIndex >= data.capacity) return false;
    writeStaffMeta(hand, data.spells, slotIndex);
    player.getInventory().setItemInMainHand(hand);
    return true;
}

function spellPlainName(spellId) {
    if (!spellId) return "未装填";
    if (!SPELL_CFG) return String(spellId);
    return SPELL_CFG.getSpellName(spellId) || String(spellId);
}

function spellSlotLabel(spellId, isSelected, isHovered) {
    var name = spellPlainName(spellId);
    if (isSelected) return "§f[ §b◆ " + name + " §b◆ §f]";
    if (isHovered) return "§f[ §e▶ " + name + " §e◀ §f]";
    if (!spellId) return "§f[ 未装填 ]";
    return "§f[ ◇ " + name + " ◇ §f]";
}

function locXYZ(world, x, y, z) {
    return new Location(world, Number(x), Number(y), Number(z));
}

function spawnOminousDetection(world, x, y, z) {
    var loc = locXYZ(world, x, y, z);
    try {
        if (PARTICLE_OMINOUS != null) {
            world.spawnParticle(PARTICLE_OMINOUS, loc, 1, 0, 0, 0, 0);
            return;
        }
    } catch (e0) {}
    try { world.spawnParticle(Particle.SOUL_FIRE_FLAME, loc, 1, 0, 0, 0, 0); } catch (e1) {}
}

function spawnDustTransition(world, x, y, z) {
    var loc = locXYZ(world, x, y, z);
    var size = Number(DUST_SIZE) || 0.95;
    if (PARTICLE_TRANSITION != null && DustTransitionClass != null) {
        try {
            world.spawnParticle(PARTICLE_TRANSITION, loc, 1, 0, 0, 0, 0,
                new DustTransitionClass(Color.fromRGB(80, 40, 160), Color.fromRGB(200, 120, 255), size));
            return;
        } catch (e0) {}
    }
    try {
        world.spawnParticle(Particle.DUST, loc, 1, 0, 0, 0, 0,
            new Particle.DustOptions(Color.fromRGB(120, 60, 200), size));
    } catch (e1) {}
}

/**
 * ominous：贴地圆环；dust：腰线圆环且更密更大
 */
function spawnRingParticles(player) {
    var pl = player.getLocation();
    var groundY = pl.getY() + OMINOUS_GROUND_Y;
    var dustY = pl.getY() + WAIST_OFFSET - RING_PARTICLE_Y_DOWN;
    var cx = pl.getX(), cz = pl.getZ();
    var w = player.getWorld();
    var i, ang, ominPts, dustPts;

    ominPts = Number(OMINOUS_POINTS) || 32;
    for (i = 0; i < ominPts; i++) {
        ang = (i / ominPts) * Math.PI * 2.0;
        spawnOminousDetection(w, cx + Math.cos(ang) * RING_RADIUS, groundY, cz + Math.sin(ang) * RING_RADIUS);
    }

    dustPts = Number(DUST_POINTS) || 64;
    for (i = 0; i < dustPts; i++) {
        // 相对 ominous 半步错开，视觉上更均匀
        ang = ((i + 0.5) / dustPts) * Math.PI * 2.0;
        spawnDustTransition(w, cx + Math.cos(ang) * RING_RADIUS, dustY, cz + Math.sin(ang) * RING_RADIUS);
    }
}

/**
 * 法术槽：整组聚在一起，方位按视角吸附到东南西北（同扇区内不跟微调视角转）
 * 信息行：另见 infoPanelOrigin，平滑跟随视角
 */
function yawToCardinal(yawDeg) {
    var y = ((Number(yawDeg) % 360) + 360) % 360;
    // Bukkit：0=南 90=西 180=北 270=东；每 90° 一扇，边界在 45/135/225/315
    if (y >= 315 || y < 45) return CARDINALS[0];
    if (y < 135) return CARDINALS[1];
    if (y < 225) return CARDINALS[2];
    return CARDINALS[3];
}

function spellPanelOrigin(player) {
    var loc = player.getLocation();
    var c = yawToCardinal(loc.getYaw());
    return {
        x: loc.getX() + c.fx * PANEL_DIST,
        y: loc.getY() + WAIST_OFFSET,
        z: loc.getZ() + c.fz * PANEL_DIST,
        b: { fx: c.fx, fz: c.fz, rx: c.rx, rz: c.rz },
        cardinal: c.name
    };
}

/** 信息行：始终在玩家视线正前方 */
function infoPanelOrigin(player) {
    var loc = player.getLocation();
    var b = basis(loc.getYaw());
    return {
        x: loc.getX() + b.fx * PANEL_DIST,
        y: loc.getY() + WAIST_OFFSET,
        z: loc.getZ() + b.fz * PANEL_DIST,
        b: b
    };
}

function spawnText(world, loc, text, ownerUuid) {
    var td = world.spawn(loc, TextDisplay.class);
    td.setText(String(text));
    td.setAlignment(TextAlignment.CENTER);
    td.setBillboard(Billboard.CENTER);
    td.setBackgroundColor(Color.fromARGB(140, 0, 16, 48));
    td.setSeeThrough(false);
    td.setDefaultBackground(false);
    td.setViewRange(64);
    td.setGravity(false);
    td.setInvulnerable(true);
    try { td.setShadowed(false); } catch (e0) {}
    try { td.setTeleportDuration(0); } catch (e1) {}
    try { td.setInterpolationDuration(0); } catch (e2) {}
    var pdc = td.getPersistentDataContainer();
    pdc.set(KEY_RING, PersistentDataType.STRING, "1");
    pdc.set(KEY_OWNER, PersistentDataType.STRING, String(ownerUuid));
    return td;
}

function entityOf(uuidStr) {
    try {
        var e = Bukkit.getEntity(UUID.fromString(String(uuidStr)));
        if (e != null && !e.isDead()) return e;
    } catch (ex) {}
    return null;
}

function clearOwnerDisplays(world, ownerUuid) {
    if (!world) return;
    ownerUuid = String(ownerUuid);
    try {
        var it = world.getEntities().iterator();
        while (it.hasNext()) {
            var ent = it.next();
            try {
                var pdc = ent.getPersistentDataContainer();
                if (!pdc.has(KEY_RING, PersistentDataType.STRING)) continue;
                if (String(pdc.get(KEY_OWNER, PersistentDataType.STRING)) === ownerUuid) ent.remove();
            } catch (e) {}
        }
    } catch (e2) {}
}

function getOnline(uuidStr) {
    uuidStr = String(uuidStr);
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].getUniqueId().toString()) === uuidStr) return arr[i];
        }
    } catch (e) {}
    return null;
}

function requireSingleStaff(player) {
    var hand = player.getInventory().getItemInMainHand();
    if (!hand || hand.getType() === Material.AIR || !isMageStaffItem(hand)) {
        player.sendMessage(GLTC_PREFIX + "§c只有手持施术道具时才能使用。");
        return false;
    }
    if (hand.getAmount() !== 1) {
        player.sendMessage(GLTC_PREFIX + "§c请将法杖数量分离为 §e1 §c后再使用。");
        return false;
    }
    return true;
}

function isRingOpen(uuid) {
    return _ringOpen[String(uuid)] != null;
}

function cancelRingTask(uuid) {
    uuid = String(uuid);
    try {
        var tid = _ringTaskIds[uuid];
        if (tid != null) Bukkit.getScheduler().cancelTask(Number(tid));
    } catch (e) {}
    delete _ringTaskIds[uuid];
}

function startRingTask(uuid) {
    uuid = String(uuid);
    cancelRingTask(uuid);
    try {
        var task = scheduleRepeating(function() {
            try { tickOneRing(uuid); } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC选术环] tick: " + e); } catch (e2) {}
            }
        }, 0, RING_TICK_PERIOD);
        _ringTaskIds[uuid] = task.getTaskId();
    } catch (e3) {
        Bukkit.getLogger().warning("[GLTC选术环] 启动跟随任务失败: " + e3);
    }
}

function buildOffsets(capacity) {
    var offsets = [];
    capacity = Number(capacity) || 0;
    var rows = [], left = capacity;
    while (left > 0) {
        var n = Math.min(MAX_PER_ROW, left);
        rows.push(n);
        left -= n;
    }
    for (var r = 0; r < rows.length; r++) {
        var count = rows[r];
        var start = -(count - 1) * SLOT_GAP_X / 2.0;
        for (var c = 0; c < count; c++) {
            offsets.push({ right: start + c * SLOT_GAP_X, up: r * SLOT_GAP_Y });
        }
    }
    return offsets;
}

function basis(yawDeg) {
    var rad = Number(yawDeg) * Math.PI / 180.0;
    var fx = -Math.sin(rad), fz = Math.cos(rad);
    return { fx: fx, fz: fz, rx: -fz, rz: fx };
}

function slotPos(origin, offsets, i) {
    var off = offsets[i] || { right: 0, up: 0 };
    return {
        x: origin.x + origin.b.rx * off.right,
        y: origin.y + off.up,
        z: origin.z + origin.b.rz * off.right
    };
}

function infoLines(player) {
    var stats = MAGE_API.getTotalStats(player, false);
    var pp = Math.round(stats.particlePower * 1000) / 1000;
    var cur = Math.round(stats.currentParticles * 10) / 10;
    var max = Math.round(stats.pituitaryCapacity * 10) / 10;
    return [
        "§f" + player.getName() + "  §d术士等级 §f" + stats.mageLevel,
        "§b粒子强度 §f" + pp + "  §9粒子 §f" + cur + "§7/§f" + max
    ];
}

function findLookedSlot(player, capacity) {
    var eye = player.getEyeLocation();
    var dir = eye.getDirection();
    var dx = dir.getX(), dy = dir.getY(), dz = dir.getZ();
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 1e-6) return -1;
    dx /= len; dy /= len; dz /= len;
    capacity = Number(capacity) || 0;
    var origin = spellPanelOrigin(player);
    var offsets = buildOffsets(capacity);
    var best = -1, bestDot = LOOK_MIN_DOT;
    for (var i = 0; i < capacity; i++) {
        var pos = slotPos(origin, offsets, i);
        var vx = pos.x - eye.getX(), vy = pos.y - eye.getY(), vz = pos.z - eye.getZ();
        var dist = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (dist < 0.15 || dist > LOOK_MAX_DIST) continue;
        vx /= dist; vy /= dist; vz /= dist;
        var dot = vx * dx + vy * dy + vz * dz;
        if (dot > bestDot) { bestDot = dot; best = i; }
    }
    return best;
}

/** 槽位：东南西北吸附整组；信息行：平滑跟视角 */
function updateDisplays(player, data) {
    var uuid = String(player.getUniqueId().toString());
    var world = player.getWorld();
    var capacity = Number(data.capacity) || 0;
    var spellOrigin = spellPanelOrigin(player);
    var infoOrigin = infoPanelOrigin(player);
    var offsets = buildOffsets(capacity);
    var hovered = findLookedSlot(player, capacity);
    var lines = infoLines(player);
    var need = capacity + lines.length;
    var ents = _ringDisplays[uuid];
    var ok = ents != null && ents.length === need;

    if (ok) {
        for (var i = 0; i < capacity; i++) {
            var ent = ents[i];
            if (!ent || ent.isDead()) { ok = false; break; }
            var pos = slotPos(spellOrigin, offsets, i);
            try {
                try { ent.setTeleportDuration(0); } catch (e0) {}
                ent.teleport(locXYZ(world, pos.x, pos.y, pos.z));
                ent.setText(spellSlotLabel(data.spells[i], i === data.selected, i === hovered));
            } catch (e1) { ok = false; break; }
        }
    }
    if (ok) {
        for (var li = 0; li < lines.length; li++) {
            var ent2 = ents[capacity + li];
            if (!ent2 || ent2.isDead()) { ok = false; break; }
            try {
                try { ent2.setTeleportDuration(0); } catch (e2) {}
                ent2.teleport(locXYZ(world,
                    infoOrigin.x,
                    infoOrigin.y - INFO_BELOW - li * INFO_LINE_GAP,
                    infoOrigin.z));
                ent2.setText(lines[li]);
            } catch (e3) { ok = false; break; }
        }
    }
    if (!ok) rebuildDisplays(player, data);
}

function rebuildDisplays(player, data) {
    var uuid = String(player.getUniqueId().toString());
    var world = player.getWorld();
    clearOwnerDisplays(world, uuid);

    var capacity = Number(data.capacity) || 0;
    var spellOrigin = spellPanelOrigin(player);
    var infoOrigin = infoPanelOrigin(player);
    var offsets = buildOffsets(capacity);
    var hovered = findLookedSlot(player, capacity);
    var ents = [];
    var i;

    for (i = 0; i < capacity; i++) {
        var pos = slotPos(spellOrigin, offsets, i);
        ents.push(spawnText(world, locXYZ(world, pos.x, pos.y, pos.z),
            spellSlotLabel(data.spells[i], i === data.selected, i === hovered), uuid));
    }
    var lines = infoLines(player);
    for (i = 0; i < lines.length; i++) {
        ents.push(spawnText(world,
            locXYZ(world,
                infoOrigin.x,
                infoOrigin.y - INFO_BELOW - i * INFO_LINE_GAP,
                infoOrigin.z),
            lines[i], uuid));
    }
    _ringDisplays[uuid] = ents;
}

function tickOneRing(uuid) {
    uuid = String(uuid);
    if (_ringOpen[uuid] == null) {
        cancelRingTask(uuid);
        return;
    }
    var p = getOnline(uuid);
    if (p == null || !p.isOnline()) {
        closeSpellRingByUuid(uuid);
        return;
    }
    var hand = p.getInventory().getItemInMainHand();
    if (!isMageStaffItem(hand) || hand.getAmount() !== 1) {
        closeSpellRing(p);
        p.sendMessage(GLTC_PREFIX + "§e未手持法杖，选术环已关闭");
        return;
    }
    var data = getStaffMeta(hand);
    if (!data) {
        closeSpellRing(p);
        return;
    }
    p.getInventory().setItemInMainHand(hand);
    spawnRingParticles(p);
    try {
        updateDisplays(p, data);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC选术环] 更新文字失败: " + e);
        try { rebuildDisplays(p, data); } catch (e2) {}
    }
}

function closeSpellRingByUuid(uuid) {
    uuid = String(uuid);
    cancelRingTask(uuid);
    delete _ringOpen[uuid];
    delete _ringDisplays[uuid];
    delete _lastMovePulse[uuid];
    var p = getOnline(uuid);
    if (p) clearOwnerDisplays(p.getWorld(), uuid);
    else {
        try {
            var worlds = Bukkit.getWorlds();
            for (var i = 0; i < worlds.size(); i++) clearOwnerDisplays(worlds.get(i), uuid);
        } catch (e3) {}
    }
}

function closeSpellRing(player) {
    if (!player) return;
    closeSpellRingByUuid(String(player.getUniqueId().toString()));
}

function openSpellRing(player) {
    if (!loadDeps()) {
        player.sendMessage(GLTC_PREFIX + "§c施术系统未加载。");
        return false;
    }
    if (!requireSingleStaff(player)) return false;
    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) {
        player.sendMessage(GLTC_PREFIX + "§c请手持施术道具。");
        return false;
    }
    player.getInventory().setItemInMainHand(hand);

    var uuid = String(player.getUniqueId().toString());
    closeSpellRingByUuid(uuid);
    _ringOpen[uuid] = Number(data.capacity) || 0;

    try {
        rebuildDisplays(player, data);
        spawnRingParticles(player);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC选术环] 开启失败: " + e);
    }
    startRingTask(uuid);
    if (_ringTaskIds[uuid] == null) {
        Bukkit.getLogger().warning("[GLTC选术环] 跟随任务未启动，将依赖移动事件刷新");
    }

    player.sendMessage(GLTC_PREFIX + "§a选术环已开启 §7· 看向槽位右键选择 · 蹲下右键关闭");
    return true;
}

function toggleSpellRing(player) {
    if (isRingActionOnCd(player)) return isRingOpen(String(player.getUniqueId().toString()));
    markRingActionCd(player);
    var uuid = String(player.getUniqueId().toString());
    if (isRingOpen(uuid)) {
        closeSpellRing(player);
        player.sendMessage(GLTC_PREFIX + "§e选术环已关闭");
        return false;
    }
    return openSpellRing(player);
}

function trySelectLookedSlot(player) {
    if (isRingActionOnCd(player)) return true;
    if (!isRingOpen(String(player.getUniqueId().toString()))) return false;
    if (!requireSingleStaff(player)) return true;
    markRingActionCd(player);
    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) return true;
    var slot = findLookedSlot(player, data.capacity);
    if (slot < 0) {
        player.sendMessage(GLTC_PREFIX + "§c请将准星对准术式槽后再右键。");
        return true;
    }
    if (setSelectedSpell(player, slot)) {
        var data2 = getStaffMeta(player.getInventory().getItemInMainHand());
        var sid = data2 ? data2.spells[slot] : null;
        var name = spellPlainName(sid);
        if (!sid) {
            player.sendMessage(GLTC_PREFIX + "§a已成功选择空槽（未装填）！");
        } else {
            player.sendMessage(GLTC_PREFIX + "§a已成功选择" + name + "术式！");
        }
        try {
            player.playSound(player.getLocation(), "minecraft:block.note_block.pling", 1.0, 2.0);
        } catch (e) {
            try { player.playSound(player.getLocation(), "block.note_block.pling", 1.0, 2.0); } catch (e2) {}
        }
        try { rebuildDisplays(player, data2 || data); } catch (e2) {}
    }
    return true;
}

function checkCastCooldown(player, spellId, baseCd) {
    var key = player.getUniqueId().toString() + "|" + spellId;
    var now = Date.now();
    var need = MAGE_API.calcSpellCooldownMs(player, baseCd || 1000);
    var last = castCdMap.get(key);
    if (last != null && now - last < need) return { ok: false, left: need - (now - last) };
    castCdMap.put(key, now);
    return { ok: true, need: need };
}

function tryCastSelected(player, opts) {
    opts = opts || {};
    if (!loadDeps()) {
        player.sendMessage(GLTC_PREFIX + "§c施术系统未加载。");
        return { ok: false };
    }
    if (!requireSingleStaff(player)) return { ok: false };
    if (isRingOpen(String(player.getUniqueId().toString()))) return { ok: false };

    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) return { ok: false };
    player.getInventory().setItemInMainHand(hand);

    var spellId = data.spells[data.selected];
    if (!spellId) {
        player.sendMessage(GLTC_PREFIX + "§c当前槽位没有术式。");
        return { ok: false };
    }
    var spell = SPELL_CFG.getSpell(spellId);
    if (!spell || typeof spell.cast !== "function") {
        player.sendMessage(GLTC_PREFIX + "§c未知术式：" + spellId);
        return { ok: false };
    }
    var cost = spell.cost || 0;
    if (!MAGE_API.canAffordSpell(player, cost)) {
        player.sendMessage(GLTC_PREFIX + "§c粒子不足（需要 " + cost + "）。");
        return { ok: false };
    }
    var cd = checkCastCooldown(player, spellId, spell.cooldownMs || 1000);
    if (!cd.ok) {
        player.sendMessage(GLTC_PREFIX + "§c冷却中 §7(" + Math.ceil(cd.left / 100) / 10 + "s)");
        return { ok: false };
    }
    if (!MAGE_API.consumeParticles(player, cost)) {
        player.sendMessage(GLTC_PREFIX + "§c粒子不足。");
        return { ok: false };
    }
    var castOk = false;
    try { castOk = !!spell.cast(player, MAGE_API); } catch (e) {
        Bukkit.getLogger().warning("[GLTC施术] 术式异常 " + spellId + ": " + e);
    }
    if (!castOk) {
        try {
            var cur = MAGE_API.getCurrentParticles(player.getUniqueId().toString());
            MAGE_API.setCurrentParticles(player.getUniqueId().toString(), cur + cost);
        } catch (e2) {}
        player.sendMessage(GLTC_PREFIX + "§c施术失败。");
        return { ok: false };
    }
    if (typeof opts.onAfterCast === "function") {
        try { opts.onAfterCast(player, spell); } catch (e3) {}
    }
    return { ok: true, spell: spell, spellId: spellId };
}

/**
 * opts 可带 onAfterCast
 */
function handleStaffUse(player, opts) {
    if (!player || !(player instanceof Player)) return;
    if (shouldClickDebounce(player)) return;
    if (!requireSingleStaff(player)) return;
    var uuid = String(player.getUniqueId().toString());

    if (player.isSneaking()) {
        toggleSpellRing(player);
        return;
    }
    if (isRingOpen(uuid)) {
        trySelectLookedSlot(player);
        return;
    }
    tryCastSelected(player, opts || {});
}

function handleStaffLeftClick(player) {
    if (!player || !(player instanceof Player)) return false;
    if (!isMageStaffItem(player.getInventory().getItemInMainHand())) return false;
    if (!requireSingleStaff(player)) return true;
    if (isRingOpen(String(player.getUniqueId().toString()))) {
        if (isRingActionOnCd(player)) return true;
        markRingActionCd(player);
        player.sendMessage(GLTC_PREFIX + "§c选术中无法施法。§7对准槽位右键选择，蹲下右键关闭。");
    }
    return true;
}

function registerListeners() {
    try {
        if (PLUGIN.gltcSpellCoreListener != null) {
            try { PlayerInteractEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListener); } catch (e0) {}
            try { PlayerQuitEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListener); } catch (e1) {}
            try { PlayerItemHeldEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListener); } catch (e2) {}
            try { PlayerMoveEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListener); } catch (e3) {}
            PLUGIN.gltcSpellCoreListener = null;
        }
    } catch (e) {}

    // 热重载：取消所有跟随任务
    try {
        for (var uk in _ringTaskIds) {
            if (_ringTaskIds.hasOwnProperty(uk)) {
                try { Bukkit.getScheduler().cancelTask(Number(_ringTaskIds[uk])); } catch (eC) {}
            }
        }
        _ringTaskIds = {};
        _ringOpen = {};
        _ringDisplays = {};
    } catch (eR) {}

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    try { PLUGIN.gltcSpellCoreListener = listenerInstance; } catch (eL) {}

    // 右键：仅开环站立选槽；蹲下开关只走法杖 onUse（防双提示）
    Bukkit.getPluginManager().registerEvent(
        PlayerInteractEvent, listenerInstance, EventPriority.HIGH,
        function(l, event) {
            try {
                if (event.getHand() != null && event.getHand() !== EquipmentSlot.HAND) return;
                var action = event.getAction();
                var who = event.getPlayer();
                if (!(who instanceof Player)) return;
                if (!isMageStaffItem(who.getInventory().getItemInMainHand())) return;

                if (action === Action.LEFT_CLICK_AIR || action === Action.LEFT_CLICK_BLOCK) {
                    if (who.getInventory().getItemInMainHand().getAmount() !== 1
                        || isRingOpen(String(who.getUniqueId().toString()))) {
                        event.setCancelled(true);
                        handleStaffLeftClick(who);
                    }
                    return;
                }

                if (action !== Action.RIGHT_CLICK_AIR && action !== Action.RIGHT_CLICK_BLOCK) return;
                if (who.isSneaking()) return; // 开关交给 onUse

                if (isRingOpen(String(who.getUniqueId().toString()))) {
                    event.setCancelled(true);
                    handleStaffUse(who, {});
                }
            } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC施术] interact: " + e); } catch (e2) {}
            }
        }, PLUGIN
    );

    // 移动/转头时刷新文字跟随（与定时任务互补：站立靠任务刷粒子，转身靠这里跟文字）
    Bukkit.getPluginManager().registerEvent(
        PlayerMoveEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var who = event.getPlayer();
                var uuid = String(who.getUniqueId().toString());
                if (_ringOpen[uuid] == null) return;
                var to = event.getTo();
                var from = event.getFrom();
                if (to == null) return;
                if (from.getYaw() === to.getYaw() && from.getPitch() === to.getPitch()
                    && from.getX() === to.getX() && from.getY() === to.getY() && from.getZ() === to.getZ()) return;
                var now = Date.now();
                if (_lastMovePulse[uuid] != null && now - _lastMovePulse[uuid] < 40) return;
                _lastMovePulse[uuid] = now;
                tickOneRing(uuid);
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerQuitEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try { closeSpellRingByUuid(String(event.getPlayer().getUniqueId().toString())); } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerItemHeldEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                if (isRingOpen(String(p.getUniqueId().toString()))) {
                    closeSpellRing(p);
                    p.sendMessage(GLTC_PREFIX + "§e切换主手，选术环已关闭");
                }
            } catch (e) {}
        }, PLUGIN
    );
}

loadDeps();
registerListeners();

({
    handleStaffUse: handleStaffUse,
    handleStaffLeftClick: handleStaffLeftClick,
    requireSingleStaff: requireSingleStaff,
    tryCastSelected: tryCastSelected,
    toggleSpellRing: toggleSpellRing,
    openSpellRing: openSpellRing,
    closeSpellRing: closeSpellRing,
    getStaffMeta: getStaffMeta,
    setSelectedSpell: setSelectedSpell,
    writeStaffMeta: writeStaffMeta,
    isMageStaffItem: isMageStaffItem,
    isRingOpen: isRingOpen
});
