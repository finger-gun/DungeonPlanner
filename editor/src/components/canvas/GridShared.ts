export function shouldBlockRoomStrokeStart({
  roomDraftActive,
}: {
  roomDraftActive: boolean
}) {
  return roomDraftActive
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
