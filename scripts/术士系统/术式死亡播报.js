/**
 * GLTC · 术式死亡 / 击杀播报（精简稳定版）
 * 由 监听.js 在术式运行时之前 eval；配置见 addon_configs/GLTC/术式死亡播报.yml
 *
 * 稳定机制：
 *  - 归因在核心.js tagHitInfo（伤害发生前）即写入共享 hitMap，保证术式直接致死时
 *    PlayerDeathEvent 一定能读到，不依赖 EntityDamageEvent(MONITOR) 的 metadata 时序。
 *  - EntityDamageEvent(MONITOR) 仅作兜底，更新实际伤害 finalDmg。
 *  - 死亡事件只改写有有效归因的消息，避免误清其他来源的死亡播报。
 */
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
var YamlConfiguration = Java.type("org.bukkit.configuration.file.YamlConfiguration");
var File = java.io.File;
var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var META_SPELL_HIT = "gltc_spell_hit_info";
var HIT_MAP_KEY = "spell_death_attribution";
var MODULE_VER = 8;

var C_KILLER = "§e", C_VICTIM = "§e", C_MOB = "§e", C_SPELL = "§x§6§2§c§6§f§f", C_EROSION = "§4";

var DEFAULT_CFG = {
    Enabled: true,
    AttributionWindowMs: 10000,
    PlayerKill: {
        Enabled: true, ShowDamageType: true,
        Template: "{killer} §7使用术式 {spell} §7杀死了 {victim}",
        TemplateWithType: "{killer} §f通过 {damageType}§f术式 {spell} §f杀死了 {victim}"
    },
    MobKill: { Enabled: true, Scope: "nearby", NearbyRange: 256,
        Template: "{killer} §f通过 {damageType}§f术式 {spell} §f杀死了 {victim}" },
    ErosionSelfDeath: { Enabled: true,
        Template: "{victim} §f因 {erosion} §f在施展 {spell} §f时血脑屏障熔毁而亡" },
    FallbackPlayerKill: { Enabled: false,
        Template: "{killer} §f通过术式 {spell} §f使 {victim} §f走向末路" }
};

var _cfg = null, _listener = null, _cleanupId = -1;
var _SlimefunItemClass = null;
var _hitMapLocalCache = null;

function hitMap() {
    try {
        if (PLUGIN != null && PLUGIN.hasMetadata("gltc_shared_root_maps")) {
            var root = PLUGIN.getMetadata("gltc_shared_root_maps").get(0).value();
            if (root != null) {
                var existing = root.get(HIT_MAP_KEY);
                if (existing != null) return existing;
                var created = new CHM();
                var raced = root.putIfAbsent(HIT_MAP_KEY, created);
                return raced != null ? raced : created;
            }
        }
    } catch (eRoot) {}
    if (_hitMapLocalCache == null) _hitMapLocalCache = new CHM();
    return _hitMapLocalCache;
}

