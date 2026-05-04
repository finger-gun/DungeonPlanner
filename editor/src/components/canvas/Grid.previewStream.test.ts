import { describe, expect, it } from 'vitest'
import { shouldRenderRoomStreamPreview } from './Grid'

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
})
