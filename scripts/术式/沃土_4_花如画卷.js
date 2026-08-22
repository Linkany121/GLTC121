/**
 * 术式：花如画卷 —— 4环 · 沃土奥法流派
 * 右键：3 秒内每秒召唤 2 朵花环绕；左键：投出全部并自动追踪敌人
 * ID：VASA_花如画卷
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");
var JString = Java.type("java.lang.String");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

function loadUtil() {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/术式/_工具.js"),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/术式/_工具.js")
    ];
    for (var c = 0; c < candidates.length; c++) {
        if (!candidates[c].exists()) continue;
        try {
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(candidates[c].toPath()))).toString();
            return (0, eval)(code);
        } catch (e) {}
    }
    return null;
}

var UTIL = loadUtil();

// ======================== 花如画卷 · 可调配置 ========================
// 改完后重载附属 / 重新加载术式脚本生效

/** 物品 / 登记 ID */
var SPELL_ID = "VASA_花如画卷";
/** 显示名（播报 / 登记） */
var SPELL_NAME = "花如画卷";
/** 环数 */
var SPELL_RING = 4;
/** 粒子消耗 */
var SPELL_COST = 16;
/** 冷却（毫秒） */
var SPELL_COOLDOWN_MS = 12000;
/** 伤害系数（最终 = 粒子强度 × 系数 × GLI） */
var SPELL_COEFFICIENT = 1.5;

/** 召唤阶段时长（秒） */
var SUMMON_SECONDS = 3;
/** 每秒召唤朵数；总数 = SUMMON_SECONDS × FLOWERS_PER_SEC */
var FLOWERS_PER_SEC = 2;
/** 环绕半径（格） */
var ORBIT_RADIUS = 1.6;
/** 环绕相对脚底高度（格） */
var ORBIT_HEIGHT = 1.05;
/** 未投出时会话超时（tick）；160 = 8 秒后自动消散 */
var SESSION_TIMEOUT_TICKS = 160;
/** 投出后飞行速度（格/秒） */
var FLY_SPEED = 20;
/** 投出后最大飞行距离（格）；超时消散 */
var MAX_DISTANCE = 36;
/** 投出触碰生物的判定半宽（格） */
var HIT_HALF = 0.5;
/** 自动索敌范围（格） */
var TRACK_RANGE = 18;
/** 追踪转向插值（0~1，越大越跟手） */
var HOMING = 0.35;
/** 左键投出防抖（毫秒）；实际门闩在 _工具.js LEFT_CLICK_GATE_MS */
var LAUNCH_GATE_MS = 250;

/** 环绕 / 投出可选花材质名 */
var FLOWER_NAME_CANDIDATES = [
    "POPPY", "DANDELION", "BLUE_ORCHID", "ALLIUM", "AZURE_BLUET",
    "RED_TULIP", "ORANGE_TULIP", "WHITE_TULIP", "PINK_TULIP",
    "OXEYE_DAISY", "CORNFLOWER", "LILY_OF_THE_VALLEY"
];
// ======================== 配置结束（以下勿随意改） ========================

var TOTAL_FLOWERS = SUMMON_SECONDS * FLOWERS_PER_SEC;
var SPAWN_INTERVAL_TICKS = Math.max(1, Math.floor(20 / FLOWERS_PER_SEC));
var SPEED_PER_TICK = FLY_SPEED / 20.0;
var MAX_FLY_TICKS = Math.ceil(MAX_DISTANCE / SPEED_PER_TICK);
var ORBIT_SPIN = 0.18;
var ORBIT_BOB = 0.12;
var DISPLAY_SCALE = 0.85;
var SIG_LCLICK = "lclick";

function resolveMaterial(name) {
    try {
        var m = Material.matchMaterial(name);
        if (m != null && m !== Material.AIR) return m;
    } catch (e0) {}
    try {
        var m2 = Material.getMaterial(name);
        if (m2 != null && m2 !== Material.AIR) return m2;
    } catch (e1) {}
    try {
        var m3 = Material.valueOf(name);
        if (m3 != null && m3 !== Material.AIR) return m3;
    } catch (e2) {}
    return null;
}

