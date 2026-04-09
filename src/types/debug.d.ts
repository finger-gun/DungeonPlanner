import type { GridCell } from '../hooks/useSnapToGrid'
import type { DungeonTool } from '../store/useDungeonStore'

declare global {
  interface Window {
    __DUNGEON_DEBUG__?: {
      getSnapshot: () => unknown
      placeAtCell: (cell: GridCell, tool?: DungeonTool) => number | string | null
      paintRectangle: (startCell: GridCell, endCell: GridCell) => number
      eraseRectangle: (startCell: GridCell, endCell: GridCell) => number
      removeAtCell: (cell: GridCell, tool?: DungeonTool) => void
      reset: () => void
    }
  }
}

export {}
