/**
 * 施术核心（施术 GUI）— 工作区.yml 规范
 * - 蹲下右键 / 蹲下左键：打开施术 GUI；开 GUI 时触发护身技（若有）
 * - 打开 GUI：清理当前术式逻辑与[未投射]残留；[已投射]保留
 * - GUI 内点击术式 → 确认选择并关闭
 * - 站立右键：施展当前选中术式（冷却 × 心血管强度；侵蚀时 CD × 侵蚀等级）
 * - 站立左键：当前术式额外效果
 * - 所有术式相关操作须主手持施术道具（数量=1）
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Player = Java.type("org.bukkit.entity.Player");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var _EDBE_GET_DAMAGER = (function () {
    try { return EntityDamageByEntityEvent.getMethod("getDamager"); } catch (e) { return null; }
})();
function damageByEntityDamager(event) {
    if (event == null) return null;
    try {
        if (!(event instanceof EntityDamageByEntityEvent)) return null;
    } catch (e0) { return null; }
    if (_EDBE_GET_DAMAGER != null) {
        try { return _EDBE_GET_DAMAGER.invoke(event); } catch (e1) {}
    }
    try { return event.getDamager(); } catch (e2) {}
    return null;
}
var PlayerSwapHandItemsEvent = Java.type("org.bukkit.event.player.PlayerSwapHandItemsEvent");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var C_MSG = "§x§f§f§f§5§b§3";
var C_SPELL = "§x§6§2§c§6§f§f";

var KEY_SPELLS = new NamespacedKey("gltc", "staff_spells");
var KEY_SELECTED = new NamespacedKey("gltc", "staff_selected");

var STAFF_USE_DEBOUNCE_MS = 120;
var EROSION_HP_PCT = 0.2;
var META_STAFF_USE_AT = "gltc_staff_use_at";

var MAGE_API = null;
var STAFF_CFG = null;
var SPELL_CFG = null;
var GUI_API = null;
var SPELL_SESSION_API = null;
var SPELL_UTIL = null;
var _depsReady = false;
var _guiListenersRegistered = false;
var _SlimefunItemClass = null;
var _AttrGenericMaxHealth = null;
var _AttrMaxHealth = null;
var pendingCtxMap = sharedConcurrentMap("gltc_spell_pending_ctx");
var pendingCtxTaskMap = sharedConcurrentMap("gltc_spell_pending_ctx_task");
var FixedMetadataValue = null;
try { FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue"); } catch (eMeta) {}
var EventResult = null;
try { EventResult = Java.type("org.bukkit.event.Event$Result"); } catch (eRes) {}

function sharedConcurrentMap(field) {
    try {
        var existing = PLUGIN[field];
        if (existing != null && (existing instanceof java.util.concurrent.ConcurrentHashMap)) {
            return existing;
        }
    } catch (e0) {}
    var map = new java.util.concurrent.ConcurrentHashMap();
    try { PLUGIN[field] = map; } catch (e1) {}
    return map;
}

var castCdMap = sharedConcurrentMap("gltc_cast_cd_map");
var staffUseTickMap = sharedConcurrentMap("gltc_staff_use_tick");
var staffUseMsMap = sharedConcurrentMap("gltc_staff_use_ms");
var staffInteractTickMap = sharedConcurrentMap("gltc_staff_interact_use_tick");
var castInFlightMap = sharedConcurrentMap("gltc_cast_in_flight");
var lastMainStaffMap = sharedConcurrentMap("gltc_last_main_staff_map");

function mapUuidKey(uuid) {
    return java.lang.String.valueOf(String(uuid));
}

function sharedStaffHooksMap() {
    return sharedConcurrentMap("gltc_staff_hooks_map");
}

function asPlayerConsumer(fn) {
    if (fn == null) return null;
    try { if (fn.accept != null) return fn; } catch (e0) {}
    try { if (fn instanceof java.util.function.Consumer) return fn; } catch (e1) {}
    try {
        return new (Java.extend(java.util.function.Consumer, {
            accept: function(p) {
                try { fn(p); } catch (e) {
                    try { Bukkit.getLogger().warning("[GLTC施术] staffHook: " + e); } catch (e2) {}
                }
            }
        }))();
    } catch (e3) { return null; }
}

function invokeStaffConsumer(consumer, player) {
    if (consumer == null || player == null) return;
    try { consumer.accept(player); return; } catch (e0) {}
    try { consumer(player); } catch (e1) {
        try { Bukkit.getLogger().warning("[GLTC施术] staffHook invoke: " + e1); } catch (e2) {}
    }
}

function setMetaLong(player, key, value) {
    try {
        if (FixedMetadataValue == null) return false;
        player.setMetadata(key, new FixedMetadataValue(PLUGIN, Number(value)));
        return true;
    } catch (e) {}
    return false;
}

var HUIMO_STAFF_ID = "VASA_辉墨摇篮";
var HUIMO_ABILITY_CD_MS = 30000;
var HUIMO_CD_MAP_KEY = "gltc_huimo_ability_cd";
var RSC = null;
try { RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer"); } catch (eRsc) {}

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

function huimoAbilityCdMap() {
    var root = getSharedRoot();
    if (root == null) return null;
    var existing = root.get(HUIMO_CD_MAP_KEY);
    if (existing != null) return existing;
    var map = new java.util.concurrent.ConcurrentHashMap();
    var prev = root.putIfAbsent(HUIMO_CD_MAP_KEY, map);
    return prev != null ? prev : map;
}

function readMapTimestamp(v) {
    if (v == null) return NaN;
    try {
        if (typeof v.longValue === "function") return Number(v.longValue());
    } catch (e0) {}
    try { return Number(v); } catch (e1) {}
    return NaN;
}

function isHuimoAbilityOnCd(player) {
    if (!player) return false;
    try {
        if (getSfId(player.getInventory().getItemInMainHand()) !== HUIMO_STAFF_ID) return false;
        var map = huimoAbilityCdMap();
        if (map == null) return false;
        var last = map.get(mapUuidKey(String(player.getUniqueId().toString())));
        if (last == null) return false;
        var ts = readMapTimestamp(last);
        if (!isFinite(ts)) return false;
        return (Date.now() - ts) < HUIMO_ABILITY_CD_MS;
    } catch (e) { return false; }
}

function huimoAbilityCdLeftSec(player) {
    if (!player) return 1;
    try {
        var map = huimoAbilityCdMap();
        if (map == null) return 1;
        var ts = readMapTimestamp(map.get(mapUuidKey(String(player.getUniqueId().toString()))));
        if (!isFinite(ts)) return 1;
        return Math.max(1, Math.ceil((HUIMO_ABILITY_CD_MS - (Date.now() - ts)) / 1000));
    } catch (e) { return 1; }
}

function markHuimoAbilityCd(player) {
    if (!player) return;
    try {
        var map = huimoAbilityCdMap();
        if (map == null) return;
        var now = java.lang.Long.parseLong(String(Math.floor(Date.now())), 10);
        map.put(mapUuidKey(String(player.getUniqueId().toString())), now);
    } catch (e) {}
}

/** 辉墨摇篮「光影废墟」：从 Java 宿主桥调用，勿用跨上下文 Consumer/JS 函数 */
function dispatchHuimoSneakAbility(player) {
    if (!player || !(player instanceof Player)) return;
    try {
        if (getSfId(player.getInventory().getItemInMainHand()) !== HUIMO_STAFF_ID) return;
    } catch (eId) { return; }
    if (isHuimoAbilityOnCd(player)) {
        var left = huimoAbilityCdLeftSec(player);
        try { player.sendActionBar("§8光影废墟冷却中… §e" + left + "§7s"); } catch (eA) {}
        return;
    }

    var activator = null;
    try {
        if (RSC != null && RSC.INSTANCE != null) activator = RSC.INSTANCE.gltcHuimoActivateBridge;
    } catch (eInst) {}
    if (activator == null) {
        try {
            var root = getSharedRoot();
            if (root != null) activator = root.get("gltc_huimo_activator");
        } catch (eRoot) {}
    }
    if (activator == null) {
        try { activator = PLUGIN.gltcHuimoActivateBridge; } catch (ePl) {}
    }
    if (activator != null) {
        try {
            activator.activate(player);
            return;
        } catch (eAct) {
            try { Bukkit.getLogger().warning("[GLTC施术] huimoActivate: " + eAct); } catch (eLog) {}
        }
    }
    try {
        Bukkit.getLogger().warning("[GLTC施术] 辉墨摇篮 activator 未注册，光影废墟未触发（请重载插件）");
    } catch (eWarn) {}
}

