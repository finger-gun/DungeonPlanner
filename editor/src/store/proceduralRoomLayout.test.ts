import { describe, expect, it } from 'vitest'
import {
  buildSharedBoundaryRuns,
  reconcileProceduralRoomLayout,
} from './proceduralRoomLayout'
import type { OpeningRecord, PaintedCellRecord } from './useDungeonStore'

describe('proceduralRoomLayout', () => {
  it('groups contiguous shared wall segments into runs', () => {
    const paintedCells: Record<string, PaintedCellRecord> = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'left' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'right' },
      '0:1': { cell: [0, 1], layerId: 'default', roomId: 'left' },
      '1:1': { cell: [1, 1], layerId: 'default', roomId: 'right' },
    }

    expect(buildSharedBoundaryRuns(paintedCells)).toEqual([
      expect.objectContaining({
        wallKeys: ['0:0:east', '0:1:east'],
        roomIds: ['left', 'right'],
        layerId: 'default',
      }),
    ])
  })

  it('generates open passages for one-segment runs and centered doors for longer runs', () => {
    const paintedCells: Record<string, PaintedCellRecord> = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'left' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'right' },
      '3:0': { cell: [3, 0], layerId: 'default', roomId: 'top' },
      '4:0': { cell: [4, 0], layerId: 'default', roomId: 'bottom' },
      '3:1': { cell: [3, 1], layerId: 'default', roomId: 'top' },
      '4:1': { cell: [4, 1], layerId: 'default', roomId: 'bottom' },
      '3:2': { cell: [3, 2], layerId: 'default', roomId: 'top' },
      '4:2': { cell: [4, 2], layerId: 'default', roomId: 'bottom' },
    }

    const result = reconcileProceduralRoomLayout({
      paintedCells,
      wallOpenings: {},
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      selection: null,
      createOpeningId: () => `generated-${Math.random()}`,
    })
    const openings = Object.values(result.wallOpenings).sort((left, right) =>
      left.wallKey.localeCompare(right.wallKey),
    )

    expect(openings).toHaveLength(1)
    expect(openings[0]).toMatchObject({
      assetId: null,
      wallKey: '0:0:east',
      width: 1,
      source: 'generated',
    })
    expect(result.wallSurfaceAssetIds).toEqual({
      '3:1:east': 'dungeon.wall_wall_doorway',
    })
    expect(result.wallSurfaceProps).toEqual({
      '3:1:east': { generatedConnector: true },
    })
  })

  it('preserves manual openings and skips generated connectors on overlapping runs', () => {
    const paintedCells: Record<string, PaintedCellRecord> = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'left' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'right' },
      '0:1': { cell: [0, 1], layerId: 'default', roomId: 'left' },
      '1:1': { cell: [1, 1], layerId: 'default', roomId: 'right' },
      '0:2': { cell: [0, 2], layerId: 'default', roomId: 'left' },
      '1:2': { cell: [1, 2], layerId: 'default', roomId: 'right' },
    }
    const manualOpening: OpeningRecord = {
      id: 'manual-door',
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:1:east',
      width: 1,
      flipped: false,
      layerId: 'default',
      source: 'manual',
    }

    const result = reconcileProceduralRoomLayout({
      paintedCells,
      wallOpenings: {
        [manualOpening.id]: manualOpening,
      },
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      selection: null,
      createOpeningId: () => 'generated-door',
    })

    expect(result.wallOpenings).toEqual({
      'manual-door': manualOpening,
    })
    expect(result.wallSurfaceAssetIds).toEqual({})
    expect(result.wallSurfaceProps).toEqual({})
  })

  it('limits each room side to one generated connector and prefers the longest shared run', () => {
    const paintedCells: Record<string, PaintedCellRecord> = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'hub' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'short' },
      '0:1': { cell: [0, 1], layerId: 'default', roomId: 'hub' },
      '0:2': { cell: [0, 2], layerId: 'default', roomId: 'hub' },
      '1:2': { cell: [1, 2], layerId: 'default', roomId: 'long' },
      '0:3': { cell: [0, 3], layerId: 'default', roomId: 'hub' },
      '1:3': { cell: [1, 3], layerId: 'default', roomId: 'long' },
      '0:4': { cell: [0, 4], layerId: 'default', roomId: 'hub' },
      '1:4': { cell: [1, 4], layerId: 'default', roomId: 'long' },
    }

    const result = reconcileProceduralRoomLayout({
      paintedCells,
      wallOpenings: {},
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      selection: null,
      createOpeningId: () => 'generated-door',
    })

    expect(result.wallOpenings).toEqual({})
    expect(result.wallSurfaceAssetIds).toEqual({
      '0:3:east': 'dungeon.wall_wall_doorway',
    })
    expect(result.wallSurfaceProps).toEqual({
      '0:3:east': { generatedConnector: true },
    })
  })

  it('reuses matching generated openings and clears selection for removed ones', () => {
    const paintedCells: Record<string, PaintedCellRecord> = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'left' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'right' },
    }
    const generatedOpening: OpeningRecord = {
      id: 'generated-open',
      assetId: null,
      wallKey: '0:0:east',
      width: 1,
      flipped: false,
      layerId: 'default',
      source: 'generated',
    }

    expect(reconcileProceduralRoomLayout({
      paintedCells,
      wallOpenings: {
        [generatedOpening.id]: generatedOpening,
      },
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      selection: generatedOpening.id,
      createOpeningId: () => 'unused',
    })).toEqual({
      wallOpenings: {
        [generatedOpening.id]: generatedOpening,
      },
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      selection: generatedOpening.id,
    })

    expect(reconcileProceduralRoomLayout({
      paintedCells: {},
      wallOpenings: {
        [generatedOpening.id]: generatedOpening,
      },
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      selection: generatedOpening.id,
      createOpeningId: () => 'unused',
    })).toEqual({
      wallOpenings: {},
      wallSurfaceAssetIds: {},
      wallSurfaceProps: {},
      selection: null,
    })
  })
})
