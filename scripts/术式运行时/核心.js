// ===================================================================
// 术式运行时 v2 — 唯一权威（由 监听.js 单次 eval）
// - 共享状态：Plugin Metadata 共享根（_gltcSharedRoot）
// - 会话：unprojected（开 GUI/切术清）/ projected（保留至自然结束）
// - 左键二次操作 / 物理·粒子·脉冲伤害 / 飞行 ItemDisplay
// 术式/道具禁止再 eval 本文件（可按需从共享根取 gltcSpellRuntime）
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var EntityDamageEvent = Java.type("org.bukkit.event.entity.EntityDamageEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var ItemDisplay = null;
try { ItemDisplay = Java.type("org.bukkit.entity.ItemDisplay"); } catch (e0) {}
var Vector = null;
try { Vector = Java.type("org.bukkit.util.Vector"); } catch (eV0) {}
var EntityType = null;
try { EntityType = Java.type("org.bukkit.entity.EntityType"); } catch (eEt0) {}
var Transformation = null;
try { Transformation = Java.type("org.bukkit.util.Transformation"); } catch (e1) {}
var Vector3f = null;
try { Vector3f = Java.type("org.joml.Vector3f"); } catch (e2) {}
var Quaternionf = null;
try { Quaternionf = Java.type("org.joml.Quaternionf"); } catch (e3) {}
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");
var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

// === 播报样式 ===
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var C_MSG   = "§x§f§f§f§5§b§3"; // 普通提示色
var C_SPELL = "§x§6§2§c§6§f§f"; // 术式名强调色
var C_DMG   = "§c";             // 伤害数字色

// === 会话 / 伤害类型常量（勿改字符串，术式脚本依赖）===
var SESSION_UNPROJECTED = "unprojected"; // 开 GUI / 切术清除
var SESSION_PROJECTED   = "projected";   // 保留至自然结束
var DMG_PHYSICAL = "physical";
var DMG_PARTICLE = "particle";
var DMG_PULSE    = "pulse";

// === 实体 Metadata 键 ===
var META_SPELL_HIT      = "gltc_spell_hit_info";      // 命中信息（播报）
var META_SPELL_PARTICLE = "gltc_spell_particle_hit"; // 粒子伤害标记（跳过原版减伤）
var META_PULSE          = "gltc_pulse_hit";           // 脉冲伤害标记（跳过减伤）
var META_PULSE_AMT      = "gltc_pulse_hit_amount";    // 脉冲真实伤害额（监听.js 用）

// === 交互门槛（可调）===
var LEFT_GATE_MS            = 120; // 左键二次操作最短间隔（毫秒）
var SPELL_DMG_LISTENER_VER  = 8;   // v8=粒子改 SONIC_BOOM + 运行时 HIGHEST 兜底 + 花如画卷左键状态兜底
var HUA_RU_SPELL_ID         = "VASA_花如画卷";
var HUA_RU_STATE_KEY        = "huaru_state";

var _tokenSeq = 0;
var _dmgListenerReady = false;
var _DamageSourceClass = null;
var _DamageTypeClass = null;

function jUuid(u) {
    return java.lang.String.valueOf(String(u));
}

function toJavaLong(n) {
    var v = Math.floor(Number(n));
    if (!isFinite(v)) v = 0;
    return java.lang.Long.parseLong(String(v), 10);
}

function readEpochMs(v) {
    if (v == null) return 0;
    try {
        var n = Number(v);
        if (isFinite(n)) return n;
    } catch (e0) {}
    try {
        return java.lang.Long.parseLong(String(v), 10);
    } catch (e1) {
        return 0;
    }
}

function playerUuid(p) {
    if (p == null) return "";
    try {
        if (typeof p.getUniqueId === "function") return String(p.getUniqueId().toString());
    } catch (e) {}
    return String(p);
}

function findOnline(uuid) {
    uuid = String(uuid);
    if (!uuid) return null;
    try {
        return Bukkit.getPlayer(java.util.UUID.fromString(uuid));
    } catch (e0) {}
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].getUniqueId().toString()) === uuid) return arr[i];
        }
    } catch (e1) {}
    return null;
}

/** Graal 跨上下文：优先 Class.isInstance，instanceof 仅作回退 */
function isLivingEntity(ent) {
    if (ent == null) return false;
    try {
        if (LivingEntity.class.isInstance(ent)) return true;
    } catch (e0) {}
    try { return ent instanceof LivingEntity; } catch (e1) {}
    return false;
}

/** 清理术式命中相关 Metadata（取消/结束时必清，防折射误套） */
function clearSpellHitMeta(target) {
    if (!target || !PLUGIN) return;
    try { target.removeMetadata(META_SPELL_HIT, PLUGIN); } catch (e0) {}
    try { target.removeMetadata(META_SPELL_PARTICLE, PLUGIN); } catch (e1) {}
    try { target.removeMetadata(META_PULSE, PLUGIN); } catch (e2) {}
    try { target.removeMetadata(META_PULSE_AMT, PLUGIN); } catch (e3) {}
}

/** 按玩家 UUID 前缀清理共享根 Map（quit 防泄漏） */
function purgePlayerKeyedMap(map, uuidPrefix) {
    if (map == null || !uuidPrefix) return 0;
    var n = 0;
    var prefix = String(uuidPrefix);
    try {
        var it = map.keySet().iterator();
        while (it.hasNext()) {
            var k = String(it.next());
            if (k === prefix || k.indexOf(prefix + "|") === 0) {
                try { map.remove(java.lang.String.valueOf(k)); n++; } catch (eRm) {
                    try { map.remove(k); n++; } catch (eRm2) {}
                }
            }
        }
    } catch (e) {}
    return n;
}

function purgePlayerRuntimeState(playerOrUuid) {
    var uuid = playerUuid(playerOrUuid);
    if (!uuid) return;
    var jk = jUuid(uuid);
    try { leftClickMap().remove(jk); } catch (e0) {}
    try { leftGateMap().remove(jk); } catch (e1) {}
    try { busyMap().remove(jk); } catch (e2) {}
    try { sessionsMap().remove(jk); } catch (e3) {}
    try { purgePlayerKeyedMap(mapOf("cast_cd"), uuid); } catch (e4) {}
    try { purgePlayerKeyedMap(mapOf("staff_use_ms"), uuid); } catch (e5) {}
    try { purgePlayerKeyedMap(mapOf("last_main_staff"), uuid); } catch (e6) {}
    try { purgePlayerKeyedMap(mapOf("cast_in_flight"), uuid); } catch (e7) {}
}

function loadSharedRootApi() {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/_gltcSharedRoot.js"),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/_gltcSharedRoot.js")
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

var SHARED_ROOT_API = loadSharedRootApi();