function buildFlowerPool() {
    var pool = [];
    for (var i = 0; i < FLOWER_NAME_CANDIDATES.length; i++) {
        var mat = resolveMaterial(FLOWER_NAME_CANDIDATES[i]);
        if (mat != null) pool.push(mat);
    }
    if (pool.length === 0) {
        var fallback = resolveMaterial("POPPY") || resolveMaterial("RED_ROSE") || resolveMaterial("DANDELION");
        if (fallback != null) pool.push(fallback);
    }
    return pool;
}

var FLOWER_POOL = buildFlowerPool();

// ---------- 跨脚本共享表（键统一 java.lang.String） ----------

function uuidKey(uuid) {
    return JString.valueOf(String(uuid));
}

function sharedMap(field) {
    try {
        var existing = PLUGIN[field];
        if (existing != null && (existing instanceof java.util.concurrent.ConcurrentHashMap)) {
            return existing;
        }
    } catch (e0) {}
    var map = new java.util.concurrent.ConcurrentHashMap();
    try { PLUGIN[field] = map; } catch (e1) {}
    return map;
}

/** 环绕会话：uuid -> orbit session */
function sessionStore() {
    return sharedMap("gltcFlowerScrollSessions");
}

/** 投出波次：uuid -> { alive, sessionToken, projectiles[] } */
function flyingStore() {
    return sharedMap("gltcFlowerScrollFlying");
}

// ---------- 会话 API ----------

function getSessionApi() {
    try {
        if (PLUGIN.gltcSpellSessionApi != null) return PLUGIN.gltcSpellSessionApi;
    } catch (e0) {}
    return UTIL && UTIL.spellSession ? UTIL.spellSession : null;
}

function findOnline(uuid) {
    if (UTIL && UTIL.findOnlineByUuid) {
        try { return UTIL.findOnlineByUuid(uuid); } catch (eU) {}
    }
    uuid = String(uuid);
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].getUniqueId().toString()) === uuid) return arr[i];
        }
    } catch (e) {}
    return null;
}

function getOrbitSession(uuid) {
    uuid = uuidKey(uuid);
    try { return sessionStore().get(uuid); } catch (e0) { return null; }
}

// ---------- 展示体 ----------

function randomFlowerMat() {
    if (!FLOWER_POOL || FLOWER_POOL.length === 0) {
        return resolveMaterial("POPPY") || Material.STONE;
    }
    var mat = FLOWER_POOL[Math.floor(Math.random() * FLOWER_POOL.length)];
    return mat != null ? mat : resolveMaterial("POPPY") || Material.STONE;
}

function spawnDisplay(world, loc, mat) {
    if (mat == null) mat = randomFlowerMat();
    if (UTIL && UTIL.spawnFlyingItemDisplay) {
        return UTIL.spawnFlyingItemDisplay(world, loc, mat, DISPLAY_SCALE);
    }
    Bukkit.getLogger().warning("[GLTC花如画卷] 工具未加载，无法生成展示实体");
    return null;
}

function displayAlive(display) {
    if (!display) return false;
    if (UTIL && UTIL.isFlyingDisplayAlive) {
        try { return UTIL.isFlyingDisplayAlive(display); } catch (eU) {}
    }
    try { return display.entity != null && !display.entity.isDead(); } catch (e) { return false; }
}

function moveDisplay(display, loc) {
    if (!displayAlive(display) || loc == null) return;
    try { display.lastLoc = loc.clone(); } catch (e0) {}
    if (UTIL && UTIL.moveFlyingDisplay) {
        UTIL.moveFlyingDisplay(display, loc);
        return;
    }
    try { display.entity.teleport(loc); } catch (e) {}
}

function removeDisplay(display) {
    if (!display) return;
    if (UTIL && UTIL.removeFlyingDisplay) {
        UTIL.removeFlyingDisplay(display);
        return;
    }
    try {
        if (display.entity != null && !display.entity.isDead()) display.entity.remove();
    } catch (e) {}
}

