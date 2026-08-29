# GLTC 联合协议 · RSC → 独立 Slimefun 插件 · 分步转换指南

> **读者**：后续执行迁移的 AI 或开发者。  
> **范围**：仅迁移 `GLTC_联合协议` 内 **除 `scripts/` 以外** 的全部内容。  
> **目标**：产出只依赖 Slimefun 的标准 Java 插件（`GltcPlugin.jar`），运行时不再读取 RSC 附属 YAML。  
> **本阶段不做**：任何 `.js` 脚本逻辑、`旧术式体系` 附属、材质包打包。

---

## 0. 执行前必读

### 0.1 源仓库路径（固定）

```
SOURCE_ROOT = GLTC_联合协议/          # 本仓库根目录
SOURCE_SCRIPTS = SOURCE_ROOT/scripts/ # 本阶段忽略
SOURCE_SAVED = SOURCE_ROOT/saveditems/
TARGET_ROOT = ../gltc-plugin/        # 新建独立 Java 工程（与 SOURCE 同级或任意位置）
```

### 0.2 源资产清单（必须全部覆盖）

| 源文件 | 条目规模（约） | 迁移优先级 |
|--------|----------------|------------|
| `groups.yml` | 8 大组 + 数十子组 | P0 |
| `recipe_types.yml` | 49 种 `PF_*` | P0 |
| `items.yml` | ~186 条（59 条带 `script:`） | P1 |
| `recipe_machines.yml` | ~116 台，配方 3 万+ 行 | P3 |
| `workbenches.yml` | ~3–4 台（内含大量配方） | P4 |
| `generators.yml` | 17 台 | P4 |
| `template_machines.yml` | 3 台 | P5 |
| `super_multi_block_machines.yml` | 3 台 | P5 |
| `mb_machines.yml` | 2 台 | P5 |
| `machines.yml` | 6 台（**全部** `script:`，仅空壳） | P7 |
| `menus.yml` | 与机器 1:1，1 万+ 行 | P3（随机器） |
| `armors.yml` | 4 套护甲 | P6 |
| `foods.yml` | ~36 条 | P6 |
| `mob_drops.yml` | 5 条 | P6 |
| `supers.yml` | 4 条 | P6 |
| `saveditems/` | 45 个 yml | P2 |
| `default_config.yml` | 3 项 | P0 |
| `info.yml` | 元信息 | P0 → `plugin.yml` |

### 0.3 硬性规则

1. **保留 YAML 中的 ID 字符串**（如 `ATO_捕网`、`al_q_a1`），确保 `/sf give`、存档 NBT、配方引用不因大小写/改名断裂。
2. **带 `script:` 的条目**：只注册静态壳（物品 meta、机器 GUI、配方），**不**实现交互；类/常量上保留 `SCRIPT_ID` 供后续 JS 阶段挂载。
3. **禁止**在目标插件运行时依赖 `RykenSlimefunCustomizer` 或读取 `plugins/.../addons/GLTC_联合协议/`。
4. **推荐策略**：手写 ~10 个基类 + **YAML→Java 代码生成器**；禁止手写 3 万行配方。
5. 每完成一个 Phase，必须跑 **验收清单**（见各 Phase 末尾）再继续。

### 0.4 技术栈约定

- Java 21
- Maven 或 Gradle（任选，全文以 Maven 为例）
- Slimefun4 Dev Build（与服主 MC 1.21.x 对齐，**锁定一个 commit/build 号**写进 `pom.xml`）
- Paper API `provided`
- 文本：`MiniMessage` 解析 `&#rrggbb` 与 `&a` 混合格式（与 RSC 显示一致）

---

## 1. Phase 0 — 工程骨架与插件入口

### 步骤 1.1 创建工程目录

在 `TARGET_ROOT` 创建标准 Maven 结构：

```
gltc-plugin/
├── pom.xml
├── tools/yaml-codegen/          # 代码生成器（独立 module 或同 repo 子目录）
└── src/main/
    ├── java/com/linkany121/gltc/
    └── resources/
        ├── plugin.yml
        └── config.yml           # 复制自 default_config.yml
```

