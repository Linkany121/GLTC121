/**
 * 术式脚本模板 —— 复制为「术式/你的术式.js」，再在 术式/登记.js 的 SPELL_FILES 中追加路径
 * items.yml 做同 ID 附魔书（book:true 时）；流派用 groups 如 MA_4（环夜谷标准流派）
 *
 * 施术前提：手持已登记施术道具；经「术式承载转换仪」写入法杖
 * 最终伤害 = mageApi.calcSpellDamage(player, 系数)
 * 粒子由施术核心在 cast 前扣除，并自动播报：消耗 x粒子 使用 x环术式 xxx
 * 物理伤害请用 UTIL.dealPhysicalSpellDamage（会播报实际最终伤害）
 *
 * 等级 vs 环数（施术核心统一处理）：
 *   等级 > 环数 → 粒子消耗 ×0.5（取整，最低 1）
 *   等级 < 环数 → 侵蚀 = 环数 - 等级；粒子 × 侵蚀；自伤侵蚀 ×20% 最大生命
 */

/*
({
    id: "VASA_示例术式",
    name: "示例术式",
    ring: 1,
    cost: 2,
    cooldownMs: 2000,
    book: true,
    cast: function(player, mageApi) {
        var dmg = mageApi.calcSpellDamage(player, 1.0);
        // UTIL.dealPhysicalSpellDamage(target, dmg, player, { ring: 1, name: "示例术式" });
        return true;
    }
});
*/
