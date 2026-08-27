// ===================================================================
// 术式：花如画卷 —— 4环 · 沃土奥法（环绕蓄力 + 左键齐射）
// ID：VASA_花如画卷
// ===================================================================

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
var META_RUNTIME = "gltc_spell_runtime";
var LEFT_BRIDGE_KEY = "gltc_spell_left_VASA_花如画卷";
var STATE_MAP_KEY = "huaru_state";

var SPELL_ID          = "VASA_花如画卷";
var SPELL_NAME        = "花如画卷";
var SPELL_RING        = 4;
var SPELL_SCHOOL      = "沃土";
var SPELL_BOOK        = true;
var SPELL_COOLDOWN_MS = 12000;
var SPELL_COEFFICIENT = 1.5;

var DISPLAY_SCALE     = 0.72;
var HIT_HALF          = 0.5;
var STATE_DURATION    = 100;
var SPAWN_INTERVAL    = 10;
var ORBIT_RADIUS      = 3.0;
var ORBIT_SPIN        = 0.08;
var ORBIT_DRIFT       = 0.12;
var PROJECT_SPEED     = 16;
var MAX_FLY_DISTANCE  = 32;
var HOMING_WEIGHT     = 0.45;
var AIM_DISTANCE      = 28;

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

var SHARED_ROOT_API = (function() {
    try {
        var f = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/_gltcSharedRoot.js");
        if (!f.exists()) return null;
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString();
        return (0, eval)(code);
    } catch (e) { return null; }
})();

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
            return PLUGIN.getMetadata(META_RUNTIME).get(0).value();
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

function playSound(world, loc, sound, vol, pitch) {
    if (world == null || loc == null) return;
    try { world.playSound(loc, sound, vol, pitch); return; } catch (e0) {}
    try { world.playSound(loc, String(sound), vol, pitch); } catch (e1) {}
}

function isTarget(ent, casterUuid) {
    try { if (!LivingEntity.class.isInstance(ent)) return false; } catch (e0) {
        try { if (!(ent instanceof LivingEntity)) return false; } catch (e1) { return false; }
    }
    try { if (ent.isDead()) return false; } catch (eD) { return false; }
    try {
        if (Player.class.isInstance(ent) && String(ent.getUniqueId().toString()) === casterUuid) return false;
    } catch (eP) {}
    try {
        var t = ent.getType();
        if (t === EntityType.ARMOR_STAND || t === EntityType.ITEM_DISPLAY) return false;
    } catch (eT) {}
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

function stateMap(runtime) {
    return runtime.mapOf(STATE_MAP_KEY);
}

function getState(runtime, uuid) {
    return stateMap(runtime).get(String(uuid));
}

function launchHomingFlower(state, orb) {
    var runtime = state.runtime;
    var player = state.player;
    if (!orb || orb.projected || orb.removed || !runtime.isFlyingDisplayAlive(orb.display)) return false;

    var world = player.getWorld();
    var loc = orb.display.lastLoc != null ? orb.display.lastLoc.clone() : player.getEyeLocation().clone();
    var display = orb.display;
    var ownerUuid = state.ownerUuid;
    var dmg = state.dmg;
    var speed = PROJECT_SPEED / 20.0;
    var traveled = 0;
    var alive = true;
    var spellInfo = state.spellInfo;
    var task = null;
    var token = null;
    var dir = player.getEyeLocation().getDirection().clone().normalize();

    function cleanupFly() {
        if (!alive) return;
        alive = false;
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
        try { runtime.removeFlyingDisplay(display); } catch (eR) {}
    }

    token = runtime.begin(player, SPELL_ID, new (Java.extend(java.lang.Runnable, { run: cleanupFly })), {
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
                var eye = player.getEyeLocation();
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
                cleanupFly();
                try { runtime.end(player, token, false); } catch (eEnd) {}
            } catch (ex) {
                cleanupFly();
                try { runtime.end(player, token, false); } catch (eEnd2) {}
            }
        }
    })), 0, 1);
    return true;
}

function projectAllForUuid(uuid) {
    var runtime = rt(null);
    if (!runtime) return;
    var state = getState(runtime, uuid);
    if (!state || !state.alive) return;
    var player = runtime.findOnline ? runtime.findOnline(uuid) : null;
    if (player == null) {
        try { player = Bukkit.getPlayer(java.util.UUID.fromString(String(uuid))); } catch (eP) {}
    }
    if (player == null || !player.isOnline()) return;
    state.player = player;

    var launched = 0;
    for (var i = 0; i < state.orbiters.length; i++) {
        var o = state.orbiters[i];
        if (o.projected || o.removed || !runtime.isFlyingDisplayAlive(o.display)) continue;
        o.projected = true;
        if (launchHomingFlower(state, o)) {
            launched++;
            o.display = null;
        }
    }
    if (launched > 0) {
        playSound(player.getWorld(), player.getEyeLocation(), "entity.arrow.shoot", 0.65, 1.35);
    }
}

(function registerLeftClickBridge() {
    try {
        var Consumer = Java.type("java.util.function.Consumer");
        var bridge = new (Java.extend(Consumer, {
            accept: function(uuid) { projectAllForUuid(String(uuid)); }
        }))();
        if (SHARED_ROOT_API && SHARED_ROOT_API.putJavaBridge) {
            SHARED_ROOT_API.putJavaBridge(LEFT_BRIDGE_KEY, bridge);
        }
        var root = SHARED_ROOT_API && SHARED_ROOT_API.getGltcSharedRoot ? SHARED_ROOT_API.getGltcSharedRoot() : null;
        if (root != null) root.put(LEFT_BRIDGE_KEY, bridge);
    } catch (eBr) {}
})();

function castHuaRuHuaJuan(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) return false;

    var uuid = String(player.getUniqueId().toString());
    var world = player.getWorld();
    var orbiters = [];
    var angleBase = 0;
    var ticks = 0;
    var alive = true;
    var task = null;
    var token = null;

    var state = {
        alive: true,
        player: player,
        ownerUuid: uuid,
        runtime: runtime,
        dmg: calcSpellDamage(player, mageApi),
        spellInfo: { ring: SPELL_RING, name: SPELL_NAME, spellId: SPELL_ID },
        orbiters: orbiters
    };
    stateMap(runtime).put(uuid, state);

    function removeOrbiter(o) {
        if (!o || o.removed) return;
        o.removed = true;
        try { runtime.removeFlyingDisplay(o.display); } catch (eR) {}
        o.display = null;
    }

    function cleanup() {
        if (!alive) return;
        alive = false;
        state.alive = false;
        try { stateMap(runtime).remove(uuid); } catch (eRm) {}
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
        try { runtime.clearLeftClick(player); } catch (eL) {}
        for (var i = 0; i < orbiters.length; i++) {
            if (!orbiters[i].projected) removeOrbiter(orbiters[i]);
        }
        orbiters.length = 0;
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

    token = runtime.begin(player, SPELL_ID, new (Java.extend(java.lang.Runnable, { run: cleanup })), {
        persistence: runtime.SESSION_UNPROJECTED,
        replace: true
    });
    if (!token) {
        cleanup();
        return false;
    }

    runtime.registerLeftClick(player, SPELL_ID, null);

    playSound(world, player.getLocation(), "block.cherry_leaves.place", 0.85, 1.1);
    spawnOrbiter(player.getLocation().clone().add(0, 1.0, 0), angleBase);

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
                        world.spawnParticle(CHERRY_PARTICLE, oloc, 2, 0.12, 0.12, 0.12, 0.01);
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
