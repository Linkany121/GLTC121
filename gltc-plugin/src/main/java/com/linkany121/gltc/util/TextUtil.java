package com.linkany121.gltc.util;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.TextDecoration;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class TextUtil {

    private static final LegacyComponentSerializer LEGACY = LegacyComponentSerializer.builder()
        .character('§')
        .hexColors()
        .useUnusualXRepeatedCharacterHexFormat()
        .build();
    private static final LegacyComponentSerializer AMPERSAND = LegacyComponentSerializer.builder()
        .character('&')
        .hexColors()
        .useUnusualXRepeatedCharacterHexFormat()
        .build();
    private static final LegacyComponentSerializer LEGACY_SECTION = LegacyComponentSerializer.legacySection();
    private static final Pattern HEX_INLINE = Pattern.compile("&#([0-9a-fA-F]{6})");
    private static final Pattern AMPERSAND_CODE = Pattern.compile("&([0-9a-fk-orA-FK-OR])");

    private TextUtil() {
    }

    public static Component color(String input) {
        if (input == null || input.isEmpty()) {
            return Component.empty();
        }
        String normalized = normalizeLegacy(input);
        Component component;
        if (normalized.indexOf('§') >= 0) {
            component = LEGACY.deserialize(normalized);
        } else {
            component = AMPERSAND.deserialize(normalized);
        }
        return component.decoration(TextDecoration.ITALIC, false);
    }

    public static List<Component> colorLore(List<String> lines) {
        List<Component> result = new ArrayList<>();
        if (lines == null) {
            return result;
        }
        for (String line : lines) {
            result.add(color(line));
        }
        return result;
    }

    /** Inventory titles still use legacy section strings on many versions. */
    public static String legacySection(String input) {
        if (input == null || input.isEmpty()) {
            return "";
        }
        return LEGACY_SECTION.serialize(color(input));
    }

    public static List<String> readStringList(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof List<?> list) {
            List<String> out = new ArrayList<>();
            for (Object item : list) {
                if (item != null) {
                    out.add(String.valueOf(item));
                }
            }
            return out;
        }
        return List.of();
    }

    private static String normalizeLegacy(String input) {
        String withHex = replaceHexWithLegacy(input);
        if (withHex.indexOf('§') >= 0) {
            return AMPERSAND_CODE.matcher(withHex).replaceAll("§$1");
        }
        return withHex;
    }

    private static String replaceHexWithLegacy(String input) {
        Matcher matcher = HEX_INLINE.matcher(input);
        StringBuilder sb = new StringBuilder();
        while (matcher.find()) {
            matcher.appendReplacement(sb, Matcher.quoteReplacement(legacyHex(matcher.group(1))));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private static String legacyHex(String hex) {
        StringBuilder sb = new StringBuilder("§x");
        for (int i = 0; i < hex.length(); i++) {
            sb.append('§').append(Character.toLowerCase(hex.charAt(i)));
        }
        return sb.toString();
    }
}