function sharedRoot() {
    if (SHARED_ROOT_API && SHARED_ROOT_API.getGltcSharedRoot) {
        try {
            var r = SHARED_ROOT_API.getGltcSharedRoot();
            if (r != null) return r;
        } catch (e0) {}
    }
    try {
        if (PLUGIN != null && PLUGIN.hasMetadata("gltc_shared_root_maps")) {
            var metaRoot = PLUGIN.getMetadata("gltc_shared_root_maps").get(0).value();
            if (metaRoot != null) return metaRoot;
        }
    } catch (eMeta) {}
    var map = new CHM();
    try {
        if (SHARED_ROOT_API && SHARED_ROOT_API.publishGltcSharedRoot) {
            return SHARED_ROOT_API.publishGltcSharedRoot(map);
        }
    } catch (ePub) {}
    try {
        PLUGIN.setMetadata("gltc_shared_root_maps", new FixedMetadataValue(PLUGIN, map));
    } catch (eSet) {}
    return map;
}

function mapOf(key) {
    var root = sharedRoot();
    var k = String(key);
    var existing = root.get(k);
    // 已有条目一律复用；禁止因 instanceof/duck typing 失败而 put 空 Map 覆盖（会丢掉 cast_cd）
    if (existing != null) return existing;
    var created = new CHM();
    var raced = null;
    try { raced = root.putIfAbsent(k, created); } catch (ePut) {
        try { root.put(k, created); } catch (ePut2) {}
        return created;
    }
    return raced != null ? raced : created;
}

function sessionsMap() { return mapOf("spell_sessions"); }
function leftClickMap() { return mapOf("spell_left_click"); }
function leftGateMap() { return mapOf("spell_left_gate"); }
function busyMap() { return mapOf("spell_ctx_busy"); }

function nextToken() {
    _tokenSeq++;
    return "t" + _tokenSeq + "_" + Date.now();
}

function sessionsOf(uuid) {
    var store = sessionsMap();
    var key = jUuid(uuid);
    var list = store.get(key);
    if (list == null) {
        list = new java.util.concurrent.CopyOnWriteArrayList();
        store.put(key, list);
    }
    return list;
}

/**
 * begin(player, spellId, onClear, opts)
 * opts: { replace:bool, persistence:"unprojected"|"projected" }
 * onClear 必须能在本上下文调用；推荐传 Java Runnable 或本文件同上下文函数。
 */
function begin(player, spellId, onClear, opts) {
    if (!player || !spellId) return null;
    opts = opts || {};
    var uuid = playerUuid(player);
    var persistence = opts.persistence === SESSION_PROJECTED ? SESSION_PROJECTED : SESSION_UNPROJECTED;
    if (opts.replace !== false) {
        clearSessions(player, { onlySpellId: String(spellId), reason: "replace" });
    }
    var token = nextToken();
    var entry = {
        token: token,
        spellId: String(spellId),
        persistence: persistence,
        onClear: onClear,
        alive: true
    };
    sessionsOf(uuid).add(entry);
    return token;
}

function end(playerOrUuid, token, invokeClear) {
    if (!token) return false;
    var uuid = playerUuid(playerOrUuid);
    var list = sessionsMap().get(jUuid(uuid));
    if (list == null) return false;
    // COW iterator 不支持 remove：先收集再 list.remove
    var hit = null;
    var it = list.iterator();
    while (it.hasNext()) {
        var e = it.next();
        if (e == null) continue;
        if (String(e.token) === String(token)) {
            hit = e;
            break;
        }
    }
    if (hit == null) return false;
    try { list.remove(hit); } catch (eRm) {}
    hit.alive = false;
    if (invokeClear !== false) invokeOnClear(hit, findOnline(uuid) || playerOrUuid, "end");
    return true;
}

function invokeOnClear(entry, player, reason) {
    if (!entry || entry._cleared) return;
    entry._cleared = true;
    entry.alive = false;
    try {
        var fn = entry.onClear;
        if (fn == null) return;
        if (fn.run != null) {
            try { fn.run(); return; } catch (e0) {}
        }
        try { fn(player, reason || "end"); } catch (e1) {}
    } catch (e) {
        try { Bukkit.getLogger().warning("[GLTC运行时] onClear: " + e); } catch (e2) {}
    }
}

/**
 * clearSessions(player, opts)
 * opts.reason / onlySpellId / exceptSpellId / onlyUnprojected / onlyProjected
 */
function clearSessions(playerOrUuid, opts) {
    opts = opts || {};
    var uuid = playerUuid(playerOrUuid);
    var list = sessionsMap().get(jUuid(uuid));
    if (list == null) return 0;
    var player = findOnline(uuid);
    if (player == null && playerOrUuid != null && typeof playerOrUuid.getUniqueId === "function") {
        player = playerOrUuid;
    }
    var toClear = [];
    var it = list.iterator();
    while (it.hasNext()) {
        var e = it.next();
        if (e == null) {
            toClear.push(e);
            continue;
        }
        if (opts.onlySpellId && String(e.spellId) !== String(opts.onlySpellId)) continue;
        if (opts.exceptSpellId && String(e.spellId) === String(opts.exceptSpellId)) continue;
        if (opts.onlyUnprojected && e.persistence !== SESSION_UNPROJECTED) continue;
        if (opts.onlyProjected && e.persistence !== SESSION_PROJECTED) continue;
        toClear.push(e);
    }
    var n = 0;
    for (var i = 0; i < toClear.length; i++) {
        var entry = toClear[i];
        try { list.remove(entry); } catch (eRm) {}
        if (entry != null) {
            invokeOnClear(entry, player, opts.reason || "clear");
            n++;
        }
    }
    return n;
}

function registerLeftClick(player, spellId, runnable) {
    if (!player || !spellId) return false;
    var key = jUuid(playerUuid(player));
    var ent = new CHM();
    ent.put(jUuid("spellId"), java.lang.String.valueOf(String(spellId)));
    if (runnable != null) ent.put(jUuid("runnable"), runnable);
    leftClickMap().put(key, ent);
    return true;
}

function clearLeftClick(playerOrUuid) {
    leftClickMap().remove(jUuid(playerUuid(playerOrUuid)));
}

function getMageApi() {
    try { if (PLUGIN.gltcMageApi != null) return PLUGIN.gltcMageApi; } catch (e0) {}
    try {
        var root = sharedRoot();
        if (root != null) {
            var hit = root.get("gltcMageApi");
            if (hit != null) return hit;
        }
    } catch (e1) {}
    return null;
}

/** 粒子伤害：仅粒子折射（玩家）；怪物全额 */
function calcParticleApplyAmount(target, amount) {
    var amt = Number(amount);
    if (!(amt > 0)) return 0;
    var p = asPlayer(target);
    if (!p) return amt;
    try {
        var api = getMageApi();
        if (api != null && api.getTotalStats) {
            var refract = Number(api.getTotalStats(p, false).particleRefraction) || 0;
            if (refract > 0) amt = amt * (1 - Math.min(0.95, refract));
        }
    } catch (e) {}
    return amt;
}

function announceDealtHit(target, attacker, info, hpBefore) {
    if (!target || !info) return;
    var who = asPlayer(attacker) || resolveAttackerFromInfo(info);
    if (!who) return;
    var dealt = measureDealtDamage(target, hpBefore);
    if (!(dealt > 0)) return;
    info.targetName = entityDisplayName(target);
    announceSpellHit(who, info, dealt);
}

