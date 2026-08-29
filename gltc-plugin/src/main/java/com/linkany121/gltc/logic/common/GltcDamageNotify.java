package com.linkany121.gltc.logic.common;

import com.linkany121.gltc.GltcPlugin;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import javax.annotation.Nullable;

/**
 * Damage feedback for guns / ability weapons ({@code DamageNotifyMode}).
 */
public final class GltcDamageNotify {

    public static final String PREFIX =
        "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";

    public enum Mode {
        CHAT,
        ACTIONBAR,
        NONE
    }

    private GltcDamageNotify() {
    }

    public static Mode mode() {
        GltcPlugin plugin = GltcPlugin.getInstance();
        String raw = GltcConfigKeys.DAMAGE_NOTIFY_MODE_DEFAULT;
        if (plugin != null) {
            raw = plugin.getConfig().getString(
                GltcConfigKeys.DAMAGE_NOTIFY_MODE,
                GltcConfigKeys.DAMAGE_NOTIFY_MODE_DEFAULT
            );
        }
        if (raw == null) {
            return Mode.CHAT;
        }
        String mode = raw.toLowerCase().trim();
        return switch (mode) {
            case "actionbar", "action_bar", "action", "物品栏上方" -> Mode.ACTIONBAR;
            case "none", "off", "hide", "不显示" -> Mode.NONE;
            case "chat", "聊天框" -> Mode.CHAT;
            default -> Mode.CHAT;
        };
    }

    public static void notifyAbilityDamage(Player player, @Nullable ItemStack item, double damage) {
        if (player == null || !player.isOnline()) {
            return;
        }
        Mode m = mode();
        if (m == Mode.NONE) {
            return;
        }
        send(player, m, PREFIX + "使用 " + displayName(item) + " §f造成 §c"
            + GltcAbilityPower.formatDamage(damage) + " §f伤害！");
    }

    /** AoE summary used by ASPL / similar weapons. */
    public static void notifyAbilityDamageSummary(
        Player player,
        @Nullable ItemStack item,
        double totalDamage,
        int hitCount
    ) {
        if (player == null || !player.isOnline() || hitCount <= 0 || totalDamage <= 0) {
            return;
        }
        Mode m = mode();
        if (m == Mode.NONE) {
            return;
        }
        send(player, m, PREFIX + "使用 " + displayName(item)
            + " §f对 §e" + hitCount + " §f个目标共造成 §c"
            + GltcAbilityPower.formatDamage(totalDamage) + " §f伤害！");
    }

    private static void send(Player player, Mode m, String msg) {
        if (m == Mode.ACTIONBAR) {
            try {
                player.sendActionBar(LegacyComponentSerializer.legacySection().deserialize(msg));
            } catch (Throwable t) {
                player.sendMessage(msg);
            }
        } else {
            player.sendMessage(msg);
        }
    }

    public static double dealSitDamage(
        org.bukkit.entity.LivingEntity target,
        Player player,
        @Nullable ItemStack item,
        double sitMultiplier
    ) {
        double dmg = GltcAbilityPower.calcDamage(sitMultiplier);
        target.setNoDamageTicks(0);
        target.damage(dmg, player);
        notifyAbilityDamage(player, item, dmg);
        return dmg;
    }

    private static String displayName(@Nullable ItemStack item) {
        if (item == null) {
            return "未知武器";
        }
        ItemMeta meta = item.getItemMeta();
        if (meta != null && meta.hasDisplayName()) {
            return meta.getDisplayName();
        }
        return "未知武器";
    }
}
