#!/usr/bin/env python3
"""GLTC YAML -> Java codegen. Run from repo root or tools/yaml-codegen."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

import yaml

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SOURCE = ROOT.parent / "GLTC_联合协议"
GEN_JAVA = ROOT / "src" / "main" / "java" / "com" / "linkany121" / "gltc" / "generated"
RESOURCES = ROOT / "src" / "main" / "resources"

JAVA_PKG = "com.linkany121.gltc.generated"

canonical_ids: dict[str, str] = {}
script_manifest: dict[str, list] = {"items": [], "machines": []}

# Legacy MC material names that changed in 1.20.3+ (Paper 1.21)
MC_MATERIAL_ALIASES: dict[str, str] = {
    "GRASS": "SHORT_GRASS",
    "GRASS_PATH": "DIRT_PATH",
    "SIGN": "OAK_SIGN",
    "WALL_SIGN": "OAK_WALL_SIGN",
    "SKULL_ITEM": "PLAYER_HEAD",
    "BREWING_STAND_ITEM": "BREWING_STAND",
    "FLOWER_POT_ITEM": "FLOWER_POT",
    "SCUTE": "TURTLE_SCUTE",
    "RESIN_CLUMP": "SLIME_BALL",
}


def resolve_mc_material(raw: str) -> str:
    upper = str(raw).upper()
    return MC_MATERIAL_ALIASES.get(upper, upper)


def effective_material_type(spec: dict[str, Any]) -> str:
    mtype = str(spec.get("material_type", "mc")).lower()
    if mtype != "mc":
        return mtype
    raw = str(spec.get("material", "STONE"))
    if raw.lower() in canonical_ids:
        return "slimefun"
    if re.search(r"[^\x00-\x7F]", raw):
        return "slimefun"
    if re.search(r"[A-Z]", raw) and "_" in raw:
        return "slimefun"
    return "mc"


def load_yaml(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return data if isinstance(data, dict) else {}


def jstr(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)


def java_id(key: str) -> str:
    key = re.sub(r"[^\w]", "_", key, flags=re.UNICODE)
    key = re.sub(r"_+", "_", key).strip("_")
    if not key or re.match(r"^\d", key):
        key = "_" + (key or "item")
    return key


def register_id(item_id: str) -> str:
    if not item_id:
        return item_id
    low = item_id.lower()
    if low in canonical_ids and canonical_ids[low] != item_id:
        print(f"[warn] ID case conflict: {canonical_ids[low]} vs {item_id}")
    canonical_ids.setdefault(low, item_id)
    return canonical_ids[low]


def as_map(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def int_list(values: Any) -> list[int]:
    if not isinstance(values, list):
        return []
    out = []
    for v in values:
        try:
            out.append(int(v))
        except (TypeError, ValueError):
            pass
    return out


def write_java(relative: str, content: str) -> None:
    path = GEN_JAVA / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  wrote {path.relative_to(ROOT)}")


def header(extra_imports: list[str] | None = None) -> str:
    imports = [
        "package com.linkany121.gltc.generated;",
        "",
        "import com.linkany121.gltc.GltcPlugin;",
        "import com.linkany121.gltc.item.GltcItemBuilder;",
        "import com.linkany121.gltc.util.IdCanonicalizer;",
        "import com.linkany121.gltc.util.RecipeUtil;",
        "import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;",
        "import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;",
        "import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;",
        "import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;",
        "import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;",
        "import io.github.thebusybiscuit.slimefun4.implementation.SlimefunItems;",
        "import org.bukkit.inventory.ItemStack;",
    ]
    if extra_imports:
        imports.extend(extra_imports)
    imports.extend(["", "/** Auto-generated. Do not edit. */", ""])
    return "\n".join(imports)


def item_stack_expr(spec: dict[str, Any], amount: int = 1) -> str:
    spec = dict(spec)
    if amount > 1:
        spec["amount"] = amount
    mtype = effective_material_type(spec)
    if mtype == "slimefun":
        mid = register_id(str(spec.get("material", "STONE")))
        amt = int(spec.get("amount", amount))
        return f"RecipeUtil.deferredSlimefun({jstr(mid)}, {amt})"
    if mtype == "saveditem":
        path = jstr(str(spec.get("material", "missing")))
        return f"com.linkany121.gltc.item.SavedItemLoader.get({path})"
    mat = resolve_mc_material(str(spec.get("material", "STONE")))
    amt = int(spec.get("amount", amount))
    return f"new org.bukkit.inventory.ItemStack(org.bukkit.Material.{mat}, {amt})"


def crafting_recipe_expr(recipe: dict[str, Any]) -> str:
    return "RecipeUtil.resolveCraftingRecipe(" + deferred_recipe_expr(recipe) + ")"


def deferred_recipe_expr(recipe: dict[str, Any]) -> str:
    slots = ["null"] * 9
    for k, v in recipe.items():
        try:
            idx = int(k) - 1
        except ValueError:
            continue
        if 0 <= idx <= 8:
            slots[idx] = item_stack_expr(as_map(v))
    return "new Object[] { " + ", ".join(slots) + " }"


def strip_item_name(item: dict[str, Any]) -> str:
    name = str(item.get("name", ""))
    name = re.sub(r"&#[0-9a-fA-F]{6}", "", name)
    name = re.sub(r"&[0-9a-ko-r]", "", name, flags=re.I)
    return name


def item_registration_order(entries: list[tuple[str, dict[str, Any]]]) -> list[tuple[str, dict[str, Any]]]:
    # Preserve YAML order, but move "存档信息" items to the front within each item_group.
    groups: dict[str, list[tuple[str, dict[str, Any]]]] = {}
    group_order: list[str] = []
    for entry in entries:
        key, cfg = entry
        group = str(cfg.get("item_group", "A_A1"))
        if group not in groups:
            groups[group] = []
            group_order.append(group)
        groups[group].append(entry)

    result: list[tuple[str, dict[str, Any]]] = []
    for group in group_order:
        archive: list[tuple[str, dict[str, Any]]] = []
        regular: list[tuple[str, dict[str, Any]]] = []
        for entry in groups[group]:
            _, cfg = entry
            item = as_map(cfg.get("item"))
            plain = strip_item_name(item)
            if "存档信息" in plain:
                archive.append(entry)
            else:
                regular.append(entry)
        result.extend(archive + regular)
    return result


def machine_input_slots_expr(
    inputs: dict[str, Any],
    machine_inputs: list[int],
    template_slot: int | None = None,
) -> str:
    """Map YAML recipe input keys onto machine input slots.

    For template machines, keys without an explicit ``slot`` fill input slots
    excluding ``templateSlot`` (RSC: template is separate from craft inputs).
    """
    available = [s for s in machine_inputs if template_slot is None or s != template_slot]
    if not available:
        available = list(machine_inputs)

    parts = []
    auto_idx = 0
    for k in sorted(inputs.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
        spec = as_map(inputs[k])
        if "slot" in spec:
            try:
                menu_slot = int(spec["slot"])
            except (TypeError, ValueError):
                menu_slot = available[min(auto_idx, len(available) - 1)] if available else -1
        else:
            menu_slot = available[min(auto_idx, len(available) - 1)] if available else -1
            auto_idx += 1
        stack = item_stack_expr(spec)
        no_consume = bool(spec.get("noConsume"))
        parts.append(f"new RecipeUtil.GltcInputSlot({menu_slot}, {stack}, {str(no_consume).lower()})")
    if not parts:
        return "java.util.List.of()"
    return "java.util.List.of(" + ", ".join(parts) + ")"


def machine_output_slots_expr(outputs: dict[str, Any], machine_outputs: list[int]) -> str:
    parts = []
    for k in sorted(outputs.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
        try:
            idx = int(k) - 1
        except ValueError:
            continue
        menu_slot = machine_outputs[idx] if 0 <= idx < len(machine_outputs) else -1
        spec = as_map(outputs[k])
        stack = item_stack_expr(spec)
        chance = int(spec.get("chance", 100))
        parts.append(f"new RecipeUtil.GltcOutputSlot({menu_slot}, {stack}, {chance})")
    if not parts:
        return "java.util.List.of()"
    return "java.util.List.of(" + ", ".join(parts) + ")"


def input_list_expr(inputs: dict[str, Any]) -> str:
    items = []
    for k in sorted(inputs.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
        items.append(item_stack_expr(as_map(inputs[k])))
    return "java.util.List.of(" + ", ".join(items) + ")"


def output_list_expr(outputs: dict[str, Any]) -> str:
    parts = []
    for k in sorted(outputs.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
        spec = as_map(outputs[k])
        stack = item_stack_expr(spec)
        chance = int(spec.get("chance", 100))
        parts.append(f"new RecipeUtil.GltcOutputStack({stack}, {chance})")
    return "java.util.List.of(" + ", ".join(parts) + ")"


def group_field_name(key: str) -> str:
    return java_id(key)


def codegen_ids(all_ids: list[str]) -> None:
    lines = [
        header(),
        "public final class GltcIds {",
        "    private GltcIds() {}",
        "    public static void registerCanonicalIds() {",
    ]
    for item_id in sorted(set(all_ids)):
        if item_id:
            lines.append(f"        IdCanonicalizer.register({jstr(item_id)});")
    lines.append("    }")
    lines.append("}")
    write_java("GltcIds.java", "\n".join(lines) + "\n")


def find_menu_key(menus: dict[str, Any], machine_key: str) -> str | None:
    if machine_key in menus:
        return machine_key
    lower = machine_key.lower()
    for key in menus:
        if str(key).lower() == lower:
            return str(key)
    return None


def codegen_groups(source: Path) -> None:
    data = load_yaml(source / "groups.yml")
    nested = []
    subs = []
    for key, cfg in data.items():
        cfg = as_map(cfg)
        if cfg.get("type") == "nested":
            nested.append((key, cfg))
        elif cfg.get("type") in ("sub", "button"):
            subs.append((key, cfg))

    extra_imports = [
        "import io.github.thebusybiscuit.slimefun4.api.items.groups.NestedItemGroup;",
        "import io.github.thebusybiscuit.slimefun4.api.items.groups.SubItemGroup;",
        "import org.bukkit.NamespacedKey;",
    ]
    for key, _ in nested + subs:
        extra_imports.append(f"import com.linkany121.gltc.generated.groups.Groups_{group_field_name(key)};")

    lines = [
        header(extra_imports),
        "public final class GltcItemGroups {",
        "    private GltcItemGroups() {}",
    ]
    for key, cfg in nested:
        lines.append(f"    public static final NestedItemGroup {group_field_name(key)};")
    for key, cfg in subs:
        lines.append(f"    public static final SubItemGroup {group_field_name(key)};")
    lines.append("")
    lines.append("    static {")
    for key, cfg in nested:
        name = group_field_name(key)
        tier = int(cfg.get("tier", 0))
        lines.append(
            f"        {name} = new NestedItemGroup(new NamespacedKey(GltcPlugin.getInstance(), {jstr(key.lower())}), "
            f"Groups_{name}.icon(), {tier});"
        )
    for key, cfg in subs:
        name = group_field_name(key)
        parent = group_field_name(str(cfg.get("parent")))
        tier = int(cfg.get("tier", 0))
        lines.append(
            f"        {name} = new SubItemGroup(new NamespacedKey(GltcPlugin.getInstance(), {jstr(key.lower())}), "
            f"{parent}, Groups_{name}.icon(), {tier});"
        )
    lines.append("    }")
    lines.append("")
    lines.append("    public static void register(SlimefunAddon addon) {")
    for key, _ in nested + subs:
        lines.append(f"        {group_field_name(key)}.register(addon);")
    lines.append("    }")
    lines.append("}")

    write_java("GltcItemGroups.java", "\n".join(lines) + "\n")

    for key, cfg in nested + subs:
        name = group_field_name(key)
        item = as_map(cfg.get("item"))
        group_helper(name, item)


def icon_helper(class_name: str, item: dict[str, Any], subpackage: str = "groups") -> None:
    entries = map_item_entries(item)
    lines = [
        f"package com.linkany121.gltc.generated.{subpackage};",
        "",
        "import com.linkany121.gltc.item.GltcItemBuilder;",
        "import org.bukkit.inventory.ItemStack;",
        "",
        f"public final class {class_name} {{",
        f"    private {class_name}() {{}}",
        f"    public static ItemStack icon() {{ return GltcItemBuilder.stack({class_name}.DATA); }}",
        f"    @SuppressWarnings(\"unchecked\")",
        f"    public static final java.util.Map<String, Object> DATA = java.util.Map.ofEntries(",
    ]
    if entries:
        lines.append(",\n".join(entries))
    lines.append("    );")
    lines.append("}")
    path = GEN_JAVA / subpackage / f"{class_name}.java"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def group_helper(name: str, item: dict[str, Any]) -> None:
    icon_helper(f"Groups_{name}", item, "groups")


def map_item_entries(item: dict[str, Any], prefix: str = "") -> list[str]:
    entries = []
    for k, v in item.items():
        key = jstr(k)
        if isinstance(v, list):
            lore_items = ", ".join(jstr(str(x)) for x in v)
            entries.append(f"        java.util.Map.entry({key}, java.util.List.of({lore_items}))")
        elif isinstance(v, bool):
            entries.append(f"        java.util.Map.entry({key}, {str(v).lower()})")
        elif isinstance(v, (int, float)):
            entries.append(f"        java.util.Map.entry({key}, {v})")
        elif isinstance(v, str):
            entries.append(f"        java.util.Map.entry({key}, {jstr(v)})")
    return entries


def codegen_recipe_types(source: Path) -> None:
    data = load_yaml(source / "recipe_types.yml")
    extra = [
        "import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;",
        "import org.bukkit.NamespacedKey;",
    ]
    pf_keys = [k for k in data if str(k).startswith("PF_")]
    for key in pf_keys:
        extra.append(f"import com.linkany121.gltc.generated.recipetypes.RecipeTypeIcon_{java_id(key)};")
    lines = [
        header(extra),
        "public final class GltcRecipeTypes {",
        "    private GltcRecipeTypes() {}",
        "    private static final java.util.Map<String, RecipeType> BY_NAME = new java.util.HashMap<>();",
    ]
    for key, cfg in data.items():
        if not str(key).startswith("PF_"):
            continue
        register_id(key)
        name = java_id(key)
        ns = key.lower()
        lines.append(f"    public static final RecipeType {name};")
    lines.append("")
    lines.append("    static {")
    for key, cfg in data.items():
        if not str(key).startswith("PF_"):
            continue
        name = java_id(key)
        cfg = as_map(cfg)
        helper = f"RecipeTypeIcon_{name}"
        lines.append(
            f"        {name} = new RecipeType(new NamespacedKey(GltcPlugin.getInstance(), {jstr(key.lower())}), "
            f"{helper}.icon());"
        )
        lines.append(f"        BY_NAME.put({jstr(key)}, {name});")
    lines.append("    }")
    lines.append("")
    lines.append("    public static void register(SlimefunAddon addon) {}")
    lines.append("")
    lines.append("    public static RecipeType byName(String name) {")
    lines.append("        RecipeType type = BY_NAME.get(name);")
    lines.append("        if (type != null) return type;")
    lines.append("        throw new IllegalArgumentException(\"Unknown recipe type: \" + name);")
    lines.append("    }")
    lines.append("}")
    write_java("GltcRecipeTypes.java", "\n".join(lines) + "\n")

    for key, cfg in data.items():
        if not str(key).startswith("PF_"):
            continue
        name = java_id(key)
        item = dict(cfg)
        if "material" in item and "material_type" not in item:
            item["material_type"] = "mc"
        icon_helper(f"RecipeTypeIcon_{name}", item, "recipetypes")


def item_imports(keys: list[str]) -> list[str]:
    return [f"import com.linkany121.gltc.generated.items.Items_{java_id(k)};" for k in keys]


def codegen_items(source: Path, scripted: bool) -> None:
    data = load_yaml(source / "items.yml")
    class_name = "GltcScriptedItemsRegistry" if scripted else "GltcItemsRegistry"
    entries: list[tuple[str, dict[str, Any]]] = []
    for key, cfg in data.items():
        cfg = as_map(cfg)
        has_script = "script" in cfg
        if scripted != has_script:
            continue
        entries.append((key, cfg))
        item = as_map(cfg.get("item"))
        write_item_data_helper(f"Items_{java_id(key)}", item)

    entries = item_registration_order(entries)
    entries_keys = [key for key, _ in entries]

    item_class = "com.linkany121.gltc.script.GltcScriptedItem" if scripted else "com.linkany121.gltc.item.GltcSlimefunItem"
    simple_class = "GltcScriptedItem" if scripted else "GltcSlimefunItem"
    extra = item_imports(entries_keys)
    extra.append(f"import {item_class};")
    lines = [
        header(extra),
        f"public final class {class_name} {{",
        "    private " + class_name + "() {}",
        "    public static void register(SlimefunAddon addon) {",
        f"        java.util.List<{item_class}> pending = new java.util.ArrayList<>();",
    ]
    count = 0
    for key, cfg in entries:
        register_id(key)
        group = group_field_name(str(cfg.get("item_group", "A_A1")))
        recipe_type = str(cfg.get("recipe_type", "NULL"))
        recipe = as_map(cfg.get("recipe"))
        amount = int(cfg.get("amount", 1))
        rt = f"RecipeUtil.resolveRecipeType({jstr(recipe_type)})"
        rec = deferred_recipe_expr(recipe) if recipe else "new Object[0]"
        out = f"GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA, {amount})"
        if scripted:
            script = str(cfg.get("script"))
            script_manifest["items"].append({"slimefunId": key, "script": script})
            lines.append(f"        // script: {script}")
        lines.append(
            f"        pending.add(new {simple_class}(GltcItemGroups.{group}, "
            f"GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA, {amount}), "
            f"{rt}, {rec}, {out}));"
        )
        count += 1
    lines.append(f"        for ({item_class} item : pending) {{")
    lines.append("            item.register(addon);")
    lines.append("        }")
    lines.append("    }")
    lines.append("}")
    if not scripted:
        write_java(f"{class_name}.java", "\n".join(lines) + "\n")
    print(f"  {class_name}: {count} entries")


def write_item_data_helper(class_name: str, item: dict[str, Any]) -> None:
    path = GEN_JAVA / "items" / f"{class_name}.java"
    entries = map_item_entries(item)
    lines = [
        "package com.linkany121.gltc.generated.items;",
        "",
        "public final class " + class_name + " {",
        "    private " + class_name + "() {}",
        "    @SuppressWarnings(\"unchecked\")",
        "    public static final java.util.Map<String, Object> DATA = java.util.Map.ofEntries(",
    ]
    if entries:
        lines.append(",\n".join(entries))
    lines.append("    );")
    lines.append("}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def machine_common_fields(cfg: dict[str, Any]) -> dict[str, Any]:
    return {
        "group": group_field_name(str(cfg.get("item_group", "A_A1"))),
        "recipe_type": str(cfg.get("recipe_type", "NULL")),
        "recipe": as_map(cfg.get("recipe")),
        "capacity": int(cfg.get("capacity", cfg.get("click", 0) or 100)),
        "energy": int(cfg.get("energyPerCraft", cfg.get("consumption", cfg.get("click", 0)) or 0)),
        "input": int_list(cfg.get("input")),
        "output": int_list(cfg.get("output")),
    }


def codegen_recipe_machines(source: Path) -> None:
    data = load_yaml(source / "recipe_machines.yml")
    menus = load_yaml(source / "menus.yml")
    lines = [
        header([
            "import com.linkany121.gltc.machine.GltcRecipeMachine;",
            "import com.linkany121.gltc.util.GltcMenuData;",
        ]),
        "public final class GltcRecipeMachinesRegistry {",
        "    private GltcRecipeMachinesRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        write_machine_class(key, cfg, menus, "GltcRecipeMachine")
        lines.append(f"        com.linkany121.gltc.generated.machines.Machines_{java_id(key)}.register(addon);")
    lines.append("    }")
    lines.append("}")
    write_java("GltcRecipeMachinesRegistry.java", "\n".join(lines) + "\n")


def flatten_recipes(recipes: dict[str, Any]) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    for _, value in recipes.items():
        if not isinstance(value, dict):
            continue
        if value.get("forDisplay"):
            continue
        if "seconds" in value or "input" in value or "output" in value:
            found.append(value)
        else:
            found.extend(flatten_recipes(value))
    return found


def write_machine_class(key: str, cfg: dict[str, Any], menus: dict, base: str) -> None:
    common = machine_common_fields(cfg)
    class_name = f"Machines_{java_id(key)}"
    menu_key = find_menu_key(menus, key) or key
    menu = as_map(menus.get(menu_key))
    menu_title = str(menu.get("title", key))
    recipes = as_map(cfg.get("recipes"))
    rec = common["recipe"]
    rt = f"RecipeUtil.resolveRecipeType({jstr(common['recipe_type'])})"
    deferred_rec = deferred_recipe_expr(rec) if rec else "new Object[0]"
    recipe_arr = "RecipeUtil.resolveCraftingRecipe(new Object[0])"
    out = f"GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA)"
    item = as_map(cfg.get("item"))
    write_item_data_helper(f"Items_{java_id(key)}", item)

    input_slots = ", ".join(str(i) for i in common["input"]) or "0"
    output_slots = ", ".join(str(i) for i in common["output"]) or "0"

    ctor_args = [
        f"            GltcItemGroups.{common['group']}",
        f"            GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA)",
        f"            {rt}",
        f"            {recipe_arr}",
        f"            {out}",
        f"            {common['capacity']}",
        f"            {common['energy']}",
        f"            RecipeUtil.intArray(java.util.List.of({input_slots}))",
        f"            RecipeUtil.intArray(java.util.List.of({output_slots}))",
    ]
    if base == "GltcTemplateMachine":
        ctor_args.extend([
            f"            {int(cfg.get('templateSlot', 0))}",
            f"            {str(bool(cfg.get('fasterIfMoreTemplates'))).lower()}",
            f"            {str(bool(cfg.get('moreOutputIfMoreTemplates'))).lower()}",
        ])

    lines = [
        "package com.linkany121.gltc.generated.machines;",
        "",
        "import com.linkany121.gltc.generated.GltcItemGroups;",
        "import com.linkany121.gltc.generated.items.Items_" + java_id(key) + ";",
        "import com.linkany121.gltc.generated.menus.GltcMenuData_" + java_id(menu_key) + ";",
        "import com.linkany121.gltc.item.GltcItemBuilder;",
        "import com.linkany121.gltc.machine." + base + ";",
        "import com.linkany121.gltc.util.GltcMenuData;",
        "import com.linkany121.gltc.util.RecipeUtil;",
        "import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;",
        "import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;",
        "import org.bukkit.inventory.ItemStack;",
        "",
        f"public final class {class_name} {{",
        f"    private {class_name}() {{}}",
        "    public static void register(SlimefunAddon addon) {",
        f"        {base} machine = {base}.create(",
        ",\n".join(ctor_args),
        "        );",
    ]
    if base == "GltcWorkbench":
        click = int(cfg.get("click", 25))
        lines.append(f"        machine.setCraftClickSlot({click});")
    for recipe in flatten_recipes(recipes):
        seconds = int(recipe.get("seconds", 1))
        inputs = as_map(recipe.get("input"))
        outputs = as_map(recipe.get("output"))
        if not inputs or not outputs:
            continue
        no_consume = bool(recipe.get("noConsume"))
        method = "addInstantRecipe" if base == "GltcWorkbench" and seconds == 0 else "addGltcRecipe"
        template_slot = int(cfg.get("templateSlot", 0)) if base == "GltcTemplateMachine" else None
        if method == "addInstantRecipe":
            lines.append(
                f"        machine.addInstantRecipe({machine_input_slots_expr(inputs, common['input'], template_slot)}, "
                f"{machine_output_slots_expr(outputs, common['output'])}, {str(no_consume).lower()});"
            )
        else:
            lines.append(
                f"        machine.addGltcRecipe({seconds}, {machine_input_slots_expr(inputs, common['input'], template_slot)}, "
                f"{machine_output_slots_expr(outputs, common['output'])}, {str(no_consume).lower()});"
            )
    lines.append(f"        machine.setDeferredCraftingRecipe({deferred_rec});")
    lines.append(f"        GltcMenuData.register({jstr(key)}, GltcMenuData_{java_id(menu_key)}.DATA);")
    lines.append(f"        machine.applyMenu({jstr(key)}, {jstr(menu_title)});")
    lines.append("        machine.register(addon);")
    lines.append("    }")
    lines.append("}")
    write_java(f"machines/{class_name}.java", "\n".join(lines) + "\n")
    write_menu_data_helper(key)


def write_menu_data_helper(key: str) -> None:
    # Menus registered from YAML at runtime via GltcMenuDataInit generated separately
    pass


def codegen_workbenches(source: Path) -> None:
    data = load_yaml(source / "workbenches.yml")
    menus = load_yaml(source / "menus.yml")
    lines = [
        header(["import com.linkany121.gltc.machine.GltcWorkbench;"]),
        "public final class GltcWorkbenchesRegistry {",
        "    private GltcWorkbenchesRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    for key, cfg in data.items():
        if not isinstance(cfg, dict) or key.startswith("#"):
            continue
        register_id(key)
        write_machine_class(key, cfg, menus, "GltcWorkbench")
        lines.append(f"        com.linkany121.gltc.generated.machines.Machines_{java_id(key)}.register(addon);")
    lines.append("    }")
    lines.append("}")
    write_java("GltcWorkbenchesRegistry.java", "\n".join(lines) + "\n")


def codegen_generators(source: Path) -> None:
    data = load_yaml(source / "generators.yml")
    menus = load_yaml(source / "menus.yml")
    gen_keys: list[str] = []
    body_lines: list[str] = []
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        gen_keys.append(key)
        common = machine_common_fields(cfg)
        item = as_map(cfg.get("item"))
        write_item_data_helper(f"Items_{java_id(key)}", item)
        class_name = f"Generators_{java_id(key)}"
        menu_key = find_menu_key(menus, key) or key
        menu = as_map(menus.get(menu_key))
        menu_title = str(menu.get("title", key))
        rec = common["recipe"]
        rt = f"RecipeUtil.resolveRecipeType({jstr(common['recipe_type'])})"
        deferred_rec = deferred_recipe_expr(rec) if rec else "new Object[0]"
        recipe_arr = "RecipeUtil.resolveCraftingRecipe(new Object[0])"
        out = f"GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA)"
        production = int(cfg.get("production", 1))
        input_slots = ", ".join(str(i) for i in common["input"]) or "0"
        output_slots = ", ".join(str(i) for i in common["output"]) or "0"
        gen_lines = [
            "package com.linkany121.gltc.generated.generators;",
            "",
            "import com.linkany121.gltc.generated.GltcItemGroups;",
            "import com.linkany121.gltc.generated.items.Items_" + java_id(key) + ";",
            "import com.linkany121.gltc.generated.menus.GltcMenuData_" + java_id(menu_key) + ";",
            "import com.linkany121.gltc.item.GltcItemBuilder;",
            "import com.linkany121.gltc.machine.GltcGenerator;",
            "import com.linkany121.gltc.util.GltcMenuData;",
            "import com.linkany121.gltc.util.RecipeUtil;",
            "import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;",
            "import org.bukkit.inventory.ItemStack;",
            "",
            f"public final class {class_name} {{",
            f"    private {class_name}() {{}}",
            "    public static void register(SlimefunAddon addon) {",
            "        GltcGenerator gen = GltcGenerator.create(",
            f"            GltcItemGroups.{common['group']},",
            f"            GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA),",
            f"            {rt},",
            f"            {recipe_arr},",
            f"            {out},",
            f"            {common['capacity']},",
            f"            {production},",
            f"            RecipeUtil.intArray(java.util.List.of({input_slots})),",
            f"            RecipeUtil.intArray(java.util.List.of({output_slots}))",
            "        );",
        ]
        fuels = as_map(cfg.get("fuels"))
        for _, fuel in fuels.items():
            fuel = as_map(fuel)
            seconds = int(fuel.get("seconds", 1))
            item_spec = as_map(fuel.get("item"))
            # Do not resolve eagerly — fuel items (e.g. mob-drop IDs) may register after generators.
            gen_lines.append(f"        gen.addFuel({seconds}, {item_stack_expr(item_spec)});")
        gen_lines.append(f"        gen.setDeferredCraftingRecipe({deferred_rec});")
        gen_lines.append(f"        GltcMenuData.register({jstr(key)}, GltcMenuData_{java_id(menu_key)}.DATA);")
        gen_lines.append(f"        gen.applyMenu({jstr(key)}, {jstr(menu_title)});")
        gen_lines.append("        gen.register(addon);")
        gen_lines.append("    }")
        gen_lines.append("}")
        write_java(f"generators/{class_name}.java", "\n".join(gen_lines) + "\n")
        body_lines.append(f"        {class_name}.register(addon);")
    extra = ["import com.linkany121.gltc.machine.GltcGenerator;"]
    extra.extend(
        f"import com.linkany121.gltc.generated.generators.Generators_{java_id(key)};"
        for key in gen_keys
    )
    lines = [
        header(extra),
        "public final class GltcGeneratorsRegistry {",
        "    private GltcGeneratorsRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    lines.extend(body_lines)
    lines.append("    }")
    lines.append("}")
    write_java("GltcGeneratorsRegistry.java", "\n".join(lines) + "\n")


def codegen_template_machines(source: Path) -> None:
    data = load_yaml(source / "template_machines.yml")
    menus = load_yaml(source / "menus.yml")
    lines = [
        header(["import com.linkany121.gltc.machine.GltcTemplateMachine;"]),
        "public final class GltcTemplateMachinesRegistry {",
        "    private GltcTemplateMachinesRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        write_machine_class(key, cfg, menus, "GltcTemplateMachine")
        lines.append(f"        com.linkany121.gltc.generated.machines.Machines_{java_id(key)}.register(addon);")
    lines.append("    }")
    lines.append("}")
    write_java("GltcTemplateMachinesRegistry.java", "\n".join(lines) + "\n")


def codegen_multiblock(source: Path) -> None:
    data = load_yaml(source / "super_multi_block_machines.yml")
    menus = load_yaml(source / "menus.yml")
    lines = [
        header(["import com.linkany121.gltc.machine.GltcMultiBlockMachine;"]),
        "public final class GltcMultiBlockRegistry {",
        "    private GltcMultiBlockRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        write_machine_class(key, cfg, menus, "GltcMultiBlockMachine")
        lines.append(f"        com.linkany121.gltc.generated.machines.Machines_{java_id(key)}.register(addon);")
    lines.append("    }")
    lines.append("}")
    write_java("GltcMultiBlockRegistry.java", "\n".join(lines) + "\n")


def mb_recipe_input_map(inputs: dict[str, Any]) -> str:
    entries = []
    for k in sorted(inputs.keys(), key=lambda x: int(x) if str(x).isdigit() else 0):
        slot = int(k)
        spec = item_stack_expr(as_map(inputs[k]))
        entries.append(f"java.util.Map.entry({slot}, {spec})")
    if not entries:
        return "java.util.Map.of()"
    return "java.util.Map.ofEntries(" + ", ".join(entries) + ")"


def write_simple_mb_class(key: str, cfg: dict[str, Any]) -> None:
    item = as_map(cfg.get("item"))
    write_item_data_helper(f"Items_{java_id(key)}", item)
    structure = as_map(cfg.get("recipe"))
    work = int(cfg.get("work", 1))
    recipes = as_map(cfg.get("recipes"))

    lines = [
        "package com.linkany121.gltc.generated.simplemb;",
        "",
        "import com.linkany121.gltc.generated.GltcItemGroups;",
        f"import com.linkany121.gltc.generated.items.Items_{java_id(key)};",
        "import com.linkany121.gltc.item.GltcItemBuilder;",
        "import com.linkany121.gltc.machine.GltcSimpleMultiBlock;",
        "import com.linkany121.gltc.util.RecipeUtil;",
        "import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;",
        "",
        "public final class SimpleMb_" + java_id(key) + " {",
        "    private SimpleMb_" + java_id(key) + "() {}",
        "    public static void register(SlimefunAddon addon) {",
        "        GltcSimpleMultiBlock machine = new GltcSimpleMultiBlock(",
        f"            GltcItemGroups.{group_field_name(str(cfg.get('item_group', 'A_A1')))},",
        f"            GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA),",
        f"            {crafting_recipe_expr(structure) if structure else 'new org.bukkit.inventory.ItemStack[0]'},",
        f"            {work}",
        "        );",
    ]
    for recipe_key, recipe_cfg in recipes.items():
        if not isinstance(recipe_cfg, dict):
            continue
        inputs = as_map(recipe_cfg.get("input"))
        output = as_map(recipe_cfg.get("output"))
        if not inputs or not output:
            continue
        lines.append(
            f"        machine.addMbRecipe({mb_recipe_input_map(inputs)}, "
            f"{item_stack_expr(output)});"
        )
    lines.extend([
        "        machine.register(addon);",
        "    }",
        "}",
    ])
    path = GEN_JAVA / "simplemb" / f"SimpleMb_{java_id(key)}.java"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def codegen_simple_mb(source: Path) -> None:
    data = load_yaml(source / "mb_machines.yml")
    mb_keys = [key for key, cfg in data.items() if isinstance(cfg, dict)]
    imports = [f"import com.linkany121.gltc.generated.simplemb.SimpleMb_{java_id(key)};" for key in mb_keys]
    lines = [
        header(imports),
        "public final class GltcSimpleMultiBlockRegistry {",
        "    private GltcSimpleMultiBlockRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        write_simple_mb_class(key, cfg)
        lines.append(f"        SimpleMb_{java_id(key)}.register(addon);")
    lines.append("    }")
    lines.append("}")
    write_java("GltcSimpleMultiBlockRegistry.java", "\n".join(lines) + "\n")


def codegen_foods(source: Path) -> None:
    data = load_yaml(source / "foods.yml")
    food_keys: list[str] = []
    body_lines: list[str] = []
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        food_keys.append(key)
        group = group_field_name(str(cfg.get("item_group", "A_H1b1")))
        item = as_map(cfg.get("item"))
        write_item_data_helper(f"Items_{java_id(key)}", item)
        recipe_type = str(cfg.get("recipe_type", "NULL"))
        recipe = as_map(cfg.get("recipe"))
        nutrition = int(cfg.get("nutrition", 0))
        rt = f"RecipeUtil.resolveRecipeType({jstr(recipe_type)})"
        rec = crafting_recipe_expr(recipe) if recipe else "new ItemStack[0]"
        out = f"GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA)"
        body_lines.append(
            f"        new GltcFoodItem(GltcItemGroups.{group}, "
            f"GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA), "
            f"{rt}, {rec}, {out}, {nutrition}).register(addon);"
        )
    extra = [
        "import com.linkany121.gltc.generated.GltcItemGroups;",
        "import com.linkany121.gltc.food.GltcFoodItem;",
    ]
    extra.extend(item_imports(food_keys))
    lines = [
        header(extra),
        "public final class GltcFoodsRegistry {",
        "    private GltcFoodsRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    lines.extend(body_lines)
    lines.append("    }")
    lines.append("}")
    write_java("GltcFoodsRegistry.java", "\n".join(lines) + "\n")


def codegen_armors(source: Path) -> None:
    data = load_yaml(source / "armors.yml")
    piece_ids: list[str] = []
    body_lines: list[str] = []
    for set_key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        cfg = as_map(cfg)
        group = group_field_name(str(cfg.get("item_group", "A_G1b")))
        for piece in ("helmet", "chestplate", "leggings", "boots"):
            piece_cfg = as_map(cfg.get(piece))
            if not piece_cfg:
                continue
            piece_id = register_id(str(piece_cfg.get("id", f"{set_key}_{piece}")))
            piece_ids.append(piece_id)
            item_map = {
                "material_type": piece_cfg.get("material_type", "saveditem"),
                "material": piece_cfg.get("material", ""),
                "name": piece_cfg.get("name", piece_id),
                "lore": piece_cfg.get("lore", []),
            }
            write_item_data_helper(f"Items_{java_id(piece_id)}", item_map)
            recipe_type = str(piece_cfg.get("recipe_type", "NULL"))
            recipe = as_map(piece_cfg.get("recipe"))
            rt = f"RecipeUtil.resolveRecipeType({jstr(recipe_type)})"
            rec = crafting_recipe_expr(recipe) if recipe else "new ItemStack[0]"
            effects = piece_cfg.get("potion_effects") or []
            if effects:
                effect_args = ", ".join(jstr(str(e)) for e in effects)
                effects_expr = f"GltcArmorEffects.of({effect_args})"
            else:
                effects_expr = "null"
            body_lines.append(
                f"        new SlimefunArmorPiece(GltcItemGroups.{group}, "
                f"GltcItemBuilder.slimefunStack({jstr(piece_id)}, Items_{java_id(piece_id)}.DATA), "
                f"{rt}, {rec}, {effects_expr}).register(addon);"
            )
    extra = [
        "import com.linkany121.gltc.generated.GltcItemGroups;",
        "import com.linkany121.gltc.util.GltcArmorEffects;",
        "import io.github.thebusybiscuit.slimefun4.implementation.items.armor.SlimefunArmorPiece;",
    ]
    extra.extend(item_imports(piece_ids))
    lines = [
        header(extra),
        "public final class GltcArmorSetsRegistry {",
        "    private GltcArmorSetsRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    lines.extend(body_lines)
    lines.append("    }")
    lines.append("}")
    write_java("GltcArmorSetsRegistry.java", "\n".join(lines) + "\n")


def codegen_mob_drops(source: Path) -> None:
    data = load_yaml(source / "mob_drops.yml")
    rule_keys: list[str] = []
    rules: list[str] = []
    register_body: list[str] = []
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        rule_keys.append(key)
        register_id(key)
        group = group_field_name(str(cfg.get("item_group", "A_E1a")))
        item = as_map(cfg.get("item"))
        write_item_data_helper(f"Items_{java_id(key)}", item)
        entity = str(cfg.get("entity", "ZOMBIE")).upper()
        chance = int(cfg.get("chance", 100))
        amount = int(cfg.get("amount", 1))
        recipe_type = str(cfg.get("recipe_type", "NULL"))
        recipe = as_map(cfg.get("recipe"))
        rt = f"RecipeUtil.resolveRecipeType({jstr(recipe_type)})"
        rec = crafting_recipe_expr(recipe) if recipe else "new ItemStack[0]"
        out = f"GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA)"
        register_body.append(
            f"        new SlimefunItem(GltcItemGroups.{group}, "
            f"GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA), "
            f"{rt}, {rec}, {out}).register(addon);"
        )
        rules.append(
            f"        new Rule(EntityType.{entity}, {chance}, {jstr(register_id(key))}, {amount})"
        )
    register_imports = item_imports(rule_keys)
    register_imports.append("import com.linkany121.gltc.generated.GltcItemGroups;")
    register_lines = [
        header(register_imports),
        "public final class GltcMobDropsRegistry {",
        "    private GltcMobDropsRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    register_lines.extend(register_body)
    rule_imports = item_imports(rule_keys)
    rule_imports.extend([
        "import org.bukkit.entity.EntityType;",
    ])
    rule_lines = [
        header(rule_imports),
        "public final class GltcMobDropRules {",
        "    private GltcMobDropRules() {}",
        "    public record Rule(EntityType entityType, int chance, String itemId, int amount) {}",
        "    public static final java.util.List<Rule> RULES = java.util.List.of(",
    ]
    if rules:
        rule_lines.extend([rules[i] + ("," if i < len(rules) - 1 else "") for i in range(len(rules))])
    rule_lines.append("    );")
    rule_lines.append("}")
    register_lines.append("    }")
    register_lines.append("}")
    write_java("GltcMobDropsRegistry.java", "\n".join(register_lines) + "\n")
    write_java("GltcMobDropRules.java", "\n".join(rule_lines) + "\n")


def parse_drop_amount(raw: Any) -> tuple[int, int]:
    text = str(raw or "1")
    if "-" in text:
        left, right = text.split("-", 1)
        return int(left.strip()), int(right.strip())
    amount = int(text)
    return amount, amount


def codegen_block_drops(source: Path) -> None:
    data = load_yaml(source / "items.yml")
    rules: list[str] = []
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        drop_from = cfg.get("drop_from")
        if not drop_from:
            continue
        register_id(key)
        material = str(drop_from).upper()
        chance = int(cfg.get("drop_chance", 100))
        min_amount, max_amount = parse_drop_amount(cfg.get("drop_amount", 1))
        rules.append(
            f"        new Rule(org.bukkit.Material.{material}, {chance}, {jstr(register_id(key))}, {min_amount}, {max_amount}, {chance})"
        )

    lines = [
        header(["import org.bukkit.Material;"]),
        "public final class GltcBlockDropRules {",
        "    private GltcBlockDropRules() {}",
        "    public record Rule(Material material, int chance, String itemId, int minAmount, int maxAmount, int weight) {",
        "        public int rollAmount() {",
        "            if (minAmount >= maxAmount) {",
        "                return minAmount;",
        "            }",
        "            return java.util.concurrent.ThreadLocalRandom.current().nextInt(minAmount, maxAmount + 1);",
        "        }",
        "    }",
        "    public static final java.util.List<Rule> RULES = java.util.List.of(",
    ]
    if rules:
        lines.extend([rules[i] + ("," if i < len(rules) - 1 else "") for i in range(len(rules))])
    lines.append("    );")
    lines.append("}")
    write_java("GltcBlockDropRules.java", "\n".join(lines) + "\n")


def codegen_supers(source: Path) -> None:
    data = load_yaml(source / "supers.yml")
    keys = [key for key, cfg in data.items() if isinstance(cfg, dict)]
    extra = item_imports(keys)
    extra.extend([
        "import com.linkany121.gltc.generated.GltcItemGroups;",
        "import io.github.thebusybiscuit.slimefun4.implementation.items.electric.EnergyConnector;",
        "import io.github.thebusybiscuit.slimefun4.implementation.items.electric.EnergyRegulator;",
    ])
    lines = [
        header(extra),
        "public final class GltcSupers {",
        "    private GltcSupers() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        group = group_field_name(str(cfg.get("item_group", "A_B2")))
        item = as_map(cfg.get("item"))
        write_item_data_helper(f"Items_{java_id(key)}", item)
        recipe_type = str(cfg.get("recipe_type", "NULL"))
        recipe = as_map(cfg.get("recipe"))
        rt = f"RecipeUtil.resolveRecipeType({jstr(recipe_type)})"
        rec = crafting_recipe_expr(recipe) if recipe else "new ItemStack[0]"
        clazz = str(cfg.get("class", ""))
        stack = f"GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA)"
        if "EnergyRegulator" in clazz:
            lines.append(
                f"        new EnergyRegulator(GltcItemGroups.{group}, {stack}, {rt}, {rec}).register(addon);"
            )
        elif "EnergyConnector" in clazz:
            lines.append(
                f"        new EnergyConnector(GltcItemGroups.{group}, {stack}, {rt}, {rec}, {stack}).register(addon);"
            )
        else:
            lines.append(
                f"        new SlimefunItem(GltcItemGroups.{group}, {stack}, {rt}, {rec}, {stack}).register(addon);"
            )
    lines.append("    }")
    lines.append("}")
    write_java("GltcSupers.java", "\n".join(lines) + "\n")


def codegen_scripted_machines(source: Path) -> None:
    data = load_yaml(source / "machines.yml")
    menus = load_yaml(source / "menus.yml")
    items = load_yaml(source / "items.yml")

    import_keys: list[str] = []
    for key, cfg in items.items():
        if isinstance(cfg, dict) and "script" in cfg:
            import_keys.append(key)
    for key, cfg in data.items():
        if isinstance(cfg, dict) and cfg.get("script"):
            import_keys.append(key)

    extra = item_imports(import_keys)
    extra.extend([
        "import com.linkany121.gltc.generated.GltcItemGroups;",
        "import com.linkany121.gltc.script.GltcScriptedMachine;",
    ])
    lines = [
        header(extra),
        "public final class GltcScriptedRegistry {",
        "    private GltcScriptedRegistry() {}",
        "    public static void register(SlimefunAddon addon) {",
    ]
    # scripted items registry merged here
    scripted_entries: list[tuple[str, dict[str, Any]]] = []
    for key, cfg in items.items():
        cfg = as_map(cfg)
        if "script" not in cfg:
            continue
        scripted_entries.append((key, cfg))
    scripted_entries = item_registration_order(scripted_entries)

    lines.append("        java.util.List<com.linkany121.gltc.script.GltcScriptedItem> __scriptedItems = new java.util.ArrayList<>();")
    for key, cfg in scripted_entries:
        register_id(key)
        group = group_field_name(str(cfg.get("item_group", "A_A1")))
        item = as_map(cfg.get("item"))
        write_item_data_helper(f"Items_{java_id(key)}", item)
        recipe_type = str(cfg.get("recipe_type", "NULL"))
        recipe = as_map(cfg.get("recipe"))
        amount = int(cfg.get("amount", 1))
        script = str(cfg.get("script"))
        script_manifest["items"].append({"slimefunId": key, "script": script})
        rt = f"RecipeUtil.resolveRecipeType({jstr(recipe_type)})"
        rec = deferred_recipe_expr(recipe) if recipe else "new Object[0]"
        out = f"GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA, {amount})"
        lines.append(f"        // item script: {script}")
        lines.append(
            f"        __scriptedItems.add(new com.linkany121.gltc.script.GltcScriptedItem(GltcItemGroups.{group}, "
            f"GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA, {amount}), "
            f"{rt}, {rec}, {out}));"
        )
    lines.append("        for (com.linkany121.gltc.script.GltcScriptedItem __item : __scriptedItems) {")
    lines.append("            __item.register(addon);")
    lines.append("        }")

    for key, cfg in data.items():
        if not isinstance(cfg, dict):
            continue
        register_id(key)
        script = str(cfg.get("script", ""))
        script_manifest["machines"].append({"slimefunId": key, "script": script})
        common = machine_common_fields(cfg)
        item = as_map(cfg.get("item"))
        write_item_data_helper(f"Items_{java_id(key)}", item)
        menu_key = find_menu_key(menus, key) or key
        menu = as_map(menus.get(menu_key))
        menu_title = str(menu.get("title", key))
        rec = common["recipe"]
        rt = f"RecipeUtil.resolveRecipeType({jstr(common['recipe_type'])})"
        deferred_rec = deferred_recipe_expr(rec) if rec else "new Object[0]"
        recipe_arr = "RecipeUtil.resolveCraftingRecipe(new Object[0])"
        out = f"GltcItemBuilder.slimefunStack({jstr(register_id(key))}, Items_{java_id(key)}.DATA)"
        class_name = f"Scripted_{java_id(key)}"
        input_slots = ", ".join(str(i) for i in common["input"]) or "2"
        output_slots = ", ".join(str(i) for i in common["output"]) or "19"
        mlines = [
            "package com.linkany121.gltc.generated.script;",
            "",
            "import com.linkany121.gltc.generated.GltcItemGroups;",
            "import com.linkany121.gltc.generated.items.Items_" + java_id(key) + ";",
            "import com.linkany121.gltc.item.GltcItemBuilder;",
            "import com.linkany121.gltc.script.GltcScriptedMachine;",
            "import com.linkany121.gltc.util.RecipeUtil;",
            "import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;",
            "import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;",
            "import org.bukkit.inventory.ItemStack;",
            "",
            f"public final class {class_name} {{",
            f"    public static final String SCRIPT_ID = {jstr(script)};",
            f"    private {class_name}() {{}}",
            "    public static void register(SlimefunAddon addon) {",
            "        GltcScriptedMachine machine = GltcScriptedMachine.create(",
            f"            GltcItemGroups.{common['group']},",
            f"            GltcItemBuilder.slimefunStack({jstr(key)}, Items_{java_id(key)}.DATA),",
            f"            {rt},",
            f"            {recipe_arr},",
            f"            {out},",
            f"            {max(common['capacity'], 1)},",
            f"            {common['energy']},",
            f"            RecipeUtil.intArray(java.util.List.of({input_slots})),",
            f"            RecipeUtil.intArray(java.util.List.of({output_slots})),",
            "            SCRIPT_ID",
            "        );",
            f"        machine.setDeferredCraftingRecipe({deferred_rec});",
            f"        machine.applyMenu({jstr(key)}, {jstr(menu_title)});",
            "        machine.register(addon);",
            "    }",
            "}",
        ]
        write_java(f"script/{class_name}.java", "\n".join(mlines) + "\n")
        lines.append(f"        // machine script: {script}")
        lines.append(f"        com.linkany121.gltc.generated.script.{class_name}.register(addon);")
    lines.append("    }")
    lines.append("}")
    write_java("GltcScriptedRegistry.java", "\n".join(lines) + "\n")


def codegen_menus(source: Path) -> None:
    menus = load_yaml(source / "menus.yml")
    menu_keys = [key for key, cfg in menus.items() if isinstance(cfg, dict)]
    init_lines = [
        "package com.linkany121.gltc.generated;",
        "",
        "import com.linkany121.gltc.util.GltcMenuData;",
    ]
    for key in menu_keys:
        init_lines.append(
            f"import com.linkany121.gltc.generated.menus.GltcMenuData_{java_id(key)};"
        )
    init_lines.extend([
        "",
        "public final class GltcMenuBootstrap {",
        "    private GltcMenuBootstrap() {}",
        "    public static void init() {",
    ])
    for key in menu_keys:
        init_lines.append(f"        GltcMenuData.register({jstr(key)}, GltcMenuData_{java_id(key)}.DATA);")
        write_menu_helper(key, as_map(menus[key]))
    init_lines.append("    }")
    init_lines.append("}")
    write_java("GltcMenuBootstrap.java", "\n".join(init_lines) + "\n")


def slot_method_name(slot: str) -> str:
    return "slot_" + re.sub(r"[^0-9A-Za-z_]", "_", str(slot))


def expand_slot_keys(slots: dict[str, Any]) -> dict[str, Any]:
    expanded: dict[str, Any] = {}
    for key, value in slots.items():
        key_str = str(key)
        if re.fullmatch(r"-?\d+", key_str):
            expanded[key_str] = value
            continue
        m = re.fullmatch(r"(\d+)-(\d+)", key_str)
        if m:
            start, end = int(m.group(1)), int(m.group(2))
            if start <= end:
                for i in range(start, end + 1):
                    expanded[str(i)] = value
            continue
        expanded[key_str] = value
    return expanded


def write_menu_helper(key: str, menu: dict[str, Any]) -> None:
    raw_slots = as_map(menu.get("slots"))
    slots = expand_slot_keys(raw_slots)
    methods: dict[str, dict[str, Any]] = {}
    for slot, slot_cfg in slots.items():
        methods[slot_method_name(slot)] = as_map(slot_cfg)

    title = jstr(str(menu.get("title", key)))
    lines = [
        "package com.linkany121.gltc.generated.menus;",
        "",
        "import java.util.LinkedHashMap;",
        "import java.util.Map;",
        "",
        f"public final class GltcMenuData_{java_id(key)} {{",
        f"    private GltcMenuData_{java_id(key)}() {{}}",
        "    @SuppressWarnings(\"unchecked\")",
        "    public static final Map<String, Object> DATA = build();",
        "    private static Map<String, Object> build() {",
        f"        Map<String, Object> root = new LinkedHashMap<>();",
        f"        root.put(\"title\", {title});",
        "        Map<String, Object> slots = new LinkedHashMap<>();",
    ]
    for slot, slot_cfg in slots.items():
        method = slot_method_name(slot)
        lines.append(f"        slots.put({jstr(str(slot))}, {method}());")
    lines.extend([
        "        root.put(\"slots\", slots);",
        "        return root;",
        "    }",
    ])
    for method, slot_cfg in methods.items():
        entries = map_item_entries(slot_cfg)
        lines.append(f"    private static Map<String, Object> {method}() {{")
        lines.append("        return Map.ofEntries(")
        if entries:
            lines.append(",\n".join(entries))
        lines.append("        );")
        lines.append("    }")
    lines.append("}")
    write_java(f"menus/GltcMenuData_{java_id(key)}.java", "\n".join(lines) + "\n")


def collect_all_ids(source: Path) -> list[str]:
    ids: list[str] = []
    files = [
        "items.yml", "recipe_machines.yml", "workbenches.yml", "generators.yml",
        "template_machines.yml", "super_multi_block_machines.yml", "mb_machines.yml",
        "machines.yml", "foods.yml", "mob_drops.yml", "supers.yml", "armors.yml",
    ]
    for fname in files:
        data = load_yaml(source / fname)
        ids.extend(data.keys())
        if fname == "armors.yml":
            for cfg in data.values():
                if isinstance(cfg, dict):
                    for piece in ("helmet", "chestplate", "leggings", "boots"):
                        p = as_map(cfg.get(piece))
                        if p.get("id"):
                            ids.append(str(p["id"]))
    return ids


def copy_saveditems(source: Path) -> None:
    src = source / "saveditems"
    dst = RESOURCES / "saveditems"
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    manifest: list[str] = []
    for path in sorted(dst.rglob("*.yml")):
        rel = path.relative_to(dst).with_suffix("").as_posix()
        manifest.append(rel)
    manifest_path = RESOURCES / "saveditems_manifest.txt"
    manifest_path.write_text("\n".join(manifest) + "\n", encoding="utf-8")
    print(f"  copied saveditems -> {dst} ({len(manifest)} files)")


def copy_super_multiblock_yaml(source: Path) -> None:
    src = source / "super_multi_block_machines.yml"
    dst = RESOURCES / "super_multi_block_machines.yml"
    if not src.exists():
        print(f"  [warn] missing {src}")
        return
    shutil.copy2(src, dst)
    print(f"  copied super_multi_block_machines.yml -> {dst}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--phase", default="all")
    args = parser.parse_args()
    source: Path = args.source
    if not source.exists():
        print(f"Source not found: {source}", file=sys.stderr)
        return 1

    print(f"GLTC codegen source={source}")
    if GEN_JAVA.exists():
        shutil.rmtree(GEN_JAVA)
    GEN_JAVA.mkdir(parents=True)

    all_ids = collect_all_ids(source)
    for item_id in all_ids:
        register_id(str(item_id))
    codegen_ids(all_ids)

    codegen_groups(source)
    codegen_recipe_types(source)
    codegen_menus(source)
    codegen_items(source, scripted=False)
    codegen_supers(source)
    codegen_workbenches(source)
    codegen_recipe_machines(source)
    codegen_generators(source)
    codegen_template_machines(source)
    codegen_multiblock(source)
    codegen_simple_mb(source)
    codegen_armors(source)
    codegen_foods(source)
    codegen_mob_drops(source)
    codegen_block_drops(source)
    codegen_scripted_machines(source)

    manifest_path = RESOURCES / "SCRIPT_MANIFEST.json"
    manifest_path.write_text(json.dumps(script_manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    ids_path = ROOT / "tools" / "yaml-codegen" / "ids.json"
    ids_path.write_text(json.dumps(canonical_ids, ensure_ascii=False, indent=2), encoding="utf-8")

    copy_saveditems(source)
    copy_super_multiblock_yaml(source)

    print("Codegen complete.")
    print(f"  scripted items: {len(script_manifest['items'])}")
    print(f"  scripted machines: {len(script_manifest['machines'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
