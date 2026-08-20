/**
 * VASA 辉墨摇篮 —— 序列4 法杖
 * - 站立右键：施术
 * - 蹲下右键：开/关选术环，并额外释放光影废墟
 *
 * 粒子修正伤害 = 倍率 × 粒子强度 × 粒子浓度(GLI)，走脉冲伤害
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Sound = Java.type("org.bukkit.Sound");
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle$DustOptions");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Vector = Java.type("org.bukkit.util.Vector");
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var STAFF_ID = "VASA_辉墨摇篮";
var META_STATUE = "gltc_hmyl_statue";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var plugin = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;

var CAST_API = null;
var MAGE_API = null;

// ---- 数值 ----
var ABILITY_CD_MS = 60000;             // 光影废墟冷却 60 秒
var BUFF_TICKS = 100;              // 5 秒
var RESIST_AMP = 0;                // 抗性提升 I
var SPEED_AMP = 2;                 // 速度 II
var STATUE_COUNT = 3;
var STATUE_SPEEDS = [7.0, 5.0, 4]; // 格/秒
var STATUE_SPAWN_RADIUS = 5.0;     // 玩家周围随机生成半径
var STATUE_LIFE_TICKS = 160;       // 8 秒
var STATUE_HIT_RANGE = 1.6;
var STATUE_SEARCH_RANGE = 28;
var FIRST_BLAST_RADIUS = 8.0;
var FIRST_BLAST_MULT = 5.0;
var SMALL_BLAST_RADIUS = 3.5;
var SMALL_BLAST_MULT = 2.0;

var INK_DUST = new DustOptions(Color.fromRGB(40, 40, 48), 1.4);
var LIGHT_DUST = new DustOptions(Color.fromRGB(230, 230, 240), 1.1);
var GRAY_DUST = new DustOptions(Color.fromRGB(140, 140, 150), 1.0);

var TYPE_RESIST = PotionEffectType.getByName("RESISTANCE");
try { if (TYPE_RESIST == null) TYPE_RESIST = PotionEffectType.getByName("DAMAGE_RESISTANCE"); } catch (eR) {}
var TYPE_SPEED = PotionEffectType.getByName("SPEED");

/** 冷却：uuid -> 上次释放时间戳(ms) */
var cdMap = {};

function nowMs() {
    return Math.floor(Number(Date.now()));
}

function isAbilityOnCd(uuid) {
    var last = cdMap[uuid];
    if (last == null) return false;
    return (nowMs() - Number(last)) < ABILITY_CD_MS;
}

function cdLeftSec(uuid) {
    var last = Number(cdMap[uuid]) || 0;
    return Math.max(1, Math.ceil((ABILITY_CD_MS - (nowMs() - last)) / 1000));
}

function markAbilityCd(uuid) {
    cdMap[uuid] = nowMs();
}

function getOnlinePlayerByUuid(uuidStr) {
    try {
        var ent = Bukkit.getEntity(java.util.UUID.fromString(String(uuidStr)));
        if (ent != null && (ent instanceof Player)) return ent;
    } catch (e) {}
    try {
        var it = Bukkit.getOnlinePlayers().iterator();
        while (it.hasNext()) {
            var p = it.next();
            if (String(p.getUniqueId().toString()) === String(uuidStr)) return p;
        }
    } catch (e2) {}
    return null;
}

function randomSpawnNear(base, radius) {
    var ang = Math.random() * Math.PI * 2;
    var r = Math.sqrt(Math.random()) * radius;
    var spawn = base.clone();
    spawn.setX(base.getX() + Math.cos(ang) * r);
    spawn.setZ(base.getZ() + Math.sin(ang) * r);
    spawn.setY(base.getY());
    return spawn;
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

function evalExport(rel) {
    var file = findScriptFile(rel);
    if (!file) return null;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        return (0, eval)(code);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC辉墨摇篮] 加载 " + rel + " 失败: " + e);
        return null;
    }
}

function loadCastApi() {
    if (CAST_API && typeof CAST_API.handleStaffUse === "function") return true;
    var exported = evalExport("施术道具/施术核心.js");
    if (exported && typeof exported.handleStaffUse === "function") {
        CAST_API = exported;
        return true;
    }
    return false;
}

function loadMageApi() {
    if (MAGE_API && typeof MAGE_API.dealPulseDamage === "function") return true;
    var exported = evalExport("术士系统/核心.js");
    if (exported && typeof exported.dealPulseDamage === "function") {
        MAGE_API = exported;
        return true;
    }
    return false;
}