/** 死亡播报归因 + 延迟清 meta（须在 damage 返回后仍保留一 tick 供 MONITOR 兜底） */
function commitSpellHit(target, info, amount, attacker, hpBefore) {
    if (!target || !info) return;
    try {
        if (PLUGIN.gltcRecordSpellHit) {
            PLUGIN.gltcRecordSpellHit(target, info, Number(amount) || 0, attacker);
        } else {
            var root = sharedRoot();
            if (root != null) {
                var recFn = root.get("gltcRecordSpellHit");
                if (recFn != null) recFn(target, info, Number(amount) || 0, attacker);
            }
        }
    } catch (eRec) {}
    announceDealtHit(target, attacker, info, hpBefore);
    try {
        Bukkit.getScheduler().runTask(PLUGIN, new (Java.extend(java.lang.Runnable, {
            run: function() { clearSpellHitMeta(target); }
        }))());
    } catch (eDef) {
        clearSpellHitMeta(target);
    }
}

function dispatchLeftClick(player) {
    player = asPlayer(player);
    if (!player) return false;
    var uuid = jUuid(playerUuid(player));
    var ent = leftClickMap().get(uuid);
    if (ent == null) {
        // 花如画卷：左键注册失败或跨 Context 丢失登记时，仍可按活跃状态齐射
        var stFallback = huaRuStateMap().get(uuid);
        if (stFallback != null && stFallback.alive) {
            projectHuaRuFlowers(uuid);
            return true;
        }
        return false;
    }
    var spellId = "";
    try {
        if (ent.get != null) spellId = String(ent.get(jUuid("spellId")) || ent.get("spellId") || "");
        else spellId = String(ent["spellId"] || "");
    } catch (e) { return false; }
    if (!spellId) return false;

    var gate = leftGateMap();
    var now = Date.now();
    var prev = gate.get(uuid);
    if (prev != null && now - readEpochMs(prev) < LEFT_GATE_MS) return true;
    try { gate.put(uuid, toJavaLong(now)); } catch (eG) {}

    if (spellId === HUA_RU_SPELL_ID) {
        projectHuaRuFlowers(uuid);
        return true;
    }
    var runnable = null;
    try {
        if (ent.get != null) runnable = ent.get(jUuid("runnable"));
        if (runnable == null && ent.get != null) runnable = ent.get("runnable");
        if (runnable == null) runnable = ent["runnable"];
    } catch (eR) {}
    if (runnable == null) return false;
    try {
        if (runnable.run != null) runnable.run();
        else runnable();
    } catch (eRun) {
        try { Bukkit.getLogger().warning("[GLTC运行时] leftClick " + spellId + ": " + eRun); } catch (e2) {}
    }
    return true;
}

/**
 * 上下文变更（施术核心调用）
 * gui  → 清 leftClick + 全部 unprojected
 * switch/cast → 清 leftClick（非 keep）+ 其他术式 unprojected；projected 保留
 * hotbar/hold/quit → 全清
 */
function onContextChange(player, keepSpellId, reason) {
    if (!player) return 0;
    var busy = busyMap();
    var bk = jUuid(playerUuid(player));
    if (busy.containsKey(bk)) return 0;
    busy.put(bk, java.lang.Boolean.TRUE);
    try {
        var keep = keepSpellId ? String(keepSpellId) : "";
        var r = reason || "switch";
        if (r === "hotbar" || r === "quit" || r === "hold") {
            clearLeftClick(player);
            var n = clearSessions(player, { reason: r });
            if (r === "quit") {
                try { purgePlayerRuntimeState(player); } catch (eQ) {}
            }
            return n;
        }
        if (r === "gui") {
            clearLeftClick(player);
            return clearSessions(player, { onlyUnprojected: true, reason: "gui" });
        }
        // switch / cast / ring / replace
        var uuid = jUuid(playerUuid(player));
        var ent = leftClickMap().get(uuid);
        if (ent != null) {
        var sid = "";
        try {
            if (ent.get != null) sid = String(ent.get(jUuid("spellId")) || ent.get("spellId") || "");
            else sid = String(ent["spellId"] || "");
        } catch (e) {}
            if (!keep || sid !== keep) clearLeftClick(player);
        }
        return clearSessions(player, {
            exceptSpellId: keep || null,
            onlyUnprojected: true,
            reason: r
        });
    } finally {
        try { busy.remove(bk); } catch (eB) {}
    }
}

function formatDamage(v) {
    var n = Math.round(Number(v) * 10) / 10;
    if (Math.abs(n - Math.floor(n)) < 1e-6) return String(Math.floor(n));
    return String(n);
}

function damageTypeLabel(type) {
    var t = String(type || "").toLowerCase();
    if (t === "physical" || t === "phys" || t === "物理") {
        return "§x§d§7§9§5§8§6物§x§c§f§8§3§7§7理§x§c§6§7§1§6§8伤§x§b§e§5§f§5§9害";
    }
    if (t === "particle" || t === "magic" || t === "粒子") {
        return "§x§9§6§8§6§d§7粒§x§9§5§7§7§c§f子§x§9§3§6§8§c§6伤§x§9§2§5§9§b§e害";
    }
    if (t === "pulse" || t === "脉冲") {
        return "§x§e§a§7§2§c§9脉§x§e§5§6§5§a§1冲§x§d§f§5§7§7§a伤§x§d§a§4§a§5§2害";
    }
    return C_MSG + "伤害";
}

var _SlimefunItemClass = null;

function slimefunItemById(id) {
    if (!id) return null;
    try {
        if (_SlimefunItemClass == null) {
            _SlimefunItemClass = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
        }
        return _SlimefunItemClass.getById(String(id));
    } catch (e) { return null; }
}

function stripColor(str) {
    return String(str || "").replace(/§x(§[0-9a-fA-F]){6}/g, "").replace(/§./g, "");
}

function skipColorIndex(s, i) {
    if (i >= s.length || s.charAt(i) !== "§") return i;
    if (i + 1 < s.length && (s.charAt(i + 1) === "x" || s.charAt(i + 1) === "X")) {
        return Math.min(s.length, i + 14);
    }
    return Math.min(s.length, i + 2);
}

/** items.yml 显示名去「术式载体 / 施术技能核心」前缀，保留颜色 */
function shortItemDisplayName(coloredDn) {
    var dn = String(coloredDn || "");
    if (!dn) return "";
    var sepIdx = dn.indexOf("丨");
    if (sepIdx < 0) sepIdx = dn.indexOf("|");
    if (sepIdx >= 0) return dn.substring(sepIdx + 1).replace(/^\s+/, "");
    var plain = stripColor(dn);
    var prefixes = ["施术技能核心", "术式载体"];
    for (var p = 0; p < prefixes.length; p++) {
        var pref = prefixes[p];
        var at = plain.indexOf(pref);
        if (at < 0) continue;
        var need = at + pref.length;
        var ci = 0;
        var pc = 0;
        while (ci < dn.length && pc < need) {
            if (dn.charAt(ci) === "§") {
                ci = skipColorIndex(dn, ci);
                continue;
            }
            pc++;
            ci++;
        }
        return dn.substring(ci).replace(/^\s+/, "");
    }
    return dn;
}

