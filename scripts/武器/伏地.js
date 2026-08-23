var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Bukkit = Java.type("org.bukkit.Bukkit");
var EventPriority = Java.type("org.bukkit.event.EventPriority");
var Listener = Java.type("org.bukkit.event.Listener");
var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
var _EDBE_GET_DAMAGER = (function () {
    try { return EntityDamageByEntityEvent.getMethod("getDamager"); } catch (e) { return null; }
})();
function edbeDamager(event) {
    if (event == null) return null;
    try { if (!(event instanceof EntityDamageByEntityEvent)) return null; } catch (e0) { return null; }
    if (_EDBE_GET_DAMAGER != null) {
        try { return _EDBE_GET_DAMAGER.invoke(event); } catch (e1) {}
    }
    try { return event.getDamager(); } catch (e2) {}
    return null;
}
var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
var Player = Java.type("org.bukkit.entity.Player");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Material = Java.type("org.bukkit.Material");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var DustOptions = Java.type("org.bukkit.Particle$DustOptions");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Location = Java.type("org.bukkit.Location");
var Vector = Java.type("org.bukkit.util.Vector");
var UUID = java.util.UUID;
var BukkitRunnable = Java.type("org.bukkit.scheduler.BukkitRunnable");
var FixedMetadataValue = Java.type("org.bukkit.metadata.FixedMetadataValue");
var plugin = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
var FUDI_ITEM_ID = "FKR_伏地";
var META_FUDI_MARK_TASK = "gltc_fudi_mark_task";
var SIT_MARK_MULT = 4;               // 标记伤害：4x SIT
var SIT_HIT_MULT = 4;                // 下砸伤害：4x SIT
var ABILITY_POWER_DEFAULT = 10;
var ABILITY_POWER_CONFIG_KEY = "StarbyssAdjustment";
var DAMAGE_NOTIFY_CONFIG_KEY = "DamageNotifyMode";
var DAMAGE_NOTIFY_DEFAULT = "chat";
var GLTC_DAMAGE_MSG_PREFIX = "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";
var COOLDOWN_MS = 3000;               // 右键再装填时间（毫秒）3秒
var RANGE = 20;                       // 标记范围（格）
var FOV_DEG = 100;                     // 视野夹角（度），左右各45°
var SLOWNESS_TICKS = 60;              // 缓慢持续时间（tick），60 = 3秒
var SLOWNESS_LEVEL = 2;               // 缓慢等级（2 = III）
var MARK_DURATION_MS = 4500;          // 标记状态保留时间（毫秒），略长于缓慢时长
var FALL_HEIGHT = 5;                  // 粒子生成高度（生物头顶上方格数）
var FALL_SPEED = 0.4;                 // 每tick下落格数
var FALL_CLUSTER_COUNT = 12;          // 每tick生成的粒子数量（一坨三色粒子）
var RAY_STEP = 0.2;                   // 射线粒子密度（每0.3格一个）
var SLOWNESS = PotionEffectType.getByName("SLOWNESS");
var WHITE = new DustOptions(Color.WHITE, 1.2);                   // 射线（白）
var GRAY = new DustOptions(Color.fromRGB(120, 120, 125), 1.2);   // 射线/脚底爆发（灰）
var RED = new DustOptions(Color.fromRGB(220, 30, 40), 1.2);      // 标记圈/下砸（红）
var PURPLE = new DustOptions(Color.fromRGB(150, 60, 220), 1.2);  // 下砸（紫）
var BLACK = new DustOptions(Color.BLACK, 1.2);                   // 下砸（黑）
var EXPLOSION_PARTICLE = (function () {
    try { return Particle.valueOf("EXPLOSION"); } catch (e) {}
    try { return Particle.valueOf("EXPLOSION_LARGE"); } catch (e) {}
    return null;
})();
var cdMap = new java.util.HashMap();    // 玩家UUID -> 上次右键时间(ms)
var marked = new java.util.HashMap();   // 被标记实体UUID -> 标记过期时间(ms)
function getAbilityPower() {
    try { return getAddonConfig().getInt(ABILITY_POWER_CONFIG_KEY, ABILITY_POWER_DEFAULT); } catch (e) { return ABILITY_POWER_DEFAULT; }
}
function calcSitDamage(mult) { return mult * getAbilityPower(); }
function formatAbilityDamage(dmg) {
    var v = Math.round(dmg * 10) / 10;
    return (Math.abs(v - Math.round(v)) < 0.05) ? String(Math.round(v)) : v.toFixed(1);
}
function getWeaponDisplayName(item) {
    if (item == null) return "未知武器";
    try {
        var meta = item.getItemMeta();
        if (meta != null && meta.hasDisplayName()) return meta.getDisplayName();
    } catch (e) {}
    return "未知武器";
}
function getDamageNotifyMode() {
    try {
        var mode = String(getAddonConfig().getString(DAMAGE_NOTIFY_CONFIG_KEY, DAMAGE_NOTIFY_DEFAULT)).toLowerCase().trim();
        if (mode === "actionbar" || mode === "action_bar" || mode === "action" || mode === "物品栏上方") return "actionbar";
        if (mode === "none" || mode === "off" || mode === "hide" || mode === "不显示") return "none";
        if (mode === "chat" || mode === "聊天框") return "chat";
        return DAMAGE_NOTIFY_DEFAULT;
    } catch (e) {
        return DAMAGE_NOTIFY_DEFAULT;
    }
}
function notifyAbilityDamage(player, item, damage) {
    if (player == null || !player.isOnline()) return;
    var mode = getDamageNotifyMode();
    if (mode === "none") return;
    var msg = GLTC_DAMAGE_MSG_PREFIX + "使用 " + getWeaponDisplayName(item) + " §f造成 §c" + formatAbilityDamage(damage) + " §f伤害！";
    if (mode === "actionbar") {
        try { player.sendActionBar(msg); } catch (e) { player.sendMessage(msg); }
    } else {
        player.sendMessage(msg);
    }
}
function dealSitDamage(target, player, item, sitMult) {
    var dmg = calcSitDamage(sitMult);
    target.setNoDamageTicks(0);
    target.damage(dmg, player);
    notifyAbilityDamage(player, item, dmg);
    return dmg;
}
function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;
    var sfItem = SlimefunItem.getByItem(item);
    if (!sfItem || sfItem.getId() !== FUDI_ITEM_ID) return;
    var uuid = player.getUniqueId().toString();
    var now = Date.now();
    if (cdMap.containsKey(uuid) && (now - cdMap.get(uuid)) < COOLDOWN_MS) {
        player.sendActionBar("§c术式组件充能中...");
        return;
    }
    cdMap.put(uuid, now);
    showScanRange(player);
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();
    var halfCos = Math.cos(FOV_DEG / 2 * Math.PI / 180); // cos(45°)≈0.7071
    var expire = now + MARK_DURATION_MS;
    var count = 0;
    var targets = world.getNearbyEntities(eye, RANGE, RANGE, RANGE);
    for (var i = 0; i < targets.size(); i++) {
        var ent = targets.get(i);
        if (!(ent instanceof LivingEntity) || ent === player || ent.isDead()) continue;
        var entCenter = ent.getLocation().add(0, ent.getHeight() / 2, 0);
        var to = entCenter.toVector().subtract(eye.toVector());
        var dist = to.length();
        if (dist < 0.5 || dist > RANGE) continue;
        if (dir.dot(to.normalize()) < halfCos) continue;
        marked.put(ent.getUniqueId().toString(), expire);
        dealSitDamage(ent, player, item, SIT_MARK_MULT);
        ent.addPotionEffect(new PotionEffect(SLOWNESS, SLOWNESS_TICKS, SLOWNESS_LEVEL, false, true, true));
        markRing(ent);
        count++;
    }
    // 厚重低频施法音：凋灵低沉轰鸣 + 铁砧沉重撞击
    world.playSound(eye, "entity.wither.ambient", 1.0, 0.9);
    world.playSound(eye, "block.anvil.land", 1.0, 0.7);
    if (count > 0) {
        // 标记成功：凋灵低吼（厚重反馈）
        world.playSound(eye, "entity.wither.shoot", 1.2, 0.7);
        player.sendActionBar("§f引力组件标记了 §e" + count + " §f个敌人");
    } else {
        player.sendActionBar("§7视野内未发现敌人");
    }
}
function wasHolding(stack) {
    if (!stack || stack.getType() === Material.AIR) return false;
    var sfItem = SlimefunItem.getByItem(stack);
    return sfItem != null && sfItem.getId() === FUDI_ITEM_ID;
}
function clearWeaponState(player) {
    if (player == null) return;
    var uuid = player.getUniqueId().toString();
    cdMap.remove(uuid);
}

