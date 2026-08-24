/**
 * 术式：火球术 —— 1环 · 环夜谷标准流派
 * 火焰粒子球体前进；触碰生物或方块爆炸（物理伤害）
 * 物品/术式 ID：VASA_火球术
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
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
if (!UTIL) {
    try { Bukkit.getLogger().warning("[GLTC火球术] 未能加载 术式/_工具.js，伤害播报与 dust 将降级"); } catch (eU) {}
}

// ======================== 火球术 · 可调配置 ========================
// 改完后重载附属 / 重新加载术式脚本生效

/** 物品 / 登记 ID */
var SPELL_ID = "VASA_火球术";
/** 显示名（播报 / 登记） */
var SPELL_NAME = "火球术";
/** 环数 */
var SPELL_RING = 1;
/** 粒子消耗 */
var SPELL_COST = 1;
/** 冷却（毫秒） */
var SPELL_COOLDOWN_MS = 3000;
/** 伤害系数（最终 = 粒子强度 × 系数 × GLI） */
var SPELL_COEFFICIENT = 1.0;

/** 飞行速度（格/秒） */
var FLY_SPEED = 25;
/** 最大飞行距离（格）；超时直接在当前位置爆炸 */
var MAX_DISTANCE = 32;
/** 爆炸直径（格）→ 伤害判定半宽 = 直径/2 */
var EXPLODE_DIAMETER = 1;
/** 飞行中触碰生物的判定半宽（格） */
var HIT_HALF = 0.35;
/** 出生点相对眼睛向前偏移（格） */
var SPAWN_FORWARD = 0.8;
/** 碰撞检测间隔（tick）；位移仍每 tick */
var HIT_CHECK_EVERY = 2;

/** 球体火焰粒子：外圈 / 内芯数量与扩散 */
var SPHERE_FLAME_OUTER = 18;
var SPHERE_FLAME_OUTER_SPREAD = 0.22;
var SPHERE_FLAME_INNER = 6;
var SPHERE_FLAME_INNER_SPREAD = 0.08;
/** 球体 dust 数量与大小 */
var SPHERE_DUST_COUNT = 5;
var SPHERE_DUST_SIZE = 1.15;

/** 爆炸火焰粒子数量与扩散 */
var EXPLODE_FLAME_COUNT = 28;
var EXPLODE_FLAME_SPREAD = 0.35;

/** 释放音量 / 音调 */
var CAST_FIRECHARGE_VOL = 1.0;
var CAST_FIRECHARGE_PITCH = 1.0;
var CAST_BLAZE_VOL = 0.85;
var CAST_BLAZE_PITCH = 1.05;
var CAST_FIRE_AMBIENT_VOL = 0.7;
var CAST_FIRE_AMBIENT_PITCH = 1.4;

/** 命中爆炸音量 / 音调 */
var HIT_EXPLODE_VOL = 0.9;
var HIT_EXPLODE_PITCH = 1.15;
var HIT_FIREWORK_VOL = 0.55;
var HIT_FIREWORK_PITCH = 0.85;

// ======================== 配置结束（以下勿随意改） ========================

var SPEED_PER_TICK = FLY_SPEED / 20;
var EXPLODE_HALF = EXPLODE_DIAMETER / 2;
var MAX_TICKS = Math.ceil(MAX_DISTANCE / SPEED_PER_TICK);

function spawnFlameSphere(world, loc) {
    try {
        world.spawnParticle(Particle.FLAME, loc, SPHERE_FLAME_OUTER,
            SPHERE_FLAME_OUTER_SPREAD, SPHERE_FLAME_OUTER_SPREAD, SPHERE_FLAME_OUTER_SPREAD, 0.01);
    } catch (e) {}
    try {
        world.spawnParticle(Particle.FLAME, loc, SPHERE_FLAME_INNER,
            SPHERE_FLAME_INNER_SPREAD, SPHERE_FLAME_INNER_SPREAD, SPHERE_FLAME_INNER_SPREAD, 0.005);
    } catch (e2) {}
    if (UTIL && UTIL.spawnDust) {
        UTIL.spawnDust(world, loc, 255, 110, 35, SPHERE_DUST_COUNT, SPHERE_DUST_SIZE);
    }
}

