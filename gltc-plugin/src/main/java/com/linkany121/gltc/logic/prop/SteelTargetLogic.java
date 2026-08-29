package com.linkany121.gltc.logic.prop;

import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.gun.GunCombat;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.attribute.Attribute;
import org.bukkit.attribute.AttributeInstance;
import org.bukkit.entity.IronGolem;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;

/**
 * {@code FKR_钢铁靶} — consume one, deploy a 2000-HP iron golem with weakness/slowness 100.
 */
public final class SteelTargetLogic implements GltcItemLogic {

    public static final String ITEM_ID = "FKR_钢铁靶";

    // ===== 配置区（钢铁靶 数值，改完需重新打包 jar 并重启生效）=====
    private static final double MAX_HEALTH = 2000;      // 靶子的最大生命值
    private static final int WEAKNESS_LEVEL = 99;      // 虚弱等级（让靶子几乎不反击）
    private static final int SLOWNESS_LEVEL = 99;      // 缓慢等级（让靶子几乎不动）
    private static final int EFFECT_DURATION = 1_000_000;  // 药水效果时长（tick），约 13.9 小时

    @Override
    public boolean onUse(PlayerRightClickEvent event, SlimefunItem item) {
        Player player = event.getPlayer();
        ItemStack hand = player.getInventory().getItemInMainHand();
        if (hand.getType() == Material.AIR) {
            return true;
        }
        SlimefunItem sf = SlimefunItem.getByItem(hand);
        if (sf == null || !ITEM_ID.equals(sf.getId())) {
            return true;
        }

        hand.setAmount(hand.getAmount() - 1);

        World world = player.getWorld();
        Location loc = player.getLocation().add(0, 1, 0);
        IronGolem golem = world.spawn(loc, IronGolem.class);

        AttributeInstance maxHp = golem.getAttribute(Attribute.GENERIC_MAX_HEALTH);
        if (maxHp != null) {
            maxHp.setBaseValue(MAX_HEALTH);
        }
        golem.setHealth(MAX_HEALTH);

        try {
            golem.setRemoveWhenFarAway(false);
        } catch (Throwable ignored) {
        }
        try {
            golem.setPersistent(true);
        } catch (Throwable ignored) {
        }

        PotionEffectType weakness = PotionEffectType.getByName("WEAKNESS");
        PotionEffectType slowness = PotionEffectType.getByName("SLOWNESS");
        if (weakness != null) {
            golem.addPotionEffect(new PotionEffect(weakness, EFFECT_DURATION, WEAKNESS_LEVEL, false, true, true));
        }
        if (slowness != null) {
            golem.addPotionEffect(new PotionEffect(slowness, EFFECT_DURATION, SLOWNESS_LEVEL, false, true, true));
        }

        world.playSound(loc, "entity.iron_golem.repair", 1.0f, 1.0f);
        world.playSound(loc, "block.anvil.land", 1.0f, 0.8f);
        world.spawnParticle(
            Particle.CRIT,
            loc.clone().add(0, golem.getHeight() / 2.0, 0),
            30, 0.5, 1.0, 0.5, 0.1
        );

        GunCombat.sendActionBar(player, "OK");
        return true;
    }
}
