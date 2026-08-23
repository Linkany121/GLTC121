/**
 * 施术核心（选术环）
 * - 每位玩家独立 runTaskTimer：刷粒子 + 文字跟随
 * - 站立右键：施术；开环且对准槽则选槽；开环未对准则关环并施术
 * - 站立左键：开环时选槽；否则 dispatchActiveLeftClick（见 术式/_工具.js）
 * - 蹲下右键：开关选术环；唤出成功时同时触发施术道具护身技（onSneakUse）；绝不施术
 * - 开选术环 / 换手持：清术式会话效果；层数仅在换栏/离手/退服时清
 * - 右键：Interact + SF onUse 双入口，靠 debounce 去重
 * - 所有术式相关触发（施术 / 选术环 / 术式左键 / 护身）均要求主手持施术道具
 *
 * AI 新建术式/道具规范：scripts/_AI术式与施术道具生成指南.js
 * 禁止在本文件添加具体术式 ID 或术式专用逻辑。
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var Player = Java.type("org.bukkit.entity.Player");
var TextDisplay = Java.type("org.bukkit.entity.TextDisplay");
var Color = Java.type("org.bukkit.Color");
var Location = Java.type("org.bukkit.Location");
var Particle = Java.type("org.bukkit.Particle");
var TextAlignment = Java.type("org.bukkit.entity.TextDisplay$TextAlignment");
var Billboard = Java.type("org.bukkit.entity.Display$Billboard");
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
/** Graal：监听参数常为父类且 Java.cast 不可用，反射取 getDamager */
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
var PlayerMoveEvent = Java.type("org.bukkit.event.player.PlayerMoveEvent");
var PlayerSwapHandItemsEvent = Java.type("org.bukkit.event.player.PlayerSwapHandItemsEvent");
var InventoryClickEvent = Java.type("org.bukkit.event.inventory.InventoryClickEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var UUID = Java.type("java.util.UUID");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
/** 常规提示 &#fff5b3 · 术式名称 &#62c6ff */
var C_MSG = "§x§f§f§f§5§b§3";
var C_SPELL = "§x§6§2§c§6§f§f";

var KEY_SPELLS = new NamespacedKey("gltc", "staff_spells");
var KEY_SELECTED = new NamespacedKey("gltc", "staff_selected");
var KEY_RING = new NamespacedKey("gltc", "spell_ring");
var KEY_OWNER = new NamespacedKey("gltc", "spell_ring_owner");

// ======================== 选术环 · 可调配置 ========================
// 改完后重载插件 / 重新加载施术道具脚本生效

/** 术式槽面板中心距玩家的水平距离（格） */
var PANEL_DIST = 1.8;
/** 粒子圆环半径（格） */
var RING_RADIUS = 1.9;
/** trial_spawner_detection_ominous 点数（地面圆环） */
var OMINOUS_POINTS = 48;
/** dust_color_transition 点数（腰线圆环，越大越密） */
var DUST_POINTS = 70;
/** dust_color_transition 粒子尺寸（越大越显眼，约 0.1~2） */
var DUST_SIZE = 0.9;
/** 面板/粒子基准高度：玩家脚底 Y + 此偏移（约腰线，dust 用） */
var WAIST_OFFSET = 1.4;
/** dust 相对 WAIST_OFFSET 再下沉的格数（正数=更低） */
var RING_PARTICLE_Y_DOWN = 0.2;
/** ominous 相对脚底的高度偏移（格；负数=更低，当前约再下 1 格） */
var OMINOUS_GROUND_Y = -1.0;
/** 同排术式槽之间的横向间距（格） */
var SLOT_GAP_X = 1.4;
/** 多行术式槽时，行与行之间的竖向间距（格） */
var SLOT_GAP_Y = 0.7;
/** 第二行（及更高行）相对原高度再下沉的格数 */
var SLOT_ROW_EXTRA_DOWN = 0.2;
/** 左右两边选择槽相对面板中心再靠近玩家的格数 */
var SLOT_SIDE_CLOSER = 0.45;
/** 术式槽每行最多几个（超出自动换行向上叠） */
var MAX_PER_ROW = 3;
/** 信息行相对面板中心再向下的距离（格） */
var INFO_BELOW = 0.7;
/** 信息行两行之间的竖向间距（格） */
var INFO_LINE_GAP = 0.29;
/** 准星判定：槽位最远可选距离（格） */
var LOOK_MAX_DIST = 5.5;
/** 准星判定：视线与槽位方向夹角余弦下限（越大越要「正对」才算瞄中，0~1） */
var LOOK_MIN_DOT = 0.82;

// ---- 术士等级 ↔ 术式环数 ----
/** 等级 > 环数时，粒子消耗倍率（结果取整，最低 1） */
var OVERLEVEL_COST_MULT = 0.5;
/** 等级 < 环数时，每级侵蚀对自身造成的最大生命值比例 */
var EROSION_HP_PCT = 0.2;

/**
 * 术式槽整组吸附方位：开环瞬间以玩家朝向为 0°，
 * 本次选术仅在相对的 0° / 130° / 230° 三个方向间切换（视觉微调，非严格 120° 三等分）
 */
function normalizeYaw(yawDeg) {
    return ((Number(yawDeg) % 360) + 360) % 360;
}

function yawDeltaAbs(a, b) {
    var d = Math.abs(normalizeYaw(a) - normalizeYaw(b));
    return d > 180 ? 360 - d : d;
}

/** Bukkit yaw → 水平朝前/右单位向量 */
function basis(yawDeg) {
    var rad = Number(yawDeg) * Math.PI / 180.0;
    var fx = -Math.sin(rad), fz = Math.cos(rad);
    return { fx: fx, fz: fz, rx: -fz, rz: fx };
}

/** 以 baseYaw 为 0°，生成本次可切换的三向：0° / +130° / +230° */
function buildRelativeQuads(baseYawDeg) {
    var names = ["前", "右斜", "左斜"];
    var deltas = [0, 130, 230];
    var quads = [];
    for (var i = 0; i < deltas.length; i++) {
        var yaw = Number(baseYawDeg) + deltas[i];
        var b = basis(yaw);
        quads.push({
            name: names[i],
            yaw: normalizeYaw(yaw),
            fx: b.fx, fz: b.fz,
            rx: b.rx, rz: b.rz
        });
    }
    return quads;
}

/** 世界东南西北（仅作未捕获朝向时的回退） */
var CARDINALS = [
    { name: "南", fx: 0, fz: 1, rx: 1, rz: 0 },
    { name: "西", fx: -1, fz: 0, rx: 0, rz: 1 },
    { name: "北", fx: 0, fz: -1, rx: -1, rz: 0 },
    { name: "东", fx: 1, fz: 0, rx: 0, rz: -1 }
];

/** 环粒子 A：trial_spawner_detection_ominous（服务端无此枚举时回退） */
var PARTICLE_OMINOUS = null;
try { PARTICLE_OMINOUS = Particle.valueOf("TRIAL_SPAWNER_DETECTION_OMINOUS"); } catch (eOm) {}
/** 环粒子 B：dust_color_transition 所需类与枚举 */
var DustTransitionClass = null;
try { DustTransitionClass = Java.type("org.bukkit.Particle$DustTransition"); } catch (eDt) {}
var PARTICLE_TRANSITION = null;
try { PARTICLE_TRANSITION = Particle.valueOf("DUST_COLOR_TRANSITION"); } catch (ePt) {}


 // 开环 / 关环 / 准星选槽 的最短间隔

var RING_ACTION_CD_MS = 100;

/**
 * 入口去重
 * 调参：过短 → 仍可能双触；过长 → 快速连点施术/开环被吞。常用 100~350ms。
 */
var STAFF_USE_DEBOUNCE_MS = 120;

/**
 * RING_TOGGLE_GRACE_MS —— 开/关环后的「禁止再 toggle」宽限
 * 管什么：蹲下右键路径里 inRingToggleGrace；宽限内忽略再次 toggle（防刚开就被第二次事件关掉）。
 * 不管什么：站立施术、选槽、术式 CD；宽限内站立右键仍可走施术（若环已开则仍是选槽）。
 * 调参：需略大于「Interact 开环 → onUse/次 tick 再点」的典型间隔；过短仍会闪关，过长蹲下连点关不掉。
 */
var RING_TOGGLE_GRACE_MS = 120;

/**
 * RING_CHAT_GATE_MS —— 聊天提示去重窗口（sendRingChatOnce）
 * 管什么：同类/同文案提示在窗口内只发一次（开环、关环、施术冷却提示等），避免双触刷屏。
 * 不管什么：任何玩法逻辑、CD、施术是否成功。
 * 调参：只影响提示频率，可按观感加大或减小。
 */
var RING_CHAT_GATE_MS = 100;

/**
 * RING_TICK_PERIOD —— 选术环跟随任务周期（Bukkit tick，20 tick = 1s）
 * 管什么：开环后 runTaskTimer 的间隔：TextDisplay 跟随 + 粒子（粒子见 RING_PARTICLE_EVERY）。
 * 调参：1 = 信息每 tick 更新；粒子可另设 2 tick 降负载。
 */
var RING_TICK_PERIOD = 1;

/** 环粒子刷新间隔（tick）；信息行仍每 RING_TICK_PERIOD 更新 */
var RING_PARTICLE_EVERY = 2;

/**
 * META_STAFF_USE_AT —— 玩家 Metadata 键：上次成功通过 debounce 的时间戳(ms)
 * 用途：跨 Graal 脚本上下文时，ConcurrentHashMap 偶发读不到时的兜底；与 staffUseMsMap 同写同读。
 * 勿与术式 CD、环操作 CD 的 key 混用。
 */
var META_STAFF_USE_AT = "gltc_staff_use_at";

/**
 * META_RING_TOGGLE_GRACE —— 玩家 Metadata 键：toggle 宽限「截止」时间戳(ms)
 * 用途：存的是 expiry（now + RING_TOGGLE_GRACE_MS），不是上次操作时间；inRingToggleGrace 比较 now < expiry。
 */
var META_RING_TOGGLE_GRACE = "gltc_ring_toggle_grace";
// ======================== 配置结束 ========================

var MAGE_API = null;
var STAFF_CFG = null;
var SPELL_CFG = null;
var FixedMetadataValue = null;
try { FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue"); } catch (eMeta) {}
var EventResult = null;
try { EventResult = Java.type("org.bukkit.event.Event$Result"); } catch (eRes) {}

/** 跨 Graal 上下文共享的 ConcurrentHashMap（必须校验类型，避免旧 {} 残留） */
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
var ringActionCdMap = sharedConcurrentMap("gltc_ring_action_cd_ms");
var ringChatGateMap = sharedConcurrentMap("gltc_ring_chat_gate_str");
/** uuid -> 上次处理的服务器 tick */
var staffUseTickMap = sharedConcurrentMap("gltc_staff_use_tick");
/** uuid -> 上次处理毫秒 */
var staffUseMsMap = sharedConcurrentMap("gltc_staff_use_ms");
/** uuid -> Interact 已处理右键的 tick（onUse 跨上下文读 PLUGIN 兜底） */
var staffInteractTickMap = sharedConcurrentMap("gltc_staff_interact_use_tick");
/** uuid -> 开环所在 tick（避免开环同 tick 跟随任务二次 rebuild） */
var ringOpenedAtTickMap = sharedConcurrentMap("gltc_ring_opened_tick");
/** uuid -> 施术进行中标记，防 Interact+onUse 同帧双进 */
var castInFlightMap = sharedConcurrentMap("gltc_cast_in_flight");

/**
 * 选术环会话必须跨施术道具脚本共享（ConcurrentHashMap，禁止再用裸 {}）。
 * Graal 下 PLUGIN 上的普通 JS 对象跨上下文读写会「假开环」：站立右键只走选槽、永远不施术。
 */
function sharedStateObj(field) {
    // 兼容旧调用：一律升级为 ConcurrentHashMap
    return sharedConcurrentMap(field);
}

function mapUuidKey(uuid) {
    return java.lang.String.valueOf(String(uuid));
}

/** uuid -> 开环容量 */
var ringOpenMap = sharedConcurrentMap("gltc_ring_open_map");
/** uuid -> { baseYaw, quads[] } */
var ringFacingMap = sharedConcurrentMap("gltc_ring_facing_map");
/** uuid -> TextDisplay[] */
var ringDisplaysMap = sharedConcurrentMap("gltc_ring_displays_map");
/** uuid -> taskId */
var ringTaskIdsMap = sharedConcurrentMap("gltc_ring_task_ids_map");
var ringMovePulseMap = sharedConcurrentMap("gltc_ring_move_pulse_map");
/** uuid -> Boolean 是否曾手持施术道具 */
var lastMainStaffMap = sharedConcurrentMap("gltc_last_main_staff_map");
// 清掉旧版裸 {}，避免和 CHM 两套状态并存
try { PLUGIN.gltc_ring_open = null; } catch (eOld0) {}
try { PLUGIN.gltc_ring_facing = null; } catch (eOld1) {}
try { PLUGIN.gltc_ring_displays = null; } catch (eOld2) {}
try { PLUGIN.gltc_ring_task_ids = null; } catch (eOld3) {}
try { PLUGIN.gltc_last_main_staff = null; } catch (eOld4) {}

/**
 * 护身 / 施术后钩子：存 Java Consumer（accept(Player)），不要存裸 JS function。
 * Graal 跨上下文取 JS function 经常调不动；Consumer 由各道具脚本在本上下文创建。
 */
function sharedStaffHooksMap() {
    return sharedConcurrentMap("gltc_staff_hooks_map");
}

function asPlayerConsumer(fn) {
    if (fn == null) return null;
    // 已是带 accept 的宿主对象（含他上下文 Java.extend 的 Consumer）→ 直接用，禁止再包一层
    try {
        if (fn.accept != null) return fn;
    } catch (e0) {}
    try {
        if (fn instanceof java.util.function.Consumer) return fn;
    } catch (e1) {}
    try {
        return new (Java.extend(java.util.function.Consumer, {
            accept: function(p) {
                try { fn(p); } catch (e) {
                    try { Bukkit.getLogger().warning("[GLTC施术] staffHook: " + e); } catch (e2) {}
                }
            }
        }))();
    } catch (e3) {
        return null;
    }
}

function invokeStaffConsumer(consumer, player) {
    if (consumer == null || player == null) return;
    try {
        consumer.accept(player);
        return;
    } catch (e0) {}
    try {
        consumer(player);
    } catch (e1) {
        try { Bukkit.getLogger().warning("[GLTC施术] staffHook invoke: " + e1); } catch (e2) {}
    }
}

function metaLong(player, key) {
    try {
        if (!player.hasMetadata(key)) return null;
        var mv = player.getMetadata(key).get(0);
        try { return Number(mv.asDouble()); } catch (e0) {}
        try { return Number(mv.asLong()); } catch (e1) {}
        try { return Number(mv.value()); } catch (e2) {}
    } catch (e) {}
    return null;
}

function setMetaLong(player, key, value) {
    try {
        if (FixedMetadataValue == null) return false;
        // 存 Number，避免 Long/asLong 在部分环境下读不到
        player.setMetadata(key, new FixedMetadataValue(PLUGIN, Number(value)));
        return true;
    } catch (e) {}
    return false;
}

function currentServerTick() {
    try { return Number(Bukkit.getCurrentTick()); } catch (e0) {}
    try { return Number(Bukkit.getServer().getCurrentTick()); } catch (e1) {}
    return -1;
}

/** Graal：PLUGIN 上可能是 java.lang.Boolean，勿用 === true */
function isInteractReadyFlag() {
    try {
        var f = PLUGIN.gltcSpellCoreInteractReady;
        if (f === true) return true;
        if (f != null && typeof f.booleanValue === "function" && f.booleanValue()) return true;
    } catch (e0) {}
    return false;
}

/** Interact 监听已挂上时，SF onUse 应直接跳过，避免开环立刻被二次调用关掉 */
function isStaffUseHandledByInteract() {
    if (isInteractReadyFlag()) return true;
    try { return PLUGIN.gltcSpellCoreListener != null; } catch (e) {}
    return false;
}

/** 供 SF onUse 脚本调用：勿跨上下文调 CAST_API，只读 PLUGIN */
function shouldSkipStaffOnUse(player) {
    if (isStaffUseHandledByInteract()) return true;
    if (!player) return false;
    try {
        var gk = mapUuidKey(String(player.getUniqueId().toString()));
        var tick = currentServerTick();
        if (tick >= 0) {
            var lastTick = staffInteractTickMap.get(gk);
            if (lastTick == null) lastTick = staffInteractTickMap.get(String(player.getUniqueId().toString()));
            if (lastTick != null && Number(lastTick) === tick) return true;
        }
        var lastMs = staffUseMsMap.get(gk);
        if (lastMs == null) lastMs = staffUseMsMap.get(String(player.getUniqueId().toString()));
        if (lastMs != null && Date.now() - Number(lastMs) < STAFF_USE_DEBOUNCE_MS) return true;
    } catch (e0) {}
    return false;
}

function markStaffInteractHandled(player) {
    if (!player) return;
    try {
        var gk = mapUuidKey(String(player.getUniqueId().toString()));
        var tick = currentServerTick();
        var now = Date.now();
        if (tick >= 0) {
            var tv = java.lang.Long.parseLong(String(Math.floor(tick)), 10);
            staffInteractTickMap.put(gk, tv);
            staffUseTickMap.put(gk, tv);
            try { staffUseTickMap.put(String(player.getUniqueId().toString()), tv); } catch (eT2) {}
        }
        var mv = java.lang.Long.parseLong(String(Math.floor(now)), 10);
        staffUseMsMap.put(gk, mv);
        try { staffUseMsMap.put(String(player.getUniqueId().toString()), mv); } catch (eM2) {}
        setMetaLong(player, META_STAFF_USE_AT, now);
    } catch (e) {}
}

/**
 * 同一次物理右键只处理一次：
 * 1) 同服务器 tick（RIGHT_CLICK_AIR + BLOCK 必同 tick）
 * 2) ConcurrentHashMap 毫秒窗（跨上下文）
 * 3) 玩家 Metadata 毫秒窗（兜底）
 */
function shouldClickDebounce(player) {
    try {
        var uuid = String(player.getUniqueId().toString());
        var gk = mapUuidKey(uuid);
        var now = Date.now();
        var tick = currentServerTick();

        if (tick >= 0) {
            var lastTick = staffUseTickMap.get(gk);
            if (lastTick == null) lastTick = staffUseTickMap.get(uuid);
            if (lastTick != null && Number(lastTick) === tick) return true;
        }

        var lastMs = staffUseMsMap.get(gk);
        if (lastMs == null) lastMs = staffUseMsMap.get(uuid);
        if (lastMs != null && now - Number(lastMs) < STAFF_USE_DEBOUNCE_MS) return true;

        var metaMs = metaLong(player, META_STAFF_USE_AT);
        if (metaMs != null && now - metaMs < STAFF_USE_DEBOUNCE_MS) return true;

        if (tick >= 0) {
            try {
                var tv = java.lang.Long.parseLong(String(Math.floor(tick)), 10);
                staffUseTickMap.put(gk, tv);
                staffUseTickMap.put(uuid, tv);
            } catch (eT) {}
        }
        try {
            var mv = java.lang.Long.parseLong(String(Math.floor(now)), 10);
            staffUseMsMap.put(gk, mv);
            staffUseMsMap.put(uuid, mv);
        } catch (eM) {}
        try { setMetaLong(player, META_STAFF_USE_AT, now); } catch (eMeta) {}
        return false;
    } catch (e) {
        // 绝不能因防抖异常导致永远无反应
        return false;
    }
}

function isRingActionOnCd(player) {
    try {
        var uuid = String(player.getUniqueId().toString());
        var last = ringActionCdMap.get(uuid);
        if (last != null && Date.now() - Number(last) < RING_ACTION_CD_MS) return true;
    } catch (e) {}
    return false;
}

function markRingActionCd(player) {
    try {
        ringActionCdMap.put(String(player.getUniqueId().toString()), java.lang.Long.parseLong(String(Math.floor(Date.now())), 10));
    } catch (e) {}
}

function markRingToggleGrace(player) {
    try {
        setMetaLong(player, META_RING_TOGGLE_GRACE, Date.now() + RING_TOGGLE_GRACE_MS);
    } catch (e) {}
}

function inRingToggleGrace(player) {
    try {
        var exp = metaLong(player, META_RING_TOGGLE_GRACE);
        return exp != null && Date.now() < exp;
    } catch (e) {}
    return false;
}

/** 选术环开关提示去重 */
function sendRingChatOnce(player, kind, msg) {
    if (!player || msg == null) return;
    try {
        var uuid = String(player.getUniqueId().toString());
        var now = Date.now();
        var prev = ringChatGateMap.get(uuid);
        if (prev != null) {
            var parts = String(prev).split("\u0001");
            if (parts.length >= 3) {
                var pt = Number(parts[0]);
                var pk = parts[1];
                var pm = parts[2];
                var sameKind = pk === String(kind);
                var sameMsg = pm === String(msg);
                if ((sameKind || sameMsg) && now - pt < RING_CHAT_GATE_MS) return;
            }
        }
        // 刚唤出后短时间内禁止播「已关闭」，避免开了又关的双提示
        if (String(kind) === "close" && prev != null) {
            var p0 = String(prev).split("\u0001");
            if (p0.length >= 2 && p0[1] === "open" && now - Number(p0[0]) < RING_TOGGLE_GRACE_MS) return;
        }
        ringChatGateMap.put(uuid, String(now) + "\u0001" + String(kind) + "\u0001" + String(msg));
        player.sendMessage(msg);
    } catch (e) {
        try { player.sendMessage(msg); } catch (e2) {}
    }
}

/**
 * 注册道具钩子。hooks.onSneakUse / onAfterCast 可为 JS function 或 Java Consumer。
 * 内部一律存成 Consumer，跨上下文可调用。
 */
function registerStaffHooks(staffId, hooks) {
    if (!staffId) return;
    hooks = hooks || {};
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
            onAfterCast: map.get(String(id) + "|after")
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
    return {
        onSneakUse: sneak,
        onAfterCast: after
    };
}

function makeSyncRunnable(fn) {
    try {
        return new (Java.extend(java.lang.Runnable, { run: fn }))();
    } catch (e1) {
        try {
            var BR = Java.type("org.bukkit.scheduler.BukkitRunnable");
            return new (Java.extend(BR, { run: fn }))();
        } catch (e2) {
            return fn;
        }
    }
}

function scheduleRepeating(fn, delay, period) {
    var r = makeSyncRunnable(fn);
    try {
        return Bukkit.getScheduler().runTaskTimer(PLUGIN, r, delay, period);
    } catch (e1) {
        try {
            if (r.runTaskTimer) return r.runTaskTimer(PLUGIN, delay, period);
        } catch (e2) {}
        throw e1;
    }
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
            if (list) for (var i = 0; i < list.length; i++) candidates.push(new File(list[i], "scripts/" + rel));
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) if (candidates[c].exists()) return candidates[c];
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
    // 始终优先对齐全局单例，避免施术/补充剂/菜单各自握着旧 MAGE_API
    try {
        if (PLUGIN.gltcMageApi != null
            && typeof PLUGIN.gltcMageApi.getTotalStats === "function"
            && typeof PLUGIN.gltcMageApi.calcSpellCooldownMs === "function"
            && typeof PLUGIN.gltcMageApi.getCurrentParticles === "function") {
            MAGE_API = PLUGIN.gltcMageApi;
        }
    } catch (e0) {}
    if (!MAGE_API || typeof MAGE_API.getTotalStats !== "function"
        || typeof MAGE_API.calcSpellCooldownMs !== "function") {
        MAGE_API = evalScriptExport("术士系统/核心.js");
        try { if (MAGE_API) PLUGIN.gltcMageApi = MAGE_API; } catch (e1) {}
    }
    if (!STAFF_CFG || !STAFF_CFG.STAFF_REGISTRY) STAFF_CFG = evalScriptExport("施术道具/登记.js");
    if (!SPELL_CFG || !SPELL_CFG.SPELL_REGISTRY) SPELL_CFG = evalScriptExport("术式/登记.js");
    // 确保术式会话 API 已挂到 PLUGIN（有状态术式切术清痕迹）
    try {
        if (PLUGIN.gltcSpellSessionApi == null || typeof PLUGIN.gltcSpellSessionApi.onContextChange !== "function") {
            evalScriptExport("术式/_工具.js");
        }
    } catch (eSess) {}
    return !!(MAGE_API && STAFF_CFG && SPELL_CFG);
}

function getSpellSessionApi() {
    try {
        if (PLUGIN.gltcSpellSessionApi != null && typeof PLUGIN.gltcSpellSessionApi.onContextChange === "function") {
            return PLUGIN.gltcSpellSessionApi;
        }
    } catch (e0) {}
    try {
        var util = evalScriptExport("术式/_工具.js");
        if (util && util.spellSession) return util.spellSession;
    } catch (e1) {}
    return null;
}

/** 切选中 / 施放其他术：清掉其他术式的实体、任务等痕迹（层数见 stacks API） */
function notifySpellContextChange(player, keepSpellId, reason) {
    var keep = keepSpellId ? String(keepSpellId) : "";
    var r = reason || "switch";
    var api = getSpellSessionApi();
    if (api && typeof api.onContextChange === "function") {
        try { api.onContextChange(player, keep, r); } catch (e) {
            try { Bukkit.getLogger().warning("[GLTC施术] contextChange: " + e); } catch (e2) {}
        }
    }
    // 兜底：直接清各术式挂在 PLUGIN 上的 ConcurrentHashMap（防会话表跨上下文丢挂钩）
    try { directClearKnownSpellFx(player, keep); } catch (e3) {}
}

/** 不依赖 onClear 回调的 PLUGIN 痕迹兜底（各术式用 registerDirectClearHook 登记，此处仅留未迁移项） */
function directClearKnownSpellFx(player, keepSpellId) {
    if (!player) return;
    var uuid = String(player.getUniqueId().toString());
    var keep = keepSpellId ? String(keepSpellId) : "";

    if (keep !== "VASA_庇护脉络") {
        try {
            var aura = PLUGIN.gltc_bihu_aura_store;
            if (aura != null) {
                var auraKey = java.lang.String.valueOf(uuid);
                var st = null;
                try { st = aura.remove(auraKey); } catch (eAk) {}
                if (st == null) {
                    try { st = aura.remove(uuid); } catch (eAk2) {}
                }
                if (st != null) {
                    try { st.alive = false; } catch (eA0) {}
                    try {
                        if (st.taskId != null) Bukkit.getScheduler().cancelTask(Number(st.taskId));
                    } catch (eA1) {}
                    try { if (st.task != null) st.task.cancel(); } catch (eA2) {}
                }
            }
        } catch (eAura) {}
    }
}

/** 主手是否仍为可用施术道具；从有→无时清会话与层数 */
function syncStaffHoldState(player, reasonIfLost) {
    if (!player) return;
    var uuid = String(player.getUniqueId().toString());
    var hand = player.getInventory().getItemInMainHand();
    var holding = false;
    try {
        holding = isMageStaffItem(hand) && hand.getAmount() === 1;
    } catch (e0) {}
    var was = false;
    try {
        var prevHold = lastMainStaffMap.get(mapUuidKey(uuid));
        was = prevHold != null && (prevHold === true || prevHold === java.lang.Boolean.TRUE || String(prevHold) === "true");
    } catch (eWas) {}
    try {
        lastMainStaffMap.put(mapUuidKey(uuid), holding ? java.lang.Boolean.TRUE : java.lang.Boolean.FALSE);
    } catch (ePut) {}
    if (was && !holding) {
        if (isRingOpen(uuid)) {
            closeSpellRing(player);
            sendRingChatOnce(player, "close", GLTC_PREFIX + C_MSG + "未手持施术道具，选术环已关闭");
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
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(stack);
        return sf ? sf.getId() : null;
    } catch (e) {}
    return null;
}

function ensureStaffCfg() {
    try {
        if (STAFF_CFG && STAFF_CFG.STAFF_REGISTRY) return true;
    } catch (e0) {}
    try {
        STAFF_CFG = evalScriptExport("施术道具/登记.js");
    } catch (e1) {}
    return !!(STAFF_CFG && STAFF_CFG.STAFF_REGISTRY);
}

function isMageStaffItem(stack) {
    // 交互判定只依赖登记表 / 已知 ID；不要被 MAGE/SPELL 加载失败拖成「完全无反应」
    if (!stack) return false;
    try {
        var id = getSfId(stack);
        if (!id) return false;
        if (ensureStaffCfg() && STAFF_CFG.STAFF_REGISTRY && STAFF_CFG.STAFF_REGISTRY[id]) return true;
        // 登记脚本偶发未挂上时的硬编码兜底
        return id === "VASA_木质法杖" || id === "VASA_辉墨摇篮";
    } catch (e) {
        return false;
    }
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
    // 读槽位只依赖登记表，勿要求 MAGE/SPELL 全就绪（否则右键完全无提示）
    if (!isMageStaffItem(stack)) return null;
    if (!ensureStaffCfg()) return null;
    var id = getSfId(stack);
    var entry = STAFF_CFG.getStaffEntry(id);
    if (!entry) {
        // 硬编码兜底容量（与登记.js 一致）
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
    if (prevId !== nextId) {
        notifySpellContextChange(player, nextId, "switch");
    }
    return true;
}

function spellPlainName(spellId) {
    if (!spellId) return "未装填";
    if (!SPELL_CFG) return String(spellId);
    return SPELL_CFG.getSpellName(spellId) || String(spellId);
}

function spellSlotLabel(spellId, isSelected, isHovered) {
    var name = spellPlainName(spellId);
    // 指向优先 §d；已选 §b；未选 §7
    var c = isHovered ? "§d" : (isSelected ? "§b" : "§7");
    if (isHovered) return c + "[ ▶ " + name + " ◀ ]";
    if (isSelected) return c + "[ ◆ " + name + " ◆ ]";
    if (!spellId) return c + "[ ○ 未装填 ○ ]";
    return c + "[ ◇ " + name + " ◇ ]";
}

function locXYZ(world, x, y, z) {
    return new Location(world, Number(x), Number(y), Number(z));
}

function spawnOminousDetection(world, x, y, z) {
    var loc = locXYZ(world, x, y, z);
    try {
        if (PARTICLE_OMINOUS != null) {
            world.spawnParticle(PARTICLE_OMINOUS, loc, 1, 0, 0, 0, 0);
            return;
        }
    } catch (e0) {}
    try { world.spawnParticle(Particle.SOUL_FIRE_FLAME, loc, 1, 0, 0, 0, 0); } catch (e1) {}
}

function spawnDustTransition(world, x, y, z) {
    var loc = locXYZ(world, x, y, z);
    var size = Number(DUST_SIZE) || 0.95;
    if (PARTICLE_TRANSITION != null && DustTransitionClass != null) {
        try {
            world.spawnParticle(PARTICLE_TRANSITION, loc, 1, 0, 0, 0, 0,
                new DustTransitionClass(Color.fromRGB(80, 40, 160), Color.fromRGB(200, 120, 255), size));
            return;
        } catch (e0) {}
    }
    try {
        world.spawnParticle(Particle.DUST, loc, 1, 0, 0, 0, 0,
            new Particle.DustOptions(Color.fromRGB(120, 60, 200), size));
    } catch (e1) {}
}

/**
 * ominous：贴地圆环；dust：腰线圆环且更密更大
 */
function spawnRingParticles(player) {
    var pl = player.getLocation();
    var groundY = pl.getY() + OMINOUS_GROUND_Y;
    var dustY = pl.getY() + WAIST_OFFSET - RING_PARTICLE_Y_DOWN;
    var cx = pl.getX(), cz = pl.getZ();
    var w = player.getWorld();
    var i, ang, ominPts, dustPts;

    ominPts = Number(OMINOUS_POINTS) || 32;
    for (i = 0; i < ominPts; i++) {
        ang = (i / ominPts) * Math.PI * 2.0;
        spawnOminousDetection(w, cx + Math.cos(ang) * RING_RADIUS, groundY, cz + Math.sin(ang) * RING_RADIUS);
    }

    dustPts = Number(DUST_POINTS) || 64;
    for (i = 0; i < dustPts; i++) {
        // 相对 ominous 半步错开，视觉上更均匀
        ang = ((i + 0.5) / dustPts) * Math.PI * 2.0;
        spawnDustTransition(w, cx + Math.cos(ang) * RING_RADIUS, dustY, cz + Math.sin(ang) * RING_RADIUS);
    }
}

/**
 * 术式槽：整组聚在一起，方位按「开环瞬间朝向」吸附到相对 0°/120°/240°
 * （同扇区内不跟微调视角转；转身超过约 60° 才切到相邻边）
 * 信息行：另见 infoPanelOrigin，平滑跟随视角
 */
function yawToCardinal(yawDeg) {
    var y = normalizeYaw(yawDeg);
    if (y >= 315 || y < 45) return CARDINALS[0];
    if (y < 135) return CARDINALS[1];
    if (y < 225) return CARDINALS[2];
    return CARDINALS[3];
}

function captureRingFacing(player) {
    var uuid = String(player.getUniqueId().toString());
    var baseYaw = Number(player.getLocation().getYaw());
    try {
        ringFacingMap.put(mapUuidKey(uuid), {
            baseYaw: baseYaw,
            quads: buildRelativeQuads(baseYaw)
        });
    } catch (e) {}
}

function yawToRingQuad(uuid, yawDeg) {
    uuid = String(uuid);
    var facing = null;
    try { facing = ringFacingMap.get(mapUuidKey(uuid)); } catch (e) {}
    if (!facing || !facing.quads || !facing.quads.length) return yawToCardinal(yawDeg);
    var best = facing.quads[0];
    var bestD = yawDeltaAbs(yawDeg, best.yaw);
    for (var i = 1; i < facing.quads.length; i++) {
        var q = facing.quads[i];
        var d = yawDeltaAbs(yawDeg, q.yaw);
        if (d < bestD) {
            bestD = d;
            best = q;
        }
    }
    return best;
}

function spellPanelOrigin(player) {
    var loc = player.getLocation();
    var uuid = String(player.getUniqueId().toString());
    var c = yawToRingQuad(uuid, loc.getYaw());
    return {
        x: loc.getX() + c.fx * PANEL_DIST,
        y: loc.getY() + WAIST_OFFSET,
        z: loc.getZ() + c.fz * PANEL_DIST,
        b: { fx: c.fx, fz: c.fz, rx: c.rx, rz: c.rz },
        cardinal: c.name
    };
}

/** 信息行：始终在玩家视线正前方 */
function infoPanelOrigin(player) {
    var loc = player.getLocation();
    var b = basis(loc.getYaw());
    return {
        x: loc.getX() + b.fx * PANEL_DIST,
        y: loc.getY() + WAIST_OFFSET,
        z: loc.getZ() + b.fz * PANEL_DIST,
        b: b
    };
}

function spawnText(world, loc, text, ownerUuid) {
    var td = world.spawn(loc, TextDisplay.class);
    td.setText(String(text));
    td.setAlignment(TextAlignment.CENTER);
    td.setBillboard(Billboard.CENTER);
    td.setBackgroundColor(Color.fromARGB(140, 0, 16, 48));
    td.setSeeThrough(false);
    td.setDefaultBackground(false);
    td.setViewRange(64);
    td.setGravity(false);
    td.setInvulnerable(true);
    try { td.setShadowed(false); } catch (e0) {}
    try { td.setTeleportDuration(0); } catch (e1) {}
    try { td.setInterpolationDuration(0); } catch (e2) {}
    var pdc = td.getPersistentDataContainer();
    pdc.set(KEY_RING, PersistentDataType.STRING, "1");
    pdc.set(KEY_OWNER, PersistentDataType.STRING, String(ownerUuid));
    return td;
}

function entityOf(uuidStr) {
    try {
        var e = Bukkit.getEntity(UUID.fromString(String(uuidStr)));
        if (e != null && !e.isDead()) return e;
    } catch (ex) {}
    return null;
}

function clearOwnerDisplays(world, ownerUuid, sweepOrphans) {
    ownerUuid = String(ownerUuid);
    var gk = mapUuidKey(ownerUuid);
    var ents = null;
    try { ents = ringDisplaysMap.remove(gk); } catch (e0) {}
    if (ents == null) {
        try { ents = ringDisplaysMap.remove(ownerUuid); } catch (e0b) {}
    }
    if (ents != null) {
        for (var i = 0; i < ents.length; i++) {
            try {
                var ent = ents[i];
                if (ent != null && !ent.isDead()) ent.remove();
            } catch (e) {}
        }
    }
    if (sweepOrphans !== true || !world) return;
    try {
        var p = getOnline(ownerUuid);
        var center = p != null ? p.getLocation() : null;
        if (center == null) return;
        var nearby = world.getNearbyEntities(center, 24, 16, 24);
        var it = nearby.iterator();
        var swept = 0;
        var maxSweep = 32;
        while (it.hasNext() && swept < maxSweep) {
            var ent2 = it.next();
            try {
                var pdc = ent2.getPersistentDataContainer();
                if (!pdc.has(KEY_RING, PersistentDataType.STRING)) continue;
                if (String(pdc.get(KEY_OWNER, PersistentDataType.STRING)) === ownerUuid) {
                    ent2.remove();
                    swept++;
                }
            } catch (e2) {}
        }
    } catch (e3) {}
}

function getOnline(uuidStr) {
    uuidStr = String(uuidStr);
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].getUniqueId().toString()) === uuidStr) return arr[i];
        }
    } catch (e) {}
    return null;
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

