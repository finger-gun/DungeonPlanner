import { warnIfUsesDeprecatedConnectsTo } from '../../content-packs/deprecations'
import { getMetadataConnectors } from '../../content-packs/connectors'
import { Euler, Plane, Ray, Vector3 } from 'three'
import type { ContentPackAsset, Connector, SnapsTo } from '../../content-packs/types'
import { GRID_SIZE, cellToWorldPosition, getCellKey, type GridCell, snapWorldPointToGrid } from '../../hooks/useSnapToGrid'
import type { PaintedCellRecord } from '../../store/useDungeonStore'
import { isWallBoundary } from '../../store/wallSegments'

export type SnapResult = {
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  cell: GridCell
  cellKey: string
  connector: Connector
  parentObjectId: string | null
  localPosition: readonly [number, number, number] | null
  localRotation: readonly [number, number, number] | null
}

type CursorRay = {
  origin: readonly [number, number, number]
  direction: readonly [number, number, number]
}

type WallSnapPoint = {
  position: readonly [number, number, number]
  normal: readonly [number, number, number]
  direction: 'north' | 'south' | 'east' | 'west'
  supportCell: GridCell
  supportCellKey: string
  distance: number
}

type SurfaceHit = {
  position: readonly [number, number, number]
  objectId: string
  cell: GridCell
}

type SnapCandidate = SnapResult & {
  distance: number
}

const WALL_SURFACE_OFFSET = 0.5

function getAssetConnectors(asset: ContentPackAsset): Connector[] {
  warnIfUsesDeprecatedConnectsTo(asset)
  return getMetadataConnectors(asset.metadata)
}

function rotateConnectorPoint(
  point: readonly [number, number, number],
  rotation: readonly [number, number, number],
): readonly [number, number, number] {
  const rotated = new Vector3(...point).applyEuler(new Euler(...rotation))
  return [rotated.x, rotated.y, rotated.z]
}

function anchorObjectAtPoint(
  anchor: readonly [number, number, number],
  connectorPoint: readonly [number, number, number],
  rotation: readonly [number, number, number],
): readonly [number, number, number] {
  const rotatedConnectorPoint = rotateConnectorPoint(connectorPoint, rotation)
  return [
    anchor[0] - rotatedConnectorPoint[0],
    anchor[1] - rotatedConnectorPoint[1],
    anchor[2] - rotatedConnectorPoint[2],
  ]
}

function getDistance(
  left: readonly [number, number, number],
  right: readonly [number, number, number],
) {
  return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2])
}

function getWallAnchor(
  wall: WallSnapPoint,
  cursorPoint: { x: number; y: number; z: number },
  snapsTo: SnapsTo,
  cursorRay?: CursorRay | null,
): readonly [number, number, number] {
  if (snapsTo === 'GRID') {
    return wall.position
  }

  if (cursorRay) {
    const plane = new Plane().setFromNormalAndCoplanarPoint(
      new Vector3(...wall.normal),
      new Vector3(...wall.position),
    )
    const hit = new Vector3()
    const ray = new Ray(new Vector3(...cursorRay.origin), new Vector3(...cursorRay.direction))

    if (ray.intersectPlane(plane, hit)) {
      return [hit.x, hit.y, hit.z]
    }
  }

  if (wall.direction === 'north' || wall.direction === 'south') {
    return [cursorPoint.x, wall.position[1], wall.position[2]]
  }

  return [wall.position[0], wall.position[1], cursorPoint.z]
}

function calculateWallRotation(
  direction: WallSnapPoint['direction'],
  connectorRotation?: readonly [number, number, number],
): readonly [number, number, number] {
  const baseRotationY =
    direction === 'north'
      ? Math.PI
      : direction === 'south'
        ? 0
        : direction === 'east'
          ? -Math.PI / 2
          : Math.PI / 2

  if (!connectorRotation) {
    return [0, baseRotationY, 0]
  }

  return [
    connectorRotation[0],
    baseRotationY + connectorRotation[1],
    connectorRotation[2],
  ]
}

function findNearbyWalls(
  point: readonly [number, number, number],
  paintedCells: Record<string, PaintedCellRecord>,
): WallSnapPoint[] {
  const walls: WallSnapPoint[] = []
  const [x, , z] = point

  for (const supportCellKey of Object.keys(paintedCells)) {
    const supportCell = paintedCells[supportCellKey]?.cell
    if (!supportCell) {
      continue
    }

    const [cellX, cellZ] = supportCell
    const [centerX, , centerZ] = cellToWorldPosition(supportCell)
    const checks: Array<{
      direction: WallSnapPoint['direction']
      neighbor: GridCell
      position: readonly [number, number, number]
      normal: readonly [number, number, number]
    }> = [
      {
        direction: 'north',
        neighbor: [cellX, cellZ + 1],
        position: [centerX, 0, (cellZ + 1) * GRID_SIZE],
        normal: [0, 0, -1],
      },
      {
        direction: 'south',
        neighbor: [cellX, cellZ - 1],
        position: [centerX, 0, cellZ * GRID_SIZE],
        normal: [0, 0, 1],
      },
      {
        direction: 'east',
        neighbor: [cellX + 1, cellZ],
        position: [(cellX + 1) * GRID_SIZE, 0, centerZ],
        normal: [-1, 0, 0],
      },
      {
        direction: 'west',
        neighbor: [cellX - 1, cellZ],
        position: [cellX * GRID_SIZE, 0, centerZ],
        normal: [1, 0, 0],
      },
    ]

    for (const { direction, neighbor, position, normal } of checks) {
      if (!isWallBoundary(supportCell, neighbor, paintedCells)) {
        continue
      }

      const surfacePosition: readonly [number, number, number] = [
        position[0] + normal[0] * WALL_SURFACE_OFFSET,
        position[1] + normal[1] * WALL_SURFACE_OFFSET,
        position[2] + normal[2] * WALL_SURFACE_OFFSET,
      ]

      walls.push({
        position: surfacePosition,
        normal,
        direction,
        supportCell,
        supportCellKey,
        distance: Math.hypot(x - surfacePosition[0], z - surfacePosition[2]),
      })
    }
  }

  walls.sort((left, right) => left.distance - right.distance)
  return walls
}

