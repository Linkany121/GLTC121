/**
 * =============================================================================
 *  GLTC · 术式死亡 / 击杀播报
 * =============================================================================
 *
 * 【加载方式】
 *   由 监听.js 在「术式运行时/核心.js」之前 eval 本文件。
 *   必须在运行时清 meta 之前注册 MONITOR 监听，才能抓到术式命中信息。
 *
 * 【服主改文案 — 推荐方式】
 *   编辑配置文件（首次运行会自动生成）：
 *     plugins/RykenSlimefunCustomizer/addon_configs/GLTC/术式死亡播报.yml
 *   改完重载附属即可，不必动本 JS。
 *
 * 【服主改文案 — 改本文件】
 *   下方 DEFAULT_CFG 为内置默认值；yml 不存在时会按它写出 yml。
 *   也可直接改 DEFAULT_CFG 里的 Template 字符串。
 *
 * 【模板占位符】（Template 字符串里用 {名称} 引用，可自行增删）
 *   {killer}      — 击杀者玩家名（带 C_KILLER 颜色）
 *   {victim}      — 受害者玩家名 / 怪物名（带颜色）
 *   {spell}       — 术式名（优先 items.yml 彩色显示名）
 *   {damageType}  — 伤害类型文案：物理 / 粒子 / 脉冲
 *   {erosion}     — 侵蚀标签（默认「越环侵蚀」）
 *
 * 【颜色代码】
 *   § 为颜色符；§x§R§R§G§G§B§B 为 hex 渐变色（与 GLTC 其它模块一致）。
 *   改玩家名 / 术式名颜色 → 修改下方 C_KILLER、C_SPELL 等常量。
 *
 * 【归因逻辑简述】
 *   1. 术式运行时造成伤害时，给目标打上 metadata：gltc_spell_hit_info
 *   2. 本模块 HIGHEST 监听读到 meta，记录「最后一击术式」到 _lastSpellHitMap
 *   3. 死亡时若击杀者与记录一致且在时间窗内 → 替换原版 deathMessage
 *   注：脉冲/虚空术式伤害 getKiller() 常为空，会回退到 attribution 里的 attackerUuid
 *
 * 【导出 API】（其它脚本极少需要调用）
 *   reload()          — 重读 yml
 *   getConfig()       — 当前配置对象
 *   peekAttribution() — 调试：查看实体最后一击术式记录
 * =============================================================================
 */

// === Java 类型 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var EntityDamageEvent = Java.type("org.bukkit.event.entity.EntityDamageEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var PlayerDeathEvent = Java.type("org.bukkit.event.entity.PlayerDeathEvent");
var EntityDeathEvent = Java.type("org.bukkit.event.entity.EntityDeathEvent");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var YamlConfiguration = Java.type("org.bukkit.configuration.file.YamlConfiguration");
var File = java.io.File;
var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

// === 术式运行时写入的 Metadata 键（勿改，须与 术式运行时/核心.js 一致）===
var META_SPELL_HIT = "gltc_spell_hit_info";

// =============================================================================
//  颜色常量 —— 改播报整体色调时改这里
// =============================================================================
var C_KILLER  = "§e";              // 击杀者 / 玩家名
var C_VICTIM  = "§e";              // 受害者玩家名
var C_MOB     = "§e";              // 怪物名
var C_MSG     = "§x§f§f§f§5§b§3"; // 正文灰色（可选用于自定义拼接）
var C_SPELL   = "§x§6§2§c§6§f§f"; // 术式名强调色（items.yml 无颜色名时套用）
var C_EROSION = "§4";              // 侵蚀相关文字

var MODULE_VER = 5; // 模块版本号（日志用）

