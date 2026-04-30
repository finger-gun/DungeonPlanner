import type { GridCell } from '../../hooks/useSnapToGrid'
import {
  resolveObjectLightSources,
  type BakedFloorLightFieldBuildInput,
  type ResolvedDungeonLightSource,
} from '../../rendering/dungeonLightField'
import type {
  DungeonObjectRecord,
  InnerWallRecord,
  Layer,
  OpeningRecord,
  PaintedCells,
  Room,
} from '../useDungeonStore'
import {
  buildWallOpeningDerivedState,
  type WallOpeningDerivedState,
} from './wallOpeningDerived'

export type DungeonRoomData = {
  floorId: string
  paintedCells: PaintedCells
  layers: Record<string, Layer>
  rooms: Record<string, Room>
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
  placedObjects: Record<string, DungeonObjectRecord>
  floorTileAssetIds: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  globalFloorAssetId: string | null
  globalWallAssetId: string | null
}

export type FloorDerivedBundle = {
  data: DungeonRoomData
  visiblePaintedCells: GridCell[]
  visiblePaintedCellRecords: PaintedCells
  visibleObjects: DungeonObjectRecord[]
  visibleOpenings: OpeningRecord[]
  staticLightSources: ResolvedDungeonLightSource[]
  topLevelObjects: DungeonObjectRecord[]
  childrenByParent: Record<string, DungeonObjectRecord[]>
  bakedLightBuildInput: BakedFloorLightFieldBuildInput
  wallOpeningDerivedState: WallOpeningDerivedState
}

export function buildFloorDerivedBundle(data: DungeonRoomData): FloorDerivedBundle {
  const visiblePaintedCells: GridCell[] = []
  const visiblePaintedCellRecords: PaintedCells = {}

  for (const [cellKey, record] of Object.entries(data.paintedCells)) {
    if (data.layers[record.layerId]?.visible === false) {
      continue
    }

    visiblePaintedCells.push(record.cell)
    visiblePaintedCellRecords[cellKey] = record
  }

  const visibleObjects = Object.values(data.placedObjects).filter(
    (object) => data.layers[object.layerId]?.visible !== false,
  )
  const visibleOpenings = Object.values(data.wallOpenings).filter(
    (opening) => data.layers[opening.layerId]?.visible !== false,
  )
  const staticLightSources = resolveObjectLightSources(visibleObjects)

  return {
    data,
    visiblePaintedCells,
    visiblePaintedCellRecords,
    visibleObjects,
    visibleOpenings,
    staticLightSources,
    topLevelObjects: getTopLevelObjects(visibleObjects),
    childrenByParent: buildObjectChildrenIndex(visibleObjects),
    bakedLightBuildInput: {
      floorId: data.floorId,
      floorCells: visiblePaintedCells,
      staticLightSources,
      occlusionInput: {
        paintedCells: visiblePaintedCellRecords,
        wallOpenings: data.wallOpenings,
        innerWalls: data.innerWalls,
        wallSurfaceProps: data.wallSurfaceProps,
      },
    },
    wallOpeningDerivedState: buildWallOpeningDerivedState(data.wallOpenings),
  }
}

function getTopLevelObjects(objects: DungeonObjectRecord[]) {
  const objectIds = new Set(objects.map((object) => object.id))
  return objects.filter((object) => !object.parentObjectId || !objectIds.has(object.parentObjectId))
}

function buildObjectChildrenIndex(objects: DungeonObjectRecord[]) {
  const childrenByParent: Record<string, DungeonObjectRecord[]> = {}

  objects.forEach((object) => {
    if (!object.parentObjectId) {
      return
    }

    if (!childrenByParent[object.parentObjectId]) {
      childrenByParent[object.parentObjectId] = []
    }

    childrenByParent[object.parentObjectId].push(object)
  })

  return childrenByParent
}
