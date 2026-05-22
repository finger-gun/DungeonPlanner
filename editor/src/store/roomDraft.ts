import { GRID_SIZE, type GridCell } from '../hooks/useSnapToGrid'
import type { RoomBounds, RoomResizeCorner, RoomResizeEdge } from './roomResize'

export type RoomDraftCornerMode = 'square' | 'rounded' | 'diagonal'

export type RoomDraftCornerState = {
  mode: RoomDraftCornerMode
  amount: number
}

export type RoomDraftState = {
  bounds: RoomBounds
  corners: Record<RoomResizeCorner, RoomDraftCornerState>
  originCell: GridCell
}

export type RoomDraftSplineNodeInput = {
  position: [number, number]
  cornerMode: RoomDraftCornerMode
  cornerAmount: number
}

type Point2 = readonly [number, number]
type RoomDraftCornerEntry = {
  kind: RoomDraftCornerMode
  start: Point2
  control: Point2
  end: Point2
}
type Rect2 = {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

const ROOM_DRAFT_CORNER_ORDER: RoomResizeCorner[] = ['nw', 'ne', 'se', 'sw']
const ROOM_DRAFT_CURVE_SUBDIVISIONS = 8
const ROOM_DRAFT_EPSILON = 1e-5

export function createRoomDraft(bounds: RoomBounds, originCell: GridCell): RoomDraftState {
  return {
    bounds,
    originCell: [...originCell] as GridCell,
    corners: {
      nw: { mode: 'square', amount: 0 },
      ne: { mode: 'square', amount: 0 },
      se: { mode: 'square', amount: 0 },
      sw: { mode: 'square', amount: 0 },
    },
  }
}

export function createRoomDraftFromStroke(startCell: GridCell, endCell: GridCell): RoomDraftState {
  return createRoomDraft(normalizeRoomDraftBounds(startCell, endCell), startCell)
}

export function createRoomDraftFromSplineNodes(
  nodes: readonly RoomDraftSplineNodeInput[],
): RoomDraftState | null {
  if (nodes.length !== ROOM_DRAFT_CORNER_ORDER.length) {
    return null
  }

  const bounds = getRoomDraftBoundsFromSplineNodes(nodes)
  const boundaryEntries = ROOM_DRAFT_CORNER_ORDER.map((corner) => ({
    corner,
    position: getRoomDraftCornerBoundary(bounds, corner),
  }))

  const assignments = new Map<RoomResizeCorner, RoomDraftSplineNodeInput>()
  for (const node of nodes) {
    let bestCorner: RoomResizeCorner | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    boundaryEntries.forEach(({ corner, position }) => {
      if (assignments.has(corner)) {
        return
      }

      const distance = Math.hypot(
        node.position[0] - position[0],
        node.position[1] - position[1],
      )
      if (distance < bestDistance) {
        bestCorner = corner
        bestDistance = distance
      }
    })

    if (!bestCorner || bestDistance > ROOM_DRAFT_EPSILON) {
      return null
    }
    assignments.set(bestCorner, node)
  }
  if (assignments.size !== ROOM_DRAFT_CORNER_ORDER.length) {
    return null
  }

  const originCell: GridCell = [bounds.minX, bounds.minZ]
  let draft = createRoomDraft(bounds, originCell)
  ROOM_DRAFT_CORNER_ORDER.forEach((corner) => {
    const node = assignments.get(corner)!
    draft = setRoomDraftCorner(draft, corner, node.cornerMode, node.cornerAmount)
  })
  return draft
}

function getRoomDraftBoundsFromSplineNodes(nodes: readonly RoomDraftSplineNodeInput[]): RoomBounds {
  const xs = nodes.map((node) => node.position[0])
  const zs = nodes.map((node) => node.position[1])
  return {
    minX: Math.round(Math.min(...xs)),
    maxX: Math.round(Math.max(...xs) - 1),
    minZ: Math.round(Math.min(...zs)),
    maxZ: Math.round(Math.max(...zs) - 1),
  }
}

export function normalizeRoomDraftBounds(startCell: GridCell, endCell: GridCell): RoomBounds {
  return {
    minX: Math.min(startCell[0], endCell[0]),
    maxX: Math.max(startCell[0], endCell[0]),
    minZ: Math.min(startCell[1], endCell[1]),
    maxZ: Math.max(startCell[1], endCell[1]),
  }
}

export function setRoomDraftBounds(draft: RoomDraftState, bounds: RoomBounds): RoomDraftState {
  return {
    ...draft,
    bounds,
    corners: Object.fromEntries(
      ROOM_DRAFT_CORNER_ORDER.map((corner) => {
        const state = draft.corners[corner]
        const amount = clampRoomDraftCornerAmount(bounds, state.amount)
        return [
          corner,
          {
            mode: amount <= ROOM_DRAFT_EPSILON ? 'square' : state.mode,
            amount,
          } satisfies RoomDraftCornerState,
        ]
      }),
    ) as RoomDraftState['corners'],
  }
}

export function setRoomDraftCorner(
  draft: RoomDraftState,
  corner: RoomResizeCorner,
  mode: RoomDraftCornerMode,
  amount: number,
): RoomDraftState {
  const clampedAmount = clampRoomDraftCornerAmount(draft.bounds, amount)
  return {
    ...draft,
    corners: {
      ...draft.corners,
      [corner]: {
        mode: clampedAmount <= ROOM_DRAFT_EPSILON ? 'square' : mode,
        amount: roundRoomDraftAmount(clampedAmount),
      },
    },
  }
}

export function getRoomDraftCenterWorldPosition(draft: RoomDraftState): [number, number, number] {
  return [
    ((draft.bounds.minX + draft.bounds.maxX + 1) * GRID_SIZE) / 2,
    0,
    ((draft.bounds.minZ + draft.bounds.maxZ + 1) * GRID_SIZE) / 2,
  ]
}

export function getRoomDraftCornerWorldPosition(
  draft: RoomDraftState,
  corner: RoomResizeCorner,
): [number, number, number] {
  const [boundaryX, boundaryZ] = getRoomDraftCornerBoundary(draft.bounds, corner)
  return [boundaryX * GRID_SIZE, 0, boundaryZ * GRID_SIZE]
}

export function getRoomDraftEdgeWorldPosition(
  draft: RoomDraftState,
  edge: RoomResizeEdge,
): [number, number, number] {
  const entries = getRoomDraftCornerEntries(draft)
  switch (edge) {
    case 'north':
      return getRoomDraftWorldMidpoint(entries.nw.end, entries.ne.start)
    case 'south':
      return getRoomDraftWorldMidpoint(entries.se.end, entries.sw.start)
    case 'east':
      return getRoomDraftWorldMidpoint(entries.ne.end, entries.se.start)
    case 'west':
      return getRoomDraftWorldMidpoint(entries.sw.end, entries.nw.start)
  }
}

export function getRoomDraftCornerAmountFromWorldPoint(
  bounds: RoomBounds,
  corner: RoomResizeCorner,
  point: { x: number; z: number },
): number {
  const [boundaryX, boundaryZ] = getRoomDraftCornerBoundary(bounds, corner)
  const pointX = point.x / GRID_SIZE
  const pointZ = point.z / GRID_SIZE

  let rawAmount = 0
  switch (corner) {
    case 'nw':
      rawAmount = Math.min(pointX - boundaryX, boundaryZ - pointZ)
      break
    case 'ne':
      rawAmount = Math.min(boundaryX - pointX, boundaryZ - pointZ)
      break
    case 'se':
      rawAmount = Math.min(boundaryX - pointX, pointZ - boundaryZ)
      break
    case 'sw':
      rawAmount = Math.min(pointX - boundaryX, pointZ - boundaryZ)
      break
  }

  return roundRoomDraftAmount(clampRoomDraftCornerAmount(bounds, rawAmount))
}

export function buildRoomDraftWorldPoints(
  draft: RoomDraftState,
  curveSubdivisions = ROOM_DRAFT_CURVE_SUBDIVISIONS,
): Point2[] {
  return buildRoomDraftPoints(draft, curveSubdivisions).map((point) => [
    point[0] * GRID_SIZE,
    point[1] * GRID_SIZE,
  ])
}

export function buildRoomDraftCells(draft: RoomDraftState): GridCell[] {
  const polygon = buildRoomDraftPoints(draft, ROOM_DRAFT_CURVE_SUBDIVISIONS * 2)
  const cells: GridCell[] = []

  for (let z = draft.bounds.minZ; z <= draft.bounds.maxZ; z += 1) {
    for (let x = draft.bounds.minX; x <= draft.bounds.maxX; x += 1) {
      if (doesPolygonCoverCell(polygon, {
        minX: x,
        maxX: x + 1,
        minY: z,
        maxY: z + 1,
      })) {
        cells.push([x, z])
      }
    }
  }

  return cells
}

export function buildRoomDraftSplineNodes(draft: RoomDraftState): RoomDraftSplineNodeInput[] {
  return ROOM_DRAFT_CORNER_ORDER.map((corner) => {
    const [x, z] = getRoomDraftCornerBoundary(draft.bounds, corner)
    const cornerState = draft.corners[corner]
    return {
      position: [x, z],
      cornerMode: cornerState.mode,
      cornerAmount: clampRoomDraftCornerAmount(draft.bounds, cornerState.amount),
    }
  })
}

function clampRoomDraftCornerAmount(bounds: RoomBounds, amount: number) {
  const width = bounds.maxX - bounds.minX + 1
  const height = bounds.maxZ - bounds.minZ + 1
  const maxAmount = Math.max(Math.min(width, height) / 2, 0)
  return Math.min(Math.max(amount, 0), maxAmount)
}

function roundRoomDraftAmount(amount: number) {
  return Math.round(amount * 4) / 4
}

function getRoomDraftCornerBoundary(bounds: RoomBounds, corner: RoomResizeCorner): Point2 {
  switch (corner) {
    case 'nw':
      return [bounds.minX, bounds.maxZ + 1]
    case 'ne':
      return [bounds.maxX + 1, bounds.maxZ + 1]
    case 'se':
      return [bounds.maxX + 1, bounds.minZ]
    case 'sw':
      return [bounds.minX, bounds.minZ]
  }
}

function buildRoomDraftPoints(
  draft: RoomDraftState,
  curveSubdivisions: number,
): Point2[] {
  const sampled: Point2[] = []
  const cornerEntries = getRoomDraftCornerEntries(draft)
  const entries = ROOM_DRAFT_CORNER_ORDER.map((corner) => cornerEntries[corner])

  entries.forEach((entry) => {
    appendUniquePoint(sampled, entry.start)
    if (entry.kind === 'rounded') {
      appendQuadraticCurvePoints(sampled, entry.start, entry.control, entry.end, curveSubdivisions)
      return
    }
    if (entry.kind === 'diagonal') {
      appendUniquePoint(sampled, entry.end)
      return
    }
    appendUniquePoint(sampled, entry.control)
  })

  if (
    sampled.length > 1
    && distanceBetweenPoints(sampled[0]!, sampled.at(-1)!) <= ROOM_DRAFT_EPSILON
  ) {
    sampled.pop()
  }

  return sampled
}

function getRoomDraftCornerEntries(draft: RoomDraftState): Record<RoomResizeCorner, RoomDraftCornerEntry> {
  return {
    nw: buildCornerEntry(draft, 'nw'),
    ne: buildCornerEntry(draft, 'ne'),
    se: buildCornerEntry(draft, 'se'),
    sw: buildCornerEntry(draft, 'sw'),
  }
}

function buildCornerEntry(draft: RoomDraftState, corner: RoomResizeCorner): RoomDraftCornerEntry {
  const control = getRoomDraftCornerBoundary(draft.bounds, corner)
  const state = draft.corners[corner]
  const amount = clampRoomDraftCornerAmount(draft.bounds, state.amount)

  if (state.mode === 'square' || amount <= ROOM_DRAFT_EPSILON) {
    return {
      kind: 'square' as const,
      start: control,
      control,
      end: control,
    }
  }

  switch (corner) {
    case 'nw':
      return {
        kind: state.mode,
        start: [control[0], control[1] - amount] as Point2,
        control,
        end: [control[0] + amount, control[1]] as Point2,
      }
    case 'ne':
      return {
        kind: state.mode,
        start: [control[0] - amount, control[1]] as Point2,
        control,
        end: [control[0], control[1] - amount] as Point2,
      }
    case 'se':
      return {
        kind: state.mode,
        start: [control[0], control[1] + amount] as Point2,
        control,
        end: [control[0] - amount, control[1]] as Point2,
      }
    case 'sw':
      return {
        kind: state.mode,
        start: [control[0] + amount, control[1]] as Point2,
        control,
        end: [control[0], control[1] + amount] as Point2,
      }
  }
}

function getRoomDraftWorldMidpoint(start: Point2, end: Point2): [number, number, number] {
  return [
    ((start[0] + end[0]) * GRID_SIZE) / 2,
    0,
    ((start[1] + end[1]) * GRID_SIZE) / 2,
  ]
}

function appendQuadraticCurvePoints(
  sampled: Point2[],
  start: Point2,
  control: Point2,
  end: Point2,
  subdivisions: number,
) {
  for (let step = 1; step <= subdivisions; step += 1) {
    const t = step / Math.max(subdivisions, 1)
    const oneMinusT = 1 - t
    appendUniquePoint(sampled, [
      oneMinusT * oneMinusT * start[0] + 2 * oneMinusT * t * control[0] + t * t * end[0],
      oneMinusT * oneMinusT * start[1] + 2 * oneMinusT * t * control[1] + t * t * end[1],
    ])
  }
}

function appendUniquePoint(points: Point2[], point: Point2) {
  const previous = points.at(-1)
  if (previous && distanceBetweenPoints(previous, point) <= ROOM_DRAFT_EPSILON) {
    return
  }
  points.push(point)
}

function isPointInsidePolygon(point: Point2, polygon: readonly Point2[]) {
  if (polygon.length < 3) {
    return false
  }

  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    if (isPointOnSegment(point, polygon[previousIndex]!, polygon[index]!)) {
      return false
    }
  }

  let inside = false
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index]!
    const previous = polygon[previousIndex]!
    const intersects = ((current[1] > point[1]) !== (previous[1] > point[1]))
      && (point[0] < ((previous[0] - current[0]) * (point[1] - current[1])) / ((previous[1] - current[1]) || ROOM_DRAFT_EPSILON) + current[0])
    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

