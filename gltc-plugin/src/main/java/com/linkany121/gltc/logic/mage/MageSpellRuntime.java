package com.linkany121.gltc.logic.mage;

import org.bukkit.entity.Player;

import javax.annotation.Nullable;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.Predicate;

/**
 * 术式会话（状态）运行时。
 *
 * <p>术式具有两种状态：
 * <ul>
 *   <li>{@link Persistence#UNPROJECTED 未投射}：跟随玩家 / 蓄力 / 左键待触发等；打开术式选择 GUI 或切换术式时清除。</li>
 *   <li>{@link Persistence#PROJECTED 已投射}：已脱管的弹体 / 飞行物；保留至自然结束，不受开 GUI 影响。</li>
 * </ul>
 *
 * <p>术式实现通过 {@link #begin(Player, String, Runnable, Persistence)} 注册会话，
 * 并在 {@code onClear} 中 cancel 定时任务 / 移除实体；自然结束时调用 {@link #end(Player, String, boolean)}。
 */
public final class MageSpellRuntime {

    /** 会话持久类型。 */
    public enum Persistence {
        /** 未投射：开 GUI / 切术清除。 */
        UNPROJECTED,
        /** 已投射：保留至自然结束。 */
        PROJECTED
    }

    private static final AtomicLong TOKEN_SEQ = new AtomicLong();
    private static final ConcurrentHashMap<UUID, CopyOnWriteArrayList<Session>> SESSIONS = new ConcurrentHashMap<>();

    private MageSpellRuntime() {
    }

    /**
     * 注册一个术式会话。
     *
     * @param player      施术者
     * @param spellId     术式 ID
     * @param onClear     清除回调（cancel task / 移除实体）；可为 {@code null}
     * @param persistence 未投射或已投射
     * @return 会话 token；失败返回 {@code null}
     */
    @Nullable
    public static String begin(Player player, String spellId, @Nullable Runnable onClear, Persistence persistence) {
        if (player == null || spellId == null || spellId.isBlank()) {
            return null;
        }
        UUID uuid = player.getUniqueId();
        CopyOnWriteArrayList<Session> list = SESSIONS.computeIfAbsent(uuid, k -> new CopyOnWriteArrayList<>());
        String token = "t" + TOKEN_SEQ.incrementAndGet() + "_" + System.currentTimeMillis();
        list.add(new Session(
            token,
            spellId.trim(),
            persistence == null ? Persistence.UNPROJECTED : persistence,
            onClear
        ));
        return token;
    }

    /** 结束一个会话；{@code invokeClear} 为 {@code true} 时执行 onClear 回调。 */
    public static boolean end(Player player, String token, boolean invokeClear) {
        if (player == null || token == null || token.isBlank()) {
            return false;
        }
        CopyOnWriteArrayList<Session> list = SESSIONS.get(player.getUniqueId());
        if (list == null) {
            return false;
        }
        for (Session s : list) {
            if (token.equals(s.token)) {
                if (list.remove(s)) {
                    if (invokeClear) {
                        s.invoke(player, "end");
                    }
                    if (list.isEmpty()) {
                        SESSIONS.remove(player.getUniqueId(), list);
                    }
                    return true;
                }
                return false;
            }
        }
        return false;
    }

    /** 清除全部未投射会话（打开术式选择 GUI 时）；可排除某个术式。 */
    public static int clearUnprojected(Player player, @Nullable String exceptSpellId) {
        String except = exceptSpellId == null || exceptSpellId.isBlank() ? null : exceptSpellId.trim();
        return clear(player, s -> s.persistence == Persistence.UNPROJECTED
            && (except == null || !except.equals(s.spellId)), "gui");
    }

    /** 清除某玩家全部会话（切出法杖 / 下线时）。 */
    public static int clearAll(Player player) {
        return clear(player, s -> true, "clear-all");
    }

    /** 清理玩家所有会话（下线），不要求玩家在线。 */
    public static void purgePlayer(UUID uuid) {
        if (uuid == null) {
            return;
        }
        CopyOnWriteArrayList<Session> list = SESSIONS.remove(uuid);
        if (list == null) {
            return;
        }
        for (Session s : list) {
            s.invoke(null, "quit");
        }
    }

    private static int clear(Player player, Predicate<Session> filter, String reason) {
        if (player == null) {
            return 0;
        }
        CopyOnWriteArrayList<Session> list = SESSIONS.get(player.getUniqueId());
        if (list == null) {
            return 0;
        }
        int n = 0;
        for (Session s : list) {
            if (!filter.test(s)) {
                continue;
            }
            if (list.remove(s)) {
                s.invoke(player, reason);
                n++;
            }
        }
        if (list.isEmpty()) {
            SESSIONS.remove(player.getUniqueId(), list);
        }
        return n;
    }

    private static final class Session {
        final String token;
        final String spellId;
        final Persistence persistence;
        @Nullable
        final Runnable onClear;
        volatile boolean cleared;

        Session(String token, String spellId, Persistence persistence, @Nullable Runnable onClear) {
            this.token = token;
            this.spellId = spellId;
            this.persistence = persistence;
            this.onClear = onClear;
        }

        void invoke(@Nullable Player player, String reason) {
            if (cleared) {
                return;
            }
            cleared = true;
            Runnable fn = onClear;
            if (fn == null) {
                return;
            }
            try {
                fn.run();
            } catch (Throwable ignored) {
            }
        }
    }
}
