/**
 * Dungeon file serialization / deserialization.
 *
 * Format versioning: increment CURRENT_VERSION and add a migration in
 * `migrateFile` whenever the schema changes in a breaking way.
 */
import { getDefaultAssetIdByCategory } from '../content-packs/registry'
import { getContentPackAssetById } from '../content-packs/registry'
import { sanitizePersistedAssetReferences } from './assetReferences'
import type {
  DungeonObjectRecord,
  DungeonObjectType,
  FloorRecord,
  Layer,
  OpeningRecord,
  PaintedCells,
  Room,
} from './useDungeonStore'
import type { GridCell } from '../hooks/useSnapToGrid'
import { getCellKey } from '../hooks/useSnapToGrid'

const CURRENT_VERSION = 8

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
  flipped: boolean
  layerId: string
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
  exploredCells: string[]
  floorTileAssetIds?: Record<string, string>
  wallSurfaceAssetIds?: Record<string, string>
  objects: SerializedObject[]
  openings: SerializedOpening[]
  nextRoomNumber: number
}

export type DungeonFile = {
  version: number
  name: string
  sceneLighting: { intensity: number }
  postProcessing: { enabled: boolean; focusDistance: number; focalLength: number; bokehScale: number }
  activeFloorId: string
  floorOrder: string[]
  floors: SerializedFloor[]
}

// ── State shape we serialize from / into ─────────────────────────────────────

export type SerializableState = {
  name?: string
  sceneLighting: { intensity: number }
  postProcessing: { enabled: boolean; focusDistance: number; focalLength: number; bokehScale: number }
  // Active floor working state (flat, for backwards compat)
  layers: Record<string, Layer>
  layerOrder: string[]
  activeLayerId: string
  rooms: Record<string, Room>
  paintedCells: PaintedCells
  exploredCells: Record<string, true>
  floorTileAssetIds: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  placedObjects: Record<string, DungeonObjectRecord>
  wallOpenings: Record<string, OpeningRecord>
  occupancy: Record<string, string>
  nextRoomNumber: number
  // Multi-floor data
  floors?: Record<string, FloorRecord>
  floorOrder?: string[]
  activeFloorId?: string
}

// ── Helpers: floor snapshot → serialized floor ────────────────────────────────

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
    exploredCells: Record<string, true>
    floorTileAssetIds: Record<string, string>
    wallSurfaceAssetIds: Record<string, string>
    placedObjects: Record<string, DungeonObjectRecord>
    wallOpenings: Record<string, OpeningRecord>
    nextRoomNumber: number
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
    exploredCells: Object.keys(snapshot.exploredCells),
    floorTileAssetIds: { ...snapshot.floorTileAssetIds },
    wallSurfaceAssetIds: { ...snapshot.wallSurfaceAssetIds },
    objects: Object.values(snapshot.placedObjects).map((obj) => ({
      id: obj.id, type: obj.type, assetId: obj.assetId, position: obj.position, rotation: obj.rotation,
      cell: obj.cell, cellKey: obj.cellKey, layerId: obj.layerId, props: obj.props,
    })),
    openings: Object.values(snapshot.wallOpenings).map((o) => ({
      id: o.id, assetId: o.assetId, wallKey: o.wallKey, width: o.width,
      flipped: o.flipped ?? false, layerId: o.layerId,
    })),
    nextRoomNumber: snapshot.nextRoomNumber,
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
      exploredCells: state.exploredCells,
      floorTileAssetIds: state.floorTileAssetIds,
      wallSurfaceAssetIds: state.wallSurfaceAssetIds,
      placedObjects: state.placedObjects,
      wallOpenings: state.wallOpenings,
      nextRoomNumber: state.nextRoomNumber,
    }))
  }

  const activeFloorId = state.activeFloorId ?? (state.floorOrder?.[0] ?? 'floor-1')
  const floorOrder = state.floorOrder ?? floors.map((f) => f.id)

  const file: DungeonFile = {
    version: CURRENT_VERSION,
    name: state.name ?? 'My Dungeon',
    sceneLighting: { intensity: state.sceneLighting.intensity },
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
      postProcessing: { enabled: false, focusDistance: 0.5, focalLength: 3, bokehScale: 2 },
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
              wallSurfaceAssetIds: isObject(floor.wallSurfaceAssetIds) ? floor.wallSurfaceAssetIds : {},
            }
          : floor,
      ),
    }
  }

  return parseFile(raw as Record<string, unknown>)
}

// ── Parsing / validation ──────────────────────────────────────────────────────

function parseFloorData(raw: Record<string, unknown>): {
  layers: Record<string, Layer>
  layerOrder: string[]
  activeLayerId: string
  rooms: Record<string, Room>
  paintedCells: PaintedCells
  exploredCells: Record<string, true>
  floorTileAssetIds: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  placedObjects: Record<string, DungeonObjectRecord>
  wallOpenings: Record<string, OpeningRecord>
  occupancy: Record<string, string>
  nextRoomNumber: number
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
  const wallSurfaceAssetIds = Object.fromEntries(
    Object.entries(isObject(raw.wallSurfaceAssetIds) ? raw.wallSurfaceAssetIds : {}).filter(
      ([wallKey, assetId]) => typeof wallKey === 'string' && typeof assetId === 'string',
    ),
  ) as Record<string, string>

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
      flipped: o.flipped === true,
      layerId: typeof o.layerId === 'string' && layers[o.layerId] ? o.layerId : 'default',
    }
  }

  return {
    layers, layerOrder, activeLayerId, rooms,
    paintedCells, exploredCells, floorTileAssetIds, wallSurfaceAssetIds,
    placedObjects, wallOpenings, occupancy,
    nextRoomNumber: typeof raw.nextRoomNumber === 'number' && raw.nextRoomNumber >= 1
      ? raw.nextRoomNumber : 1,
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
          tool: 'move' as const,
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
        snapshot: { ...activeFloorData, tool: 'move', selectedAssetIds: {
          floor: getDefaultAssetIdByCategory('floor'),
          wall: getDefaultAssetIdByCategory('wall'),
          prop: getDefaultAssetIdByCategory('prop'),
          opening: getDefaultAssetIdByCategory('opening'),
          player: getDefaultAssetIdByCategory('player'),
        }, selection: null },
        history: [], future: [],
      }
    }

    const parsedState: SerializableState = {
      name: typeof raw.name === 'string' ? raw.name : 'My Dungeon',
      sceneLighting: {
        intensity: typeof sceneLightingRaw.intensity === 'number' ? sceneLightingRaw.intensity : 1,
      },
      postProcessing: {
        enabled: ppRaw.enabled === true,
        focusDistance: typeof ppRaw.focusDistance === 'number' ? ppRaw.focusDistance : 0.5,
        focalLength: typeof ppRaw.focalLength === 'number' ? ppRaw.focalLength : 3,
        bokehScale: typeof ppRaw.bokehScale === 'number' ? ppRaw.bokehScale : 2,
      },
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

// Suppress "unused import" — kept for completeness in registry-aware migrations
void getDefaultAssetIdByCategory
