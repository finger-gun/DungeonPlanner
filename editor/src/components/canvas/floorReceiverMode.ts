import type { DungeonTool } from '../../store/useDungeonStore'

export function shouldActivateFloorReceiver(tool: DungeonTool, showProjectionDebugMesh: boolean) {
  return tool === 'play' || showProjectionDebugMesh
}
