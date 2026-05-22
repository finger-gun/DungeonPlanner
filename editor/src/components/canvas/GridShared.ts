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

export function shouldAnimateRoomMutation({
  mutationKind,
}: {
  mutationKind: 'erase-stroke' | 'draft-commit' | 'room-delete'
}) {
  return mutationKind !== 'room-delete'
}
