import { describe, expect, it } from 'vitest'
import { buildSplineWallAssemblySections } from './splineWallAssembly'
import { buildSplineWallGraphFromPaintedCells } from './splineWalls'
import {
  buildSplineWallOpeningDescriptors,
} from './splineWallOpenings'
import { analyzeSplineWallGraphBoundaries } from './splineWallStyleAnalysis'
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
})