function jUuid(ent) {
    if (ent == null) return "";
    try { return String(ent.getUniqueId().toString()); } catch (e) {}
    return String(ent);
}
function normUuid(u) { return String(u || "").toLowerCase().replace(/-/g, ""); }
function asPlayer(ent) {
    if (ent == null) return null;
    try { if (ent instanceof Player) return ent; } catch (e0) {}
    try { if (Player.class.isInstance(ent)) return ent; } catch (e1) {}
    return null;
}
function isLiving(ent) {
    if (ent == null) return false;
    try { if (LivingEntity.class.isInstance(ent)) return true; } catch (e0) {}
    try { return ent instanceof LivingEntity; } catch (e1) {}
    return false;
}
function findOnline(uuid) {
    uuid = String(uuid || "");
    if (!uuid) return null;
    try { return Bukkit.getPlayer(java.util.UUID.fromString(uuid)); } catch (e0) {}
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].getUniqueId().toString()) === uuid) return arr[i];
        }
    } catch (e1) {}
    return null;
}
function field(info, key) {
    if (info == null) return null;
    try { var v = info[key]; if (v != null) return v; } catch (e0) {}
    try { if (typeof info.get === "function") return info.get(String(key)); } catch (e1) {}
    return null;
}
function stripColor(s) { return String(s || "").replace(/§x(§[0-9a-fA-F]){6}/g, "").replace(/§./g, ""); }
function skipColor(s, i) {
    if (i >= s.length || s.charAt(i) !== "§") return i;
    if (i + 1 < s.length && (s.charAt(i + 1) === "x" || s.charAt(i + 1) === "X")) return Math.min(s.length, i + 14);
    return Math.min(s.length, i + 2);
}
function shortDn(dn) {
    dn = String(dn || "");
    if (!dn) return "";
    var sep = dn.indexOf("丨"); if (sep < 0) sep = dn.indexOf("|");
    if (sep >= 0) return dn.substring(sep + 1).replace(/^\s+/, "");
    var plain = stripColor(dn);
    for (var pi = 0; pi < 2; pi++) {
        var pref = pi === 0 ? "施术技能核心" : "术式载体";
        var at = plain.indexOf(pref); if (at < 0) continue;
        var need = at + pref.length, ci = 0, pc = 0;
        while (ci < dn.length && pc < need) {
            if (dn.charAt(ci) === "§") { ci = skipColor(dn, ci); continue; }
            pc++; ci++;
        }
        return dn.substring(ci).replace(/^\s+/, "");
    }
    return dn;
}
function sfItem(id) {
    if (!id) return null;
    try {
        if (_SlimefunItemClass == null) _SlimefunItemClass = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
        return _SlimefunItemClass.getById(String(id));
    } catch (e) { return null; }
}
function spellName(info) {
    info = info || {};
    var sid = field(info, "spellId") || field(info, "id") || "";
    var fb = field(info, "name") || "";
    var name = sid;
    try {
        var sf = sfItem(sid);
        if (sf) {
            var meta = sf.getItem().getItemMeta();
            if (meta && meta.hasDisplayName()) {
                var s = shortDn(String(meta.getDisplayName()));
                if (s && stripColor(s).length) name = s;
            }
        }
    } catch (e) {}
    if (!name) name = fb || sid || "未知术式";
    if (String(name).indexOf("§") >= 0) return name;
    return C_SPELL + name;
}
function dmgLabel(type) {
    var t = String(type || "").toLowerCase();
    if (t === "physical" || t === "phys" || t === "物理") return "§x§d§7§9§5§8§6物§x§c§f§8§3§7§7理§x§c§6§7§1§6§8伤§x§b§e§5§f§5§9害";
    if (t === "particle" || t === "magic" || t === "粒子") return "§x§9§6§8§6§d§7粒§x§9§5§7§7§c§f子§x§9§3§6§8§c§6伤§x§9§2§5§9§b§e害";
    if (t === "pulse" || t === "脉冲") return "§x§e§a§7§2§c§9脉§x§e§5§6§5§a§1冲§x§d§f§5§7§7§a伤§x§d§a§4§a§5§2害";
    return "§x§f§f§f§5§b§3术式";
}
function pName(p) { return p ? C_KILLER + String(p.getName()) : C_KILLER + "未知"; }
function entName(ent) {
    if (!ent) return C_MOB + "目标";
    var p = asPlayer(ent); if (p) return C_VICTIM + String(p.getName());
    try { if (ent.getCustomName && ent.getCustomName()) return C_MOB + String(ent.getCustomName()); } catch (e0) {}
    try { if (ent.getName) return C_MOB + String(ent.getName()); } catch (e1) {}
    return C_MOB + "目标";
}
function tpl(t, vars) {
    t = String(t || "");
    var keys = Object.keys(vars || {});
    for (var i = 0; i < keys.length; i++) t = t.split("{" + keys[i] + "}").join(String(vars[keys[i]]));
    return t;
}
function cfgPath() {
    return new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/术式死亡播报.yml");
}
function loadConfig() {
    var file = cfgPath();
    if (!file.exists()) {
        try {
            var parent = file.getParentFile();
            if (parent != null && !parent.exists()) parent.mkdirs();
            var y = YamlConfiguration.loadConfiguration(file);
            y.set("Enabled", DEFAULT_CFG.Enabled);
            y.set("AttributionWindowMs", DEFAULT_CFG.AttributionWindowMs);
            y.set("PlayerKill.Enabled", DEFAULT_CFG.PlayerKill.Enabled);
            y.set("PlayerKill.ShowDamageType", DEFAULT_CFG.PlayerKill.ShowDamageType);
            y.set("PlayerKill.Template", DEFAULT_CFG.PlayerKill.Template);
            y.set("PlayerKill.TemplateWithType", DEFAULT_CFG.PlayerKill.TemplateWithType);
            y.set("MobKill.Enabled", DEFAULT_CFG.MobKill.Enabled);
            y.set("MobKill.Scope", DEFAULT_CFG.MobKill.Scope);
            y.set("MobKill.NearbyRange", DEFAULT_CFG.MobKill.NearbyRange);
            y.set("MobKill.Template", DEFAULT_CFG.MobKill.Template);
            y.set("ErosionSelfDeath.Enabled", DEFAULT_CFG.ErosionSelfDeath.Enabled);
            y.set("ErosionSelfDeath.Template", DEFAULT_CFG.ErosionSelfDeath.Template);
            y.set("FallbackPlayerKill.Enabled", DEFAULT_CFG.FallbackPlayerKill.Enabled);
            y.set("FallbackPlayerKill.Template", DEFAULT_CFG.FallbackPlayerKill.Template);
            y.save(String(file.getAbsolutePath()));
        } catch (eW) {}
    }
    var c = {
        Enabled: DEFAULT_CFG.Enabled,
        AttributionWindowMs: DEFAULT_CFG.AttributionWindowMs,
        PlayerKill: {
            Enabled: DEFAULT_CFG.PlayerKill.Enabled,
            ShowDamageType: DEFAULT_CFG.PlayerKill.ShowDamageType,
            Template: DEFAULT_CFG.PlayerKill.Template,
            TemplateWithType: DEFAULT_CFG.PlayerKill.TemplateWithType
        },
        MobKill: {
            Enabled: DEFAULT_CFG.MobKill.Enabled,
            Scope: DEFAULT_CFG.MobKill.Scope,
            NearbyRange: DEFAULT_CFG.MobKill.NearbyRange,
            Template: DEFAULT_CFG.MobKill.Template
        },
        ErosionSelfDeath: {
            Enabled: DEFAULT_CFG.ErosionSelfDeath.Enabled,
            Template: DEFAULT_CFG.ErosionSelfDeath.Template
        },
        FallbackPlayerKill: {
            Enabled: DEFAULT_CFG.FallbackPlayerKill.Enabled,
            Template: DEFAULT_CFG.FallbackPlayerKill.Template
        }
    };
    try {
        var yml = YamlConfiguration.loadConfiguration(file);
        c.Enabled = yml.getBoolean("Enabled", c.Enabled);
        c.AttributionWindowMs = Number(yml.getInt("AttributionWindowMs", c.AttributionWindowMs)) || c.AttributionWindowMs;
        c.PlayerKill.Enabled = yml.getBoolean("PlayerKill.Enabled", c.PlayerKill.Enabled);
        c.PlayerKill.ShowDamageType = yml.getBoolean("PlayerKill.ShowDamageType", c.PlayerKill.ShowDamageType);
        c.PlayerKill.Template = String(yml.getString("PlayerKill.Template", c.PlayerKill.Template));
        c.PlayerKill.TemplateWithType = String(yml.getString("PlayerKill.TemplateWithType", c.PlayerKill.TemplateWithType));
        c.MobKill.Enabled = yml.getBoolean("MobKill.Enabled", c.MobKill.Enabled);
        c.MobKill.Scope = String(yml.getString("MobKill.Scope", c.MobKill.Scope)).toLowerCase();
        c.MobKill.NearbyRange = Number(yml.getDouble("MobKill.NearbyRange", c.MobKill.NearbyRange)) || c.MobKill.NearbyRange;
        c.MobKill.Template = String(yml.getString("MobKill.Template", c.MobKill.Template));
        c.ErosionSelfDeath.Enabled = yml.getBoolean("ErosionSelfDeath.Enabled", c.ErosionSelfDeath.Enabled);
        c.ErosionSelfDeath.Template = String(yml.getString("ErosionSelfDeath.Template", c.ErosionSelfDeath.Template));
        c.FallbackPlayerKill.Enabled = yml.getBoolean("FallbackPlayerKill.Enabled", c.FallbackPlayerKill.Enabled);
        c.FallbackPlayerKill.Template = String(yml.getString("FallbackPlayerKill.Template", c.FallbackPlayerKill.Template));
    } catch (eR) {
        Bukkit.getLogger().warning("[GLTC术式死亡] 读取配置失败: " + eR);
    }
    _cfg = c;
    return c;
}
function cfg() { return _cfg || loadConfig(); }

