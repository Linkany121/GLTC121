# GLTC 联合协议 · RSC 脚本 → 独立插件 · Java 移植规范

> **读者**：后续执行行为逻辑移植的 AI 或开发者。  
> **前置**：`GLTCrsc转换jar规范.md` Phase 0–7 已完成（静态物品/机器/空壳已就绪）。  
> **目标**：将 `scripts/**/*.js` 的全部运行时行为 **重写为 Java**，由 `GltcPlugin.jar` 直接执行；**最终产物不含 GraalJS / 不加载 `.js`**。  
> **原则**：按模块移植、行为对齐 RSC、ID 不变；禁止「只嵌入 JS 引擎就算完成」。

---

## 0. 执行前必读

### 0.1 路径约定（固定）

```
SOURCE_ROOT     = ../                         # rsc版GLTC_联合协议 仓库根
SOURCE_SCRIPTS  = SOURCE_ROOT/scripts/        # 行为规格来源（只读对照，不打进最终 jar）
TARGET_ROOT     = ./                          # gltc-plugin/
JAVA_LOGIC      = TARGET_ROOT/src/main/java/com/linkany121/gltc/logic/
MANIFEST        = TARGET_ROOT/src/main/resources/SCRIPT_MANIFEST.json  # 移植进度清单
PLUGIN_NAME     = "GLTC"
```

`SOURCE_SCRIPTS` 仅作 **对照与验收基准**；新功能直接写 Java，不再往 JS 加逻辑（RSC 附属若仍双开，另议，不在本规范）。

### 0.2 与既有阶段的关系

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 0–7 | YAML → Java 静态注册；带 `script:` 条目为空壳 | **已完成** |
| GraalJS 探索 | 引擎 / `resources/scripts` / sync 工具 | **已从工程移除** |
| Phase J0–J10 | **本规范**：JS 行为 → Java | **执行范围** |

终局要求（引擎拆除已提前完成，移植过程中保持）：

1. `pom.xml` **无** GraalJS 依赖  
2. **无** `src/main/resources/scripts/`  
3. **无** `GltcScriptEngine` / Handle / Bridge 等引擎类  
4. `GltcScriptedItem` / `GltcScriptedMachine` 仅为空壳，后续挂 **Java Handler**（`logic.*`）  

### 0.3 硬性规则

1. **运行时禁止** `RykenSlimefunCustomizer`、`org.lins.mmmjjkx.rykenslimefuncustomizer.*`、任意 `.js` 执行。  
2. **Slimefun ID 不变**（与 Phase 0–7 一致）。  
3. **行为对齐**：同输入下伤害、冷却、GUI、文件读写结果与 RSC 服对照一致（允许实现细节不同）。  
4. **配置**统一 `plugins/GLTC/config.yml`（`ParticleConcentration` / `StarbyssAdjustment` / `DamageNotifyMode` 等）。  
5. **玩家/经济数据**统一写在 `plugins/GLTC/data/`（或规范内固定的子目录），禁止再写 RSC `addon_configs` / addons 路径。  
6. 每完成一个 Phase（或模块批次），必须通过验收再进入下一批。  
7. **不做**：材质包；`RSC版GLTC_旧术式体系`（另开规范）；在未移植模块上继续堆 JS 新功能。

### 0.4 技术栈约定

- Java 21 + 现有 Maven 工程  
- Paper API + Slimefun4（`provided`）  
- GUI：ChestMenu / 现有 `GltcMenuHelper` 风格  
- 持久化：JSON（Gson 若 Paper 已提供则用；否则手写 / SnakeYAML）或 PDC；目录见 §0.3  
- 文本：`TextUtil` / MiniMessage，与现有物品 lore 一致  

### 0.5 对「曾接入 Graal」代码的处理