/** 播报用：优先 items.yml 彩名；无则回退纯文本 */
function resolveSpellDisplayName(spellId, fallback) {
    try {
        var sf = slimefunItemById(spellId);
        if (sf) {
            var meta = sf.getItem().getItemMeta();
            if (meta && meta.hasDisplayName()) {
                var short = shortItemDisplayName(String(meta.getDisplayName()));
                if (short && stripColor(short).length > 0) return short;
            }
        }
    } catch (e) {}
    if (fallback != null && String(fallback).length) return String(fallback);
    return spellId ? String(spellId) : "";
}

/** 已有 § 则直接用；否则套 C_SPELL */
function formatAnnounceSpellName(info) {
    info = info || {};
    var sid = info.spellId != null ? String(info.spellId) : (info.id != null ? String(info.id) : "");
    var fallback = info.name != null ? String(info.name) : "";
    var name = sid ? resolveSpellDisplayName(sid, fallback) : fallback;
    if (!name) name = "未知术式";
    if (String(name).indexOf("§") >= 0) return name;
    return C_SPELL + name;
}

function entityDisplayName(ent) {
    if (!ent) return "目标";
    try { if (ent.getCustomName && ent.getCustomName()) return String(ent.getCustomName()); } catch (e0) {}
    try { if (ent.getName) return String(ent.getName()); } catch (e1) {}
    try { if (ent.getType) return String(ent.getType().name()); } catch (e2) {}
    return "目标";
}

function announceSpellHit(attacker, info, finalDmg) {
    // Graal：跨脚本传入的 Player 常过不了 instanceof，必须走 asPlayer / UUID
    info = info || {};
    var who = asPlayer(attacker) || resolveAttackerFromInfo(info);
    if (!who) return;
    try {
        var uid = String(who.getUniqueId().toString());
        var online = findOnline(uid);
        if (online != null) who = online;
    } catch (eOnline) {}
    var typeLabel = damageTypeLabel(info.damageType || info.type);
    var amt = C_DMG + formatDamage(finalDmg);
    var name = formatAnnounceSpellName(info);
    if (info.aggregate && info.aggregate.count > 1) {
        who.sendMessage(GLTC_PREFIX + C_MSG + "成功施展 " + name
            + C_MSG + " 对 " + C_SPELL + info.aggregate.count + C_MSG + "个目标 造成了总共 "
            + C_DMG + formatDamage(info.aggregate.total) + C_MSG + " " + typeLabel);
        return;
    }
    var target = info.targetName ? String(info.targetName) : "目标";
    if (info.kind === "erosion") {
        who.sendMessage(GLTC_PREFIX + C_MSG + "侵蚀反噬对 " + C_DMG + target
            + C_MSG + " 造成了 " + amt + " " + typeLabel);
        return;
    }
    who.sendMessage(GLTC_PREFIX + C_MSG + "成功施展 " + name
        + C_MSG + " 对 " + C_DMG + target + C_MSG + " 造成了 " + amt + " " + typeLabel);
}

function ensureDamageSourceApi() {
    if (_DamageSourceClass != null) return true;
    try {
        _DamageTypeClass = Java.type("org.bukkit.damage.DamageType");
        _DamageSourceClass = Java.type("org.bukkit.damage.DamageSource");
        return true;
    } catch (e) { return false; }
}

function resolveDamageType(typeKey) {
    if (!ensureDamageSourceApi()) return null;
    var names = typeKey === "sonic"
        ? ["SONIC_BOOM"]
        : typeKey === "magic"
        ? ["MAGIC", "INDIRECT_MAGIC", "GENERIC"]
        : typeKey === "pulse"
        ? ["GENERIC_KILL", "MAGIC", "GENERIC"]
        : ["OUT_OF_WORLD", "VOID", "GENERIC_KILL"];
    for (var i = 0; i < names.length; i++) {
        try {
            var t = _DamageTypeClass[names[i]];
            if (t != null) return t;
        } catch (e0) {}
        try {
            var t2 = _DamageTypeClass.valueOf(names[i]);
            if (t2 != null) return t2;
        } catch (e1) {}
    }
    return null;
}

function buildEntityDamageSource(typeKey, attacker) {
    var dt = resolveDamageType(typeKey);
    if (dt == null) return null;
    try {
        var b = _DamageSourceClass.builder(dt);
        if (attacker) {
            try { b = b.withDamager(attacker); } catch (e0) {}
            try { b = b.withDirectEntity(attacker); } catch (e1) {}
        }
        // 粒子/脉冲伤害必须绕过护甲，否则原版防御/保护/韧性仍会减免
        if (typeKey === "sonic" || typeKey === "pulse") {
            try { b = b.bypassArmor(); } catch (eBA) {}
        }
        return b.build();
    } catch (e2) { return null; }
}

function applyDamageWithSource(target, amount, attacker, typeKey) {
    var src = buildEntityDamageSource(typeKey, attacker);
    if (src == null) return false;
    try {
        target.setNoDamageTicks(0);
        target.damage(Number(amount), src);
        return true;
    } catch (e) { return false; }
}

function asPlayer(ent) {
    if (ent == null) return null;
    try { if (ent instanceof Player) return ent; } catch (e0) {}
    try { if (Player.class.isInstance(ent)) return ent; } catch (e1) {}
    return null;
}

function prepareHitInfo(info, damageType, attacker) {
    info = info || {};
    info.damageType = damageType;
    // 统一 spellId：缺省时回退 info.id（术式登记导出字段）
    if (!info.spellId && info.id) info.spellId = String(info.id);
    var who = asPlayer(attacker);
    if (who) {
        info.attacker = who;
        try { info.attackerUuid = String(who.getUniqueId().toString()); } catch (eU) {}
    } else if (attacker != null && !info.attackerUuid) {
        // 隔离脚本传入的 Player 代理常过不了 asPlayer，仍写 UUID 供播报回查
        try {
            info.attackerUuid = String(attacker.getUniqueId().toString());
        } catch (e1) {
            try {
                info.attackerUuid = String(attacker.getClass().getMethod("getUniqueId").invoke(attacker).toString());
            } catch (e2) {}
        }
    }
    return info;
}

function resolveAttackerFromInfo(info) {
    if (!info) return null;
    var p = asPlayer(info.attacker);
    if (p) return p;
    var uid = info.attackerUuid != null ? String(info.attackerUuid) : "";
    if (!uid) return null;
    try {
        var online = Bukkit.getPlayer(java.util.UUID.fromString(uid));
        p = asPlayer(online);
        if (p) return p;
    } catch (e0) {}
    try { return asPlayer(findOnline(uid)); } catch (e1) {}
    return null;
}

function tagHitInfo(target, info) {
    if (!target || !PLUGIN) return;
    try {
        target.setMetadata(META_SPELL_HIT, new FixedMetadataValue(PLUGIN, info));
    } catch (e) {}
    // 提前写入死亡归因：保证术式伤害直接致死时 PlayerDeathEvent 一定能读到（不依赖 MONITOR 时序）
    try {
        if (PLUGIN.gltcRecordSpellHit) PLUGIN.gltcRecordSpellHit(target, info, 0, null);
    } catch (eR) {}
}