function playFireCastSound(world, loc) {
    try { world.playSound(loc, Sound.ITEM_FIRECHARGE_USE, CAST_FIRECHARGE_VOL, CAST_FIRECHARGE_PITCH); } catch (e1) {
        try { world.playSound(loc, "minecraft:item.firecharge.use", CAST_FIRECHARGE_VOL, CAST_FIRECHARGE_PITCH); } catch (e1b) {}
    }
    try { world.playSound(loc, Sound.ENTITY_BLAZE_SHOOT, CAST_BLAZE_VOL, CAST_BLAZE_PITCH); } catch (e2) {
        try { world.playSound(loc, "minecraft:entity.blaze.shoot", CAST_BLAZE_VOL, CAST_BLAZE_PITCH); } catch (e2b) {}
    }
    try { world.playSound(loc, Sound.BLOCK_FIRE_AMBIENT, CAST_FIRE_AMBIENT_VOL, CAST_FIRE_AMBIENT_PITCH); } catch (e3) {
        try { world.playSound(loc, "minecraft:block.fire.ambient", CAST_FIRE_AMBIENT_VOL, CAST_FIRE_AMBIENT_PITCH); } catch (e3b) {}
    }
}

function playExplodeSound(world, loc) {
    try { world.playSound(loc, Sound.ENTITY_GENERIC_EXPLODE, HIT_EXPLODE_VOL, HIT_EXPLODE_PITCH); } catch (e1) {
        try { world.playSound(loc, "minecraft:entity.generic.explode", HIT_EXPLODE_VOL, HIT_EXPLODE_PITCH); } catch (e1b) {}
    }
    try { world.playSound(loc, Sound.ENTITY_FIREWORK_ROCKET_BLAST, HIT_FIREWORK_VOL, HIT_FIREWORK_PITCH); } catch (e2) {
        try { world.playSound(loc, "minecraft:entity.firework_rocket.blast", HIT_FIREWORK_VOL, HIT_FIREWORK_PITCH); } catch (e2b) {}
    }
}

function explodeAt(world, loc, dmg, caster, spellInfo) {
    try { world.spawnParticle(Particle.EXPLOSION, loc, 1, 0, 0, 0, 0); } catch (e1) {
        try { world.spawnParticle(Particle.EXPLOSION_LARGE, loc, 1, 0, 0, 0, 0); } catch (e2) {}
    }
    try {
        world.spawnParticle(Particle.FLAME, loc, EXPLODE_FLAME_COUNT,
            EXPLODE_FLAME_SPREAD, EXPLODE_FLAME_SPREAD, EXPLODE_FLAME_SPREAD, 0.04);
    } catch (e3) {}
    playExplodeSound(world, loc);

    var casterUuid = caster.getUniqueId().toString();
    var batchKey = spellInfo && spellInfo.name
        ? casterUuid + "|" + spellInfo.name + "|" + Date.now()
        : null;
    var near = world.getNearbyEntities(loc, EXPLODE_HALF, EXPLODE_HALF, EXPLODE_HALF);
    var it = near.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity)) continue;
        if (ent instanceof Player && ent.getUniqueId().toString() === casterUuid) continue;
        var hitInfo = { ring: spellInfo.ring, name: spellInfo.name };
        if (batchKey) hitInfo.batchKey = batchKey;
        if (UTIL && UTIL.dealPhysicalSpellDamage) {
            UTIL.dealPhysicalSpellDamage(ent, dmg, caster, hitInfo);
        } else {
            try { ent.damage(dmg, caster); } catch (e5) { try { ent.damage(dmg); } catch (e6) {} }
        }
    }
}

function getSessionApi() {
    try {
        if (PLUGIN.gltcSpellSessionApi != null) return PLUGIN.gltcSpellSessionApi;
    } catch (e0) {}
    return UTIL && UTIL.spellSession ? UTIL.spellSession : null;
}

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

/** uuid -> { sessionToken, projectiles: ArrayList } —— 多球并存，单主 session（#12B） */
function playerStateStore() {
    return sharedMap("gltc_huoqiu_state");
}

function getPlayerState(uuid) {
    uuid = uuidKey(uuid);
    var store = playerStateStore();
    var ps = store.get(uuid);
    if (ps == null) {
        ps = { sessionToken: null, projectiles: new java.util.ArrayList() };
        store.put(uuid, ps);
    }
    return ps;
}

function ensureMasterSession(player, uuid) {
    var ps = getPlayerState(uuid);
    if (ps.sessionToken != null) return ps;
    var api = getSessionApi();
    if (api && typeof api.begin === "function") {
        try {
            ps.sessionToken = api.begin(player, SPELL_ID, function() {
                clearAllBalls(uuid);
            }, { replace: false });
        } catch (eBeg) {}
    }
    return ps;
}