/** 投掷前对齐展示体根坐标，避免 getLocation 仍是旧锚点 */
function reanchorDisplay(display, loc) {
    if (!displayAlive(display) || loc == null) return;
    try {
        display.entity.teleport(loc);
        display.anchor = loc.clone();
        display.lastLoc = loc.clone();
        if (display.kind === "display") {
            var Transformation = Java.type("org.bukkit.util.Transformation");
            var Vector3f = Java.type("org.joml.Vector3f");
            var AxisAngle4f = Java.type("org.joml.AxisAngle4f");
            var sc = display.scale != null ? Number(display.scale) : DISPLAY_SCALE;
            try { display.entity.setInterpolationDelay(0); } catch (e0) {}
            try { display.entity.setInterpolationDuration(0); } catch (e1) {}
            display.entity.setTransformation(new Transformation(
                new Vector3f(0, 0, 0),
                new AxisAngle4f(0, 0, 0, 1),
                new Vector3f(sc, sc, sc),
                new AxisAngle4f(0, 0, 0, 1)
            ));
        }
    } catch (e) {}
}

function trailParticle(world, loc, count) {
    try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, count, 0.06, 0.06, 0.06, 0); } catch (eP) {
        try { world.spawnParticle(Particle.CRIT, loc, Math.max(1, count - 1), 0.05, 0.05, 0.05, 0); } catch (eP2) {}
    }
}

function burstParticle(world, loc) {
    try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 20, 0.3, 0.3, 0.3, 0.03); } catch (eH) {}
}

// ---------- 战斗 ----------

function dealHit(ent, dmg, caster, mageApi, spellInfo) {
    if (UTIL && UTIL.dealParticleSpellDamage) {
        UTIL.dealParticleSpellDamage(ent, dmg, caster, spellInfo);
    } else {
        try { ent.damage(dmg, caster); } catch (e) {}
    }
}

function isTargetEntity(ent, casterUuid) {
    if (!(ent instanceof LivingEntity) || ent.isDead()) return false;
    if (ent instanceof Player && ent.getUniqueId().toString() === casterUuid) return false;
    try { if (ent.getType() === EntityType.ARMOR_STAND) return false; } catch (eA) {}
    try { if (ent.getType() === EntityType.ITEM_DISPLAY) return false; } catch (eD) {}
    return true;
}

function findHomingTarget(world, from, casterUuid) {
    var best = null;
    var bestD = TRACK_RANGE;
    var list = world.getNearbyEntities(from, TRACK_RANGE, TRACK_RANGE, TRACK_RANGE);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!isTargetEntity(ent, casterUuid)) continue;
        var d = from.distance(ent.getLocation());
        if (d < bestD) { bestD = d; best = ent; }
    }
    return best;
}

function findHitEntity(world, loc, casterUuid) {
    var near = world.getNearbyEntities(loc, HIT_HALF, HIT_HALF, HIT_HALF);
    var it = near.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (isTargetEntity(ent, casterUuid)) return ent;
    }
    return null;
}

// ---------- 清理 ----------

function cancelTaskId(taskId) {
    if (taskId == null) return;
    try { Bukkit.getScheduler().cancelTask(Number(taskId)); } catch (e) {}
}

function endSessionToken(playerOrUuid, token, invokeClear) {
    if (!token) return;
    try {
        var api = getSessionApi();
        if (api && typeof api.end === "function") api.end(playerOrUuid, token, invokeClear);
    } catch (e) {}
}

function stopOrbitSession(uuid, stForced, invokeTokenEnd) {
    uuid = uuidKey(uuid);
    var store = sessionStore();
    var st = stForced || null;
    if (st == null) {
        try { st = store.remove(uuid); } catch (e0) {}
        if (st == null) return;
    } else {
        try { if (store.get(uuid) === st) store.remove(uuid); } catch (eR) {}
    }
    try { st.alive = false; } catch (eA) {}
    cancelTaskId(st.orbitTask);
    cancelTaskId(st.spawnTask);
    if (st.flowers) {
        for (var i = 0; i < st.flowers.length; i++) {
            var f = st.flowers[i];
            if (f && f.display) removeDisplay(f.display);
        }
    }
    clearOrbitLeftClick(uuid);
    if (invokeTokenEnd && st.sessionToken) {
        endSessionToken(uuid, st.sessionToken, false);
    }
}

function stopProjectile(proj) {
    if (!proj) return;
    proj.alive = false;
    try { if (proj.task != null) proj.task.cancel(); } catch (e0) {}
    try { removeDisplay(proj.display); } catch (e1) {}
    proj.display = null;
}