### 步骤 1.2 编写 `pom.xml`

- `groupId`: `com.linkany121`
- `artifactId`: `gltc-plugin`
- 依赖：`slimefun4`、`paper-api` 均为 `provided`
- `maven-shade-plugin`：**不要** shade Slimefun/Paper
- 编译 `-parameters`，Java 21

### 步骤 1.3 编写 `plugin.yml`

从 `info.yml` 映射：

```yaml
name: GLTC
main: com.linkany121.gltc.GltcPlugin
version: 5.0.0          # 独立插件新版本，与 RSC 4.0.2 区分
api-version: '1.21'
depend: [Slimefun]
authors: [Linkany121]
description: GLTC联合协议
```

### 步骤 1.4 编写 `GltcPlugin.java`

必须实现：

```java
public final class GltcPlugin extends JavaPlugin implements SlimefunAddonLoader {
    private static GltcPlugin instance;

    @Override
    public void onEnable() {
        instance = this;
        saveDefaultConfig(); // config.yml 来自 default_config.yml
        new SlimefunAddon(this) {
            @Override
            public void load() {
                GltcRegistry.registerAll(this);
            }
        }.register();
    }

    public static GltcPlugin getInstance() { return instance; }
}
```

### 步骤 1.5 创建空壳 `GltcRegistry.java`

```java
public final class GltcRegistry {
    public static void registerAll(SlimefunAddon addon) {
        // Phase 0: 仅日志
        GltcPlugin.getInstance().getLogger().info("GLTC registry placeholder");
    }
}
```

### 步骤 1.6 复制 `config.yml`

将 `default_config.yml` 原样放入 `src/main/resources/config.yml`：

- `ParticleConcentration`
- `StarbyssAdjustment`
- `DamageNotifyMode`

### Phase 0 验收

- [ ] `mvn package` 成功
- [ ] 放入测试服 `plugins/`，仅装 Slimefun + GLTC，**不装 RSC**
- [ ] 控制台无报错，插件启用
- [ ] `plugins/GLTC/config.yml` 自动生成

---

## 2. Phase 1 — 物品分类与配方类型

### 步骤 2.1 实现 `GltcItemBuilder.java`（手写，后续复用）

必须支持：

| 输入（RSC YAML） | 输出 |
|------------------|------|
| `item.material: stone` | `Material.STONE` |
| `material_type: mc` + `material: iron_ingot` | 原版材料 |
| `material_type: skull_hash` + `material: <hex>` | 玩家头颅纹理 |
| `material_type: skull_hash` + base64 字符串 | 自定义头颅 |
| `modelId: 1210001` | CustomModelData（1.21+ 用 `CustomModelDataComponent`） |
| `glow: true` | 隐藏附魔 + UNBREAKING |
| `name` / `lore` 含 `&#rrggbb` | MiniMessage 着色 |

**暂不实现** `material_type: saveditem`（Phase 2）。

### 步骤 2.2 代码生成：`groups.yml` → `GltcItemGroups.java`

解析规则：

| RSC 字段 | Java |
|----------|------|
| 顶层 key（如 `A_A`） | 常量名：`A_A`（非法字符转 `_`） |
| `type: nested` | `new NestedItemGroup(key, item)` |
| `type: sub` + `parent: A_A` | `new SubItemGroup(parentGroup, key, item)` |
| `tier` | ItemGroup 构造 tier 参数 |

生成方法：

```java
public static void register(SlimefunAddon addon) {
    // 先 nested，后 sub（拓扑排序 parent 先于 child）
    addon.addItemGroup(A_A);
    addon.addItemGroup(A_A1);
    ...
}
```

**注意**：注册顺序必须 parent → child，否则 Slimefun 报错。

### 步骤 2.3 代码生成：`recipe_types.yml` → `GltcRecipeTypes.java`

