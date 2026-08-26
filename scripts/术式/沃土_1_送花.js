// ===================================================================
// 术式：送花 —— 1环 · 沃土奥法（抛物线单朵弹体）
// ID：VASA_送花（与 items.yml 术式载体一致）
// 右键施展：发射一朵随机单格花，抛物线飞行，命中造成粒子伤害
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var META_SHARED = "gltc_shared_root_maps";
var META_RUNTIME = "gltc_spell_runtime";

// === 术式身份 / 登记导出 ===
var SPELL_ID          = "VASA_送花";
var SPELL_NAME        = "送花";
var SPELL_RING        = 1;
var SPELL_SCHOOL      = "沃土";
var SPELL_BOOK        = true;

// === 冷却 / 伤害 ===
var SPELL_COOLDOWN_MS = 2000;
var SPELL_COEFFICIENT = 1.0;

// === 展示实体 / 弹体 ===
var DISPLAY_SCALE     = 0.72;
var SPAWN_OFFSET      = 0.85;
var HIT_HALF          = 0.5;
var FLY_SPEED         = 24;
var MAX_DISTANCE      = 28;
var GRAVITY_PER_TICK  = 0.04;

// === 花朵 / 粒子 ===
var FLOWER_POOL = [
    Material.DANDELION, Material.POPPY, Material.BLUE_ORCHID, Material.ALLIUM,
    Material.AZURE_BLUET, Material.OXEYE_DAISY, Material.CORNFLOWER,
    Material.LILY_OF_THE_VALLEY
];
var TRAIL_PARTICLE = (function() {
    try { return Particle.HAPPY_VILLAGER; } catch (e0) {}
    try { return Particle.VILLAGER_HAPPY; } catch (e1) {}
    return Particle.END_ROD;
})();
var TRAIL_COUNT       = 2;
var TRAIL_SPREAD      = 0.1;

// === 施展音效 ===
var SOUND_CAST        = "block.grass.place";
var SOUND_CAST_VOL    = 0.75;
var SOUND_CAST_PITCH  = 1.35;

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
    var p = PLUGIN;
    try {
        if (p != null && p.hasMetadata(META_RUNTIME)) {
            var direct = p.getMetadata(META_RUNTIME).get(0).value();
            if (direct != null) return direct;
        }
        if (p != null && p.hasMetadata(META_SHARED)) {
            var root = p.getMetadata(META_SHARED).get(0).value();
            if (root != null) {
                var hit = root.get("gltcSpellRuntime");
                if (hit != null) return hit;
            }
        }
        if (p != null && p.gltcSpellRuntime != null) return p.gltcSpellRuntime;
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

function castSongHua(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) return false;

    var dmg = calcSpellDamage(player, mageApi);
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();
    var loc = eye.clone().add(dir.getX() * SPAWN_OFFSET, dir.getY() * SPAWN_OFFSET, dir.getZ() * SPAWN_OFFSET);
    var display = runtime.spawnFlyingItemDisplay(world, loc, randomFlower(), DISPLAY_SCALE);
    if (!display) return false;

    var ownerUuid = String(player.getUniqueId().toString());
    var speed = FLY_SPEED / 20.0;
    var velX = dir.getX() * speed;
    var velY = dir.getY() * speed;
    var velZ = dir.getZ() * speed;
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
        replace: true
    });
    if (!token) {
        try { runtime.removeFlyingDisplay(display); } catch (eD0) {}
        return false;
    }

    playSpellSound(world, loc, SOUND_CAST, SOUND_CAST_VOL, SOUND_CAST_PITCH);

    task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!alive) return;
                var prev = loc.clone();
                loc.add(velX, velY, velZ);
                velY -= GRAVITY_PER_TICK;
                traveled += prev.distance(loc);
                runtime.moveFlyingDisplay(display, loc);
                try {
                    world.spawnParticle(TRAIL_PARTICLE, loc, TRAIL_COUNT, TRAIL_SPREAD, TRAIL_SPREAD, TRAIL_SPREAD, 0.01);
                } catch (eP) {}

                var hitSolid = false;
                try { hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}
                var hitEnt = findHit(world, loc, ownerUuid);
                if (!hitEnt && !hitSolid && traveled < MAX_DISTANCE) return;

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

({
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: SPELL_BOOK,
    school: SPELL_SCHOOL,
    cast: castSongHua
});
