/**
 * 术式共用工具（由各术式脚本自行 eval 或复制使用）
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");

var META_SPELL_HIT = "gltc_spell_hit_info";
var META_SPELL_DMG_LISTENER = "gltc_spell_dmg_listener";
/** 伤害监听器版本：升高后强制重挂，以便热重载吃到新播报格式 */
var SPELL_DMG_LISTENER_VER = 3;

var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
/** 常规提示 &#fff5b3 */
var C_MSG = "§x§f§f§f§5§b§3";
/** 术式名称播报 &#62c6ff */
var C_SPELL = "§x§6§2§c§6§f§f";
/** 伤害数值 */
var C_DMG = "§c";

/** 伤害类型（与便利/A.yml「播报」渐变一致） */
var DMG_TYPE_PHYSICAL = "physical";
var DMG_TYPE_PARTICLE = "particle";
var DMG_TYPE_PULSE = "pulse";

function getPlugin() {
    return Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
}

/**
 * A.yml 播报标签：物理 / 粒子 / 脉冲 +「伤害」
 * &#d79586物&#cf8377理&#c67168伤&#be5f59害
 * &#9686d7粒&#9577cf子&#9368c6伤&#9259be害
 * &#ea72c9脉&#e565a1冲&#df577a伤&#da4a52害
 * type: physical | particle | pulse
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
    return C_MSG + "伤害";
}

/**
 * 统一命中播报。
 * info: { name, ring?, damageType, kind? }  kind=ability 时不写「x环术式」
 */
function formatSpellHitMessage(info, finalDmg) {
    info = info || {};
    var typeLabel = damageTypeLabel(info.damageType || info.type);
    var amt = C_DMG + formatDamage(finalDmg);
    if (info.kind === "ability") {
        var an = info.name ? String(info.name) : "未知技能";
        return GLTC_PREFIX + C_SPELL + an + C_MSG + " 造成了 " + amt + " " + typeLabel;
    }
    var ring = info.ring != null ? info.ring : 1;
    var name = info.name ? String(info.name) : "未知术式";
    return GLTC_PREFIX + C_SPELL + ring + "环术式 " + name
        + C_MSG + " 造成了 " + amt + " " + typeLabel;
}

function announceSpellHit(attacker, info, finalDmg) {
    if (!attacker || !(finalDmg > 0)) return;
    try {
        attacker.sendMessage(formatSpellHitMessage(info, finalDmg));
    } catch (e) {}
}

function publishHitAnnounceApi() {
    try {
        var p = getPlugin();
        if (p == null) return;
        p.gltcFormatSpellHitMessage = formatSpellHitMessage;
        p.gltcAnnounceSpellHit = announceSpellHit;
        p.gltcDamageTypeLabel = damageTypeLabel;
    } catch (e) {}
}

function spawnDust(world, loc, r, g, b, count, size) {
    try {
        world.spawnParticle(Particle.DUST, loc, count, 0.05, 0.05, 0.05, 0,
            new Particle.DustOptions(Color.fromRGB(r, g, b), size || 1.0));
    } catch (e) {
        try { world.spawnParticle(Particle.CRIT, loc, count, 0.1, 0.1, 0.1, 0.01); } catch (e2) {}
    }
}

function rayHitLiving(player, start, dir, maxDist, step) {
    var world = player.getWorld();
    var steps = Math.ceil(maxDist / step);
    for (var i = 1; i <= steps; i++) {
        var loc = start.clone().add(dir.clone().multiply(i * step));
        var near = world.getNearbyEntities(loc, 0.55, 0.55, 0.55);
        var it = near.iterator();
        while (it.hasNext()) {
            var ent = it.next();
            if (ent instanceof LivingEntity && ent !== player) return { entity: ent, loc: loc };
        }
    }
    return null;
}

function formatDamage(n) {
    var v = Math.round(Number(n) * 10) / 10;
    if (v === Math.floor(v)) return String(Math.floor(v));
    return String(v);
}

function metaValue(plugin, key) {
    try {
        if (!plugin.hasMetadata(key)) return null;
        var list = plugin.getMetadata(key);
        if (list == null || list.isEmpty()) return null;
        return list.get(0).value();
    } catch (e) {
        return null;
    }
}

function metaSet(plugin, key, value) {
    try { plugin.removeMetadata(key, plugin); } catch (e0) {}
    try {
        plugin.setMetadata(key, new FixedMetadataValue(plugin, value));
        return true;
    } catch (e1) {
        return false;
    }
}

/**
 * 注册一次：读取术式标记伤害的最终值（含护甲/减伤），向施术者播报。
 */