每个 `PF_*` 条目生成：

```java
public static final RecipeType PF_KEW = new RecipeType(
    new NamespacedKey(GltcPlugin.getInstance(), "pf_kew"),
    GltcItemBuilder.build(recipeTypeYamlItem),
    "PF_KEW"
);
```

- key 全文件唯一
- 展示用 ItemStack 来自 `recipe_types.yml` 的 `material/name/lore/glow`

### 步骤 2.4 更新 `GltcRegistry.registerAll`

```java
GltcItemGroups.register(addon);
GltcRecipeTypes.register(addon);
```

### Phase 1 验收

- [ ] `/sf guide` 出现 GLTC 各章节/势力分类
- [ ] 49 个 RecipeType 在 debug 日志中计数正确
- [ ] 无 ItemGroup 循环依赖报错

---

## 3. Phase 2 — SavedItem 与普通物品（无 script）

### 步骤 3.1 复制 `saveditems/` 到 resources

```
src/main/resources/saveditems/   # 保持原目录结构
  工具武器/破军.yml
  护甲/...
  BC_星图_*.yml
```

### 步骤 3.2 实现 `SavedItemLoader.java`（手写）

```java
public final class SavedItemLoader {
    private static final Map<String, ItemStack> CACHE = new HashMap<>();

    public static void loadAll(GltcPlugin plugin) {
        // 递归扫描 resources/saveditems/**/*.yml
        // 解析 Bukkit ItemStack 序列化格式（含 DataVersion、components）
        // key = 相对路径去掉 .yml，如 "工具武器/破军"
    }

    public static ItemStack get(String path) {
        return CACHE.get(path).clone();
    }
}
```

**1.21+ 注意**：saveditem 文件含 `components:` 块，需用 Bukkit `ItemStack.deserialize()` 或 SnakeYAML + 版本适配。若反序列化失败，记录 `[SavedItem] 失败: 路径` 并 fallback 为 STONE。

### 步骤 3.3 完善 `GltcItemBuilder` 支持 saveditem

```java
if ("saveditem".equals(materialType)) {
    return SavedItemLoader.get(yamlMaterialPath);
}
```

### 步骤 3.4 代码生成：`items.yml` → `GltcItemsRegistry.java`

**过滤规则**：

- **包含** `script:` 的条目 → 移到 Phase 7 的 `GltcScriptedItemsRegistry`
- **不包含** `script:` → 本 Phase 注册

每条生成注册代码：

```java
SlimefunItem item = new SlimefunItem(
    GltcItemGroups.A_A1,
    GltcItemBuilder.stack(config),
    RecipeType.NULL,  // 或具体 RecipeType
    outputArray,
    recipeArray
);
item.register(addon);
```

字段映射：

| RSC | Java |
|-----|------|
| `recipe_type: ENHANCED_CRAFTING_TABLE` | `RecipeType.ENHANCED_CRAFTING_TABLE` |
| `recipe_type: NULL` | `RecipeType.NULL`，无配方 |
| `recipe_type: PF_KEW` | `GltcRecipeTypes.PF_KEW` |
| `recipe:` 9 格数字键 | `ItemStack[] recipe = new ItemStack[9]` |
| `material_type: slimefun` + `material: AL_a1` | `GltcItems.get("AL_a1")` 或延迟引用 |
| `amount` | 堆叠数量 |

**ID 大小写**：生成前扫描全库，建立 `Map<String, String> canonicalIds`（以首次出现为准），配方引用统一走 canonical。

### 步骤 3.5 更新 `GltcRegistry`

```java
SavedItemLoader.loadAll(plugin);
GltcItemGroups.register(addon);
GltcRecipeTypes.register(addon);
GltcItemsRegistry.register(addon);  // 无 script 部分
```

### Phase 2 验收

