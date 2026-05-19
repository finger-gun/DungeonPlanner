import type { SplineWallGraph } from './splineWallGraph'
import {
  createSplineWallSegmentSideKey,
  getStructuralSplineWallSegmentId,
  parseSplineWallSegmentSideKey,
} from './wallStyleAssignments'

function buildCoincidentSegmentGroups(graph: SplineWallGraph) {
  const segmentIdsByGeometryKey = new Map<string, string[]>()

  Object.values(graph.segments).forEach((segment) => {
    const start = graph.nodes[segment.startNodeId]?.position
    const end = graph.nodes[segment.endNodeId]?.position
    if (!start || !end) {
      return
    }

    const encoded = [
      `${start[0].toFixed(6)},${start[1].toFixed(6)}`,
      `${end[0].toFixed(6)},${end[1].toFixed(6)}`,
    ].sort()
    const geometryKey = `${segment.layerId}:${encoded[0]}->${encoded[1]}`
    const existing = segmentIdsByGeometryKey.get(geometryKey)
    if (existing) {
      existing.push(segment.id)
    } else {
      segmentIdsByGeometryKey.set(geometryKey, [segment.id])
    }
  })

  const groupsBySegmentId = new Map<string, string[]>()
  segmentIdsByGeometryKey.forEach((segmentIds) => {
    const uniqueSegmentIds = [...new Set(segmentIds)]
    uniqueSegmentIds.forEach((segmentId) => {
      groupsBySegmentId.set(segmentId, uniqueSegmentIds)
    })
  })

  return groupsBySegmentId
}

export function sanitizeSplineWallStyleAssignmentsForGraph(
  graph: SplineWallGraph,
  assignments: Readonly<Record<string, string>>,
) {
  return Object.fromEntries(
    Object.entries(assignments).filter(([key]) => {
      const parsed = parseSplineWallSegmentSideKey(key)
      return parsed ? Boolean(graph.segments[parsed.segmentId]) : false
    }),
  ) as Record<string, string>
}

export function sanitizeSplineWallCoreAssignmentsForGraph(
  graph: SplineWallGraph,
  assignments: Readonly<Record<string, string>>,
) {
  const groupsBySegmentId = buildCoincidentSegmentGroups(graph)
  const validStructuralIds = new Set(
    Object.keys(graph.segments).map((segmentId) =>
      getStructuralSplineWallSegmentId(groupsBySegmentId.get(segmentId) ?? [segmentId])),
  )

  return Object.fromEntries(
    Object.entries(assignments).filter(([segmentId]) => validStructuralIds.has(segmentId)),
  ) as Record<string, string>
}

export function copySplineWallSegmentAssignments(
  assignments: Readonly<Record<string, string>>,
  fromSegmentId: string,
  toSegmentId: string,
) {
  const nextAssignments = { ...assignments }

  ;(['left', 'right'] as const).forEach((side) => {
    const fromKey = createSplineWallSegmentSideKey(fromSegmentId, side)
    const toKey = createSplineWallSegmentSideKey(toSegmentId, side)
    if (nextAssignments[toKey] || !nextAssignments[fromKey]) {
      return
    }
    nextAssignments[toKey] = nextAssignments[fromKey]!
  })

  return nextAssignments
}

export function copySplineWallStructuralAssignment(
  assignments: Readonly<Record<string, string>>,
  fromStructuralSegmentId: string,
  toStructuralSegmentId: string,
) {
  if (!fromStructuralSegmentId || !toStructuralSegmentId || assignments[toStructuralSegmentId] || !assignments[fromStructuralSegmentId]) {
    return { ...assignments }
  }

  return {
    ...assignments,
    [toStructuralSegmentId]: assignments[fromStructuralSegmentId]!,
  }
}