function ensureSpellDamageListener() {
    var plugin = getPlugin();
    if (!plugin) return;
    publishHitAnnounceApi();
    try {
        if (plugin.gltcSpellDmgListener != null
            && Number(plugin.gltcSpellDmgListenerVer) === SPELL_DMG_LISTENER_VER) return;
    } catch (e0) {}
    try {
        if (plugin.gltcSpellDmgListener != null) {
            try { EntityDamageByEntityEvent.getHandlerList().unregister(plugin.gltcSpellDmgListener); } catch (eU) {}
            plugin.gltcSpellDmgListener = null;
        }
    } catch (e1) {}

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    try {
        plugin.gltcSpellDmgListener = listenerInstance;
        plugin.gltcSpellDmgListenerVer = SPELL_DMG_LISTENER_VER;
    } catch (e2) {}
    metaSet(plugin, META_SPELL_DMG_LISTENER, true);

    Bukkit.getPluginManager().registerEvent(
        EntityDamageByEntityEvent, listenerInstance, EventPriority.MONITOR,
        function(l, event) {
            try {
                var victim = event.getEntity();
                if (!(victim instanceof LivingEntity)) return;
                if (!victim.hasMetadata(META_SPELL_HIT)) return;
                var list = victim.getMetadata(META_SPELL_HIT);
                if (list == null || list.isEmpty()) return;
                var info = list.get(0).value();
                try { victim.removeMetadata(META_SPELL_HIT, plugin); } catch (eRm) {}
                if (!info || event.isCancelled()) return;

                var finalDmg = 0;
                try { finalDmg = Number(event.getFinalDamage()); } catch (eFd) {
                    try { finalDmg = Number(event.getDamage()); } catch (eD) { return; }
                }
                if (!(finalDmg > 0)) return;

                var attacker = null;
                try {
                    var online = Bukkit.getOnlinePlayers().toArray();
                    for (var i = 0; i < online.length; i++) {
                        if (online[i].getUniqueId().toString() === String(info.attackerUuid)) {
                            attacker = online[i];
                            break;
                        }
                    }
                } catch (eP) {}
                if (attacker == null || !attacker.isOnline()) return;

                try {
                    if (typeof plugin.gltcAnnounceSpellHit === "function") {
                        plugin.gltcAnnounceSpellHit(attacker, info, finalDmg);
                    } else {
                        announceSpellHit(attacker, info, finalDmg);
                    }
                } catch (eA) {
                    announceSpellHit(attacker, info, finalDmg);
                }
            } catch (ex) {}
        }, plugin
    );
}

/**
 * 物理术式伤害：走原版 damage（吃护甲），并在结算后播报实际伤害。
 * spellInfo: { ring, name, kind? }
 */
function dealPhysicalSpellDamage(target, amount, attacker, spellInfo) {
    if (!target || !(target instanceof LivingEntity) || !(amount > 0) || !attacker) return;
    var plugin = getPlugin();
    if (!plugin) return;
    ensureSpellDamageListener();

    var info = {
        ring: spellInfo && spellInfo.ring != null ? spellInfo.ring : 1,
        name: spellInfo && spellInfo.name ? String(spellInfo.name) : "未知术式",
        kind: spellInfo && spellInfo.kind ? String(spellInfo.kind) : "spell",
        damageType: DMG_TYPE_PHYSICAL,
        attackerUuid: attacker.getUniqueId().toString()
    };
    try {
        target.setNoDamageTicks(0);
        target.setMetadata(META_SPELL_HIT, new FixedMetadataValue(plugin, info));
        target.damage(amount, attacker);
    } catch (e) {
        try { target.damage(amount); } catch (e2) {}
    }
    // 勿在 finally 里立刻清 metadata：部分环境下事件可能尚未跑完 MONITOR。
    // 监听器成功消费后会清；若仍残留则下一 tick 兜底清理。
    scheduleSpellHitMetaCleanup(target, plugin);
}

/**
 * 清理术式命中 metadata（与物理共用）。
 */
function scheduleSpellHitMetaCleanup(target, plugin) {
    try {
        if (target.hasMetadata(META_SPELL_HIT)) {
            Bukkit.getScheduler().runTask(plugin, function() {
                try {
                    if (target.hasMetadata(META_SPELL_HIT)) target.removeMetadata(META_SPELL_HIT, plugin);
                } catch (e3) {}
            });
        }
    } catch (e4) {
        try { target.removeMetadata(META_SPELL_HIT, plugin); } catch (e5) {}
    }
}

/**
 * 粒子术式伤害：MAGIC 成因，吃粒子折射 + 最终减伤（不走脉冲），播报实际最终伤害。
 * spellInfo: { ring, name, kind? }
 */
