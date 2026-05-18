import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { GRID_SIZE, cellToWorldPosition, type GridCell } from '../../hooks/useSnapToGrid'
import type { Layer, PaintedCellRecord } from '../../store/useDungeonStore'
import type { SplineWallGraph } from '../../store/splineWallGraph'
import { createSplineWallQueryCache } from '../../store/splineWallQueries'
import { buildSplineWallMaskPathFromGraph, type SplineMaskWorldPoint } from '../../store/splineWalls'

const DEFAULT_MASK_Y = 0.001
const HALF_GRID_SIZE = GRID_SIZE * 0.5

export type RoomFloorMaskPolygon = {
  key: string
  points: readonly SplineMaskWorldPoint[]
}

export type RoomFloorMaskData = {
  legacyCells: GridCell[]
  polygons: RoomFloorMaskPolygon[]
}

export function buildPreviewRoomFloorMaskData(
  cells: readonly GridCell[],
  paths: readonly (readonly (readonly [number, number])[])[],
): RoomFloorMaskData {
  if (paths.length > 0) {
    return {
      legacyCells: [],
      polygons: paths.map((points, index) => ({
        key: `preview:${index}`,
        points,
      })),
    }
  }

  return {
    legacyCells: cells.map((cell) => [cell[0], cell[1]] as GridCell),
    polygons: [],
  }
}

export function filterCellsToRoomFloorMask(
  cells: readonly GridCell[],
  maskData: RoomFloorMaskData,
): GridCell[] {
  if (maskData.polygons.length === 0) {
    const legacyCellKeys = new Set(maskData.legacyCells.map(getMaskCellKey))
    return cells.filter((cell) => legacyCellKeys.has(getMaskCellKey(cell)))
  }

  return cells.filter((cell) => doesCellOverlapRoomFloorMask(cell, maskData))
}

export function buildRoomFloorMaskData({
  paintedCellRecords,
  layers,
  splineWallGraph,
}: {
  paintedCellRecords: readonly PaintedCellRecord[]
  layers: Record<string, Layer>
  splineWallGraph: SplineWallGraph | null | undefined
}): RoomFloorMaskData {
  const visibleLayerIds = new Set(
    Object.values(layers)
      .filter((layer) => layer.visible !== false)
      .map((layer) => layer.id),
  )

  const polygons: RoomFloorMaskPolygon[] = splineWallGraph
    ? Object.values(splineWallGraph.paths)
      .filter((path) => path.closed && visibleLayerIds.has(path.layerId))
      .flatMap((path) => {
        const points = buildSplineWallMaskPathFromGraph(path, splineWallGraph)
        if (points.length < 3) {
          return []
        }
        return [{
          key: path.id,
          points,
        }]
      })
    : []

  const graphRoomIds = new Set(
    polygons
      .map((polygon) => splineWallGraph?.paths[polygon.key]?.roomId)
      .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
  )

  return {
    legacyCells: paintedCellRecords
      .filter((record) => !record.roomId || !graphRoomIds.has(record.roomId))
      .map((record) => record.cell),
    polygons,
  }
}

