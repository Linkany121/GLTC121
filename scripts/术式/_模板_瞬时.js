/**
 * =============================================================================
 *  术式样板 · 瞬时弹体（不参与加载，文件名以 _ 开头）
 *  复制本文件 → 去掉文件名开头的 _ → 改顶部「=== 可配置 ===」即可做新术式
 * =============================================================================
 *
 *  要点：
 *  1. runtime.begin + onClear → 切术/GUI/下线时自动 cancel task / 移除 display
 *  2. 自然结束时 runtime.end(player, token, false)，避免 onClear 重复执行
 *  3. persistence 用 SESSION_UNPROJECTED（开 GUI / 切术清除）
 *  4. 全部可调数字写在顶部，业务里不要散落魔法数（对齐异能武器风格）
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
var META_SHARED = "gltc_shared_root_maps";
var META_RUNTIME = "gltc_spell_runtime";

// === 术式身份 / 登记导出 ===
var SPELL_ID          = "VASA_示例术式"; // 与 items.yml 术式载体 ID 一致
var SPELL_NAME        = "示例术式";       // 纯文本短名（播报回退）
var SPELL_RING        = 1;                // 环数
var SPELL_SCHOOL      = "环夜谷";         // 流派键
var SPELL_BOOK        = true;             // 是否有同 ID 术式载体

// === 冷却 / 示例延时 ===
var SPELL_COOLDOWN_MS = 1000;             // 施展冷却（毫秒）
var DEMO_DELAY_TICKS  = 20;               // 示例：多少 tick 后自然结束（1 秒）

// === 伤害（示例，按需启用）===
// var SPELL_COEFFICIENT = 1.0;           // mageApi.calcSpellDamage 系数

/** 优先 mageApi 注入的 runtime（施术核心 prepareCastApi） */
function rt(mageApi) {
    try {
        if (mageApi != null) {
            if (typeof mageApi.getSpellRuntime === "function") {
                var fromFn = mageApi.getSpellRuntime();
                if (fromFn != null) return fromFn;
            }
            if (mageApi.spellRuntime != null) return mageApi.spellRuntime;
            if (mageApi.runtime != null) return mageApi.runtime;
        }
    } catch (eApi) {}
    try {
        var p = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");
        if (p != null && p.hasMetadata(META_RUNTIME)) {
            var direct = p.getMetadata(META_RUNTIME).get(0).value();
            if (direct != null) return direct;
        }
        if (p != null && p.hasMetadata(META_SHARED)) {
            var shared = p.getMetadata(META_SHARED).get(0).value().get("gltcSpellRuntime");
            if (shared != null) return shared;
        }
        if (p != null && p.gltcSpellRuntime != null) return p.gltcSpellRuntime;
    } catch (e0) {}
    try {
        if (PLUGIN != null && PLUGIN.gltcSpellRuntime != null) return PLUGIN.gltcSpellRuntime;
    } catch (e1) {}
    return null;
}

function castExample(player, mageApi) {
    var runtime = rt(mageApi);
    if (!runtime) return false;

    var task = null;
    var alive = true;
    var token = null;

    function cleanup() {
        if (!alive) return;
        alive = false;
        try { if (task != null) task.cancel(); } catch (e0) {}
        task = null;
    }

    token = runtime.begin(player, SPELL_ID, new (Java.extend(java.lang.Runnable, {
        run: cleanup
    })), {
        persistence: runtime.SESSION_UNPROJECTED,
        replace: true
    });
    if (!token) return false;

    task = Bukkit.getScheduler().runTaskLater(PLUGIN, new (Java.extend(java.lang.Runnable, {
        run: function() {
            cleanup();
            try { runtime.end(player, token, false); } catch (eEnd) {}
        }
    })), DEMO_DELAY_TICKS);

    return true;
}

({
    id: SPELL_ID,
    name: SPELL_NAME,
    ring: SPELL_RING,
    cooldownMs: SPELL_COOLDOWN_MS,
    book: SPELL_BOOK,
    school: SPELL_SCHOOL,
    cast: castExample
});
