function onUse(event) {
    var player = event.getPlayer();
    var item = player.getInventory().getItemInMainHand();

    if (item == null || item.getType() === org.bukkit.Material.AIR) return;

    var sfItem = SlimefunItem.getByItem(item);
    if (sfItem == null || sfItem.getId() !== "FKR_炽古花盆") return;

    var loc = player.getLocation();
    var dir = loc.getDirection();

    // 水平方向单位向量
    var x = dir.getX(), z = dir.getZ();
    var len = Math.sqrt(x * x + z * z);
    if (len < 0.001) return;
    x /= len;
    z /= len;

    // 左侧垂直向量 (用于宽度方向)
    var leftX = -z;
    var leftZ = x;

    var world = player.getWorld();
    var baseY = loc.getBlockY() + 1;  // 向上一格

    // 区域中心点：脚下向前一格、向上一格
    var centerX = loc.getBlockX() + Math.round(x);
    var centerZ = loc.getBlockZ() + Math.round(z);

    // 检查长3（前后：-1,0,1） × 宽5（左右：-2,-1,0,1,2）的区域
    for (var i = -1; i <= 1; i++) {          // 长度方向偏移（前后）
        for (var j = -2; j <= 2; j++) {      // 宽度方向偏移（左右）
            var bx = centerX + Math.round(x * i) + Math.round(leftX * j);
            var bz = centerZ + Math.round(z * i) + Math.round(leftZ * j);
            var block = world.getBlockAt(bx, baseY, bz);

            // 既不是空气也不是火把花 → 直接取消
            if (!block.isEmpty() && block.getType() !== org.bukkit.Material.TORCHFLOWER) {
                return;
            }
        }
    }

    // 全部通过 → 放置火把花
    for (var i = -1; i <= 1; i++) {
        for (var j = -2; j <= 2; j++) {
            var bx = centerX + Math.round(x * i) + Math.round(leftX * j);
            var bz = centerZ + Math.round(z * i) + Math.round(leftZ * j);
            runOpCommand(player, "setblock " + bx + " " + baseY + " " + bz + " torchflower");
        }
    }
}