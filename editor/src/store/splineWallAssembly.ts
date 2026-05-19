import {
  getContentPackRoomSetById,
  getContentPackWallStyleById,
  getDefaultContentPackWallStyleId,
} from '../content-packs/registry'
import type {
  ContentPackWallStyleLayer,
  ContentPackWallStyleLayerRender,
  ContentPackWallStyleMaterial,
  ContentPackWallStyleProfile,
} from '../content-packs/types'
import type { SplineWallGraph } from './splineWallGraph'
import type { SplineWallSegmentSide } from './wallStyleAssignments'
import {
  createSplineWallSegmentSideKey,
  getStructuralSplineWallSegmentId,
} from './wallStyleAssignments'
import type {
  AnalyzedSplineWallBoundaryPath,
  AnalyzedSplineWallBoundarySection,
} from './splineWallStyleAnalysis'
import { analyzeSplineWallGraphBoundaries } from './splineWallStyleAnalysis'
import type { Room } from './useDungeonStore'

export type SplineWallAssemblyLayerKind = 'structural-core' | 'room-face' | 'room-face-detail' | 'exterior-face'

export type SplineWallAssemblySection = {
  id: string
  layerKind: SplineWallAssemblyLayerKind
  pathId: string
  segmentId: string
  structuralSegmentId: string
  roomId: string | null
  oppositeRoomId: string | null
  side: SplineWallSegmentSide | null
  wallStyleId: string
  sharedSegmentIds: readonly string[]
  start: readonly [number, number]
  end: readonly [number, number]
  length: number
  startRatio: number
  endRatio: number
  profile: ContentPackWallStyleProfile
  material: ContentPackWallStyleMaterial
  render?: ContentPackWallStyleLayerRender
}

export type DerivedSplineWallAssemblyData = {
  analyzedBoundaries: readonly AnalyzedSplineWallBoundaryPath[]
  assemblySections: SplineWallAssemblySection[]
}

export function deriveSplineWallAssemblyData({
  splineWallGraph,
  visibleLayerIds = null,
  wallStyleAssignments,
  wallCoreAssignments = {},
  rooms = {},
  contentPackId = 'dungeon',
}: {
  splineWallGraph: SplineWallGraph
  visibleLayerIds?: ReadonlySet<string> | null
  wallStyleAssignments: Readonly<Record<string, string>>
  wallCoreAssignments?: Readonly<Record<string, string>>
  rooms?: Readonly<Record<string, Room>>
  contentPackId?: string
}): DerivedSplineWallAssemblyData {
  const analyzedBoundaries = analyzeSplineWallGraphBoundaries(splineWallGraph, visibleLayerIds)
  return {
    analyzedBoundaries,
    assemblySections: buildSplineWallAssemblySections({
      analyzedBoundaries,
      wallStyleAssignments,
      wallCoreAssignments,
      rooms,
      contentPackId,
    }),
  }
}

export function buildSplineWallAssemblySections({
  analyzedBoundaries,
  wallStyleAssignments,
  wallCoreAssignments = {},
  rooms = {},
  contentPackId = 'dungeon',
}: {
  analyzedBoundaries: readonly AnalyzedSplineWallBoundaryPath[]
  wallStyleAssignments: Readonly<Record<string, string>>
  wallCoreAssignments?: Readonly<Record<string, string>>
  rooms?: Readonly<Record<string, Room>>
  contentPackId?: string
}): SplineWallAssemblySection[] {
  const defaultWallStyleId = getDefaultContentPackWallStyleId(contentPackId)
  if (!defaultWallStyleId) {
    return []
  }

  const sections: SplineWallAssemblySection[] = []
  const emittedStructuralSections = new Set<string>()
  const resolvedRoomFaceStyles = new Map<string, string>()

  analyzedBoundaries.forEach((boundaryPath) => {
    boundaryPath.sections.forEach((section) => {
      const wallStyleId = resolveFaceWallStyleId(
        section,
        wallStyleAssignments,
        rooms,
        contentPackId,
        defaultWallStyleId,
      )
      resolvedRoomFaceStyles.set(getResolvedRoomFaceStyleKey(section), wallStyleId)

      const layer = getSectionLayer(section, contentPackId, wallStyleId)
      if (layer) {
        sections.push(createAssemblySection(section, {
          id: `${section.id}:${section.faceKind}`,
          layerKind: section.faceKind,
          side: section.side,
          wallStyleId,
          layer,
        }))
      }

      if (section.faceKind === 'room-face') {
        const style = getContentPackWallStyleById(contentPackId, wallStyleId)
        style?.roomFaceDetails?.forEach((detailLayer, detailIndex) => {
          sections.push(createAssemblySection(section, {
            id: `${section.id}:room-face-detail:${detailIndex}`,
            layerKind: 'room-face-detail',
            side: section.side,
            wallStyleId,
            layer: detailLayer,
          }))
        })
      }

      if (section.faceKind !== 'room-face') {
        return
      }

      const structuralSegmentId = getSectionStructuralSegmentId(section)
      if (emittedStructuralSections.has(structuralSegmentId)) {
        return
      }
      emittedStructuralSections.add(structuralSegmentId)

      const structuralWallStyleId = resolveStructuralWallStyleId({
        section,
        wallCoreAssignments,
        resolvedRoomFaceStyleId: wallStyleId,
        defaultWallStyleId,
      })
      const structuralStyle = getContentPackWallStyleById(contentPackId, structuralWallStyleId)
      if (!structuralStyle) {
        return
      }

      if (section.oppositeRoomId) {
        return
      }

      sections.push(createAssemblySection(section, {
        id: `${structuralSegmentId}:structural-core`,
        layerKind: 'structural-core',
        side: null,
        wallStyleId: structuralWallStyleId,
        layer: structuralStyle.structuralCore,
      }))
    })
  })

  return sections
}

