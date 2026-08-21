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
var SPELL_NAME = "微风花流";
var SPELL_RING = 2;
var SPELL_COST = 3;
var SPELL_COOLDOWN_MS = 3000;
var SPELL_COEFFICIENT = 1.5;

var FLY_SPEED = 8;
var MAX_DISTANCE = 32;
var HIT_HALF = 0.45;
var SPAWN_UP = 0.35;
var SPREAD_DEG = 20;
var TULIP_COUNT = 3;
var LAUNCH_WINDOW_TICKS = 20;
var BLIND_TICKS = 60;
var BLIND_AMP = 0;

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
// ======================== 配置结束 ========================

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
    if (UTIL && UTIL.dealPulseSpellDamage) {
        UTIL.dealPulseSpellDamage(ent, dmg, caster, spellInfo, mageApi);
    } else if (mageApi && mageApi.dealPulseDamage) {
        mageApi.dealPulseDamage(ent, dmg, caster);
    } else {
        try { ent.damage(dmg, caster); } catch (e) {}
    }
    applyBlind(ent);
}

function launchOne(player, mageApi, mat, dmg, spellInfo) {
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = offsetDir(eye, SPREAD_DEG);
    var loc = player.getLocation().clone().add(0, 1.6 + SPAWN_UP, 0);
    var uuid = player.getUniqueId().toString();
    var ticks = 0;
    var display = spawnFlowerDisplay(world, loc, mat);

    try { world.playSound(loc, Sound.BLOCK_PINK_PETALS_PLACE, 0.7, 1.1 + Math.random() * 0.3); } catch (eS) {
        try { world.playSound(loc, Sound.BLOCK_GRASS_PLACE, 0.7, 1.25); } catch (eS2) {}
    }

    var task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                ticks++;
                var sx = dir.getX() * SPEED_PER_TICK;
                var sy = dir.getY() * SPEED_PER_TICK;
                var sz = dir.getZ() * SPEED_PER_TICK;
                var hitSolid = false;
                try {
                    var mid = loc.clone().add(sx * 0.5, sy * 0.5, sz * 0.5);
                    if (mid.getBlock().getType().isSolid()) hitSolid = true;
                } catch (eM) {}
                loc.add(sx, sy, sz);
                moveDisplay(display, loc);
                try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 1, 0.04, 0.04, 0.04, 0); } catch (eP) {}
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
                    removeDisplay(display);
                    try { task.cancel(); } catch (eC) {}
                }
            } catch (ex) {
                removeDisplay(display);
                try { task.cancel(); } catch (e10) {}
            }
        }
    })), 0, 1);
}

({
    id: "VASA_微风花流",
    name: SPELL_NAME,
    ring: SPELL_RING,
    cost: SPELL_COST,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: true,
    cast: function(player, mageApi) {
        var dmg = mageApi.calcSpellDamage(player, SPELL_COEFFICIENT);
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var used = {};
        var interval = Math.max(1, Math.floor(LAUNCH_WINDOW_TICKS / TULIP_COUNT));

        for (var i = 0; i < TULIP_COUNT; i++) {
            (function(idx) {
                var delay = idx * interval;
                Bukkit.getScheduler().runTaskLater(PLUGIN, new (Java.extend(java.lang.Runnable, {
                    run: function() {
                        try {
                            if (!player.isOnline()) return;
                            var mat = pickTulip(used);
                            launchOne(player, mageApi, mat, dmg, spellInfo);
                        } catch (e) {}
                    }
                }))(), delay);
            })(i);
        }
        return true;
    }
});
