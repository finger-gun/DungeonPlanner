import { describe, expect, it } from 'vitest'
import { createEmptySplineWallGraph, upsertSplineWallGraphRoomPath } from '../../store/splineWallGraph'
import {
  buildRoomSplineWallMeshesFromGraph,
  buildSplineWallGraphFromPaintedCells,
} from '../../store/splineWalls'
import {
  collectSplineWallComputePrototypeDebugCutouts,
  extractSplineWallComputePrototypeGeometry,
  getSplineWallComputePrototypeTransferables,
  populateSplineWallComputePrototypeFallbackOutputs,
  prepareSplineWallComputePrototype,
} from './SplineWallComputePrototype'

describe('SplineWallComputePrototype', () => {
  it('packs sampled spline chains into compute-ready wall geometry buffers', () => {
    const splineWallGraph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })

    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-prototype',
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
    expect(prototype?.packed.chainCount).toBe(1)
    expect(prototype?.packed.pathPointCount).toBe(4)
    expect(prototype?.packed.vertexCount).toBe(48)
    expect(prototype?.packed.indexCount).toBe(72)
    expect([...prototype!.packed.buffers.chainRanges.data]).toEqual([0, 4, 0, 48])
    expect([...prototype!.packed.buffers.vertexPathData.data.slice(0, 16)]).toEqual([
      0, 0, 0, 0,
      0, 0, 0, 0,
      1, 0, 0, 0,
      1, 0, 0, 0,
    ])
    expect(roundBuffer(prototype!.packed.buffers.vertexSurfaceData.data.slice(0, 16))).toEqual([
      0.1414, 0, 0, 0,
      0.1414, 2.4, 0, 1.2,
      0.1414, 0, 1, 0,
      0.1414, 2.4, 1, 1.2,
    ])
    expect([...prototype!.packed.buffers.vertexNormalData.data.slice(0, 16)]).toEqual([
      1, 0, 0, 0,
      1, 0, 0, 0,
      1, 0, 0, 0,
      1, 0, 0, 0,
    ])
    expect([...prototype!.packed.buffers.indexData.data.slice(0, 12)]).toEqual([
      0, 2, 1, 1, 2, 3,
      4, 6, 5, 5, 6, 7,
    ])
    expect(prototype?.dispatch.entryPoint).toBe('one-vertex-per-invocation')
    expect(prototype?.dispatch.invocationCount).toBe(48)
    expect(prototype?.dispatch.workgroupCount).toEqual([6, 1, 1])
    expect(prototype?.dispatch.computeNode).toBeTruthy()
    expect(getSplineWallComputePrototypeTransferables(prototype!.packed)).toHaveLength(13)

    populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    const extractedGeometry = extractSplineWallComputePrototypeGeometry(prototype!.packed)
    const cpuGeometry = buildRoomSplineWallMeshesFromGraph(
      splineWallGraph,
      new Set(['default']),
      new Set(),
      null,
      {
        cornerRadius: 0,
        curveSubdivisions: 1,
        wallHeight: 2.4,
        wallThickness: 0.2,
      },
    )[0]

    expect(cpuGeometry).toBeTruthy()
    expect(roundBuffer(extractedGeometry.positions)).toEqual(roundBuffer(cpuGeometry!.positions))
    expect(roundBuffer(extractedGeometry.normals)).toEqual(roundBuffer(cpuGeometry!.normals))
    expect(roundBuffer(extractedGeometry.uvs)).toEqual(roundBuffer(cpuGeometry!.uvs))
    expect([...extractedGeometry.indices]).toEqual([...cpuGeometry!.indices])
  })

  it('packs open spline chains with start and end cap normals', () => {
    const splineWallGraph = createEmptySplineWallGraph()
    splineWallGraph.nodes['node-a'] = {
      id: 'node-a',
      position: [0, 0],
      layerId: 'default',
      roomId: 'room-line',
    }
    splineWallGraph.nodes['node-b'] = {
      id: 'node-b',
      position: [1, 0],
      layerId: 'default',
      roomId: 'room-line',
    }
    splineWallGraph.segments['segment-a'] = {
      id: 'segment-a',
      pathId: 'path-a',
      startNodeId: 'node-a',
      endNodeId: 'node-b',
      layerId: 'default',
      roomId: 'room-line',
      wallKey: null,
      wallHeight: null,
      wallThickness: null,
      cutouts: [],
    }
    splineWallGraph.paths['path-a'] = {
      id: 'path-a',
      layerId: 'default',
      roomId: 'room-line',
      closed: false,
      nodeIds: ['node-a', 'node-b'],
      segmentIds: ['segment-a'],
    }

    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-prototype-open',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
    })

    expect(prototype).not.toBeNull()
    expect(prototype?.packed.pathPointCount).toBe(2)
    expect(prototype?.packed.vertexCount).toBe(20)
    expect(prototype?.packed.indexCount).toBe(30)
    expect([...prototype!.packed.buffers.chainRanges.data]).toEqual([0, 2, 0, 20])
    expect([...prototype!.packed.buffers.vertexNormalData.data.slice(48, 64)]).toEqual([
      0, -1, 0, 0,
      0, -1, 0, 0,
      0, -1, 0, 0,
      0, -1, 0, 0,
    ])
    expect([...prototype!.packed.buffers.vertexNormalData.data.slice(64, 80)]).toEqual([
      0, 1, 0, 0,
      0, 1, 0, 0,
      0, 1, 0, 0,
      0, 1, 0, 0,
    ])
  })

  it('remeshes front and back faces for window-style cutouts', () => {
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
      floorId: 'floor-spline-window',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
    })

    expect(prototype).not.toBeNull()
    expect(prototype?.packed.chainCount).toBe(1)
    expect(prototype?.packed.cutoutCount).toBe(1)

    populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    const extractedGeometry = extractSplineWallComputePrototypeGeometry(prototype!.packed)
    expect(countDegenerateTriangles(extractedGeometry.indices)).toBe(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.7,
      maxX: 1.3,
      minY: 0.6,
      maxY: 1.4,
      minZ: 0.09,
      maxZ: 0.11,
    })).toBe(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.7,
      maxX: 1.3,
      minY: 0.6,
      maxY: 1.4,
      minZ: -0.11,
      maxZ: -0.09,
    })).toBe(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.39,
      maxX: 0.51,
      minY: 0.7,
      maxY: 1.3,
      minZ: -0.05,
      maxZ: 0.05,
    })).toBeGreaterThan(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.7,
      maxX: 1.3,
      minY: 0.58,
      maxY: 0.62,
      minZ: -0.05,
      maxZ: 0.05,
    })).toBeGreaterThan(0)
  })

  it('generates interior lining geometry for arched door cutouts', () => {
    const splineWallGraph = createEmptySplineWallGraph()
    splineWallGraph.nodes['node-a'] = {
      id: 'node-a',
      position: [0, 0],
      layerId: 'default',
      roomId: 'room-door',
    }
    splineWallGraph.nodes['node-b'] = {
      id: 'node-b',
      position: [1, 0],
      layerId: 'default',
      roomId: 'room-door',
    }
    splineWallGraph.segments['segment-a'] = {
      id: 'segment-a',
      pathId: 'path-a',
      startNodeId: 'node-a',
      endNodeId: 'node-b',
      layerId: 'default',
      roomId: 'room-door',
      wallKey: '0:0:north',
      wallHeight: null,
      wallThickness: null,
      cutouts: [{
        id: 'cutout-door',
        kind: 'door',
        startRatio: 0.24,
        endRatio: 0.76,
        bottomHeight: 0,
        topHeight: 1.42,
        assetId: 'core.opening_door_custom',
        openingId: 'opening-door',
        objectProps: {},
      }],
    }
    splineWallGraph.paths['path-a'] = {
      id: 'path-a',
      layerId: 'default',
      roomId: 'room-door',
      closed: false,
      nodeIds: ['node-a', 'node-b'],
      segmentIds: ['segment-a'],
    }

    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-door',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
    })

    expect(prototype).not.toBeNull()

    populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    const extractedGeometry = extractSplineWallComputePrototypeGeometry(prototype!.packed)
    expect(countDegenerateTriangles(extractedGeometry.indices)).toBe(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.8,
      maxX: 1.2,
      minY: 0.2,
      maxY: 1.1,
      minZ: 0.09,
      maxZ: 0.11,
    })).toBe(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.8,
      maxX: 1.2,
      minY: 0.2,
      maxY: 1.1,
      minZ: -0.11,
      maxZ: -0.09,
    })).toBe(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.45,
      maxX: 0.55,
      minY: 0.2,
      maxY: 1.0,
      minZ: -0.05,
      maxZ: 0.05,
    })).toBeGreaterThan(0)
    expect(countLiveTrianglesInsideBox(extractedGeometry, {
      minX: 0.82,
      maxX: 1.18,
      minY: 1.3,
      maxY: 1.42,
      minZ: -0.05,
      maxZ: 0.05,
    })).toBeGreaterThan(0)
  })

  it('collects cutout debug data in world-space dimensions', () => {
    const splineWallGraph = createEmptySplineWallGraph()
    splineWallGraph.nodes['node-a'] = {
      id: 'node-a',
      position: [0, 0],
      layerId: 'default',
      roomId: 'room-cutout-debug',
    }
    splineWallGraph.nodes['node-b'] = {
      id: 'node-b',
      position: [1, 0],
      layerId: 'default',
      roomId: 'room-cutout-debug',
    }
    splineWallGraph.segments['segment-a'] = {
      id: 'segment-a',
      pathId: 'path-a',
      startNodeId: 'node-a',
      endNodeId: 'node-b',
      layerId: 'default',
      roomId: 'room-cutout-debug',
      wallKey: '0:0:north',
      wallHeight: null,
      wallThickness: null,
      cutouts: [{
        id: 'cutout-door',
        kind: 'door',
        startRatio: 0.24,
        endRatio: 0.76,
        bottomHeight: 0,
        topHeight: 1.42,
        assetId: 'core.opening_door_custom',
        openingId: 'opening-door',
        objectProps: {},
      }],
    }
    splineWallGraph.paths['path-a'] = {
      id: 'path-a',
      layerId: 'default',
      roomId: 'room-cutout-debug',
      closed: false,
      nodeIds: ['node-a', 'node-b'],
      segmentIds: ['segment-a'],
    }

    expect(collectSplineWallComputePrototypeDebugCutouts(
      splineWallGraph,
      new Set(['default']),
      null,
      {
        wallHeight: 2.4,
        wallThickness: 0.2,
      },
    )).toMatchObject([{
      origin: [0, 0],
      tangent: [1, 0],
      startDistance: 0.48,
      endDistance: 1.52,
      bottomHeight: 0,
      topHeight: 1.42,
      halfThickness: 0.1,
      shapeType: 1,
    }])
  })

  it('does not thicken straight wall spans when cutout densification is enabled', () => {
    const baseGraph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const cutoutGraph = createEmptySplineWallGraph()
    cutoutGraph.nodes = structuredClone(baseGraph.nodes)
    cutoutGraph.segments = structuredClone(baseGraph.segments)
    cutoutGraph.paths = structuredClone(baseGraph.paths)

    const northSegment = Object.values(cutoutGraph.segments).find((segment) => segment.wallKey === '0:0:north')
    expect(northSegment).toBeTruthy()
    northSegment!.cutouts = [{
      id: 'cutout-door',
      kind: 'door',
      startRatio: 0.24,
      endRatio: 0.76,
      bottomHeight: 0,
      topHeight: 1.42,
      assetId: 'core.opening_door_custom',
      openingId: 'opening-door',
      objectProps: {},
    }]

    const basePrototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-thickness-base',
      splineWallGraph: baseGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.5,
      workgroupSize: 8,
    })
    const cutoutPrototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-thickness-cutout',
      splineWallGraph: cutoutGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.5,
      workgroupSize: 8,
    })

    expect(basePrototype).not.toBeNull()
    expect(cutoutPrototype).not.toBeNull()

    populateSplineWallComputePrototypeFallbackOutputs(basePrototype!.packed)
    populateSplineWallComputePrototypeFallbackOutputs(cutoutPrototype!.packed)
    const baseBounds = computeXZBounds(extractSplineWallComputePrototypeGeometry(basePrototype!.packed).positions)
    const cutoutBounds = computeXZBounds(extractSplineWallComputePrototypeGeometry(cutoutPrototype!.packed).positions)

    expect(cutoutBounds.minX).toBeCloseTo(baseBounds.minX, 4)
    expect(cutoutBounds.maxX).toBeCloseTo(baseBounds.maxX, 4)
    expect(cutoutBounds.minZ).toBeCloseTo(baseBounds.minZ, 4)
    expect(cutoutBounds.maxZ).toBeCloseTo(baseBounds.maxZ, 4)
  })

  it('returns null when there are no spline chains to dispatch', () => {
    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-prototype-empty',
      splineWallGraph: createEmptySplineWallGraph(),
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
    })

    expect(prototype).toBeNull()
  })

  it('keeps mirrored shared-segment cutouts when packing a single owner room', () => {
    const splineWallGraph = createEmptySplineWallGraph()
    splineWallGraph.nodes['room-a:n0'] = {
      id: 'room-a:n0',
      position: [0, 0],
      layerId: 'default',
      roomId: 'room-a',
    }
    splineWallGraph.nodes['room-a:n1'] = {
      id: 'room-a:n1',
      position: [1, 0],
      layerId: 'default',
      roomId: 'room-a',
    }
    splineWallGraph.nodes['room-b:n0'] = {
      id: 'room-b:n0',
      position: [1, 0],
      layerId: 'default',
      roomId: 'room-b',
    }
    splineWallGraph.nodes['room-b:n1'] = {
      id: 'room-b:n1',
      position: [0, 0],
      layerId: 'default',
      roomId: 'room-b',
    }
    splineWallGraph.segments['room-a:s0'] = {
      id: 'room-a:s0',
      pathId: 'room-a:path:0',
      startNodeId: 'room-a:n0',
      endNodeId: 'room-a:n1',
      layerId: 'default',
      roomId: 'room-a',
      wallKey: null,
      wallHeight: null,
      wallThickness: null,
      cutouts: [],
    }
    splineWallGraph.segments['room-b:s0'] = {
      id: 'room-b:s0',
      pathId: 'room-b:path:0',
      startNodeId: 'room-b:n0',
      endNodeId: 'room-b:n1',
      layerId: 'default',
      roomId: 'room-b',
      wallKey: null,
      wallHeight: null,
      wallThickness: null,
      cutouts: [{
        id: 'cutout-shared',
        kind: 'door',
        startRatio: 0.2,
        endRatio: 0.8,
        bottomHeight: 0,
        topHeight: 1.42,
        assetId: 'core.opening_door_custom',
        openingId: 'opening-shared',
        objectProps: {},
      }],
    }
    splineWallGraph.paths['room-a:path:0'] = {
      id: 'room-a:path:0',
      layerId: 'default',
      roomId: 'room-a',
      closed: false,
      nodeIds: ['room-a:n0', 'room-a:n1'],
      segmentIds: ['room-a:s0'],
    }
    splineWallGraph.paths['room-b:path:0'] = {
      id: 'room-b:path:0',
      layerId: 'default',
      roomId: 'room-b',
      closed: false,
      nodeIds: ['room-b:n0', 'room-b:n1'],
      segmentIds: ['room-b:s0'],
    }

    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-shared-cutout-owner',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      roomIds: new Set(['room-a']),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
      workgroupSize: 8,
    })

    expect(prototype).not.toBeNull()
    expect(prototype?.packed.cutoutCount).toBe(1)

    populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    const extractedGeometry = extractSplineWallComputePrototypeGeometry(prototype!.packed)
    expect(countDegenerateTriangles(extractedGeometry.indices)).toBe(0)
  })

  it('matches CPU wall ownership when packing a single room from adjacent graph rooms', () => {
    const splineWallGraph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-b' },
    })

    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-shared-owner',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      roomIds: new Set(['room-b']),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
      workgroupSize: 8,
    })

    expect(prototype).not.toBeNull()

    populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    const extractedGeometry = extractSplineWallComputePrototypeGeometry(prototype!.packed)
    const cpuGeometry = buildRoomSplineWallMeshesFromGraph(
      splineWallGraph,
      new Set(['default']),
      new Set(),
      new Set(['room-b']),
      {
        cornerRadius: 0,
        curveSubdivisions: 1,
        wallHeight: 2.4,
        wallThickness: 0.2,
      },
    )[0]

    expect(cpuGeometry).toBeTruthy()
    expect(roundBuffer(extractedGeometry.positions)).toEqual(roundBuffer(cpuGeometry!.positions))
    expect(roundBuffer(extractedGeometry.normals)).toEqual(roundBuffer(cpuGeometry!.normals))
    expect(roundBuffer(extractedGeometry.uvs)).toEqual(roundBuffer(cpuGeometry!.uvs))
    expect([...extractedGeometry.indices]).toEqual([...cpuGeometry!.indices])
  })

  it('matches CPU wall ownership for a room that partially shares boundaries with multiple neighbors', () => {
    const splineWallGraph = createEmptySplineWallGraph()
    upsertRectangleRoom(splineWallGraph, 'room-left', 0, 0, 1, 3)
    upsertRectangleRoom(splineWallGraph, 'room-top', 1, 2, 3, 3)
    upsertRectangleRoom(splineWallGraph, 'room-center', 1, 1, 2, 2)

    const prototype = prepareSplineWallComputePrototype({
      floorId: 'floor-spline-shared-partial',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      roomIds: new Set(['room-left']),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
      workgroupSize: 8,
    })

    expect(prototype).not.toBeNull()

    populateSplineWallComputePrototypeFallbackOutputs(prototype!.packed)
    const extractedGeometry = extractSplineWallComputePrototypeGeometry(prototype!.packed)
    const cpuGeometry = buildRoomSplineWallMeshesFromGraph(
      splineWallGraph,
      new Set(['default']),
      new Set(),
      new Set(['room-left']),
      {
        cornerRadius: 0,
        curveSubdivisions: 1,
        wallHeight: 2.4,
        wallThickness: 0.2,
      },
    )[0]

    expect(cpuGeometry).toBeTruthy()
    expect(roundBuffer(extractedGeometry.positions)).toEqual(roundBuffer(cpuGeometry!.positions))
    expect(roundBuffer(extractedGeometry.normals)).toEqual(roundBuffer(cpuGeometry!.normals))
    expect(roundBuffer(extractedGeometry.uvs)).toEqual(roundBuffer(cpuGeometry!.uvs))
    expect([...extractedGeometry.indices]).toEqual([...cpuGeometry!.indices])
  })

  it('packs long cutout-heavy chains without overflowing the call stack', () => {
    const splineWallGraph = createEmptySplineWallGraph()
    splineWallGraph.nodes['node-a'] = {
      id: 'node-a',
      position: [0, 0],
      layerId: 'default',
      roomId: 'room-long-cutout',
    }
    splineWallGraph.nodes['node-b'] = {
      id: 'node-b',
      position: [64, 0],
      layerId: 'default',
      roomId: 'room-long-cutout',
    }
    splineWallGraph.segments['segment-a'] = {
      id: 'segment-a',
      pathId: 'path-a',
      startNodeId: 'node-a',
      endNodeId: 'node-b',
      layerId: 'default',
      roomId: 'room-long-cutout',
      wallKey: '0:0:north',
      wallHeight: null,
      wallThickness: null,
      cutouts: [{
        id: 'cutout-door',
        kind: 'door',
        startRatio: 0.45,
        endRatio: 0.55,
        bottomHeight: 0,
        topHeight: 1.42,
        assetId: 'core.opening_door_custom',
        openingId: 'opening-door',
        objectProps: {},
      }],
    }
    splineWallGraph.paths['path-a'] = {
      id: 'path-a',
      layerId: 'default',
      roomId: 'room-long-cutout',
      closed: false,
      nodeIds: ['node-a', 'node-b'],
      segmentIds: ['segment-a'],
    }

    expect(() => prepareSplineWallComputePrototype({
      floorId: 'floor-spline-long-cutout',
      splineWallGraph,
      visibleLayerIds: new Set(['default']),
      suppressedWallKeys: new Set(),
      cornerRadius: 0,
      curveSubdivisions: 1,
      wallHeight: 2.4,
      wallThickness: 0.2,
      workgroupSize: 8,
    })).not.toThrow()
  })
})

