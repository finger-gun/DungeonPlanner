import { getContentPackWallStyleById } from '../content-packs/registry'
import type {
  ContentPackOpeningContext,
  ContentPackWallStyleOpeningKind,
  ContentPackWallStyleOpeningMode,
} from '../content-packs/types'
import { getOpeningRenderContext, getOpeningSpanPlacements, getOpeningVerticalCutoutSpec } from './openingPlacement'
import type { SplineWallAssemblySection } from './splineWallAssembly'
import type { SplineWallGraph } from './splineWallGraph'
import { getOpeningKind } from './openingState'
import type { OpeningRecord } from './useDungeonStore'

const OPENING_GEOMETRY_EPSILON = 1e-5

export type SplineWallOpeningDescriptor = {
  id: string
  openingId: string
  sectionId: string
  segmentId: string
  structuralSegmentId: string
  layerKind: SplineWallAssemblySection['layerKind']
  roomId: string | null
  side: SplineWallAssemblySection['side']
  wallStyleId: string
  openingKind: ContentPackWallStyleOpeningKind
  openingMode: ContentPackWallStyleOpeningMode
  compatible: boolean
  assetId: string | null
  startRatio: number
  endRatio: number
  bottomHeight: number
  topHeight: number | null
}

export function buildSplineWallOpeningDescriptors({
  splineWallGraph,
  wallOpenings,
  assemblySections,
  contentPackId = 'dungeon',
}: {
  splineWallGraph: SplineWallGraph
  wallOpenings: Record<string, OpeningRecord>
  assemblySections: readonly SplineWallAssemblySection[]
  contentPackId?: string
}) {
  const descriptors: SplineWallOpeningDescriptor[] = []

  Object.values(wallOpenings).forEach((opening) => {
    const openingKind = getOpeningKind(opening)
    const { bottomHeight, topHeight } = getOpeningVerticalCutoutSpec(opening)
    const placements = getOpeningSpanPlacements(splineWallGraph, opening)

    placements.forEach((placement) => {
      assemblySections.forEach((section) => {
        if (!section.sharedSegmentIds.includes(placement.segmentId)) {
          return
        }

        const mappedRatios = mapOpeningPlacementRatiosToSection(
          splineWallGraph,
          section,
          section.segmentId,
          placement.segmentId,
          placement.startRatio,
          placement.endRatio,
        )
        if (!mappedRatios || mappedRatios.endRatio - mappedRatios.startRatio <= OPENING_GEOMETRY_EPSILON) {
          return
        }

        const resolution = resolveSectionOpeningMode({
          contentPackId,
          section,
          openingKind,
          assetId: opening.assetId,
        })

        descriptors.push({
          id: `${opening.id}:${section.id}:${placement.segmentId}:${mappedRatios.startRatio}:${mappedRatios.endRatio}`,
          openingId: opening.id,
          sectionId: section.id,
          segmentId: section.segmentId,
          structuralSegmentId: section.structuralSegmentId,
          layerKind: section.layerKind,
          roomId: section.roomId,
          side: section.side,
          wallStyleId: section.wallStyleId,
          openingKind,
          openingMode: resolution.openingMode,
          compatible: resolution.compatible,
          assetId: opening.assetId,
          startRatio: mappedRatios.startRatio,
          endRatio: mappedRatios.endRatio,
          bottomHeight,
          topHeight,
        })
      })
    })
  })

  return descriptors
}

export function buildSplineWallOpeningDescriptorMapBySectionId(
  descriptors: readonly SplineWallOpeningDescriptor[],
) {
  const descriptorsBySectionId = new Map<string, SplineWallOpeningDescriptor[]>()
  descriptors.forEach((descriptor) => {
    const existing = descriptorsBySectionId.get(descriptor.sectionId)
    if (existing) {
      existing.push(descriptor)
    } else {
      descriptorsBySectionId.set(descriptor.sectionId, [descriptor])
    }
  })
  return descriptorsBySectionId
}

