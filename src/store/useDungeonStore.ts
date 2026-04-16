import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getDefaultAssetIdByCategory } from '../content-packs/registry'
import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import type { ContentPackCategory, PropConnector } from '../content-packs/types'
import { createGeneratedCharacterAssetId, syncGeneratedCharacterAssets } from '../content-packs/runtimeRegistry'
import {
  createDefaultGeneratedCharacterInput,
  normalizeGeneratedCharacterRecord,
  type CreateGeneratedCharacterInput,
  type GeneratedCharacterRecord,
  type UpdateGeneratedCharacterInput,
} from '../generated-characters/types'
import { serializeDungeon, deserializeDungeon } from './serialization'
import { getOpeningSegments } from './openingSegments'
import {
  getRoomBounds,
  getRoomCellKeysInBounds,
  getResizedRoomCellsForRun,
  remapOpeningForRoomResize,
  type RoomBoundaryRun,
  type RoomBounds,
} from './roomResize'

export { getOpeningSegments } from './openingSegments'

export type DungeonTool = 'move' | 'room' | 'prop' | 'character' | 'opening' | 'select' | 'play'
export type CameraMode = 'orbit'
export type CameraPreset = 'perspective' | 'isometric' | 'top-down'
export type SelectedAssetIds = Record<ContentPackCategory, string | null>
export type CharacterSheetState = {
  open: boolean
  assetId: string | null
}

export type FloorRecord = {
  id: string
  name: string
  level: number   // 0 = ground, positive = above ground, negative = cellar/underground
  snapshot: DungeonSnapshot
  history: DungeonSnapshot[]
  future: DungeonSnapshot[]
}

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
  /** Whether the opening is flipped 180° (front/back swap) */
  flipped?: boolean
  layerId: string
}

type PlaceOpeningInput = Pick<OpeningRecord, 'assetId' | 'wallKey' | 'width' | 'flipped'>

export type DungeonObjectType = 'prop' | 'player'

