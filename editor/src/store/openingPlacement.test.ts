import { describe, expect, it } from 'vitest'
import { upsertSplineWallGraphRoomPath } from './splineWallGraph'
import {
  buildSplineWallOpeningPlacement,
  findOpeningAtSplineHit,
  getOpeningRenderContext,
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

  it('builds local render span samples for diagonal custom door openings', () => {
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

    const renderContext = getOpeningRenderContext(graph, queryCache, {
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

    expect(renderContext).not.toBeNull()
    expect(renderContext?.clearSpan).toBeCloseTo(1.04, 4)
    expect(renderContext?.spanSamples.length).toBeGreaterThan(2)
    expect(renderContext?.spanSamples[0]?.position[0]).toBeLessThan(0)
    expect(renderContext?.spanSamples.at(-1)?.position[0]).toBeGreaterThan(0)
    expect(Math.max(...(renderContext?.spanSamples.map((sample) => Math.abs(sample.position[2])) ?? [0]))).toBeLessThan(0.05)
    expect(renderContext?.spanSamples[0]?.tangent[0]).toBeCloseTo(1, 3)
    expect(Math.abs(renderContext?.spanSamples[0]?.tangent[2] ?? 0)).toBeLessThan(0.05)
  })

  it('builds curved local render span samples for rounded custom door openings', () => {
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
    const queryCache = createSplineWallQueryCache(graph, {
      curveSubdivisions: 8,
    })

    const renderContext = getOpeningRenderContext(graph, queryCache, {
      id: 'opening-rounded',
      assetId: 'core.opening_door_custom',
      wallKey: '0:0:north',
      width: 1,
      segmentId: 'room-a:path:0:segment:0',
      segmentStartRatio: 0.08,
      segmentEndRatio: 0.42,
      flipped: false,
      objectProps: {},
      layerId: 'default',
      source: 'manual',
    })

    expect(renderContext).not.toBeNull()
    expect(renderContext?.spanSamples.length).toBeGreaterThan(2)
    expect(Math.max(...(renderContext?.spanSamples.map((sample) => Math.abs(sample.position[2])) ?? [0]))).toBeGreaterThan(0.05)
    expect(Math.abs(
      (renderContext?.spanSamples[0]?.normal[0] ?? 0)
      - (renderContext?.spanSamples.at(-1)?.normal[0] ?? 0),
    )).toBeGreaterThan(0.2)
  })

  it('finds segment-owned shared-wall openings from either room face', () => {
    let graph = upsertSplineWallGraphRoomPath({
      nodes: {},
      segments: {},
      paths: {},
    }, {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [1, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [1, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
      ],
    })
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-b',
      layerId: 'default',
      nodes: [
        { position: [1, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [1, 1], cornerMode: 'square', cornerAmount: 0 },
      ],
    })

    const sharedSegments = Object.values(graph.segments)
      .filter((segment) => {
        const start = graph.nodes[segment.startNodeId]?.position
        const end = graph.nodes[segment.endNodeId]?.position
        if (!start || !end) {
          return false
        }

        return (
          start[0] === 1
          && end[0] === 1
          && ((start[1] === 0 && end[1] === 1) || (start[1] === 1 && end[1] === 0))
        )
      })
    const roomASegment = sharedSegments.find((segment) => segment.roomId === 'room-a')
    const roomBSegment = sharedSegments.find((segment) => segment.roomId === 'room-b')

    expect(roomASegment).toBeDefined()
    expect(roomBSegment).toBeDefined()

    const opening = {
      id: 'opening-shared',
      assetId: null,
      wallKey: '0:0:east',
      width: 1 as const,
      segmentId: roomASegment!.id,
      segmentStartRatio: 0,
      segmentEndRatio: 1,
      flipped: false,
      objectProps: {},
      layerId: 'default',
      source: 'manual' as const,
    }

    expect(findOpeningAtSplineHit(
      graph,
      { [opening.id]: opening },
      { segmentId: roomBSegment!.id, ratio: 0.5 },
    )).toEqual(opening)
  })
})
