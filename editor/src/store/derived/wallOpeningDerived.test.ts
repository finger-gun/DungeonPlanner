import { describe, expect, it } from 'vitest'
import { buildEligibleOpenPassageWalls, buildWallOpeningDerivedState } from './wallOpeningDerived'

describe('wallOpeningDerived', () => {
  it('indexes opening segments and mirrored suppressed walls once', () => {
    const wallOpenings = {
      door: {
        id: 'door',
        assetId: null,
        wallKey: '0:0:east',
        width: 1 as const,
        layerId: 'default',
      },
    }

    const derived = buildWallOpeningDerivedState(wallOpenings)

    expect(derived.wallOpeningsBySegmentKey['0:0:east']).toBe(wallOpenings.door)
    expect(derived.suppressedWallKeys.has('0:0:east')).toBe(true)
    expect(derived.suppressedWallKeys.has('1:0:west')).toBe(true)
  })

  it('derives eligible shared walls for open-passage placement', () => {
    const paintedCells = {
      '0:0': { cell: [0, 0] as [number, number], layerId: 'default', roomId: 'left' },
      '1:0': { cell: [1, 0] as [number, number], layerId: 'default', roomId: 'right' },
    }

    expect(buildEligibleOpenPassageWalls(paintedCells, {})).toEqual([
      {
        wallKey: '0:0:east',
        position: [2, 0, 1],
        rotation: [0, -Math.PI / 2, 0],
      },
    ])

    expect(buildEligibleOpenPassageWalls(paintedCells, {
      opening: {
        id: 'opening',
        assetId: null,
        wallKey: '0:0:east',
        width: 1,
        layerId: 'default',
      },
    })).toEqual([])
  })
})