| 现状 | 本规范要求 |
|------|------------|
| `GltcScriptEngine` 等 | 迁移期间可保留作对照；**模块一旦有 Java 实现，禁止再走 JS 路径** |
| `resources/scripts/` | 仅作对照副本；最终删除 |
| `tools/sync-scripts.py` | 停止作为交付路径；可删或改名为 archive |
| 新 PR | 只许加 Java logic，不许加新业务 JS |

双轨期切换规则（每个物品/机器）：

```
若存在 Java Handler 注册 → 只用 Java
否则 → 空壳降级（提示/日志），不再 fallback 到 JS（避免两套行为）
```

（若短期必须 fallback，须在模块验收单中显式写明「临时 fallback」，并设清除期限。）

---

## 1. 资产与优先级

### 1.1 清单来源

以 `SCRIPT_MANIFEST.json` + 全库 YAML `script:` 为准，维护移植状态字段（可扩 JSON 或另表 `LOGIC_PORT_STATUS.md`）：

```text
slimefunId | script路径 | Java类 | 状态( pending|wip|done|wip_missing )
```

**YAML 有 script、manifest 曾漏收的：**

| slimefunId（约） | 原 script |
|------------------|-----------|
| `FKR_锻造锤` | `机器/锻造锤` |
| `skey_深红远星级` | `多方块特效/深红远星` |

**脚本文件缺失（先标 WIP，有规格再写 Java）：**

| 原 script | slimefunId |
|-----------|------------|
| `施术道具/通用施术` | `VASA_通用施术道具` |
| `机器/术式承载转换仪` | `VASA_术式承载转换仪` |

### 1.2 原 JS 角色分类（决定 Java 落点）

| 类型 | 原 JS 例 | Java 落点 |
|------|----------|-----------|
| 全局引导 | `监听.js` | `logic.bootstrap.GltcLogicBootstrap` + 若干 `Listener` |
| 共享运行时 | `_gltcSharedRoot.js`、`_gltcScriptLoader.js` | **删除概念**；用普通单例 / Service |
| 可复用 API | `能源流/_信用点.js`、`术士系统/核心.js`、枪械 `_gun*` | `logic.credit` / `logic.mage` / `logic.gun` 包内服务类 |
| 物品交互 | 枪械/武器/食物/道具 | 继承或组合 `GltcScriptedItem` → 改名为 `GltcLogicItem`（可保留旧名）+ Handler |
| 机器交互 | 充值机/舰体/锻造锤 | `GltcLogicMachine` + `onTick`/`菜单` |
| 说明文件 | `*_模板说明.js` | 不移植，可改成 `docs/` |

### 1.3 移植优先级（强制顺序）

后一批可依赖前一批的 Service，**禁止**反过来。

| 批次 | 模块 | 原主要脚本 | 预估体量 | 说明 |
|------|------|------------|----------|------|
| **J0** | 骨架与约定 | — | 小 | 包结构、Handler 接口、状态表、去掉「必须靠 JS」的假设 |
| **J1** | 配置与伤害通知工具 | 枪械/武器内重复片段 | 小 | `StarbyssAdjustment`、`DamageNotifyMode` 公共工具 |
| **J2** | 信用点 | `_信用点.js`、信用卡、充值机 | 中 | 经济底座 |
| **J3** | 全局监听拆分 | `监听.js`、食物战斗效果 | 中 | 无 eval 的 Listener 注册 |
| **J4** | 枪械 | `枪械/*`、`_gunDelegate`、集成枪 | 中大 | 含 SIT 伤害 |
| **J5** | 异能武器 | `武器/*` | 大 | 可按武器文件拆 PR |
| **J6** | 食物 | `食物/*` | 中 | 通用饥饿/药效优先，特殊料理其次 |
| **J7** | 道具与杂项 | `道具工具/*`、能源流商店（若仍挂物品） | 中 | 音效浏览器等 |
| **J8** | 机器 | 舰体三机、枪械外观桌、锻造锤、深红远星 | 中大 | GUI + 文件 |
| **J9** | 术士 | `术士系统/*`、施术道具（WIP） | 大 | 对齐 `便利/工作区.yml` 设计；缺脚本则按工作区写 Java |
| **J10** | 收尾 | — | 小 | 删 Graal、删 scripts、全量回归 |