export function buildRoomFloorMaskDataByRoomId({
  paintedCellRecords,
  layers,
  splineWallGraph,
}: {
  paintedCellRecords: readonly PaintedCellRecord[]
  layers: Record<string, Layer>
  splineWallGraph: SplineWallGraph | null | undefined
}) {
  const visibleLayerIds = new Set(
    Object.values(layers)
      .filter((layer) => layer.visible !== false)
      .map((layer) => layer.id),
  )
  const visibleRoomCellRecords = paintedCellRecords
    .filter((record) => visibleLayerIds.has(record.layerId))
    .filter((record): record is PaintedCellRecord & { roomId: string } =>
      typeof record.roomId === 'string' && record.roomId.length > 0)
  const roomIds = new Set(
    visibleRoomCellRecords.map((record) => record.roomId),
  )
  if (roomIds.size === 0) {
    return {} as Record<string, RoomFloorMaskData>
  }

  const maskDataByRoomId: Record<string, RoomFloorMaskData> = {}

  if (splineWallGraph) {
    const roomQueryCache = createSplineWallQueryCache(splineWallGraph, {
      visibleLayerIds,
      roomIds,
    })

    Object.entries(roomQueryCache.rooms).forEach(([roomId, room]) => {
      const polygons = room.polygons
        .filter((polygon) => polygon.length >= 3)
        .map((points, index) => ({
          key: `${roomId}:${index}`,
          points,
        }))

      if (polygons.length > 0) {
        maskDataByRoomId[roomId] = {
          legacyCells: [],
          polygons,
        }
      }
    })
  }

  visibleRoomCellRecords.forEach((record) => {
    const roomMask = maskDataByRoomId[record.roomId]
    if (roomMask?.polygons.length) {
      return
    }

    if (!roomMask) {
      maskDataByRoomId[record.roomId] = {
        legacyCells: [record.cell],
        polygons: [],
      }
      return
    }

    roomMask.legacyCells.push(record.cell)
  })

  return maskDataByRoomId
}

export function buildRoomFloorMaskGeometry(
  maskData: RoomFloorMaskData,
  y: number = DEFAULT_MASK_Y,
) {
  const geometries: THREE.BufferGeometry[] = []

  maskData.legacyCells.forEach((cell) => {
    const geometry = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE)
    geometry.rotateX(Math.PI / 2)
    const [x, worldY, z] = cellToWorldPosition(cell)
    geometry.translate(x, worldY + y, z)
    geometries.push(geometry)
  })

  maskData.polygons.forEach((polygon) => {
    const shape = new THREE.Shape()
    polygon.points.forEach((point, index) => {
      if (index === 0) {
        shape.moveTo(point[0], point[1])
        return
      }
      shape.lineTo(point[0], point[1])
    })

    const geometry = new THREE.ShapeGeometry(shape)
    geometry.rotateX(Math.PI / 2)
    geometry.translate(0, y, 0)
    geometries.push(geometry)
  })

  if (geometries.length === 0) {
    return null
  }

  const merged = mergeGeometries(geometries, false)
  geometries.forEach((geometry) => geometry.dispose())
  return merged
}

function doesCellOverlapRoomFloorMask(cell: GridCell, maskData: RoomFloorMaskData) {
  if (maskData.legacyCells.some((candidate) => candidate[0] === cell[0] && candidate[1] === cell[1])) {
    return true
  }

  const rect = getCellWorldRect(cell)
  return maskData.polygons.some((polygon) => doesPolygonOverlapRect(polygon.points, rect))
}

function getCellWorldRect(cell: GridCell) {
  const [worldX, , worldZ] = cellToWorldPosition(cell)
  return {
    minX: worldX - HALF_GRID_SIZE,
    maxX: worldX + HALF_GRID_SIZE,
    minZ: worldZ - HALF_GRID_SIZE,
    maxZ: worldZ + HALF_GRID_SIZE,
  }
}

function doesPolygonOverlapRect(
  polygon: readonly SplineMaskWorldPoint[],
  rect: ReturnType<typeof getCellWorldRect>,
) {
  if (polygon.length < 3) {
    return false
  }

  const center = [
    (rect.minX + rect.maxX) / 2,
    (rect.minZ + rect.maxZ) / 2,
  ] as const
  if (isPointInPolygon(center, polygon)) {
    return true
  }

  const corners = getRectCorners(rect)
  if (corners.some((corner) => isPointInPolygon(corner, polygon) || isPointOnPolygonBoundary(corner, polygon))) {
    return true
  }

  if (polygon.some((point) => isPointInsideRect(point, rect))) {
    return true
  }

  const edges = getRectEdges(rect)
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]!
    const end = polygon[(index + 1) % polygon.length]!
    if (edges.some(([edgeStart, edgeEnd]) => doSegmentsIntersect(start, end, edgeStart, edgeEnd))) {
      return true
    }
  }

  return false
}

