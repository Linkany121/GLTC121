// ===================================================================
// 施术核心 v2 — 薄输入层（由 监听.js 单次加载；道具勿再 eval）
// 职责：施术 GUI、冷却、侵蚀、右键施展、左键 → Runtime.dispatchLeftClick
// 禁止写具体术式 ID；道具特效走 staff_hooks Map
// ===================================================================

// === Java 类型导入 ===
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Player = Java.type("org.bukkit.entity.Player");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");
var CHM = Java.type("java.util.concurrent.ConcurrentHashMap");
var FixedMetadataValue = null;
try { FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue"); } catch (eMeta) {}
var EventResult = null;
try { EventResult = Java.type("org.bukkit.event.Event$Result"); } catch (eRes) {}

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

// === 播报样式 ===
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var C_MSG       = "§x§f§f§f§5§b§3"; // 普通提示色
var C_SPELL     = "§x§6§2§c§6§f§f"; // 术式名强调色（回退）

var SlimefunItem = null;
try { SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem"); } catch (eSf) {}

// === 交互 / 侵蚀（可调）===
var STAFF_USE_DEBOUNCE_MS   = 120;  // 右键施展防抖（毫秒，合并 Interact + onUse）
var EROSION_HP_PCT          = 0.2;  // 侵蚀自伤：当前生命上限百分比（按术式侵蚀等级）
var SPELL_CORE_LISTENER_VER = 1;    // 监听器版本号（热重载升级用）

var CAST_MAGE_HOLDER = { api: null };
/** 监听 boot 注入的 Java 桥 Map（闭包直读，不依赖 Graal 动态字段） */
var BRIDGE_MAP = null;
var STAFF_USE_CONSUMER = null;
var STAFF_CFG = null;
var SPELL_CFG = null;
var SKILL_CORE_CFG = null;
var SKILL_CFG = null;
var GUI_API = null;
var RUNTIME = null;
var SCRIPT_LOADER = null;
var STAFF_META = null;
var _depsReady = false;
var _guiListenersRegistered = false;
var _listenersReady = false;
var _mageDiagOnce = false;

function jUuid(u) {
    return java.lang.String.valueOf(String(u));
}

function getScriptLoader() {
    if (SCRIPT_LOADER != null) return SCRIPT_LOADER;
    try {
        if (PLUGIN.gltcScriptLoader != null) {
            SCRIPT_LOADER = PLUGIN.gltcScriptLoader;
            return SCRIPT_LOADER;
        }
    } catch (e0) {}
    try {
        var candidates = [
            new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/_gltcScriptLoader.js"),
            new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/_gltcScriptLoader.js")
        ];
        for (var c = 0; c < candidates.length; c++) {
            if (!candidates[c].exists()) continue;
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(candidates[c].toPath()))).toString();
            SCRIPT_LOADER = (0, eval)(code);
            try { PLUGIN.gltcScriptLoader = SCRIPT_LOADER; } catch (e1) {}
            return SCRIPT_LOADER;
        }
    } catch (e2) {}
    return null;
}

function evalScript(rel) {
    var loader = getScriptLoader();
    // isolated：避免 _staffMeta 等覆盖本文件同名函数
    if (loader && loader.evalScriptExport) return loader.evalScriptExport(rel, { isolated: true });
    return null;
}

function getStaffMetaApi() {
    if (STAFF_META != null) return STAFF_META;
    STAFF_META = evalScript("施术道具/_staffMeta.js");
    return STAFF_META;
}

function toJavaLong(n) {
    var v = Math.floor(Number(n));
    if (!isFinite(v)) v = 0;
    return java.lang.Long.parseLong(String(v), 10);
}

function getRuntime() {
    if (RUNTIME != null) return RUNTIME;
    try {
        if (PLUGIN != null && PLUGIN.hasMetadata("gltc_spell_runtime")) {
            RUNTIME = PLUGIN.getMetadata("gltc_spell_runtime").get(0).value();
            if (RUNTIME != null) return RUNTIME;
        }
    } catch (e0) {}
    try {
        if (PLUGIN != null && PLUGIN.gltcSpellRuntime != null) {
            RUNTIME = PLUGIN.gltcSpellRuntime;
            return RUNTIME;
        }
    } catch (e1) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcSpellRuntime != null) {
            RUNTIME = RSC.INSTANCE.gltcSpellRuntime;
            return RUNTIME;
        }
    } catch (e2) {}
    try {
        var sr = getSharedRootBridgeApi();
        if (sr != null && sr.getGltcSharedRoot != null) {
            RUNTIME = sr.getGltcSharedRoot().get("gltcSpellRuntime");
            if (RUNTIME != null) return RUNTIME;
        }
    } catch (e3) {}
    try {
        var cache = PLUGIN != null ? PLUGIN.gltcEvalCache : null;
        if (cache != null) {
            RUNTIME = cache.get("术式运行时/核心.js");
            if (RUNTIME != null) return RUNTIME;
        }
    } catch (e4) {}
    return null;
}

/** 由 监听.js 在 boot 时注入同一份运行时句柄（跨 Graal 上下文必做） */
function bindRuntime(rt) {
    if (rt == null) return false;
    RUNTIME = rt;
    try {
        var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
        PLUGIN.setMetadata("gltc_spell_runtime", new FixedMetadataValue(PLUGIN, rt));
    } catch (e0) {}
    try {
        if (PLUGIN.hasMetadata("gltc_shared_root_maps")) {
            PLUGIN.getMetadata("gltc_shared_root_maps").get(0).value().put("gltcSpellRuntime", rt);
        }
    } catch (e1) {}
    return true;
}

/** Graal 跨上下文时 typeof 可能不是 "function"，以可调用为准 */
function hasCalcSpellDamage(api) {
    if (api == null) return false;
    try {
        if (typeof api.calcSpellDamage === "function") return true;
    } catch (e0) {}
    try { return api.calcSpellDamage != null; } catch (e1) { return false; }
}

