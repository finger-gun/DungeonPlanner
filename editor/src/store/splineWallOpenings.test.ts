import { describe, expect, it } from 'vitest'
import { buildSplineWallAssemblySections } from './splineWallAssembly'
import { upsertSplineWallGraphRoomPath } from './splineWallGraph'
import { buildSplineWallGraphFromPaintedCells } from './splineWalls'
import {
  buildSplineWallOpeningDescriptors,
} from './splineWallOpenings'
import { analyzeSplineWallGraphBoundaries } from './splineWallStyleAnalysis'
import type { OpeningRecord } from './useDungeonStore'
import { createSplineWallSegmentSideKey } from './wallStyleAssignments'

describe('buildSplineWallOpeningDescriptors', () => {
  it('resolves wall-style opening modes for compatible door and passage openings', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'stone-keep',
      },
    })

    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: {
        door: {
          id: 'door',
          assetId: 'core.opening_door_custom',
          wallKey: graph.segments[roomFace.segmentId]!.wallKey!,
          width: 1,
          segmentId: roomFace.segmentId,
          segmentStartRatio: 0.2,
          segmentEndRatio: 0.8,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
        passage: {
          id: 'passage',
          assetId: null,
          wallKey: graph.segments[roomFace.segmentId]!.wallKey!,
          width: 1,
          segmentId: roomFace.segmentId,
          segmentStartRatio: 0.3,
          segmentEndRatio: 0.7,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
      },
      assemblySections,
    })

    expect(descriptors.some((descriptor) =>
      descriptor.openingId === 'door'
      && descriptor.layerKind === 'room-face'
      && descriptor.openingMode === 'structural'
      && descriptor.compatible,
    )).toBe(true)
    expect(descriptors.some((descriptor) =>
      descriptor.openingId === 'passage'
      && descriptor.openingKind === 'passage'
      && descriptor.compatible,
    )).toBe(true)
  })

  it('falls back to structural mode when the opening asset is incompatible', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'manor-plaster',
      },
    })

    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: {
        door: {
          id: 'door',
          assetId: 'missing.asset',
          wallKey: graph.segments[roomFace.segmentId]!.wallKey!,
          width: 1,
          segmentId: roomFace.segmentId,
          segmentStartRatio: 0.2,
          segmentEndRatio: 0.8,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
      },
      assemblySections,
    })

    expect(descriptors.every((descriptor) => descriptor.openingMode === 'structural')).toBe(true)
    expect(descriptors.every((descriptor) => descriptor.compatible === false)).toBe(true)
  })

  it('mirrors shared opening ratios onto the opposite room face', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room-b' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const sharedSections = analysis
      .flatMap((entry) => entry.sections)
      .filter((section) => section.faceKind === 'room-face' && section.oppositeRoomId !== null)
    const [roomASection, roomBSection] = sharedSections
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomASection!.segmentId, roomASection!.side)]: 'stone-keep',
        [createSplineWallSegmentSideKey(roomBSection!.segmentId, roomBSection!.side)]: 'stone-keep',
      },
    })

    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: {
        door: {
          id: 'door',
          assetId: 'core.opening_door_custom',
          wallKey: graph.segments[roomASection!.segmentId]!.wallKey!,
          width: 1,
          segmentId: roomASection!.segmentId,
          segmentStartRatio: 0.2,
          segmentEndRatio: 0.4,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
      },
      assemblySections,
    })

    const roomAFace = descriptors.find((descriptor) =>
      descriptor.layerKind === 'room-face' && descriptor.segmentId === roomASection!.segmentId,
    )
    const roomBFace = descriptors.find((descriptor) =>
      descriptor.layerKind === 'room-face' && descriptor.segmentId === roomBSection!.segmentId,
    )

    expect(roomAFace?.startRatio).toBeCloseTo(0.2)
    expect(roomAFace?.endRatio).toBeCloseTo(0.4)
    expect(roomBFace?.startRatio).toBeCloseTo(0.6)
    expect(roomBFace?.endRatio).toBeCloseTo(0.8)
  })

  it('builds visual cutout descriptors for both faces of a segment-owned shared-wall opening', () => {
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

    const sharedSegments = Object.values(graph.segments).filter((segment) => {
      const start = graph.nodes[segment.startNodeId]?.position
      const end = graph.nodes[segment.endNodeId]?.position
      return start && end && start[0] === 1 && end[0] === 1
    })
    const roomASegment = sharedSegments.find((segment) => segment.roomId === 'room-a')
    expect(roomASegment).toBeDefined()

    const opening: OpeningRecord = {
      id: 'opening-shared',
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:east',
      width: 1,
      segmentId: roomASegment!.id,
      segmentStartRatio: 0.2,
      segmentEndRatio: 0.8,
      flipped: false,
      layerId: 'default',
      source: 'manual',
    }

    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analyzeSplineWallGraphBoundaries(graph),
      wallStyleAssignments: {},
    })
    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: { [opening.id]: opening },
      assemblySections,
    })
    const roomFaceDescriptors = descriptors.filter((descriptor) => descriptor.layerKind === 'room-face')

    expect(roomFaceDescriptors).toHaveLength(2)
    expect(roomFaceDescriptors.map((descriptor) => descriptor.roomId).sort()).toEqual(['room-a', 'room-b'])
    expect(roomFaceDescriptors.every((descriptor) =>
      descriptor.startRatio < 0.81 && descriptor.endRatio > 0.19,
    )).toBe(true)
  })
})
