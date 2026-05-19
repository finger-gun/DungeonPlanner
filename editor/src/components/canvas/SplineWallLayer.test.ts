import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  buildSplineWallRenderSectionGroups,
  buildSplineWallSectionGeometry,
  buildSplineWallSectionGroupGeometry,
  buildSplineWallSectionHeightBands,
  resolveSplineWallBakedLightSample,
  resolveSplineWallBakedLightSamplePosition,
} from './SplineWallLayer'
import { buildSplineWallAssemblySections } from '../../store/splineWallAssembly'
import { buildSplineWallOpeningDescriptors, type SplineWallOpeningDescriptor } from '../../store/splineWallOpenings'
import { createEmptySplineWallGraph, upsertSplineWallGraphRoomPath } from '../../store/splineWallGraph'
import { buildSplineWallOpeningPlacement } from '../../store/openingPlacement'
import {
  buildRoomDraftCells,
  buildRoomDraftSplineNodes,
  createRoomDraftFromStroke,
  setRoomDraftCorner,
} from '../../store/roomDraft'
import { buildRoomDraftOccupancyPolygons, clipRoomDraft } from '../../store/roomDraftClip'
import { createSplineWallQueryCache, isPointInsideSplineRoom } from '../../store/splineWallQueries'
import { buildSplineWallGraphFromPaintedCells, DEFAULT_SPLINE_WALL_HEIGHT } from '../../store/splineWalls'
import { analyzeSplineWallGraphBoundaries } from '../../store/splineWallStyleAnalysis'
import { createSplineWallSegmentSideKey } from '../../store/wallStyleAssignments'
import { getContentPackWallStyleById } from '../../content-packs/registry'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { AUTOFOCUS_RAYCAST_LAYER, configureAutofocusRaycasterLayers } from './autofocusRaycast'

function createSampledFloorLightField(cellKeys: readonly string[]) {
  return {
    sampleByCellKey: Object.fromEntries(cellKeys.map((cellKey) => [cellKey, [0.2, 0.2, 0.2]])),
  } as Pick<BakedFloorLightField, 'sampleByCellKey'>
}

