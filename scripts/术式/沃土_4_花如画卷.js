// ===================================================================
// 术式：花如画卷 —— 4环 · 沃土奥法（环绕蓄力 + 左键齐射）
// ID：VASA_花如画卷（与 items.yml 术式载体一致）
// 右键进入状态：花朵环绕自身；左键将全部未发射花朵朝视野方向射出
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var Vector = Java.type("org.bukkit.util.Vector");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var META_SHARED = "gltc_shared_root_maps";
var META_RUNTIME = "gltc_spell_runtime";

// === 术式身份 / 登记导出 ===
var SPELL_ID          = "VASA_花如画卷";
var SPELL_NAME        = "花如画卷";
var SPELL_RING        = 4;
var SPELL_SCHOOL      = "沃土";
var SPELL_BOOK        = true;

// === 冷却 / 伤害 ===
var SPELL_COOLDOWN_MS = 12000;
var SPELL_COEFFICIENT = 1.5;

// === [花如画卷] 状态（未投射）===
var DISPLAY_SCALE     = 0.72;
var HIT_HALF          = 0.5;
var STATE_DURATION    = 100;
var SPAWN_INTERVAL    = 10;
var ORBIT_RADIUS      = 3.0;
var ORBIT_SPIN        = 0.08;
var ORBIT_DRIFT       = 0.12;

// === 左键齐射（已投射）===
var PROJECT_SPEED     = 16;
var MAX_FLY_DISTANCE  = 32;
var HOMING_WEIGHT     = 0.45;
var AIM_DISTANCE      = 28;

// === 花朵 / 粒子 ===
var FLOWER_POOL = [
    Material.DANDELION, Material.POPPY, Material.BLUE_ORCHID, Material.ALLIUM,
    Material.AZURE_BLUET, Material.OXEYE_DAISY, Material.CORNFLOWER,
    Material.LILY_OF_THE_VALLEY
];
var BONE_MEAL_PARTICLE = (function() {
    try { return Particle.HAPPY_VILLAGER; } catch (e0) {}
    try { return Particle.VILLAGER_HAPPY; } catch (e1) {}
    return Particle.END_ROD;
})();
var CHERRY_PARTICLE = (function() {
    try { return Particle.CHERRY_LEAVES; } catch (e0) {}
    return Particle.END_ROD;
})();
var CHERRY_COUNT      = 2;
var CHERRY_SPREAD     = 0.12;

// === 音效 ===
var SOUND_CAST        = "block.cherry_leaves.place";
var SOUND_CAST_VOL    = 0.85;
var SOUND_CAST_PITCH  = 1.1;
var SOUND_LAUNCH      = "entity.arrow.shoot";
var SOUND_LAUNCH_VOL  = 0.65;
var SOUND_LAUNCH_PITCH  = 1.35;

function rt(mageApi) {
    try {
        if (mageApi != null) {
            if (typeof mageApi.getSpellRuntime === "function") {
                var fromFn = mageApi.getSpellRuntime();
                if (fromFn != null) return fromFn;
            }
            if (mageApi.spellRuntime != null) return mageApi.spellRuntime;
        }
    } catch (eApi) {}
    try {
        if (PLUGIN != null && PLUGIN.hasMetadata(META_RUNTIME)) {
            var direct = PLUGIN.getMetadata(META_RUNTIME).get(0).value();
            if (direct != null) return direct;
        }
        if (PLUGIN != null && PLUGIN.hasMetadata(META_SHARED)) {
            var hit = PLUGIN.getMetadata(META_SHARED).get(0).value().get("gltcSpellRuntime");
            if (hit != null) return hit;
        }
        if (PLUGIN != null && PLUGIN.gltcSpellRuntime != null) return PLUGIN.gltcSpellRuntime;
    } catch (e) {}
    return null;
}

function calcSpellDamage(player, mageApi) {
    try {
        if (mageApi != null && mageApi.calcSpellDamage != null) {
            var v = Number(mageApi.calcSpellDamage(player, SPELL_COEFFICIENT));
            if (v > 0 && isFinite(v)) return v;
        }
    } catch (eApi) {}
    try {
        var uuid = String(player.getUniqueId().toString());
        var f = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士数值/" + uuid + ".json");
        if (f.exists()) {
            var data = JSON.parse(StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString());
            var total = Number(data.particlePowerTotal);
            var pp = (isFinite(total) && total > 0) ? total : Number(data.particlePower);
            if (pp > 0 && isFinite(pp)) return pp * SPELL_COEFFICIENT;
        }
    } catch (eDisk) {}
    return SPELL_COEFFICIENT;
}

