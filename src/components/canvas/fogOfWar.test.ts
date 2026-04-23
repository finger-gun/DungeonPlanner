import { describe, expect, it } from 'vitest'
import {
  buildFogOfWarVisibilityMask,
  buildFogOfWarVisibilityMasks,
  buildFogOfWarExploredStates,
  buildFogOfWarLayout,
  FOG_VISIBILITY_MASK_ORIGIN_CAPACITY,
  FOG_VISIBILITY_MASK_SIZE,
  getFogOfWarDdaMaxSteps,
} from './fogOfWar'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'

describe('buildFogOfWarLayout', () => {
  it('encodes a half-cell occupancy grid for closed room boundaries', () => {
    const layout = buildFogOfWarLayout({
      active: true,
      paintedCells: {
        '2:3': { cell: [2, 3], layerId: 'layer', roomId: 'room-a' },
        '3:3': { cell: [3, 3], layerId: 'layer', roomId: 'room-b' },
      },
      wallOpenings: {},
      innerWalls: {},
    })

    expect(layout).toEqual({
      minCellX: 2,
      minCellZ: 3,
      width: 2,
      height: 1,
      occupancyWidth: 9,
      occupancyHeight: 5,
      occupancy: new Int32Array([
        1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 0, 0, 0, 1, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 0, 1,
        1, 0, 0, 0, 1, 0, 0, 0, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1,
      ]),
    })
  })

  it('clears wall occupancy for authored openings between painted cells', () => {
    const layout = buildFogOfWarLayout({
      active: true,
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'layer', roomId: 'room-a' },
        '1:0': { cell: [1, 0], layerId: 'layer', roomId: 'room-b' },
      },
      wallOpenings: {
        eastDoor: {
          id: 'east-door',
          assetId: 'core.opening_door_wall_1',
          wallKey: '0:0:east',
          width: 1,
          flipped: false,
          layerId: 'layer',
        },
      },
      innerWalls: {},
    })

    expect(layout?.occupancy).toEqual(new Int32Array([
      1, 1, 1, 1, 1, 1, 1, 1, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 0, 0, 0, 0, 0, 0, 0, 1,
      1, 1, 1, 1, 1, 1, 1, 1, 1,
    ]))
  })

  it('returns null when fog of war is inactive', () => {
    expect(buildFogOfWarLayout({
      active: false,
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'layer', roomId: null },
      },
      wallOpenings: {},
      innerWalls: {},
    })).toBeNull()
  })
})

describe('buildFogOfWarExploredStates', () => {
  it('encodes explored cells against an existing fog layout', () => {
    const layout = buildFogOfWarLayout({
      active: true,
      paintedCells: {
        '2:3': { cell: [2, 3], layerId: 'layer', roomId: 'room-a' },
        '3:3': { cell: [3, 3], layerId: 'layer', roomId: 'room-b' },
      },
      wallOpenings: {},
      innerWalls: {},
    })

    expect(buildFogOfWarExploredStates(layout, { '2:3': true })).toEqual(new Int32Array([1, 0]))
  })

  it('ignores explored keys that fall outside the current layout', () => {
    const layout = buildFogOfWarLayout({
      active: true,
      paintedCells: {
        '2:3': { cell: [2, 3], layerId: 'layer', roomId: 'room-a' },
      },
      wallOpenings: {},
      innerWalls: {},
    })

    expect(buildFogOfWarExploredStates(layout, { '20:30': true, '2:3': true })).toEqual(new Int32Array([1]))
  })
})

describe('getFogOfWarDdaMaxSteps', () => {
  it('scales the traversal budget with vision range and occupancy subdivisions', () => {
    expect(getFogOfWarDdaMaxSteps(8, 4)).toBe(64)
    expect(getFogOfWarDdaMaxSteps(8, 2)).toBe(32)
    expect(getFogOfWarDdaMaxSteps(1, 1)).toBe(2)
  })
})

describe('buildFogOfWarVisibilityMask', () => {
  it('marks the player cell as visible in the local mask texture', () => {
    const layout = buildFogOfWarLayout({
      active: true,
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'layer', roomId: 'room-a' },
      },
      wallOpenings: {},
      innerWalls: {},
    })

    const playerOrigin: readonly [number, number] = [GRID_SIZE * 0.5, GRID_SIZE * 0.5]
    const mask = buildFogOfWarVisibilityMask(layout, playerOrigin)

    expect(mask).not.toBeNull()
    expect(sampleMask(mask!, playerOrigin, GRID_SIZE * 0.5, GRID_SIZE * 0.5)).toBe(255)
  })

  it('blocks visibility behind a closed wall in the local mask texture', () => {
    const layout = buildFogOfWarLayout({
      active: true,
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'layer', roomId: 'room-a' },
        '1:0': { cell: [1, 0], layerId: 'layer', roomId: 'room-b' },
      },
      wallOpenings: {},
      innerWalls: {},
    })

    const playerOrigin: readonly [number, number] = [GRID_SIZE * 0.5, GRID_SIZE * 0.5]
    const mask = buildFogOfWarVisibilityMask(layout, playerOrigin)

    expect(mask).not.toBeNull()
    expect(sampleMask(mask!, playerOrigin, GRID_SIZE * 1.5, GRID_SIZE * 0.5)).toBe(0)
  })
})

describe('buildFogOfWarVisibilityMasks', () => {
  it('builds one mask per player origin up to the configured capacity', () => {
    const layout = buildFogOfWarLayout({
      active: true,
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'layer', roomId: 'room-a' },
      },
      wallOpenings: {},
      innerWalls: {},
    })

    const masks = buildFogOfWarVisibilityMasks(
      layout,
      Array.from({ length: FOG_VISIBILITY_MASK_ORIGIN_CAPACITY + 2 }, () => [GRID_SIZE * 0.5, GRID_SIZE * 0.5] as const),
    )

    expect(masks).toHaveLength(FOG_VISIBILITY_MASK_ORIGIN_CAPACITY)
    expect(
      masks.every((mask: Uint8Array) => mask.length === FOG_VISIBILITY_MASK_SIZE * FOG_VISIBILITY_MASK_SIZE),
    ).toBe(true)
  })
})

function sampleMask(
  mask: Uint8Array,
  playerOrigin: readonly [number, number],
  worldX: number,
  worldZ: number,
) {
  const normalizedX = ((worldX - playerOrigin[0]) / (GRID_SIZE * 8) + 1) * 0.5
  const normalizedZ = ((worldZ - playerOrigin[1]) / (GRID_SIZE * 8) + 1) * 0.5
  const x = Math.min(
    FOG_VISIBILITY_MASK_SIZE - 1,
    Math.max(0, Math.floor(normalizedX * FOG_VISIBILITY_MASK_SIZE)),
  )
  const z = Math.min(
    FOG_VISIBILITY_MASK_SIZE - 1,
    Math.max(0, Math.floor(normalizedZ * FOG_VISIBILITY_MASK_SIZE)),
  )
  return mask[z * FOG_VISIBILITY_MASK_SIZE + x]
}
