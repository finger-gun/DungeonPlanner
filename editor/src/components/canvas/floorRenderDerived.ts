import { getContentPackAssetById } from '../../content-packs/registry'
import type { ContentPackModelTransform } from '../../content-packs/types'
import { cellToWorldPosition, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { getInnerWallOwnerRecord } from '../../store/manualWalls'
import {
  buildFloorRenderPlan,
  type FloorRenderGroup,
  type FloorSurfacePlacement,
} from '../../store/floorSurfaceLayout'
import {
  collectBoundaryWallSegments,
  getInheritedWallAssetIdForWallKey,
  wallKeyToWorldPosition,
  type BoundaryWallSegment,
} from '../../store/wallSegments'
import type { InnerWallRecord, PaintedCells, Room } from '../../store/useDungeonStore'
import type { FloorDerivedBundle } from '../../store/derived/floorDerived'
import { deriveWallCornersFromSegments, type WallCornerInstance } from './wallCornerLayout'
import { getWallSpanInteriorLightDirections } from './wallLighting'

export type RoomWallInstance = {
  key: string
  assetId: string | null
  segmentKeys: string[]
  position: [number, number, number]
  rotation: [number, number, number]
  bakedLightDirection?: [number, number, number]
  bakedLightDirectionSecondary?: [number, number, number]
  objectProps?: Record<string, unknown>
}

export type RoomCornerRenderInstance = WallCornerInstance & {
  assetId: string | null
}

export type FloorReceiverCellInput = {
  cell: GridCell
  cellKey: string
  assetId: string | null
  coveredCellKeys?: string[]
  receiverTransformOverride?: ContentPackModelTransform
}

type BoundaryWallSegmentWithAsset = BoundaryWallSegment & {
  assetId: string | null
}

export type FloorRenderDerivedBundle = {
  floorGroups: FloorRenderGroup[]
  floorSurfaceEntries: FloorSurfacePlacement[]
  visibleFloorReceiverCells: FloorReceiverCellInput[]
  walls: RoomWallInstance[]
  corners: RoomCornerRenderInstance[]
}

export function buildFloorRenderDerivedBundle(derived: FloorDerivedBundle): FloorRenderDerivedBundle {
  const floorRenderPlan = buildFloorRenderPlan(
    derived.visiblePaintedCellRecords,
    derived.data.rooms,
    derived.data.globalFloorAssetId,
    derived.data.floorTileAssetIds,
  )

  return {
    floorGroups: floorRenderPlan.baseGroups as FloorRenderGroup[],
    floorSurfaceEntries: floorRenderPlan.surfacePlacements as FloorSurfacePlacement[],
    visibleFloorReceiverCells: deriveFloorReceiverCells(floorRenderPlan),
    walls: deriveWallInstances(
      derived.visiblePaintedCellRecords,
      derived.data.rooms,
      derived.data.globalWallAssetId,
      derived.data.wallSurfaceAssetIds,
      derived.data.wallSurfaceProps,
      derived.wallOpeningDerivedState.suppressedWallKeys,
      derived.data.innerWalls,
    ),
    corners: deriveVisibleWallCorners(
      derived.visiblePaintedCellRecords,
      derived.data.rooms,
      derived.data.globalWallAssetId,
      derived.data.wallSurfaceAssetIds,
      derived.wallOpeningDerivedState.suppressedWallKeys,
      derived.data.innerWalls,
    ),
  }
}

function deriveFloorReceiverCells(plan: ReturnType<typeof buildFloorRenderPlan>): FloorReceiverCellInput[] {
  return [
    ...plan.baseGroups.flatMap((group) => group.cells.map((cell) => {
      const cellKey = getCellKey(cell)
      return {
        cell,
        cellKey,
        assetId: plan.effectiveAssetIdsByCellKey[cellKey] ?? group.floorAssetId,
      }
    })),
    ...plan.surfacePlacements.map((placement) => ({
      cell: placement.anchorCell,
      cellKey: placement.anchorCellKey,
      assetId: placement.assetId,
      coveredCellKeys: placement.coveredCellKeys,
      receiverTransformOverride: {
        position: [
          placement.position[0] - cellToWorldPosition(placement.anchorCell)[0],
          0,
          placement.position[2] - cellToWorldPosition(placement.anchorCell)[2],
        ],
      },
    })),
  ]
}

function deriveWallInstances(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  wallSurfaceProps: Record<string, Record<string, unknown>>,
  suppressedWallKeys: Set<string>,
  innerWalls: Record<string, InnerWallRecord>,
): RoomWallInstance[] {
  const wallSegments = collectRenderableWallSegments(
    paintedCells,
    rooms,
    globalWallAssetId,
    wallSurfaceAssetIds,
    suppressedWallKeys,
    innerWalls,
  )

  const groups = new Map<string, BoundaryWallSegmentWithAsset[]>()
  wallSegments.forEach((segment) => {
    const [xPart, zPart] = segment.key.split(':')
    const lineKey =
      segment.direction === 'north' || segment.direction === 'south'
        ? `${segment.direction}:${zPart}`
        : `${segment.direction}:${xPart}`
    const groupKey = `${segment.assetId ?? 'none'}|${lineKey}`
    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(segment)
  })

  const walls: RoomWallInstance[] = []
  groups.forEach((segments) => {
    const sorted = [...segments].sort((left, right) => left.index - right.index)
    let runStart = 0

    while (runStart < sorted.length) {
      let runEnd = runStart + 1
      while (runEnd < sorted.length && sorted[runEnd].index === sorted[runEnd - 1].index + 1) {
        runEnd += 1
      }

      const run = sorted.slice(runStart, runEnd)
      const wallSpan = getContentPackAssetById(run[0]?.assetId ?? '')?.metadata?.wallSpan ?? 1
      let offset = 0

      while (offset < run.length) {
        const remaining = run.length - offset
        const span = remaining >= wallSpan ? wallSpan : 1
        const segmentKeys = run.slice(offset, offset + span).map((segment) => segment.key)
        const transform = getWallSpanWorldTransform(segmentKeys)
        if (transform) {
          const interiorDirections = getWallSpanInteriorLightDirections(segmentKeys, paintedCells)
          const persistedProps = segmentKeys[0] ? wallSurfaceProps[segmentKeys[0]] : undefined
          const objectProps =
            wallSpan > 1
              ? { ...(persistedProps ?? {}), span }
              : persistedProps
          walls.push({
            key: segmentKeys.join('|'),
            assetId: run[offset]?.assetId ?? null,
            segmentKeys,
            position: transform.position,
            rotation: transform.rotation,
            bakedLightDirection: interiorDirections.primary,
            bakedLightDirectionSecondary: interiorDirections.secondary,
            ...(objectProps ? { objectProps } : {}),
          })
        }

        offset += span
      }

      runStart = runEnd
    }
  })

  return walls
}

function deriveVisibleWallCorners(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  suppressedWallKeys: Set<string>,
  innerWalls: Record<string, InnerWallRecord>,
): RoomCornerRenderInstance[] {
  const wallSegments = collectRenderableWallSegments(
    paintedCells,
    rooms,
    globalWallAssetId,
    wallSurfaceAssetIds,
    suppressedWallKeys,
    innerWalls,
  )
  const wallAssetIdsByKey = new Map(wallSegments.map((segment) => [segment.key, segment.assetId]))

  return deriveWallCornersFromSegments(wallSegments)
    .flatMap<RoomCornerRenderInstance>((corner) => {
      const assetId =
        corner.wallKeys
          .map((wallKey) => wallAssetIdsByKey.get(wallKey) ?? null)
          .find((candidate) => getContentPackAssetById(candidate ?? '')?.metadata?.wallCornerType === 'solitary') ??
        null

      return assetId ? [{ ...corner, assetId }] : []
    })
}

function collectRenderableWallSegments(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  suppressedWallKeys: Set<string>,
  innerWalls: Record<string, InnerWallRecord>,
) {
  const boundarySegments = collectBoundaryWallSegments(paintedCells, { suppressedWallKeys }).map((segment) => ({
    ...segment,
    assetId:
      wallSurfaceAssetIds[segment.key] ??
      getInheritedWallAssetIdForWallKey(segment.key, paintedCells, rooms, globalWallAssetId),
  }))

  const explicitInnerSegments = Object.keys(innerWalls).flatMap<BoundaryWallSegmentWithAsset>((wallKey) => {
    const ownerRecord = getInnerWallOwnerRecord(wallKey, paintedCells)
    if (!ownerRecord) {
      return []
    }

    const room = ownerRecord.roomId ? rooms[ownerRecord.roomId] : null
    const parts = wallKey.split(':')
    const direction = parts[2] as BoundaryWallSegment['direction']
    const index =
      direction === 'north' || direction === 'south'
        ? ownerRecord.cell[0]
        : ownerRecord.cell[1]

    return [{
      key: wallKey,
      direction,
      index,
      assetId: room?.wallAssetId ?? globalWallAssetId,
    }]
  })

  return [...boundarySegments, ...explicitInnerSegments]
}

function getWallSpanWorldTransform(
  wallKeys: string[],
): { position: [number, number, number]; rotation: [number, number, number] } | null {
  if (wallKeys.length === 0) {
    return null
  }

  const transforms = wallKeys
    .map((wallKey) => wallKeyToWorldPosition(wallKey))
    .filter((transform): transform is NonNullable<ReturnType<typeof wallKeyToWorldPosition>> => Boolean(transform))

  if (transforms.length === 0) {
    return null
  }

  const position = transforms.reduce<[number, number, number]>(
    (accumulator, transform) => [
      accumulator[0] + transform.position[0],
      accumulator[1] + transform.position[1],
      accumulator[2] + transform.position[2],
    ],
    [0, 0, 0],
  )

  return {
    position: [
      position[0] / transforms.length,
      position[1] / transforms.length,
      position[2] / transforms.length,
    ],
    rotation: transforms[0].rotation,
  }
}
