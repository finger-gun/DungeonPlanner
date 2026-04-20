import type { DungeonTool } from './store/useDungeonStore'

export function shouldRotateSelectionFromShortcut(tool: DungeonTool) {
  return tool === 'select'
}

export function supportsPlacementRotationShortcut({
  tool,
  isUnifiedSurfaceMode,
  isUnifiedOpeningMode,
  isFloorOpeningMode,
  isWallOpeningMode,
}: {
  tool: DungeonTool
  isUnifiedSurfaceMode: boolean
  isUnifiedOpeningMode: boolean
  isFloorOpeningMode: boolean
  isWallOpeningMode: boolean
}) {
  return tool === 'character'
    || (tool === 'prop' && !isUnifiedSurfaceMode && !isUnifiedOpeningMode)
    || isFloorOpeningMode
    || isWallOpeningMode
}
