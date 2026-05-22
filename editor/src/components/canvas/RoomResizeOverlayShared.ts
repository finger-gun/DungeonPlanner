import type { DungeonTool, RoomPaintMode } from '../../store/useDungeonStore'

export function shouldShowRoomResizeOverlay({
  tool,
  roomPaintMode,
  selectedRoomId,
}: {
  tool: DungeonTool
  roomPaintMode: RoomPaintMode
  selectedRoomId: string | null
}) {
  return tool === 'room' && roomPaintMode === 'resize' && Boolean(selectedRoomId)
}