function isRingOpen(uuid) {
    try {
        return ringOpenMap.containsKey(mapUuidKey(uuid));
    } catch (e) {
        return false;
    }
}

/** 假开环：有开环标记但无跟随任务 / 展示全死 → 清掉，否则站立右键永远施不出 */
function clearGhostRingIfNeeded(uuid) {
    uuid = String(uuid);
    if (!isRingOpen(uuid)) return false;
    var tid = null;
    try { tid = ringTaskIdsMap.get(mapUuidKey(uuid)); } catch (e0) {}
    var ents = null;
    try { ents = ringDisplaysMap.get(mapUuidKey(uuid)); } catch (e1) {}
    var anyAlive = false;
    if (ents != null) {
        for (var i = 0; i < ents.length; i++) {
            try {
                if (ents[i] != null && !ents[i].isDead()) { anyAlive = true; break; }
            } catch (e2) {}
        }
    }
    // 有任务或仍有展示 → 当真开环
    if (tid != null || anyAlive) return false;
    try { closeSpellRingByUuid(uuid); } catch (e3) {}
    return true;
}

function cancelRingTask(uuid) {
    uuid = String(uuid);
    try {
        var tid = ringTaskIdsMap.remove(mapUuidKey(uuid));
        if (tid != null) Bukkit.getScheduler().cancelTask(Number(tid));
    } catch (e) {
        try { ringTaskIdsMap.remove(mapUuidKey(uuid)); } catch (e2) {}
    }
}