// =============================================================================
//  内置默认配置 —— yml 缺失项会回退到这里；也可作为 yml 注释参考
// =============================================================================
var DEFAULT_CFG = {
    // 总开关：false 则整个模块不记录、不播报
    Enabled: true,

    // 术式归因有效期（毫秒）：死亡时最后一击须在此时间内，且击杀者 UUID 一致
    AttributionWindowMs: 10000,

    // ---------- 玩家击杀玩家（替换原版全服死亡提示）----------
    PlayerKill: {
        Enabled: true,
        // true → 用 TemplateWithType（带物理/粒子/脉冲）
        // false → 用 Template（简洁版）
        ShowDamageType: true,
        Template: "{killer} §7使用术式 {spell} §7杀死了 {victim}",
        TemplateWithType: "{killer} §f通过 {damageType}§f术式 {spell} §f杀死了 {victim}"
    },

    // ---------- 玩家术式击杀怪物（Paper 1.20+ 会对 SONIC_BOOM 等生成 deathMessage，本模块会清除并改播下方模板）----------
    MobKill: {
        Enabled: true,
        // 播报范围：
        //   killer  — 仅击杀者本人看到
        //   global  — 全服广播
        //   nearby  — 击杀点 NearbyRange 格内玩家
        Scope: "nearby",
        NearbyRange: 256,
        Template: "{killer} §f通过 {damageType}§f术式 {spell} §f杀死了 {victim}"
    },

    // ---------- 越环侵蚀自伤致死（info.kind === "erosion" 且攻击者即本人）----------
    ErosionSelfDeath: {
        Enabled: true,
        Template: "{victim} §f因 {erosion} §f在施展 {spell} §f时血脑屏障熔毁而亡"
    },

    // ---------- 兜底：仅当 PlayerKill 关闭时，getKiller() 为空才走此模板（一般不必开）----------
    FallbackPlayerKill: {
        Enabled: false,
        Template: "{killer} §f通过术式 {spell} §f使 {victim} §f走向末路"
    }
};

// === 运行时状态（一般无需改）===
var _cfg = null;
var _lastSpellHitMap = new CHM(); // key=实体UUID → { info, timeMs, finalDmg }
var _listenerInstance = null;
var _deathListenerInstance = null;       // 玩家死亡：延迟 MONITOR
var _entityDeathListenerInstance = null; // 怪物死亡：延迟 MONITOR（覆盖 Paper 音波/虚空默认 deathMessage）
var _cleanupTaskId = -1;
var _SlimefunItemClass = null;
var _RunnableClass = Java.type("java.lang.Runnable");

/** Graal 对 runTask(Plugin, Runnable|Consumer) 重载歧义，须显式 Runnable */
function toRunnable(fn) {
    var body = fn || function() {};
    return new (Java.extend(_RunnableClass, {
        run: function() {
            try { body(); } catch (e) {}
        }
    }))();
}

// =============================================================================
//  工具函数 · 实体 / 玩家
// =============================================================================

function jUuid(ent) {
    if (ent == null) return "";
    try {
        if (typeof ent.getUniqueId === "function") return String(ent.getUniqueId().toString());
    } catch (e) {}
    return String(ent);
}

/** Graal 跨脚本：Player 可能是代理，用 class.isInstance 更稳 */
function asPlayer(ent) {
    if (ent == null) return null;
    try { if (ent instanceof Player) return ent; } catch (e0) {}
    try { if (Player.class.isInstance(ent)) return ent; } catch (e1) {}
    return null;
}

function isLivingEntity(ent) {
    if (ent == null) return false;
    try {
        if (LivingEntity.class.isInstance(ent)) return true;
    } catch (e0) {}
    try { return ent instanceof LivingEntity; } catch (e1) {}
    return false;
}

function findOnline(uuid) {
    uuid = String(uuid || "");
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

/** 怪物 / 玩家显示名（已套 C_VICTIM / C_MOB）— 用于 {victim} 占位符 */
function entityDisplayName(ent) {
    if (!ent) return "目标";
    var p = asPlayer(ent);
    if (p) return C_VICTIM + String(p.getName());
    try { if (ent.getCustomName && ent.getCustomName()) return C_MOB + String(ent.getCustomName()); } catch (e0) {}
    try { if (ent.getName) return C_MOB + String(ent.getName()); } catch (e1) {}
    try { if (ent.getType) return C_MOB + String(ent.getType().name()); } catch (e2) {}
    return C_MOB + "目标";
}

/** 玩家名（已套 C_KILLER）— 用于 {killer} / {victim} 玩家场景 */
function playerColoredName(p) {
    if (!p) return C_KILLER + "未知";
    return C_KILLER + String(p.getName());
}

// =============================================================================
//  工具函数 · 术式名解析（与术式运行时逻辑对齐）
//  优先读 Slimefun items.yml 显示名，去掉「术式载体丨」等前缀
// =============================================================================

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

function slimefunItemById(id) {
    if (!id) return null;
    try {
        if (_SlimefunItemClass == null) {
            _SlimefunItemClass = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
        }
        return _SlimefunItemClass.getById(String(id));
    } catch (e) { return null; }
}

/** spellId → 彩色短名；fallback 为术式脚本 SPELL_NAME */
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

/** 生成 {spell} 占位符内容 */
function formatSpellName(info) {
    info = info || {};
    var sid = info.spellId != null ? String(info.spellId) : (info.id != null ? String(info.id) : "");
    var fallback = info.name != null ? String(info.name) : "";
    var name = sid ? resolveSpellDisplayName(sid, fallback) : fallback;
    if (!name) name = "未知术式";
    if (String(name).indexOf("§") >= 0) return name;
    return C_SPELL + name;
}

/**
 * 生成 {damageType} 占位符内容
 * 改三种伤害类型的渐变色 / 文案 → 改此函数各分支 return 字符串
 */
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
    return C_MSG + "术式";
}