- [ ] `/sf give <玩家> GLTC:al_q_a1` 成功，lore/颜色正确
- [ ] 带 `modelId` 的物品 CustomModelData 正确（需材质包）
- [ ] 带 `saveditem` 的武器/星图 NBT/属性与 RSC 服一致
- [ ] 至少 3 条有 `ENHANCED_CRAFTING_TABLE` 配方的物品可合成
- [ ] 统计：注册物品数 ≈ 127（186 - 59 script）

---

## 4. Phase 3 — 配方机器 + GUI（menus.yml）

### 步骤 4.1 手写基类 `GltcRecipeMachine.java`

继承 Slimefun `AbstractElectricMachine`（或项目使用的等价基类）。

构造函数参数（来自 YAML）：

- `ItemGroup group`
- `ItemStack machineItem`
- `RecipeType machineRecipeType`（机器自身合成）
- `ItemStack[] machineRecipe`
- `ItemStack machineOutput`
- `int capacity`
- `int energyPerCraft`
- `int speed`（tick 间隔，RSC `speed: 1` 需对照 RSC 行为换算）
- `int[] inputSlots`
- `int[] outputSlots`

必须实现：

1. **`registerRecipes()`**：从生成代码注入
2. **概率产出** `output.chance: 50` → 自定义 `MachineRecipe` 或 override `randomOutput`
3. **不消耗** `noConsume: true` → 输入槽返还
4. **`hideAllRecipes`** → 控制 guide 展示

### 步骤 4.2 手写 `MenuLayoutLoader` 或生成 menu 代码

`menus.yml` 结构：

```yaml
FD_A1:
  title: "..."
  slots:
    31:
      progressbar: true
      name: "&7空闲中"
      material: nether_star
    0:
      name: "&0"
      material: light_blue_stained_glass_pane
```

**方案 A（推荐）**：codegen 为每台机器生成 `setupMenu(ChestMenu menu)` 方法。  
**方案 B**：保留 `menus.yml` 在 resources，启动时解析（仍是独立插件，但不彻底「Java 化」）。

每个 slot：

- 普通装饰 → `menu.addItem(slot, new ChestMenuUtils.MenuItem(...))`
- `progressbar: true` → 绑定机器进度条 slot

### 步骤 4.3 代码生成：`recipe_machines.yml`

每台机器一个类 **或** 一个 registry 条目：

```java
new ATO_捕网(GltcItemGroups.A_B2).register(addon);
```

每台机器内静态块：

```java
addRecipe(new MachineRecipe(
    60,  // seconds * 20
    new ItemStack[]{ ... inputs ... },
    new ItemStack[]{ ... outputs ... }
));
```

**配方键** `recipes.PF1`、`PF2` 等仅作生成器内部标识，不需保留为运行时 ID。

### 步骤 4.4 关联 `menus.yml`

生成器读取同名 key（如 `FD_A1`），将 GUI 注入对应机器类。

### 步骤 4.5 更新 Registry 顺序

```java
GltcItemsRegistry.register(addon);      // 原料必须先于机器
GltcRecipeMachinesRegistry.register(addon);
```

### Phase 3 验收

- [ ] 随机抽 5 台不同势力机器：可放置、可开 GUI、进度条正常
- [ ] `ATO_捕网` 配方 PF1：3 秒产出，50% 概率副产物行为正确
- [ ] `noConsume: true` 的配方模板物品不消失
- [ ] 机器自身合成配方（`recipe_type: ENHANCED_CRAFTING_TABLE` 等）可用
- [ ] 耗电、容量与 RSC 服对比一致（抽测 3 台）

---

## 5. Phase 4 — 工作台与发电机

### 步骤 5.1 基类 `GltcWorkbench.java`

继承 `GltcRecipeMachine`，差异：

- `workbenches.yml` 中 `seconds: 0` → 瞬间完成
- `click: 25` → 每次处理耗能 25J（映射到 `energyPerCraft`）
- 槽位布局通常与 recipe_machines 不同，单独解析

### 步骤 5.2 代码生成：`workbenches.yml`

重点机器：`KEW`（开尔文桌）及文件内其余工作台。