function startRingTask(uuid) {
    uuid = String(uuid);
    cancelRingTask(uuid);
    try {
        var task = scheduleRepeating(function() {
            try { tickOneRing(uuid); } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC选术环] tick: " + e); } catch (e2) {}
            }
        }, 2, RING_TICK_PERIOD);
        // getTaskId() 已是 Integer；再 valueOf 会在 Graal 触发重载歧义
        ringTaskIdsMap.put(mapUuidKey(uuid), task.getTaskId());
    } catch (e3) {
        Bukkit.getLogger().warning("[GLTC选术环] 启动跟随任务失败: " + e3);
    }
}

function buildOffsets(capacity) {
    var offsets = [];
    capacity = Number(capacity) || 0;
    var rows = [], left = capacity;
    while (left > 0) {
        var n = Math.min(MAX_PER_ROW, left);
        rows.push(n);
        left -= n;
    }
    var rowExtraDown = Number(SLOT_ROW_EXTRA_DOWN) || 0;
    var sideCloser = Number(SLOT_SIDE_CLOSER) || 0;
    for (var r = 0; r < rows.length; r++) {
        var count = rows[r];
        var start = -(count - 1) * SLOT_GAP_X / 2.0;
        var up = r * SLOT_GAP_Y - (r >= 1 ? rowExtraDown : 0);
        for (var c = 0; c < count; c++) {
            var isSide = count >= 2 && (c === 0 || c === count - 1);
            // forward 为沿面板朝向；负值 = 朝玩家靠近
            offsets.push({
                right: start + c * SLOT_GAP_X,
                up: up,
                forward: isSide ? -sideCloser : 0
            });
        }
    }
    return offsets;
}

