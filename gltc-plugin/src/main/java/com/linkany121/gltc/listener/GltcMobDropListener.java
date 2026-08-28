package com.linkany121.gltc.listener;

import com.linkany121.gltc.generated.GltcMobDropRules;
import com.linkany121.gltc.util.GltcDropItems;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDeathEvent;
import org.bukkit.inventory.ItemStack;

import java.util.concurrent.ThreadLocalRandom;

public class GltcMobDropListener implements Listener {

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onDeath(EntityDeathEvent event) {
        LivingEntity entity = event.getEntity();
        Player killer = entity.getKiller();
        if (killer == null) {
            return;
        }

        for (GltcMobDropRules.Rule rule : GltcMobDropRules.RULES) {
            if (event.getEntityType() != rule.entityType()) {
                continue;
            }
            if (ThreadLocalRandom.current().nextInt(100) >= rule.chance()) {
                continue;
            }

            ItemStack drop = GltcDropItems.cloneDrop(rule.itemId());
            if (drop == null) {
                continue;
            }

            drop.setAmount(Math.max(1, rule.amount()));
            event.getDrops().add(drop);
        }
    }
}
