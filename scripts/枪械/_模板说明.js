/**
 * =============================================================================
 *  GLTC 联合协议 · 枪械 · 编写框架（本文件不参与加载）
 * =============================================================================
 *
 *  原则：
 *  1. 每个枪械 = 独立 JS，由 items.yml 的 script 绑定。
 *  2. 不使用 枪械/_工具.js、不在 监听.js 预加载、不注册全局退服监听。
 *  3. SIT 伤害 / 射线等纯函数内联在本脚本；状态清理用 onLoad()。
 *
 *  玩家约定：
 *  - 主手持有本枪时：右键射击（onUse 或 onLoad PlayerInteractEvent 均可）。
 *  - 切换快捷栏离开本枪、退服：clearGunState(player) 取消连射任务、清 CD Map。
 *
 *  骨架：
 *
 *  var GUN_ID = "FKR_通古斯制式步枪";
 *  // 内联 getAbilityPower / dealSitDamage / rayTraceLiving / scheduleReloadSound ...
 *  var cdMap = new java.util.HashMap();
 *
 *  function clearGunState(player) {
 *      var uuid = player.getUniqueId().toString();
 *      cdMap.remove(uuid);
 *      // 取消 taskMap 中的 BukkitRunnable ...
 *  }
 *
 *  function onUse(event) { ... 射击逻辑 ... }
 *
 *  function onLoad() {
 *      return {
 *          PlayerItemHeldEvent: function(evt) {
 *              var prev = evt.getPlayer().getInventory().getItem(evt.getPreviousSlot());
 *              if (wasHoldingGun(prev, GUN_ID)) clearGunState(evt.getPlayer());
 *          },
 *          PlayerQuitEvent: function(evt) {
 *              clearGunState(evt.getPlayer());
 *          }
 *      };
 *  }
 *  onLoad();
 *
 *  参考实现：枪械/通古斯制式步枪.js
 *  集成枪：枪械/枪械集成枪.js（蹲下 GUI 选枪 + 委托射击）
 */
