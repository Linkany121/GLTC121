package com.linkany121.gltc.logic.gun;

import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** {@code FKR_通古斯涡轮式单兵机枪} */
public final class MachineGunLogic extends AbstractGunLogic {

    // ===== 配置区（通古斯涡轮式单兵机枪，改完需重新打包 jar 并重启生效）=====
    private static final double SIT_MULT = 1.6;          // 单发伤害倍率
    private static final double RANGE = 30;              // 有效射程（格）
    private static final long COOLDOWN_MS = 5000;        // 弹匣打空后的再装填时长（毫秒），5000 = 5 秒
    private static final long FIRE_INTERVAL_MS = 100;    // 连发间隔（毫秒），100 = 每秒 10 发
    private static final int MAX_AMMO = 24;              // 弹匣容量（发）

    private final GunCombat.CooldownMap cd = new GunCombat.CooldownMap();
    private final Map<UUID, Integer> ammoMap = new ConcurrentHashMap<>();
    private final Map<UUID, Long> lastFireMap = new ConcurrentHashMap<>();

    @Override
    public void clearGunState(Player player) {
        if (player == null) {
            return;
        }
        UUID id = player.getUniqueId();
        cd.clear(id);
        ammoMap.remove(id);
        lastFireMap.remove(id);
    }

    @Override
    protected void fire(Player player, ItemStack hand) {
        UUID uuid = player.getUniqueId();
        long now = System.currentTimeMillis();
        if (cd.onCooldown(uuid, now, COOLDOWN_MS)) {
            long remaining = (long) Math.ceil(cd.remainingMs(uuid, now, COOLDOWN_MS) / 1000.0);
            GunCombat.sendActionBar(player, "§c再装填中..." + remaining + "秒");
            player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7f, 1.0f);
            return;
        }
        int ammo = ammoMap.getOrDefault(uuid, MAX_AMMO);
        if (ammo <= 0) {
            cd.mark(uuid, now);
            ammoMap.put(uuid, MAX_AMMO);
            GunCombat.sendActionBar(player, "§c弹药耗尽，进入再装填...");
            GunCombat.scheduleReloadSound(player, COOLDOWN_MS);
            return;
        }
        Long last = lastFireMap.get(uuid);
        if (last != null && (now - last) < FIRE_INTERVAL_MS) {
            return;
        }
        lastFireMap.put(uuid, now);
        ammo--;
        ammoMap.put(uuid, ammo);
        GunCombat.sendActionBar(player, "§a剩余子弹: §f" + ammo + "§a/§f" + MAX_AMMO);

        World world = player.getWorld();
        Location start = player.getEyeLocation();
        Vector dir = start.getDirection().normalize();
        RayTraceResult ray = GunCombat.rayTraceLiving(world, start, dir, RANGE, player);
        double endDist = RANGE;
        if (ray != null) {
            endDist = start.toVector().distance(ray.getHitPosition());
            if (ray.getHitEntity() instanceof LivingEntity living) {
                GunCombat.dealSit(living, player, hand, SIT_MULT);
            }
        }
        GunCombat.spawnBlackTracer(world, start, dir, endDist, 0.7);
        if (ray != null) {
            var hp = ray.getHitPosition();
            Location hitLoc = new Location(world, hp.getX(), hp.getY(), hp.getZ());
            world.spawnParticle(Particle.DUST, hitLoc, 8, 0.15, 0.15, 0.15, 0.05, GunCombat.BLACK_DUST);
            world.spawnParticle(Particle.SMOKE, hitLoc, 3, 0.1, 0.1, 0.1, 0.02);
        }
        world.playSound(start, "entity.generic.explode", 0.3f, 1.8f);
        world.playSound(start, "entity.firework_rocket.blast", 0.2f, 1.5f);
    }
}
