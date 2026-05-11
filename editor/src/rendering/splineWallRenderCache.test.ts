import { afterEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFloorDirtyInfo } from '../store/floorDirtyDomains'
import {
  cloneSplineWallGraph,
  createEmptySplineWallGraph,
  upsertSplineWallGraphRoomPath,
} from '../store/splineWallGraph'
import { buildSplineWallGraphFromPaintedCells } from '../store/splineWalls'
import type { PaintedCells } from '../store/useDungeonStore'
import {
  applyComputedSplineWallRenderEntry,
  buildSplineWallMaterialGroupedIndexData,
  clearSplineWallRenderCache,
  getCachedSplineWallRenderEntries,
  getSplineWallRenderCacheSourceKey,
  getSplineWallRenderCacheStats,
  pruneSplineWallRenderCache,
} from './splineWallRenderCache'

afterEach(() => {
  clearSplineWallRenderCache()
})

describe('splineWallRenderCache', () => {
  it('reuses room geometries and updates them in place for the same floor', () => {
    const entriesA = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      },
      splineWallGraph: createEmptySplineWallGraph(),
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    expect(entriesA).toHaveLength(1)
    const geometry = entriesA[0]!.geometry
    const originalVertexCount = (geometry.getAttribute('position') as THREE.BufferAttribute).count

    const entriesB = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
        '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
      },
      splineWallGraph: createEmptySplineWallGraph(),
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    expect(entriesB).toHaveLength(1)
    expect(entriesB[0]!.geometry).toBe(geometry)
    expect((entriesB[0]!.geometry.getAttribute('position') as THREE.BufferAttribute).count)
      .toBeGreaterThan(originalVertexCount)
  })

  it('prunes render resources for floors that are no longer retained', () => {
    getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      },
      splineWallGraph: createEmptySplineWallGraph(),
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })
    getCachedSplineWallRenderEntries({
      floorId: 'floor-2',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-b' },
      },
      splineWallGraph: createEmptySplineWallGraph(),
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    pruneSplineWallRenderCache(['floor-1'])

    expect(getSplineWallRenderCacheStats()).toEqual({
      floorIds: ['floor-1'],
      geometryCount: 1,
    })
  })

  it('updates only affected room geometries when dirty wall keys point to a subset of graph rooms', () => {
    const paintedCells: PaintedCells = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '4:0': { cell: [4, 0], layerId: 'default', roomId: 'room-b' },
    }
    const graph = buildSplineWallGraphFromPaintedCells(paintedCells)
    const entriesA = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells,
      splineWallGraph: graph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    const roomBEntry = entriesA.find((entry) => entry.roomId === 'room-b')
    expect(roomBEntry).toBeDefined()
    const roomBPositionAttribute = roomBEntry!.geometry.getAttribute('position')

    const nextGraph = cloneSplineWallGraph(graph)
    const roomAPath = Object.values(nextGraph.paths).find((path) => path.roomId === 'room-a')
    const roomANodeId = roomAPath?.nodeIds[0]
    expect(roomANodeId).toBeDefined()
    nextGraph.nodes[roomANodeId!].position = [0, -0.5]

    const entriesB = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells,
      splineWallGraph: nextGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      dirtyInfo: {
        ...createFloorDirtyInfo(),
        sequence: 1,
        wallsVersion: 1,
        dirtyWallKeys: ['0:0:north'],
      },
    })

    const nextRoomBEntry = entriesB.find((entry) => entry.roomId === 'room-b')
    expect(nextRoomBEntry).toBeDefined()
    expect(nextRoomBEntry!.geometry).toBe(roomBEntry!.geometry)
    expect(nextRoomBEntry!.geometry.getAttribute('position')).toBe(roomBPositionAttribute)
  })

  it('refreshes the shared-boundary owner room when the dirty wall key belongs to the mirrored room', () => {
    const paintedCells: PaintedCells = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-b' },
    }
    const graph = buildSplineWallGraphFromPaintedCells(paintedCells)
    const entriesA = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells,
      splineWallGraph: graph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    const roomAEntry = entriesA.find((entry) => entry.roomId === 'room-a')
    expect(roomAEntry).toBeDefined()
    const roomAPositionAttribute = roomAEntry!.geometry.getAttribute('position')

    const nextGraph = cloneSplineWallGraph(graph)
    const mirroredSharedSegment = Object.values(nextGraph.segments).find((segment) => segment.wallKey === '1:0:west')
    expect(mirroredSharedSegment).toBeDefined()
    mirroredSharedSegment!.cutouts = [{
      id: 'door-cutout',
      kind: 'door',
      startRatio: 0.1,
      endRatio: 0.4,
      bottomHeight: 0,
      topHeight: 1.42,
      assetId: null,
      openingId: 'door-opening',
      objectProps: {},
    }]

    const entriesB = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells,
      splineWallGraph: nextGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      dirtyInfo: {
        ...createFloorDirtyInfo(),
        sequence: 1,
        wallsVersion: 1,
        dirtyWallKeys: ['1:0:west'],
      },
    })

    const nextRoomAEntry = entriesB.find((entry) => entry.roomId === 'room-a')
    expect(nextRoomAEntry).toBeDefined()
    expect(nextRoomAEntry!.geometry).toBe(roomAEntry!.geometry)
    expect(nextRoomAEntry!.geometry.getAttribute('position')).not.toBe(roomAPositionAttribute)
  })

  it('refreshes all graph rooms that partially share a new room boundary', () => {
    const paintedCells: PaintedCells = {
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-left' },
      '0:1': { cell: [0, 1], layerId: 'default', roomId: 'room-left' },
      '0:2': { cell: [0, 2], layerId: 'default', roomId: 'room-left' },
      '1:2': { cell: [1, 2], layerId: 'default', roomId: 'room-top' },
      '2:2': { cell: [2, 2], layerId: 'default', roomId: 'room-top' },
    }
    const graph = upsertSplineWallGraphRoomPath(
      upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
        roomId: 'room-left',
        layerId: 'default',
        nodes: createRectangleNodes(0, 0, 1, 3),
      }),
      {
        roomId: 'room-top',
        layerId: 'default',
        nodes: createRectangleNodes(1, 2, 3, 3),
      },
    )
    const entriesA = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells,
      splineWallGraph: graph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    const leftEntry = entriesA.find((entry) => entry.roomId === 'room-left')
    const topEntry = entriesA.find((entry) => entry.roomId === 'room-top')
    expect(leftEntry).toBeDefined()
    expect(topEntry).toBeDefined()
    const leftPositionAttribute = leftEntry!.geometry.getAttribute('position')
    const topPositionAttribute = topEntry!.geometry.getAttribute('position')

    const nextPaintedCells: PaintedCells = {
      ...paintedCells,
      '1:1': { cell: [1, 1], layerId: 'default', roomId: 'room-center' },
    }
    const nextGraph = upsertSplineWallGraphRoomPath(cloneSplineWallGraph(graph), {
      roomId: 'room-center',
      layerId: 'default',
      nodes: createRectangleNodes(1, 1, 2, 2),
    })

    const entriesB = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells: nextPaintedCells,
      splineWallGraph: nextGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      dirtyInfo: {
        ...createFloorDirtyInfo(),
        sequence: 1,
        wallsVersion: 1,
        dirtyCellKeys: ['1:1'],
      },
    })

    const nextLeftEntry = entriesB.find((entry) => entry.roomId === 'room-left')
    const nextTopEntry = entriesB.find((entry) => entry.roomId === 'room-top')
    expect(nextLeftEntry).toBeDefined()
    expect(nextTopEntry).toBeDefined()
    expect(nextLeftEntry!.geometry).toBe(leftEntry!.geometry)
    expect(nextTopEntry!.geometry).toBe(topEntry!.geometry)
    expect(nextLeftEntry!.geometry.getAttribute('position')).not.toBe(leftPositionAttribute)
    expect(nextTopEntry!.geometry.getAttribute('position')).not.toBe(topPositionAttribute)
  })

  it('applies computed geometry updates only when the cached source key still matches', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const entries = getCachedSplineWallRenderEntries({
      floorId: 'floor-1',
      paintedCells: {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      },
      splineWallGraph: graph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    const sourceKey = getSplineWallRenderCacheSourceKey('floor-1')
    expect(sourceKey).toBeTruthy()

    const entry = entries[0]
    expect(entry).toBeDefined()

    const staleApplied = applyComputedSplineWallRenderEntry({
      floorId: 'floor-1',
      roomId: 'room-a',
      expectedSourceKey: 'stale-key',
      meshData: {
        roomId: 'room-a',
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        normals: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]),
        uvs: new Float32Array([0, 0, 1, 0, 0, 1]),
        indices: new Uint32Array([0, 1, 2]),
      },
    })
    expect(staleApplied).toBe(false)

    const applied = applyComputedSplineWallRenderEntry({
      floorId: 'floor-1',
      roomId: 'room-a',
      expectedSourceKey: sourceKey,
      meshData: {
        roomId: 'room-a',
        positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
        normals: new Float32Array([0, 1, 0, 0, 1, 0, 0, 1, 0]),
        uvs: new Float32Array([0, 0, 1, 0, 0, 1]),
        indices: new Uint32Array([0, 1, 2]),
      },
    })
    expect(applied).toBe(true)
    expect((entry!.geometry.getAttribute('position') as THREE.BufferAttribute).count).toBe(3)
  })

  it('splits top-facing triangles into a second material group', () => {
    const grouped = buildSplineWallMaterialGroupedIndexData({
      normals: new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 1, 0,
        0, 1, 0,
        0, 1, 0,
      ]),
      indices: new Uint32Array([0, 1, 2, 3, 4, 5]),
    })

    expect([...grouped.indices]).toEqual([0, 1, 2, 3, 4, 5])
    expect(grouped.sideIndexCount).toBe(3)
    expect(grouped.topIndexCount).toBe(3)
  })
})

function createRectangleNodes(
  minX: number,
  minZ: number,
  maxX: number,
  maxZ: number,
) {
  return [
    { position: [minX, minZ] as [number, number], cornerMode: 'square' as const, cornerAmount: 0 },
    { position: [maxX, minZ] as [number, number], cornerMode: 'square' as const, cornerAmount: 0 },
    { position: [maxX, maxZ] as [number, number], cornerMode: 'square' as const, cornerAmount: 0 },
    { position: [minX, maxZ] as [number, number], cornerMode: 'square' as const, cornerAmount: 0 },
  ]
}