function dealParticleSpellDamage(target, amount, attacker, spellInfo) {
    if (!target || !(target instanceof LivingEntity) || !(amount > 0) || !attacker) return;
    var plugin = getPlugin();
    if (!plugin) return;
    ensureSpellDamageListener();

    var info = {
        ring: spellInfo && spellInfo.ring != null ? spellInfo.ring : 1,
        name: spellInfo && spellInfo.name ? String(spellInfo.name) : "未知术式",
        kind: spellInfo && spellInfo.kind ? String(spellInfo.kind) : "spell",
        damageType: DMG_TYPE_PARTICLE,
        attackerUuid: attacker.getUniqueId().toString()
    };
    try {
        target.setNoDamageTicks(0);
        target.setMetadata(META_SPELL_HIT, new FixedMetadataValue(plugin, info));
        var dealt = false;
        try {
            var DamageSource = Java.type("org.bukkit.damage.DamageSource");
            var DamageType = Java.type("org.bukkit.damage.DamageType");
            var src = DamageSource.builder(DamageType.MAGIC)
                .withCausingEntity(attacker)
                .withDirectEntity(attacker)
                .build();
            target.damage(amount, src);
            dealt = true;
        } catch (eDs) {}
        if (!dealt) {
            // 无 DamageSource API：至少吃最终减伤；折射依赖 MAGIC 成因可能吃不到
            target.damage(amount, attacker);
        }
    } catch (e) {
        try { target.damage(amount); } catch (e2) {}
    }
    scheduleSpellHitMetaCleanup(target, plugin);
}

/**
 * 脉冲术式伤害：忽略最终减伤/折射，直接播报结算值（含伤害类型）。
 * spellInfo: { ring, name, kind? }  kind="ability" 用于施术道具护身技
 */
function dealPulseSpellDamage(target, amount, attacker, spellInfo, mageApi) {
    if (!target || !(target instanceof LivingEntity) || !(amount > 0) || !attacker) return;
    var plugin = getPlugin();
    if (!plugin) return;
    ensureSpellDamageListener();

    var info = {
        ring: spellInfo && spellInfo.ring != null ? spellInfo.ring : 1,
        name: spellInfo && spellInfo.name ? String(spellInfo.name) : "未知术式",
        kind: spellInfo && spellInfo.kind ? String(spellInfo.kind) : "spell",
        damageType: DMG_TYPE_PULSE,
        attackerUuid: attacker.getUniqueId().toString()
    };
    try {
        target.setNoDamageTicks(0);
        target.setMetadata(META_SPELL_HIT, new FixedMetadataValue(plugin, info));
        if (mageApi && typeof mageApi.dealPulseDamage === "function") {
            mageApi.dealPulseDamage(target, amount, attacker);
        } else {
            target.damage(amount, attacker);
        }
    } catch (e) {
        try { target.damage(amount); } catch (e2) {}
    }
    scheduleSpellHitMetaCleanup(target, plugin);
}

/**
 * 展示实体飞行弹体：优先 ItemDisplay。
 * 位移用实体 teleport（teleportDuration=1 客户端平滑）；transformation 只做缩放。
 * 勿用 translation 插值位移——易与客户端插值叠出「乱飘」。
 * 失败时回退隐形盔甲架。
 * @returns {{entity, kind, anchor, scale}|null}
 */
function spawnFlyingItemDisplay(world, loc, mat, scale) {
    if (world == null || loc == null || mat == null) return null;
    var sc = scale != null ? Number(scale) : 0.85;
    if (!(sc > 0)) sc = 0.85;

    try {
        var ItemDisplay = Java.type("org.bukkit.entity.ItemDisplay");
        var Billboard = Java.type("org.bukkit.entity.Display$Billboard");
        var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
        var Transformation = Java.type("org.bukkit.util.Transformation");
        var Vector3f = Java.type("org.joml.Vector3f");
        var AxisAngle4f = Java.type("org.joml.AxisAngle4f");
        var d = world.spawn(loc, ItemDisplay.class);
        d.setItemStack(new ItemStack(mat, 1));
        try { d.setBillboard(Billboard.CENTER); } catch (e0) {}
        try {
            var Brightness = Java.type("org.bukkit.entity.Display$Brightness");
            d.setBrightness(new Brightness(15, 15));
        } catch (e1) {}
        // 根实体每 tick 传送；客户端按 teleportDuration 平滑
        try { d.setTeleportDuration(1); } catch (e2) {}
        try { d.setInterpolationDelay(0); } catch (e3) {}
        try { d.setInterpolationDuration(0); } catch (e4) {}
        try {
            d.setTransformation(new Transformation(
                new Vector3f(0, 0, 0),
                new AxisAngle4f(0, 0, 0, 1),
                new Vector3f(sc, sc, sc),
                new AxisAngle4f(0, 0, 0, 1)
            ));
        } catch (e5) {}
        return { entity: d, kind: "display", anchor: loc.clone(), scale: sc };
    } catch (eDisp) {}

    try {
        var ArmorStand = Java.type("org.bukkit.entity.ArmorStand");
        var ItemStack2 = Java.type("org.bukkit.inventory.ItemStack");
        var EulerAngle = Java.type("org.bukkit.util.EulerAngle");
        var stand = world.spawn(loc, ArmorStand.class);
        stand.setVisible(false);
        stand.setGravity(false);
        stand.setMarker(true);
        stand.setSmall(true);
        stand.setInvulnerable(true);
        stand.setBasePlate(false);
        stand.setArms(false);
        try { stand.setCollidable(false); } catch (eC) {}
        try { stand.getEquipment().setHelmet(new ItemStack2(mat, 1)); } catch (eH) {
            try { stand.setHelmet(new ItemStack2(mat, 1)); } catch (eH2) {}
        }
        try { stand.setHeadPose(new EulerAngle(0, 0, 0)); } catch (eP) {}
        return { entity: stand, kind: "stand", anchor: loc.clone(), scale: sc };
    } catch (eStand) {
        return null;
    }
}

