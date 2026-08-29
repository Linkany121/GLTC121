package com.linkany121.gltc.generated;

import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.util.IdCanonicalizer;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** YAML machine speed applied after register. */
public final class GltcMachineSpeeds {
    private GltcMachineSpeeds() {}
    private static final Map<String, Integer> SPEED = new HashMap<>();
    static {
        putSpeed("ATOcd2", 3);
        putSpeed("ATOsh2", 3);
        putSpeed("ATOrh1", 6);
        putSpeed("ATOgzq", 2);
        putSpeed("TAChx2", 30);
        putSpeed("TACbz2", 30);
        putSpeed("tsylg3", 3);
        putSpeed("tstyj1", 3);
        putSpeed("tszspt2", 2);
        putSpeed("TShjl2", 2);
        putSpeed("TShjl3", 12);
        putSpeed("TSmlq2", 4);
        putSpeed("TSfj2", 6);
        putSpeed("TShc2", 4);
        putSpeed("LISlyj1", 8);
        putSpeed("LISlyj2", 5);
        putSpeed("LISyp2", 5);
        putSpeed("LISls2", 2);
        putSpeed("LISls3", 16);
        putSpeed("LISls4", 32);
        putSpeed("LISzhs1", 2);
        putSpeed("LISzhs2", 3);
        putSpeed("LISzhs3", 16);
        putSpeed("EAE_空气滤网风帆2", 2);
        putSpeed("EAE_一体融合器", 6);
        putSpeed("EAE_小型工件装配站点", 6);
        putSpeed("EAE_木材加工反应盒2", 10);
        putSpeed("EAE_陈轩石匠一型2", 10);
        putSpeed("EAE_陈轩石匠二型2", 5);
        putSpeed("UMPV_密堆培育仓2", 3);
        putSpeed("UMPV_集束房2", 10);
        putSpeed("UMPV_集束房3", 20);
        putSpeed("FD_植械突触分解机2", 3);
        putSpeed("skey_小帮手2", 3);
        putSpeed("skey_小帮手3", 9);
        putSpeed("skey_十一号反应炉2", 3);
        putSpeed("skey_十一号反应炉3", 9);
        putSpeed("skey_重力集束熔炼房2", 2);
        putSpeed("skey_重力集束熔炼房3", 4);
        putSpeed("skey_红巨压力合成器2", 8);
        putSpeed("skey_重型工业成型母机2", 3);
        putSpeed("OST_回收器", 4);
        putSpeed("OST_幼儿启蒙金属合成机2", 3);
        putSpeed("HInet_网络通信零件产素器2", 2);
    }
    private static void putSpeed(String id, int speed) {
        SPEED.put(id, speed);
        SPEED.put(id.toUpperCase(Locale.ROOT), speed);
    }
    public static void apply() {
        for (SlimefunItem item : Slimefun.getRegistry().getAllSlimefunItems()) {
            if (!(item instanceof GltcRecipeMachine machine)) {
                continue;
            }
            Integer speed = SPEED.get(item.getId());
            if (speed == null) {
                speed = SPEED.get(IdCanonicalizer.canonical(item.getId()));
            }
            if (speed == null) {
                for (Map.Entry<String, Integer> e : SPEED.entrySet()) {
                    if (e.getKey().equalsIgnoreCase(item.getId())) {
                        speed = e.getValue();
                        break;
                    }
                }
            }
            if (speed != null && speed > 1) {
                machine.applyYamlSpeed(speed);
            }
        }
    }
}
