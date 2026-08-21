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
    var near = world.getNearbyEntities(loc, EXPLODE_HALF, EXPLODE_HALF, EXPLODE_HALF);
    var it = near.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity)) continue;
        if (ent instanceof Player && ent.getUniqueId().toString() === casterUuid) continue;
        if (UTIL && UTIL.dealPhysicalSpellDamage) {
            UTIL.dealPhysicalSpellDamage(ent, dmg, caster, spellInfo);
        } else {
            try { ent.damage(dmg, caster); } catch (e5) { try { ent.damage(dmg); } catch (e6) {} }
        }
    }
}

({
    id: "VASA_火球术",
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
        var uuid = player.getUniqueId().toString();
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var ticks = 0;
        playFireCastSound(world, eye);

        var task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    ticks++;
                    var stepX = dir.getX() * SPEED_PER_TICK;
                    var stepY = dir.getY() * SPEED_PER_TICK;
                    var stepZ = dir.getZ() * SPEED_PER_TICK;
                    // 中点+终点双检，降低高速穿墙漏判
                    var hitSolid = false;
                    try {
                        var mid = loc.clone().add(stepX * 0.5, stepY * 0.5, stepZ * 0.5);
                        if (mid.getBlock().getType().isSolid()) hitSolid = true;
                    } catch (eMid) {}
                    loc.add(stepX, stepY, stepZ);
                    spawnFlameSphere(world, loc);
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
                        try { task.cancel(); } catch (eC) {}
                        return;
                    }
                } catch (ex) {
                    try { task.cancel(); } catch (e10) {}
                }
            }
        })), 0, 1);
        return true;
    }
});
