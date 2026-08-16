var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var ChatColor = Java.type("org.bukkit.ChatColor");

// 辅助：添加药水效果
function addEffect(player, typeName, durationTicks, amplifier) {
    var type = PotionEffectType.getByName(typeName);
    if (type != null) {
        // 防止 amplifier 越界（MC 合法范围为 0~255）
        if (amplifier < 0) amplifier = 0;
        if (amplifier > 255) amplifier = 255;
        player.addPotionEffect(new PotionEffect(type, durationTicks, amplifier, true, true, true));
    }
}

// 辅助：清除所有药水效果
function clearAllEffects(player) {
    var effects = player.getActivePotionEffects();
    var iterator = effects.iterator();
    while (iterator.hasNext()) {
        player.removePotionEffect(iterator.next().getType());
    }
}

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (item == null) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null) return;

    var id = sfItem.getId();

    // 板蓝根：回复4生命，清除效果
    if (id == "UMPV_板蓝根") {
        item.setAmount(item.getAmount() - 1);
        var maxHp = player.getMaxHealth();
        player.setHealth(Math.min(maxHp, player.getHealth() + 4));
        clearAllEffects(player);
        return true;
    }

    // 满穗线香：1分钟生命回复1
    if (id == "UMPV_满穗线香") {
        item.setAmount(item.getAmount() - 1);
        addEffect(player, "REGENERATION", 60 * 20, 0);
        return true;
    }

    // 末嫦娥：1分钟抗火、夜视
    if (id == "UMPV_末嫦娥") {
        item.setAmount(item.getAmount() - 1);
        addEffect(player, "FIRE_RESISTANCE", 60 * 20, 0);
        addEffect(player, "NIGHT_VISION", 60 * 20, 0);
        return true;
    }

    // 琼华古冶散：1分钟伤害吸收2，1秒中毒3、缓慢3
    if (id == "UMPV_琼华古冶散") {
        item.setAmount(item.getAmount() - 1);
        addEffect(player, "ABSORPTION", 60 * 20, 1);   // 等级2
        addEffect(player, "POISON", 1 * 20, 2);        // 等级3
        addEffect(player, "SLOWNESS", 1 * 20, 2);
        return true;
    }

    // 原神丸：30秒中毒50、凋零50
    if (id == "UMPV_原神丸") {
        item.setAmount(item.getAmount() - 1);
        addEffect(player, "instant_damage", 30 * 20, 49);
        return true;
    }

    // 半满之月：回复10生命，清除效果；5分钟抗火、夜视、生命回复2
    if (id == "UMPV_半满之月") {
        item.setAmount(item.getAmount() - 1);
        var maxHp = player.getMaxHealth();
        player.setHealth(Math.min(maxHp, player.getHealth() + 10));
        clearAllEffects(player);
        addEffect(player, "FIRE_RESISTANCE", 5 * 60 * 20, 0);
        addEffect(player, "NIGHT_VISION", 5 * 60 * 20, 0);
        addEffect(player, "REGENERATION", 5 * 60 * 20, 1); // 等级2
        return true;
    }

    // 辟风兽角：5分钟速度10、幸运
    if (id == "UMPV_辟风兽角") {
        item.setAmount(item.getAmount() - 1);
        addEffect(player, "SPEED", 5 * 60 * 20, 9);       // 速度X
        addEffect(player, "LUCK", 5 * 60 * 20, 0);        // 幸运I
        return true;
    }

    // 悠久的群天之甘露：1分钟速度100、跳跃提升3
    if (id == "UMPV_悠久的群天之甘露") {
        item.setAmount(item.getAmount() - 1);
        addEffect(player, "SPEED", 60 * 20, 99);          // 速度C
        addEffect(player, "JUMP_BOOST", 60 * 20, 2);      // 跳跃提升III
        return true;
    }

    // 龙心
    if (id == "UMPV_龙心") {
        item.setAmount(item.getAmount() - 1);
        // 回复 30%最大生命 + 20
        var maxHp = player.getMaxHealth();
        var heal = Math.floor(maxHp * 0.3 + 20);
        var newHp = Math.min(maxHp, player.getHealth() + heal);
        player.setHealth(newHp);
        // 聊天栏提示
        player.sendMessage(ChatColor.GOLD + "磅礴迸发的龙心使你回复" + ChatColor.RED + heal + ChatColor.GOLD + "生命值");
        // 清除所有效果
        clearAllEffects(player);
        // 30秒抗性提升3
        addEffect(player, "RESISTANCE", 30 * 20, 2);
        // 3分钟生命回复5
        addEffect(player, "REGENERATION", 3 * 60 * 20, 4);
        // 3分钟伤害吸收10
        addEffect(player, "ABSORPTION", 3 * 60 * 20, 9);
        // 15分钟抗火、夜视、力量2
        addEffect(player, "FIRE_RESISTANCE", 15 * 60 * 20, 0);
        addEffect(player, "NIGHT_VISION", 15 * 60 * 20, 0);
        addEffect(player, "STRENGTH", 15 * 60 * 20, 1);
        return true;
    }

    // 果冻：所有效果3秒
    if (id == "UMPV_果冻") {
        item.setAmount(item.getAmount() - 1);
        var allTypes = Java.from(PotionEffectType.values());
        for (var i = 0; i < allTypes.length; i++) {
            var type = allTypes[i];
            if (type != null) {
                player.addPotionEffect(new PotionEffect(type, 3 * 20, 0, true, true, true));
            }
        }
        return true;
    }

    return true; // 其他物品不处理
}