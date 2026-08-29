#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regenerate LOGIC_PORT_STATUS.md item tables from SCRIPT_MANIFEST.json."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "src" / "main" / "resources" / "SCRIPT_MANIFEST.json"
OUT = ROOT / "LOGIC_PORT_STATUS.md"


def main() -> None:
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    lines = [
        "# 逻辑移植状态（JS → Java）",
        "",
        "> 依据 `GLTC_脚本转Java规范.md`。状态：`pending` | `wip` | `done` | `wip_missing` | `skipped`",
        "",
        "## 批次总览",
        "",
        "| 批次 | 模块 | 状态 |",
        "|------|------|------|",
        "| — | 移除 Graal / resources/scripts / 引擎类 | **done** |",
        "| J0 | 骨架 / Handler 接口 / Bootstrap / DataPaths | **done** |",
        "| J1 | 配置与 SIT/通知工具 | **done** |",
        "| J2 | 信用点 | **done** |",
        "| J3 | 全局 Listener（食物战斗） | **done** |",
        "| J4 | 枪械 | **done** |",
        "| J5 | 异能武器 | **done** |",
        "| J6 | 食物 | **done** |",
        "| J7 | 道具 | **done** |",
        "| J8 | 机器 / SMB 特效 | **done** |",
        "| J9 | 术士 | **done** |",
        "| J10 | 收尾确认 | pending |",
        "",
        "## WIP 缺失（先按工作区写 Java）",
        "",
        "| ID | 原 script | 状态 |",
        "|----|-----------|------|",
        "| — | （无） | — |",
        "",
        "## ID 明细（来自 SCRIPT_MANIFEST）",
        "",
        "| 类型 | slimefunId | 原 script | Java 类 | 状态 |",
        "|------|------------|-----------|---------|------|",
    ]
    for kind in ("items", "machines", "recipe_machines", "multiblocks"):
        for row in data.get(kind) or []:
            sid = row["slimefunId"]
            script = row["script"]
            status = "pending"
            java_cls = "—"
            if sid == "GLTC_银行卡":
                status = "done"
                java_cls = "`credit.CreditCardLogic`"
            elif sid == "ATO_能源流储蓄站":
                status = "done"
                java_cls = "`credit.CreditChargerLogic`"
            elif script == "食物/通用饥饿值":
                status = "done"
                java_cls = "`food.GenericHungerFoodLogic`"
            elif script == "食物/通用药效":
                status = "done"
                java_cls = "`food.GenericPotionFoodLogic`"
            elif script in (
                "食物/浮沉盐海的阖眸", "食物/百香爆烤整身虐王排", "食物/灼金香烹餮汤锅",
                "食物/疯狂星期四", "食物/黄金炒饭",
            ):
                status = "done"
                java_cls = "`food.SpecialFoodLogic`"
            elif sid == "FKR_通古斯制式步枪":
                status = "done"
                java_cls = "`gun.RifleGunLogic`"
            elif sid == "FKR_通古斯战壕霰弹":
                status = "done"
                java_cls = "`gun.ShotgunGunLogic`"
            elif sid == "FKR_通古斯涡轮式单兵机枪":
                status = "done"
                java_cls = "`gun.MachineGunLogic`"
            elif sid == "FKR_通古斯防御型脉冲手铳":
                status = "done"
                java_cls = "`gun.PulsePistolLogic`"
            elif sid == "FKR_通古斯制式轨道信标投递器":
                status = "done"
                java_cls = "`gun.BeaconLauncherLogic`"
            elif sid == "FKR_通古斯过载式步枪":
                status = "done"
                java_cls = "`gun.OverloadRifleLogic`"
            elif sid == "FKR_枪械集成枪":
                status = "done"
                java_cls = "`gun.IntegrationGunLogic`"
            elif sid == "FKR_ASPL":
                status = "done"
                java_cls = "`weapon.AsplWeaponLogic`"
            elif sid == "FKR_伏地":
                status = "done"
                java_cls = "`weapon.FudiWeaponLogic`"
            elif sid == "FKR_风墟龙冕":
                status = "done"
                java_cls = "`weapon.FengxuWeaponLogic`"
            elif sid == "FKR_无锋破军":
                status = "done"
                java_cls = "`weapon.PojunWeaponLogic`"
            elif sid == "FKR_隐兰狂玉唤剑葫":
                status = "done"
                java_cls = "`weapon.HuanjianhuWeaponLogic`"
            elif sid == "FKR_咀嚼曾世的晚梦":
                status = "done"
                java_cls = "`weapon.JiumeWeaponLogic`"
            elif sid == "ATO_音效库":
                status = "done"
                java_cls = "`prop.AtoSoundBrowserLogic`"
            elif sid == "FKR_深渊召来":
                status = "done"
                java_cls = "`prop.AbyssCallLogic`"
            elif sid == "FKR_炽古花盆":
                status = "done"
                java_cls = "`prop.ChiGuFlowerPotLogic`"
            elif sid == "FKR_钢铁靶":
                status = "done"
                java_cls = "`prop.SteelTargetLogic`"
            elif sid == "OST_轮椅宣言":
                status = "done"
                java_cls = "`prop.WheelchairManifestLogic`"
            elif sid == "FKR_枪械外观客制化组装桌":
                status = "done"
                java_cls = "`machine.GunAppearanceDeskLogic`"
            elif sid == "skey_舰体订单发布机":
                status = "done"
                java_cls = "`skey.ShipOrderPublisherLogic`"
            elif sid == "skey_舰体订单接收机":
                status = "done"
                java_cls = "`skey.ShipOrderReceiverLogic`"
            elif sid == "skey_舰体链接协议访问站":
                status = "done"
                java_cls = "`skey.ShipLinkAccessStationLogic`"
            elif sid == "VASA_术式承载转换仪":
                status = "done"
                java_cls = "`machine.VasaStaffConverterLogic`"
            elif sid == "FKR_锻造锤":
                status = "done"
                java_cls = "`machine.ForgeHammerLogic`"
            elif sid == "skey_深红远星级":
                status = "done"
                java_cls = "`machine.CrimsonFarStarLogic`"
            elif sid == "VASA_驭粒终端":
                status = "done"
                java_cls = "`mage.YuLiTerminalLogic`"
            elif sid == "VASA_彼岸钢调控终端":
                status = "done"
                java_cls = "`mage.BiAnGangTerminalLogic`"
            elif sid == "VASA_通用施术道具" or script == "施术道具/通用施术":
                status = "done"
                java_cls = "`mage.StaffCastLogic`"
            lines.append(f"| {kind} | `{sid}` | `{script}` | {java_cls} | {status} |")
    lines.extend(
        [
            "",
            "## 说明",
            "",
            "- J0：未注册 Logic 时右键为空操作（不崩服）。",
            "- 模块完成后把「Java 类」与「状态」改为具体实现类名 / `done`。",
            "",
        ]
    )
    OUT.write_text("\n".join(lines), encoding="utf-8", newline="\n")
    print(f"wrote {OUT} ({sum(1 for _ in data.get('items') or [])} items)")


if __name__ == "__main__":
    main()
