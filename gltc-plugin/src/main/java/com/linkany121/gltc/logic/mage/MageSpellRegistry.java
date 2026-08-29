package com.linkany121.gltc.logic.mage;

import javax.annotation.Nullable;
import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory spell implementations keyed by slimefun / spell id.
 */
public final class MageSpellRegistry {

    private static final Map<String, MageSpell> SPELLS = new ConcurrentHashMap<>();

    private MageSpellRegistry() {
    }

    public static void register(MageSpell spell) {
        if (spell == null || spell.id() == null || spell.id().isBlank()) {
            return;
        }
        SPELLS.put(spell.id().trim(), spell);
    }

    public static void unregister(String spellId) {
        if (spellId != null) {
            SPELLS.remove(spellId.trim());
        }
    }

    public static void clear() {
        SPELLS.clear();
    }

    @Nullable
    public static MageSpell get(@Nullable String spellId) {
        if (spellId == null || spellId.isBlank()) {
            return null;
        }
        return SPELLS.get(spellId.trim());
    }

    public static Collection<MageSpell> all() {
        return Collections.unmodifiableCollection(SPELLS.values());
    }
}
