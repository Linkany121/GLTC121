package com.linkany121.gltc.machine;

import com.linkany121.gltc.guide.GltcRecipeGuideHelper;
import com.linkany121.gltc.util.RecipeUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.events.MultiBlockCraftEvent;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.core.multiblocks.MultiBlockMachine;
import io.github.thebusybiscuit.slimefun4.core.services.sounds.SoundEffect;
import io.github.thebusybiscuit.slimefun4.implementation.Slimefun;
import io.github.thebusybiscuit.slimefun4.utils.SlimefunUtils;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.block.BlockFace;
import org.bukkit.block.Dispenser;
import org.bukkit.entity.Player;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.ItemStack;

import javax.annotation.Nonnull;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class GltcSimpleMultiBlock extends MultiBlockMachine {

    private final int workIndex;
    private final List<MbRecipe> mbRecipes = new ArrayList<>();
    private final Set<String> addedRecipeKeys = new HashSet<>();

    public GltcSimpleMultiBlock(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        ItemStack[] structure,
        int workSlot
    ) {
        super(itemGroup, item, structure, BlockFace.SELF);
        this.workIndex = Math.max(0, Math.min(8, workSlot - 1));
    }

    public void addMbRecipe(Map<Integer, Object> inputs, Object outputSpec) {
        mbRecipes.add(new MbRecipe(inputs, outputSpec));
    }

    public List<MbRecipe> getMbRecipes() {
        return mbRecipes;
    }

    @Override
    public void register(@Nonnull SlimefunAddon addon) {
        for (MbRecipe recipe : mbRecipes) {
            tryAddRecipe(recipe);
        }
        super.register(addon);
    }

    /** Re-resolve deferred recipes after other addons finish loading. */
    public void refreshRecipes() {
        for (MbRecipe recipe : mbRecipes) {
            recipe.invalidateIfBarrier();
            tryAddRecipe(recipe);
        }
    }

    private void tryAddRecipe(MbRecipe recipe) {
        recipe.resolve();
        ItemStack[] grid = recipe.grid();
        ItemStack output = recipe.output();
        if (output == null || output.getType() == Material.BARRIER) {
            return;
        }
        if (com.linkany121.gltc.item.GltcRecipeFixup.containsBarrier(grid)) {
            return;
        }
        String key = java.util.Arrays.deepHashCode(grid) + "|" + output.getType() + "|" + output.getAmount();
        if (!addedRecipeKeys.add(key)) {
            return;
        }
        addRecipe(grid, output);
    }

    @Override
    @Nonnull
    public List<ItemStack> getDisplayRecipes() {
        List<ItemStack> display = new ArrayList<>();
        int index = 0;
        for (MbRecipe recipe : mbRecipes) {
            recipe.resolve();
            List<RecipeUtil.GltcInputSlot> inputs = new ArrayList<>();
            for (int i = 0; i < recipe.resolvedInputs().size(); i++) {
                inputs.add(new RecipeUtil.GltcInputSlot(i, recipe.resolvedInputs().get(i), false));
            }
            List<RecipeUtil.GltcOutputSlot> outputs = new ArrayList<>();
            for (RecipeUtil.GltcOutputStack output : recipe.resolvedOutputs()) {
                outputs.add(new RecipeUtil.GltcOutputSlot(-1, output.stack(), output.chance()));
            }
            if (inputs.isEmpty() || outputs.isEmpty()) {
                index++;
                continue;
            }
            ItemStack inputDisplay = GltcRecipeGuideHelper.displayInput(getId(), inputs, index);
            ItemStack outputDisplay = GltcRecipeGuideHelper.displayOutput(getId(), outputs, 0, index);
            if (inputDisplay == null || outputDisplay == null) {
                index++;
                continue;
            }
            display.add(inputDisplay);
            display.add(outputDisplay);
            index++;
        }
        return display;
    }

    @Override
    public void onInteract(Player player, Block block) {
        ItemStack[] structure = getRecipe();
        if (workIndex >= structure.length || structure[workIndex] == null) {
            return;
        }
        if (!block.getType().equals(structure[workIndex].getType())) {
            return;
        }

        Block dispenserBlock = locateDispenser(block, structure, workIndex);
        if (dispenserBlock == null) {
            return;
        }
        if (!(dispenserBlock.getState() instanceof Dispenser dispenser)) {
            return;
        }

        Inventory inv = dispenser.getInventory();
        ItemStack[] contents = inv.getContents();
        List<ItemStack[]> inputs = RecipeType.getRecipeInputList(this);

        for (ItemStack[] input : inputs) {
            if (!isCraftable(inv, input)) {
                continue;
            }
            ItemStack output = RecipeType.getRecipeOutputList(this, input).clone();
            MultiBlockCraftEvent event = new MultiBlockCraftEvent(player, this, input, output);
            Bukkit.getPluginManager().callEvent(event);
            if (event.isCancelled() || !SlimefunUtils.canPlayerUseItem(player, output, true)) {
                return;
            }

            Inventory fakeInv = createVirtualInventory(inv);
            Inventory outputInv = findOutputInventory(event.getOutput(), dispenserBlock, inv, fakeInv);
            if (outputInv == null) {
                Slimefun.getLocalization().sendMessage(player, "machines.full-inventory", true);
                return;
            }

            for (int slot = 0; slot < input.length; slot++) {
                ItemStack item = contents[slot];
                if (item != null && item.getType() != Material.AIR && input[slot] != null) {
                    int take = Math.min(item.getAmount(), input[slot].getAmount());
                    item.setAmount(item.getAmount() - take);
                    if (item.getAmount() <= 0) {
                        inv.setItem(slot, null);
                    }
                }
            }

            SoundEffect.MAGIC_WORKBENCH_FINISH_SOUND.playAt(block);
            outputInv.addItem(event.getOutput());
            return;
        }

        if (inv.isEmpty()) {
            Slimefun.getLocalization().sendMessage(player, "machines.inventory-empty", true);
        } else {
            Slimefun.getLocalization().sendMessage(player, "machines.pattern-not-found", true);
        }
    }

    /**
     * Resolve dispenser from the 3×3 structure relative to the work block,
     * trying all horizontal rotations; fall back to any adjacent dispenser.
     */
    private static Block locateDispenser(Block trigger, ItemStack[] structure, int workIndex) {
        int dispenserIndex = -1;
        int limit = Math.min(9, structure.length);
        for (int i = 0; i < limit; i++) {
            if (structure[i] != null && structure[i].getType() == Material.DISPENSER) {
                dispenserIndex = i;
                break;
            }
        }
        if (dispenserIndex >= 0) {
            int wx = workIndex % 3;
            int wz = workIndex / 3;
            int dx = dispenserIndex % 3 - wx;
            int dz = dispenserIndex / 3 - wz;
            int[][] rotations = {
                {dx, dz}, {-dz, dx}, {-dx, -dz}, {dz, -dx}
            };
            for (int[] rot : rotations) {
                Block candidate = trigger.getRelative(rot[0], 0, rot[1]);
                if (candidate.getType() == Material.DISPENSER) {
                    return candidate;
                }
            }
        }
        return locateAdjacentDispenser(trigger);
    }

    private static Block locateAdjacentDispenser(Block trigger) {
        BlockFace[] faces = {
            BlockFace.NORTH, BlockFace.SOUTH, BlockFace.EAST, BlockFace.WEST, BlockFace.UP, BlockFace.DOWN
        };
        for (BlockFace face : faces) {
            Block relative = trigger.getRelative(face);
            if (relative.getType() == Material.DISPENSER) {
                return relative;
            }
        }
        return null;
    }

    private static boolean isCraftable(Inventory inv, ItemStack[] recipe) {
        for (int slot = 0; slot < recipe.length; slot++) {
            ItemStack required = recipe[slot];
            ItemStack actual = inv.getItem(slot);
            if (required == null || required.getType() == Material.AIR) {
                if (actual != null && actual.getType() != Material.AIR) {
                    return false;
                }
                continue;
            }
            if (actual == null || actual.getAmount() < required.getAmount()
                || !SlimefunUtils.isItemSimilar(actual, required, true)) {
                return false;
            }
        }
        return true;
    }

    private static Inventory createVirtualInventory(Inventory source) {
        Inventory copy = Bukkit.createInventory(null, source.getSize());
        copy.setContents(source.getContents());
        return copy;
    }

    public static final class MbRecipe {
        private final Map<Integer, Object> inputs;
        private final Object outputSpec;
        private ItemStack[] grid;
        private ItemStack output;
        private List<ItemStack> resolvedInputs;
        private List<RecipeUtil.GltcOutputStack> resolvedOutputs;

        public MbRecipe(Map<Integer, Object> inputs, Object outputSpec) {
            this.inputs = inputs;
            this.outputSpec = outputSpec;
        }

        public void resolve() {
            if (grid != null && !hasBarrier()) {
                return;
            }
            grid = new ItemStack[9];
            resolvedInputs = new ArrayList<>();
            if (inputs != null) {
                for (Map.Entry<Integer, Object> entry : inputs.entrySet()) {
                    int slot = entry.getKey() - 1;
                    if (slot >= 0 && slot < 9) {
                        ItemStack stack = RecipeUtil.resolveMaterial(entry.getValue());
                        grid[slot] = stack;
                        if (stack != null && stack.getType() != Material.AIR && stack.getType() != Material.BARRIER) {
                            resolvedInputs.add(stack);
                        }
                    }
                }
            }
            output = RecipeUtil.resolveMaterial(outputSpec);
            resolvedOutputs = output != null && output.getType() != Material.BARRIER
                ? List.of(new RecipeUtil.GltcOutputStack(output, 100))
                : List.of();
        }

        /** Force re-resolve on next {@link #resolve()} if barriers remain. */
        void invalidateIfBarrier() {
            if (hasBarrier()) {
                grid = null;
                output = null;
                resolvedInputs = null;
                resolvedOutputs = null;
            }
        }

        private boolean hasBarrier() {
            if (output != null && output.getType() == Material.BARRIER) {
                return true;
            }
            if (grid != null) {
                for (ItemStack stack : grid) {
                    if (stack != null && stack.getType() == Material.BARRIER) {
                        return true;
                    }
                }
            }
            return false;
        }

        public ItemStack[] grid() {
            resolve();
            return grid;
        }

        public ItemStack output() {
            resolve();
            return output;
        }

        public List<ItemStack> resolvedInputs() {
            resolve();
            return resolvedInputs;
        }

        public List<RecipeUtil.GltcOutputStack> resolvedOutputs() {
            resolve();
            return resolvedOutputs;
        }
    }
}
