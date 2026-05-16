import { describe, expect, it } from 'vitest'
import {
  buildRoomDraftCells,
  buildRoomDraftSplineNodes,
  createRoomDraftFromStroke,
  setRoomDraftCorner,
} from './roomDraft'
import { buildRoomDraftOccupancyPolygons, clipRoomDraft } from './roomDraftClip'
import { createEmptySplineWallGraph, upsertSplineWallGraphRoomPath } from './splineWallGraph'
import { buildSplineWallGraphFromPaintedCells } from './splineWalls'
import { buildSplineWallAssemblySections, getStructuralSegmentId } from './splineWallAssembly'
import { analyzeSplineWallGraphBoundaries } from './splineWallStyleAnalysis'
import { createSplineWallSegmentSideKey } from './wallStyleAssignments'

describe('buildSplineWallAssemblySections', () => {
  it('builds exposed room, exterior, and structural sections from analyzed boundaries', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const firstPath = analysis[0]!
    const firstRoomFace = firstPath.sections.find((section) => section.faceKind === 'room-face')!
    const firstExteriorFace = firstPath.sections.find((section) => section.faceKind === 'exterior-face')!

    const sections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(firstRoomFace.segmentId, firstRoomFace.side)]: 'stone-keep',
        [createSplineWallSegmentSideKey(firstExteriorFace.segmentId, firstExteriorFace.side)]: 'manor-plaster',
      },
    })

    const roomFace = sections.find((section) =>
      section.segmentId === firstRoomFace.segmentId && section.layerKind === 'room-face',
    )
    const exteriorFace = sections.find((section) =>
      section.segmentId === firstExteriorFace.segmentId && section.layerKind === 'exterior-face',
    )
    const structuralCore = sections.find((section) =>
      section.segmentId === firstRoomFace.segmentId && section.layerKind === 'structural-core',
    )

    expect(roomFace?.wallStyleId).toBe('stone-keep')
    expect(exteriorFace?.wallStyleId).toBe('manor-plaster')
    expect(structuralCore?.wallStyleId).toBe('stone-keep')
  })

  it('emits room face detail sections for layered wall styles', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const firstRoomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!

    const sections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(firstRoomFace.segmentId, firstRoomFace.side)]: 'art-deco-cobblestone',
      },
    })

    const detail = sections.find((section) =>
      section.segmentId === firstRoomFace.segmentId && section.layerKind === 'room-face-detail',
    )

    expect(detail?.profile.points).toEqual([
      [-0.245, 0],
      [-0.245, 0.48],
      [-0.181, 0.48],
    ])
    expect(detail?.wallStyleId).toBe('art-deco-cobblestone')
  })

  it('uses explicit structural core assignments on exposed boundaries only', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-b' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const sharedSections = analysis
      .flatMap((boundaryPath) => boundaryPath.sections)
      .filter((section) => section.faceKind === 'room-face' && section.oppositeRoomId !== null)

    expect(sharedSections).toHaveLength(2)
    const [leftShared, rightShared] = sharedSections
    const structuralSegmentId = getStructuralSegmentId(leftShared!.sharedSegmentIds)

    const sections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(leftShared!.segmentId, leftShared!.side)]: 'stone-keep',
        [createSplineWallSegmentSideKey(rightShared!.segmentId, rightShared!.side)]: 'manor-plaster',
      },
      wallCoreAssignments: {
        [structuralSegmentId]: 'manor-plaster',
      },
    })

    const structuralSections = sections.filter((section) =>
      section.structuralSegmentId === structuralSegmentId && section.layerKind === 'structural-core',
    )
    const roomSections = sections.filter((section) =>
      section.structuralSegmentId === structuralSegmentId && section.layerKind === 'room-face',
    )

    expect(structuralSections).toHaveLength(0)
    expect(roomSections.map((section) => section.wallStyleId).sort()).toEqual(['manor-plaster', 'stone-keep'])
  })

  it('omits structural core geometry for shared boundaries', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-b' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const sharedSection = analysis
      .flatMap((boundaryPath) => boundaryPath.sections)
      .find((section) => section.faceKind === 'room-face' && section.oppositeRoomId !== null)!
    const structuralSegmentId = getStructuralSegmentId(sharedSection.sharedSegmentIds)

    const sections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {},
    })

    const structuralCore = sections.find((section) =>
      section.structuralSegmentId === structuralSegmentId && section.layerKind === 'structural-core',
    )
    const roomFaces = sections.filter((section) =>
      section.structuralSegmentId === structuralSegmentId && section.layerKind === 'room-face',
    )

    expect(structuralCore).toBeUndefined()
    expect(roomFaces).toHaveLength(2)
  })

  it('does not add exterior or structural layers to graph-backed rounded shared joins', () => {
    const graph = createRoundedOverlapRoomGraph()
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const sharedSections = analysis
      .flatMap((boundaryPath) => boundaryPath.sections)
      .filter((section) => section.oppositeRoomId !== null)
    const roomBSharedArcSegments = Object.values(graph.segments)
      .filter((segment) => segment.roomId === 'room-b')
      .filter((segment) => {
        const start = graph.nodes[segment.startNodeId]?.position
        const end = graph.nodes[segment.endNodeId]?.position
        return start && end && start[0] <= 3.01 && end[0] <= 3.01
      })
      .map((segment) => segment.id)
    const sections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {},
    })
    const sharedStructuralIds = new Set(sharedSections.map((section) => getStructuralSegmentId(section.sharedSegmentIds)))
    const sharedLayerKinds = sections
      .filter((section) => sharedStructuralIds.has(section.structuralSegmentId))
      .map((section) => section.layerKind)

    expect(sharedSections.length).toBeGreaterThan(0)
    expect(roomBSharedArcSegments.length).toBeGreaterThan(0)
    expect(sharedSections.filter((section) =>
      section.roomId === 'room-b'
      && section.oppositeRoomId === 'room-a'
      && roomBSharedArcSegments.includes(section.segmentId),
    )).toHaveLength(roomBSharedArcSegments.length)
    expect(analysis.flatMap((boundaryPath) => boundaryPath.sections).filter((section) =>
      section.faceKind === 'exterior-face'
      && roomBSharedArcSegments.includes(section.segmentId),
    )).toHaveLength(0)
    expect(sharedLayerKinds).toContain('room-face')
    expect(sharedLayerKinds).toContain('room-face-detail')
    expect(sharedLayerKinds).not.toContain('exterior-face')
    expect(sharedLayerKinds).not.toContain('structural-core')
  })

  it('keeps exterior layers on the unshared remainder of a partly shared rounded wall', () => {
    const graph = createPartialRoundedOverlapRoomGraph()
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const roomASections = analysis
      .flatMap((boundaryPath) => boundaryPath.sections)
      .filter((section) => section.roomId === 'room-a')
    const partlySharedSegmentIds = new Set(
      roomASections
        .filter((section) => section.oppositeRoomId === 'room-b')
        .map((section) => section.segmentId),
    )

    expect(partlySharedSegmentIds.size).toBeGreaterThan(0)
    expect(roomASections.some((section) =>
      section.faceKind === 'exterior-face'
      && partlySharedSegmentIds.has(section.segmentId),
    )).toBe(true)
  })
})

