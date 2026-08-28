package com.linkany121.gltc;

import com.linkany121.gltc.item.GltcRecipeFixup;
import com.linkany121.gltc.machine.GltcRecipeMachine;
import com.linkany121.gltc.multiblock.GltcSuperMultiBlockManager;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import org.bukkit.plugin.java.JavaPlugin;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.logging.Level;

public final class GltcPlugin extends JavaPlugin implements SlimefunAddon {

    private static GltcPlugin instance;

    @Override
    public void onEnable() {
        instance = this;
        saveDefaultConfig();
        GltcRegistry.registerAll(this);
    }

    @Override
    public void onDisable() {
        try {
            GltcSuperMultiBlockManager.clearAllDisplays();
        } catch (Throwable ex) {
            getLogger().log(Level.WARNING, "[SMB] disable 清理失败", ex);
        }
        GltcRecipeMachine.clearLiveRegistry();
        GltcRecipeFixup.clearRegistrationCache();
        instance = null;
    }

    @Override
    public @Nonnull JavaPlugin getJavaPlugin() {
        return this;
    }

    @Override
    public @Nullable String getBugTrackerURL() {
        return null;
    }

    public static GltcPlugin getInstance() {
        return instance;
    }
}