describe('buildSplineWallSectionHeightBands', () => {
  it('preserves the upper wall band across an opening span', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'rounded', cornerAmount: 0.4 },
        { position: [2, 2], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 2], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'stone-keep',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'room-face',
    )!
    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: {
        door: {
          id: 'door',
          assetId: 'core.opening_door_custom',
          wallKey: graph.segments[roomFace.segmentId]!.wallKey ?? '0:0:north',
          width: 1,
          segmentId: roomFace.segmentId,
          segmentStartRatio: 0.25,
          segmentEndRatio: 0.75,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
      },
      assemblySections,
    }).filter((descriptor) => descriptor.sectionId === section.id)

    const bands = buildSplineWallSectionHeightBands(section, descriptors)

    expect(bands).toHaveLength(2)
    expect(bands[0]!.visibleIntervals).toEqual([[0, 0.25], [0.75, 1]])
    expect(bands[1]!.visibleIntervals).toEqual([[0, 1]])
  })

  it('removes the wall band entirely when a passage covers the full section span', () => {
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
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'stone-keep',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'room-face',
    )!
    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: {
        passage: {
          id: 'passage',
          assetId: null,
          wallKey: graph.segments[roomFace.segmentId]!.wallKey ?? '0:0:north',
          width: 1,
          segmentId: roomFace.segmentId,
          segmentStartRatio: 0,
          segmentEndRatio: 1,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
      },
      assemblySections,
    }).filter((descriptor) => descriptor.sectionId === section.id)

    const bands = buildSplineWallSectionHeightBands(section, descriptors)
    const geometry = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), descriptors)

    expect(bands).toHaveLength(1)
    expect(bands[0]!.visibleIntervals).toEqual([])
    expect(geometry.getAttribute('position')?.count ?? 0).toBe(0)
  })

  it('removes both authored shared room faces for a generated corridor passage', () => {
    let graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'left',
      layerId: 'default',
      nodes: buildRoomDraftSplineNodes(createRoomDraftFromStroke([0, 0], [0, 0])),
      closed: true,
    })
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'right',
      layerId: 'default',
      nodes: buildRoomDraftSplineNodes(createRoomDraftFromStroke([1, 0], [1, 0])),
      closed: true,
    })

    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const sharedSections = analysis
      .flatMap((entry) => entry.sections)
      .filter((section) => section.faceKind === 'room-face' && section.oppositeRoomId !== null)
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: Object.fromEntries(
        sharedSections.map((section) => [createSplineWallSegmentSideKey(section.segmentId, section.side), 'stone-keep']),
      ),
    })
    const queryCache = createSplineWallQueryCache(graph)
    const sharedSection = sharedSections[0]!
    const placement = buildSplineWallOpeningPlacement(
      {
        x: ((sharedSection.start[0] + sharedSection.end[0]) / 2) * GRID_SIZE,
        z: ((sharedSection.start[1] + sharedSection.end[1]) / 2) * GRID_SIZE,
      },
      graph,
      queryCache,
      {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'left' },
        '1:0': { cell: [1, 0], layerId: 'default', roomId: 'right' },
      },
      null,
    )

    expect(placement?.valid).toBe(true)

    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: {
        passage: {
          id: 'passage',
          assetId: null,
          wallKey: placement!.wallKey,
          width: 1,
          segmentId: placement!.segmentId,
          segmentStartRatio: placement!.segmentStartRatio,
          segmentEndRatio: placement!.segmentEndRatio,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
      },
      assemblySections,
    })

    const sharedAssemblySections = assemblySections.filter((section) =>
      section.layerKind === 'room-face'
      && section.roomId !== null
      && section.oppositeRoomId !== null,
    )

    expect(sharedAssemblySections).toHaveLength(2)

    sharedAssemblySections.forEach((section) => {
      const sectionDescriptors = descriptors.filter((descriptor) => descriptor.sectionId === section.id)
      const bands = buildSplineWallSectionHeightBands(section, sectionDescriptors)
      const geometry = buildSplineWallSectionGeometry(section, queryCache, sectionDescriptors)

      expect(bands).toHaveLength(1)
      expect(bands[0]!.visibleIntervals).toEqual([])
      expect(geometry.getAttribute('position')?.count ?? 0).toBe(0)
    })
  })

  it('removes both room faces when a corridor shares a sub-span of a longer authored wall', () => {
    let graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room',
      layerId: 'default',
      nodes: buildRoomDraftSplineNodes(createRoomDraftFromStroke([0, 0], [2, 0])),
      closed: true,
    })
    graph = upsertSplineWallGraphRoomPath(graph, {
      roomId: 'corridor',
      layerId: 'default',
      nodes: buildRoomDraftSplineNodes(createRoomDraftFromStroke([1, -1], [1, -1])),
      closed: true,
    })

    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const sharedSections = analysis
      .flatMap((entry) => entry.sections)
      .filter((section) => section.faceKind === 'room-face' && section.oppositeRoomId !== null)
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: Object.fromEntries(
        sharedSections.map((section) => [createSplineWallSegmentSideKey(section.segmentId, section.side), 'stone-keep']),
      ),
    })
    const queryCache = createSplineWallQueryCache(graph)
    const placement = buildSplineWallOpeningPlacement(
      { x: 1.5 * GRID_SIZE, z: 0 },
      graph,
      queryCache,
      {
        '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room' },
        '1:0': { cell: [1, 0], layerId: 'default', roomId: 'room' },
        '2:0': { cell: [2, 0], layerId: 'default', roomId: 'room' },
        '1:-1': { cell: [1, -1], layerId: 'default', roomId: 'corridor' },
      },
      null,
    )

    expect(placement?.valid).toBe(true)

    const descriptors = buildSplineWallOpeningDescriptors({
      splineWallGraph: graph,
      wallOpenings: {
        passage: {
          id: 'passage',
          assetId: null,
          wallKey: placement!.wallKey,
          width: 1,
          segmentId: placement!.segmentId,
          segmentStartRatio: placement!.segmentStartRatio,
          segmentEndRatio: placement!.segmentEndRatio,
          flipped: false,
          objectProps: {},
          layerId: 'default',
        },
      },
      assemblySections,
    })
    const sharedAssemblySections = assemblySections.filter((section) =>
      section.layerKind === 'room-face'
      && section.roomId !== null
      && section.oppositeRoomId !== null,
    )

    expect(sharedAssemblySections).toHaveLength(2)

    sharedAssemblySections.forEach((section) => {
      const sectionDescriptors = descriptors.filter((descriptor) => descriptor.sectionId === section.id)
      const bands = buildSplineWallSectionHeightBands(section, sectionDescriptors)
      const geometry = buildSplineWallSectionGeometry(section, queryCache, sectionDescriptors)

      expect(sectionDescriptors).toHaveLength(1)
      expect(bands).toHaveLength(1)
      expect(bands[0]!.visibleIntervals).toEqual([])
      expect(geometry.getAttribute('position')?.count ?? 0).toBe(0)
    })
  })

  it('emits uv coordinates for textured wall-style geometry', () => {
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
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'art-deco-cobblestone',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'room-face',
    )!

    const geometry = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [])

    expect(geometry.getAttribute('uv')?.count).toBeGreaterThan(0)
    expect(geometry.getAttribute('uv2')?.count).toBeGreaterThan(0)
  })

  it('fits AI Gothic exterior UVs to wall height at the wall boundary', () => {
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
    const exteriorFace = analysis[0]!.sections.find((section) => section.faceKind === 'exterior-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(exteriorFace.segmentId, exteriorFace.side)]: 'ai-gothic',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === exteriorFace.segmentId && candidate.layerKind === 'exterior-face',
    )!

    const geometry = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [])
    expect(getMinUvV(geometry)).toBeCloseTo(0, 5)
    expect(getMaxUvV(geometry)).toBeCloseTo(1, 5)
    expect(getUvVAtHeight(geometry, 0)).toBeCloseTo(0, 5)
    expect(getUvVAtHeight(geometry, DEFAULT_SPLINE_WALL_HEIGHT)).toBeCloseTo(1, 5)
    expect(getMaxUvU(geometry)).toBeCloseTo((2 * GRID_SIZE) / DEFAULT_SPLINE_WALL_HEIGHT, 5)
    expect(countVerticesAtUvU(geometry, 0)).toBe(2)
    expect(geometry.getAttribute('position')?.count ?? 0).toBeLessThan(100)
    expect(getAverageHorizontalOffsetFromSegment(geometry, section)).toBeCloseTo(0.22, 5)
  })

  it('renders AI Gothic structural core as a neutral top fill sheet only', () => {
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
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'ai-gothic',
      },
    })
    const structuralCore = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'structural-core',
    )!

    const geometry = buildSplineWallSectionGeometry(structuralCore, createSplineWallQueryCache(graph), [])

    expect(geometry.getAttribute('position')?.count ?? 0).toBeGreaterThan(0)
    expect(getMinPositionY(geometry)).toBeCloseTo(DEFAULT_SPLINE_WALL_HEIGHT, 5)
    expect(getMaxPositionY(geometry)).toBeCloseTo(DEFAULT_SPLINE_WALL_HEIGHT, 5)
  })

  it('groups adjacent visual wall sections so clipped curves render as continuous runs', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [1, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
      ],
      closed: true,
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const roomFaceAnalysisSections = analysis
      .flatMap((boundaryPath) => boundaryPath.sections)
      .filter((section) => section.faceKind === 'room-face')
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: Object.fromEntries(
        roomFaceAnalysisSections.map((section) => [
          createSplineWallSegmentSideKey(section.segmentId, section.side),
          'art-deco-cobblestone',
        ]),
      ),
    })
    const roomFaceSections = assemblySections.filter((section) =>
      section.layerKind === 'room-face'
      && section.roomId === 'room-a',
    )

    const groups = buildSplineWallRenderSectionGroups(roomFaceSections)

    expect(roomFaceSections.length).toBeGreaterThan(1)
    expect(groups).toHaveLength(1)
    expect(groups[0]!.sections).toHaveLength(roomFaceSections.length)
  })

  it('continues wall-style UV distance across grouped section boundaries', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [1, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
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
    const sections = assemblySections.filter((section) =>
      section.layerKind === 'room-face'
      && section.roomId === 'room-a',
    ).slice(0, 2)
    const queryCache = createSplineWallQueryCache(graph)

    const firstGeometry = buildSplineWallSectionGeometry(sections[0]!, queryCache, [])
    const groupedGeometry = buildSplineWallSectionGroupGeometry(sections, queryCache, new Map())

    expect(getMaxUvU(groupedGeometry)).toBeGreaterThan(getMaxUvU(firstGeometry) + 0.5)
  })

  it('stitches shallow clipped-curve section joins into one offset wall row', () => {
    const graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
      roomId: 'room-a',
      layerId: 'default',
      nodes: [
        { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [1, 0.1], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 0], cornerMode: 'square', cornerAmount: 0 },
        { position: [2, 1], cornerMode: 'square', cornerAmount: 0 },
        { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
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
    const sections = assemblySections.filter((section) =>
      section.layerKind === 'room-face'
      && section.roomId === 'room-a',
    ).slice(0, 2)
    const queryCache = createSplineWallQueryCache(graph)
    const firstGeometry = buildSplineWallSectionGeometry(sections[0]!, queryCache, [])
    const secondGeometry = buildSplineWallSectionGeometry(sections[1]!, queryCache, [])
    const geometry = buildSplineWallSectionGroupGeometry(sections, queryCache, new Map())

    expect(geometry.getAttribute('position').count).toBe(
      firstGeometry.getAttribute('position').count + secondGeometry.getAttribute('position').count - 2,
    )
  })

  it('closes grouped exterior corners with mitered offset intersections', () => {
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
    const exteriorSections = analysis
      .flatMap((boundaryPath) => boundaryPath.sections)
      .filter((section) => section.faceKind === 'exterior-face')
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: Object.fromEntries(
        exteriorSections.map((section) => [
          createSplineWallSegmentSideKey(section.segmentId, section.side),
          'art-deco-cobblestone',
        ]),
      ),
    }).filter((section) => section.layerKind === 'exterior-face')

    const geometry = buildSplineWallSectionGroupGeometry(
      assemblySections,
      createSplineWallQueryCache(graph),
      new Map(),
    )

    expect(hasVertexNearXZ(geometry, [4.25, 4.25])).toBe(true)
    expect(hasVertexNearXZ(geometry, [-0.25, -0.25])).toBe(true)
  })

  it('retracts grouped room-face corners so interior skins meet without overlap', () => {
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
    const roomFaceSections = analysis
      .flatMap((boundaryPath) => boundaryPath.sections)
      .filter((section) => section.faceKind === 'room-face')
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: Object.fromEntries(
        roomFaceSections.map((section) => [
          createSplineWallSegmentSideKey(section.segmentId, section.side),
          'art-deco-cobblestone',
        ]),
      ),
    }).filter((section) => section.layerKind === 'room-face')

    const geometry = buildSplineWallSectionGroupGeometry(
      assemblySections,
      createSplineWallQueryCache(graph),
      new Map(),
    )

    expect(hasVertexNearXZ(geometry, [3.819, 3.819])).toBe(true)
    expect(hasVertexNearXZ(geometry, [0.181, 0.181])).toBe(true)
  })

  it('keeps exterior wall UVs anchored when an opening cuts the mesh into bands', () => {
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
    const exteriorFace = analysis[0]!.sections.find((section) => section.faceKind === 'exterior-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(exteriorFace.segmentId, exteriorFace.side)]: 'art-deco-cobblestone',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === exteriorFace.segmentId && candidate.layerKind === 'exterior-face',
    )!
    const opening = createTestOpeningDescriptor(section, {
      startRatio: 0.25,
      endRatio: 0.75,
      topHeight: DEFAULT_SPLINE_WALL_HEIGHT * 0.55,
    })

    const before = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [])
    const after = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [opening])

    expect(getMaxUvV(after)).toBeCloseTo(getMaxUvV(before), 5)
    expect(getMaxUvV(after)).toBeCloseTo(1, 5)
    expect(getMaxUvUAtHeight(after, 0)).toBeCloseTo(getMaxUvUAtHeight(before, 0), 5)
  })

  it('uses the measured KayKit dungeon wall silhouette for the art deco exterior face', () => {
    const style = getContentPackWallStyleById('dungeon', 'art-deco-cobblestone')!
    const measuredExteriorProfile = [
      [0.25, 0],
      [0.25, 0.0625],
      [0.125, 0.125],
      [0.125, 0.8],
      [0.25, 0.8625],
      [0.25, 1],
    ] as const

    expect(style.exteriorFace.profile.points).toEqual(measuredExteriorProfile)
    expect(style.structuralCore.profile.points).toEqual([
      [-0.18, 0],
      [-0.18, 1],
      ...[...measuredExteriorProfile].reverse(),
    ])
    expect(style.structuralCore.render?.hiddenProfileSegmentIndices).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(style.structuralCore.profile.points).not.toContainEqual([0.18, 0])
    expect(style.structuralCore.profile.points).not.toContainEqual([0.18, 1])
    expect(style.structuralCore.material.textures).toMatchObject({
      albedoUrl: expect.any(String),
    })
    expect(style.structuralCore.material.shading).toMatchObject({
      tintColor: '#ffffff',
      roughness: 0.45,
      metalness: 0,
    })
    expect(style.exteriorFace.material.textures).toMatchObject({
      albedoUrl: expect.any(String),
    })
    expect(style.exteriorFace.material.shading).toMatchObject({
      tintColor: '#dddddd',
      roughness: 0.2,
      metalness: 0.2,
    })
  })

  it('renders the art deco structural core as a neutral top fill sheet only', () => {
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
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'art-deco-cobblestone',
      },
    })
    const structuralCore = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'structural-core',
    )!

    const geometry = buildSplineWallSectionGeometry(structuralCore, createSplineWallQueryCache(graph), [])
    expect(geometry.getAttribute('position').count).toBeGreaterThan(0)
    expect(getMinPositionY(geometry)).toBeCloseTo(DEFAULT_SPLINE_WALL_HEIGHT, 5)
    expect(getMaxPositionY(geometry)).toBeCloseTo(DEFAULT_SPLINE_WALL_HEIGHT, 5)
  })

  it('aligns structural-core baked light directions with the generated wall normals', () => {
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
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'stone-keep',
      },
    })
    const structuralCore = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'structural-core',
    )!

    const geometry = buildSplineWallSectionGeometry(structuralCore, createSplineWallQueryCache(graph), [])

    expect(getAverageHorizontalDirectionAlignment(geometry)).toBeGreaterThan(0.85)
  })

  it('orients right-side room-face normals toward the room', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'default', roomId: 'room-a' },
    })
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const roomFace = analysis[0]!.sections.find((section) =>
      section.faceKind === 'room-face' && section.side === 'right',
    )!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'art-deco-cobblestone',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'room-face',
    )!

    const geometry = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [])

    expect(getAverageNormalDotForSectionSide(geometry, section)).toBeGreaterThan(0.85)
    expect(getAverageBakedLightDirectionDotForSectionSide(geometry, section)).toBeGreaterThan(0.85)
  })

  it('orients right-side exterior-face normals away from the room', () => {
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
    const exteriorFace = analysis[0]!.sections.find((section) =>
      section.faceKind === 'exterior-face' && section.side === 'right',
    )!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(exteriorFace.segmentId, exteriorFace.side)]: 'art-deco-cobblestone',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === exteriorFace.segmentId && candidate.layerKind === 'exterior-face',
    )!

    const geometry = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [])

    expect(getAverageNormalDotForSectionSide(geometry, section)).toBeGreaterThan(0.55)
    expect(getAverageBakedLightDirectionDotForSectionSide(geometry, section)).toBeGreaterThan(0.95)
  })

  it('allows autofocus-only raycasts to hit spline wall faces from either side', () => {
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
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'art-deco-cobblestone',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'room-face',
    )!
    const geometry = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [])
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
    mesh.layers.set(AUTOFOCUS_RAYCAST_LAYER)

    const defaultRaycaster = new THREE.Raycaster(
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(0, 0, -1),
    )
    const exteriorRaycaster = new THREE.Raycaster(
      new THREE.Vector3(1, 1, 1),
      new THREE.Vector3(0, 0, -1),
    )
    const interiorRaycaster = new THREE.Raycaster(
      new THREE.Vector3(1, 1, -1),
      new THREE.Vector3(0, 0, 1),
    )
    configureAutofocusRaycasterLayers(exteriorRaycaster, 1)
    configureAutofocusRaycasterLayers(interiorRaycaster, 1)

    expect(defaultRaycaster.intersectObject(mesh, false)).toHaveLength(0)
    expect(exteriorRaycaster.intersectObject(mesh, false).length).toBeGreaterThan(0)
    expect(interiorRaycaster.intersectObject(mesh, false).length).toBeGreaterThan(0)
  })

  it('places modern brick above a proud lower wood-panel ledge', () => {
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
    const roomFace = analysis[0]!.sections.find((section) => section.faceKind === 'room-face')!
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {
        [createSplineWallSegmentSideKey(roomFace.segmentId, roomFace.side)]: 'art-deco-cobblestone',
      },
    })
    const section = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'room-face',
    )!
    const detailSection = assemblySections.find((candidate) =>
      candidate.segmentId === roomFace.segmentId && candidate.layerKind === 'room-face-detail',
    )!

    const geometry = buildSplineWallSectionGeometry(section, createSplineWallQueryCache(graph), [])
    const positions = geometry.getAttribute('position')
    const detailGeometry = buildSplineWallSectionGeometry(detailSection, createSplineWallQueryCache(graph), [])
    const detailPositions = detailGeometry.getAttribute('position')
    const segmentStart = section.start
    const segmentDelta = [
      section.end[0] - section.start[0],
      section.end[1] - section.start[1],
    ] as const
    const segmentLength = Math.hypot(segmentDelta[0], segmentDelta[1])
    const leftNormal = [-segmentDelta[1] / segmentLength, segmentDelta[0] / segmentLength] as const
    const roomNormal = section.side === 'left'
      ? leftNormal
      : ([-leftNormal[0], -leftNormal[1]] as const)

    const lateralOffsets = Array.from({ length: positions.count }, (_, index) =>
        ((positions.getX(index) - segmentStart[0]) * roomNormal[0])
        + ((positions.getZ(index) - segmentStart[1]) * roomNormal[1]),
    )
    const detailLateralOffsets = Array.from({ length: detailPositions.count }, (_, index) =>
      ((detailPositions.getX(index) - segmentStart[0]) * roomNormal[0])
        + ((detailPositions.getZ(index) - segmentStart[1]) * roomNormal[1]),
    )
    const wallpaperHeights = Array.from({ length: positions.count }, (_, index) => positions.getY(index))
    const detailHeights = Array.from({ length: detailPositions.count }, (_, index) => detailPositions.getY(index))

    expect(section.material.textures.albedoUrl).toContain('modern-brick1_albedo.png')
    expect(section.material.textures.normalUrl).toContain('modern-brick1_normal-ogl.png')
    expect(section.material.textures.aoUrl).toContain('modern-brick1_ao.png')
    expect(section.material.textures.heightUrl).toContain('modern-brick1_height.png')
    expect(Math.min(...lateralOffsets)).toBeCloseTo(0.181, 5)
    expect(Math.max(...lateralOffsets)).toBeCloseTo(0.181, 5)
    expect(Math.min(...wallpaperHeights)).toBeCloseTo(DEFAULT_SPLINE_WALL_HEIGHT * 0.48, 5)
    expect(Math.max(...detailLateralOffsets)).toBeCloseTo(0.245, 5)
    expect(Math.min(...detailLateralOffsets)).toBeCloseTo(0.181, 5)
    expect(Math.max(...detailHeights)).toBeCloseTo(DEFAULT_SPLINE_WALL_HEIGHT * 0.48, 5)
  })

  it('keeps exterior geometry out of adjacent rooms along a rounded shared wall boundary', () => {
    const graph = createSplitRoundedOverlapRoomGraph()
    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {},
    })
    const queryCache = createSplineWallQueryCache(graph)
    const roomAExteriorSections = assemblySections.filter((section) =>
      section.roomId === 'room-a' && section.layerKind === 'exterior-face',
    )

    const intrudingVertices = roomAExteriorSections.flatMap((section) => {
      const geometry = buildSplineWallSectionGeometry(section, queryCache, [])
      const positions = geometry.getAttribute('position')
      return Array.from({ length: positions.count }, (_, index) => [
        positions.getX(index),
        positions.getZ(index),
      ] as const).filter((point) =>
        isPointInsideSplineRoom(queryCache, 'room-b', point) || isPointInsideSplineRoom(queryCache, 'room-c', point))
    })

    expect(intrudingVertices).toHaveLength(0)
  })

  it('keeps a valid exterior run between separate overlap rooms on one rounded span', () => {
    let graph = upsertSplineWallGraphRoomPath(createEmptySplineWallGraph(), {
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

    const analysis = analyzeSplineWallGraphBoundaries(graph)
    const assemblySections = buildSplineWallAssemblySections({
      analyzedBoundaries: analysis,
      wallStyleAssignments: {},
    })
    const queryCache = createSplineWallQueryCache(graph)
    const middleExterior = assemblySections.find((section) =>
      section.roomId === 'room-a'
      && section.segmentId === 'room-a:path:0:segment:1'
      && section.layerKind === 'exterior-face',
    )

    expect(middleExterior).toBeDefined()

    const geometry = buildSplineWallSectionGeometry(middleExterior!, queryCache, [])
    const positions = geometry.getAttribute('position')
    const intrudingVertices = Array.from({ length: positions.count }, (_, index) => [
      positions.getX(index),
      positions.getZ(index),
    ] as const).filter((point) =>
      isPointInsideSplineRoom(queryCache, 'room-b', point) || isPointInsideSplineRoom(queryCache, 'room-c', point))

    expect(positions.count).toBeGreaterThan(0)
    expect(intrudingVertices).toHaveLength(0)
  })
})