/** 补播 fallback（MONITOR 已移除，仅作安全网） */
function flushPendingHitAnnounce(target, attacker, fallbackAmount) {
    if (!target || !PLUGIN) return;
    try {
        if (!target.hasMetadata(META_SPELL_HIT)) return;
        var info = null;
        try { info = target.getMetadata(META_SPELL_HIT).get(0).value(); } catch (eI) {}
        clearSpellHitMeta(target);
        if (!info) return;
        var who = asPlayer(attacker) || resolveAttackerFromInfo(info);
        if (!who) return;
        var dmg = Number(fallbackAmount);
        if (!(dmg > 0)) return;
        info.targetName = entityDisplayName(target);
        announceSpellHit(who, info, dmg);
    } catch (e) {}
}

function measureDealtDamage(target, hpBefore) {
    try {
        var hpAfter = Number(target.getHealth());
        if (isFinite(hpBefore) && isFinite(hpAfter) && hpBefore > hpAfter) {
            return hpBefore - hpAfter;
        }
    } catch (eH) {}
    return 0;
}

/** 脉冲/魔法 DamageSource 常不走 ByEntity，需多路解析攻击者 */
function resolveSpellAttacker(event, info) {
    var attacker = null;
    try {
        if (event instanceof EntityDamageByEntityEvent) attacker = event.getDamager();
    } catch (e0) {}
    attacker = asPlayer(attacker);
    if (!attacker) {
        try {
            var src = event.getDamageSource();
            if (src != null) {
                try { attacker = asPlayer(src.getCausingEntity()); } catch (e1) {}
                if (!attacker) {
                    try { attacker = asPlayer(src.getDirectEntity()); } catch (e2) {}
                }
            }
        } catch (e3) {}
    }
    if (!attacker) attacker = resolveAttackerFromInfo(info);
    return attacker;
}

function readInstalledDmgListenerVer() {
    var ver = 0;
    try {
        if (PLUGIN != null && PLUGIN.hasMetadata("gltc_spell_dmg_listener")) {
            var raw = PLUGIN.getMetadata("gltc_spell_dmg_listener").get(0).value();
            if (raw === true || raw === java.lang.Boolean.TRUE) ver = 1;
            else ver = Number(raw) || 0;
        }
    } catch (e0) {}
    try {
        var dyn = Number(PLUGIN.gltcSpellDmgListenerVer);
        if (dyn > ver) ver = dyn;
    } catch (e1) {}
    return ver;
}

/**
 * 通用伤害应用（处理 noDamageTicks + hpBefore）
 * @returns 伤害前的生命值
 */
function _applyDamage(target, amount, attacker) {
    var hpBefore = 0;
    try { hpBefore = Number(target.getHealth()); } catch (eHp) {}
    try {
        target.setNoDamageTicks(0);
        if (attacker) target.damage(Number(amount), attacker);
        else target.damage(Number(amount));
    } catch (e) {}
    return hpBefore;
}

/**
 * 粒子/脉冲伤害安全 Fallback（DamageSource API 不可用时）
 * metadata 已由调用方写入，监听.js HIGHEST 会清零护甲/保护等修饰符
 */
function _safeSpellDamage(target, amount, attacker) {
    if (!isLivingEntity(target)) return;
    try {
        target.setNoDamageTicks(0);
        if (attacker) target.damage(Number(amount), attacker);
        else target.damage(Number(amount));
    } catch (e) {}
}

/** 粒子/脉冲：只结算一次伤害；成功走 DamageSource，失败走带 meta 的 fallback */
function applyBypassSpellDamage(target, amount, attacker, typeKey) {
    var hpBefore = 0;
    try { hpBefore = Number(target.getHealth()); } catch (eHp) {}
    if (!applyDamageWithSource(target, amount, attacker, typeKey)) {
        _safeSpellDamage(target, amount, attacker);
    }
    return hpBefore;
}

function dealPhysicalSpellDamage(target, amount, attacker, info) {
    if (!isLivingEntity(target) || !(amount > 0)) return;
    info = prepareHitInfo(info, DMG_PHYSICAL, attacker);
    tagHitInfo(target, info);
    var hpBefore = _applyDamage(target, amount, attacker);
    commitSpellHit(target, info, amount, attacker, hpBefore);
}

function dealParticleSpellDamage(target, amount, attacker, info) {
    if (!isLivingEntity(target) || !(amount > 0)) return;
    try { if (target.isDead()) return; } catch (eDead) {}
    var applyAmt = calcParticleApplyAmount(target, amount);
    if (!(applyAmt > 0)) return;
    info = prepareHitInfo(info, DMG_PARTICLE, attacker);
    tagHitInfo(target, info);
    try {
        target.setMetadata(META_SPELL_PARTICLE, new FixedMetadataValue(PLUGIN, java.lang.Double.valueOf(applyAmt)));
    } catch (eM) {}
    var hpBefore = applyBypassSpellDamage(target, applyAmt, attacker, "sonic");
    commitSpellHit(target, info, applyAmt, attacker, hpBefore);
}

function dealPulseSpellDamage(target, amount, attacker, info) {
    if (!isLivingEntity(target) || !(amount > 0)) return;
    info = prepareHitInfo(info, DMG_PULSE, attacker);
    tagHitInfo(target, info);
    try {
        target.setMetadata(META_PULSE, new FixedMetadataValue(PLUGIN, java.lang.Boolean.TRUE));
        target.setMetadata(META_PULSE_AMT, new FixedMetadataValue(PLUGIN, java.lang.Double.valueOf(Number(amount))));
    } catch (eM) {}
    var hpBefore = applyBypassSpellDamage(target, amount, attacker, "pulse");
    commitSpellHit(target, info, amount, attacker, hpBefore);
}

function ensureSpellDamageListener() {
    var installed = readInstalledDmgListenerVer();
    if (installed >= SPELL_DMG_LISTENER_VER) {
        _dmgListenerReady = true;
        return;
    }
    _dmgListenerReady = true;
    try { PLUGIN.gltcSpellDmgListenerReady = true; } catch (eF2) {}
    try { PLUGIN.gltcSpellDmgListenerVer = SPELL_DMG_LISTENER_VER; } catch (eVer) {}
    try {
        PLUGIN.setMetadata("gltc_spell_dmg_listener", new FixedMetadataValue(PLUGIN, java.lang.Integer.valueOf(SPELL_DMG_LISTENER_VER)));
    } catch (eSet) {
        try { PLUGIN.setMetadata("gltc_spell_dmg_listener", new FixedMetadataValue(PLUGIN, SPELL_DMG_LISTENER_VER)); } catch (eSet2) {}
    }
    try {
        if (PLUGIN.gltcSpellDmgLogVer !== SPELL_DMG_LISTENER_VER) {
            PLUGIN.gltcSpellDmgLogVer = SPELL_DMG_LISTENER_VER;
            Bukkit.getLogger().info("[GLTC运行时] 粒子伤害 v" + SPELL_DMG_LISTENER_VER + "（SONIC_BOOM + 监听.js 减伤清零）");
        }
    } catch (eLog) {}
}

