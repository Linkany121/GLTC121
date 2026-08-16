var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (item == null) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null) return;
    if (sfItem.getId() != "UMPV_浮沉盐海的阖眸") return;

    // 消耗一个
    item.setAmount(item.getAmount() - 1);
    // 恢复 6 饥饿值 + 6 饱和度
    player.setFoodLevel(player.getFoodLevel() + 6);
    player.setSaturation(player.getSaturation() + 6);
    // 进食音效
    player.getWorld().playSound(player.getLocation(), "entity.generic.eat", 1.0, 1.0);
    // 药水效果
    var effects = [
        ["SATURATION",  60, 1],
        ["WIND_CHARGED", 1, 1],
        ["WEAVING",      1, 1],
        ["OOZING",       1, 1],
        ["INFESTATION",  1, 1]
    ];
    for (var i = 0; i < effects.length; i++) {
        var e = effects[i];
        var type = PotionEffectType.getByName(e[0]);
        if (type != null) {
            player.addPotionEffect(new PotionEffect(type, e[1]*60*20, e[2]-1, true, true, true));
        }
    }
}