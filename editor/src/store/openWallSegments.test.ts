import { describe, expect, it } from 'vitest'
import { buildOpenWallSegmentSet } from './openWallSegments'

describe('openWallSegments', () => {
  it('treats authored openings as passable wall segments', () => {
    const openWalls = buildOpenWallSegmentSet({
      passage: {
        id: 'passage',
        assetId: null,
        wallKey: '0:0:north',
        width: 1,
        layerId: 'default',
      },
      closedDoor: {
        id: 'closedDoor',
        assetId: 'core.opening_door_wall_1',
        wallKey: '1:0:north',
        width: 1,
        layerId: 'default',
        objectProps: {},
      },
    })

    expect(openWalls.has('0:0:north')).toBe(true)
    expect(openWalls.has('1:0:north')).toBe(true)
    expect(openWalls.has('0:1:south')).toBe(true)
    expect(openWalls.has('1:1:south')).toBe(true)
  })
})