/** 辉墨摇篮开 GUI 时触发光影废墟 */
function grantStaffSneakAbilityToken(player) {
    if (!player) return;
    try { setMetaLong(player, "gltc_staff_sneak_ability_token", Date.now()); } catch (eTok) {}
    dispatchHuimoSneakAbility(player);
}

function currentServerTick() {
    try { return Number(Bukkit.getCurrentTick()); } catch (e0) {}
    try { return Number(Bukkit.getServer().getCurrentTick()); } catch (e1) {}
    return -1;
}

function isInteractReadyFlag() {
    try {
        var f = PLUGIN.gltcSpellCoreInteractReady;
        if (f === true) return true;
        if (f != null && typeof f.booleanValue === "function" && f.booleanValue()) return true;
    } catch (e0) {}
    return false;
}

function isStaffUseHandledByInteract() {
    if (isInteractReadyFlag()) return true;
    try { return PLUGIN.gltcSpellCoreListener != null; } catch (e) {}
    return false;
}

function shouldSkipStaffOnUse(player) {
    if (isStaffUseHandledByInteract()) return true;
    if (!player) return false;
    try {
        var gk = mapUuidKey(String(player.getUniqueId().toString()));
        var tick = currentServerTick();
        if (tick >= 0) {
            var lastTick = staffInteractTickMap.get(gk);
            if (lastTick != null && Number(lastTick) === tick) return true;
        }
        var lastMs = staffUseMsMap.get(gk);
        if (lastMs != null && Date.now() - Number(lastMs) < STAFF_USE_DEBOUNCE_MS) return true;
    } catch (e0) {}
    return false;
}

function markStaffInteractHandled(player) {
    if (!player) return;
    try {
        var gk = mapUuidKey(String(player.getUniqueId().toString()));
        var tick = currentServerTick();
        if (tick >= 0) {
            var tv = java.lang.Long.parseLong(String(Math.floor(tick)), 10);
            staffInteractTickMap.put(gk, tv);
        }
        setMetaLong(player, META_STAFF_USE_AT, Date.now());
    } catch (e) {}
}

function shouldClickDebounce(player) {
    if (!player) return true;
    var gk = mapUuidKey(String(player.getUniqueId().toString()));
    var now = Date.now();
    try {
        var lastMs = staffUseMsMap.get(gk);
        if (lastMs != null && now - Number(lastMs) < STAFF_USE_DEBOUNCE_MS) return true;
    } catch (e0) {}
    try {
        var tick = currentServerTick();
        if (tick >= 0) {
            var lastTick = staffUseTickMap.get(gk);
            if (lastTick != null && Number(lastTick) === tick) return true;
        }
    } catch (e1) {}
    staffUseMsMap.put(gk, java.lang.Long.parseLong(String(Math.floor(now)), 10));
    try {
        var debTick = currentServerTick();
        if (debTick >= 0) {
            staffUseTickMap.put(gk, java.lang.Long.parseLong(String(Math.floor(debTick)), 10));
        }
    } catch (eTick) {}
    return false;
}

