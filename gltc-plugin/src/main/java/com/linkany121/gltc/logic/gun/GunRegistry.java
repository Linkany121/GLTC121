package com.linkany121.gltc.logic.gun;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Mirrors {@code scripts/枪械/登记.js}. */
public final class GunRegistry {

    // ===== 配置区（枪械登记表，改完需重新打包 jar 并重启生效）=====
    public static final String INTEGRATION_GUN_ID = "FKR_枪械集成枪";  // 集成枪物品 ID
    // 各枪械物品 ID（需与 items.yml 中定义的 ID 完全一致）
    public static final String RIFLE = "FKR_通古斯制式步枪";
    public static final String SHOTGUN = "FKR_通古斯战壕霰弹";
    public static final String MACHINE_GUN = "FKR_通古斯涡轮式单兵机枪";
    public static final String PULSE = "FKR_通古斯防御型脉冲手铳";
    public static final String BEACON = "FKR_通古斯制式轨道信标投递器";
    public static final String OVERLOAD = "FKR_通古斯过载式步枪";

    private static final Map<String, Integer> ORDER;  // 集成枪 GUI 展示顺序（数值越小越靠前）

    static {
        // 新增枪械：声明常量 + 在此按顺序加入，并在 GltcLogicRegistry 注册对应逻辑类
        Map<String, Integer> m = new LinkedHashMap<>();
        m.put(RIFLE, 0);
        m.put(SHOTGUN, 1);
        m.put(MACHINE_GUN, 2);
        m.put(PULSE, 3);
        m.put(BEACON, 4);
        m.put(OVERLOAD, 5);
        ORDER = Collections.unmodifiableMap(m);
    }

    private GunRegistry() {
    }

    public static boolean isRegisteredGun(String gunId) {
        return gunId != null && ORDER.containsKey(gunId);
    }

    public static boolean isIntegrationGun(String itemId) {
        return INTEGRATION_GUN_ID.equals(itemId);
    }

    public static List<String> listGuns() {
        List<String> out = new ArrayList<>(ORDER.keySet());
        out.sort((a, b) -> Integer.compare(ORDER.get(a), ORDER.get(b)));
        return out;
    }
}
