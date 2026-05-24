import { describe, expect, it } from 'vitest'
import { resizeBoundsFromEdge, snapWorldToBoundary } from '../../store/roomResize'

describe('roomResize helpers', () => {
  it('snaps world coordinates to room boundaries', () => {
    expect(snapWorldToBoundary(0)).toBe(0)
    expect(snapWorldToBoundary(3.2)).toBe(2)
    expect(snapWorldToBoundary(-2.1)).toBe(-1)
  })

  it('expands bounds from an edge without inverting the room', () => {
    expect(
      resizeBoundsFromEdge(
        { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
        'north',
        3,
      ),
    ).toEqual({
      minX: 0,
      maxX: 1,
      minZ: 0,
      maxZ: 2,
    })

    expect(
      resizeBoundsFromEdge(
        { minX: 0, maxX: 1, minZ: 0, maxZ: 1 },
        'west',
        1,
      ),
    ).toEqual({
      minX: 1,
      maxX: 1,
      minZ: 0,
      maxZ: 1,
    })
  })
})
