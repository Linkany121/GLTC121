/**
 * VASA 辉墨摇篮 —— 序列4 施术道具
 * - 站立右键：施术
 * - 蹲下右键 / 蹲下左键：打开施术 GUI；唤出 GUI 时释放光影废墟（护身）
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
var ABILITY_NAME = "光影废墟";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
/** 与术式提示同色：常规 &#fff5b3 / 名称 &#62c6ff / 伤害数值 §c */
var C_MSG = "§x§f§f§f§5§b§3";
var C_SPELL = "§x§6§2§c§6§f§f";
var C_DMG = "§c";
/** A.yml 播报 · 脉冲伤害（gltcAnnounceSpellHit 不可用时回退） */
var C_PULSE_DMG = "§x§e§a§7§2§c§9脉§x§e§5§6§5§a§1冲§x§d§f§5§7§7§a伤§x§d§a§4§a§5§2害";
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var RSC = null;
try { RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer"); } catch (eRsc) {}
var HUIMO_CD_MAP_KEY = "gltc_huimo_ability_cd";

var CAST_API = null;
var MAGE_API = null;
var SPELL_UTIL = null;

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

/** 冷却：uuid -> 上次释放(ms)，存 RSC.INSTANCE.gltcSharedMaps（纯 Java，跨 Graal 上下文） */
function getSharedRoot() {
    try {
        if (RSC != null && RSC.INSTANCE != null) {
            var inst = RSC.INSTANCE;
            if (inst.gltcSharedMaps == null || !(inst.gltcSharedMaps instanceof java.util.concurrent.ConcurrentHashMap)) {
                inst.gltcSharedMaps = new java.util.concurrent.ConcurrentHashMap();
            }
            return inst.gltcSharedMaps;
        }
    } catch (e0) {}
    try {
        if (PLUGIN.gltcSharedMaps == null || !(PLUGIN.gltcSharedMaps instanceof java.util.concurrent.ConcurrentHashMap)) {
            PLUGIN.gltcSharedMaps = new java.util.concurrent.ConcurrentHashMap();
        }
        return PLUGIN.gltcSharedMaps;
    } catch (e1) {}
    return null;
}

function abilityCdStore() {
    var root = getSharedRoot();
    if (root == null) {
        var fallback = new java.util.concurrent.ConcurrentHashMap();
        try { PLUGIN.gltc_huimo_ability_cd = fallback; } catch (eFb) {}
        return fallback;
    }
    var existing = root.get(HUIMO_CD_MAP_KEY);
    if (existing != null) return existing;
    var map = new java.util.concurrent.ConcurrentHashMap();
    var prev = root.putIfAbsent(HUIMO_CD_MAP_KEY, map);
    return prev != null ? prev : map;
}

function abilityCdKey(uuid) {
    return java.lang.String.valueOf(String(uuid));
}

function readCdMs(v) {
    if (v == null) return NaN;
    try {
        if (typeof v.longValue === "function") return Number(v.longValue());
    } catch (e0) {}
    try { return Number(v); } catch (e1) {}
    return NaN;
}

function isAbilityOnCd(uuid) {
    uuid = abilityCdKey(uuid);
    var last = abilityCdStore().get(uuid);
    if (last == null) return false;
    var elapsed = nowMs() - readCdMs(last);
    if (!isFinite(elapsed)) return false;
    return elapsed < ABILITY_CD_MS;
}

function cdLeftSec(uuid) {
    uuid = abilityCdKey(uuid);
    var last = readCdMs(abilityCdStore().get(uuid));
    if (!isFinite(last)) return 1;
    return Math.max(1, Math.ceil((ABILITY_CD_MS - (nowMs() - last)) / 1000));
}

function markAbilityCd(uuid) {
    // 与施术核心 castCdMap 一致：Long 存毫秒，避免 Graal 跨上下文 Number 读写失效
    var now = java.lang.Long.parseLong(String(Math.floor(nowMs())), 10);
    abilityCdStore().put(abilityCdKey(uuid), now);
}

function nowMs() {
    return Math.floor(Number(Date.now()));
}

function formatDamage(n) {
    var v = Math.round(Number(n) * 10) / 10;
    if (v === Math.floor(v)) return String(Math.floor(v));
    return String(v);
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

function ensureCoreListeners() {
    try {
        if (RSC != null && RSC.INSTANCE != null && RSC.INSTANCE.gltcEnsureSpellCoreListeners != null) {
            RSC.INSTANCE.gltcEnsureSpellCoreListeners.accept(java.lang.Boolean.TRUE);
            return;
        }
    } catch (eInst) {}
    try {
        if (PLUGIN.gltcEnsureSpellCoreListeners != null) {
            PLUGIN.gltcEnsureSpellCoreListeners.accept(java.lang.Boolean.TRUE);
            return;
        }
    } catch (ePl) {}
    try {
        var root = getSharedRoot();
        if (root != null) {
            var ensure = root.get("ensureListeners");
            if (ensure != null) {
                ensure.accept(java.lang.Boolean.TRUE);
                return;
            }
        }
    } catch (eRoot) {}
    try {
        if (CAST_API && typeof CAST_API.ensureListeners === "function") {
            CAST_API.ensureListeners(true);
        }
    } catch (e) {}
}

function invokeHandleStaffUseBridge(player) {
    if (!player || !(player instanceof Player)) return false;
    try {
        if (RSC != null && RSC.INSTANCE != null && RSC.INSTANCE.gltcHandleStaffUseConsumer != null) {
            RSC.INSTANCE.gltcHandleStaffUseConsumer.accept(player);
            return true;
        }
    } catch (eInst) {}
    try {
        if (PLUGIN.gltcHandleStaffUseConsumer != null) {
            PLUGIN.gltcHandleStaffUseConsumer.accept(player);
            return true;
        }
    } catch (ePl) {}
    try {
        var root = getSharedRoot();
        if (root != null) {
            var consumer = root.get("handleStaffUse");
            if (consumer != null) {
                consumer.accept(player);
                return true;
            }
        }
    } catch (eRoot) {}
    if (CAST_API && typeof CAST_API.handleStaffUse === "function") {
        CAST_API.handleStaffUse(player, {});
        return true;
    }
    return false;
}

function registerHuimoActivateBridge() {
    var bridge = new (Java.extend(java.lang.Object, {
        activate: function(p) {
            try {
                if (!p || !(p instanceof Player)) return;
                if (!isThisStaff(p.getInventory().getItemInMainHand())) return;
                activateInkBlast(p);
            } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC辉墨摇篮] activate: " + e); } catch (e2) {}
            }
        }
    }))();
    try {
        if (RSC != null && RSC.INSTANCE != null) RSC.INSTANCE.gltcHuimoActivateBridge = bridge;
    } catch (eInst) {}
    try { PLUGIN.gltcHuimoActivateBridge = bridge; } catch (ePl) {}
    var root = getSharedRoot();
    if (root != null) {
        root.put("gltc_huimo_activator", bridge);
        try { root.remove("gltc_huimo_activator_pending"); } catch (eRm) {}
    }
    try { Bukkit.getLogger().info("[GLTC辉墨摇篮] 光影废墟 Java 桥已注册"); } catch (eLog) {}
}

