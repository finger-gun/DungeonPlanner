import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../hooks/useSnapToGrid'
import { createEmptySplineWallGraph, upsertSplineWallGraphRoomPath } from './splineWallGraph'
import { buildSplineWallAssemblySections } from './splineWallAssembly'
import { buildSplineWallInsertDescriptors, getSplineWallInsertPlacement } from './splineWallInserts'
import { createSplineWallQueryCache, sampleSplineWallSegment } from './splineWallQueries'
import { buildSplineWallGraphFromPaintedCells } from './splineWalls'
import { analyzeSplineWallGraphBoundaries } from './splineWallStyleAnalysis'
import { createSplineWallSegmentSideKey } from './wallStyleAssignments'

describe('buildSplineWallInsertDescriptors', () => {
  it('generates pillar inserts for the default art deco wall style', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const firstRoomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {},
    })

    const inserts = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).filter((insert) =>
      insert.segmentId === firstRoomFace.segmentId
      && insert.wallStyleId === 'art-deco-cobblestone'
      && insert.assetId === 'dungeon.props_pillars_pillar',
    )

    expect(inserts.length).toBeGreaterThan(0)
    expect(new Set(inserts.map((insert) => `${insert.assetId}:${insert.position.join(':')}`)).size).toBe(inserts.length)
  })

  it('dedupes room and exterior inserts that would occupy the same wall center point', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const firstPath = analysis[0]!
    const firstRoomFace = firstPath.sections.find((section) => section.faceKind === 'room-face')!
    const firstExteriorFace = firstPath.sections.find((section) => section.faceKind === 'exterior-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(firstRoomFace.segmentId, firstRoomFace.side)]: 'stone-keep',
        [createSplineWallSegmentSideKey(firstExteriorFace.segmentId, firstExteriorFace.side)]: 'manor-plaster',
      },
    })

    const inserts = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).filter((insert) => insert.assetId === 'dungeon.props_pillars_pillar')

    expect(inserts.length).toBeGreaterThan(0)
    expect(new Set(inserts.map((insert) => `${insert.position[0]}:${insert.position[1]}`)).size).toBe(inserts.length)
  })

  it('does not synthesize start and end pillar inserts for closed room section splits', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 2], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 2], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {},
    })

    const inserts = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).filter((insert) => insert.assetId === 'dungeon.props_pillars_pillar')

    expect(inserts.some((insert) => insert.anchorKind === 'start' || insert.anchorKind === 'end')).toBe(false)
    expect(inserts.filter((insert) => insert.anchorKind === 'convex-corner')).toHaveLength(4)
  })

  it('keeps authored open wall endpoint pillar inserts', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: false,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {},
    })

    const inserts = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).filter((insert) => insert.assetId === 'dungeon.props_pillars_pillar')

    expect(inserts.some((insert) => insert.anchorKind === 'start')).toBe(true)
    expect(inserts.some((insert) => insert.anchorKind === 'end')).toBe(true)
  })

  it('adds interval inserts along long analyzed wall sections', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const longRoomFace = analysis[0]!.sections.find((section) =>
      section.faceKind === 'room-face' && section.length >= 4,
    )!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(longRoomFace.segmentId, longRoomFace.side)]: 'stone-keep',
      },
    })

    const inserts = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).filter((insert) =>
      insert.segmentId === longRoomFace.segmentId
      && insert.anchorKind === 'interval'
      && insert.side === longRoomFace.side,
    )

    expect(inserts).toHaveLength(1)
    expect(inserts[0]?.position[0]).toBeCloseTo(2)
    expect(inserts[0]?.position[1]).toBeCloseTo(0)
  })

  it('centers multiple interval inserts across long wall sections', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [8, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [8, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const longRoomFace = analysis[0]!.sections.find((section) =>
      section.faceKind === 'room-face' && section.length >= 8,
    )!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(longRoomFace.segmentId, longRoomFace.side)]: 'stone-keep',
      },
    })

    const inserts = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).filter((insert) =>
      insert.segmentId === longRoomFace.segmentId
      && insert.anchorKind === 'interval'
      && insert.side === longRoomFace.side,
    )

    expect(inserts).toHaveLength(2)
    expect(inserts[0]?.position[0]).toBeCloseTo(8 / 3)
    expect(inserts[1]?.position[0]).toBeCloseTo(16 / 3)
    expect(inserts[0]?.position[1]).toBeCloseTo(0)
    expect(inserts[1]?.position[1]).toBeCloseTo(0)
  })

  it('resolves insert placement along sampled curved wall geometry instead of the straight chord', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'rounded', cornerAmount: 2 },
        { position: [4, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const curvedRoomFace = analysis[0]!.sections.find((section) =>
      section.faceKind === 'room-face' && section.segmentId === 'room-a:path:0:segment:0',
    )!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(curvedRoomFace.segmentId, curvedRoomFace.side)]: 'stone-keep',
      },
    })

    const descriptor = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).find((insert) =>
      insert.segmentId === curvedRoomFace.segmentId
      && insert.anchorKind === 'interval'
      && insert.side === curvedRoomFace.side,
    )!

    const queryCache = createSplineWallQueryCache(graph, { curveSubdivisions: 8 })
    const placement = getSplineWallInsertPlacement(descriptor, queryCache)
    const expectedSample = sampleSplineWallSegment(queryCache, descriptor.segmentId, descriptor.ratio)

    expect(expectedSample).not.toBeNull()
    expect(placement.position[0]).toBeCloseTo(expectedSample!.position[0], 4)
    expect(placement.position[1]).toBeCloseTo(expectedSample!.position[1], 4)
    expect(placement.position[0]).not.toBeCloseTo(descriptor.position[0], 4)
  })

  it('keeps angular triangular room corner pillars centered on the structural corner', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 3], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const firstRoomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(firstRoomFace.segmentId, firstRoomFace.side)]: 'art-deco-cobblestone',
      },
    })
    const descriptor = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).find((insert) =>
      insert.assetId === 'dungeon.props_pillars_pillar'
      && insert.position[0] === 4
      && insert.position[1] === 0,
    )!
    const queryCache = createSplineWallQueryCache(graph, { curveSubdivisions: 8 })
    const placement = getSplineWallInsertPlacement(descriptor, queryCache)

    expect(descriptor.position).toEqual([4, 0])
    expect(descriptor.anchorKind).toBe('convex-corner')
    expect(placement.position[0]).toBeCloseTo(descriptor.position[0] * GRID_SIZE, 5)
    expect(placement.position[1]).toBeCloseTo(descriptor.position[1] * GRID_SIZE, 5)
  })

  it('places rounded corner pillars on the sampled visible wall path', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'rounded', cornerAmount: 1.5 },
        { position: [4, 0], cornerMode: 'rounded', cornerAmount: 1.5 },
        { position: [4, 4], cornerMode: 'rounded', cornerAmount: 1.5 },
        { position: [0, 4], cornerMode: 'rounded', cornerAmount: 1.5 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const firstRoomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(firstRoomFace.segmentId, firstRoomFace.side)]: 'art-deco-cobblestone',
      },
    })
    const descriptor = buildSplineWallInsertDescriptors({
      analyzedBoundaries: analysis,
      assemblySections,
    }).find((insert) =>
      insert.assetId === 'dungeon.props_pillars_pillar'
      && insert.position[0] === 4
      && insert.position[1] === 0,
    )!
    const queryCache = createSplineWallQueryCache(graph, { curveSubdivisions: 8 })
    const expectedSample = sampleSplineWallSegment(queryCache, descriptor.segmentId, descriptor.ratio)
    const placement = getSplineWallInsertPlacement(descriptor, queryCache)

    expect(descriptor.anchorKind).toBe('curvature-change')
    expect(expectedSample).not.toBeNull()
    expect(placement.position[0]).toBeCloseTo(expectedSample!.position[0], 5)
    expect(placement.position[1]).toBeCloseTo(expectedSample!.position[1], 5)
    expect(placement.position[0]).not.toBeCloseTo(descriptor.position[0] * GRID_SIZE, 4)
  })
})