同批次内：先 **Service**，再 **具体物品/机器 Handler**。

---

## 2. Java 架构约定

### 2.1 包结构（推荐）

```
com.linkany121.gltc.logic/
  bootstrap/     GltcLogicBootstrap（onEnable 末尾调用）
  common/        ConfigKeys、DamageNotify、CooldownPaths、CooldownIo
  credit/        CreditService、CreditCardItem、ChargerMachine
  gun/           GunService、各枪 Item 类或注册表
  weapon/        各异能武器
  food/          FoodEffects、CombatFoodListener、具体食物
  tool/          音效浏览器、钢铁靶等
  machine/       舰体、锻造锤、外观桌、SMB 特效
  mage/          MageService、EquipMenu、Terminal、Staff（WIP）
```

不必一对一「一个 js 一个类」；**共享逻辑必须抽到 Service**，避免复制枪械里那套 SIT 计算。

### 2.2 与空壳的衔接

现有：

- `GltcScriptedItem` / `GltcScriptedMachine`（及 `SCRIPT_MANIFEST`）

演进：

1. **J0**：引入 `GltcItemLogic` / `GltcMachineLogic` 接口（或直接在子类实现 Handler）。  
2. 生成类 / Registry 改为 `new GltcLogic_通古斯制式步枪(...)` 这类 **具体 Java 类**，或 Registry 内 `LogicRegistry.bind(id, logic)`。  
3. 类名不必保留 `Scripted`；可逐步重命名为 `GltcLogicItem`，允许过渡期旧名并存。

推荐接口（示意）：

```java
public interface GltcItemLogic {
    void onUse(PlayerRightClickEvent e, SlimefunItem item);
    default void onWeaponHit(...) {}
    default void onPlace(...) {}
    default void onBreak(...) {}
}

public interface GltcMachineLogic {
    default void onUse(...) {}
    /** @return true 表示已接管本 tick，跳过默认配方 tick */
    default boolean onTick(Location loc, GltcRecipeMachine machine) { return false; }
    default void onPlace(...) {}
    default void onBreak(...) {}
}
```

### 2.3 配置与数据路径

| 用途 | 路径 |
|------|------|
| 服配置 | `plugins/GLTC/config.yml` |
| 信用点 | `plugins/GLTC/data/credit/{uuid}.yml` 或 `.json`（选定一种全库统一） |
| 术士数值/装备 | `plugins/GLTC/data/mage/stats|equip/{uuid}.json` |
| 舰体货币/订单 | `plugins/GLTC/data/skey/...` |

从 JS 迁路径时：**写迁移说明**（旧 RSC 路径 → 新路径）；可选一次性导入工具，非必须。

### 2.4 启动顺序

```java
// GltcPlugin.onEnable
saveDefaultConfig();
GltcRegistry.registerAll(this);   // 物品/机器（含逻辑类）
GltcLogicBootstrap.init(this);    // 全局 Listener、Service 预热
```

`GltcLogicBootstrap` 替代原 `监听.js` 的副作用（注册监听、初始化 Credit/Mage/Gun 单例）。

---

## 3. 分阶段说明

### Phase J0 — 骨架

- [ ] 建立 `logic/` 包与 `GltcLogicBootstrap`  
- [ ] 定义 Item/Machine Logic 接口，并接到 `GltcScriptedItem`/`Machine`（或重命名类）  
- [ ] 建立 `LOGIC_PORT_STATUS.md`（或扩展 manifest）列出全部 ID 与状态  
- [ ] 文档声明：终局无 Graal；新代码禁止依赖 JS 引擎  
- [ ] 验收：无逻辑模块时启动正常；右键空壳不崩  

