package com.linkany121.gltc.logic.weapon;

import com.linkany121.gltc.GltcPlugin;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.common.GltcAbilityPower;
import com.linkany121.gltc.logic.common.GltcDamageNotify;
import com.linkany121.gltc.logic.gun.GunCombat;
import io.github.thebusybiscuit.slimefun4.api.events.PlayerRightClickEvent;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItem;
import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.FluidCollisionMode;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Entity;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.HandlerList;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.RayTraceResult;
import org.bukkit.util.Vector;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** {@code FKR_ASPL} — water blast + delayed reverse teleport. */
public final class AsplWeaponLogic implements GltcItemLogic, Listener {

    public static final String ITEM_ID = "FKR_ASPL";

    // ===== 配置区（FKR_ASPL 水爆逆传送，改完需重新打包 jar 并重启生效）=====
    private static final double SIT_DAMAGE_MULT = 5;    // 伤害倍率，实际伤害 = GltcAbilityPower.calcDamage(此值)，调大爆炸伤害更高
    private static final long COOLDOWN_MS = 4000;       // 技能冷却（毫秒），4000 = 4 秒
    private static final double RANGE = 40;             // 水柱射线最大射程（格）
    private static final double BLAST_RADIUS = 12;      // 爆炸命中/伤害的球形半径（格）
    private static final int LEVITATION_TICKS = 20;     // 命中后失重时长（tick），20 = 1 秒
    private static final int LEVITATION_LEVEL = 7;      // 失重等级（0=最弱，越高飞得越快）
    private static final long TELEPORT_DELAY = 20;      // 逆传送延迟（tick），20 = 1 秒后传回起点

    private static final Particle.DustOptions BLUE =
        new Particle.DustOptions(Color.fromRGB(0, 100, 255), 1.5f);
    private static final Particle.DustOptions LIGHT_BLUE =
        new Particle.DustOptions(Color.fromRGB(100, 200, 255), 1.2f);
    private static final Particle.DustOptions WATER_EXP =
        new Particle.DustOptions(Color.fromRGB(60, 180, 255), 1.5f);
    private static final Particle.DustOptions WATER =
        new Particle.DustOptions(Color.fromRGB(80, 200, 255), 1.2f);

    private final Map<UUID, Long> cdMap = new ConcurrentHashMap<>();
    private GltcPlugin plugin;

    public void register(GltcPlugin plugin) {
        this.plugin = plugin;
        Bukkit.getPluginManager().registerEvents(this, plugin);
    }

    public void unregister() {
        HandlerList.unregisterAll(this);
        cdMap.clear();
        plugin = null;
    }

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
        long now = System.currentTimeMillis();
        if (cdMap.containsKey(player.getUniqueId())
            && now - cdMap.get(player.getUniqueId()) < COOLDOWN_MS) {
            GunCombat.sendActionBar(player, "§c冷却中...");
            return true;
        }
        cdMap.put(player.getUniqueId(), now);

        World world = player.getWorld();
        Location startLoc = player.getEyeLocation();
        Vector dir = startLoc.getDirection().normalize();
        world.playSound(startLoc, "block.conduit.activate", 2.0f, 1.0f);

        RayTraceResult rayHit = world.rayTrace(
            startLoc, dir, RANGE, FluidCollisionMode.NEVER, false, 0.5,
            ent -> ent instanceof LivingEntity && ent != player
        );

        double endDist = RANGE;
        Location hitLoc;
        boolean hitEntity = false;
        if (rayHit != null) {
            var hitPos = rayHit.getHitPosition();
            endDist = startLoc.toVector().distance(hitPos);
            hitLoc = new Location(world, hitPos.getX(), hitPos.getY(), hitPos.getZ());
            if (rayHit.getHitEntity() != null) {
                hitEntity = true;
                hitLoc = rayHit.getHitEntity().getLocation();
            }
        } else {
            hitLoc = startLoc.clone().add(dir.clone().multiply(RANGE));
        }

        Location tracerLoc = startLoc.clone();
        Vector stepVec = dir.clone().multiply(0.5);
        int steps = (int) Math.floor(endDist / 0.5);
        for (int i = 0; i < steps; i++) {
            world.spawnParticle(Particle.DUST, tracerLoc, 4, 0.08, 0.08, 0.08, 0, BLUE);
            world.spawnParticle(Particle.DUST, tracerLoc, 2, 0.12, 0.12, 0.12, 0, LIGHT_BLUE);
            world.spawnParticle(Particle.END_ROD, tracerLoc, 1, 0.05, 0.05, 0.05, 0.01);
            tracerLoc.add(stepVec);
        }

        triggerWaterBlast(world, hitLoc, player);

        Location originLoc = player.getLocation().clone();
        float originYaw = originLoc.getYaw();
        float originPitch = originLoc.getPitch();
        Location teleportTarget = hitLoc.clone();
        if (!hitEntity) {
            teleportTarget.setY(hitLoc.getY() + 2);
        }
        teleportTarget.setYaw(originYaw + 180);
        teleportTarget.setPitch(-originPitch);

