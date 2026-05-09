import { describe, expect, it } from 'vitest'
import { upsertSplineWallGraphRoomPath } from '../../store/splineWallGraph'
import type { DungeonObjectRecord, OpeningRecord, PaintedCells } from '../../store/useDungeonStore'
import type { InnerWallRecord } from '../../store/manualWalls'
import { buildMovementRange, getObjectMovementMeters, metersToSquares } from './playMovement'

function createPlayer(overrides: Partial<DungeonObjectRecord> = {}): DungeonObjectRecord {
  return {
    id: 'player-1',
    type: 'player',
    assetId: 'generated.player.test',
    position: [1, 0, 1],
    rotation: [0, 0, 0],
    props: {},
    cell: [0, 0],
    cellKey: '0:0:floor',
    layerId: 'layer-1',
    ...overrides,
  }
}

function createPaintedCells(cells: Array<[number, number]>, roomId: string | null = 'room-1'): PaintedCells {
  return Object.fromEntries(cells.map((cell) => [
    `${cell[0]}:${cell[1]}`,
    { cell, layerId: 'layer-1', roomId },
  ]))
}

function createRectangleCells(width: number, height: number): Array<[number, number]> {
  return Array.from({ length: width * height }, (_, index) => [
    index % width,
    Math.floor(index / width),
  ] as [number, number])
}

describe('playMovement', () => {
  it('converts meters to squares using the dungeon grid size', () => {
    expect(metersToSquares(10)).toBe(5)
    expect(metersToSquares(9.9)).toBe(4)
  })

  it('reads movement meters from object props when present', () => {
    expect(getObjectMovementMeters(createPlayer())).toBe(10)
    expect(getObjectMovementMeters(createPlayer({
      props: { movementMeters: 14 },
    }))).toBe(14)
  })

  it('treats diagonal movement as a single step', () => {
    const range = buildMovementRange({
      object: createPlayer(),
      mapMode: 'indoor',
      paintedCells: createPaintedCells([
        [0, 0], [1, 0], [0, 1], [1, 1],
      ]),
      blockedCells: {},
      wallOpenings: {},
      innerWalls: {},
      occupancy: { '0:0:floor': 'player-1' },
      placedObjects: { 'player-1': createPlayer() },
    })

    expect(range.reachableCellKeys.has('1:1')).toBe(true)
  })

  it('blocks movement through boundary walls unless an opening suppresses them', () => {
    const paintedCells = {
      '0:0': { cell: [0, 0] as [number, number], layerId: 'layer-1', roomId: 'room-a' },
      '0:1': { cell: [0, 1] as [number, number], layerId: 'layer-1', roomId: 'room-b' },
    }
    const object = createPlayer()
    const baseInput = {
      object,
      mapMode: 'indoor' as const,
      paintedCells,
      blockedCells: {},
      innerWalls: {} as Record<string, InnerWallRecord>,
      occupancy: { '0:0:floor': 'player-1' },
      placedObjects: { 'player-1': object },
    }

    expect(buildMovementRange({
      ...baseInput,
      wallOpenings: {},
    }).reachableCellKeys.has('0:1')).toBe(false)

    expect(buildMovementRange({
      ...baseInput,
      wallOpenings: {
        'opening-1': {
          id: 'opening-1',
          assetId: 'core.opening.door',
          wallKey: '0:0:north',
          width: 1,
          layerId: 'layer-1',
        } satisfies OpeningRecord,
      },
    }).reachableCellKeys.has('0:1')).toBe(true)

    expect(buildMovementRange({
      ...baseInput,
      wallOpenings: {},
      wallSurfaceProps: {
        '0:0:north': { open: true },
      },
    }).reachableCellKeys.has('0:1')).toBe(true)
  })

  it('blocks movement through inner walls and prevents diagonal corner cutting', () => {
    const object = createPlayer()
    const range = buildMovementRange({
      object,
      mapMode: 'indoor',
      paintedCells: createPaintedCells([
        [0, 0], [1, 0], [0, 1], [1, 1],
      ]),
      blockedCells: {},
      wallOpenings: {},
      innerWalls: {
        '0:0:east': { wallKey: '0:0:east', layerId: 'layer-1' },
        '0:0:north': { wallKey: '0:0:north', layerId: 'layer-1' },
      },
      occupancy: { '0:0:floor': 'player-1' },
      placedObjects: { 'player-1': object },
    })

    expect(range.reachableCellKeys.has('1:0')).toBe(false)
    expect(range.reachableCellKeys.has('0:1')).toBe(false)
    expect(range.reachableCellKeys.has('1:1')).toBe(false)
  })

  it('rejects cells that are less than 75% inside a rounded spline room', () => {
    const object = createPlayer({
      cell: [1, 1],
      cellKey: '1:1:floor',
      position: [3, 0, 3],
    })
    const splineWallGraph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-1',
      layerId: 'layer-1',
      nodes: [
        { position: [0, 0], cornerMode: 'rounded', cornerAmount: 2 },
        { position: [4, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const range = buildMovementRange({
      object,
      mapMode: 'indoor',
      paintedCells: createPaintedCells(createRectangleCells(4, 4)),
      blockedCells: {},
      wallOpenings: {},
      innerWalls: {},
      occupancy: { '1:1:floor': 'player-1' },
      placedObjects: { 'player-1': object },
      splineWallGraph,
    })

    expect(range.reachableCellKeys.has('0:0')).toBe(false)
    expect(range.reachableCellKeys.has('3:3')).toBe(true)
  })

  it('blocks movement into cells outside diagonal spline room boundaries', () => {
    const object = createPlayer({
      cell: [0, 2],
      cellKey: '0:2:floor',
      position: [1, 0, 5],
    })
    const splineWallGraph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-1',
      layerId: 'layer-1',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const range = buildMovementRange({
      object,
      mapMode: 'indoor',
      paintedCells: createPaintedCells(createRectangleCells(4, 4)),
      blockedCells: {},
      wallOpenings: {},
      innerWalls: {},
      occupancy: { '0:2:floor': 'player-1' },
      placedObjects: { 'player-1': object },
      splineWallGraph,
    })

    expect(range.reachableCellKeys.has('2:0')).toBe(false)
    expect(range.reachableCellKeys.has('1:2')).toBe(true)
  })
})
