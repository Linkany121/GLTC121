var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Bukkit = Java.type("org.bukkit.Bukkit");

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (item == null) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null) return;
    if (sfItem.getId() != "UMPV_灼金香烹餮汤锅") return;

    item.setAmount(item.getAmount() - 1);
    player.setFoodLevel(player.getFoodLevel() + 8);
    player.setSaturation(player.getSaturation() + 8);
    player.getWorld().playSound(player.getLocation(), "entity.generic.eat", 1.0, 1.0);
    player.getWorld().playSound(player.getLocation(), "entity.player.burp", 1.0, 1.0);

    var duration = 60 * 60 * 20;
    player.addPotionEffect(new PotionEffect(PotionEffectType.SATURATION, duration, 1, true, true, true));
    player.addPotionEffect(new PotionEffect(PotionEffectType.RESISTANCE, duration, 0, true, true, true));
    player.addPotionEffect(new PotionEffect(PotionEffectType.REGENERATION, duration, 3, true, true, true));

    var plugin = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
    if (plugin != null) {
        var endTime = Date.now() + 3 * 60 * 1000;
        player.setMetadata("gltc_soup", new org.bukkit.metadata.FixedMetadataValue(plugin, endTime));
    }

    player.sendMessage(
        "§f[§x§f§f§0§0§e§fG§x§d§b§1§7§f§1L§x§b§6§2§e§f§4T§x§9§2§4§5§f§6C" +
        "§x§6§d§5§d§f§8联§x§4§9§7§4§f§a合§x§2§4§8§b§f§d协§x§0§0§a§2§f§f议§f]" +
        "§x§f§f§f§5§b§3吃下世间绝味般的美食，你感到喉中滚烫的汤汁中蕴含着一往无前的气势。"
    );
}