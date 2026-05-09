import { describe, expect, it } from 'vitest'
import { upsertSplineWallGraphRoomPath } from './splineWallGraph'
import {
  buildSplineWallOpeningPlacement,
  getOpeningWorldTransform,
} from './openingPlacement'
import { createSplineWallQueryCache } from './splineWallQueries'

describe('openingPlacement', () => {
  it('builds segment-owned door placements on diagonal spline walls', () => {
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
    const queryCache = createSplineWallQueryCache(graph)

    const placement = buildSplineWallOpeningPlacement(
      { x: 3, z: 1 },
      graph,
      queryCache,
      {},
      'core.opening_door_custom',
    )

    expect(placement).not.toBeNull()
    expect(placement?.segmentId).toBe('room-a:path:0:segment:0')
    expect(placement?.valid).toBe(true)
    expect(placement?.segmentStartRatio).toBeLessThan(placement!.segmentEndRatio)
    expect(placement?.position[0]).toBeCloseTo(2, 4)
    expect(placement?.position[2]).toBeCloseTo(2, 4)
    expect(placement?.rotation[1]).toBeCloseTo(-Math.PI / 4, 4)
    expect(placement?.wallKey).toMatch(/^\d+:\d+:(north|south|east|west)$/)
  })

  it('computes world transforms from segment-owned opening spans', () => {
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
    const queryCache = createSplineWallQueryCache(graph)
    const placement = buildSplineWallOpeningPlacement(
      { x: 3, z: 1 },
      graph,
      queryCache,
      {},
      'core.opening_door_custom',
    )

    const transform = getOpeningWorldTransform(graph, queryCache, {
      id: 'opening-a',
      assetId: 'core.opening_door_custom',
      wallKey: placement!.wallKey,
      width: placement!.width,
      segmentId: placement!.segmentId,
      segmentStartRatio: placement!.segmentStartRatio,
      segmentEndRatio: placement!.segmentEndRatio,
      flipped: false,
      objectProps: {},
      layerId: 'default',
      source: 'manual',
    })

    expect(transform).not.toBeNull()
    expect(transform?.position[0]).toBeCloseTo(2, 4)
    expect(transform?.position[2]).toBeCloseTo(2, 4)
    expect(transform?.rotation[1]).toBeCloseTo(-Math.PI / 4, 4)
    expect(transform?.segmentIds).toEqual(['room-a:path:0:segment:0'])
  })
})
