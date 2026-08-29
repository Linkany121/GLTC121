// ===================================================================
// 枪械集成枪 · 可调配置
// 蹲下右键：打开枪械选择 GUI（本脚本）
// 站立右键：射击由 监听.js 全局监听处理（避免跨 Graal 上下文问题）
// ===================================================================

var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

// === 身份（可调）===
var INTEGRATION_GUN_ID = "FKR_枪械集成枪";

// === 交互（可调）===
var MSG_PREFIX           = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";
var MSG_NO_GUN_SELECTED  = "§c请先蹲下右键选择要装载的枪械！";
var MSG_GUN_SWITCHED     = "§a已装载枪械：§f";
var MSG_DEPS_FAIL        = "§c枪械集成系统未就绪，请重载插件后重试。";

var GUN_CFG = null;
var META_API = null;
var GUI_API = null;
var _guiListenersReady = false;
var _depsFailLogged = false;

function metaBridgeValue(key) {
    if (PLUGIN == null || key == null) return null;
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

function gunFireConsumer() {
    try {
        var ref = metaBridgeValue("gltc_integration_gun_fire_ref");
        if (ref != null && ref.get != null) {
            var fromRef = ref.get();
            if (fromRef != null) return fromRef;
        }
    } catch (eRef) {}
    var direct = metaBridgeValue("gltc_integration_gun_fire");
    if (direct != null) return direct;
    try {
        if (PLUGIN != null && PLUGIN.gltcIntegrationGunFire != null) return PLUGIN.gltcIntegrationGunFire;
    } catch (ePl) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcIntegrationGunFire != null) {
            return RSC.INSTANCE.gltcIntegrationGunFire;
        }
    } catch (eInst) {}
    return null;
}

function gunClearConsumer() {
    try {
        var ref = metaBridgeValue("gltc_integration_gun_clear_ref");
        if (ref != null && ref.get != null) {
            var fromRef = ref.get();
            if (fromRef != null) return fromRef;
        }
    } catch (eRef) {}
    var direct = metaBridgeValue("gltc_integration_gun_clear");
    if (direct != null) return direct;
    try {
        if (PLUGIN != null && PLUGIN.gltcIntegrationGunClear != null) return PLUGIN.gltcIntegrationGunClear;
    } catch (ePl) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcIntegrationGunClear != null) {
            return RSC.INSTANCE.gltcIntegrationGunClear;
        }
    } catch (eInst) {}
    return null;
}

function getScriptLoader() {
    try {
        if (PLUGIN != null && PLUGIN.gltcScriptLoader != null) return PLUGIN.gltcScriptLoader;
    } catch (e0) {}
    try {
        var RSC = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer");
        if (RSC.INSTANCE != null && RSC.INSTANCE.gltcScriptLoader != null) return RSC.INSTANCE.gltcScriptLoader;
    } catch (e1) {}
    return null;
}

function evalHelperDirect(rel) {
    rel = String(rel || "").replace(/\\/g, "/");
    try {
        var roots = ["rsc版GLTC_联合协议", "GLTC121"];
        var base = PLUGIN.getDataFolder().getAbsolutePath() + "/addons/";
        for (var i = 0; i < roots.length; i++) {
            var f = new File(base + roots[i] + "/scripts/" + rel);
            if (!f.exists()) continue;
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(f.toPath()))).toString();
            var body = String(code).replace(/\s+$/, "");
            if (!/\breturn\s+/.test(body.slice(-120))) {
                if (/\(\s*\{[\s\S]*\}\s*\)\s*;?\s*$/.test(body)) {
                    body = body.replace(/\(\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/, "return ({\n$1\n});");
                } else if (/(?:^|[\n;])\s*([A-Za-z_$][\w$]*)\s*;\s*$/.test(body)) {
                    body = body.replace(/([A-Za-z_$][\w$]*)\s*;\s*$/, "return $1;");
                }
            }
            return (0, eval)("(function(){\n" + body + "\n})();");
        }
    } catch (e) {}
    return null;
}

function evalHelper(rel) {
    try {
        var loader = getScriptLoader();
        if (loader && loader.evalScriptExport) {
            var fromLoader = loader.evalScriptExport(rel, { isolated: true, cache: true });
            if (fromLoader != null) return fromLoader;
        }
    } catch (e) {}
    return evalHelperDirect(rel);
}

function loadDeps() {
    if (!GUN_CFG) GUN_CFG = evalHelper("枪械/登记.js");
    if (!META_API) META_API = evalHelper("枪械/_gunMeta.js");
    if (!GUI_API) GUI_API = evalHelper("枪械/枪械GUI.js");
    var ok = !!(GUN_CFG && META_API && GUI_API);
    if (!ok && !_depsFailLogged) {
        var miss = [];
        if (!GUN_CFG) miss.push("登记.js");
        if (!META_API) miss.push("_gunMeta.js");
        if (!GUI_API) miss.push("枪械GUI.js");
        try {
            Bukkit.getLogger().warning("[GLTC枪械] 集成枪依赖加载失败: " + miss.join(", "));
        } catch (eLog) {}
    }
    return ok;
}

function notifyDepsFail(player) {
    if (player != null) {
        try { player.sendMessage(MSG_PREFIX + MSG_DEPS_FAIL); } catch (e0) {}
    }
    if (!_depsFailLogged) {
        _depsFailLogged = true;
        try { Bukkit.getLogger().warning("[GLTC枪械] 集成枪依赖加载失败，请确认已重载监听脚本。"); } catch (e1) {}
    }
}

