// ===================================================================
// FKR_钢铁靶 —— 右键消耗，原地部署一个虚弱100、缓慢100的万血铁傀儡
// ===================================================================

var Bukkit = Java.type("org.bukkit.Bukkit");
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");

var ITEM_ID = "FKR_钢铁靶";

// === 铁傀儡参数 ===
var MAX_HEALTH       = 2000;    // 铁傀儡血量（MC 1.21 max_health 上限 2048，2000 可直接设置）
var WEAKNESS_LEVEL   = 99;      // 虚弱100（amplifier=99）
var SLOWNESS_LEVEL   = 99;      // 缓慢100（amplifier=99）
var EFFECT_DURATION  = 1000000; // 药水效果持续时间（tick），约13.9小时

// ===================================================================
// 右键使用
// ===================================================================
function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (item == null || item.getType() === org.bukkit.Material.AIR) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null || sfItem.getId() !== ITEM_ID) return;

    // 消耗一个
    item.setAmount(item.getAmount() - 1);

    var world = player.getWorld();
    // 原地部署：生成在玩家所在位置（略抬高，避免卡进方块）
    var loc = player.getLocation().add(0, 1, 0);

    // 生成铁傀儡
    var golem = world.spawn(loc, org.bukkit.entity.IronGolem.class);

    // 2000 血：低于 MC max_health 上限 2048，直接设置血条
    golem.setMaxHealth(MAX_HEALTH);
    golem.setHealth(MAX_HEALTH);

    // 防止被服务器当作无人刷怪清理掉
    try { golem.setRemoveWhenFarAway(false); } catch (e) {}
    try { golem.setPersistent(true); } catch (e) {}

    // 虚弱100、缓慢100
    golem.addPotionEffect(new PotionEffect(
        PotionEffectType.getByName("WEAKNESS"), EFFECT_DURATION, WEAKNESS_LEVEL, false, true, true
    ));
    golem.addPotionEffect(new PotionEffect(
        PotionEffectType.getByName("SLOWNESS"), EFFECT_DURATION, SLOWNESS_LEVEL, false, true, true
    ));

    // 生成音效与粒子
    world.playSound(loc, "entity.iron_golem.repair", 1.0, 1.0);
    world.playSound(loc, "block.anvil.land", 1.0, 0.8);
    world.spawnParticle(
        org.bukkit.Particle.CRIT,
        loc.clone().add(0, golem.getHeight() / 2, 0),
        30, 0.5, 1.0, 0.5, 0.1
    );

    // 玩家提示
    player.sendActionBar("OK");
}