// =============================================================================
//  归因数据 · 从 runtime metadata 复制必要字段
//  info 字段来源见 术式运行时/核心.js prepareHitInfo / 各术式 hit info
// =============================================================================

/** 兼容 JS 对象 / Java Map（Graal 跨上下文） */
function readInfoField(info, key) {
    if (info == null || key == null) return null;
    try {
        var v = info[key];
        if (v != null) return v;
    } catch (e0) {}
    try {
        if (typeof info.get === "function") return info.get(String(key));
    } catch (e1) {}
    return null;
}

function normalizeUuid(uid) {
    return String(uid || "").toLowerCase().replace(/-/g, "");
}

function cloneHitInfo(info) {
    if (info == null) return {};
    var spellId = readInfoField(info, "spellId");
    var id = readInfoField(info, "id");
    var dmgType = readInfoField(info, "damageType");
    var typeAlt = readInfoField(info, "type");
    var atkUuid = resolveAttackerUuidFromInfo(info);
    return {
        spellId: spellId != null ? String(spellId) : (id != null ? String(id) : ""),
        id: id != null ? String(id) : "",
        name: readInfoField(info, "name") != null ? String(readInfoField(info, "name")) : "",
        damageType: dmgType != null ? String(dmgType) : (typeAlt != null ? String(typeAlt) : ""),
        kind: readInfoField(info, "kind") != null ? String(readInfoField(info, "kind")) : "",
        attackerUuid: atkUuid,
        attackerName: ""
    };
}

/** 侵蚀反噬致死：kind=erosion 且攻击者即本人（脉冲/虚空致死时 getKiller 常为空） */
function isErosionSelfDeath(victim, info) {
    if (!info || String(info.kind || "") !== "erosion") return false;
    if (!asPlayer(victim)) return false;
    var vUid = normalizeUuid(jUuid(victim));
    var aUid = normalizeUuid(info.attackerUuid || "");
    if (!vUid) return false;
    if (!aUid) return true;
    return vUid === aUid;
}

function resolveAttackerUuidFromInfo(info) {
    if (!info) return "";
    var uid = readInfoField(info, "attackerUuid");
    if (uid != null && String(uid).length) return String(uid);
    var atk = readInfoField(info, "attacker");
    if (atk != null) {
        try { return String(atk.getUniqueId().toString()); } catch (e0) {}
        try {
            return String(atk.getClass().getMethod("getUniqueId").invoke(atk).toString());
        } catch (e1) {}
    }
    return "";
}

function resolveAttackerFromInfo(info) {
    if (!info) return null;
    var uid = resolveAttackerUuidFromInfo(info);
    if (!uid) return null;
    return findOnline(uid);
}

/** 从伤害事件多路解析施术玩家（兼容脉冲/虚空 DamageSource） */
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

// =============================================================================
//  配置加载 · yml 路径与 DEFAULT_CFG 同步
// =============================================================================

function configFilePath() {
    return new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/术式死亡播报.yml");
}

function deepMergeDefaults(target, defaults) {
    target = target || {};
    defaults = defaults || {};
    var out = {};
    var keys = Object.keys(defaults);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var dv = defaults[k];
        var tv = target[k];
        if (dv != null && typeof dv === "object" && !Array.isArray(dv)) {
            out[k] = deepMergeDefaults(tv, dv);
        } else {
            out[k] = tv != null ? tv : dv;
        }
    }
    var tkeys = Object.keys(target);
    for (var j = 0; j < tkeys.length; j++) {
        if (out[tkeys[j]] === undefined) out[tkeys[j]] = target[tkeys[j]];
    }
    return out;
}