function registerStaffHooks(staffId, hooks) {
    if (!staffId || !hooks) return;
    try {
        var map = sharedStaffHooksMap();
        var id = String(staffId);
        if (hooks.onSneakUse != null) {
            var sneak = asPlayerConsumer(hooks.onSneakUse);
            if (sneak != null) map.put(id + "|sneak", sneak);
        }
        if (hooks.onAfterCast != null) {
            var after = asPlayerConsumer(hooks.onAfterCast);
            if (after != null) map.put(id + "|after", after);
        }
        if (hooks.skillHint) map.put(id + "|hint", String(hooks.skillHint));
    } catch (e) {
        try { Bukkit.getLogger().warning("[GLTC施术] registerStaffHooks: " + e); } catch (e2) {}
    }
}

function getStaffHooksFor(player) {
    try {
        var hand = player.getInventory().getItemInMainHand();
        var id = getSfId(hand);
        if (!id) return {};
        var map = sharedStaffHooksMap();
        return {
            onSneakUse: map.get(String(id) + "|sneak"),
            onAfterCast: map.get(String(id) + "|after"),
            skillHint: map.get(String(id) + "|hint")
        };
    } catch (e) {}
    return {};
}

function mergeStaffOpts(player, opts) {
    var base = getStaffHooksFor(player) || {};
    opts = opts || {};
    var sneak = null;
    var after = null;
    try {
        if (opts.onSneakUse != null) sneak = asPlayerConsumer(opts.onSneakUse) || opts.onSneakUse;
        else sneak = base.onSneakUse;
    } catch (e0) {}
    try {
        if (opts.onAfterCast != null) after = asPlayerConsumer(opts.onAfterCast) || opts.onAfterCast;
        else after = base.onAfterCast;
    } catch (e1) {}
    return { onSneakUse: sneak, onAfterCast: after, skillHint: base.skillHint };
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

function evalScriptExport(rel) {
    var file = findScriptFile(rel);
    if (!file) return null;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        return (0, eval)(code);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC施术] 加载失败 " + rel + ": " + e);
        return null;
    }
}

function loadDeps() {
    if (_depsReady) return true;
    if (!MAGE_API) {
        MAGE_API = evalScriptExport("术士系统/核心.js");
        try { if (MAGE_API) PLUGIN.gltcMageApi = MAGE_API; } catch (e1) {}
    }
    if (!STAFF_CFG) STAFF_CFG = evalScriptExport("施术道具/登记.js");
    if (!SPELL_CFG) SPELL_CFG = evalScriptExport("术式/登记.js");
    if (!GUI_API) GUI_API = evalScriptExport("施术道具/施术GUI.js");
    ensureSpellSessionApi();
    ensureSpellUtil();
    if (!_guiListenersRegistered && GUI_API) {
        try {
            if (GUI_API.registerListeners != null) GUI_API.registerListeners(getGuiContextProvider);
            _guiListenersRegistered = true;
        } catch (eGui) {}
    }
    _depsReady = !!(MAGE_API && STAFF_CFG && SPELL_CFG);
    return _depsReady;
}

/** 本上下文只 eval 一次 _工具.js */
function ensureSpellUtil() {
    if (SPELL_UTIL != null) return SPELL_UTIL;
    SPELL_UTIL = evalScriptExport("术式/_工具.js");
    try {
        if (SPELL_UTIL && typeof SPELL_UTIL.ensureSpellDamageListener === "function") {
            SPELL_UTIL.ensureSpellDamageListener();
        }
    } catch (eDmg) {}
    return SPELL_UTIL;
}

/** 本上下文只 eval 一次；勿从 PLUGIN 取跨上下文 API 对象 */
function ensureSpellSessionApi() {
    if (SPELL_SESSION_API != null) return SPELL_SESSION_API;
    var util = ensureSpellUtil();
    if (util && util.spellSession) {
        SPELL_SESSION_API = util.spellSession;
        try { PLUGIN.gltcSpellSessionApi = SPELL_SESSION_API; } catch (e1) {}
    }
    return SPELL_SESSION_API;
}

function invokeSessionMethod(method, args) {
    var api = ensureSpellSessionApi();
    if (api == null) return null;
    try {
        var fn = api[method];
        if (fn == null) return null;
        if (args.length === 0) return fn();
        if (args.length === 1) return fn(args[0]);
        if (args.length === 2) return fn(args[0], args[1]);
        if (args.length === 3) return fn(args[0], args[1], args[2]);
        return fn.apply(api, args);
    } catch (e) {
        return null;
    }
}

function invokeSessionBridgeContextChange(player, keep, reason) {
    try {
        var bridge = PLUGIN.gltcSpellSessionBridge;
        if (bridge != null) {
            bridge.onContextChange(player, keep, reason);
            return true;
        }
    } catch (eB) {}
    return false;
}

function invokeSessionBridgeClear(player, onlySpellId, exceptSpellId, reason) {
    try {
        var bridge = PLUGIN.gltcSpellSessionBridge;
        if (bridge != null) {
            bridge.clearForPlayer(
                player,
                onlySpellId != null ? String(onlySpellId) : "",
                exceptSpellId != null ? String(exceptSpellId) : "",
                reason != null ? String(reason) : "manual"
            );
            return true;
        }
    } catch (eB) {}
    return false;
}

function getGuiContextProvider() {
    return {
        getStaffMeta: getStaffMeta,
        setSelectedSpell: setSelectedSpell,
        notifySpellContextChange: notifySpellContextChange,
        scheduleNotifySpellContextChange: scheduleNotifySpellContextChange,
        getStaffHooks: getStaffHooksFor,
        SPELL_CFG: SPELL_CFG,
        STAFF_CFG: STAFF_CFG
    };
}

function openSpellGui(player) {
    if (!loadDeps() || !GUI_API) return false;
    try {
        return GUI_API.open(player, getGuiContextProvider());
    } catch (eOpen) {
        return false;
    }
}

function isSpellGuiOpen(player) {
    if (GUI_API && typeof GUI_API.isGuiOpen === "function") return GUI_API.isGuiOpen(player);
    return false;
}

function getSpellSessionApi() {
    return ensureSpellSessionApi();
}

