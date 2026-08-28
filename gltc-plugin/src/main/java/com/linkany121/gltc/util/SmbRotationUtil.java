package com.linkany121.gltc.util;

import org.bukkit.block.BlockFace;
import org.bukkit.util.Vector;

public final class SmbRotationUtil {

    /**
     * Structure YAML is authored facing {@link BlockFace#SOUTH} (front = +Z).
     * {@code facing} is the direction the machine's front should face in the world.
     */
    private SmbRotationUtil() {
    }

    public static Vector rotateOffset(Vector offset, BlockFace facing) {
        int x = offset.getBlockX();
        int y = offset.getBlockY();
        int z = offset.getBlockZ();

        BlockFace dir = facing == null ? BlockFace.SOUTH : facing;
        return switch (dir) {
            case NORTH -> new Vector(-x, y, -z);
            case EAST -> new Vector(z, y, -x);
            case WEST -> new Vector(-z, y, x);
            case SOUTH -> new Vector(x, y, z);
            default -> new Vector(x, y, z);
        };
    }

    /** Machine front faces the player (same as vanilla block placement). */
    public static BlockFace facingFromPlayer(BlockFace playerFacing) {
        if (playerFacing == null) {
            return BlockFace.SOUTH;
        }
        return switch (playerFacing) {
            case NORTH, SOUTH, EAST, WEST -> playerFacing.getOppositeFace();
            default -> BlockFace.SOUTH;
        };
    }
}