function registerHuimoStaffHooks() {
    try {
        var map = PLUGIN.gltc_staff_hooks_map;
        if (map == null || !(map instanceof java.util.concurrent.ConcurrentHashMap)) {
            map = new java.util.concurrent.ConcurrentHashMap();
            PLUGIN.gltc_staff_hooks_map = map;
        }
        map.remove(STAFF_ID + "|sneak");
        map.put(STAFF_ID + "|hint", "§7光影废墟 §8(蹲下开 GUI 时释放，冷却 30s)");
        return true;
    } catch (e) {
        return false;
    }
}

function ensureCoreLoaded() {
    ensureCoreListeners();
    registerHuimoStaffHooks();
    registerHuimoActivateBridge();
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

function loadSpellUtil() {
    if (SPELL_UTIL && typeof SPELL_UTIL.dealPulseSpellDamage === "function") return true;
    try {
        if (PLUGIN.gltcAnnounceSpellHit != null && PLUGIN.gltcSpellSessionApi != null) {
            // 工具已加载过：再 eval 一次拿到 dealPulse（导出对象）
        }
    } catch (e0) {}
    var exported = evalExport("术式/_工具.js");
    if (exported && typeof exported.dealPulseSpellDamage === "function") {
        SPELL_UTIL = exported;
        return true;
    }
    return false;
}

loadMageApi();
loadSpellUtil();

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
    loadSpellUtil();
    var spellInfo = { name: ABILITY_NAME, kind: "ability" };
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
        if (SPELL_UTIL && typeof SPELL_UTIL.dealPulseSpellDamage === "function") {
            SPELL_UTIL.dealPulseSpellDamage(ent, amount, attacker, spellInfo, MAGE_API);
        } else {
            try { MAGE_API.dealPulseDamage(ent, amount, attacker); } catch (e3) {}
            try {
                if (attacker != null && attacker instanceof Player && typeof PLUGIN.gltcAnnounceSpellHit === "function") {
                    PLUGIN.gltcAnnounceSpellHit(attacker, {
                        name: ABILITY_NAME,
                        kind: "ability",
                        damageType: "pulse"
                    }, amount);
                } else if (attacker != null && attacker instanceof Player) {
                    attacker.sendMessage(GLTC_PREFIX + C_SPELL + ABILITY_NAME
                        + C_MSG + " 造成了 " + C_DMG + formatDamage(amount) + " " + C_PULSE_DMG);
                }
            } catch (eMsg) {}
        }
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
        // 冷却只走 ActionBar，不刷聊天（避免与 GUI 提示叠成两条）
        var left = cdLeftSec(uuid);
        try { player.sendActionBar("§8光影废墟冷却中… §e" + left + "§7s"); } catch (eA) {}
        return;
    }
    if (player.getInventory().getItemInMainHand().getAmount() !== 1) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "请将施术道具数量分离为 §e1 " + C_MSG + "后再使用。");
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
    // 与术式同款释放提示（护身技）
    try {
        player.sendMessage(GLTC_PREFIX + C_MSG + "使用 " + C_SPELL + ABILITY_NAME);
    } catch (eCast) {}
    pulseAoE(center, BLAST_RADIUS, dmg, player);
}