function notifySpellContextChange(player, keepSpellId, reason) {
    var keep = keepSpellId ? String(keepSpellId) : "";
    var r = reason || "switch";
    if (!invokeSessionBridgeContextChange(player, keep, r)) {
        try { invokeSessionMethod("onContextChange", [player, keep, r]); } catch (e) {}
    }
    try { directClearKnownSpellFx(player, keepSpellId); } catch (e3) {}
}

/** 合并同一 tick 内多次 context 变更（开 GUI + 切术只执行一次 switch） */
function scheduleNotifySpellContextChange(player, keepSpellId, reason) {
    if (!player || !(player instanceof Player)) return;
    var keep = keepSpellId ? String(keepSpellId) : "";
    var r = reason || "switch";
    var key = mapUuidKey(String(player.getUniqueId().toString()));
    try {
        var prev = pendingCtxMap.get(key);
        if (prev != null && prev.reason === "switch" && r === "gui") return;
    } catch (ePrev) {}
    try {
        pendingCtxMap.put(key, { keep: keep, reason: r });
    } catch (ePut) {}
    try {
        if (pendingCtxTaskMap.containsKey(key)) return;
        pendingCtxTaskMap.put(key, java.lang.Boolean.TRUE);
    } catch (eTask) { return; }
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try { pendingCtxTaskMap.remove(key); } catch (eRm) {}
            var job = null;
            try { job = pendingCtxMap.remove(key); } catch (eGet) {}
            if (!job || !player.isOnline()) return;
            notifySpellContextChange(player, job.keep, job.reason);
        });
    } catch (eSch) {
        try { pendingCtxTaskMap.remove(key); } catch (eRm2) {}
        notifySpellContextChange(player, keep, r);
    }
}

function cancelPendingSpellContextChange(player) {
    if (!player) return;
    var key = mapUuidKey(String(player.getUniqueId().toString()));
    try { pendingCtxMap.remove(key); } catch (e0) {}
}

function invokeDirectClearHook(spellId, player) {
    if (!spellId || !player) return;
    try {
        var store = PLUGIN.gltc_spell_direct_clear_hooks;
        if (store == null) return;
        var ent = store.get(String(spellId));
        if (ent == null) return;
        if (ent.clear != null) ent.clear(player);
        else if (typeof ent === "function") ent(player);
    } catch (e) {}
}

function invokeSessionBridgeLeftClick(player, spellId) {
    try {
        var bridge = PLUGIN.gltcSpellSessionBridge;
        if (bridge != null) {
            if (bridge.dispatchActiveLeftClick != null && bridge.dispatchActiveLeftClick(player)) return true;
            if (bridge.handleLeftClickWithSpellId != null) {
                return bridge.handleLeftClickWithSpellId(player, spellId != null ? String(spellId) : "") === true;
            }
        }
    } catch (eB) {}
    return false;
}

function scheduleClosePlayerInventory(player) {
    if (!player || !(player instanceof Player)) return;
    try {
        Bukkit.getScheduler().runTask(PLUGIN, function() {
            try { if (player.isOnline()) player.closeInventory(); } catch (e) {}
        });
    } catch (eSch) {
        try { player.closeInventory(); } catch (e) {}
    }
}

function directClearKnownSpellFx(player, keepSpellId) {
    if (!player) return;
    var uuid = String(player.getUniqueId().toString());
    var keep = keepSpellId ? String(keepSpellId) : "";
    if (keep !== "VASA_花如画卷") {
        invokeDirectClearHook("VASA_花如画卷", player);
    }
    if (keep !== "VASA_庇护脉络") {
        try {
            var aura = PLUGIN.gltc_bihu_aura_store;
            if (aura != null) {
                var auraKey = java.lang.String.valueOf(uuid);
                var st = null;
                try { st = aura.remove(auraKey); } catch (eAk) {}
                if (st == null) try { st = aura.remove(uuid); } catch (eAk2) {}
                if (st != null) {
                    try { st.alive = false; } catch (eA0) {}
                    try { if (st.taskId != null) Bukkit.getScheduler().cancelTask(Number(st.taskId)); } catch (eA1) {}
                    try { if (st.task != null) st.task.cancel(); } catch (eA2) {}
                }
            }
        } catch (eAura) {}
    }
}

