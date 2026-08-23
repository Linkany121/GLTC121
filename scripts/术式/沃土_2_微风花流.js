/**
 * 术式：微风花流 —— 2环 · 沃土奥法流派
 * 1 秒内先后发射 3 朵随机色郁金香；触碰造成粒子伤害并失明；可被方块阻挡
 * ID：VASA_微风花流
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Vector = Java.type("org.bukkit.util.Vector");
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

// ======================== 微风花流 · 可调配置 ========================
// 改完后重载附属 / 重新加载术式脚本生效

/** 物品 / 登记 ID */
var SPELL_ID = "VASA_微风花流";
/** 显示名（播报 / 登记） */
var SPELL_NAME = "微风花流";
/** 环数 */
var SPELL_RING = 2;
/** 粒子消耗 */
var SPELL_COST = 3;
/** 冷却（毫秒） */
var SPELL_COOLDOWN_MS = 3000;
/** 伤害系数（最终 = 粒子强度 × 系数 × GLI） */
var SPELL_COEFFICIENT = 1.5;

/** 飞行速度（格/秒） */
var FLY_SPEED = 16;
/** 最大飞行距离（格）；超时消散 */
var MAX_DISTANCE = 32;
/** 触碰生物的判定半宽（格） */
var HIT_HALF = 0.45;
/** 出生点相对眼睛向上偏移（格） */
var SPAWN_UP = 0.35;
/** 各朵发射方向随机散射角（度） */
var SPREAD_DEG = 10;
/** 一次施放发射朵数 */
var TULIP_COUNT = 3;
/** 全部发射完的时间窗口（tick）；20 = 1 秒内陆续打出 */
var LAUNCH_WINDOW_TICKS = 20;
/** 命中失明持续（tick）；60 = 3 秒 */
var BLIND_TICKS = 60;
/** 失明等级（0 = I） */
var BLIND_AMP = 0;
/** 碰撞检测间隔（tick）；位移仍每 tick */
var HIT_CHECK_EVERY = 2;

/** 可选郁金香材质名（随机不重复优先） */
var TULIP_NAMES = ["RED_TULIP", "ORANGE_TULIP", "WHITE_TULIP", "PINK_TULIP"];

function resolveMat(name) {
    try {
        var m = Material.matchMaterial(name);
        if (m != null) return m;
    } catch (e0) {}
    try { return Material.valueOf(name); } catch (e1) { return null; }
}

var TULIPS = [];
for (var ti = 0; ti < TULIP_NAMES.length; ti++) {
    var tm = resolveMat(TULIP_NAMES[ti]);
    if (tm != null) TULIPS.push(tm);
}
if (TULIPS.length === 0) {
    var fb = resolveMat("POPPY") || resolveMat("DANDELION");
    if (fb != null) TULIPS.push(fb);
}
// ======================== 配置结束（以下勿随意改） ========================

var SPEED_PER_TICK = FLY_SPEED / 20.0;
var MAX_TICKS = Math.ceil(MAX_DISTANCE / SPEED_PER_TICK);

function pickTulip(used) {
    var pool = [];
    for (var i = 0; i < TULIPS.length; i++) {
        if (!TULIPS[i]) continue;
        var nm = String(TULIPS[i].name());
        if (!used[nm]) pool.push(TULIPS[i]);
    }
    if (pool.length === 0) pool = TULIPS.slice(0);
    var m = pool[Math.floor(Math.random() * pool.length)];
    if (m) used[String(m.name())] = true;
    return m || TULIPS[0];
}

function offsetDir(base, deg) {
    var yawOff = (Math.random() * 2 - 1) * deg;
    var pitchOff = (Math.random() * 2 - 1) * deg * 0.5;
    var loc = base.clone();
    loc.setYaw(loc.getYaw() + yawOff);
    loc.setPitch(Math.max(-89, Math.min(89, loc.getPitch() + pitchOff)));
    return loc.getDirection().normalize();
}

function spawnFlowerDisplay(world, loc, mat) {
    if (UTIL && UTIL.spawnFlyingItemDisplay) {
        return UTIL.spawnFlyingItemDisplay(world, loc, mat, 0.85);
    }
    return null;
}

function moveDisplay(entry, loc) {
    if (UTIL && UTIL.moveFlyingDisplay) UTIL.moveFlyingDisplay(entry, loc);
}