function isFlyingDisplayAlive(entry) {
    try {
        return entry != null && entry.entity != null && !entry.entity.isDead();
    } catch (e) {
        return false;
    }
}

/**
 * 将飞行展示体移到目标世界坐标。
 * ItemDisplay / 盔甲架一律 teleport；不改 translation，避免插值乱飘。
 */
function moveFlyingDisplay(entry, loc) {
    if (!isFlyingDisplayAlive(entry) || loc == null) return;
    try {
        if (entry.kind === "display") {
            try { entry.entity.setTeleportDuration(1); } catch (e0) {}
            try { entry.entity.teleport(loc); } catch (e1) {}
            try { entry.anchor = loc.clone(); } catch (e2) {}
            return;
        }
        try { entry.entity.teleport(loc); } catch (e3) {}
        try { entry.anchor = loc.clone(); } catch (e4) {}
    } catch (e) {}
}

function removeFlyingDisplay(entry) {
    if (!entry) return;
    var ent = entry.entity != null ? entry.entity : entry;
    try { if (ent != null && !ent.isDead()) ent.remove(); } catch (e) {}
}

// ======================== 术式会话 / 切术清痕迹 ========================
/**
 * 有状态术式（左右键、环绕、持续体）在 cast 时 beginSpellSession，
 * 切选中槽 / 施放其他术式 / 开选术环 / 换手持 / 退服时会调用 onClear，清实体与任务。
 *
 * 层数请用 spellStacks API（与会话分离）：切术式可保留，换快捷栏/退服才清。
 *
 * 左键：registerActiveLeftClick(spellId, Java Runnable)；施术核心只调 handleSpellLeftClick。
 * 切术清痕迹：beginSpellSession + onClear；PLUGIN 兜底用 registerDirectClearHook。
 *
 * 重要：跨 Graal 脚本上下文必须用 ConcurrentHashMap（Java 宿主对象）。
 * 普通 JS {} 挂到 PLUGIN 上时，术式 eval / 施术核心 / 道具脚本会各看见不同表，
 * 导致会话清不掉、左键钩子丢失。
 */

function sharedJavaMap(field) {
    var plugin = getPlugin();
    try {
        var existing = plugin != null ? plugin[field] : null;
        if (existing != null && (existing instanceof java.util.concurrent.ConcurrentHashMap)) {
            return existing;
        }
    } catch (e0) {}
    var map = new java.util.concurrent.ConcurrentHashMap();
    try { if (plugin != null) plugin[field] = map; } catch (e1) {}
    return map;
}

function spellSessionStore() {
    return sharedJavaMap("gltc_spell_session_store");
}

function spellLeftClickStore() {
    return sharedJavaMap("gltc_spell_left_hooks");
}

/** 层数：复合键 ownerUuid\\1spellId\\1targetKey -> number */
function spellStackStore() {
    return sharedJavaMap("gltc_spell_stack_store");
}

function stackCompositeKey(ou, sid, tk) {
    return String(ou) + "\u0001" + String(sid) + "\u0001" + String(tk);
}

/** 取玩家会话列表（JS 数组，作为 ConcurrentHashMap 的 value 跨上下文共享） */
function sessionsListOf(uuid) {
    var store = spellSessionStore();
    var key = String(uuid);
    var list = store.get(key);
    if (list == null) {
        list = [];
        store.put(key, list);
    }
    return list;
}

function playerUuidOf(playerOrUuid) {
    if (playerOrUuid == null) return "";
    try {
        if (typeof playerOrUuid.getUniqueId === "function") {
            return String(playerOrUuid.getUniqueId().toString());
        }
    } catch (e) {}
    return String(playerOrUuid);
}

function targetKeyOf(targetOrKey) {
    if (targetOrKey == null) return "";
    try {
        if (typeof targetOrKey.getUniqueId === "function") {
            return String(targetOrKey.getUniqueId().toString());
        }
    } catch (e) {}
    return String(targetOrKey);
}

function findOnlineByUuid(uuid) {
    uuid = String(uuid);
    try {
        var arr = Bukkit.getOnlinePlayers().toArray();
        for (var i = 0; i < arr.length; i++) {
            if (String(arr[i].getUniqueId().toString()) === uuid) return arr[i];
        }
    } catch (e) {}
    return null;
}