配方量极大（4000+ 行），**必须**按机器拆文件：

```
generated/recipes/workbench/KEWRecipes.java
```

### 步骤 5.3 基类 `GltcGenerator.java`

继承 `ElectricGenerator`。

映射：

| RSC | Java |
|-----|------|
| `capacity` | 存储容量 |
| `production` | `getProduction()` |
| `fuels.'1'.seconds` | 燃料燃烧 tick |
| `fuels.'1'.item` | 燃料 ItemStack |

### 步骤 5.4 代码生成：`generators.yml`

17 台发电机 + 各自 `fuels` 块。

### Phase 4 验收

- [ ] 开尔文桌：蓝图类配方可瞬间合成至少 3 种机器
- [ ] 发电机：放入指定燃料后 EU 上升
- [ ] 发电机 GUI 输入输出槽与 menus 一致

---

## 6. Phase 5 — 模板机器、多方块、简易多方块

### 步骤 6.1 基类 `GltcTemplateMachine.java`（手写，RSC 特有）

YAML 字段：

- `templateSlot: 1` — 模板物品所在输入槽索引
- `fasterIfMoreTemplates: true` — 模板越多 tick 越短
- `moreOutputIfMoreTemplates: true` — 模板越多产出越多
- `consumption` — 能耗（注意与 `energyPerCraft` 区别，对照 RSC 源码行为）

`process()` 伪逻辑：

```
count = 统计 templateSlot 中模板物品数量（匹配产物自身 ID）
if count <= 0: return
interval = baseInterval / f(count)
outputMultiplier = g(count)
// 执行配方匹配与产出
```

### 步骤 6.2 代码生成：`template_machines.yml`

3 台：`YSJ_咆哮盒` 等。

### 步骤 6.3 基类 `GltcMultiBlockMachine.java`

解析 `super_multi_block_machines.yml`：

- `structure` — 多层字符矩阵，`a1`/`a2`/`a3`/`__` 映射到结构块 ItemStack
- `checkFormed` — 放置核心时检测
- `displayProjectiles` — 未形成时投影
- `openMenuWhenClickedParts` / `noMenuWhenNotFormed`
- `ticker_type: recipe` — 形成后按配方 tick

参考 Slimefun `MultiBlockMachine` API；若不够用则自写 `StructurePattern` + `BlockPlacer`。

### 步骤 6.4 代码生成：`super_multi_block_machines.yml`

3 台：`skey_深红远星级` 等。

结构块 `a1`、`a2`、`a3` 需在 `items.yml` 或独立条目中存在；生成器校验引用。

### 步骤 6.5 基类 `GltcSimpleMultiBlock.java`（mb_machines）

`mb_machines.yml` 特征：

- 无 3D 结构矩阵
- `work: 5` — 右键触发次数
- `sound: MAGIC_WORKBENCH_FINISH_SOUND`
- `recipes` — 输入输出简单映射

实现：类似 EnhancedCraftingTable，绑定特定方块右键。

2 台：`ATO_GT`、`ATO_GS` 等。

### Phase 5 验收

- [ ] 咆哮盒：放入多个自身模板后速度/产量提升
- [ ] 深红远星：放置核心显示投影，结构搭好后可运行
- [ ] mb 沉淀仪：右键紫水晶触发合成

---

## 7. Phase 6 — 护甲、食物、掉落、Supers

### 步骤 7.1 护甲 `armors.yml`

每套生成：

```java
public class FkrYumangArmorSet {
    public static void register(SlimefunAddon addon) {
        SlimefunArmorSet set = new SlimefunArmorSet(
            GltcItemGroups.A_G1b,
            new PotionEffect[] { new PotionEffect(HASTE, ...) },
            SavedItemLoader.get("护甲/榆芒珀金头盔"),
            ...
        );
        // helmet/chestplate/leggings/boots 各注册 SlimefunArmorPiece + 配方
    }
}
```

映射：