function distanceBetweenPoints(left: Point2, right: Point2) {
  return Math.hypot(left[0] - right[0], left[1] - right[1])
}

function isPointOnSegment(point: Point2, start: Point2, end: Point2) {
  const segmentLength = distanceBetweenPoints(start, end)
  if (segmentLength <= ROOM_DRAFT_EPSILON) {
    return distanceBetweenPoints(point, start) <= ROOM_DRAFT_EPSILON
  }

  const cross = (point[0] - start[0]) * (end[1] - start[1]) - (point[1] - start[1]) * (end[0] - start[0])
  if (Math.abs(cross) > ROOM_DRAFT_EPSILON) {
    return false
  }

  const dot = (point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])
  if (dot < ROOM_DRAFT_EPSILON) {
    return false
  }

  return dot < segmentLength * segmentLength - ROOM_DRAFT_EPSILON
}

function doesPolygonCoverCell(polygon: readonly Point2[], rect: Rect2) {
  if (polygon.length < 3) {
    return false
  }

  const center: Point2 = [
    (rect.minX + rect.maxX) / 2,
    (rect.minY + rect.maxY) / 2,
  ]
  if (isPointInsidePolygon(center, polygon)) {
    return true
  }

  const corners: Point2[] = [
    [rect.minX, rect.minY],
    [rect.maxX, rect.minY],
    [rect.maxX, rect.maxY],
    [rect.minX, rect.maxY],
  ]

  if (corners.some((corner) => isPointInsidePolygon(corner, polygon))) {
    return true
  }

  if (polygon.some((point) => isPointInsideRect(point, rect))) {
    return true
  }

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]!
    const end = polygon[(index + 1) % polygon.length]!
    if (segmentHasInteriorInsideRect(start, end, rect)) {
      return true
    }
  }

  return false
}

