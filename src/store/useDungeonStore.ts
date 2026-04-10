import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDefaultAssetIdByCategory } from '../content-packs/registry'
import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import type { ContentPackCategory, PropConnector } from '../content-packs/types'
import { serializeDungeon, deserializeDungeon } from './serialization'

export type DungeonTool = 'move' | 'room' | 'prop' | 'opening'
export type CameraMode = 'orbit'
export type CameraPreset = 'perspective' | 'isometric' | 'top-down'
export type GroundPlane = 'black' | 'green'
export type SelectedAssetIds = Record<ContentPackCategory, string | null>

export type Layer = {
  id: string
  name: string
  visible: boolean
  locked: boolean
}

export type Room = {
  id: string
  name: string
  layerId: string
  /** null = inherit global floor asset */
  floorAssetId: string | null
  /** null = inherit global wall asset */
  wallAssetId: string | null
}

export type PaintedCellRecord = {
  cell: GridCell
  layerId: string
  roomId: string | null
}

export type PaintedCells = Record<string, PaintedCellRecord>

export type OpeningRecord = {
  id: string
  assetId: string | null
  /** Anchor wall segment key — center of the span (format: "x:z:direction") */
  wallKey: string
  width: 1 | 2 | 3
  layerId: string
}

type PlaceOpeningInput = Pick<OpeningRecord, 'assetId' | 'wallKey' | 'width'>

export type DungeonObjectRecord = {
  id: string
  type: 'prop'
  assetId: string | null
  position: [number, number, number]
  rotation: [number, number, number]
  props: Record<string, unknown>
  cell: GridCell
  cellKey: string
  layerId: string
}

type DungeonSnapshot = {
  paintedCells: PaintedCells
  placedObjects: Record<string, DungeonObjectRecord>
  wallOpenings: Record<string, OpeningRecord>
  occupancy: Record<string, string>
  tool: DungeonTool
  selectedAssetIds: SelectedAssetIds
  selection: string | null
  layers: Record<string, Layer>
  layerOrder: string[]
  activeLayerId: string
  rooms: Record<string, Room>
  nextRoomNumber: number
}

type PlaceObjectInput = Pick<
  DungeonObjectRecord,
  'type' | 'assetId' | 'position' | 'rotation' | 'props' | 'cell' | 'cellKey'
>

export type SceneLighting = {
  intensity: number // multiplier applied to all scene lights, 0–2
}

export type PostProcessingSettings = {
  enabled: boolean
  focusDistance: number // world units along camera look direction
  focalLength: number   // blur falloff range in world units
  bokehScale: number    // artistic bokeh size multiplier
}

type DungeonState = DungeonSnapshot & {
  cameraMode: CameraMode
  isPaintingStrokeActive: boolean
  sceneLighting: SceneLighting
  postProcessing: PostProcessingSettings
  showGrid: boolean
  groundPlane: GroundPlane
  activeCameraMode: CameraPreset
  cameraPreset: CameraPreset | null
  history: DungeonSnapshot[]
  future: DungeonSnapshot[]
  paintCells: (cells: GridCell[]) => number
  eraseCells: (cells: GridCell[]) => number
  placeObject: (input: PlaceObjectInput) => string | null
  removeObject: (id: string) => void
  removeObjectAtCell: (cellKey: string) => void
  removeSelectedObject: () => void
  selectObject: (id: string | null) => void
  setTool: (tool: DungeonTool) => void
  setSelectedAsset: (category: ContentPackCategory, assetId: string) => void
  setPaintingStrokeActive: (active: boolean) => void
  setSceneLightingIntensity: (intensity: number) => void
  setPostProcessing: (settings: Partial<PostProcessingSettings>) => void
  setShowGrid: (show: boolean) => void
  setGroundPlane: (plane: GroundPlane) => void
  setCameraPreset: (preset: CameraPreset) => void
  clearCameraPreset: () => void
  undo: () => void
  redo: () => void
  reset: () => void
  // Layer actions
  addLayer: (name: string) => string
  removeLayer: (id: string) => void
  renameLayer: (id: string, name: string) => void
  setLayerVisible: (id: string, visible: boolean) => void
  setLayerLocked: (id: string, locked: boolean) => void
  setActiveLayer: (id: string) => void
  // Room actions
  createRoom: (name: string) => string
  removeRoom: (id: string) => void
  renameRoom: (id: string, name: string) => void
  assignCellsToRoom: (cellKeys: string[], roomId: string | null) => void
  setRoomFloorAsset: (roomId: string, assetId: string | null) => void
  setRoomWallAsset: (roomId: string, assetId: string | null) => void
  // Opening actions
  placeOpening: (input: PlaceOpeningInput) => string | null
  removeOpening: (id: string) => void
  // Persistence
  dungeonName: string
  setDungeonName: (name: string) => void
  downloadDungeon: () => void
  loadDungeon: (json: string) => boolean
}

