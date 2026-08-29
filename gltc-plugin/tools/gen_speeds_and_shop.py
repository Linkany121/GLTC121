# -*- coding: utf-8 -*-
import json
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[2]
PLUGIN = Path(__file__).resolve().parents[1]
GEN_JAVA = PLUGIN / "src/main/java/com/linkany121/gltc/generated/GltcMachineSpeeds.java"
SHOP_JSON = PLUGIN / "src/main/resources/energy_shops.json"


def collect_speeds() -> dict[str, int]:
    speeds: dict[str, int] = {}
    for fname in (
        "recipe_machines.yml",
        "template_machines.yml",
        "workbenches.yml",
        "generators.yml",
    ):
        path = SRC / fname
        if not path.exists():
            continue
        current = None
        for line in path.read_text(encoding="utf-8").splitlines():
            if re.match(r"^[A-Za-z0-9_\u4e00-\u9fff]+:\s*$", line) and not line.startswith(" "):
                current = line[:-1]
            m = re.match(r"^  speed:\s*(\d+)", line)
            if m and current:
                speeds[current] = int(m.group(1))
    return speeds


def write_speeds(speeds: dict[str, int]) -> None:
    lines = [
        "package com.linkany121.gltc.generated;",
        "",
        "import com.linkany121.gltc.machine.GltcRecipeMachine;",
        "import com.linkany121.gltc.util.IdCanonicalizer;",
        "import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;",
        "import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;",
        "",
        "import java.util.HashMap;",
        "import java.util.Locale;",
        "import java.util.Map;",
        "",
        "/** YAML machine speed applied after register. */",
        "public final class GltcMachineSpeeds {",
        "    private GltcMachineSpeeds() {}",
        "    private static final Map<String, Integer> SPEED = new HashMap<>();",
        "    static {",
    ]
    for key, value in speeds.items():
        if value <= 1:
            continue
        esc = key.replace("\\", "\\\\").replace('"', '\\"')
        lines.append(f'        putSpeed("{esc}", {value});')
    lines += [
        "    }",
        "    private static void putSpeed(String id, int speed) {",
        "        SPEED.put(id, speed);",
        "        SPEED.put(id.toUpperCase(Locale.ROOT), speed);",
        "    }",
        "    public static void apply() {",
        "        for (SlimefunItem item : Slimefun.getRegistry().getAllSlimefunItems()) {",
        "            if (!(item instanceof GltcRecipeMachine machine)) {",
        "                continue;",
        "            }",
        "            Integer speed = SPEED.get(item.getId());",
        "            if (speed == null) {",
        "                speed = SPEED.get(IdCanonicalizer.canonical(item.getId()));",
        "            }",
        "            if (speed == null) {",
        "                for (Map.Entry<String, Integer> e : SPEED.entrySet()) {",
        "                    if (e.getKey().equalsIgnoreCase(item.getId())) {",
        "                        speed = e.getValue();",
        "                        break;",
        "                    }",
        "                }",
        "            }",
        "            if (speed != null && speed > 1) {",
        "                machine.setProcessingSpeed(speed);",
        "            }",
        "        }",
        "    }",
        "}",
        "",
    ]
    GEN_JAVA.write_text("\n".join(lines), encoding="utf-8")


OBJ_RE = re.compile(
    r"\{\s*type:\s*'(vanilla|slimefun)',\s*id:\s*'([^']+)',\s*price:\s*\[\s*\{\s*id:\s*'([^']+)',\s*amount:\s*(\d+)\s*\}\s*\]"
    r"(?:,\s*giveAmount:\s*(\d+))?(?:,\s*limit:\s*(\d+))?\s*\}"
)


def extract_shop(js_path: Path, shop_id: str, title: str, batch: int) -> dict:
    text = js_path.read_text(encoding="utf-8")
    items = []
    for m in OBJ_RE.finditer(text):
        kind, item_id, price_id, price_amt, give, limit = m.groups()
        entry = {
            "type": kind,
            "id": item_id,
            "priceId": price_id,
            "priceAmt": int(price_amt),
            "giveAmount": int(give) if give else 1,
        }
        if limit:
            entry["limit"] = int(limit)
        items.append(entry)
    return {"id": shop_id, "title": title, "batchMultiplier": batch, "items": items}


def write_shops() -> None:
    shops_dir = SRC / "scripts" / "能源流"
    catalogs = [
        extract_shop(shops_dir / "植物.js", "plants", "§x§7§7§f§7§f§f协议内容：§x§f§c§f§f§5§7植物", 2),
        extract_shop(shops_dir / "矿物.js", "minerals", "§x§7§7§f§7§f§f协议内容：§x§f§c§f§f§5§7矿物", 3),
        extract_shop(shops_dir / "掉落物.js", "drops", "§x§7§7§f§7§f§f协议内容：§x§f§c§f§f§5§7掉落物", 5),
        extract_shop(shops_dir / "杂物.js", "misc", "§x§7§7§f§7§f§f协议内容：§x§f§c§f§f§5§7杂物", 10),
        extract_shop(shops_dir / "方块.js", "blocks", "§x§7§7§f§7§f§f协议内容：§x§f§c§f§f§5§7方块", 5),
        extract_shop(shops_dir / "粘液科技.js", "slimefun", "§x§7§7§f§7§f§f协议内容：§x§f§c§f§f§5§7原版粘液科技", 1),
    ]
    SHOP_JSON.write_text(json.dumps({"shops": catalogs}, ensure_ascii=False, indent=2), encoding="utf-8")
    write_shop_java(catalogs)
    for c in catalogs:
        print(f"  shop {c['id']}: {len(c['items'])} items")


def jstr(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def write_shop_java(catalogs: list[dict]) -> None:
    out = PLUGIN / "src/main/java/com/linkany121/gltc/logic/credit/EnergyShopCatalog.java"
    lines = [
        "package com.linkany121.gltc.logic.credit;",
        "",
        "import java.util.List;",
        "import java.util.Map;",
        "",
        "/** Energy-flow shop listings ported from scripts/能源流. */",
        "public final class EnergyShopCatalog {",
        "    private EnergyShopCatalog() {}",
        "",
        "    public record Offer(String type, String id, String priceId, int priceAmt, int giveAmount, int limit) {}",
        "    public record Shop(String id, String title, int batchMultiplier, List<Offer> items) {}",
        "",
        "    public static final Map<String, Shop> SHOPS = Map.ofEntries(",
    ]
    shop_blocks = []
    for c in catalogs:
        offers = []
        for it in c["items"]:
            offers.append(
                "            new Offer("
                f"{jstr(it['type'])}, {jstr(it['id'])}, {jstr(it['priceId'])}, "
                f"{it['priceAmt']}, {it['giveAmount']}, {it.get('limit', 0)})"
            )
        shop_blocks.append(
            "        Map.entry("
            + jstr(c["id"])
            + ", new Shop("
            + jstr(c["id"])
            + ", "
            + jstr(c["title"])
            + ", "
            + str(c["batchMultiplier"])
            + ", List.of(\n"
            + ",\n".join(offers)
            + "\n        )))"
        )
    lines.append(",\n".join(shop_blocks))
    lines.append("    );")
    lines.append("}")
    lines.append("")
    out.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    speeds = collect_speeds()
    write_speeds(speeds)
    print(f"speeds: {sum(1 for v in speeds.values() if v > 1)} machines with speed>1")
    write_shops()


if __name__ == "__main__":
    main()