function spawnFlyingItemDisplay(world, loc, mat, scale) {
    if (world == null || loc == null || ItemDisplay == null) return null;
    try {
        var ent = world.spawn(loc, ItemDisplay.class);
        var stack = new ItemStack(mat || Material.POPPY, 1);
        try { ent.setItemStack(stack); } catch (e0) {}
        try { ent.setInterpolationDuration(1); } catch (e1) {}
        try { ent.setTeleportDuration(1); } catch (e2) {}
        var s = scale != null ? Number(scale) : 0.9;
        if (Transformation != null && Vector3f != null && Quaternionf != null) {
            try {
                ent.setTransformation(new Transformation(
                    new Vector3f(0, 0, 0),
                    new Quaternionf(),
                    new Vector3f(s, s, s),
                    new Quaternionf()
                ));
            } catch (eT) {}
        }
        return { entity: ent, lastLoc: loc.clone() };
    } catch (e) {
        return null;
    }
}

function isFlyingDisplayAlive(d) {
    if (!d || d.entity == null) return false;
    try { return !d.entity.isDead() && d.entity.isValid(); } catch (e) { return false; }
}

function moveFlyingDisplay(d, loc) {
    if (!isFlyingDisplayAlive(d) || loc == null) return;
    try { d.lastLoc = loc.clone(); } catch (e0) {}
    try { d.entity.teleport(loc); } catch (e1) {}
}

function removeFlyingDisplay(d) {
    if (!d || d.entity == null) return;
    try { if (!d.entity.isDead()) d.entity.remove(); } catch (e) {}
    d.entity = null;
}

// --- 花如画卷：左键齐射（状态与逻辑均在运行时上下文，避免 Graal 隔离失效）---
function huaRuStateMap() { return mapOf(HUA_RU_STATE_KEY); }

function huaRuCreateState(player, dmg, spellInfo) {
    var uuid = jUuid(playerUuid(player));
    var state = {
        alive: true,
        playerUuid: uuid,
        dmg: Number(dmg),
        spellInfo: spellInfo || {},
        spellId: HUA_RU_SPELL_ID,
        orbiters: []
    };
    huaRuStateMap().put(uuid, state);
    return state;
}

function huaRuClearState(uuid) {
    try { huaRuStateMap().remove(jUuid(String(uuid))); } catch (e) {}
}

function huaRuAddOrbiter(state, display, angle) {
    if (!state || !display) return null;
    var orb = { display: display, angle: Number(angle) || 0, projected: false, removed: false };
    state.orbiters.push(orb);
    return orb;
}

function normalizeVec(v) {
    if (Vector == null || v == null) return null;
    var len = Math.sqrt(v.getX() * v.getX() + v.getY() * v.getY() + v.getZ() * v.getZ());
    if (len < 1e-6) return new Vector(0, 0, 1);
    return new Vector(v.getX() / len, v.getY() / len, v.getZ() / len);
}

function blendVec(forward, toward, weight) {
    var f = normalizeVec(forward);
    var t = normalizeVec(toward);
    if (f == null || t == null) return f;
    var w = weight != null ? weight : 0.45;
    return normalizeVec(new Vector(
        f.getX() * (1 - w) + t.getX() * w,
        f.getY() * (1 - w) + t.getY() * w,
        f.getZ() * (1 - w) + t.getZ() * w
    ));
}

function huaRuFindHit(world, loc, casterUuid, half) {
    if (world == null || loc == null) return null;
    var h = half != null ? half : 0.5;
    var it = world.getNearbyEntities(loc, h, h, h).iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!isLivingEntity(ent)) continue;
        try { if (ent.isDead()) continue; } catch (eD) { continue; }
        try {
            if (Player.class.isInstance(ent) && String(ent.getUniqueId().toString()) === casterUuid) continue;
        } catch (eP) {}
        try {
            if (EntityType != null) {
                var t = ent.getType();
                if (t === EntityType.ARMOR_STAND || t === EntityType.ITEM_DISPLAY) continue;
            }
        } catch (eT) {}
        return ent;
    }
    return null;
}

function launchHomingDisplay(player, display, dmg, spellInfo, opts) {
    if (!player || !display || !isFlyingDisplayAlive(display)) return false;
    opts = opts || {};
    var world = player.getWorld();
    var loc = display.lastLoc != null ? display.lastLoc.clone() : player.getEyeLocation().clone();
    var ownerUuid = String(player.getUniqueId().toString());
    var speed = (opts.speed != null ? opts.speed : 16) / 20.0;
    var maxDist = opts.maxDist != null ? opts.maxDist : 32;
    var homing = opts.homing != null ? opts.homing : 0.45;
    var aimDist = opts.aimDist != null ? opts.aimDist : 28;
    var spellId = opts.spellId || HUA_RU_SPELL_ID;
    var traveled = 0;
    var alive = true;
    var task = null;
    var token = null;
    var dir = player.getEyeLocation().getDirection().clone();

    function cleanupFly() {
        if (!alive) return;
        alive = false;
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
        removeFlyingDisplay(display);
    }

    token = begin(player, spellId, new (Java.extend(java.lang.Runnable, { run: cleanupFly })), {
        persistence: SESSION_PROJECTED,
        replace: false
    });
    if (!token) {
        removeFlyingDisplay(display);
        return false;
    }

    task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!alive) return;
                var eye = player.getEyeLocation();
                var aim = eye.clone().add(eye.getDirection().multiply(aimDist));
                dir = blendVec(dir, aim.toVector().subtract(loc.toVector()), homing);
                if (dir == null) return;
                var prev = loc.clone();
                loc.add(dir.getX() * speed, dir.getY() * speed, dir.getZ() * speed);
                traveled += prev.distance(loc);
                moveFlyingDisplay(display, loc);

                var hitSolid = false;
                try { hitSolid = loc.getBlock().getType().isSolid(); } catch (eB) {}
                var hitEnt = huaRuFindHit(world, loc, ownerUuid, 0.5);
                if (!hitEnt && !hitSolid && traveled < maxDist) return;

                if (hitEnt) dealParticleSpellDamage(hitEnt, dmg, player, spellInfo);
                cleanupFly();
                try { end(player, token, false); } catch (eEnd) {}
            } catch (ex) {
                cleanupFly();
                try { end(player, token, false); } catch (eEnd2) {}
            }
        }
    })), 0, 1);
    return true;
}

function projectHuaRuFlowers(uuidKey) {
    uuidKey = String(uuidKey);
    var state = huaRuStateMap().get(jUuid(uuidKey));
    if (!state || !state.alive) return;
    var player = findOnline(uuidKey);
    if (player == null) {
        try { player = asPlayer(Bukkit.getPlayer(java.util.UUID.fromString(uuidKey))); } catch (eP) {}
    }
    if (player == null || !player.isOnline()) return;

    var launched = 0;
    var orbiters = state.orbiters || [];
    for (var i = 0; i < orbiters.length; i++) {
        var o = orbiters[i];
        if (!o || o.projected || o.removed || !isFlyingDisplayAlive(o.display)) continue;
        o.projected = true;
        if (launchHomingDisplay(player, o.display, state.dmg, state.spellInfo, { spellId: HUA_RU_SPELL_ID })) {
            launched++;
            o.display = null;
        }
    }
    if (launched > 0) {
        try { player.getWorld().playSound(player.getEyeLocation(), "entity.arrow.shoot", 0.65, 1.35); } catch (eS) {}
    }
}

