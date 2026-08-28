package com.linkany121.gltc.machine;

import com.linkany121.gltc.item.DeferredCraftingHolder;
import com.linkany121.gltc.item.GltcRecipeFixup;
import com.linkany121.gltc.util.GltcMenuHelper;
import com.linkany121.gltc.util.RecipeUtil;
import com.linkany121.gltc.util.MachineSlotContext;
import com.linkany121.gltc.util.TextUtil;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.utils.SlimefunUtils;
import me.mrCookieSlime.CSCoreLibPlugin.Configuration.Config;
import me.mrCookieSlime.Slimefun.Objects.SlimefunItem.abstractItems.AGenerator;
import me.mrCookieSlime.Slimefun.Objects.SlimefunItem.abstractItems.MachineFuel;
import me.mrCookieSlime.Slimefun.api.BlockStorage;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenu;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenuPreset;
import io.github.thebusybiscuit.slimefun4.implementation.SlimefunItems;
import io.github.thebusybiscuit.slimefun4.implementation.operations.FuelOperation;
import me.mrCookieSlime.Slimefun.api.item_transport.ItemTransportFlow;
import io.github.thebusybiscuit.slimefun4.utils.itemstack.ItemStackWrapper;
import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class GltcGenerator extends AGenerator implements DeferredCraftingHolder {

    private static final int PROGRESS_SLOT = GltcMenuHelper.GENERATOR_PROGRESS_SLOT;
    private static final int[] LEGACY_PROGRESS_SLOTS = {13, 22};

    private final int[] inputSlots;
    private final int[] outputSlots;
    private final Set<Integer> inputSlotSet = new HashSet<>();
    private final Set<Integer> outputSlotSet = new HashSet<>();
    private String inventoryTitle;
    private String menuMachineId;
    private Object[] deferredCraftingRecipe;
    private final java.util.List<DeferredFuel> deferredFuels = new java.util.ArrayList<>();

    private record DeferredFuel(int seconds, Object spec) {
    }

    public static GltcGenerator create(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int capacity,
        int production,
        int[] inputSlots,
        int[] outputSlots
    ) {
        MachineSlotContext.begin(inputSlots, outputSlots);
        try {
            return new GltcGenerator(
                itemGroup, item, recipeType, recipe, recipeOutput,
                capacity, production, inputSlots, outputSlots
            );
        } finally {
            MachineSlotContext.end();
        }
    }

    public GltcGenerator(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int capacity,
        int production,
        int[] inputSlots,
        int[] outputSlots
    ) {
        super(itemGroup, item, recipeType, recipe);
        this.recipeOutput = recipeOutput;
        this.inputSlots = inputSlots;
        this.outputSlots = outputSlots;
        for (int slot : inputSlots) {
            inputSlotSet.add(slot);
        }
        for (int slot : outputSlots) {
            outputSlotSet.add(slot);
        }

        setCapacity(Math.max(0, capacity));
        setEnergyProduction(Math.max(1, production));
    }

    @Override
    public void setDeferredCraftingRecipe(Object[] deferredRecipe) {
        this.deferredCraftingRecipe = deferredRecipe;
    }

    @Override
    public void refreshCraftingRecipe() {
        refreshFuels();
        if (deferredCraftingRecipe == null) {
            return;
        }
        ItemStack[] resolved = RecipeUtil.resolveCraftingRecipe(deferredCraftingRecipe);
        if (GltcRecipeFixup.sameRecipe(getRecipe(), resolved) && !GltcRecipeFixup.containsBarrier(resolved)) {
            return;
        }
        GltcRecipeFixup.applyRecipe(this, deferredCraftingRecipe);
        if (!GltcRecipeFixup.containsBarrier(resolved)) {
            GltcRecipeFixup.registerRecipeIfNeeded(this, resolved);
        }
    }

    @Override
    public void preRegister() {
        if (deferredCraftingRecipe != null) {
            GltcRecipeFixup.applyRecipe(this, deferredCraftingRecipe);
        }
        refreshFuels();
        super.preRegister();
        // AGenerator ctor installs a preset with progress at slot 22; replace it after parent setup.
        if (menuMachineId != null) {
            installMenuPreset();
        }
    }

    /** Queue fuel (ItemStack or DeferredStack); resolved in {@link #refreshFuels()}. */
    public void addFuel(int seconds, Object fuelSpec) {
        if (fuelSpec == null) {
            return;
        }
        deferredFuels.add(new DeferredFuel(Math.max(1, seconds), fuelSpec));
    }

    public void refreshFuels() {
        fuelTypes.clear();
        for (DeferredFuel entry : deferredFuels) {
            ItemStack resolved = RecipeUtil.resolveMaterial(entry.spec());
            if (resolved != null) {
                registerFuel(new MachineFuel(entry.seconds(), resolved));
            }
        }
    }

    public void applyMenu(String machineId, String title) {
        this.menuMachineId = machineId;
        this.inventoryTitle = title;
        installMenuPreset();
    }

    private void installMenuPreset() {
        if (menuMachineId == null) {
            return;
        }
        String parsedTitle = TextUtil.legacySection(
            inventoryTitle != null ? inventoryTitle : menuMachineId
        );
        String machineId = menuMachineId;
        new BlockMenuPreset(getId(), parsedTitle) {
            @Override
            public void init() {
                GltcMenuHelper.setupGeneratorMenu(this, machineId, inputSlots, outputSlots);
            }

            @Override
            public void newInstance(@Nonnull BlockMenu menu, @Nonnull Block b) {
                forceProgressLayout(menu);
            }

            @Override
            public boolean canOpen(@Nonnull Block b, @Nonnull Player p) {
                return true;
            }

            @Override
            public int[] getSlotsAccessedByItemTransport(ItemTransportFlow flow) {
                return flow == ItemTransportFlow.INSERT ? inputSlots : outputSlots;
            }
        };
    }

    private void forceProgressLayout(BlockMenu menu) {
        if (menu == null) {
            return;
        }
        clearLegacyProgressSlots(menu);
        ItemStack progress = menu.getItemInSlot(PROGRESS_SLOT);
        if (progress == null || progress.getType() == Material.AIR) {
            menu.replaceExistingItem(PROGRESS_SLOT, GltcMenuHelper.getProgressBarIdleItem(menuMachineId));
        }
    }

    private static boolean looksLikeProgressItem(@Nullable ItemStack item) {
        if (item == null || item.getType() == Material.AIR) {
            return false;
        }
        return item.getType() == Material.NETHER_STAR
            || item.getType() == Material.FIRE_CHARGE
            || item.getType() == Material.FLINT_AND_STEEL;
    }

    @Override
    protected void registerDefaultFuelTypes() {
        // Fuels are registered from YAML via addFuel().
    }

    @Override
    public int[] getInputSlots() {
        return MachineSlotContext.inputOr(inputSlots);
    }

    @Override
    public int[] getOutputSlots() {
        return MachineSlotContext.outputOr(outputSlots);
    }

    @Override
    @Nonnull
    public String getInventoryTitle() {
        return inventoryTitle != null ? TextUtil.legacySection(inventoryTitle) : super.getInventoryTitle();
    }

    @Override
    @Nonnull
    public ItemStack getProgressBar() {
        ItemStack item = new ItemStack(Material.FIRE_CHARGE);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(ChatColor.RED + "Generating...");
            meta.setLore(java.util.List.of(
                ChatColor.GRAY + "\u26A1 " + ChatColor.YELLOW + getEnergyProduction() + " J/t"
            ));
            item.setItemMeta(meta);
        }
        return item;
    }

    @Override
    public int getGeneratedOutput(Location l, Config data) {
        BlockMenu inv = BlockStorage.getInventory(l);
        // RSC CustomGenerator: no menu → no-op.
        if (inv == null) {
            return 0;
        }
        forceProgressLayout(inv);
        var processor = getMachineProcessor();
        FuelOperation operation = processor.getOperation(l);

        if (operation != null) {
            if (!operation.isFinished()) {
                processor.updateProgressBar(inv, PROGRESS_SLOT, operation);
                clearLegacyProgressSlots(inv);

                if (isChargeable()) {
                    int charge = getCharge(l, data);
                    if (getCapacity() - charge >= getEnergyProduction()) {
                        operation.addProgress(1);
                        return getEnergyProduction();
                    }
                    return 0;
                }

                operation.addProgress(1);
                return getEnergyProduction();
            }

            ItemStack fuel = operation.getIngredient();
            if (isBucket(fuel)) {
                inv.pushItem(new ItemStack(Material.BUCKET), getOutputSlots());
            }

            inv.replaceExistingItem(PROGRESS_SLOT, GltcMenuHelper.getProgressBarIdleItem(menuMachineId));
            clearLegacyProgressSlots(inv);
            processor.endOperation(l);
            return 0;
        }

        Map<Integer, Integer> found = new HashMap<>();
        MachineFuel fuel = findRecipe(inv, found);
        if (fuel != null) {
            for (Map.Entry<Integer, Integer> entry : found.entrySet()) {
                inv.consumeItem(entry.getKey(), entry.getValue());
            }
            processor.startOperation(l, new FuelOperation(fuel));
            processor.updateProgressBar(inv, PROGRESS_SLOT, processor.getOperation(l));
            clearLegacyProgressSlots(inv);
        } else {
            inv.replaceExistingItem(PROGRESS_SLOT, GltcMenuHelper.getProgressBarIdleItem(menuMachineId));
            clearLegacyProgressSlots(inv);
        }
        return 0;
    }

    private void clearLegacyProgressSlots(@Nullable BlockMenu inv) {
        if (inv == null) {
            return;
        }
        for (int slot : LEGACY_PROGRESS_SLOTS) {
            if (slot == PROGRESS_SLOT || outputSlotSet.contains(slot)) {
                continue;
            }
            // AGenerator defaults to slot 22 — always seal it so fuel/progress never sticks there.
            if (slot == 22) {
                inv.replaceExistingItem(slot, GltcMenuHelper.idlePane());
                continue;
            }
            ItemStack current = inv.getItemInSlot(slot);
            if (inputSlotSet.contains(slot)) {
                if (looksLikeProgressItem(current)) {
                    inv.replaceExistingItem(slot, null);
                }
                continue;
            }
            if (looksLikeProgressItem(current) || current == null || current.getType() == Material.AIR) {
                inv.replaceExistingItem(slot, GltcMenuHelper.idlePane());
            }
        }
    }

    private boolean isBucket(@Nullable ItemStack item) {
        if (item == null) {
            return false;
        }
        ItemStackWrapper wrapper = ItemStackWrapper.wrap(item);
        return item.getType() == Material.LAVA_BUCKET
            || SlimefunUtils.isItemSimilar(wrapper, SlimefunItems.FUEL_BUCKET, true)
            || SlimefunUtils.isItemSimilar(wrapper, SlimefunItems.OIL_BUCKET, true);
    }

    private MachineFuel findRecipe(BlockMenu menu, Map<Integer, Integer> found) {
        for (MachineFuel fuel : fuelTypes) {
            for (int slot : getInputSlots()) {
                if (fuel.test(menu.getItemInSlot(slot))) {
                    found.put(slot, fuel.getInput().getAmount());
                    return fuel;
                }
            }
        }
        return null;
    }
}