function slotPos(origin, offsets, i) {
    var off = offsets[i] || { right: 0, up: 0, forward: 0 };
    var fwd = Number(off.forward) || 0;
    return {
        x: origin.x + origin.b.rx * off.right + origin.b.fx * fwd,
        y: origin.y + off.up,
        z: origin.z + origin.b.rz * off.right + origin.b.fz * fwd
    };
}

function infoLines(player) {
    try {
        if (!MAGE_API || typeof MAGE_API.getTotalStats !== "function") {
            return ["§f" + player.getName(), "§7术士数据加载中…"];
        }
        var stats = MAGE_API.getTotalStats(player, false);
        var pp = Math.round(Number(stats.particlePower) * 1000) / 1000;
        var cur = Math.round(Number(stats.currentParticles) * 10) / 10;
        var max = Math.round(Number(stats.pituitaryCapacity) * 10) / 10;
        if (!isFinite(pp)) pp = 0;
        if (!isFinite(cur)) cur = 0;
        if (!isFinite(max)) max = 0;
        return [
            "§f" + player.getName() + "  §d术士等级 §f" + (stats.mageLevel || 0),
            "§b粒子强度 §f" + pp + "  §9粒子 §f" + cur + "§7/§f" + max
        ];
    } catch (e) {
        return ["§f" + player.getName(), "§c粒子面板读取失败"];
    }
}