/** 首次启动：按 DEFAULT_CFG 写出 yml 模板 */
function writeDefaultConfigFile(file) {
    try {
        var parent = file.getParentFile();
        if (parent != null && !parent.exists()) parent.mkdirs();
        var yml = YamlConfiguration.loadConfiguration(file);
        yml.set("Enabled", DEFAULT_CFG.Enabled);
        yml.set("AttributionWindowMs", DEFAULT_CFG.AttributionWindowMs);
        yml.set("PlayerKill.Enabled", DEFAULT_CFG.PlayerKill.Enabled);
        yml.set("PlayerKill.ShowDamageType", DEFAULT_CFG.PlayerKill.ShowDamageType);
        yml.set("PlayerKill.Template", DEFAULT_CFG.PlayerKill.Template);
        yml.set("PlayerKill.TemplateWithType", DEFAULT_CFG.PlayerKill.TemplateWithType);
        yml.set("MobKill.Enabled", DEFAULT_CFG.MobKill.Enabled);
        yml.set("MobKill.Scope", DEFAULT_CFG.MobKill.Scope);
        yml.set("MobKill.NearbyRange", DEFAULT_CFG.MobKill.NearbyRange);
        yml.set("MobKill.Template", DEFAULT_CFG.MobKill.Template);
        yml.set("ErosionSelfDeath.Enabled", DEFAULT_CFG.ErosionSelfDeath.Enabled);
        yml.set("ErosionSelfDeath.Template", DEFAULT_CFG.ErosionSelfDeath.Template);
        yml.set("FallbackPlayerKill.Enabled", DEFAULT_CFG.FallbackPlayerKill.Enabled);
        yml.set("FallbackPlayerKill.Template", DEFAULT_CFG.FallbackPlayerKill.Template);
        // Graal 对 save(File) / save(String) 重载歧义，须显式传字符串路径
        yml.save(String(file.getAbsolutePath()));
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC术式死亡] 写入默认配置失败: " + e);
    }
}

/** 读 yml；新增配置项时在此加一行 getString/getBoolean，并在 writeDefaultConfigFile 同步 */
function loadConfig() {
    var file = configFilePath();
    if (!file.exists()) writeDefaultConfigFile(file);
    var merged = deepMergeDefaults({}, DEFAULT_CFG);
    try {
        var yml = YamlConfiguration.loadConfiguration(file);
        merged.Enabled = yml.getBoolean("Enabled", DEFAULT_CFG.Enabled);
        merged.AttributionWindowMs = Number(yml.getInt("AttributionWindowMs", DEFAULT_CFG.AttributionWindowMs)) || DEFAULT_CFG.AttributionWindowMs;
        merged.PlayerKill.Enabled = yml.getBoolean("PlayerKill.Enabled", DEFAULT_CFG.PlayerKill.Enabled);
        merged.PlayerKill.ShowDamageType = yml.getBoolean("PlayerKill.ShowDamageType", DEFAULT_CFG.PlayerKill.ShowDamageType);
        merged.PlayerKill.Template = String(yml.getString("PlayerKill.Template", DEFAULT_CFG.PlayerKill.Template));
        merged.PlayerKill.TemplateWithType = String(yml.getString("PlayerKill.TemplateWithType", DEFAULT_CFG.PlayerKill.TemplateWithType));
        merged.MobKill.Enabled = yml.getBoolean("MobKill.Enabled", DEFAULT_CFG.MobKill.Enabled);
        merged.MobKill.Scope = String(yml.getString("MobKill.Scope", DEFAULT_CFG.MobKill.Scope)).toLowerCase();
        merged.MobKill.NearbyRange = Number(yml.getDouble("MobKill.NearbyRange", DEFAULT_CFG.MobKill.NearbyRange)) || DEFAULT_CFG.MobKill.NearbyRange;
        merged.MobKill.Template = String(yml.getString("MobKill.Template", DEFAULT_CFG.MobKill.Template));
        merged.ErosionSelfDeath.Enabled = yml.getBoolean("ErosionSelfDeath.Enabled", DEFAULT_CFG.ErosionSelfDeath.Enabled);
        merged.ErosionSelfDeath.Template = String(yml.getString("ErosionSelfDeath.Template", DEFAULT_CFG.ErosionSelfDeath.Template));
        merged.FallbackPlayerKill.Enabled = yml.getBoolean("FallbackPlayerKill.Enabled", DEFAULT_CFG.FallbackPlayerKill.Enabled);
        merged.FallbackPlayerKill.Template = String(yml.getString("FallbackPlayerKill.Template", DEFAULT_CFG.FallbackPlayerKill.Template));
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC术式死亡] 读取配置失败，使用内置默认: " + e);
    }
    _cfg = merged;
    return merged;
}

function getCfg() {
    if (_cfg == null) return loadConfig();
    return _cfg;
}

/** 将 Template 里的 {key} 替换为 vars[key] */
function applyTemplate(tpl, vars) {
    tpl = String(tpl || "");
    var keys = Object.keys(vars || {});
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        tpl = tpl.split("{" + k + "}").join(String(vars[k]));
    }
    return tpl;
}

// =============================================================================
//  归因 Map 读写
// =============================================================================

