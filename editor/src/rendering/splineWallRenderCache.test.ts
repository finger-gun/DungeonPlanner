import { afterEach, describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createFloorDirtyInfo } from '../store/floorDirtyDomains'
import { cloneSplineWallGraph, createEmptySplineWallGraph } from '../store/splineWallGraph'
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
