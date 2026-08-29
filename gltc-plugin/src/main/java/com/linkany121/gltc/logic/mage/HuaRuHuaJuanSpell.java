package com.linkany121.gltc.logic.mage;

import com.linkany121.gltc.GltcPlugin;
import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.Particle;
import org.bukkit.World;
import org.bukkit.entity.ItemDisplay;
import org.bukkit.entity.LivingEntity;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.util.Vector;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * {@code VASA_花如画卷} — 4 环 · 沃土奥法：
 * 右键进入[未投射]蓄力状态，每 0.5 秒生成一朵环绕花（5 秒后自然结束）；
 * 左键将已生成的环绕花齐射出去（追踪弹），命中造成粒子伤害。
 *
 * <p>环绕花为[未投射]：打开术式选择 GUI / 切换术式时清除；
 * 已发射的追踪弹为[已投射]，保留至自然结束。
 */
public final class HuaRuHuaJuanSpell implements MageSpell {

    public static final String SPELL_ID = "VASA_花如画卷";

    // ===== 配置区（改完需重新打包 jar 并重启生效）=====
    private static final long COOLDOWN_MS = 12000L;         // 施放冷却（毫秒），12000 = 12 秒
    private static final double COEFFICIENT = 1.5;          // 伤害系数，最终伤害 = 系数 × 粒子强度 × GLI
    private static final float DISPLAY_SCALE = 1.2f;       // 环绕花模型缩放（1.0 = 原大小）
    private static final int STATE_DURATION = 100;          // 蓄力状态最长持续（tick），100 = 5 秒，超时自动结束
    private static final int SPAWN_INTERVAL = 10;           // 每多少 tick 生成一朵新花，10 = 0.5 秒一朵
    private static final double ORBIT_RADIUS = 3;         // 花朵环绕玩家旋转的半径（格）
    private static final double ORBIT_SPIN = 0.08;          // 每 tick 花朵绕行角度增量（弧度），调大转得越快
    private static final double ORBIT_DRIFT = 0.12;         // 生成新花的起始角度偏移（弧度）
    private static final double LAUNCH_PER_TICK = 32.0 / 20.0; // 追踪弹每 tick 飞行格数，16/20 = 16 格/秒
    private static final double LAUNCH_MAX_DIST = 32.0;     // 追踪弹最大飞行距离（格）
    private static final double LAUNCH_HOMING = 0.6;       // 追踪转向权重（0~1），越大转向越灵敏，1 = 瞬间锁头
    private static final double LAUNCH_AIM_DIST = 28.0;     // 预瞄目标点距离（格），决定追踪终点
    private static final double HIT_HALF = 1.1;             // 追踪弹命中判定半宽（格）

    private static final Material[] FLOWER_POOL = {
        Material.DANDELION, Material.POPPY, Material.BLUE_ORCHID, Material.ALLIUM,
        Material.AZURE_BLUET, Material.OXEYE_DAISY, Material.CORNFLOWER,
        Material.LILY_OF_THE_VALLEY
    };

    private static final Particle CHERRY = cherryParticle();

    /** 玩家 UUID → 蓄力状态（同一玩家同时只有一个）。 */
    private static final ConcurrentHashMap<UUID, State> STATES = new ConcurrentHashMap<>();