function playSpellSound(world, loc, sound, vol, pitch) {
    if (world == null || loc == null) return;
    try { world.playSound(loc, sound, vol, pitch); return; } catch (e0) {}
    try { world.playSound(loc, String(sound), vol, pitch); } catch (e1) {}
}

function isTarget(ent, casterUuid) {
    var living = false;
    try { living = LivingEntity.class.isInstance(ent); } catch (e0) {
        try { living = ent instanceof LivingEntity; } catch (e1) {}
    }
    if (!living || ent.isDead()) return false;
    try {
        if (Player.class.isInstance(ent) && String(ent.getUniqueId().toString()) === casterUuid) return false;
    } catch (eP) {}
    try { if (ent.getType() === EntityType.ARMOR_STAND || ent.getType() === EntityType.ITEM_DISPLAY) return false; } catch (eT) {}
    return true;
}

function findHit(world, loc, casterUuid) {
    var it = world.getNearbyEntities(loc, HIT_HALF, HIT_HALF, HIT_HALF).iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (isTarget(ent, casterUuid)) return ent;
    }
    return null;
}

function randomFlower() {
    return FLOWER_POOL[Math.floor(Math.random() * FLOWER_POOL.length)];
}

function normalizeVector(v) {
    var len = Math.sqrt(v.getX() * v.getX() + v.getY() * v.getY() + v.getZ() * v.getZ());
    if (len < 1e-6) return new Vector(0, 0, 1);
    return new Vector(v.getX() / len, v.getY() / len, v.getZ() / len);
}

function blendDirection(forward, toward, weight) {
    var f = normalizeVector(forward);
    var t = normalizeVector(toward);
    var w = weight != null ? weight : HOMING_WEIGHT;
    return normalizeVector(new Vector(
        f.getX() * (1 - w) + t.getX() * w,
        f.getY() * (1 - w) + t.getY() * w,
        f.getZ() * (1 - w) + t.getZ() * w
    ));
}

function launchHomingFlower(player, mageApi, runtime, display, startLoc) {
    if (!display || !runtime.isFlyingDisplayAlive(display)) return false;

    var world = player.getWorld();
    var loc = startLoc.clone();
    var ownerUuid = String(player.getUniqueId().toString());
    var dmg = calcSpellDamage(player, mageApi);
    var speed = PROJECT_SPEED / 20.0;
    var traveled = 0;
    var alive = true;
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME, spellId: SPELL_ID };
    var task = null;
    var token = null;
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().clone().normalize();

    function cleanup() {
        if (!alive) return;
        alive = false;
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
        try { runtime.removeFlyingDisplay(display); } catch (eR) {}
    }

    token = runtime.begin(player, SPELL_ID, new (Java.extend(java.lang.Runnable, {
        run: cleanup
    })), {
        persistence: runtime.SESSION_PROJECTED,
        replace: false
    });
    if (!token) {
        try { runtime.removeFlyingDisplay(display); } catch (eD0) {}
        return false;
    }

    task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!alive) return;
                eye = player.getEyeLocation();
                var aim = eye.clone().add(eye.getDirection().multiply(AIM_DISTANCE));
                dir = blendDirection(dir, aim.toVector().subtract(loc.toVector()), HOMING_WEIGHT);
                var prev = loc.clone();
                loc.add(dir.getX() * speed, dir.getY() * speed, dir.getZ() * speed);
                traveled += prev.distance(loc);
                runtime.moveFlyingDisplay(display, loc);
                try { world.spawnParticle(BONE_MEAL_PARTICLE, loc, 1, 0.08, 0.08, 0.08, 0.01); } catch (eP) {}

                var hitSolid = false;
                try { hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}
                var hitEnt = findHit(world, loc, ownerUuid);
                if (!hitEnt && !hitSolid && traveled < MAX_FLY_DISTANCE) return;

                if (hitEnt) runtime.dealParticleSpellDamage(hitEnt, dmg, player, spellInfo);
                cleanup();
                try { runtime.end(player, token, false); } catch (eEnd) {}
            } catch (ex) {
                cleanup();
                try { runtime.end(player, token, false); } catch (eEnd2) {}
            }
        }
    })), 0, 1);
    return true;
}