describe('resolveSplineWallBakedLightSamplePosition', () => {
  it('uses the normal-side sample when it remains inside the baked floor', () => {
    const field = createSampledFloorLightField(['0:0'])

    expect(resolveSplineWallBakedLightSamplePosition(
      field,
      [GRID_SIZE * 0.5, 1, GRID_SIZE * 0.5],
      [1, 0, 0],
    )).toEqual([
      GRID_SIZE * 0.5 + GRID_SIZE * 0.24,
      1.06,
      GRID_SIZE * 0.5,
    ])
  })

  it('falls back to the opposite side when a perimeter-wall normal points outside the floor', () => {
    const field = createSampledFloorLightField(['0:0'])
    const resolved = resolveSplineWallBakedLightSample(
      field,
      [0, 1, GRID_SIZE * 0.5],
      [-1, 0, 0],
    )

    expect(resolveSplineWallBakedLightSamplePosition(
      field,
      [0, 1, GRID_SIZE * 0.5],
      [-1, 0, 0],
    )).toEqual([
      GRID_SIZE * 0.24,
      1.06,
      GRID_SIZE * 0.5,
    ])
    expect(resolved.direction).toEqual([1, 0, 0])
  })

  it('keeps exterior-face samples on the exterior side when opposite fallback is disabled', () => {
    const field = createSampledFloorLightField(['0:0'])
    const resolved = resolveSplineWallBakedLightSample(
      field,
      [0, 1, GRID_SIZE * 0.5],
      [-1, 0, 0],
      { allowOppositeFallback: false },
    )

    expect(resolved.position).toEqual([
      -GRID_SIZE * 0.24,
      1.06,
      GRID_SIZE * 0.5,
    ])
    expect(resolved.direction).toEqual([-1, 0, 0])
  })

  it('does not flip samples across shared walls when both sides are baked floor cells', () => {
    const field = createSampledFloorLightField(['0:0', '1:0'])

    expect(resolveSplineWallBakedLightSamplePosition(
      field,
      [GRID_SIZE, 1, GRID_SIZE * 0.5],
      [1, 0, 0],
    )).toEqual([
      GRID_SIZE + GRID_SIZE * 0.24,
      1.06,
      GRID_SIZE * 0.5,
    ])
  })
})