function detachProjectile(wave, proj) {
    if (!wave || !wave.projectiles) return;
    var kept = [];
    for (var i = 0; i < wave.projectiles.length; i++) {
        if (wave.projectiles[i] !== proj) kept.push(wave.projectiles[i]);
    }
    wave.projectiles = kept;
    if (kept.length === 0 && wave.alive) {
        wave.alive = false;
        endSessionToken(wave.ownerUuid, wave.sessionToken, false);
        try { flyingStore().remove(uuidKey(wave.ownerUuid)); } catch (eRm) {}
    }
}

function stopFlyingWave(uuid, invokeTokenEnd) {
    uuid = uuidKey(uuid);
    var wave = null;
    try { wave = flyingStore().remove(uuid); } catch (e0) {}
    if (wave == null) return;
    wave.alive = false;
    if (wave.projectiles) {
        for (var i = 0; i < wave.projectiles.length; i++) stopProjectile(wave.projectiles[i]);
    }
    if (invokeTokenEnd && wave.sessionToken) {
        endSessionToken(uuid, wave.sessionToken, false);
    }
}

function clearAll(uuid) {
    stopOrbitSession(uuid, null, true);
    stopFlyingWave(uuid, true);
}

// ---------- 投出弹体 ----------

function launchProjectile(projCtx) {
    var display = projCtx.display;
    if (!displayAlive(display)) return;

    var caster = projCtx.caster;
    var world = caster.getWorld();
    var loc = null;
    try {
        loc = projCtx.startLoc != null ? projCtx.startLoc.clone() : null;
    } catch (e0) {}
    if (loc == null) {
        try { loc = display.lastLoc != null ? display.lastLoc.clone() : display.entity.getLocation().clone(); } catch (e1) { return; }
    }
    reanchorDisplay(display, loc);

    var uuid = String(caster.getUniqueId().toString());
    var wave = projCtx.wave;
    var dir = projCtx.dir.clone().normalize();
    var ticks = 0;

    var proj = { alive: true, task: null, display: display, ownerUuid: uuid };
    wave.projectiles.push(proj);

    proj.task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!wave.alive || !proj.alive) {
                    stopProjectile(proj);
                    detachProjectile(wave, proj);
                    return;
                }
                ticks++;
                var target = findHomingTarget(world, loc, uuid);
                if (target != null) {
                    var to = target.getLocation().add(0, 0.9, 0).toVector().subtract(loc.toVector());
                    if (to.lengthSquared() > 1e-6) {
                        to.normalize();
                        dir = dir.multiply(1 - HOMING).add(to.multiply(HOMING));
                        if (dir.lengthSquared() > 1e-6) dir.normalize();
                    }
                }

                var sx = dir.getX() * SPEED_PER_TICK;
                var sy = dir.getY() * SPEED_PER_TICK;
                var sz = dir.getZ() * SPEED_PER_TICK;
                var hitSolid = false;
                try {
                    var mid = loc.clone().add(sx * 0.5, sy * 0.5, sz * 0.5);
                    if (mid.getBlock().getType().isSolid()) hitSolid = true;
                } catch (eM) {}
                loc.add(sx, sy, sz);
                moveDisplay(display, loc);
                trailParticle(world, loc, 3);
                try { if (!hitSolid) hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}

                var hitEnt = findHitEntity(world, loc, uuid);
                if (hitEnt || hitSolid || ticks >= MAX_FLY_TICKS) {
                    var p = findOnline(uuid) || caster;
                    if (hitEnt) dealHit(hitEnt, projCtx.dmg, p, projCtx.mageApi, projCtx.spellInfo);
                    burstParticle(world, loc);
                    stopProjectile(proj);
                    detachProjectile(wave, proj);
                }
            } catch (ex) {
                stopProjectile(proj);
                detachProjectile(wave, proj);
            }
        }
    })), 0, 1);
}