function huaRuRemoveOrbiter(state, o) {
    if (!o || o.removed) return;
    o.removed = true;
    removeFlyingDisplay(o.display);
    o.display = null;
}

var HUA_RU_FLOWER_POOL = [
    Material.DANDELION, Material.POPPY, Material.BLUE_ORCHID, Material.ALLIUM,
    Material.AZURE_BLUET, Material.OXEYE_DAISY, Material.CORNFLOWER,
    Material.LILY_OF_THE_VALLEY
];
var HUA_RU_DISPLAY_SCALE  = 0.72;
var HUA_RU_STATE_DURATION = 100;
var HUA_RU_SPAWN_INTERVAL = 10;
var HUA_RU_ORBIT_RADIUS   = 3.0;
var HUA_RU_ORBIT_SPIN     = 0.08;
var HUA_RU_ORBIT_DRIFT    = 0.12;
var HUA_RU_CHERRY_PARTICLE = (function() {
    try { return Particle.CHERRY_LEAVES; } catch (e0) {}
    return Particle.END_ROD;
})();

function huaRuRandomFlower() {
    return HUA_RU_FLOWER_POOL[Math.floor(Math.random() * HUA_RU_FLOWER_POOL.length)];
}

/** 花如画卷完整施展（须在运行时上下文执行，避免 Graal 隔离导致左键/状态丢失） */
function castHuaRuHuaJuan(player, dmg, spellInfo) {
    if (!player || !(dmg > 0)) return false;
    var uuid = String(player.getUniqueId().toString());
    var world = player.getWorld();
    var state = huaRuCreateState(player, dmg, spellInfo || {});
    if (!state) return false;
    var angleBase = 0;
    var ticks = 0;
    var alive = true;
    var task = null;
    var token = null;

    function cleanup() {
        if (!alive) return;
        alive = false;
        state.alive = false;
        try { huaRuClearState(uuid); } catch (eRm) {}
        try { if (task != null) task.cancel(); } catch (eC) {}
        task = null;
        clearLeftClick(player);
        var orbiters = state.orbiters || [];
        for (var i = 0; i < orbiters.length; i++) {
            if (!orbiters[i].projected) huaRuRemoveOrbiter(state, orbiters[i]);
        }
    }

    token = begin(player, HUA_RU_SPELL_ID, new (Java.extend(java.lang.Runnable, { run: cleanup })), {
        persistence: SESSION_UNPROJECTED,
        replace: true
    });
    if (!token) {
        cleanup();
        return false;
    }
    registerLeftClick(player, HUA_RU_SPELL_ID);

    try { world.playSound(player.getLocation(), "block.cherry_leaves.place", 0.85, 1.1); } catch (eS) {}
    var center0 = player.getLocation().clone().add(0, 1.0, 0);
    var d0 = spawnFlyingItemDisplay(world, center0, huaRuRandomFlower(), HUA_RU_DISPLAY_SCALE);
    if (d0) huaRuAddOrbiter(state, d0, angleBase);

    task = Bukkit.getScheduler().runTaskTimer(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            try {
                if (!alive) return;
                if (!player.isOnline()) {
                    cleanup();
                    try { end(player, token, false); } catch (eOff) {}
                    return;
                }
                ticks++;
                angleBase += HUA_RU_ORBIT_DRIFT;
                var center = player.getLocation().clone().add(0, 1.0, 0);

                if (ticks % HUA_RU_SPAWN_INTERVAL === 0) {
                    var spawnLoc = center.clone();
                    spawnLoc.setX(center.getX() + Math.cos(angleBase + state.orbiters.length * 0.9) * HUA_RU_ORBIT_RADIUS);
                    spawnLoc.setZ(center.getZ() + Math.sin(angleBase + state.orbiters.length * 0.9) * HUA_RU_ORBIT_RADIUS);
                    var nd = spawnFlyingItemDisplay(world, spawnLoc, huaRuRandomFlower(), HUA_RU_DISPLAY_SCALE);
                    if (nd) huaRuAddOrbiter(state, nd, angleBase + state.orbiters.length * 0.9);
                }

                var orbiters = state.orbiters;
                for (var i = orbiters.length - 1; i >= 0; i--) {
                    var o = orbiters[i];
                    if (o.projected || o.removed) continue;
                    if (!isFlyingDisplayAlive(o.display)) {
                        huaRuRemoveOrbiter(state, o);
                        continue;
                    }
                    o.angle += HUA_RU_ORBIT_SPIN;
                    var oloc = center.clone();
                    oloc.setX(center.getX() + Math.cos(o.angle) * HUA_RU_ORBIT_RADIUS);
                    oloc.setZ(center.getZ() + Math.sin(o.angle) * HUA_RU_ORBIT_RADIUS);
                    moveFlyingDisplay(o.display, oloc);
                    try {
                        world.spawnParticle(HUA_RU_CHERRY_PARTICLE, oloc, 2, 0.12, 0.12, 0.12, 0.01);
                    } catch (eCherry) {}
                }

                if (ticks >= HUA_RU_STATE_DURATION) {
                    cleanup();
                    try { end(player, token, false); } catch (eEnd) {}
                }
            } catch (ex) {
                cleanup();
                try { end(player, token, false); } catch (eEnd2) {}
            }
        }
    })), 0, 1);

    return true;
}

ensureSpellDamageListener();

var API = {
    SESSION_UNPROJECTED: SESSION_UNPROJECTED,
    SESSION_PROJECTED: SESSION_PROJECTED,
    DMG_PHYSICAL: DMG_PHYSICAL,
    DMG_PARTICLE: DMG_PARTICLE,
    DMG_PULSE: DMG_PULSE,
    begin: begin,
    end: end,
    clear: clearSessions,
    onContextChange: onContextChange,
    registerLeftClick: registerLeftClick,
    clearLeftClick: clearLeftClick,
    dispatchLeftClick: dispatchLeftClick,
    dealPhysicalSpellDamage: dealPhysicalSpellDamage,
    dealParticleSpellDamage: dealParticleSpellDamage,
    dealPulseSpellDamage: dealPulseSpellDamage,
    announceSpellHit: announceSpellHit,
    ensureSpellDamageListener: ensureSpellDamageListener,
    spawnFlyingItemDisplay: spawnFlyingItemDisplay,
    isFlyingDisplayAlive: isFlyingDisplayAlive,
    moveFlyingDisplay: moveFlyingDisplay,
    removeFlyingDisplay: removeFlyingDisplay,
    findOnline: findOnline,
    purgePlayerRuntimeState: purgePlayerRuntimeState,
    isLivingEntity: isLivingEntity,
    clearSpellHitMeta: clearSpellHitMeta,
    sharedRoot: sharedRoot,
    mapOf: mapOf,
    huaRuCreateState: huaRuCreateState,
    huaRuClearState: huaRuClearState,
    huaRuAddOrbiter: huaRuAddOrbiter,
    huaRuRemoveOrbiter: huaRuRemoveOrbiter,
    castHuaRuHuaJuan: castHuaRuHuaJuan,
    projectHuaRuFlowers: projectHuaRuFlowers,
    launchHomingDisplay: launchHomingDisplay,
    GLTC_PREFIX: GLTC_PREFIX,
    C_MSG: C_MSG,
    C_SPELL: C_SPELL
};

