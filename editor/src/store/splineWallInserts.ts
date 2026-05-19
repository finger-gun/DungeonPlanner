import { getContentPackWallStyleById } from '../content-packs/registry'
import type { ContentPackWallStyleInsertAnchor } from '../content-packs/types'
import { GRID_SIZE } from '../hooks/useSnapToGrid'
import { sampleSplineWallSegment, type SplineWallQueryCache } from './splineWallQueries'
import type { SplineWallSegmentSide } from './wallStyleAssignments'
import type { SplineWallAssemblySection } from './splineWallAssembly'
import type {
  AnalyzedSplineWallBoundaryAnchor,
  AnalyzedSplineWallBoundaryPath,
} from './splineWallStyleAnalysis'

export type SplineWallInsertDescriptor = {
  id: string
  pathId: string
  segmentId: string
  structuralSegmentId: string
  roomId: string | null
  side: SplineWallSegmentSide
  wallStyleId: string
  assetId: string
  anchorKind: ContentPackWallStyleInsertAnchor
  ratio: number
  position: readonly [number, number]
}

export function buildSplineWallInsertDescriptors({
  analyzedBoundaries,
  assemblySections,
  contentPackId = 'dungeon',
}: {
  analyzedBoundaries: readonly AnalyzedSplineWallBoundaryPath[]
  assemblySections: readonly SplineWallAssemblySection[]
  contentPackId?: string
}): SplineWallInsertDescriptor[] {
  const anchorsBySection = new Map<string, AnalyzedSplineWallBoundaryAnchor[]>()
  analyzedBoundaries.forEach((boundaryPath) => {
    boundaryPath.anchors.forEach((anchor) => {
      const key = getAnchorSectionKey(boundaryPath.pathId, anchor.segmentId, anchor.side)
      const existing = anchorsBySection.get(key)
      if (existing) {
        existing.push(anchor)
      } else {
        anchorsBySection.set(key, [anchor])
      }
    })
  })

  const inserts: SplineWallInsertDescriptor[] = []
  assemblySections
    .filter((section) =>
      (section.layerKind === 'room-face' || section.layerKind === 'exterior-face') && section.side !== null)
    .forEach((section) => {
      const side = section.side
      if (!side) {
        return
      }
      const style = getContentPackWallStyleById(contentPackId, section.wallStyleId)
      if (!style?.inserts?.length) {
        return
      }

      const semanticAnchors = getSectionSemanticAnchors(section, anchorsBySection)
      style.inserts.forEach((rule) => {
        semanticAnchors.forEach((anchor) => {
          if (!rule.anchors.includes(anchor.kind)) {
            return
          }
          const ratio = getPositionRatioAlongSection(section, anchor.position)
          inserts.push({
            id: `${section.id}:${rule.assetId}:${anchor.kind}:${anchor.position[0]}:${anchor.position[1]}`,
            pathId: section.pathId,
            segmentId: section.segmentId,
            structuralSegmentId: section.structuralSegmentId,
            roomId: section.roomId,
            side,
            wallStyleId: section.wallStyleId,
            assetId: rule.assetId,
            anchorKind: anchor.kind,
            ratio,
            position: anchor.position,
          })
        })

        if (rule.anchors.includes('interval') && typeof rule.interval === 'number' && rule.interval > 0) {
          buildIntervalPositions(section, rule.interval).forEach(({ ratio, position }, index) => {
            inserts.push({
              id: `${section.id}:${rule.assetId}:interval:${index}`,
              pathId: section.pathId,
              segmentId: section.segmentId,
              structuralSegmentId: section.structuralSegmentId,
              roomId: section.roomId,
              side,
              wallStyleId: section.wallStyleId,
              assetId: rule.assetId,
              anchorKind: 'interval',
              ratio,
              position,
            })
          })
        }
      })
    })

  return dedupeSplineWallInsertDescriptors(inserts)
}

function getSectionSemanticAnchors(
  section: SplineWallAssemblySection,
  anchorsBySection: ReadonlyMap<string, readonly AnalyzedSplineWallBoundaryAnchor[]>,
) {
  const anchors: Array<{
    kind: Exclude<ContentPackWallStyleInsertAnchor, 'interval'>
    position: readonly [number, number]
  }> = []
  const directAnchors = anchorsBySection.get(getAnchorSectionKey(section.pathId, section.segmentId, section.side!)) ?? []
  if (section.layerKind === 'room-face') {
    directAnchors.forEach((anchor) => {
      anchors.push({ kind: anchor.kind, position: anchor.position })
    })
    return anchors
  }

  const mirroredSourceSide: SplineWallSegmentSide = section.side === 'left' ? 'right' : 'left'
  const mirroredAnchors = anchorsBySection.get(getAnchorSectionKey(section.pathId, section.segmentId, mirroredSourceSide)) ?? []
  mirroredAnchors.forEach((anchor) => {
    const mirroredKind = mirrorAnchorKind(anchor.kind)
    if (mirroredKind) {
      anchors.push({ kind: mirroredKind, position: anchor.position })
    }
  })
  return anchors
}

