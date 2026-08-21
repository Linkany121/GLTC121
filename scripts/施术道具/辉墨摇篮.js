/**
 * VASA 辉墨摇篮 —— 序列4 法杖
 * - 站立右键：施术
 * - 蹲下右键：唤出选术环时释放光影废墟（护身）；已开环时再蹲下右键只关环
 *
 * 粒子修正伤害 = 倍率 × 粒子强度 × 粒子浓度(GLI)，走脉冲伤害
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle$DustOptions");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Vector = Java.type("org.bukkit.util.Vector");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var STAFF_ID = "VASA_辉墨摇篮";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

var CAST_API = null;
var MAGE_API = null;

// ---- 数值 ----
var ABILITY_CD_MS = 30000;         // 水墨爆开冷却 30 秒
var BUFF_TICKS = 100;              // 5 秒
var RESIST_AMP = 0;                // 抗性提升 I
var SPEED_AMP = 1;                 // 速度 II
var BLAST_RADIUS = 15.0;
var BLAST_MULT = 10.0;
var KNOCKBACK_FORCE = 3;         // 强力击退
var KNOCKBACK_UP = 0.55;
var EXPAND_TICKS = 32;             // 扩散动画约 1.6 秒（特效更复杂）

// ---- 水墨特效调色 ----
var INK_DUST = new DustOptions(Color.fromRGB(28, 28, 36), 1.55);
var INK_DEEP = new DustOptions(Color.fromRGB(12, 12, 18), 1.85);
var LIGHT_DUST = new DustOptions(Color.fromRGB(235, 235, 245), 1.25);
var GRAY_DUST = new DustOptions(Color.fromRGB(130, 130, 145), 1.1);
var SILVER_DUST = new DustOptions(Color.fromRGB(190, 200, 220), 1.0);
var VIOLET_DUST = new DustOptions(Color.fromRGB(90, 70, 120), 1.15);
var MIST_DUST = new DustOptions(Color.fromRGB(70, 75, 90), 1.35);

var TYPE_RESIST = PotionEffectType.getByName("RESISTANCE");
try { if (TYPE_RESIST == null) TYPE_RESIST = PotionEffectType.getByName("DAMAGE_RESISTANCE"); } catch (eR) {}
var TYPE_SPEED = PotionEffectType.getByName("SPEED");

/** 冷却：uuid -> 上次释放时间戳(ms) */
var cdMap = {};

function nowMs() {
    return Math.floor(Number(Date.now()));
}

function isAbilityOnCd(uuid) {
    var last = cdMap[uuid];
    if (last == null) return false;
    return (nowMs() - Number(last)) < ABILITY_CD_MS;
}

function cdLeftSec(uuid) {
    var last = Number(cdMap[uuid]) || 0;
    return Math.max(1, Math.ceil((ABILITY_CD_MS - (nowMs() - last)) / 1000));
}

function markAbilityCd(uuid) {
    cdMap[uuid] = nowMs();
}

function findScriptFile(rel) {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/" + rel),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/" + rel)
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) {
                    candidates.push(new File(list[i], "scripts/" + rel));
                }
            }
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists()) return candidates[c];
    }
    return null;
}

function evalExport(rel) {
    var file = findScriptFile(rel);
    if (!file) return null;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        return (0, eval)(code);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC辉墨摇篮] 加载 " + rel + " 失败: " + e);
        return null;
    }
}

function loadCastApi() {
    try {
        if (PLUGIN.gltcCastApi != null && typeof PLUGIN.gltcCastApi.handleStaffUse === "function") {
            CAST_API = PLUGIN.gltcCastApi;
            return true;
        }
    } catch (e0) {}
    var exported = evalExport("施术道具/施术核心.js");
    if (exported && typeof exported.handleStaffUse === "function") {
        CAST_API = exported;
        try { PLUGIN.gltcCastApi = exported; } catch (e1) {}
        return true;
    }
    return false;
}