type AnchorDirection = 'north' | 'south' | 'east' | 'west'

const CONNECTOR_DIRECTIONS: Array<{
  name: AnchorDirection
  delta: GridCell
  opposite: AnchorDirection
}> = [
  { name: 'north', delta: [0, 1], opposite: 'south' },
  { name: 'south', delta: [0, -1], opposite: 'north' },
  { name: 'east', delta: [1, 0], opposite: 'west' },
  { name: 'west', delta: [-1, 0], opposite: 'east' },
]

const DEFAULT_LAYER_ID = 'default'

function createDefaultLayer(): Layer {
  return { id: DEFAULT_LAYER_ID, name: 'Default', visible: true, locked: false }
}

function cloneSnapshot(snapshot: DungeonSnapshot): DungeonSnapshot {
  return {
    paintedCells: Object.fromEntries(
      Object.entries(snapshot.paintedCells).map(([key, record]) => [
        key,
        { cell: [...record.cell] as GridCell, layerId: record.layerId, roomId: record.roomId },
      ]),
    ),
    placedObjects: Object.fromEntries(
      Object.entries(snapshot.placedObjects).map(([id, object]) => [
        id,
        {
          ...object,
          position: [...object.position] as DungeonObjectRecord['position'],
          rotation: [...object.rotation] as DungeonObjectRecord['rotation'],
          cell: [...object.cell] as GridCell,
          props: { ...object.props },
        },
      ]),
    ),
    wallOpenings: Object.fromEntries(
      Object.entries(snapshot.wallOpenings).map(([id, opening]) => [id, { ...opening }]),
    ),
    occupancy: { ...snapshot.occupancy },
    tool: snapshot.tool,
    selectedAssetIds: { ...snapshot.selectedAssetIds },
    selection: snapshot.selection,
    layers: Object.fromEntries(
      Object.entries(snapshot.layers).map(([id, layer]) => [id, { ...layer }]),
    ),
    layerOrder: [...snapshot.layerOrder],
    activeLayerId: snapshot.activeLayerId,
    rooms: Object.fromEntries(
      Object.entries(snapshot.rooms).map(([id, room]) => [id, { ...room }]),
    ),
    nextRoomNumber: snapshot.nextRoomNumber,
  }
}

function createEmptySnapshot(): DungeonSnapshot {
  const defaultLayer = createDefaultLayer()
  return {
    paintedCells: {},
    placedObjects: {},
    wallOpenings: {},
    occupancy: {},
    tool: 'move',
    selectedAssetIds: {
      floor: getDefaultAssetIdByCategory('floor'),
      wall: getDefaultAssetIdByCategory('wall'),
      prop: getDefaultAssetIdByCategory('prop'),
      opening: getDefaultAssetIdByCategory('opening'),
    },
    selection: null,
    layers: { [DEFAULT_LAYER_ID]: defaultLayer },
    layerOrder: [DEFAULT_LAYER_ID],
    activeLayerId: DEFAULT_LAYER_ID,
    rooms: {},
    nextRoomNumber: 1,
  }
}

function createObjectId() {
  return crypto.randomUUID()
}