/**
 * 主手是否为已登记施术道具（数量须为 1）。
 * 所有术式触发入口应先过此关，避免与异能武器左右键冲突。
 */
function isHoldingMageStaff(player) {
    if (!player) return false;
    try {
        var hand = player.getInventory().getItemInMainHand();
        if (hand == null) return false;
        try {
            if (hand.getType() == null || String(hand.getType().name()) === "AIR") return false;
        } catch (eAir) {}
        if (hand.getAmount() !== 1) return false;
        var plug = getPlugin();
        try {
            if (plug != null && plug.gltcCastApi != null
                && typeof plug.gltcCastApi.isMageStaffItem === "function") {
                return !!plug.gltcCastApi.isMageStaffItem(hand);
            }
        } catch (eApi) {}
        try {
            var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(hand);
            if (sf == null) return false;
            var id = String(sf.getId());
            return id === "VASA_木质法杖" || id === "VASA_辉墨摇篮";
        } catch (eSf) {}
    } catch (e) {}
    return false;
}

function makeSessionToken(uuid, spellId) {
    return String(uuid) + "|" + String(spellId) + "|" + Date.now() + "|" + Math.floor(Math.random() * 1e9);
}

function getSpellStacks(owner, spellId, target) {
    var ou = playerUuidOf(owner);
    var sid = String(spellId || "");
    var tk = targetKeyOf(target);
    if (!ou || !sid || !tk) return 0;
    var n = Number(spellStackStore().get(stackCompositeKey(ou, sid, tk)));
    return isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function setSpellStacks(owner, spellId, target, value) {
    var ou = playerUuidOf(owner);
    var sid = String(spellId || "");
    var tk = targetKeyOf(target);
    if (!ou || !sid || !tk) return 0;
    var v = Math.floor(Number(value) || 0);
    if (v < 0) v = 0;
    var store = spellStackStore();
    var key = stackCompositeKey(ou, sid, tk);
    if (v <= 0) {
        try { store.remove(key); } catch (e0) {}
        return 0;
    }
    store.put(key, java.lang.Integer.parseInt(String(Math.floor(v)), 10));
    return v;
}

/**
 * 增减层数。opts.max 上限；返回变更后层数。
 */
function addSpellStacks(owner, spellId, target, delta, opts) {
    opts = opts || {};
    var cur = getSpellStacks(owner, spellId, target);
    var next = cur + Math.floor(Number(delta) || 0);
    if (opts.max != null) {
        var mx = Math.floor(Number(opts.max));
        if (isFinite(mx) && next > mx) next = mx;
    }
    if (next < 0) next = 0;
    return setSpellStacks(owner, spellId, target, next);
}

/** 清某术式对某目标 / 某术式全部 / 施术者全部层数 */
function clearSpellStacks(owner, spellId, target) {
    var ou = playerUuidOf(owner);
    if (!ou) return 0;
    var store = spellStackStore();
    var n = 0;
    var prefix;
    if (!spellId) {
        prefix = String(ou) + "\u0001";
    } else if (target != null && target !== "") {
        var oneKey = stackCompositeKey(ou, String(spellId), targetKeyOf(target));
        if (store.containsKey(oneKey)) {
            try { store.remove(oneKey); } catch (e0) {}
            return 1;
        }
        return 0;
    } else {
        prefix = String(ou) + "\u0001" + String(spellId) + "\u0001";
    }
    try {
        var it = store.keySet().iterator();
        var toRemove = new java.util.ArrayList();
        while (it.hasNext()) {
            var k = String(it.next());
            if (k.indexOf(prefix) === 0) {
                toRemove.add(k);
                n++;
            }
        }
        for (var i = 0; i < toRemove.size(); i++) {
            try { store.remove(toRemove.get(i)); } catch (e1) {}
        }
    } catch (e2) {}
    return n;
}

var SPELL_STACK_API = {
    get: getSpellStacks,
    set: setSpellStacks,
    add: addSpellStacks,
    clear: clearSpellStacks
};

/**
 * 开始一段术式状态会话。
 * @param player 玩家
 * @param spellId 术式 ID
 * @param onClear function(player|null, reason) 清痕迹；需可重复调用
 * @param opts.replace 默认 true：同术式旧会话先清掉（重施）
 * @returns token 字符串，自然结束时请 endSpellSession
 */
function beginSpellSession(player, spellId, onClear, opts) {
    if (!player || !spellId || typeof onClear !== "function") return null;
    opts = opts || {};
    var uuid = playerUuidOf(player);
    if (opts.replace !== false) {
        clearSpellSessions(uuid, { onlySpellId: String(spellId), reason: "replace" });
    }
    var token = makeSessionToken(uuid, spellId);
    var list = sessionsListOf(uuid);
    list.push({
        token: token,
        spellId: String(spellId),
        clear: onClear
    });
    spellSessionStore().put(String(uuid), list);
    return token;
}

/** 结束指定会话；invokeClear=true 时再跑 onClear（默认 false，假定已自行清理） */
function endSpellSession(playerOrUuid, token, invokeClear) {
    if (!token) return false;
    var uuid = playerUuidOf(playerOrUuid);
    var store = spellSessionStore();
    var list = store.get(String(uuid));
    if (list == null || list.length === 0) return false;
    var kept = [];
    var found = null;
    for (var i = 0; i < list.length; i++) {
        if (String(list[i].token) === String(token)) found = list[i];
        else kept.push(list[i]);
    }
    if (kept.length === 0) {
        try { store.remove(String(uuid)); } catch (e0) {}
    } else {
        store.put(String(uuid), kept);
    }
    if (!found) return false;
    if (invokeClear) {
        var p = findOnlineByUuid(uuid);
        try { found.clear(p, "end"); } catch (e) {}
    }
    return true;
}

/**
 * 按条件清理会话并执行 onClear。
 * opts.exceptSpellId — 保留该术式
 * opts.onlySpellId — 只清该术式
 * opts.reason — switch | cast | replace | quit | hotbar | ring | hold | manual
 */
function clearSpellSessions(playerOrUuid, opts) {
    opts = opts || {};
    var uuid = playerUuidOf(playerOrUuid);
    var store = spellSessionStore();
    var list = store.get(String(uuid));
    if (list == null || list.length === 0) return 0;
    var exceptId = opts.exceptSpellId != null ? String(opts.exceptSpellId) : null;
    var onlyId = opts.onlySpellId != null ? String(opts.onlySpellId) : null;
    var reason = opts.reason != null ? String(opts.reason) : "manual";
    var p = findOnlineByUuid(uuid);
    var kept = [];
    var n = 0;
    for (var i = 0; i < list.length; i++) {
        var ent = list[i];
        var sid = String(ent.spellId);
        var drop = false;
        if (onlyId != null) drop = (sid === onlyId);
        else if (exceptId != null) drop = (sid !== exceptId);
        else drop = true;
        if (drop) {
            n++;
            try { ent.clear(p, reason); } catch (e) {
                try { Bukkit.getLogger().warning("[GLTC术式会话] clear " + sid + ": " + e); } catch (e2) {}
            }
        } else {
            kept.push(ent);
        }
    }
    if (kept.length === 0) {
        try { store.remove(String(uuid)); } catch (e3) {}
    } else {
        store.put(String(uuid), kept);
    }
    return n;
}

/**
 * 切选中 / 施放其他术：清掉「非 keepSpellId」的会话痕迹（层数不在此清）。
 * reason 为 hotbar|quit|hold 时额外清空该玩家全部层数。
 */
function onSpellContextChange(player, keepSpellId, reason) {
    var keep = keepSpellId ? String(keepSpellId) : "";
    var r = reason || "switch";
    var n = clearSpellSessions(player, {
        exceptSpellId: keep,
        reason: r
    });
    if (r === "hotbar" || r === "quit" || r === "hold") {
        try { clearSpellStacks(player, null, null); } catch (e) {}
    }
    // 左键钩子：未保留同术式时一律清掉（含开环/切术），避免空手或持武器仍能触发
    try {
        var uuid = javaUuidKey(playerUuidOf(player));
        var ent = spellActiveLeftClickStore().get(uuid);
        if (ent == null || !keep || String(ent.spellId) !== keep) {
            clearActiveLeftClick(player);
        }
    } catch (eLc) {}
    try { runDirectClearHooks(player, keep); } catch (eDc) {}
    return n;
}

function registerSpellLeftClick(spellId, handler) {
    if (!spellId || typeof handler !== "function") return;
    spellLeftClickStore().put(String(spellId), handler);
}

function unregisterSpellLeftClick(spellId) {
    if (!spellId) return;
    try { spellLeftClickStore().remove(String(spellId)); } catch (e) {}
}

// ======================== 有状态术式 · 左键（跨 Graal eval 上下文） ========================
// 术式在 cast 时 registerActiveLeftClick；施术核心只调 handleSpellLeftClick，不写术式名。

var META_SIG_PREFIX = "gltc_spell_sig:";
var LEFT_CLICK_GATE_MS = 250;

function spellSignalMetaKey(spellId, signal) {
    return META_SIG_PREFIX + String(spellId) + ":" + String(signal);
}

function setSpellSignal(player, spellId, signal, on) {
    if (!player) return;
    var plugin = getPlugin();
    if (!plugin) return;
    var key = spellSignalMetaKey(spellId, signal);
    try {
        if (on) {
            player.setMetadata(key, new FixedMetadataValue(plugin, java.lang.Boolean.TRUE));
        } else {
            player.removeMetadata(key, plugin);
        }
    } catch (e) {}
}

function hasSpellSignal(player, spellId, signal) {
    if (!player) return false;
    try {
        return player.hasMetadata(spellSignalMetaKey(spellId, signal));
    } catch (e) { return false; }
}

function pulseSpellSignal(player, spellId, signal) {
    setSpellSignal(player, spellId, signal, true);
}

function consumeSpellSignal(player, spellId, signal) {
    if (!player) return false;
    var plugin = getPlugin();
    var key = spellSignalMetaKey(spellId, signal);
    try {
        if (!player.hasMetadata(key)) return false;
        player.removeMetadata(key, plugin);
        return true;
    } catch (e) { return false; }
}

function spellActiveLeftClickStore() {
    return sharedJavaMap("gltc_spell_active_left_click");
}

function leftClickGateStore() {
    return sharedJavaMap("gltc_spell_lclick_gate_ms");
}

function javaUuidKey(uuid) {
    return java.lang.String.valueOf(String(uuid));
}

/**
 * 注册玩家当前「可左键触发的有状态术式」。
 * runnable 须为 Java Runnable（或 Java.extend Runnable），勿传跨上下文 JS 函数。
 */
function registerActiveLeftClick(player, spellId, runnable) {
    if (!player || !spellId || runnable == null) return false;
    // 注册时也要求手持施术道具，防止异常路径挂上左键钩子
    if (!isHoldingMageStaff(player)) return false;
    var uuid = javaUuidKey(playerUuidOf(player));
    spellActiveLeftClickStore().put(uuid, {
        spellId: String(spellId),
        runnable: runnable
    });
    setSpellSignal(player, spellId, "active", true);
    return true;
}

function clearActiveLeftClick(playerOrUuid) {
    var uuid = javaUuidKey(playerUuidOf(playerOrUuid));
    var ent = null;
    try { ent = spellActiveLeftClickStore().remove(uuid); } catch (e0) {}
    var p = findOnlineByUuid(uuid);
    if (p != null && ent && ent.spellId) {
        setSpellSignal(p, ent.spellId, "active", false);
        setSpellSignal(p, ent.spellId, "lclick", false);
    }
}

function hasActiveLeftClick(player) {
    if (!player) return false;
    var uuid = javaUuidKey(playerUuidOf(player));
    try { return spellActiveLeftClickStore().get(uuid) != null; } catch (e) { return false; }
}

/** 施术核心左键入口：同步 Runnable + 脉冲 metadata（环绕 tick 可 consumeSpellSignal 兜底） */
function dispatchActiveLeftClick(player) {
    if (!player) return false;
    // 必须手持施术道具，才能触发有状态术式左键
    if (!isHoldingMageStaff(player)) return false;
    var uuid = javaUuidKey(playerUuidOf(player));
    var ent = null;
    try { ent = spellActiveLeftClickStore().get(uuid); } catch (e0) {}
    if (ent == null || ent.runnable == null) return false;

    var gate = leftClickGateStore();
    var now = Date.now();
    var prev = gate.get(uuid);
    if (prev != null && now - Number(prev) < LEFT_CLICK_GATE_MS) return true;
    gate.put(uuid, java.lang.Long.parseLong(String(Math.floor(now)), 10));

    pulseSpellSignal(player, ent.spellId, "lclick");
    try { ent.runnable.run(); } catch (e1) {
        try { Bukkit.getLogger().warning("[GLTC术式] activeLeftClick " + ent.spellId + ": " + e1); } catch (e2) {}
    }
    return true;
}

/** spellId -> function(player)：会话 onClear 未跑时的 PLUGIN 痕迹兜底（各术式自行 register） */
function directClearHookStore() {
    return sharedJavaMap("gltc_spell_direct_clear_hooks");
}

function registerDirectClearHook(spellId, handler) {
    if (!spellId || handler == null) return;
    directClearHookStore().put(String(spellId), handler);
}

function runDirectClearHooks(player, keepSpellId) {
    if (!player) return 0;
    var keep = keepSpellId ? String(keepSpellId) : "";
    var store = directClearHookStore();
    var n = 0;
    try {
        var it = store.entrySet().iterator();
        while (it.hasNext()) {
            var e = it.next();
            if (String(e.getKey()) === keep) continue;
            try { e.getValue()(player); n++; } catch (ex) {
                try { Bukkit.getLogger().warning("[GLTC术式] directClear " + e.getKey() + ": " + ex); } catch (e2) {}
            }
        }
    } catch (eIt) {}
    return n;
}

/**
 * 由施术核心左键调用：仅当该术式为当前选中时才会触发。
 * @param getSelectedSpellId function(player)->spellId|null
 */
function handleSpellLeftClick(player, getSelectedSpellId) {
    if (!player) return false;
    // 统一门槛：未手持施术道具时不触发任何术式左键
    if (!isHoldingMageStaff(player)) return false;
    if (dispatchActiveLeftClick(player)) return true;
    var sid = null;
    try {
        if (typeof getSelectedSpellId === "function") sid = getSelectedSpellId(player);
    } catch (e0) {}
    if (!sid) return false;
    var hook = spellLeftClickStore().get(String(sid));
    if (hook == null) return false;
    // Graal：从 ConcurrentHashMap 取出的函数未必通过 typeof==="function"
    try { return !!hook(player); } catch (e1) {
        try { Bukkit.getLogger().warning("[GLTC术式] leftClick " + sid + ": " + e1); } catch (e2) {}
        return false;
    }
}

function hasSpellSession(playerOrUuid, spellId) {
    var uuid = playerUuidOf(playerOrUuid);
    var list = spellSessionStore().get(String(uuid));
    if (list == null) return false;
    if (!spellId) return list.length > 0;
    var id = String(spellId);
    for (var i = 0; i < list.length; i++) {
        if (String(list[i].spellId) === id) return true;
    }
    return false;
}

var SPELL_SESSION_API = {
    begin: beginSpellSession,
    end: endSpellSession,
    clear: clearSpellSessions,
    onContextChange: onSpellContextChange,
    registerLeftClick: registerSpellLeftClick,
    unregisterLeftClick: unregisterSpellLeftClick,
    handleLeftClick: handleSpellLeftClick,
    hasSession: hasSpellSession,
    stacks: SPELL_STACK_API,
    registerActiveLeftClick: registerActiveLeftClick,
    clearActiveLeftClick: clearActiveLeftClick,
    hasActiveLeftClick: hasActiveLeftClick,
    dispatchActiveLeftClick: dispatchActiveLeftClick,
    isHoldingMageStaff: isHoldingMageStaff,
    setSpellSignal: setSpellSignal,
    hasSpellSignal: hasSpellSignal,
    pulseSpellSignal: pulseSpellSignal,
    consumeSpellSignal: consumeSpellSignal,
    registerDirectClearHook: registerDirectClearHook,
    runDirectClearHooks: runDirectClearHooks
};

try {
    var _plug = getPlugin();
    if (_plug != null) {
        _plug.gltcSpellSessionApi = SPELL_SESSION_API;
        _plug.gltcSpellStackApi = SPELL_STACK_API;
    }
} catch (eApi) {}
publishHitAnnounceApi();

({
    getPlugin: getPlugin,
    spawnDust: spawnDust,
    rayHitLiving: rayHitLiving,
    formatDamage: formatDamage,
    damageTypeLabel: damageTypeLabel,
    formatSpellHitMessage: formatSpellHitMessage,
    announceSpellHit: announceSpellHit,
    DMG_TYPE_PHYSICAL: DMG_TYPE_PHYSICAL,
    DMG_TYPE_PARTICLE: DMG_TYPE_PARTICLE,
    DMG_TYPE_PULSE: DMG_TYPE_PULSE,
    ensureSpellDamageListener: ensureSpellDamageListener,
    dealPhysicalSpellDamage: dealPhysicalSpellDamage,
    dealParticleSpellDamage: dealParticleSpellDamage,
    dealPulseSpellDamage: dealPulseSpellDamage,
    spawnFlyingItemDisplay: spawnFlyingItemDisplay,
    moveFlyingDisplay: moveFlyingDisplay,
    removeFlyingDisplay: removeFlyingDisplay,
    isFlyingDisplayAlive: isFlyingDisplayAlive,
    beginSpellSession: beginSpellSession,
    endSpellSession: endSpellSession,
    clearSpellSessions: clearSpellSessions,
    onSpellContextChange: onSpellContextChange,
    registerSpellLeftClick: registerSpellLeftClick,
    unregisterSpellLeftClick: unregisterSpellLeftClick,
    handleSpellLeftClick: handleSpellLeftClick,
    hasSpellSession: hasSpellSession,
    registerActiveLeftClick: registerActiveLeftClick,
    clearActiveLeftClick: clearActiveLeftClick,
    hasActiveLeftClick: hasActiveLeftClick,
    dispatchActiveLeftClick: dispatchActiveLeftClick,
    isHoldingMageStaff: isHoldingMageStaff,
    setSpellSignal: setSpellSignal,
    hasSpellSignal: hasSpellSignal,
    pulseSpellSignal: pulseSpellSignal,
    consumeSpellSignal: consumeSpellSignal,
    registerDirectClearHook: registerDirectClearHook,
    runDirectClearHooks: runDirectClearHooks,
    getSpellStacks: getSpellStacks,
    setSpellStacks: setSpellStacks,
    addSpellStacks: addSpellStacks,
    clearSpellStacks: clearSpellStacks,
    spellStacks: SPELL_STACK_API,
    spellSession: SPELL_SESSION_API
});
