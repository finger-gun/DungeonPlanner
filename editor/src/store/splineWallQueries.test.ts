import { describe, expect, it } from 'vitest'
import { upsertSplineWallGraphRoomPath } from './splineWallGraph'
import {
  createSplineWallQueryCache,
  doesLineCrossBlockingSplineWall,
  findNearestSplineWallSegment,
  findSplineWallCutoutAtRatio,
  getSplineRoomCellCoverage,
  isPointInsideSplineRoom,
  sampleSplineWallSegment,
} from './splineWallQueries'

describe('splineWallQueries', () => {
  it('finds nearest hits and samples along diagonal spline wall segments', () => {
    const graph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 2], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const cache = createSplineWallQueryCache(graph)
    const segmentId = 'room-a:path:0:segment:0'
    const hit = findNearestSplineWallSegment(cache, [3, 1])
    const sample = sampleSplineWallSegment(cache, segmentId, 0.5)

    expect(hit?.segmentId).toBe(segmentId)
    expect(hit?.ratio).toBeGreaterThan(0.45)
    expect(hit?.ratio).toBeLessThan(0.55)
    expect(hit?.tangent[0]).toBeCloseTo(Math.SQRT1_2, 4)
    expect(hit?.tangent[1]).toBeCloseTo(Math.SQRT1_2, 4)

    expect(sample).not.toBeNull()
    expect(sample?.position[0]).toBeCloseTo(2, 4)
    expect(sample?.position[1]).toBeCloseTo(2, 4)
    expect(sample?.normal[0]).toBeCloseTo(-Math.SQRT1_2, 4)
    expect(sample?.normal[1]).toBeCloseTo(Math.SQRT1_2, 4)
  })

  it('uses spline cutouts to allow wall crossings through openings while blocking solid spans', () => {
    const graph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 2], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 2], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const segmentId = 'room-a:path:0:segment:2'
    graph.segments[segmentId]!.cutouts = [{
      id: 'door-a',
      kind: 'door',
      startRatio: 0.25,
      endRatio: 0.75,
      bottomHeight: 0,
      topHeight: 1.5,
      assetId: 'core.opening_door_custom',
      openingId: 'opening-a',
      objectProps: {},
    }]

    const cache = createSplineWallQueryCache(graph)

    expect(findSplineWallCutoutAtRatio(cache, segmentId, 0.5)?.id).toBe('door-a')
    expect(doesLineCrossBlockingSplineWall(cache, [2, 2], [2, 5], { roomId: 'room-a' })).toBe(false)
    expect(doesLineCrossBlockingSplineWall(cache, [0.5, 2], [0.5, 5], { roomId: 'room-a' })).toBe(true)
  })

  it('builds rounded room polygons for containment and cell coverage queries', () => {
    const graph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'rounded', cornerAmount: 2 },
        { position: [4, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const cache = createSplineWallQueryCache(graph, {
      curveSubdivisions: 8,
    })

    expect(cache.rooms['room-a']?.segmentIds).toHaveLength(4)
    expect(isPointInsideSplineRoom(cache, 'room-a', [0.1, 0.1])).toBe(false)
    expect(isPointInsideSplineRoom(cache, 'room-a', [3, 3])).toBe(true)
    expect(getSplineRoomCellCoverage(cache, 'room-a', [0, 0], 4)).toBeLessThan(0.75)
  })
})
