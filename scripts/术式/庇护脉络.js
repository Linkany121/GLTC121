/**
 * 术式：庇护脉络 —— 3环 · 沃土奥法流派
 * 活性涵粒子环绕 5 秒：每秒随机增益；推开并伤害附近敌人
 * ID：VASA_庇护脉络
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
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
var SPELL_NAME = "庇护脉络";
var SPELL_RING = 3;
var SPELL_COST = 10;
var SPELL_COOLDOWN_MS = 16000;
var SPELL_COEFFICIENT = 1.5;

var DURATION_TICKS = 100;
var DIAMETER = 3.0;
var RING_POINTS = 28;
var BUFF_TICKS = 100;
var BUFF_AMP = 0;
var KNOCKBACK = 0.85;
var KNOCKBACK_UP = 0.28;
// ======================== 配置结束 ========================

var RADIUS = DIAMETER / 2.0;

function resolveBuffTypes() {
    var names = [
        ["SPEED", "SPEED"],
        ["JUMP_BOOST", "JUMP"],
        ["HEALTH_BOOST", "HEALTH_BOOST"],
        ["RESISTANCE", "DAMAGE_RESISTANCE"],
        ["SATURATION", "SATURATION"],
        ["STRENGTH", "INCREASE_DAMAGE"]
    ];
    var out = [];
    for (var i = 0; i < names.length; i++) {
        var t = null;
        try { t = PotionEffectType.getByName(names[i][0]); } catch (e0) {}
        if (t == null) {
            try { t = PotionEffectType.getByName(names[i][1]); } catch (e1) {}
        }
        if (t != null) out.push(t);
    }
    return out;
}

var BUFF_TYPES = resolveBuffTypes();

function findOnline(uuid) {
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (arr[i].getUniqueId().toString() === uuid) return arr[i];
        }
    } catch (e) {}
    return null;
}

function spawnRingFx(world, center, phase) {
    for (var i = 0; i < RING_POINTS; i++) {
        var ang = (i / RING_POINTS) * Math.PI * 2 + phase;
        var x = center.getX() + Math.cos(ang) * RADIUS;
        var z = center.getZ() + Math.sin(ang) * RADIUS;
        var y = center.getY() + 0.9 + Math.sin(ang * 2 + phase * 2) * 0.15;
        var loc = center.clone();
        loc.setX(x); loc.setY(y); loc.setZ(z);
        try { world.spawnParticle(Particle.TOTEM_OF_UNDYING, loc, 1, 0, 0, 0, 0); } catch (e0) {
            try { world.spawnParticle(Particle.TOTEM, loc, 1, 0, 0, 0, 0); } catch (e1) {}
        }
        if (i % 2 === 0) {
            try { world.spawnParticle(Particle.EGG_CRACK, loc, 2, 0.05, 0.05, 0.05, 0); } catch (e2) {}
        }
    }
}

function applyRandomBuff(player) {
    if (!BUFF_TYPES.length) return;
    var type = BUFF_TYPES[Math.floor(Math.random() * BUFF_TYPES.length)];
    try {
        player.addPotionEffect(new PotionEffect(type, BUFF_TICKS, BUFF_AMP, false, true, true));
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

function pulseNearby(player, dmg, mageApi, spellInfo) {
    var center = player.getLocation();
    var world = player.getWorld();
    var uuid = player.getUniqueId().toString();
    var list = world.getNearbyEntities(center, RADIUS, RADIUS + 0.8, RADIUS);
    var it = list.iterator();
    var hitAny = false;
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (ent instanceof Player && ent.getUniqueId().toString() === uuid) continue;
        try { if (ent.getType() === EntityType.ARMOR_STAND) continue; } catch (eA) {}
        if (center.distance(ent.getLocation()) > RADIUS + 0.35) continue;
        hitAny = true;
        dealHit(ent, dmg, player, mageApi, spellInfo);
        try {
            var el = ent.getLocation();
            var dx = el.getX() - center.getX();
            var dz = el.getZ() - center.getZ();
            var len = Math.sqrt(dx * dx + dz * dz);
            if (len < 1e-4) { dx = 1; dz = 0; len = 1; }
            ent.setVelocity(new Vector((dx / len) * KNOCKBACK, KNOCKBACK_UP, (dz / len) * KNOCKBACK));
        } catch (eK) {}
    }
    return hitAny;
}

({
    id: "VASA_庇护脉络",
    name: SPELL_NAME,
    ring: SPELL_RING,
    cost: SPELL_COST,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: true,
    cast: function(player, mageApi) {
        var dmg = mageApi.calcSpellDamage(player, SPELL_COEFFICIENT);
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var uuid = player.getUniqueId().toString();
        var ticks = 0;
        var phase = 0;

        try {
            player.getWorld().playSound(player.getLocation(), Sound.ITEM_TOTEM_USE, 0.55, 1.35);
        } catch (eS) {}

        var task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    ticks++;
                    phase += 0.22;
                    var p = findOnline(uuid);
                    if (p == null || !p.isOnline()) {
                        try { task.cancel(); } catch (eC0) {}
                        return;
                    }
                    var center = p.getLocation();
                    spawnRingFx(p.getWorld(), center, phase);

                    // 每秒：增益 + 推伤
                    if (ticks % 20 === 1) {
                        applyRandomBuff(p);
                        pulseNearby(p, dmg, mageApi, spellInfo);
                        try { p.getWorld().playSound(center, Sound.BLOCK_AMETHYST_BLOCK_CHIME, 0.45, 1.4); } catch (eA) {}
                    }

                    if (ticks >= DURATION_TICKS) {
                        try { p.getWorld().playSound(center, Sound.BLOCK_BEACON_DEACTIVATE, 0.5, 1.2); } catch (eE) {}
                        try { task.cancel(); } catch (eC) {}
                    }
                } catch (ex) {
                    try { task.cancel(); } catch (e10) {}
                }
            }
        })), 0, 1);
        return true;
    }
});