function createTestOpeningDescriptor(
  section: {
    id: string
    segmentId: string
    structuralSegmentId: string
    layerKind: SplineWallOpeningDescriptor['layerKind']
    roomId: string | null
    side: SplineWallOpeningDescriptor['side']
    wallStyleId: string
  },
  {
    startRatio,
    endRatio,
    topHeight,
  }: {
    startRatio: number
    endRatio: number
    topHeight: number
  },
): SplineWallOpeningDescriptor {
  return {
    id: 'door:test',
    openingId: 'door',
    sectionId: section.id,
    segmentId: section.segmentId,
    structuralSegmentId: section.structuralSegmentId,
    layerKind: section.layerKind,
    roomId: section.roomId,
    side: section.side,
    wallStyleId: section.wallStyleId,
    openingKind: 'door',
    openingMode: 'structural',
    compatible: true,
    assetId: 'core.opening_door_custom',
    startRatio,
    endRatio,
    bottomHeight: 0,
    topHeight,
  }
}

function getMaxUvV(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute('uv')
  return Math.max(...Array.from({ length: uv.count }, (_, index) => uv.getY(index)))
}

function getMinUvV(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute('uv')
  return Math.min(...Array.from({ length: uv.count }, (_, index) => uv.getY(index)))
}

function getMaxUvU(geometry: THREE.BufferGeometry) {
  const uv = geometry.getAttribute('uv')
  return Math.max(...Array.from({ length: uv.count }, (_, index) => uv.getX(index)))
}

