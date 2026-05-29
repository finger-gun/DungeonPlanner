/**
 * Dungeon file serialization / deserialization.
 *
 * Format versioning: increment CURRENT_VERSION and add a migration in
 * `migrateFile` whenever the schema changes in a breaking way.
 */
import {
  getContentPackAssetById,
  getContentPackRoomSetById,
  getDefaultAssetIdByCategory,
  getDefaultContentPackRoomSetId,
  getDefaultContentPackWallMaterialSetId,
  getContentPackWallStyleById,
} from '../content-packs/registry'
import { sanitizePersistedAssetReferences } from './assetReferences'
import {
  getDefaultExteriorWallStyleId,
  getDefaultInteriorWallStyleId,
  getDefaultWallStyleId,
} from './defaultWallStyles'
import { buildSplineWallOpeningPlacement } from './openingPlacement'
import {
  DEFAULT_POST_PROCESSING_SETTINGS,
  normalizePostProcessingSettings,
} from '../postprocessing/tiltShiftMath'
import type {
  BlockedCells,
  DungeonObjectRecord,
  DungeonObjectType,
  FloorRecord,
  InnerWallRecord,
  Layer,
  MapMode,
  OutdoorTerrainDensity,
  OutdoorTerrainHeightfield,
  OutdoorTerrainStyleCells,
  OutdoorTerrainStyle,
  OutdoorTerrainProfile,
  OutdoorTerrainType,
  OpeningRecord,
  PaintedCells,
  Room,
} from './useDungeonStore'
import {
  normalizeGeneratedCharacterRecord,
  type GeneratedCharacterRecord,
} from '../generated-characters/types'
import { syncGeneratedCharacterAssets } from '../content-packs/runtimeRegistry'
import type { GridCell } from '../hooks/useSnapToGrid'
import { getCellKey } from '../hooks/useSnapToGrid'
import { OUTDOOR_TERRAIN_LEVEL_HEIGHT } from './outdoorTerrain'
import {
  DEFAULT_OUTDOOR_TERRAIN_STYLE,
  OUTDOOR_TERRAIN_STYLES,
} from './outdoorTerrainStyles'
import {
  createEmptySplineWallGraph,
  hasSplineWallGraphPaths,
  syncSplineWallGraphCutoutsFromOpenings,
  type SplineWallGraph,
} from './splineWallGraph'
import { createSplineWallQueryCache } from './splineWallQueries'
import { wallKeyToWorldPosition } from './wallSegments'

const CURRENT_VERSION = 25
const ROOM_SET_CONTENT_PACK_ID = 'dungeon'
const FALLBACK_ROOM_SET_ID = 'dungeon'
const WALL_MATERIAL_SET_CONTENT_PACK_ID = 'dungeon'
const FALLBACK_WALL_MATERIAL_SET_ID = 'kaykit-stone'

// ── Serialized shapes (compact, no redundant keys) ────────────────────────────

type SerializedCell = {
  x: number
  z: number
  layerId: string
  roomId: string | null
}

type SerializedObject = {
  id: string
  type: DungeonObjectType
  assetId: string | null
  position: [number, number, number]
  rotation: [number, number, number]
  cell: GridCell
  cellKey: string
  layerId: string
  props: Record<string, unknown>
}

type SerializedOpening = {
  id: string
  assetId: string | null
  wallKey: string
  width: 1 | 2 | 3
  segmentId?: string | null
  segmentStartRatio?: number | null
  segmentEndRatio?: number | null
  flipped: boolean
  objectProps?: Record<string, unknown>
  layerId: string
  source?: 'manual' | 'generated'
}

type SerializedSplineWallGraph = {
  nodes: Array<{
    id: string
    x: number
    z: number
    layerId: string
    roomId: string | null
    cornerMode?: 'square' | 'rounded' | 'diagonal' | null
    cornerAmount?: number | null
  }>
  segments: Array<{
    id: string
    pathId: string
    startNodeId: string
    endNodeId: string
    layerId: string
    roomId: string | null
    wallKey: string | null
    wallHeight: number | null
    wallThickness: number | null
    cutouts: Array<{
      id: string
      kind: 'door' | 'passage' | 'window'
      startRatio: number
      endRatio: number
      bottomHeight?: number | null
      topHeight?: number | null
      assetId: string | null
      openingId: string | null
      objectProps: Record<string, unknown>
    }>
  }>
  paths: Array<{
    id: string
    layerId: string
    roomId: string | null
    closed: boolean
    nodeIds: string[]
    segmentIds: string[]
  }>
}

type SerializedFloor = {
  id: string
  name: string
  level: number
  layers: Layer[]
  layerOrder: string[]
  activeLayerId: string
  rooms: Room[]
  cells: SerializedCell[]
  blockedCells?: Array<{
    x: number
    z: number
    layerId: string
  }>
  outdoorTerrainHeights?: Array<{
    x: number
    z: number
    height: number
  }>
  outdoorTerrainStyleCells?: Array<{
    x: number
    z: number
    layerId: string
    terrainStyle: OutdoorTerrainStyle
  }>
  exploredCells: string[]
  floorTileAssetIds?: Record<string, string>
  wallStyleAssignments?: Record<string, string>
  wallCoreAssignments?: Record<string, string>
  wallSurfaceAssetIds?: Record<string, string>
  wallSurfaceProps?: Record<string, Record<string, unknown>>
  objects: SerializedObject[]
  openings: SerializedOpening[]
  innerWalls?: string[]
  splineWallGraph?: SerializedSplineWallGraph
  nextRoomNumber: number
  activeRoomSetId?: string
  activeWallMaterialSetId?: string
  activeInteriorWallStyleId?: string
  activeExteriorWallStyleId?: string
}

export type DungeonFile = {
  version: number
  name: string
  generatedCharacters?: Record<string, GeneratedCharacterRecord>
  mapMode?: MapMode
  outdoorTimeOfDay?: number
  defaultOutdoorTerrainStyle?: OutdoorTerrainStyle
  outdoorTerrainProfiles?: Partial<Record<OutdoorTerrainType, Partial<OutdoorTerrainProfile>>>
  outdoorTerrainDensity?: OutdoorTerrainDensity
  outdoorTerrainType?: OutdoorTerrainType
  outdoorOverpaintRegenerate?: boolean
  sceneLighting: { intensity: number }
  lightFlickerEnabled: boolean
  postProcessing: {
    enabled: boolean
    pixelateEnabled: boolean
    pixelSize: number
    focusDistance: number
    focalLength: number
    backgroundFocalLength: number
    bokehScale: number
  }
  activeFloorId: string
  floorOrder: string[]
  floors: SerializedFloor[]
}

