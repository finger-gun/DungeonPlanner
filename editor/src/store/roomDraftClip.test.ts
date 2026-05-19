import { describe, expect, it } from 'vitest'
import {
  buildRoomDraftCells,
  buildRoomDraftWorldPoints,
  createRoomDraftFromStroke,
  setRoomDraftCorner,
} from './roomDraft'
import { clipRoomDraft } from './roomDraftClip'

describe('roomDraftClip', () => {
  it('clips a draft to its visible remainder and hides overlapped handles', () => {
    const draft = createRoomDraftFromStroke([1, 0], [4, 2])
    const occupancy = [
      buildRoomDraftWorldPoints(createRoomDraftFromStroke([0, 0], [2, 2])),
    ]

    const result = clipRoomDraft(draft, occupancy)

    expect(result.valid).toBe(true)
    expect(result.hasOverlap).toBe(true)
    expect(result.commitCells).toEqual([
      [3, 0],
      [4, 0],
      [3, 1],
      [4, 1],
      [3, 2],
      [4, 2],
    ])
    expect(result.handleVisibility.edges.west).toBe(false)
    expect(result.handleVisibility.corners.nw).toBe(false)
    expect(result.handleVisibility.corners.sw).toBe(false)
    expect(result.handleVisibility.edges.east).toBe(true)
    expect(result.handleVisibility.corners.ne).toBe(true)
    expect(result.handleVisibility.corners.se).toBe(true)
  })

  it('borrows rounded occupancy boundaries into the clipped draft path', () => {
    const draft = createRoomDraftFromStroke([2, 0], [4, 2])
    const existing = setRoomDraftCorner(
      setRoomDraftCorner(createRoomDraftFromStroke([0, 0], [2, 2]), 'ne', 'rounded', 1),
      'se',
      'rounded',
      1,
    )
    const occupiedCellKeys = new Set(
      buildRoomDraftCells(existing).map(([x, z]) => `${x}:${z}`),
    )

    const result = clipRoomDraft(
      draft,
      [buildRoomDraftWorldPoints(existing)],
      occupiedCellKeys,
    )

    expect(result.valid).toBe(true)
    expect(result.hasOverlap).toBe(true)
    expect(result.splineNodes.length).toBeGreaterThan(4)
    expect(result.commitCells.length).toBeGreaterThan(0)
    expect(result.commitCells.every(([x, z]) => !occupiedCellKeys.has(`${x}:${z}`))).toBe(true)
  })

  it('rejects drafts that would clip into multiple disconnected pieces', () => {
    const draft = createRoomDraftFromStroke([0, 0], [4, 2])
    const occupancy = [
      buildRoomDraftWorldPoints(createRoomDraftFromStroke([2, 0], [2, 2])),
    ]

    const result = clipRoomDraft(draft, occupancy)

    expect(result.valid).toBe(false)
    expect(result.invalidReason).toBe('disconnected')
    expect(result.commitCells).toEqual([])
    expect(result.splineNodes).toEqual([])
  })
})
