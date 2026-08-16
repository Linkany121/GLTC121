function onUse(event) {
    var player = event.getPlayer();
    var mainHand = player.getInventory().getItemInMainHand();
    if (mainHand == null || mainHand.getAmount() <= 0) {
        return;
    }
    mainHand.setAmount(mainHand.getAmount() - 1);
    runOpCommand(player, "tellraw @a [" +
        "{\"text\":\"[\",\"color\":\"white\"}," +
        "{\"text\":\"G\",\"color\":\"#ff00ef\"}," +
        "{\"text\":\"L\",\"color\":\"#db17f1\"}," +
        "{\"text\":\"T\",\"color\":\"#b62ef4\"}," +
        "{\"text\":\"C\",\"color\":\"#9245f6\"}," +
        "{\"text\":\"联\",\"color\":\"#6d5df8\"}," +
        "{\"text\":\"合\",\"color\":\"#4974fa\"}," +
        "{\"text\":\"协\",\"color\":\"#248bfd\"}," +
        "{\"text\":\"议\",\"color\":\"#00a2ff\"}," +
        "{\"text\":\"] \",\"color\":\"white\"}," +
        "{\"text\":\"" + player.getName() + "\",\"color\":\"yellow\"}," +
        "{\"text\":\" 正在启用轮椅之力！\",\"color\":\"white\"}" +
    "]");
    player.sendMessage("§e§l天雷降临！轮椅之力已激活！");
    for (var i = 0; i < 5; i++) {
        runOpCommand(player, "summon minecraft:lightning_bolt " + player.getX() + " " + player.getY() + " " + player.getZ());
    }
}