function syncStaffHoldState(player, reasonIfLost) {
    if (!player) return;
    var uuid = String(player.getUniqueId().toString());
    var hand = player.getInventory().getItemInMainHand();
    var holding = false;
    try { holding = isMageStaffItem(hand) && hand.getAmount() === 1; } catch (e0) {}
    var was = false;
    try {
        var prevHold = lastMainStaffMap.get(mapUuidKey(uuid));
        was = prevHold != null && (prevHold === true || prevHold === java.lang.Boolean.TRUE);
    } catch (eWas) {}
    try {
        lastMainStaffMap.put(mapUuidKey(uuid), holding ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
    } catch (ePut) {}
    if (was && !holding) {
        if (isSpellGuiOpen(player)) {
            scheduleClosePlayerInventory(player);
        }
        notifySpellContextChange(player, "", reasonIfLost || "hold");
    }
}

function getSelectedSpellId(player) {
    try {
        var data = getStaffMeta(player.getInventory().getItemInMainHand());
        if (!data || !data.spells) return null;
        var id = data.spells[data.selected];
        return id ? String(id) : null;
    } catch (e) {}
    return null;
}

function getSfId(stack) {
    if (!stack || stack.getType() === Material.AIR) return null;
    try {
        if (_SlimefunItemClass == null) {
            _SlimefunItemClass = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
        }
        var sf = _SlimefunItemClass.getByItem(stack);
        return sf ? sf.getId() : null;
    } catch (e) {}
    return null;
}

function ensureStaffCfg() {
    if (STAFF_CFG) return true;
    loadDeps();
    return !!STAFF_CFG;
}

function isMageStaffItem(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    if (!ensureStaffCfg()) return false;
    var id = getSfId(stack);
    return !!(id && STAFF_CFG.STAFF_REGISTRY[id]);
}

function toJavaInt(n) {
    var v = Math.floor(Number(n));
    if (!isFinite(v)) v = 0;
    return java.lang.Integer.parseInt(String(v), 10);
}

function writeStaffMeta(stack, spells, selected) {
    var meta = stack.getItemMeta();
    if (!meta) return false;
    var pdc = meta.getPersistentDataContainer();
    var arr = [];
    for (var i = 0; i < spells.length; i++) arr.push(spells[i] ? String(spells[i]) : "");
    pdc.set(KEY_SPELLS, PersistentDataType.STRING, JSON.stringify(arr));
    pdc.set(KEY_SELECTED, PersistentDataType.INTEGER, toJavaInt(selected));
    stack.setItemMeta(meta);
    return true;
}

function getStaffMeta(stack) {
    if (!isMageStaffItem(stack)) return null;
    if (!ensureStaffCfg()) return null;
    var id = getSfId(stack);
    var entry = STAFF_CFG.getStaffEntry(id);
    if (!entry) {
        entry = {
            name: id,
            spellSlots: id === "VASA_辉墨摇篮" ? 6 : 2,
            defaultSpells: []
        };
    }
    var cap = Number(STAFF_CFG.clampSlots(entry.spellSlots)) || 2;
    var meta = stack.getItemMeta();
    if (!meta) return null;
    var pdc = meta.getPersistentDataContainer();
    var spells = [];
    var i;
    if (pdc.has(KEY_SPELLS, PersistentDataType.STRING)) {
        try {
            var parsed = JSON.parse(pdc.get(KEY_SPELLS, PersistentDataType.STRING));
            if (parsed && parsed.length != null) {
                for (i = 0; i < cap; i++) spells.push(parsed[i] ? String(parsed[i]) : "");
            }
        } catch (e) {}
    }
    var selected = 0;
    if (spells.length != cap) {
        spells = [];
        var defaults = entry.defaultSpells || [];
        for (i = 0; i < cap; i++) spells.push(defaults[i] ? String(defaults[i]) : "");
        writeStaffMeta(stack, spells, 0);
    } else if (pdc.has(KEY_SELECTED, PersistentDataType.INTEGER)) {
        try { selected = Number(pdc.get(KEY_SELECTED, PersistentDataType.INTEGER)) || 0; } catch (e2) {}
    }
    if (selected < 0 || selected >= cap) selected = 0;
    return { staffId: id, capacity: cap, spells: spells, selected: selected, entry: entry };
}

function setSelectedSpell(player, slotIndex) {
    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) return false;
    slotIndex = Number(slotIndex);
    if (slotIndex < 0 || slotIndex >= data.capacity) return false;
    var prevId = data.spells[data.selected] ? String(data.spells[data.selected]) : "";
    writeStaffMeta(hand, data.spells, slotIndex);
    player.getInventory().setItemInMainHand(hand);
    var nextId = data.spells[slotIndex] ? String(data.spells[slotIndex]) : "";
    if (prevId !== nextId) scheduleNotifySpellContextChange(player, nextId, "switch");
    return true;
}

function spellPlainName(spellId) {
    if (!spellId) return "未装填";
    if (!SPELL_CFG) return String(spellId);
    return SPELL_CFG.getSpellName(spellId) || String(spellId);
}

function requireSingleStaff(player) {
    var hand = player.getInventory().getItemInMainHand();
    if (!hand || hand.getType() === Material.AIR || !isMageStaffItem(hand)) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "只有手持施术道具时才能使用。");
        return false;
    }
    if (hand.getAmount() !== 1) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "请将施术道具数量分离为 §e1 " + C_MSG + "后再使用。");
        return false;
    }
    return true;
}

function resolveSpellCooldownMs(player, baseCd, erosionLevel) {
    var need = Number(baseCd) || 1000;
    try {
        if (MAGE_API && typeof MAGE_API.calcSpellCooldownMs === "function") {
            need = Number(MAGE_API.calcSpellCooldownMs(player, baseCd || 1000));
        }
    } catch (e) { need = Number(baseCd) || 1000; }
    var erosion = Math.max(0, Math.floor(Number(erosionLevel) || 0));
    if (erosion > 0) need = Math.floor(need * erosion);
    if (!isFinite(need) || need < 50) need = 50;
    return need;
}

function checkCastCooldown(player, spellId, baseCd, commit, erosionLevel) {
    var key = player.getUniqueId().toString() + "|" + spellId;
    var now = Date.now();
    var need = resolveSpellCooldownMs(player, baseCd, erosionLevel);
    var last = castCdMap.get(key);
    if (last != null) {
        var elapsed = now - Number(last);
        if (elapsed < need) return { ok: false, left: need - elapsed, need: need };
    }
    if (commit) castCdMap.put(key, java.lang.Long.parseLong(String(Math.floor(now)), 10));
    return { ok: true, need: need };
}

function getMageLevel(player) {
    try {
        var stats = MAGE_API.getTotalStats(player, false);
        return Math.max(0, Math.min(8, Number(stats.mageLevel) || 0));
    } catch (e) {
        try {
            var data = MAGE_API.getPlayerStats(player.getUniqueId().toString());
            return Math.max(0, Math.min(8, Number(data.mageLevel) || 0));
        } catch (e2) { return 0; }
    }
}

function getPlayerMaxHealth(player) {
    try {
        if (_AttrGenericMaxHealth == null) {
            try { _AttrGenericMaxHealth = Java.type("org.bukkit.attribute.Attribute").GENERIC_MAX_HEALTH; } catch (eA0) {}
        }
        if (_AttrGenericMaxHealth != null) {
            var attr = player.getAttribute(_AttrGenericMaxHealth);
            if (attr != null) return Number(attr.getValue());
        }
    } catch (e) {}
    try {
        if (_AttrMaxHealth == null) {
            try { _AttrMaxHealth = Java.type("org.bukkit.attribute.Attribute").MAX_HEALTH; } catch (eA1) {}
        }
        if (_AttrMaxHealth != null) {
            var attr2 = player.getAttribute(_AttrMaxHealth);
            if (attr2 != null) return Number(attr2.getValue());
        }
    } catch (e2) {}
    try { return Number(player.getMaxHealth()); } catch (e3) { return 20; }
}

