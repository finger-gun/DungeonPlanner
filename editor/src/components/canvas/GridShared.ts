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
