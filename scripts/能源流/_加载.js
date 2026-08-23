// ===================================================================
// 能源流信用点加载器（各商店/货币脚本顶部调用 loadCreditApi()）
// 与 枪械/_加载.js 相同模式：优先 PLUGIN 缓存，再 INSTANCE，最后 eval 文件
// ===================================================================
function loadCreditApi() {
    var Bukkit = Java.type("org.bukkit.Bukkit");
    var plugin = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
    var inst = null;
    try {
        inst = Java.type("org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer").INSTANCE;
    } catch (e0) {}
    if (plugin != null && plugin.gltcCreditApi != null) return plugin.gltcCreditApi;
    if (inst != null && inst.gltcCreditApi != null) {
        if (plugin != null) plugin.gltcCreditApi = inst.gltcCreditApi;
        return inst.gltcCreditApi;
    }
    if (plugin == null) return null;

    var File = java.io.File;
    var Files = java.nio.file.Files;
    var StandardCharsets = java.nio.charset.StandardCharsets;
    var ByteBuffer = Java.type("java.nio.ByteBuffer");
    var base = plugin.getDataFolder().getAbsolutePath();
    var candidates = [];
    var seen = {};
    function addPath(file) {
        if (!file) return;
        var p = String(file.getAbsolutePath());
        if (seen[p]) return;
        seen[p] = true;
        candidates.push(file);
    }
    addPath(new File(base + "/addons/GLTC_联合协议/scripts/能源流/_信用点.js"));
    addPath(new File(base + "/addons/GLTC121/scripts/能源流/_信用点.js"));
    try {
        var addonsDir = new File(base + "/addons");
        var list = addonsDir.listFiles();
        if (list) {
            for (var i = 0; i < list.length; i++) {
                addPath(new File(list[i].getAbsolutePath() + "/scripts/能源流/_信用点.js"));
            }
        }
    } catch (e1) {}
    for (var c = 0; c < candidates.length; c++) {
        var file = candidates[c];
        if (!file.exists()) continue;
        try {
            var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
            var exported = (0, eval)(code);
            plugin.gltcCreditApi = exported;
            if (inst != null) inst.gltcCreditApi = exported;
            return exported;
        } catch (e2) {
            try {
                Bukkit.getLogger().warning("[GLTC信用点] 加载 " + file.getAbsolutePath() + " 失败: " + e2);
            } catch (e3) {}
        }
    }
    return null;
}
