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
import type { FloorDirtyInfo } from '../floorDirtyDomains'
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

export type FloorSceneDerivedBundle = Pick<
  FloorDerivedBundle,
  'data' | 'topLevelObjects' | 'childrenByParent' | 'bakedLightBuildInput'
>

export function buildVisiblePaintedCells({
  paintedCells,
  layers,
}: Pick<DungeonRoomData, 'paintedCells' | 'layers'>) {
  const visiblePaintedCells: GridCell[] = []
  const visiblePaintedCellRecords: PaintedCells = {}

  for (const [cellKey, record] of Object.entries(paintedCells)) {
    if (layers[record.layerId]?.visible === false) {
      continue
    }

    visiblePaintedCells.push(record.cell)
    visiblePaintedCellRecords[cellKey] = record
  }

  return {
    visiblePaintedCells,
    visiblePaintedCellRecords,
  }
}

export function buildVisibleObjects({
  placedObjects,
  layers,
}: Pick<DungeonRoomData, 'placedObjects' | 'layers'>) {
  return Object.values(placedObjects).filter(
    (object) => layers[object.layerId]?.visible !== false,
  )
}

export function buildVisibleOpenings({
  wallOpenings,
  layers,
}: Pick<DungeonRoomData, 'wallOpenings' | 'layers'>) {
  return Object.values(wallOpenings).filter(
    (opening) => layers[opening.layerId]?.visible !== false,
  )
}

export function buildStaticLightSources(objects: DungeonObjectRecord[]) {
  return resolveObjectLightSources(objects)
}

export function buildObjectHierarchy(objects: DungeonObjectRecord[]) {
  return {
    topLevelObjects: getTopLevelObjects(objects),
    childrenByParent: buildObjectChildrenIndex(objects),
  }
}

export function buildBakedLightBuildInput(
  data: Pick<DungeonRoomData, 'floorId' | 'wallOpenings' | 'innerWalls' | 'wallSurfaceProps'>,
  visiblePaintedCells: GridCell[],
  visiblePaintedCellRecords: PaintedCells,
  staticLightSources: ResolvedDungeonLightSource[],
  dirtyHint?: Pick<
    FloorDirtyInfo,
    'sequence' | 'dirtyCellRect' | 'dirtyWallKeys' | 'affectedObjectIds' | 'fullRefresh'
  > | null,
): BakedFloorLightFieldBuildInput {
  return {
    floorId: data.floorId,
    floorCells: visiblePaintedCells,
    staticLightSources,
    dirtyHint: dirtyHint ?? null,
    occlusionInput: {
      paintedCells: visiblePaintedCellRecords,
      wallOpenings: data.wallOpenings,
      innerWalls: data.innerWalls,
      wallSurfaceProps: data.wallSurfaceProps,
    },
  }
}

export function buildFloorWallOpeningDerivedState({
  wallOpenings,
}: Pick<DungeonRoomData, 'wallOpenings'>) {
  return buildWallOpeningDerivedState(wallOpenings)
}

export function buildFloorDerivedBundle(data: DungeonRoomData): FloorDerivedBundle {
  const { visiblePaintedCells, visiblePaintedCellRecords } = buildVisiblePaintedCells(data)
  const visibleObjects = buildVisibleObjects(data)
  const visibleOpenings = buildVisibleOpenings(data)
  const staticLightSources = buildStaticLightSources(visibleObjects)
  const { topLevelObjects, childrenByParent } = buildObjectHierarchy(visibleObjects)

  return {
    data,
    visiblePaintedCells,
    visiblePaintedCellRecords,
    visibleObjects,
    visibleOpenings,
    staticLightSources,
    topLevelObjects,
    childrenByParent,
    bakedLightBuildInput: buildBakedLightBuildInput(
      data,
      visiblePaintedCells,
      visiblePaintedCellRecords,
      staticLightSources,
      null,
    ),
    wallOpeningDerivedState: buildFloorWallOpeningDerivedState(data),
  }
}

export function buildFloorSceneDerivedBundle(data: DungeonRoomData): FloorSceneDerivedBundle {
  const { visiblePaintedCells, visiblePaintedCellRecords } = buildVisiblePaintedCells(data)
  const visibleObjects = buildVisibleObjects(data)
  const staticLightSources = buildStaticLightSources(visibleObjects)
  const { topLevelObjects, childrenByParent } = buildObjectHierarchy(visibleObjects)

  return {
    data,
    topLevelObjects,
    childrenByParent,
    bakedLightBuildInput: buildBakedLightBuildInput(
      data,
      visiblePaintedCells,
      visiblePaintedCellRecords,
      staticLightSources,
      null,
    ),
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
