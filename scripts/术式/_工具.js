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

var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
/** 常规消息 #fff5b3 */
var C_MSG = "§x§f§f§f§5§b§3";
/** x环术式 xxx */
var C_SPELL = "§e";
/** 伤害数值 */
var C_DMG = "§c";

function getPlugin() {
    return Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
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
    try {
        if (plugin.gltcSpellDmgListener != null) return;
    } catch (e0) {}
    try {
        if (metaValue(plugin, META_SPELL_DMG_LISTENER) === true && plugin.gltcSpellDmgListener != null) return;
    } catch (e1) {}

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    try { plugin.gltcSpellDmgListener = listenerInstance; } catch (e2) {}
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

                var ring = info.ring != null ? info.ring : 1;
                var name = info.name || "未知术式";
                attacker.sendMessage(GLTC_PREFIX + C_SPELL + ring + "环术式 " + name
                    + C_MSG + " 造成了 " + C_DMG + formatDamage(finalDmg) + C_MSG + "伤害");
            } catch (ex) {}
        }, plugin
    );
}

/**
 * 物理术式伤害：走原版 damage（吃护甲），并在结算后播报实际伤害。
 * spellInfo: { ring, name }
 */
function dealPhysicalSpellDamage(target, amount, attacker, spellInfo) {
    if (!target || !(target instanceof LivingEntity) || !(amount > 0) || !attacker) return;
    var plugin = getPlugin();
    if (!plugin) return;
    ensureSpellDamageListener();

    var info = {
        ring: spellInfo && spellInfo.ring != null ? spellInfo.ring : 1,
        name: spellInfo && spellInfo.name ? String(spellInfo.name) : "未知术式",
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
 * 粒子术式伤害：走脉冲（忽略最终减伤/折射），直接播报结算值。
 */
function dealPulseSpellDamage(target, amount, attacker, spellInfo, mageApi) {
    if (!target || !(target instanceof LivingEntity) || !(amount > 0) || !attacker) return;
    try {
        if (mageApi && typeof mageApi.dealPulseDamage === "function") {
            mageApi.dealPulseDamage(target, amount, attacker);
        } else {
            target.setNoDamageTicks(0);
            target.damage(amount, attacker);
        }
    } catch (e) {
        try { target.damage(amount); } catch (e2) {}
    }
    try {
        var ring = spellInfo && spellInfo.ring != null ? spellInfo.ring : 1;
        var name = spellInfo && spellInfo.name ? String(spellInfo.name) : "未知术式";
        attacker.sendMessage(GLTC_PREFIX + C_SPELL + ring + "环术式 " + name
            + C_MSG + " 造成了 " + C_DMG + formatDamage(amount) + C_MSG + "伤害");
    } catch (e3) {}
}

/**
 * 展示实体飞行弹体：优先 ItemDisplay。
 * 移动用 Transformation 平移 + 插值（新版机制）；根实体过远时重锚，避免视锥剔除。
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
        // 位移走 transformation，不靠 teleportDuration
        try { d.setTeleportDuration(0); } catch (e2) {}
        try { d.setInterpolationDelay(0); } catch (e3) {}
        try { d.setInterpolationDuration(1); } catch (e4) {}
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
 * ItemDisplay：改 translation 插值；偏离锚点过远则 teleport 重锚。
 */
function moveFlyingDisplay(entry, loc) {
    if (!isFlyingDisplayAlive(entry) || loc == null) return;
    try {
        if (entry.kind === "display") {
            var Transformation = Java.type("org.bukkit.util.Transformation");
            var Vector3f = Java.type("org.joml.Vector3f");
            var AxisAngle4f = Java.type("org.joml.AxisAngle4f");
            var sc = entry.scale != null ? Number(entry.scale) : 0.85;
            if (entry.anchor == null) entry.anchor = loc.clone();

            var dx = loc.getX() - entry.anchor.getX();
            var dy = loc.getY() - entry.anchor.getY();
            var dz = loc.getZ() - entry.anchor.getZ();
            var distSq = dx * dx + dy * dy + dz * dz;

            // 根实体过远会导致客户端剔除，定期重锚到当前位置
            if (distSq > 100) {
                try { entry.entity.teleport(loc); } catch (eT) {}
                entry.anchor = loc.clone();
                dx = 0;
                dy = 0;
                dz = 0;
            }

            try { entry.entity.setInterpolationDelay(0); } catch (e0) {}
            try { entry.entity.setInterpolationDuration(1); } catch (e1) {}
            entry.entity.setTransformation(new Transformation(
                new Vector3f(dx, dy, dz),
                new AxisAngle4f(0, 0, 0, 1),
                new Vector3f(sc, sc, sc),
                new AxisAngle4f(0, 0, 0, 1)
            ));
            return;
        }
        try { entry.entity.teleport(loc); } catch (e2) {}
    } catch (e) {}
}

function removeFlyingDisplay(entry) {
    if (!entry) return;
    var ent = entry.entity != null ? entry.entity : entry;
    try { if (ent != null && !ent.isDead()) ent.remove(); } catch (e) {}
}

({
    getPlugin: getPlugin,
    spawnDust: spawnDust,
    rayHitLiving: rayHitLiving,
    formatDamage: formatDamage,
    ensureSpellDamageListener: ensureSpellDamageListener,
    dealPhysicalSpellDamage: dealPhysicalSpellDamage,
    dealPulseSpellDamage: dealPulseSpellDamage,
    spawnFlyingItemDisplay: spawnFlyingItemDisplay,
    moveFlyingDisplay: moveFlyingDisplay,
    removeFlyingDisplay: removeFlyingDisplay,
    isFlyingDisplayAlive: isFlyingDisplayAlive
});