loadCastApi();
loadMageApi();

function isThisStaff(item) {
    if (!item || item.getType() === Material.AIR) return false;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(item);
        return !!(sf && sf.getId() === STAFF_ID);
    } catch (e) { return false; }
}

function particleMod(player) {
    if (!loadMageApi()) return 1.0;
    try {
        var stats = MAGE_API.getTotalStats(player, false);
        var pp = Number(stats.particlePower) || 1;
        var gli = Number(MAGE_API.getGLI()) || 1;
        return Math.max(0.01, pp * gli);
    } catch (e) { return 1.0; }
}

function playRuinAwaken(world, loc) {
    try {
        world.spawnParticle(Particle.SQUID_INK, loc, 60, 1.2, 0.6, 1.2, 0.02);
    } catch (e0) {
        try { world.spawnParticle(Particle.SMOKE_LARGE, loc, 40, 1.0, 0.5, 1.0, 0.02); } catch (e1) {}
    }
    try { world.spawnParticle(Particle.END_ROD, loc.clone().add(0, 0.8, 0), 28, 1.0, 0.8, 1.0, 0.04); } catch (e2) {}
    try { world.spawnParticle(Particle.DUST, loc, 40, 1.4, 0.5, 1.4, 0, INK_DUST); } catch (e3) {
        try { world.spawnParticle(Particle.REDSTONE, loc, 40, 1.4, 0.5, 1.4, 0, INK_DUST); } catch (e4) {}
    }
    try { world.spawnParticle(Particle.DUST, loc, 24, 1.2, 0.7, 1.2, 0, LIGHT_DUST); } catch (e5) {
        try { world.spawnParticle(Particle.REDSTONE, loc, 24, 1.2, 0.7, 1.2, 0, LIGHT_DUST); } catch (e6) {}
    }
    try {
        world.playSound(loc, Sound.BLOCK_RESPAWN_ANCHOR_CHARGE, 0.9, 0.7);
        world.playSound(loc, Sound.ENTITY_WARDEN_SONIC_CHARGE, 0.45, 1.4);
        world.playSound(loc, Sound.BLOCK_ENCHANTMENT_TABLE_USE, 0.8, 0.55);
    } catch (e7) {}
}

function playInkBlast(world, loc, large) {
    var ink = large ? 90 : 36;
    var dust = large ? 55 : 22;
    var spread = large ? 2.2 : 0.9;
    try { world.spawnParticle(Particle.SQUID_INK, loc, ink, spread, spread * 0.55, spread, 0.05); } catch (e0) {
        try { world.spawnParticle(Particle.SMOKE_LARGE, loc, ink, spread, spread * 0.5, spread, 0.03); } catch (e1) {}
    }
    try { world.spawnParticle(Particle.DUST, loc, dust, spread, spread * 0.5, spread, 0, INK_DUST); } catch (e2) {
        try { world.spawnParticle(Particle.REDSTONE, loc, dust, spread, spread * 0.5, spread, 0, INK_DUST); } catch (e3) {}
    }
    if (large) {
        try { world.spawnParticle(Particle.END_ROD, loc, 35, 1.6, 1.0, 1.6, 0.08); } catch (e4) {}
        try { world.spawnParticle(Particle.SONIC_BOOM, loc, 1, 0, 0, 0, 0); } catch (e5) {}
        try {
            world.playSound(loc, Sound.ENTITY_GENERIC_EXPLODE, 0.85, 0.55);
            world.playSound(loc, Sound.ENTITY_SQUID_SQUIRT, 1.1, 0.6);
            world.playSound(loc, Sound.ENTITY_WARDEN_SONIC_BOOM, 0.35, 1.6);
        } catch (e6) {}
    } else {
        try { world.spawnParticle(Particle.DUST, loc, 14, 0.6, 0.35, 0.6, 0, GRAY_DUST); } catch (e7) {}
        try {
            world.playSound(loc, Sound.ENTITY_GENERIC_EXPLODE, 0.45, 1.25);
            world.playSound(loc, Sound.ENTITY_SQUID_SQUIRT, 0.7, 1.1);
        } catch (e8) {}
    }
    try { world.createExplosion(loc, 0, false, false); } catch (e9) {}
}