// ── State shape we serialize from / into ─────────────────────────────────────

export type SerializableState = {
  name?: string
  mapMode?: MapMode
  outdoorTimeOfDay?: number
  defaultOutdoorTerrainStyle?: OutdoorTerrainStyle
  outdoorTerrainProfiles?: Partial<Record<OutdoorTerrainType, Partial<OutdoorTerrainProfile>>>
  outdoorTerrainDensity?: OutdoorTerrainDensity
  outdoorTerrainType?: OutdoorTerrainType
  outdoorOverpaintRegenerate?: boolean
  sceneLighting: { intensity: number }
  lightFlickerEnabled?: boolean
  postProcessing: {
    enabled: boolean
    pixelateEnabled: boolean
    pixelSize: number
    focusDistance: number
    focalLength: number
    backgroundFocalLength: number
    bokehScale: number
  }
  // Active floor working state (flat, for backwards compat)
  layers: Record<string, Layer>
  layerOrder: string[]
  activeLayerId: string
  rooms: Record<string, Room>
  paintedCells: PaintedCells
  blockedCells: BlockedCells
  outdoorTerrainHeights: OutdoorTerrainHeightfield
  outdoorTerrainStyleCells: OutdoorTerrainStyleCells
  exploredCells: Record<string, true>
  floorTileAssetIds: Record<string, string>
  wallStyleAssignments: Record<string, string>
  wallCoreAssignments: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  placedObjects: Record<string, DungeonObjectRecord>
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
  splineWallGraph: SplineWallGraph
  occupancy: Record<string, string>
  nextRoomNumber: number
  activeRoomSetId?: string
  activeWallMaterialSetId?: string
  activeInteriorWallStyleId?: string
  activeExteriorWallStyleId?: string
  // Multi-floor data
  floors?: Record<string, FloorRecord>
  floorOrder?: string[]
  activeFloorId?: string
  generatedCharacters?: Record<string, GeneratedCharacterRecord>
}

// ── Helpers: floor snapshot → serialized floor ────────────────────────────────

function serializeSplineWallGraph(graph: SplineWallGraph): SerializedSplineWallGraph {
  return {
    nodes: Object.values(graph.nodes).map((node) => ({
      id: node.id,
      x: node.position[0],
      z: node.position[1],
      layerId: node.layerId,
      roomId: node.roomId,
      cornerMode: node.cornerMode ?? null,
      cornerAmount: node.cornerAmount ?? null,
    })),
    segments: Object.values(graph.segments).map((segment) => ({
      id: segment.id,
      pathId: segment.pathId,
      startNodeId: segment.startNodeId,
      endNodeId: segment.endNodeId,
      layerId: segment.layerId,
      roomId: segment.roomId,
      wallKey: segment.wallKey,
      wallHeight: segment.wallHeight,
      wallThickness: segment.wallThickness,
      cutouts: segment.cutouts.map((cutout) => ({
        id: cutout.id,
        kind: cutout.kind,
        startRatio: cutout.startRatio,
        endRatio: cutout.endRatio,
        bottomHeight: cutout.bottomHeight,
        topHeight: cutout.topHeight,
        assetId: cutout.assetId,
        openingId: cutout.openingId,
        objectProps: { ...cutout.objectProps },
      })),
    })),
    paths: Object.values(graph.paths).map((path) => ({
      id: path.id,
      layerId: path.layerId,
      roomId: path.roomId,
      closed: path.closed,
      nodeIds: [...path.nodeIds],
      segmentIds: [...path.segmentIds],
    })),
  }
}

function serializeFloorData(
  id: string,
  name: string,
  level: number,
  snapshot: {
    layers: Record<string, Layer>
    layerOrder: string[]
    activeLayerId: string
    rooms: Record<string, Room>
    paintedCells: PaintedCells
    blockedCells: BlockedCells
    outdoorTerrainHeights: OutdoorTerrainHeightfield
    outdoorTerrainStyleCells: OutdoorTerrainStyleCells
    exploredCells: Record<string, true>
    floorTileAssetIds: Record<string, string>
    wallStyleAssignments: Record<string, string>
    wallCoreAssignments: Record<string, string>
    wallSurfaceAssetIds: Record<string, string>
    wallSurfaceProps: Record<string, Record<string, unknown>>
    placedObjects: Record<string, DungeonObjectRecord>
    wallOpenings: Record<string, OpeningRecord>
    innerWalls: Record<string, InnerWallRecord>
    splineWallGraph: SplineWallGraph
    nextRoomNumber: number
    activeRoomSetId?: string
    activeWallMaterialSetId?: string
    activeInteriorWallStyleId?: string
    activeExteriorWallStyleId?: string
  },
): SerializedFloor {
  return {
    id,
    name,
    level,
    layers: Object.values(snapshot.layers),
    layerOrder: [...snapshot.layerOrder],
    activeLayerId: snapshot.activeLayerId,
    rooms: Object.values(snapshot.rooms),
    cells: Object.values(snapshot.paintedCells).map((r) => ({
      x: r.cell[0], z: r.cell[1], layerId: r.layerId, roomId: r.roomId,
    })),
    blockedCells: Object.values(snapshot.blockedCells).map((r) => ({
      x: r.cell[0], z: r.cell[1], layerId: r.layerId,
    })),
    outdoorTerrainHeights: Object.values(snapshot.outdoorTerrainHeights).map((record) => ({
      x: record.cell[0], z: record.cell[1], height: record.level,
    })),
    outdoorTerrainStyleCells: Object.values(snapshot.outdoorTerrainStyleCells).map((r) => ({
      x: r.cell[0], z: r.cell[1], layerId: r.layerId, terrainStyle: r.terrainStyle,
    })),
    exploredCells: Object.keys(snapshot.exploredCells),
    floorTileAssetIds: { ...snapshot.floorTileAssetIds },
    wallStyleAssignments: { ...snapshot.wallStyleAssignments },
    wallCoreAssignments: { ...snapshot.wallCoreAssignments },
    wallSurfaceAssetIds: { ...snapshot.wallSurfaceAssetIds },
    wallSurfaceProps: Object.fromEntries(
      Object.entries(snapshot.wallSurfaceProps).map(([wallKey, props]) => [wallKey, { ...props }]),
    ),
    objects: Object.values(snapshot.placedObjects).map((obj) => ({
      id: obj.id, type: obj.type, assetId: obj.assetId, position: obj.position, rotation: obj.rotation,
      cell: obj.cell, cellKey: obj.cellKey, layerId: obj.layerId, props: obj.props,
    })),
    openings: Object.values(snapshot.wallOpenings).map((o) => ({
      id: o.id, assetId: o.assetId, wallKey: o.wallKey, width: o.width,
      segmentId: o.segmentId ?? null,
      segmentStartRatio: o.segmentStartRatio ?? null,
      segmentEndRatio: o.segmentEndRatio ?? null,
      flipped: o.flipped ?? false,
      objectProps: { ...(o.objectProps ?? {}) },
      layerId: o.layerId,
      source: o.source ?? 'manual',
    })),
    innerWalls: Object.values(snapshot.innerWalls).map((innerWall) => innerWall.wallKey),
    splineWallGraph: serializeSplineWallGraph(snapshot.splineWallGraph),
    nextRoomNumber: snapshot.nextRoomNumber,
    activeRoomSetId: snapshot.activeRoomSetId,
    activeWallMaterialSetId: snapshot.activeWallMaterialSetId,
    activeInteriorWallStyleId: snapshot.activeInteriorWallStyleId,
    activeExteriorWallStyleId: snapshot.activeExteriorWallStyleId,
  }
}