function findLookedSlot(player, capacity) {
    var eye = player.getEyeLocation();
    var dir = eye.getDirection();
    var dx = dir.getX(), dy = dir.getY(), dz = dir.getZ();
    var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 1e-6) return -1;
    dx /= len; dy /= len; dz /= len;
    capacity = Number(capacity) || 0;
    var origin = spellPanelOrigin(player);
    var offsets = buildOffsets(capacity);
    var best = -1, bestDot = LOOK_MIN_DOT;
    for (var i = 0; i < capacity; i++) {
        var pos = slotPos(origin, offsets, i);
        var vx = pos.x - eye.getX(), vy = pos.y - eye.getY(), vz = pos.z - eye.getZ();
        var dist = Math.sqrt(vx * vx + vy * vy + vz * vz);
        if (dist < 0.15 || dist > LOOK_MAX_DIST) continue;
        vx /= dist; vy /= dist; vz /= dist;
        var dot = vx * dx + vy * dy + vz * dz;
        if (dot > bestDot) { bestDot = dot; best = i; }
    }
    return best;
}

/** 槽位：相对三向吸附整组；信息行：平滑跟视角 */
function updateDisplays(player, data) {
    var uuid = String(player.getUniqueId().toString());
    var world = player.getWorld();
    var capacity = Number(data.capacity) || 0;
    var spellOrigin = spellPanelOrigin(player);
    var infoOrigin = infoPanelOrigin(player);
    var offsets = buildOffsets(capacity);
    var hovered = findLookedSlot(player, capacity);
    var lines = infoLines(player);
    var need = capacity + lines.length;
    var ents = null;
    try { ents = ringDisplaysMap.get(mapUuidKey(uuid)); } catch (eGet) {}
    var ok = ents != null && ents.length === need;

    if (ok) {
        for (var i = 0; i < capacity; i++) {
            var ent = ents[i];
            if (!ent || ent.isDead()) { ok = false; break; }
            var pos = slotPos(spellOrigin, offsets, i);
            try {
                try { ent.setTeleportDuration(0); } catch (e0) {}
                ent.teleport(locXYZ(world, pos.x, pos.y, pos.z));
                ent.setText(spellSlotLabel(data.spells[i], i === data.selected, i === hovered));
            } catch (e1) { ok = false; break; }
        }
    }
    if (ok) {
        for (var li = 0; li < lines.length; li++) {
            var ent2 = ents[capacity + li];
            if (!ent2 || ent2.isDead()) { ok = false; break; }
            try {
                try { ent2.setTeleportDuration(0); } catch (e2) {}
                ent2.teleport(locXYZ(world,
                    infoOrigin.x,
                    infoOrigin.y - INFO_BELOW - li * INFO_LINE_GAP,
                    infoOrigin.z));
                ent2.setText(lines[li]);
            } catch (e3) { ok = false; break; }
        }
    }
    if (!ok) rebuildDisplays(player, data);
}

function rebuildDisplays(player, data) {
    var uuid = String(player.getUniqueId().toString());
    var world = player.getWorld();
    clearOwnerDisplays(world, uuid);

    var capacity = Number(data.capacity) || 0;
    var spellOrigin = spellPanelOrigin(player);
    var infoOrigin = infoPanelOrigin(player);
    var offsets = buildOffsets(capacity);
    var hovered = findLookedSlot(player, capacity);
    var ents = [];
    var i;

    for (i = 0; i < capacity; i++) {
        var pos = slotPos(spellOrigin, offsets, i);
        ents.push(spawnText(world, locXYZ(world, pos.x, pos.y, pos.z),
            spellSlotLabel(data.spells[i], i === data.selected, i === hovered), uuid));
    }
    var lines = infoLines(player);
    for (i = 0; i < lines.length; i++) {
        ents.push(spawnText(world,
            locXYZ(world,
                infoOrigin.x,
                infoOrigin.y - INFO_BELOW - i * INFO_LINE_GAP,
                infoOrigin.z),
            lines[i], uuid));
    }
    try { ringDisplaysMap.put(mapUuidKey(uuid), ents); } catch (ePut) {}
}

