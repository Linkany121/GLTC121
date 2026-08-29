# 逻辑移植状态（JS → Java）

> 依据 `GLTC_脚本转Java规范.md`。状态：`pending` | `wip` | `done` | `wip_missing` | `skipped`

## 批次总览

| 批次 | 模块 | 状态 |
|------|------|------|
| — | 移除 Graal / resources/scripts / 引擎类 | **done** |
| J0 | 骨架 / Handler 接口 / Bootstrap / DataPaths | **done** |
| J1 | 配置与 SIT/通知工具 | **done** |
| J2 | 信用点 | **done** |
| J3 | 全局 Listener（食物战斗） | **done** |
| J4 | 枪械 | **done** |
| J5 | 异能武器 | **done** |
| J6 | 食物 | **done** |
| J7 | 道具 | **done** |
| J8 | 机器 / SMB 特效 | **done** |
| J9 | 术士 | **done** |
| J10 | 收尾确认 | **done** |

## WIP 缺失（先按工作区写 Java）

| ID | 原 script | 状态 |
|----|-----------|------|
| — | （无） | — |

## J10 收尾确认记录

- [x] 状态表无 `pending` / `wip`（`VASA_通用施术道具`→`mage.StaffCastLogic`、`VASA_术式承载转换仪`→`machine.VasaStaffConverterLogic` 均已完成；`WIP_MISSING_SCRIPTS.md` 已删除）
- [x] 移除 Graal 依赖、引擎类、`resources/scripts`、sync-scripts（`pom.xml` 无 Graal；`src` 无 `GltcScriptEngine`/`RykenSlimefunCustomizer` 引用；resources 无 `scripts/`）
- [x] `pom` / jar 体积回落；`GltcPlugin.onEnable` 仅 `GltcRegistry.registerAll` + `GltcLogicBootstrap.init`，无「脚本引擎」日志
- [ ] 全量回归 §5（实机：仅 Slimefun+GLTC 启动；信用点/枪械/武器/食物/舰体/术士抽测；data 落盘）

## ID 明细（来自 SCRIPT_MANIFEST）

