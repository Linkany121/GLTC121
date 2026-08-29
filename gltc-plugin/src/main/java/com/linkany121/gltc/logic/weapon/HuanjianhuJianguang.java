package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.logic.common.GltcAbilityPower;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Player;
import org.bukkit.util.Vector;

/**
 * 剑光 (left-click) — white sword drop, {@code SIT_JIANGUANG_MULT} AoE.
 */
final class HuanjianhuJianguang {

    private HuanjianhuJianguang() {
    }

    static void cast(Player player) {
        World world = player.getWorld();
        Location eye = player.getEyeLocation();
        Vector dir = eye.getDirection().normalize();

        Location selfLoc = player.getLocation().add(0, 1.2, 0);
        world.spawnParticle(Particle.CLOUD, selfLoc, 30, 0.6, 0.6, 0.6, 0.06);
        HuanjianhuFx.spawnDust(world, selfLoc, 12, 0.5, 0.5, 0.5, 0, HuanjianhuFx.WHITE_DUST);
        world.playSound(selfLoc, "block.fire.extinguish", 1.0f, 1.6f);
        world.playSound(selfLoc, "entity.player.attack.sweep", 0.6f, 1.8f);
        world.playSound(selfLoc, "entity.wither.shoot", 0.8f, 1.2f);

        HuanjianhuFx.RayHit ray = HuanjianhuFx.rayTraceLivingAhead(
            world, eye, dir, HuanjianhuWeaponLogic.JIANGUANG_RANGE, player
        );
        double endDist = ray.distance;
        Location hitLoc = ray.loc;
        if (ray.entity != null) {
            hitLoc = ray.entity.getLocation();
        }

        Location tracer = eye.clone();
        Vector stepVec = dir.clone().multiply(0.4);
        int steps = (int) Math.floor(endDist / 0.4);
        for (int i = 0; i < steps; i++) {
            HuanjianhuFx.spawnDust(world, tracer, 1, 0.02, 0.02, 0.02, 0, HuanjianhuFx.WHITE_DUST);
            world.spawnParticle(Particle.END_ROD, tracer, 1, 0.05, 0.05, 0.05, 0);
            tracer.add(stepVec);
        }

        Location target = hitLoc != null
            ? hitLoc.clone()
            : eye.clone().add(dir.clone().multiply(HuanjianhuWeaponLogic.JIANGUANG_RANGE));
        target.setY(world.getHighestBlockYAt(target.getBlockX(), target.getBlockZ()) - 0.5);
        world.spawnParticle(Particle.END_ROD, target, 30, 1, 1, 1, 0.05);
        world.playSound(player.getLocation(), "block.anvil.land", 1.0f, 1.2f);

        double dmg = GltcAbilityPower.calcDamage(HuanjianhuWeaponLogic.SIT_JIANGUANG_MULT);
        HuanjianhuFx.summonSwordDrop(
            world, target, player,
            HuanjianhuFx.WHITE_DUST,
            HuanjianhuWeaponLogic.JIANGUANG_SWORD_DROP_HEIGHT,
            HuanjianhuWeaponLogic.JIANGUANG_SWORD_DROP_TICK,
            HuanjianhuWeaponLogic.AOE_RADIUS,
            dmg,
            (w, loc, p, hitAny) -> {
                w.spawnParticle(Particle.CLOUD, loc, 20, 1.0, 1.0, 1.0, 0.04);
                HuanjianhuFx.spawnDust(w, loc, 25, 1.2, 1.2, 1.2, 0, HuanjianhuFx.WHITE_DUST);
                w.playSound(loc, "block.anvil.land", 1.0f, 1.1f);
                p.getWorld().playSound(p.getLocation(), "block.anvil.land", 1.0f, 1.05f);
                if (hitAny) {
                    p.getWorld().playSound(p.getLocation(), "entity.player.attack.sweep", 1.0f, 1.2f);
                }
            }
        );

        HuanjianhuWeaponLogic.addXinTingStack(player);
    }
}