/**
 * 护身：施术核心开 GUI 成功后写 token，并通过 gltcSharedMaps 的 Java Consumer 触发。
 */
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var META_ABILITY_TOKEN = "gltc_staff_sneak_ability_token";
var ABILITY_TOKEN_TTL_MS = 800;

function takeAbilityToken(player) {
    try {
        if (!player.hasMetadata(META_ABILITY_TOKEN)) return false;
        var mv = player.getMetadata(META_ABILITY_TOKEN).get(0);
        var ts = 0;
        try { ts = Number(mv.asDouble()); } catch (e0) {
            try { ts = Number(mv.value()); } catch (e1) {}
        }
        try { player.removeMetadata(META_ABILITY_TOKEN, PLUGIN); } catch (e2) {}
        if (!(ts > 0)) return false;
        return (nowMs() - ts) <= ABILITY_TOKEN_TTL_MS;
    } catch (e) {
        return false;
    }
}

/** 施术核心单例通过 Java Consumer 跨上下文触发（见 grantStaffSneakAbilityToken） */
function tryActivateInkBlastFromToken(player) {
    if (!player || !(player instanceof Player)) return;
    if (!isThisStaff(player.getInventory().getItemInMainHand())) return;
    var uuid = String(player.getUniqueId().toString());
    if (isAbilityOnCd(uuid)) {
        try { player.removeMetadata(META_ABILITY_TOKEN, PLUGIN); } catch (eRm) {}
        var leftCd = cdLeftSec(uuid);
        try { player.sendActionBar("§8光影废墟冷却中… §e" + leftCd + "§7s"); } catch (eA) {}
        return;
    }
    if (!takeAbilityToken(player)) return;
    activateInkBlast(player);
}

function unregisterHuimoAbilityListener() {
    var root = getSharedRoot();
    try {
        var old = root != null ? root.get("gltc_huimo_ability_listener") : null;
        if (old == null) old = PLUGIN.gltcHuimoAbilityListener;
        if (old != null) {
            try { PlayerInteractEvent.getHandlerList().unregister(old); } catch (e0) {}
        }
    } catch (eUn) {}
    try { PLUGIN.gltcHuimoAbilityListener = null; } catch (eNull) {}
    try {
        if (root != null) root.remove("gltc_huimo_ability_listener");
    } catch (eRm) {}
}

try {
    PLUGIN.gltcHuimoAbilityCdMs = java.lang.Long.parseLong(String(ABILITY_CD_MS), 10);
} catch (eMs) {}

ensureCoreLoaded();
unregisterHuimoAbilityListener();
try {
    Bukkit.getScheduler().runTaskLater(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            ensureCoreLoaded();
        }
    }))(), 40);
} catch (eDelay) {}

function shouldSkipStaffOnUseLocal(player) {
    try {
        if (PLUGIN.gltcSpellCoreListener != null) return true;
    } catch (e0) {}
    try {
        var f = PLUGIN.gltcSpellCoreInteractReady;
        if (f === true) return true;
        if (f != null && typeof f.booleanValue === "function" && f.booleanValue()) return true;
    } catch (e1) {}
    try {
        var tickMap = PLUGIN.gltc_staff_interact_use_tick;
        if (tickMap != null && player != null) {
            var gk = java.lang.String.valueOf(String(player.getUniqueId().toString()));
            var tick = Number(Bukkit.getCurrentTick());
            var last = tickMap.get(gk);
            if (last != null && Number(last) === tick) return true;
        }
    } catch (e2) {}
    return false;
}

/**
 * SF onUse：Interact 丢失时的兜底。监听在则永不处理，防 Interact+onUse 双开环。
 */
function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;
    if (!isThisStaff(player.getInventory().getItemInMainHand())) return;

    if (shouldSkipStaffOnUseLocal(player)) return;

    ensureCoreListeners();
    if (!invokeHandleStaffUseBridge(player)) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "施术核心未就绪，请重载插件。");
    }
}

function tick(info) {}
