/**
 * 术式脚本模板 —— 复制为「术式/你的术式.js」，再在 术式/登记.js 的 SPELL_FILES 中追加路径
 * items.yml 做同 ID 附魔书（book:true 时）
 *
 * 施术前提：手持已登记施术道具；经「术式承载转换仪」写入法杖
 * 最终伤害 = mageApi.calcSpellDamage(player, 系数)
 * 粒子由施术核心在 cast 前扣除
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
        // ... 命中与特效 ...
        return true;
    }
});
*/
