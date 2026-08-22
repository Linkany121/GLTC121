// ============================================
// VASA 深寻协议终端
// 右键机器 → 聊天栏连续对话（DeepSeek API）
// 秘钥与参数写在下方 DS_CONFIG 中
// ============================================

var Bukkit = Java.type("org.bukkit.Bukkit");
var Player = Java.type("org.bukkit.entity.Player");
var URL = Java.type("java.net.URL");
var Consumer = Java.type("java.util.function.Consumer");
var HashMap = Java.type("java.util.HashMap");
var HashSet = Java.type("java.util.HashSet");
var StandardCharsets = Java.type("java.nio.charset.StandardCharsets");

var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var GLTC_PREFIX = "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F协§x§1§E§C§9§F§F议§f] ";

// ---------------- DeepSeek 配置 ----------------
// Model：模型名（当前平台支持 deepseek-v4-pro / deepseek-v4-flash / deepseek-v4-flash-vision-exp）
// ApiKey：API 密钥（sk- 开头）
var DS_CONFIG = {
    ApiKey: "",
    Model: "deepseek-v4-flash",
    BaseUrl: "https://api.deepseek.com",
    SystemPrompt: "你是环夜谷巅峰术士学会的深寻协议终端。用简洁、友好的中文回答玩家的问题。可以适当融入术士、粒子、术式等世界观元素，但不要编造游戏内具体数值或配方。",
    MaxHistory: 20,
    CooldownMs: 3000,
    ConnectTimeout: 15000,
    ReadTimeout: 90000
};

var histories = new HashMap();
var awaitingChat = new HashSet();
var lastRequestAt = new HashMap();
var pendingRequest = new HashSet();

function getHistory(uuid) {
    var list = histories.get(uuid);
    if (!list) {
        list = new java.util.ArrayList();
        histories.put(uuid, list);
    }
    return list;
}

function clearHistory(uuid) {
    histories.remove(uuid);
}

function checkCooldown(uuid) {
    var now = Date.now();
    var last = lastRequestAt.get(uuid);
    if (last != null && now - last < DS_CONFIG.CooldownMs) {
        return false;
    }
    lastRequestAt.put(uuid, now);
    return true;
}

function sendChunks(player, prefix, text) {
    if (!text) return;
    var lines = String(text).split("\n");
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        while (line.length > 0) {
            var chunk = line.length > 200 ? line.substring(0, 200) : line;
            player.sendMessage(prefix + chunk);
            line = line.length > 200 ? line.substring(200) : "";
        }
    }
}

function buildMessages(uuid, userText) {
    var history = getHistory(uuid);
    var messages = [{ role: "system", content: DS_CONFIG.SystemPrompt }];

    for (var i = 0; i < history.size(); i++) {
        var item = history.get(i);
        messages.push({ role: item.role, content: item.content });
    }
    messages.push({ role: "user", content: userText });
    return messages;
}

function toUtf8Bytes(str) {
    // GraalJS 下 JS 字符串无 getBytes，用 Java Charset 编码（支持中文）
    var buf = StandardCharsets.UTF_8.encode(String(str));
    var n = buf.remaining();
    var arr = [];
    for (var i = 0; i < n; i++) {
        arr.push(buf.get());
    }
    return Java.to(arr, "byte[]");
}

function getModelId() {
    return DS_CONFIG.Model || "deepseek-v4-flash";
}

function callDeepSeek(messages) {
    var apiKey = DS_CONFIG.ApiKey;
    if (!apiKey || apiKey.indexOf("请替换") >= 0) {
        throw new Error("未配置有效的 DeepSeek ApiKey，请编辑 scripts/机器/深寻协议终端.js");
    }

    var base = DS_CONFIG.BaseUrl || "https://api.deepseek.com";
    var url = new URL(base + "/chat/completions");
    var conn = url.openConnection();
    conn.setDoOutput(true);
    conn.setRequestMethod("POST");
    conn.setConnectTimeout(DS_CONFIG.ConnectTimeout || 15000);
    conn.setReadTimeout(DS_CONFIG.ReadTimeout || 90000);
    conn.setRequestProperty("Content-Type", "application/json");
    conn.setRequestProperty("Authorization", "Bearer " + apiKey);

    var body = JSON.stringify({
        model: getModelId(),
        messages: messages,
        stream: false
    });

    var out = conn.getOutputStream();
    out.write(toUtf8Bytes(body));
    out.flush();
    out.close();

    var code = conn.getResponseCode();
    var stream = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
    var reader = new java.util.Scanner(stream, "UTF-8").useDelimiter("\\A");
    var resp = reader.hasNext() ? reader.next() : "";
    reader.close();

    if (code >= 400) {
        throw new Error("HTTP " + code + ": " + resp);
    }

    var json = JSON.parse(resp);
    if (!json.choices || !json.choices[0] || !json.choices[0].message) {
        throw new Error("响应格式异常: " + resp);
    }
    return json.choices[0].message.content;
}