function tickOneRing(uuid) {
    uuid = String(uuid);
    if (!isRingOpen(uuid)) {
        cancelRingTask(uuid);
        return;
    }
    var p = getOnline(uuid);
    if (p == null || !p.isOnline()) {
        closeSpellRingByUuid(uuid);
        return;
    }
    var hand = p.getInventory().getItemInMainHand();
    if (!isMageStaffItem(hand) || hand.getAmount() !== 1) {
        closeSpellRing(p);
        // 未手持施术道具：清会话 + 层数
        notifySpellContextChange(p, "", "hold");
        sendRingChatOnce(p, "close", GLTC_PREFIX + C_MSG + "未手持施术道具，选术环已关闭");
        return;
    }
    var data = getStaffMeta(hand);
    if (!data) {
        closeSpellRing(p);
        return;
    }
    p.getInventory().setItemInMainHand(hand);
    var ringTick = 0;
    try {
        var rt = ringMovePulseMap.get(mapUuidKey(uuid));
        if (rt != null) ringTick = Number(rt) || 0;
    } catch (eRt) {}
    ringTick++;
    try { ringMovePulseMap.put(mapUuidKey(uuid), java.lang.Integer.parseInt(String(ringTick), 10)); } catch (ePut) {}
    var particleEvery = Number(RING_PARTICLE_EVERY) || 2;
    if (particleEvery < 1) particleEvery = 1;
    if (ringTick % particleEvery === 0) {
        spawnRingParticles(p);
    }
    try {
        var openedTick = ringOpenedAtTickMap.get(mapUuidKey(uuid));
        var curTick = currentServerTick();
        if (openedTick != null && curTick >= 0 && Number(openedTick) === curTick) {
            return;
        }
    } catch (eSkipOpenTick) {}
    try {
        updateDisplays(p, data);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC选术环] 更新文字失败: " + e);
        try { rebuildDisplays(p, data); } catch (e2) {}
    }
}

function syncRelatedMageData(player) {
    if (!player) return;
    try {
        if (!loadDeps() || !MAGE_API) return;
        var uuid = String(player.getUniqueId().toString());
        try { MAGE_API.invalidatePlayerCache(uuid); } catch (e0) {}
        try { MAGE_API.applyMageAttributes(player); } catch (e1) {}
        try {
            var stats = MAGE_API.getTotalStats(player, true);
            var cur = Number(MAGE_API.getCurrentParticles(uuid)) || 0;
            var cap = Number(stats.pituitaryCapacity) || 0;
            if (cur > cap) MAGE_API.setCurrentParticles(uuid, cap);
        } catch (e2) {}
    } catch (e) {}
}

function closeSpellRingByUuid(uuid) {
    uuid = String(uuid);
    cancelRingTask(uuid);
    try { ringOpenMap.remove(mapUuidKey(uuid)); } catch (e0) {}
    try { ringFacingMap.remove(mapUuidKey(uuid)); } catch (e1) {}
    var cached = null;
    try { cached = ringDisplaysMap.remove(mapUuidKey(uuid)); } catch (e2) {}
    try { ringMovePulseMap.remove(mapUuidKey(uuid)); } catch (e3) {}
    if (cached != null) {
        for (var i = 0; i < cached.length; i++) {
            try {
                var ent = cached[i];
                if (ent != null && !ent.isDead()) ent.remove();
            } catch (e4) {}
        }
    } else {
        var pClear = getOnline(uuid);
        if (pClear) clearOwnerDisplays(pClear.getWorld(), uuid, true);
    }
    var p = getOnline(uuid);
    if (p != null && p.isOnline()) syncRelatedMageData(p);
}

function closeSpellRing(player) {
    if (!player) return;
    closeSpellRingByUuid(String(player.getUniqueId().toString()));
}

var RING_OPEN_DEBOUNCE_MS = 600;

/** 跨上下文原子防抖 + 进行中锁：同一次物理开环只放行一次 */
function tryBeginRingOpen(uuid) {
    try {
        var gk = mapUuidKey(uuid);
        var lockMap = sharedConcurrentMap("gltc_ring_open_lock");
        if (lockMap.putIfAbsent(gk, java.lang.Boolean.TRUE) != null) {
            return false;
        }
        var openGate = sharedConcurrentMap("gltc_ring_open_gate_ms");
        var now = Date.now();
        var prev = openGate.putIfAbsent(gk, java.lang.Long.parseLong(String(Math.floor(now)), 10));
        if (prev != null) {
            lockMap.remove(gk);
            if (now - Number(prev) < RING_OPEN_DEBOUNCE_MS) return false;
            openGate.put(gk, java.lang.Long.parseLong(String(Math.floor(now)), 10));
            if (lockMap.putIfAbsent(gk, java.lang.Boolean.TRUE) != null) return false;
        }
        return true;
    } catch (eGate) {
        return true;
    }
}

function endRingOpen(uuid) {
    try { sharedConcurrentMap("gltc_ring_open_lock").remove(mapUuidKey(uuid)); } catch (e0) {}
}

function openSpellRing(player) {
    // 开环只需施术道具登记；MAGE 同步失败不应拦开环
    if (!ensureStaffCfg()) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "施术道具登记未加载。");
        return false;
    }
    try { loadDeps(); } catch (eLd) {}
    if (!requireSingleStaff(player)) return false;
    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "请手持施术道具。");
        return false;
    }
    player.getInventory().setItemInMainHand(hand);

    var uuid = String(player.getUniqueId().toString());
    if (!tryBeginRingOpen(uuid)) {
        return isRingOpen(uuid);
    }
    try {
        try {
            if (isRingOpen(uuid)) {
                var disp = ringDisplaysMap.get(mapUuidKey(uuid));
                if (disp != null && disp.length > 0) {
                    for (var dup = 0; dup < disp.length; dup++) {
                        try {
                            if (disp[dup] != null && !disp[dup].isDead()) return true;
                        } catch (eDup) {}
                    }
                }
            }
        } catch (eDupOpen) {}

        // 先清旧环（内部也会同步一次），再开环前再同步一次，保证数据最新
        closeSpellRingByUuid(uuid);
        syncRelatedMageData(player);

        // 开选术环：清掉自身全部术式会话效果（环绕/持续体等；层数保留）
        notifySpellContextChange(player, "", "ring");

        // 同步后重新读施术道具 meta（容量等）
        hand = player.getInventory().getItemInMainHand();
        data = getStaffMeta(hand);
        if (!data) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "请手持施术道具。");
            return false;
        }
        player.getInventory().setItemInMainHand(hand);

        try {
            ringOpenMap.put(mapUuidKey(uuid), java.lang.Integer.parseInt(String(Number(data.capacity) || 0), 10));
        } catch (eOpen) {}
        captureRingFacing(player);

        try {
            rebuildDisplays(player, data);
            spawnRingParticles(player);
        } catch (e) {
            Bukkit.getLogger().warning("[GLTC选术环] 开启失败: " + e);
        }
        try {
            var ot = currentServerTick();
            if (ot >= 0) ringOpenedAtTickMap.put(mapUuidKey(uuid), java.lang.Long.parseLong(String(Math.floor(ot)), 10));
        } catch (eOt) {}
        startRingTask(uuid);
        var hasTask = false;
        try { hasTask = ringTaskIdsMap.get(mapUuidKey(uuid)) != null; } catch (eT) {}
        if (!hasTask) {
            Bukkit.getLogger().warning("[GLTC选术环] 跟随任务未启动，将依赖移动事件刷新");
        }

        sendRingChatOnce(player, "open", GLTC_PREFIX + C_MSG + "唤出选术环。");
        return true;
    } finally {
        endRingOpen(uuid);
    }
}

function toggleSpellRing(player) {
    if (inRingToggleGrace(player)) return isRingOpen(String(player.getUniqueId().toString()));
    if (isRingActionOnCd(player)) return isRingOpen(String(player.getUniqueId().toString()));
    markRingActionCd(player);
    var uuid = String(player.getUniqueId().toString());
    if (isRingOpen(uuid)) {
        closeSpellRing(player);
        markRingToggleGrace(player);
        sendRingChatOnce(player, "close", GLTC_PREFIX + C_MSG + "选术环已关闭");
        return false;
    }
    var ok = openSpellRing(player);
    if (ok) markRingToggleGrace(player);
    return ok;
}

function trySelectLookedSlot(player) {
    if (isRingActionOnCd(player)) return true;
    if (!isRingOpen(String(player.getUniqueId().toString()))) return false;
    if (!requireSingleStaff(player)) return true;
    var hand = player.getInventory().getItemInMainHand();
    var data = getStaffMeta(hand);
    if (!data) return true;
    var slot = findLookedSlot(player, data.capacity);
    if (slot < 0) {
        // 未对准选槽：完全静默，不占选槽冷却
        return true;
    }
    markRingActionCd(player);
    if (setSelectedSpell(player, slot)) {
        var data2 = getStaffMeta(player.getInventory().getItemInMainHand());
        var sid = data2 ? data2.spells[slot] : null;
        var name = spellPlainName(sid);
        if (!sid) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "已成功选择空槽（未装填）！");
        } else {
            player.sendMessage(GLTC_PREFIX + C_MSG + "已成功选择" + C_SPELL + name + C_MSG + "术式！");
        }
        try {
            player.playSound(player.getLocation(), "minecraft:block.note_block.pling", 1.0, 2.0);
        } catch (e) {
            try { player.playSound(player.getLocation(), "block.note_block.pling", 1.0, 2.0); } catch (e2) {}
        }
        closeSpellRing(player);
    }
    return true;
}

function resolveSpellCooldownMs(player, baseCd) {
    var need = Number(baseCd) || 1000;
    try {
        if (MAGE_API && typeof MAGE_API.calcSpellCooldownMs === "function") {
            need = Number(MAGE_API.calcSpellCooldownMs(player, baseCd || 1000));
        }
    } catch (e) {
        need = Number(baseCd) || 1000;
    }
    if (!isFinite(need) || need < 50) need = 50;
    return need;
}

