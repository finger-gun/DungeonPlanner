import { describe, expect, it } from 'vitest'
import { syncSplineWallGraphCutoutsFromOpenings, type SplineWallGraph } from './splineWallGraph'

describe('splineWallGraph', () => {
  it('derives a centered partial cutout for opening assets with an authored clear width', () => {
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
          wallKey: '0:0:north',
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

    const synced = syncSplineWallGraphCutoutsFromOpenings(graph, {
      'opening-a': {
        id: 'opening-a',
        assetId: 'core.opening_door_custom',
        wallKey: '0:0:north',
        width: 1,
        flipped: false,
        objectProps: {},
        layerId: 'default',
      },
    })

    expect(synced.segments['segment-a']?.cutouts).toHaveLength(1)
    expect(synced.segments['segment-a']?.cutouts[0]).toMatchObject({
      id: 'opening-a:segment-a',
      openingId: 'opening-a',
      bottomHeight: 0,
      topHeight: 1.42,
    })
    expect(synced.segments['segment-a']?.cutouts[0]?.startRatio).toBeCloseTo(0.24)
    expect(synced.segments['segment-a']?.cutouts[0]?.endRatio).toBeCloseTo(0.76)
  })

  it('projects wall-key openings onto graph-authored segments without wall keys', () => {
    const graph: SplineWallGraph = {
      nodes: {
        'node-a': { id: 'node-a', position: [0, 1], layerId: 'default', roomId: 'room-a' },
        'node-b': { id: 'node-b', position: [2, 1], layerId: 'default', roomId: 'room-a' },
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

    const synced = syncSplineWallGraphCutoutsFromOpenings(graph, {
      'opening-a': {
        id: 'opening-a',
        assetId: 'core.opening_door_custom',
        wallKey: '0:0:north',
        width: 1,
        flipped: false,
        objectProps: {},
        layerId: 'default',
      },
    })

    expect(synced.segments['segment-a']?.cutouts).toHaveLength(1)
    expect(synced.segments['segment-a']?.cutouts[0]).toMatchObject({
      id: 'opening-a:segment-a',
      openingId: 'opening-a',
      bottomHeight: 0,
      topHeight: 1.42,
    })
    expect(synced.segments['segment-a']?.cutouts[0]?.startRatio).toBeCloseTo(0.12)
    expect(synced.segments['segment-a']?.cutouts[0]?.endRatio).toBeCloseTo(0.38)
  })
})
