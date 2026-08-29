package com.linkany121.gltc.script;

import com.linkany121.gltc.item.GltcSlimefunItem;
import com.linkany121.gltc.logic.GltcItemLogic;
import com.linkany121.gltc.logic.GltcLogicRegistry;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.core.handlers.BlockBreakHandler;
import io.github.thebusybiscuit.slimefun4.core.handlers.BlockPlaceHandler;
import io.github.thebusybiscuit.slimefun4.core.handlers.ItemUseHandler;
import io.github.thebusybiscuit.slimefun4.core.handlers.ToolUseHandler;
import io.github.thebusybiscuit.slimefun4.core.handlers.WeaponUseHandler;
import org.bukkit.inventory.ItemStack;

import javax.annotation.Nullable;

/**
 * Former RSC scripted item shell. Dispatches to {@link GltcItemLogic} when registered.
 */
public class GltcScriptedItem extends GltcSlimefunItem {

    @Nullable
    private final String scriptId;
    private boolean handlersBound;

    public GltcScriptedItem(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        Object[] deferredRecipe,
        ItemStack recipeOutput
    ) {
        this(itemGroup, item, recipeType, deferredRecipe, recipeOutput, null);
    }

    public GltcScriptedItem(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        Object[] deferredRecipe,
        ItemStack recipeOutput,
        @Nullable String scriptId
    ) {
        super(itemGroup, item, recipeType, deferredRecipe, recipeOutput);
        this.scriptId = scriptId;
    }

    /** Former RSC script path (porting key). */
    @Nullable
    public String getScriptId() {
        return scriptId;
    }

    @Override
    public void preRegister() {
        super.preRegister();
        bindHandlers();
    }

    private void bindHandlers() {
        if (handlersBound) {
            return;
        }
        handlersBound = true;

        addItemHandler((ItemUseHandler) e -> {
            GltcItemLogic logic = GltcLogicRegistry.item(getId());
            if (logic == null) {
                return;
            }
            if (logic.onUse(e, this)) {
                e.cancel();
            }
        });

        addItemHandler((WeaponUseHandler) (e, player, item) -> {
            GltcItemLogic logic = GltcLogicRegistry.item(getId());
            if (logic != null) {
                logic.onWeaponHit(e, player, item);
            }
        });

        addItemHandler((ToolUseHandler) (e, item, fortune, drops) -> {
            GltcItemLogic logic = GltcLogicRegistry.item(getId());
            if (logic != null) {
                logic.onToolUse(e, item, fortune, drops);
            }
        });

        addItemHandler(new BlockPlaceHandler(false) {
            @Override
            public void onPlayerPlace(org.bukkit.event.block.BlockPlaceEvent e) {
                GltcItemLogic logic = GltcLogicRegistry.item(getId());
                if (logic != null) {
                    logic.onPlace(e);
                }
            }
        });

        addItemHandler(new BlockBreakHandler(false, false) {
            @Override
            public void onPlayerBreak(
                org.bukkit.event.block.BlockBreakEvent e,
                ItemStack item,
                java.util.List<ItemStack> drops
            ) {
                GltcItemLogic logic = GltcLogicRegistry.item(getId());
                if (logic != null) {
                    logic.onBreak(e, item, drops);
                }
            }
        });
    }
}
