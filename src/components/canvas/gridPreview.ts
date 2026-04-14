import { getRectangleCells, getCellKey, type GridCell, type SnappedGridPosition } from '../../hooks/useSnapToGrid'
import type { DungeonTool, PaintedCellRecord } from '../../store/useDungeonStore'

type RoomPreviewOptions = {
  hoveredCell: SnappedGridPosition | null
  paintedCells: Record<string, PaintedCellRecord>
  strokeCurrentCell: GridCell | null
  strokeMode: 'paint' | 'erase' | null
  strokeStartCell: GridCell | null
  suppressRoomPreview: boolean
  tool: DungeonTool
}

export function getRoomPreviewCells({
  hoveredCell,
  paintedCells,
  strokeCurrentCell,
  strokeMode,
  strokeStartCell,
  suppressRoomPreview,
  tool,
}: RoomPreviewOptions) {
  if (tool !== 'room' || suppressRoomPreview) {
    return []
  }

  if (strokeStartCell && strokeCurrentCell && strokeMode) {
    return getRectangleCells(strokeStartCell, strokeCurrentCell).filter((cell) =>
      strokeMode === 'paint'
        ? !paintedCells[getCellKey(cell)]
        : Boolean(paintedCells[getCellKey(cell)]),
    )
  }

  return hoveredCell ? [hoveredCell.cell] : []
}