function isPointInsideRect(point: Point2, rect: Rect2) {
  return (
    point[0] >= rect.minX - ROOM_DRAFT_EPSILON
    && point[0] <= rect.maxX + ROOM_DRAFT_EPSILON
    && point[1] >= rect.minY - ROOM_DRAFT_EPSILON
    && point[1] <= rect.maxY + ROOM_DRAFT_EPSILON
  )
}

function segmentHasInteriorInsideRect(start: Point2, end: Point2, rect: Rect2) {
  const deltaX = end[0] - start[0]
  const deltaY = end[1] - start[1]
  let minT = 0
  let maxT = 1

  const clip = (p: number, q: number) => {
    if (Math.abs(p) <= ROOM_DRAFT_EPSILON) {
      return q >= -ROOM_DRAFT_EPSILON
    }

    const ratio = q / p
    if (p < 0) {
      if (ratio > maxT) {
        return false
      }
      if (ratio > minT) {
        minT = ratio
      }
      return true
    }

    if (ratio < minT) {
      return false
    }
    if (ratio < maxT) {
      maxT = ratio
    }
    return true
  }

  if (
    !clip(-deltaX, start[0] - rect.minX)
    || !clip(deltaX, rect.maxX - start[0])
    || !clip(-deltaY, start[1] - rect.minY)
    || !clip(deltaY, rect.maxY - start[1])
  ) {
    return false
  }

  return maxT - minT > ROOM_DRAFT_EPSILON
}
