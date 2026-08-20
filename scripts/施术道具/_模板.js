/**
 * 施术道具模板 —— 复制后改 STAFF_ID，items.yml 绑定 script
 * Graal：本上下文 eval 施术核心一次并缓存；会话走共享 ConcurrentHashMap
 *
 * 约定：
 *   站立右键 → 施术（onAfterCast）
 *   蹲下右键 → 选术环（始终）+ 可选 onSneakUse 额外技能
 */

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var Player = Java.type("org.bukkit.entity.Player");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var STAFF_ID = "VASA_把ID改成你的粘液物品ID";
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var CAST_API = null;

function findCoreFile() {
    var candidates = [
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC_联合协议/scripts/施术道具/施术核心.js"),
        new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/GLTC121/scripts/施术道具/施术核心.js")
    ];
    try {
        var addonsDir = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons");
        if (addonsDir.exists()) {
            var list = addonsDir.listFiles();
            if (list) {
                for (var i = 0; i < list.length; i++) {
                    candidates.push(new File(list[i], "scripts/施术道具/施术核心.js"));
                }
            }
        }
    } catch (e) {}
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists()) return candidates[c];
    }
    return null;
}

function loadCastApi() {
    if (CAST_API && typeof CAST_API.handleStaffUse === "function") return true;
    try {
        var bridge = PLUGIN.gltcSpellBridge;
        if (bridge != null && (bridge instanceof java.util.Map)) {
            var api = bridge.get("api");
            if (api != null && typeof api.handleStaffUse === "function") {
                CAST_API = api;
                return true;
            }
        }
    } catch (e0) {}
    var file = findCoreFile();
    if (!file) return false;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        var exported = (0, eval)(code);
        if (exported && typeof exported.handleStaffUse === "function") {
            CAST_API = exported;
            return true;
        }
    } catch (e2) {}
    return false;
}

loadCastApi();

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    var item = player.getInventory().getItemInMainHand();
    if (!item || item.getType() === Material.AIR) return;
    try {
        var sf = Java.type("io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem").getByItem(item);
        if (!sf || sf.getId() !== STAFF_ID) return;
    } catch (e2) { return; }

    if (!loadCastApi()) {
        player.sendMessage(GLTC_PREFIX + "§c施术核心加载失败。");
        return;
    }
    CAST_API.handleStaffUse(player, {
        // onSneakUse: function(p) { /* 蹲下右键开环时额外触发 */ },
        onAfterCast: function(p, spell) {
            // ---- 施术后特效 ----
        }
    });
}

function tick(info) {}
