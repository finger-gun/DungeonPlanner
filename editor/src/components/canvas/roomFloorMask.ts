import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { GRID_SIZE, cellToWorldPosition, type GridCell } from '../../hooks/useSnapToGrid'
import type { Layer, PaintedCellRecord } from '../../store/useDungeonStore'
import type { SplineWallGraph } from '../../store/splineWallGraph'
import { buildSplineWallMaskPathFromGraph, type SplineMaskWorldPoint } from '../../store/splineWalls'

const DEFAULT_MASK_Y = 0.001

export type RoomFloorMaskPolygon = {
  key: string
  points: readonly SplineMaskWorldPoint[]
}

export type RoomFloorMaskData = {
  legacyCells: GridCell[]
  polygons: RoomFloorMaskPolygon[]
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
