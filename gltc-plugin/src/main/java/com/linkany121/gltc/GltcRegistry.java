package com.linkany121.gltc;

import com.linkany121.gltc.generated.GltcArmorSetsRegistry;
import com.linkany121.gltc.generated.GltcFoodsRegistry;
import com.linkany121.gltc.generated.GltcGeneratorsRegistry;
import com.linkany121.gltc.generated.GltcItemGroups;
import com.linkany121.gltc.generated.GltcItemsRegistry;
import com.linkany121.gltc.generated.GltcMobDropsRegistry;
import com.linkany121.gltc.generated.GltcMultiBlockRegistry;
import com.linkany121.gltc.generated.GltcRecipeMachinesRegistry;
import com.linkany121.gltc.generated.GltcRecipeTypes;
import com.linkany121.gltc.generated.GltcScriptedRegistry;
import com.linkany121.gltc.generated.GltcSimpleMultiBlockRegistry;
import com.linkany121.gltc.generated.GltcSupers;
import com.linkany121.gltc.generated.GltcTemplateMachinesRegistry;
import com.linkany121.gltc.generated.GltcWorkbenchesRegistry;
import com.linkany121.gltc.item.SavedItemLoader;
import com.linkany121.gltc.listener.GltcBlockDropListener;
import com.linkany121.gltc.listener.GltcMobDropListener;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;

public final class GltcRegistry {

    private GltcRegistry() {
    }

    public static void registerAll(SlimefunAddon addon) {
        GltcPlugin plugin = GltcPlugin.getInstance();

        SavedItemLoader.loadAll(plugin);
        com.linkany121.gltc.generated.GltcIds.registerCanonicalIds();
        com.linkany121.gltc.generated.GltcMenuBootstrap.init();
        com.linkany121.gltc.multiblock.GltcSuperMultiBlockData.load(plugin);

        GltcItemGroups.register(addon);
        GltcRecipeTypes.register(addon);

        // Scripted items (e.g. UMPV_果冻) must exist before regular items/machines resolve recipes.
        GltcScriptedRegistry.register(addon);

        GltcItemsRegistry.register(addon);
        GltcSupers.register(addon);

        GltcWorkbenchesRegistry.register(addon);
        // Mob-drop items (e.g. TSstklp) can be generator fuels — register before generators.
        GltcMobDropsRegistry.register(addon);
        // Generators before recipe machines so A_H2 guide order puts generators first.
        GltcGeneratorsRegistry.register(addon);
        GltcRecipeMachinesRegistry.register(addon);
        GltcTemplateMachinesRegistry.register(addon);
        GltcMultiBlockRegistry.register(addon);
        GltcSimpleMultiBlockRegistry.register(addon);

        GltcArmorSetsRegistry.register(addon);
        GltcFoodsRegistry.register(addon);

        com.linkany121.gltc.item.GltcRecipeFixup.schedule(plugin);
        // Scripted items register before archives; Slimefun may populate groups after onEnable.
        com.linkany121.gltc.item.GltcGuideOrderFixup.schedule(plugin);
        com.linkany121.gltc.item.GltcGroupPlaceholderBootstrap.registerMissingPlaceholders(addon);

        plugin.getServer().getPluginManager().registerEvents(new GltcMobDropListener(), plugin);
        plugin.getServer().getPluginManager().registerEvents(new GltcBlockDropListener(), plugin);
        plugin.getServer().getPluginManager().registerEvents(new com.linkany121.gltc.multiblock.GltcSuperMultiBlockListener(), plugin);
        plugin.getServer().getPluginManager().registerEvents(new com.linkany121.gltc.guide.GltcRecipeGuideListener(), plugin);
        plugin.getServer().getPluginManager().registerEvents(new com.linkany121.gltc.listener.GltcMachineBreakListener(), plugin);

        // Resolve drop ItemStacks after every Slimefun item exists.
        plugin.getServer().getScheduler().runTask(plugin, GltcBlockDropListener::warmUp);

        plugin.getLogger().info("GLTC 注册完成");
    }
}
