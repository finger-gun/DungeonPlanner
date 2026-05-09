import { describe, expect, it } from 'vitest'
import type { SplineWallGraph } from './splineWallGraph'
import {
  DEFAULT_SPLINE_WALL_HEIGHT,
  DEFAULT_SPLINE_WALL_THICKNESS,
  buildSampledSplineWallFrames,
  buildRoomSplineWallChains,
  buildRoomSplineWallChainsFromGraph,
  buildRoomSplineWallMeshesFromGraph,
  buildRoomSplineWallMeshes,
  buildSplineWallMaskPathFromGraph,
  buildSplineWallGraphFromPaintedCells,
  evaluateQuadraticBezierFrame,
} from './splineWalls'

describe('splineWalls', () => {
  it('evaluates an axis-aligned quadratic frame with a stable tangent and normal', () => {
    const frame = evaluateQuadraticBezierFrame([0, 0], [1, 0], [2, 0], 0.5)

    expect(frame.position).toEqual([1, 0])
    expect(frame.tangent[0]).toBeCloseTo(1)
    expect(frame.tangent[1]).toBeCloseTo(0)
    expect(frame.normal[0]).toBeCloseTo(0)
    expect(frame.normal[1]).toBeCloseTo(1)
  })

  it('evaluates a diagonal quadratic frame with a perpendicular normal', () => {
    const frame = evaluateQuadraticBezierFrame([0, 0], [1, 1], [2, 2], 0.5)
    const diagonal = Math.SQRT1_2

    expect(frame.position[0]).toBeCloseTo(1)
    expect(frame.position[1]).toBeCloseTo(1)
    expect(frame.tangent[0]).toBeCloseTo(diagonal)
    expect(frame.tangent[1]).toBeCloseTo(diagonal)
    expect(frame.normal[0]).toBeCloseTo(-diagonal)
    expect(frame.normal[1]).toBeCloseTo(diagonal)
  })

  it('builds a closed boundary chain for a filled rectangular room', () => {
    const chains = buildRoomSplineWallChains({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
      '0:1': { cell: [0, 1], layerId: 'default', roomId: 'room-a' },
      '1:1': { cell: [1, 1], layerId: 'default', roomId: 'room-a' },
    })

    expect(chains).toHaveLength(1)
    expect(chains[0]).toMatchObject({
      roomId: 'room-a',
      closed: true,
    })
    expect(chains[0]?.wallKeys).toHaveLength(8)
  })

  it('breaks the wall loop into an open chain when an opening removes a wall span', () => {
    const chains = buildRoomSplineWallChains({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    }, new Set(['0:0:north']))

    expect(chains).toHaveLength(1)
    expect(chains[0]).toMatchObject({
      roomId: 'room-a',
      closed: false,
    })
    expect(chains[0]?.wallKeys).toEqual(['0:0:east', '0:0:south', '0:0:west'])
  })

  it('produces indexed mesh data for spline wall chains', () => {
    const meshes = buildRoomSplineWallMeshes({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
      '0:1': { cell: [0, 1], layerId: 'default', roomId: 'room-a' },
      '1:1': { cell: [1, 1], layerId: 'default', roomId: 'room-a' },
    })

    expect(meshes).toHaveLength(1)
    expect(meshes[0]?.positions.length).toBeGreaterThan(0)
    expect(meshes[0]?.normals.length).toBe(meshes[0]?.positions.length)
    expect(meshes[0]?.uvs.length).toBeGreaterThan(0)
    expect(meshes[0]?.indices.length).toBeGreaterThan(0)
  })

  it('uses miter scaling to preserve wall thickness through rounded corner joins', () => {
    const frames = buildSampledSplineWallFrames({
      roomId: 'room-a',
      wallKeys: ['wall-a', 'wall-b'],
      points: [[0, 0], [2, 0], [2, 2]],
      closed: false,
      cornerStyles: [undefined, { mode: 'rounded', amount: 1 }, undefined],
    }, {
      curveSubdivisions: 6,
    })

    expect(frames.length).toBeGreaterThan(3)
    expect(frames[0]?.offsetScale).toBe(1)
    expect(frames.at(-1)?.offsetScale).toBe(1)
    expect(Math.max(...frames.map((frame) => frame.offsetScale))).toBeGreaterThan(1.01)
  })

  it('matches the original dungeon wall asset height and thickness by default', () => {
    const graph: SplineWallGraph = {
      nodes: {
        'node-a': { id: 'node-a', position: [0, 0], layerId: 'default', roomId: 'room-a' },
        'node-b': { id: 'node-b', position: [1, 0], layerId: 'default', roomId: 'room-a' },
      },
      segments: {
        'segment-a': {
          id: 'segment-a',
          pathId: 'path-a',
          startNodeId: 'node-a',
          endNodeId: 'node-b',
          layerId: 'default',
          roomId: 'room-a',
          wallKey: null,
          wallHeight: null,
          wallThickness: null,
          cutouts: [],
        },
      },
      paths: {
        'path-a': {
          id: 'path-a',
          layerId: 'default',
          roomId: 'room-a',
          closed: false,
          nodeIds: ['node-a', 'node-b'],
          segmentIds: ['segment-a'],
        },
      },
    }
    const meshes = buildRoomSplineWallMeshesFromGraph(graph)

    expect(meshes).toHaveLength(1)

    const positions = meshes[0]!.positions
    const zs: number[] = []
    const ys: number[] = []
    for (let index = 0; index < positions.length; index += 3) {
      zs.push(positions[index + 2]!)
      ys.push(positions[index + 1]!)
    }

    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(DEFAULT_SPLINE_WALL_HEIGHT)
    expect(Math.max(...zs) - Math.min(...zs)).toBeCloseTo(DEFAULT_SPLINE_WALL_THICKNESS)
  })

  it('builds graph-backed wall paths that can be reconstructed into render chains', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
    })

    expect(Object.keys(graph.paths)).toHaveLength(1)
    expect(Object.keys(graph.nodes)).toHaveLength(6)
    expect(Object.values(graph.segments)).toHaveLength(6)

    const chains = buildRoomSplineWallChainsFromGraph(graph, null, new Set(['0:0:north']))
    expect(chains).toHaveLength(1)
    expect(chains[0]).toMatchObject({
      roomId: 'room-a',
      closed: false,
    })
  })

  it('deduplicates coincident shared wall segments across adjacent graph-backed rooms', () => {
    const graph: SplineWallGraph = {
      nodes: {
        'room-a:n0': { id: 'room-a:n0', position: [0, 0], layerId: 'default', roomId: 'room-a' },
        'room-a:n1': { id: 'room-a:n1', position: [1, 0], layerId: 'default', roomId: 'room-a' },
        'room-a:n2': { id: 'room-a:n2', position: [1, 1], layerId: 'default', roomId: 'room-a' },
        'room-a:n3': { id: 'room-a:n3', position: [0, 1], layerId: 'default', roomId: 'room-a' },
        'room-b:n0': { id: 'room-b:n0', position: [1, 0], layerId: 'default', roomId: 'room-b' },
        'room-b:n1': { id: 'room-b:n1', position: [2, 0], layerId: 'default', roomId: 'room-b' },
        'room-b:n2': { id: 'room-b:n2', position: [2, 1], layerId: 'default', roomId: 'room-b' },
        'room-b:n3': { id: 'room-b:n3', position: [1, 1], layerId: 'default', roomId: 'room-b' },
      },
      segments: {
        'room-a:s0': { id: 'room-a:s0', pathId: 'room-a:path:0', startNodeId: 'room-a:n0', endNodeId: 'room-a:n1', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-a:s1': { id: 'room-a:s1', pathId: 'room-a:path:0', startNodeId: 'room-a:n1', endNodeId: 'room-a:n2', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-a:s2': { id: 'room-a:s2', pathId: 'room-a:path:0', startNodeId: 'room-a:n2', endNodeId: 'room-a:n3', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-a:s3': { id: 'room-a:s3', pathId: 'room-a:path:0', startNodeId: 'room-a:n3', endNodeId: 'room-a:n0', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-b:s0': { id: 'room-b:s0', pathId: 'room-b:path:0', startNodeId: 'room-b:n0', endNodeId: 'room-b:n1', layerId: 'default', roomId: 'room-b', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-b:s1': { id: 'room-b:s1', pathId: 'room-b:path:0', startNodeId: 'room-b:n1', endNodeId: 'room-b:n2', layerId: 'default', roomId: 'room-b', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-b:s2': { id: 'room-b:s2', pathId: 'room-b:path:0', startNodeId: 'room-b:n2', endNodeId: 'room-b:n3', layerId: 'default', roomId: 'room-b', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-b:s3': { id: 'room-b:s3', pathId: 'room-b:path:0', startNodeId: 'room-b:n3', endNodeId: 'room-b:n0', layerId: 'default', roomId: 'room-b', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
      },
      paths: {
        'room-a:path:0': {
          id: 'room-a:path:0',
          layerId: 'default',
          roomId: 'room-a',
          closed: true,
          nodeIds: ['room-a:n0', 'room-a:n1', 'room-a:n2', 'room-a:n3'],
          segmentIds: ['room-a:s0', 'room-a:s1', 'room-a:s2', 'room-a:s3'],
        },
        'room-b:path:0': {
          id: 'room-b:path:0',
          layerId: 'default',
          roomId: 'room-b',
          closed: true,
          nodeIds: ['room-b:n0', 'room-b:n1', 'room-b:n2', 'room-b:n3'],
          segmentIds: ['room-b:s0', 'room-b:s1', 'room-b:s2', 'room-b:s3'],
        },
      },
    }

    const chains = buildRoomSplineWallChainsFromGraph(graph)

    expect(chains).toHaveLength(2)
    expect(chains).toEqual(expect.arrayContaining([
      expect.objectContaining({ roomId: 'room-a', closed: true }),
      expect.objectContaining({ roomId: 'room-b', closed: false }),
    ]))
    const allWallKeys = chains.flatMap((chain) => chain.wallKeys)
    expect(allWallKeys).toContain('room-a:path:0:segment:1')
    expect(allWallKeys).not.toContain('room-b:path:0:segment:3')
    expect(allWallKeys).toHaveLength(7)
  })

  it('deduplicates shared wall segments even when only one room is requested', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-b' },
    })

    const ownerChains = buildRoomSplineWallChainsFromGraph(graph, null, new Set(), new Set(['room-a']))
    const mirroredChains = buildRoomSplineWallChainsFromGraph(graph, null, new Set(), new Set(['room-b']))

    expect(ownerChains).toHaveLength(1)
    expect(ownerChains[0]).toMatchObject({
      roomId: 'room-a',
      closed: true,
      wallKeys: ['0:0:north', '0:0:east', '0:0:south', '0:0:west'],
    })
    expect(mirroredChains).toHaveLength(1)
    expect(mirroredChains[0]).toMatchObject({
      roomId: 'room-b',
      closed: false,
      wallKeys: ['1:0:north', '1:0:east', '1:0:south'],
      points: [[1, 1], [2, 1], [2, 0], [1, 0]],
    })
  })

  it('mirrors cutouts from reversed shared segments onto the owning wall chain', () => {
    const graph: SplineWallGraph = {
      nodes: {
        'room-a:n0': { id: 'room-a:n0', position: [0, 0], layerId: 'default', roomId: 'room-a' },
        'room-a:n1': { id: 'room-a:n1', position: [1, 0], layerId: 'default', roomId: 'room-a' },
        'room-b:n0': { id: 'room-b:n0', position: [1, 0], layerId: 'default', roomId: 'room-b' },
        'room-b:n1': { id: 'room-b:n1', position: [0, 0], layerId: 'default', roomId: 'room-b' },
      },
      segments: {
        'room-a:s0': {
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
        },
        'room-b:s0': {
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
            startRatio: 0.1,
            endRatio: 0.4,
            bottomHeight: 0,
            topHeight: 1.42,
            assetId: 'core.opening_door_custom',
            openingId: 'opening-shared',
            objectProps: {},
          }],
        },
      },
      paths: {
        'room-a:path:0': {
          id: 'room-a:path:0',
          layerId: 'default',
          roomId: 'room-a',
          closed: false,
          nodeIds: ['room-a:n0', 'room-a:n1'],
          segmentIds: ['room-a:s0'],
        },
        'room-b:path:0': {
          id: 'room-b:path:0',
          layerId: 'default',
          roomId: 'room-b',
          closed: false,
          nodeIds: ['room-b:n0', 'room-b:n1'],
          segmentIds: ['room-b:s0'],
        },
      },
    }

    const chains = buildRoomSplineWallChainsFromGraph(graph)

    expect(chains).toHaveLength(3)
    expect(chains.map((chain) => chain.roomId)).toEqual(['room-a', 'room-a', 'room-a'])
    expect(chains.map((chain) => chain.points)).toEqual([
      [[0, 0], [0.6, 0]],
      [[0.9, 0], [1, 0]],
      [[0, 0], [1, 0]],
    ])
    expect(chains[2]?.wallBaseHeight).toBeCloseTo(1.42)
    expect(chains[2]?.wallHeight).toBeCloseTo(0.58)
  })

  it('treats full-span graph cutouts as spline wall gaps without legacy suppression keys', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const northSegment = Object.values(graph.segments).find((segment) => segment.wallKey === '0:0:north')
    expect(northSegment).toBeDefined()

    northSegment!.cutouts = [{
      id: 'opening:north',
      kind: 'passage',
      startRatio: 0,
      endRatio: 1,
      bottomHeight: 0,
      topHeight: null,
      assetId: null,
      openingId: 'opening-1',
      objectProps: {},
    }]

    const chains = buildRoomSplineWallChainsFromGraph(graph)
    expect(chains).toHaveLength(1)
    expect(chains[0]).toMatchObject({
      roomId: 'room-a',
      closed: false,
    })
    expect(chains[0]?.wallKeys).toEqual(['0:0:east', '0:0:south', '0:0:west'])
  })

  it('splits a graph wall segment into visible spans around a partial cutout', () => {
    const graph: SplineWallGraph = {
      nodes: {
        'node-a': { id: 'node-a', position: [0, 0], layerId: 'default', roomId: 'room-a' },
        'node-b': { id: 'node-b', position: [2, 0], layerId: 'default', roomId: 'room-a' },
      },
      segments: {
        'segment-a': {
          id: 'segment-a',
          pathId: 'path-a',
          startNodeId: 'node-a',
          endNodeId: 'node-b',
          layerId: 'default',
          roomId: 'room-a',
          wallKey: '0:0:north',
          wallHeight: null,
          wallThickness: null,
          cutouts: [{
            id: 'cutout-a',
            kind: 'door',
            startRatio: 0.24,
            endRatio: 0.76,
            bottomHeight: 0,
            topHeight: 1.42,
            assetId: 'core.opening_door_custom',
            openingId: 'opening-a',
            objectProps: {},
          }],
        },
      },
      paths: {
        'path-a': {
          id: 'path-a',
          layerId: 'default',
          roomId: 'room-a',
          closed: false,
          nodeIds: ['node-a', 'node-b'],
          segmentIds: ['segment-a'],
        },
      },
    }

    const chains = buildRoomSplineWallChainsFromGraph(graph)

    expect(chains).toHaveLength(3)
    expect(chains.map((chain) => chain.wallKeys)).toEqual([['0:0:north'], ['0:0:north'], ['0:0:north']])
    expect(chains[0]?.points).toEqual([[0, 0], [0.48, 0]])
    expect(chains[1]?.points).toEqual([[1.52, 0], [2, 0]])
    expect(chains[2]?.points).toEqual([[0, 0], [2, 0]])
    expect(chains[0]?.closed).toBe(false)
    expect(chains[1]?.closed).toBe(false)
    expect(chains[2]?.closed).toBe(false)
    expect(chains[0]?.cornerStyles).toEqual([undefined, undefined])
    expect(chains[1]?.cornerStyles).toEqual([undefined, undefined])
    expect(chains[2]?.cornerStyles).toEqual([undefined, undefined])
    expect(chains[2]?.wallBaseHeight).toBeCloseTo(1.42)
    expect(chains[2]?.wallHeight).toBeCloseTo(0.58)
  })

  it('builds lower, middle, and upper wall bands around a window cutout', () => {
    const graph: SplineWallGraph = {
      nodes: {
        'node-a': { id: 'node-a', position: [0, 0], layerId: 'default', roomId: 'room-a' },
        'node-b': { id: 'node-b', position: [2, 0], layerId: 'default', roomId: 'room-a' },
      },
      segments: {
        'segment-a': {
          id: 'segment-a',
          pathId: 'path-a',
          startNodeId: 'node-a',
          endNodeId: 'node-b',
          layerId: 'default',
          roomId: 'room-a',
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
        },
      },
      paths: {
        'path-a': {
          id: 'path-a',
          layerId: 'default',
          roomId: 'room-a',
          closed: false,
          nodeIds: ['node-a', 'node-b'],
          segmentIds: ['segment-a'],
        },
      },
    }

    const chains = buildRoomSplineWallChainsFromGraph(graph)

    expect(chains).toHaveLength(4)
    expect(chains[0]?.points).toEqual([[0, 0], [2, 0]])
    expect(chains[0]?.wallBaseHeight).toBeUndefined()
    expect(chains[0]?.wallHeight).toBeCloseTo(0.6)
    expect(roundWallPoints(chains[1]?.points ?? [])).toEqual([[0, 0], [0.4, 0]])
    expect(chains[1]?.wallBaseHeight).toBeCloseTo(0.6)
    expect(chains[1]?.wallHeight).toBeCloseTo(0.8)
    expect(roundWallPoints(chains[2]?.points ?? [])).toEqual([[1.6, 0], [2, 0]])
    expect(chains[2]?.wallBaseHeight).toBeCloseTo(0.6)
    expect(chains[2]?.wallHeight).toBeCloseTo(0.8)
    expect(chains[3]?.points).toEqual([[0, 0], [2, 0]])
    expect(chains[3]?.wallBaseHeight).toBeCloseTo(1.4)
    expect(chains[3]?.wallHeight).toBeCloseTo(0.6)
  })

  it('keeps distinct visible spans for multiple door cutouts on one segment', () => {
    const graph: SplineWallGraph = {
      nodes: {
        'node-a': { id: 'node-a', position: [0, 0], layerId: 'default', roomId: 'room-a' },
        'node-b': { id: 'node-b', position: [3, 0], layerId: 'default', roomId: 'room-a' },
      },
      segments: {
        'segment-a': {
          id: 'segment-a',
          pathId: 'path-a',
          startNodeId: 'node-a',
          endNodeId: 'node-b',
          layerId: 'default',
          roomId: 'room-a',
          wallKey: '0:0:north',
          wallHeight: null,
          wallThickness: null,
          cutouts: [
            {
              id: 'cutout-door-a',
              kind: 'door',
              startRatio: 0.15,
              endRatio: 0.35,
              bottomHeight: 0,
              topHeight: 1.3,
              assetId: 'core.opening_door_a',
              openingId: 'opening-door-a',
              objectProps: {},
            },
            {
              id: 'cutout-door-b',
              kind: 'door',
              startRatio: 0.6,
              endRatio: 0.82,
              bottomHeight: 0,
              topHeight: 1.3,
              assetId: 'core.opening_door_b',
              openingId: 'opening-door-b',
              objectProps: {},
            },
          ],
        },
      },
      paths: {
        'path-a': {
          id: 'path-a',
          layerId: 'default',
          roomId: 'room-a',
          closed: false,
          nodeIds: ['node-a', 'node-b'],
          segmentIds: ['segment-a'],
        },
      },
    }

    const chains = buildRoomSplineWallChainsFromGraph(graph)

    expect(chains).toHaveLength(4)
    expect(chains.map((chain) => roundWallPoints(chain.points))).toEqual([
      [[0, 0], [0.45, 0]],
      [[1.05, 0], [1.8, 0]],
      [[2.46, 0], [3, 0]],
      [[0, 0], [3, 0]],
    ])
    expect(chains.slice(0, 3).every((chain) => chain.wallBaseHeight === undefined && Math.abs((chain.wallHeight ?? 0) - 1.3) < 1e-6)).toBe(true)
    expect(chains[3]?.wallBaseHeight).toBeCloseTo(1.3)
    expect(chains[3]?.wallHeight).toBeCloseTo(0.7)
  })

  it('honors explicit square and diagonal graph corner styles when sampling paths', () => {
    const baseGraph = {
      nodes: {
        'room-a:path:0:node:0': { id: 'room-a:path:0:node:0', position: [0, 2], layerId: 'default', roomId: 'room-a' },
        'room-a:path:0:node:1': { id: 'room-a:path:0:node:1', position: [2, 2], layerId: 'default', roomId: 'room-a' },
        'room-a:path:0:node:2': { id: 'room-a:path:0:node:2', position: [2, 0], layerId: 'default', roomId: 'room-a' },
        'room-a:path:0:node:3': { id: 'room-a:path:0:node:3', position: [0, 0], layerId: 'default', roomId: 'room-a' },
      },
      segments: {
        'room-a:path:0:segment:0': { id: 'room-a:path:0:segment:0', pathId: 'room-a:path:0', startNodeId: 'room-a:path:0:node:0', endNodeId: 'room-a:path:0:node:1', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-a:path:0:segment:1': { id: 'room-a:path:0:segment:1', pathId: 'room-a:path:0', startNodeId: 'room-a:path:0:node:1', endNodeId: 'room-a:path:0:node:2', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-a:path:0:segment:2': { id: 'room-a:path:0:segment:2', pathId: 'room-a:path:0', startNodeId: 'room-a:path:0:node:2', endNodeId: 'room-a:path:0:node:3', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
        'room-a:path:0:segment:3': { id: 'room-a:path:0:segment:3', pathId: 'room-a:path:0', startNodeId: 'room-a:path:0:node:3', endNodeId: 'room-a:path:0:node:0', layerId: 'default', roomId: 'room-a', wallKey: null, wallHeight: null, wallThickness: null, cutouts: [] },
      },
      paths: {
        'room-a:path:0': {
          id: 'room-a:path:0',
          layerId: 'default',
          roomId: 'room-a',
          closed: true,
          nodeIds: ['room-a:path:0:node:0', 'room-a:path:0:node:1', 'room-a:path:0:node:2', 'room-a:path:0:node:3'],
          segmentIds: ['room-a:path:0:segment:0', 'room-a:path:0:segment:1', 'room-a:path:0:segment:2', 'room-a:path:0:segment:3'],
        },
      },
    } satisfies SplineWallGraph

    const squareGraph = {
      ...baseGraph,
      nodes: Object.fromEntries(
        Object.entries(baseGraph.nodes).map(([nodeId, node]) => [
          nodeId,
          { ...node, cornerMode: 'square' as const, cornerAmount: 0 },
        ]),
      ),
    }
    const diagonalGraph = {
      ...squareGraph,
      nodes: {
        ...squareGraph.nodes,
        'room-a:path:0:node:0': {
          ...squareGraph.nodes['room-a:path:0:node:0'],
          cornerMode: 'diagonal' as const,
          cornerAmount: 1,
        },
      },
    }

    const legacyMesh = buildRoomSplineWallMeshesFromGraph(baseGraph, null, new Set(), null, { cornerRadius: 0.5, curveSubdivisions: 4 })
    const squareMesh = buildRoomSplineWallMeshesFromGraph(squareGraph, null, new Set(), null, { cornerRadius: 0.5, curveSubdivisions: 4 })
    const diagonalMesh = buildRoomSplineWallMeshesFromGraph(diagonalGraph, null, new Set(), null, { cornerRadius: 0.5, curveSubdivisions: 4 })
    const diagonalChain = buildRoomSplineWallChainsFromGraph(diagonalGraph)[0]

    expect(squareMesh[0]?.positions.length).toBeLessThan(legacyMesh[0]?.positions.length ?? 0)
    expect(diagonalMesh[0]?.positions.length).toBeGreaterThan(squareMesh[0]?.positions.length ?? 0)
    expect(diagonalMesh[0]?.positions.length).toBeLessThan(legacyMesh[0]?.positions.length ?? 0)
    expect(diagonalChain?.cornerStyles?.[0]).toEqual({ mode: 'diagonal', amount: 1 })
    expect(diagonalChain?.cornerStyles?.[1]).toEqual({ mode: 'square', amount: 0 })
  })

  it('builds a closed world-space mask path from graph geometry without duplicating the first point', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-a' },
      '0:1': { cell: [0, 1], layerId: 'default', roomId: 'room-a' },
      '1:1': { cell: [1, 1], layerId: 'default', roomId: 'room-a' },
    })
    const path = Object.values(graph.paths)[0]
    expect(path).toBeDefined()

    const sampled = buildSplineWallMaskPathFromGraph(path!, graph, {
      cornerRadius: 0.5,
      curveSubdivisions: 4,
    })

    expect(sampled.length).toBeGreaterThan(4)
    expect(sampled[0]).not.toEqual(sampled.at(-1))
    expect(sampled.every((point) => Number.isFinite(point[0]) && Number.isFinite(point[1]))).toBe(true)
  })
})

function roundWallPoints(points: readonly (readonly [number, number])[]) {
  return points.map(([x, y]) => [Number(x.toFixed(2)), Number(y.toFixed(2))])
}
