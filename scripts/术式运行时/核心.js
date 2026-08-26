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
var META_SPELL_PARTICLE = "gltc_spell_particle_hit"; // 粒子伤害标记（折射）
var META_PULSE          = "gltc_pulse_hit";           // 脉冲伤害标记（跳过减伤）

// === 交互门槛（可调）===
var LEFT_GATE_MS            = 120; // 左键二次操作最短间隔（毫秒）
var SPELL_DMG_LISTENER_VER  = 5;   // v5=会话 list.remove、LivingEntity.isInstance、取消不补播、meta 必清

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
        var r = SHARED_ROOT_API.getGltcSharedRoot();
        if (r != null) return r;
    }
    var map = new CHM();
    try {
        if (SHARED_ROOT_API && SHARED_ROOT_API.publishGltcSharedRoot) {
            return SHARED_ROOT_API.publishGltcSharedRoot(map);
        }
    } catch (e) {}
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
    if (!player || !spellId || runnable == null) return false;
    var map = new java.util.HashMap();
    map.put("spellId", java.lang.String.valueOf(String(spellId)));
    map.put("runnable", runnable);
    leftClickMap().put(jUuid(playerUuid(player)), map);
    return true;
}

function clearLeftClick(playerOrUuid) {
    leftClickMap().remove(jUuid(playerUuid(playerOrUuid)));
}

function dispatchLeftClick(player) {
    player = asPlayer(player);
    if (!player) return false;
    var uuid = jUuid(playerUuid(player));
    var ent = leftClickMap().get(uuid);
    if (ent == null) return false;
    var runnable = null;
    var spellId = "";
    try {
        spellId = String(ent.get("spellId") || "");
        runnable = ent.get("runnable");
    } catch (e) { return false; }
    if (runnable == null) return false;

    var gate = leftGateMap();
    var now = Date.now();
    var prev = gate.get(uuid);
    if (prev != null && now - readEpochMs(prev) < LEFT_GATE_MS) return true;
    try { gate.put(uuid, toJavaLong(now)); } catch (eG) {}

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
            try { sid = String(ent.get("spellId") || ""); } catch (e) {}
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
}