function getSharedRootBridgeApi() {
    if (SCRIPT_LOADER == null) getScriptLoader();
    try {
        if (SCRIPT_LOADER && SCRIPT_LOADER.evalScriptExport) {
            var api = SCRIPT_LOADER.evalScriptExport("_gltcSharedRoot.js", { isolated: true, cache: true });
            if (api != null) return api;
        }
    } catch (e0) {}
    return null;
}

function pluginMetaValue(key) {
    if (PLUGIN == null) return null;
    var k = String(key);
    try {
        if (PLUGIN.getMetadata != null) {
            var list = PLUGIN.getMetadata(k);
            if (list != null && list.size() > 0) return list.get(0).value();
        }
    } catch (e0) {}
    try {
        var JString = Java.type("java.lang.String");
        var list2 = PLUGIN.getClass().getMethod("getMetadata", JString).invoke(PLUGIN, k);
        if (list2 != null && list2.size() > 0) return list2.get(0).value();
    } catch (e1) {}
    return null;
}

function attachBridges(map, staffConsumer) {
    if (map != null) BRIDGE_MAP = map;
    if (staffConsumer != null) STAFF_USE_CONSUMER = staffConsumer;
    return BRIDGE_MAP != null || STAFF_USE_CONSUMER != null;
}

function getStaffUseConsumer() {
    return STAFF_USE_CONSUMER;
}

function bridgeGet(key) {
    var k = String(key);
    if (BRIDGE_MAP != null) {
        try {
            var direct = BRIDGE_MAP.get(k);
            if (direct != null) return direct;
        } catch (e0) {}
    }
    try {
        var metaMap = pluginMetaValue("gltc_java_bridges");
        if (metaMap != null) {
            var fromMeta = metaMap.get(k);
            if (fromMeta != null) return fromMeta;
        }
    } catch (eMeta) {}
    try {
        var mapRef = pluginMetaValue("gltc_bridge_map_ref");
        if (mapRef != null && mapRef.get != null) {
            var m = mapRef.get();
            if (m != null) {
                var fromRef = m.get(k);
                if (fromRef != null) return fromRef;
            }
        }
    } catch (eRef) {}
    try {
        var root = pluginMetaValue("gltc_shared_root_maps");
        if (root != null) {
            var fromRoot = root.get(k);
            if (fromRoot != null) return fromRoot;
        }
    } catch (eRoot) {}
    if (k === "gltcHandleStaffUse") {
        var staff = pluginMetaValue("gltc_handle_staff_use");
        if (staff != null) return staff;
    }
    var sr = getSharedRootBridgeApi();
    if (sr != null && sr.getJavaBridge != null) {
        try {
            var v = sr.getJavaBridge(k);
            if (v != null) return v;
        } catch (e0) {}
    }
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcJavaBridges != null) {
            var v2 = RSC.INSTANCE.gltcJavaBridges.get(k);
            if (v2 != null) return v2;
        }
    } catch (e1) {}
    try {
        if (PLUGIN != null && PLUGIN.gltcJavaBridges != null) {
            return PLUGIN.gltcJavaBridges.get(k);
        }
    } catch (e2) {}
    return null;
}

function parseStatsRaw(raw) {
    if (raw == null) return null;
    function num(k) {
        try {
            if (raw.get != null) return Number(raw.get(k)) || 0;
        } catch (e0) {}
        try { return Number(raw[k]) || 0; } catch (e1) { return 0; }
    }
    return {
        mageLevel: num("mageLevel"),
        particlePower: num("particlePower"),
        cardiovascular: num("cardiovascular"),
        particleRefraction: num("particleRefraction"),
        finalDamageReduction: num("finalDamageReduction")
    };
}

function mageApiFromJavaBridges() {
    var calc = bridgeGet("gltcMage_calcSpellDamage");
    var stats = bridgeGet("gltcMage_getTotalStats");
    var pulse = bridgeGet("gltcMage_dealPulseDamage");
    var cdBr = bridgeGet("gltcMage_calcSpellCooldownMs");
    if (calc == null && stats == null && cdBr == null) return null;
    return {
        calcSpellDamage: function(player, spellCoefficient) {
            if (calc == null) return NaN;
            try {
                return Number(calc.apply(player, java.lang.Double.valueOf(Number(spellCoefficient) || 0)));
            } catch (e) { return NaN; }
        },
        getTotalStats: function(player, includeStaff) {
            if (stats == null) return null;
            try {
                var flag = includeStaff !== false;
                return parseStatsRaw(stats.apply(player, flag ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE));
            } catch (e) { return null; }
        },
        calcSpellCooldownMs: function(player, baseMs, erosion) {
            if (cdBr != null) {
                try {
                    var list = new java.util.ArrayList();
                    list.add(player);
                    list.add(java.lang.Long.valueOf(Math.floor(Number(baseMs) || 0)));
                    list.add(java.lang.Integer.valueOf(Math.floor(Number(erosion) || 0)));
                    var v = Number(cdBr.apply(list));
                    if (v > 0 && isFinite(v)) return v;
                } catch (eCdBr) {}
            }
            var base = Math.max(50, Math.floor(Number(baseMs) || 1000));
            var er = Math.floor(Number(erosion) || 0);
            var cd = base;
            try {
                var st = this.getTotalStats(player, true);
                var cardio = Number(st && st.cardiovascular) || 0;
                if (cardio > 0) {
                    cd = Math.max(50, Math.floor(base * Math.max(0.01, 1 - Math.min(0.99, cardio))));
                }
            } catch (eC) {}
            if (er > 0) cd = Math.max(50, Math.floor(cd * er));
            return cd;
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
        },
        __fromJavaBridge: true
    };
}

