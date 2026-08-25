// ===================================================================
// 术式：火球术 —— 1环 · 环夜谷（v2 · 瞬时弹体 + 会话清理）
// ID：VASA_火球术（与 items.yml 术式载体一致）
// 右键施展：发射火球弹体，命中造成物理伤害
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
var META_SHARED = "gltc_shared_root_maps"; // Plugin Metadata 共享根键
var META_RUNTIME = "gltc_spell_runtime";  // 运行时独立挂载键（优先）
var META_MAGE    = "gltc_mage_api";       // 术士 API（粒子强度结算）

// === 术式身份 / 登记导出 ===
var SPELL_ID          = "VASA_火球术"; // 术式 ID（= 术式载体物品 ID）
var SPELL_NAME        = "火球术";       // 纯文本短名（伤害播报回退；GUI 优先物品彩名）
var SPELL_RING        = 1;              // 环数（写入 hit info）
var SPELL_SCHOOL      = "环夜谷";       // 流派键（登记 / GUI 潜影盒色）
var SPELL_BOOK        = true;           // true = 存在同 ID 术式载体

// === 冷却 / 伤害 ===
var SPELL_COOLDOWN_MS = 3000;           // 施展冷却（毫秒，与载体 lore「3 秒」一致）
var SPELL_COEFFICIENT = 1;            // 伤害系数（mageApi.calcSpellDamage）

// === 弹体飞行 ===
var FLY_SPEED         = 32;             // 飞行速度（格/秒）
var MAX_DISTANCE      = 24;             // 最大飞行距离（格）
var HIT_HALF          = 0.55;           // 命中判定半宽（立方体半边长，格）
var SPAWN_OFFSET      = 0.8;            // 自眼位沿视线前移生成距离（格）
var DISPLAY_SCALE     = 0.85;           // 飞行 ItemDisplay 缩放
var DISPLAY_MATERIAL  = Material.FIRE_CHARGE; // 弹体显示材质

// === 飞行拖尾粒子 ===
var TRAIL_PARTICLE    = Particle.FLAME; // 拖尾粒子类型
var TRAIL_COUNT       = 2;              // 每 tick 粒子数
var TRAIL_SPREAD      = 0.1;           // 粒子扩散
var TRAIL_SPEED       = 0.01;           // 粒子额外速度

// === 发射音效（字符串 ID：兼容 Paper Sound 接口 + Graal，避免枚举解析失败被静默吞掉）===
var SOUND_CAST        = "entity.blaze.shoot";
var SOUND_CAST_VOL    = 0.85;
var SOUND_CAST_PITCH  = 1.15;

// === 命中爆发 ===
var SOUND_HIT         = "entity.generic.explode";
var SOUND_HIT_VOL     = 0.55;
var SOUND_HIT_PITCH   = 1.3;
var HIT_SMOKE_COUNT   = 12;             // EXPLOSION 不可用时的烟雾回退数量
var HIT_SMOKE_SPREAD  = 0.2;

// ===================================================================
// 运行时解析：优先 mageApi 注入 → Metadata → 热加载
// ===================================================================
function resolveSpellRuntime(mageApi) {
    try {
        if (mageApi != null) {
            if (typeof mageApi.getSpellRuntime === "function") {
                var fromFn = mageApi.getSpellRuntime();
                if (fromFn != null) return fromFn;
            }
            if (mageApi.spellRuntime != null) return mageApi.spellRuntime;
            if (mageApi.runtime != null) return mageApi.runtime;
        }
    } catch (eApi) {}

    var p = null;
    try { p = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer"); } catch (e0) {}
    if (p == null) p = PLUGIN;

    try {
        if (p != null && p.hasMetadata(META_RUNTIME)) {
            var direct = p.getMetadata(META_RUNTIME).get(0).value();
            if (direct != null) return direct;
        }
    } catch (eD) {}

    function fromRoot(root) {
        if (root == null) return null;
        try {
            var rt = root.get("gltcSpellRuntime");
            return rt != null ? rt : null;
        } catch (e) { return null; }
    }

    try {
        if (p != null && p.hasMetadata(META_SHARED)) {
            var hit = fromRoot(p.getMetadata(META_SHARED).get(0).value());
            if (hit != null) return hit;
        }
    } catch (eM) {}
    try {
        if (p != null && p.gltcSpellRuntime != null) return p.gltcSpellRuntime;
    } catch (e1) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcSpellRuntime != null) {
            return RSC.INSTANCE.gltcSpellRuntime;
        }
    } catch (e2) {}
    try {
        var maps = p != null ? p.gltcSharedMaps : null;
        var hit2 = fromRoot(maps);
        if (hit2 != null) return hit2;
    } catch (e3) {}

    // 禁止热加载二次 eval 运行时（会分裂伤害监听）；缺失则由监听 boot 修复
    return null;
}

function rt(mageApi) {
    return resolveSpellRuntime(mageApi);
}

