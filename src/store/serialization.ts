/**
 * Dungeon file serialization / deserialization.
 *
 * Format versioning: increment CURRENT_VERSION and add a migration in
 * `migrateFile` whenever the schema changes in a breaking way.
 */
import { getDefaultAssetIdByCategory } from '../content-packs/registry'
import type {
  DungeonObjectRecord,
  Layer,
  OpeningRecord,
  PaintedCellRecord,
  PaintedCells,
  Room,
} from './useDungeonStore'
import type { GridCell } from '../hooks/useSnapToGrid'
import { getCellKey } from '../hooks/useSnapToGrid'

const CURRENT_VERSION = 2

// ── Serialized shapes (compact, no redundant keys) ────────────────────────────

type SerializedCell = {
  x: number
  z: number
  layerId: string
  roomId: string | null
}

type SerializedObject = {
  id: string
  assetId: string | null
  position: [number, number, number]
  rotation: [number, number, number]
  cell: GridCell
  cellKey: string
  layerId: string
  props: Record<string, unknown>
}

export type DungeonFile = {
  version: number
  name: string
  sceneLighting: { intensity: number }
  groundPlane: 'black' | 'green'
  layers: Layer[]
  layerOrder: string[]
  activeLayerId: string
  rooms: Room[]
  cells: SerializedCell[]
  objects: SerializedObject[]
  openings: SerializedOpening[]
}

type SerializedOpening = {
  id: string
  assetId: string | null
  wallKey: string
  width: 1 | 2 | 3
  layerId: string
}

// ── State shape we serialize from / into ─────────────────────────────────────

export type SerializableState = {
  name?: string
  sceneLighting: { intensity: number }
  groundPlane: 'black' | 'green'
  layers: Record<string, Layer>
  layerOrder: string[]
  activeLayerId: string
  rooms: Record<string, Room>
  paintedCells: PaintedCells
  placedObjects: Record<string, DungeonObjectRecord>
  wallOpenings: Record<string, OpeningRecord>
  occupancy: Record<string, string>
}

// ── Serialize ─────────────────────────────────────────────────────────────────

export function serializeDungeon(state: SerializableState): string {
  const file: DungeonFile = {
    version: CURRENT_VERSION,
    name: state.name ?? 'My Dungeon',
    sceneLighting: { intensity: state.sceneLighting.intensity },
    groundPlane: state.groundPlane,
    layers: Object.values(state.layers),
    layerOrder: [...state.layerOrder],
    activeLayerId: state.activeLayerId,
    rooms: Object.values(state.rooms),
    cells: Object.values(state.paintedCells).map((r) => ({
      x: r.cell[0],
      z: r.cell[1],
      layerId: r.layerId,
      roomId: r.roomId,
    })),
    objects: Object.values(state.placedObjects).map((obj) => ({
      id: obj.id,
      assetId: obj.assetId,
      position: obj.position,
      rotation: obj.rotation,
      cell: obj.cell,
      cellKey: obj.cellKey,
      layerId: obj.layerId,
      props: obj.props,
    })),
    openings: Object.values(state.wallOpenings).map((o) => ({
      id: o.id,
      assetId: o.assetId,
      wallKey: o.wallKey,
      width: o.width,
      layerId: o.layerId,
    })),
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

  return parseFile(raw as Record<string, unknown>)
}

// ── Parsing / validation ──────────────────────────────────────────────────────

function parseFile(raw: Record<string, unknown>): SerializableState | null {
  try {
    const layers: Record<string, Layer> = {}
    const layersArr = Array.isArray(raw.layers) ? (raw.layers as unknown[]) : []
    for (const l of layersArr) {
      if (!isObject(l)) return null
      const layer: Layer = {
        id: requireString(l, 'id'),
        name: requireString(l, 'name'),
        visible: typeof l.visible === 'boolean' ? l.visible : true,
        locked: typeof l.locked === 'boolean' ? l.locked : false,
      }
      layers[layer.id] = layer
    }

    // Always ensure the default layer exists
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
      const roomId =
        typeof c.roomId === 'string' && rooms[c.roomId] ? c.roomId : null
      const record: PaintedCellRecord = { cell, layerId, roomId }
      paintedCells[getCellKey(cell)] = record
    }

    const placedObjects: Record<string, DungeonObjectRecord> = {}
    const occupancy: Record<string, string> = {}
    const objectsArr = Array.isArray(raw.objects) ? (raw.objects as unknown[]) : []
    for (const o of objectsArr) {
      if (!isObject(o)) continue
      const id = requireString(o, 'id')
      const cellKey = requireString(o, 'cellKey')
      const obj: DungeonObjectRecord = {
        id,
        type: 'prop',
        assetId: typeof o.assetId === 'string' ? o.assetId : null,
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
      const width: 1 | 2 | 3 =
        rawWidth === 1 || rawWidth === 2 || rawWidth === 3 ? rawWidth : 1
      wallOpenings[id] = {
        id,
        assetId: typeof o.assetId === 'string' ? o.assetId : null,
        wallKey,
        width,
        layerId: typeof o.layerId === 'string' && layers[o.layerId] ? o.layerId : 'default',
      }
    }

    const sceneLightingRaw = isObject(raw.sceneLighting) ? raw.sceneLighting : {}
    const groundPlane =
      raw.groundPlane === 'black' || raw.groundPlane === 'green' ? raw.groundPlane : 'black'

    return {
      name: typeof raw.name === 'string' ? raw.name : 'My Dungeon',
      sceneLighting: {
        intensity:
          typeof sceneLightingRaw.intensity === 'number' ? sceneLightingRaw.intensity : 1,
      },
      groundPlane,
      layers,
      layerOrder,
      activeLayerId,
      rooms,
      paintedCells,
      placedObjects,
      wallOpenings,
      occupancy,
    }
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