function getUvVAtHeight(geometry: THREE.BufferGeometry, height: number) {
  const uv = geometry.getAttribute('uv')
  const positions = geometry.getAttribute('position')
  const values = Array.from({ length: uv.count }, (_, index) =>
    Math.abs(positions.getY(index) - height) <= 1e-5 ? uv.getY(index) : Number.NEGATIVE_INFINITY)
  return Math.max(...values)
}

function countVerticesAtUvU(geometry: THREE.BufferGeometry, u: number) {
  const uv = geometry.getAttribute('uv')
  let count = 0
  for (let index = 0; index < uv.count; index += 1) {
    if (Math.abs(uv.getX(index) - u) <= 1e-5) {
      count += 1
    }
  }
  return count
}

function getMaxUvUAtHeight(geometry: THREE.BufferGeometry, height: number) {
  const uv = geometry.getAttribute('uv')
  const positions = geometry.getAttribute('position')
  const values = Array.from({ length: uv.count }, (_, index) =>
    Math.abs(positions.getY(index) - height) <= 1e-5 ? uv.getX(index) : Number.NEGATIVE_INFINITY)
  return Math.max(...values)
}

function hasVertexNearXZ(
  geometry: THREE.BufferGeometry,
  target: readonly [number, number],
  tolerance = 1e-3,
) {
  const positions = geometry.getAttribute('position')
  return Array.from({ length: positions.count }, (_, index) =>
    Math.hypot(
      positions.getX(index) - target[0],
      positions.getZ(index) - target[1],
    ) <= tolerance).some(Boolean)
}