function launchAll(player, stForced) {
    var uuid = uuidKey(player.getUniqueId().toString());
    var st = stForced || getOrbitSession(uuid);
    if (!st || !st.alive || !st.flowers || st.flowers.length === 0) return false;
    if (st.launching) return false;

    var toLaunch = [];
    for (var i = 0; i < st.flowers.length; i++) {
        var f = st.flowers[i];
        if (f && f.display && displayAlive(f.display)) toLaunch.push(f);
    }
    if (toLaunch.length === 0) return false;

    st.launching = true;
    stopFlyingWave(uuid, true);

    var look = player.getEyeLocation().getDirection().normalize();
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
    var wave = {
        alive: true,
        ownerUuid: String(player.getUniqueId().toString()),
        sessionToken: null,
        projectiles: []
    };
    flyingStore().put(uuid, wave);

    var api = getSessionApi();
    if (api && typeof api.begin === "function") {
        try {
            wave.sessionToken = api.begin(player, SPELL_ID, function() {
                stopFlyingWave(uuid, false);
            }, { replace: false });
        } catch (eBeg) {}
    }

    var launched = 0;
    for (var j = 0; j < toLaunch.length; j++) {
        var flower = toLaunch[j];
        var startLoc = null;
        try { startLoc = flower.lastLoc != null ? flower.lastLoc.clone() : null; } catch (eL) {}
        launchProjectile({
            display: flower.display,
            caster: player,
            wave: wave,
            dir: look.clone(),
            startLoc: startLoc,
            dmg: st.dmg,
            mageApi: st.mageApi,
            spellInfo: spellInfo
        });
        launched++;
    }

    if (launched === 0) {
        st.launching = false;
        stopFlyingWave(uuid, true);
        return false;
    }

    stopOrbitSession(uuid, st, true);
    try { player.getWorld().playSound(player.getLocation(), Sound.ENTITY_ENDER_DRAGON_FLAP, 0.45, 1.6); } catch (eS) {}
    try { player.sendActionBar("§d花如画卷 §f投出 §e" + launched + " §f朵花"); } catch (eA) {}
    return true;
}

// ---------- 环绕召唤 ----------

function spawnOrbitFlower(st, player) {
    var ang = (st.spawned / Math.max(1, st.total)) * Math.PI * 2 + st.spawned * 0.7;
    var loc = player.getLocation().clone().add(0, ORBIT_HEIGHT, 0)
        .add(Math.cos(ang) * ORBIT_RADIUS, 0, Math.sin(ang) * ORBIT_RADIUS);
    var display = spawnDisplay(player.getWorld(), loc, randomFlowerMat());
    if (!display) {
        Bukkit.getLogger().warning("[GLTC花如画卷] 无法生成花朵实体");
        return false;
    }
    st.flowers.push({
        display: display,
        baseAng: ang,
        lastLoc: loc.clone()
    });
    st.spawned++;
    try { player.getWorld().playSound(loc, Sound.BLOCK_PINK_PETALS_PLACE, 0.55, 1.25); } catch (eS) {
        try { player.getWorld().playSound(loc, Sound.BLOCK_GRASS_PLACE, 0.55, 1.3); } catch (eS2) {}
    }
    trailParticle(player.getWorld(), loc, 8);
    return true;
}

function updateOrbit(st, player) {
    var uuid = uuidKey(player.getUniqueId().toString());
    var base = player.getLocation().clone().add(0, ORBIT_HEIGHT, 0);
    for (var i = 0; i < st.flowers.length; i++) {
        var f = st.flowers[i];
        if (!f || !f.display || !displayAlive(f.display)) continue;
        var ang = f.baseAng + st.ticks * ORBIT_SPIN;
        var loc = base.clone().add(
            Math.cos(ang) * ORBIT_RADIUS,
            Math.sin(st.ticks * ORBIT_BOB + i) * 0.12,
            Math.sin(ang) * ORBIT_RADIUS
        );
        moveDisplay(f.display, loc);
        f.lastLoc = loc.clone();
        trailParticle(player.getWorld(), loc, 1);
    }
    st.ticks++;
    if (st.ticks >= SESSION_TIMEOUT_TICKS) {
        stopOrbitSession(uuid, st, true);
        try { player.sendActionBar("§7花如画卷已消散"); } catch (eA) {}
    }
}

function clearOrbitLeftClick(uuidOrPlayer) {
    var api = getSessionApi();
    if (api && typeof api.clearActiveLeftClick === "function") {
        try { api.clearActiveLeftClick(uuidOrPlayer); } catch (e) {}
    }
}

