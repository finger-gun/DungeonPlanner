/**
 * Shared constants for the Dungeon content pack.
 */

// KayKit Dungeon assets have different base sizes per category:
// - Floors: 2.0m tiles (match grid perfectly, no scaling)
// - Walls: 4.0m wide (need 0.5 scale to fit 2.0m grid)
// - Props: Various sizes (0.5 scale to match proportions)
export const DUNGEON_BASE_SCALE = 0.5
export const DUNGEON_FLOOR_BASE_SCALE = 1.0

// Floor tiles are 0.15m thick. Offset down by half so top surface is at Y=0
const FLOOR_THICKNESS = 0.15
const FLOOR_Y_OFFSET = -FLOOR_THICKNESS / 2

// Common transforms for different asset categories
export const DUNGEON_FLOOR_TRANSFORM = {
  position: [0, FLOOR_Y_OFFSET, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: DUNGEON_FLOOR_BASE_SCALE,
}

export const DUNGEON_WALL_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: DUNGEON_BASE_SCALE,
}

export const DUNGEON_PROP_TRANSFORM = {
  position: [0, 0, 0] as const,
  rotation: [0, 0, 0] as const,
  scale: DUNGEON_BASE_SCALE,
}
