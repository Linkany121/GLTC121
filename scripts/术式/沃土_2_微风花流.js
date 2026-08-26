// ===================================================================
// 术式：微风花流 —— 2环 · 沃土奥法（三朵直线郁金香）
// ID：VASA_微风花流（与 items.yml 术式载体一致）
// 右键施展：扇形发射 3 朵随机色郁金香，直线飞行，命中粒子伤害 + 失明
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Vector = Java.type("org.bukkit.util.Vector");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var META_SHARED = "gltc_shared_root_maps";
var META_RUNTIME = "gltc_spell_runtime";

// === 术式身份 / 登记导出 ===
var SPELL_ID          = "VASA_微风花流";
var SPELL_NAME        = "微风花流";
var SPELL_RING        = 2;
var SPELL_SCHOOL      = "沃土";
var SPELL_BOOK        = true;

// === 冷却 / 伤害 ===
var SPELL_COOLDOWN_MS = 3000;
var SPELL_COEFFICIENT = 1.2;

// === 展示实体 / 弹体 ===
var DISPLAY_SCALE     = 0.72;
var SPAWN_OFFSET      = 0.85;
var HIT_HALF          = 0.5;
var FLY_SPEED         = 24;
var MAX_DISTANCE      = 28;
var PROJECTILE_COUNT  = 3;
var SPREAD_OFFSET     = 0.35;

// === 花朵 / 粒子 / debuff ===
var TULIP_POOL = [
    Material.RED_TULIP, Material.ORANGE_TULIP,
    Material.WHITE_TULIP, Material.PINK_TULIP
];
var TRAIL_PARTICLE = (function() {
    try { return Particle.HAPPY_VILLAGER; } catch (e0) {}
    try { return Particle.VILLAGER_HAPPY; } catch (e1) {}
    return Particle.END_ROD;
})();
var TRAIL_COUNT       = 2;
var TRAIL_SPREAD      = 0.1;
var BLINDNESS_SEC     = 3;

// === 施展音效 ===
var SOUND_CAST        = "block.grass.break";
var SOUND_CAST_VOL    = 0.8;
var SOUND_CAST_PITCH  = 1.25;

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

function randomTulip() {
    return TULIP_POOL[Math.floor(Math.random() * TULIP_POOL.length)];
}

function applyBlindness(target, seconds) {
    try {
        target.addPotionEffect(new PotionEffect(PotionEffectType.BLINDNESS, Math.floor(seconds * 20), 0, false, true, true));
    } catch (e) {}
}

function perpOffset(dir, amount) {
    var px = -dir.getZ();
    var pz = dir.getX();
    var len = Math.sqrt(px * px + pz * pz) || 1;
    return new Vector(px / len * amount, 0, pz / len * amount);
}

function eyeSpawn(player) {
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();
    return {
        loc: eye.clone().add(dir.getX() * SPAWN_OFFSET, dir.getY() * SPAWN_OFFSET, dir.getZ() * SPAWN_OFFSET),
        dir: dir
    };
}

function launchStraightProjectile(player, mageApi, runtime, dmg, offsetVec) {
    var world = player.getWorld();
    var spawn = eyeSpawn(player);
    var loc = spawn.loc.clone();
    if (offsetVec != null) loc.add(offsetVec);
    var dir = spawn.dir.clone();
    var display = runtime.spawnFlyingItemDisplay(world, loc, randomTulip(), DISPLAY_SCALE);
    if (!display) return false;

    var ownerUuid = String(player.getUniqueId().toString());
    var speed = FLY_SPEED / 20.0;
    var traveled = 0;
    var alive = true;
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME, spellId: SPELL_ID };
    var task = null;
    var token = null;

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
                var prev = loc.clone();
                loc.add(dir.getX() * speed, dir.getY() * speed, dir.getZ() * speed);
                traveled += prev.distance(loc);
                runtime.moveFlyingDisplay(display, loc);
                try {
                    world.spawnParticle(TRAIL_PARTICLE, loc, TRAIL_COUNT, TRAIL_SPREAD, TRAIL_SPREAD, TRAIL_SPREAD, 0.01);
                } catch (eP) {}

                var hitSolid = false;
                try { hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}
                var hitEnt = findHit(world, loc, ownerUuid);
                if (!hitEnt && !hitSolid && traveled < MAX_DISTANCE) return;

                if (hitEnt) {
                    runtime.dealParticleSpellDamage(hitEnt, dmg, player, spellInfo);
                    applyBlindness(hitEnt, BLINDNESS_SEC);
                }
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

function castWeiFengHuaLiu(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) return false;

    var dmg = calcSpellDamage(player, mageApi);
    var spawn = eyeSpawn(player);
    var offsets = [
        perpOffset(spawn.dir, -SPREAD_OFFSET),
        perpOffset(spawn.dir, 0),
        perpOffset(spawn.dir, SPREAD_OFFSET)
    ];
    var ok = false;
    for (var i = 0; i < PROJECTILE_COUNT; i++) {
        if (launchStraightProjectile(player, mageApi, runtime, dmg, offsets[i])) ok = true;
    }
    if (ok) playSpellSound(player.getWorld(), spawn.loc, SOUND_CAST, SOUND_CAST_VOL, SOUND_CAST_PITCH);
    return ok;
}

({
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: SPELL_BOOK,
    school: SPELL_SCHOOL,
    cast: castWeiFengHuaLiu
});
