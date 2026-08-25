// ===================================================================
// 核心技能 · 辉墨摇篮 —— 光影废墟
// 文件：施术道具/核心技能_辉墨摇篮.js（由 技能登记.js 自动扫描加载）
// 触发：选择术式时（技能核心 skillId = light_ruin）
// 效果：半径 10 炸裂水墨冲击波 · 1 倍系数脉冲伤害 · 强力击退 · 冷却 30s
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Location = Java.type("org.bukkit.Location");
var Vector = Java.type("org.bukkit.util.Vector");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var Color = Java.type("org.bukkit.Color");
var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");
var HashSet = Java.type("java.util.HashSet");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var _cdMap = new CHM();
var META_SHARED = "gltc_shared_root_maps";
var META_RUNTIME = "gltc_spell_runtime";
var META_MAGE    = "gltc_mage_api";

// ===================================================================
// === 身份（须与 技能核心登记.js 的 skillId 一致）===
// ===================================================================
var SKILL_ID   = "light_ruin";
var SKILL_NAME = "光影废墟";
var SKILL_HINT = "§f光影废墟 §7· §f切换术式时触发（30s）";

// === 光影废墟 · 基础 ===
var LIGHT_RUIN_RADIUS       = 13.0;   // 最终扩散半径（格）
var LIGHT_RUIN_EXPAND_TICKS = 20;     // 扩散总时长（tick，约 0.7s）
var LIGHT_RUIN_CD_MS        = 30000;  // 冷却（毫秒）
var LIGHT_RUIN_COEFF        = 10.0;    // 脉冲伤害系数
var LIGHT_RUIN_DMG_FALLBACK = 100;      // mageApi 不可用时的回退伤害
var LIGHT_RUIN_HIT_SLACK    = 1.2;    // 波前命中冗余（格）
var LIGHT_RUIN_SEARCH_Y     = 4.0;    // 搜敌竖直半高（格）
var LIGHT_RUIN_SEARCH_PAD   = 1.25;   // 搜敌水平外扩（格）
var LIGHT_RUIN_RING         = 1;      // 伤害播报用环数

// === 光影废墟 · 击退 ===
var LIGHT_RUIN_KB           = 2.55;   // 水平击退强度
var LIGHT_RUIN_KB_Y         = 0.8;   // 竖直击退

// === 光影废墟 · 圆环粒子密度 ===
var RING_POINTS_BASE        = 32;     // 环上最少点数
var RING_POINTS_PER_R       = 8;     // 每格半径追加点数
var RING_INNER_RATIO        = 0.5;   // 内环半径比例
var RING_MID_RATIO          = 0.3;   // 中环半径比例
var RING_BASE_Y             = 0.2;   // 环相对脚底抬高
var RING_MIN_RADIUS         = 0.2;   // 小于此半径不画环
var SPLASH_PER_TICK         = 3;      // 波前碎墨溅射（每 2 tick）
var BURST_RAY_COUNT         = 12;     // 开场放射墨迹条数
var BURST_RAY_LEN           = 2.8;    // 放射墨迹长度（格）
var BURST_PILLAR_H          = 3;    // 开场墨柱高度
var RING_DRAW_EVERY         = 3;      // 每 tick 画环（更炸）
var SEARCH_EVERY            = 3;      // 隔 tick 搜敌
var WAVE_SPIKE_COUNT        = 3;      // 波前上冲墨刺数 / 2tick
var FINALE_SHOCK_RINGS      = 2;      // 终爆冲击环层数

// === 光影废墟 · Dust 颜色（RGB）===
var INK_RGB                 = [18, 18, 28];
var INK_DEEP_RGB            = [8, 8, 14];
var FLASH_RGB               = [235, 235, 245];
var SILVER_RGB              = [160, 175, 200];
var INK_DUST_SIZE           = 2.15;
var INK_DEEP_SIZE           = 1.7;
var FLASH_DUST_SIZE         = 1.55;
var SILVER_DUST_SIZE        = 1.25;

