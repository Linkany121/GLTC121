# -*- coding: utf-8 -*-
import pathlib
import re

base = pathlib.Path(__file__).resolve().parent / "能源流"
shops = {
    "矿物.js": "gltcEnergyShop_矿物",
    "植物.js": "gltcEnergyShop_植物",
    "方块.js": "gltcEnergyShop_方块",
    "掉落物.js": "gltcEnergyShop_掉落物",
    "杂物.js": "gltcEnergyShop_杂物",
    "粘液科技.js": "gltcEnergyShop_粘液科技",
}

old_getset = (
    "function _getCredit(u){var f=new File(DATA_DIR.getAbsolutePath()+'/'+u+'.json');"
    "if(!f.exists())return 0;try{var b=Files.readAllBytes(f.toPath());"
    "var bb=Java.type('java.nio.ByteBuffer');"
    "var cb=StandardCharsets.UTF_8.decode(bb.wrap(b));"
    "return JSON.parse(cb.toString()).credit||0;}catch(e){return 0;}}"
    "function _setCredit(u,c){var f=new File(DATA_DIR.getAbsolutePath()+'/'+u+'.json');"
    "try{var l=new java.util.ArrayList();l.add(JSON.stringify({credit:c},null,2));"
    "Files.write(f.toPath(),l,StandardCharsets.UTF_8);}catch(e){}}"
)

new_getset = (
    "function _creditLock(){if(plugin.gltcCreditLock==null)plugin.gltcCreditLock=new java.lang.Object();return plugin.gltcCreditLock;}"
    "function _getCreditUnlocked(u){var f=new File(DATA_DIR.getAbsolutePath()+'/'+u+'.json');"
    "if(!f.exists())return 0;try{var b=Files.readAllBytes(f.toPath());"
    "var bb=Java.type('java.nio.ByteBuffer');"
    "var cb=StandardCharsets.UTF_8.decode(bb.wrap(b));"
    "return JSON.parse(cb.toString()).credit||0;}catch(e){return 0;}}"
    "function _setCreditUnlocked(u,c){var f=new File(DATA_DIR.getAbsolutePath()+'/'+u+'.json');"
    "try{var l=new java.util.ArrayList();l.add(JSON.stringify({credit:c},null,2));"
    "Files.write(f.toPath(),l,StandardCharsets.UTF_8);return true;}"
    "catch(e){try{Java.type('org.bukkit.Bukkit').getLogger().warning('[GLTC信用点] 写入失败 '+u+': '+e);}catch(e2){}return false;}}"
    "function _getCredit(u){return Java.synchronized(_creditLock(),function(){return _getCreditUnlocked(u);})();}"
    "function _setCredit(u,c){return Java.synchronized(_creditLock(),function(){return _setCreditUnlocked(u,c);})();}"
    "function _trySpendCredit(u,cost){return Java.synchronized(_creditLock(),function(){"
    "var cur=_getCreditUnlocked(u);if(cur<cost)return false;return _setCreditUnlocked(u,cur-cost);})();}"
)

old_has = """function hasEnough(player, priceList, multiplier, batchMul) {
    var uuid = player.getUniqueId().toString();
    var cost = calcCreditCost(priceList) * multiplier * (batchMul || 1);
    return _getCredit(uuid) >= cost;
}
function removeItems(player, priceList, multiplier, batchMul) {
    var uuid = player.getUniqueId().toString();
    var cost = calcCreditCost(priceList) * multiplier * (batchMul || 1);
    var current = _getCredit(uuid);
    var newCredit = current - cost;
    _setCredit(uuid, newCredit);
    _updateCardLore(player.getInventory(), uuid, player.getName(), newCredit);
}"""

new_has = """function hasEnough(player, priceList, multiplier, batchMul) {
    var uuid = player.getUniqueId().toString();
    var cost = calcCreditCost(priceList) * multiplier * (batchMul || 1);
    return _getCredit(uuid) >= cost;
}
function removeItems(player, priceList, multiplier, batchMul) {
    var uuid = player.getUniqueId().toString();
    var cost = calcCreditCost(priceList) * multiplier * (batchMul || 1);
    if (!_trySpendCredit(uuid, cost)) return false;
    _updateCardLore(player.getInventory(), uuid, player.getName(), _getCredit(uuid));
    return true;
}"""

old_ensure = """    if (plugin.lengshang_gj_qhgui) {
        ClickEvent.getHandlerList().unregister(plugin.lengshang_gj_qhgui);
        CloseEvent.getHandlerList().unregister(plugin.lengshang_gj_qhgui);
        DragEvent.getHandlerList().unregister(plugin.lengshang_gj_qhgui);
        plugin.lengshang_gj_qhgui = null;
    }"""

new_ensure = """    var _oldShopL = plugin[SHOP_LISTENER_KEY];
    if (_oldShopL) {
        ClickEvent.getHandlerList().unregister(_oldShopL);
        CloseEvent.getHandlerList().unregister(_oldShopL);
        DragEvent.getHandlerList().unregister(_oldShopL);
        plugin[SHOP_LISTENER_KEY] = null;
    }"""

for fn, key in shops.items():
    p = base / fn
    t = p.read_text(encoding="utf-8")
    if "SHOP_LISTENER_KEY" not in t:
        t2, n = re.subn(
            r"(const MAIN_TITLE = [^\n]+;\n)",
            r"\1const SHOP_LISTENER_KEY = '" + key + "';\n",
            t,
            count=1,
        )
        if n != 1:
            print(fn, "MAIN_TITLE insert failed", n)
        else:
            t = t2
    if old_getset not in t:
        print(fn, "MISSING getset")
    else:
        t = t.replace(old_getset, new_getset)
    if old_has not in t:
        print(fn, "MISSING hasEnough")
    else:
        t = t.replace(old_has, new_has)
    if old_ensure not in t:
        print(fn, "MISSING ensure")
    else:
        t = t.replace(old_ensure, new_ensure)
    t = t.replace(
        "plugin.lengshang_gj_qhgui = null; registered = false;",
        "plugin[SHOP_LISTENER_KEY] = null; registered = false;",
    )
    t = t.replace(
        "plugin.lengshang_gj_qhgui = listener; registered = true;",
        "plugin[SHOP_LISTENER_KEY] = listener; registered = true;",
    )
    t = t.replace(
        "            removeItems(p, config.price, times, _batchMul);\n            giveItems(p, itemProto, totalGive);",
        "            if (!removeItems(p, config.price, times, _batchMul)) {\n"
        "                p.sendMessage(getFailMessage('', _creditCost));\n"
        "                return;\n"
        "            }\n"
        "            giveItems(p, itemProto, totalGive);",
    )
    p.write_text(t, encoding="utf-8")
    print("OK", fn, "leftover_lengshang=", ("lengshang_gj_qhgui" in t))