function buildIntervalPositions(section: SplineWallAssemblySection, interval: number) {
  const positions: Array<{
    ratio: number
    position: readonly [number, number]
  }> = []
  if (section.length <= interval) {
    return positions
  }

  const deltaX = section.end[0] - section.start[0]
  const deltaZ = section.end[1] - section.start[1]
  const insertCount = Math.floor(section.length / interval)
  for (let index = 1; index <= insertCount; index += 1) {
    const ratio = index / (insertCount + 1)
    positions.push({
      ratio,
      position: [
        section.start[0] + (deltaX * ratio),
        section.start[1] + (deltaZ * ratio),
      ],
    })
  }

  return positions
}

export function getSplineWallInsertPlacement(
  descriptor: SplineWallInsertDescriptor,
  queryCache: SplineWallQueryCache | null | undefined,
) {
  if (descriptor.anchorKind !== 'interval' && descriptor.anchorKind !== 'curvature-change') {
    return {
      position: graphPointToWorldPoint(descriptor.position),
      tangent: [0, 0] as const,
    }
  }

  if (queryCache) {
    const sample = sampleSplineWallSegment(queryCache, descriptor.segmentId, descriptor.ratio)
    if (sample) {
      return {
        position: sample.position,
        tangent: sample.tangent,
      }
    }
  }

  return {
    position: graphPointToWorldPoint(descriptor.position),
    tangent: [0, 0] as const,
  }
}

function graphPointToWorldPoint(point: readonly [number, number]) {
  return [point[0] * GRID_SIZE, point[1] * GRID_SIZE] as const
}

function getAnchorSectionKey(pathId: string, segmentId: string, side: SplineWallSegmentSide) {
  return `${pathId}:${segmentId}:${side}`
}

function mirrorAnchorKind(kind: AnalyzedSplineWallBoundaryAnchor['kind']) {
  switch (kind) {
    case 'convex-corner':
      return 'concave-corner'
    case 'concave-corner':
      return 'convex-corner'
    case 'curvature-change':
      return 'curvature-change'
    default:
      return null
  }
}

function getPositionRatioAlongSection(
  section: SplineWallAssemblySection,
  position: readonly [number, number],
) {
  const deltaX = section.end[0] - section.start[0]
  const deltaZ = section.end[1] - section.start[1]
  const lengthSquared = (deltaX * deltaX) + (deltaZ * deltaZ)
  if (lengthSquared <= 1e-8) {
    return 0
  }

  const relativeX = position[0] - section.start[0]
  const relativeZ = position[1] - section.start[1]
  const ratio = ((relativeX * deltaX) + (relativeZ * deltaZ)) / lengthSquared
  return Math.min(Math.max(ratio, 0), 1)
}

function dedupeSplineWallInsertDescriptors(
  inserts: readonly SplineWallInsertDescriptor[],
) {
  const deduped = new Map<string, SplineWallInsertDescriptor>()

  inserts.forEach((insert) => {
    const key = createSplineWallInsertDedupeKey(insert)
    const existing = deduped.get(key)
    if (!existing || getInsertDescriptorPriority(insert) > getInsertDescriptorPriority(existing)) {
      deduped.set(key, insert)
    }
  })

  return [...deduped.values()]
}

function createSplineWallInsertDedupeKey(insert: SplineWallInsertDescriptor) {
  return [
    insert.assetId,
    Math.round(insert.position[0] * 10000),
    Math.round(insert.position[1] * 10000),
  ].join(':')
}

function getInsertDescriptorPriority(insert: SplineWallInsertDescriptor) {
  const anchorScore = insert.anchorKind === 'curvature-change'
    ? 40
    : insert.anchorKind === 'convex-corner'
      ? 35
      : insert.anchorKind === 'concave-corner'
        ? 30
        : insert.anchorKind === 'start' || insert.anchorKind === 'end'
          ? 20
          : 10
  const sideScore = insert.side === 'left' ? 1 : 0
  return anchorScore + sideScore
}
