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
import { analyzeSplineWallGraphBoundaries } from './splineWallStyleAnalysis'

describe('analyzeSplineWallGraphBoundaries', () => {
  it('derives room-facing and exterior faces for an isolated room', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })

    const [analysis] = analyzeSplineWallGraphBoundaries(graph)

    expect(analysis).toBeDefined()
    expect(analysis?.roomId).toBe('room-a')
    expect(analysis?.sections.filter((section) => section.faceKind === 'room-face')).toHaveLength(4)
    expect(analysis?.sections.filter((section) => section.faceKind === 'exterior-face')).toHaveLength(4)
    expect(
      new Set(
        analysis?.sections
          .filter((section) => section.faceKind === 'room-face')
          .map((section) => section.side),
      ),
    ).toEqual(new Set([analysis?.roomSide]))
  })

  it('marks shared sections as room-facing only and records the opposite room id', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-b' },
    })

    const analyses = analyzeSplineWallGraphBoundaries(graph)
    const roomA = analyses.find((analysis) => analysis.roomId === 'room-a')
    const roomB = analyses.find((analysis) => analysis.roomId === 'room-b')

    const roomAShared = roomA?.sections.find((section) => section.oppositeRoomId === 'room-b')
    const roomBShared = roomB?.sections.find((section) => section.oppositeRoomId === 'room-a')

    expect(roomAShared).toBeDefined()
    expect(roomAShared?.faceKind).toBe('room-face')
    expect(roomA?.sections.filter((section) =>
      section.segmentId === roomAShared?.segmentId && section.faceKind === 'exterior-face',
    )).toHaveLength(0)

    expect(roomBShared).toBeDefined()
    expect(roomBShared?.faceKind).toBe('room-face')
    expect(roomAShared?.sharedSegmentIds).toEqual(expect.arrayContaining([roomBShared?.segmentId ?? '']))
    expect(roomBShared?.sharedSegmentIds).toEqual(expect.arrayContaining([roomAShared?.segmentId ?? '']))
  })

  it('emits corner and curvature anchors from spline paths', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'rounded', cornerAmount: 0.45 },
        { position: [2, 2], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 2], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })

    const [analysis] = analyzeSplineWallGraphBoundaries(graph)

    expect(analysis?.anchors.some((anchor) => anchor.kind === 'convex-corner')).toBe(true)
    expect(analysis?.anchors.some((anchor) => anchor.kind === 'curvature-change')).toBe(true)
  })

  it('ignores shallow generated arc vertices when emitting corner anchors', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [1, 0.1], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 2], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 2], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })

    const [analysis] = analyzeSplineWallGraphBoundaries(graph)

    expect(analysis?.anchors).not.toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: 'convex-corner',
        position: [1, 0.1],
      }),
    ]))
  })

  it('keeps rounded shared L-shaped walls room-facing for both rooms', () => {
    let graph = createEmptySplineWallGraph()
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [-2, -2], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, -2], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 0], cornerMode: 'rounded', cornerAmount: 0.45 },
        { position: [0, 3], cornerMode: 'square', cornerAmount: 0 },
        { position: [-2, 3], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-b',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'rounded', cornerAmount: 0.45 },
        { position: [3, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, 3], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 3], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })

    const analyses = analyzeSplineWallGraphBoundaries(graph)
    const roomA = analyses.find((analysis) => analysis.roomId === 'room-a')
    const roomB = analyses.find((analysis) => analysis.roomId === 'room-b')

    expect(roomA).toBeDefined()
    expect(roomB).toBeDefined()

    const roomASharedSegmentIds = new Set([
      'room-a:path:0:segment:2',
      'room-a:path:0:segment:3',
    ])
    const roomBSharedSegmentIds = new Set([
      'room-b:path:0:segment:0',
      'room-b:path:0:segment:3',
    ])

    expect(
      roomA?.sections.filter((section) =>
        roomASharedSegmentIds.has(section.segmentId) && section.faceKind === 'exterior-face',
      ),
    ).toHaveLength(0)
    expect(
      roomB?.sections.filter((section) =>
        roomBSharedSegmentIds.has(section.segmentId) && section.faceKind === 'exterior-face',
      ),
    ).toHaveLength(0)
    expect(
      roomA?.sections.filter((section) =>
        roomASharedSegmentIds.has(section.segmentId) && section.oppositeRoomId === 'room-b',
      ),
    ).not.toHaveLength(0)
    expect(
      roomB?.sections.filter((section) =>
        roomBSharedSegmentIds.has(section.segmentId) && section.oppositeRoomId === 'room-a',
      ),
    ).not.toHaveLength(0)
  })

  it('keeps split rooms room-facing along a rounded shared wall stack', () => {
    const graph = createSplitRoundedOverlapRoomGraph()
    const analyses = analyzeSplineWallGraphBoundaries(graph)
    const roomB = analyses.find((analysis) => analysis.roomId === 'room-b')
    const roomC = analyses.find((analysis) => analysis.roomId === 'room-c')

    expect(roomB).toBeDefined()
    expect(roomC).toBeDefined()

    const roomBSharedSections = roomB?.sections.filter((section) => section.oppositeRoomId === 'room-a') ?? []
    const roomCSharedSections = roomC?.sections.filter((section) => section.oppositeRoomId === 'room-a') ?? []

    expect(roomBSharedSections).not.toHaveLength(0)
    expect(roomCSharedSections).not.toHaveLength(0)
    expect(roomBSharedSections.every((section) => section.faceKind === 'room-face')).toBe(true)
    expect(roomCSharedSections.every((section) => section.faceKind === 'room-face')).toBe(true)

    const roomBSharedSegmentIds = new Set(roomBSharedSections.map((section) => section.segmentId))
    const roomCSharedSegmentIds = new Set(roomCSharedSections.map((section) => section.segmentId))
    expect(
      roomB?.sections.filter((section) =>
        roomBSharedSegmentIds.has(section.segmentId) && section.faceKind === 'exterior-face',
      ),
    ).toHaveLength(0)
    expect(
      roomC?.sections.filter((section) =>
        roomCSharedSegmentIds.has(section.segmentId) && section.faceKind === 'exterior-face',
      ),
    ).toHaveLength(0)
  })

  it('uses sampled curve endpoints for rounded shared wall sections', () => {
    const graph = createSplitRoundedOverlapRoomGraph()
    const analyses = analyzeSplineWallGraphBoundaries(graph)
    const roomA = analyses.find((analysis) => analysis.roomId === 'room-a')

    expect(roomA).toBeDefined()

    const topSharedSection = roomA?.sections.find((section) =>
      section.segmentId === 'room-a:path:0:segment:0'
      && section.oppositeRoomId === 'room-b'
      && section.startRatio > 0.6
      && section.endRatio < 1
    )
    const bottomSharedSection = roomA?.sections.find((section) =>
      section.segmentId === 'room-a:path:0:segment:2'
      && section.oppositeRoomId === 'room-c'
      && section.startRatio > 0
      && section.endRatio < 0.4
    )

    expect(topSharedSection?.end).toEqual([2.75, 4.75])
    expect(bottomSharedSection?.start).toEqual([2.75, 0.25])
  })

  it('suppresses exterior faces whose exterior side falls inside another overlapping room', () => {
    let graph = createEmptySplineWallGraph()
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 4], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-b',
      layerId: 'default',
      nodes: [
        { position: [3, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [6, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [6, 3], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, 3], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })

    const analyses = analyzeSplineWallGraphBoundaries(graph)
    const roomB = analyses.find((analysis) => analysis.roomId === 'room-b')

    expect(roomB).toBeDefined()
    expect(
      roomB?.sections.filter((section) =>
        section.segmentId === 'room-b:path:0:segment:3' && section.faceKind === 'exterior-face',
      ),
    ).toHaveLength(0)
    expect(
      roomB?.sections.filter((section) =>
        section.segmentId === 'room-b:path:0:segment:3'
        && section.faceKind === 'room-face'
        && section.oppositeRoomId === 'room-a',
      ),
    ).toHaveLength(1)
    expect(
      roomB?.sections.filter((section) =>
        section.segmentId === 'room-b:path:0:segment:1' && section.faceKind === 'exterior-face',
      ),
    ).toHaveLength(1)
  })

  it('splits exterior overlap suppression when different rooms cover separate parts of one span', () => {
    let graph = createEmptySplineWallGraph()
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [4, 0], cornerMode: 'rounded', cornerAmount: 0.6 },
        { position: [4, 6], cornerMode: 'rounded', cornerAmount: 0.6 },
        { position: [0, 6], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-b',
      layerId: 'default',
      nodes: [
        { position: [3, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [6, 4], cornerMode: 'square', cornerAmount: 0 },
        { position: [6, 7], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, 7], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'room-c',
      layerId: 'default',
      nodes: [
        { position: [3, -1], cornerMode: 'square', cornerAmount: 0 },
        { position: [6, -1], cornerMode: 'square', cornerAmount: 0 },
        { position: [6, 2], cornerMode: 'square', cornerAmount: 0 },
        { position: [3, 2], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })

    const analyses = analyzeSplineWallGraphBoundaries(graph)
    const roomA = analyses.find((analysis) => analysis.roomId === 'room-a')
    const sharedWithB = roomA?.sections.find((section) =>
      section.segmentId === 'room-a:path:0:segment:1'
      && section.faceKind === 'room-face'
      && section.oppositeRoomId === 'room-b',
    )
    const sharedWithC = roomA?.sections.find((section) =>
      section.segmentId === 'room-a:path:0:segment:1'
      && section.faceKind === 'room-face'
      && section.oppositeRoomId === 'room-c',
    )
    const middleExterior = roomA?.sections.find((section) =>
      section.segmentId === 'room-a:path:0:segment:1'
      && section.faceKind === 'exterior-face',
    )

    expect(sharedWithB).toBeDefined()
    expect(sharedWithC).toBeDefined()
    expect(middleExterior).toBeDefined()
    expect(middleExterior?.startRatio).toBeCloseTo(sharedWithC?.endRatio ?? 0, 6)
    expect(middleExterior?.endRatio).toBeCloseTo(sharedWithB?.startRatio ?? 1, 6)
  })
})

