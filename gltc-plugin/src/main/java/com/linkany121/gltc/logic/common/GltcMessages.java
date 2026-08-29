package com.linkany121.gltc.logic.common;

/** Shared chat prefix for GLTC player messages. */
public final class GltcMessages {

    /** 机器/信用点系前缀：与 scripts/机器/*.js、能源流货币/*.js 中 GLTC_PREFIX 一致（FF25F1→1EC9FF，结尾带空格）。 */
    public static final String PREFIX =
        "§f[§x§F§F§2§5§F§1G§x§D§2§2§A§F§5L§x§A§5§2§F§F§9T§x§7§8§3§4§F§DC§x§5§8§4§C§F§F联§x§4§5§7§6§F§F合§x§3§1§9§F§F§F协§x§1§E§C§9§F§F议§f] ";

    /** 武器/枪械系前缀：与 scripts/枪械/枪械集成枪.js MSG_PREFIX、GltcDamageNotify.PREFIX 一致（e017e8→4b95ff，无尾空格）。 */
    public static final String WEAPON_PREFIX =
        "§f[§x§e§0§1§7§e§8G§x§c§b§1§2§f§2L§x§b§7§0§e§f§cT§x§9§b§2§2§f§fC§x§7§c§3§f§f§f联§x§5§d§5§b§f§f合§x§4§c§7§8§f§f协§x§4§b§9§5§f§f议§f]§f";

    private GltcMessages() {
    }

    public static String prefixed(String message) {
        return PREFIX + message;
    }
}
