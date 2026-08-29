package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.common.GltcMessages;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.configuration.file.YamlConfiguration;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.event.entity.PlayerDeathEvent;

import javax.annotation.Nullable;
import java.io.File;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 术式死亡播报：
 * 记录每次术式命中归属，当目标在归属窗口内死亡时，按 {@code addon_configs/GLTC/术式死亡播报.yml}
 * 模板播报（玩家死亡全服播报、生物死亡向附近玩家播报、侵蚀反噬死亡按侵蚀模板播报）。
 */
public final class SpellDeathAnnouncer implements Listener {

    // ===== 内置默认（与 addon_configs/GLTC/术式死亡播报.yml 一致）=====
    private static final long DEFAULT_WINDOW_MS = 10_000L;
    private static final String DEFAULT_PLAYER_TEMPLATE = "{killer} §7使用术式 {spell} §7杀死了 {victim}";
    private static final String DEFAULT_PLAYER_TEMPLATE_TYPE = "{killer} §f通过 {damageType}术式 {spell} §f杀死了 {victim}";
    private static final String DEFAULT_MOB_TEMPLATE = "{killer} §f通过 {damageType}§f术式 {spell} §f杀死了 {victim}";
    private static final String DEFAULT_EROSION_TEMPLATE = "{victim} §f因 {erosion} §f在施展 {spell} §f时因血脑屏障熔毁而亡";

    private static SpellDeathAnnouncer instance;

    private final Map<UUID, Hit> hits = new ConcurrentHashMap<>();

    private long windowMs = DEFAULT_WINDOW_MS;
    private boolean playerKillEnabled = true;
    private boolean showDamageType = true;
    private boolean mobKillEnabled = true;
    private double nearbyRange = 256.0;
    private boolean erosionEnabled = true;
    private String playerTemplate = DEFAULT_PLAYER_TEMPLATE;
    private String playerTemplateType = DEFAULT_PLAYER_TEMPLATE_TYPE;
    private String mobTemplate = DEFAULT_MOB_TEMPLATE;
    private String erosionTemplate = DEFAULT_EROSION_TEMPLATE;

    private SpellDeathAnnouncer() {
    }

    public static void register(GltcPlugin plugin) {
        if (plugin == null) {
            return;
        }
        unregister();
        SpellDeathAnnouncer announcer = new SpellDeathAnnouncer();
        announcer.loadConfig(plugin);
        Bukkit.getPluginManager().registerEvents(announcer, plugin);
        instance = announcer;
    }

    public static void unregister() {
        SpellDeathAnnouncer announcer = instance;
        if (announcer == null) {
            return;
        }
        instance = null;
        HandlerList.unregisterAll(announcer);
        announcer.hits.clear();
    }

    // -------------------------------------------------------------------------
    // 归属记录
    // -------------------------------------------------------------------------

    /** 记录一次术式命中归属。 */
    public static void recordHit(Player caster, LivingEntity target, String spellDisplayName,
                                 MageSpellDamage.SpellDamageType type) {
        recordHit(caster, target, spellDisplayName, type, false);
    }

    /** 记录一次术式命中归属；{@code erosion} 为真表示侵蚀反噬（施法者即受害者）。 */
    public static void recordHit(Player caster, LivingEntity target, String spellDisplayName,
                                 MageSpellDamage.SpellDamageType type, boolean erosion) {
        SpellDeathAnnouncer announcer = instance;
        if (announcer == null || target == null) {
            return;
        }
        announcer.hits.put(target.getUniqueId(), new Hit(
            caster != null ? caster.getUniqueId() : null,
            caster != null ? caster.getName() : "未知",
            spellDisplayName,
            type != null ? type.label() : "未知",
            System.currentTimeMillis(),
            erosion
        ));
    }

