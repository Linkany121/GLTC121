var SlimefunItem = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem");
var Material = Java.type("org.bukkit.Material");

// 与 items.yml → FKR_深渊召来 的物品 ID 一致（勿再用显示名比对：&# 写法与运行时 §x 转换不一致，且名称曾改版）
var GLTC_ITEM_ID = "FKR_深渊召来";

function isAbyssItem(item) {
    if (!item || item.getType() === Material.AIR) return false;
    try {
        var sf = SlimefunItem.getByItem(item);
        if (sf != null && String(sf.getId()) === GLTC_ITEM_ID) return true;
    } catch (e) {}
    // 兜底：显示名包含关键描述（与 items.yml 名称"压缩脆弱守卫雕像"对应）
    try {
        var meta = item.getItemMeta();
        if (meta != null && meta.hasDisplayName() && String(meta.getDisplayName()).indexOf("压缩脆弱守卫雕像") >= 0) return true;
    } catch (e) {}
    return false;
}

function onUse(event) {
    var player = event.getPlayer();
    var mainHand = player.getInventory().getItemInMainHand();

    if (!isAbyssItem(mainHand)) return;

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

    // 仅玩家可见的提示（GLTC 前缀采用与 FKR 武器/道具套系一致的 e017e8→4b95ff 渐变）
    player.sendMessage("§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§x§f§f§f§5§b§3成功展开极度脆弱的低智能守卫雕像。");
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
            if (!isAbyssItem(item)) return;

            onUse(evt);

            // 取消事件，防止右键方块时同时打开界面或触发其他
            evt.setCancelled(true);
        }
    };
}