function loadMageApi() {
    try {
        if (PLUGIN.gltcMageApi != null && typeof PLUGIN.gltcMageApi.dealPulseDamage === "function") {
            MAGE_API = PLUGIN.gltcMageApi;
            return true;
        }
    } catch (e0) {}
    if (MAGE_API && typeof MAGE_API.dealPulseDamage === "function") return true;
    var exported = evalExport("术士系统/核心.js");
    if (exported && typeof exported.dealPulseDamage === "function") {
        MAGE_API = exported;
        try { PLUGIN.gltcMageApi = exported; } catch (e1) {}
        return true;
    }
    return false;
}

loadCastApi();
loadMageApi();

function isThisStaff(item) {
    if (!item || item.getType() === Material.AIR) return false;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(item);
        return !!(sf && sf.getId() === STAFF_ID);
    } catch (e) { return false; }
}

function particleMod(player) {
    if (!loadMageApi()) return 1.0;
    try {
        var stats = MAGE_API.getTotalStats(player, false);
        var pp = Number(stats.particlePower) || 1;
        var gli = Number(MAGE_API.getGLI()) || 1;
        return Math.max(0.01, pp * gli);
    } catch (e) { return 1.0; }
}

function spawnDust(world, loc, count, ox, oy, oz, dust) {
    try {
        world.spawnParticle(Particle.DUST, loc, count, ox, oy, oz, 0, dust);
    } catch (e0) {
        try { world.spawnParticle(Particle.REDSTONE, loc, count, ox, oy, oz, 0, dust); } catch (e1) {}
    }
}

function locAt(center, x, y, z) {
    var pl = center.clone();
    pl.setX(x);
    pl.setY(y);
    pl.setZ(z);
    return pl;
}

function spawnInk(world, loc, count, spread) {
    spread = spread == null ? 0.12 : spread;
    try {
        world.spawnParticle(Particle.SQUID_INK, loc, count, spread, spread * 1.2, spread, 0.01);
    } catch (e0) {
        try { world.spawnParticle(Particle.SMOKE_LARGE, loc, Math.max(1, count - 1), spread, spread, spread, 0.01); } catch (e1) {}
    }
}

