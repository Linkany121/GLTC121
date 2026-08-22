/**
 * 术式脚本模板 —— 复制为「术式/流派_环数_名称.js」，再在 术式/登记.js 的 SPELL_FILES 追加
 *
 * 完整 AI 生成规范（架构铁律、会话 API、检查清单、常见错误）：
 *   scripts/_AI术式与施术道具生成指南.js
 *
 * 命名：环夜谷_1_火球术.js 、 沃土_4_花如画卷.js
 * items.yml：book:true 时做同 ID 附魔书；groups 挂流派组
 *
 * ── 导出必填 ──
 *   id, name, ring, cost, cooldownMs, cast
 *   book?, school?
 *
 * ── 伤害 ──
 *   mageApi.calcSpellDamage(player, 系数)
 *   UTIL.dealPhysicalSpellDamage / dealParticleSpellDamage / dealPulseSpellDamage
 *
 * ── 有状态术式（环绕/持续/左键二段）──
 *   api.begin → onClear 清实体与任务
 *   api.registerActiveLeftClick(player, SPELL_ID, Java Runnable)  ← 勿用跨上下文 JS 函数
 *   api.consumeSpellSignal(player, SPELL_ID, "lclick")  ← 环绕 tick 兜底
 *   api.registerDirectClearHook(SPELL_ID, fn)  ← PLUGIN 痕迹兜底
 *   api.end(player, token, false)
 *
 * ── 参考 ──
 *   瞬时：沃土_1_送花.js | 多段：沃土_2_微风花流.js
 *   持续：沃土_3_庇护脉络.js | 二段：沃土_4_花如画卷.js | 物理：环夜谷_1_火球术.js
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
        // UTIL.dealParticleSpellDamage(target, dmg, player, { ring: 1, name: "示例术式" });
        return true;
    }
});
*/