/** boot 注入真实术士 API；禁止把 bridge facade 钉进 holder */
function rememberMageApi(api) {
    if (!hasCalcSpellDamage(api) || (api && api.__fromJavaBridge)) return false;
    try { CAST_MAGE_HOLDER.api = api; } catch (eH) {}
    try { PLUGIN.gltcMageApi = api; } catch (e0) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null) RSC.INSTANCE.gltcMageApi = api;
    } catch (eInst) {}
    try {
        if (FixedMetadataValue != null) {
            PLUGIN.setMetadata("gltc_mage_api", new FixedMetadataValue(PLUGIN, api));
        }
    } catch (e1) {}
    try {
        var sr = getSharedRootBridgeApi();
        if (sr != null && sr.getGltcSharedRoot != null) {
            sr.getGltcSharedRoot().put("gltcMageApi", api);
        }
    } catch (e2) {}
    return true;
}

function bindMageApi(api) {
    return rememberMageApi(api);
}

function ensureMageJavaBridges() {
    return bridgeGet("gltcMage_calcSpellDamage") != null;
}

/** 现读术士 API：boot 句柄 → PLUGIN/RSC → Java 桥 */
function resolveMageApi() {
    var h = CAST_MAGE_HOLDER.api;
    if (h && !h.__fromJavaBridge && hasCalcSpellDamage(h)) return h;
    try {
        if (PLUGIN != null && hasCalcSpellDamage(PLUGIN.gltcMageApi)) return PLUGIN.gltcMageApi;
    } catch (eP) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && hasCalcSpellDamage(RSC.INSTANCE.gltcMageApi)) {
            return RSC.INSTANCE.gltcMageApi;
        }
    } catch (eInst) {}
    var bridged = mageApiFromJavaBridges();
    if (bridged != null) return bridged;
    ensureMageJavaBridges();
    return mageApiFromJavaBridges();
}

function logMageDiag(tag) {
    if (_mageDiagOnce) return;
    if (bridgeGet("gltcMage_calcSpellDamage") != null) return;
    if (resolveMageApi() != null) return;
    // 粒子强度/术士等级读盘回退可用时不告警（bridge 缺失仅影响诊断，不影响施术）
    try {
        var plug = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        if (plug != null && plug.getDataFolder != null) {
            var probe = new File(plug.getDataFolder().getAbsolutePath()
                + "/addon_configs/GLTC/玩家属性/术士数值");
            if (probe.exists() && probe.isDirectory()) return;
        }
    } catch (eDiskOk) {}
    _mageDiagOnce = true;
    try {
        Bukkit.getLogger().warning("[GLTC施术] mage诊断(" + tag + ") deps=" + _depsReady
            + " bridge=" + (bridgeGet("gltcMage_calcSpellDamage") != null)
            + " map=" + (BRIDGE_MAP != null));
    } catch (eW) {}
}