- `protection_types: [RADIATION]` → Slimefun `ProtectionType`
- `fullSet: true` → 四件齐全触发套装效果
- 部位 `material_type: saveditem` → SavedItemLoader

4 套：榆芒珀金、玛瑙镀煌、终界寒子素钢等。

### 步骤 7.2 食物 `foods.yml`

无 script 条目 → 普通 `SlimefunItem` + 可选 `nutrition` 写入 PDC：

```java
public class GltcFoodItem extends SlimefunItem {
    // nutrition 存 NamespacedKey("gltc", "nutrition")
    // 战斗效果由后续 JS 读取，本阶段不实现
}
```

有 script 的成品料理 → Phase 7。

### 步骤 7.3 掉落物 `mob_drops.yml`

5 条。每条：

1. 注册 `SlimefunItem`
2. 在 `GltcMobDropListener` 中：

```java
@EventHandler
public void onDeath(EntityDeathEvent e) {
    if (e.getEntityType() != EntityType.SNOW_GOLEM) return;
    if (random.nextInt(100) >= 60) return;
    e.getDrops().add(GltcItems.TSstxkl.getItem().clone());
}
```

### 步骤 7.4 Supers `supers.yml`

4 条映射 Slimefun 原生类：

```java
new EnergyRegulator(GltcItemGroups.A_B2, itemStack, GltcRecipeTypes.PF_ATO_GT, recipe...)
    .register(addon);
```

`class` 字段全限定名 → 反射或 switch 硬编码（推荐 switch，更安全）。

`arg_template` 指示构造参数顺序。

### Phase 6 验收

- [ ] 凑齐一套榆芒珀金：获得急迫 I
- [ ] 击杀雪傀儡：60% 掉落战利品
- [ ] GLTC 能源调节器可放置且功能等同原版 Energy Regulator
- [ ] 食物物品可持有，nutrition PDC 存在（用 `/data` 或 debug 查）

---

## 8. Phase 7 — 带 script 的空壳（不实现逻辑）

### 步骤 8.1 收集所有 `script:` 引用

来源：

- `items.yml` — 59 处
- `machines.yml` — 6 处（全部）
- `recipe_machines.yml` / 其他 — 检查是否有个别 script

生成清单 TSV：

```
kind,id,script_path
item,FKR_通古斯制式步枪,枪械/通古斯制式步枪
machine,ATO_能源流储蓄站,能源流货币/充值机
...
```

### 步骤 8.2 基类 `GltcScriptedShell`

**物品壳**：

```java
public class GltcScriptedItem extends SlimefunItem {
    public static final String SCRIPT_ID = "枪械/通古斯制式步枪";
    // 不 override 交互，或 override 后 sendMessage("功能加载中")
}
```

**机器壳**：

```java
public class GltcScriptedMachine extends GltcRecipeMachine {
    public static final String SCRIPT_ID = "能源流货币/充值机";
    @Override
    protected void onClick(InventoryClickEvent e) {
        // 仅允许放入取出，不执行 script 逻辑
    }
}
```

### 步骤 8.3 注册

```java
GltcScriptedRegistry.register(addon);
```

### 步骤 8.4 生成 `SCRIPT_MANIFEST.json`（供后续 JS 阶段使用）

```json
{
  "items": [
    { "slimefunId": "FKR_通古斯制式步枪", "script": "枪械/通古斯制式步枪" }
  ],
  "machines": [
    { "slimefunId": "ATO_能源流储蓄站", "script": "能源流货币/充值机" }
  ]
}
```

### Phase 7 验收

- [ ] 带 script 物品可 `/sf give`，外观正确
- [ ] 带 script 机器可打开 GUI，点击不崩
- [ ] `SCRIPT_MANIFEST.json` 条目数 = 59 + 6（去重后）
- [ ] 全程无 RSC、无 JS 引擎

---

## 9. 代码生成器规范（`tools/yaml-codegen`）

### 9.1 输入/输出