function getRectCorners(rect: ReturnType<typeof getCellWorldRect>) {
  return [
    [rect.minX, rect.minZ],
    [rect.maxX, rect.minZ],
    [rect.maxX, rect.maxZ],
    [rect.minX, rect.maxZ],
  ] as const
}

function getRectEdges(rect: ReturnType<typeof getCellWorldRect>) {
  const corners = getRectCorners(rect)
  return [
    [corners[0], corners[1]],
    [corners[1], corners[2]],
    [corners[2], corners[3]],
    [corners[3], corners[0]],
  ] as const
}

function isPointInsideRect(
  point: readonly [number, number],
  rect: ReturnType<typeof getCellWorldRect>,
) {
  return point[0] >= rect.minX
    && point[0] <= rect.maxX
    && point[1] >= rect.minZ
    && point[1] <= rect.maxZ
}

function isPointInPolygon(
  point: readonly [number, number],
  polygon: readonly SplineMaskWorldPoint[],
) {
  if (polygon.length < 3) {
    return false
  }

  if (isPointOnPolygonBoundary(point, polygon)) {
    return true
  }

  let inside = false
  for (let index = 0, previousIndex = polygon.length - 1; index < polygon.length; previousIndex = index, index += 1) {
    const current = polygon[index]!
    const previous = polygon[previousIndex]!
    const crosses = ((current[1] > point[1]) !== (previous[1] > point[1]))
      && (point[0] < ((previous[0] - current[0]) * (point[1] - current[1])) / ((previous[1] - current[1]) || Number.EPSILON) + current[0])
    if (crosses) {
      inside = !inside
    }
  }
  return inside
}

function isPointOnPolygonBoundary(
  point: readonly [number, number],
  polygon: readonly SplineMaskWorldPoint[],
) {
  for (let index = 0; index < polygon.length; index += 1) {
    if (isPointOnSegment(point, polygon[index]!, polygon[(index + 1) % polygon.length]!)) {
      return true
    }
  }
  return false
}

function isPointOnSegment(
  point: readonly [number, number],
  start: readonly [number, number],
  end: readonly [number, number],
) {
  const cross = (point[1] - start[1]) * (end[0] - start[0]) - (point[0] - start[0]) * (end[1] - start[1])
  if (Math.abs(cross) > 1e-6) {
    return false
  }

  const dot = (point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1])
  if (dot < -1e-6) {
    return false
  }

  const lengthSquared = ((end[0] - start[0]) ** 2) + ((end[1] - start[1]) ** 2)
  return dot <= lengthSquared + 1e-6
}

function doSegmentsIntersect(
  aStart: readonly [number, number],
  aEnd: readonly [number, number],
  bStart: readonly [number, number],
  bEnd: readonly [number, number],
) {
  const orientationA = segmentOrientation(aStart, aEnd, bStart)
  const orientationB = segmentOrientation(aStart, aEnd, bEnd)
  const orientationC = segmentOrientation(bStart, bEnd, aStart)
  const orientationD = segmentOrientation(bStart, bEnd, aEnd)

  if (orientationA !== orientationB && orientationC !== orientationD) {
    return true
  }

  return (orientationA === 0 && isPointOnSegment(bStart, aStart, aEnd))
    || (orientationB === 0 && isPointOnSegment(bEnd, aStart, aEnd))
    || (orientationC === 0 && isPointOnSegment(aStart, bStart, bEnd))
    || (orientationD === 0 && isPointOnSegment(aEnd, bStart, bEnd))
}

function segmentOrientation(
  a: readonly [number, number],
  b: readonly [number, number],
  c: readonly [number, number],
) {
  const value = (b[1] - a[1]) * (c[0] - b[0]) - (b[0] - a[0]) * (c[1] - b[1])
  if (Math.abs(value) <= 1e-6) {
    return 0
  }
  return value > 0 ? 1 : 2
}

function getMaskCellKey(cell: GridCell) {
  return `${cell[0]}:${cell[1]}`
}
