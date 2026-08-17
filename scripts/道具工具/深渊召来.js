const DISPLAY_NAME = '&#a30000F&#e00000K&#ff0000R&#ff0000T &4测试';

function onUse(event) {
    var player = event.getPlayer();
    var mainHand = player.getInventory().getItemInMainHand();

    if (mainHand == null || mainHand.getAmount() <= 0) return;

    // 消耗一个物品
    if (mainHand.getAmount() > 1) {
        mainHand.setAmount(mainHand.getAmount() - 1);
    } else {
        player.getInventory().setItemInMainHand(null);
    }

    var x = player.getX();
    var y = player.getY();
    var z = player.getZ();

    // 召唤坚守者
    runOpCommand(player, "summon minecraft:warden " + x + " " + y + " " + z);
    // 设置为 1 点生命值
    runOpCommand(player, "data merge entity @e[type=minecraft:warden,sort=nearest,limit=1] {Health:1.0f}");

    // 幽匿粒子
    runOpCommand(player, "particle minecraft:sculk_soul " + x + " " + (y + 1) + " " + z + " 0.5 0.5 0.5 0.1 10");

    // 仅玩家可见的提示
    player.sendMessage("§f[§x§f§f§0§0§e§fG§x§d§b§1§7§f§1L§x§b§6§2§e§f§4T§x§9§2§4§5§f§6C§x§6§d§5§d§f§8联§x§4§9§7§4§f§a合§x§2§4§8§b§f§d协§x§0§0§a§2§f§f议§f]§x§f§f§f§5§b§3成功展开极度脆弱的低智能守卫雕像。");
}

function onLoad() {
    return {
        PlayerInteractEvent: function(evt) {
            // 只响应右键
            var action = evt.getAction().name();
            if (action !== 'RIGHT_CLICK_AIR' && action !== 'RIGHT_CLICK_BLOCK') return;

            // 只响应主手操作
            if (evt.getHand() !== org.bukkit.inventory.EquipmentSlot.HAND) return;

            var item = evt.getPlayer().getInventory().getItemInMainHand();
            if (!item || !item.hasItemMeta()) return;

            // 严格比对物品显示名
            if (item.getItemMeta().getDisplayName() !== DISPLAY_NAME) return;

            onUse(evt);

            // 取消事件，防止右键方块时同时打开界面或触发其他
            evt.setCancelled(true);
        }
    };
}