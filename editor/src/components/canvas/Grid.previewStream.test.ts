import { describe, expect, it } from 'vitest'
import {
  shouldBlockRoomStrokeStart,
  shouldClearRoomDraftForFloorChange,
  shouldRenderRoomStreamPreview,
} from './GridShared'

describe('shouldRenderRoomStreamPreview', () => {
  it('suppresses speculative tile streaming while a paint stroke is still active', () => {
    expect(shouldRenderRoomStreamPreview({
      roomStreamTransactionId: 'tx-1',
      roomStreamTransactionStartedAt: 1000,
      previewStrokeMode: 'paint',
      mapMode: 'indoor',
      previewCells: [[0, 0]],
      strokeMode: 'paint',
    })).toBe(false)
  })

  it('allows speculative tile streaming once the stroke is released and latched', () => {
    expect(shouldRenderRoomStreamPreview({
      roomStreamTransactionId: 'tx-1',
      roomStreamTransactionStartedAt: 1000,
      previewStrokeMode: 'paint',
      mapMode: 'indoor',
      previewCells: [[0, 0]],
      strokeMode: null,
    })).toBe(true)
  })

  it('does not block starting a new room stroke after the previous batch is released', () => {
    expect(shouldBlockRoomStrokeStart({
      latchedRoomPreview: null,
      roomDraftActive: false,
    })).toBe(false)

    expect(shouldBlockRoomStrokeStart({
      latchedRoomPreview: { cells: [[0, 0]], mode: 'paint' },
      roomDraftActive: false,
    })).toBe(true)
  })

  it('blocks starting a new area stroke while a draft room is active', () => {
    expect(shouldBlockRoomStrokeStart({
      latchedRoomPreview: null,
      roomDraftActive: true,
    })).toBe(true)
  })

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
