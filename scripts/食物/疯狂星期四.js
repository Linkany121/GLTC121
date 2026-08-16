var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Particle = Java.type("org.bukkit.Particle");
var Color = Java.type("org.bukkit.Color");
var DustOptionsClass = Java.type("org.bukkit.Particle$DustOptions");
var EntityTypeClass = Java.type("org.bukkit.entity.EntityType");
var FireworkEffectClass = Java.type("org.bukkit.FireworkEffect");

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (item == null) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null) return;
    if (sfItem.getId() != "UMPV_疯狂星期四") return;

    // 消耗一个
    item.setAmount(item.getAmount() - 1);

    // 恢复 6 饥饿值 + 6 饱和度
    player.setFoodLevel(Math.min(20, player.getFoodLevel() + 6));
    player.setSaturation(Math.min(player.getFoodLevel(), player.getSaturation() + 6));

    // 进食音效
    player.getWorld().playSound(player.getLocation(), "entity.generic.eat", 1.0, 1.0);

    // 药水效果：60分钟
    var duration = 60 * 60 * 20; // ticks
    var effects = [
        ["SATURATION",      duration, 1],  // 饱和 II
        ["RESISTANCE",      duration, 0],  // 抗性提升 I
        ["STRENGTH",        duration, 2],  // 力量 III
        ["SPEED",           duration, 0],  // 速度 I
        ["HEALTH_BOOST",    duration, 9],  // 生命提升 X
        ["FIRE_RESISTANCE", duration, 0],  // 抗火
        ["GLOWING",         duration, 0],  // 发光
        ["LUCK",            duration, 4]   // 幸运 V
    ];
    for (var i = 0; i < effects.length; i++) {
        var e = effects[i];
        var type = PotionEffectType.getByName(e[0]);
        if (type != null) {
            player.addPotionEffect(new PotionEffect(type, e[1], e[2], true, true, true));
        }
    }

    // 红色橙色蒸汽粒子爆发
    var loc = player.getLocation().add(0, 1, 0);
    var world = player.getWorld();
    var red = new DustOptionsClass(Color.fromRGB(255, 0, 0), 1.0);
    var orange = new DustOptionsClass(Color.fromRGB(255, 165, 0), 1.0);
    for (var j = 0; j < 80; j++) {
        var dust = j % 2 == 0 ? red : orange;
        world.spawnParticle(Particle.DUST, loc, 0, 0.5, 0.5, 0.5, 0, dust);
    }

    // 召唤数个烟花 (1.20.5+ 用 FIREWORK_ROCKET)
    var fireworkType = EntityTypeClass.valueOf("FIREWORK_ROCKET");
    var ballLargeType = FireworkEffectClass.Type.valueOf("BALL_LARGE");
    for (var k = 0; k < 4; k++) {
        var fireworkLoc = loc.clone().add(0.5 - Math.random(), 1, 0.5 - Math.random());
        var firework = world.spawnEntity(fireworkLoc, fireworkType);
        var meta = firework.getFireworkMeta();
        var effect = FireworkEffectClass.builder()
            .withColor(Color.fromRGB(
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256),
                Math.floor(Math.random() * 256)
            ))
            .withFade(Color.fromRGB(255, 165, 0))
            .with(ballLargeType)
            .build();
        meta.addEffect(effect);
        meta.setPower(1);
        firework.setFireworkMeta(meta);
        // 立即引爆
        firework.detonate();
    }

    return true;
}