/**
 * =============================================================================
 *  核心技能样板（不参与加载，文件名以 _ 开头）
 *  复制 → 改名为 核心技能_<简称>.js → 改顶部可配置与导出 id
 *  由 技能登记.js 自动扫描；技能核心登记.js 的 skillId 须等于本文件 id
 * =============================================================================
 *
 *  导出约定：
 *  ({
 *      id: "skill_id",           // 与技能核心登记 skillId 一致
 *      name: "显示名",
 *      skillHint: "§7GUI 提示",
 *      onSelectSpell: fn,        // 选择术式时（可选）fn(player, castApi)
 *      onSneakUse: fn,           // 蹲下开 GUI 时（可选）fn(player, castApi)
 *      onAfterCast: fn           // 施术后（可选）fn(player, castApi)
 *  });
 *
 *  castApi 与术式 cast 同源（施术核心 prepareCastApi）：
 *  - castApi.getSpellRuntime() / .spellRuntime  → 术式运行时（dealPulseSpellDamage 等）
 *  - castApi.calcSpellDamage(player, coeff)
 *  伤害务必走 runtime.deal*SpellDamage，勿单独调 mage.dealPulseDamage（无命中播报）
 */
var Bukkit = Java.type("org.bukkit.Bukkit");
var Player = Java.type("org.bukkit.entity.Player");
var PLUGIN = Bukkit.getPluginManager().getPlugin("RykenSlimefunCustomizer");

// === 身份 ===
var SKILL_ID   = "example_skill";
var SKILL_NAME = "示例核心技能";
var SKILL_HINT = "§7示例 · 选择术式时触发";

// === 冷却等（按需）===
var SKILL_CD_MS = 30000;

function onSelect(player, castApi) {
    if (!player || !(player instanceof Player)) return;
    try { player.sendActionBar("§d" + SKILL_NAME); } catch (e) {}
    // 示例：var rt = castApi && castApi.getSpellRuntime ? castApi.getSpellRuntime() : null;
}

({
    id: SKILL_ID,
    name: SKILL_NAME,
    skillHint: SKILL_HINT,
    onSelectSpell: onSelect
});
