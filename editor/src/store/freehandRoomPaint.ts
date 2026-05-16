import { GRID_SIZE, type GridCell } from '../hooks/useSnapToGrid'
import type { RoomDraftSplineNodeInput } from './roomDraft'

export type FreehandPaintPoint = readonly [number, number]

export type PaintedAreaRoomPreview = {
  points: readonly [number, number][]
  paths: readonly (readonly [number, number][])[]
  cells: GridCell[]
  splineNodes: RoomDraftSplineNodeInput[]
  splinePaths: RoomDraftSplineNodeInput[][]
}

const DEFAULT_BRUSH_RADIUS = GRID_SIZE * 0.55
const SAMPLE_SIZE = GRID_SIZE / 12
const MIN_POINT_SPACING = GRID_SIZE * 0.06
const BOUNDARY_SIMPLIFY_TOLERANCE = GRID_SIZE * 0.055
const BOUNDARY_UNIT_SCALE = 10000
const EPSILON = 1e-5

type SampleCell = readonly [number, number]
type DirectedEdge = {
  start: SampleCell
  end: SampleCell
}

export function buildPaintedAreaRoomPreview(
  strokePoints: readonly FreehandPaintPoint[],
  brushRadius = DEFAULT_BRUSH_RADIUS,
): PaintedAreaRoomPreview | null {
  const points = simplifyStrokePoints(strokePoints)
  if (points.length === 0) {
    return null
  }

  const occupied = rasterizeStroke(points, brushRadius)
  const paths = traceRasterBoundaryPaths(occupied)
    .map(smoothBoundaryPath)
    .filter((path) => path.length >= 3)
    .sort((left, right) => Math.abs(getSignedArea(right)) - Math.abs(getSignedArea(left)))
  if (paths.length === 0) {
    return null
  }

  const cells = dedupeCells([...occupied].map((key) => {
    const [x, z] = parseSampleKey(key)
    return [
      Math.floor(((x + 0.5) * SAMPLE_SIZE) / GRID_SIZE),
      Math.floor(((z + 0.5) * SAMPLE_SIZE) / GRID_SIZE),
    ] as GridCell
  }))
  if (cells.length === 0) {
    return null
  }

  const splinePaths = paths.map(buildSplineNodesFromPath)

  return {
    points: paths[0]!,
    paths,
    cells,
    splineNodes: splinePaths[0]!,
    splinePaths,
  }
}

function simplifyStrokePoints(points: readonly FreehandPaintPoint[]): FreehandPaintPoint[] {
  const simplified: FreehandPaintPoint[] = []
  points.forEach((point) => {
    const previous = simplified.at(-1)
    if (!previous || distanceBetweenPoints(previous, point) >= MIN_POINT_SPACING) {
      simplified.push([point[0], point[1]])
    }
  })
  return simplified
}

function rasterizeStroke(points: readonly FreehandPaintPoint[], radius: number) {
  const occupied = new Set<string>()

  if (points.length === 1) {
    stampBrushSegment(occupied, points[0]!, points[0]!, radius)
    return occupied
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    stampBrushSegment(occupied, points[index]!, points[index + 1]!, radius)
  }

  return occupied
}

function stampBrushSegment(
  occupied: Set<string>,
  start: FreehandPaintPoint,
  end: FreehandPaintPoint,
  radius: number,
) {
  const minX = Math.floor((Math.min(start[0], end[0]) - radius) / SAMPLE_SIZE) - 1
  const maxX = Math.ceil((Math.max(start[0], end[0]) + radius) / SAMPLE_SIZE) + 1
  const minZ = Math.floor((Math.min(start[1], end[1]) - radius) / SAMPLE_SIZE) - 1
  const maxZ = Math.ceil((Math.max(start[1], end[1]) + radius) / SAMPLE_SIZE) + 1

  for (let z = minZ; z <= maxZ; z += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const sample: FreehandPaintPoint = [(x + 0.5) * SAMPLE_SIZE, (z + 0.5) * SAMPLE_SIZE]
      if (distanceToSegment(sample, start, end) <= radius) {
        occupied.add(getSampleKey([x, z]))
      }
    }
  }
}