/** 每次术式造成有效伤害时调用，覆盖该实体上一击记录 */
function recordSpellHit(victim, info, finalDmg, attacker) {
    if (!victim || !info) return;
    var copy = cloneHitInfo(info);
    var atk = asPlayer(attacker);
    var victimP = asPlayer(victim);
    if (atk) {
        copy.attackerUuid = jUuid(atk);
        copy.attackerName = String(atk.getName());
    } else if (copy.attackerUuid) {
        copy.attackerUuid = String(copy.attackerUuid);
    } else if (copy.kind === "erosion" && victimP) {
        copy.attackerUuid = jUuid(victimP);
        copy.attackerName = String(victimP.getName());
    } else {
        return;
    }
    _lastSpellHitMap.put(jUuid(victim), {
        info: copy,
        timeMs: Date.now(),
        finalDmg: Number(finalDmg) || 0
    });
}

/** 死亡时读取；超时则丢弃 */
function peekAttribution(entity) {
    var key = jUuid(entity);
    var rec = _lastSpellHitMap.get(key);
    if (!rec) return null;
    var windowMs = getCfg().AttributionWindowMs;
    if (Date.now() - rec.timeMs > windowMs) {
        _lastSpellHitMap.remove(key);
        return null;
    }
    return rec;
}

function clearAttribution(entity) {
    if (entity == null) return;
    _lastSpellHitMap.remove(jUuid(entity));
}

/** 击杀者 UUID 须与记录中的 attackerUuid 一致 */
function isAttributionValid(rec, killer) {
    if (!rec || !rec.info) return false;
    if (Date.now() - rec.timeMs > getCfg().AttributionWindowMs) return false;
    var atkUuid = normalizeUuid(rec.info.attackerUuid);
    if (!atkUuid) return false;
    if (killer != null) {
        return normalizeUuid(jUuid(killer)) === atkUuid;
    }
    return true;
}

/**
 * 解析术式击杀者：优先 getKiller()，脉冲/虚空伤害时回退 attribution.attackerUuid
 * （脉冲术式 PvP 击杀时 getKiller() 几乎总是 null，必须走 attribution）
 */
function resolveAttributedKiller(victim, rec) {
    if (!rec || !rec.info) return null;
    var killer = null;
    try { killer = asPlayer(victim.getKiller()); } catch (eK) {}
    if (killer != null && isAttributionValid(rec, killer)) return killer;
    var uid = rec.info.attackerUuid;
    if (!uid) return null;
    var attributed = findOnline(uid);
    if (attributed == null) return null;
    if (!isAttributionValid(rec, attributed)) return null;
    return attributed;
}

/** 非侵蚀的 PvP 术式击杀（攻击者 ≠ 受害者） */
function isPvpSpellKill(victim, killer, info) {
    if (!killer || !victim || !info) return false;
    if (isErosionSelfDeath(victim, info)) return false;
    return normalizeUuid(jUuid(killer)) !== normalizeUuid(jUuid(victim));
}

// =============================================================================
//  消息拼装 —— 新增场景时可仿照添加 buildXxxMessage + onXxxDeath 分支
// =============================================================================

function buildPlayerKillMessage(victim, killer, rec) {
    var info = rec.info;
    var spell = formatSpellName(info);
    var vars = {
        killer: playerColoredName(killer),
        victim: playerColoredName(victim),
        spell: spell,
        damageType: damageTypeLabel(info.damageType)
    };
    var pk = getCfg().PlayerKill;
    if (pk.ShowDamageType) {
        return applyTemplate(pk.TemplateWithType, vars);
    }
    return applyTemplate(pk.Template, vars);
}

function buildErosionMessage(victim, rec) {
    var info = rec.info;
    return applyTemplate(getCfg().ErosionSelfDeath.Template, {
        victim: playerColoredName(victim),
        spell: formatSpellName(info),
        erosion: C_EROSION + "越环侵蚀"  // 改侵蚀标签文字改这里或 Template 里的 {erosion}
    });
}

function buildMobKillMessage(killer, victimEntity, rec) {
    var info = rec.info;
    return applyTemplate(getCfg().MobKill.Template, {
        killer: playerColoredName(killer),
        victim: entityDisplayName(victimEntity),
        spell: formatSpellName(info),
        damageType: damageTypeLabel(info.damageType)
    });
}