/** 释放瞬间：墨核爆裂 + 竖向墨柱 + 多层涟漪 + 飞溅笔锋 */
function playCenterBurst(world, loc) {
    var cx = loc.getX(), cy = loc.getY(), cz = loc.getZ();

    // 核心爆裂
    try { world.spawnParticle(Particle.SQUID_INK, loc, 160, 1.8, 1.0, 1.8, 0.12); } catch (e0) {
        try { world.spawnParticle(Particle.SMOKE_LARGE, loc, 100, 1.5, 0.8, 1.5, 0.06); } catch (e1) {}
    }
    spawnDust(world, loc, 90, 2.0, 1.1, 2.0, INK_DEEP);
    spawnDust(world, loc, 55, 1.6, 0.9, 1.6, INK_DUST);
    spawnDust(world, loc, 40, 1.4, 0.8, 1.4, LIGHT_DUST);
    spawnDust(world, loc, 28, 1.2, 0.7, 1.2, VIOLET_DUST);
    try { world.spawnParticle(Particle.END_ROD, loc, 55, 1.6, 1.2, 1.6, 0.12); } catch (e2) {}
    try { world.spawnParticle(Particle.SONIC_BOOM, loc, 1, 0, 0, 0, 0); } catch (e3) {}
    try { world.spawnParticle(Particle.FLASH, loc, 1, 0, 0, 0, 0); } catch (eF) {}
    try { world.createExplosion(loc, 0, false, false); } catch (e4) {}

    // 竖向墨柱（自下而上）
    for (var h = 0; h < 10; h++) {
        var hy = cy + h * 0.45;
        var hl = locAt(loc, cx, hy, cz);
        spawnInk(world, hl, 8, 0.25 + h * 0.04);
        spawnDust(world, hl, 4, 0.2, 0.15, 0.2, h % 2 === 0 ? INK_DUST : VIOLET_DUST);
        if (h % 2 === 0) {
            try { world.spawnParticle(Particle.END_ROD, hl, 2, 0.15, 0.1, 0.15, 0.02); } catch (eR) {}
        }
    }

    // 瞬时三层涟漪
    for (var ring = 1; ring <= 3; ring++) {
        var rr = ring * 1.8;
        var pts = 18 + ring * 8;
        for (var i = 0; i < pts; i++) {
            var ang = (i / pts) * Math.PI * 2;
            var pl = locAt(loc, cx + Math.cos(ang) * rr, cy + 0.15 + ring * 0.08, cz + Math.sin(ang) * rr);
            spawnInk(world, pl, 2, 0.08);
            spawnDust(world, pl, 1, 0.05, 0.06, 0.05, ring === 2 ? LIGHT_DUST : INK_DUST);
        }
    }

    // 随机飞溅笔锋（短弧）
    for (var s = 0; s < 12; s++) {
        var a0 = Math.random() * Math.PI * 2;
        var len = 2.5 + Math.random() * 4.5;
        for (var k = 0; k < 7; k++) {
            var t = k / 6;
            var rad = len * t;
            var lift = Math.sin(t * Math.PI) * (0.6 + Math.random() * 0.8);
            var wobble = Math.sin(t * 6 + s) * 0.25;
            var sx = cx + Math.cos(a0) * rad + Math.cos(a0 + Math.PI / 2) * wobble;
            var sz = cz + Math.sin(a0) * rad + Math.sin(a0 + Math.PI / 2) * wobble;
            var sl = locAt(loc, sx, cy + lift, sz);
            spawnDust(world, sl, 1, 0.04, 0.05, 0.04, k < 3 ? INK_DEEP : INK_DUST);
            if (k === 6) spawnDust(world, sl, 2, 0.08, 0.08, 0.08, SILVER_DUST);
        }
    }

    try {
        world.playSound(loc, Sound.ENTITY_GENERIC_EXPLODE, 1.05, 0.48);
        world.playSound(loc, Sound.ENTITY_SQUID_SQUIRT, 1.35, 0.5);
        world.playSound(loc, Sound.ENTITY_WARDEN_SONIC_BOOM, 0.45, 1.45);
        world.playSound(loc, Sound.BLOCK_RESPAWN_ANCHOR_CHARGE, 0.9, 0.6);
        world.playSound(loc, Sound.ITEM_BUCKET_EMPTY, 0.7, 0.55);
        try { world.playSound(loc, Sound.BLOCK_SCULK_SHRIEKER_SHRIEK, 0.35, 1.8); } catch (eSc) {}
    } catch (e5) {}
}

/** 地面薄雾盘 */
function playMistFloor(world, center, r, density) {
    var n = Math.max(8, Math.floor(density || (6 + r * 2)));
    var y = center.getY() + 0.08;
    for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var rr = Math.sqrt(Math.random()) * r;
        var pl = locAt(center, center.getX() + Math.cos(a) * rr, y, center.getZ() + Math.sin(a) * rr);
        spawnDust(world, pl, 1, 0.15, 0.02, 0.15, MIST_DUST);
        if (i % 3 === 0) spawnInk(world, pl, 1, 0.06);
    }
}

/** 双螺旋墨迹上升 */
function playInkHelix(world, center, r, phase, turns) {
    turns = turns || 2;
    var arms = 2;
    var steps = Math.max(20, Math.floor(14 + r * 3));
    for (var arm = 0; arm < arms; arm++) {
        var base = phase + arm * Math.PI;
        for (var i = 0; i < steps; i++) {
            var t = i / (steps - 1);
            var ang = base + t * turns * Math.PI * 2;
            var rad = r * (0.35 + t * 0.65);
            var y = center.getY() + t * (2.2 + r * 0.08) + Math.sin(t * Math.PI * 3) * 0.15;
            var pl = locAt(center,
                center.getX() + Math.cos(ang) * rad,
                y,
                center.getZ() + Math.sin(ang) * rad);
            spawnDust(world, pl, 1, 0.03, 0.04, 0.03, arm === 0 ? INK_DUST : VIOLET_DUST);
            if (i % 4 === 0) spawnInk(world, pl, 1, 0.05);
            if (i % 5 === 0) spawnDust(world, pl, 1, 0.04, 0.04, 0.04, SILVER_DUST);
        }
    }
}