function onEntityDamageByEntity(event) {
    try {
        if (event.isCancelled()) return;
        var entity = event.getEntity();
        if (!(entity instanceof LivingEntity) || entity.isDead()) return;
        var damager = edbeDamager(event);
        if (!(damager instanceof Player)) return;
        var player = damager;
        var item = player.getInventory().getItemInMainHand();
        if (!item || item.getType() === Material.AIR) return;
        var sfItem = SlimefunItem.getByItem(item);
        if (!sfItem || sfItem.getId() !== FUDI_ITEM_ID) return;
        var cd = 1.0;
        try {
            cd = player.getAttackCooldown();
        } catch (e) {
        }
        if (cd < 0.98) return;
        var eid = entity.getUniqueId().toString();
        if (!marked.containsKey(eid)) return;
        if (Date.now() > marked.get(eid)) {
            marked.remove(eid);
            return;
        }
        marked.remove(eid);
        summonBlackBlock(entity, player);
    } catch (e) {
    }
}
// 标记环定时任务
function summonBlackBlock(target, player) {
    var world = target.getWorld();
    var tLoc = target.getLocation();
    var startY = Math.min(
        tLoc.getY() + target.getHeight() + FALL_HEIGHT,
        world.getMaxHeight() - 4
    );
    var dropY = startY;
    var groundY = tLoc.getY() + 0.5; // 下砸基准：从起点下落5格即消失
    var fallTaskRef = null;
    var FallTask = Java.extend(BukkitRunnable, {
        run: function () {
            try {
                if (target == null || target.isDead()) {
                    if (fallTaskRef != null) fallTaskRef.cancel();
                    return;
                }
                var tNow = target.getLocation();
                var current = new Location(world, tNow.getX(), dropY, tNow.getZ());
                for (var i = 0; i < FALL_CLUSTER_COUNT; i++) {
                    var ox = (Math.random() - 0.5) * 1.1;
                    var oy = (Math.random() - 0.5) * 1.1;
                    var oz = (Math.random() - 0.5) * 1.1;
                    var p = new Location(world, current.getX() + ox, current.getY() + oy, current.getZ() + oz);
                    var c = i % 3;
                    if (c === 0) {
                        world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, BLACK);
                    } else if (c === 1) {
                        world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, RED);
                    } else {
                        world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, PURPLE);
                    }
                }
                dropY -= FALL_SPEED;
                if (dropY <= groundY) {
                    var weaponItem = player.getInventory().getItemInMainHand();
                    dealSitDamage(target, player, weaponItem, SIT_HIT_MULT);
                    var hitLoc = target.getLocation().add(0, 0.5, 0);
                    world.playSound(hitLoc, "block.anvil.land", 2.0, 0.6);
                    world.playSound(hitLoc, "entity.generic.explode", 1.5, 0.5);
                    for (var j = 0; j < 30; j++) {
                        var bx = hitLoc.getX() + (Math.random() - 0.5) * 2.6;
                        var by = hitLoc.getY() + Math.random() * 1.6;
                        var bz = hitLoc.getZ() + (Math.random() - 0.5) * 2.6;
                        var b = new Location(world, bx, by, bz);
                        var c2 = j % 3;
                        if (c2 === 0) {
                            world.spawnParticle(Particle.DUST, b, 1, 0, 0, 0, 0, BLACK);
                        } else if (c2 === 1) {
                            world.spawnParticle(Particle.DUST, b, 1, 0, 0, 0, 0, RED);
                        } else {
                            world.spawnParticle(Particle.DUST, b, 1, 0, 0, 0, 0, PURPLE);
                        }
                    }
                    if (EXPLOSION_PARTICLE != null) {
                        world.spawnParticle(EXPLOSION_PARTICLE, hitLoc, 1, 0, 0, 0, 0);
                    }
                    world.spawnParticle(Particle.CLOUD, hitLoc, 20, 0.8, 0.4, 0.8, 0.05);
                    if (fallTaskRef != null) fallTaskRef.cancel();
                }
            } catch (e) {
                if (fallTaskRef != null) fallTaskRef.cancel();
            }
        }
    });
    fallTaskRef = new FallTask().runTaskTimer(plugin, 1, 1);
}
function showScanRange(player) {
    var world = player.getWorld();
    var eye = player.getEyeLocation();
    var dir = eye.getDirection().normalize();
    var right = dir.clone().crossProduct(new Vector(0, 1, 0));
    if (right.lengthSquared() < 1e-9) right = new Vector(1, 0, 0);
    right.normalize();
    var up = right.clone().crossProduct(dir).normalize();
    var half = FOV_DEG / 2;             // 左右各偏45°
    var deg2rad = Math.PI / 180;
    for (var side = -1; side <= 1; side += 2) {
        var d = rotateAroundAxis(dir, up, side * half * deg2rad);
        d.normalize();
        for (var r = 0.3; r <= RANGE; r += RAY_STEP) {
            var p = eye.clone().add(d.clone().multiply(r));
            world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, WHITE);
            world.spawnParticle(Particle.DUST, p, 1, 0, 0, 0, 0, GRAY);
        }
    }
    var foot = player.getLocation();
    foot.setY(foot.getY() + 0.1);
    if (EXPLOSION_PARTICLE != null) {
        world.spawnParticle(EXPLOSION_PARTICLE, foot, 1, 0, 0, 0, 0);
    }
    world.spawnParticle(Particle.CLOUD, foot, 15, 0.8, 0.2, 0.8, 0.05);
    world.spawnParticle(Particle.DUST, foot, 20, 0.8, 0.2, 0.8, 0, GRAY);
}
function markRing(ent) {
    var world = ent.getWorld();
    var loc = ent.getLocation();
    var width = 1.0;
    try { width = Math.max(0.8, ent.getWidth()); } catch (e) {}
    var radius = width * 0.55 + 0.3;
    var y = loc.getY() + Math.max(0.5, ent.getHeight() * 0.5);
    for (var i = 0; i < 20; i++) {
        var a = (2 * Math.PI * i) / 20;
        var pLoc = new Location(world, loc.getX() + Math.cos(a) * radius, y, loc.getZ() + Math.sin(a) * radius);
        world.spawnParticle(Particle.DUST, pLoc, 1, 0, 0, 0, 0, RED);
    }
    var ground = new Location(world, loc.getX(), loc.getY() + 0.15, loc.getZ());
    world.spawnParticle(Particle.DUST, ground, 14, radius, 0.1, radius, 0, GRAY);
    world.spawnParticle(Particle.CLOUD, ground, 5, radius, 0.1, radius, 0.03);
}
function startMarkTask() {
    try {
        if (plugin.hasMetadata(META_FUDI_MARK_TASK)) {
            try { Bukkit.getScheduler().cancelTask(Number(plugin.getMetadata(META_FUDI_MARK_TASK).get(0).value())); } catch (e0) {}
            try { plugin.removeMetadata(META_FUDI_MARK_TASK, plugin); } catch (e1) {}
        }
    } catch (e0) {}

    var task = Java.extend(BukkitRunnable, {
        run: function () {
            try {
                var now = Date.now();
                var it = marked.entrySet().iterator();
                while (it.hasNext()) {
                    var entry = it.next();
                    if (now > entry.getValue()) { it.remove(); continue; }
                    var ent = Bukkit.getEntity(UUID.fromString(entry.getKey()));
                    if (ent == null || ent.isDead()) { it.remove(); continue; }
                    if (!(ent instanceof LivingEntity)) { it.remove(); continue; }
                    markRing(ent);
                }
                // 顺带清理已过冷却的右键记录，防止 cdMap 长期膨胀
                var cdIt = cdMap.entrySet().iterator();
                while (cdIt.hasNext()) {
                    var cdEntry = cdIt.next();
                    if (now - cdEntry.getValue() > COOLDOWN_MS) cdIt.remove();
                }
            } catch (e) {}
        }
    });
    try {
        plugin.setMetadata(META_FUDI_MARK_TASK, new FixedMetadataValue(plugin, new task().runTaskTimer(plugin, 5, 5).getTaskId()));
    } catch (eId) {}
}
var RunnableImpl = Java.extend(Java.type('java.lang.Runnable'));
var startMarkRunnable = new RunnableImpl({
    run: function() { startMarkTask(); }
});
Bukkit.getScheduler().runTask(plugin, startMarkRunnable);
function rotateAroundAxis(vec, axis, angle) {
    var s = Math.sin(angle);
    var c = Math.cos(angle);
    var x = vec.getX(), y = vec.getY(), z = vec.getZ();
    var ax = axis.getX(), ay = axis.getY(), az = axis.getZ();
    var dot = x * ax + y * ay + z * az;
    var rx = x * c + (1 - c) * dot * ax + s * (ay * z - az * y);
    var ry = y * c + (1 - c) * dot * ay + s * (az * x - ax * z);
    var rz = z * c + (1 - c) * dot * az + s * (ax * y - ay * x);
    return new Vector(rx, ry, rz);
}

