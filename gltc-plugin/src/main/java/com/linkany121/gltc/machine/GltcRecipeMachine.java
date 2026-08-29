package com.linkany121.gltc.machine;

import com.linkany121.gltc.guide.GltcRecipeGuideHelper;
import com.linkany121.gltc.item.DeferredCraftingHolder;
import com.linkany121.gltc.item.GltcRecipeFixup;
import com.linkany121.gltc.util.GltcMenuHelper;
import com.linkany121.gltc.util.MachineSlotContext;
import com.linkany121.gltc.util.RecipeUtil;
import com.linkany121.gltc.util.TextUtil;
import io.github.thebusybiscuit.slimefun4.api.SlimefunAddon;
import io.github.thebusybiscuit.slimefun4.api.items.ItemGroup;
import io.github.thebusybiscuit.slimefun4.api.items.SlimefunItemStack;
import io.github.thebusybiscuit.slimefun4.api.recipes.RecipeType;
import io.github.thebusybiscuit.slimefun4.core.attributes.RecipeDisplayItem;
import io.github.thebusybiscuit.slimefun4.utils.SlimefunUtils;
import me.mrCookieSlime.Slimefun.Objects.SlimefunItem.abstractItems.AContainer;
import me.mrCookieSlime.Slimefun.Objects.SlimefunItem.abstractItems.MachineRecipe;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenu;
import me.mrCookieSlime.Slimefun.api.inventory.BlockMenuPreset;
import me.mrCookieSlime.Slimefun.api.item_transport.ItemTransportFlow;
import org.bukkit.ChatColor;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

public class GltcRecipeMachine extends AContainer implements RecipeDisplayItem, DeferredCraftingHolder {

    private final int[] inputSlots;
    private final int[] outputSlots;
    protected final List<GltcMachineRecipe> gltcRecipes = new ArrayList<>();
    private String menuMachineId;
    private String inventoryTitle;
    protected int progressBarSlot = 22;
    private boolean runtimeRecipesBuilt;
    private Object[] deferredCraftingRecipe;
    private final Map<String, GltcMachineRecipe> activeGltcRecipes = new HashMap<>();
    private static final java.util.Set<GltcRecipeMachine> LIVE = java.util.concurrent.ConcurrentHashMap.newKeySet();
    /** When YAML energyPerCraft is 0, RSC-style free run (no charge drain). */
    private final boolean freeToRun;

    public static GltcRecipeMachine create(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int energyCapacity,
        int energyPerCraft,
        int[] inputSlots,
        int[] outputSlots
    ) {
        MachineSlotContext.begin(inputSlots, outputSlots);
        try {
            return new GltcRecipeMachine(
                itemGroup, item, recipeType, recipe, recipeOutput,
                energyCapacity, energyPerCraft, inputSlots, outputSlots
            );
        } finally {
            MachineSlotContext.end();
        }
    }

    public GltcRecipeMachine(
        ItemGroup itemGroup,
        SlimefunItemStack item,
        RecipeType recipeType,
        ItemStack[] recipe,
        ItemStack recipeOutput,
        int energyCapacity,
        int energyPerCraft,
        int[] inputSlots,
        int[] outputSlots
    ) {
        super(itemGroup, item, recipeType, recipe);
        this.inputSlots = inputSlots;
        this.outputSlots = outputSlots;

        int capacity = Math.max(1, energyCapacity);
        // Allow 0 J/craft (authored free machines); SF API still needs a positive consumption field.
        this.freeToRun = energyPerCraft <= 0;
        int consumption = freeToRun ? 1 : Math.max(1, energyPerCraft);
        if (consumption > capacity) {
            consumption = capacity;
        }

        setCapacity(capacity);
        setEnergyConsumption(consumption);
        setProcessingSpeed(1);
    }