/** 怪物击杀播报渠道，Scope 见 DEFAULT_CFG.MobKill */
function broadcastMobKill(killer, loc, message) {
    var scope = getCfg().MobKill.Scope;
    if (scope === "global") {
        Bukkit.broadcastMessage(message);
        return;
    }
    if (scope === "nearby" && loc != null) {
        var range = getCfg().MobKill.NearbyRange;
        var rangeSq = range * range;
        var world = loc.getWorld();
        if (world == null) return;
        var players = Bukkit.getOnlinePlayers().iterator();
        while (players.hasNext()) {
            var p = players.next();
            try {
                if (!p.getWorld().equals(world)) continue;
                if (p.getLocation().distanceSquared(loc) <= rangeSq) p.sendMessage(message);
            } catch (e) {}
        }
        return;
    }
    // 默认 killer：仅击杀者
    if (killer != null) killer.sendMessage(message);
}

/** 清除 Paper 实体/玩家默认 deathMessage（如 SONIC_BOOM「音波尖啸」、VOID 等） */
function clearDeathMessage(event) {
    if (event == null) return;
    try { event.deathMessage(null); return; } catch (e0) {}
    try { event.setDeathMessage(null); return; } catch (e1) {}
    try { event.setDeathMessage(""); } catch (e2) {}
}

/** 替换原版玩家死亡全服提示；Paper 须 deathMessage(Component)，且尽量最晚 MONITOR 覆盖 */
function setPlayerDeathMessage(event, message) {
    if (!message) return;
    var text = String(message);
    try {
        var Legacy = Java.type("net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer");
        var comp = Legacy.legacySection().deserialize(text);
        try { event.deathMessage(null); } catch (eClr) {}
        event.deathMessage(comp);
        return;
    } catch (ePaper) {}
    try {
        event.setDeathMessage(text);
        return;
    } catch (e0) {}
    try { Bukkit.broadcastMessage(text); } catch (e2) {}
}

// =============================================================================
//  事件处理
// =============================================================================

/** 该次术式伤害是否足以击杀（兼容 SONIC_BOOM / VOID 在 MONITOR 阶段 finalDamage 异常） */
function isLethalSpellHit(event) {
    try {
        var ent = event.getEntity();
        var hp = Number(ent.getHealth());
        if (!(hp > 0)) return false;
        var dmg = 0;
        try { dmg = Number(event.getFinalDamage()); } catch (e0) {}
        if (!(dmg > 0)) {
            try { dmg = Number(event.getDamage()); } catch (e1) {}
        }
        return isFinite(dmg) && dmg > 0 && hp - dmg <= 1e-6;
    } catch (e) { return false; }
}

function readEventDamageAmount(event) {
    var finalDmg = 0;
    var baseDmg = 0;
    try { finalDmg = Number(event.getFinalDamage()); } catch (eF) {}
    try { baseDmg = Number(event.getDamage()); } catch (eF2) {}
    if (finalDmg > 0) return finalDmg;
    if (baseDmg > 0) return baseDmg;
    return 0;
}

/**
 * 从 gltc_spell_hit_info 抓取归因写入 Map
 * @param requirePositiveDmg  true=须 finalDamage>0（MONITOR 补录）；false=脉冲/虚空 HIGHEST 阶段仍记录
 */
function captureSpellHitFromEvent(event, requirePositiveDmg) {
    if (!getCfg().Enabled) return;
    var victim = event.getEntity();
    if (!isLivingEntity(victim)) return;
    if (!victim.hasMetadata(META_SPELL_HIT)) return;
    if (event.isCancelled()) return;
    var info = null;
    try { info = victim.getMetadata(META_SPELL_HIT).get(0).value(); } catch (eI) {}
    if (!info) return;
    var finalDmg = readEventDamageAmount(event);
    if (requirePositiveDmg && !(finalDmg > 0)) {
        if (!isLethalSpellHit(event)) return;
        try { finalDmg = Number(event.getDamage()); } catch (eD) {}
        if (!(finalDmg > 0)) finalDmg = 0.1;
    }
    var attacker = resolveSpellAttacker(event, info);
    if (!attacker) attacker = resolveAttackerFromInfo(info);
    recordSpellHit(victim, info, finalDmg, attacker);
}

/** HIGHEST：脉冲/虚空伤害此阶段 finalDamage 常为 0，仍须先占位归因 */
function onSpellDamageCaptureHighest(event) {
    try {
        captureSpellHitFromEvent(event, false);
    } catch (ex) {
        Bukkit.getLogger().warning("[GLTC术式死亡] 伤害归因(HIGHEST)异常: " + ex);
    }
}