        GltcPlugin pl = plugin != null ? plugin : GltcPlugin.getInstance();
        if (pl == null) {
            return true;
        }
        new BukkitRunnable() {
            @Override
            public void run() {
                try {
                    triggerWaterBlast(world, originLoc, player);
                    world.strikeLightningEffect(originLoc);
                    player.teleport(teleportTarget);
                    world.strikeLightningEffect(teleportTarget);
                    world.playSound(originLoc, "entity.lightning_bolt.thunder", 1.0f, 1.0f);
                    world.playSound(teleportTarget, "entity.lightning_bolt.thunder", 1.0f, 1.0f);
                } catch (Throwable t) {
                    pl.getLogger().warning("[ASPL] 传送失败: " + t.getMessage());
                }
            }
        }.runTaskLater(pl, TELEPORT_DELAY);
        return true;
    }

    private static void triggerWaterBlast(World world, Location loc, Player player) {
        for (int ring = 0; ring < 5; ring++) {
            double radius = 1.0 + ring * 1.2;
            int count = 50 + ring * 15;
            for (int i = 0; i < count; i++) {
                double theta = Math.acos(2 * Math.random() - 1);
                double phi = 2 * Math.PI * Math.random();
                double px = loc.getX() + radius * Math.sin(theta) * Math.cos(phi);
                double py = loc.getY() + radius * Math.sin(theta) * Math.sin(phi);
                double pz = loc.getZ() + radius * Math.cos(theta);
                world.spawnParticle(Particle.DUST, new Location(world, px, py, pz), 2, 0.05, 0.05, 0.05, 0, WATER_EXP);
            }
        }
        for (int i = 0; i < 40; i++) {
            Location pLoc = new Location(world, loc.getX(), loc.getY() + i * 0.25, loc.getZ());
            world.spawnParticle(Particle.DUST, pLoc, 6, 0.15, 0.02, 0.15, 0, WATER);
            world.spawnParticle(Particle.CLOUD, pLoc, 3, 0.1, 0, 0.1, 0.005);
        }
        for (int ring = 0; ring < 4; ring++) {
            double waveRadius = 1.5 + ring * 2.0;
            for (int i = 0; i < 80; i++) {
                double angle = (2 * Math.PI * i) / 80;
                Location pLoc = new Location(
                    world,
                    loc.getX() + Math.cos(angle) * waveRadius,
                    loc.getY(),
                    loc.getZ() + Math.sin(angle) * waveRadius
                );
                world.spawnParticle(Particle.DUST, pLoc, 2, 0, 0, 0, 0, WATER);
            }
        }
        world.spawnParticle(Particle.CLOUD, loc, 200, 1.5, 1.5, 1.5, 0.03);
        world.spawnParticle(Particle.DUST, loc, 150, 1.5, 1.5, 1.5, 0.02, WATER_EXP);
        world.spawnParticle(Particle.END_ROD, loc, 60, 1.0, 1.0, 1.0, 0.05);
        world.playSound(loc, "entity.player.splash.high_speed", 2.0f, 0.8f);
        world.playSound(loc, "entity.generic.explode", 1.5f, 1.2f);

        ItemStack weaponItem = player.getInventory().getItemInMainHand();
        double sitDmg = GltcAbilityPower.calcDamage(SIT_DAMAGE_MULT);
        double totalDmg = 0;
        int hitCount = 0;
        for (Entity ent : world.getNearbyEntities(loc, BLAST_RADIUS, BLAST_RADIUS, BLAST_RADIUS)) {
            if (!(ent instanceof LivingEntity living) || ent == player) {
                continue;
            }
            living.setNoDamageTicks(0);
            living.damage(sitDmg, player);
            totalDmg += sitDmg;
            hitCount++;
            living.addPotionEffect(new PotionEffect(
                PotionEffectType.LEVITATION, LEVITATION_TICKS, LEVITATION_LEVEL, false, true, true
            ));
        }
        GltcDamageNotify.notifyAbilityDamageSummary(player, weaponItem, totalDmg, hitCount);
    }

    @EventHandler(priority = EventPriority.MONITOR, ignoreCancelled = true)
    public void onHeld(PlayerItemHeldEvent event) {
        ItemStack prev = event.getPlayer().getInventory().getItem(event.getPreviousSlot());
        if (isAspl(prev)) {
            cdMap.remove(event.getPlayer().getUniqueId());
        }
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent event) {
        cdMap.remove(event.getPlayer().getUniqueId());
    }

    private static boolean isAspl(ItemStack stack) {
        if (stack == null || stack.getType() == Material.AIR) {
            return false;
        }
        SlimefunItem sf = SlimefunItem.getByItem(stack);
        return sf != null && ITEM_ID.equals(sf.getId());
    }
}