function cloneInfo(info) {
    var atkUuid = field(info, "attackerUuid") || "";
    if (!atkUuid) {
        var atk = field(info, "attacker");
        if (atk != null) {
            try { atkUuid = String(atk.getUniqueId().toString()); } catch (e0) {
                try { atkUuid = String(atk.getClass().getMethod("getUniqueId").invoke(atk).toString()); } catch (e1) {}
            }
        }
    }
    var dt = field(info, "damageType") || field(info, "type") || "";
    var sid = field(info, "spellId") || field(info, "id") || "";
    return {
        spellId: String(sid), id: String(field(info, "id") || ""),
        name: String(field(info, "name") || ""), damageType: String(dt),
        kind: String(field(info, "kind") || ""), attackerUuid: String(atkUuid), attackerName: ""
    };
}
function resolveAttacker(info) {
    if (!info || !info.attackerUuid) return null;
    return findOnline(info.attackerUuid);
}
function resolveEventAttacker(event, info) {
    var atk = null;
    try { if (event instanceof EntityDamageByEntityEvent) atk = event.getDamager(); } catch (e0) {}
    atk = asPlayer(atk);
    if (!atk) {
        try {
            var src = event.getDamageSource();
            if (src != null) {
                atk = asPlayer(src.getCausingEntity());
                if (!atk) atk = asPlayer(src.getDirectEntity());
            }
        } catch (e1) {}
    }
    return atk || resolveAttacker(info);
}
function isErosionSelf(victim, info) {
    if (!info || info.kind !== "erosion" || !asPlayer(victim)) return false;
    var v = normUuid(jUuid(victim)), a = normUuid(info.attackerUuid);
    return !a || v === a;
}
function isPvpKill(victim, killer, info) {
    if (!killer || !victim || !info || isErosionSelf(victim, info)) return false;
    return normUuid(jUuid(killer)) !== normUuid(jUuid(victim));
}

