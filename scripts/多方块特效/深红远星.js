var lastTrigger = new java.util.HashMap();
var Location = Java.type('org.bukkit.Location');
var Particle = Java.type('org.bukkit.Particle');
var Color = Java.type('org.bukkit.Color');
var DustOptions = Java.type('org.bukkit.Particle$DustOptions');
var Bukkit = org.bukkit.Bukkit;
var PLUGIN = Java.type('org.lins.mmmjjkx.rykenslimefuncustomizer.RykenSlimefunCustomizer').INSTANCE;
var RunnableImpl = Java.extend(Java.type('java.lang.Runnable'));
var Material = Java.type('org.bukkit.Material');
var INTERVAL_MS = 2400;
function onTick(context) {
    context.callSuper = true;
    try {
        var block = context;
        var loc = block.getLocation();
        var now = Date.now();
        var last = lastTrigger.getOrDefault(loc, 0);
        if (now - last < INTERVAL_MS) return;
        lastTrigger.put(loc, now);
        var dirX = 0, dirZ = 0;
        var found = false;
        if (block.getRelative(1, 0, 0).getType() === Material.IRON_BLOCK) {
            dirX = 1;
            found = true;
        } else if (block.getRelative(-1, 0, 0).getType() === Material.IRON_BLOCK) {
            dirX = -1;
            found = true;
        } else if (block.getRelative(0, 0, 1).getType() === Material.IRON_BLOCK) {
            dirZ = 1;
            found = true;
        } else if (block.getRelative(0, 0, -1).getType() === Material.IRON_BLOCK) {
            dirZ = -1;
            found = true;
        }
        var centerX, centerY, centerZ;
        if (found) {
            centerX = loc.getX() + dirX * 7;
            centerZ = loc.getZ() + dirZ * 7;
        } else {
            centerX = loc.getX();
            centerZ = loc.getZ();
        }
        centerY = loc.getY() + 5;
        var worldName = block.getWorld().getName();
        var _cx = centerX, _cy = centerY, _cz = centerZ, _wn = worldName;
        var runnable = new RunnableImpl({
            run: function() {
                try {
                    var world = Bukkit.getWorld(_wn);
                    if (world == null) return;
                    var cx = _cx + 0.5;
                    var cy = _cy + 0.5;
                    var cz = _cz + 0.5;
                    world.playSound(new Location(world, cx, cy, cz), "entity.generic.explode", 0.25, 1.2);
                    world.playSound(new Location(world, cx, cy, cz), "block.beacon.activate", 0.25, 1.2);
                    var red = Color.RED;
                    var darkRed = Color.fromRGB(139, 0, 0);
                    var orange = Color.fromRGB(255, 80, 0);
                    for (var ring = 0; ring < 3; ring++) {
                        var radius = 1.5 + ring * 1.5;
                        var steps = 25 + ring * 25;
                        var dustSize = 2.5 - ring * 0.5;
                        var dustColor = ring === 0 ? red : (ring === 1 ? orange : darkRed);
                        var dustOpt = new DustOptions(dustColor, dustSize);

                        for (var i = 0; i < steps; i++) {
                            var angle = (2 * Math.PI * i) / steps;
                            var px = cx + Math.cos(angle) * radius;
                            var pz = cz + Math.sin(angle) * radius;
                            world.spawnParticle(Particle.DUST, px, cy, pz, 0, 0, 0, 0, 1, dustOpt);
                        }
                    }
                    var helixSteps = 50;
                    var helixRadius = 2.0;
                    var helixHeight = 4.0;
                    var helixDust = new DustOptions(red, 1.8);
                    for (var i = 0; i < helixSteps; i++) {
                        var t = i / helixSteps;
                        var angle = t * Math.PI * 4;
                        var px = cx + Math.cos(angle) * helixRadius;
                        var py = cy + t * helixHeight;
                        var pz = cz + Math.sin(angle) * helixRadius;
                        world.spawnParticle(Particle.DUST, px, py, pz, 0, 0, 0, 0, 1, helixDust);
                    }
                    var burstCount = 30;
                    for (var i = 0; i < burstCount; i++) {
                        var theta = Math.acos(2 * Math.random() - 1);
                        var phi = 2 * Math.PI * Math.random();
                        var r = 2.5;
                        var px = cx + r * Math.sin(theta) * Math.cos(phi);
                        var py = cy + r * Math.sin(theta) * Math.sin(phi);
                        var pz = cz + r * Math.cos(theta);
                        world.spawnParticle(Particle.DUST, px, py, pz, 0, 0, 0, 0, 1, new DustOptions(red, 1.5));
                    }
                } catch (e2) {
                    Bukkit.broadcastMessage("§c[深红远星-主线程错误] " + e2);
                }
            }
        });
        Bukkit.getScheduler().runTask(PLUGIN, runnable);
    } catch (e) {
        Bukkit.broadcastMessage("§c[深红远星-错误] " + e);
    }
}