// === 光影废墟 · 开场音效（仅此两个）===
var SND_OPEN_MACE           = "item.mace.smash_ground_heavy";
var SND_OPEN_MACE_VOL       = 1.2;
var SND_OPEN_MACE_PITCH     = 0.9;
var SND_OPEN_ANCHOR_VOL     = 1.0;
var SND_OPEN_ANCHOR_PITCH   = 0.7;

var DustOptions = null;
try { DustOptions = Java.type("org.bukkit.Particle$DustOptions"); } catch (eDust) {}
var DUST_INK = null;
var DUST_INK_DEEP = null;
var DUST_FLASH = null;
var DUST_SILVER = null;
try {
    if (DustOptions != null) {
        DUST_INK = new DustOptions(Color.fromRGB(INK_RGB[0], INK_RGB[1], INK_RGB[2]), INK_DUST_SIZE);
        DUST_INK_DEEP = new DustOptions(Color.fromRGB(INK_DEEP_RGB[0], INK_DEEP_RGB[1], INK_DEEP_RGB[2]), INK_DEEP_SIZE);
        DUST_FLASH = new DustOptions(Color.fromRGB(FLASH_RGB[0], FLASH_RGB[1], FLASH_RGB[2]), FLASH_DUST_SIZE);
        DUST_SILVER = new DustOptions(Color.fromRGB(SILVER_RGB[0], SILVER_RGB[1], SILVER_RGB[2]), SILVER_DUST_SIZE);
    }
} catch (eDust2) {}

function jUuid(u) { return java.lang.String.valueOf(String(u)); }

function getPlugin() {
    try {
        var p = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        if (p != null) return p;
    } catch (e0) {}
    return PLUGIN;
}

/** Graal 跨上下文：typeof 可能不是 "function"，以可调用为准 */
function hasApiFn(obj, name) {
    if (obj == null) return false;
    try {
        if (typeof obj[name] === "function") return true;
    } catch (e0) {}
    try { return obj[name] != null; } catch (e1) { return false; }
}

function bridgeGet(key) {
    var k = String(key);
    var p = getPlugin();
    // 优先本上下文加载的共享根（带 Metadata 反射）
    try {
        var loader = p != null ? p.gltcScriptLoader : null;
        if (loader == null) {
            var RSC0 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC0.INSTANCE != null) loader = RSC0.INSTANCE.gltcScriptLoader;
        }
        if (loader && loader.evalScriptExport) {
            var sr = loader.evalScriptExport("_gltcSharedRoot.js", { isolated: true, cache: true });
            if (sr != null && sr.getJavaBridge != null) {
                var fromSr = sr.getJavaBridge(k);
                if (fromSr != null) return fromSr;
            }
        }
    } catch (eSr) {}
    try {
        var cache = p != null ? p.gltcEvalCache : null;
        if (cache != null) {
            var sr2 = cache.get("_gltcSharedRoot.js");
            if (sr2 != null && sr2.getJavaBridge != null) {
                var fromCache = sr2.getJavaBridge(k);
                if (fromCache != null) return fromCache;
            }
        }
    } catch (eCache) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcJavaBridges != null) {
            var v2 = RSC.INSTANCE.gltcJavaBridges.get(k);
            if (v2 != null) return v2;
        }
    } catch (e2) {}
    try {
        if (p != null && p.gltcJavaBridges != null) return p.gltcJavaBridges.get(k);
    } catch (e3) {}
    return null;
}