function collectAnchorKeysForCell(cell: GridCell) {
  const cellKey = getCellKey(cell)

  return [
    `${cellKey}:floor`,
    `${cellKey}:north`,
    `${cellKey}:south`,
    `${cellKey}:east`,
    `${cellKey}:west`,
  ]
}

function collectAffectedAnchorKeys(changedCells: GridCell[]) {
  const affectedKeys = new Set<string>()

  changedCells.forEach((cell) => {
    collectAnchorKeysForCell(cell).forEach((key) => affectedKeys.add(key))

    CONNECTOR_DIRECTIONS.forEach(({ delta, opposite }) => {
      const neighbor: GridCell = [cell[0] + delta[0], cell[1] + delta[1]]
      affectedKeys.add(`${getCellKey(neighbor)}:${opposite}`)
    })
  })

  return affectedKeys
}

function isAnchorDirection(value: unknown): value is AnchorDirection {
  return (
    value === 'north' ||
    value === 'south' ||
    value === 'east' ||
    value === 'west'
  )
}

function isConnector(value: unknown): value is PropConnector {
  return value === 'FLOOR' || value === 'WALL' || value === 'WALLFLOOR'
}

function isPropAnchorValid(
  object: DungeonObjectRecord,
  paintedCells: PaintedCells,
) {
  const cellKey = getCellKey(object.cell)
  if (!paintedCells[cellKey]) {
    return false
  }

  const connector = object.props.connector
  if (!isConnector(connector)) {
    return true
  }

  if (connector === 'FLOOR') {
    return object.cellKey === `${cellKey}:floor`
  }

  const direction = object.props.direction
  if (!isAnchorDirection(direction)) {
    return false
  }

  const connectorDirection = CONNECTOR_DIRECTIONS.find(
    (entry) => entry.name === direction,
  )
  if (!connectorDirection) {
    return false
  }

  const neighbor: GridCell = [
    object.cell[0] + connectorDirection.delta[0],
    object.cell[1] + connectorDirection.delta[1],
  ]

  if (object.cellKey !== `${cellKey}:${direction}`) return false

  // Valid wall slot: neighbor is unpainted (exterior) OR a different room (inter-room wall)
  const cellRecord = paintedCells[cellKey]
  const neighborRecord = paintedCells[getCellKey(neighbor)]
  if (!neighborRecord) return true
  return (cellRecord?.roomId ?? null) !== (neighborRecord.roomId ?? null)
}

/** Returns all wall segment keys covered by an opening anchor + width. */
export function getOpeningSegments(wallKey: string, width: 1 | 2 | 3): string[] {
  if (width === 1) return [wallKey]
  const parts = wallKey.split(':')
  const cx = parseInt(parts[0])
  const cz = parseInt(parts[1])
  const dir = parts[2]
  const isNS = dir === 'north' || dir === 'south'
  const halfLeft = Math.floor((width - 1) / 2)
  const segments: string[] = []
  for (let i = -halfLeft; i < -halfLeft + width; i++) {
    const nx = isNS ? cx + i : cx
    const nz = isNS ? cz : cz + i
    segments.push(`${nx}:${nz}:${dir}`)
  }
  return segments
}