/** 归因写入：核心.js tagHitInfo 提前调用 + MONITOR 兜底共用 */
function recordSpellHit(victim, info, finalDmg, attacker) {
    if (!victim || !info || !cfg().Enabled) return;
    var copy = cloneInfo(info);
    var p = asPlayer(attacker);
    if (p) {
        copy.attackerUuid = jUuid(p);
        copy.attackerName = String(p.getName());
    } else if (copy.attackerUuid) {
        copy.attackerUuid = String(copy.attackerUuid);
        if (!copy.attackerName) {
            var online = findOnline(copy.attackerUuid);
            if (online) copy.attackerName = String(online.getName());
        }
    } else if (copy.kind === "erosion" && asPlayer(victim)) {
        copy.attackerUuid = jUuid(victim);
        copy.attackerName = String(victim.getName());
    } else {
        return;
    }
    hitMap().put(jUuid(victim), { info: copy, timeMs: Date.now(), finalDmg: Number(finalDmg) || 0 });
}
function peekAttribution(entity) {
    var rec = hitMap().get(jUuid(entity));
    if (!rec) return null;
    if (Date.now() - rec.timeMs > cfg().AttributionWindowMs) { hitMap().remove(jUuid(entity)); return null; }
    return rec;
}
function clearAttribution(entity) { if (entity) hitMap().remove(jUuid(entity)); }
function validAttribution(rec, killer) {
    if (!rec || !rec.info) return false;
    if (Date.now() - rec.timeMs > cfg().AttributionWindowMs) return false;
    var a = normUuid(rec.info.attackerUuid);
    if (!a) return false;
    return killer == null || normUuid(jUuid(killer)) === a;
}
/** 归因者解析：优先用记录里的施术者 UUID（死亡时 getKiller 不可靠，不再依赖） */
function resolveKiller(rec) {
    if (!rec || !rec.info) return null;
    return resolveAttacker(rec.info);
}