function mageApiFromBridges() {
    var calc = bridgeGet("gltcMage_calcSpellDamage");
    var stats = bridgeGet("gltcMage_getTotalStats");
    var pulse = bridgeGet("gltcMage_dealPulseDamage");
    if (calc == null && stats == null) return null;
    return {
        calcSpellDamage: function(player, coeff) {
            if (calc == null) return NaN;
            try {
                return Number(calc.apply(player, java.lang.Double.valueOf(Number(coeff) || 0)));
            } catch (e) { return NaN; }
        },
        getTotalStats: function(player, includeStaff) {
            if (stats == null) return null;
            try {
                var flag = includeStaff !== false;
                return stats.apply(player, flag ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
            } catch (e) { return null; }
        },
        dealPulseDamage: function(target, amount, attacker) {
            if (pulse == null) return false;
            try {
                var list = new java.util.ArrayList();
                list.add(target);
                list.add(java.lang.Double.valueOf(Number(amount) || 0));
                list.add(attacker);
                pulse.accept(list);
                return true;
            } catch (e) { return false; }
        }
    };
}

function runtimeFromPulseBridge() {
    var pulseBr = bridgeGet("gltcRuntime_dealPulseSpellDamage");
    if (pulseBr == null) return null;
    return {
        dealPulseSpellDamage: function(target, amount, attacker, info) {
            try {
                var list = new java.util.ArrayList();
                list.add(target);
                list.add(java.lang.Double.valueOf(Number(amount) || 0));
                list.add(attacker);
                if (info != null) list.add(info);
                pulseBr.accept(list);
            } catch (e) {}
        }
    };
}

function resolveMageApi() {
    var bridged = mageApiFromBridges();
    if (bridged != null) return bridged;
    var p = getPlugin();
    try {
        var castApi = p != null ? p.gltcCastApi : null;
        if (castApi != null && hasApiFn(castApi, "getMageApi")) {
            var fromCast = castApi.getMageApi();
            if (hasApiFn(fromCast, "calcSpellDamage")) return fromCast;
        }
    } catch (eCast) {}
    try {
        if (p != null && hasApiFn(p.gltcMageApi, "calcSpellDamage")) return p.gltcMageApi;
    } catch (eP) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && hasApiFn(RSC.INSTANCE.gltcMageApi, "calcSpellDamage")) {
            return RSC.INSTANCE.gltcMageApi;
        }
    } catch (e2) {}
    return null;
}

function resolveSpellRuntime() {
    var bridged = runtimeFromPulseBridge();
    if (bridged != null) return bridged;
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null) {
            if (RSC.INSTANCE.gltcSpellRuntime != null) return RSC.INSTANCE.gltcSpellRuntime;
            if (RSC.INSTANCE.gltcSharedMaps != null) {
                var rtInst = RSC.INSTANCE.gltcSharedMaps.get("gltcSpellRuntime");
                if (rtInst != null) return rtInst;
            }
        }
    } catch (eInst) {}
    var p = getPlugin();
    try {
        var loader = p != null ? p.gltcScriptLoader : null;
        if (loader == null) {
            var RSC0 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC0.INSTANCE != null) loader = RSC0.INSTANCE.gltcScriptLoader;
        }
        if (loader && loader.evalScriptExport) {
            var sr = loader.evalScriptExport("_gltcSharedRoot.js", { isolated: true, cache: true });
            if (sr != null) {
                if (sr.pluginGetMetadataValue != null) {
                    var rtMeta = sr.pluginGetMetadataValue(p, META_RUNTIME);
                    if (rtMeta != null) return rtMeta;
                }
                if (sr.getGltcSharedRoot != null) {
                    var rootRt = sr.getGltcSharedRoot();
                    if (rootRt != null) {
                        var fromRoot = rootRt.get("gltcSpellRuntime");
                        if (fromRoot != null) return fromRoot;
                    }
                }
            }
        }
    } catch (eSr) {}
    try {
        if (p != null && p.gltcSpellRuntime != null) return p.gltcSpellRuntime;
    } catch (e1) {}
    try {
        var RSC2 = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC2.INSTANCE != null && RSC2.INSTANCE.gltcSpellRuntime != null) {
            return RSC2.INSTANCE.gltcSpellRuntime;
        }
    } catch (e2) {}
    return null;
}

function hasPulseApi(rt) {
    if (rt == null) return false;
    try {
        if (typeof rt.dealPulseSpellDamage === "function") return true;
    } catch (e0) {}
    try { return rt.dealPulseSpellDamage != null; } catch (e1) { return false; }
}

function isLightRuinTarget(ent, caster) {
    var living = false;
    try { living = LivingEntity.class.isInstance(ent); } catch (e0) {
        try { living = ent instanceof LivingEntity; } catch (e1) {}
    }
    if (!living || ent.isDead()) return false;
    try {
        if (Player.class.isInstance(ent) && ent.getUniqueId().equals(caster.getUniqueId())) return false;
    } catch (eP) {
        if (ent instanceof Player && ent.getUniqueId().equals(caster.getUniqueId())) return false;
    }
    try {
        var t = ent.getType();
        if (t === EntityType.ARMOR_STAND) return false;
        if (t === EntityType.ITEM_DISPLAY) return false;
    } catch (eT) {}
    return true;
}