function traceRasterBoundaryPaths(occupied: ReadonlySet<string>): [number, number][][] {
  const edges: DirectedEdge[] = []
  occupied.forEach((key) => {
    const [x, z] = parseSampleKey(key)
    if (!occupied.has(getSampleKey([x, z + 1]))) {
      edges.push({ start: [x, z + 1], end: [x + 1, z + 1] })
    }
    if (!occupied.has(getSampleKey([x + 1, z]))) {
      edges.push({ start: [x + 1, z + 1], end: [x + 1, z] })
    }
    if (!occupied.has(getSampleKey([x, z - 1]))) {
      edges.push({ start: [x + 1, z], end: [x, z] })
    }
    if (!occupied.has(getSampleKey([x - 1, z]))) {
      edges.push({ start: [x, z], end: [x, z + 1] })
    }
  })

  const edgesByStart = new Map<string, DirectedEdge[]>()
  edges.forEach((edge) => {
    const key = getSampleKey(edge.start)
    edgesByStart.set(key, [...(edgesByStart.get(key) ?? []), edge])
  })

  const used = new Set<string>()
  const paths: [number, number][][] = []
  edges.forEach((edge) => {
    const edgeKey = getEdgeKey(edge)
    if (used.has(edgeKey)) {
      return
    }

    const path: [number, number][] = []
    let current: DirectedEdge | null = edge
    while (current) {
      used.add(getEdgeKey(current))
      path.push(samplePointToWorld(current.start))
      const nextCandidates: DirectedEdge[] = edgesByStart.get(getSampleKey(current.end)) ?? []
      current = nextCandidates.find((candidate) => !used.has(getEdgeKey(candidate))) ?? null
      if (current && pointsEqual(current.start, edge.start)) {
        break
      }
    }

    if (path.length >= 3) {
      paths.push(path)
    }
  })

  return paths
}

function simplifyBoundaryPath(path: readonly [number, number][]): [number, number][] {
  const simplified: [number, number][] = []
  path.forEach((point) => {
    simplified.push(point)
    while (simplified.length >= 3) {
      const a = simplified.at(-3)!
      const b = simplified.at(-2)!
      const c = simplified.at(-1)!
      if (Math.abs(cross2D(subtractPoints(b, a), subtractPoints(c, b))) > EPSILON) {
        break
      }
      simplified.splice(simplified.length - 2, 1)
    }
  })
  return simplified
}

function smoothBoundaryPath(path: readonly [number, number][]): [number, number][] {
  const simplified = simplifyBoundaryPath(path)
  if (simplified.length <= 4) {
    return simplified
  }

  const rounded = chaikinClosedPath(simplified)
  const reduced = simplifyClosedPath(rounded, BOUNDARY_SIMPLIFY_TOLERANCE)
  return reduced.length >= 3 ? reduced : simplified
}

function chaikinClosedPath(path: readonly [number, number][]): [number, number][] {
  const smoothed: [number, number][] = []
  for (let index = 0; index < path.length; index += 1) {
    const point = path[index]!
    const next = path[(index + 1) % path.length]!
    smoothed.push([
      point[0] * 0.75 + next[0] * 0.25,
      point[1] * 0.75 + next[1] * 0.25,
    ])
    smoothed.push([
      point[0] * 0.25 + next[0] * 0.75,
      point[1] * 0.25 + next[1] * 0.75,
    ])
  }
  return smoothed
}

function simplifyClosedPath(path: readonly [number, number][], tolerance: number): [number, number][] {
  if (path.length <= 3) {
    return [...path]
  }

  const anchorIndex = path.reduce((bestIndex, point, index) => {
    const best = path[bestIndex]!
    return point[0] < best[0] || (point[0] === best[0] && point[1] < best[1])
      ? index
      : bestIndex
  }, 0)
  const rotated = [...path.slice(anchorIndex), ...path.slice(0, anchorIndex)]
  const openPath = [...rotated, rotated[0]!]
  const simplified = simplifyOpenPath(openPath, tolerance)
  if (simplified.length > 1 && distanceBetweenPoints(simplified[0]!, simplified.at(-1)!) <= EPSILON) {
    simplified.pop()
  }
  return simplified
}