function appendHistory(uuid, userText, answer) {
    var history = getHistory(uuid);
    history.add({ role: "user", content: userText });
    history.add({ role: "assistant", content: answer });

    var maxPairs = DS_CONFIG.MaxHistory || 20;
    while (history.size() > maxPairs * 2) {
        history.remove(0);
    }
}

function askAI(player, userText, onDone) {
    var uuid = player.getUniqueId().toString();

    if (!checkCooldown(uuid)) {
        player.sendMessage(GLTC_PREFIX + "§c请求过于频繁，请稍后再试。");
        if (onDone) onDone();
        return;
    }

    if (pendingRequest.contains(uuid)) {
        player.sendMessage(GLTC_PREFIX + "§c上一条消息仍在处理中。");
        if (onDone) onDone();
        return;
    }

    pendingRequest.add(uuid);
    player.sendMessage(GLTC_PREFIX + "§7[深寻] §8思考中...");

    var messages = buildMessages(uuid, userText);

    Bukkit.getScheduler().runTaskAsynchronously(PLUGIN, new (Java.extend(Java.type("java.lang.Runnable"), {
        run: function() {
            var answer = null;
            var err = null;
            try {
                answer = callDeepSeek(messages);
            } catch (e) {
                err = String(e);
                Bukkit.getLogger().warning("[深寻协议终端] " + err);
            }

            Bukkit.getScheduler().runTask(PLUGIN, new (Java.extend(Java.type("java.lang.Runnable"), {
                run: function() {
                    pendingRequest.remove(uuid);
                    if (!player.isOnline()) {
                        if (onDone) onDone();
                        return;
                    }
                    if (!answer) {
                        player.sendMessage(GLTC_PREFIX + "§c[深寻] 请求失败，请检查密钥与网络。");
                        if (err) player.sendMessage(GLTC_PREFIX + "§7" + err);
                    } else {
                        appendHistory(uuid, userText, answer);
                        sendChunks(player, GLTC_PREFIX + "§b[深寻] §f", answer);
                    }
                    if (onDone) onDone();
                }
            }))());
        }
    }))());
}

function promptInput(player) {
    if (!player.isOnline()) {
        awaitingChat.remove(player);
        return;
    }

    if (typeof getChatInput !== "function") {
        awaitingChat.remove(player);
        player.sendMessage(GLTC_PREFIX + "§c当前环境不支持聊天输入，请更新 RykenSlimefunCustomizer。");
        return;
    }

    getChatInput(player, new (Java.extend(Consumer, {
        accept: function(input) {
            if (!player.isOnline()) {
                awaitingChat.remove(player);
                return;
            }

            var text = String(input == null ? "" : input).trim();
            var lower = text.toLowerCase();

            if (lower === "cancel" || lower === "exit" || lower === "退出" || lower === "结束") {
                awaitingChat.remove(player);
                player.sendMessage(GLTC_PREFIX + "§7已退出深寻协议终端。");
                return;
            }

            if (lower === "clear" || lower === "清空" || lower === "重置") {
                clearHistory(player.getUniqueId().toString());
                player.sendMessage(GLTC_PREFIX + "§a对话记忆已清空。");
                promptInput(player);
                return;
            }

            if (!text) {
                player.sendMessage(GLTC_PREFIX + "§7请输入内容，或输入 exit 退出。");
                promptInput(player);
                return;
            }

            askAI(player, text, function() {
                if (awaitingChat.contains(player)) {
                    promptInput(player);
                }
            });
        }
    })));
}

function startChatSession(player) {
    if (awaitingChat.contains(player)) {
        player.sendMessage(GLTC_PREFIX + "§e你已在对话中，继续输入即可；输入 exit 退出。");
        return;
    }

    awaitingChat.add(player);
    player.sendMessage(GLTC_PREFIX + "§a深寻协议已连接。");
    player.sendMessage(GLTC_PREFIX + "§7在聊天栏输入内容与终端对话；§eexit§7 退出，§eclear§7 清空记忆。");
    promptInput(player);
}

function onUse(event) {
    var player;
    try { player = event.getPlayer(); } catch (e) { return; }
    if (!player || !(player instanceof Player)) return;

    try {
        var loc = player.getLocation();
        try { loc.getWorld().playSound(loc, "block.beacon.activate", 0.6, 1.4); } catch (eS) {}
    } catch (e0) {}

    startChatSession(player);
}

function tick(info) {
}
