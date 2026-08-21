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
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
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

// ======================== 可调配置 ========================
var SPELL_NAME = "花如画卷";
var SPELL_RING = 4;
var SPELL_COST = 16;
var SPELL_COOLDOWN_MS = 12000;
var SPELL_COEFFICIENT = 1.5;

var SUMMON_SECONDS = 3;
var FLOWERS_PER_SEC = 2;
var ORBIT_RADIUS = 1.15;
var ORBIT_HEIGHT = 1.05;
var SESSION_TIMEOUT_TICKS = 160;
var FLY_SPEED = 10;
var MAX_DISTANCE = 36;
var HIT_HALF = 0.5;
var TRACK_RANGE = 18;
var HOMING = 0.22;

var FLOWER_NAME_CANDIDATES = [
    "POPPY", "DANDELION", "BLUE_ORCHID", "ALLIUM", "AZURE_BLUET",
    "RED_TULIP", "ORANGE_TULIP", "WHITE_TULIP", "PINK_TULIP",
    "OXEYE_DAISY", "CORNFLOWER", "LILY_OF_THE_VALLEY"
];

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
// ======================== 配置结束 ========================

var SPEED_PER_TICK = FLY_SPEED / 20.0;
var MAX_TICKS = Math.ceil(MAX_DISTANCE / SPEED_PER_TICK);

function sessionKey(uuid) {
    return JString.valueOf(String(uuid));
}

function sharedSessions() {
    try {
        if (PLUGIN.gltcFlowerScrollSessions != null) return PLUGIN.gltcFlowerScrollSessions;
    } catch (e0) {}
    var map = new java.util.concurrent.ConcurrentHashMap();
    try { PLUGIN.gltcFlowerScrollSessions = map; } catch (e1) {}
    return map;
}

function findOnline(uuid) {
    uuid = String(uuid);
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].getUniqueId().toString()) === uuid) return arr[i];
        }
    } catch (e) {}
    return null;
}

function randomFlower() {
    if (!FLOWER_POOL || FLOWER_POOL.length === 0) {
        return resolveMaterial("POPPY") || Material.STONE;
    }
    var mat = FLOWER_POOL[Math.floor(Math.random() * FLOWER_POOL.length)];
    if (mat == null) return resolveMaterial("POPPY") || Material.STONE;
    return mat;
}

function spawnFlowerDisplay(world, loc, mat) {
    if (mat == null) mat = randomFlower();
    if (mat == null) {
        Bukkit.getLogger().warning("[GLTC花如画卷] 无可用花朵材质");
        return null;
    }
    if (UTIL && UTIL.spawnFlyingItemDisplay) {
        return UTIL.spawnFlyingItemDisplay(world, loc, mat, 0.85);
    }
    Bukkit.getLogger().warning("[GLTC花如画卷] 工具未加载，无法生成展示实体");
    return null;
}

function removeFlower(entry) {
    if (UTIL && UTIL.removeFlyingDisplay) {
        UTIL.removeFlyingDisplay(entry);
        return;
    }
    if (!entry || !entry.entity) return;
    try { if (!entry.entity.isDead()) entry.entity.remove(); } catch (e) {}
}

function isFlowerAlive(entry) {
    if (UTIL && UTIL.isFlyingDisplayAlive) return UTIL.isFlyingDisplayAlive(entry);
    try { return entry && entry.entity != null && !entry.entity.isDead(); } catch (e) { return false; }
}

function teleportFlower(entry, loc) {
    if (!isFlowerAlive(entry) || loc == null) return;
    try { entry.lastLoc = loc.clone(); } catch (e0) {}
    if (UTIL && UTIL.moveFlyingDisplay) {
        UTIL.moveFlyingDisplay(entry, loc);
        return;
    }
    try { entry.entity.teleport(loc); } catch (e) {}
}