function simplifyOpenPath(path: readonly [number, number][], tolerance: number): [number, number][] {
  if (path.length <= 2) {
    return [...path]
  }

  let maxDistance = 0
  let splitIndex = 0
  const start = path[0]!
  const end = path.at(-1)!
  for (let index = 1; index < path.length - 1; index += 1) {
    const distance = distanceToSegment(path[index]!, start, end)
    if (distance > maxDistance) {
      maxDistance = distance
      splitIndex = index
    }
  }

  if (maxDistance <= tolerance) {
    return [start, end]
  }

  const left = simplifyOpenPath(path.slice(0, splitIndex + 1), tolerance)
  const right = simplifyOpenPath(path.slice(splitIndex), tolerance)
  return [...left.slice(0, -1), ...right]
}

function buildSplineNodesFromPath(path: readonly [number, number][]): RoomDraftSplineNodeInput[] {
  return path.map((point) => ({
    position: [
      roundBoundaryUnit(point[0] / GRID_SIZE),
      roundBoundaryUnit(point[1] / GRID_SIZE),
    ],
    cornerMode: 'square',
    cornerAmount: 0,
  }))
}

function dedupeCells(cells: readonly GridCell[]): GridCell[] {
  return [...new Map(cells.map((cell) => [`${cell[0]}:${cell[1]}`, cell])).values()]
}

function samplePointToWorld(point: SampleCell): [number, number] {
  return [point[0] * SAMPLE_SIZE, point[1] * SAMPLE_SIZE]
}

function getSignedArea(points: readonly [number, number][]) {
  let area = 0
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]!
    const next = points[(index + 1) % points.length]!
    area += point[0] * next[1] - next[0] * point[1]
  }
  return area / 2
}

function distanceToSegment(point: FreehandPaintPoint, start: FreehandPaintPoint, end: FreehandPaintPoint) {
  const segment = subtractPoints(end, start)
  const lengthSquared = segment[0] * segment[0] + segment[1] * segment[1]
  if (lengthSquared <= EPSILON) {
    return distanceBetweenPoints(point, start)
  }
  const ratio = Math.max(0, Math.min(1, dot2D(subtractPoints(point, start), segment) / lengthSquared))
  return distanceBetweenPoints(point, [
    start[0] + segment[0] * ratio,
    start[1] + segment[1] * ratio,
  ])
}

function subtractPoints(a: FreehandPaintPoint, b: FreehandPaintPoint): FreehandPaintPoint {
  return [a[0] - b[0], a[1] - b[1]]
}

function dot2D(a: FreehandPaintPoint, b: FreehandPaintPoint) {
  return a[0] * b[0] + a[1] * b[1]
}

function cross2D(a: FreehandPaintPoint, b: FreehandPaintPoint) {
  return a[0] * b[1] - a[1] * b[0]
}

function pointsEqual(a: SampleCell, b: SampleCell) {
  return a[0] === b[0] && a[1] === b[1]
}

function distanceBetweenPoints(a: FreehandPaintPoint, b: FreehandPaintPoint) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function getSampleKey(point: SampleCell) {
  return `${point[0]}:${point[1]}`
}

function getEdgeKey(edge: DirectedEdge) {
  return `${getSampleKey(edge.start)}>${getSampleKey(edge.end)}`
}

function parseSampleKey(key: string): SampleCell {
  const [x, z] = key.split(':').map(Number) as [number, number]
  return [x, z]
}

function roundBoundaryUnit(value: number) {
  return Math.round(value * BOUNDARY_UNIT_SCALE) / BOUNDARY_UNIT_SCALE
}