function findNearestEnemy(fromLoc, owner, range) {
    var world = fromLoc.getWorld();
    var best = null;
    var bestDist = range;
    var list = world.getNearbyEntities(fromLoc, range, range, range);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (owner != null && ent.getUniqueId().equals(owner.getUniqueId())) continue;
        if (ent.hasMetadata(META_STATUE)) continue;
        try { if (ent.getType() === EntityType.ARMOR_STAND) continue; } catch (e) {}
        if (ent instanceof Player) {
            try {
                var mode = ent.getGameMode().name();
                if (mode === "CREATIVE" || mode === "SPECTATOR") continue;
            } catch (e2) {}
        }
        var d = ent.getLocation().distance(fromLoc);
        if (d < bestDist) {
            bestDist = d;
            best = ent;
        }
    }
    return best;
}

function pulseAoE(center, radius, amount, attacker) {
    if (!loadMageApi() || amount <= 0) return;
    var world = center.getWorld();
    var list = world.getNearbyEntities(center, radius, radius, radius);
    var it = list.iterator();
    while (it.hasNext()) {
        var ent = it.next();
        if (!(ent instanceof LivingEntity) || ent.isDead()) continue;
        if (attacker != null && ent.getUniqueId().equals(attacker.getUniqueId())) continue;
        if (ent.hasMetadata(META_STATUE)) continue;
        try { if (ent.getType() === EntityType.ARMOR_STAND) continue; } catch (e) {}
        if (center.distance(ent.getLocation()) > radius) continue;
        try { MAGE_API.dealPulseDamage(ent, amount, attacker); } catch (e2) {}
    }
}

function explodeStatue(statue, owner, orderRef) {
    if (statue == null || !statue.isValid()) return;
    var world = statue.getWorld();
    var loc = statue.getLocation().add(0, 0.6, 0);
    var order = orderRef.n;
    orderRef.n = order + 1;
    var mod = particleMod(owner);
    var large = (order === 0);
    var radius = large ? FIRST_BLAST_RADIUS : SMALL_BLAST_RADIUS;
    var dmg = (large ? FIRST_BLAST_MULT : SMALL_BLAST_MULT) * mod;
    playInkBlast(world, loc, large);
    pulseAoE(loc, radius, dmg, owner);
    try { statue.remove(); } catch (e) {}
}