function tryEndMasterSession(uuid) {
    uuid = uuidKey(uuid);
    var store = playerStateStore();
    var ps = store.get(uuid);
    if (ps == null) return;
    if (ps.projectiles != null && ps.projectiles.size() > 0) return;
    if (ps.sessionToken) {
        var api = getSessionApi();
        if (api && typeof api.end === "function") {
            try { api.end(uuid, ps.sessionToken, false); } catch (eEnd) {}
        }
        ps.sessionToken = null;
    }
    try { store.remove(uuid); } catch (eRm) {}
}

function stopBall(st) {
    if (!st) return;
    st.alive = false;
    try { if (st.task != null) st.task.cancel(); } catch (e0) {}
}

function clearAllBalls(uuid) {
    uuid = uuidKey(uuid);
    var store = playerStateStore();
    var ps = store.get(uuid);
    if (ps == null) return;
    var list = ps.projectiles;
    if (list != null) {
        for (var i = 0; i < list.size(); i++) stopBall(list.get(i));
        list.clear();
    }
    if (ps.sessionToken) {
        var api = getSessionApi();
        if (api && typeof api.end === "function") {
            try { api.end(uuid, ps.sessionToken, false); } catch (e2) {}
        }
        ps.sessionToken = null;
    }
    try { store.remove(uuid); } catch (eR) {}
}

function detachBall(uuid, st) {
    uuid = uuidKey(uuid);
    var ps = playerStateStore().get(uuid);
    if (ps == null || ps.projectiles == null) return;
    try { ps.projectiles.remove(st); } catch (eRm) {}
    tryEndMasterSession(uuid);
}

try {
    if (UTIL && typeof UTIL.registerDirectClearHook === "function") {
        UTIL.registerDirectClearHook(SPELL_ID, function(p) {
            if (!p) return;
            clearAllBalls(p.getUniqueId().toString());
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
    cast: function(player, mageApi) {
        if (UTIL && UTIL.ensureSpellDamageListener) UTIL.ensureSpellDamageListener();

        var world = player.getWorld();
        var eye = player.getEyeLocation();
        var dir = eye.getDirection().normalize();
        var dmg = mageApi.calcSpellDamage(player, SPELL_COEFFICIENT);
        var loc = eye.clone().add(dir.clone().multiply(SPAWN_FORWARD));
        var uuid = String(player.getUniqueId().toString());
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var ticks = 0;
        playFireCastSound(world, eye);

        var st = { alive: true, task: null };
        var ps = ensureMasterSession(player, uuid);
        ps.projectiles.add(st);

        st.task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    if (!st.alive) {
                        try { st.task.cancel(); } catch (eDead) {}
                        return;
                    }
                    ticks++;
                    var stepX = dir.getX() * SPEED_PER_TICK;
                    var stepY = dir.getY() * SPEED_PER_TICK;
                    var stepZ = dir.getZ() * SPEED_PER_TICK;
                    loc.add(stepX, stepY, stepZ);
                    spawnFlameSphere(world, loc);

                    var doHitCheck = (HIT_CHECK_EVERY <= 1) || (ticks % HIT_CHECK_EVERY === 0) || (ticks >= MAX_TICKS);
                    if (doHitCheck) {
                        var hitSolid = false;
                        try {
                            var mid = loc.clone().add(-stepX * 0.5, -stepY * 0.5, -stepZ * 0.5);
                            if (mid.getBlock().getType().isSolid()) hitSolid = true;
                        } catch (eMid) {}
                        try { if (!hitSolid) hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}

                        var hitLiving = false;
                        var near = world.getNearbyEntities(loc, HIT_HALF, HIT_HALF, HIT_HALF);
                        var it = near.iterator();
                        while (it.hasNext()) {
                            var ent = it.next();
                            if (ent instanceof LivingEntity && !(ent instanceof Player && ent.getUniqueId().toString() === uuid)) {
                                hitLiving = true;
                                break;
                            }
                        }

                        if (hitLiving || hitSolid || ticks >= MAX_TICKS) {
                            var caster = null;
                            try {
                                var online = Bukkit.getOnlinePlayers().toArray();
                                for (var oi = 0; oi < online.length; oi++) {
                                    if (online[oi].getUniqueId().toString() === uuid) { caster = online[oi]; break; }
                                }
                            } catch (eP) {}
                            if (caster == null) caster = player;
                            explodeAt(world, loc, dmg, caster, spellInfo);
                            stopBall(st);
                            detachBall(uuid, st);
                            return;
                        }
                    }
                } catch (ex) {
                    stopBall(st);
                    detachBall(uuid, st);
                }
            }
        })), 0, 1);
        return true;
    }
});