function consumeLeftClickPulse(player) {
    if (UTIL && UTIL.consumeSpellSignal) {
        try { return UTIL.consumeSpellSignal(player, SPELL_ID, SIG_LCLICK); } catch (eU) {}
    }
    var api = getSessionApi();
    if (api && api.consumeSpellSignal) {
        try { return api.consumeSpellSignal(player, SPELL_ID, SIG_LCLICK); } catch (eA) {}
    }
    return false;
}

function registerOrbitLeftClick(player, st) {
    var api = getSessionApi();
    if (!api || typeof api.registerActiveLeftClick !== "function") return;
    var uuid = uuidKey(player.getUniqueId().toString());
    api.registerActiveLeftClick(player, SPELL_ID, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!st || !st.alive || st.launching) return;
                var p = findOnline(uuid);
                if (p == null || !p.isOnline()) return;
                launchAll(p, st);
            } catch (ex) {
                Bukkit.getLogger().warning("[GLTC花如画卷] leftClick: " + ex);
            }
        }
    })));
}

function castFlowerScroll(player, mageApi) {
    var uuid = uuidKey(player.getUniqueId().toString());
    clearAll(uuid);

    var st = {
        alive: true,
        mageApi: mageApi,
        dmg: mageApi.calcSpellDamage(player, SPELL_COEFFICIENT),
        flowers: [],
        orbitTask: null,
        spawnTask: null,
        ticks: 0,
        spawned: 0,
        total: TOTAL_FLOWERS,
        launching: false,
        sessionToken: null
    };
    sessionStore().put(uuid, st);
    registerOrbitLeftClick(player, st);

    var api = getSessionApi();
    if (api && typeof api.begin === "function") {
        try {
            st.sessionToken = api.begin(player, SPELL_ID, (function(captured) {
                return function() { stopOrbitSession(uuid, captured, false); };
            })(st), { replace: true });
        } catch (eBeg) {
            Bukkit.getLogger().warning("[GLTC花如画卷] beginSession: " + eBeg);
        }
    }

    try {
        player.getWorld().playSound(player.getLocation(), Sound.BLOCK_CHERRY_LEAVES_PLACE, 0.9, 1.1);
    } catch (eS) {
        try { player.getWorld().playSound(player.getLocation(), Sound.BLOCK_GRASS_PLACE, 0.9, 1.2); } catch (eS2) {}
    }
    try { player.sendActionBar("§d花如画卷 §7环绕中 · 左键投出"); } catch (eA) {}

    spawnOrbitFlower(st, player);

    var orbitTask = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!st.alive) {
                    try { orbitTask.cancel(); } catch (eC) {}
                    return;
                }
                var p = findOnline(uuid);
                if (p == null || !p.isOnline()) {
                    stopOrbitSession(uuid, st, true);
                    return;
                }
                if (consumeLeftClickPulse(p)) {
                    launchAll(p, st);
                    return;
                }
                updateOrbit(st, p);
            } catch (ex) {
                Bukkit.getLogger().warning("[GLTC花如画卷] orbit: " + ex);
            }
        }
    })), 1, 1);
    try { st.orbitTask = orbitTask.getTaskId(); } catch (eO) {}

    var spawnTask = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!st.alive) {
                    try { spawnTask.cancel(); } catch (eC0) {}
                    return;
                }
                var p = findOnline(uuid);
                if (p == null) {
                    stopOrbitSession(uuid, st, true);
                    return;
                }
                if (st.spawned >= st.total) {
                    try { spawnTask.cancel(); } catch (eC1) {}
                    return;
                }
                spawnOrbitFlower(st, p);
            } catch (ex2) {
                Bukkit.getLogger().warning("[GLTC花如画卷] spawn: " + ex2);
            }
        }
    })), SPAWN_INTERVAL_TICKS, SPAWN_INTERVAL_TICKS);
    try { st.spawnTask = spawnTask.getTaskId(); } catch (eSp) {}

    return true;
}

try {
    if (UTIL && typeof UTIL.registerDirectClearHook === "function") {
        UTIL.registerDirectClearHook(SPELL_ID, function(p) {
            if (!p) return;
            clearAll(uuidKey(p.getUniqueId().toString()));
        });
    }
} catch (eHook) {}

({
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cost: SPELL_COST,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: true,
    cast: castFlowerScroll
});
