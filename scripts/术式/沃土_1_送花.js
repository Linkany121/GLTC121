/**
 * 术式：送花 —— 1环 · 沃土奥法流派
 * 发射方块虞美人，触碰敌人造成粒子伤害；可被方块阻挡
 * ID：VASA_送花
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
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

// ======================== 送花 · 可调配置 ========================
// 改完后重载附属 / 重新加载术式脚本生效

/** 物品 / 登记 ID */
var SPELL_ID = "VASA_送花";
/** 显示名（播报 / 登记） */
var SPELL_NAME = "送花";
/** 环数 */
var SPELL_RING = 1;
/** 保留字段（当前无粒子消耗） */
var SPELL_COST = 1;
/** 冷却（毫秒） */
var SPELL_COOLDOWN_MS = 1000;
/** 伤害系数（最终 = 粒子强度 × 系数 × GLI） */
var SPELL_COEFFICIENT = 1.2;

/** 飞行速度（格/秒） */
var FLY_SPEED = 10;
/** 最大飞行距离（格）；超时消散 */
var MAX_DISTANCE = 32;
/** 触碰生物的判定半宽（格） */
var HIT_HALF = 0.45;
/** 出生点相对眼睛向前偏移（格） */
var SPAWN_FORWARD = 0.7;
/** 碰撞检测间隔（tick）；位移仍每 tick */
var HIT_CHECK_EVERY = 2;
/** 飞行展示体材质（默认虞美人） */
var FLOWER_MAT = null;
try { FLOWER_MAT = Material.matchMaterial("POPPY"); } catch (e0) {}
if (FLOWER_MAT == null) {
    try { FLOWER_MAT = Material.valueOf("POPPY"); } catch (e1) {}
}
if (FLOWER_MAT == null) {
    try { FLOWER_MAT = Material.POPPY; } catch (e2) {}
}
// ======================== 配置结束（以下勿随意改） ========================

var SPEED_PER_TICK = FLY_SPEED / 20.0;
var MAX_TICKS = Math.ceil(MAX_DISTANCE / SPEED_PER_TICK);

function spawnFlowerDisplay(world, loc) {
    if (UTIL && UTIL.spawnFlyingItemDisplay) {
        return UTIL.spawnFlyingItemDisplay(world, loc, FLOWER_MAT, 0.9);
    }
    return null;
}

function moveDisplay(entry, loc) {
    if (UTIL && UTIL.moveFlyingDisplay) UTIL.moveFlyingDisplay(entry, loc);
}

function removeDisplay(entry) {
    if (UTIL && UTIL.removeFlyingDisplay) UTIL.removeFlyingDisplay(entry);
}

function hitFx(world, loc) {
    try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 18, 0.25, 0.25, 0.25, 0.02); } catch (e0) {
        try { world.spawnParticle(Particle.FALLING_SPORE_BLOSSOM, loc, 12, 0.2, 0.2, 0.2, 0); } catch (e1) {}
    }
    try { world.playSound(loc, Sound.BLOCK_GRASS_BREAK, 0.8, 1.3); } catch (e2) {}
}

function findOnline(uuid) {
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].getUniqueId().toString() === uuid) return arr[i];
        }
    } catch (e) {}
    return null;
}

function dealHit(ent, dmg, caster, mageApi, spellInfo) {
    try {
        var bridge = PLUGIN.gltcSpellUtilBridge;
        if (bridge != null) {
            bridge.dealParticleSpellDamage(ent, dmg, caster, spellInfo.ring, spellInfo.name);
            return;
        }
    } catch (eBr) {}
    if (UTIL && UTIL.dealParticleSpellDamage) {
        UTIL.dealParticleSpellDamage(ent, dmg, caster, spellInfo);
    } else {
        try { ent.damage(dmg, caster); } catch (e) {}
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

/** uuid -> { sessionToken, projectiles: ArrayList } —— 多弹并存，单主 session（#12B） */
function playerStateStore() {
    return sharedMap("gltc_songhua_state");
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
                clearAllProjectiles(uuid);
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

function stopProjectile(st) {
    if (!st) return;
    st.alive = false;
    try { if (st.task != null) st.task.cancel(); } catch (e0) {}
    try { removeDisplay(st.display); } catch (e1) {}
    st.display = null;
}

function clearAllProjectiles(uuid) {
    uuid = uuidKey(uuid);
    var store = playerStateStore();
    var ps = store.get(uuid);
    if (ps == null) return;
    var list = ps.projectiles;
    if (list != null) {
        for (var i = 0; i < list.size(); i++) stopProjectile(list.get(i));
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

function detachProjectile(uuid, st) {
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
            clearAllProjectiles(p.getUniqueId().toString());
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
        var world = player.getWorld();
        var eye = player.getEyeLocation();
        var dir = eye.getDirection().normalize();
        var dmg = mageApi.calcSpellDamage(player, SPELL_COEFFICIENT);
        var loc = eye.clone().add(dir.clone().multiply(SPAWN_FORWARD));
        var uuid = String(player.getUniqueId().toString());
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var ticks = 0;
        var display = spawnFlowerDisplay(world, loc);

        var st = { alive: true, task: null, display: display };
        var ps = ensureMasterSession(player, uuid);
        ps.projectiles.add(st);

        try { world.playSound(eye, Sound.BLOCK_PINK_PETALS_PLACE, 0.9, 1.2); } catch (eS) {
            try { world.playSound(eye, Sound.BLOCK_GRASS_PLACE, 0.9, 1.35); } catch (eS2) {}
        }

        st.task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    if (!st.alive) {
                        try { st.task.cancel(); } catch (eDead) {}
                        return;
                    }
                    ticks++;
                    var sx = dir.getX() * SPEED_PER_TICK;
                    var sy = dir.getY() * SPEED_PER_TICK;
                    var sz = dir.getZ() * SPEED_PER_TICK;
                    loc.add(sx, sy, sz);
                    moveDisplay(st.display, loc);
                    try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 2, 0.05, 0.05, 0.05, 0); } catch (eP) {}

                    var doHitCheck = (HIT_CHECK_EVERY <= 1) || (ticks % HIT_CHECK_EVERY === 0) || (ticks >= MAX_TICKS);
                    if (doHitCheck) {
                        var hitSolid = false;
                        try {
                            var mid = loc.clone().add(-sx * 0.5, -sy * 0.5, -sz * 0.5);
                            if (mid.getBlock().getType().isSolid()) hitSolid = true;
                        } catch (eM) {}
                        try { if (!hitSolid) hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}

                        var hitEnt = null;
                        var near = world.getNearbyEntities(loc, HIT_HALF, HIT_HALF, HIT_HALF);
                        var it = near.iterator();
                        while (it.hasNext()) {
                            var ent = it.next();
                            if (!(ent instanceof LivingEntity)) continue;
                            if (ent instanceof Player && ent.getUniqueId().toString() === uuid) continue;
                            hitEnt = ent;
                            break;
                        }

                        if (hitEnt || hitSolid || ticks >= MAX_TICKS) {
                            var caster = findOnline(uuid) || player;
                            if (hitEnt) dealHit(hitEnt, dmg, caster, mageApi, spellInfo);
                            hitFx(world, loc);
                            stopProjectile(st);
                            detachProjectile(uuid, st);
                        }
                    }
                } catch (ex) {
                    stopProjectile(st);
                    detachProjectile(uuid, st);
                }
            }
        })), 0, 1);
        return true;
    }
});
