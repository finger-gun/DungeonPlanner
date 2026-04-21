import { describe, expect, it } from 'vitest'
import type { ContentPackAsset } from '../../content-packs/types'
import type { PaintedCellRecord } from '../../store/useDungeonStore'
import { calculatePropSnapPosition } from './propPlacement'

const SINGLE_PAINTED_CELL: Record<string, PaintedCellRecord> = {
  '0:0': {
    cell: [0, 0],
    layerId: 'default',
    roomId: null,
  },
}

const SHARED_WALL_CELLS: Record<string, PaintedCellRecord> = {
  '0:0': {
    cell: [0, 0],
    layerId: 'default',
    roomId: 'room-a',
  },
  '0:1': {
    cell: [0, 1],
    layerId: 'default',
    roomId: 'room-b',
  },
}

const THREE_BY_THREE_ROOM: Record<string, PaintedCellRecord> = {
  '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
  '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
  '2:0': { cell: [2, 0], layerId: 'default', roomId: 'room-a' },
  '0:1': { cell: [0, 1], layerId: 'default', roomId: 'room-a' },
  '1:1': { cell: [1, 1], layerId: 'default', roomId: 'room-a' },
  '2:1': { cell: [2, 1], layerId: 'default', roomId: 'room-a' },
  '0:2': { cell: [0, 2], layerId: 'default', roomId: 'room-a' },
  '1:2': { cell: [1, 2], layerId: 'default', roomId: 'room-a' },
  '2:2': { cell: [2, 2], layerId: 'default', roomId: 'room-a' },
}

function createTestAsset(metadata: ContentPackAsset['metadata']): ContentPackAsset {
  return {
    id: 'test.asset',
    slug: 'test-asset',
    name: 'Test Asset',
    category: 'prop',
    Component: (() => null) as ContentPackAsset['Component'],
    metadata,
  }
}