export function getStructuralSegmentId(segmentIds: readonly string[]) {
  return getStructuralSplineWallSegmentId(segmentIds)
}

function getSectionStructuralSegmentId(section: AnalyzedSplineWallBoundarySection) {
  const structuralSegmentId = getStructuralSegmentId(section.sharedSegmentIds)
  return section.startRatio <= 1e-5 && section.endRatio >= 1 - 1e-5
    ? structuralSegmentId
    : `${structuralSegmentId}:${section.startRatio.toFixed(6)}:${section.endRatio.toFixed(6)}`
}

function getResolvedRoomFaceStyleKey(section: AnalyzedSplineWallBoundarySection) {
  return `${section.segmentId}:${section.side}`
}

function resolveFaceWallStyleId(
  section: AnalyzedSplineWallBoundarySection,
  wallStyleAssignments: Readonly<Record<string, string>>,
  rooms: Readonly<Record<string, Room>>,
  contentPackId: string,
  defaultWallStyleId: string,
) {
  const assignedWallStyleId = wallStyleAssignments[createSplineWallSegmentSideKey(section.segmentId, section.side)]
  if (assignedWallStyleId) {
    return assignedWallStyleId
  }

  const roomSetId = section.roomId ? rooms[section.roomId]?.roomSetId : null
  const roomSetWallStyleId = getContentPackRoomSetById(contentPackId, roomSetId)?.wallStyleId
  return roomSetWallStyleId ?? defaultWallStyleId
}

function resolveStructuralWallStyleId({
  section,
  wallCoreAssignments,
  resolvedRoomFaceStyleId,
  defaultWallStyleId,
}: {
  section: AnalyzedSplineWallBoundarySection
  wallCoreAssignments: Readonly<Record<string, string>>
  resolvedRoomFaceStyleId: string
  defaultWallStyleId: string
}) {
  const structuralSegmentId = getSectionStructuralSegmentId(section)
  if (wallCoreAssignments[structuralSegmentId]) {
    return wallCoreAssignments[structuralSegmentId]!
  }

  return section.oppositeRoomId ? defaultWallStyleId : resolvedRoomFaceStyleId
}

function getSectionLayer(
  section: AnalyzedSplineWallBoundarySection,
  contentPackId: string,
  wallStyleId: string,
) {
  const style = getContentPackWallStyleById(contentPackId, wallStyleId)
  if (!style) {
    return null
  }

  return section.faceKind === 'room-face' ? style.roomFace : style.exteriorFace
}

function createAssemblySection(
  section: AnalyzedSplineWallBoundarySection,
  {
    id,
    layerKind,
    side,
    wallStyleId,
    layer,
  }: {
    id: string
    layerKind: SplineWallAssemblyLayerKind
    side: SplineWallSegmentSide | null
    wallStyleId: string
    layer: ContentPackWallStyleLayer
  },
): SplineWallAssemblySection {
  return {
    id,
    layerKind,
    pathId: section.pathId,
    segmentId: section.segmentId,
    structuralSegmentId: getSectionStructuralSegmentId(section),
    roomId: layerKind === 'structural-core' && section.oppositeRoomId ? null : section.roomId,
    oppositeRoomId: section.oppositeRoomId,
    side,
    wallStyleId,
    sharedSegmentIds: section.sharedSegmentIds,
    start: section.start,
    end: section.end,
    length: section.length,
    startRatio: section.startRatio,
    endRatio: section.endRatio,
    profile: layer.profile,
    material: layer.material,
    ...(layer.render ? { render: layer.render } : {}),
  }
}