    private static Particle cherryParticle() {
        try {
            return Particle.CHERRY_LEAVES;
        } catch (Throwable ignored) {
        }
        return Particle.END_ROD;
    }

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
    public void onRightClick(Player player, ItemStack staff) {
        if (player == null) {
            return;
        }
        UUID uuid = player.getUniqueId();

        // 若已有蓄力状态（理论上冷却内不会重叠），先终止旧状态
        State old = STATES.get(uuid);
        if (old != null) {
            old.stop();
            MageSpellRuntime.end(player, old.token, true);
        }

        double damage = MageSpellUtil.calcDamage(player, COEFFICIENT);
        final String[] tokenRef = {null};
        final List<Orbiter> orbiters = new CopyOnWriteArrayList<>();
        final BukkitRunnable task = new BukkitRunnable() {
            private int ticks;
            private double angleBase;

            @Override
            public void run() {
                if (!player.isOnline()) {
                    finish();
                    return;
                }
                Location center = player.getLocation().clone().add(0, 1.0, 0);
                angleBase += ORBIT_DRIFT;

                if (ticks % SPAWN_INTERVAL == 0) {
                    double spawnAng = angleBase + orbiters.size() * 0.9;
                    Location spawnLoc = center.clone();
                    spawnLoc.setX(center.getX() + Math.cos(spawnAng) * ORBIT_RADIUS);
                    spawnLoc.setZ(center.getZ() + Math.sin(spawnAng) * ORBIT_RADIUS);
                    ItemDisplay nd = MageSpellUtil.spawnDisplay(player.getWorld(), spawnLoc, randomFlower(), DISPLAY_SCALE);
                    if (nd != null) {
                        orbiters.add(new Orbiter(nd, spawnAng));
                    }
                }

                // 每 2 tick 更新一次环绕位置与粒子，降低渲染压力（原为每 tick）
                if (ticks % 2 == 0) {
                    for (int i = orbiters.size() - 1; i >= 0; i--) {
                        Orbiter o = orbiters.get(i);
                        if (o.projected) {
                            continue;
                        }
                        if (!MageSpellUtil.displayAlive(o.display)) {
                            orbiters.remove(i);
                            continue;
                        }
                        o.angle += ORBIT_SPIN * 2;
                        Location oloc = center.clone();
                        oloc.setX(center.getX() + Math.cos(o.angle) * ORBIT_RADIUS);
                        oloc.setZ(center.getZ() + Math.sin(o.angle) * ORBIT_RADIUS);
                        MageSpellUtil.moveDisplay(o.display, oloc);
                        MageSpellUtil.particle(player.getWorld(), CHERRY, oloc, 1, 0.1, 0.1, 0.1, 0.01);
                    }
                }

                ticks++;
                if (ticks >= STATE_DURATION) {
                    finish();
                }
            }

            private void finish() {
                cancel();
                boolean online = player.isOnline();
                for (Orbiter o : orbiters) {
                    if (o.projected) {
                        continue;
                    }
                    // 环绕自然结束时：若还有未投出的花，全部投出；仅玩家离线时直接移除
                    if (online && launchHoming(player, o, damage)) {
                        continue;
                    }
                    MageSpellUtil.removeDisplay(o.display);
                }
                orbiters.clear();
                STATES.remove(uuid);
                String token = tokenRef[0];
                if (token != null) {
                    MageSpellRuntime.end(player, token, false);
                }
            }
        };

        State state = new State(uuid, damage, orbiters, task);
        tokenRef[0] = MageSpellRuntime.begin(
            player,
            SPELL_ID,
            state::stop,
            MageSpellRuntime.Persistence.UNPROJECTED
        );
        if (tokenRef[0] == null) {
            task.cancel();
            for (Orbiter o : orbiters) {
                MageSpellUtil.removeDisplay(o.display);
            }
            return;
        }
        state.token = tokenRef[0];
        STATES.put(uuid, state);
        MageSpellUtil.playSound(player.getWorld(), player.getLocation(), "block.cherry_leaves.place", 0.85f, 1.1f);
        task.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
    }

    @Override
    public boolean onLeftClick(Player player, ItemStack staff) {
        if (player == null) {
            return false;
        }
        State state = STATES.get(player.getUniqueId());
        if (state == null || !state.alive) {
            return false;
        }
        int launched = 0;
        for (Orbiter o : state.orbiters) {
            if (o.projected) {
                continue;
            }
            if (launchHoming(player, o, state.damage)) {
                launched++;
            } else {
                o.projected = false;
            }
        }
        if (launched > 0) {
            MageSpellUtil.playSound(player.getWorld(), player.getEyeLocation(), "entity.arrow.shoot", 0.65f, 1.35f);
        }
        return true;
    }