function spawnParticleSafe(world, type, at, count, ox, oy, oz, extra, data) {
    try {
        if (data != null) world.spawnParticle(type, at, count, ox, oy, oz, extra, data);
        else world.spawnParticle(type, at, count, ox, oy, oz, extra);
    } catch (e) {}
}

function spawnDust(world, at, count, ox, oy, oz, dust) {
    if (dust == null) return;
    try { world.spawnParticle(Particle.DUST, at, count, ox, oy, oz, 0, dust); } catch (e) {}
}

function spawnInkRing(world, center, radius, intensity) {
    if (radius < RING_MIN_RADIUS) return;
    intensity = intensity == null ? 1 : intensity;
    var n = Math.max(RING_POINTS_BASE, Math.floor(radius * RING_POINTS_PER_R * intensity));
    var baseY = center.getY() + RING_BASE_Y;
    var wallH = 0.35 + Math.min(1.8, radius * 0.12);
    for (var i = 0; i < n; i++) {
        var ang = (i / n) * Math.PI * 2 + radius * 0.08;
        var cos = Math.cos(ang);
        var sin = Math.sin(ang);
        var x = center.getX() + cos * radius;
        var z = center.getZ() + sin * radius;
        var at = new Location(world, x, baseY, z);
        var atMid = new Location(world, x, baseY + wallH * 0.45, z);
        var atHi = new Location(world, x, baseY + wallH + (i % 4) * 0.18, z);
        // 波前主墨墙
        spawnParticleSafe(world, Particle.SQUID_INK, at, 5, 0.14, 0.1, 0.14, 0.045);
        spawnParticleSafe(world, Particle.LARGE_SMOKE, at, 2, 0.1, 0.12, 0.1, 0.01);
        spawnDust(world, at, 2, 0.12, 0.08, 0.12, DUST_INK);
        if (i % 2 === 0) spawnDust(world, atMid, 1, 0.08, 0.15, 0.08, DUST_INK_DEEP);
        // 银白刃缘 + 升腾碎墨
        if (i % 3 === 0) {
            spawnDust(world, atHi, 1, 0.06, 0.2, 0.06, DUST_FLASH);
            spawnParticleSafe(world, Particle.ASH, atHi, 3, 0.08, 0.25, 0.08, 0.0);
            spawnParticleSafe(world, Particle.END_ROD, atHi, 1, 0.02, 0.15, 0.02, 0.01);
        }
        if (i % 4 === 0) {
            spawnParticleSafe(world, Particle.SOUL, atMid, 1, 0.05, 0.2, 0.05, 0.01);
            spawnDust(world, at, 1, 0.05, 0.05, 0.05, DUST_SILVER);
        }
        // 波前外侧飞溅
        if (i % 5 === 0) {
            var out = new Location(world, center.getX() + cos * (radius + 0.55), baseY + 0.4, center.getZ() + sin * (radius + 0.55));
            spawnParticleSafe(world, Particle.SQUID_INK, out, 4, 0.2, 0.25, 0.2, 0.08);
            spawnParticleSafe(world, Particle.CRIT, out, 2, 0.1, 0.1, 0.1, 0.12);
        }
    }
    // 双内环：墨漩 + 银色残影
    if (radius > 1.0) {
        var rings = [
            { r: radius * RING_INNER_RATIO, dens: 10, y: 0.4 },
            { r: radius * RING_MID_RATIO, dens: 7, y: 0.7 }
        ];
        for (var ri = 0; ri < rings.length; ri++) {
            var rr = rings[ri];
            var n2 = Math.max(16, Math.floor(rr.r * rr.dens));
            for (var j = 0; j < n2; j++) {
                var a2 = (j / n2) * Math.PI * 2 + ri * 0.31;
                var at2 = new Location(world,
                    center.getX() + Math.cos(a2) * rr.r,
                    baseY + rr.y,
                    center.getZ() + Math.sin(a2) * rr.r);
                spawnParticleSafe(world, Particle.SQUID_INK, at2, 2, 0.06, 0.1, 0.06, 0.025);
                if (j % 2 === 0) spawnDust(world, at2, 1, 0.05, 0.05, 0.05, ri === 0 ? DUST_INK : DUST_SILVER);
            }
        }
    }
}