/** 投掷前把展示体根坐标对齐到当前逻辑位置，避免 getLocation 仍是旧锚点 */
function reanchorFlower(entry, loc) {
    if (!isFlowerAlive(entry) || loc == null) return;
    try {
        entry.entity.teleport(loc);
        entry.anchor = loc.clone();
        entry.lastLoc = loc.clone();
        if (entry.kind === "display") {
            var Transformation = Java.type("org.bukkit.util.Transformation");
            var Vector3f = Java.type("org.joml.Vector3f");
            var AxisAngle4f = Java.type("org.joml.AxisAngle4f");
            var sc = entry.scale != null ? Number(entry.scale) : 0.85;
            try { entry.entity.setInterpolationDelay(0); } catch (e0) {}
            try { entry.entity.setInterpolationDuration(0); } catch (e1) {}
            entry.entity.setTransformation(new Transformation(
                new Vector3f(0, 0, 0),
                new AxisAngle4f(0, 0, 0, 1),
                new Vector3f(sc, sc, sc),
                new AxisAngle4f(0, 0, 0, 1)
            ));
        }
    } catch (e) {}
}

function dealHit(ent, dmg, caster, mageApi, spellInfo) {
    if (UTIL && UTIL.dealPulseSpellDamage) {
        UTIL.dealPulseSpellDamage(ent, dmg, caster, spellInfo, mageApi);
    } else if (mageApi && mageApi.dealPulseDamage) {
        mageApi.dealPulseDamage(ent, dmg, caster);
    } else {
        try { ent.damage(dmg, caster); } catch (e) {}
    }
}

function clearSession(uuid) {
    var key = sessionKey(uuid);
    var map = sharedSessions();
    var st = null;
    try { st = map.remove(key); } catch (e0) {}
    if (!st) return;
    try { st.alive = false; } catch (eA) {}
    try { if (st.orbitTask != null) Bukkit.getScheduler().cancelTask(Number(st.orbitTask)); } catch (e1) {}
    try { if (st.spawnTask != null) Bukkit.getScheduler().cancelTask(Number(st.spawnTask)); } catch (e2) {}
    if (st.flowers) {
        for (var i = 0; i < st.flowers.length; i++) removeFlower(st.flowers[i]);
    }
}

function findTrackTarget(world, from, casterUuid) {
    var best = null;
    var bestD = TRACK_RANGE;
    var list = world.getNearbyEntities(from, TRACK_RANGE, TRACK_RANGE, TRACK_RANGE);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (ent instanceof Player && ent.getUniqueId().toString() === casterUuid) continue;
        try { if (ent.getType() === EntityType.ARMOR_STAND) continue; } catch (eA) {}
        try { if (ent.getType() === EntityType.ITEM_DISPLAY) continue; } catch (eD) {}
        var d = from.distance(ent.getLocation());
        if (d < bestD) { bestD = d; best = ent; }
    }
    return best;
}