function ensureGuiListeners() {
    if (_guiListenersReady || !GUI_API || !GUI_API.registerListeners) return;
    GUI_API.registerListeners(function() { return getGuiContext(); });
    _guiListenersReady = true;
}

function isHoldingIntegrationGun(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    try {
        var sf = SlimefunItem.getByItem(stack);
        return sf != null && String(sf.getId()) === INTEGRATION_GUN_ID;
    } catch (e) { return false; }
}

function getIntegrationMeta(stack) {
    if (!loadDeps()) return null;
    return META_API.readIntegrationMeta(stack, INTEGRATION_GUN_ID);
}

function getSelectedGunId(player) {
    var hand = player.getInventory().getItemInMainHand();
    var data = getIntegrationMeta(hand);
    return data ? data.selectedGunId : null;
}

function setSelectedGun(player, gunId) {
    if (!loadDeps()) return false;
    var hand = player.getInventory().getItemInMainHand();
    if (!isHoldingIntegrationGun(hand)) return false;
    if (!GUN_CFG.isRegisteredGun(gunId)) return false;
    if (!META_API.writeSelectedGun(hand, gunId, GUN_CFG)) return false;
    player.getInventory().setItemInMainHand(hand);
    try {
        player.sendMessage(MSG_PREFIX + MSG_GUN_SWITCHED + META_API.gunDisplayName(gunId));
    } catch (eMsg) {}
    return true;
}

function getGuiContext() {
    return {
        GUN_CFG: GUN_CFG,
        META_API: META_API,
        getIntegrationMeta: getIntegrationMeta,
        setSelectedGun: setSelectedGun
    };
}

function openGunGui(player) {
    if (!loadDeps()) {
        notifyDepsFail(player);
        return false;
    }
    ensureGuiListeners();
    return GUI_API.open(player, getGuiContext()) === true;
}

function clearIntegrationState(player, gunId) {
    if (!player) return;
    var id = gunId || getSelectedGunId(player);
    if (!id) return;
    var bridge = gunClearConsumer();
    if (bridge != null) {
        try {
            var payload = new java.util.HashMap();
            payload.put("player", player);
            payload.put("gunId", String(id));
            bridge.accept(payload);
        } catch (eBr) {}
    }
}

function fireSelectedGun(player, event) {
    if (!loadDeps()) return false;
    var gunId = getSelectedGunId(player);
    if (!gunId) {
        try { player.sendMessage(MSG_PREFIX + MSG_NO_GUN_SELECTED); } catch (e0) {}
        return false;
    }
    var scriptRel = GUN_CFG.getGunScript(gunId);
    if (!scriptRel) return false;
    var bridge = gunFireConsumer();
    if (bridge == null) return false;
    try {
        var payload = new java.util.HashMap();
        payload.put("player", player);
        payload.put("event", event);
        payload.put("gunId", String(gunId));
        payload.put("scriptRel", String(scriptRel));
        bridge.accept(payload);
        return true;
    } catch (eBr) {
        try { Bukkit.getLogger().warning("[GLTC枪械] onUse 射击桥接失败: " + eBr); } catch (eLog) {}
    }
    return false;
}

function isRightClickInteract(event) {
    if (!event || !event.getAction) return false;
    try {
        var name = String(event.getAction().name());
        return name === "RIGHT_CLICK_AIR" || name === "RIGHT_CLICK_BLOCK";
    } catch (e) {
        return false;
    }
}

function isMainHandInteract(event) {
    if (!event || !event.getHand) return true;
    try { return event.getHand() === EquipmentSlot.HAND; } catch (e) { return true; }
}

function handleUse(event) {
    var player = event.getPlayer();
    if (!player || !player.isOnline()) return false;
    var item = player.getInventory().getItemInMainHand();
    if (!isHoldingIntegrationGun(item)) return false;
    if (!loadDeps()) {
        notifyDepsFail(player);
        return false;
    }
    if (player.isSneaking()) {
        openGunGui(player);
        return true;
    }
    // 站立射击：主路径由 监听.js 全局 PlayerInteractEvent 处理
    // 此处仅作 RSC onUse 兜底（部分环境不触发 Interact）
    fireSelectedGun(player, event);
    return true;
}

function onUse(event) {
    handleUse(event);
}

function onLoad() {
    loadDeps();
    ensureGuiListeners();
    return {
        PlayerInteractEvent: function(evt) {
            try {
                if (!isRightClickInteract(evt)) return;
                if (!isMainHandInteract(evt)) return;
                var player = evt.getPlayer();
                if (!player || !player.isOnline()) return;
                if (!player.isSneaking()) return;
                if (!isHoldingIntegrationGun(player.getInventory().getItemInMainHand())) return;
                if (openGunGui(player)) {
                    try { evt.setCancelled(true); } catch (eCancel) {}
                }
            } catch (e) {}
        },
        PlayerItemHeldEvent: function(evt) {
            try {
                var p = evt.getPlayer();
                var prev = p.getInventory().getItem(evt.getPreviousSlot());
                if (!loadDeps()) return;
                if (isHoldingIntegrationGun(prev)) {
                    var data = META_API.readIntegrationMeta(prev, INTEGRATION_GUN_ID);
                    if (data && data.selectedGunId) {
                        clearIntegrationState(p, data.selectedGunId);
                    }
                }
            } catch (e) {}
        },
        PlayerQuitEvent: function(evt) {
            try {
                var p = evt.getPlayer();
                if (!loadDeps()) return;
                if (isHoldingIntegrationGun(p.getInventory().getItemInMainHand())) {
                    clearIntegrationState(p, getSelectedGunId(p));
                }
            } catch (e) {}
        }
    };
}

onLoad();