/** 书法规弧笔触（沿环切向） */
function playBrushStrokes(world, center, r, phase) {
    var strokes = 5;
    for (var s = 0; s < strokes; s++) {
        var a0 = phase + (s / strokes) * Math.PI * 2;
        var span = 0.55 + (s % 3) * 0.15;
        var segs = 8;
        for (var k = 0; k < segs; k++) {
            var u = k / (segs - 1);
            var ang = a0 + (u - 0.5) * span;
            var rad = r * (0.92 + Math.sin(u * Math.PI) * 0.08);
            var y = center.getY() + 0.25 + Math.sin(u * Math.PI) * 0.9 + (s % 2) * 0.15;
            var pl = locAt(center,
                center.getX() + Math.cos(ang) * rad,
                y,
                center.getZ() + Math.sin(ang) * rad);
            spawnDust(world, pl, 2, 0.05, 0.08, 0.05, u < 0.5 ? INK_DEEP : INK_DUST);
            if (k === segs - 1) spawnDust(world, pl, 3, 0.1, 0.1, 0.1, LIGHT_DUST);
        }
    }
}

/** 主扩散环：多层 + 飞沫 + 高光 */
function playExpandRing(world, center, r, tick) {
    tick = tick || 0;
    var yBase = center.getY() + 0.35;
    var spin = tick * 0.18;

    // 外环（主墨环）
    var points = Math.max(40, Math.floor(22 + r * 12));
    for (var i = 0; i < points; i++) {
        var ang = (i / points) * Math.PI * 2 + spin;
        var bob = Math.sin(ang * 3 + tick * 0.4) * 0.35;
        var pl = locAt(center,
            center.getX() + Math.cos(ang) * r,
            yBase + bob,
            center.getZ() + Math.sin(ang) * r);
        spawnInk(world, pl, 3, 0.1);
        spawnDust(world, pl, 2, 0.07, 0.1, 0.07, INK_DUST);
        if (i % 3 === 0) spawnDust(world, pl, 1, 0.05, 0.08, 0.05, INK_DEEP);
        if (i % 5 === 0) spawnDust(world, pl, 1, 0.06, 0.08, 0.06, LIGHT_DUST);
        if (i % 7 === 0) {
            try { world.spawnParticle(Particle.END_ROD, pl, 1, 0.04, 0.08, 0.04, 0.01); } catch (eR) {}
        }
    }

    // 内环（反向旋、略高）
    var innerR = r * 0.62;
    var innerPts = Math.max(24, Math.floor(14 + r * 7));
    for (var j = 0; j < innerPts; j++) {
        var a2 = (j / innerPts) * Math.PI * 2 - spin * 1.35;
        var pl2 = locAt(center,
            center.getX() + Math.cos(a2) * innerR,
            yBase + 0.55 + Math.sin(a2 * 2 + tick * 0.3) * 0.25,
            center.getZ() + Math.sin(a2) * innerR);
        spawnDust(world, pl2, 1, 0.05, 0.07, 0.05, VIOLET_DUST);
        if (j % 2 === 0) spawnDust(world, pl2, 1, 0.04, 0.05, 0.04, GRAY_DUST);
        if (j % 4 === 0) spawnInk(world, pl2, 1, 0.05);
    }

    // 环上飞沫（向外溅）
    var splashes = Math.max(8, Math.floor(4 + r * 1.2));
    for (var s = 0; s < splashes; s++) {
        var a3 = Math.random() * Math.PI * 2;
        var out = r + 0.4 + Math.random() * 1.6;
        var pl3 = locAt(center,
            center.getX() + Math.cos(a3) * out,
            yBase + 0.2 + Math.random() * 1.4,
            center.getZ() + Math.sin(a3) * out);
        spawnDust(world, pl3, 1, 0.06, 0.1, 0.06, Math.random() > 0.5 ? INK_DUST : SILVER_DUST);
        spawnInk(world, pl3, 1, 0.04);
    }

    // 环内侧填充
    var fill = Math.max(14, Math.floor(r * 5));
    for (var f = 0; f < fill; f++) {
        var a4 = Math.random() * Math.PI * 2;
        var rr = r * (0.4 + Math.random() * 0.5);
        var fl = locAt(center,
            center.getX() + Math.cos(a4) * rr,
            yBase + (Math.random() - 0.35) * 1.3,
            center.getZ() + Math.sin(a4) * rr);
        spawnDust(world, fl, 1, 0.05, 0.08, 0.05, f % 3 === 0 ? MIST_DUST : GRAY_DUST);
    }
}