/** 事件未播报时：有攻击者则补播；否则只清 meta（取消路径由 MONITOR ignoreCancelled=false 清理） */
function flushPendingHitAnnounce(target, attacker, fallbackAmount) {
    if (!target || !PLUGIN) return;
    try {
        if (!target.hasMetadata(META_SPELL_HIT)) {
            try { target.removeMetadata(META_SPELL_PARTICLE, PLUGIN); } catch (eP) {}
            return;
        }
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

/** 脉冲专用：仅在实际掉血时补播（虚空常被取消） */
function announcePulseIfDealt(target, attacker, info, requestedAmount, hpBefore) {
    if (!target || !info) return;
    var dealt = 0;
    try {
        var hpAfter = Number(target.getHealth());
        if (isFinite(hpBefore) && isFinite(hpAfter) && hpBefore > hpAfter) {
            dealt = hpBefore - hpAfter;
        }
    } catch (eH) {}
    try { clearSpellHitMeta(target); } catch (eC) {}
    if (!(dealt > 0)) return;
    info.targetName = entityDisplayName(target);
    announceSpellHit(attacker, info, dealt);
}

/** 脉冲/虚空 DamageSource 常不走 ByEntity，需多路解析攻击者 */
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

function dealPhysicalSpellDamage(target, amount, attacker, info) {
    if (!isLivingEntity(target) || !(amount > 0)) return;
    info = prepareHitInfo(info, DMG_PHYSICAL, attacker);
    tagHitInfo(target, info);
    try {
        target.setNoDamageTicks(0);
        if (attacker) target.damage(Number(amount), attacker);
        else target.damage(Number(amount));
    } catch (e) {}
    // 监听已播报则 meta 已清；取消则只清不播
    flushPendingHitAnnounce(target, attacker, amount);
}

function dealParticleSpellDamage(target, amount, attacker, info) {
    if (!isLivingEntity(target) || !(amount > 0)) return;
    try { if (target.isDead()) return; } catch (eDead) {}
    info = prepareHitInfo(info, DMG_PARTICLE, attacker);
    tagHitInfo(target, info);
    try {
        target.setMetadata(META_SPELL_PARTICLE, new FixedMetadataValue(PLUGIN, java.lang.Boolean.TRUE));
    } catch (eM) {}
    // 勿用 SONIC_BOOM DamageSource：Paper 会播「被一道音波尖啸抹除了」且 getKiller 不稳定。
    // 粒子/物理区分靠 META_SPELL_PARTICLE + damageType；玩家侧折射在 监听.js 读 meta。
    try {
        target.setNoDamageTicks(0);
        if (attacker) target.damage(Number(amount), attacker);
        else target.damage(Number(amount));
    } catch (e) {}
    flushPendingHitAnnounce(target, attacker, amount);
}

function dealPulseSpellDamage(target, amount, attacker, info) {
    if (!isLivingEntity(target) || !(amount > 0)) return;
    info = prepareHitInfo(info, DMG_PULSE, attacker);
    tagHitInfo(target, info);
    try {
        target.setMetadata(META_PULSE, new FixedMetadataValue(PLUGIN, java.lang.Boolean.TRUE));
    } catch (eM) {}
    var hpBefore = 0;
    try { hpBefore = Number(target.getHealth()); } catch (eHp0) {}
    if (!applyDamageWithSource(target, amount, attacker, "void")) {
        try {
            target.setNoDamageTicks(0);
            if (attacker) target.damage(Number(amount), attacker);
            else target.damage(Number(amount));
        } catch (e) {}
    }
    // 监听已用 finalDamage 播报并清 meta 则跳过；否则按实际掉血补播
    try {
        if (target.hasMetadata(META_SPELL_HIT)) {
            announcePulseIfDealt(target, attacker, info, amount, hpBefore);
        } else {
            try { target.removeMetadata(META_SPELL_PARTICLE, PLUGIN); } catch (eP) {}
            try { target.removeMetadata(META_PULSE, PLUGIN); } catch (ePu) {}
        }
    } catch (eAnn) {
        clearSpellHitMeta(target);
    }
}

function ensureSpellDamageListener() {
    var installed = readInstalledDmgListenerVer();
    if (installed >= SPELL_DMG_LISTENER_VER) {
        _dmgListenerReady = true;
        return;
    }
    try {
        if (PLUGIN.gltcSpellDmgListenerV2 != null) {
            try { EntityDamageByEntityEvent.getHandlerList().unregister(PLUGIN.gltcSpellDmgListenerV2); } catch (eU0) {}
            try { EntityDamageEvent.getHandlerList().unregister(PLUGIN.gltcSpellDmgListenerV2); } catch (eU1) {}
        }
    } catch (e0) {}
    _dmgListenerReady = true;
    try { PLUGIN.gltcSpellDmgListenerReady = true; } catch (eF2) {}
    try { PLUGIN.gltcSpellDmgListenerVer = SPELL_DMG_LISTENER_VER; } catch (eVer) {}
    try {
        PLUGIN.setMetadata("gltc_spell_dmg_listener", new FixedMetadataValue(PLUGIN, java.lang.Integer.valueOf(SPELL_DMG_LISTENER_VER)));
    } catch (eSet) {
        try { PLUGIN.setMetadata("gltc_spell_dmg_listener", new FixedMetadataValue(PLUGIN, SPELL_DMG_LISTENER_VER)); } catch (eSet2) {}
    }
    var ListenerClass = Java.extend(Listener, {});
    var listener = new ListenerClass();
    try { PLUGIN.gltcSpellDmgListenerV2 = listener; } catch (eL) {}
    // 监听父类：脉冲虚空伤害多为 EntityDamageEvent(VOID)，不进 ByEntity
    Bukkit.getPluginManager().registerEvent(
        EntityDamageEvent, listener, EventPriority.MONITOR,
        function(l, event) {
            try {
                var victim = event.getEntity();
                if (!isLivingEntity(victim)) return;
                if (!victim.hasMetadata(META_SPELL_HIT)) return;
                // 取消 / 零伤：只清 meta，防折射残留与假播报
                if (event.isCancelled()) {
                    clearSpellHitMeta(victim);
                    return;
                }
                var info = null;
                try { info = victim.getMetadata(META_SPELL_HIT).get(0).value(); } catch (eI) {}
                if (!info) {
                    clearSpellHitMeta(victim);
                    return;
                }
                var finalDmg = 0;
                try { finalDmg = Number(event.getFinalDamage()); } catch (eF) {
                    try { finalDmg = Number(event.getDamage()); } catch (eF2) {}
                }
                if (!(finalDmg > 0)) {
                    clearSpellHitMeta(victim);
                    return;
                }
                var attacker = resolveSpellAttacker(event, info);
                if (!attacker) return; // 保留 meta，供 deal* 结束后处理
                clearSpellHitMeta(victim);
                info.targetName = entityDisplayName(victim);
                announceSpellHit(attacker, info, finalDmg);
            } catch (ex) {}
        }, PLUGIN, false
    );
    try {
        if (PLUGIN.gltcSpellDmgLogVer !== SPELL_DMG_LISTENER_VER) {
            PLUGIN.gltcSpellDmgLogVer = SPELL_DMG_LISTENER_VER;
            Bukkit.getLogger().info("[GLTC运行时] 伤害播报监听已挂载 v" + SPELL_DMG_LISTENER_VER);
        }
    } catch (eLog) {
        Bukkit.getLogger().info("[GLTC运行时] 伤害播报监听已挂载 v" + SPELL_DMG_LISTENER_VER);
    }
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

try {
    var logged = false;
    try { logged = !!PLUGIN.gltcRuntimeLoadedLogged; } catch (eL0) {}
    if (!logged) {
        try { PLUGIN.gltcRuntimeLoadedLogged = true; } catch (eL1) {}
        Bukkit.getLogger().info("[GLTC运行时] v2 已加载（会话/伤害/左键二次操作）");
    }
} catch (eLog) {}

API;
