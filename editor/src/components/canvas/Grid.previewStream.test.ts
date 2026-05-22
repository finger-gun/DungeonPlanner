import { describe, expect, it } from 'vitest'
import {
  shouldAnimateRoomMutation,
  shouldBlockRoomStrokeStart,
  shouldClearRoomDraftForFloorChange,
} from './GridShared'

describe('shouldBlockRoomStrokeStart', () => {
  it('allows starting a new room stroke when no draft is active', () => {
    expect(shouldBlockRoomStrokeStart({
      roomDraftActive: false,
    })).toBe(false)
  })

  it('blocks starting a new area stroke while a draft room is active', () => {
    expect(shouldBlockRoomStrokeStart({
      roomDraftActive: true,
    })).toBe(true)
  })
})

describe('shouldClearRoomDraftForFloorChange', () => {
  it('only clears a room draft when the active floor actually changes', () => {
    expect(shouldClearRoomDraftForFloorChange({
      previousActiveFloorId: 'floor-1',
      activeFloorId: 'floor-1',
      roomDraftActive: true,
    })).toBe(false)

    expect(shouldClearRoomDraftForFloorChange({
      previousActiveFloorId: 'floor-1',
      activeFloorId: 'floor-2',
      roomDraftActive: true,
    })).toBe(true)
  })
})

describe('shouldAnimateRoomMutation', () => {
  it('skips removal animation batches when deleting a room', () => {
    expect(shouldAnimateRoomMutation({ mutationKind: 'erase-stroke' })).toBe(true)
    expect(shouldAnimateRoomMutation({ mutationKind: 'draft-commit' })).toBe(true)
    expect(shouldAnimateRoomMutation({ mutationKind: 'room-delete' })).toBe(false)
  })
})