// ── Serialize ─────────────────────────────────────────────────────────────────

export function serializeDungeon(state: SerializableState): string {
  const floors: SerializedFloor[] = []

  if (state.floors && state.floorOrder) {
    for (const fid of state.floorOrder) {
      const fr = state.floors[fid]
      if (!fr) continue
      floors.push(serializeFloorData(fr.id, fr.name, fr.level ?? 0, fr.snapshot))
    }
  } else {
    const activeFloorId = state.activeFloorId ?? 'floor-1'
    floors.push(serializeFloorData(activeFloorId, 'Ground Floor', 0, {
      layers: state.layers,
      layerOrder: state.layerOrder,
      activeLayerId: state.activeLayerId,
      rooms: state.rooms,
      paintedCells: state.paintedCells,
      blockedCells: state.blockedCells,
      outdoorTerrainHeights: state.outdoorTerrainHeights,
      outdoorTerrainStyleCells: state.outdoorTerrainStyleCells,
      exploredCells: state.exploredCells,
      floorTileAssetIds: state.floorTileAssetIds,
      wallStyleAssignments: state.wallStyleAssignments,
      wallCoreAssignments: state.wallCoreAssignments,
      wallSurfaceAssetIds: state.wallSurfaceAssetIds,
      wallSurfaceProps: state.wallSurfaceProps,
      placedObjects: state.placedObjects,
      wallOpenings: state.wallOpenings,
       innerWalls: state.innerWalls,
       splineWallGraph: state.splineWallGraph,
       nextRoomNumber: state.nextRoomNumber,
       activeRoomSetId: state.activeRoomSetId,
       activeWallMaterialSetId: state.activeWallMaterialSetId,
       activeInteriorWallStyleId: state.activeInteriorWallStyleId,
       activeExteriorWallStyleId: state.activeExteriorWallStyleId,
     }))
  }

  const activeFloorId = state.activeFloorId ?? (state.floorOrder?.[0] ?? 'floor-1')
  const floorOrder = state.floorOrder ?? floors.map((f) => f.id)

  const file: DungeonFile = {
    version: CURRENT_VERSION,
    name: state.name ?? 'My Dungeon',
    generatedCharacters: normalizeGeneratedCharactersForSerialization(state.generatedCharacters),
    mapMode: state.mapMode ?? 'indoor',
    outdoorTimeOfDay: typeof state.outdoorTimeOfDay === 'number' ? state.outdoorTimeOfDay : 0.5,
    outdoorTerrainProfiles: state.outdoorTerrainProfiles,
    outdoorTerrainDensity: state.outdoorTerrainDensity ?? 'medium',
    outdoorTerrainType: state.outdoorTerrainType ?? 'mixed',
    outdoorOverpaintRegenerate: state.outdoorOverpaintRegenerate ?? false,
    sceneLighting: { intensity: state.sceneLighting.intensity },
    lightFlickerEnabled: state.lightFlickerEnabled ?? true,
    postProcessing: { ...state.postProcessing },
    activeFloorId,
    floorOrder,
    floors,
  }
  return JSON.stringify(file, null, 2)
}

// ── Deserialize ───────────────────────────────────────────────────────────────