function resolveCastCost(player, spell) {
    var ring = spell.ring != null ? Number(spell.ring) : 1;
    if (!(ring > 0)) ring = 1;
    var level = getMageLevel(player);
    var erosion = 0;
    if (ring > level) {
        erosion = Math.floor(ring - level);
        if (erosion < 1) erosion = 1;
    }
    return { ring: ring, level: level, erosion: erosion };
}

function applyErosionSelfDamage(player, erosion, spellName) {
    if (!(erosion > 0) || !player || !player.isOnline()) return 0;
    var maxHp = getPlayerMaxHealth(player);
    if (!(maxHp > 0)) return 0;
    var dmg = erosion * EROSION_HP_PCT * maxHp;
    if (!(dmg > 0)) return 0;
    var util = ensureSpellUtil();
    try {
        if (util && util.ensureSpellDamageListener) util.ensureSpellDamageListener();
        if (util && util.dealPulseSpellDamage) {
            util.dealPulseSpellDamage(player, dmg, player, {
                name: spellName || "侵蚀反噬",
                kind: "erosion",
                targetName: player.getName()
            }, MAGE_API);
            return dmg;
        }
    } catch (ePulse) {}
    try {
        if (MAGE_API && typeof MAGE_API.dealPulseDamage === "function") {
            MAGE_API.dealPulseDamage(player, dmg, player);
        } else {
            var next = Number(player.getHealth()) - dmg;
            player.setHealth(next <= 0 ? 0 : next);
        }
    } catch (e2) {
        try { player.damage(dmg); } catch (e3) {}
    }
    return dmg;
}

function tryCastSelected(player, opts) {
    opts = opts || {};
    if (!loadDeps()) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "施术系统未加载。");
        return { ok: false };
    }
    if (player.isSneaking()) return { ok: false };
    if (!requireSingleStaff(player)) return { ok: false };
    if (isSpellGuiOpen(player)) return { ok: false };

    var uuid = String(player.getUniqueId().toString());
    var acquired = false;
    try {
        var prev = castInFlightMap.get(mapUuidKey(uuid));
        if (prev != null) {
            var age = Date.now() - Number(prev);
            if (age >= 0 && age < 3000) return { ok: false };
            castInFlightMap.remove(mapUuidKey(uuid));
        }
        var raced = castInFlightMap.putIfAbsent(mapUuidKey(uuid), java.lang.Long.parseLong(String(Math.floor(Date.now())), 10));
        if (raced != null) return { ok: false };
        acquired = true;
    } catch (eLock) {
        try {
            if (castInFlightMap.containsKey(mapUuidKey(uuid))) return { ok: false };
            castInFlightMap.put(mapUuidKey(uuid), java.lang.Long.parseLong(String(Math.floor(Date.now())), 10));
            acquired = true;
        } catch (eLock2) { return { ok: false }; }
    }

    try {
        var hand = player.getInventory().getItemInMainHand();
        var data = getStaffMeta(hand);
        if (!data) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "无法读取施术道具数据。");
            return { ok: false };
        }
        player.getInventory().setItemInMainHand(hand);

        var spellId = data.spells[data.selected];
        if (!spellId) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "当前槽位没有术式。");
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

        if (!invokeSessionBridgeClear(player, String(spellId), null, "recast")) {
            try { invokeSessionMethod("clear", [player, { onlySpellId: String(spellId), reason: "recast" }]); } catch (eRc) {}
        }
        cancelPendingSpellContextChange(player);
        notifySpellContextChange(player, String(spellId), "cast");

        var castOk = false;
        try {
            var ret = spell.cast(player, MAGE_API);
            castOk = (ret !== false && ret !== 0);
        } catch (e) {
            Bukkit.getLogger().warning("[GLTC施术] 术式异常 " + spellId + ": " + e);
        }
        if (!castOk) {
            try { castCdMap.remove(player.getUniqueId().toString() + "|" + spellId); } catch (eCd) {}
            player.sendMessage(GLTC_PREFIX + C_MSG + "施术失败。");
            return { ok: false };
        }

        var spellName = spell.name || spellPlainName(spellId) || spellId;
        if (resolved.erosion > 0) applyErosionSelfDamage(player, resolved.erosion, spellName);

        player.sendMessage(GLTC_PREFIX + C_MSG + "成功施展 " + C_SPELL + spellName);
        if (opts.onAfterCast != null) invokeStaffConsumer(opts.onAfterCast, player);
        return { ok: true, spell: spell, spellId: spellId, erosion: resolved.erosion };
    } finally {
        if (acquired) {
            try { castInFlightMap.remove(mapUuidKey(uuid)); } catch (eFin) {}
        }
    }
}

function handleStaffUse(player, opts) {
    if (!player || !(player instanceof Player)) return;
    if (shouldClickDebounce(player)) return;
    if (!requireSingleStaff(player)) return;
    opts = mergeStaffOpts(player, opts);
    var uuid = String(player.getUniqueId().toString());
    try { lastMainStaffMap.put(mapUuidKey(uuid), java.lang.Boolean.TRUE); } catch (eLs) {}

    if (player.isSneaking()) {
        if (isSpellGuiOpen(player)) return;
        var opened = openSpellGui(player);
        if (opened) {
            grantStaffSneakAbilityToken(player);
            var hooks = mergeStaffOpts(player, opts);
            if (hooks.onSneakUse != null) invokeStaffConsumer(hooks.onSneakUse, player);
        }
        return;
    }
    if (isSpellGuiOpen(player)) return;
    tryCastSelected(player, opts);
}