function pruneInvalidConnectedProps(
  current: Pick<DungeonSnapshot, 'placedObjects' | 'occupancy' | 'selection' | 'wallOpenings'>,
  paintedCells: PaintedCells,
  changedCells: GridCell[],
) {
  const affectedAnchorKeys = collectAffectedAnchorKeys(changedCells)
  const placedObjects = { ...current.placedObjects }
  const occupancy = { ...current.occupancy }
  let selection = current.selection

  affectedAnchorKeys.forEach((anchorKey) => {
    const objectId = occupancy[anchorKey]
    if (!objectId) {
      return
    }

    const object = placedObjects[objectId]
    if (!object || isPropAnchorValid(object, paintedCells)) {
      return
    }

    delete placedObjects[objectId]
    delete occupancy[anchorKey]

    if (selection === objectId) {
      selection = null
    }
  })

  // Also prune openings whose wall segments are no longer valid boundaries.
  // A segment is valid if: the cell is painted AND the neighbour is either
  // unpainted (exterior wall) OR painted-but-different-room (inter-room wall).
  const wallOpenings = { ...current.wallOpenings }
  Object.values(wallOpenings).forEach((opening) => {
    const segments = getOpeningSegments(opening.wallKey, opening.width)
    const stillValid = segments.every((segKey) => {
      const parts = segKey.split(':')
      const cell: GridCell = [parseInt(parts[0]), parseInt(parts[1])]
      const cellRecord = paintedCells[getCellKey(cell)]
      if (!cellRecord) return false
      const dir = CONNECTOR_DIRECTIONS.find((d) => d.name === parts[2])
      if (!dir) return false
      const neighbor: GridCell = [cell[0] + dir.delta[0], cell[1] + dir.delta[1]]
      const neighborRecord = paintedCells[getCellKey(neighbor)]
      // Still a wall boundary: neighbor unpainted OR different room
      return !neighborRecord ||
        (cellRecord.roomId ?? null) !== (neighborRecord.roomId ?? null)
    })
    if (!stillValid) delete wallOpenings[opening.id]
  })

  return { placedObjects, occupancy, selection, wallOpenings }
}

