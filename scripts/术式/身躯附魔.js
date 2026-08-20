/**
 * 术式：身躯附魔 —— 3 秒内近战额外 0.5 系数 + 黄色粒子
 * 物品/术式 ID：VASA_身躯附魔
 *
 * 注意：Graal 不能可靠地给 Java Plugin 挂自定义 JS 字段，
 * 共享状态改用 Plugin Metadata（可存 ConcurrentHashMap）。
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var Color = Java.type("org.bukkit.Color");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Player = Java.type("org.bukkit.entity.Player");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var META_UNTIL = "gltc_body_enchant_until";
var META_REG = "gltc_body_enchant_listener";
var META_MAGE = "gltc_body_enchant_mage_api";

function loadUtil() {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/术式/_工具.js"),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/术式/_工具.js")
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

var UTIL = loadUtil();

function spawnDust(world, loc, r, g, b, count, size) {
    if (UTIL && UTIL.spawnDust) return UTIL.spawnDust(world, loc, r, g, b, count, size);
}

function metaValue(key) {
    try {
        if (!PLUGIN.hasMetadata(key)) return null;
        var list = PLUGIN.getMetadata(key);
        if (list == null || list.isEmpty()) return null;
        return list.get(0).value();
    } catch (e) {
        return null;
    }
}

function metaSet(key, value) {
    try {
        PLUGIN.removeMetadata(key, PLUGIN);
    } catch (e0) {}
    try {
        PLUGIN.setMetadata(key, new FixedMetadataValue(PLUGIN, value));
        return true;
    } catch (e1) {
        return false;
    }
}

function getBodyEnchantMap() {
    var existing = metaValue(META_UNTIL);
    if (existing != null) return existing;
    var map = new java.util.concurrent.ConcurrentHashMap();
    metaSet(META_UNTIL, map);
    return map;
}

function cacheMageApi(mageApi) {
    if (mageApi && typeof mageApi.calcSpellDamage === "function") {
        metaSet(META_MAGE, mageApi);
    }
}

function getMageApi() {
    var cached = metaValue(META_MAGE);
    if (cached && typeof cached.calcSpellDamage === "function") return cached;
    try {
        var fromPlugin = PLUGIN.gltcMageApi;
        if (fromPlugin && typeof fromPlugin.calcSpellDamage === "function") return fromPlugin;
    } catch (e) {}
    return null;
}

function registerBodyEnchantListener() {
    try {
        if (metaValue(META_REG) === true) return;
        metaSet(META_REG, true);
    } catch (e) { return; }

    var ListenerClass = Java.extend(Listener, {});
    var listenerInstance = new ListenerClass();
    Bukkit.getPluginManager().registerEvent(
        EntityDamageByEntityEvent, listenerInstance, EventPriority.NORMAL,
        function(l, event) {
            try {
                if (event.isCancelled()) return;
                var damager = event.getDamager();
                if (!(damager instanceof Player)) return;
                var victim = event.getEntity();
                if (!(victim instanceof LivingEntity)) return;
                var uuid = damager.getUniqueId().toString();
                var map = getBodyEnchantMap();
                if (map == null) return;
                var untilRaw = map.get(uuid);
                if (untilRaw == null) return;
                var until = Number(untilRaw);
                if (!(until > Date.now())) return;

                try {
                    var cause = event.getCause();
                    var cn = cause ? cause.name() : "";
                    if (cn.indexOf("PROJECTILE") >= 0 || cn === "MAGIC" || cn === "SONIC_BOOM") return;
                } catch (e2) {}

                var mageApi = getMageApi();
                if (!mageApi) return;

                var extra = mageApi.calcSpellDamage(damager, 0.5);
                var world = victim.getWorld();
                var loc = victim.getLocation().add(0, victim.getHeight() * 0.5, 0);
                spawnDust(world, loc, 255, 220, 60, 18, 1.2);
                try { world.playSound(loc, Sound.BLOCK_ENCHANTMENT_TABLE_USE, 0.35, 1.6); } catch (e6) {}
                event.setDamage(event.getDamage() + extra);
            } catch (ex) {}
        }, PLUGIN
    );
}

registerBodyEnchantListener();

({
    id: "VASA_身躯附魔",
    name: "身躯附魔",
    ring: 1,
    cost: 5,
    cooldownMs: 5000,
    book: true,
    cast: function(player, mageApi) {
        cacheMageApi(mageApi);
        registerBodyEnchantListener();
        var uuid = player.getUniqueId().toString();
        var map = getBodyEnchantMap();
        if (map == null) {
            player.sendMessage("§c身躯附魔状态初始化失败。");
            return false;
        }
        // 用字符串存时间，避免 Graal Long.valueOf 重载冲突
        map.put(uuid, String(Date.now() + 3000));
        var world = player.getWorld();
        var loc = player.getLocation().add(0, 1, 0);
        spawnDust(world, loc, 255, 220, 60, 40, 1.3);
        try { world.playSound(loc, Sound.BLOCK_ENCHANTMENT_TABLE_USE, 0.9, 1.2); } catch (e) {}
        try { world.playSound(loc, Sound.ENTITY_PLAYER_LEVELUP, 0.4, 1.6); } catch (e2) {}
        player.sendMessage("§e身躯附魔 §7生效 §f3 §7秒");
        return true;
    }
});