export function getSplineWallOpeningRenderContext({
  splineWallGraph,
  openingQueryCache,
  opening,
  openingDescriptors,
}: {
  splineWallGraph: SplineWallGraph
  openingQueryCache: Parameters<typeof getOpeningRenderContext>[1]
  opening: OpeningRecord
  openingDescriptors: readonly SplineWallOpeningDescriptor[]
}): ContentPackOpeningContext | null {
  const baseContext = getOpeningRenderContext(splineWallGraph, openingQueryCache, opening)
  if (!baseContext) {
    return null
  }

  const preferredDescriptor = getPreferredOpeningDescriptor(openingDescriptors, opening.id)
  if (!preferredDescriptor) {
    return baseContext
  }

  return {
    ...baseContext,
    openingKind: preferredDescriptor.openingKind,
    openingMode: preferredDescriptor.openingMode,
    compatibleWithWallStyle: preferredDescriptor.compatible,
  }
}

function resolveSectionOpeningMode({
  contentPackId,
  section,
  openingKind,
  assetId,
}: {
  contentPackId: string
  section: SplineWallAssemblySection
  openingKind: ContentPackWallStyleOpeningKind
  assetId: string | null
}): { openingMode: ContentPackWallStyleOpeningMode; compatible: boolean } {
  const style = getContentPackWallStyleById(contentPackId, section.wallStyleId)
  const rules = style?.openingRules
  if (!rules) {
    return {
      openingMode: 'structural' satisfies ContentPackWallStyleOpeningMode,
      compatible: true,
    }
  }

  const kindCompatible = !rules.supportedKinds || rules.supportedKinds.includes(openingKind)
  const assetCompatible = assetId === null || !rules.compatibleAssetIds || rules.compatibleAssetIds.includes(assetId)
  const compatible = kindCompatible && assetCompatible
  const openingMode = compatible
    ? (rules.supportedModes.includes(rules.defaultMode) ? rules.defaultMode : (rules.supportedModes[0] ?? 'structural'))
    : 'structural'

  return { openingMode, compatible }
}

function mapOpeningPlacementRatiosToSection(
  splineWallGraph: SplineWallGraph,
  section: SplineWallAssemblySection,
  sectionSegmentId: string,
  placementSegmentId: string,
  startRatio: number,
  endRatio: number,
) {
  const sectionSegment = splineWallGraph.segments[sectionSegmentId]
  const placementSegment = splineWallGraph.segments[placementSegmentId]
  const sectionStart = splineWallGraph.nodes[sectionSegment?.startNodeId ?? '']?.position
  const sectionEnd = splineWallGraph.nodes[sectionSegment?.endNodeId ?? '']?.position
  const placementStart = splineWallGraph.nodes[placementSegment?.startNodeId ?? '']?.position
  const placementEnd = splineWallGraph.nodes[placementSegment?.endNodeId ?? '']?.position
  if (!sectionSegment || !placementSegment || !sectionStart || !sectionEnd || !placementStart || !placementEnd) {
    return null
  }

  const sectionMatchesPlacement =
    pointsEqual(sectionStart, placementStart) && pointsEqual(sectionEnd, placementEnd)
  const sectionIsReversed =
    pointsEqual(sectionStart, placementEnd) && pointsEqual(sectionEnd, placementStart)

  if (sectionMatchesPlacement || sectionSegmentId === placementSegmentId) {
    return mapGlobalRatiosToSectionLocal(section, {
      startRatio: clampRatio(startRatio),
      endRatio: clampRatio(endRatio),
    })
  }

  if (sectionIsReversed) {
    return mapGlobalRatiosToSectionLocal(section, {
      startRatio: clampRatio(1 - endRatio),
      endRatio: clampRatio(1 - startRatio),
    })
  }

  const mappedPlacementRatios = mapPlacementSegmentRatiosOntoSectionSegment({
    sectionStart,
    sectionEnd,
    placementStart,
    placementEnd,
    startRatio,
    endRatio,
  })
  if (!mappedPlacementRatios) {
    return null
  }

  return mapGlobalRatiosToSectionLocal(section, mappedPlacementRatios)
}