    /** 将一朵环绕花发射为追踪弹（[已投射]会话）。 */
    private static boolean launchHoming(Player player, Orbiter o, double damage) {
        ItemDisplay display = o.display;
        if (!MageSpellUtil.displayAlive(display)) {
            return false;
        }
        World world = player.getWorld();
        Location loc = display.getLocation().clone();
        UUID casterId = player.getUniqueId();

        final String[] tokenRef = {null};
        final BukkitRunnable task = new BukkitRunnable() {
            private double traveled;
            private Vector dir = player.getEyeLocation().getDirection().clone();

            @Override
            public void run() {
                Player caster = Bukkit.getPlayer(casterId);
                if (caster == null || !caster.isOnline()) {
                    finish(caster);
                    return;
                }
                Location eye = caster.getEyeLocation();
                Location aim = eye.clone().add(eye.getDirection().multiply(LAUNCH_AIM_DIST));
                dir = blendVec(dir, aim.toVector().subtract(loc.toVector()), LAUNCH_HOMING);
                if (dir == null) {
                    finish(caster);
                    return;
                }
                Location prev = loc.clone();
                loc.add(dir.clone().multiply(LAUNCH_PER_TICK));
                traveled += prev.distance(loc);
                MageSpellUtil.moveDisplay(display, loc);

                boolean hitSolid = loc.getBlock().getType().isSolid();
                LivingEntity hit = MageSpellUtil.findHit(world, loc, casterId, HIT_HALF);
                if (hit == null && !hitSolid && traveled < LAUNCH_MAX_DIST) {
                    return;
                }
                if (hit != null) {
                    MageSpellDamage.dealParticleSpellDamage(caster, hit, SPELL_ID, damage);
                }
                finish(caster);
            }

            private void finish(Player caster) {
                cancel();
                MageSpellUtil.removeDisplay(display);
                String token = tokenRef[0];
                if (token != null) {
                    MageSpellRuntime.end(caster, token, false);
                }
            }
        };
        tokenRef[0] = MageSpellRuntime.begin(player, SPELL_ID, () -> {
            if (!task.isCancelled()) {
                task.cancel();
            }
            MageSpellUtil.removeDisplay(display);
        }, MageSpellRuntime.Persistence.PROJECTED);
        if (tokenRef[0] == null) {
            MageSpellUtil.removeDisplay(display);
            return false;
        }
        o.display = null;
        task.runTaskTimer(GltcPlugin.getInstance(), 0L, 1L);
        return true;
    }

    /** 视线方向与目标方向按权重混合。 */
    private static Vector blendVec(Vector forward, Vector toward, double weight) {
        Vector f = forward.clone().normalize();
        Vector t = toward.clone();
        double tLen = t.length();
        if (tLen < 1.0e-6) {
            t = new Vector(0, 0, 1);
        } else {
            t.normalize();
        }
        Vector blended = new Vector(
            f.getX() * (1 - weight) + t.getX() * weight,
            f.getY() * (1 - weight) + t.getY() * weight,
            f.getZ() * (1 - weight) + t.getZ() * weight
        );
        double len = blended.length();
        if (len < 1.0e-6) {
            return new Vector(0, 0, 1);
        }
        return blended.normalize();
    }

    private static Material randomFlower() {
        return FLOWER_POOL[(int) Math.floor(Math.random() * FLOWER_POOL.length)];
    }

    /** 一朵环绕花。 */
    private static final class Orbiter {
        ItemDisplay display;
        double angle;
        boolean projected;

        Orbiter(ItemDisplay display, double angle) {
            this.display = display;
            this.angle = angle;
        }
    }

    /** 单玩家蓄力状态。 */
    private static final class State {
        final UUID owner;
        final double damage;
        final List<Orbiter> orbiters;
        final BukkitRunnable task;
        volatile String token;
        volatile boolean alive = true;

        State(UUID owner, double damage, List<Orbiter> orbiters, BukkitRunnable task) {
            this.owner = owner;
            this.damage = damage;
            this.orbiters = orbiters;
            this.task = task;
        }

        /** 幂等停止：移除剩余环绕花、取消任务、清理状态表。 */
        void stop() {
            if (!alive) {
                return;
            }
            alive = false;
            STATES.remove(owner);
            if (task != null && !task.isCancelled()) {
                task.cancel();
            }
            for (Orbiter o : orbiters) {
                if (!o.projected) {
                    MageSpellUtil.removeDisplay(o.display);
                }
            }
            orbiters.clear();
        }
    }
}