function getMinPositionY(geometry: THREE.BufferGeometry) {
  const positions = geometry.getAttribute('position')
  return Math.min(...Array.from({ length: positions.count }, (_, index) => positions.getY(index)))
}

function getMaxPositionY(geometry: THREE.BufferGeometry) {
  const positions = geometry.getAttribute('position')
  return Math.max(...Array.from({ length: positions.count }, (_, index) => positions.getY(index)))
}

function getAverageHorizontalOffsetFromSegment(
  geometry: THREE.BufferGeometry,
  section: { start: readonly [number, number]; end: readonly [number, number] },
) {
  const positions = geometry.getAttribute('position')
  expect(positions?.count).toBeGreaterThan(0)
  const segmentX = section.end[0] - section.start[0]
  const segmentZ = section.end[1] - section.start[1]
  const segmentLength = Math.hypot(segmentX, segmentZ)
  expect(segmentLength).toBeGreaterThan(1e-5)

  let sum = 0
  for (let index = 0; index < positions.count; index += 1) {
    const pointX = positions.getX(index)
    const pointZ = positions.getZ(index)
    const distance = Math.abs(
      ((pointX - section.start[0]) * segmentZ) - ((pointZ - section.start[1]) * segmentX),
    ) / segmentLength
    sum += distance
  }
  return sum / positions.count
}