/** 收束：墨雨落下 + 外缘碎裂 */
function playInkFinale(world, center) {
    var r = BLAST_RADIUS;
    playExpandRing(world, center, r, EXPAND_TICKS);

    // 墨雨
    for (var i = 0; i < 48; i++) {
        var a = Math.random() * Math.PI * 2;
        var rr = Math.sqrt(Math.random()) * r;
        var drop = locAt(center,
            center.getX() + Math.cos(a) * rr,
            center.getY() + 1.5 + Math.random() * 3.5,
            center.getZ() + Math.sin(a) * rr);
        spawnInk(world, drop, 2, 0.06);
        spawnDust(world, drop, 1, 0.04, 0.2, 0.04, INK_DUST);
        if (i % 4 === 0) {
            try { world.spawnParticle(Particle.DRIPPING_OBSIDIAN_TEAR, drop, 1, 0, 0, 0, 0); } catch (eD) {
                try { world.spawnParticle(Particle.DRIP_LAVA, drop, 1, 0, 0, 0, 0); } catch (eD2) {}
            }
        }
    }

    // 边缘碎裂高光
    for (var e = 0; e < 28; e++) {
        var ae = (e / 28) * Math.PI * 2;
        var el = locAt(center,
            center.getX() + Math.cos(ae) * r,
            center.getY() + 0.4 + Math.random() * 1.2,
            center.getZ() + Math.sin(ae) * r);
        spawnDust(world, el, 2, 0.12, 0.15, 0.12, LIGHT_DUST);
        try { world.spawnParticle(Particle.END_ROD, el, 2, 0.1, 0.15, 0.1, 0.03); } catch (eR) {}
    }

    try {
        world.playSound(center, Sound.ENTITY_SQUID_SQUIRT, 0.9, 0.4);
        world.playSound(center, Sound.BLOCK_BEACON_DEACTIVATE, 0.55, 0.85);
    } catch (eS) {}
}

function applyKnockback(ent, center) {
    try {
        var el = ent.getLocation();
        var dx = el.getX() - center.getX();
        var dz = el.getZ() - center.getZ();
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len < 1e-4) {
            dx = (Math.random() - 0.5);
            dz = (Math.random() - 0.5);
            len = Math.sqrt(dx * dx + dz * dz);
        }
        var vx = (dx / len) * KNOCKBACK_FORCE;
        var vz = (dz / len) * KNOCKBACK_FORCE;
        ent.setVelocity(new Vector(vx, KNOCKBACK_UP, vz));
    } catch (e) {}
}

function pulseAoE(center, radius, amount, attacker) {
    if (!loadMageApi() || amount <= 0) return;
    var world = center.getWorld();
    var list = world.getNearbyEntities(center, radius, radius, radius);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (attacker != null && ent.getUniqueId().equals(attacker.getUniqueId())) continue;
        try { if (ent.getType() === EntityType.ARMOR_STAND) continue; } catch (e) {}
        if (ent instanceof Player) {
            try {
                var mode = ent.getGameMode().name();
                if (mode === "CREATIVE" || mode === "SPECTATOR") continue;
            } catch (e2) {}
        }
        if (center.distance(ent.getLocation()) > radius) continue;
        try { MAGE_API.dealPulseDamage(ent, amount, attacker); } catch (e3) {}
        applyKnockback(ent, center);
    }
}