function createSplitRoundedOverlapRoomGraph() {
  const baseDraft = setRoomDraftCorner(
    setRoomDraftCorner(createRoomDraftFromStroke([0, 0], [2, 4]), 'ne', 'rounded', 1),
    'se',
    'rounded',
    1,
  )
  const baseCells = buildRoomDraftCells(baseDraft)
  const occupiedCellsByKey: Record<string, { cell: [number, number]; layerId: string; roomId: string }> =
    Object.fromEntries(baseCells.map((cell) => [
      `${cell[0]}:${cell[1]}`,
      { cell, layerId: 'default', roomId: 'room-a' },
    ]))

  let graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
    roomId: 'room-a',
    layerId: 'default',
    nodes: buildRoomDraftSplineNodes(baseDraft),
  })

  ;[
    { roomId: 'room-b', start: [2, 2] as [number, number], end: [4, 4] as [number, number] },
    { roomId: 'room-c', start: [2, 0] as [number, number], end: [4, 2] as [number, number] },
  ].forEach(({ roomId, start, end }) => {
    const draft = createRoomDraftFromStroke(start, end)
    const draftCells = buildRoomDraftCells(draft)
    const clipped = clipRoomDraft(
      draft,
      buildRoomDraftOccupancyPolygons(occupiedCellsByKey, graph),
      new Set(Object.keys(occupiedCellsByKey)),
    )

    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId,
      layerId: 'default',
      nodes: clipped.splineNodes,
    })

    draftCells.forEach((cell) => {
      occupiedCellsByKey[`${cell[0]}:${cell[1]}`] = { cell, layerId: 'default', roomId }
    })
  })

  return graph
}
