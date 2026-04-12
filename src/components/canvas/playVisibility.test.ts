import { describe, expect, it } from 'vitest'
import {
  buildPortalLookup,
  castVisibilityMaskRay,
  computeVisibilitySamples,
  computeVisibleCellKeys,
  isVisiblePlayerOrigin,
} from './playVisibility'
import type { OpeningRecord, PaintedCells } from '../../store/useDungeonStore'

function makeCells(entries: Array<{ cell: [number, number]; roomId?: string | null }>): PaintedCells {
  return Object.fromEntries(
    entries.map(({ cell, roomId = null }) => [
      `${cell[0]}:${cell[1]}`,
      { cell, layerId: 'default', roomId },
    ]),
  )
}

describe('computeVisibleCellKeys', () => {
  it('reveals cells in direct line of sight within range', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3)).toEqual(
      expect.arrayContaining(['0:0', '1:0', '2:0']),
    )
  })

  it('stops at closed room boundaries', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3)).toEqual(['0:0'])
  })

  it('passes through opened walls', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      'open-1': {
        id: 'open-1',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    expect(computeVisibleCellKeys(paintedCells, wallOpenings, [[0, 0]], 3)).toEqual(
      expect.arrayContaining(['0:0', '1:0']),
    )
  })

  it('shows the occluding cell but hides cells behind a blocking prop', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
    ])

    const visible = computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3, ['1:0'])
    expect(visible).toContain('1:0')
    expect(visible).not.toContain('2:0')
  })

  it('blocks diagonal sight when an intermediate cell contains a LOS blocker', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [1, 1], roomId: 'room-a' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3, ['1:0'])).not.toContain('1:1')
  })

  it('does not see diagonally through a closed corner', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
      { cell: [0, 1], roomId: 'room-c' },
      { cell: [1, 1], roomId: 'room-d' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0]], 3)).not.toContain('1:1')
  })

  it('can see diagonally through a corner when both crossed walls are opened', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
      { cell: [0, 1], roomId: 'room-c' },
      { cell: [1, 1], roomId: 'room-d' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      east: {
        id: 'open-east',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
      north: {
        id: 'open-north',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:north',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
      eastOfNorth: {
        id: 'open-east-of-north',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:1:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
      northOfEast: {
        id: 'open-north-of-east',
        assetId: 'core.opening_door_wall_1',
        wallKey: '1:0:north',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    expect(computeVisibleCellKeys(paintedCells, wallOpenings, [[0, 0]], 3)).toContain('1:1')
  })

  it('merges visibility from multiple players', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [4, 0], roomId: 'room-b' },
      { cell: [5, 0], roomId: 'room-b' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0], [4, 0]], 1)).toEqual(
      expect.arrayContaining(['0:0', '1:0', '4:0', '5:0']),
    )
  })
})

describe('castVisibilityMaskRay', () => {
  it('passes straight through a doorway portal', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      'open-1': {
        id: 'open-1',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    const point = castVisibilityMaskRay([0, 0], 0, paintedCells, wallOpenings, 3)
    expect(point[0]).toBeGreaterThan(2.5)
  })

  it('clips rays that hit the closed part of a door wall', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      'open-1': {
        id: 'open-1',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    const point = castVisibilityMaskRay([0, 0], Math.PI / 4, paintedCells, wallOpenings, 3)
    expect(point[0]).toBeLessThan(2.05)
  })
})

describe('computeVisibilitySamples', () => {
  it('normalizes doorway edge angles before sorting around the east-facing seam', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    const wallOpenings: Record<string, OpeningRecord> = {
      eastDoor: {
        id: 'east-door',
        assetId: 'core.opening_door_wall_1',
        wallKey: '0:0:east',
        width: 1,
        flipped: false,
        layerId: 'default',
      },
    }

    const samples = computeVisibilitySamples(
      [0, 0],
      paintedCells,
      buildPortalLookup(wallOpenings),
      new Set(),
      4,
    )

    expect(samples.length).toBeGreaterThan(0)
    samples.forEach((sample) => {
      expect(sample.angle).toBeGreaterThanOrEqual(0)
      expect(sample.angle).toBeLessThan(Math.PI * 2)
    })

    for (let index = 1; index < samples.length; index += 1) {
      expect(samples[index - 1]!.angle).toBeLessThanOrEqual(samples[index]!.angle)
    }
  })
})

describe('isVisiblePlayerOrigin', () => {
  it('uses the snapped cell coordinates instead of the occupancy key suffix', () => {
    const paintedCells = makeCells([{ cell: [0, 0], roomId: 'room-a' }])

    expect(
      isVisiblePlayerOrigin(
        {
          id: 'player-1',
          type: 'player',
          assetId: 'core.player_barbarian',
          position: [1, 0, 1],
          rotation: [0, 0, 0],
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: 'default',
          props: {},
        },
        paintedCells,
        { default: { id: 'default', name: 'Default', visible: true, locked: false } },
      ),
    ).toBe(true)
  })
})