function getFloorSelectionAnchor(cursorPoint: { x: number; y: number; z: number }) {
  const snapped = snapWorldPointToGrid(cursorPoint)

  return {
    anchor: cellToWorldPosition(snapped.cell),
    cell: snapped.cell,
    cellKey: snapped.key,
  }
}

function getFloorAnchor(
  cursorPoint: { x: number; y: number; z: number },
  snapsTo: SnapsTo,
): { anchor: readonly [number, number, number]; cell: GridCell; cellKey: string } {
  const snapped = getFloorSelectionAnchor(cursorPoint)

  if (snapsTo === 'GRID') {
    return snapped
  }

  return {
    anchor: [cursorPoint.x, 0, cursorPoint.z],
    cell: snapped.cell,
    cellKey: snapped.cellKey,
  }
}

function getSelectionPoint(
  cursorPoint: { x: number; y: number; z: number },
  surfaceHit: SurfaceHit | null,
): readonly [number, number, number] {
  if (surfaceHit) {
    return surfaceHit.position
  }

  return [cursorPoint.x, 0, cursorPoint.z]
}

function createWallCandidates(
  connectors: Connector[],
  selectionPoint: readonly [number, number, number],
  cursorPoint: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  snapsTo: SnapsTo,
  cursorRay?: CursorRay | null,
): SnapCandidate[] {
  const walls = findNearbyWalls(selectionPoint, paintedCells)

  return connectors
    .filter((connector) => connector.type === 'WALL')
    .flatMap((connector) =>
      walls.map((wall) => {
        const rotation = calculateWallRotation(wall.direction, connector.rotation)
        const finalAnchor = getWallAnchor(wall, cursorPoint, snapsTo, cursorRay)

        return {
          distance: getDistance(wall.position, selectionPoint),
          position: anchorObjectAtPoint(finalAnchor, connector.point, rotation),
          rotation,
          cell: wall.supportCell,
          cellKey: wall.supportCellKey,
          connector,
          parentObjectId: null,
          localPosition: null,
          localRotation: null,
        }
      }),
    )
}

function createSurfaceCandidates(
  connectors: Connector[],
  selectionPoint: readonly [number, number, number],
  surfaceHit: SurfaceHit | null,
): SnapCandidate[] {
  if (!surfaceHit) {
    return []
  }

  return connectors
    .filter((connector) => connector.type === 'SURFACE')
    .map((connector) => {
      const rotation = connector.rotation ?? [0, 0, 0]

      return {
        distance: getDistance(surfaceHit.position, selectionPoint),
        position: anchorObjectAtPoint(surfaceHit.position, connector.point, rotation),
        rotation,
        cell: surfaceHit.cell,
        cellKey: getCellKey(surfaceHit.cell),
        connector,
        parentObjectId: surfaceHit.objectId,
        localPosition: [0, 0, 0],
        localRotation: rotation,
      }
    })
}

function createFloorCandidates(
  connectors: Connector[],
  selectionPoint: readonly [number, number, number],
  cursorPoint: { x: number; y: number; z: number },
  snapsTo: SnapsTo,
): SnapCandidate[] {
  const selectionAnchor = getFloorSelectionAnchor(cursorPoint)
  const finalAnchor = getFloorAnchor(cursorPoint, snapsTo)

  return connectors
    .filter((connector) => connector.type === 'FLOOR')
    .map((connector) => {
      const rotation = connector.rotation ?? [0, 0, 0]

      return {
        distance: getDistance(selectionAnchor.anchor, selectionPoint),
        position: anchorObjectAtPoint(finalAnchor.anchor, connector.point, rotation),
        rotation,
        cell: finalAnchor.cell,
        cellKey: finalAnchor.cellKey,
        connector,
        parentObjectId: null,
        localPosition: null,
        localRotation: null,
      }
    })
}

export function calculatePropSnapPosition(
  asset: ContentPackAsset,
  cursorPoint: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  surfaceHit: SurfaceHit | null,
  cursorRay?: CursorRay | null,
): SnapResult | null {
  const connectors = getAssetConnectors(asset)
  const snapsTo = asset.metadata?.snapsTo ?? 'FREE'
  const selectionPoint = getSelectionPoint(cursorPoint, surfaceHit)
  const candidates = [
    ...createWallCandidates(connectors, selectionPoint, cursorPoint, paintedCells, snapsTo, cursorRay),
    ...createSurfaceCandidates(connectors, selectionPoint, surfaceHit),
    ...createFloorCandidates(connectors, selectionPoint, cursorPoint, snapsTo),
  ]

  if (candidates.length === 0) {
    return null
  }

  candidates.sort((left, right) => left.distance - right.distance)
  const chosen = candidates[0]

  if (!chosen.parentObjectId && !paintedCells[chosen.cellKey]) {
    return null
  }

  return {
    position: chosen.position,
    rotation: chosen.rotation,
    cell: chosen.cell,
    cellKey: chosen.cellKey,
    connector: chosen.connector,
    parentObjectId: chosen.parentObjectId,
    localPosition: chosen.localPosition,
    localRotation: chosen.localRotation,
  }
}
