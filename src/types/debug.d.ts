import type { GridCell } from '../hooks/useSnapToGrid'
import type { CameraPreset, DungeonTool } from '../store/useDungeonStore'

declare global {
  interface Window {
    __DUNGEON_DEBUG__?: {
      getSnapshot: () => unknown
      getCameraPose: () => {
        position: readonly [number, number, number]
        target: readonly [number, number, number]
      } | null
      placeAtCell: (cell: GridCell, tool?: DungeonTool) => number | string | null
      paintRectangle: (startCell: GridCell, endCell: GridCell) => number
      eraseRectangle: (startCell: GridCell, endCell: GridCell) => number
      removeAtCell: (cell: GridCell, tool?: DungeonTool) => void
      reset: () => void
      setCameraPreset: (preset: CameraPreset) => void
      getObjectScreenPosition: (id: string) => { x: number; y: number } | null
      getCellScreenPosition: (cell: GridCell) => { x: number; y: number } | null
      getAssetSourceLink: (assetId: string) => string | null
    }
  }
}

export {}