function playInkExpand(world, center) {
    var tick = 0;
    var taskRef = { id: -1 };
    taskRef.id = Bukkit.getScheduler().scheduleSyncRepeatingTask(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function () {
            try {
                tick++;
                var t = tick / EXPAND_TICKS;
                if (t > 1) t = 1;
                // ease-out：前段快冲、后段缓收
                var eased = 1 - Math.pow(1 - t, 2.4);
                var r = BLAST_RADIUS * eased;
                var phase = tick * 0.22;

                playExpandRing(world, center, r, tick);
                playMistFloor(world, center, r * 0.95, 8 + r * 1.5);
                playInkHelix(world, center, r * 0.85, phase, 2.2);

                // 每隔几 tick 甩出书法笔触
                if (tick % 3 === 0) playBrushStrokes(world, center, r, phase * 0.7);

                // 中心持续涌墨
                if (tick % 2 === 0) {
                    var core = center.clone().add(0, 0.4 + Math.sin(tick * 0.35) * 0.2, 0);
                    spawnInk(world, core, 6, 0.35);
                    spawnDust(world, core, 4, 0.3, 0.4, 0.3, INK_DEEP);
                    try { world.spawnParticle(Particle.END_ROD, core, 3, 0.2, 0.35, 0.2, 0.02); } catch (eC) {}
                }

                if (tick % 5 === 0) {
                    try {
                        world.playSound(center, Sound.ENTITY_SQUID_SQUIRT, 0.5, 0.65 + t * 0.7);
                        if (tick % 10 === 0) {
                            world.playSound(center, Sound.BLOCK_BUBBLE_COLUMN_WHIRLPOOL_INSIDE, 0.35, 0.8 + t * 0.4);
                        }
                    } catch (eS) {}
                }

                if (tick >= EXPAND_TICKS) {
                    playInkFinale(world, center);
                    try { Bukkit.getScheduler().cancelTask(taskRef.id); } catch (eC) {}
                }
            } catch (err) {
                try { Bukkit.getScheduler().cancelTask(taskRef.id); } catch (eC2) {}
            }
        }
    }))(), 0, 1);
}

function activateInkBlast(player) {
    var uuid = String(player.getUniqueId().toString());
    if (isAbilityOnCd(uuid)) {
        var left = cdLeftSec(uuid);
        try { player.sendActionBar("§8光影废墟冷却中… §e" + left + "§7s"); } catch (eA) {}
        player.sendMessage(GLTC_PREFIX + "§c光影废墟冷却中，剩余 §e" + left + " §c秒");
        return;
    }
    if (player.getInventory().getItemInMainHand().getAmount() !== 1) {
        player.sendMessage(GLTC_PREFIX + "§c请将法杖数量分离为 §e1 §c后再使用。");
        return;
    }

    markAbilityCd(uuid);

    if (TYPE_RESIST != null) {
        try {
            player.addPotionEffect(new PotionEffect(TYPE_RESIST, BUFF_TICKS, RESIST_AMP, false, true, true));
        } catch (eR) {}
    }
    if (TYPE_SPEED != null) {
        try {
            player.addPotionEffect(new PotionEffect(TYPE_SPEED, BUFF_TICKS, SPEED_AMP, false, true, true));
        } catch (eS) {}
    }

    var center = player.getLocation().clone().add(0, 0.2, 0);
    var world = player.getWorld();
    playCenterBurst(world, center);
    playInkExpand(world, center);

    var dmg = BLAST_MULT * particleMod(player);
    pulseAoE(center, BLAST_RADIUS, dmg, player);

    player.sendMessage(GLTC_PREFIX + "§7光影废墟 §8(冷却 " + Math.floor(ABILITY_CD_MS / 1000) + "s)");
}

function registerHooks() {
    if (!loadCastApi()) return;
    try {
        CAST_API.registerStaffHooks(STAFF_ID, {
            onSneakUse: function (p) { activateInkBlast(p); },
            onAfterCast: function () {}
        });
    } catch (e) {}
}
registerHooks();

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var item = player.getInventory().getItemInMainHand();
    if (!isThisStaff(item)) return;

    if (!loadCastApi()) {
        player.sendMessage(GLTC_PREFIX + "§c施术核心加载失败。");
        return;
    }
    // 兜底：交互监听已处理时会被 debounce 吞掉
    CAST_API.handleStaffUse(player, {
        onSneakUse: function (p) { activateInkBlast(p); },
        onAfterCast: function () {}
    });
}

function tick(info) {}