function getSharedSpellMap(field) {
    try {
        var m = PLUGIN[field];
        if (m != null && (m instanceof java.util.concurrent.ConcurrentHashMap)) return m;
    } catch (e0) {}
    return null;
}

/**
 * 左键投出：直接从 PLUGIN 上的 Java ConcurrentHashMap 读 Runnable。
 * 不经过 Graal 跨上下文 JS API / Bridge（那些在此环境经常静默失效）。
 */
function dispatchActiveLeftClickFromStore(player) {
    if (!player || !(player instanceof Player)) return false;
    if (!isMageStaffItem(player.getInventory().getItemInMainHand())) return false;
    try {
        if (player.getInventory().getItemInMainHand().getAmount() !== 1) return false;
    } catch (eAmt) { return false; }

    var store = getSharedSpellMap("gltc_spell_active_left_click");
    if (store == null) return false;

    var uuid = mapUuidKey(String(player.getUniqueId().toString()));
    var ent = null;
    try { ent = store.get(uuid); } catch (eGet) {}
    if (ent == null) return false;

    var spellId = "";
    var runnable = null;
    try {
        if (ent instanceof java.util.Map) {
            spellId = String(ent.get("spellId"));
            runnable = ent.get("runnable");
        }
    } catch (eMap) {}
    if (runnable == null) return false;

    var gateStore = getSharedSpellMap("gltc_spell_lclick_gate_ms");
    if (gateStore != null) {
        var now = Date.now();
        var prev = gateStore.get(uuid);
        if (prev != null && now - Number(prev) < 250) return true;
        try { gateStore.put(uuid, java.lang.Long.parseLong(String(Math.floor(now)), 10)); } catch (eGate) {}
    }

    if (FixedMetadataValue != null && spellId) {
        try {
            player.setMetadata("gltc_spell_sig:" + spellId + ":lclick",
                new FixedMetadataValue(PLUGIN, java.lang.Boolean.TRUE));
        } catch (eSig) {}
    }

    try { runnable.run(); } catch (eRun) {
        Bukkit.getLogger().warning("[GLTC施术] activeLeftClick " + spellId + ": " + eRun);
    }
    return true;
}

function trySpellLeftClick(player) {
    if (!player || !(player instanceof Player)) return false;
    if (player.isSneaking()) return false;
    if (!isMageStaffItem(player.getInventory().getItemInMainHand())) return false;
    try {
        if (player.getInventory().getItemInMainHand().getAmount() !== 1) return false;
    } catch (eAmt) { return false; }
    try {
        if (dispatchActiveLeftClickFromStore(player)) return true;
        var sid = getSelectedSpellId(player);
        if (invokeSessionBridgeLeftClick(player, sid)) return true;
        var sess = getSpellSessionApi();
        if (sess) {
            var ret = invokeSessionMethod("handleLeftClick", [player, sid]);
            if (ret === true) return true;
        }
    } catch (eHook) {}
    return false;
}

function handleStaffLeftClick(player) {
    if (!player || !(player instanceof Player)) return false;
    if (!isMageStaffItem(player.getInventory().getItemInMainHand())) return false;
    if (!requireSingleStaff(player)) return true;
    if (isSpellGuiOpen(player)) return true;
    if (player.isSneaking()) {
        var opened = openSpellGui(player);
        if (opened) {
            grantStaffSneakAbilityToken(player);
            var hooks = mergeStaffOpts(player, {});
            if (hooks.onSneakUse != null) invokeStaffConsumer(hooks.onSneakUse, player);
        }
        return true;
    }
    trySpellLeftClick(player);
    return true;
}

var SPELL_CORE_LISTENER_VER = 22;

function purgePlayerStaffMaps(uuid) {
    uuid = String(uuid);
    var gk = mapUuidKey(uuid);
    try { castInFlightMap.remove(gk); } catch (e0) {}
    try { staffUseMsMap.remove(gk); } catch (e3) {}
    try { staffUseTickMap.remove(gk); } catch (e4) {}
    try { staffInteractTickMap.remove(gk); } catch (e5) {}
    try { lastMainStaffMap.remove(gk); } catch (e6) {}
    try {
        var prefix = uuid + "|";
        var toRemove = new java.util.ArrayList();
        var it = castCdMap.keySet().iterator();
        while (it.hasNext()) {
            var k = String(it.next());
            if (k.indexOf(prefix) === 0) toRemove.add(k);
        }
        for (var ri = 0; ri < toRemove.size(); ri++) {
            try { castCdMap.remove(toRemove.get(ri)); } catch (eCd) {}
        }
    } catch (eCast) {}
    try {
        var huimo = huimoAbilityCdMap();
        if (huimo != null) {
            huimo.remove(gk);
            huimo.remove(uuid);
        }
    } catch (eH) {}
}

function unregisterSpellCoreListenerInstance(inst) {
    if (inst == null) return;
    try { PlayerInteractEvent.getHandlerList().unregister(inst); } catch (e0) {}
    try { EntityDamageByEntityEvent.getHandlerList().unregister(inst); } catch (e0b) {}
    try { PlayerQuitEvent.getHandlerList().unregister(inst); } catch (e1) {}
    try { PlayerItemHeldEvent.getHandlerList().unregister(inst); } catch (e2) {}
    try { PlayerSwapHandItemsEvent.getHandlerList().unregister(inst); } catch (e2b) {}
    try { InventoryClickEvent.getHandlerList().unregister(inst); } catch (e2c) {}
}

function unregisterAllStoredCoreListeners() {
    try {
        var list = PLUGIN.gltcSpellCoreListenerAll;
        if (list != null) {
            for (var i = 0; i < list.size(); i++) unregisterSpellCoreListenerInstance(list.get(i));
            list.clear();
        }
    } catch (eList) {}
    unregisterSpellCoreListenerInstance(PLUGIN.gltcSpellCoreListener);
    try { PLUGIN.gltcSpellCoreListener = null; } catch (eNull) {}
}