/** Returns null when the JSON is invalid or fails validation. */
export function deserializeDungeon(json: string): SerializableState | null {
  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }

  if (!isObject(raw)) return null

  const version = typeof raw.version === 'number' ? raw.version : 0
  if (version > CURRENT_VERSION) return null

  // v1 → v2: add empty openings field
  if (version < 2 && !Array.isArray((raw as Record<string, unknown>).openings)) {
    raw = { ...(raw as Record<string, unknown>), openings: [] }
  }

  // v2 → v3: add nextRoomNumber
  if (version < 3 && typeof (raw as Record<string, unknown>).nextRoomNumber !== 'number') {
    raw = { ...(raw as Record<string, unknown>), nextRoomNumber: 1 }
  }

  // v3 → v4: add postProcessing defaults
  if (version < 4 && !(raw as Record<string, unknown>).postProcessing) {
    raw = {
      ...(raw as Record<string, unknown>),
      postProcessing: { ...DEFAULT_POST_PROCESSING_SETTINGS },
    }
  }

  // v4 → v5: wrap flat floor data into a floors array
  if (version < 5 && !Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      activeFloorId: 'floor-1',
      floorOrder: ['floor-1'],
      floors: [{
        id: 'floor-1',
        name: 'Ground Floor',
        level: 0,
        layers: r.layers,
        layerOrder: r.layerOrder,
        activeLayerId: r.activeLayerId,
        rooms: r.rooms,
        cells: r.cells,
        objects: r.objects,
        openings: r.openings,
        nextRoomNumber: r.nextRoomNumber ?? 1,
      }],
    }
  }

  // v5 → v6: add object type, inferring player objects from their asset category
  if (version < 6 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) => {
        if (!isObject(floor)) {
          return floor
        }

        const objects = Array.isArray(floor.objects)
          ? floor.objects.map((object) => {
            if (!isObject(object) || typeof object.type === 'string') {
              return object
            }

            const assetId = typeof object.assetId === 'string' ? object.assetId : null
            const asset = assetId ? getContentPackAssetById(assetId) : null

            return {
              ...object,
              type: asset?.category === 'player' ? 'player' : 'prop',
            }
          })
          : floor.objects

        return {
          ...floor,
          objects,
        }
      }),
    }
  }

  if (version < 7 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor) && !Array.isArray(floor.exploredCells)
          ? { ...floor, exploredCells: [] }
          : floor,
      ),
    }
  }

  if (version < 8 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor)
          ? {
              ...floor,
              floorTileAssetIds: isObject(floor.floorTileAssetIds) ? floor.floorTileAssetIds : {},
              wallStyleAssignments: isObject(floor.wallStyleAssignments) ? floor.wallStyleAssignments : {},
              wallCoreAssignments: isObject(floor.wallCoreAssignments) ? floor.wallCoreAssignments : {},
              wallSurfaceAssetIds: isObject(floor.wallSurfaceAssetIds) ? floor.wallSurfaceAssetIds : {},
            }
          : floor,
      ),
    }
  }

  if (version < 9) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      postProcessing: normalizePostProcessingSettings(
        isObject(r.postProcessing) ? r.postProcessing : undefined,
      ),
    }
  }

  if (version < 10) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      mapMode: typeof r.mapMode === 'string' ? r.mapMode : 'indoor',
      outdoorTimeOfDay: typeof r.outdoorTimeOfDay === 'number' ? r.outdoorTimeOfDay : 0.5,
      floors: Array.isArray(r.floors)
        ? (r.floors as unknown[]).map((floor) =>
            isObject(floor)
              ? {
                  ...floor,
                  blockedCells: Array.isArray(floor.blockedCells) ? floor.blockedCells : [],
                  innerWalls: Array.isArray(floor.innerWalls) ? floor.innerWalls : [],
                }
              : floor,
          )
        : r.floors,
    }
  }

  if (version < 11) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      outdoorTerrainProfiles: isObject(r.outdoorTerrainProfiles)
        ? r.outdoorTerrainProfiles
        : {
            mixed: {
              density: typeof r.outdoorTerrainDensity === 'string' ? r.outdoorTerrainDensity : 'medium',
              overpaintRegenerate: r.outdoorOverpaintRegenerate === true,
            },
            rocks: { density: 'medium', overpaintRegenerate: false },
            'dead-forest': { density: 'medium', overpaintRegenerate: false },
          },
    }
  }

  if (version < 12 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor) && !Array.isArray(floor.outdoorTerrainStyleCells)
          ? { ...floor, outdoorTerrainStyleCells: [] }
          : floor,
      ),
    }
  }

  if (version < 13 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor) && !Array.isArray(floor.outdoorTerrainHeights)
          ? { ...floor, outdoorTerrainHeights: [] }
          : floor,
      ),
    }
  }

  if (version < 15) {
    raw = {
      defaultOutdoorTerrainStyle: DEFAULT_OUTDOOR_TERRAIN_STYLE,
      ...(isObject(raw) ? raw : {}),
    }
  }

  if (version < 16 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor) && !isObject(floor.wallSurfaceProps)
          ? { ...floor, wallSurfaceProps: {} }
          : floor,
      ),
    }
  }

  if (version < 17) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      lightFlickerEnabled: typeof r.lightFlickerEnabled === 'boolean' ? r.lightFlickerEnabled : true,
    }
  }

  if (version < 18 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor)
          ? {
              ...floor,
              openings: Array.isArray(floor.openings)
                ? floor.openings.map((opening) =>
                    isObject(opening) && opening.source !== 'generated'
                      ? { ...opening, source: 'manual' }
                      : opening,
                  )
                : [],
            }
          : floor,
      ),
    }
  }

  if (version < 19 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor)
          ? {
              ...floor,
              openings: Array.isArray(floor.openings)
                ? floor.openings.map((opening) =>
                    isObject(opening) && !isObject(opening.objectProps)
                      ? { ...opening, objectProps: {} }
                      : opening,
                  )
                : [],
            }
          : floor,
      ),
    }
  }

  if (version < 20 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor) && typeof floor.activeRoomSetId !== 'string'
          ? { ...floor, activeRoomSetId: getDefaultRoomSetId() }
          : floor,
      ),
    }
  }

  if (version < 21 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) =>
        isObject(floor) && !isObject(floor.splineWallGraph)
          ? { ...floor, splineWallGraph: serializeSplineWallGraph(createEmptySplineWallGraph()) }
          : floor,
      ),
    }
  }

  if (version < 24 && Array.isArray((raw as Record<string, unknown>).floors)) {
    const r = raw as Record<string, unknown>
    raw = {
      ...r,
      floors: (r.floors as unknown[]).map((floor) => {
        if (!isObject(floor)) {
          return floor
        }

        const activeRoomSetId = typeof floor.activeRoomSetId === 'string'
          ? floor.activeRoomSetId
          : getDefaultRoomSetId()
        const wallStyleId = getDefaultWallStyleIdForRoomSet(activeRoomSetId)
        return {
          ...floor,
          activeInteriorWallStyleId: typeof floor.activeInteriorWallStyleId === 'string'
            ? floor.activeInteriorWallStyleId
            : wallStyleId,
          activeExteriorWallStyleId: typeof floor.activeExteriorWallStyleId === 'string'
            ? floor.activeExteriorWallStyleId
            : wallStyleId,
        }
      }),
    }
  }

  return parseFile(raw as Record<string, unknown>)
}

// ── Parsing / validation ──────────────────────────────────────────────────────

