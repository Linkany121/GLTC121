package com.linkany121.gltc.logic.gun;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Fireball;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

/** {@code FKR_通古斯制式轨道信标投递器} */
public final class BeaconLauncherLogic extends AbstractGunLogic {

    // ===== 配置区（通古斯制式轨道信标投递器，改完需重新打包 jar 并重启生效）=====
    private static final double SIT_MULT = 10;       // 伤害倍率（命中与爆炸圈内目标均按此结算）
    private static final long COOLDOWN_MS = 5000;    // 冷却/装填时长（毫秒），5000 = 5 秒
    private static final double RANGE = 50;          // 投递点最大射程（格）
    private static final double BLAST_RADIUS = 5;    // 落地爆炸的作用半径（格）
    private static final double DROP_HEIGHT = 30;    // 信标从命中点上方多高处落下（格）
    private static final double DROP_SPEED = -5;     // 下坠速度（格/tick，负数 = 向下）

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
            GunCombat.sendActionBar(player, "§c装填中...");
            player.getWorld().playSound(player.getLocation(), "block.iron_trapdoor.open", 0.7f, 1.0f);
            return;
        }
        cd.mark(player.getUniqueId(), now);
        GunCombat.scheduleReloadSound(player, COOLDOWN_MS);

        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection();
        RayTraceResult ray = GunCombat.rayTraceLiving(world, eye, dir, RANGE, player);
        Location hitPoint;
        LivingEntity hitEntity = null;
        if (ray != null) {
            var hv = ray.getHitPosition();
            hitPoint = new Location(world, hv.getX(), hv.getY(), hv.getZ());
            if (ray.getHitEntity() instanceof LivingEntity living) {
                hitEntity = living;
            }
        } else {
            hitPoint = eye.clone().add(dir.clone().multiply(RANGE));
        }
        if (hitEntity != null) {
            GunCombat.dealSit(hitEntity, player, hand, SIT_MULT);
        }
        for (Entity ent : world.getNearbyEntities(hitPoint, BLAST_RADIUS, BLAST_RADIUS, BLAST_RADIUS)) {
            if (!(ent instanceof LivingEntity living) || ent == player) {
                continue;
            }
            if (hitEntity != null && living.getUniqueId().equals(hitEntity.getUniqueId())) {
                continue;
            }
            GunCombat.dealSit(living, player, hand, SIT_MULT);
        }
        for (int i = 0; i < 3; i++) {
            double ox = (Math.random() - 0.5) * 2.0;
            double oz = (Math.random() - 0.5) * 2.0;
            world.strikeLightningEffect(hitPoint.clone().add(ox, 0, oz));
        }
        world.spawnParticle(Particle.EXPLOSION, hitPoint, 170, 3, 3, 3, 1);
        world.spawnParticle(Particle.FLAME, hitPoint, 120, 1.5, 1.5, 1.5, 0.5);
        world.spawnParticle(Particle.CAMPFIRE_COSY_SMOKE, hitPoint, 180, 0.5, 0.5, 0.5, 0.1);
        world.playSound(hitPoint, "entity.generic.explode", 2.2f, 0.7f);
        world.playSound(hitPoint, "entity.lightning_bolt.thunder", 2.0f, 1.0f);

        Location spawnLoc = hitPoint.clone().add(0, DROP_HEIGHT, 0);
        Fireball fireball = world.spawn(spawnLoc, Fireball.class);
        fireball.setShooter(player);
        fireball.setVelocity(new Vector(0, DROP_SPEED, 0));
        fireball.setIsIncendiary(false);
        fireball.setYield(0);
        fireball.setGravity(false);
        GltcPlugin plugin = GltcPlugin.getInstance();
        if (plugin != null) {
            new BukkitRunnable() {
                @Override
                public void run() {
                    if (fireball.isValid()) {
                        fireball.remove();
                    }
                }
            }.runTaskLater(plugin, 20L);
        }
        world.spawnParticle(Particle.FLAME, eye, 10, 0.1, 0.1, 0.1, 0.05);
        world.playSound(eye, "entity.blaze.shoot", 0.5f, 1.5f);
    }
}