function summonStatue(owner, spawnLoc, blocksPerSec, orderRef) {
    var world = spawnLoc.getWorld();
    var panda = null;
    try {
        panda = world.spawnEntity(spawnLoc, EntityType.PANDA);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC辉墨摇篮] 无法生成墨角石像: " + e);
        return;
    }
    if (panda == null) return;

    try { panda.setCustomName("§8墨角石像"); panda.setCustomNameVisible(true); } catch (e0) {}
    try { panda.setBaby(false); } catch (e1) {
        try { panda.setAge(0); panda.setAgeLock(true); } catch (e2) {}
    }
    try { panda.setAI(false); } catch (e3) {}
    try { panda.setSilent(true); } catch (e4) {}
    try { panda.setInvulnerable(true); } catch (e5) {}
    try { panda.setCollidable(false); } catch (e6) {}
    try { panda.setRemoveWhenFarAway(true); } catch (e7) {}
    try { panda.setGravity(false); } catch (e8) {}
    try { panda.setVelocity(new Vector(0, 0, 0)); } catch (e9) {}
    panda.setMetadata(META_STATUE, new FixedMetadataValue(plugin, owner.getUniqueId().toString()));

    try {
        world.spawnParticle(Particle.SQUID_INK, spawnLoc, 18, 0.35, 0.35, 0.35, 0.02);
        world.spawnParticle(Particle.DUST, spawnLoc, 10, 0.3, 0.3, 0.3, 0, GRAY_DUST);
    } catch (eP0) {}

    var ownerId = owner.getUniqueId().toString();
    var speed = Number(blocksPerSec) || 2.0;
    var step = speed / 20.0; // 每 tick 传送距离
    var ticks = 0;
    var target = findNearestEnemy(spawnLoc, owner, STATUE_SEARCH_RANGE);
    var taskRef = { id: -1 };

    taskRef.id = Bukkit.getScheduler().scheduleSyncRepeatingTask(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function () {
            try {
                if (panda == null || panda.isDead() || !panda.isValid()) {
                    try { Bukkit.getScheduler().cancelTask(taskRef.id); } catch (e) {}
                    return;
                }
                var caster = getOnlinePlayerByUuid(ownerId);
                if (caster == null || !caster.isOnline()) {
                    try { panda.remove(); } catch (eR) {}
                    try { Bukkit.getScheduler().cancelTask(taskRef.id); } catch (eC) {}
                    return;
                }
                ticks++;
                var loc = panda.getLocation();
                try {
                    world.spawnParticle(Particle.DUST, loc.clone().add(0, 0.4, 0), 2, 0.12, 0.1, 0.12, 0, INK_DUST);
                } catch (eP) {}

                if (target == null || target.isDead() || !target.isValid()) {
                    target = findNearestEnemy(loc, caster, STATUE_SEARCH_RANGE);
                }

                if (target != null && !target.isDead()) {
                    var aim = target.getLocation().clone().add(0, Math.min(1.0, target.getHeight() * 0.45), 0);
                    var dx = aim.getX() - loc.getX();
                    var dy = aim.getY() - loc.getY();
                    var dz = aim.getZ() - loc.getZ();
                    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                    if (dist <= STATUE_HIT_RANGE) {
                        explodeStatue(panda, caster, orderRef);
                        try { Bukkit.getScheduler().cancelTask(taskRef.id); } catch (eC2) {}
                        return;
                    }

                    if (dist > 1e-4) {
                        var move = Math.min(step, dist);
                        var nx = loc.getX() + (dx / dist) * move;
                        var ny = loc.getY() + (dy / dist) * move;
                        var nz = loc.getZ() + (dz / dist) * move;
                        var next = loc.clone();
                        next.setX(nx);
                        next.setY(ny);
                        next.setZ(nz);
                        try {
                            next.setDirection(new Vector(dx, 0, dz));
                        } catch (eD) {}
                        try {
                            panda.teleport(next);
                            panda.setVelocity(new Vector(0, 0, 0));
                        } catch (eT) {
                            try { Bukkit.getLogger().warning("[GLTC辉墨摇篮] teleport失败: " + eT); } catch (eL) {}
                        }
                    }
                }

                if (ticks >= STATUE_LIFE_TICKS) {
                    explodeStatue(panda, caster, orderRef);
                    try { Bukkit.getScheduler().cancelTask(taskRef.id); } catch (eC3) {}
                }
            } catch (err) {
                try { Bukkit.getLogger().warning("[GLTC辉墨摇篮] 石像追逐: " + err); } catch (eL2) {}
            }
        }
    }))(), 0, 1);
}

function activateRuin(player) {
    var uuid = String(player.getUniqueId().toString());
    if (isAbilityOnCd(uuid)) {
        var left = cdLeftSec(uuid);
        try { player.sendActionBar("§8光影废墟冷却中… §e" + left + "§7s"); } catch (eA) {}
        player.sendMessage(GLTC_PREFIX + "§c光影废墟冷却中，剩余 §e" + left + " §c秒");
        return;
    }
    if (player.getInventory().getItemInMainHand().getAmount() !== 1) {
        player.sendMessage(GLTC_PREFIX + "§c请将法杖数量分离为 §e1 §c后再使用。");
        return;
    }

    markAbilityCd(uuid);

    if (TYPE_RESIST != null) {
        try {
            player.addPotionEffect(new PotionEffect(TYPE_RESIST, BUFF_TICKS, RESIST_AMP, false, true, true));
        } catch (eR) {}
    }
    if (TYPE_SPEED != null) {
        try {
            player.addPotionEffect(new PotionEffect(TYPE_SPEED, BUFF_TICKS, SPEED_AMP, false, true, true));
        } catch (eS) {}
    }

    var base = player.getLocation();
    playRuinAwaken(player.getWorld(), base.clone().add(0, 0.2, 0));
    player.sendMessage(GLTC_PREFIX + "§7光影废墟已展开 §8(冷却 " + Math.floor(ABILITY_CD_MS / 1000) + "s)");

    var orderRef = { n: 0 };
    for (var i = 0; i < STATUE_COUNT; i++) {
        var spawn = randomSpawnNear(base, STATUE_SPAWN_RADIUS);
        summonStatue(player, spawn, STATUE_SPEEDS[i] || 2.0, orderRef);
    }
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var item = player.getInventory().getItemInMainHand();
    if (!isThisStaff(item)) return;

    if (!loadCastApi()) {
        player.sendMessage(GLTC_PREFIX + "§c施术核心加载失败。");
        return;
    }
    CAST_API.handleStaffUse(player, {
        onSneakUse: function (p) { activateRuin(p); },
        onAfterCast: function () {}
    });
}

function tick(info) {}