describe('calculatePropSnapPosition', () => {
  it.each([
    { name: 'north', cursor: { x: 1, y: 0, z: 1.9 }, expectedPosition: [1, 0, 1.5], expectedRotationY: Math.PI },
    { name: 'south', cursor: { x: 1, y: 0, z: 0.1 }, expectedPosition: [1, 0, 0.5], expectedRotationY: 0 },
    { name: 'east', cursor: { x: 1.9, y: 0, z: 1 }, expectedPosition: [1.5, 0, 1], expectedRotationY: -Math.PI / 2 },
    { name: 'west', cursor: { x: 0.1, y: 0, z: 1 }, expectedPosition: [0.5, 0, 1], expectedRotationY: Math.PI / 2 },
  ])('snaps to the $name wall segment center and keeps the support cell', ({ cursor, expectedPosition, expectedRotationY }) => {
    const asset = createTestAsset({
      connectsTo: 'WALL',
      snapsTo: 'GRID',
      connectors: [{ type: 'WALL', point: [0, 0, 0] }],
    })

    const placement = calculatePropSnapPosition(asset, cursor, SINGLE_PAINTED_CELL, null)

    expect(placement).not.toBeNull()
    expect(placement?.cell).toEqual([0, 0])
    expect(placement?.cellKey).toBe('0:0')
    expect(placement?.position[0]).toBeCloseTo(expectedPosition[0])
    expect(placement?.position[1]).toBeCloseTo(expectedPosition[1])
    expect(placement?.position[2]).toBeCloseTo(expectedPosition[2])
    expect(placement?.rotation[1]).toBeCloseTo(expectedRotationY)
  })

  it('snaps to the closest side of a shared wall', () => {
    const asset = createTestAsset({
      connectsTo: 'WALL',
      snapsTo: 'GRID',
      connectors: [{ type: 'WALL', point: [0, 0, 0] }],
    })

    const lowerRoomPlacement = calculatePropSnapPosition(asset, { x: 1, y: 0, z: 1.8 }, SHARED_WALL_CELLS, null)
    const upperRoomPlacement = calculatePropSnapPosition(asset, { x: 1, y: 0, z: 2.2 }, SHARED_WALL_CELLS, null)

    expect(lowerRoomPlacement?.cellKey).toBe('0:0')
    expect(lowerRoomPlacement?.position[2]).toBeCloseTo(1.5)
    expect(lowerRoomPlacement?.rotation[1]).toBeCloseTo(Math.PI)

    expect(upperRoomPlacement?.cellKey).toBe('0:1')
    expect(upperRoomPlacement?.position[2]).toBeCloseTo(2.5)
    expect(upperRoomPlacement?.rotation[1]).toBeCloseTo(0)
  })

  it('rotates the connector offset before anchoring wall props', () => {
    const asset = createTestAsset({
      connectsTo: ['WALL', 'FLOOR'],
      snapsTo: 'GRID',
      connectors: [{ type: 'WALL', point: [0, 0, -0.5] }],
    })

    const placement = calculatePropSnapPosition(asset, { x: 1.9, y: 0, z: 1 }, SINGLE_PAINTED_CELL, null)

    expect(placement).not.toBeNull()
    expect(placement?.cellKey).toBe('0:0')
    expect(placement?.position[0]).toBeCloseTo(1)
    expect(placement?.position[2]).toBeCloseTo(1)
  })

  it('chooses the nearer floor anchor for dual wall/floor props', () => {
    const asset = createTestAsset({
      connectsTo: ['WALL', 'FLOOR'],
      snapsTo: 'GRID',
      connectors: [
        { type: 'WALL', point: [0, 0, 0] },
        { type: 'FLOOR', point: [0, 0, 0] },
      ],
    })

    const placement = calculatePropSnapPosition(asset, { x: 3, y: 0, z: 4.3 }, THREE_BY_THREE_ROOM, null)

    expect(placement).not.toBeNull()
    expect(placement?.connector.type).toBe('FLOOR')
    expect(placement?.cellKey).toBe('1:2')
    expect(placement?.position[0]).toBeCloseTo(3)
    expect(placement?.position[2]).toBeCloseTo(5)
  })

  it('chooses the nearer wall anchor for dual wall/floor props in FREE mode', () => {
    const asset = createTestAsset({
      connectsTo: ['WALL', 'FLOOR'],
      snapsTo: 'FREE',
      connectors: [
        { type: 'WALL', point: [0, 0, 0] },
        { type: 'FLOOR', point: [0, 0, 0] },
      ],
    })

    const placement = calculatePropSnapPosition(asset, { x: 1, y: 0, z: 1.4 }, SINGLE_PAINTED_CELL, null)

    expect(placement).not.toBeNull()
    expect(placement?.connector.type).toBe('WALL')
    expect(placement?.cellKey).toBe('0:0')
    expect(placement?.position[0]).toBeCloseTo(1)
    expect(placement?.position[2]).toBeCloseTo(1.5)
  })

  it('chooses a prop surface over the floor when the surface candidate is closer', () => {
    const asset = createTestAsset({
      connectsTo: ['FLOOR', 'SURFACE'],
      snapsTo: 'FREE',
      connectors: [
        { type: 'FLOOR', point: [0, 0, 0] },
        { type: 'SURFACE', point: [0, 0, 0] },
      ],
    })

    const placement = calculatePropSnapPosition(
      asset,
      { x: 1, y: 0, z: 1 },
      SINGLE_PAINTED_CELL,
      {
        position: [1, 1, 1],
        objectId: 'table-1',
        cell: [0, 0],
      },
    )

    expect(placement).not.toBeNull()
    expect(placement?.connector.type).toBe('SURFACE')
    expect(placement?.parentObjectId).toBe('table-1')
    expect(placement?.position).toEqual([1, 1, 1])
  })

  it('chooses the closest candidate regardless of connector type', () => {
    const asset = createTestAsset({
      connectsTo: ['WALL', 'FLOOR', 'SURFACE'],
      snapsTo: 'FREE',
      connectors: [
        { type: 'WALL', point: [0, 0, 0] },
        { type: 'FLOOR', point: [0, 0, 0] },
        { type: 'SURFACE', point: [0, 0, 0] },
      ],
    })

    const placement = calculatePropSnapPosition(
      asset,
      { x: 1, y: 0, z: 1.4 },
      SINGLE_PAINTED_CELL,
      {
        position: [1, 1, 1.4],
        objectId: 'shelf-1',
        cell: [0, 0],
      },
    )

    expect(placement).not.toBeNull()
    expect(placement?.connector.type).toBe('SURFACE')
    expect(placement?.parentObjectId).toBe('shelf-1')
  })

  it('lets FREE wall snapping follow the cursor along a north/south wall', () => {
    const asset = createTestAsset({
      connectsTo: 'WALL',
      snapsTo: 'FREE',
      connectors: [{ type: 'WALL', point: [0, 0, 0] }],
    })

    const placement = calculatePropSnapPosition(asset, { x: 0.35, y: 0, z: 1.85 }, SINGLE_PAINTED_CELL, null)

    expect(placement).not.toBeNull()
    expect(placement?.connector.type).toBe('WALL')
    expect(placement?.position[0]).toBeCloseTo(0.35)
    expect(placement?.position[2]).toBeCloseTo(1.5)
  })

  it('lets FREE wall snapping follow the cursor along an east/west wall', () => {
    const asset = createTestAsset({
      connectsTo: 'WALL',
      snapsTo: 'FREE',
      connectors: [{ type: 'WALL', point: [0, 0, 0] }],
    })

    const placement = calculatePropSnapPosition(asset, { x: 1.85, y: 0, z: 0.35 }, SINGLE_PAINTED_CELL, null)

    expect(placement).not.toBeNull()
    expect(placement?.connector.type).toBe('WALL')
    expect(placement?.position[0]).toBeCloseTo(1.5)
    expect(placement?.position[2]).toBeCloseTo(0.35)
  })

  it('uses the cursor ray against the wall plane for FREE wall placement', () => {
    const asset = createTestAsset({
      connectsTo: 'WALL',
      snapsTo: 'FREE',
      connectors: [{ type: 'WALL', point: [0, 0, 0] }],
    })

    const placement = calculatePropSnapPosition(
      asset,
      { x: 1.85, y: 0, z: 1 },
      SINGLE_PAINTED_CELL,
      null,
      {
        origin: [0, 1, 0.35],
        direction: [1, 0, 0],
      },
    )

    expect(placement).not.toBeNull()
    expect(placement?.position[0]).toBeCloseTo(1.5)
    expect(placement?.position[1]).toBeCloseTo(1)
    expect(placement?.position[2]).toBeCloseTo(0.35)
  })
})