    /**
     * YAML {@code speed} — divides each recipe's seconds directly, matching RSC semantics.
     * e.g. a 16s recipe on a machine with speed 4 becomes a 4s recipe.
     */
    public void applyYamlSpeed(int speed) {
        if (speed > 1) {
            for (GltcMachineRecipe recipe : gltcRecipes) {
                recipe.scaleSeconds(speed);
            }
        }
        setProcessingSpeed(1);
    }

    @Override
    protected boolean takeCharge(Location l) {
        if (freeToRun) {
            return true;
        }
        return super.takeCharge(l);
    }

    @Override
    public void setDeferredCraftingRecipe(Object[] deferredRecipe) {
        this.deferredCraftingRecipe = deferredRecipe;
    }

    @Override
    public void refreshCraftingRecipe() {
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
        super.preRegister();
    }

    public void addGltcRecipe(
        int seconds,
        List<RecipeUtil.GltcInputSlot> inputs,
        List<RecipeUtil.GltcOutputSlot> outputs,
        boolean noConsume
    ) {
        gltcRecipes.add(new GltcMachineRecipe(Math.max(0, seconds), inputs, outputs, noConsume));
    }

    protected boolean shouldRegisterMachineRecipes() {
        return true;
    }

    protected void buildRuntimeRecipes() {
        if (runtimeRecipesBuilt) {
            return;
        }
        runtimeRecipesBuilt = true;
        recipes.clear();

        for (GltcMachineRecipe recipe : gltcRecipes) {
            recipe.resolve();
            if (!shouldRegisterMachineRecipes() || recipe.resolvedOutputSlots().isEmpty()) {
                continue;
            }

            ItemStack[] outArr = recipe.resolvedOutputSlots().stream()
                .filter(o -> o.chance() >= 100)
                .map(RecipeUtil.GltcOutputSlot::resolvedStack)
                .toArray(ItemStack[]::new);
            ItemStack[] inArr = recipe.resolvedInputSlots().stream()
                .map(RecipeUtil.GltcInputSlot::resolvedStack)
                .toArray(ItemStack[]::new);
            if (outArr.length > 0 && inArr.length > 0) {
                registerRecipe(recipe.seconds(), inArr, outArr);
            }
        }
    }

    @Override
    public void register(@Nonnull SlimefunAddon addon) {
        buildRuntimeRecipes();
        super.register(addon);
        LIVE.add(this);
    }

    public void applyMenu(String machineId, String title) {
        this.menuMachineId = machineId;
        this.inventoryTitle = title;
        this.progressBarSlot = GltcMenuHelper.findProgressBarSlot(machineId);
        String parsedTitle = TextUtil.legacySection(title);

        new BlockMenuPreset(getId(), parsedTitle) {
            @Override
            public void init() {
                GltcMenuHelper.setupMachineMenu(this, machineId, inputSlots, outputSlots, progressBarSlot);
                configureMenuPreset(this);
            }

            @Override
            public boolean canOpen(@Nonnull Block b, @Nonnull Player p) {
                return canOpenMachine(b, p);
            }

            @Override
            public int[] getSlotsAccessedByItemTransport(ItemTransportFlow flow) {
                return flow == ItemTransportFlow.INSERT ? transportInsertSlots() : outputSlots;
            }
        };
    }

    protected boolean canOpenMachine(@Nonnull Block b, @Nonnull Player p) {
        return true;
    }

    protected void configureMenuPreset(BlockMenuPreset preset) {
    }

    /** Cargo INSERT slots; template machines exclude the template slot. */
    protected int[] transportInsertSlots() {
        return inputSlots;
    }

    @Override
    public int[] getInputSlots() {
        return MachineSlotContext.inputOr(inputSlots);
    }

    @Override
    public int[] getOutputSlots() {
        return MachineSlotContext.outputOr(outputSlots);
    }

    @Nullable
    public String getMenuMachineId() {
        return menuMachineId;
    }

    @Override
    @Nonnull
    public String getInventoryTitle() {
        return inventoryTitle != null ? TextUtil.legacySection(inventoryTitle) : super.getInventoryTitle();
    }

    @Override
    @Nonnull
    public String getMachineIdentifier() {
        return getId();
    }