    // -------------------------------------------------------------------------
    // 死亡监听
    // -------------------------------------------------------------------------

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onEntityDeath(EntityDeathEvent event) {
        LivingEntity victim = event.getEntity();
        if (victim instanceof Player) {
            return; // 玩家死亡由 onPlayerDeath 处理，避免重复
        }
        announce(victim, false);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onPlayerDeath(PlayerDeathEvent event) {
        // 术式击杀已播报时，拦截原版死亡消息避免重复
        if (announce(event.getEntity(), true)) {
            event.setDeathMessage(null);
        }
    }

    /** @return 是否实际播报（玩家死亡时据此拦截原版死亡消息）。 */
    private boolean announce(LivingEntity victim, boolean isPlayer) {
        if (victim == null) {
            return false;
        }
        Hit hit = hits.remove(victim.getUniqueId());
        if (hit == null || System.currentTimeMillis() - hit.time > windowMs) {
            return false;
        }
        String victimName = EntityNameZh.name(victim);
        if (hit.erosion) {
            if (isPlayer && erosionEnabled) {
                broadcast(true, victim.getLocation(),
                    fill(erosionTemplate, hit, victimName, "侵蚀反噬"));
                return true;
            }
            return false;
        }
        if (isPlayer) {
            if (!playerKillEnabled) {
                return false;
            }
            String tpl = showDamageType ? playerTemplateType : playerTemplate;
            broadcast(true, victim.getLocation(), fill(tpl, hit, victimName, ""));
            return true;
        }
        if (!mobKillEnabled) {
            return false;
        }
        broadcast(false, victim.getLocation(), fill(mobTemplate, hit, victimName, ""));
        return true;
    }

    private static String fill(String template, Hit hit, String victimName, String erosionLabel) {
        return template
            .replace("{killer}", hit.killerName)
            .replace("{spell}", hit.spell)
            .replace("{victim}", victimName)
            .replace("{damageType}", hit.damageType)
            .replace("{erosion}", erosionLabel);
    }

    private void broadcast(boolean allPlayers, Location loc, String message) {
        if (loc == null) {
            return;
        }
        String msg = GltcMessages.PREFIX + message;
        if (allPlayers) {
            for (Player p : Bukkit.getOnlinePlayers()) {
                try {
                    p.sendMessage(msg);
                } catch (Throwable ignored) {
                }
            }
            return;
        }
        double range = nearbyRange;
        for (Player p : Bukkit.getOnlinePlayers()) {
            try {
                if (p.getWorld().equals(loc.getWorld())
                    && p.getLocation().distanceSquared(loc) <= range * range) {
                    p.sendMessage(msg);
                }
            } catch (Throwable ignored) {
            }
        }
    }

    // -------------------------------------------------------------------------
    // 配置
    // -------------------------------------------------------------------------

    private void loadConfig(GltcPlugin plugin) {
        File configFile = findConfigFile(plugin);
        YamlConfiguration cfg = YamlConfiguration.loadConfiguration(configFile);
        windowMs = Math.max(0, cfg.getLong("AttributionWindowMs", DEFAULT_WINDOW_MS));
        ConfigurationSection pk = cfg.getConfigurationSection("PlayerKill");
        if (pk != null) {
            playerKillEnabled = pk.getBoolean("Enabled", true);
            showDamageType = pk.getBoolean("ShowDamageType", true);
            playerTemplate = pk.getString("Template", DEFAULT_PLAYER_TEMPLATE);
            playerTemplateType = pk.getString("TemplateWithType", DEFAULT_PLAYER_TEMPLATE_TYPE);
        }
        ConfigurationSection mk = cfg.getConfigurationSection("MobKill");
        if (mk != null) {
            mobKillEnabled = mk.getBoolean("Enabled", true);
            nearbyRange = mk.getDouble("NearbyRange", 256.0);
            mobTemplate = mk.getString("Template", DEFAULT_MOB_TEMPLATE);
        }
        ConfigurationSection es = cfg.getConfigurationSection("ErosionSelfDeath");
        if (es != null) {
            erosionEnabled = es.getBoolean("Enabled", true);
            erosionTemplate = es.getString("Template", DEFAULT_EROSION_TEMPLATE);
        }
        if (playerTemplate == null || playerTemplate.isBlank()) {
            playerTemplate = DEFAULT_PLAYER_TEMPLATE;
        }
        if (playerTemplateType == null || playerTemplateType.isBlank()) {
            playerTemplateType = DEFAULT_PLAYER_TEMPLATE_TYPE;
        }
        if (mobTemplate == null || mobTemplate.isBlank()) {
            mobTemplate = DEFAULT_MOB_TEMPLATE;
        }
        if (erosionTemplate == null || erosionTemplate.isBlank()) {
            erosionTemplate = DEFAULT_EROSION_TEMPLATE;
        }
    }

    /** 优先读取 addon_configs/GLTC/术式死亡播报.yml，回退插件数据目录同文件。 */
    private static File findConfigFile(GltcPlugin plugin) {
        try {
            File dataFolder = plugin.getDataFolder(); // plugins/GLTC
            File serverRoot = dataFolder.getParentFile() != null
                ? dataFolder.getParentFile().getParentFile()
                : null;
            if (serverRoot != null) {
                File addon = new File(serverRoot,
                    "plugins/RykenSlimefunCustomizer/addon_configs/GLTC/术式死亡播报.yml");
                if (addon.isFile()) {
                    return addon;
                }
            }
        } catch (Throwable ignored) {
        }
        return new File(plugin.getDataFolder(), "术式死亡播报.yml");
    }

    /** 单次归属记录。 */
    private static final class Hit {
        @SuppressWarnings("unused")
        final UUID killerId;
        final String killerName;
        final String spell;
        final String damageType;
        final long time;
        final boolean erosion;

        Hit(@Nullable UUID killerId, String killerName, String spell, String damageType, long time, boolean erosion) {
            this.killerId = killerId;
            this.killerName = killerName == null || killerName.isBlank() ? "未知" : killerName;
            this.spell = spell == null || spell.isBlank() ? "未知术式" : spell;
            this.damageType = damageType == null || damageType.isBlank() ? "未知" : damageType;
            this.time = time;
            this.erosion = erosion;
        }
    }
}
