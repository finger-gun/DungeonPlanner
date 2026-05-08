import { describe, expect, it } from 'vitest'
import { buildOpenWallSegmentSet } from './openWallSegments'

describe('openWallSegments', () => {
  it('treats authored openings as passable wall segments and keeps explicit wall-state openings', () => {
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
    }, {
      '2:0:north': { open: true },
    })

    expect(openWalls.has('0:0:north')).toBe(true)
    expect(openWalls.has('1:0:north')).toBe(true)
    expect(openWalls.has('2:0:north')).toBe(true)
    expect(openWalls.has('2:1:south')).toBe(true)
  })

  it('treats legacy wall-surface opening assets as passable when they are passages or opened doors', () => {
    const openWalls = buildOpenWallSegmentSet(
      {},
      {
        '3:0:north': 'dungeon.wall_wall_opening',
        '4:0:north': 'dungeon.wall_wall_doorway_scaffold',
      },
      {
        '4:0:north': { open: true },
      },
    )

    expect(openWalls.has('3:0:north')).toBe(true)
    expect(openWalls.has('3:1:south')).toBe(true)
    expect(openWalls.has('4:0:north')).toBe(true)
    expect(openWalls.has('4:1:south')).toBe(true)
  })
})