function spawnWaveSpikes(world, center, radius) {
    if (radius < 0.8) return;
    for (var s = 0; s < WAVE_SPIKE_COUNT; s++) {
        var ang = Math.random() * Math.PI * 2;
        var r = radius * (0.85 + Math.random() * 0.2);
        var base = new Location(world,
            center.getX() + Math.cos(ang) * r,
            center.getY() + 0.1,
            center.getZ() + Math.sin(ang) * r);
        for (var h = 0; h < 6; h++) {
            var p = base.clone().add(0, h * 0.35, 0);
            spawnParticleSafe(world, Particle.SQUID_INK, p, 3, 0.08, 0.05, 0.08, 0.02);
            if (h % 2 === 0) spawnDust(world, p, 1, 0.04, 0.04, 0.04, DUST_INK_DEEP);
        }
        var tip = base.clone().add(0, 2.2, 0);
        spawnParticleSafe(world, Particle.FLASH, tip, 1, 0, 0, 0, 0);
        spawnDust(world, tip, 2, 0.1, 0.1, 0.1, DUST_FLASH);
        spawnParticleSafe(world, Particle.END_ROD, tip, 3, 0.05, 0.2, 0.05, 0.02);
    }
}

function spawnBurstCore(world, center) {
    var c = center.clone().add(0, 1.05, 0);
    // 核心炸裂：墨潮 + 白闪 + 音爆
    spawnParticleSafe(world, Particle.SQUID_INK, c, 140, 0.7, 1.1, 0.7, 0.12);
    spawnParticleSafe(world, Particle.LARGE_SMOKE, c, 55, 0.9, 0.7, 0.9, 0.05);
    spawnParticleSafe(world, Particle.ASH, c, 80, 1.1, 1.2, 1.1, 0.03);
    spawnParticleSafe(world, Particle.FLASH, c, 3, 0.15, 0.1, 0.15, 0);
    spawnParticleSafe(world, Particle.EXPLOSION, c, 4, 0.35, 0.2, 0.35, 0);
    spawnParticleSafe(world, Particle.SONIC_BOOM, c, 1, 0, 0, 0, 0);
    spawnParticleSafe(world, Particle.SCULK_SOUL, c, 25, 0.6, 0.8, 0.6, 0.04);
    spawnParticleSafe(world, Particle.REVERSE_PORTAL, c, 40, 0.5, 0.9, 0.5, 0.08);
    spawnDust(world, c, 55, 0.9, 0.85, 0.9, DUST_INK);
    spawnDust(world, c, 30, 0.7, 0.7, 0.7, DUST_FLASH);
    spawnDust(world, c, 20, 0.5, 0.6, 0.5, DUST_SILVER);
    // 竖直墨柱
    for (var h = 0; h < 10; h++) {
        var col = center.clone().add(0, 0.2 + h * (BURST_PILLAR_H / 10), 0);
        spawnParticleSafe(world, Particle.SQUID_INK, col, 8, 0.15, 0.08, 0.15, 0.03);
        if (h % 2 === 0) spawnDust(world, col, 2, 0.1, 0.05, 0.1, DUST_INK_DEEP);
        if (h % 3 === 0) spawnParticleSafe(world, Particle.END_ROD, col, 2, 0.05, 0.1, 0.05, 0.01);
    }
    // 地面冲击环
    spawnInkRing(world, center, 1.2, 1.4);
    spawnInkRing(world, center, 2.4, 1.1);
    // 放射墨刃
    for (var i = 0; i < BURST_RAY_COUNT; i++) {
        var ang = (i / BURST_RAY_COUNT) * Math.PI * 2;
        for (var step = 1; step <= 4; step++) {
            var len = (BURST_RAY_LEN / 4) * step;
            var tip = new Location(world,
                center.getX() + Math.cos(ang) * len,
                center.getY() + 0.35 + (i % 3) * 0.22 + step * 0.08,
                center.getZ() + Math.sin(ang) * len);
            spawnParticleSafe(world, Particle.SQUID_INK, tip, 6, 0.12, 0.18, 0.12, 0.05);
            spawnParticleSafe(world, Particle.SMOKE, tip, 3, 0.08, 0.12, 0.08, 0.02);
            if (step === 4) {
                spawnDust(world, tip, 2, 0.08, 0.08, 0.08, DUST_FLASH);
                spawnParticleSafe(world, Particle.CRIT, tip, 4, 0.1, 0.1, 0.1, 0.2);
            }
        }
    }
}