/** 世界音效：字符串 ID 优先，失败再回退一次（不静默丢异常原因） */
function playSpellSound(world, loc, sound, vol, pitch) {
    if (world == null || loc == null || sound == null) return;
    try {
        world.playSound(loc, sound, vol, pitch);
        return;
    } catch (e0) {}
    try {
        world.playSound(loc, String(sound), vol, pitch);
    } catch (e1) {
        try {
            Bukkit.getLogger().warning("[GLTC火球术] 音效播放失败: " + sound + " → " + e1);
        } catch (eLog) {}
    }
}

function isTarget(ent, casterUuid) {
    var living = false;
    try { living = LivingEntity.class.isInstance(ent); } catch (e0) {
        try { living = ent instanceof LivingEntity; } catch (e1) {}
    }
    if (!living || ent.isDead()) return false;
    try {
        if (Player.class.isInstance(ent) && String(ent.getUniqueId().toString()) === casterUuid) return false;
    } catch (eP) {
        if (ent instanceof Player && String(ent.getUniqueId().toString()) === casterUuid) return false;
    }
    try { if (ent.getType() === EntityType.ARMOR_STAND) return false; } catch (eA) {}
    try { if (ent.getType() === EntityType.ITEM_DISPLAY) return false; } catch (eD) {}
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

/** 伤害 = 粒子强度 × 系数 × GLI */
function calcFireballDamage(player, mageApi) {
    function bridgeGet(key) {
        var k = String(key);
        try {
            var loader = PLUGIN != null ? PLUGIN.gltcScriptLoader : null;
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
            var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
            if (RSC.INSTANCE != null && RSC.INSTANCE.gltcJavaBridges != null) {
                var v1 = RSC.INSTANCE.gltcJavaBridges.get(k);
                if (v1 != null) return v1;
            }
        } catch (e1) {}
        return null;
    }
    try {
        var calcBr = bridgeGet("gltcMage_calcSpellDamage");
        if (calcBr != null) {
            var bv = Number(calcBr.apply(player, java.lang.Double.valueOf(SPELL_COEFFICIENT)));
            if (bv > 0 && isFinite(bv)) return bv;
        }
    } catch (eBr) {}
    // 2) 同上下文 JS API（施术核心传入的 facade）
    try {
        if (mageApi != null && mageApi.calcSpellDamage != null) {
            var v = Number(mageApi.calcSpellDamage(player, SPELL_COEFFICIENT));
            if (v > 0 && isFinite(v)) return v;
        }
    } catch (eApi) {}
    try {
        Bukkit.getLogger().warning("[GLTC火球术] calcSpellDamage 失败，粒子强度未生效");
    } catch (eLog) {}
    return SPELL_COEFFICIENT;
}

function castFireball(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) {
        Bukkit.getLogger().warning("[GLTC火球术] 运行时未加载");
        return false;
    }
    var dmg = calcFireballDamage(player, mageApi);
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();
    var loc = eye.clone().add(dir.getX() * SPAWN_OFFSET, dir.getY() * SPAWN_OFFSET, dir.getZ() * SPAWN_OFFSET);
    var display = runtime.spawnFlyingItemDisplay(world, loc, DISPLAY_MATERIAL, DISPLAY_SCALE);
    if (!display) return false;

    var ownerUuid = String(player.getUniqueId().toString());
    var speed = FLY_SPEED / 20.0;
    var maxTicks = Math.ceil(MAX_DISTANCE / speed);
    var ticks = 0;
    var alive = true;
    var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
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
        persistence: runtime.SESSION_UNPROJECTED,
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
                ticks++;
                loc.add(dir.getX() * speed, dir.getY() * speed, dir.getZ() * speed);
                runtime.moveFlyingDisplay(display, loc);
                try {
                    world.spawnParticle(TRAIL_PARTICLE, loc, TRAIL_COUNT, TRAIL_SPREAD, TRAIL_SPREAD, TRAIL_SPREAD, TRAIL_SPEED);
                } catch (eP) {}

                var hitSolid = false;
                try { hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}
                var hitEnt = findHit(world, loc, ownerUuid);
                if (!hitEnt && !hitSolid && ticks < maxTicks) return;

                if (hitEnt) {
                    runtime.dealPhysicalSpellDamage(hitEnt, dmg, player, spellInfo);
                }
                try { world.spawnParticle(Particle.EXPLOSION, loc, 1, 0, 0, 0, 0); } catch (eX) {
                    try {
                        world.spawnParticle(Particle.SMOKE, loc, HIT_SMOKE_COUNT,
                            HIT_SMOKE_SPREAD, HIT_SMOKE_SPREAD, HIT_SMOKE_SPREAD, 0.02);
                    } catch (eX2) {}
                }
                playSpellSound(world, loc, SOUND_HIT, SOUND_HIT_VOL, SOUND_HIT_PITCH);
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
    cast: castFireball
});
