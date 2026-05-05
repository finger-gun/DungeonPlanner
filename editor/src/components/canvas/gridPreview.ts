import { getRectangleCells, getCellKey, type GridCell, type SnappedGridPosition } from '../../hooks/useSnapToGrid'
import type { DungeonTool, RoomPaintMode, PaintedCellRecord } from '../../store/useDungeonStore'

type RoomPreviewOptions = {
  hoveredCell: SnappedGridPosition | null
  latchedPreviewCells?: GridCell[]
  paintedCells: Record<string, PaintedCellRecord>
  strokeCurrentCell: GridCell | null
  strokeMode: 'paint' | 'erase' | null
  strokeStartCell: GridCell | null
  strokePaintedCells: GridCell[]
  suppressRoomPreview: boolean
  tool: DungeonTool
  roomPaintMode: RoomPaintMode
}

export function getRoomPreviewCells({
  hoveredCell,
  latchedPreviewCells = [],
  paintedCells,
  strokeCurrentCell,
  strokeMode,
  strokeStartCell,
  strokePaintedCells,
  suppressRoomPreview,
  tool,
  roomPaintMode,
}: RoomPreviewOptions) {
  if (tool !== 'room' || suppressRoomPreview) {
    return []
  }

  // In paint mode, show all cells that have been painted in this stroke
  if (roomPaintMode === 'paint' && strokePaintedCells.length > 0) {
    return strokePaintedCells
  }

  if (strokeStartCell && strokeCurrentCell && strokeMode) {
    return getRectangleCells(strokeStartCell, strokeCurrentCell).filter((cell) =>
      strokeMode === 'paint'
        ? !paintedCells[getCellKey(cell)]
        : Boolean(paintedCells[getCellKey(cell)]),
    )
  }

  if (latchedPreviewCells.length > 0) {
    return latchedPreviewCells
  }

  return hoveredCell ? [hoveredCell.cell] : []
}