function getAverageNormalDotForSectionSide(
  geometry: THREE.BufferGeometry,
  section: { start: readonly [number, number]; end: readonly [number, number]; side: 'left' | 'right' | null },
) {
  const normals = geometry.getAttribute('normal')
  expect(normals?.count).toBeGreaterThan(0)
  const sideNormal = getSectionSideNormal2D(section)
  let sum = 0
  for (let index = 0; index < normals.count; index += 1) {
    sum += (normals.getX(index) * sideNormal[0]) + (normals.getZ(index) * sideNormal[1])
  }
  return sum / normals.count
}

function getAverageBakedLightDirectionDotForSectionSide(
  geometry: THREE.BufferGeometry,
  section: { start: readonly [number, number]; end: readonly [number, number]; side: 'left' | 'right' | null },
) {
  const directions = geometry.getAttribute('bakedLightDirection')
  expect(directions?.count).toBeGreaterThan(0)
  const sideNormal = getSectionSideNormal2D(section)
  let sum = 0
  for (let index = 0; index < directions.count; index += 1) {
    sum += (directions.getX(index) * sideNormal[0]) + (directions.getZ(index) * sideNormal[1])
  }
  return sum / directions.count
}

function getAverageHorizontalDirectionAlignment(geometry: THREE.BufferGeometry) {
  const normals = geometry.getAttribute('normal')
  const directions = geometry.getAttribute('bakedLightDirection')
  expect(normals?.count).toBeGreaterThan(0)
  expect(directions?.count).toBe(normals?.count)

  let sum = 0
  let samples = 0
  for (let index = 0; index < normals.count; index += 1) {
    const normalX = normals.getX(index)
    const normalZ = normals.getZ(index)
    const directionX = directions.getX(index)
    const directionZ = directions.getZ(index)
    const normalLength = Math.hypot(normalX, normalZ)
    const directionLength = Math.hypot(directionX, directionZ)
    if (normalLength <= 1e-5 || directionLength <= 1e-5) {
      continue
    }

    sum += ((normalX / normalLength) * (directionX / directionLength))
      + ((normalZ / normalLength) * (directionZ / directionLength))
    samples += 1
  }

  expect(samples).toBeGreaterThan(0)
  return sum / samples
}

function getSectionSideNormal2D(
  section: { start: readonly [number, number]; end: readonly [number, number]; side: 'left' | 'right' | null },
) {
  const delta = [
    section.end[0] - section.start[0],
    section.end[1] - section.start[1],
  ] as const
  const length = Math.hypot(delta[0], delta[1])
  const leftNormal = [-delta[1] / length, delta[0] / length] as const
  return section.side === 'right'
    ? ([-leftNormal[0], -leftNormal[1]] as const)
    : leftNormal
}

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