function mapPlacementSegmentRatiosOntoSectionSegment({
  sectionStart,
  sectionEnd,
  placementStart,
  placementEnd,
  startRatio,
  endRatio,
}: {
  sectionStart: readonly [number, number]
  sectionEnd: readonly [number, number]
  placementStart: readonly [number, number]
  placementEnd: readonly [number, number]
  startRatio: number
  endRatio: number
}) {
  const sectionDelta = subtractPoints(sectionEnd, sectionStart)
  const placementDelta = subtractPoints(placementEnd, placementStart)
  if (
    magnitudeSquared(sectionDelta) <= OPENING_GEOMETRY_EPSILON
    || magnitudeSquared(placementDelta) <= OPENING_GEOMETRY_EPSILON
    || Math.abs(crossProduct(sectionDelta, placementDelta)) > OPENING_GEOMETRY_EPSILON
    || Math.abs(crossProduct(sectionDelta, subtractPoints(placementStart, sectionStart))) > OPENING_GEOMETRY_EPSILON
  ) {
    return null
  }

  const cutoutStart = interpolatePoint(placementStart, placementEnd, clampRatio(startRatio))
  const cutoutEnd = interpolatePoint(placementStart, placementEnd, clampRatio(endRatio))
  const sectionStartRatio = projectPointOntoSegmentRatio(cutoutStart, sectionStart, sectionEnd)
  const sectionEndRatio = projectPointOntoSegmentRatio(cutoutEnd, sectionStart, sectionEnd)

  return {
    startRatio: clampRatio(Math.min(sectionStartRatio, sectionEndRatio)),
    endRatio: clampRatio(Math.max(sectionStartRatio, sectionEndRatio)),
  }
}

function mapGlobalRatiosToSectionLocal(
  section: SplineWallAssemblySection,
  ratios: { startRatio: number; endRatio: number },
) {
  const startRatio = Math.max(section.startRatio, Math.min(ratios.startRatio, ratios.endRatio))
  const endRatio = Math.min(section.endRatio, Math.max(ratios.startRatio, ratios.endRatio))
  if (endRatio - startRatio <= OPENING_GEOMETRY_EPSILON) {
    return null
  }

  const sectionSpan = section.endRatio - section.startRatio
  if (Math.abs(sectionSpan) <= OPENING_GEOMETRY_EPSILON) {
    return null
  }

  return {
    startRatio: clampRatio((startRatio - section.startRatio) / sectionSpan),
    endRatio: clampRatio((endRatio - section.startRatio) / sectionSpan),
  }
}

function getPreferredOpeningDescriptor(
  descriptors: readonly SplineWallOpeningDescriptor[],
  openingId: string,
) {
  const openingDescriptors = descriptors.filter((descriptor) => descriptor.openingId === openingId)
  if (openingDescriptors.length === 0) {
    return null
  }

  return openingDescriptors
    .slice()
    .sort((left, right) => getOpeningDescriptorPriority(right) - getOpeningDescriptorPriority(left))[0] ?? null
}

function getOpeningDescriptorPriority(descriptor: SplineWallOpeningDescriptor) {
  const compatibilityScore = descriptor.compatible ? 100 : 0
  const layerScore = descriptor.layerKind === 'room-face'
    ? 30
    : descriptor.layerKind === 'room-face-detail'
      ? 25
    : descriptor.layerKind === 'exterior-face'
      ? 20
      : 10
  return compatibilityScore + layerScore
}

function pointsEqual(left: readonly [number, number], right: readonly [number, number]) {
  return Math.abs(left[0] - right[0]) <= OPENING_GEOMETRY_EPSILON
    && Math.abs(left[1] - right[1]) <= OPENING_GEOMETRY_EPSILON
}

function subtractPoints(left: readonly [number, number], right: readonly [number, number]) {
  return [left[0] - right[0], left[1] - right[1]] as const
}

function interpolatePoint(
  start: readonly [number, number],
  end: readonly [number, number],
  ratio: number,
) {
  return [
    start[0] + ((end[0] - start[0]) * ratio),
    start[1] + ((end[1] - start[1]) * ratio),
  ] as const
}

function projectPointOntoSegmentRatio(
  point: readonly [number, number],
  start: readonly [number, number],
  end: readonly [number, number],
) {
  const delta = subtractPoints(end, start)
  const lengthSquared = magnitudeSquared(delta)
  if (lengthSquared <= OPENING_GEOMETRY_EPSILON) {
    return 0
  }

  return (((point[0] - start[0]) * delta[0]) + ((point[1] - start[1]) * delta[1])) / lengthSquared
}

function crossProduct(left: readonly [number, number], right: readonly [number, number]) {
  return (left[0] * right[1]) - (left[1] * right[0])
}

function magnitudeSquared(point: readonly [number, number]) {
  return (point[0] * point[0]) + (point[1] * point[1])
}

function clampRatio(value: number) {
  return Math.min(1, Math.max(0, value))
}