function spawnFinale(world, center) {
    var c = center.clone().add(0, 0.75, 0);
    // 多层冲击环
    for (var ri = 0; ri < FINALE_SHOCK_RINGS; ri++) {
        var rr = LIGHT_RUIN_RADIUS * (0.35 + ri * 0.22);
        spawnInkRing(world, center, rr, 1.5 - ri * 0.12);
    }
    spawnParticleSafe(world, Particle.SQUID_INK, c, 180, 2.6, 1.5, 2.6, 0.12);
    spawnParticleSafe(world, Particle.LARGE_SMOKE, c, 80, 2.8, 1.0, 2.8, 0.06);
    spawnParticleSafe(world, Particle.ASH, c, 100, 2.5, 1.4, 2.5, 0.04);
    spawnParticleSafe(world, Particle.EXPLOSION, c, 6, 0.7, 0.35, 0.7, 0);
    spawnParticleSafe(world, Particle.FLASH, c, 4, 0.35, 0.2, 0.35, 0);
    spawnParticleSafe(world, Particle.SONIC_BOOM, c, 2, 0.2, 0, 0.2, 0);
    spawnParticleSafe(world, Particle.SCULK_SOUL, c, 40, 1.5, 1.0, 1.5, 0.05);
    spawnParticleSafe(world, Particle.REVERSE_PORTAL, c, 50, 1.2, 1.2, 1.2, 0.1);
    spawnParticleSafe(world, Particle.END_ROD, c, 35, 1.8, 1.5, 1.8, 0.08);
    spawnDust(world, c, 70, 2.0, 1.2, 2.0, DUST_INK);
    spawnDust(world, c, 40, 1.5, 1.0, 1.5, DUST_FLASH);
    spawnDust(world, c, 25, 1.2, 0.8, 1.2, DUST_SILVER);
    // 终爆墨柱喷泉
    for (var h = 0; h < 14; h++) {
        var geyser = center.clone().add(
            (Math.random() - 0.5) * 1.2,
            0.3 + h * 0.32,
            (Math.random() - 0.5) * 1.2);
        spawnParticleSafe(world, Particle.SQUID_INK, geyser, 10, 0.2, 0.1, 0.2, 0.06);
        if (h % 2 === 0) spawnDust(world, geyser, 2, 0.1, 0.08, 0.1, DUST_INK_DEEP);
        if (h % 3 === 0) spawnParticleSafe(world, Particle.END_ROD, geyser, 2, 0.08, 0.15, 0.08, 0.02);
    }
    // 外缘碎星爆点
    for (var i = 0; i < 18; i++) {
        var ang = (i / 18) * Math.PI * 2;
        var edge = new Location(world,
            center.getX() + Math.cos(ang) * LIGHT_RUIN_RADIUS,
            center.getY() + 0.5 + (i % 4) * 0.35,
            center.getZ() + Math.sin(ang) * LIGHT_RUIN_RADIUS);
        spawnParticleSafe(world, Particle.SQUID_INK, edge, 12, 0.25, 0.4, 0.25, 0.08);
        spawnParticleSafe(world, Particle.FLASH, edge, 1, 0, 0, 0, 0);
        spawnDust(world, edge, 3, 0.15, 0.15, 0.15, DUST_FLASH);
        spawnParticleSafe(world, Particle.CRIT, edge, 6, 0.2, 0.25, 0.2, 0.25);
    }
}