function roundBuffer(buffer: ArrayLike<number>) {
  return Array.from(buffer).map((value) => Number(value.toFixed(4)))
}

function upsertRectangleRoom(
  splineWallGraph: ReturnType<typeof createEmptySplineWallGraph>,
  roomId: string,
  minX: number,
  minZ: number,
  maxX: number,
  maxZ: number,
) {
  const nextGraph = upsertSplineWallGraphRoomPath(splineWallGraph, {
    roomId,
    layerId: 'default',
    nodes: [
      { position: [minX, minZ], cornerMode: 'square', cornerAmount: 0 },
      { position: [maxX, minZ], cornerMode: 'square', cornerAmount: 0 },
      { position: [maxX, maxZ], cornerMode: 'square', cornerAmount: 0 },
      { position: [minX, maxZ], cornerMode: 'square', cornerAmount: 0 },
    ],
  })

  Object.assign(splineWallGraph.nodes, nextGraph.nodes)
  Object.assign(splineWallGraph.segments, nextGraph.segments)
  Object.assign(splineWallGraph.paths, nextGraph.paths)
}

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

function countLiveTrianglesInsideBox(
  geometry: {
    positions: Float32Array
    indices: Uint32Array
  },
  bounds: {
    minX: number
    maxX: number
    minY: number
    maxY: number
    minZ: number
    maxZ: number
  },
) {
  let count = 0

  for (let index = 0; index < geometry.indices.length; index += 3) {
    const a = geometry.indices[index]
    const b = geometry.indices[index + 1]
    const c = geometry.indices[index + 2]
    if (a === b || b === c || a === c) {
      continue
    }

    const centerX = (
      geometry.positions[a * 3]
      + geometry.positions[b * 3]
      + geometry.positions[c * 3]
    ) / 3
    const centerY = (
      geometry.positions[(a * 3) + 1]
      + geometry.positions[(b * 3) + 1]
      + geometry.positions[(c * 3) + 1]
    ) / 3
    const centerZ = (
      geometry.positions[(a * 3) + 2]
      + geometry.positions[(b * 3) + 2]
      + geometry.positions[(c * 3) + 2]
    ) / 3

    if (
      centerX >= bounds.minX
      && centerX <= bounds.maxX
      && centerY >= bounds.minY
      && centerY <= bounds.maxY
      && centerZ >= bounds.minZ
      && centerZ <= bounds.maxZ
    ) {
      count += 1
    }
  }

  return count
}

function computeXZBounds(positions: Float32Array) {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY

  for (let index = 0; index < positions.length; index += 3) {
    const x = positions[index] ?? 0
    const z = positions[index + 2] ?? 0
    minX = Math.min(minX, x)
    maxX = Math.max(maxX, x)
    minZ = Math.min(minZ, z)
    maxZ = Math.max(maxZ, z)
  }

  return { minX, maxX, minZ, maxZ }
}