function readMageLevelFromDisk(player) {
    try {
        var uuid = playerUuidFromPlayer(player);
        if (!uuid) return 0;
        var plug = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        var File = java.io.File;
        var Files = java.nio.file.Files;
        var StandardCharsets = java.nio.charset.StandardCharsets;
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var f = new File(plug.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士数值/" + uuid + ".json");
        if (!f.exists()) return 0;
        var data = JSON.parse(StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString());
        return Math.max(0, Math.min(8, Math.floor(Number(data.mageLevel) || 0)));
    } catch (e) { return 0; }
}

function readParticlePowerFromDisk(player) {
    try {
        var uuid = playerUuidFromPlayer(player);
        if (!uuid) return 1;
        var plug = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        var File = java.io.File;
        var Files = java.nio.file.Files;
        var StandardCharsets = java.nio.charset.StandardCharsets;
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var f = new File(plug.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士数值/" + uuid + ".json");
        if (!f.exists()) return 1;
        var data = JSON.parse(StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString());
        var pp = Number(data.particlePower);
        return (pp > 0 && isFinite(pp)) ? pp : 1;
    } catch (e) { return 1; }
}

function readCardiovascularFromDisk(player) {
    try {
        var uuid = playerUuidFromPlayer(player);
        if (!uuid) return 0;
        var plug = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        var File = java.io.File;
        var Files = java.nio.file.Files;
        var StandardCharsets = java.nio.charset.StandardCharsets;
        var ByteBuffer = Java.type("java.nio.ByteBuffer");
        var f = new File(plug.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/术士数值/" + uuid + ".json");
        if (!f.exists()) return 0;
        var data = JSON.parse(StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString());
        var total = Number(data.cardiovascularTotal);
        if (isFinite(total) && total > 0) return Math.min(0.99, total);
        var base = Number(data.cardiovascular);
        return (isFinite(base) && base > 0) ? Math.min(0.99, base) : 0;
    } catch (e) { return 0; }
}

function calcCooldownFromCardio(baseMs, erosion, cardio) {
    var base = Math.max(0, Number(baseMs) || 0);
    var c = Number(cardio) || 0;
    if (c > 0.99) c = 0.99;
    if (c < 0) c = 0;
    var cd = Math.max(50, Math.floor(base * Math.max(0.01, 1 - c)));
    var er = Math.floor(Number(erosion) || 0);
    if (er > 0) cd = Math.max(50, Math.floor(cd * er));
    return cd;
}

function playerUuidFromPlayer(player) {
    if (player == null) return "";
    try { return String(player.getUniqueId().toString()); } catch (e0) {}
    try {
        return String(player.getClass().getMethod("getUniqueId").invoke(player).toString());
    } catch (e1) {}
    return "";
}

function mageCall(method, args, fallback) {
    if (method === "calcSpellDamage") {
        var calc = bridgeGet("gltcMage_calcSpellDamage");
        if (calc != null) {
            try {
                var v = Number(calc.apply(args[0], java.lang.Double.valueOf(Number(args[1]) || 0)));
                if (v > 0 && isFinite(v)) return v;
            } catch (eCalc) {}
        }
        var pp = readParticlePowerFromDisk(args[0]);
        var c = Number(args[1]) || 0;
        if (pp > 0 && c > 0) return pp * c;
    }
    if (method === "calcSpellCooldownMs") {
        var cdBridge = bridgeGet("gltcMage_calcSpellCooldownMs");
        if (cdBridge != null) {
            try {
                var cdList = new java.util.ArrayList();
                cdList.add(args[0]);
                cdList.add(java.lang.Long.valueOf(Math.floor(Number(args[1]) || 0)));
                cdList.add(java.lang.Integer.valueOf(Math.floor(Number(args[2]) || 0)));
                var cdv = Number(cdBridge.apply(cdList));
                if (cdv > 0 && isFinite(cdv)) return cdv;
            } catch (eCdBr) {}
        }
        var statsCd = bridgeGet("gltcMage_getTotalStats");
        if (statsCd != null) {
            try {
                var rawCd = statsCd.apply(args[0], java.lang.Boolean.TRUE);
                if (rawCd != null) {
                    var cardio = Number(rawCd.get("cardiovascular")) || 0;
                    return calcCooldownFromCardio(args[1], args[2], cardio);
                }
            } catch (eStCd) {}
        }
        var cardioDisk = readCardiovascularFromDisk(args[0]);
        if (cardioDisk > 0) return calcCooldownFromCardio(args[1], args[2], cardioDisk);
    }
    if (method === "getTotalStats") {
        var stats = bridgeGet("gltcMage_getTotalStats");
        if (stats != null) {
            try {
                var flag = args[1] !== false;
                return parseStatsRaw(stats.apply(args[0], flag ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE));
            } catch (eSt) {}
        }
    }
    if (method === "dealPulseDamage") {
        var pulse = bridgeGet("gltcMage_dealPulseDamage");
        if (pulse != null) {
            try {
                var list = new java.util.ArrayList();
                list.add(args[0]);
                list.add(java.lang.Double.valueOf(Number(args[1]) || 0));
                list.add(args[2]);
                pulse.accept(list);
                return true;
            } catch (ePu) {}
        }
    }
    var a = resolveMageApi();
    if (a == null) {
        try { loadDeps(); } catch (eLd) {}
        a = resolveMageApi();
    }
    if (a != null && a[method] != null) {
        try { return a[method].apply(a, args); } catch (e0) {}
    }
    return typeof fallback === "function" ? fallback.apply(null, args) : fallback;
}

function prepareCastApi(runtime) {
    if (resolveMageApi() == null && bridgeGet("gltcMage_calcSpellDamage") == null) {
        logMageDiag("prepare");
    }
    return {
        calcSpellDamage: function(player, coeff) {
            var c = Number(coeff) || 0;
            var v = mageCall("calcSpellDamage", [player, c], c);
            v = Number(v);
            if (v > 0 && isFinite(v)) return v;
            logMageDiag("calc");
            return c > 0 ? c : 0;
        },
        calcSpellCooldownMs: function(player, baseMs, erosion) {
            return mageCall("calcSpellCooldownMs", [player, baseMs, erosion], function() {
                var cd = Math.max(50, Math.floor(Number(baseMs) || 1000));
                var er = Math.floor(Number(erosion) || 0);
                if (er > 0) cd = Math.max(50, Math.floor(cd * er));
                return cd;
            });
        },
        getTotalStats: function(player, includeStaff) {
            var out = mageCall("getTotalStats", [player, includeStaff !== false], null);
            return out != null ? out : { mageLevel: 0, particlePower: 1 };
        },
        dealPulseDamage: function(target, amount, attacker) {
            return !!mageCall("dealPulseDamage", [target, amount, attacker], false);
        },
        spellRuntime: runtime,
        runtime: runtime,
        getSpellRuntime: function() {
            try { return runtime != null ? runtime : getRuntime(); } catch (e) { return runtime; }
        }
    };
}

function sharedRoot() {
    var rt = getRuntime();
    if (rt && rt.sharedRoot) {
        try {
            var fromRt = rt.sharedRoot();
            if (fromRt != null) return fromRt;
        } catch (e0) {}
    }
    // 禁止每次 new CHM()：会丢掉 cast_cd
    try {
        if (PLUGIN != null && PLUGIN.hasMetadata("gltc_shared_root_maps")) {
            var root = PLUGIN.getMetadata("gltc_shared_root_maps").get(0).value();
            if (root != null) return root;
        }
    } catch (e1) {}
    try {
        var api = evalScript("_gltcSharedRoot.js");
        if (api && api.getGltcSharedRoot) {
            var r = api.getGltcSharedRoot();
            if (r != null) return r;
        }
    } catch (e2) {}
    return new CHM();
}

function mapOf(key) {
    var rt = getRuntime();
    if (rt && rt.mapOf) {
        try {
            var fromRt = rt.mapOf(key);
            if (fromRt != null) return fromRt;
        } catch (eM) {}
    }
    var root = sharedRoot();
    var k = String(key);
    var existing = null;
    try { existing = root.get(k); } catch (eG) {}
    // 与运行时一致：已有条目一律复用，禁止 put 空 Map 覆盖 cast_cd
    if (existing != null) return existing;
    var created = new CHM();
    var raced = null;
    try { raced = root.putIfAbsent(k, created); } catch (ePut) {
        try { root.put(k, created); } catch (ePut2) {}
        return created;
    }
    return raced != null ? raced : created;
}

function castCdMap() { return mapOf("cast_cd"); }
function castCdMetaKey(spellId) { return "gltc_cast_cd|" + String(spellId); }
function staffUseMsMap() { return mapOf("staff_use_ms"); }
function staffHooksMap() { return mapOf("staff_hooks"); }
function lastMainStaffMap() { return mapOf("last_main_staff"); }
function castInFlightMap() { return mapOf("cast_in_flight"); }

function loadDeps() {
    if (_depsReady && STAFF_CFG && SPELL_CFG && RUNTIME) return true;
    _depsReady = false;
    getRuntime();
    if (RUNTIME == null) {
        try { RUNTIME = PLUGIN.gltcSpellRuntime; } catch (eRt) {}
    }
    // 术士：有桥即可；无桥时尝试绑定 boot 缓存的真实 API（勿把 bridge facade 钉进 holder）
    if (resolveMageApi() == null) {
        try {
            var cache = PLUGIN.gltcEvalCache;
            if (cache != null) {
                var cachedMage = cache.get("术士系统/核心.js");
                if (hasCalcSpellDamage(cachedMage)) rememberMageApi(cachedMage);
            }
        } catch (eCache) {}
    }
    ensureMageJavaBridges();
    var mageOk = resolveMageApi() != null;
    if (!STAFF_CFG) {
        try { if (PLUGIN.gltcStaffCfg != null) STAFF_CFG = PLUGIN.gltcStaffCfg; } catch (eS0) {}
        if (!STAFF_CFG) STAFF_CFG = evalScript("施术道具/登记.js");
        try { if (STAFF_CFG) PLUGIN.gltcStaffCfg = STAFF_CFG; } catch (eS1) {}
    }
    if (!SPELL_CFG) {
        try { if (PLUGIN.gltcSpellCfg != null) SPELL_CFG = PLUGIN.gltcSpellCfg; } catch (eP0) {}
        if (!SPELL_CFG) SPELL_CFG = evalScript("术式/登记.js");
        try { if (SPELL_CFG) PLUGIN.gltcSpellCfg = SPELL_CFG; } catch (eP1) {}
    }
    if (!SKILL_CORE_CFG) SKILL_CORE_CFG = evalScript("施术道具/技能核心登记.js");
    if (!SKILL_CFG) SKILL_CFG = evalScript("施术道具/技能登记.js");
    if (!GUI_API) GUI_API = evalScript("施术道具/施术GUI.js");
    if (!_guiListenersRegistered && GUI_API && GUI_API.registerListeners) {
        try {
            GUI_API.registerListeners(function() { return getGuiContext(); });
            _guiListenersRegistered = true;
        } catch (eG) {}
    }
    // 术士 API 尽力加载；缺失时 prepareCastApi 仍返回 facade，不挡施术入口
    _depsReady = !!(STAFF_CFG && SPELL_CFG && RUNTIME);
    if (!_depsReady) {
        try {
            if (!PLUGIN.gltcLoadDepsWarned) {
                PLUGIN.gltcLoadDepsWarned = true;
                Bukkit.getLogger().warning("[GLTC施术] loadDeps 未就绪 mage=" + mageOk
                    + " staff=" + !!STAFF_CFG + " spell=" + !!SPELL_CFG + " runtime=" + !!RUNTIME);
            }
        } catch (eW) {}
    } else if (!mageOk) {
        logMageDiag("loadDeps");
    }
    return _depsReady;
}

function getSfId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(stack);
        return sf != null ? String(sf.getId()) : null;
    } catch (e) { return null; }
}

function isMageStaffItem(stack) {
    if (!loadDeps()) return false;
    var id = getSfId(stack);
    return !!(id && STAFF_CFG.STAFF_REGISTRY[id]);
}

function staffDisplayLabel() {
    if (STAFF_CFG && STAFF_CFG.STAFF_DISPLAY_GRADIENT) return STAFF_CFG.STAFF_DISPLAY_GRADIENT;
    return "§bNTC外置粒子控制仪";
}

function stripColor(str) {
    return String(str).replace(/§x(§[0-9a-fA-F]){6}/g, "").replace(/§./g, "");
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

/** 播报/提示用：items.yml name 去前缀（保留颜色） */
function spellDisplayName(spellId, fallback) {
    try {
        if (SlimefunItem) {
            var sf = SlimefunItem.getById(String(spellId));
            if (sf) {
                var meta = sf.getItem().getItemMeta();
                if (meta && meta.hasDisplayName()) {
                    var short = shortItemDisplayName(String(meta.getDisplayName()));
                    if (short && stripColor(short).length > 0) return short;
                }
            }
        }
    } catch (e) {}
    if (fallback != null && String(fallback).length) return String(fallback);
    try {
        if (SPELL_CFG && SPELL_CFG.getSpellName) return String(SPELL_CFG.getSpellName(spellId) || spellId);
    } catch (e2) {}
    return spellId ? String(spellId) : "";
}

function requireSingleStaff(player) {
    try {
        var hand = player.getInventory().getItemInMainHand();
        if (!isMageStaffItem(hand)) return false;
        if (hand.getAmount() !== 1) {
            player.sendMessage(GLTC_PREFIX + C_MSG + staffDisplayLabel() + " §c数量必须为 1。");
            return false;
        }
        return true;
    } catch (e) { return false; }
}

function getStaffMeta(stack) {
    if (!loadDeps()) return null;
    var api = getStaffMetaApi();
    if (api && api.readStaffMeta) {
        return api.readStaffMeta(stack, STAFF_CFG, isMageStaffItem, SKILL_CORE_CFG);
    }
    return null;
}

function writeStaffMeta(stack, spells, selected) {
    var api = getStaffMetaApi();
    if (api && api.writeStaffMeta) return api.writeStaffMeta(stack, spells, selected);
    return false;
}

function setSelectedSpell(player, index) {
    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) return false;
    if (index < 0 || index >= data.capacity || !data.spells[index]) return false;
    data.selected = index;
    writeStaffMeta(hand, data.spells, data.selected);
    player.getInventory().setItemInMainHand(hand);
    // 打开 GUI 后再点同一术式也视为切换（会再走 onSelectSpell / 核心技能）
    notifyContext(player, data.spells[index], "switch");
    invokeHook(getStaffHooks(player), "onSelectSpell", player);
    return true;
}

function getSelectedSpellId(player) {
    var data = getStaffMeta(player.getInventory().getItemInMainHand());
    if (!data || data.selected < 0) return null;
    return data.spells[data.selected] || null;
}

function hookGet(hooks, key) {
    if (!hooks) return null;
    try {
        if (hooks.get != null) {
            var v = hooks.get(java.lang.String.valueOf(key));
            if (v != null) return v;
            v = hooks.get(key);
            if (v != null) return v;
        }
    } catch (e0) {}
    try { return hooks[key]; } catch (e1) { return null; }
}

function getStaffHooks(player) {
    // 权威：嵌入的技能核心 → 技能登记（核心技能_*.js）
    // 不再读取 staff_hooks Map（遗留法杖脚本写入无效）
    try {
        var data = getStaffMeta(player.getInventory().getItemInMainHand());
        if (!data || !data.skillCoreId) return null;
        if (!loadDeps() || !SKILL_CFG || !SKILL_CORE_CFG) return null;
        if (typeof SKILL_CFG.getHooksForCore !== "function") return null;
        var hooks = SKILL_CFG.getHooksForCore(data.skillCoreId, SKILL_CORE_CFG);
        if (!hooks) return null;
        return {
            onAfterCast: hookGet(hooks, "onAfterCast"),
            onSneakUse: hookGet(hooks, "onSneakUse"),
            onSelectSpell: hookGet(hooks, "onSelectSpell"),
            skillHint: hookGet(hooks, "skillHint")
        };
    } catch (e) { return null; }
}

/** @deprecated 遗留 API；当前施术不读 staff_hooks，请用核心技能_*.js */
function registerStaffHooks(staffId, hooks) {
    if (!staffId || !hooks) return false;
    staffHooksMap().put(java.lang.String.valueOf(String(staffId)), hooks);
    return true;
}

/** 核心技能 hook：与术式 cast 一致，注入 castApi（含 spellRuntime） */
function invokeHook(hooks, key, player) {
    if (!hooks) return;
    var fn = hookGet(hooks, key);
    if (fn == null) return;
    var castApi = null;
    try { castApi = prepareCastApi(getRuntime()); } catch (eApi) {}
    try {
        if (fn.accept != null) {
            var isBi = false;
            try {
                isBi = Java.type("java.util.function.BiConsumer").class.isInstance(fn);
            } catch (eBi) {}
            if (isBi) fn.accept(player, castApi);
            else fn.accept(player);
            return;
        }
    } catch (e0) {
        try { Bukkit.getLogger().warning("[GLTC施术] hook " + key + ": " + e0); } catch (eLog0) {}
        return;
    }
    try {
        fn(player, castApi);
    } catch (e1) {
        try {
            fn(player);
        } catch (e2) {
            try { Bukkit.getLogger().warning("[GLTC施术] hook " + key + ": " + e1); } catch (eLog1) {}
        }
    }
}

function notifyContext(player, keepSpellId, reason) {
    var rt = getRuntime();
    if (!rt || !rt.onContextChange) return;
    try { rt.onContextChange(player, keepSpellId || "", reason || "switch"); } catch (e) {}
}

function isSpellGuiOpen(player) {
    return GUI_API && GUI_API.isOpen && GUI_API.isOpen(player);
}

function getGuiContext() {
    loadDeps();
    return {
        SPELL_CFG: SPELL_CFG,
        getStaffMeta: getStaffMeta,
        getStaffHooks: getStaffHooks,
        setSelectedSpell: setSelectedSpell,
        onGuiOpen: function(player) {
            notifyContext(player, "", "gui");
        }
    };
}

function openSpellGui(player) {
    if (!loadDeps() || !GUI_API) return false;
    return GUI_API.open(player, getGuiContext()) === true;
}

function getMaxHealth(player) {
    try {
        var attr = player.getAttribute(Java.type("org.bukkit.attribute.Attribute").GENERIC_MAX_HEALTH);
        if (attr != null) return Number(attr.getValue());
    } catch (e0) {}
    try { return Number(player.getMaxHealth()); } catch (e1) {}
    return 20;
}

function resolveCastCost(player, spell) {
    var level = 0;
    try {
        var statsBr = bridgeGet("gltcMage_getTotalStats");
        if (statsBr != null) {
            var raw = statsBr.apply(player, java.lang.Boolean.TRUE);
            if (raw != null) level = Number(raw.get("mageLevel")) || 0;
        }
        if (level <= 0) {
            var api = resolveMageApi();
            if (api != null && api.getTotalStats != null) {
                var stats = api.getTotalStats(player, true);
                level = Number(stats.mageLevel) || 0;
            }
        }
        if (level <= 0) level = readMageLevelFromDisk(player);
    } catch (e) {}
    var ring = Number(spell.ring) || 1;
    var erosion = ring > level ? (ring - level) : 0;
    return { erosion: erosion, level: level, ring: ring };
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

function readCastCdEndMs(player, spellId) {
    var endMs = 0;
    // 1) 玩家 Metadata：不依赖共享根，Graal 跨上下文最稳
    try {
        var mk = castCdMetaKey(spellId);
        if (player != null && player.hasMetadata(mk)) {
            var metaEnd = readEpochMs(player.getMetadata(mk).get(0).value());
            if (metaEnd > endMs) endMs = metaEnd;
        }
    } catch (e0) {}
    // 2) 共享根 cast_cd（镜像；存字符串避免 Number(Java Long) 读失败）
    try {
        var uuid = String(player.getUniqueId().toString());
        var key = jUuid(uuid + "|" + spellId);
        var prev = castCdMap().get(key);
        if (prev != null) {
            var mapEnd = readEpochMs(prev);
            if (mapEnd > endMs) endMs = mapEnd;
        }
    } catch (e1) {}
    return endMs;
}

function writeCastCdEndMs(player, spellId, untilMs) {
    var until = Math.floor(Number(untilMs) || 0);
    var untilStr = String(until);
    try {
        if (player != null && FixedMetadataValue != null && PLUGIN != null) {
            player.setMetadata(castCdMetaKey(spellId), new FixedMetadataValue(PLUGIN, untilStr));
        }
    } catch (e0) {}
    try {
        var uuid = String(player.getUniqueId().toString());
        var key = jUuid(uuid + "|" + spellId);
        castCdMap().put(key, java.lang.String.valueOf(untilStr));
    } catch (e1) {}
}

function clearCastCd(player, spellId) {
    try {
        if (player != null && PLUGIN != null) {
            player.removeMetadata(castCdMetaKey(spellId), PLUGIN);
        }
    } catch (e0) {}
    try {
        var uuid = String(player.getUniqueId().toString());
        castCdMap().remove(jUuid(uuid + "|" + spellId));
    } catch (e1) {}
}

function checkCastCooldown(player, spellId, baseMs, write, erosion) {
    var now = Date.now();
    var cd = mageCall("calcSpellCooldownMs", [player, baseMs, erosion], function() {
        return Math.max(50, Math.floor(Number(baseMs) || 1000));
    });
    cd = Math.max(50, Math.floor(Number(cd) || 1000));
    var endMs = readCastCdEndMs(player, spellId);
    var left = endMs - now;
    if (left > 0) return { ok: false, left: left };
    if (write) writeCastCdEndMs(player, spellId, now + cd);
    return { ok: true, left: 0, cd: cd };
}

function applyErosionSelfDamage(player, erosion, spellName) {
    if (!(erosion > 0)) return;
    var amt = getMaxHealth(player) * EROSION_HP_PCT * erosion;
    var rt = getRuntime();
    if (rt && rt.dealPulseSpellDamage) {
        rt.dealPulseSpellDamage(player, amt, player, {
            name: spellName || "侵蚀",
            kind: "erosion",
            damageType: "pulse"
        });
    }
}

function mageReadyForCast() {
    return resolveMageApi() != null || bridgeGet("gltcMage_calcSpellDamage") != null;
}

function tryCast(player) {
    if (!loadDeps()) return { ok: false };
    if (!requireSingleStaff(player)) return { ok: false };
    if (isSpellGuiOpen(player)) return { ok: false };
    if (player.isSneaking()) return { ok: false };

    var uuid = String(player.getUniqueId().toString());
    var flight = castInFlightMap();
    try {
        var raced = flight.putIfAbsent(jUuid(uuid), toJavaLong(Date.now()));
        if (raced != null) return { ok: false };
    } catch (eL) { return { ok: false }; }

    try {
        var hand = player.getInventory().getItemInMainHand();
        var data = getStaffMeta(hand);
        if (!data) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "无法读取 " + staffDisplayLabel() + " §c数据。");
            return { ok: false };
        }
        var spellId = data.selected >= 0 ? data.spells[data.selected] : null;
        if (!spellId) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "当前未选择术式。");
            return { ok: false };
        }
        if (data.capacity <= 0) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "未嵌入施术技能核心，无法施术。");
            return { ok: false };
        }
        var spell = SPELL_CFG.getSpell(spellId);
        if (!spell || spell.cast == null) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "未知术式：" + spellId);
            return { ok: false };
        }
        var resolved = resolveCastCost(player, spell);
        var cd = checkCastCooldown(player, spellId, spell.cooldownMs || 1000, false, resolved.erosion);
        if (!cd.ok) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "冷却中 §7(" + Math.ceil(cd.left / 100) / 10 + "s)");
            return { ok: false };
        }
        checkCastCooldown(player, spellId, spell.cooldownMs || 1000, true, resolved.erosion);
        notifyContext(player, String(spellId), "cast");

        var castOk = false;
        try {
            var runtime = getRuntime();
            if (!runtime) {
                Bukkit.getLogger().warning("[GLTC施术] 运行时未就绪，无法施展 " + spellId);
                clearCastCd(player, spellId);
                player.sendMessage(GLTC_PREFIX + C_MSG + "§c施术系统未就绪，请稍后重试。");
                return { ok: false };
            }
            // prepareCastApi 每次现读术士/Java桥；缺桥时仍有系数回退，禁止硬拦施术
            var castApi = prepareCastApi(runtime);
            if (!mageReadyForCast()) {
                try { logMageDiag("cast"); } catch (eDiag) {}
            }
            var ret = spell.cast(player, castApi);
            castOk = (ret !== false && ret !== 0);
        } catch (e) {
            Bukkit.getLogger().warning("[GLTC施术] 术式异常 " + spellId + ": " + e);
        }
        if (!castOk) {
            clearCastCd(player, spellId);
            player.sendMessage(GLTC_PREFIX + C_MSG + "施术失败。");
            return { ok: false };
        }
        var spellName = spellDisplayName(spellId, spell.name || spellId);
        if (resolved.erosion > 0) applyErosionSelfDamage(player, resolved.erosion, spellName);
        // 命中播报由运行时 announceSpellHit 负责；此处仅 ActionBar 短确认，避免双重「成功施展」
        try { player.sendActionBar(C_MSG + "已施展 " + spellName); } catch (eAb) {
            try { player.sendMessage(GLTC_PREFIX + C_MSG + "已施展 " + spellName); } catch (eMsg) {}
        }
        invokeHook(getStaffHooks(player), "onAfterCast", player);
        return { ok: true, spellId: spellId };
    } finally {
        try { flight.remove(jUuid(uuid)); } catch (eF) {}
    }
}