### Phase J1 — 公共工具

- [ ] `GltcAbilityPower`：读 `StarbyssAdjustment`，计算 SIT 伤害  
- [ ] `GltcDamageNotify`：chat / actionbar / none  
- [ ] `GltcDataPaths`：统一 data 根  
- [ ] 验收：单元级或临时 debug 命令可读配置并格式化伤害数字  

### Phase J2 — 信用点

对照：`能源流/_信用点.js`、`能源流货币/信用卡.js`、`能源流货币/充值机.js`

- [ ] `CreditService` 余额读写  
- [ ] 银行卡物品 `onUse`  
- [ ] 储蓄站机器 GUI 与确认逻辑  
- [ ] 验收：存取后重启余额保持；无 RSC  

### Phase J3 — 全局监听

对照：`监听.js`（去加载器部分）、`食物/战斗效果监听.js`

- [ ] 将原引导中的 Listener 拆成明确 Java 类并在 Bootstrap 注册  
- [ ] 热重载/disable 时 unregister，防双注册  
- [ ] 验收：相关食物战斗效果触发；disable 无残留  

### Phase J4 — 枪械

对照：`枪械/**`（除模板说明）

- [ ] 枪械元数据 / 委托 / GUI / 登记 → `gun` 包  
- [ ] 各通古斯枪 + 集成枪右键射击  
- [ ] 伤害 = 系数 × SIT；通知模式正确  
- [ ] 验收：对照 RSC 抽测至少 3 种枪  

### Phase J5 — 异能武器

对照：`武器/**`（除模板说明）

- [ ] 每把武器独立类或同包多类；共用冷却/特效工具可抽  
- [ ] 禁止双注册 Listener  
- [ ] 验收：每把武器至少 1 条主技能路径  

可拆多个 PR：伏地 → 风墟 → 破军 → ASPL → 隐兰 → 咀梦。

### Phase J6 — 食物

- [ ] `通用饥饿值` / `通用药效` 参数化（由物品 ID 或注册表驱动，避免 N 份复制）  
- [ ] 特殊料理：浮沉、百香、灼金、疯狂星期四、黄金炒饭  
- [ ] 验收：进食饱食/药效；战斗效果与 J3 联动  

### Phase J7 — 道具

- [ ] 音效浏览器、钢铁靶、炽古花盆、深渊召来、轮椅宣言等  
- [ ] 能源流商店脚本若仍对应可右键物品 → 一并 Java 化；已废弃则从状态表标 `skipped` 并写原因  

### Phase J8 — 机器与 SMB

- [ ] 舰体订单发布/接收/链接协议访问站 + `_舰体货币`  
- [ ] 枪械外观客制化组装桌  
- [ ] 锻造锤加工特效（`onTick` / 定时任务）  
- [ ] 深红远星 `onTick` 特效（与现有 SMB Java 协作，不重复造结构逻辑）  
- [ ] 验收：GUI、落盘、特效抽测  

### Phase J9 — 术士

对照：`术士系统/**` + `便利/工作区.yml`（施术规格）

- [ ] `MageService`：等级/潜能/属性/装备槽持久化  
- [ ] 驭粒终端（装备菜单）、调控终端  
- [ ] 施术道具 / 术式承载：无 JS 时 **按工作区直接写 Java**，状态从 `wip_missing` → `done`  
- [ ] 验收：加点、装备、冷却公式与工作区一致  

### Phase J10 — 拆除 JS 运行时

- [ ] 确认状态表无 `pending`/`wip`（允许明确的 `skipped`）  
- [ ] 移除 Graal 依赖、引擎类、`resources/scripts`、sync-scripts  
- [ ] `pom` / jar 体积回落；启动日志无「脚本引擎」  
- [ ] 全量回归 §5  

---

## 4. 单模块移植作业清单（每个模块复用）