function onDamageMonitor(event) {
    if (!cfg().Enabled || event.isCancelled()) return;
    var victim = event.getEntity();
    if (!isLiving(victim) || !victim.hasMetadata(META_SPELL_HIT)) return;
    var info = null;
    try { info = victim.getMetadata(META_SPELL_HIT).get(0).value(); } catch (eI) {}
    if (!info) return;
    var dmg = 0;
    try { dmg = Number(event.getFinalDamage()); } catch (eF) {}
    if (!(dmg > 0)) try { dmg = Number(event.getDamage()); } catch (eD) {}
    recordSpellHit(victim, info, dmg, resolveEventAttacker(event, info));
}

function buildPlayerKill(victim, killer, rec) {
    var info = rec.info;
    var vars = { killer: pName(killer), victim: pName(victim), spell: spellName(info), damageType: dmgLabel(info.damageType) };
    var pk = cfg().PlayerKill;
    return tpl(pk.ShowDamageType ? pk.TemplateWithType : pk.Template, vars);
}
function buildErosion(victim, rec) {
    return tpl(cfg().ErosionSelfDeath.Template, {
        victim: pName(victim), spell: spellName(rec.info), erosion: C_EROSION + "越环侵蚀"
    });
}
function buildMobKill(killer, ent, rec) {
    var info = rec.info;
    return tpl(cfg().MobKill.Template, {
        killer: pName(killer), victim: entName(ent), spell: spellName(info), damageType: dmgLabel(info.damageType)
    });
}
function clearDeathMsg(event) {
    try { event.deathMessage(null); return; } catch (e0) {}
    try { event.setDeathMessage(null); return; } catch (e1) {}
    try { event.setDeathMessage(""); } catch (e2) {}
}
function setPlayerDeathMsg(event, message) {
    if (!message) return;
    var text = String(message);
    try {
        var Legacy = Java.type("net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer");
        event.deathMessage(Legacy.legacySection().deserialize(text));
        return;
    } catch (eP) {}
    try { event.setDeathMessage(text); } catch (e0) {}
}
function broadcastMob(killer, loc, message) {
    var mk = cfg().MobKill;
    if (mk.Scope === "global") { Bukkit.broadcastMessage(message); return; }
    if (mk.Scope === "nearby" && loc != null) {
        var r2 = mk.NearbyRange * mk.NearbyRange, w = loc.getWorld();
        if (w == null) return;
        var it = Bukkit.getOnlinePlayers().iterator();
        while (it.hasNext()) {
            var p = it.next();
            try {
                if (p.getWorld().equals(w) && p.getLocation().distanceSquared(loc) <= r2) p.sendMessage(message);
            } catch (e) {}
        }
        return;
    }
    if (killer) killer.sendMessage(message);
}

