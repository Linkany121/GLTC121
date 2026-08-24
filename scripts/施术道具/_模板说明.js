/**
 * 施术道具脚本模板 —— 复制为「施术道具/某某.js」，再在 施术道具/登记.js 登记
 *
 * 完整 AI 生成规范见：scripts/_AI术式与施术道具生成指南.js
 *
 * ── 必做 ──
 *  1. items.yml：script: 施术道具/文件名（无 .js）
 *  2. 登记.js STAFF_REGISTRY：spellSlots(2~6)、name
 *  3. 本上下文 eval 施术核心（loadCastApi），勿跨上下文调 gltcCastApi
 *  4. registerStaffHooks(STAFF_ID, { onAfterCast?, onSneakUse? })
 *  5. onUse 仅作 Interact 兜底；监听已挂则直接 return
 *
 * ── 参考 ──
 *  木质法杖.js（简单 onAfterCast）
 *  辉墨摇篮.js（onSneakUse 护身 + 复杂监听）
 *
 * ── 勿做 ──
 *  在道具脚本重写施术 GUI / 左键分发（已在施术核心）
 *  在 onUse 里 forceReload 施术核心
 */

/*
var STAFF_ID = "VASA_示例道具";
// … 复制 木质法杖.js 的 loadCastApi / ensureCoreListeners / registerHooks …

function registerHooks() {
    CAST_API.registerStaffHooks(STAFF_ID, {
        onAfterCast: function(p) { /* 施术成功特效 *\/ }
    });
}

function onUse(event) {
    // Interact 兜底；shouldSkipStaffOnUseLocal → return
    CAST_API.handleStaffUse(event.getPlayer(), { onAfterCast: ... });
}
*/