function parseSplineWallGraph(raw: unknown): SplineWallGraph {
  if (!isObject(raw)) {
    return createEmptySplineWallGraph()
  }

  const graph = createEmptySplineWallGraph()

  const nodes = Array.isArray(raw.nodes) ? raw.nodes : []
  for (const value of nodes) {
    if (!isObject(value) || typeof value.id !== 'string') {
      continue
    }

    graph.nodes[value.id] = {
      id: value.id,
      position: [
        typeof value.x === 'number' ? value.x : 0,
        typeof value.z === 'number' ? value.z : 0,
      ],
      layerId: typeof value.layerId === 'string' ? value.layerId : 'default',
      roomId: typeof value.roomId === 'string' ? value.roomId : null,
      cornerMode: value.cornerMode === 'rounded' || value.cornerMode === 'diagonal' || value.cornerMode === 'square'
        ? value.cornerMode
        : null,
      cornerAmount: typeof value.cornerAmount === 'number' ? value.cornerAmount : null,
    }
  }

  const segments = Array.isArray(raw.segments) ? raw.segments : []
  for (const value of segments) {
    if (
      !isObject(value)
      || typeof value.id !== 'string'
      || typeof value.pathId !== 'string'
      || typeof value.startNodeId !== 'string'
      || typeof value.endNodeId !== 'string'
    ) {
      continue
    }

    graph.segments[value.id] = {
      id: value.id,
      pathId: value.pathId,
      startNodeId: value.startNodeId,
      endNodeId: value.endNodeId,
      layerId: typeof value.layerId === 'string' ? value.layerId : 'default',
      roomId: typeof value.roomId === 'string' ? value.roomId : null,
      wallKey: typeof value.wallKey === 'string' ? value.wallKey : null,
      wallHeight: typeof value.wallHeight === 'number' ? value.wallHeight : null,
      wallThickness: typeof value.wallThickness === 'number' ? value.wallThickness : null,
      cutouts: (Array.isArray(value.cutouts) ? value.cutouts : []).flatMap((cutout) => {
        if (!isObject(cutout) || typeof cutout.id !== 'string') {
          return []
        }

        return [{
          id: cutout.id,
          kind: cutout.kind === 'door' || cutout.kind === 'passage' || cutout.kind === 'window'
            ? cutout.kind
            : 'passage',
          startRatio: typeof cutout.startRatio === 'number' ? cutout.startRatio : 0,
          endRatio: typeof cutout.endRatio === 'number' ? cutout.endRatio : 1,
          bottomHeight: typeof cutout.bottomHeight === 'number' ? cutout.bottomHeight : 0,
          topHeight: typeof cutout.topHeight === 'number' ? cutout.topHeight : null,
          assetId: typeof cutout.assetId === 'string' ? cutout.assetId : null,
          openingId: typeof cutout.openingId === 'string' ? cutout.openingId : null,
          objectProps: isObject(cutout.objectProps) ? (cutout.objectProps as Record<string, unknown>) : {},
        }]
      }),
    }
  }

  const paths = Array.isArray(raw.paths) ? raw.paths : []
  for (const value of paths) {
    if (!isObject(value) || typeof value.id !== 'string') {
      continue
    }

    graph.paths[value.id] = {
      id: value.id,
      layerId: typeof value.layerId === 'string' ? value.layerId : 'default',
      roomId: typeof value.roomId === 'string' ? value.roomId : null,
      closed: value.closed === true,
      nodeIds: (Array.isArray(value.nodeIds) ? value.nodeIds : []).filter(
        (nodeId): nodeId is string => typeof nodeId === 'string',
      ),
      segmentIds: (Array.isArray(value.segmentIds) ? value.segmentIds : []).filter(
        (segmentId): segmentId is string => typeof segmentId === 'string',
      ),
    }
  }

  return graph
}

function hydrateOpeningSegmentOwnership(
  splineWallGraph: SplineWallGraph,
  paintedCells: PaintedCells,
  wallOpenings: Record<string, OpeningRecord>,
): Record<string, OpeningRecord> {
  if (!hasSplineWallGraphPaths(splineWallGraph)) {
    return wallOpenings
  }

  const queryCache = createSplineWallQueryCache(splineWallGraph)
  let mutated = false
  const hydrated = Object.fromEntries(
    Object.entries(wallOpenings).map(([openingId, opening]) => {
      if (opening.segmentId) {
        return [openingId, opening]
      }

      const wallTransform = wallKeyToWorldPosition(opening.wallKey)
      if (!wallTransform) {
        return [openingId, opening]
      }

      const placement = buildSplineWallOpeningPlacement(
        { x: wallTransform.position[0], z: wallTransform.position[2] },
        splineWallGraph,
        queryCache,
        paintedCells,
        opening.assetId,
      )
      if (!placement?.valid) {
        return [openingId, opening]
      }

      mutated = true
      return [openingId, {
        ...opening,
        segmentId: placement.segmentId ?? null,
        segmentStartRatio: placement.segmentStartRatio ?? null,
        segmentEndRatio: placement.segmentEndRatio ?? null,
      }]
    }),
  ) as Record<string, OpeningRecord>

  return mutated ? hydrated : wallOpenings
}