function staffUseDebounced(player) {
    var key = jUuid(String(player.getUniqueId().toString()));
    var now = Date.now();
    var prev = staffUseMsMap().get(key);
    if (prev != null && now - readEpochMs(prev) < STAFF_USE_DEBOUNCE_MS) return false;
    try { staffUseMsMap().put(key, toJavaLong(now)); } catch (e) {}
    return true;
}

function handleStaffUse(player, opts) {
    if (!player || !(player instanceof Player)) return false;
    if (!loadDeps()) {
        try {
            player.sendMessage(GLTC_PREFIX + C_MSG + "§c施术系统未就绪，请稍后重试或联系管理重载插件。");
        } catch (e0) {}
        return false;
    }
    if (!requireSingleStaff(player)) return false;
    if (!staffUseDebounced(player)) return false;
    if (player.isSneaking()) {
        var opened = openSpellGui(player);
        if (opened) invokeHook(getStaffHooks(player), "onSneakUse", player);
        return true;
    }
    tryCast(player);
    return true;
}

function handleStaffLeftClick(player) {
    if (!player || !(player instanceof Player)) return false;
    if (!loadDeps()) return false;
    if (!requireSingleStaff(player)) return true;
    if (isSpellGuiOpen(player)) return true;
    if (player.isSneaking()) {
        var opened = openSpellGui(player);
        if (opened) invokeHook(getStaffHooks(player), "onSneakUse", player);
        return true;
    }
    var rt = getRuntime();
    if (rt && rt.dispatchLeftClick) rt.dispatchLeftClick(player);
    return true;
}

