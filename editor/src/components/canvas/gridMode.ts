import type { CameraPreset, DungeonTool } from '../../store/useDungeonStore'

export function isPassiveGridMode(tool: DungeonTool, playMode: boolean) {
  return playMode || tool === 'move' || tool === 'select'
}

export function shouldRenderGridOverlay(showGrid: boolean, playMode: boolean) {
  return playMode || showGrid
}

export function getGridOverlayRadius(activeCameraMode: CameraPreset, playMode: boolean) {
  if (playMode) {
    return 10
  }

  return activeCameraMode === 'top-down' || activeCameraMode === 'classic' ? 10000 : 10
}
