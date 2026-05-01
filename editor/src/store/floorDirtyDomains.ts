import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'

export type FloorDirtyDomainKey =
  | 'tiles'
  | 'blocked'
  | 'walls'
  | 'openings'
  | 'props'
  | 'lighting'
  | 'renderPlan'
  | 'layerVisibility'
  | 'occupancy'
  | 'terrain'

export type FloorDirtyRect = {
  minCellX: number
  maxCellX: number
  minCellZ: number
  maxCellZ: number
} | null

export type FloorDirtyHint = {
  floorId?: string
  domains?: FloorDirtyDomainKey[]
  cells?: Iterable<GridCell | string>
  wallKeys?: Iterable<string>
  objectIds?: Iterable<string>
  fullRefresh?: boolean
}

export type FloorDirtyInfo = {
  sequence: number
  tilesVersion: number
  blockedVersion: number
  wallsVersion: number
  openingsVersion: number
  propsVersion: number
  lightingVersion: number
  renderPlanVersion: number
  layerVisibilityVersion: number
  occupancyVersion: number
  terrainVersion: number
  dirtyCellRect: FloorDirtyRect
  dirtyWallKeys: string[]
  affectedObjectIds: string[]
  fullRefresh: boolean
}

export type FloorDirtyState = Record<string, FloorDirtyInfo>

export const FLOOR_DIRTY_DOMAIN_VERSION_KEYS = {
  tiles: 'tilesVersion',
  blocked: 'blockedVersion',
  walls: 'wallsVersion',
  openings: 'openingsVersion',
  props: 'propsVersion',
  lighting: 'lightingVersion',
  renderPlan: 'renderPlanVersion',
  layerVisibility: 'layerVisibilityVersion',
  occupancy: 'occupancyVersion',
  terrain: 'terrainVersion',
} as const satisfies Record<FloorDirtyDomainKey, keyof FloorDirtyInfo>

export const ALL_FLOOR_DIRTY_DOMAINS = Object.keys(
  FLOOR_DIRTY_DOMAIN_VERSION_KEYS,
) as FloorDirtyDomainKey[]

export function createFloorDirtyInfo(): FloorDirtyInfo {
  return {
    sequence: 0,
    tilesVersion: 0,
    blockedVersion: 0,
    wallsVersion: 0,
    openingsVersion: 0,
    propsVersion: 0,
    lightingVersion: 0,
    renderPlanVersion: 0,
    layerVisibilityVersion: 0,
    occupancyVersion: 0,
    terrainVersion: 0,
    dirtyCellRect: null,
    dirtyWallKeys: [],
    affectedObjectIds: [],
    fullRefresh: false,
  }
}

export function syncFloorDirtyState(
  floorDirtyState: FloorDirtyState | null | undefined,
  floorIds: Iterable<string>,
) {
  const synced: FloorDirtyState = {}

  for (const floorId of floorIds) {
    synced[floorId] = floorDirtyState?.[floorId] ?? createFloorDirtyInfo()
  }

  return synced
}

export function applyFloorDirtyMutation({
  floorDirtyState,
  floorIds,
  floorId,
  domains,
  hint,
}: {
  floorDirtyState: FloorDirtyState | null | undefined
  floorIds: Iterable<string>
  floorId: string
  domains: Iterable<FloorDirtyDomainKey>
  hint?: FloorDirtyHint | null
}) {
  const nextFloorDirtyState = syncFloorDirtyState(floorDirtyState, floorIds)
  const previousInfo = nextFloorDirtyState[floorId] ?? createFloorDirtyInfo()
  const domainList = [...new Set(domains)]

  if (
    domainList.length === 0
    && !hint?.fullRefresh
    && !hint?.cells
    && !hint?.wallKeys
    && !hint?.objectIds
  ) {
    return nextFloorDirtyState
  }

  const nextInfo: FloorDirtyInfo = {
    ...previousInfo,
    sequence: previousInfo.sequence + 1,
    dirtyCellRect: buildDirtyCellRect(hint?.cells),
    dirtyWallKeys: dedupeStrings(hint?.wallKeys),
    affectedObjectIds: dedupeStrings(hint?.objectIds),
    fullRefresh: Boolean(hint?.fullRefresh),
  }

  domainList.forEach((domain) => {
    const versionKey = FLOOR_DIRTY_DOMAIN_VERSION_KEYS[domain]
    nextInfo[versionKey] += 1
  })

  nextFloorDirtyState[floorId] = nextInfo
  return nextFloorDirtyState
}

function buildDirtyCellRect(cells: Iterable<GridCell | string> | undefined): FloorDirtyRect {
  if (!cells) {
    return null
  }

  let minCellX = Number.POSITIVE_INFINITY
  let maxCellX = Number.NEGATIVE_INFINITY
  let minCellZ = Number.POSITIVE_INFINITY
  let maxCellZ = Number.NEGATIVE_INFINITY

  for (const entry of cells) {
    const cellKey = typeof entry === 'string' ? entry : getCellKey(entry)
    const [cellXPart, cellZPart] = cellKey.split(':')
    const cellX = Number.parseInt(cellXPart ?? '', 10)
    const cellZ = Number.parseInt(cellZPart ?? '', 10)
    if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
      continue
    }

    minCellX = Math.min(minCellX, cellX)
    maxCellX = Math.max(maxCellX, cellX)
    minCellZ = Math.min(minCellZ, cellZ)
    maxCellZ = Math.max(maxCellZ, cellZ)
  }

  return Number.isFinite(minCellX)
    ? {
        minCellX,
        maxCellX,
        minCellZ,
        maxCellZ,
      }
    : null
}

function dedupeStrings(values: Iterable<string> | undefined) {
  return values ? [...new Set(values)] : []
}