/** 仅查询冷却；commit=true 时写入（应在施术成功后调用） */
function checkCastCooldown(player, spellId, baseCd, commit) {
    var key = player.getUniqueId().toString() + "|" + spellId;
    var now = Date.now();
    var need = resolveSpellCooldownMs(player, baseCd);
    var last = castCdMap.get(key);
    if (last != null) {
        var elapsed = now - Number(last);
        if (elapsed < need) return { ok: false, left: need - elapsed, need: need };
    }
    if (commit) castCdMap.put(key, now);
    return { ok: true, need: need };
}

function getMageLevel(player) {
    try {
        var stats = MAGE_API.getTotalStats(player, false);
        return Math.max(0, Number(stats.mageLevel) || 0);
    } catch (e) {
        try {
            var data = MAGE_API.getPlayerStats(player.getUniqueId().toString());
            return Math.max(0, Number(data.mageLevel) || 0);
        } catch (e2) {
            return 0;
        }
    }
}

function getPlayerMaxHealth(player) {
    try {
        var attr = player.getAttribute(Java.type("org.bukkit.attribute.Attribute").GENERIC_MAX_HEALTH);
        if (attr != null) return Number(attr.getValue());
    } catch (e) {}
    try {
        var attr2 = player.getAttribute(Java.type("org.bukkit.attribute.Attribute").MAX_HEALTH);
        if (attr2 != null) return Number(attr2.getValue());
    } catch (e2) {}
    try { return Number(player.getMaxHealth()); } catch (e3) { return 20; }
}

/**
 * 等级 vs 环数：
 *   等级 > 环数 → 粒子 × OVERLEVEL_COST_MULT（取整，最低 1）
 *   等级 < 环数 → 侵蚀 = 环数 - 等级；粒子 × 侵蚀；施术后自伤侵蚀 × EROSION_HP_PCT × 最大生命
 *   等级 = 环数 → 原消耗
 */
function resolveCastCost(player, spell) {
    var baseCost = Math.max(0, Math.floor(Number(spell.cost) || 0));
    var ring = spell.ring != null ? Number(spell.ring) : 1;
    if (!(ring > 0)) ring = 1;
    var level = getMageLevel(player);
    var erosion = 0;
    var cost = baseCost;

    if (level > ring) {
        if (baseCost > 0) cost = Math.max(1, Math.floor(baseCost * OVERLEVEL_COST_MULT));
    } else if (level < ring) {
        erosion = Math.floor(ring - level);
        if (erosion < 1) erosion = 1;
        if (baseCost > 0) cost = Math.max(1, Math.floor(baseCost * erosion));
    }

    return { cost: cost, baseCost: baseCost, ring: ring, level: level, erosion: erosion };
}

/** 侵蚀自伤：直扣生命（按最大生命百分比，不吃护甲） */
function applyErosionSelfDamage(player, erosion) {
    if (!(erosion > 0) || !player || !player.isOnline()) return 0;
    var maxHp = getPlayerMaxHealth(player);
    if (!(maxHp > 0)) return 0;
    var dmg = erosion * EROSION_HP_PCT * maxHp;
    if (!(dmg > 0)) return 0;
    try {
        var next = Number(player.getHealth()) - dmg;
        if (next <= 0) {
            try { player.setHealth(0); } catch (e0) {
                try { player.damage(Math.max(dmg, 1000)); } catch (e1) {}
            }
        } else {
            player.setHealth(next);
        }
    } catch (e2) {
        try {
            player.setNoDamageTicks(0);
            player.damage(dmg);
        } catch (e3) {}
    }
    return dmg;
}

function tryCastSelected(player, opts) {
    opts = opts || {};
    if (!loadDeps()) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "施术系统未加载。");
        return { ok: false };
    }
    // 蹲下右键只负责选术环 / 施术道具护身技，禁止施术
    if (player.isSneaking()) return { ok: false };
    if (!requireSingleStaff(player)) return { ok: false };
    clearGhostRingIfNeeded(String(player.getUniqueId().toString()));
    if (isRingOpen(String(player.getUniqueId().toString()))) return { ok: false };

    var uuid = String(player.getUniqueId().toString());
    // 同帧双入口硬锁：过期锁自动清；只有抢到锁的调用才允许在 finally 里释放
    var acquired = false;
    try {
        var prev = castInFlightMap.get(mapUuidKey(uuid));
        if (prev != null) {
            var age = Date.now() - Number(prev);
            if (age >= 0 && age < 3000) return { ok: false };
            try { castInFlightMap.remove(mapUuidKey(uuid)); } catch (eStale) {}
        }
        var raced = castInFlightMap.putIfAbsent(mapUuidKey(uuid), java.lang.Long.parseLong(String(Math.floor(Date.now())), 10));
        if (raced != null) return { ok: false };
        acquired = true;
    } catch (eLock) {
        try {
            if (castInFlightMap.containsKey(mapUuidKey(uuid))) return { ok: false };
            castInFlightMap.put(mapUuidKey(uuid), java.lang.Long.parseLong(String(Math.floor(Date.now())), 10));
            acquired = true;
        } catch (eLock2) {
            return { ok: false };
        }
    }

    try {
        clearGhostRingIfNeeded(uuid);
        if (isRingOpen(uuid)) return { ok: false };

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
        // Graal 跨上下文 typeof === "function" 常误判；只拦 null
        if (!spell || spell.cast == null) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "未知术式：" + spellId);
            return { ok: false };
        }
        var resolved = resolveCastCost(player, spell);
        var cost = resolved.cost;
        if (!MAGE_API.canAffordSpell(player, cost)) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "粒子不足（需要 §b" + cost + C_MSG + "）。");
            return { ok: false };
        }
        var cd = checkCastCooldown(player, spellId, spell.cooldownMs || 1000, false);
        if (!cd.ok) {
            sendRingChatOnce(player, "cast_cd",
                GLTC_PREFIX + C_MSG + "冷却中 §7(" + Math.ceil(cd.left / 100) / 10 + "s)");
            return { ok: false };
        }
        if (!MAGE_API.consumeParticles(player, cost)) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "粒子不足。");
            return { ok: false };
        }
        checkCastCooldown(player, spellId, spell.cooldownMs || 1000, true);
        var sessApi = getSpellSessionApi();
        if (sessApi && typeof sessApi.clear === "function") {
            try {
                sessApi.clear(player, { onlySpellId: String(spellId), reason: "recast" });
            } catch (eRc) {}
        }
        notifySpellContextChange(player, String(spellId), "cast");
        var castOk = false;
        try {
            var ret = spell.cast(player, MAGE_API);
            // 部分术式返回 undefined 也视为成功
            castOk = (ret !== false && ret !== 0);
        } catch (e) {
            Bukkit.getLogger().warning("[GLTC施术] 术式异常 " + spellId + ": " + e);
        }
        if (!castOk) {
            try {
                var cur = MAGE_API.getCurrentParticles(player.getUniqueId().toString());
                MAGE_API.setCurrentParticles(player.getUniqueId().toString(), cur + cost);
            } catch (e2) {}
            try {
                castCdMap.remove(player.getUniqueId().toString() + "|" + spellId);
            } catch (eCd) {}
            player.sendMessage(GLTC_PREFIX + C_MSG + "施术失败。");
            return { ok: false };
        }

        var erosionDmg = 0;
        if (resolved.erosion > 0) {
            erosionDmg = applyErosionSelfDamage(player, resolved.erosion);
        }

        var ring = resolved.ring;
        var spellName = spell.name || spellPlainName(spellId) || spellId;
        player.sendMessage(GLTC_PREFIX + C_MSG + "消耗 §b" + cost + C_MSG + "粒子 使用 "
            + C_SPELL + ring + "环术式 " + spellName);
        if (resolved.erosion > 0 && erosionDmg > 0) {
            player.sendMessage(GLTC_PREFIX + C_MSG + "侵蚀等级 §c" + resolved.erosion
                + C_MSG + " · 反噬 §c" + (Math.round(erosionDmg * 10) / 10) + C_MSG + " 生命");
        }
        if (opts.onAfterCast != null) {
            invokeStaffConsumer(opts.onAfterCast, player);
        }
        return { ok: true, spell: spell, spellId: spellId, cost: cost, erosion: resolved.erosion };
    } finally {
        if (acquired) {
            try { castInFlightMap.remove(mapUuidKey(uuid)); } catch (eFin) {}
        }
    }
}

/**
 * 操作约定：
 *   站立右键 → 施术（环开着则选槽）
 *   站立左键 → 环开着选槽；否则术式左键钩子（如花如画卷投掷）
 *   蹲下右键 → 开关选术环；唤出成功时同时触发 onSneakUse；绝不施术
 */