| 类型 | slimefunId | 原 script | Java 类 | 状态 |
|------|------------|-----------|---------|------|
| items | `ATO_音效库` | `道具工具/音效浏览器` | `prop.AtoSoundBrowserLogic` | done |
| items | `GLTC_银行卡` | `能源流货币/信用卡` | `credit.CreditCardLogic` | done |
| items | `FKR_深渊召来` | `道具工具/深渊召来` | `prop.AbyssCallLogic` | done |
| items | `FKR_炽古花盆` | `道具工具/炽古花盆` | `prop.ChiGuFlowerPotLogic` | done |
| items | `FKR_钢铁靶` | `道具工具/钢铁靶` | `prop.SteelTargetLogic` | done |
| items | `FKR_通古斯制式步枪` | `枪械/通古斯制式步枪` | `gun.RifleGunLogic` | done |
| items | `FKR_通古斯战壕霰弹` | `枪械/通古斯战壕霰弹` | `gun.ShotgunGunLogic` | done |
| items | `FKR_通古斯涡轮式单兵机枪` | `枪械/通古斯涡轮式单兵机枪` | `gun.MachineGunLogic` | done |
| items | `FKR_通古斯防御型脉冲手铳` | `枪械/通古斯防御型脉冲手铳` | `gun.PulsePistolLogic` | done |
| items | `FKR_通古斯制式轨道信标投递器` | `枪械/通古斯制式轨道信标投递器` | `gun.BeaconLauncherLogic` | done |
| items | `FKR_通古斯过载式步枪` | `枪械/通古斯过载式步枪` | `gun.OverloadRifleLogic` | done |
| items | `FKR_枪械集成枪` | `枪械/枪械集成枪` | `gun.IntegrationGunLogic` | done |
| items | `FKR_伏地` | `武器/伏地` | `weapon.FudiWeaponLogic` | done |
| items | `FKR_风墟龙冕` | `武器/风墟龙冕` | `weapon.FengxuWeaponLogic` | done |
| items | `FKR_无锋破军` | `武器/破军` | `weapon.PojunWeaponLogic` | done |
| items | `FKR_ASPL` | `武器/ASPL` | `weapon.AsplWeaponLogic` | done |
| items | `FKR_隐兰狂玉唤剑葫` | `武器/隐兰狂玉唤剑葫` | `weapon.HuanjianhuWeaponLogic` | done |
| items | `FKR_咀嚼曾世的晚梦` | `武器/咀梦` | `weapon.JiumeWeaponLogic` | done |
| items | `VASA_驭粒终端` | `术士系统/装备菜单` | `mage.YuLiTerminalLogic` | done |
| items | `VASA_彼岸钢调控终端` | `术士系统/调控终端` | `mage.BiAnGangTerminalLogic` | done |
| items | `VASA_通用施术道具` | `施术道具/通用施术` | `mage.StaffCastLogic` | done |
| items | `OST_轮椅宣言` | `道具工具/轮椅宣言` | `prop.WheelchairManifestLogic` | done |
| items | `UMPV_酥脆大薯条` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_炭烤海螺` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_大盘煎蛋` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_久蒸大米饭` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_猛炸大薯条` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_肉糜煎蛋` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_烤厄索斯菜卷` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_酱烤岩兽串` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_瓜片炒餮头肉` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_翠玉卷心瓜片` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_屑切菜香肉盘` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_蘑菇萝卜厚炖` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_蛋炒鱼肉丝` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_狂野人生烤串` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_深海野兽` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_水煮虐王兽肉汤` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_大锅炖肉土豆` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_浮沉盐海的阖眸` | `食物/浮沉盐海的阖眸` | `food.SpecialFoodLogic` | done |
| items | `UMPV_菌萝香炖稻焖饭` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_苔香辣卤海鲜汤` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_海陆双菌酒生煎` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_黄金焗酱烤整羽` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_见手金果炸全腿` | `食物/通用饥饿值` | `food.GenericHungerFoodLogic` | done |
| items | `UMPV_百香爆烤整身虐王排` | `食物/百香爆烤整身虐王排` | `food.SpecialFoodLogic` | done |
| items | `UMPV_灼金香烹餮汤锅` | `食物/灼金香烹餮汤锅` | `food.SpecialFoodLogic` | done |
| items | `UMPV_疯狂星期四` | `食物/疯狂星期四` | `food.SpecialFoodLogic` | done |
| items | `UMPV_黄金炒饭` | `食物/黄金炒饭` | `food.SpecialFoodLogic` | done |
| items | `UMPV_板蓝根` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_满穗线香` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_末嫦娥` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_琼华古冶散` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_原神丸` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_半满之月` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_辟风兽角` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_悠久的群天之甘露` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_龙心` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| items | `UMPV_果冻` | `食物/通用药效` | `food.GenericPotionFoodLogic` | done |
| machines | `ATO_能源流储蓄站` | `能源流货币/充值机` | `credit.CreditChargerLogic` | done |
| machines | `FKR_枪械外观客制化组装桌` | `机器/枪械外观客制化组装桌` | `machine.GunAppearanceDeskLogic` | done |
| machines | `skey_舰体订单发布机` | `机器/舰体订单发布机` | `skey.ShipOrderPublisherLogic` | done |
| machines | `skey_舰体订单接收机` | `机器/舰体订单接收机` | `skey.ShipOrderReceiverLogic` | done |
| machines | `skey_舰体链接协议访问站` | `机器/舰体链接协议访问站` | `skey.ShipLinkAccessStationLogic` | done |
| machines | `VASA_术式承载转换仪` | `机器/术式承载转换仪` | `machine.VasaStaffConverterLogic` | done |
| recipe_machines | `FKR_锻造锤` | `机器/锻造锤` | `machine.ForgeHammerLogic` | done |
| multiblocks | `skey_深红远星级` | `多方块特效/深红远星` | `machine.CrimsonFarStarLogic` | done |

## 说明

- J0：未注册 Logic 时右键为空操作（不崩服）。
- 模块完成后把「Java 类」与「状态」改为具体实现类名 / `done`。
