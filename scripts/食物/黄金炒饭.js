var PotionEffect = Java.type("org.bukkit.potion.PotionEffect");
var PotionEffectType = Java.type("org.bukkit.potion.PotionEffectType");
var Bukkit = Java.type("org.bukkit.Bukkit");

function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();
    if (item == null) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null) return;
    if (sfItem.getId() != "UMPV_黄金炒饭") return;

    item.setAmount(item.getAmount() - 1);
    player.setFoodLevel(Math.min(20, player.getFoodLevel() + 20));
    player.setSaturation(player.getSaturation() + 20);
    player.getWorld().playSound(player.getLocation(), "entity.generic.eat", 1.0, 1.0);
    player.getWorld().playSound(player.getLocation(), "entity.player.burp", 1.0, 1.0);

    var dur = 120 * 60 * 20;
    player.addPotionEffect(new PotionEffect(PotionEffectType.SATURATION, dur, 4, true, true, true));
    player.addPotionEffect(new PotionEffect(PotionEffectType.RESISTANCE, dur, 1, true, true, true));
    player.addPotionEffect(new PotionEffect(PotionEffectType.HEALTH_BOOST, dur, 4, true, true, true));
    player.addPotionEffect(new PotionEffect(PotionEffectType.REGENERATION, dur, 4, true, true, true));
    player.addPotionEffect(new PotionEffect(PotionEffectType.WATER_BREATHING, dur, 0, true, true, true));
    player.addPotionEffect(new PotionEffect(PotionEffectType.FIRE_RESISTANCE, dur, 0, true, true, true));

    var plugin = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
    if (plugin != null) {
        var endTime = Date.now() + 60 * 1000;
        player.setMetadata("gltc_goldenrice", new org.bukkit.metadata.FixedMetadataValue(plugin, endTime));
    }

    player.sendMessage(
        "§f[§x§f§f§0§0§e§fG§x§d§b§1§7§f§1L§x§b§6§2§e§f§4T§x§9§2§4§5§f§6C" +
        "§x§6§d§5§d§f§8联§x§4§9§7§4§f§a合§x§2§4§8§b§f§d协§x§0§0§a§2§f§f议§f]" +
        "§6吃下琳琅璀璨的传世杰作，四肢百骸仿佛被热流打通，使你神识清明，身轻如燕。"
    );
}