function parseFloorData(raw: Record<string, unknown>): {
  layers: Record<string, Layer>
  layerOrder: string[]
  activeLayerId: string
  rooms: Record<string, Room>
  paintedCells: PaintedCells
  blockedCells: BlockedCells
  outdoorTerrainHeights: OutdoorTerrainHeightfield
  outdoorTerrainStyleCells: OutdoorTerrainStyleCells
  exploredCells: Record<string, true>
  floorTileAssetIds: Record<string, string>
  wallStyleAssignments: Record<string, string>
  wallCoreAssignments: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  placedObjects: Record<string, DungeonObjectRecord>
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
  splineWallGraph: SplineWallGraph
   occupancy: Record<string, string>
   nextRoomNumber: number
   activeRoomSetId: string
   activeWallMaterialSetId: string
   activeInteriorWallStyleId: string
   activeExteriorWallStyleId: string
  } {
  const layers: Record<string, Layer> = {}
  const layersArr = Array.isArray(raw.layers) ? (raw.layers as unknown[]) : []
  for (const l of layersArr) {
    if (!isObject(l)) continue
    const layer: Layer = {
      id: requireString(l, 'id'),
      name: requireString(l, 'name'),
      visible: typeof l.visible === 'boolean' ? l.visible : true,
      locked: typeof l.locked === 'boolean' ? l.locked : false,
    }
    layers[layer.id] = layer
  }
  if (!layers['default']) {
    layers['default'] = { id: 'default', name: 'Default', visible: true, locked: false }
  }

  const layerOrder = Array.isArray(raw.layerOrder)
    ? (raw.layerOrder as unknown[]).filter((x): x is string => typeof x === 'string')
    : ['default']

  const activeLayerId =
    typeof raw.activeLayerId === 'string' && layers[raw.activeLayerId]
      ? raw.activeLayerId
      : 'default'

  const rooms: Record<string, Room> = {}
  const roomsArr = Array.isArray(raw.rooms) ? (raw.rooms as unknown[]) : []
  for (const r of roomsArr) {
    if (!isObject(r)) continue
    const room: Room = {
      id: requireString(r, 'id'),
      name: requireString(r, 'name'),
      layerId: typeof r.layerId === 'string' ? r.layerId : 'default',
      roomSetId: typeof r.roomSetId === 'string' ? r.roomSetId : null,
      wallMaterialSetId: typeof r.wallMaterialSetId === 'string' ? r.wallMaterialSetId : null,
      floorAssetId: typeof r.floorAssetId === 'string' ? r.floorAssetId : null,
      wallAssetId: typeof r.wallAssetId === 'string' ? r.wallAssetId : null,
    }
    rooms[room.id] = room
  }

  const paintedCells: PaintedCells = {}
  const cellsArr = Array.isArray(raw.cells) ? (raw.cells as unknown[]) : []
  for (const c of cellsArr) {
    if (!isObject(c)) continue
    const cell: GridCell = [
      typeof c.x === 'number' ? c.x : 0,
      typeof c.z === 'number' ? c.z : 0,
    ]
    const layerId = typeof c.layerId === 'string' && layers[c.layerId] ? c.layerId : 'default'
    const roomId = typeof c.roomId === 'string' && rooms[c.roomId] ? c.roomId : null
    paintedCells[getCellKey(cell)] = { cell, layerId, roomId }
  }
  const blockedCells: BlockedCells = {}
  const blockedCellsArr = Array.isArray(raw.blockedCells) ? (raw.blockedCells as unknown[]) : []
  for (const c of blockedCellsArr) {
    if (!isObject(c)) continue
    const cell: GridCell = [
      typeof c.x === 'number' ? c.x : 0,
      typeof c.z === 'number' ? c.z : 0,
    ]
    const layerId = typeof c.layerId === 'string' && layers[c.layerId] ? c.layerId : 'default'
    blockedCells[getCellKey(cell)] = { cell, layerId, roomId: null }
  }
  const outdoorTerrainHeights: OutdoorTerrainHeightfield = {}
  const outdoorTerrainHeightsArr = Array.isArray(raw.outdoorTerrainHeights)
    ? (raw.outdoorTerrainHeights as unknown[])
    : []
  for (const record of outdoorTerrainHeightsArr) {
    if (!isObject(record)) continue
    const cell: GridCell = [
      typeof record.x === 'number' ? record.x : 0,
      typeof record.z === 'number' ? record.z : 0,
    ]
    const rawHeight = typeof record.height === 'number' ? record.height : 0
    const level = Number.isInteger(rawHeight)
      ? rawHeight
      : Math.round(rawHeight / OUTDOOR_TERRAIN_LEVEL_HEIGHT)
    if (level === 0) {
      continue
    }
    outdoorTerrainHeights[getCellKey(cell)] = { cell, level }
  }
  const outdoorTerrainStyleCells: OutdoorTerrainStyleCells = {}
  const outdoorTerrainStyleCellsArr = Array.isArray(raw.outdoorTerrainStyleCells)
    ? (raw.outdoorTerrainStyleCells as unknown[])
    : []
  for (const c of outdoorTerrainStyleCellsArr) {
    if (!isObject(c)) continue
    const cell: GridCell = [
      typeof c.x === 'number' ? c.x : 0,
      typeof c.z === 'number' ? c.z : 0,
    ]
    const layerId = typeof c.layerId === 'string' && layers[c.layerId] ? c.layerId : 'default'
    const terrainStyle: OutdoorTerrainStyle = OUTDOOR_TERRAIN_STYLES.includes(c.terrainStyle as OutdoorTerrainStyle)
      ? c.terrainStyle as OutdoorTerrainStyle
      : DEFAULT_OUTDOOR_TERRAIN_STYLE
    outdoorTerrainStyleCells[getCellKey(cell)] = { cell, layerId, terrainStyle }
  }

  const exploredCells = Object.fromEntries(
    (Array.isArray(raw.exploredCells) ? raw.exploredCells : [])
      .filter((value): value is string => typeof value === 'string')
      .map((cellKey) => [cellKey, true as const]),
  )
  const floorTileAssetIds = Object.fromEntries(
    Object.entries(isObject(raw.floorTileAssetIds) ? raw.floorTileAssetIds : {}).filter(
      ([cellKey, assetId]) => typeof cellKey === 'string' && typeof assetId === 'string',
    ),
  ) as Record<string, string>
  const wallStyleAssignments = Object.fromEntries(
    Object.entries(isObject(raw.wallStyleAssignments) ? raw.wallStyleAssignments : {}).filter(
      ([key, wallStyleId]) =>
        typeof key === 'string'
        && typeof wallStyleId === 'string'
        && Boolean(getContentPackWallStyleById('dungeon', wallStyleId)),
    ),
  ) as Record<string, string>
  const wallCoreAssignments = Object.fromEntries(
    Object.entries(isObject(raw.wallCoreAssignments) ? raw.wallCoreAssignments : {}).filter(
      ([key, wallStyleId]) =>
        typeof key === 'string'
        && typeof wallStyleId === 'string'
        && Boolean(getContentPackWallStyleById('dungeon', wallStyleId)),
    ),
  ) as Record<string, string>
  const wallSurfaceAssetIds = Object.fromEntries(
    Object.entries(isObject(raw.wallSurfaceAssetIds) ? raw.wallSurfaceAssetIds : {}).filter(
      ([wallKey, assetId]) => typeof wallKey === 'string' && typeof assetId === 'string',
    ),
  ) as Record<string, string>
  const wallSurfaceProps = Object.fromEntries(
    Object.entries(isObject(raw.wallSurfaceProps) ? raw.wallSurfaceProps : {}).filter(
      ([wallKey, props]) => typeof wallKey === 'string' && isObject(props),
    ).map(([wallKey, props]) => [wallKey, { ...(props as Record<string, unknown>) }]),
  ) as Record<string, Record<string, unknown>>

  const placedObjects: Record<string, DungeonObjectRecord> = {}
  const occupancy: Record<string, string> = {}
  const objectsArr = Array.isArray(raw.objects) ? (raw.objects as unknown[]) : []
  for (const o of objectsArr) {
    if (!isObject(o)) continue
    const id = requireString(o, 'id')
    const cellKey = requireString(o, 'cellKey')
    const assetId = typeof o.assetId === 'string' ? o.assetId : null
    const asset = assetId ? getContentPackAssetById(assetId) : null
    const obj: DungeonObjectRecord = {
      id,
      type: o.type === 'player' || asset?.category === 'player' ? 'player' : 'prop',
      assetId,
      position: parseTuple3(o.position) ?? [0, 0, 0],
      rotation: parseTuple3(o.rotation) ?? [0, 0, 0],
      cell: parseGridCell(o.cell) ?? [0, 0],
      cellKey,
      layerId: typeof o.layerId === 'string' && layers[o.layerId] ? o.layerId : 'default',
      props: isObject(o.props) ? (o.props as Record<string, unknown>) : {},
    }
    placedObjects[id] = obj
    occupancy[cellKey] = id
  }

  const wallOpenings: Record<string, OpeningRecord> = {}
  const openingsArr = Array.isArray(raw.openings) ? (raw.openings as unknown[]) : []
  for (const o of openingsArr) {
    if (!isObject(o)) continue
    const id = requireString(o, 'id')
    const wallKey = requireString(o, 'wallKey')
    const rawWidth = o.width
    const width: 1 | 2 | 3 = rawWidth === 1 || rawWidth === 2 || rawWidth === 3 ? rawWidth : 1
    wallOpenings[id] = {
      id,
      assetId: typeof o.assetId === 'string' ? o.assetId : null,
      wallKey, width,
      segmentId: typeof o.segmentId === 'string' ? o.segmentId : null,
      segmentStartRatio: typeof o.segmentStartRatio === 'number' ? o.segmentStartRatio : null,
      segmentEndRatio: typeof o.segmentEndRatio === 'number' ? o.segmentEndRatio : null,
      flipped: o.flipped === true,
      objectProps: isObject(o.objectProps) ? (o.objectProps as Record<string, unknown>) : {},
      layerId: typeof o.layerId === 'string' && layers[o.layerId] ? o.layerId : 'default',
      source: o.source === 'generated' ? 'generated' : 'manual',
    }
  }

  const innerWalls = Object.fromEntries(
    (Array.isArray(raw.innerWalls) ? raw.innerWalls : [])
      .filter((wallKey): wallKey is string => typeof wallKey === 'string')
      .map((wallKey) => [wallKey, { wallKey, layerId: activeLayerId } satisfies InnerWallRecord]),
  ) as Record<string, InnerWallRecord>
  const parsedSplineWallGraph = parseSplineWallGraph(raw.splineWallGraph)
  const hydratedWallOpenings = hydrateOpeningSegmentOwnership(parsedSplineWallGraph, paintedCells, wallOpenings)
  const splineWallGraph = syncSplineWallGraphCutoutsFromOpenings(
    parsedSplineWallGraph,
    hydratedWallOpenings,
  )

  return {
    layers, layerOrder, activeLayerId, rooms,
    paintedCells,
    blockedCells,
    outdoorTerrainHeights,
    outdoorTerrainStyleCells,
    exploredCells,
    floorTileAssetIds,
    wallStyleAssignments,
    wallCoreAssignments,
    wallSurfaceAssetIds,
    wallSurfaceProps,
    placedObjects,
    wallOpenings: hydratedWallOpenings,
    innerWalls,
    splineWallGraph,
    occupancy,
    nextRoomNumber: typeof raw.nextRoomNumber === 'number' && raw.nextRoomNumber >= 1
      ? raw.nextRoomNumber : 1,
    activeRoomSetId:
      typeof raw.activeRoomSetId === 'string' ? raw.activeRoomSetId : getDefaultRoomSetId(),
    activeWallMaterialSetId:
      typeof raw.activeWallMaterialSetId === 'string' ? raw.activeWallMaterialSetId : getDefaultWallMaterialSetId(),
    activeInteriorWallStyleId:
      sanitizeWallStyleId(raw.activeInteriorWallStyleId, getDefaultInteriorWallStyleId()),
    activeExteriorWallStyleId:
      sanitizeWallStyleId(raw.activeExteriorWallStyleId, getDefaultExteriorWallStyleId()),
  }
}