function castHuaRuHuaJuan(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) return false;

    var world = player.getWorld();
    var orbiters = [];
    var angleBase = 0;
    var ticks = 0;
    var alive = true;
    var task = null;
    var token = null;

    function removeOrbiter(o) {
        if (!o || o.removed) return;
        o.removed = true;
        try { runtime.removeFlyingDisplay(o.display); } catch (eR) {}
        o.display = null;
    }

    function cleanup() {
        if (!alive) return;
        alive = false;
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
        try { runtime.clearLeftClick(player); } catch (eL) {}
        for (var i = 0; i < orbiters.length; i++) {
            if (!orbiters[i].projected) removeOrbiter(orbiters[i]);
        }
        orbiters = [];
    }

    function spawnOrbiter(center, ang) {
        var spawnLoc = center.clone();
        spawnLoc.setX(center.getX() + Math.cos(ang) * ORBIT_RADIUS);
        spawnLoc.setZ(center.getZ() + Math.sin(ang) * ORBIT_RADIUS);
        var display = runtime.spawnFlyingItemDisplay(world, spawnLoc, randomFlower(), DISPLAY_SCALE);
        if (!display) return null;
        var orb = { display: display, angle: ang, projected: false, removed: false };
        orbiters.push(orb);
        return orb;
    }

    function projectAll() {
        if (!alive) return;
        var who = player;
        try {
            if (runtime.findOnline) {
                var online = runtime.findOnline(String(player.getUniqueId().toString()));
                if (online != null) who = online;
            }
        } catch (eWho) {}
        var launched = 0;
        for (var i = 0; i < orbiters.length; i++) {
            var o = orbiters[i];
            if (o.projected || o.removed || !runtime.isFlyingDisplayAlive(o.display)) continue;
            o.projected = true;
            var startLoc = o.display.lastLoc != null ? o.display.lastLoc.clone() : who.getLocation().clone();
            if (launchHomingFlower(who, mageApi, runtime, o.display, startLoc)) {
                launched++;
                o.display = null;
            }
        }
        if (launched > 0) {
            playSpellSound(world, who.getEyeLocation(), SOUND_LAUNCH, SOUND_LAUNCH_VOL, SOUND_LAUNCH_PITCH);
        }
    }

    token = runtime.begin(player, SPELL_ID, new (Java.extend(java.lang.Runnable, {
        run: cleanup
    })), {
        persistence: runtime.SESSION_UNPROJECTED,
        replace: true
    });
    if (!token) return false;

    runtime.registerLeftClick(player, SPELL_ID, new (Java.extend(java.lang.Runnable, {
        run: projectAll
    })));

    playSpellSound(world, player.getLocation(), SOUND_CAST, SOUND_CAST_VOL, SOUND_CAST_PITCH);

    var center0 = player.getLocation().clone().add(0, 1.0, 0);
    spawnOrbiter(center0, angleBase);

    task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!alive) return;
                if (!player.isOnline()) {
                    cleanup();
                    try { runtime.end(player, token, false); } catch (eOff) {}
                    return;
                }
                ticks++;
                angleBase += ORBIT_DRIFT;
                var center = player.getLocation().clone().add(0, 1.0, 0);

                if (ticks % SPAWN_INTERVAL === 0) {
                    spawnOrbiter(center, angleBase + orbiters.length * 0.9);
                }

                for (var i = orbiters.length - 1; i >= 0; i--) {
                    var o = orbiters[i];
                    if (o.projected || o.removed) continue;
                    if (!runtime.isFlyingDisplayAlive(o.display)) {
                        removeOrbiter(o);
                        continue;
                    }
                    o.angle += ORBIT_SPIN;
                    var oloc = center.clone();
                    oloc.setX(center.getX() + Math.cos(o.angle) * ORBIT_RADIUS);
                    oloc.setZ(center.getZ() + Math.sin(o.angle) * ORBIT_RADIUS);
                    runtime.moveFlyingDisplay(o.display, oloc);
                    try {
                        world.spawnParticle(CHERRY_PARTICLE, oloc, CHERRY_COUNT, CHERRY_SPREAD, CHERRY_SPREAD, CHERRY_SPREAD, 0.01);
                    } catch (eCherry) {}
                }

                if (ticks >= STATE_DURATION) {
                    cleanup();
                    try { runtime.end(player, token, false); } catch (eEnd) {}
                }
            } catch (ex) {
                cleanup();
                try { runtime.end(player, token, false); } catch (eEnd2) {}
            }
        }
    })), 0, 1);

    return true;
}

({
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: SPELL_BOOK,
    school: SPELL_SCHOOL,
    cast: castHuaRuHuaJuan
});
