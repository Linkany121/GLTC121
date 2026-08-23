/**
 * =============================================================================
 *  GLTC 联合协议 · 异能武器 · 编写框架（本文件不参与加载）
 * =============================================================================
 *
 *  原则：
 *  1. 每个异能武器 = 独立 JS，由 items.yml 的 script 绑定。
 *  2. 不使用 武器/_工具.js、不在 监听.js 注册全局路由。
 *  3. 左键 / 近战依赖 PlayerInteractEvent、EntityDamageByEntityEvent；
 *     须在脚本内 registerEvent 热重载安全注册。
 *  4. ⚠ 监听.js 预加载武器脚本时必须用 IIFE 隔离（gltcEvalScriptEx isolated），
 *     禁止在同一全局 eval 中加载多把武器（会污染 ITEM_ID）。
 *  5. isHolding 请用硬编码 ID 字面量或独立 isXxxItemId()，勿依赖可覆盖的全局 var。
 *
 *  玩家约定：
 *  - 主手持有本武器时：左键 / 右键（含近战左键）触发对应技能。
 *  - 切换快捷栏离开本武器、退服：调用 clearWeaponState(player) 清空所有持续效果。
 *
 *  骨架（复制后改 ITEM_ID 与业务函数）：
 *
 *  var POJUN_ITEM_ID = "FKR_示例";  // 每文件唯一命名，勿用 ITEM_ID
 *  var Listener = Java.type("org.bukkit.event.Listener");
 *  var EventPriority = Java.type("org.bukkit.event.EventPriority");
 *  var PlayerInteractEvent = Java.type("org.bukkit.event.player.PlayerInteractEvent");
 *  var PlayerItemHeldEvent = Java.type("org.bukkit.event.player.PlayerItemHeldEvent");
 *  var PlayerQuitEvent = Java.type("org.bukkit.event.player.PlayerQuitEvent");
 *  var EntityDamageByEntityEvent = Java.type("org.bukkit.event.entity.EntityDamageByEntityEvent");
 *  var RunnableImpl = Java.extend(Java.type("java.lang.Runnable"));
 *  // ... SIT 伤害等内联工具函数（勿依赖 _工具.js）...
 *
 *  function isHolding(player) { ... SlimefunItem.getByItem ... getId() === ITEM_ID }
 *  function wasHolding(stack) { ... }
 *  function onLeftClick(player) { }
 *  function onRightClick(player) { }
 *  function clearWeaponState(player) { }  // 取消任务、删实体、清 Map、关 BossBar
 *
 *  function onUse(event) { onRightClick(event.getPlayer()); }  // RSC 右键兜底
 *
 *  var weaponListener = new (Java.extend(Listener, {}))();
 *  var initWeaponListener = new RunnableImpl({
 *      run: function() {
 *          // 热重载：先 unregister 旧 listener
 *          if (plugin.gltcExampleRegistered && plugin.gltcExampleListener) {
 *              try { PlayerInteractEvent.getHandlerList().unregister(plugin.gltcExampleListener); } catch (e) {}
 *              try { EntityDamageByEntityEvent.getHandlerList().unregister(plugin.gltcExampleListener); } catch (e1) {}
 *              try { PlayerItemHeldEvent.getHandlerList().unregister(plugin.gltcExampleListener); } catch (e2) {}
 *              try { PlayerQuitEvent.getHandlerList().unregister(plugin.gltcExampleListener); } catch (e3) {}
 *          }
 *          plugin.gltcExampleListener = weaponListener;
 *          plugin.gltcExampleRegistered = true;
 *          // 主手判断用 hand.name() === "HAND"，勿用 hand !== EquipmentSlot.HAND（Graal 下不可靠）
 *          Bukkit.getPluginManager().registerEvent(PlayerInteractEvent, weaponListener, EventPriority.NORMAL,
 *              function(l, evt) {
 *                  var hand = evt.getHand();
 *                  if (hand == null || hand.name() !== "HAND") return;
 *                  if (!isHolding(evt.getPlayer())) return;
 *                  var action = evt.getAction().name();
 *                  if (action === "LEFT_CLICK_AIR" || action === "LEFT_CLICK_BLOCK") onLeftClick(evt.getPlayer());
 *              }, plugin);
 *          Bukkit.getPluginManager().registerEvent(EntityDamageByEntityEvent, weaponListener, EventPriority.NORMAL,
 *              function(l, evt) {
 *                  if (evt.isCancelled()) return;
 *                  var damager = evt.getDamager();
 *                  if (!(damager instanceof Player)) return;
 *                  if (!isHolding(damager)) return;
 *                  onLeftClick(damager);
 *              }, plugin);
 *          Bukkit.getPluginManager().registerEvent(PlayerItemHeldEvent, weaponListener, EventPriority.MONITOR,
 *              function(l, evt) {
 *                  var prev = evt.getPlayer().getInventory().getItem(evt.getPreviousSlot());
 *                  if (wasHolding(prev)) clearWeaponState(evt.getPlayer());
 *              }, plugin);
 *          Bukkit.getPluginManager().registerEvent(PlayerQuitEvent, weaponListener, EventPriority.MONITOR,
 *              function(l, evt) { clearWeaponState(evt.getPlayer()); }, plugin);
 *      }
 *  });
 *  Bukkit.getScheduler().runTask(plugin, initWeaponListener);  // registerEvent 须在主线程
 *
 *  参考实现：武器/伏地.js、武器/风墟龙冕.js、武器/ASPL.js（右键 onUse + 切槽清理）
 */