function dealLightRuinPulse(ent, caster, dmg, rt, mage) {
    var runtime = rt;
    if (!hasPulseApi(runtime)) runtime = resolveSpellRuntime();
    if (hasPulseApi(runtime)) {
        try {
            runtime.dealPulseSpellDamage(ent, dmg, caster, { name: SKILL_NAME, ring: LIGHT_RUIN_RING });
            return true;
        } catch (ePulse) {}
    }
    // 无运行时播报时仍走术士脉冲（虚空模型），禁止退回普通 ent.damage
    try {
        if (mage != null && hasApiFn(mage, "dealPulseDamage")) {
            mage.dealPulseDamage(ent, dmg, caster);
            return true;
        }
    } catch (eMage) {}
    try {
        var castApi = getPlugin() != null ? getPlugin().gltcCastApi : null;
        if (castApi != null && hasApiFn(castApi, "getMageApi")) {
            var viaCast = castApi.getMageApi();
            if (hasApiFn(viaCast, "dealPulseDamage")) {
                viaCast.dealPulseDamage(ent, dmg, caster);
                return true;
            }
        }
    } catch (eCast) {}
    try {
        Bukkit.getLogger().warning("[GLTC光影废墟] 脉冲 API 不可用，跳过伤害（避免普通伤害误伤）");
    } catch (eLog) {}
    return false;
}

function applyLightRuinHit(ent, caster, origin, dmg, rt, mage) {
    dealLightRuinPulse(ent, caster, dmg, rt, mage);
    try {
        var dir = ent.getLocation().toVector().subtract(origin);
        if (dir.lengthSquared() < 0.0001) {
            dir = caster.getLocation().getDirection().clone();
            dir.setY(0);
        }
        if (dir.lengthSquared() > 0.0001) {
            dir.normalize().multiply(LIGHT_RUIN_KB).setY(LIGHT_RUIN_KB_Y);
            ent.setVelocity(dir);
        }
    } catch (eK) {}
    try {
        var at = ent.getLocation().add(0, 1, 0);
        spawnParticleSafe(ent.getWorld(), Particle.SQUID_INK, at, 35, 0.35, 0.5, 0.35, 0.08);
        spawnParticleSafe(ent.getWorld(), Particle.LARGE_SMOKE, at, 12, 0.3, 0.4, 0.3, 0.03);
        spawnParticleSafe(ent.getWorld(), Particle.CRIT, at, 18, 0.25, 0.35, 0.25, 0.22);
        spawnParticleSafe(ent.getWorld(), Particle.FLASH, at, 1, 0, 0, 0, 0);
        spawnParticleSafe(ent.getWorld(), Particle.END_ROD, at, 8, 0.2, 0.35, 0.2, 0.05);
        spawnDust(ent.getWorld(), at, 10, 0.25, 0.3, 0.25, DUST_INK);
        spawnDust(ent.getWorld(), at, 6, 0.2, 0.25, 0.2, DUST_FLASH);
    } catch (eP) {}
}