function syncStaffHoldState(player, reasonIfLost) {
    if (!player) return;
    var uuid = String(player.getUniqueId().toString());
    var holding = false;
    try {
        var hand = player.getInventory().getItemInMainHand();
        holding = isMageStaffItem(hand) && hand.getAmount() === 1;
    } catch (e0) {}
    var map = lastMainStaffMap();
    var was = false;
    try {
        var prev = map.get(jUuid(uuid));
        was = prev != null && (prev === true || prev === java.lang.Boolean.TRUE);
    } catch (eWas) {}
    try { map.put(jUuid(uuid), holding ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE); } catch (ePut) {}
    if (was && !holding) {
        if (isSpellGuiOpen(player) && GUI_API && GUI_API.scheduleClose) GUI_API.scheduleClose(player);
        notifyContext(player, "", reasonIfLost || "hold");
    }
}

function ensureListeners(force) {
    if (_listenersReady && !force) return;
    loadDeps();
    try {
        if (PLUGIN.gltcSpellCoreListenerV2 != null) {
            try { PlayerInteractEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListenerV2); } catch (e0) {}
            try { EntityDamageByEntityEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListenerV2); } catch (e1) {}
            try { PlayerQuitEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListenerV2); } catch (e2) {}
            try { PlayerItemHeldEvent.getHandlerList().unregister(PLUGIN.gltcSpellCoreListenerV2); } catch (e3) {}
        }
    } catch (eU) {}

    var ListenerClass = Java.extend(Listener, {});
    var listener = new ListenerClass();
    try {
        PLUGIN.gltcSpellCoreListenerV2 = listener;
        PLUGIN.gltcSpellCoreListenerVer = SPELL_CORE_LISTENER_VER;
        PLUGIN.gltcSpellCoreListener = listener;
    } catch (eL) {}

    Bukkit.getPluginManager().registerEvent(
        PlayerInteractEvent, listener, EventPriority.HIGH,
        function(l, event) {
            try {
                if (event.getHand() != null && event.getHand() !== EquipmentSlot.HAND) return;
                var who = event.getPlayer();
                if (!(who instanceof Player)) return;
                // 先识别法杖，避免误取消其它物品
                if (!isMageStaffItem(who.getInventory().getItemInMainHand())) return;
                var actionName = String(event.getAction().name());
                var isLeft = actionName === "LEFT_CLICK_AIR" || actionName === "LEFT_CLICK_BLOCK";
                var isRight = actionName === "RIGHT_CLICK_AIR" || actionName === "RIGHT_CLICK_BLOCK";
                if (!isLeft && !isRight) return;

                event.setCancelled(true);
                try {
                    if (EventResult != null) {
                        event.setUseItemInHand(EventResult.DENY);
                        event.setUseInteractedBlock(EventResult.DENY);
                    }
                } catch (eDeny) {}

                if (isLeft) {
                    handleStaffLeftClick(who);
                    return;
                }
                // 右键：施展 / 蹲下开 GUI（与 通用施术.js onUse 双入口，防抖合并）
                handleStaffUse(who, { from: "interact" });
            } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC施术] interact: " + e); } catch (e2) {}
            }
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        EntityDamageByEntityEvent, listener, EventPriority.NORMAL,
        function(l, event) {
            try {
                if (event.isCancelled()) return;
                var damager = event.getDamager();
                if (!(damager instanceof Player)) return;
                if (!isMageStaffItem(damager.getInventory().getItemInMainHand())) return;
                if (!requireSingleStaff(damager)) return;
                if (damager.isSneaking()) return;
                if (isSpellGuiOpen(damager)) return;
                var rt = getRuntime();
                if (rt && rt.dispatchLeftClick && rt.dispatchLeftClick(damager)) event.setCancelled(true);
            } catch (eDmg) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerQuitEvent, listener, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                notifyContext(p, "", "quit");
                lastMainStaffMap().remove(jUuid(String(p.getUniqueId().toString())));
                try {
                    var rtQ = getRuntime();
                    if (rtQ && typeof rtQ.purgePlayerRuntimeState === "function") {
                        rtQ.purgePlayerRuntimeState(p);
                    }
                } catch (ePurge) {}
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerItemHeldEvent, listener, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                Bukkit.getScheduler().runTask(PLUGIN, function() {
                    try {
                        // 放下法杖时 sync 会 notify(hold) 清会话；勿再二次 hotbar 全清
                        syncStaffHoldState(p, "hotbar");
                    } catch (e2) {}
                });
            } catch (e) {}
        }, PLUGIN
    );

    _listenersReady = true;
    try {
        if (!PLUGIN.gltcSpellCoreListenLogged) {
            PLUGIN.gltcSpellCoreListenLogged = true;
            Bukkit.getLogger().info("[GLTC施术] 核心 v2 已挂载交互：右键施展 / 蹲下开GUI / 左键二次操作");
        }
    } catch (eLog) {
        Bukkit.getLogger().info("[GLTC施术] 核心 v2 已挂载交互：右键施展 / 蹲下开GUI / 左键二次操作");
    }
}

({
    handleStaffUse: handleStaffUse,
    handleStaffLeftClick: handleStaffLeftClick,
    ensureListeners: ensureListeners,
    attachBridges: attachBridges,
    getStaffUseConsumer: getStaffUseConsumer,
    registerStaffHooks: registerStaffHooks,
    getStaffMeta: getStaffMeta,
    writeStaffMeta: writeStaffMeta,
    setSelectedSpell: setSelectedSpell,
    isMageStaffItem: isMageStaffItem,
    getRuntime: getRuntime,
    bindRuntime: bindRuntime,
    bindMageApi: bindMageApi,
    getMageApi: resolveMageApi,
    tryCast: tryCast,
    openSpellGui: openSpellGui,
    notifyContext: notifyContext
});