```
输入:
  --source ../GLTC_联合协议
  --phase items|machines|all

输出:
  ../gltc-plugin/src/main/java/com/linkany121/gltc/generated/
```

### 9.2 生成器模块职责

| 类 | 输入 YAML | 输出 |
|----|-----------|------|
| `GroupsCodegen` | groups.yml | GltcItemGroups.java |
| `RecipeTypesCodegen` | recipe_types.yml | GltcRecipeTypes.java |
| `ItemsCodegen` | items.yml | GltcItemsRegistry.java / GltcScriptedItemsRegistry.java |
| `RecipeMachinesCodegen` | recipe_machines.yml + menus.yml | machines/*.java |
| `WorkbenchesCodegen` | workbenches.yml + menus.yml | workbench/*.java |
| `GeneratorsCodegen` | generators.yml + menus.yml | generators/*.java |
| `TemplateMachinesCodegen` | template_machines.yml | template/*.java |
| `MultiBlockCodegen` | super_multi_block_machines.yml | multiblock/*.java |
| `SimpleMbCodegen` | mb_machines.yml | simplemb/*.java |
| `ArmorsCodegen` | armors.yml | armors/*.java |
| `FoodsCodegen` | foods.yml | foods/*.java |
| `MobDropsCodegen` | mob_drops.yml | drops/*.java + listener 片段 |
| `SupersCodegen` | supers.yml | GltcSupers.java |
| `IdCanonicalizer` | 全部 YAML | ids.json 大小写映射表 |

### 9.3 生成器必须做的校验

1. **引用完整性**：配方中 `material_type: slimefun` 的 ID 必须存在于 items/machines 注册表
2. **大小写冲突**：`AL_a1` vs `AL_A1` 写入 `ids.json` 并 warn
3. **RecipeType 存在**：`recipe_type: PF_XXX` 必须在 recipe_types 中定义
4. **Menu 存在**：每台机器在 menus.yml 有同名 key（缺失则用默认空 GUI + warn）
5. **SavedItem 存在**：`material_type: saveditem` 路径在 saveditems/ 有文件

### 9.4 运行方式

```bash
cd gltc-plugin/tools/yaml-codegen
mvn exec:java -Dexec.mainClass="com.linkany121.gltc.codegen.Main" -Dexec.args="--source ../../GLTC_联合协议 --phase all"
cd ../..
mvn package
```

CI 建议：source YAML 变更时自动跑 codegen 并编译。

---

## 10. 最终 Registry 顺序（固定，勿乱）

```java
public static void registerAll(SlimefunAddon addon) {
    GltcPlugin plugin = GltcPlugin.getInstance();

    // 1. 资源
    SavedItemLoader.loadAll(plugin);

    // 2. 分类与配方类型
    GltcItemGroups.register(addon);
    GltcRecipeTypes.register(addon);

    // 3. 纯物品（无 script）
    GltcItemsRegistry.register(addon);

    // 4. Supers（能源调节器等，其他机器可能依赖）
    GltcSupers.register(addon);

    // 5. 机器（按依赖：工作台原料 → 配方机器 → 特殊机器）
    GltcWorkbenchesRegistry.register(addon);
    GltcRecipeMachinesRegistry.register(addon);
    GltcGeneratorsRegistry.register(addon);
    GltcTemplateMachinesRegistry.register(addon);
    GltcMultiBlockRegistry.register(addon);
    GltcSimpleMultiBlockRegistry.register(addon);

    // 6. 护甲、食物、掉落
    GltcArmorSetsRegistry.register(addon);
    GltcFoodsRegistry.register(addon);
    GltcMobDropsRegistry.register(addon);

    // 7. 脚本空壳（最后，避免覆盖同名 ID）
    GltcScriptedRegistry.register(addon);

    plugin.getLogger().info("GLTC 注册完成: items=" + countItems + ", machines=" + countMachines);
}
```

---

## 11. 全量回归测试清单（迁移完成后）

### 11.1 启动

- [ ] 仅 Slimefun + GLTC，无 RSC
- [ ] 启动时间记录（目标 < 120s，可后续优化）
- [ ] 无 `ClassNotFoundException` / 重复 ID 错误

### 11.2 各势力抽测（每势力至少 1 条产线）

| 势力 | 测试点 |
|------|--------|
| ATO | 捕网 → 副产物概率 |
| TAC/星渊 | 开尔文桌蓝图合成 |
| C/TS | 发电机 + 矿物机器 |
| LIS | 录音/和弦相关机器（无 script 部分） |
| FKRT | saveditem 武器 give |
| UMPV | 食物 item |
| Skey | 多方块深红远星结构 |
| VASA | 术式相关 **空壳** 机器可开 GUI |
| DLC OST/HInet | 若有纯 YAML 机器则测配方 |

### 11.3 数据兼容

- [ ] 旧 RSC 存档中 GLTC 物品 ID 仍可被 Slimefun 识别（若 ID 一致）
- [ ] 玩家背包中已有 GLTC 物品 reload 后不消失

### 11.4 对照测试

在同一世界备份上：

1. RSC 服截图/记录某机器产出
2. 独立插件服相同输入
3. 产出 ItemStack 类型、数量、NBT 一致

---

## 12. 已知陷阱（后续 AI 勿踩）

| 问题 | 处理 |
|------|------|
| ID 大小写不一致 | 必须用 `IdCanonicalizer`，生成单一 canonical ID |
| `recipe_type: NULL` | 不是 null，是 Slimefun `RecipeType.NULL` |
| `material_type: mc` | 等同于原版，`material: COBBLESTONE` 需转 Material enum |
| 9 格配方键 1-9 | Minecraft 配方数组 index 0-8，生成时 `-1` |
| 机器槽位 1-based | Slimefun ChestMenu 通常 0-based，生成时 `-1` |
| `speed: 1` 含义 | 对照 RSC 文档/源码，可能是每 N tick 一次，不是秒 |
| `seconds: 3` | 通常 `3 * 20 = 60 tick` |
| saveditem 1.21 components | 必须用 Bukkit 反序列化，不要手拼 NBT |
| 带 script 食物 | 本阶段无饱食度/药效，预期行为 |
| menus 缺失 | 机器仍应可注册，用空白边框 GUI |

---

## 13. 后续阶段接口（本指南不执行，仅留钩子）

行为逻辑（原 YAML `script:` / `scripts/*.js`）**不得**以嵌入 JS 引擎为终局。

移植要求：

1. 以 `SCRIPT_MANIFEST.json`（及全库 `script:`）为清单  
2. 将逻辑重写为 Java（`com.linkany121.gltc.logic.*`），挂到原空壳物品/机器上  
3. 配置走 `GltcPlugin.getConfig()`；数据走 `plugins/GLTC/data/`  
4. 完成后移除任何 Graal/JS 运行时  

**展开规范**：见同目录 [`GLTC_脚本转Java规范.md`](./GLTC_脚本转Java规范.md)（Phase J0–J10）。

本指南 **到此结束**；完成 Phase 0–7 即「非脚本行为内容完全独立化」交付标准。

---

## 14. 执行顺序速查（给 AI 的一页纸）

```
P0  工程 + plugin.yml + GltcPlugin + config
P1  GltcItemBuilder(v1) + codegen groups + recipe_types
P2  SavedItemLoader + codegen items(无script)
P3  GltcRecipeMachine + codegen recipe_machines + menus
P4  GltcWorkbench + GltcGenerator + codegen
P5  GltcTemplateMachine + GltcMultiBlock + GltcSimpleMultiBlock + codegen
P6  armors + foods + mob_drops + supers + codegen
P7  GltcScriptedShell + SCRIPT_MANIFEST.json
    全量回归 §11
```

每 Phase 未通过验收 **禁止** 进入下一 Phase。

---

*文档版本: 1.0 | 对应源: GLTC 联合协议 info.yml 4.0.2 | 目标插件: GLTC 5.0.0*