function launchFlower(entry, caster, mageApi, spellInfo, dmg, lookDir) {
    if (!isFlowerAlive(entry)) return;
    var ent = entry.entity;
    var world = caster.getWorld();
    var loc = null;
    try {
        if (entry.lastLoc != null) loc = entry.lastLoc.clone();
    } catch (e0) {}
    if (loc == null) {
        try { loc = ent.getLocation().clone(); } catch (e1) { return; }
    }
    reanchorFlower(entry, loc);
    var uuid = caster.getUniqueId().toString();
    var dir = lookDir.clone().normalize();
    var ticks = 0;

    var task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                ticks++;
                var target = findTrackTarget(world, loc, uuid);
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
                teleportFlower(entry, loc);
                try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 3, 0.06, 0.06, 0.06, 0); } catch (eP) {
                    try { world.spawnParticle(Particle.CRIT, loc, 2, 0.05, 0.05, 0.05, 0); } catch (eP2) {}
                }
                try { if (!hitSolid) hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}

                var hitEnt = null;
                var near = world.getNearbyEntities(loc, HIT_HALF, HIT_HALF, HIT_HALF);
                var it = near.iterator();
                while (it.hasNext()) {
                    var e2 = it.next();
                    if (!(e2 instanceof LivingEntity)) continue;
                    if (e2 instanceof Player && e2.getUniqueId().toString() === uuid) continue;
                    try { if (e2.getType() === EntityType.ARMOR_STAND) continue; } catch (eA) {}
                    try { if (e2.getType() === EntityType.ITEM_DISPLAY) continue; } catch (eD) {}
                    hitEnt = e2;
                    break;
                }

                if (hitEnt || hitSolid || ticks >= MAX_TICKS) {
                    var p = findOnline(uuid) || caster;
                    if (hitEnt) dealHit(hitEnt, dmg, p, mageApi, spellInfo);
                    try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 20, 0.3, 0.3, 0.3, 0.03); } catch (eH) {}
                    removeFlower(entry);
                    try { task.cancel(); } catch (eC) {}
                }
            } catch (ex) {
                removeFlower(entry);
                try { task.cancel(); } catch (e10) {}
            }
        }
    })), 0, 1);
}

function launchAll(player) {
    var key = sessionKey(player.getUniqueId().toString());
    var map = sharedSessions();
    var st = map.get(key);
    if (!st || !st.alive || !st.flowers || st.flowers.length === 0) return false;

    map.remove(key);
    st.alive = false;
    try { if (st.orbitTask != null) Bukkit.getScheduler().cancelTask(Number(st.orbitTask)); } catch (e0) {}
    try { if (st.spawnTask != null) Bukkit.getScheduler().cancelTask(Number(st.spawnTask)); } catch (e1) {}

    var look = player.getEyeLocation().getDirection().normalize();
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
    var launched = 0;
    for (var i = 0; i < st.flowers.length; i++) {
        var f = st.flowers[i];
        if (!isFlowerAlive(f)) continue;
        launchFlower(f, player, st.mageApi, spellInfo, st.dmg, look.clone());
        launched++;
    }
    if (launched > 0) {
        try { player.getWorld().playSound(player.getLocation(), Sound.ENTITY_ENDER_DRAGON_FLAP, 0.45, 1.6); } catch (eS) {}
        try { player.sendActionBar("§d花如画卷 §f投出 §e" + launched + " §f朵花"); } catch (eA) {}
    }
    return launched > 0;
}

function tryLeftClickLaunch(player) {
    if (!player || !(player instanceof Player)) return false;
    if (player.isSneaking()) return false;
    var key = sessionKey(player.getUniqueId().toString());
    var st = sharedSessions().get(key);
    if (st == null || !st.alive) return false;
    return launchAll(player);
}

try { PLUGIN.gltcFlowerScrollLeftClick = tryLeftClickLaunch; } catch (eHook) {}

function addOneFlower(st, player) {
    var mat = randomFlower();
    var ang = (st.spawned / Math.max(1, st.total)) * Math.PI * 2 + st.spawned * 0.7;
    var loc = player.getLocation().clone().add(0, ORBIT_HEIGHT, 0)
        .add(Math.cos(ang) * ORBIT_RADIUS, 0, Math.sin(ang) * ORBIT_RADIUS);
    var spawned = spawnFlowerDisplay(player.getWorld(), loc, mat);
    if (!spawned) {
        Bukkit.getLogger().warning("[GLTC花如画卷] 无法生成花朵实体");
        return false;
    }
    st.flowers.push({
        entity: spawned.entity,
        kind: spawned.kind,
        anchor: spawned.anchor,
        scale: spawned.scale,
        baseAng: ang,
        lastLoc: loc.clone()
    });
    st.spawned++;
    try { player.getWorld().playSound(loc, Sound.BLOCK_PINK_PETALS_PLACE, 0.55, 1.25); } catch (eS) {
        try { player.getWorld().playSound(loc, Sound.BLOCK_GRASS_PLACE, 0.55, 1.3); } catch (eS2) {}
    }
    try { player.getWorld().spawnParticle(Particle.CHERRY_LEAVES, loc, 8, 0.15, 0.15, 0.15, 0.01); } catch (eP) {}
    return true;
}

