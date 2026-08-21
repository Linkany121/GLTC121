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
var SPELL_NAME = "送花";
var SPELL_RING = 1;
var SPELL_COST = 1;
var SPELL_COOLDOWN_MS = 1000;
var SPELL_COEFFICIENT = 1.2;

var FLY_SPEED = 5;
var MAX_DISTANCE = 32;
var HIT_HALF = 0.45;
var SPAWN_FORWARD = 0.7;
var FLOWER_MAT = null;
try { FLOWER_MAT = Material.matchMaterial("POPPY"); } catch (e0) {}
if (FLOWER_MAT == null) {
    try { FLOWER_MAT = Material.valueOf("POPPY"); } catch (e1) {}
}
if (FLOWER_MAT == null) {
    try { FLOWER_MAT = Material.POPPY; } catch (e2) {}
}
// ======================== 配置结束 ========================

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
    if (UTIL && UTIL.dealPulseSpellDamage) {
        UTIL.dealPulseSpellDamage(ent, dmg, caster, spellInfo, mageApi);
    } else if (mageApi && mageApi.dealPulseDamage) {
        mageApi.dealPulseDamage(ent, dmg, caster);
    } else {
        try { ent.damage(dmg, caster); } catch (e) {}
    }
}

({
    id: "VASA_送花",
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
        var uuid = player.getUniqueId().toString();
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var ticks = 0;
        var display = spawnFlowerDisplay(world, loc);

        try { world.playSound(eye, Sound.BLOCK_PINK_PETALS_PLACE, 0.9, 1.2); } catch (eS) {
            try { world.playSound(eye, Sound.BLOCK_GRASS_PLACE, 0.9, 1.35); } catch (eS2) {}
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
                    try { world.spawnParticle(Particle.CHERRY_LEAVES, loc, 2, 0.05, 0.05, 0.05, 0); } catch (eP) {}
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
                        removeDisplay(display);
                        try { task.cancel(); } catch (eC) {}
                    }
                } catch (ex) {
                    removeDisplay(display);
                    try { task.cancel(); } catch (e10) {}
                }
            }
        })), 0, 1);
        return true;
    }
});
