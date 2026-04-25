import type { DungeonTool, FloorViewMode } from '../../store/useDungeonStore'

export function getEffectiveFloorViewMode(
  floorViewMode: FloorViewMode,
  tool: DungeonTool,
): FloorViewMode {
  return tool === 'play' ? 'active' : floorViewMode
}