({
    id: "VASA_花如画卷",
    name: SPELL_NAME,
    ring: SPELL_RING,
    cost: SPELL_COST,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: true,
    cast: function(player, mageApi) {
        var uuid = String(player.getUniqueId().toString());
        var key = sessionKey(uuid);
        clearSession(uuid);

        var dmg = mageApi.calcSpellDamage(player, SPELL_COEFFICIENT);
        var total = SUMMON_SECONDS * FLOWERS_PER_SEC;
        var st = {
            alive: true,
            mageApi: mageApi,
            dmg: dmg,
            flowers: [],
            orbitTask: null,
            spawnTask: null,
            ticks: 0,
            spawned: 0,
            total: total
        };
        sharedSessions().put(key, st);

        try {
            player.getWorld().playSound(player.getLocation(), Sound.BLOCK_CHERRY_LEAVES_PLACE, 0.9, 1.1);
        } catch (eS) {
            try { player.getWorld().playSound(player.getLocation(), Sound.BLOCK_GRASS_PLACE, 0.9, 1.2); } catch (eS2) {}
        }
        try { player.sendActionBar("§d花如画卷 §7环绕中 · 左键投出"); } catch (eA) {}

        // 立刻生成第一朵，避免「看起来没召唤」
        addOneFlower(st, player);

        // 环绕刷新（异常不再整段清会话）
        var orbitTask = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    if (!st.alive) {
                        try { orbitTask.cancel(); } catch (eC) {}
                        return;
                    }
                    st.ticks++;
                    var p = findOnline(uuid);
                    if (p == null || !p.isOnline()) {
                        clearSession(uuid);
                        return;
                    }
                    var base = p.getLocation().clone().add(0, ORBIT_HEIGHT, 0);
                    for (var i = 0; i < st.flowers.length; i++) {
                        var f = st.flowers[i];
                        if (!isFlowerAlive(f)) continue;
                        var ang = f.baseAng + st.ticks * 0.18;
                        var loc = base.clone().add(
                            Math.cos(ang) * ORBIT_RADIUS,
                            Math.sin(st.ticks * 0.12 + i) * 0.12,
                            Math.sin(ang) * ORBIT_RADIUS
                        );
                        teleportFlower(f, loc);
                        try { p.getWorld().spawnParticle(Particle.CHERRY_LEAVES, loc, 1, 0.02, 0.02, 0.02, 0); } catch (eP) {}
                    }
                    if (st.ticks >= SESSION_TIMEOUT_TICKS) {
                        clearSession(uuid);
                        try { p.sendActionBar("§7花如画卷已消散"); } catch (eA2) {}
                    }
                } catch (ex) {
                    Bukkit.getLogger().warning("[GLTC花如画卷] orbit: " + ex);
                }
            }
        })), 1, 1);
        try { st.orbitTask = orbitTask.getTaskId(); } catch (eO) {}

        // 剩余花朵：每 10 tick 一朵（已生成 1 朵，再补 total-1）
        var spawnTask = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    if (!st.alive) {
                        try { spawnTask.cancel(); } catch (eC0) {}
                        return;
                    }
                    var p = findOnline(uuid);
                    if (p == null) {
                        clearSession(uuid);
                        return;
                    }
                    if (st.spawned >= st.total) {
                        try { spawnTask.cancel(); } catch (eC1) {}
                        return;
                    }
                    addOneFlower(st, p);
                } catch (ex2) {
                    Bukkit.getLogger().warning("[GLTC花如画卷] spawn: " + ex2);
                }
            }
        })), 10, 10);
        try { st.spawnTask = spawnTask.getTaskId(); } catch (eSp) {}

        return true;
    }
});
