import { describe, expect, it, vi } from 'vitest'
import { createEmptySplineWallGraph } from '../../store/splineWallGraph'
import { buildSplineWallGraphFromPaintedCells } from '../../store/splineWalls'
import {
  canDispatchSplineWallComputePrototype,
  cloneStorageBufferAttributeArray,
  dispatchSplineWallComputePrototype,
} from './SplineWallComputeRuntime'
import {
  prepareSplineWallComputePrototype,
  populateSplineWallComputePrototypeFallbackOutputs,
} from './SplineWallComputePrototype'

describe('SplineWallComputeRuntime', () => {
  it('detects whether a renderer supports spline compute dispatch and readback', () => {
    expect(canDispatchSplineWallComputePrototype(null)).toBe(false)
    expect(canDispatchSplineWallComputePrototype({ computeAsync() {} })).toBe(false)
    expect(canDispatchSplineWallComputePrototype({
      computeAsync() {},
      getArrayBufferAsync: async () => new ArrayBuffer(0),
    })).toBe(true)
  })

  it('dispatches a spline prototype and reads back geometry buffers', async () => {
    const splineWallGraph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-runtime',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
      workgroupSize: 8,
    })

    expect(prototype).not.toBeNull()

    const computeAsync = vi.fn(async () => {
      populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    })
    const getArrayBufferAsync = vi.fn(async (attribute) => {
      if (attribute === prototype!.dispatch.bufferAttributes.indexData) {
        throw new Error('index readback should not happen')
      }
      return cloneStorageBufferAttributeArray(attribute).buffer
    })
    const geometry = await dispatchSplineWallComputePrototype({
      computeAsync,
      getArrayBufferAsync,
    }, prototype!)

    expect(computeAsync).toHaveBeenCalledTimes(1)
    expect(getArrayBufferAsync).toHaveBeenCalledTimes(3)
    expect(geometry.positions).toHaveLength(144)
    expect(geometry.normals).toHaveLength(144)
    expect(geometry.uvs).toHaveLength(96)
    expect(geometry.indices).toHaveLength(72)
  })

  it('dispatches remeshed cutouts without index readback', async () => {
    const splineWallGraph = createEmptySplineWallGraph()
    splineWallGraph.nodes['node-a'] = {
      id: 'node-a',
      position: [0, 0],
      layerId: 'default',
      roomId: 'room-window',
    }
    splineWallGraph.nodes['node-b'] = {
      id: 'node-b',
      position: [1, 0],
      layerId: 'default',
      roomId: 'room-window',
    }
    splineWallGraph.segments['segment-a'] = {
      id: 'segment-a',
      pathId: 'path-a',
      startNodeId: 'node-a',
      endNodeId: 'node-b',
      layerId: 'default',
      roomId: 'room-window',
      wallKey: '0:0:north',
      wallHeight: null,
      wallThickness: null,
      cutouts: [{
        id: 'cutout-window',
        kind: 'window',
        startRatio: 0.2,
        endRatio: 0.8,
        bottomHeight: 0.6,
        topHeight: 1.4,
        assetId: 'core.opening_window_test',
        openingId: 'opening-window',
        objectProps: {},
      }],
    }
    splineWallGraph.paths['path-a'] = {
      id: 'path-a',
      layerId: 'default',
      roomId: 'room-window',
      closed: false,
      nodeIds: ['node-a', 'node-b'],
      segmentIds: ['segment-a'],
    }

    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-runtime-window',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
      workgroupSize: 8,
    })

    expect(prototype).not.toBeNull()
    expect(prototype?.packed.cutoutCount).toBe(1)

    const computeAsync = vi.fn(async () => {
      populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    })
    const getArrayBufferAsync = vi.fn(async (attribute) => {
      if (attribute === prototype!.dispatch.bufferAttributes.indexData) {
        throw new Error('index readback should not happen')
      }
      return cloneStorageBufferAttributeArray(attribute).buffer
    })
    const geometry = await dispatchSplineWallComputePrototype({
      computeAsync,
      getArrayBufferAsync,
    }, prototype!)

    expect(computeAsync).toHaveBeenCalledTimes(2)
    expect(getArrayBufferAsync).toHaveBeenCalledTimes(3)
    expect(countDegenerateTriangles(geometry.indices)).toBe(0)
  })

  it('keeps remeshed cutouts stable when async compute leaves indices unchanged', async () => {
    const splineWallGraph = createWindowCutoutSplineWallGraph()
    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-runtime-window-readback',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
      workgroupSize: 8,
    })

    expect(prototype).not.toBeNull()
    const originalIndices = new Int32Array(prototype!.packed.buffers.indexData.data)
    let invocation = 0
    const computeAsync = vi.fn(async () => {
      invocation += 1
      if (invocation === 1) {
        populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
        prototype!.packed.buffers.indexData.data.set(originalIndices)
      }
    })
    const getArrayBufferAsync = vi.fn(async (attribute) => {
      if (attribute === prototype!.dispatch.bufferAttributes.indexData) {
        throw new Error('index readback should not happen')
      }
      return cloneStorageBufferAttributeArray(attribute).buffer
    })
    const geometry = await dispatchSplineWallComputePrototype({
      computeAsync,
      getArrayBufferAsync,
    }, prototype!)

    expect(computeAsync).toHaveBeenCalledTimes(2)
    expect(getArrayBufferAsync).toHaveBeenCalledTimes(3)
    expect(countDegenerateTriangles(geometry.indices)).toBe(0)
  })
})

function countDegenerateTriangles(indices: Uint32Array) {
  let count = 0
  for (let index = 0; index < indices.length; index += 3) {
    const a = indices[index]
    const b = indices[index + 1]
    const c = indices[index + 2]
    if (a === b || b === c || a === c) {
      count += 1
    }
  }

  return count
}

function createWindowCutoutSplineWallGraph() {
  const splineWallGraph = createEmptySplineWallGraph()
  splineWallGraph.nodes['node-a'] = {
    id: 'node-a',
    position: [0, 0],
    layerId: 'default',
    roomId: 'room-window',
  }
  splineWallGraph.nodes['node-b'] = {
    id: 'node-b',
    position: [1, 0],
    layerId: 'default',
    roomId: 'room-window',
  }
  splineWallGraph.segments['segment-a'] = {
    id: 'segment-a',
    pathId: 'path-a',
    startNodeId: 'node-a',
    endNodeId: 'node-b',
    layerId: 'default',
    roomId: 'room-window',
    wallKey: '0:0:north',
    wallHeight: null,
    wallThickness: null,
    cutouts: [{
      id: 'cutout-window',
      kind: 'window',
      startRatio: 0.2,
      endRatio: 0.8,
      bottomHeight: 0.6,
      topHeight: 1.4,
      assetId: 'core.opening_window_test',
      openingId: 'opening-window',
      objectProps: {},
    }],
  }
  splineWallGraph.paths['path-a'] = {
    id: 'path-a',
    layerId: 'default',
    roomId: 'room-window',
    closed: false,
    nodeIds: ['node-a', 'node-b'],
    segmentIds: ['segment-a'],
  }

  return splineWallGraph
}
