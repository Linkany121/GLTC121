/**
 * =============================================================================
 *  GLTC 联合协议 · 术式 & 施术道具 · AI 生成指南
 * =============================================================================
 *
 *  用途：供 AI / 维护者新建或改写术式、施术道具时阅读。
 *  本文件不参与加载；登记见 术式/登记.js、施术道具/登记.js。
 *
 * -----------------------------------------------------------------------------
 *  一、架构铁律（必须遵守）
 * -----------------------------------------------------------------------------
 *
 *  1. 施术核心（施术道具/施术核心.js）只做通用逻辑：
 *     施术 GUI、冷却、侵蚀、左键分发、切术清会话。
 *     ❌ 禁止在施术核心里写任何具体术式 ID、术式机制、术式专用 Map 名。
 *
 *  2. 每个术式 = 独立 JS：scripts/术式/流派_环数_名称.js
 *     登记：scripts/术式/登记.js → SPELL_FILES 追加路径。
 *
 *  3. 每个施术道具 = 独立 JS：scripts/施术道具/某某.js
 *     登记：scripts/施术道具/登记.js → STAFF_REGISTRY。
 *     items.yml 绑定 script: 施术道具/某某（无 .js）。
 *
 *  4. Graal 跨 eval 上下文：
 *     - 不同脚本 eval 出的 JS 函数不能互相调用（会静默失败）。
 *     - 跨脚本共享状态必须用 PLUGIN 上的 java.util.concurrent.ConcurrentHashMap。
 *     - 有状态术式左键必须用 Java Runnable（见 _工具.js registerActiveLeftClick）。
 *     - 勿用普通 JS {} 挂 PLUGIN 当全局表。
 *
 *  5. 施术道具脚本必须在本上下文 eval 施术核心（见 木质法杖.js），
 *     禁止直接调用 PLUGIN.gltcCastApi 里的函数（仅作标记）。
 *
 * -----------------------------------------------------------------------------
 *  二、玩家操作约定（施术核心已实现，勿重复实现）
 * -----------------------------------------------------------------------------
 *
 *  站立右键     → 施展当前选中术式（冷却 × 心血管强度；侵蚀时 CD × 侵蚀等级）
 *  站立左键     → 术式左键钩子（handleSpellLeftClick）
 *  蹲下右键/左键 → 打开施术 GUI；开 GUI 时清未投射会话，保留已投射
 *  蹲下开 GUI 时，道具 onSneakUse 可触发护身技；GUI 内不施术
 *
 *  切选中术式 / 开施术 GUI / 换手持 / 退服 → 清术式会话（实体+任务）
 *  换快捷栏 / 离手 / 退服 → 额外清层数（stacks）
 *
 * -----------------------------------------------------------------------------
 *  三、新建术式 · 检查清单
 * -----------------------------------------------------------------------------
 *
 *  [ ] 文件名：术式/{流派}_{环数}_{名称}.js  例：沃土_2_微风花流.js
 *  [ ] 头部注释：环数、流派、机制简述、ID
 *  [ ] loadUtil() 加载 术式/_工具.js → var UTIL = loadUtil()
 *  [ ] 可调配置区（SPELL_ID / NAME / RING / COST / COOLDOWN_MS / COEFFICIENT）
 *  [ ] 导出对象（见第四节）
 *  [ ] 术式/登记.js SPELL_FILES 追加
 *  [ ] book:true 时在 items.yml 做同 ID 附魔书 + groups 流派组
 *  [ ] cast 返回 true/false（false 会视为施术失败）
 *
 *  瞬时术式（右键一次完事）：
 *    cast 内 calcSpellDamage → 生成弹体/射线 → dealXxxSpellDamage → return true
 *
 *  有状态术式（环绕、持续、需左键二段）额外：
 *    [ ] cast 内 api.begin(player, SPELL_ID, onClear, { replace: true })
 *    [ ] onClear 可重复调用：取消 task、删实体、api.clearActiveLeftClick
 *    [ ] 需左键：cast 内 api.registerActiveLeftClick(player, SPELL_ID, Java Runnable)
 *    [ ] 环绕 tick 兜底：api.consumeSpellSignal(player, SPELL_ID, "lclick")
 *    [ ] PLUGIN 痕迹兜底：api.registerDirectClearHook(SPELL_ID, fn(player))
 *    [ ] 自然结束：api.end(player, token, false)
 *    [ ] 共享 Map 用 ConcurrentHashMap；键用 java.lang.String.valueOf(uuid)
 *
 * -----------------------------------------------------------------------------
 *  四、术式导出对象（登记.js 必填字段）
 * -----------------------------------------------------------------------------
 *
 *  ({
 *      id: "VASA_术式ID",           // 与 items.yml / 转换仪一致
 *      name: "显示名",
 *      ring: 1,                     // 环数
 *      cost: 1,                     // 保留字段；当前工作区无粒子消耗机制
 *      cooldownMs: 1000,
 *      book: true,                  // 可选；true = 可刻录附魔书
 *      school: "沃土",               // 可选；缺省从文件名前缀推断
 *      cast: function(player, mageApi) {
 *          var dmg = mageApi.calcSpellDamage(player, COEFFICIENT);
 *          // ...
 *          return true;               // 勿 return false 除非施术应失败
 *      }
 *      // onLeftClick 可选但跨上下文不可靠；有状态术式用 registerActiveLeftClick
 *  });
 *
 * -----------------------------------------------------------------------------
 *  五、术式数值与播报（施术核心自动处理，术式内勿重复）
 * -----------------------------------------------------------------------------
 *
 *  最终伤害 = mageApi.calcSpellDamage(player, 系数)
 *  成功播报「成功施展 {术式名}」；伤害走 _工具.js 统一播报
 *
 *  等级 vs 环数（核心 resolveCastCost）：
 *    环数 ＞ 等级 → 侵蚀 = 环数-等级；冷却 × 侵蚀等级；自伤 = 侵蚀×20% 最大生命（脉冲）
 *
 *  伤害 API（UTIL / _工具.js）：
 *    dealPhysicalSpellDamage(ent, amt, caster, { ring, name })  → 物理，吃护甲
 *    dealParticleSpellDamage(ent, amt, caster, { ring, name })    → 粒子，吃折射
 *    dealPulseSpellDamage(ent, amt, caster, { ring, name }, mageApi) → 脉冲，无视减伤
 *
 *  展示体弹体：UTIL.spawnFlyingItemDisplay / moveFlyingDisplay / removeFlyingDisplay
 *
 * -----------------------------------------------------------------------------
 *  六、有状态术式 · 会话 API（PLUGIN.gltcSpellSessionApi / UTIL.spellSession）
 * -----------------------------------------------------------------------------
 *
 *  var api = PLUGIN.gltcSpellSessionApi;  // cast 前 loadUtil 后亦可 UTIL.spellSession
 *
 *  // 开始（重施 replace:true 会先清同 ID 旧会话）
 *  var token = api.begin(player, SPELL_ID, function(p, reason) {
 *      // reason: switch | cast | replace | hotbar | hold | ring | quit | end | manual
 *      clearMyFx(p);
 *  }, { replace: true });
 *
 *  // 结束（invokeClear 默认 false，假定已自行清理）
 *  api.end(player, token, false);
 *
 *  // 左键（有状态术式 · 推荐）
 *  api.registerActiveLeftClick(player, SPELL_ID, new (Java.extend(java.lang.Runnable, {
 *      run: function() { ... }   // 在本术式上下文执行
 *  }));
 *  api.clearActiveLeftClick(player);   // onClear / 结束时
 *
 *  // 环绕 tick 左键兜底（metadata 脉冲，跨上下文可靠）
 *  api.consumeSpellSignal(player, SPELL_ID, "lclick");
 *
 *  // PLUGIN 直接清理兜底（切术时会 runDirectClearHooks）
 *  api.registerDirectClearHook(SPELL_ID, function(player) { clearMyFx(player); });
 *
 *  // 层数（与会话分离；切术保留，换栏/退服清）
 *  api.stacks.add(player, SPELL_ID, target, delta, { max: N });
 *  api.stacks.get / set / clear
 *
 *  左键分发链：施术核心 trySpellLeftClick → api.handleLeftClick
 *              → dispatchActiveLeftClick → 已注册的 Runnable
 *
 * -----------------------------------------------------------------------------
 *  七、新建施术道具 · 检查清单
 * -----------------------------------------------------------------------------
 *
 *  [ ] items.yml：粘液 ID、script: 施术道具/文件名（无 .js）
 *  [ ] 施术道具/登记.js：STAFF_REGISTRY 登记 spellSlots（2~6）、name
 *  [ ] 脚本结构参照 木质法杖.js / 辉墨摇篮.js：
 *        loadCastApi(true)  → 本上下文 eval 施术核心
 *        ensureCoreListeners() → 监听版本过旧时 force 重挂
 *        CAST_API.registerStaffHooks(STAFF_ID, { onAfterCast, onSneakUse? })
 *  [ ] onUse：仅 Interact 丢失时兜底；若 PLUGIN.gltcSpellCoreListener 已存在则 return
 *  [ ] 勿在 onUse 里 forceReload 施术核心（会清环状态）
 *  [ ] 道具专属特效写在 onAfterCast / onSneakUse，勿改核心施术流程
 *
 *  registerStaffHooks 常用钩子：
 *    onAfterCast(player)     施术成功后
 *    onSneakUse(player)      蹲下开施术 GUI 时（读 metadata token 防双触发）
 *    skillHint: "§7..."      施术 GUI 技能槽说明（可选）
 *
 * -----------------------------------------------------------------------------
 *  八、配色与文案（与便利/A.yml 对齐）
 * -----------------------------------------------------------------------------
 *
 *  常规提示  &#fff5b3  →  §x§f§f§f§5§b§3
 *  术式名称  &#62c6ff  →  §x§6§2§c§6§f§f
 *  伤害数值            →  §c
 *  伤害类型播报用 _工具.js damageTypeLabel（物理/粒子/脉冲四字渐变）
 *  ActionBar / 台词渐变可术式自定义
 *
 * -----------------------------------------------------------------------------
 *  九、参考实现（写新术式前先读同类）
 * -----------------------------------------------------------------------------
 *
 *  瞬时粒子弹：  术式/沃土_1_送花.js
 *  多段/延迟弹：  术式/沃土_2_微风花流.js
 *  持续光环：    术式/沃土_3_庇护脉络.js
 *  右键+左键二段：术式/沃土_4_花如画卷.js
 *  物理爆炸：    术式/环夜谷_1_火球术.js
 *  施术道具：    施术道具/木质法杖.js、施术道具/辉墨摇篮.js
 *  工具 API：    术式/_工具.js
 *
 * -----------------------------------------------------------------------------
 *  十、AI 生成时常见错误（避免）
 * -----------------------------------------------------------------------------
 *
 *  ❌ 在施术核心加 if (spellId === "VASA_xxx")
 *  ❌ 用 spell.onLeftClick 跨上下文函数处理有状态左键
 *  ❌ 用 PLUGIN.myMap = {} 存会话（各脚本看见不同对象）
 *  ❌ 忘记 onClear，切术后实体/任务泄漏
 *  ❌ cast 不 return true 导致误报「施术失败」
 *  ❌ 重复扣资源（核心已处理冷却与侵蚀）
 *  ❌ 直接 ent.damage 而不走 dealXxxSpellDamage（无统一播报）
 *  ❌ 施术道具脚本不 eval 施术核心，直接调 PLUGIN.gltcCastApi
 *  ❌ 新建术式不加入 术式/登记.js SPELL_FILES
 *
 * -----------------------------------------------------------------------------
 *  十一、最小术式骨架（复制后改）
 * -----------------------------------------------------------------------------
 *
 *  // 见 术式/_模板说明.js 内注释块；完整版以本节 + 参考实现为准。
 *
 * =============================================================================
 */