function parseFile(raw: Record<string, unknown>): SerializableState | null {
  try {
    const sceneLightingRaw = isObject(raw.sceneLighting) ? raw.sceneLighting : {}
    const ppRaw = isObject(raw.postProcessing) ? raw.postProcessing : {}

    const floorsArr = Array.isArray(raw.floors) ? (raw.floors as unknown[]) : []
    const floorOrder: string[] = Array.isArray(raw.floorOrder)
      ? (raw.floorOrder as unknown[]).filter((x): x is string => typeof x === 'string')
      : floorsArr.map((f) => isObject(f) ? String(f.id) : '')
    const activeFloorId = typeof raw.activeFloorId === 'string'
      ? raw.activeFloorId
      : (floorOrder[0] ?? 'floor-1')

    // Parse all floors into FloorRecord-like objects (without history/future)
    const floors: Record<string, FloorRecord> = {}
    let activeFloorData: ReturnType<typeof parseFloorData> | null = null

    for (const f of floorsArr) {
      if (!isObject(f)) continue
      const id = typeof f.id === 'string' ? f.id : 'floor-1'
      const name = typeof f.name === 'string' ? f.name : 'Floor'
      const level = typeof f.level === 'number' ? f.level : 0
      const data = parseFloorData(f)
      floors[id] = {
        id, name, level,
        snapshot: {
          ...data,
          tool: 'select' as const,
          activeRoomSetId: data.activeRoomSetId,
          activeWallMaterialSetId: data.activeWallMaterialSetId,
          activeInteriorWallStyleId: data.activeInteriorWallStyleId,
          activeExteriorWallStyleId: data.activeExteriorWallStyleId,
          selectedAssetIds: {
            floor: getDefaultAssetIdByCategory('floor'),
            wall: getDefaultAssetIdByCategory('wall'),
            prop: getDefaultAssetIdByCategory('prop'),
            opening: getDefaultAssetIdByCategory('opening'),
            player: getDefaultAssetIdByCategory('player'),
          },
          selection: null,
        },
        history: [],
        future: [],
      }
      if (id === activeFloorId) activeFloorData = data
    }

    // Fallback: if active floor not found, use first
    if (!activeFloorData && floorsArr.length > 0) {
      const first = floorsArr[0]
      if (isObject(first)) activeFloorData = parseFloorData(first)
    }

    // If no floors at all, create empty
    if (!activeFloorData) {
      activeFloorData = parseFloorData({})
      const fallbackId = 'floor-1'
      floors[fallbackId] = {
        id: fallbackId, name: 'Ground Floor', level: 0,
        snapshot: {
          ...activeFloorData,
          tool: 'select',
          activeRoomSetId: activeFloorData.activeRoomSetId,
          activeWallMaterialSetId: activeFloorData.activeWallMaterialSetId,
          activeInteriorWallStyleId: activeFloorData.activeInteriorWallStyleId,
          activeExteriorWallStyleId: activeFloorData.activeExteriorWallStyleId,
          selectedAssetIds: {
            floor: getDefaultAssetIdByCategory('floor'),
            wall: getDefaultAssetIdByCategory('wall'),
            prop: getDefaultAssetIdByCategory('prop'),
            opening: getDefaultAssetIdByCategory('opening'),
            player: getDefaultAssetIdByCategory('player'),
          },
          selection: null,
        },
        history: [], future: [],
      }
    }

    const generatedCharacters = parseGeneratedCharacters(raw.generatedCharacters)
    if (generatedCharacters) {
      syncGeneratedCharacterAssets(generatedCharacters)
    }

    const parsedState: SerializableState = {
      name: typeof raw.name === 'string' ? raw.name : 'My Dungeon',
      ...(generatedCharacters ? { generatedCharacters } : {}),
      mapMode: raw.mapMode === 'outdoor' ? 'outdoor' : 'indoor',
      outdoorTimeOfDay:
        typeof raw.outdoorTimeOfDay === 'number'
          ? Math.max(0, Math.min(1, raw.outdoorTimeOfDay))
          : 0.5,
      defaultOutdoorTerrainStyle:
        OUTDOOR_TERRAIN_STYLES.includes(raw.defaultOutdoorTerrainStyle as OutdoorTerrainStyle)
          ? raw.defaultOutdoorTerrainStyle as OutdoorTerrainStyle
          : DEFAULT_OUTDOOR_TERRAIN_STYLE,
      outdoorTerrainProfiles: parseOutdoorTerrainProfiles(raw.outdoorTerrainProfiles),
      outdoorTerrainDensity:
        raw.outdoorTerrainDensity === 'sparse' || raw.outdoorTerrainDensity === 'medium' || raw.outdoorTerrainDensity === 'dense'
          ? raw.outdoorTerrainDensity
          : 'medium',
      outdoorTerrainType:
        raw.outdoorTerrainType === 'rocks' || raw.outdoorTerrainType === 'mixed' || raw.outdoorTerrainType === 'dead-forest'
          ? raw.outdoorTerrainType
          : 'mixed',
      outdoorOverpaintRegenerate: raw.outdoorOverpaintRegenerate === true,
      sceneLighting: {
        intensity: typeof sceneLightingRaw.intensity === 'number' ? sceneLightingRaw.intensity : 1,
      },
      lightFlickerEnabled: raw.lightFlickerEnabled !== false,
      postProcessing: normalizePostProcessingSettings(ppRaw),
      // Active floor working state (spread into top-level for the store)
      ...activeFloorData,
      floors,
      floorOrder,
      activeFloorId,
    }

    return sanitizePersistedAssetReferences(parsedState)
  } catch {
    return null
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireString(obj: Record<string, unknown>, key: string): string {
  if (typeof obj[key] !== 'string') throw new Error(`Missing string field: ${key}`)
  return obj[key] as string
}

function parseTuple3(value: unknown): [number, number, number] | null {
  if (!Array.isArray(value) || value.length < 3) return null
  const [a, b, c] = value
  if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') return null
  return [a, b, c]
}

function parseGridCell(value: unknown): GridCell | null {
  if (!Array.isArray(value) || value.length < 2) return null
  const [x, z] = value
  if (typeof x !== 'number' || typeof z !== 'number') return null
  return [x, z]
}

function parseOutdoorTerrainProfiles(value: unknown): Partial<Record<OutdoorTerrainType, Partial<OutdoorTerrainProfile>>> {
  if (!isObject(value)) {
    return {
      mixed: { density: 'medium', overpaintRegenerate: false },
      rocks: { density: 'medium', overpaintRegenerate: false },
      'dead-forest': { density: 'medium', overpaintRegenerate: false },
    }
  }

  const parseProfile = (profileValue: unknown): Partial<OutdoorTerrainProfile> => {
    if (!isObject(profileValue)) {
      return {}
    }

    return {
      density:
        profileValue.density === 'sparse' || profileValue.density === 'medium' || profileValue.density === 'dense'
          ? profileValue.density
          : undefined,
      overpaintRegenerate:
        typeof profileValue.overpaintRegenerate === 'boolean' ? profileValue.overpaintRegenerate : undefined,
    }
  }

  return {
    mixed: parseProfile(value.mixed),
    rocks: parseProfile(value.rocks),
    'dead-forest': parseProfile(value['dead-forest']),
  }
}

function parseGeneratedCharacters(value: unknown): Record<string, GeneratedCharacterRecord> | undefined {
  if (!isObject(value)) {
    return undefined
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([assetId, record]) => {
      if (typeof assetId !== 'string' || !isObject(record)) {
        return []
      }

      return [[assetId, normalizeGeneratedCharacterRecord(assetId, record)]]
    }),
  )
}

function normalizeGeneratedCharactersForSerialization(
  characters: Record<string, GeneratedCharacterRecord> | undefined,
) {
  if (!characters) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(characters).map(([assetId, record]) => [
      assetId,
      normalizeGeneratedCharacterRecord(assetId, record),
    ]),
  )
}

function getDefaultRoomSetId() {
  return getDefaultContentPackRoomSetId(ROOM_SET_CONTENT_PACK_ID) ?? FALLBACK_ROOM_SET_ID
}

function getDefaultWallMaterialSetId() {
  return getDefaultContentPackWallMaterialSetId(WALL_MATERIAL_SET_CONTENT_PACK_ID) ?? FALLBACK_WALL_MATERIAL_SET_ID
}

function getDefaultWallStyleIdForRoomSet(roomSetId: string) {
  return getContentPackRoomSetById(ROOM_SET_CONTENT_PACK_ID, roomSetId)?.wallStyleId ?? getDefaultWallStyleId()
}

function sanitizeWallStyleId(raw: unknown, fallback: string) {
  return typeof raw === 'string' && getContentPackWallStyleById(ROOM_SET_CONTENT_PACK_ID, raw)
    ? raw
    : fallback
}

// Suppress "unused import" — kept for completeness in registry-aware migrations
void getDefaultAssetIdByCategory
