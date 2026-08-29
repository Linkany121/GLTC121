package com.linkany121.gltc.logic.mage;

import javax.annotation.Nullable;
import java.util.ArrayList;
import java.util.List;

/** Equipped UGW slots for one player. */
public final class MageGear {

    public final List<Slot> slots;

    public MageGear(int size) {
        slots = new ArrayList<>(size);
        for (int i = 0; i < size; i++) {
            slots.add(null);
        }
    }

    public MageGear(List<Slot> slots) {
        this.slots = new ArrayList<>(slots);
    }

    public MageGear copy() {
        MageGear g = new MageGear(0);
        g.slots.clear();
        for (Slot s : slots) {
            g.slots.add(s == null ? null : s.copy());
        }
        return g;
    }

    public void ensureSize(int size) {
        while (slots.size() < size) {
            slots.add(null);
        }
        while (slots.size() > size) {
            slots.remove(slots.size() - 1);
        }
    }

    /**
     * @param ugwId optional regular-UGW config id
     * @param sfId  Slimefun item id
     * @param item  Base64 Bukkit ItemStack snapshot
     */
    public record Slot(@Nullable String ugwId, @Nullable String sfId, @Nullable String item) {
        public Slot copy() {
            return new Slot(ugwId, sfId, item);
        }
    }
}