    @Override
    @Nonnull
    public ItemStack getProgressBar() {
        ItemStack item = new ItemStack(Material.FIRE_CHARGE);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(ChatColor.RED + "Processing...");
            String energyLine = freeToRun
                ? ChatColor.GRAY + "\u26A1 " + ChatColor.GREEN + "免费运行"
                : ChatColor.GRAY + "\u26A1 " + ChatColor.YELLOW + getEnergyConsumption() + " J/t";
            meta.setLore(java.util.List.of(energyLine));
            item.setItemMeta(meta);
        }
        return item;
    }

    public List<GltcMachineRecipe> getGltcRecipes() {
        return gltcRecipes;
    }

    protected ItemStack getIdleProgressItem() {
        if (menuMachineId == null) {
            return emptyProgressSlot();
        }
        return GltcMenuHelper.getProgressBarIdleItem(menuMachineId);
    }

    @Override
    @Nonnull
    public List<ItemStack> getDisplayRecipes() {
        List<ItemStack> display = new ArrayList<>();
        int index = 0;
        for (GltcMachineRecipe recipe : gltcRecipes) {
            recipe.resolve();
            List<RecipeUtil.GltcInputSlot> inputs = recipe.resolvedInputSlots();
            List<RecipeUtil.GltcOutputSlot> outputs = recipe.resolvedOutputSlots();
            if (inputs.isEmpty() || outputs.isEmpty()) {
                index++;
                continue;
            }
            ItemStack inputDisplay = GltcRecipeGuideHelper.displayInput(getId(), inputs, index);
            ItemStack outputDisplay = GltcRecipeGuideHelper.displayOutput(getId(), outputs, recipe.seconds(), index);
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

    protected int getProgressBarSlot() {
        return progressBarSlot;
    }

    @Override
    protected MachineRecipe findNextRecipe(BlockMenu inv) {
        // Custom tick() owns matching; consume-on-finish — never consume here.
        for (GltcMachineRecipe gltcRecipe : gltcRecipes) {
            gltcRecipe.resolve();
            if (!matchesGltcRecipe(inv, gltcRecipe)) {
                continue;
            }
            if (!canFitGltcOutputs(inv, gltcRecipe)) {
                return null;
            }
            return toMachineRecipe(gltcRecipe);
        }
        return null;
    }

    @Override
    protected void tick(Block b) {
        com.linkany121.gltc.logic.GltcMachineLogic logic =
            com.linkany121.gltc.logic.GltcLogicRegistry.machine(getId());
        if (logic != null && logic.onTick(b.getLocation(), this)) {
            return;
        }

        if (!canProcess(b)) {
            return;
        }

        BlockMenu inv = me.mrCookieSlime.Slimefun.api.BlockStorage.getInventory(b);
        if (inv == null) {
            return;
        }

        String blockKey = blockKey(b);
        if (blockKey == null) {
            return;
        }
        var processor = getMachineProcessor();
        var currentOperation = processor.getOperation(b);

        if (currentOperation != null) {
            GltcMachineRecipe activeRecipe = activeGltcRecipes.get(blockKey);
            if (activeRecipe == null) {
                // Stale operation without our tracking — cancel; do not push guaranteed-only fallback.
                processor.endOperation(b);
                inv.replaceExistingItem(getProgressBarSlot(), getIdleProgressItem());
                return;
            }
            if (!isOperationStillValid(inv, activeRecipe)) {
                cancelGltcOperation(b, inv, blockKey);
                return;
            }
            // Do not charge while outputs are full (no progress possible).
            if (!canFitGltcOutputs(inv, activeRecipe, templateAmount(inv))) {
                inv.replaceExistingItem(getProgressBarSlot(), getIdleProgressItem());
                return;
            }
            if (!takeCharge(b.getLocation())) {
                return;
            }
            tickGltcOperation(b, inv, blockKey, activeRecipe, currentOperation);
            return;
        }

        for (GltcMachineRecipe gltcRecipe : gltcRecipes) {
            gltcRecipe.resolve();
            if (!matchesGltcRecipe(inv, gltcRecipe)) {
                continue;
            }
            int multiplier = templateAmount(inv);
            if (!canFitGltcOutputs(inv, gltcRecipe, multiplier)) {
                continue;
            }
            if (!takeCharge(b.getLocation())) {
                return;
            }
            // Consume on finish so cancel / template-loss does not destroy inputs.
            activeGltcRecipes.put(blockKey, gltcRecipe);
            var operation = new io.github.thebusybiscuit.slimefun4.implementation.operations.CraftingOperation(
                toMachineRecipe(gltcRecipe)
            );
            processor.startOperation(b, operation);
            processor.updateProgressBar(inv, getProgressBarSlot(), operation);
            return;
        }
    }

    protected void tickGltcOperation(
        Block b,
        BlockMenu inv,
        String blockKey,
        GltcMachineRecipe recipe,
        io.github.thebusybiscuit.slimefun4.implementation.operations.CraftingOperation operation
    ) {
        // Validity / fit / charge already handled in tick().
        var processor = getMachineProcessor();
        if (!operation.isFinished()) {
            processor.updateProgressBar(inv, getProgressBarSlot(), operation);
            int step = Math.max(1, progressStep(inv, recipe, operation));
            int remaining = Math.max(1, operation.getTotalTicks() - operation.getProgress());
            operation.addProgress(Math.min(step, remaining));
            return;
        }

        if (!matchesGltcRecipe(inv, recipe)) {
            cancelGltcOperation(b, inv, blockKey);
            return;
        }
        consumeGltcInputs(inv, recipe);
        inv.replaceExistingItem(getProgressBarSlot(), getIdleProgressItem());
        pushGltcOutputs(inv, recipe, templateAmount(inv));
        activeGltcRecipes.remove(blockKey);
        processor.endOperation(b);
    }

    protected void cancelGltcOperation(Block b, BlockMenu inv, String blockKey) {
        // Inputs are only consumed on successful finish — nothing to refund.
        activeGltcRecipes.remove(blockKey);
        getMachineProcessor().endOperation(b);
        inv.replaceExistingItem(getProgressBarSlot(), getIdleProgressItem());
    }

    /** Clear in-memory craft state when the machine block is broken / unloaded. */
    public void clearActiveRecipe(Block b) {
        if (b == null) {
            return;
        }
        String key = blockKey(b);
        if (key != null) {
            activeGltcRecipes.remove(key);
        }
        getMachineProcessor().endOperation(b);
    }

    /** Drop craft tracking for machines in an unloading chunk. */
    public void clearActiveInChunk(org.bukkit.Chunk chunk) {
        if (chunk == null || activeGltcRecipes.isEmpty()) {
            return;
        }
        String worldName = chunk.getWorld().getName();
        int cx = chunk.getX();
        int cz = chunk.getZ();
        java.util.Iterator<Map.Entry<String, GltcMachineRecipe>> it = activeGltcRecipes.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, GltcMachineRecipe> entry = it.next();
            String[] parts = entry.getKey().split(";", 4);
            if (parts.length != 4 || !worldName.equals(parts[0])) {
                continue;
            }
            int x;
            int y;
            int z;
            try {
                x = Integer.parseInt(parts[1]);
                y = Integer.parseInt(parts[2]);
                z = Integer.parseInt(parts[3]);
            } catch (NumberFormatException ex) {
                continue;
            }
            if ((x >> 4) != cx || (z >> 4) != cz) {
                continue;
            }
            it.remove();
            getMachineProcessor().endOperation(chunk.getWorld().getBlockAt(x, y, z));
        }
    }

    public static void clearAllInChunk(org.bukkit.Chunk chunk) {
        for (GltcRecipeMachine machine : LIVE) {
            machine.clearActiveInChunk(chunk);
        }
    }

    public static void clearLiveRegistry() {
        LIVE.clear();
    }

    /** Progress ticks added per machine tick. Template machines may return template stack size. */
    protected int progressStep(
        BlockMenu inv,
        GltcMachineRecipe recipe,
        io.github.thebusybiscuit.slimefun4.implementation.operations.CraftingOperation operation
    ) {
        return Math.max(1, getSpeed());
    }

    /** Live template count used for speed/output scaling; default 1. */
    protected int templateAmount(BlockMenu inv) {
        return 1;
    }

    /** Return false to cancel an in-progress craft (e.g. template removed). */
    protected boolean isOperationStillValid(BlockMenu inv, GltcMachineRecipe recipe) {
        return true;
    }

    protected void pushGltcOutputs(BlockMenu inv, GltcMachineRecipe recipe) {
        pushGltcOutputs(inv, recipe, 1);
    }

    protected void pushGltcOutputs(BlockMenu inv, GltcMachineRecipe recipe, int outputMultiplier) {
        int multiplier = Math.max(1, outputMultiplier);
        for (RecipeUtil.GltcOutputSlot output : recipe.resolvedOutputSlots()) {
            if (output.chance() < 100 && ThreadLocalRandom.current().nextInt(100) >= output.chance()) {
                continue;
            }
            ItemStack stack = output.resolvedStack();
            if (stack == null || stack.getType() == Material.AIR) {
                continue;
            }
            long total = (long) stack.getAmount() * (long) multiplier;
            while (total > 0) {
                ItemStack chunk = stack.clone();
                int chunkAmount = (int) Math.min(chunk.getMaxStackSize(), total);
                chunk.setAmount(chunkAmount);
                total -= chunkAmount;
                int slot = output.menuSlot();
                if (slot >= 0) {
                    pushToSlot(inv, slot, chunk);
                } else {
                    inv.pushItem(chunk, getOutputSlots());
                }
            }
        }
    }

    private void pushToSlot(BlockMenu inv, int slot, ItemStack stack) {
        ItemStack existing = inv.getItemInSlot(slot);
        if (existing == null || existing.getType() == Material.AIR) {
            inv.replaceExistingItem(slot, stack);
            return;
        }
        if (SlimefunUtils.isItemSimilar(existing, stack, true)) {
            int max = existing.getMaxStackSize();
            int amount = Math.min(stack.getAmount(), max - existing.getAmount());
            if (amount > 0) {
                existing.setAmount(existing.getAmount() + amount);
                stack.setAmount(stack.getAmount() - amount);
            }
        }
        if (stack.getAmount() > 0) {
            inv.pushItem(stack, getOutputSlots());
        }
    }

    protected boolean canProcess(Block b) {
        return true;
    }

    protected boolean matchesGltcRecipe(BlockMenu inv, GltcMachineRecipe recipe) {
        for (RecipeUtil.GltcInputSlot input : recipe.resolvedInputSlots()) {
            if (input.menuSlot() < 0) {
                continue;
            }
            ItemStack required = input.resolvedStack();
            ItemStack actual = inv.getItemInSlot(input.menuSlot());
            if (required == null || actual == null) {
                return false;
            }
            if (actual.getAmount() < required.getAmount()) {
                return false;
            }
            if (!SlimefunUtils.isItemSimilar(actual, required, true)) {
                return false;
            }
        }
        return true;
    }

    protected void consumeGltcInputs(BlockMenu inv, GltcMachineRecipe recipe) {
        if (recipe.noConsume()) {
            return;
        }
        for (RecipeUtil.GltcInputSlot input : recipe.resolvedInputSlots()) {
            if (input.noConsume() || input.menuSlot() < 0) {
                continue;
            }
            ItemStack required = input.resolvedStack();
            if (required != null) {
                inv.consumeItem(input.menuSlot(), required.getAmount());
            }
        }
    }

    protected boolean canFitGltcOutputs(BlockMenu inv, GltcMachineRecipe recipe) {
        return canFitGltcOutputs(inv, recipe, 1);
    }

    /**
     * Simulate full {@code amount * multiplier} push (including multi-stack), matching {@link #pushGltcOutputs}.
     * Like RSC, reserve space for chance&gt;0 outputs before consume (chance rolled only at push).
     */
    protected boolean canFitGltcOutputs(BlockMenu inv, GltcMachineRecipe recipe, int outputMultiplier) {
        int multiplier = Math.max(1, outputMultiplier);
        Map<Integer, ItemStack> slotState = new HashMap<>();
        for (int slot : getOutputSlots()) {
            ItemStack existing = inv.getItemInSlot(slot);
            if (existing != null) {
                slotState.put(slot, existing.clone());
            }
        }
        for (RecipeUtil.GltcOutputSlot output : recipe.resolvedOutputSlots()) {
            int slot = output.menuSlot();
            if (slot >= 0 && !slotState.containsKey(slot)) {
                ItemStack existing = inv.getItemInSlot(slot);
                if (existing != null) {
                    slotState.put(slot, existing.clone());
                }
            }
        }

        for (RecipeUtil.GltcOutputSlot output : recipe.resolvedOutputSlots()) {
            if (output.chance() <= 0) {
                continue;
            }
            ItemStack stack = output.resolvedStack();
            if (stack == null || stack.getType() == Material.AIR) {
                continue;
            }
            long total = (long) stack.getAmount() * (long) multiplier;
            while (total > 0) {
                int chunkAmount = (int) Math.min(stack.getMaxStackSize(), total);
                total -= chunkAmount;
                ItemStack chunk = stack.clone();
                chunk.setAmount(chunkAmount);
                if (!simulatePush(slotState, output.menuSlot(), chunk)) {
                    return false;
                }
            }
        }
        return true;
    }

    /** Mirrors {@link #pushToSlot} / {@code inv.pushItem(..., getOutputSlots())}. */
    private boolean simulatePush(Map<Integer, ItemStack> slotState, int dedicatedSlot, ItemStack chunk) {
        ItemStack remaining = chunk.clone();
        if (dedicatedSlot >= 0) {
            remaining = mergeInto(slotState, dedicatedSlot, remaining);
            if (remaining == null) {
                return true;
            }
        }
        for (int slot : getOutputSlots()) {
            remaining = mergeInto(slotState, slot, remaining);
            if (remaining == null) {
                return true;
            }
        }
        return false;
    }

    private static ItemStack mergeInto(Map<Integer, ItemStack> slotState, int slot, ItemStack remaining) {
        if (remaining == null || remaining.getAmount() <= 0) {
            return null;
        }
        ItemStack existing = slotState.get(slot);
        if (existing == null || existing.getType() == Material.AIR) {
            slotState.put(slot, remaining.clone());
            return null;
        }
        if (!SlimefunUtils.isItemSimilar(existing, remaining, true)) {
            return remaining;
        }
        int space = existing.getMaxStackSize() - existing.getAmount();
        if (space <= 0) {
            return remaining;
        }
        int move = Math.min(space, remaining.getAmount());
        existing.setAmount(existing.getAmount() + move);
        remaining.setAmount(remaining.getAmount() - move);
        return remaining.getAmount() <= 0 ? null : remaining;
    }

    private MachineRecipe toMachineRecipe(GltcMachineRecipe recipe) {
        ItemStack[] inputs = recipe.resolvedInputSlots().stream()
            .map(RecipeUtil.GltcInputSlot::resolvedStack)
            .toArray(ItemStack[]::new);
        List<ItemStack> guaranteed = new ArrayList<>();
        for (RecipeUtil.GltcOutputSlot output : recipe.resolvedOutputSlots()) {
            if (output.chance() >= 100) {
                ItemStack stack = output.resolvedStack();
                if (stack != null) {
                    guaranteed.add(stack);
                }
            }
        }
        ItemStack[] outputs;
        if (guaranteed.isEmpty()) {
            outputs = new ItemStack[] { new ItemStack(Material.AIR) };
        } else {
            outputs = guaranteed.toArray(ItemStack[]::new);
        }
        return new MachineRecipe(recipe.seconds(), inputs, outputs);
    }

    protected boolean canFitOutputs(BlockMenu inv, ItemStack[] outputs) {
        Map<Integer, ItemStack> slotState = new HashMap<>();
        for (int slot : getOutputSlots()) {
            ItemStack existing = inv.getItemInSlot(slot);
            if (existing != null) {
                slotState.put(slot, existing.clone());
            }
        }
        for (ItemStack output : outputs) {
            if (output == null || output.getType() == Material.AIR) {
                continue;
            }
            if (!simulatePush(slotState, -1, output.clone())) {
                return false;
            }
        }
        return true;
    }

    private static String blockKey(Block b) {
        Location location = b.getLocation();
        if (location.getWorld() == null) {
            return null;
        }
        return location.getWorld().getName() + ';'
            + location.getBlockX() + ';'
            + location.getBlockY() + ';'
            + location.getBlockZ();
    }

    public static final class GltcMachineRecipe {
        private final int seconds;
        private final List<RecipeUtil.GltcInputSlot> inputSpecs;
        private final List<RecipeUtil.GltcOutputSlot> outputSpecs;
        private final boolean noConsume;
        private int scaledSeconds = -1;
        private List<RecipeUtil.GltcInputSlot> resolvedInputs = List.of();
        private List<RecipeUtil.GltcOutputSlot> resolvedOutputs = List.of();

        public GltcMachineRecipe(
            int seconds,
            List<RecipeUtil.GltcInputSlot> inputSpecs,
            List<RecipeUtil.GltcOutputSlot> outputSpecs,
            boolean noConsume
        ) {
            this.seconds = seconds;
            this.inputSpecs = inputSpecs;
            this.outputSpecs = outputSpecs;
            this.noConsume = noConsume;
        }

        public int seconds() {
            return scaledSeconds > 0 ? scaledSeconds : seconds;
        }

        /** Divide recipe seconds by {@code divisor} (speed), keeping at least 1 tick. */
        public void scaleSeconds(int divisor) {
            scaledSeconds = Math.max(1, seconds / divisor);
        }

        public boolean noConsume() {
            return noConsume;
        }

        public void resolve() {
            List<RecipeUtil.GltcInputSlot> inputs = new ArrayList<>();
            for (RecipeUtil.GltcInputSlot spec : inputSpecs) {
                ItemStack stack = spec.resolvedStack();
                if (stack != null && stack.getType() != Material.BARRIER) {
                    inputs.add(new RecipeUtil.GltcInputSlot(spec.menuSlot(), spec.stack(), spec.noConsume()));
                }
            }

            List<RecipeUtil.GltcOutputSlot> outputs = new ArrayList<>();
            for (RecipeUtil.GltcOutputSlot spec : outputSpecs) {
                ItemStack stack = spec.resolvedStack();
                if (stack != null && stack.getType() != Material.BARRIER) {
                    outputs.add(new RecipeUtil.GltcOutputSlot(spec.menuSlot(), spec.stack(), spec.chance()));
                }
            }

            this.resolvedInputs = List.copyOf(inputs);
            this.resolvedOutputs = List.copyOf(outputs);
        }

        public List<RecipeUtil.GltcInputSlot> resolvedInputSlots() {
            if (resolvedInputs.isEmpty() && !inputSpecs.isEmpty()) {
                resolve();
            }
            return resolvedInputs;
        }

        public List<RecipeUtil.GltcOutputSlot> resolvedOutputSlots() {
            if (resolvedOutputs.isEmpty() && !outputSpecs.isEmpty()) {
                resolve();
            }
            return resolvedOutputs;
        }
    }

    private static ItemStack emptyProgressSlot() {
        ItemStack item = new ItemStack(Material.BLACK_STAINED_GLASS_PANE);
        ItemMeta meta = item.getItemMeta();
        if (meta != null) {
            meta.setDisplayName(" ");
            item.setItemMeta(meta);
        }
        return item;
    }
}