1. **读懂 JS**：入口函数（`onUse`/`onTick`/自注册 Listener）、依赖的全局 API、落盘路径、配置键。  
2. **写 Java Service + Handler**，挂到对应 Slimefun ID。  
3. **删掉该 ID 的 JS 路径**（双轨期禁止 fallback）。  
4. **更新状态表** → `done`。  
5. **对照验收**（RSC 或录屏/数值表）。  
6. **提交**：一个模块一个清晰 PR/提交，避免巨石。

编码要求：

- 与周边 `gltc` 代码风格一致；不引入无关重构  
- 不把「临时 System.out」留在主干  
- Listener 必须在 `onDisable` / reload 可清理  

---

## 5. 全量回归（J10 前）

### 5.1 启动

- [ ] 仅 Slimefun + GLTC，无 RSC、无 Graal 相关报错  
- [ ] 无重复 ID、无脚本引擎日志  

### 5.2 分势力抽测

| 模块 | 最低标准 |
|------|----------|
| 信用点 | 银行卡 + 储蓄站 |
| 枪械 | ≥3 种枪伤害与通知 |
| 武器 | 每把主技能 |
| 食物 | 通用类 + 1 个特殊料理 |
| 舰体 | 一发一收或访问站 |
| 术士 | 终端打开、潜能写入、重启保持 |

### 5.3 数据

- [ ] 旧 RSC 数据若需兼容，文档写清迁移步骤；不要求静默兼容未文档化路径  

---

## 6. 已知陷阱

| 问题 | 处理 |
|------|------|
| JS 多 Context 不共享对象 | Java 用单例 Service，不要模拟多引擎 |
| 热重载双 Listener | 注册前 unregister；Bootstrap 统一管 |
| 枪械/武器复制粘贴 SIT 逻辑 | 必须走 J1 工具类 |
| 大武器文件（咀梦等） | 拆私有方法/内部类，仍可单类文件 |
| 工作区与旧 JS 不一致 | **以工作区 + 现行设计为准**，并在状态表备注「spec: workspace」 |
| 生成的 `GltcScriptedRegistry` | 改为实例化具体 Logic 类；必要时改 codegen |
| 过早删 scripts | J10 之前可留对照；但运行路径不得依赖 |

---

## 7. 明确不做

- 以 GraalJS 为长期方案继续扩面  
- 把 JS 原样打进 jar「还能热更脚本」作为产品特性  
- 改名 Slimefun ID  
- 本规范内吞并旧术式体系全部历史脚本（未进工作区/未进联合协议的）  

---

## 8. 执行顺序速查

```
J0   logic 骨架 + Handler 接口 + 状态表
J1   配置/SIT/伤害通知工具
J2   信用点
J3   全局 Listener（原监听.js 职责）
J4   枪械
J5   异能武器（可多 PR）
J6   食物
J7   道具
J8   机器 / SMB 特效
J9   术士（含按工作区补施术）
J10  拆除 Graal 与 scripts；全量回归
```

每阶段未通过验收 **禁止** 进入下一阶段（J5 内部可按武器并行，但整批枪械未完勿开术士大改）。

---

## 9. 与其它文档的关系

| 文档 | 职责 |
|------|------|
| `GLTCrsc转换jar规范.md` | Phase 0–7 静态迁移；§13 指向本文 |
| **本文** | 行为逻辑 Java 化（原「JS 接入」终局方案） |
| `便利/工作区.yml` | 术士/施术设计规格（J9 权威之一） |
| `WIP_MISSING_SCRIPTS.md` | 改为「待按工作区实现的 Java 模块」或并入状态表后删除 |

原 Graal/JS 接入方案已废弃并移除出工程；勿再引入脚本引擎。

---

*文档版本: 2.0 | 策略: JS → 纯 Java | 源对照: `scripts/` | 目标: GLTC 独立插件无脚本引擎*