export type DungeonObjectRecord = {
  id: string
  type: DungeonObjectType
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
  exploredCells: Record<string, true>
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

type MoveObjectInput = Pick<DungeonObjectRecord, 'position' | 'cell' | 'cellKey'>

export type SceneLighting = {
  intensity: number // multiplier applied to all scene lights, 0–2
}

export type PostProcessingSettings = {
  enabled: boolean
  focusDistance: number // 0–1 screen-Y used to sample the focus line
  focalLength: number   // depth tolerance around the sampled focus depth
  bokehScale: number    // artistic bokeh size multiplier
}

export type WallConnectionMode = 'wall' | 'door' | 'open'
export type FloorViewMode = 'active' | 'scene'

type DungeonState = DungeonSnapshot & {
  cameraMode: CameraMode
  isPaintingStrokeActive: boolean
  isObjectDragActive: boolean
  isRoomResizeHandleActive: boolean
  wallConnectionMode: WallConnectionMode
  wallConnectionWidth: 1 | 2 | 3
  selectedRoomId: string | null
  sceneLighting: SceneLighting
  postProcessing: PostProcessingSettings
  showGrid: boolean
  showLosDebugMask: boolean
  showLosDebugRays: boolean
  showProjectionDebugMesh: boolean
  floorViewMode: FloorViewMode
  generatedCharacters: Record<string, GeneratedCharacterRecord>
  characterSheet: CharacterSheetState
  activeCameraMode: CameraPreset
  cameraPreset: CameraPreset | null
  history: DungeonSnapshot[]
  future: DungeonSnapshot[]
  paintCells: (cells: GridCell[]) => number
  eraseCells: (cells: GridCell[]) => number
  placeObject: (input: PlaceObjectInput) => string | null
  moveObject: (id: string, input: MoveObjectInput) => boolean
  setObjectProps: (id: string, props: Record<string, unknown>) => boolean
  mergeExploredCells: (cellKeys: string[]) => void
  clearExploredCells: () => void
  removeObject: (id: string) => void
  removeObjectAtCell: (cellKey: string) => void
  removeSelectedObject: () => void
  removeSelectedRoom: () => void
  rotateSelection: () => void
  clearSelection: () => void
  selectObject: (id: string | null) => void
  setTool: (tool: DungeonTool) => void
  selectRoom: (id: string | null) => void
  setRoomResizeHandleActive: (active: boolean) => void
  setWallConnectionMode: (mode: WallConnectionMode) => void
  setWallConnectionWidth: (width: 1 | 2 | 3) => void
  setSelectedAsset: (category: ContentPackCategory, assetId: string) => void
  setPaintingStrokeActive: (active: boolean) => void
  setObjectDragActive: (active: boolean) => void
  setSceneLightingIntensity: (intensity: number) => void
  setPostProcessing: (settings: Partial<PostProcessingSettings>) => void
  setShowGrid: (show: boolean) => void
  setShowLosDebugMask: (show: boolean) => void
  setShowLosDebugRays: (show: boolean) => void
  setShowProjectionDebugMesh: (show: boolean) => void
  setFloorViewMode: (mode: FloorViewMode) => void
  createGeneratedCharacter: (input: CreateGeneratedCharacterInput) => string
  createGeneratedCharacterDraft: () => string
  updateGeneratedCharacter: (assetId: string, input: UpdateGeneratedCharacterInput) => boolean
  removeGeneratedCharacter: (assetId: string) => boolean
  openCharacterSheet: (assetId: string) => void
  closeCharacterSheet: () => void
  setCameraPreset: (preset: CameraPreset) => void
  clearCameraPreset: () => void
  fpsLimit: 0 | 30 | 60 | 120
  setFpsLimit: (limit: 0 | 30 | 60 | 120) => void
  undo: () => void
  redo: () => void
  reset: () => void
  newDungeon: () => void
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
  resizeRoom: (roomId: string, bounds: RoomBounds) => boolean
  resizeRoomByBoundaryRun: (roomId: string, run: RoomBoundaryRun, boundary: number) => boolean
  setRoomFloorAsset: (roomId: string, assetId: string | null) => void
  setRoomWallAsset: (roomId: string, assetId: string | null) => void
  // Floor actions
  floors: Record<string, FloorRecord>
  floorOrder: string[]
  activeFloorId: string
  createFloor: (name?: string) => string
  deleteFloor: (id: string) => void
  switchFloor: (id: string) => void
  renameFloor: (id: string, name: string) => void
  ensureAdjacentFloor: (targetLevel: number, cell: GridCell, opposingAssetId: string, position: [number, number, number], rotation: [number, number, number]) => void
  // Opening actions
  placeOpening: (input: PlaceOpeningInput) => string | null
  placeOpenPassages: (wallKeys: string[]) => void
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
    exploredCells: { ...snapshot.exploredCells },
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

function isGeneratedCharacterInUse(
  assetId: string,
  state: Pick<DungeonState, 'placedObjects' | 'floors' | 'activeFloorId'>,
) {
  if (Object.values(state.placedObjects).some((object) => object.assetId === assetId)) {
    return true
  }

  return Object.values(state.floors).some((floor) => {
    if (floor.id === state.activeFloorId) {
      return false
    }
    return Object.values(floor.snapshot.placedObjects).some((object) => object.assetId === assetId)
  })
}

function createEmptySnapshot(): DungeonSnapshot {
  const defaultLayer = createDefaultLayer()
  return {
    paintedCells: {},
    exploredCells: {},
    placedObjects: {},
    wallOpenings: {},
    occupancy: {},
    tool: 'move',
    selectedAssetIds: {
      floor: getDefaultAssetIdByCategory('floor'),
      wall: getDefaultAssetIdByCategory('wall'),
      prop: getDefaultAssetIdByCategory('prop'),
      opening: getDefaultAssetIdByCategory('opening'),
      player: getDefaultAssetIdByCategory('player'),
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

function normalizeGeneratedCharacters(
  characters: Record<string, Partial<GeneratedCharacterRecord>> | undefined,
) {
  if (!characters) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(characters).map(([assetId, record]) => [
      assetId,
      normalizeGeneratedCharacterRecord(assetId, record ?? {}),
    ]),
  ) as Record<string, GeneratedCharacterRecord>
}

function addOpeningRecord(
  wallOpenings: Record<string, OpeningRecord>,
  input: PlaceOpeningInput,
  layerId: string,
) {
  const id = createObjectId()
  const newSegments = new Set(getOpeningSegments(input.wallKey, input.width))

  Object.values(wallOpenings).forEach((existing) => {
    const existingSegments = getOpeningSegments(existing.wallKey, existing.width)
    if (existingSegments.some((segment) => newSegments.has(segment))) {
      delete wallOpenings[existing.id]
    }
  })

  wallOpenings[id] = {
    id,
    assetId: input.assetId,
    wallKey: input.wallKey,
    width: input.width,
    flipped: input.flipped ?? false,
    layerId,
  }

  return id
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
    (set, get) => {
  const INITIAL_FLOOR_ID = 'floor-1'
  const initialSnapshot = createEmptySnapshot()

  return ({
  ...initialSnapshot,
  dungeonName: 'My Dungeon',
  cameraMode: 'orbit',
  isPaintingStrokeActive: false,
  isObjectDragActive: false,
  isRoomResizeHandleActive: false,
  wallConnectionMode: 'door' as WallConnectionMode,
  wallConnectionWidth: 1 as 1 | 2 | 3,
  selectedRoomId: null,
  sceneLighting: { intensity: 1 },
  postProcessing: { enabled: false, focusDistance: 0.5, focalLength: 3, bokehScale: 2 },
  showGrid: true,
  showLosDebugMask: false,
  showLosDebugRays: false,
  showProjectionDebugMesh: false,
  floorViewMode: 'active' as FloorViewMode,
  generatedCharacters: {},
  characterSheet: {
    open: false,
    assetId: null,
  },
  fpsLimit: 60 as 0 | 30 | 60 | 120,
  activeCameraMode: 'perspective',
  cameraPreset: null,
  history: [],
  future: [],
  floors: {
    [INITIAL_FLOOR_ID]: {
      id: INITIAL_FLOOR_ID,
      name: 'Ground Floor',
      level: 0,
      snapshot: cloneSnapshot(initialSnapshot),
      history: [],
      future: [],
    },
  },
  floorOrder: [INITIAL_FLOOR_ID],
  activeFloorId: INITIAL_FLOOR_ID,
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
        type: input.type,
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

    // Auto-create adjacent floor when placing a staircase prop
    if (input.assetId === 'core.props_staircase_up' || input.assetId === 'core.props_staircase_down') {
      const updated = get()
      const currentLevel = updated.floors[updated.activeFloorId]?.level ?? 0
      const targetLevel = input.assetId === 'core.props_staircase_up' ? currentLevel + 1 : currentLevel - 1
      const opposingAssetId = input.assetId === 'core.props_staircase_up'
        ? 'core.props_staircase_down'
        : 'core.props_staircase_up'
      get().ensureAdjacentFloor(targetLevel, input.cell, opposingAssetId, input.position, input.rotation)
    }

    return nextId
  },
  moveObject: (id, input) => {
    const state = get()
    const object = state.placedObjects[id]

    if (!object) {
      return false
    }

    if (!state.paintedCells[getCellKey(input.cell)]) {
      return false
    }

    const occupantId = state.occupancy[input.cellKey]
    if (occupantId && occupantId !== id) {
      return false
    }

    const unchanged =
      object.cellKey === input.cellKey &&
      object.cell[0] === input.cell[0] &&
      object.cell[1] === input.cell[1] &&
      object.position.every((value, index) => value === input.position[index])

    if (unchanged) {
      return true
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      const currentObject = current.placedObjects[id]
      if (!currentObject) {
        return current
      }

      const placedObjects = {
        ...current.placedObjects,
        [id]: {
          ...currentObject,
          position: [...input.position] as DungeonObjectRecord['position'],
          cell: [...input.cell] as GridCell,
          cellKey: input.cellKey,
        },
      }
      const occupancy = { ...current.occupancy }

      delete occupancy[currentObject.cellKey]
      occupancy[input.cellKey] = id

      return {
        ...current,
        placedObjects,
        occupancy,
        selection: id,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return true
  },
  setObjectProps: (id, props) => {
    const state = get()
    const object = state.placedObjects[id]
    if (!object) {
      return false
    }

    if (JSON.stringify(object.props) === JSON.stringify(props)) {
      return true
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      const currentObject = current.placedObjects[id]
      if (!currentObject) {
        return current
      }

      return {
        ...current,
        placedObjects: {
          ...current.placedObjects,
          [id]: {
            ...currentObject,
            props: { ...props },
          },
        },
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return true
  },
  mergeExploredCells: (cellKeys) => {
    if (cellKeys.length === 0) {
      return
    }

    set((current) => {
      let changed = false
      const exploredCells = { ...current.exploredCells }

      for (const cellKey of cellKeys) {
        if (!current.paintedCells[cellKey] || exploredCells[cellKey]) {
          continue
        }

        exploredCells[cellKey] = true
        changed = true
      }

      if (!changed) {
        return current
      }

      return {
        ...current,
        exploredCells,
      }
    })
  },
  clearExploredCells: () => {
    set((current) => {
      if (Object.keys(current.exploredCells).length === 0) {
        return current
      }

      return {
        ...current,
        exploredCells: {},
      }
    })
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
  removeSelectedRoom: () => {
    const selectedRoomId = get().selectedRoomId

    if (!selectedRoomId) {
      return
    }

    get().removeRoom(selectedRoomId)
  },
  rotateSelection: () => {
    const state = get()
    const selection = state.selection

    if (!selection) {
      return
    }

    const selectedObject = state.placedObjects[selection]
    if (selectedObject) {
      const connector = selectedObject.props.connector
      const rotationStep =
        connector === 'WALL' || connector === 'WALLFLOOR'
          ? Math.PI
          : Math.PI / 2
      const previousSnapshot = cloneSnapshot(state)

      set((current) => ({
        ...current,
        placedObjects: {
          ...current.placedObjects,
          [selection]: {
            ...current.placedObjects[selection],
            rotation: [
              current.placedObjects[selection].rotation[0],
              current.placedObjects[selection].rotation[1] + rotationStep,
              current.placedObjects[selection].rotation[2],
            ],
          },
        },
        history: [...current.history, previousSnapshot],
        future: [],
      }))
      return
    }

    const selectedOpening = state.wallOpenings[selection]
    if (!selectedOpening || !selectedOpening.assetId) {
      return
    }

    const previousSnapshot = cloneSnapshot(state)
    set((current) => ({
      ...current,
      wallOpenings: {
        ...current.wallOpenings,
        [selection]: {
          ...current.wallOpenings[selection],
          flipped: !(current.wallOpenings[selection].flipped ?? false),
        },
      },
      history: [...current.history, previousSnapshot],
      future: [],
    }))
  },
  clearSelection: () => {
    set((state) => (
      state.selection === null && state.selectedRoomId === null
        ? state
        : {
            ...state,
            selection: null,
            selectedRoomId: null,
          }
    ))
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
      isRoomResizeHandleActive: tool === 'room' ? current.isRoomResizeHandleActive : false,
      cameraPreset: tool === 'room' ? 'top-down' : current.cameraPreset,
      activeCameraMode: tool === 'room' ? 'top-down' : current.activeCameraMode,
      history: [...current.history, previousSnapshot],
      future: [],
    }))
  },
  selectRoom: (id) => {
    set((current) => ({
      ...current,
      selectedRoomId: id,
    }))
  },
  setRoomResizeHandleActive: (active) => {
    set((current) => current.isRoomResizeHandleActive === active
      ? current
      : {
          ...current,
          isRoomResizeHandleActive: active,
        })
  },
  setWallConnectionMode: (mode) => {
    set((current) => current.wallConnectionMode === mode
      ? current
      : {
          ...current,
          wallConnectionMode: mode,
        })
  },
  setWallConnectionWidth: (width) => {
    set((current) => current.wallConnectionWidth === width
      ? current
      : {
          ...current,
          wallConnectionWidth: width,
        })
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
  setObjectDragActive: (active) => {
    set((state) => {
      if (state.isObjectDragActive === active) {
        return state
      }

      return {
        ...state,
        isObjectDragActive: active,
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
  setShowLosDebugMask: (show) => {
    set((state) => ({ ...state, showLosDebugMask: show }))
  },
  setShowLosDebugRays: (show) => {
    set((state) => ({ ...state, showLosDebugRays: show }))
  },
  setShowProjectionDebugMesh: (show) => {
    set((state) => ({ ...state, showProjectionDebugMesh: show }))
  },
  setFloorViewMode: (mode) => {
    set((state) => (state.floorViewMode === mode ? state : { ...state, floorViewMode: mode }))
  },
  createGeneratedCharacter: (input) => {
    const recordId = createObjectId()
    const assetId = createGeneratedCharacterAssetId(recordId)
    const timestamp = new Date().toISOString()
    const nextRecord = normalizeGeneratedCharacterRecord(assetId, {
      ...createDefaultGeneratedCharacterInput(),
      ...input,
      assetId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })

    set((current) => ({
      ...current,
      generatedCharacters: {
        ...current.generatedCharacters,
        [assetId]: nextRecord,
      },
    }))
    syncGeneratedCharacterAssets(get().generatedCharacters)
    return assetId
  },
  createGeneratedCharacterDraft: () => {
    return get().createGeneratedCharacter(createDefaultGeneratedCharacterInput())
  },
  updateGeneratedCharacter: (assetId, input) => {
    const state = get()
    const existing = state.generatedCharacters[assetId]
    if (!existing) {
      return false
    }

    const nextRecord = normalizeGeneratedCharacterRecord(assetId, {
      ...existing,
      ...input,
      assetId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    })

    set((current) => ({
      ...current,
      generatedCharacters: {
        ...current.generatedCharacters,
        [assetId]: nextRecord,
      },
    }))
    syncGeneratedCharacterAssets(get().generatedCharacters)
    return true
  },
  removeGeneratedCharacter: (assetId) => {
    const state = get()
    if (!state.generatedCharacters[assetId]) {
      return true
    }
    if (isGeneratedCharacterInUse(assetId, state)) {
      return false
    }

    set((current) => {
      const generatedCharacters = { ...current.generatedCharacters }
      delete generatedCharacters[assetId]
      return {
        ...current,
        generatedCharacters,
        characterSheet: current.characterSheet.assetId === assetId
          ? { open: false, assetId: null }
          : current.characterSheet,
        selectedAssetIds: {
          ...current.selectedAssetIds,
          ...(current.selectedAssetIds.prop === assetId
            ? {
                prop: getDefaultAssetIdByCategory('prop'),
              }
            : {}),
          ...(current.selectedAssetIds.player === assetId
            ? {
                player: getDefaultAssetIdByCategory('player'),
              }
            : {}),
        },
      }
    })
    syncGeneratedCharacterAssets(get().generatedCharacters)
    return true
  },
  openCharacterSheet: (assetId) => {
    set((state) => ({
      ...state,
      characterSheet: {
        open: true,
        assetId,
      },
    }))
  },
  closeCharacterSheet: () => {
    set((state) => (
      state.characterSheet.open
        ? {
            ...state,
            characterSheet: {
              open: false,
              assetId: null,
            },
          }
        : state
    ))
  },
  setFpsLimit: (limit) => {
    set((state) => ({ ...state, fpsLimit: limit }))
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
        isObjectDragActive: false,
        selectedRoomId: null,
        floorViewMode: 'active',
        characterSheet: { open: false, assetId: null },
        activeCameraMode: 'perspective',
        cameraPreset: null,
        history: [],
      future: [],
    }))
  },

  newDungeon: () => {
    const INITIAL_ID = 'floor-1'
    const fresh = createEmptySnapshot()
    set({
      // Snapshot (rooms, cells, objects, etc.)
       ...fresh,
        // UI / tool state
        isPaintingStrokeActive: false,
        isObjectDragActive: false,
        selectedRoomId: null,
        cameraMode: 'orbit',
      floorViewMode: 'active',
      characterSheet: { open: false, assetId: null },
      activeCameraMode: 'perspective',
      cameraPreset: 'perspective', // triggers camera to home position
       // Settings reset to defaults
       sceneLighting: { intensity: 1 },
        postProcessing: { enabled: false, focusDistance: 0.5, focalLength: 3, bokehScale: 2 },
        showGrid: true,
        showLosDebugMask: false,
        showLosDebugRays: false,
        showProjectionDebugMesh: false,
        // Undo/redo cleared
      history: [],
      future: [],
      // Floors reset to single ground floor
      floors: {
        [INITIAL_ID]: {
          id: INITIAL_ID,
          name: 'Ground Floor',
          level: 0,
          snapshot: cloneSnapshot(fresh),
          history: [],
          future: [],
        },
      },
      floorOrder: [INITIAL_ID],
      activeFloorId: INITIAL_ID,
      // Dungeon meta
      dungeonName: 'My Dungeon',
    } as unknown as Parameters<typeof set>[0])
  },


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
        selectedRoomId: current.selectedRoomId === id ? null : current.selectedRoomId,
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
  resizeRoom: (roomId, bounds) => {
    const state = get()
    const room = state.rooms[roomId]
    const oldBounds = getRoomBounds(roomId, state.paintedCells)
    if (!room) {
      return false
    }
    if (!oldBounds) {
      return false
    }

    const targetKeys = new Set(getRoomCellKeysInBounds(bounds))
    for (const key of targetKeys) {
      const record = state.paintedCells[key]
      if (record && record.roomId !== roomId) {
        return false
      }
    }

    const currentRoomKeys = Object.entries(state.paintedCells)
      .filter(([, record]) => record.roomId === roomId)
      .map(([key]) => key)

    const unchanged =
      currentRoomKeys.length === targetKeys.size &&
      currentRoomKeys.every((key) => targetKeys.has(key))
    if (unchanged) {
      return true
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      const currentRoom = current.rooms[roomId]
      if (!currentRoom) {
        return current
      }

      const paintedCells = { ...current.paintedCells }
      const changedCells: GridCell[] = []

      Object.entries(current.paintedCells).forEach(([key, record]) => {
        if (record.roomId === roomId && !targetKeys.has(key)) {
          changedCells.push(record.cell)
          delete paintedCells[key]
        }
      })

      targetKeys.forEach((key) => {
        if (paintedCells[key]) {
          return
        }

        const [x, z] = key.split(':').map((value) => parseInt(value, 10))
        const cell: GridCell = [x, z]
        changedCells.push(cell)
        paintedCells[key] = {
          cell,
          layerId: currentRoom.layerId,
          roomId,
        }
      })

      const remappedWallOpenings = Object.fromEntries(
        Object.entries(current.wallOpenings).flatMap(([openingId, opening]) => {
          const remapped = remapOpeningForRoomResize(
            opening,
            roomId,
            oldBounds,
            bounds,
            current.paintedCells,
          )
          return remapped ? [[openingId, remapped] as const] : []
        }),
      )

      const { placedObjects, occupancy, selection, wallOpenings } =
        pruneInvalidConnectedProps(
          { ...current, wallOpenings: remappedWallOpenings },
          paintedCells,
          changedCells,
        )

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

    return true
  },
  resizeRoomByBoundaryRun: (roomId, run, boundary) => {
    const state = get()
    const room = state.rooms[roomId]
    if (!room) {
      return false
    }

    const targetCells = getResizedRoomCellsForRun(roomId, state.paintedCells, run, boundary)
    if (!targetCells) {
      return false
    }

    const targetKeys = new Set(targetCells.map((cell) => getCellKey(cell)))
    const currentRoomKeys = Object.entries(state.paintedCells)
      .filter(([, record]) => record.roomId === roomId)
      .map(([key]) => key)

    const unchanged =
      currentRoomKeys.length === targetKeys.size &&
      currentRoomKeys.every((key) => targetKeys.has(key))
    if (unchanged) {
      return true
    }

    const previousSnapshot = cloneSnapshot(state)

    set((current) => {
      const currentRoom = current.rooms[roomId]
      if (!currentRoom) {
        return current
      }

      const paintedCells = { ...current.paintedCells }
      const changedCells: GridCell[] = []

      Object.entries(current.paintedCells).forEach(([key, record]) => {
        if (record.roomId === roomId && !targetKeys.has(key)) {
          changedCells.push(record.cell)
          delete paintedCells[key]
        }
      })

      targetCells.forEach((cell) => {
        const key = getCellKey(cell)
        if (paintedCells[key]) {
          return
        }

        changedCells.push(cell)
        paintedCells[key] = {
          cell,
          layerId: currentRoom.layerId,
          roomId,
        }
      })

      const { placedObjects, occupancy, selection, wallOpenings } =
        pruneInvalidConnectedProps(current, paintedCells, changedCells)

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

    return true
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

  // ── Floor actions ──────────────────────────────────────────────────────────
  createFloor: (name) => {
    const state = get()
    const id = createObjectId()

    // Determine new floor level: StaircaseDown on current floor → go down, else go up
    const hasStaircaseDown = Object.values(state.placedObjects).some(
      (obj) => obj.assetId === 'core.props_staircase_down',
    )
    const currentLevel = state.floors[state.activeFloorId]?.level ?? 0
    const newLevel = hasStaircaseDown ? currentLevel - 1 : currentLevel + 1

    const defaultName = newLevel < 0
      ? `Cellar ${Math.abs(newLevel)}`
      : newLevel === 0
      ? 'Ground Floor'
      : `Floor ${newLevel}`
    const floorName = typeof name === 'string' && name.trim() ? name.trim() : defaultName

    // Save current working state back to the active floor record
    const updatedCurrentFloor: FloorRecord = {
      ...state.floors[state.activeFloorId],
      snapshot: cloneSnapshot(state),
      history: [...state.history],
      future: [...state.future],
    }

    // Find a staircase prop on the current floor to seed the new floor
    const staircaseDown = Object.values(state.placedObjects).find(
      (obj) => obj.assetId === 'core.props_staircase_down',
    )
    const staircaseUp = Object.values(state.placedObjects).find(
      (obj) => obj.assetId === 'core.props_staircase_up',
    )
    const staircaseOnCurrentFloor = staircaseDown ?? staircaseUp

    // Build an initial snapshot for the new floor
    const newSnapshot = createEmptySnapshot()

    if (staircaseOnCurrentFloor) {
      // Place opposing staircase on new floor at same grid cell
      const opposingAssetId =
        staircaseOnCurrentFloor.assetId === 'core.props_staircase_down'
          ? 'core.props_staircase_up'
          : 'core.props_staircase_down'
      const staircaseId = createObjectId()
      const cell = staircaseOnCurrentFloor.cell
      const cellKey = `${getCellKey(cell)}:floor`
      newSnapshot.placedObjects[staircaseId] = {
        id: staircaseId,
        type: 'prop',
        assetId: opposingAssetId,
        position: staircaseOnCurrentFloor.position,
        rotation: staircaseOnCurrentFloor.rotation,
        props: { connector: 'FLOOR', direction: null },
        cell,
        cellKey,
        layerId: DEFAULT_LAYER_ID,
      }
      newSnapshot.occupancy[cellKey] = staircaseId
    }

    const newFloor: FloorRecord = {
      id,
      name: floorName,
      level: newLevel,
      snapshot: cloneSnapshot(newSnapshot),
      history: [],
      future: [],
    }

    set((current) => ({
      ...current,
      // Activate new floor
      ...newSnapshot,
      history: [],
      future: [],
      selectedRoomId: null,
      activeFloorId: id,
      floorOrder: [...current.floorOrder, id],
      floors: {
        ...current.floors,
        [state.activeFloorId]: updatedCurrentFloor,
        [id]: newFloor,
      },
    }))

    return id
  },

  deleteFloor: (id) => {
    const state = get()
    if (state.floorOrder.length <= 1) return

    const newOrder = state.floorOrder.filter((fid) => fid !== id)
    const newFloors = { ...state.floors }
    delete newFloors[id]

    // If deleting the active floor, switch to the first remaining
    if (state.activeFloorId === id) {
      const targetId = newOrder[0]
      const target = newFloors[targetId]

      // Save current floor back (we're about to discard it but keep others consistent)
      set((current) => ({
        ...current,
        ...cloneSnapshot(target.snapshot),
        history: [...target.history],
        future: [...target.future],
        selectedRoomId: null,
        activeFloorId: targetId,
        floorOrder: newOrder,
        floors: newFloors,
      }))
    } else {
      // Save current working state into the active floor record first
      const updatedCurrentFloor: FloorRecord = {
        ...state.floors[state.activeFloorId],
        snapshot: cloneSnapshot(state),
        history: [...state.history],
        future: [...state.future],
      }
      set((current) => ({
        ...current,
        selectedRoomId: null,
        activeFloorId: current.activeFloorId,
        floorOrder: newOrder,
        floors: { ...newFloors, [state.activeFloorId]: updatedCurrentFloor },
      }))
    }
  },

  switchFloor: (id) => {
    const state = get()
    if (id === state.activeFloorId) return
    const target = state.floors[id]
    if (!target) return

    // Save current working state back to the active floor record
    const updatedCurrentFloor: FloorRecord = {
      ...state.floors[state.activeFloorId],
      snapshot: cloneSnapshot(state),
      history: [...state.history],
      future: [...state.future],
    }

    set((current) => ({
      ...current,
      ...cloneSnapshot(target.snapshot),
      history: [...target.history],
      future: [...target.future],
      selection: null,
      selectedRoomId: null,
      activeFloorId: id,
      floors: {
        ...current.floors,
        [state.activeFloorId]: updatedCurrentFloor,
      },
    }))
  },

  renameFloor: (id, name) => {
    set((current) => ({
      ...current,
      floors: {
        ...current.floors,
        [id]: { ...current.floors[id], name },
      },
    }))
  },

  ensureAdjacentFloor: (targetLevel, cell, opposingAssetId, position, rotation) => {
    const state = get()
    const cellKey = `${getCellKey(cell)}:floor`
    const existingFloor = Object.values(state.floors).find((f) => f.level === targetLevel)

    if (existingFloor) {
      // Floor already exists — add the opposing staircase if nothing occupies that cell yet.
      // For the active floor the live state is the source of truth; for others use the snapshot.
      const isActive = existingFloor.id === state.activeFloorId
      if (isActive) {
        if (state.occupancy[cellKey]) return
        const staircaseId = createObjectId()
        set((current) => ({
          ...current,
          placedObjects: {
            ...current.placedObjects,
            [staircaseId]: {
              id: staircaseId,
              type: 'prop',
              assetId: opposingAssetId,
              position: [...position] as [number, number, number],
              rotation: [...rotation] as [number, number, number],
              props: { connector: 'FLOOR', direction: null },
              cell: [...cell] as GridCell,
              cellKey,
              layerId: DEFAULT_LAYER_ID,
            },
          },
          occupancy: { ...current.occupancy, [cellKey]: staircaseId },
        }))
      } else {
        if (existingFloor.snapshot.occupancy[cellKey]) return
        const staircaseId = createObjectId()
        const updatedSnapshot = cloneSnapshot(existingFloor.snapshot)
        updatedSnapshot.placedObjects[staircaseId] = {
          id: staircaseId,
          type: 'prop',
          assetId: opposingAssetId,
          position: [...position] as [number, number, number],
          rotation: [...rotation] as [number, number, number],
          props: { connector: 'FLOOR', direction: null },
          cell: [...cell] as GridCell,
          cellKey,
          layerId: DEFAULT_LAYER_ID,
        }
        updatedSnapshot.occupancy[cellKey] = staircaseId
        set((current) => ({
          ...current,
          floors: {
            ...current.floors,
            [existingFloor.id]: {
              ...current.floors[existingFloor.id],
              snapshot: updatedSnapshot,
            },
          },
        }))
      }
      return
    }

    // Floor doesn't exist yet — create it with the opposing staircase pre-placed.
    const id = createObjectId()
    const defaultName =
      targetLevel < 0 ? `Cellar ${Math.abs(targetLevel)}`
      : targetLevel === 0 ? 'Ground Floor'
      : `Floor ${targetLevel}`

    const newSnapshot = createEmptySnapshot()
    const staircaseId = createObjectId()
    newSnapshot.placedObjects[staircaseId] = {
      id: staircaseId,
      type: 'prop',
      assetId: opposingAssetId,
      position: [...position] as [number, number, number],
      rotation: [...rotation] as [number, number, number],
      props: { connector: 'FLOOR', direction: null },
      cell: [...cell] as GridCell,
      cellKey,
      layerId: DEFAULT_LAYER_ID,
    }
    newSnapshot.occupancy[cellKey] = staircaseId

    set((current) => ({
      ...current,
      floors: {
        ...current.floors,
        [id]: {
          id,
          name: defaultName,
          level: targetLevel,
          snapshot: cloneSnapshot(newSnapshot),
          history: [],
          future: [],
        },
      },
      floorOrder: [...current.floorOrder, id],
    }))
  },


  placeOpening: (input) => {
    let openingId: string | null = null
    set((current) => {
      const previousSnapshot = cloneSnapshot(current)
      const wallOpenings = { ...current.wallOpenings }
      openingId = addOpeningRecord(wallOpenings, input, current.activeLayerId)
      return {
        ...current,
        wallOpenings,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return openingId
  },
  placeOpenPassages: (wallKeys) => {
    if (wallKeys.length === 0) {
      return
    }

    set((current) => {
      const previousSnapshot = cloneSnapshot(current)
      const wallOpenings = { ...current.wallOpenings }

      wallKeys.forEach((wallKey) => {
        addOpeningRecord(
          wallOpenings,
          { assetId: null, wallKey, width: 1, flipped: false },
          current.activeLayerId,
        )
      })

      return {
        ...current,
        wallOpenings,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
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
    // Save current working state into the active floor record before serialising
    const floorsWithCurrent = {
      ...state.floors,
      [state.activeFloorId]: {
        ...state.floors[state.activeFloorId],
        snapshot: cloneSnapshot(state),
        history: [...state.history],
        future: [...state.future],
      },
    }
    const json = serializeDungeon({
      name: state.dungeonName,
      sceneLighting: state.sceneLighting,
      postProcessing: state.postProcessing,
      layers: state.layers,
      layerOrder: state.layerOrder,
      activeLayerId: state.activeLayerId,
      rooms: state.rooms,
      paintedCells: state.paintedCells,
      exploredCells: state.exploredCells,
      placedObjects: state.placedObjects,
      wallOpenings: state.wallOpenings,
      occupancy: state.occupancy,
      nextRoomNumber: state.nextRoomNumber,
      floors: floorsWithCurrent,
      floorOrder: state.floorOrder,
      activeFloorId: state.activeFloorId,
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
    const floors = parsed.floors ?? {}
    const floorOrder = parsed.floorOrder ?? Object.keys(floors)
    const activeFloorId = parsed.activeFloorId ?? floorOrder[0] ?? 'floor-1'
      set((current) => ({
        ...current,
        ...parsed,
        dungeonName: parsed.name ?? current.dungeonName,
        generatedCharacters: normalizeGeneratedCharacters(current.generatedCharacters),
        characterSheet: { open: false, assetId: null },
         isPaintingStrokeActive: false,
         isObjectDragActive: false,
         selectedRoomId: null,
        floorViewMode: 'active',
        activeCameraMode: 'perspective',
        cameraPreset: null,
      history: [],
      future: [],
      floors,
      floorOrder,
      activeFloorId,
    }))
    return true
  },
  })},
    {
      name: 'dungeon-planner-state',
      // Only persist the dungeon content + scene settings, not transient UI state
      partialize: (state) => ({
        dungeonName: state.dungeonName,
        paintedCells: state.paintedCells,
        exploredCells: state.exploredCells,
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
        selectedAssetIds: state.selectedAssetIds,
        generatedCharacters: state.generatedCharacters,
        floors: state.floors,
        floorOrder: state.floorOrder,
        activeFloorId: state.activeFloorId,
        fpsLimit: state.fpsLimit,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          syncGeneratedCharacterAssets({})
          return
        }

        state.generatedCharacters = normalizeGeneratedCharacters(
          state.generatedCharacters as Record<string, Partial<GeneratedCharacterRecord>> | undefined,
        )
        syncGeneratedCharacterAssets(state.generatedCharacters)
      },
    },
  ),
)
