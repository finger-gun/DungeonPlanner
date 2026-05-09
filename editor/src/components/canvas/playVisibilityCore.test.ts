import { describe, expect, it } from 'vitest'
import { computeVisibilityMask, computeVisibleCellKeys } from './playVisibilityCore'
import { upsertSplineWallGraphRoomPath } from '../../store/splineWallGraph'
import type { PaintedCells } from '../../store/useDungeonStore'

function makeCells(entries: Array<{ cell: [number, number]; roomId?: string | null }>): PaintedCells {
  return Object.fromEntries(
    entries.map(({ cell, roomId = null }) => [
      `${cell[0]}:${cell[1]}`,
      { cell, layerId: 'default', roomId },
    ]),
  )
}

function makeRectangleCells(width: number, height: number, roomId: string = 'room-1'): PaintedCells {
  return makeCells(
    Array.from({ length: width * height }, (_, index) => ({
      cell: [index % width, Math.floor(index / width)] as [number, number],
      roomId,
    })),
  )
}

describe('computeVisibleCellKeys', () => {
  it('casts visibility from every player even when another player already revealed their cell', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
      { cell: [3, 0], roomId: 'room-a' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0], [2, 0]], 2)).toEqual(
      expect.arrayContaining(['0:0', '1:0', '2:0', '3:0']),
    )
  })

  it('passes through authored wall openings even before their visual open state toggles', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    expect(
      computeVisibleCellKeys(
        paintedCells,
        {
          door: {
            id: 'door',
            assetId: 'core.opening_door_wall_1',
            wallKey: '0:0:east',
            width: 1,
            layerId: 'default',
            objectProps: {},
          },
        },
        [[0, 0]],
        3,
      ),
    ).toEqual(expect.arrayContaining(['0:0', '1:0']))
  })

  it('passes through wall segments with open wall state', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    expect(
      computeVisibleCellKeys(
        paintedCells,
        {},
        [[0, 0]],
        3,
        [],
        new Map(),
        new Set(),
        { '0:0:east': { open: true } },
      ),
    ).toEqual(expect.arrayContaining(['0:0', '1:0']))
  })

  it('passes through legacy wall-surface passage openings after reclassification', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    expect(
      computeVisibleCellKeys(
        paintedCells,
        {},
        [[0, 0]],
        3,
        [],
        new Map(),
        new Set(),
        {},
        { '0:0:east': 'dungeon.wall_wall_opening' },
      ),
    ).toEqual(expect.arrayContaining(['0:0', '1:0']))
  })

  it('blocks cells that fall outside rounded spline room coverage', () => {
    const paintedCells = makeRectangleCells(4, 4)
    const splineWallGraph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-1',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'rounded', cornerAmount: 2 },
        { position: [4, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const visible = computeVisibleCellKeys(paintedCells, {}, [[1, 1]], 4, [], new Map(), new Set(), {}, {}, splineWallGraph)

    expect(visible).not.toContain('0:0')
    expect(visible).toContain('3:3')
  })

  it('blocks line of sight across diagonal spline room boundaries', () => {
    const paintedCells = makeRectangleCells(4, 4)
    const splineWallGraph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-1',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const visible = computeVisibleCellKeys(paintedCells, {}, [[0, 2]], 4, [], new Map(), new Set(), {}, {}, splineWallGraph)

    expect(visible).not.toContain('2:0')
    expect(visible).toContain('1:2')
  })
})

describe('computeVisibilityMask', () => {
  it('treats opened wall state as a full-width LOS portal', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
      { cell: [2, 0], roomId: 'room-c' },
      { cell: [1, 1], roomId: 'room-b' },
      { cell: [2, 1], roomId: 'room-c' },
    ])

    const mask = computeVisibilityMask(paintedCells, {}, {}, [[0, 0]], 3, [], new Map(), new Set(), {
      '0:0:east': { open: true },
    })

    expect(mask).not.toBeNull()
    expect(mask?.sources[0]?.polygon.some((point) => point[0] > 2.3)).toBe(true)
  })

  it('clips the visibility mask to diagonal spline room walls', () => {
    const paintedCells = makeRectangleCells(4, 4)
    const splineWallGraph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-1',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const mask = computeVisibilityMask(paintedCells, {}, {}, [[0, 2]], 6, [], new Map(), new Set(), {}, {}, splineWallGraph)

    expect(mask).not.toBeNull()
    expect(mask?.sources[0]?.polygon.every((point) => point[0] <= point[1] + 0.05)).toBe(true)
  })
})