export const useDungeonStore = create<DungeonState>()(
  persist(
    (set, get) => ({
  ...createEmptySnapshot(),
  dungeonName: 'My Dungeon',
  cameraMode: 'orbit',
  isPaintingStrokeActive: false,
  sceneLighting: { intensity: 1 },
  postProcessing: { enabled: false, focusDistance: 8, focalLength: 3, bokehScale: 2 },
  showGrid: true,
  groundPlane: 'black',
  activeCameraMode: 'perspective',
  cameraPreset: null,
  history: [],
  future: [],
  paintCells: (cells) => {
    const state = get()
    const nextCells = cells.filter((cell) => !state.paintedCells[getCellKey(cell)])

    if (nextCells.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      // Auto-create a room for the new cells
      const roomId = createObjectId()
      const roomName = `Room ${current.nextRoomNumber}`
      const rooms = {
        ...current.rooms,
        [roomId]: {
          id: roomId,
          name: roomName,
          layerId: current.activeLayerId,
          floorAssetId: null,
          wallAssetId: null,
        },
      }

      const paintedCells = { ...current.paintedCells }

      nextCells.forEach((cell) => {
        paintedCells[getCellKey(cell)] = {
          cell: [...cell] as GridCell,
          layerId: current.activeLayerId,
          roomId,
        }
      })

      const {
        placedObjects,
        occupancy,
        selection,
        wallOpenings,
      } = pruneInvalidConnectedProps(current, paintedCells, nextCells)

      return {
        ...current,
        paintedCells,
        placedObjects,
        wallOpenings,
        occupancy,
        selection,
        rooms,
        nextRoomNumber: current.nextRoomNumber + 1,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return nextCells.length
  },
  eraseCells: (cells) => {
    const state = get()
    const nextKeys = cells
      .map((cell) => getCellKey(cell))
      .filter((key) => Boolean(state.paintedCells[key]))

    if (nextKeys.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      const paintedCells = { ...current.paintedCells }

      nextKeys.forEach((key) => {
        delete paintedCells[key]
      })

      const removedCells = nextKeys
        .map((key) => current.paintedCells[key])
        .filter((r): r is PaintedCellRecord => Boolean(r))
        .map((r) => r.cell)
      const {
        placedObjects,
        occupancy,
        selection,
        wallOpenings,
      } = pruneInvalidConnectedProps(current, paintedCells, removedCells)

      return {
        ...current,
        paintedCells,
        placedObjects,
        wallOpenings,
        occupancy,
        selection,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return nextKeys.length
  },
  placeObject: (input) => {
    const state = get()
    const existingId = state.occupancy[input.cellKey]
    const existingObject = existingId ? state.placedObjects[existingId] : null

    if (
      existingObject &&
      existingObject.type === input.type &&
      existingObject.cellKey === input.cellKey &&
      existingObject.assetId === input.assetId &&
      existingObject.position.every((value, index) => value === input.position[index]) &&
      existingObject.rotation.every((value, index) => value === input.rotation[index]) &&
      JSON.stringify(existingObject.props) === JSON.stringify(input.props)
    ) {
      return existingObject.id
    }

    const nextId = createObjectId()
    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      const placedObjects = { ...current.placedObjects }
      const occupancy = { ...current.occupancy }

      if (existingId) {
        delete placedObjects[existingId]
      }

      placedObjects[nextId] = {
        id: nextId,
        type: 'prop',
        assetId: input.assetId,
        position: [...input.position] as DungeonObjectRecord['position'],
        rotation: [...input.rotation] as DungeonObjectRecord['rotation'],
        props: { ...input.props },
        cell: [...input.cell] as GridCell,
        cellKey: input.cellKey,
        layerId: current.activeLayerId,
      }
      occupancy[input.cellKey] = nextId

      return {
        ...current,
        placedObjects,
        occupancy,
        selection: nextId,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return nextId
  },
  removeObject: (id) => {
    const state = get()
    const object = state.placedObjects[id]

    if (!object) {
      return
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      const placedObjects = { ...current.placedObjects }
      const occupancy = { ...current.occupancy }

      delete placedObjects[id]
      delete occupancy[object.cellKey]

      return {
        ...current,
        placedObjects,
        occupancy,
        selection: current.selection === id ? null : current.selection,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
  },
  removeObjectAtCell: (cellKey) => {
    const objectId = get().occupancy[cellKey]

    if (!objectId) {
      return
    }

    get().removeObject(objectId)
  },
  removeSelectedObject: () => {
    const selection = get().selection

    if (!selection) {
      return
    }

    get().removeObject(selection)
  },
  selectObject: (id) => {
    set((state) => ({
      ...state,
      selection: id,
    }))
  },
  setTool: (tool) => {
    const state = get()

    if (state.tool === tool) {
      return
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => ({
      ...current,
      tool,
      history: [...current.history, previousSnapshot],
      future: [],
    }))
  },
  setSelectedAsset: (category, assetId) => {
    const state = get()

    if (state.selectedAssetIds[category] === assetId) {
      return
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => ({
      ...current,
      selectedAssetIds: {
        ...current.selectedAssetIds,
        [category]: assetId,
      },
      history: [...current.history, previousSnapshot],
      future: [],
    }))
  },
  setPaintingStrokeActive: (active) => {
    set((state) => {
      if (state.isPaintingStrokeActive === active) {
        return state
      }

      return {
        ...state,
        isPaintingStrokeActive: active,
      }
    })
  },
  setSceneLightingIntensity: (intensity) => {
    set((state) => ({ ...state, sceneLighting: { ...state.sceneLighting, intensity } }))
  },
  setPostProcessing: (settings) => {
    set((state) => ({ ...state, postProcessing: { ...state.postProcessing, ...settings } }))
  },
  setShowGrid: (show) => {
    set((state) => ({ ...state, showGrid: show }))
  },
  setGroundPlane: (plane) => {
    set((state) => ({ ...state, groundPlane: plane }))
  },
  setCameraPreset: (preset) => {
    set((state) => ({ ...state, cameraPreset: preset, activeCameraMode: preset }))
  },
  clearCameraPreset: () => {
    set((state) => ({ ...state, cameraPreset: null }))
  },
  undo: () => {
    const state = get()
    const previous = state.history.at(-1)

    if (!previous) {
      return
    }

    const presentSnapshot = cloneSnapshot(state)

    set((current) => ({
      ...current,
      ...cloneSnapshot(previous),
      history: current.history.slice(0, -1),
      future: [...current.future, presentSnapshot],
    }))
  },
  redo: () => {
    const state = get()
    const next = state.future.at(-1)

    if (!next) {
      return
    }

    const presentSnapshot = cloneSnapshot(state)

    set((current) => ({
      ...current,
      ...cloneSnapshot(next),
      history: [...current.history, presentSnapshot],
      future: current.future.slice(0, -1),
    }))
  },
  reset: () => {
    set((state) => ({
      ...state,
      ...createEmptySnapshot(),
      isPaintingStrokeActive: false,
      activeCameraMode: 'perspective',
      cameraPreset: null,
      history: [],
      future: [],
    }))
  },

  // ── Layer actions ──────────────────────────────────────────────────────────
  addLayer: (name) => {
    const id = createObjectId()
    set((current) => {
      const previousSnapshot = cloneSnapshot(current)
      return {
        ...current,
        layers: { ...current.layers, [id]: { id, name, visible: true, locked: false } },
        layerOrder: [...current.layerOrder, id],
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return id
  },
  removeLayer: (id) => {
    set((current) => {
      if (Object.keys(current.layers).length <= 1) return current
      const previousSnapshot = cloneSnapshot(current)
      const paintedCells = { ...current.paintedCells }
      Object.entries(paintedCells).forEach(([key, record]) => {
        if (record.layerId === id) {
          paintedCells[key] = { ...record, layerId: DEFAULT_LAYER_ID }
        }
      })
      const placedObjects = { ...current.placedObjects }
      Object.entries(placedObjects).forEach(([objId, obj]) => {
        if (obj.layerId === id) placedObjects[objId] = { ...obj, layerId: DEFAULT_LAYER_ID }
      })
      const rooms = { ...current.rooms }
      Object.entries(rooms).forEach(([roomId, room]) => {
        if (room.layerId === id) rooms[roomId] = { ...room, layerId: DEFAULT_LAYER_ID }
      })
      const layers = { ...current.layers }
      delete layers[id]
      return {
        ...current,
        layers,
        layerOrder: current.layerOrder.filter((lid) => lid !== id),
        activeLayerId: current.activeLayerId === id ? DEFAULT_LAYER_ID : current.activeLayerId,
        paintedCells,
        placedObjects,
        rooms,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
  },
  renameLayer: (id, name) => {
    set((current) => ({
      ...current,
      layers: { ...current.layers, [id]: { ...current.layers[id], name } },
    }))
  },
  setLayerVisible: (id, visible) => {
    set((current) => ({
      ...current,
      layers: { ...current.layers, [id]: { ...current.layers[id], visible } },
    }))
  },
  setLayerLocked: (id, locked) => {
    set((current) => ({
      ...current,
      layers: { ...current.layers, [id]: { ...current.layers[id], locked } },
    }))
  },
  setActiveLayer: (id) => {
    set((current) => ({ ...current, activeLayerId: id }))
  },

  // ── Room actions ───────────────────────────────────────────────────────────
  createRoom: (name) => {
    const id = createObjectId()
    set((current) => {
      const previousSnapshot = cloneSnapshot(current)
      return {
        ...current,
        rooms: {
          ...current.rooms,
          [id]: { id, name, layerId: current.activeLayerId, floorAssetId: null, wallAssetId: null },
        },
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return id
  },
  removeRoom: (id) => {
    set((current) => {
      if (!current.rooms[id]) return current
      const previousSnapshot = cloneSnapshot(current)

      // Collect and erase all cells belonging to this room
      const paintedCells = { ...current.paintedCells }
      const removedCells: GridCell[] = []
      Object.entries(paintedCells).forEach(([key, record]) => {
        if (record.roomId === id) {
          removedCells.push(record.cell)
          delete paintedCells[key]
        }
      })

      const rooms = { ...current.rooms }
      delete rooms[id]

      const { placedObjects, occupancy, selection, wallOpenings } =
        pruneInvalidConnectedProps(
          current,
          paintedCells,
          removedCells,
        )

      return {
        ...current,
        rooms,
        paintedCells,
        placedObjects,
        wallOpenings,
        occupancy,
        selection,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
  },
  renameRoom: (id, name) => {
    set((current) => ({
      ...current,
      rooms: { ...current.rooms, [id]: { ...current.rooms[id], name } },
    }))
  },
  assignCellsToRoom: (cellKeys, roomId) => {
    set((current) => {
      const previousSnapshot = cloneSnapshot(current)
      const paintedCells = { ...current.paintedCells }
      cellKeys.forEach((key) => {
        if (paintedCells[key]) paintedCells[key] = { ...paintedCells[key], roomId }
      })
      return {
        ...current,
        paintedCells,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
  },
  setRoomFloorAsset: (roomId, assetId) => {
    set((current) => ({
      ...current,
      rooms: { ...current.rooms, [roomId]: { ...current.rooms[roomId], floorAssetId: assetId } },
    }))
  },
  setRoomWallAsset: (roomId, assetId) => {
    set((current) => ({
      ...current,
      rooms: { ...current.rooms, [roomId]: { ...current.rooms[roomId], wallAssetId: assetId } },
    }))
  },

  // ── Opening actions ────────────────────────────────────────────────────────
  placeOpening: (input) => {
    const id = createObjectId()
    set((current) => {
      const previousSnapshot = cloneSnapshot(current)
      const wallOpenings = { ...current.wallOpenings }
      // Remove any existing opening whose segments overlap with this one
      const newSegments = new Set(getOpeningSegments(input.wallKey, input.width))
      Object.values(wallOpenings).forEach((existing) => {
        const existingSegments = getOpeningSegments(existing.wallKey, existing.width)
        if (existingSegments.some((s) => newSegments.has(s))) {
          delete wallOpenings[existing.id]
        }
      })
      wallOpenings[id] = {
        id,
        assetId: input.assetId,
        wallKey: input.wallKey,
        width: input.width,
        layerId: current.activeLayerId,
      }
      return {
        ...current,
        wallOpenings,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return id
  },
  removeOpening: (id) => {
    set((current) => {
      if (!current.wallOpenings[id]) return current
      const previousSnapshot = cloneSnapshot(current)
      const wallOpenings = { ...current.wallOpenings }
      delete wallOpenings[id]
      return {
        ...current,
        wallOpenings,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
  },

  // ── Persistence ────────────────────────────────────────────────────────────
  setDungeonName: (name) => {
    set((current) => ({ ...current, dungeonName: name }))
  },
  downloadDungeon: () => {
    const state = get()
    const json = serializeDungeon({
      name: state.dungeonName,
      sceneLighting: state.sceneLighting,
      postProcessing: state.postProcessing,
      groundPlane: state.groundPlane,
      layers: state.layers,
      layerOrder: state.layerOrder,
      activeLayerId: state.activeLayerId,
      rooms: state.rooms,
      paintedCells: state.paintedCells,
      placedObjects: state.placedObjects,
      wallOpenings: state.wallOpenings,
      occupancy: state.occupancy,
      nextRoomNumber: state.nextRoomNumber,
    })
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${state.dungeonName.replace(/[^a-z0-9]/gi, '_')}.dungeon.json`
    a.click()
    URL.revokeObjectURL(url)
  },
  loadDungeon: (json) => {
    const parsed = deserializeDungeon(json)
    if (!parsed) return false
    set((current) => ({
      ...current,
      ...parsed,
      dungeonName: parsed.name ?? current.dungeonName,
      isPaintingStrokeActive: false,
      activeCameraMode: 'perspective',
      cameraPreset: null,
      history: [],
      future: [],
    }))
    return true
  },
}),
    {
      name: 'dungeon-planner-state',
      // Only persist the dungeon content + scene settings, not transient UI state
      partialize: (state) => ({
        dungeonName: state.dungeonName,
        paintedCells: state.paintedCells,
        placedObjects: state.placedObjects,
        wallOpenings: state.wallOpenings,
        occupancy: state.occupancy,
        layers: state.layers,
        layerOrder: state.layerOrder,
        activeLayerId: state.activeLayerId,
        rooms: state.rooms,
        nextRoomNumber: state.nextRoomNumber,
        sceneLighting: state.sceneLighting,
        postProcessing: state.postProcessing,
        groundPlane: state.groundPlane,
        selectedAssetIds: state.selectedAssetIds,
      }),
    },
  ),
)