function registerListeners(opts) {
    opts = opts || {};
    var force = opts.force === true;
    try {
        if (!force && PLUGIN.gltcSpellCoreListener != null
            && Number(PLUGIN.gltcSpellCoreListenerVer) === SPELL_CORE_LISTENER_VER) {
            return false;
        }
    } catch (eSkip) {}

    try { unregisterAllStoredCoreListeners(); } catch (eUn) {}
    if (force) {
        try { SPELL_CFG = evalScriptExport("术式/登记.js"); } catch (eSpell) {}
    }

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    try { PLUGIN.gltcSpellCoreListener = listenerInstance; } catch (eL) {}
    try {
        if (PLUGIN.gltcSpellCoreListenerAll == null) {
            PLUGIN.gltcSpellCoreListenerAll = new java.util.concurrent.CopyOnWriteArrayList();
        }
        PLUGIN.gltcSpellCoreListenerAll.add(listenerInstance);
    } catch (eStore) {}

    Bukkit.getPluginManager().registerEvent(
        PlayerInteractEvent, listenerInstance, EventPriority.LOWEST,
        function(l, event) {
            try {
                if (event.getHand() != null && event.getHand() !== EquipmentSlot.HAND) return;
                var actionName = String(event.getAction().name());
                var who = event.getPlayer();
                if (!(who instanceof Player)) return;
                if (!isMageStaffItem(who.getInventory().getItemInMainHand())) return;

                if (actionName === "LEFT_CLICK_AIR" || actionName === "LEFT_CLICK_BLOCK") {
                    event.setCancelled(true);
                    try {
                        if (EventResult != null) {
                            event.setUseItemInHand(EventResult.DENY);
                            event.setUseInteractedBlock(EventResult.DENY);
                        }
                    } catch (eDenyL) {}
                    handleStaffLeftClick(who);
                    return;
                }
                if (actionName !== "RIGHT_CLICK_AIR" && actionName !== "RIGHT_CLICK_BLOCK") return;
                event.setCancelled(true);
                try {
                    if (EventResult != null) {
                        event.setUseItemInHand(EventResult.DENY);
                        event.setUseInteractedBlock(EventResult.DENY);
                    }
                } catch (eDeny) {}
                handleStaffUse(who, getStaffHooksFor(who));
                markStaffInteractHandled(who);
            } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC施术] interact: " + e); } catch (e2) {}
            }
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        EntityDamageByEntityEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            try {
                if (event.isCancelled()) return;
                var damager = damageByEntityDamager(event);
                if (damager == null || !(damager instanceof Player)) return;
                if (!isMageStaffItem(damager.getInventory().getItemInMainHand())) return;
                if (!requireSingleStaff(damager)) return;
                if (damager.isSneaking()) return;
                if (isSpellGuiOpen(damager)) return;
                if (trySpellLeftClick(damager)) event.setCancelled(true);
            } catch (eDmg) {
                try { Bukkit.getLogger().warning("[GLTC施术] leftAttack: " + eDmg); } catch (eDmg2) {}
            }
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerQuitEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                var quuid = String(p.getUniqueId().toString());
                purgePlayerStaffMaps(quuid);
                try { lastMainStaffMap.remove(mapUuidKey(quuid)); } catch (eLs) {}
                if (!invokeSessionBridgeClear(p, "", "", "quit")) {
                    try { invokeSessionMethod("clear", [quuid, { reason: "quit" }]); } catch (eQ) {}
                }
                try {
                    var sess = getSpellSessionApi();
                    if (sess && sess.stacks != null) sess.stacks.clear(quuid, null, null);
                } catch (eSt) {}
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerItemHeldEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                if (isSpellGuiOpen(p)) scheduleClosePlayerInventory(p);
                scheduleNotifySpellContextChange(p, "", "hotbar");
                Bukkit.getScheduler().runTask(PLUGIN, function() {
                    try { syncStaffHoldState(p, "hold"); } catch (eH) {}
                });
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerSwapHandItemsEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                Bukkit.getScheduler().runTask(PLUGIN, function() {
                    try { syncStaffHoldState(p, "hold"); } catch (eH) {}
                });
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        InventoryClickEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var who = event.getWhoClicked();
                if (!(who instanceof Player)) return;
                Bukkit.getScheduler().runTask(PLUGIN, function() {
                    try { syncStaffHoldState(who, "hold"); } catch (eH) {}
                });
            } catch (e) {}
        }, PLUGIN
    );

    try {
        PLUGIN.gltcSpellCoreListenerVer = SPELL_CORE_LISTENER_VER;
        PLUGIN.gltcSpellCoreInteractReady = java.lang.Boolean.TRUE;
    } catch (eVer) {}
    return true;
}

loadDeps();
registerListeners({ force: false });

var CAST_API_EXPORT = {
    handleStaffUse: handleStaffUse,
    handleStaffLeftClick: handleStaffLeftClick,
    requireSingleStaff: requireSingleStaff,
    tryCastSelected: tryCastSelected,
    openSpellGui: openSpellGui,
    isSpellGuiOpen: isSpellGuiOpen,
    getStaffMeta: getStaffMeta,
    setSelectedSpell: setSelectedSpell,
    writeStaffMeta: writeStaffMeta,
    isMageStaffItem: isMageStaffItem,
    registerStaffHooks: registerStaffHooks,
    getSpellSessionApi: getSpellSessionApi,
    notifySpellContextChange: notifySpellContextChange,
    scheduleNotifySpellContextChange: scheduleNotifySpellContextChange,
    ensureListeners: function(force) { registerListeners({ force: !!force }); },
    isStaffUseHandledByInteract: isStaffUseHandledByInteract,
    shouldSkipStaffOnUse: shouldSkipStaffOnUse
};
try { PLUGIN.gltcCastApi = CAST_API_EXPORT; } catch (eCastApi) {}
try { PLUGIN.gltcStaffUseInteractOnly = true; } catch (eFlag) {}
CAST_API_EXPORT;