function createRoundedOverlapRoomGraph() {
  const existingDraft = setRoomDraftCorner(
    setRoomDraftCorner(createRoomDraftFromStroke([0, 0], [2, 2]), 'ne', 'rounded', 1),
    'se',
    'rounded',
    1,
  )
  const existingCells = buildRoomDraftCells(existingDraft)
  let graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
    roomId: 'room-a',
    layerId: 'default',
    nodes: buildRoomDraftSplineNodes(existingDraft),
  })
  const overlapDraft = createRoomDraftFromStroke([2, 0], [4, 2])
  const clipped = clipRoomDraft(
    overlapDraft,
    buildRoomDraftOccupancyPolygons(
      Object.fromEntries(existingCells.map((cell) => [
        `${cell[0]}:${cell[1]}`,
        { cell, layerId: 'default', roomId: 'room-a' },
      ])),
      graph,
    ),
    new Set(existingCells.map((cell) => `${cell[0]}:${cell[1]}`)),
  )

  graph = upsertSplineWallGraphRoomPath(graph, {
    roomId: 'room-b',
    layerId: 'default',
    nodes: clipped.splineNodes,
  })

  return graph
}

function createPartialRoundedOverlapRoomGraph() {
  const existingDraft = setRoomDraftCorner(
    createRoomDraftFromStroke([0, 0], [2, 2]),
    'ne',
    'rounded',
    1,
  )
  const existingCells = buildRoomDraftCells(existingDraft)
  let graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
    roomId: 'room-a',
    layerId: 'default',
    nodes: buildRoomDraftSplineNodes(existingDraft),
  })
  const overlapDraft = createRoomDraftFromStroke([2, 1], [4, 2])
  const clipped = clipRoomDraft(
    overlapDraft,
    buildRoomDraftOccupancyPolygons(
      Object.fromEntries(existingCells.map((cell) => [
        `${cell[0]}:${cell[1]}`,
        { cell, layerId: 'default', roomId: 'room-a' },
      ])),
      graph,
    ),
    new Set(existingCells.map((cell) => `${cell[0]}:${cell[1]}`)),
  )

  graph = upsertSplineWallGraphRoomPath(graph, {
    roomId: 'room-b',
    layerId: 'default',
    nodes: clipped.splineNodes,
  })

  return graph
}
