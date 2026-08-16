
var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");

var foodMap = {
    "UMPV_酥脆大薯条":    { food: 6 },
    "UMPV_炭烤海螺":      { food: 6 },
    "UMPV_大盘煎蛋":      { food: 6 },

    "UMPV_久蒸大米饭":    { food: 8 },
    "UMPV_猛炸大薯条":    { food: 8 },
    "UMPV_肉糜煎蛋":      { food: 8 },
    "UMPV_烤厄索斯菜卷":  { food: 8 },
    "UMPV_酱烤岩兽串":    { food: 8 },
    "UMPV_瓜片炒餮头肉":  { food: 8 },
    "UMPV_翠玉卷心瓜片":  { food: 8 },

    "UMPV_屑切菜香肉盘": {
        food: 5,
        effects: [
            ["SATURATION",      30, 1],
            ["JUMP",            30, 1]
        ]
    },
    "UMPV_蘑菇萝卜厚炖": {
        food: 5,
        effects: [
            ["SATURATION",      30, 1],
            ["REGENERATION",    30, 1]
        ]
    },
    "UMPV_蛋炒鱼肉丝": {
        food: 5,
        effects: [
            ["SATURATION",      30, 1],
            ["NIGHT_VISION",    30, 1]
        ]
    },
    "UMPV_狂野人生烤串": {
        food: 5,
        effects: [
            ["SATURATION",      30, 1],
            ["WEAKNESS",        30, 1],
            ["FIRE_RESISTANCE", 30, 1]
        ]
    },
    "UMPV_深海野兽": {
        food: 5,
        effects: [
            ["SATURATION",      30, 1],
            ["WATER_BREATHING", 30, 1]
        ]
    },
    "UMPV_水煮虐王兽肉汤": {
        food: 5,
        effects: [
            ["SATURATION",      30, 1],
            ["STRENGTH",        30, 1]
        ]
    },
    "UMPV_大锅炖肉土豆": {
        food: 5,
        effects: [
            ["SATURATION",      30, 1],
            ["REGENERATION",    30, 1]
        ]
    },

    "UMPV_菌萝香炖稻焖饭": {
        food: 6,
        effects: [
            ["SATURATION",      60, 1],
            ["RESISTANCE",      60, 1]
        ]
    },
    "UMPV_苔香辣卤海鲜汤": {
        food: 6,
        effects: [
            ["SATURATION",      60, 1],
            ["REGENERATION",    60, 2]
        ]
    },
    "UMPV_海陆双菌酒生煎": {
        food: 6,
        effects: [
            ["SATURATION",      60, 1],
            ["FIRE_RESISTANCE", 60, 1],
            ["JUMP",            60, 2]
        ]
    },
    "UMPV_黄金焗酱烤整羽": {
        food: 6,
        effects: [
            ["SATURATION",      60, 1],
            ["STRENGTH",        60, 2]
        ]
    },
    "UMPV_见手金果炸全腿": {
        food: 6,
        effects: [
            ["SATURATION",      60, 1],
            ["WATER_BREATHING", 60, 1],
            ["FIRE_RESISTANCE", 60, 1]
        ]
    }
};

function addEffects(player, effects) {
    for (var i = 0; i < effects.length; i++) {
        var e = effects[i];
        var type = PotionEffectType.getByName(e[0]);
        if (type == null) continue;
        var duration = e[1] * 60 * 20;
        var amplifier = e[2] - 1;
        // 防止 amplifier 越界（MC 合法范围为 0~255）
        if (amplifier < 0) amplifier = 0;
        if (amplifier > 255) amplifier = 255;
        player.addPotionEffect(new PotionEffect(type, duration, amplifier, true, true, true));
    }
}

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (item == null) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null) return;

    var id = sfItem.getId();
    var data = foodMap[id];
    if (!data) return;

    item.setAmount(item.getAmount() - 1);

    var food = data.food;
    player.setFoodLevel(player.getFoodLevel() + food);
    player.setSaturation(player.getSaturation() + food);

    player.getWorld().playSound(player.getLocation(), "entity.generic.eat", 1.0, 1.0);
    player.getWorld().playSound(player.getLocation(), "entity.player.burp", 1.0, 1.0);

    if (data.effects) {
        addEffects(player, data.effects);
    }
}