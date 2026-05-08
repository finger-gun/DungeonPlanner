import type { GridCell } from '../../hooks/useSnapToGrid'

export function shouldRenderRoomStreamPreview({
  roomStreamTransactionId,
  roomStreamTransactionStartedAt,
  previewStrokeMode,
  mapMode,
  previewCells,
  strokeMode,
}: {
  roomStreamTransactionId: string | null
  roomStreamTransactionStartedAt: number | null
  previewStrokeMode: 'paint' | 'erase' | null
  mapMode: 'indoor' | 'outdoor'
  previewCells: GridCell[]
  strokeMode: 'paint' | 'erase' | null
}) {
  return Boolean(
    roomStreamTransactionId
    && roomStreamTransactionStartedAt !== null
    && previewStrokeMode === 'paint'
    && mapMode !== 'outdoor'
    && previewCells.length > 0
    && strokeMode === null,
  )
}

export function shouldBlockRoomStrokeStart({
  latchedRoomPreview,
  roomDraftActive,
}: {
  latchedRoomPreview: { cells: GridCell[]; mode: 'paint' | 'erase' } | null
  roomDraftActive: boolean
}) {
  return latchedRoomPreview !== null || roomDraftActive
}

export function shouldClearRoomDraftForFloorChange({
  previousActiveFloorId,
  activeFloorId,
  roomDraftActive,
}: {
  previousActiveFloorId: string
  activeFloorId: string
  roomDraftActive: boolean
}) {
  return roomDraftActive && previousActiveFloorId !== activeFloorId
}
