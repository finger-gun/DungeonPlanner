import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import { getFloorChunkKeysForCells } from './floorChunkKeys'

/**
 * Per-floor dirty domain tracking.
 *
 * Tracks which logical domains (tiles, walls, props, lighting, etc.) have
 * changed on a given floor, along with spatial hints (dirty cell rects,
 * chunk keys) to enable incremental updates.
 *
 * Each floor gets a `FloorDirtyInfo` entry. Every mutation bumps a version
 * counter on the affected domains. Consumers (e.g. `useActiveFloorSnapshot`)
 * subscribe to specific domains and re-derive data only when those versions change.
 *
 * ## Usage
 * - `applyFloorDirtyMutation` — called from store actions to record changes
 * - `syncFloorDirtyState` — ensures all active floors have an entry
 * - `createFloorDirtyInfo` — creates a zero-version baseline
 */
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
  chunkKeys?: Iterable<string>
  renderChunkKeys?: Iterable<string>
  lightChunkKeys?: Iterable<string>
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
  dirtyCellKeys: string[]
  dirtyChunkKeys: string[]
  dirtyRenderChunkKeys: string[]
  dirtyLightChunkKeys: string[]
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

/** Creates the zero-version dirty tracking baseline for a floor. */
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
    dirtyCellKeys: [],
    dirtyChunkKeys: [],
    dirtyRenderChunkKeys: [],
    dirtyLightChunkKeys: [],
    dirtyWallKeys: [],
    affectedObjectIds: [],
    fullRefresh: false,
  }
}

/** Ensures every known floor has a dirty tracking entry before mutations are applied. */
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

/**
 * Applies a dirty-domain mutation for one floor and returns the updated state map.
 *
 * This bumps the requested domain version counters and records spatial/object hints
 * that downstream consumers can use for incremental recomputation.
 */
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
    && !hint?.chunkKeys
    && !hint?.renderChunkKeys
    && !hint?.lightChunkKeys
    && !hint?.wallKeys
    && !hint?.objectIds
  ) {
    return nextFloorDirtyState
  }

  const dirtyCellKeys = buildDirtyCellKeys(hint?.cells)
  const dirtyChunkKeys = dedupeStrings(hint?.chunkKeys ?? getFloorChunkKeysForCells(dirtyCellKeys))

  const nextInfo: FloorDirtyInfo = {
    ...previousInfo,
    sequence: previousInfo.sequence + 1,
    dirtyCellRect: buildDirtyCellRect(dirtyCellKeys),
    dirtyCellKeys,
    dirtyChunkKeys,
    dirtyRenderChunkKeys: dedupeStrings(hint?.renderChunkKeys ?? dirtyChunkKeys),
    dirtyLightChunkKeys: dedupeStrings(hint?.lightChunkKeys ?? dirtyChunkKeys),
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

function buildDirtyCellKeys(cells: Iterable<GridCell | string> | undefined) {
  if (!cells) {
    return []
  }

  const cellKeys = new Set<string>()
  for (const entry of cells) {
    const cellKey = typeof entry === 'string' ? entry : getCellKey(entry)
    if (parseCellKey(cellKey)) {
      cellKeys.add(cellKey)
    }
  }

  return [...cellKeys].sort()
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
    const parsed = parseCellKey(cellKey)
    if (!parsed) {
      continue
    }

    minCellX = Math.min(minCellX, parsed.cellX)
    maxCellX = Math.max(maxCellX, parsed.cellX)
    minCellZ = Math.min(minCellZ, parsed.cellZ)
    maxCellZ = Math.max(maxCellZ, parsed.cellZ)
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

function parseCellKey(cellKey: string) {
  const [cellXPart, cellZPart] = cellKey.split(':')
  const cellX = Number.parseInt(cellXPart ?? '', 10)
  const cellZ = Number.parseInt(cellZPart ?? '', 10)
  if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
    return null
  }

  return { cellX, cellZ }
}

function dedupeStrings(values: Iterable<string> | undefined) {
  return values ? [...new Set(values)].sort() : []
}