function handleStaffUse(player, opts) {
    if (!player || !(player instanceof Player)) return;
    if (shouldClickDebounce(player)) return;
    if (!requireSingleStaff(player)) return;
    opts = mergeStaffOpts(player, opts);
    var uuid = String(player.getUniqueId().toString());
    try { lastMainStaffMap.put(mapUuidKey(uuid), java.lang.Boolean.TRUE); } catch (eLs) {}

    if (player.isSneaking()) {
        // 宽限内：刚开/关过，忽略连触（防止开环立刻被第二次事件关掉）
        if (inRingToggleGrace(player)) return;

        // 已开环 → 只关闭，不放技能、不施术
        if (isRingOpen(uuid)) {
            toggleSpellRing(player);
            return;
        }
        // 先打宽限再开环：避免开环过程中二次事件读到已开状态后立刻关掉
        markRingActionCd(player);
        markRingToggleGrace(player);
        var opened = openSpellRing(player);
        if (opened) {
            // 开环成功：写短时 token，由道具脚本在本上下文领取护身（勿跨上下文调 JS）
            try {
                setMetaLong(player, "gltc_staff_sneak_ability_token", Date.now());
            } catch (eTok) {}
        }
        return;
    }
    // 假开环会挡施术：先治愈
    clearGhostRingIfNeeded(uuid);
    if (isRingOpen(uuid)) {
        // 对准槽 → 选术；未对准 → 关环并施术（避免环开着却施不出）
        var handRing = player.getInventory().getItemInMainHand();
        var dataRing = getStaffMeta(handRing);
        var slot = (dataRing != null) ? findLookedSlot(player, dataRing.capacity) : -1;
        if (slot >= 0) {
            trySelectLookedSlot(player);
            return;
        }
        closeSpellRing(player);
        markRingToggleGrace(player);
    }
    tryCastSelected(player, opts);
}

/** 术式左键：一律走术式会话 API（各术式自行 registerActiveLeftClick） */
function trySpellLeftClick(player) {
    if (!player || !(player instanceof Player)) return false;
    if (player.isSneaking()) return false;
    // 未手持施术道具时不触发任何术式左键（含有状态左键）
    if (!isMageStaffItem(player.getInventory().getItemInMainHand())) return false;
    try {
        if (player.getInventory().getItemInMainHand().getAmount() !== 1) return false;
    } catch (eAmt) { return false; }
    try {
        var sess = getSpellSessionApi();
        if (sess && typeof sess.handleLeftClick === "function") {
            return sess.handleLeftClick(player, getSelectedSpellId);
        }
    } catch (eHook) {}
    return false;
}

function handleStaffLeftClick(player) {
    if (!player || !(player instanceof Player)) return false;
    if (!isMageStaffItem(player.getInventory().getItemInMainHand())) return false;
    if (!requireSingleStaff(player)) return true;
    // 蹲下左键不触发术式逻辑（蹲下仅右键管选术环）
    if (player.isSneaking()) return true;
    var uuid = String(player.getUniqueId().toString());
    clearGhostRingIfNeeded(uuid);
    if (isRingOpen(uuid)) {
        trySelectLookedSlot(player);
        return true;
    }
    trySpellLeftClick(player);
    return true;
}

var SPELL_CORE_LISTENER_VER = 13;

function resetSpellCoreRingState() {
    try {
        try {
            var taskIt = ringTaskIdsMap.entrySet().iterator();
            while (taskIt.hasNext()) {
                var te = taskIt.next();
                try { Bukkit.getScheduler().cancelTask(Number(te.getValue())); } catch (eC) {}
            }
        } catch (eTasks) {}
        try { ringTaskIdsMap.clear(); } catch (e0) {}
        try { ringOpenMap.clear(); } catch (e1) {}
        try { ringFacingMap.clear(); } catch (e2) {}
        try {
            var dispIt = ringDisplaysMap.entrySet().iterator();
            while (dispIt.hasNext()) {
                var de = dispIt.next();
                var oldEnts = de.getValue();
                if (oldEnts != null) {
                    for (var di = 0; di < oldEnts.length; di++) {
                        try {
                            if (oldEnts[di] != null && !oldEnts[di].isDead()) oldEnts[di].remove();
                        } catch (eRm) {}
                    }
                }
            }
        } catch (eClr) {}
        try { ringDisplaysMap.clear(); } catch (e3) {}
        try { ringMovePulseMap.clear(); } catch (e4) {}
        try { castInFlightMap.clear(); } catch (e5) {}
    } catch (eR) {}
}

/** @param opts.force 仅热重载时 true：清环状态并强制重挂监听 */
function purgePlayerStaffMaps(uuid) {
    uuid = String(uuid);
    var gk = mapUuidKey(uuid);
    try { castInFlightMap.remove(gk); } catch (e0) {}
    try { ringActionCdMap.remove(uuid); } catch (e1) {}
    try { ringChatGateMap.remove(uuid); } catch (e2) {}
    try { staffUseMsMap.remove(gk); } catch (e3) {}
    try { staffUseMsMap.remove(uuid); } catch (e3b) {}
    try { staffUseTickMap.remove(gk); } catch (e4) {}
    try { staffUseTickMap.remove(uuid); } catch (e4b) {}
    try { staffInteractTickMap.remove(gk); } catch (e5) {}
    try { lastMainStaffMap.remove(gk); } catch (e6) {}
    try { ringMovePulseMap.remove(gk); } catch (e7) {}
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
        var huimo = PLUGIN.gltc_huimo_ability_cd;
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
            for (var i = 0; i < list.size(); i++) {
                unregisterSpellCoreListenerInstance(list.get(i));
            }
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
        resetSpellCoreRingState();
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

    // 主手施术道具：Interact 为主；SF onUse 可作兜底（同走 handleStaffUse + 防抖去重）
    var interactExecutor = function(l, event) {
        try {
            if (event.getHand() != null && event.getHand() !== EquipmentSlot.HAND) return;
            var actionName = "";
            try { actionName = String(event.getAction().name()); } catch (eAct) {}
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
            markStaffInteractHandled(who);
            event.setCancelled(true);
            try {
                if (EventResult != null) {
                    event.setUseItemInHand(EventResult.DENY);
                    event.setUseInteractedBlock(EventResult.DENY);
                }
            } catch (eDeny) {}
            handleStaffUse(who, getStaffHooksFor(who));
        } catch (e) {
            try { Bukkit.getLogger().warning("[GLTC施术] interact: " + e); } catch (e2) {}
        }
    };
    try {
        Bukkit.getPluginManager().registerEvent(
            PlayerInteractEvent, listenerInstance, EventPriority.LOWEST,
            interactExecutor, PLUGIN
        );
    } catch (eReg) {
        try {
            Bukkit.getLogger().warning("[GLTC施术] Interact 注册失败: " + eReg);
        } catch (e2) {}
    }

    try {
        Bukkit.getPluginManager().registerEvent(
            EntityDamageByEntityEvent, listenerInstance, EventPriority.NORMAL,
            function(l, event) {
                try {
                    if (event.isCancelled()) return;
                    var damager = damageByEntityDamager(event);
                    if (damager == null || !(damager instanceof Player)) return;
                    // 异能武器等非施术道具：直接跳过，避免与武器左键抢事件
                    if (!isMageStaffItem(damager.getInventory().getItemInMainHand())) return;
                    if (!requireSingleStaff(damager)) return;
                    if (damager.isSneaking()) return;
                    var uuid = String(damager.getUniqueId().toString());
                    clearGhostRingIfNeeded(uuid);
                    if (isRingOpen(uuid)) return;
                    if (trySpellLeftClick(damager)) {
                        event.setCancelled(true);
                    }
                } catch (eDmg) {
                    try { Bukkit.getLogger().warning("[GLTC施术] leftAttack: " + eDmg); } catch (eDmg2) {}
                }
            }, PLUGIN
        );
    } catch (eDmgReg) {
        try { Bukkit.getLogger().warning("[GLTC施术] leftAttack 注册失败: " + eDmgReg); } catch (eDmg3) {}
    }

    Bukkit.getPluginManager().registerEvent(
        PlayerQuitEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var quuid = String(event.getPlayer().getUniqueId().toString());
                closeSpellRingByUuid(quuid);
                purgePlayerStaffMaps(quuid);
                try { lastMainStaffMap.remove(mapUuidKey(quuid)); } catch (eLs) {}
                var sess = getSpellSessionApi();
                if (sess) sess.clear(quuid, { reason: "quit" });
                try {
                    if (sess && sess.stacks) sess.stacks.clear(quuid, null, null);
                } catch (eSt) {}
            } catch (e) {}
        }, PLUGIN
    );

    Bukkit.getPluginManager().registerEvent(
        PlayerItemHeldEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var p = event.getPlayer();
                if (isRingOpen(String(p.getUniqueId().toString()))) {
                    closeSpellRing(p);
                    sendRingChatOnce(p, "close", GLTC_PREFIX + C_MSG + "切换主手，选术环已关闭");
                }
                // 换快捷栏：清空所有术式会话与层数
                notifySpellContextChange(p, "", "hotbar");
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
                var p = who;
                Bukkit.getScheduler().runTask(PLUGIN, function() {
                    try { syncStaffHoldState(p, "hold"); } catch (eH) {}
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
    toggleSpellRing: toggleSpellRing,
    openSpellRing: openSpellRing,
    closeSpellRing: closeSpellRing,
    getStaffMeta: getStaffMeta,
    setSelectedSpell: setSelectedSpell,
    writeStaffMeta: writeStaffMeta,
    isMageStaffItem: isMageStaffItem,
    isRingOpen: isRingOpen,
    registerStaffHooks: registerStaffHooks,
    getSpellSessionApi: getSpellSessionApi,
    notifySpellContextChange: notifySpellContextChange,
    /** 热重载后监听丢失时由道具脚本调用；勿在普通右键/onUse 里 force=true */
    ensureListeners: function(force) { registerListeners({ force: !!force }); },
    isStaffUseHandledByInteract: isStaffUseHandledByInteract,
    shouldSkipStaffOnUse: shouldSkipStaffOnUse
};
try { PLUGIN.gltcCastApi = CAST_API_EXPORT; } catch (eCastApi) {}
try { PLUGIN.gltcStaffUseInteractOnly = true; } catch (eFlag) {}
CAST_API_EXPORT;