function handlePlayerDeath(event) {
    if (!cfg().Enabled) return;
    var victim = event.getEntity();
    if (!victim) return;
    var rec = peekAttribution(victim);
    if (!rec) return;
    var info = rec.info;
    if (cfg().ErosionSelfDeath.Enabled && (isErosionSelf(victim, info) || info.kind === "erosion")) {
        setPlayerDeathMsg(event, buildErosion(victim, rec));
        clearAttribution(victim);
        return;
    }
    if (!cfg().PlayerKill.Enabled) {
        if (!cfg().FallbackPlayerKill.Enabled) return;
        var fb = resolveKiller(rec);
        if (!fb || !isPvpKill(victim, fb, info)) return;
        setPlayerDeathMsg(event, tpl(cfg().FallbackPlayerKill.Template, {
            killer: pName(fb), victim: pName(victim), spell: spellName(info)
        }));
        clearAttribution(victim);
        return;
    }
    var killer = resolveKiller(rec);
    if (!killer || !isPvpKill(victim, killer, info)) return;
    setPlayerDeathMsg(event, buildPlayerKill(victim, killer, rec));
    clearAttribution(victim);
}
function handleEntityDeath(event) {
    if (!cfg().Enabled) return;
    var ent = event.getEntity();
    if (!ent || asPlayer(ent) || !isLiving(ent)) return;
    var rec = peekAttribution(ent);
    if (!rec) return;
    var killer = resolveKiller(rec);
    if (!killer) killer = resolveAttacker(rec.info);
    if (!killer || !validAttribution(rec, killer)) { clearAttribution(ent); return; }
    clearDeathMsg(event);
    if (cfg().MobKill.Enabled) {
        var loc = null;
        try { loc = ent.getLocation(); } catch (eL) {}
        broadcastMob(killer, loc, buildMobKill(killer, ent, rec));
    }
    clearAttribution(ent);
}

function unregisterAll() {
    if (_listener != null) {
        try { EntityDamageEvent.getHandlerList().unregister(_listener); } catch (e0) {}
        try { PlayerDeathEvent.getHandlerList().unregister(_listener); } catch (e1) {}
        try { EntityDeathEvent.getHandlerList().unregister(_listener); } catch (e2) {}
        try { PlayerQuitEvent.getHandlerList().unregister(_listener); } catch (e3) {}
    }
    _listener = null;
    if (_cleanupId >= 0) { try { Bukkit.getScheduler().cancelTask(_cleanupId); } catch (eC) {} _cleanupId = -1; }
}
function registerAll() {
    unregisterAll();
    loadConfig();
    var L = Java.extend(Listener, {});
    _listener = new L();
    try { PLUGIN.gltcSpellDeathListener = _listener; PLUGIN.gltcSpellDeathListenerVer = MODULE_VER; } catch (ePl) {}
    Bukkit.getPluginManager().registerEvent(EntityDamageEvent, _listener, EventPriority.MONITOR,
        function(l, e) { try { onDamageMonitor(e); } catch (ex) {} }, PLUGIN, false);
    Bukkit.getPluginManager().registerEvent(PlayerDeathEvent, _listener, EventPriority.MONITOR,
        function(l, e) { try { handlePlayerDeath(e); } catch (ex) {} }, PLUGIN, false);
    Bukkit.getPluginManager().registerEvent(EntityDeathEvent, _listener, EventPriority.MONITOR,
        function(l, e) { try { handleEntityDeath(e); } catch (ex) {} }, PLUGIN, false);
    Bukkit.getPluginManager().registerEvent(PlayerQuitEvent, _listener, EventPriority.MONITOR,
        function(l, e) { try { clearAttribution(e.getPlayer()); } catch (ex) {} }, PLUGIN, true);
    var Runnable = Java.type("java.lang.Runnable");
    _cleanupId = Bukkit.getScheduler().scheduleSyncRepeatingTask(PLUGIN, new (Java.extend(Runnable, {
        run: function() {
            var now = Date.now(), win = cfg().AttributionWindowMs;
            var it = hitMap().entrySet().iterator();
            while (it.hasNext()) { if (now - it.next().getValue().timeMs > win) it.remove(); }
        }
    }))(), 600, 600);
    Bukkit.getLogger().info("[GLTC术式死亡] 击杀播报已挂载 v" + MODULE_VER);
}

registerAll();
try { PLUGIN.gltcRecordSpellHit = recordSpellHit; } catch (eExp) {}
try {
    if (PLUGIN != null && PLUGIN.hasMetadata("gltc_shared_root_maps")) {
        var rootExp = PLUGIN.getMetadata("gltc_shared_root_maps").get(0).value();
        if (rootExp != null) rootExp.put("gltcRecordSpellHit", recordSpellHit);
    }
} catch (eRootExp) {}

({ reload: function() { loadConfig(); Bukkit.getLogger().info("[GLTC术式死亡] 配置已重载"); },
  getConfig: function() { return cfg(); }, peekAttribution: peekAttribution, MODULE_VER: MODULE_VER });