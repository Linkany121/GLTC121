/**
 * 术式：庇护脉络 —— 3环 · 沃土奥法流派
 * 活性涵粒子环绕 5 秒：每秒随机增益；推开并伤害附近敌人
 * ID：VASA_庇护脉络
 * 持续效果走术式会话：切术/开环/换栏/退服会清理；到时自然结束
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
var JString = Java.type("java.lang.String");
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

// ======================== 庇护脉络 · 可调配置 ========================
// 改完后重载附属 / 重新加载术式脚本生效

/** 物品 / 登记 ID */
var SPELL_ID = "VASA_庇护脉络";
/** 显示名（播报 / 登记） */
var SPELL_NAME = "庇护脉络";
/** 环数 */
var SPELL_RING = 3;
/** 保留字段（当前无粒子消耗） */
var SPELL_COST = 10;
/** 冷却（毫秒） */
var SPELL_COOLDOWN_MS = 16000;
/** 伤害系数（最终 = 粒子强度 × 系数 × GLI） */
var SPELL_COEFFICIENT = 1.5;

/** 环绕持续（tick）；100 = 5 秒 */
var DURATION_TICKS = 100;
/** 粒子环直径（格）；判定半径 = 直径/2 */
var DIAMETER = 5.0;
/** 每 tick 环上粒子点数 */
var RING_POINTS = 28;
/** 单次随机增益持续（tick）；100 = 5 秒 */
var BUFF_TICKS = 100;
/** 增益等级（0 = I） */
var BUFF_AMP = 0;
/** 推开敌人的水平速度 */
var KNOCKBACK = 0.85;
/** 推开敌人的向上速度 */
var KNOCKBACK_UP = 0.28;
// ======================== 配置结束（以下勿随意改） ========================

var RADIUS = DIAMETER / 2.0;

/** ConcurrentHashMap 键统一 java.lang.String，避免 Graal JS string 对不上 */
function auraKey(uuid) {
    return JString.valueOf(String(uuid));
}

/** uuid -> { alive, task, taskId, ticks, sessionToken } */
function auraStore() {
    try {
        var existing = PLUGIN.gltc_bihu_aura_store;
        if (existing != null && (existing instanceof java.util.concurrent.ConcurrentHashMap)) {
            return existing;
        }
    } catch (e0) {}
    var m = new java.util.concurrent.ConcurrentHashMap();
    try { PLUGIN.gltc_bihu_aura_store = m; } catch (e1) {}
    return m;
}

function getSessionApi() {
    try {
        if (PLUGIN.gltcSpellSessionApi != null) return PLUGIN.gltcSpellSessionApi;
    } catch (e0) {}
    return UTIL && UTIL.spellSession ? UTIL.spellSession : null;
}

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

function stopAura(uuid, invokeSessionEnd) {
    uuid = String(uuid);
    var store = auraStore();
    var st = null;
    try { st = store.remove(auraKey(uuid)); } catch (eR0) {}
    // 兼容旧键（纯 JS string）
    if (st == null) {
        try { st = store.remove(uuid); } catch (eR1) {}
    }
    if (st == null) return;
    st.alive = false;
    try {
        if (st.taskId != null) Bukkit.getScheduler().cancelTask(Number(st.taskId));
    } catch (e0) {}
    try {
        if (st.task != null) st.task.cancel();
    } catch (e1) {}
    if (invokeSessionEnd && st.sessionToken) {
        try {
            var api = getSessionApi();
            if (api && typeof api.end === "function") api.end(uuid, st.sessionToken, false);
        } catch (e2) {}
    }
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
    try {
        var bridge = PLUGIN.gltcSpellUtilBridge;
        if (bridge != null) {
            bridge.dealParticleSpellDamage(ent, dmg, caster, spellInfo.ring, spellInfo.name);
            return;
        }
    } catch (eBr) {}
    if (UTIL && UTIL.dealParticleSpellDamage) {
        UTIL.dealParticleSpellDamage(ent, dmg, caster, spellInfo);
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
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cost: SPELL_COST,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: true,
    cast: function(player, mageApi) {
        var dmg = mageApi.calcSpellDamage(player, SPELL_COEFFICIENT);
        var spellInfo = { ring: SPELL_RING, name: SPELL_NAME };
        var uuid = String(player.getUniqueId().toString());
        var key = auraKey(uuid);
        var phase = 0;

        // 重施 / begin(replace) 会清旧会话；本地再兜底停任务
        stopAura(uuid, true);

        var st = { alive: true, task: null, taskId: null, ticks: 0, sessionToken: null };
        auraStore().put(key, st);

        var api = getSessionApi();
        if (api && typeof api.begin === "function") {
            try {
                st.sessionToken = api.begin(player, SPELL_ID, function() {
                    stopAura(uuid, false);
                }, { replace: true });
            } catch (eBeg) {
                Bukkit.getLogger().warning("[GLTC庇护脉络] beginSession: " + eBeg);
            }
        }

        try {
            player.getWorld().playSound(player.getLocation(), Sound.ITEM_TOTEM_USE, 0.55, 1.35);
        } catch (eS) {}

        // 本地持有 BukkitTask：到时直接 cancel，不依赖 Map.remove 是否命中
        var auraTask = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() {
                try {
                    if (!st.alive) {
                        try { auraTask.cancel(); } catch (eDead) {}
                        return;
                    }
                    st.ticks++;
                    phase += 0.22;
                    var p = findOnline(uuid);
                    if (p == null || !p.isOnline()) {
                        st.alive = false;
                        try { auraTask.cancel(); } catch (eOff) {}
                        stopAura(uuid, true);
                        return;
                    }
                    var center = p.getLocation();
                    spawnRingFx(p.getWorld(), center, phase);

                    if (st.ticks % 20 === 1) {
                        applyRandomBuff(p);
                        pulseNearby(p, dmg, mageApi, spellInfo);
                        try { p.getWorld().playSound(center, Sound.BLOCK_AMETHYST_BLOCK_CHIME, 0.45, 1.4); } catch (eA) {}
                    }

                    if (st.ticks >= DURATION_TICKS) {
                        try { p.getWorld().playSound(center, Sound.BLOCK_BEACON_DEACTIVATE, 0.5, 1.2); } catch (eE) {}
                        st.alive = false;
                        try { auraTask.cancel(); } catch (eC) {}
                        stopAura(uuid, true);
                    }
                } catch (ex) {
                    st.alive = false;
                    try { auraTask.cancel(); } catch (eX) {}
                    stopAura(uuid, true);
                }
            }
        })), 0, 1);
        st.task = auraTask;
        try { st.taskId = auraTask.getTaskId(); } catch (eId) {}
        return true;
    }
});
