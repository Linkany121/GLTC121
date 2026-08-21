/**
 * VASA 粒子补充剂（涵粒子补充剂）
 * 右键：直接增加粒子数量，不做其它检查；无法超过松垂体容量。
 * 已满时不消耗。
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Player = Java.type("org.bukkit.entity.Player");
var Sound = Java.type("org.bukkit.Sound");
var Particle = Java.type("org.bukkit.Particle");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var ITEM_ID = "VASA_粒子补充剂";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var C_MSG = "§x§f§f§f§5§b§3";
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

// ======================== 可调配置 ========================
/** 每次使用回复的粒子量 */
var RESTORE_AMOUNT = 20;
// ======================== 配置结束 ========================

var MAGE_API = null;

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

function loadMageApi() {
    // 每次对齐全局单例，避免握着旧导出写到另一张粒子表
    try {
        if (PLUGIN.gltcMageApi != null && typeof PLUGIN.gltcMageApi.addParticles === "function") {
            MAGE_API = PLUGIN.gltcMageApi;
            return true;
        }
    } catch (e0) {}
    var file = findScriptFile("术士系统/核心.js");
    if (!file) return false;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        var exported = (0, eval)(code);
        if (exported && typeof exported.addParticles === "function") {
            MAGE_API = exported;
            try { PLUGIN.gltcMageApi = exported; } catch (e1) {}
            return true;
        }
    } catch (e2) {
        Bukkit.getLogger().warning("[GLTC粒子补充剂] 加载术士核心失败: " + e2);
    }
    return false;
}

function consumeOne(player) {
    var hand = player.getInventory().getItemInMainHand();
    if (!hand || hand.getType() === Material.AIR || hand.getAmount() <= 0) return false;
    if (hand.getAmount() > 1) {
        hand.setAmount(hand.getAmount() - 1);
    } else {
        try { player.getInventory().setItemInMainHand(null); } catch (e) {
            hand.setAmount(0);
        }
    }
    return true;
}

function playFx(player) {
    var loc = player.getLocation().add(0, 1.0, 0);
    var world = player.getWorld();
    try { world.spawnParticle(Particle.ENCHANT, loc, 24, 0.35, 0.4, 0.35, 0.4); } catch (e0) {
        try { world.spawnParticle(Particle.ENCHANTMENT_TABLE, loc, 24, 0.35, 0.4, 0.35, 0.4); } catch (e1) {}
    }
    try { world.spawnParticle(Particle.END_ROD, loc, 8, 0.2, 0.3, 0.2, 0.02); } catch (e2) {}
    try { world.playSound(loc, Sound.BLOCK_AMETHYST_BLOCK_CHIME, 0.9, 1.35); } catch (e3) {
        try { world.playSound(loc, "minecraft:block.amethyst_block.chime", 0.9, 1.35); } catch (e4) {}
    }
    try { world.playSound(loc, Sound.ENTITY_EXPERIENCE_ORB_PICKUP, 0.55, 1.2); } catch (e5) {}
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(item);
        if (!sf || sf.getId() !== ITEM_ID) return;
    } catch (e2) { return; }

    if (!loadMageApi()) {
        player.sendMessage(GLTC_PREFIX + "§c术士系统未加载。");
        return;
    }

    var uuid = player.getUniqueId().toString();
    // 预读：已满则不消耗
    var cap = typeof MAGE_API.resolvePituitaryCapacity === "function"
        ? Number(MAGE_API.resolvePituitaryCapacity(uuid)) || 0
        : 0;
    var cur = Number(MAGE_API.getCurrentParticles(uuid)) || 0;
    if (cur >= cap) {
        player.sendMessage(GLTC_PREFIX + C_MSG + "粒子已满 §b" +
            (Math.round(cur * 10) / 10) + C_MSG + "/" + (Math.round(cap * 10) / 10));
        return;
    }

    if (!consumeOne(player)) return;

    // 直接加量，仅受容量上限钳制
    var gain = MAGE_API.addParticles(player, RESTORE_AMOUNT);
    var next = Number(MAGE_API.getCurrentParticles(uuid)) || 0;
    if (!(cap > 0)) {
        try { cap = Number(MAGE_API.resolvePituitaryCapacity(uuid)) || 0; } catch (e3) {}
    }
    playFx(player);
    player.sendMessage(GLTC_PREFIX + C_MSG + "回复 §b" + (Math.round(gain * 10) / 10) + C_MSG + " 粒子 §7(" +
        "§b" + Math.round(next * 10) / 10 + C_MSG + "/" + Math.round(cap * 10) / 10 + "§7)");
}

function tick(info) {}
