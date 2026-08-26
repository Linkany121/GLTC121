// ===================================================================
// 术式：庇护脉络 —— 3环 · 沃土奥法（粒子环增益 + 推伤）
// ID：VASA_庇护脉络（与 items.yml 术式载体一致）
// 右键施展：周身粒子环持续存在，每秒随机增益自身并推伤环内敌对生物
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
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

var Monster = null;
var Enemy = null;
var Player = null;
try { Monster = Java.type("org.bukkit.entity.Monster"); } catch (eM) {}
try { Enemy = Java.type("org.bukkit.entity.Enemy"); } catch (eE) {}
try { Player = Java.type("org.bukkit.entity.Player"); } catch (eP) {}

// === 术式身份 / 登记导出 ===
var SPELL_ID          = "VASA_庇护脉络";
var SPELL_NAME        = "庇护脉络";
var SPELL_RING        = 3;
var SPELL_SCHOOL      = "沃土";
var SPELL_BOOK        = true;

// === 冷却 / 伤害 ===
var SPELL_COOLDOWN_MS = 16000;
var SPELL_COEFFICIENT = 2.0;

// === 粒子环 ===
var DURATION_TICKS    = 160;
var RING_RADIUS       = 2.5;
var RING_SEGMENTS     = 24;
var BUFF_INTERVAL     = 20;
var BUFF_DURATION_SEC = 5;
var KNOCKBACK         = 0.85;

// === 粒子类型 ===
var BONE_MEAL_PARTICLE = (function() {
    try { return Particle.HAPPY_VILLAGER; } catch (e0) {}
    try { return Particle.VILLAGER_HAPPY; } catch (e1) {}
    return Particle.END_ROD;
})();
var TOTEM_PARTICLE = (function() {
    try { return Particle.TOTEM_OF_UNDYING; } catch (e0) {}
    try { return Particle.TOTEM; } catch (e1) {}
    return Particle.ENCHANT;
})();

// === 施展音效 ===
var SOUND_CAST        = "item.totem.use";
var SOUND_CAST_VOL    = 0.55;
var SOUND_CAST_PITCH  = 1.4;

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

function isRingHostile(ent, casterUuid) {
    if (ent == null) return false;
    var living = false;
    try { living = LivingEntity.class.isInstance(ent); } catch (e0) {
        try { living = ent instanceof LivingEntity; } catch (e1) {}
    }
    if (!living) return false;
    try { if (ent.isDead()) return false; } catch (eDead) { return false; }
    try {
        if (Player != null && Player.class.isInstance(ent)) {
            return String(ent.getUniqueId().toString()) !== String(casterUuid);
        }
    } catch (ePl) {}
    if (Monster != null) {
        try { if (Monster.class.isInstance(ent)) return true; } catch (eM0) {}
    }
    if (Enemy != null) {
        try { if (Enemy.class.isInstance(ent)) return true; } catch (eE0) {}
    }
    return false;
}

function horizontalDistance(a, b) {
    var dx = a.getX() - b.getX();
    var dz = a.getZ() - b.getZ();
    return Math.sqrt(dx * dx + dz * dz);
}

function applyRandomBuff(player, seconds) {
    var ticks = Math.max(1, Math.floor(Number(seconds) * 20));
    var pool = [
        PotionEffectType.INCREASE_DAMAGE, PotionEffectType.SPEED, PotionEffectType.JUMP,
        PotionEffectType.REGENERATION, PotionEffectType.DAMAGE_RESISTANCE, PotionEffectType.ABSORPTION
    ];
    try {
        player.addPotionEffect(new PotionEffect(pool[Math.floor(Math.random() * pool.length)], ticks, 0, false, true, true));
    } catch (e) {}
}

function applyKnockbackFrom(ent, center, strength) {
    try {
        var el = ent.getLocation();
        var dx = el.getX() - center.getX();
        var dz = el.getZ() - center.getZ();
        var len = Math.sqrt(dx * dx + dz * dz) || 1;
        if (len < 0.01) { dx = Math.random() - 0.5; dz = Math.random() - 0.5; len = Math.sqrt(dx * dx + dz * dz) || 1; }
        ent.setVelocity(ent.getVelocity().add(new Vector(dx / len * strength, 0.35, dz / len * strength)));
    } catch (e) {}
}

function spawnRingParticles(world, center, tickIndex) {
    for (var i = 0; i < RING_SEGMENTS; i++) {
        var ang = (Math.PI * 2 * i) / RING_SEGMENTS;
        var x = center.getX() + Math.cos(ang) * RING_RADIUS;
        var z = center.getZ() + Math.sin(ang) * RING_RADIUS;
        var y = center.getY() + 0.15;
        try {
            var pt = ((i + tickIndex) % 2) === 0 ? TOTEM_PARTICLE : BONE_MEAL_PARTICLE;
            world.spawnParticle(pt, x, y, z, 1, 0, 0.05, 0, 0.01);
        } catch (eP) {}
    }
}

function castBiHuMaiLuo(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) return false;

    var dmg = calcSpellDamage(player, mageApi);
    var world = player.getWorld();
    var ticks = 0;
    var alive = true;
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME, spellId: SPELL_ID };
    var task = null;
    var token = null;

    function cleanup() {
        if (!alive) return;
        alive = false;
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
    }

    token = runtime.begin(player, SPELL_ID, new (Java.extend(java.lang.Runnable, {
        run: cleanup
    })), {
        persistence: runtime.SESSION_PROJECTED,
        replace: true
    });
    if (!token) return false;

    playSpellSound(world, player.getLocation(), SOUND_CAST, SOUND_CAST_VOL, SOUND_CAST_PITCH);

    var ownerUuid = String(player.getUniqueId().toString());

    function pulseRing(center) {
        applyRandomBuff(player, BUFF_DURATION_SEC);
        var nearby = world.getNearbyEntities(center, RING_RADIUS, RING_RADIUS, RING_RADIUS).iterator();
        while (nearby.hasNext()) {
            var ent = nearby.next();
            if (!isRingHostile(ent, ownerUuid)) continue;
            if (horizontalDistance(ent.getLocation(), center) > RING_RADIUS) continue;
            runtime.dealParticleSpellDamage(ent, dmg, player, spellInfo);
            applyKnockbackFrom(ent, center, KNOCKBACK);
        }
    }

    pulseRing(player.getLocation().clone().add(0, 0.2, 0));

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
                var center = player.getLocation().clone().add(0, 0.2, 0);
                spawnRingParticles(world, center, ticks);

                if (ticks % BUFF_INTERVAL === 0) {
                    pulseRing(center);
                }

                if (ticks >= DURATION_TICKS) {
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
    cast: castBiHuMaiLuo
});