/** MONITOR：本模块先于运行时注册，finalDamage 定型后补录/覆盖（物理/粒子/脉冲通用） */
function onSpellDamageCaptureMonitor(event) {
    try {
        captureSpellHitFromEvent(event, true);
    } catch (ex) {
        Bukkit.getLogger().warning("[GLTC术式死亡] 伤害归因(MONITOR)异常: " + ex);
    }
}

/**
 * PlayerDeathEvent · MONITOR
 * Paper 在较晚阶段才定型「掉出了这个世界」等默认 deathMessage，须 MONITOR 覆盖
 */
function onPlayerDeath(event) {
    if (!getCfg().Enabled) return;
    try {
        var victim = event.getEntity();
        if (victim == null) return;
        var rec = peekAttribution(victim);
        if (!rec) return;

        var info = rec.info;

        // --- 侵蚀自亡（脉冲自伤；getKiller() 通常为空）---
        if (getCfg().ErosionSelfDeath.Enabled
            && (isErosionSelfDeath(victim, info) || String(info.kind || "") === "erosion")) {
            setPlayerDeathMessage(event, buildErosionMessage(victim, rec));
            clearAttribution(victim);
            return;
        }

        // --- PvP 术式击杀（含脉冲/虚空：getKiller() 为空时用 attribution 施术者）---
        if (!getCfg().PlayerKill.Enabled) {
            // PlayerKill 关闭时才看 FallbackPlayerKill
            if (!getCfg().FallbackPlayerKill.Enabled) return;
            var fbKiller = resolveAttributedKiller(victim, rec);
            if (fbKiller == null || !isPvpSpellKill(victim, fbKiller, info)) return;
            setPlayerDeathMessage(event, applyTemplate(getCfg().FallbackPlayerKill.Template, {
                killer: playerColoredName(fbKiller),
                victim: playerColoredName(victim),
                spell: formatSpellName(info)
            }));
            clearAttribution(victim);
            return;
        }

        var attributedKiller = resolveAttributedKiller(victim, rec);
        if (attributedKiller == null || !isPvpSpellKill(victim, attributedKiller, info)) return;

        setPlayerDeathMessage(event, buildPlayerKillMessage(victim, attributedKiller, rec));
        clearAttribution(victim);
    } catch (ex) {
        Bukkit.getLogger().warning("[GLTC术式死亡] 玩家死亡播报异常: " + ex);
    }
}

/**
 * EntityDeathEvent · MONITOR
 * 仅处理非玩家实体；玩家走 onPlayerDeath
 */
function onEntityDeath(event) {
    if (!getCfg().Enabled) return;
    try {
        var entity = event.getEntity();
        if (entity == null || asPlayer(entity) != null) return;
        if (!isLivingEntity(entity)) return;

        var rec = peekAttribution(entity);
        if (!rec) return;

        // 粒子/脉冲走 DamageSource（如 SONIC_BOOM）时常无 getKiller()，与 PvP 脉冲同理走 attribution
        var killer = resolveAttributedKiller(entity, rec);
        if (killer == null) killer = resolveAttackerFromInfo(rec.info);
        if (killer == null || !isAttributionValid(rec, killer)) {
            clearDeathMessage(event);
            return;
        }

        clearDeathMessage(event);

        if (!getCfg().MobKill.Enabled) {
            clearAttribution(entity);
            return;
        }

        var msg = buildMobKillMessage(killer, entity, rec);
        var loc = null;
        try { loc = entity.getLocation(); } catch (eL) {}
        broadcastMobKill(killer, loc, msg);
        clearAttribution(entity);
    } catch (ex) {
        Bukkit.getLogger().warning("[GLTC术式死亡] 实体死亡播报异常: " + ex);
    }
}

/** 玩家退出时清理归因，防 Map 泄漏 */
function onPlayerQuit(event) {
    try {
        var p = event.getPlayer();
        if (p != null) clearAttribution(p);
    } catch (e) {}
}

/** 定时清理超时归因（每 600 tick ≈ 30 秒） */
function cleanupStaleAttribution() {
    var now = Date.now();
    var windowMs = getCfg().AttributionWindowMs;
    var it = _lastSpellHitMap.entrySet().iterator();
    while (it.hasNext()) {
        var entry = it.next();
        if (now - entry.getValue().timeMs > windowMs) it.remove();
    }
}

// =============================================================================
//  监听注册 / 重载
//  注意：监听.js 须在本模块之前加载术式运行时，以保证 MONITOR 注册顺序正确
// =============================================================================

