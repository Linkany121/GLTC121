package com.linkany121.gltc.logic.skey;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcDataPaths;

import javax.annotation.Nullable;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * I/V/X ship (舰体) currency — shared by order publisher/receiver and link access station.
 * Data: {@code plugins/GLTC/data/skey/currency/{uuid}.json}
 */
public final class ShipCurrencyService {

    private static final Pattern FIELD_I = Pattern.compile("\"I\"\\s*:\\s*(-?[0-9]+)");
    private static final Pattern FIELD_V = Pattern.compile("\"V\"\\s*:\\s*(-?[0-9]+)");
    private static final Pattern FIELD_X = Pattern.compile("\"X\"\\s*:\\s*(-?[0-9]+)");

    private static ShipCurrencyService instance;

    private final GltcPlugin plugin;
    private final ReentrantLock lock = new ReentrantLock();

    private ShipCurrencyService(GltcPlugin plugin) {
        this.plugin = plugin;
    }

    public static void init(GltcPlugin plugin) {
        instance = new ShipCurrencyService(plugin);
        try {
            Files.createDirectories(GltcDataPaths.skeyCurrencyDir(plugin));
        } catch (IOException ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC舰体货币] 创建目录失败", ex);
        }
    }

    @Nullable
    public static ShipCurrencyService get() {
        return instance;
    }

    public static void shutdown() {
        instance = null;
    }

    public Balance get(UUID uuid) {
        lock.lock();
        try {
            return readUnlocked(uuid);
        } finally {
            lock.unlock();
        }
    }

    public Balance set(UUID uuid, Balance data) {
        lock.lock();
        try {
            Balance normalized = data == null ? Balance.ZERO : data.normalized();
            writeUnlocked(uuid, normalized);
            return normalized;
        } finally {
            lock.unlock();
        }
    }

    /**
     * Read-modify-write under lock. Modifier mutates the balance and returns a result
     * (may be null to signal failure without writing — caller must not mutate then).
     * If modifier returns non-null, the (possibly mutated) balance is persisted.
     */
    @Nullable
    public <T> T modify(UUID uuid, Function<Balance, T> modifier) {
        lock.lock();
        try {
            Balance data = readUnlocked(uuid);
            T result = modifier.apply(data);
            writeUnlocked(uuid, data.normalized());
            return result;
        } finally {
            lock.unlock();
        }
    }

    public Balance add(UUID uuid, String type, int amount) {
        lock.lock();
        try {
            Balance data = readUnlocked(uuid);
            if ("I".equals(type)) {
                data.i += amount;
            } else if ("V".equals(type)) {
                data.v += amount;
            } else if ("X".equals(type)) {
                data.x += amount;
            }
            Balance out = data.normalized();
            writeUnlocked(uuid, out);
            return out;
        } finally {
            lock.unlock();
        }
    }

    private Balance readUnlocked(UUID uuid) {
        Path file = GltcDataPaths.skeyCurrencyFile(plugin, uuid);
        if (!Files.isRegularFile(file)) {
            return Balance.ZERO.copy();
        }
        try {
            String text = Files.readString(file, StandardCharsets.UTF_8);
            return new Balance(readInt(text, FIELD_I), readInt(text, FIELD_V), readInt(text, FIELD_X));
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC舰体货币] 读取失败 uuid=" + uuid, ex);
            return Balance.ZERO.copy();
        }
    }

    private void writeUnlocked(UUID uuid, Balance data) {
        Path file = GltcDataPaths.skeyCurrencyFile(plugin, uuid);
        try {
            Files.createDirectories(file.getParent());
            Path tmp = file.resolveSibling(file.getFileName() + ".tmp");
            String json = "{\n  \"I\": " + data.i + ",\n  \"V\": " + data.v + ",\n  \"X\": " + data.x + "\n}\n";
            Files.writeString(tmp, json, StandardCharsets.UTF_8);
            try {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
            } catch (IOException e) {
                Files.move(tmp, file, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (Exception ex) {
            plugin.getLogger().log(Level.WARNING, "[GLTC舰体货币] 保存失败 uuid=" + uuid, ex);
        }
    }

    private static int readInt(String text, Pattern pattern) {
        Matcher m = pattern.matcher(text);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return 0;
    }

    /** Mutable I/V/X balance (matches JS {I,V,X}). */
    public static final class Balance {
        public static final Balance ZERO = new Balance(0, 0, 0);

        public int i;
        public int v;
        public int x;

        public Balance(int i, int v, int x) {
            this.i = i;
            this.v = v;
            this.x = x;
        }

        public Balance copy() {
            return new Balance(i, v, x);
        }

        public Balance normalized() {
            return new Balance(Math.max(0, i), Math.max(0, v), Math.max(0, x));
        }
    }
}
