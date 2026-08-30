package com.linkany121.gltc.logic.machine;

import com.linkany121.gltc.logic.GltcMachineLogic;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.multiblock.GltcSuperMultiBlockManager;
import org.bukkit.Location;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * {@code skey_四目伏羲级} — 运行时不耗电，成型后每秒生产 4096 J。
 * {@link #onTick} 返回 {@code false}，让默认配方 tick 继续运行（{@code callSuper}），
 * 仅在结构成型时额外向自身充电，模拟核反应堆发电。
 */
public final class FourEyesFuxiLogic implements GltcMachineLogic {

    public static final String MACHINE_ID = "skey_四目伏羲级";

    /** 每秒发电量（J）。 */
    private static final int ENERGY_PER_SECOND = 4096;

    private final Map<String, Long> lastCharge = new ConcurrentHashMap<>();

    @Override
    public boolean onTick(Location location, GltcRecipeMachine machine) {
        try {
            if (!GltcSuperMultiBlockManager.canTick(location, MACHINE_ID)) {
                return false;
            }
            String key = key(location);
            long now = System.currentTimeMillis();
            long last = lastCharge.getOrDefault(key, 0L);
            if (now - last < 1000L) {
                return false;
            }
            lastCharge.put(key, now);
            machine.addCharge(location, ENERGY_PER_SECOND);
        } catch (Throwable t) {
            // 忽略运行时异常，避免影响默认 tick。
        }
        return false;
    }

    private static String key(Location location) {
        return location.getWorld() == null
            ? "?"
            : location.getWorld().getName() + ';' + location.getBlockX() + ';' + location.getBlockY() + ';' + location.getBlockZ();
    }
}
