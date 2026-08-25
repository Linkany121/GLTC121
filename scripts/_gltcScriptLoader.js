/**
 * GLTC 脚本加载器 — 统一 find + eval，避免各模块重复实现路径探测。
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

function findScriptFile(rel) {
    rel = String(rel || "").replace(/\\/g, "/");
    // 仅白名单附属目录，避免扫到其它 addons 同名脚本
    var roots = ["GLTC_联合协议", "GLTC121"];
    var candidates = [];
    for (var r = 0; r < roots.length; r++) {
        candidates.push(new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/" + roots[r] + "/scripts/" + rel));
    }
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists()) return candidates[c];
    }
    return null;
}

function evalScriptExport(rel, opts) {
    opts = opts || {};
    rel = String(rel || "").replace(/\\/g, "/");
    // 全服单例缓存，避免术式登记/运行时被反复 eval 刷屏
    if (opts.cache !== false) {
        try {
            var cache = PLUGIN.gltcEvalCache;
            if (cache == null) {
                cache = new java.util.concurrent.ConcurrentHashMap();
                PLUGIN.gltcEvalCache = cache;
            }
            var hit = cache.get(rel);
            if (hit != null) return hit;
        } catch (eCache) {}
    }
    var file = findScriptFile(rel);
    if (!file) return null;
    try {
        var code = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(Files.readAllBytes(file.toPath()))).toString();
        if (opts.isolated) {
            // 隔离作用域；把末尾导出变成 return，否则 IIFE 得到 undefined
            var body = String(code).replace(/\s+$/, "");
            if (!/\breturn\s+/.test(body.slice(-80))) {
                if (/\(\s*\{[\s\S]*\}\s*\)\s*;?\s*$/.test(body)) {
                    body = body.replace(/\(\s*\{([\s\S]*)\}\s*\)\s*;?\s*$/, "return ({\n$1\n});");
                } else if (/(?:^|[\n;])\s*([A-Za-z_$][\w$]*)\s*;\s*$/.test(body)) {
                    body = body.replace(/([A-Za-z_$][\w$]*)\s*;\s*$/, "return $1;");
                }
            }
            code = "(function(){\n" + body + "\n})();";
        }
        var result = (0, eval)(code);
        if (result != null && opts.cache !== false) {
            try { PLUGIN.gltcEvalCache.put(rel, result); } catch (ePut) {}
        }
        return result;
    } catch (e) {
        if (opts.silent !== true) {
            Bukkit.getLogger().warning("[GLTC脚本] 加载失败 " + rel + ": " + e);
        }
        return null;
    }
}

function findScriptDir(relativeDir) {
    relativeDir = String(relativeDir || "").replace(/\\/g, "/").replace(/\/$/, "");
    var roots = ["GLTC_联合协议", "GLTC121"];
    var candidates = [];
    for (var r = 0; r < roots.length; r++) {
        candidates.push(new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addons/" + roots[r] + "/scripts/" + relativeDir));
    }
    for (var c = 0; c < candidates.length; c++) {
        if (candidates[c].exists() && candidates[c].isDirectory()) return candidates[c];
    }
    return null;
}

function listScriptFiles(relativeDir, filterFn) {
    relativeDir = String(relativeDir || "").replace(/\\/g, "/").replace(/\/$/, "");
    var dir = findScriptDir(relativeDir);
    if (dir == null) return [];
    var out = [];
    var list = dir.listFiles();
    if (!list) return out;
    for (var i = 0; i < list.length; i++) {
        var f = list[i];
        if (f == null || !f.isFile()) continue;
        var name = String(f.getName());
        if (!/\.js$/i.test(name)) continue;
        var rel = relativeDir.length ? (relativeDir + "/" + name) : name;
        if (filterFn && !filterFn(rel, name)) continue;
        out.push(rel.replace(/\\/g, "/"));
    }
    out.sort();
    return out;
}

({
    findScriptFile: findScriptFile,
    findScriptDir: findScriptDir,
    evalScriptExport: evalScriptExport,
    listScriptFiles: listScriptFiles
});
