package com.linkany121.gltc.logic.gun;

import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

/** {@code FKR_通古斯制式步枪} */
public final class RifleGunLogic extends AbstractGunLogic {

    // ===== 配置区（通古斯制式步枪，改完需重新打包 jar 并重启生效）=====
    private static final double SIT_MULT = 1.6;     // 单发伤害倍率，实际伤害 = GltcDamageNotify.dealSitDamage(此值)
    private static final long COOLDOWN_MS = 500;    // 射击间隔/冷却（毫秒），500 = 0.5 秒一发
    private static final double RANGE = 40;         // 有效射程（格）

    private final GunCombat.CooldownMap cd = new GunCombat.CooldownMap();

    @Override
    public void clearGunState(Player player) {
        if (player != null) {
            cd.clear(player.getUniqueId());
        }
    }

    @Override
    protected void fire(Player player, ItemStack hand) {
        long now = System.currentTimeMillis();
        if (cd.onCooldown(player.getUniqueId(), now, COOLDOWN_MS)) {
            GunCombat.sendActionBar(player, "§c射击过于频繁！");
            player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7f, 1.0f);
            return;
        }
        cd.mark(player.getUniqueId(), now);
        GunCombat.scheduleReloadSound(player, COOLDOWN_MS);

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
            GunCombat.spawnHitBurst(world, new Location(world, hp.getX(), hp.getY(), hp.getZ()), GunCombat.BLACK_DUST);
        }
        world.playSound(start, "entity.generic.explode", 0.5f, 1.5f);
        world.playSound(start, "entity.firework_rocket.blast", 0.3f, 1.3f);
    }
}