function lightRuin(player) {
    if (!player || !(player instanceof Player)) return;
    var key = jUuid(String(player.getUniqueId().toString()));
    var now = Date.now();
    var prev = _cdMap.get(key);
    if (prev != null && now - Number(prev) < LIGHT_RUIN_CD_MS) {
        var left = Math.ceil((LIGHT_RUIN_CD_MS - (now - Number(prev))) / 1000);
        try { player.sendActionBar("§7" + SKILL_NAME + "冷却 §f" + left + "s"); } catch (eA) {}
        return;
    }
    try { _cdMap.put(key, java.lang.Long.parseLong(String(Math.floor(now)), 10)); } catch (eC) {}

    var world = player.getWorld();
    var center = player.getLocation().clone();
    var origin = center.toVector();

    try { world.playSound(center, SND_OPEN_MACE, SND_OPEN_MACE_VOL, SND_OPEN_MACE_PITCH); } catch (eS0) {}
    try { world.playSound(center, Sound.BLOCK_RESPAWN_ANCHOR_DEPLETE, SND_OPEN_ANCHOR_VOL, SND_OPEN_ANCHOR_PITCH); } catch (eS1) {}
    spawnBurstCore(world, center);

    var mage = resolveMageApi();
    var dmg = LIGHT_RUIN_DMG_FALLBACK;
    try {
        if (mage && hasApiFn(mage, "calcSpellDamage")) {
            dmg = Number(mage.calcSpellDamage(player, LIGHT_RUIN_COEFF));
            if (!(dmg > 0)) dmg = LIGHT_RUIN_DMG_FALLBACK;
        }
    } catch (eD) {}
    var rt = resolveSpellRuntime();
    if (!hasPulseApi(rt) && mage == null) {
        try {
            Bukkit.getLogger().warning("[GLTC光影废墟] 运行时/术士 API 均未解析到，伤害可能被跳过");
        } catch (eWarn) {}
    }
    var hit = new HashSet();
    var tick = 0;
    var alive = true;
    var task = null;

    task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!alive) return;
                tick++;
                var t = tick / LIGHT_RUIN_EXPAND_TICKS;
                if (t > 1) t = 1;
                var eased = t * t * (3 - 2 * t);
                var radius = LIGHT_RUIN_RADIUS * eased;
                if (tick % RING_DRAW_EVERY === 0) {
                    spawnInkRing(world, center, radius, 1.2 + t * 0.45);
                }

                if (tick % 2 === 0) {
                    spawnWaveSpikes(world, center, radius);
                    for (var k = 0; k < SPLASH_PER_TICK; k++) {
                        var a = Math.random() * Math.PI * 2;
                        var splash = new Location(world,
                            center.getX() + Math.cos(a) * radius,
                            center.getY() + 0.15 + Math.random() * 1.4,
                            center.getZ() + Math.sin(a) * radius);
                        spawnParticleSafe(world, Particle.SQUID_INK, splash, 5, 0.12, 0.18, 0.12, 0.06);
                        spawnParticleSafe(world, Particle.SMOKE, splash, 2, 0.08, 0.1, 0.08, 0.02);
                        if (k % 2 === 0) spawnDust(world, splash, 1, 0.06, 0.08, 0.06, DUST_FLASH);
                    }
                    // 中心残余漩涡
                    var vortex = center.clone().add(0, 0.6 + Math.random() * 0.8, 0);
                    spawnParticleSafe(world, Particle.REVERSE_PORTAL, vortex, 8, 0.35, 0.5, 0.35, 0.04);
                    spawnParticleSafe(world, Particle.SOUL, vortex, 3, 0.25, 0.4, 0.25, 0.02);
                }
                if (tick === 3 || tick === 7 || tick === 11) {
                    spawnInkRing(world, center, Math.max(0.6, radius * 0.55), 0.9);
                }

                if (tick % SEARCH_EVERY === 0 || tick >= LIGHT_RUIN_EXPAND_TICKS) {
                    var box = radius + LIGHT_RUIN_SEARCH_PAD;
                    var it = world.getNearbyEntities(center, box, LIGHT_RUIN_SEARCH_Y, box).iterator();
                    while (it.hasNext()) {
                        var ent = it.next();
                        if (!isLightRuinTarget(ent, player)) continue;
                        var uid = String(ent.getUniqueId().toString());
                        if (hit.contains(uid)) continue;
                        var dx = ent.getLocation().getX() - center.getX();
                        var dz = ent.getLocation().getZ() - center.getZ();
                        var dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist > radius + LIGHT_RUIN_HIT_SLACK) continue;
                        hit.add(uid);
                        applyLightRuinHit(ent, player, origin, dmg, rt, mage);
                    }
                }

                if (tick >= LIGHT_RUIN_EXPAND_TICKS) {
                    alive = false;
                    try { if (task != null) task.cancel(); } catch (eC0) {}
                    spawnFinale(world, center);
                }
            } catch (ex) {
                alive = false;
                try { if (task != null) task.cancel(); } catch (eC1) {}
            }
        }
    })), 0, 1);

    try { player.sendActionBar("§d" + SKILL_NAME); } catch (eA2) {}
}

// 导出：技能登记扫描后写入 SKILL_DEFS[id]
({
    id: SKILL_ID,
    name: SKILL_NAME,
    skillHint: SKILL_HINT,
    onSelectSpell: lightRuin
    // onSneakUse / onAfterCast 按需追加
});
