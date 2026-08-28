// ===================================================================
// 枪械登记 — 集成枪 GUI 与委托射击共用
// 新增枪械：在此登记 id + script，并在 items.yml 绑定 script
// ===================================================================

var INTEGRATION_GUN_ID = "FKR_枪械集成枪";

/** @type {Object.<string, {script: string, order: number}>} */
var GUN_REGISTRY = {
    "FKR_通古斯制式步枪":           { script: "枪械/通古斯制式步枪",           order: 0 },
    "FKR_通古斯战壕霰弹":           { script: "枪械/通古斯战壕霰弹",           order: 1 },
    "FKR_通古斯涡轮式单兵机枪":     { script: "枪械/通古斯涡轮式单兵机枪",     order: 2 },
    "FKR_通古斯防御型脉冲手铳":     { script: "枪械/通古斯防御型脉冲手铳",     order: 3 },
    "FKR_通古斯制式轨道信标投递器": { script: "枪械/通古斯制式轨道信标投递器", order: 4 },
    "FKR_通古斯过载式步枪":         { script: "枪械/通古斯过载式步枪",         order: 5 }
};

function getGunEntry(gunId) {
    if (!gunId) return null;
    return GUN_REGISTRY[String(gunId)] || null;
}

function getGunScript(gunId) {
    var e = getGunEntry(gunId);
    return e ? String(e.script) : null;
}

function listGuns() {
    var out = [];
    for (var id in GUN_REGISTRY) {
        if (!GUN_REGISTRY.hasOwnProperty(id)) continue;
        out.push({ id: id, script: GUN_REGISTRY[id].script, order: GUN_REGISTRY[id].order });
    }
    out.sort(function(a, b) { return a.order - b.order; });
    return out;
}

function isIntegrationGun(itemId) {
    return String(itemId) === INTEGRATION_GUN_ID;
}

function isRegisteredGun(itemId) {
    return !!getGunEntry(itemId);
}

return {
    INTEGRATION_GUN_ID: INTEGRATION_GUN_ID,
    GUN_REGISTRY: GUN_REGISTRY,
    getGunEntry: getGunEntry,
    getGunScript: getGunScript,
    listGuns: listGuns,
    isIntegrationGun: isIntegrationGun,
    isRegisteredGun: isRegisteredGun
};
