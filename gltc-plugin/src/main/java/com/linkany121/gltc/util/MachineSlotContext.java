package com.linkany121.gltc.util;

/**
 * Slimefun {@code AContainer}/{@code AGenerator} call {@code getInputSlots()} /
 * {@code getOutputSlots()} from {@code super()} before subclass fields are assigned.
 */
public final class MachineSlotContext {

    private static final ThreadLocal<int[]> INPUT = new ThreadLocal<>();
    private static final ThreadLocal<int[]> OUTPUT = new ThreadLocal<>();

    private MachineSlotContext() {
    }

    public static void begin(int[] inputSlots, int[] outputSlots) {
        INPUT.set(inputSlots);
        OUTPUT.set(outputSlots);
    }

    public static void end() {
        INPUT.remove();
        OUTPUT.remove();
    }

    public static int[] inputOr(int[] fallback) {
        int[] pending = INPUT.get();
        return pending != null ? pending : fallback;
    }

    public static int[] outputOr(int[] fallback) {
        int[] pending = OUTPUT.get();
        return pending != null ? pending : fallback;
    }
}