// 各写各的：PLUGIN 动态字段失败时不得拖死 Metadata / 共享根
try { PLUGIN.gltcSpellRuntime = API; } catch (ePl) {}
try {
    if (SHARED_ROOT_API && SHARED_ROOT_API.publishGltcSharedRoot) {
        SHARED_ROOT_API.publishGltcSharedRoot(sharedRoot());
    }
} catch (ePub) {}
try { sharedRoot().put("gltcSpellRuntime", API); } catch (eMap) {}
try {
    PLUGIN.setMetadata("gltc_spell_runtime", new FixedMetadataValue(PLUGIN, API));
} catch (eMetaRt) {}
// 跨 Context：隔离脚本无法直接调 JS 运行时方法，挂 Java 桥
try {
    var ConsumerPulse = Java.type("java.util.function.Consumer");
    var pulseSpellBridge = new (Java.extend(ConsumerPulse, {
        accept: function(pack) {
            try {
                if (pack == null) return;
                var target = pack.length != null ? pack[0] : pack.get(0);
                var amount = pack.length != null ? pack[1] : pack.get(1);
                var attacker = pack.length != null ? pack[2] : pack.get(2);
                var info = null;
                try { info = pack.length != null ? pack[3] : pack.get(3); } catch (eI) {}
                API.dealPulseSpellDamage(target, Number(amount), attacker, info);
            } catch (e) {}
        }
    }))();
    sharedRoot().put("gltcRuntime_dealPulseSpellDamage", pulseSpellBridge);
    try {
        if (SHARED_ROOT_API && SHARED_ROOT_API.putJavaBridge) {
            SHARED_ROOT_API.putJavaBridge("gltcRuntime_dealPulseSpellDamage", pulseSpellBridge);
        }
    } catch (eSrPut) {}
} catch (eBrPulse) {}

// 隔离核心技能补播桥：pack = [attacker, info, finalDmg]
try {
    var ConsumerAnnounce = Java.type("java.util.function.Consumer");
    var announceBridge = new (Java.extend(ConsumerAnnounce, {
        accept: function(pack) {
            try {
                if (pack == null) return;
                var attacker = pack.length != null ? pack[0] : pack.get(0);
                var info = pack.length != null ? pack[1] : pack.get(1);
                var dmg = pack.length != null ? pack[2] : pack.get(2);
                API.announceSpellHit(attacker, info || {}, Number(dmg) || 0);
            } catch (e) {}
        }
    }))();
    sharedRoot().put("gltcRuntime_announceSpellHit", announceBridge);
    try {
        if (SHARED_ROOT_API && SHARED_ROOT_API.putJavaBridge) {
            SHARED_ROOT_API.putJavaBridge("gltcRuntime_announceSpellHit", announceBridge);
        }
    } catch (eSrAnn) {}
} catch (eBrAnn) {}

function publishBridge(key, bridge) {
    try { sharedRoot().put(key, bridge); } catch (e0) {}
    try {
        if (SHARED_ROOT_API && SHARED_ROOT_API.putJavaBridge) {
            SHARED_ROOT_API.putJavaBridge(key, bridge);
        }
    } catch (e1) {}
}

// 跨 Context 左键：pack = [player, spellId] 或 [player, spellId, runnable]
try {
    var ConsumerLeftReg = Java.type("java.util.function.Consumer");
    publishBridge("gltcRuntime_registerLeftClick", new (Java.extend(ConsumerLeftReg, {
        accept: function(pack) {
            try {
                if (pack == null) return;
                var player = pack.length != null ? pack[0] : pack.get(0);
                var spellId = pack.length != null ? pack[1] : pack.get(1);
                var runnable = null;
                try { runnable = pack.length != null ? pack[2] : pack.get(2); } catch (eR) {}
                API.registerLeftClick(player, spellId, runnable);
            } catch (e) {}
        }
    }))());
} catch (eBrReg) {}

try {
    var FunctionDispatch = Java.type("java.util.function.Function");
    publishBridge("gltcRuntime_dispatchLeftClick", new (Java.extend(FunctionDispatch, {
        apply: function(player) {
            try { return java.lang.Boolean.valueOf(!!API.dispatchLeftClick(player)); } catch (e) {
                return java.lang.Boolean.FALSE;
            }
        }
    }))());
} catch (eBrDisp) {}

try {
    var ConsumerClearLc = Java.type("java.util.function.Consumer");
    publishBridge("gltcRuntime_clearLeftClick", new (Java.extend(ConsumerClearLc, {
        accept: function(player) {
            try { API.clearLeftClick(player); } catch (e) {}
        }
    }))());
} catch (eBrClr) {}

try {
    var FunctionInvokeCast = Java.type("java.util.function.Function");
    publishBridge("gltcRuntime_invokeCast", new (Java.extend(FunctionInvokeCast, {
        apply: function(pack) {
            try {
                if (pack == null) return java.lang.Boolean.FALSE;
                var method = pack.length != null ? pack[0] : pack.get(0);
                var player = pack.length != null ? pack[1] : pack.get(1);
                var dmg = pack.length != null ? pack[2] : pack.get(2);
                var info = pack.length != null ? pack[3] : pack.get(3);
                var key = String(method);
                if (key === "castHuaRuHuaJuan") {
                    return java.lang.Boolean.valueOf(!!castHuaRuHuaJuan(player, Number(dmg), info));
                }
                var fn = API[key];
                if (fn == null) return java.lang.Boolean.FALSE;
                return java.lang.Boolean.valueOf(!!fn(player, Number(dmg), info));
            } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC运行时] invokeCast 异常: " + e); } catch (eLog) {}
                return java.lang.Boolean.FALSE;
            }
        }
    }))());
} catch (eBrInvoke) {
    try { Bukkit.getLogger().warning("[GLTC运行时] invokeCast 桥发布失败: " + eBrInvoke); } catch (eLogBr) {}
}

try {
    var ConsumerHuaRu = Java.type("java.util.function.Consumer");
    publishBridge("gltcRuntime_huaRuCreateState", new (Java.extend(ConsumerHuaRu, {
        accept: function(pack) {
            try {
                if (pack == null) return;
                var player = pack.length != null ? pack[0] : pack.get(0);
                var dmg = pack.length != null ? pack[1] : pack.get(1);
                var info = pack.length != null ? pack[2] : pack.get(2);
                return API.huaRuCreateState(player, Number(dmg), info);
            } catch (e) { return null; }
        }
    }))());
} catch (eBrHua) {}

try {
    var logged = false;
    try { logged = !!PLUGIN.gltcRuntimeLoadedLogged; } catch (eL0) {}
    if (!logged) {
        try { PLUGIN.gltcRuntimeLoadedLogged = true; } catch (eL1) {}
        Bukkit.getLogger().info("[GLTC运行时] v2 已加载（会话/伤害/左键二次操作）");
    }
} catch (eLog) {}

API;
