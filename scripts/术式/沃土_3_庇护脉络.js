// ===================================================================
// 术式：庇护脉络 —— 3环 · 沃土奥法（粒子环增益 + 推伤）
// ID：VASA_庇护脉络
// ===================================================================

var Bukkit = Java.type("org.bukkit.Bukkit");
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
var META_RUNTIME = "gltc_spell_runtime";

var SPELL_ID          = "VASA_庇护脉络";
var SPELL_NAME        = "庇护脉络";
var SPELL_RING        = 3;
var SPELL_SCHOOL      = "沃土";
var SPELL_BOOK        = true;
var SPELL_COOLDOWN_MS = 16000;
var SPELL_COEFFICIENT = 2.0;

var DURATION_TICKS    = 160;
var RING_RADIUS       = 2.5;
var RING_SEGMENTS     = 24;
var BUFF_INTERVAL     = 20;
var BUFF_DURATION_SEC = 5;
var KNOCKBACK         = 0.85;

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

var SOUND_CAST        = "item.totem.use";
var SOUND_CAST_VOL    = 0.55;
var SOUND_CAST_PITCH  = 1.4;

var BUFF_POOL = [
    PotionEffectType.INCREASE_DAMAGE, PotionEffectType.SPEED, PotionEffectType.JUMP,
    PotionEffectType.REGENERATION, PotionEffectType.DAMAGE_RESISTANCE, PotionEffectType.ABSORPTION
];

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

function playSound(world, loc) {
    if (world == null || loc == null) return;
    try { world.playSound(loc, SOUND_CAST, SOUND_CAST_VOL, SOUND_CAST_PITCH); return; } catch (e0) {}
    try { world.playSound(loc, String(SOUND_CAST), SOUND_CAST_VOL, SOUND_CAST_PITCH); } catch (e1) {}
}

function isRingTarget(ent, casterUuid) {
    if (ent == null) return false;
    try { if (!LivingEntity.class.isInstance(ent)) return false; } catch (e0) {
        try { if (!(ent instanceof LivingEntity)) return false; } catch (e1) { return false; }
    }
    try { if (ent.isDead()) return false; } catch (eDead) { return false; }
    try {
        if (Player.class.isInstance(ent) && String(ent.getUniqueId().toString()) === casterUuid) return false;
    } catch (ePl) {}
    try {
        var t = ent.getType();
        if (t === EntityType.ARMOR_STAND || t === EntityType.ITEM_DISPLAY) return false;
    } catch (eT) {}
    return true;
}

function distSq(a, b) {
    var dx = a.getX() - b.getX();
    var dy = a.getY() - b.getY();
    var dz = a.getZ() - b.getZ();
    return dx * dx + dy * dy + dz * dz;
}

function applyRandomBuff(player, seconds) {
    var ticks = Math.max(1, Math.floor(Number(seconds) * 20));
    try {
        player.addPotionEffect(
            new PotionEffect(BUFF_POOL[Math.floor(Math.random() * BUFF_POOL.length)], ticks, 0, false, true, true),
            true
        );
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
    var r2 = RING_RADIUS;
    for (var i = 0; i < RING_SEGMENTS; i++) {
        var ang = (Math.PI * 2 * i) / RING_SEGMENTS;
        try {
            var pt = ((i + tickIndex) % 2) === 0 ? TOTEM_PARTICLE : BONE_MEAL_PARTICLE;
            world.spawnParticle(pt, center.getX() + Math.cos(ang) * r2, center.getY() + 0.15, center.getZ() + Math.sin(ang) * r2, 1, 0, 0.05, 0, 0.01);
        } catch (eP) {}
    }
}

function pulseRing(runtime, player, center, dmg, ownerUuid, spellInfo) {
    applyRandomBuff(player, BUFF_DURATION_SEC);
    var world = player.getWorld();
    var r2 = RING_RADIUS * RING_RADIUS;
    var it = world.getNearbyEntities(center, RING_RADIUS, RING_RADIUS, RING_RADIUS).iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!isRingTarget(ent, ownerUuid)) continue;
        if (distSq(ent.getLocation(), center) > r2) continue;
        runtime.dealParticleSpellDamage(ent, dmg, player, spellInfo);
        applyKnockbackFrom(ent, center, KNOCKBACK);
    }
}

function castBiHuMaiLuo(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) return false;

    var dmg = calcSpellDamage(player, mageApi);
    var world = player.getWorld();
    var ownerUuid = String(player.getUniqueId().toString());
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME, spellId: SPELL_ID };
    var ticks = 0;
    var alive = true;
    var task = null;
    var token = null;

    function cleanup() {
        if (!alive) return;
        alive = false;
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
    }

    token = runtime.begin(player, SPELL_ID, new (Java.extend(java.lang.Runnable, { run: cleanup })), {
        persistence: runtime.SESSION_PROJECTED,
        replace: true
    });
    if (!token) return false;

    playSound(world, player.getLocation());
    pulseRing(runtime, player, player.getLocation().clone().add(0, 0.2, 0), dmg, ownerUuid, spellInfo);

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
                if (ticks % BUFF_INTERVAL === 0) pulseRing(runtime, player, center, dmg, ownerUuid, spellInfo);
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