// 监听器防重注册：热重载先注销旧实例；registerEvent 须在主线程执行
var fudiListener = new (Java.extend(Listener, {}))();
var initFudiListener = new RunnableImpl({
    run: function() {
        if (plugin.gltcFudiRegistered === true && plugin.gltcFudiListener != null) {
            try { EntityDamageByEntityEvent.getHandlerList().unregister(plugin.gltcFudiListener); } catch (e) {}
            try { PlayerItemHeldEvent.getHandlerList().unregister(plugin.gltcFudiListener); } catch (e1) {}
            try { PlayerQuitEvent.getHandlerList().unregister(plugin.gltcFudiListener); } catch (e2) {}
        }
        plugin.gltcFudiListener = fudiListener;
        plugin.gltcFudiRegistered = true;
        Bukkit.getPluginManager().registerEvent(
            EntityDamageByEntityEvent,
            fudiListener,
            EventPriority.NORMAL,
            function (l, event) {
                try { onEntityDamageByEntity(event); } catch (e) {}
            },
            plugin
        );
        Bukkit.getPluginManager().registerEvent(
            PlayerItemHeldEvent,
            fudiListener,
            EventPriority.MONITOR,
            function (l, evt) {
                try {
                    var prev = evt.getPlayer().getInventory().getItem(evt.getPreviousSlot());
                    if (wasHolding(prev)) clearWeaponState(evt.getPlayer());
                } catch (e) {}
            },
            plugin
        );
        Bukkit.getPluginManager().registerEvent(
            PlayerQuitEvent,
            fudiListener,
            EventPriority.MONITOR,
            function (l, event) {
                try { clearWeaponState(event.getPlayer()); } catch (e) {}
            },
            plugin
        );
    }
});
Bukkit.getScheduler().runTask(plugin, initFudiListener);
