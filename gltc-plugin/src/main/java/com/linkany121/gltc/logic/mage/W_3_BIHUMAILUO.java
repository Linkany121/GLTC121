package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.Animals;
import org.bukkit.entity.Ambient;
import org.bukkit.entity.Entity;
import org.bukkit.entity.EntityType;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.NPC;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.UUID;

/**
 * {@code VASA_庇护脉络} — 3 环 · 沃土奥法：已投射粒子环跟随玩家 8 秒，
 * 每秒随机施加增益；环内存在敌对生物时才对其造成粒子伤害并击退。
 *
 * <p>粒子环为[已投射]状态，打开术式选择 GUI 不会被清除。
 */
public final class W_3_BIHUMAILUO implements MageSpell {

    public static final String SPELL_ID = "VASA_庇护脉络";

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    private static final long COOLDOWN_MS = 16000L;        // 施放冷却（毫秒），16000 = 16 秒
    private static final double COEFFICIENT = 2.0;         // 伤害系数，最终伤害 = 系数 × 粒子强度 × GLI
    private static final int DURATION_TICKS = 160;         // 粒子环持续时长（tick，20 = 1 秒），160 = 8 秒
    private static final double RING_RADIUS = 4;         // 粒子环半径（格）
    private static final int RING_SEGMENTS = 32;           // 环上粒子数量（越多越密，越耗性能）
    private static final int PULSE_INTERVAL = 10;          // 每多少 tick 结算一次伤害/增益，20 = 每秒一次
    private static final int BUFF_DURATION_TICKS = 100;    // 随机增益持续时长（tick），100 = 5 秒
    private static final double KNOCKBACK = 0.4;           // 环内敌人被击退的力度（越大弹得越远）

    private static final PotionEffectType[] BUFF_POOL = {   // 随机增益池，可增删下方条目
        PotionEffectType.STRENGTH,
        PotionEffectType.SPEED,
        PotionEffectType.JUMP_BOOST,
        PotionEffectType.REGENERATION,
        PotionEffectType.RESISTANCE,
        PotionEffectType.ABSORPTION
    };

    @Override
    public String id() {
        return SPELL_ID;
    }

    @Override
    public String displayName() {
        return StaffPdc.spellDisplayName(SPELL_ID);
    }

    @Override
    public long baseCooldownMs() {
        return COOLDOWN_MS;
    }

    @Override
    public double coefficient() {
        return COEFFICIENT;
    }

    @Override
    public MageSpellDamage.SpellDamageType damageType() {
        return MageSpellDamage.SpellDamageType.PARTICLE;
    }

    @Override
    public int ringCount() {
        return 3; // 庇护脉络：3环（术士等级 < 3 时越环侵蚀）
    }

    @Override
    public void onRightClick(Player player, ItemStack staff) {
        if (player == null) {
            return;
        }
        World world = player.getWorld();
        UUID casterId = player.getUniqueId();
        double damage = MageSpellUtil.calcDamage(player, COEFFICIENT);

        MageSpellUtil.playSound(world, ringCenter(player), "item.totem.use", 0.55f, 1.4f);

        final String[] tokenRef = {null};
        final BukkitRunnable task = new BukkitRunnable() {
            private int ticks;

            @Override
            public void run() {
                if (!player.isOnline()) {
                    finish();
                    return;
                }
                Location center = ringCenter(player);
                spawnRingParticles(world, center, ticks);
                if (ticks % PULSE_INTERVAL == 0) {
                    try {
                        pulseRing(player, center, damage, casterId);
                    } catch (Throwable ignored) {
                    }
                }
                ticks++;
                if (ticks >= DURATION_TICKS) {
                    finish();
                }
            }

            private void finish() {
                cancel();
                String token = tokenRef[0];
                if (token != null) {
                    MageSpellRuntime.end(player, token, false);
                }
            }
        };
        tokenRef[0] = MageSpellRuntime.begin(player, SPELL_ID, () -> {
            if (!task.isCancelled()) {
                task.cancel();
            }
        }, MageSpellRuntime.Persistence.PROJECTED);
        task.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
    }

    private static Location ringCenter(Player player) {
        return player.getLocation().clone().add(0, 0.2, 0);
    }

    private static void spawnRingParticles(World world, Location center, int tickIndex) {
        Particle a = totemParticle();
        Particle b = MageSpellUtil.happyVillager();
        for (int i = 0; i < RING_SEGMENTS; i++) {
            double ang = (Math.PI * 2 * i) / RING_SEGMENTS;
            Particle p = ((i + tickIndex) % 2) == 0 ? a : b;
            Location pt = center.clone()
                .add(Math.cos(ang) * RING_RADIUS, 0.15, Math.sin(ang) * RING_RADIUS);
            MageSpellUtil.particle(world, p, pt, 1, 0, 0.05, 0, 0.01);
        }
    }

    private static Particle totemParticle() {
        try {
            return Particle.TOTEM_OF_UNDYING;
        } catch (Throwable ignored) {
        }
        return Particle.ENCHANT;
    }

    private static void pulseRing(Player player, Location center, double damage, UUID casterId) {
        applyRandomBuff(player);
        for (Entity ent : player.getWorld().getNearbyEntities(center, RING_RADIUS, RING_RADIUS, RING_RADIUS)) {
            if (!isRingEnemy(ent, casterId)) {
                continue;
            }
            LivingEntity living = (LivingEntity) ent;
            if (insideRing(living.getLocation(), center)) {
                MageSpellDamage.dealParticleSpellDamage(player, living, SPELL_ID, damage);
                knockback(living, center);
            }
        }
    }

    /** 环内敌人：活体非玩家、非动物、非环境、非 NPC、非装饰实体。 */
    private static boolean isRingEnemy(Entity ent, UUID casterId) {
        if (!(ent instanceof LivingEntity living) || living.isDead()) {
            return false;
        }
        if (living instanceof Player || living instanceof Animals || living instanceof Ambient || living instanceof NPC) {
            return false;
        }
        EntityType type = living.getType();
        return type != EntityType.ARMOR_STAND && type != EntityType.ITEM_DISPLAY;
    }

    private static boolean insideRing(Location loc, Location center) {
        double dx = loc.getX() - center.getX();
        double dy = loc.getY() - center.getY();
        double dz = loc.getZ() - center.getZ();
        return dx * dx + dy * dy + dz * dz <= RING_RADIUS * RING_RADIUS;
    }

    private static void applyRandomBuff(Player player) {
        try {
            PotionEffectType type = BUFF_POOL[(int) Math.floor(Math.random() * BUFF_POOL.length)];
            player.addPotionEffect(new PotionEffect(type, BUFF_DURATION_TICKS, 0, false, true, true), true);
        } catch (Throwable ignored) {
        }
    }

    private static void knockback(LivingEntity ent, Location center) {
        try {
            Location el = ent.getLocation();
            double dx = el.getX() - center.getX();
            double dz = el.getZ() - center.getZ();
            double len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.01) {
                dx = Math.random() - 0.5;
                dz = Math.random() - 0.5;
                len = Math.sqrt(dx * dx + dz * dz);
                if (len < 0.01) {
                    return;
                }
            }
            ent.setVelocity(ent.getVelocity().add(new Vector(dx / len * KNOCKBACK, 0.35, dz / len * KNOCKBACK)));
        } catch (Throwable ignored) {
        }
    }
}
