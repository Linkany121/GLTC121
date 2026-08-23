/**
 * 舰体货币读写 — 发布机 / 接收机 / 访问站共用
 * 统一 ReentrantLock，避免 synchronized 与 lock() 混用导致并发失效
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var File = java.io.File;
var Files = java.nio.file.Files;
var StandardCharsets = java.nio.charset.StandardCharsets;
var ByteBuffer = Java.type("java.nio.ByteBuffer");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var DATA_DIR = new File(PLUGIN.getDataFolder().getAbsolutePath() + "/addon_configs/GLTC/玩家属性/舰体货币");
if (!DATA_DIR.exists()) DATA_DIR.mkdirs();

function getCurrencyLock() {
    var ReentrantLock = Java.type("java.util.concurrent.locks.ReentrantLock");
    try {
        if (PLUGIN.gltcCurrencyLock == null || !ReentrantLock.class.isInstance(PLUGIN.gltcCurrencyLock)) {
            PLUGIN.gltcCurrencyLock = new ReentrantLock();
        }
        return PLUGIN.gltcCurrencyLock;
    } catch (e) {
        if (PLUGIN.gltcCurrencyLock == null) PLUGIN.gltcCurrencyLock = new java.lang.Object();
        return PLUGIN.gltcCurrencyLock;
    }
}

function withCurrencyLock(fn) {
    var lock = getCurrencyLock();
    try {
        var ReentrantLock = Java.type("java.util.concurrent.locks.ReentrantLock");
        if (ReentrantLock.class.isInstance(lock)) {
            lock.lock();
            try { return fn(); } finally { lock.unlock(); }
        }
    } catch (e0) {}
    try {
        if (typeof Java.synchronized === "function") {
            return Java.synchronized(lock, fn)();
        }
    } catch (e1) {}
    return fn();
}

function getShipCurrency(uuid) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    if (!file.exists()) return {I: 0, V: 0, X: 0};
    try {
        var bytes = Files.readAllBytes(file.toPath());
        var charBuffer = StandardCharsets.UTF_8.decode(ByteBuffer.wrap(bytes));
        var data = JSON.parse(charBuffer.toString());
        return {I: data.I || 0, V: data.V || 0, X: data.X || 0};
    } catch (e) {
        return {I: 0, V: 0, X: 0};
    }
}

function setShipCurrency(uuid, data) {
    var file = new File(DATA_DIR.getAbsolutePath() + "/" + uuid + ".json");
    try {
        var lines = new java.util.ArrayList();
        lines.add(JSON.stringify({I: data.I || 0, V: data.V || 0, X: data.X || 0}, null, 2));
        Files.write(file.toPath(), lines, StandardCharsets.UTF_8);
    } catch (e) {
        Bukkit.getLogger().warning("[GLTC] 保存舰体货币失败 uuid=" + uuid + ": " + e);
    }
}

function modifyShipCurrency(uuid, modifier) {
    return withCurrencyLock(function() {
        var data = getShipCurrency(uuid);
        var result = modifier(data);
        setShipCurrency(uuid, data);
        return result;
    });
}

function addShipCurrency(uuid, type, amount) {
    return modifyShipCurrency(uuid, function(data) {
        if (type === "I") data.I += amount;
        else if (type === "V") data.V += amount;
        else if (type === "X") data.X += amount;
        return data;
    });
}

({
    getCurrencyLock: getCurrencyLock,
    withCurrencyLock: withCurrencyLock,
    getShipCurrency: getShipCurrency,
    setShipCurrency: setShipCurrency,
    modifyShipCurrency: modifyShipCurrency,
    addShipCurrency: addShipCurrency
});