function unregisterListeners() {
    try {
        if (_listenerInstance != null) {
            try { EntityDamageEvent.getHandlerList().unregister(_listenerInstance); } catch (e0) {}
            try { PlayerQuitEvent.getHandlerList().unregister(_listenerInstance); } catch (e3) {}
        }
        if (_deathListenerInstance != null) {
            try { PlayerDeathEvent.getHandlerList().unregister(_deathListenerInstance); } catch (e1) {}
        }
        if (_entityDeathListenerInstance != null) {
            try { EntityDeathEvent.getHandlerList().unregister(_entityDeathListenerInstance); } catch (eEnt) {}
        }
    } catch (e) {}
    _listenerInstance = null;
    _deathListenerInstance = null;
    _entityDeathListenerInstance = null;
    if (_cleanupTaskId >= 0) {
        try { Bukkit.getScheduler().cancelTask(_cleanupTaskId); } catch (eC) {}
        _cleanupTaskId = -1;
    }
}

/** 延迟 1 tick 注册死亡监听，确保 MONITOR 阶段最晚执行，覆盖 Paper 默认 deathMessage */
function registerDeathListenerLate() {
    try {
        if (_deathListenerInstance != null) {
            PlayerDeathEvent.getHandlerList().unregister(_deathListenerInstance);
        }
    } catch (eU) {}
    var ListenerClass = Java.extend(Listener, {});
    _deathListenerInstance = new ListenerClass();
    Bukkit.getPluginManager().registerEvent(
        PlayerDeathEvent, _deathListenerInstance, EventPriority.MONITOR,
        function(l, event) { onPlayerDeath(event); },
        PLUGIN, false
    );
    try { PLUGIN.gltcSpellDeathDeathListener = _deathListenerInstance; } catch (ePl) {}
}

function registerEntityDeathListenerLate() {
    try {
        if (_entityDeathListenerInstance != null) {
            EntityDeathEvent.getHandlerList().unregister(_entityDeathListenerInstance);
        }
    } catch (eU) {}
    var ListenerClass = Java.extend(Listener, {});
    _entityDeathListenerInstance = new ListenerClass();
    Bukkit.getPluginManager().registerEvent(
        EntityDeathEvent, _entityDeathListenerInstance, EventPriority.MONITOR,
        function(l, event) { onEntityDeath(event); },
        PLUGIN, false
    );
    try { PLUGIN.gltcSpellEntityDeathListener = _entityDeathListenerInstance; } catch (ePl) {}
}

function registerListeners() {
    unregisterListeners();
    loadConfig();

    var ListenerClass = Java.extend(Listener, {});
    _listenerInstance = new ListenerClass();
    try { PLUGIN.gltcSpellDeathListener = _listenerInstance; } catch (ePl) {}
    try { PLUGIN.gltcSpellDeathListenerVer = MODULE_VER; } catch (eVer) {}

    // ①a 术式伤害归因 HIGHEST（脉冲/虚空：finalDamage 尚未定型也先记录）
    Bukkit.getPluginManager().registerEvent(
        EntityDamageEvent, _listenerInstance, EventPriority.HIGHEST,
        function(l, event) { onSpellDamageCaptureHighest(event); },
        PLUGIN, false
    );
    // ①b 术式伤害归因 MONITOR（须先于运行时 MONITOR 注册 → 监听.js 加载顺序保证）
    Bukkit.getPluginManager().registerEvent(
        EntityDamageEvent, _listenerInstance, EventPriority.MONITOR,
        function(l, event) { onSpellDamageCaptureMonitor(event); },
        PLUGIN, false
    );
    // ② 玩家 / 怪物死亡 → 下一 tick 注册 MONITOR，尽量晚于 Paper 写入 SONIC_BOOM / 虚空等默认 deathMessage
    Bukkit.getScheduler().runTask(PLUGIN, toRunnable(function() {
        registerDeathListenerLate();
        registerEntityDeathListenerLate();
    }));
    // ③ 退出清理
    Bukkit.getPluginManager().registerEvent(
        PlayerQuitEvent, _listenerInstance, EventPriority.MONITOR,
        function(l, event) { onPlayerQuit(event); },
        PLUGIN, true
    );

    _cleanupTaskId = Bukkit.getScheduler().scheduleSyncRepeatingTask(PLUGIN, toRunnable(function() {
        cleanupStaleAttribution();
    }), 600, 600);

    Bukkit.getLogger().info("[GLTC术式死亡] 击杀播报已挂载 v" + MODULE_VER);
}

registerListeners();

// === 导出（供调试或其它脚本 reload 配置）===
({
    reload: function() {
        loadConfig();
        Bukkit.getLogger().info("[GLTC术式死亡] 配置已重载");
    },
    getConfig: function() { return getCfg(); },
    peekAttribution: peekAttribution,
    MODULE_VER: MODULE_VER
});