function removeDisplay(entry) {
    if (UTIL && UTIL.removeFlyingDisplay) UTIL.removeFlyingDisplay(entry);
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

function applyBlind(ent) {
    try {
        var type = PotionEffectType.getByName("BLINDNESS");
        if (type == null) return;
        ent.addPotionEffect(new PotionEffect(type, BLIND_TICKS, BLIND_AMP, false, true, true));
    } catch (e) {}
}

function dealHit(ent, dmg, caster, mageApi, spellInfo) {
    if (UTIL && UTIL.dealParticleSpellDamage) {
        UTIL.dealParticleSpellDamage(ent, dmg, caster, spellInfo);
    } else {
        try { ent.damage(dmg, caster); } catch (e) {}
    }
    applyBlind(ent);
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

/** uuid -> { alive, sessionToken, delayTasks[], delayPending, projectiles[] } */
function waveStore() {
    return sharedMap("gltc_weifeng_wave");
}

function stopProjectile(proj) {
    if (!proj) return;
    proj.alive = false;
    try { if (proj.task != null) proj.task.cancel(); } catch (e0) {}
    try { removeDisplay(proj.display); } catch (e1) {}
    proj.display = null;
}

function stopWave(uuid, invokeSessionEnd) {
    uuid = uuidKey(uuid);
    var store = waveStore();
    var wave = null;
    try { wave = store.remove(uuid); } catch (e0) {}
    if (wave == null) return;
    wave.alive = false;
    if (wave.delayTasks) {
        for (var i = 0; i < wave.delayTasks.length; i++) {
            try { Bukkit.getScheduler().cancelTask(Number(wave.delayTasks[i])); } catch (e1) {}
        }
    }
    if (wave.projectiles) {
        for (var j = 0; j < wave.projectiles.length; j++) stopProjectile(wave.projectiles[j]);
    }
    if (invokeSessionEnd && wave.sessionToken) {
        try {
            var api = getSessionApi();
            if (api && typeof api.end === "function") api.end(uuid, wave.sessionToken, false);
        } catch (e2) {}
    }
}

function detachProjectile(wave, proj) {
    if (!wave || !wave.projectiles) return;
    var kept = [];
    for (var i = 0; i < wave.projectiles.length; i++) {
        if (wave.projectiles[i] !== proj) kept.push(wave.projectiles[i]);
    }
    wave.projectiles = kept;
}

try {
    if (UTIL && typeof UTIL.registerDirectClearHook === "function") {
        UTIL.registerDirectClearHook(SPELL_ID, function(p) {
            if (!p) return;
            stopWave(p.getUniqueId().toString(), false);
        });
    }
} catch (eHook) {}

function launchOne(wave, player, mageApi, mat, dmg, spellInfo) {
    if (!wave || !wave.alive) return;
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = offsetDir(eye, SPREAD_DEG);
    var loc = player.getLocation().clone().add(0, 1.6 + SPAWN_UP, 0);
    var uuid = String(player.getUniqueId().toString());
    var ticks = 0;
    var display = spawnFlowerDisplay(world, loc, mat);

    var proj = { alive: true, task: null, display: display };
    wave.projectiles.push(proj);

    try { world.playSound(loc, Sound.BLOCK_PINK_PETALS_PLACE, 0.7, 1.1 + Math.random() * 0.3); } catch (eS) {
        try { world.playSound(loc, Sound.BLOCK_GRASS_PLACE, 0.7, 1.25); } catch (eS2) {}
    }

    proj.task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!wave.alive || !proj.alive) {
                    stopProjectile(proj);
                    try { proj.task.cancel(); } catch (eDead) {}
                    return;
                }
                ticks++;
                var sx = dir.getX() * SPEED_PER_TICK;
                var sy = dir.getY() * SPEED_PER_TICK;
                var sz = dir.getZ() * SPEED_PER_TICK;
                loc.add(sx, sy, sz);
                moveDisplay(proj.display, loc);
                try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 1, 0.04, 0.04, 0.04, 0); } catch (eP) {}

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
                        try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 14, 0.2, 0.2, 0.2, 0.02); } catch (eH) {}
                        stopProjectile(proj);
                        detachProjectile(wave, proj);
                        if (wave.alive && wave.projectiles.length === 0
                            && (!wave.delayTasks || wave.delayPending <= 0)) {
                            stopWave(uuid, true);
                        }
                    }
                }
            } catch (ex) {
                stopProjectile(proj);
                detachProjectile(wave, proj);
            }
        }
    })), 0, 1);
}

({
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cost: SPELL_COST,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: true,
    cast: function(player, mageApi) {
        var uuid = String(player.getUniqueId().toString());
        // 重施：清旧波次（含未发射的延迟与在飞弹体）
        stopWave(uuid, true);

        var dmg = mageApi.calcSpellDamage(player, SPELL_COEFFICIENT);
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var used = {};
        var interval = Math.max(1, Math.floor(LAUNCH_WINDOW_TICKS / TULIP_COUNT));

        var wave = {
            alive: true,
            sessionToken: null,
            delayTasks: [],
            delayPending: TULIP_COUNT,
            projectiles: []
        };
        waveStore().put(uuidKey(uuid), wave);

        var api = getSessionApi();
        if (api && typeof api.begin === "function") {
            try {
                wave.sessionToken = api.begin(player, SPELL_ID, function() {
                    stopWave(uuid, false);
                }, { replace: true });
            } catch (eBeg) {}
        }

        for (var i = 0; i < TULIP_COUNT; i++) {
            (function(idx) {
                var delay = idx * interval;
                var later = Bukkit.getScheduler().runTaskLater(PLUGIN, new (Java.extend(java.lang.Runnable, {
                    run: function() {
                        try {
                            wave.delayPending = Math.max(0, (wave.delayPending || 0) - 1);
                            if (!wave.alive) return;
                            var key = uuidKey(uuid);
                            if (waveStore().get(key) !== wave) return;
                            var p = findOnline(uuid);
                            if (p == null || !p.isOnline()) {
                                stopWave(uuid, true);
                                return;
                            }
                            var mat = pickTulip(used);
                            launchOne(wave, p, mageApi, mat, dmg, spellInfo);
                        } catch (e) {}
                    }
                })), delay);
                try { wave.delayTasks.push(later.getTaskId()); } catch (eId) {}
            })(i);
        }
        return true;
    }
});
