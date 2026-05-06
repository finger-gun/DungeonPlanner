import { cellToWorldPosition, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { MAX_BUILD_STAGGER_MS } from '../../store/buildAnimations'
import { buildWallOpeningDerivedState } from '../../store/derived/wallOpeningDerived'
import type {
  InnerWallRecord,
  OpeningRecord,
  PaintedCellRecord,
  Room,
} from '../../store/useDungeonStore'
import { WALL_EXTRA_DELAY_MS } from './DungeonRoomShared'
import { buildFloorRenderDerivedBundleFromInput } from './floorRenderDerived'
import type { StaticTileEntry } from './tileEntries'

export type RoomAnimationStateInput = {
  activeLayerId: string
  bakedLightField: BakedFloorLightField | null
  floorTileAssetIds: Record<string, string>
  globalFloorAssetId: string | null
  globalWallAssetId: string | null
  innerWalls: Record<string, InnerWallRecord>
  paintedCells: Record<string, PaintedCellRecord>
  rooms: Record<string, Room>
  wallOpenings: Record<string, OpeningRecord>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
}

export function buildSpeculativeRoomTileEntries({
  activeLayerId,
  bakedLightField,
  buildStartedAt,
  cells,
  floorTileAssetIds,
  globalFloorAssetId,
  globalWallAssetId,
  innerWalls,
  originCell,
  paintedCells,
  rooms,
  wallOpenings,
  wallSurfaceAssetIds,
  wallSurfaceProps,
}: RoomAnimationStateInput & {
  buildStartedAt: number
  cells: GridCell[]
  originCell: GridCell
}): StaticTileEntry[] {
  const previewCellKeys = new Set(cells.map(getCellKey))
  const previewRoomId = `preview-room:${activeLayerId}`
  const previewPaintedCells = { ...paintedCells }

  cells.forEach((cell) => {
    const cellKey = getCellKey(cell)
    if (previewPaintedCells[cellKey]) {
      return
    }

    previewPaintedCells[cellKey] = {
      cell: [...cell] as GridCell,
      layerId: activeLayerId,
      roomId: previewRoomId,
    }
  })

  const bundle = buildFloorRenderDerivedBundleFromInput({
    visiblePaintedCellRecords: previewPaintedCells,
    rooms: {
      ...rooms,
      [previewRoomId]: {
        id: previewRoomId,
        name: 'Preview Room',
        layerId: activeLayerId,
        floorAssetId: null,
        wallAssetId: null,
      },
    },
    globalFloorAssetId,
    floorTileAssetIds,
    globalWallAssetId,
    wallSurfaceAssetIds,
    wallSurfaceProps,
    wallOpeningDerivedState: buildWallOpeningDerivedState(wallOpenings),
    innerWalls,
  }, {
    includeFloorReceivers: false,
  })

  return buildAnimatedRoomTileEntriesFromBundle({
    bakedLightField,
    buildStartedAt,
    bundle,
    cells,
    originCell,
    relatedCellKeys: previewCellKeys,
  })
}

export function buildRemovedRoomTileEntries({
  before,
  after,
  buildStartedAt,
  cells,
  originCell,
}: {
  before: RoomAnimationStateInput
  after: RoomAnimationStateInput
  buildStartedAt: number
  cells: readonly GridCell[]
  originCell: GridCell
}) {
  const previousEntries = buildAnimatedRoomTileEntriesForState({
    ...before,
    buildAnimationDirection: 'fall',
    buildStartedAt,
    cells,
    originCell,
  })
  if (previousEntries.length === 0) {
    return []
  }

  const nextEntries = buildAnimatedRoomTileEntriesForState({
    ...after,
    buildStartedAt,
    cells,
    originCell,
  })
  const nextSignatures = new Set(nextEntries.map(buildTransientRoomEntrySignature))
  return previousEntries.filter((entry) => !nextSignatures.has(buildTransientRoomEntrySignature(entry)))
}

export function expandRoomMutationCells(cells: readonly GridCell[]) {
  const expanded = new Map<string, GridCell>()
  cells.forEach((cell) => {
    const candidates: GridCell[] = [
      [cell[0], cell[1]],
      [cell[0] - 1, cell[1]],
      [cell[0] + 1, cell[1]],
      [cell[0], cell[1] - 1],
      [cell[0], cell[1] + 1],
    ]
    candidates.forEach((candidate) => {
      expanded.set(getCellKey(candidate), candidate)
    })
  })
  return [...expanded.values()]
}

export function getCellsForWallKeys(wallKeys: readonly string[]) {
  const cells = new Map<string, GridCell>()
  wallKeys.forEach((wallKey) => {
    getWallPreviewCells(wallKey).forEach((cell) => {
      cells.set(getCellKey(cell), cell)
    })
  })
  return [...cells.values()]
}

export function getOriginCellForCells(cells: readonly GridCell[]) {
  return cells[0] ?? [0, 0]
}

function buildAnimatedRoomTileEntriesForState({
  bakedLightField,
  buildAnimationDirection,
  buildStartedAt,
  cells,
  floorTileAssetIds,
  globalFloorAssetId,
  globalWallAssetId,
  innerWalls,
  originCell,
  paintedCells,
  rooms,
  wallOpenings,
  wallSurfaceAssetIds,
  wallSurfaceProps,
}: RoomAnimationStateInput & {
  buildAnimationDirection?: 'rise' | 'fall'
  buildStartedAt: number
  cells: readonly GridCell[]
  originCell: GridCell
}) {
  const bundle = buildFloorRenderDerivedBundleFromInput({
    visiblePaintedCellRecords: paintedCells,
    rooms,
    globalFloorAssetId,
    floorTileAssetIds,
    globalWallAssetId,
    wallSurfaceAssetIds,
    wallSurfaceProps,
    wallOpeningDerivedState: buildWallOpeningDerivedState(wallOpenings),
    innerWalls,
  }, {
    includeFloorReceivers: false,
  })

  return buildAnimatedRoomTileEntriesFromBundle({
    bakedLightField,
    buildAnimationDirection,
    buildStartedAt,
    bundle,
    cells,
    originCell,
    relatedCellKeys: new Set(cells.map((cell) => getCellKey(cell))),
  })
}

function buildAnimatedRoomTileEntriesFromBundle({
  bakedLightField,
  buildAnimationDirection,
  buildStartedAt,
  bundle,
  cells,
  originCell,
  relatedCellKeys,
}: {
  bakedLightField: BakedFloorLightField | null
  buildAnimationDirection?: 'rise' | 'fall'
  buildStartedAt: number
  bundle: ReturnType<typeof buildFloorRenderDerivedBundleFromInput>
  cells: readonly GridCell[]
  originCell: GridCell
  relatedCellKeys: ReadonlySet<string>
}): StaticTileEntry[] {
  return [
    ...bundle.floorGroups.flatMap((group) =>
      group.cells
        .filter((cell) => relatedCellKeys.has(getCellKey(cell)))
        .map((cell) => {
          const cellKey = getCellKey(cell)
          return {
            key: `floor:${cellKey}`,
            assetId: group.floorAssetId,
            position: cellToWorldPosition(cell),
            rotation: [0, 0, 0] as const,
            buildAnimationDelay: getSpeculativeBuildDelay(cells, originCell, cell),
            buildAnimationDirection,
            buildAnimationStart: buildStartedAt,
            variant: 'floor' as const,
            variantKey: cellKey,
            visibility: 'visible' as const,
            bakedLightField: bakedLightField ?? undefined,
            fogCell: cell,
          }
        })),
    ...bundle.floorSurfaceEntries
      .filter((placement) => relatedCellKeys.has(placement.anchorCellKey))
      .map((placement) => ({
        key: `floor-surface:${placement.anchorCellKey}`,
        assetId: placement.assetId,
        position: placement.position,
        rotation: [0, 0, 0] as const,
        buildAnimationDelay: getSpeculativeBuildDelay(cells, originCell, placement.anchorCell),
        buildAnimationDirection,
        buildAnimationStart: buildStartedAt,
        variant: 'floor' as const,
        variantKey: placement.anchorCellKey,
        visibility: 'visible' as const,
        bakedLightField: bakedLightField ?? undefined,
        fogCell: placement.anchorCell,
      })),
    ...bundle.walls
      .filter((wall) => wall.segmentKeys.some((wallKey) => isWallKeyRelatedToCells(wallKey, relatedCellKeys)))
      .map((wall) => {
        const wallCell = getFirstWallCellForPreview(wall.segmentKeys, relatedCellKeys) ?? cells[0] ?? [0, 0]
        return {
          key: wall.key,
          assetId: wall.assetId,
          position: wall.position,
          rotation: wall.rotation,
          buildAnimationDelay: getSpeculativeBuildDelay(cells, originCell, wallCell, WALL_EXTRA_DELAY_MS),
          buildAnimationDirection,
          buildAnimationStart: buildStartedAt,
          variant: 'wall' as const,
          variantKey: wall.key,
          visibility: 'visible' as const,
          bakedLightField: bakedLightField ?? undefined,
          bakedLightDirection: wall.bakedLightDirection,
          bakedLightDirectionSecondary: wall.bakedLightDirectionSecondary,
          objectProps: wall.objectProps,
        }
      }),
    ...bundle.corners
      .filter((corner) => corner.wallKeys.some((wallKey) => isWallKeyRelatedToCells(wallKey, relatedCellKeys)))
      .map((corner) => {
        const cornerCell = getFirstWallCellForPreview(corner.wallKeys, relatedCellKeys) ?? cells[0] ?? [0, 0]
        return {
          key: corner.key,
          assetId: corner.assetId,
          position: corner.position,
          rotation: corner.rotation,
          buildAnimationDelay: getSpeculativeBuildDelay(cells, originCell, cornerCell, WALL_EXTRA_DELAY_MS),
          buildAnimationDirection,
          buildAnimationStart: buildStartedAt,
          variant: 'wall' as const,
          variantKey: corner.key,
          visibility: 'visible' as const,
          objectProps: corner.wallKeys.length > 0
            ? {
              ...(corner.objectProps ?? {}),
              __transientCornerWallKeys: corner.wallKeys.join('|'),
            }
            : corner.objectProps,
        }
      }),
  ]
}

function getSpeculativeBuildDelay(
  cells: readonly GridCell[],
  originCell: GridCell,
  cell: GridCell,
  extraDelay = 0,
) {
  const maxDist = cells.reduce((max, candidate) => {
    const distance = Math.abs(candidate[0] - originCell[0]) + Math.abs(candidate[1] - originCell[1])
    return Math.max(max, distance)
  }, 1)
  const distance = Math.abs(cell[0] - originCell[0]) + Math.abs(cell[1] - originCell[1])
  return (distance / maxDist) * MAX_BUILD_STAGGER_MS + extraDelay
}

export function buildTransientRoomEntrySignature(entry: StaticTileEntry) {
  return [
    entry.key,
    entry.assetId ?? '',
    entry.position.join(','),
    entry.rotation.join(','),
    entry.variant,
    entry.variantKey ?? '',
    entry.visibility,
    entry.bakedLightDirection?.join(',') ?? '',
    entry.bakedLightDirectionSecondary?.join(',') ?? '',
    entry.fogCell?.join(',') ?? '',
    JSON.stringify(entry.objectProps ?? null),
  ].join('|')
}

function isWallKeyRelatedToCells(wallKey: string, cellKeys: ReadonlySet<string>) {
  return getWallPreviewCells(wallKey).some((cell) => cellKeys.has(getCellKey(cell)))
}

function getFirstWallCellForPreview(wallKeys: readonly string[], cellKeys: ReadonlySet<string>) {
  for (const wallKey of wallKeys) {
    const cell = getWallPreviewCells(wallKey).find((candidate) => cellKeys.has(getCellKey(candidate)))
    if (cell) {
      return cell
    }
  }
  return null
}

function getWallPreviewCells(wallKey: string): GridCell[] {
  const [xText, zText, direction] = wallKey.split(':')
  const x = Number.parseInt(xText ?? '', 10)
  const z = Number.parseInt(zText ?? '', 10)
  if (Number.isNaN(x) || Number.isNaN(z)) {
    return []
  }

  const cell: GridCell = [x, z]
  if (direction === 'north') return [cell, [x, z + 1]]
  if (direction === 'south') return [cell, [x, z - 1]]
  if (direction === 'west') return [cell, [x - 1, z]]
  if (direction === 'east') return [cell, [x + 1, z]]
  return [cell]
}
