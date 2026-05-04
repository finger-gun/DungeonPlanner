import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import {
  getContentPackAssetById,
  getContentPackAssetsByCategory,
  getDefaultAssetIdByCategory,
} from '../content-packs/registry'
import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import type { AssetBrowserCategory, AssetBrowserSubcategory, ContentPackCategory, PropConnector } from '../content-packs/types'
import { syncGeneratedCharacterAssets } from '../content-packs/runtimeRegistry'
import {
  normalizeGeneratedCharacterRecord,
  type CreateGeneratedCharacterInput,
  type GeneratedCharacterRecord,
  type UpdateGeneratedCharacterInput,
} from '../generated-characters/types'
import { serializeDungeon, deserializeDungeon } from './serialization'
import { sanitizePersistedAssetReferences } from './assetReferences'
import { getOpeningSegments } from './openingSegments'
import { getPairedStairAssetId, getStairDirectionForAssetId } from './stairAssets'
import {
  getCanonicalInnerWallKey,
  type InnerWallRecord,
} from './manualWalls'
import { getCanonicalWallKey, getInheritedWallAssetIdForWallKey } from './wallSegments'
import {
  getRoomBounds,
  getRoomCellKeysInBounds,
  getResizedRoomCellsForRun,
  remapOpeningForRoomResize,
  type RoomBoundaryRun,
  type RoomBounds,
} from './roomResize'
import { Euler, Quaternion, Vector3 } from 'three'
import {
  DEFAULT_POST_PROCESSING_SETTINGS,
  normalizePostProcessingSettings,
} from '../postprocessing/tiltShiftMath'
import {
  OUTDOOR_TERRAIN_STYLES,
  DEFAULT_OUTDOOR_TERRAIN_STYLE,
  type OutdoorTerrainStyle,
} from './outdoorTerrainStyles'
import type { ObjectLightOverrides } from './lightOverrides'
import {
  DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS,
  DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
  applyOutdoorTerrainSculpt,
  getOutdoorTerrainCellHeight,
  getOutdoorTerrainWorldPosition,
  type OutdoorTerrainHeightfield,
  type OutdoorTerrainSculptMode,
} from './outdoorTerrain'
import {
  collectOverlappingFloorSurfaceAnchors,
  findFloorSurfaceAnchorAtCell,
  getFloorTileSpan,
  getInheritedFloorAssetIdForCellKey,
  isFloorSurfacePlacementValid,
} from './floorSurfaceLayout'
import {
  ALL_FLOOR_DIRTY_DOMAINS,
  applyFloorDirtyMutation,
  createFloorDirtyInfo,
  syncFloorDirtyState,
  type FloorDirtyDomainKey,
  type FloorDirtyHint,
  type FloorDirtyState,
} from './floorDirtyDomains'
import { getFloorChunkKeysForCells } from './floorChunkKeys'
import { createDungeonStoreEditorUiActions } from './domains/dungeonStoreEditorUiDomain'
import { createDungeonStoreGeneratedCharacterActions } from './domains/dungeonStoreGeneratedCharactersDomain'
import { createDungeonStoreLayerActions } from './domains/dungeonStoreLayerDomain'
import { createDungeonStoreViewActions } from './domains/dungeonStoreViewDomain'

export type { InnerWallRecord } from './manualWalls'

export { getOpeningSegments } from './openingSegments'

export type DungeonTool = 'move' | 'room' | 'prop' | 'character' | 'opening' | 'select' | 'play'
export type CameraMode = 'orbit'
export type CameraPreset = 'perspective' | 'isometric' | 'top-down' | 'classic'
export type RoomEditMode = 'rooms' | 'walls' | 'floor-variants' | 'wall-variants'
export type SelectedAssetIds = Record<ContentPackCategory, string | null>
export type SurfaceBrushAssetIds = {
  floor: string | null
  wall: string | null
}
export type CharacterSheetState = {
  open: boolean
  assetId: string | null
}
export type AssetBrowserState = {
  category: AssetBrowserCategory
  subcategory: AssetBrowserSubcategory | null
}

export type FloorRecord = {
  id: string
  name: string
  level: number   // 0 = ground, positive = above ground, negative = cellar/underground
  snapshot: DungeonSnapshot
  history: HistoryEntry[]
  future: HistoryEntry[]
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

export type MapMode = 'indoor' | 'outdoor'
export type OutdoorTerrainDensity = 'sparse' | 'medium' | 'dense'
export type OutdoorTerrainType = 'mixed' | 'rocks' | 'dead-forest'
export type OutdoorBrushMode = 'surroundings' | 'terrain-style' | 'terrain-sculpt'
export type OutdoorTerrainProfile = {
  density: OutdoorTerrainDensity
  overpaintRegenerate: boolean
}
export type { OutdoorTerrainStyle } from './outdoorTerrainStyles'
export type { OutdoorTerrainHeightfield, OutdoorTerrainSculptMode } from './outdoorTerrain'

export type PaintedCellRecord = {
  cell: GridCell
  layerId: string
  roomId: string | null
}

export type PaintedCells = Record<string, PaintedCellRecord>
export type BlockedCellRecord = {
  cell: GridCell
  layerId: string
  roomId: null
}
export type BlockedCells = Record<string, BlockedCellRecord>
export type OutdoorTerrainStyleCellRecord = {
  cell: GridCell
  layerId: string
  terrainStyle: OutdoorTerrainStyle
}
export type OutdoorTerrainStyleCells = Record<string, OutdoorTerrainStyleCellRecord>

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
  localPosition?: [number, number, number] | null
  localRotation?: [number, number, number] | null
  parentObjectId?: string | null
  supportCellKey?: string
  props: Record<string, unknown>
  cell: GridCell
  cellKey: string
  layerId: string
}

type DungeonSnapshot = {
  paintedCells: PaintedCells
  blockedCells: BlockedCells
  outdoorTerrainHeights: OutdoorTerrainHeightfield
  outdoorTerrainStyleCells: OutdoorTerrainStyleCells
  exploredCells: Record<string, true>
  floorTileAssetIds: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  placedObjects: Record<string, DungeonObjectRecord>
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
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

type ObjectHistoryPatchState = {
  objects: Record<string, DungeonObjectRecord | null>
  occupancy: Record<string, string | null>
  selection: string | null
}

type ObjectHistoryEntry = {
  kind: 'object-patch'
  before: ObjectHistoryPatchState
  after: ObjectHistoryPatchState
}

type HistoryEntry = DungeonSnapshot | ObjectHistoryEntry

type PlaceObjectInput = Pick<
  DungeonObjectRecord,
  'type' | 'assetId' | 'position' | 'rotation' | 'props' | 'cell' | 'cellKey'
> & {
  localPosition?: DungeonObjectRecord['localPosition']
  localRotation?: DungeonObjectRecord['localRotation']
  parentObjectId?: DungeonObjectRecord['parentObjectId']
  supportCellKey?: DungeonObjectRecord['supportCellKey']
  selectPlaced?: boolean
}

type MutableObjectMaps = {
  placedObjects: Record<string, DungeonObjectRecord>
  occupancy: Record<string, string>
}

type MoveObjectInput = Pick<DungeonObjectRecord, 'position' | 'cell' | 'cellKey'>

type RepositionObjectInput = Pick<DungeonObjectRecord, 'position' | 'rotation' | 'cell' | 'cellKey'> & {
  props?: Record<string, unknown>
  localPosition?: DungeonObjectRecord['localPosition']
  localRotation?: DungeonObjectRecord['localRotation']
  parentObjectId?: DungeonObjectRecord['parentObjectId']
  supportCellKey?: DungeonObjectRecord['supportCellKey']
}

export type PickedUpObjectState = {
  objectId: string
  type: DungeonObjectType
  assetId: string
  props: Record<string, unknown>
  floorRotationIndex: number
}

export type ObjectMoveDragPointer = {
  clientX: number
  clientY: number
}

export type SceneLighting = {
  intensity: number // multiplier applied to all scene lights, 0–2
}

export type PostProcessingSettings = {
  enabled: boolean
  pixelateEnabled: boolean
  pixelSize: number
  focusDistance: number // legacy saved manual focus value retained for backward compatibility
  focalLength: number   // foreground blur falloff distance in world units
  backgroundFocalLength: number // background blur falloff distance in world units
  bokehScale: number    // artistic bokeh size multiplier
}

export type WallConnectionMode = 'wall' | 'door' | 'open'
export type FloorViewMode = 'active' | 'scene'

export type DungeonState = DungeonSnapshot & {
  mapMode: MapMode
  outdoorTimeOfDay: number
  defaultOutdoorTerrainStyle: OutdoorTerrainStyle
  outdoorTerrainDensity: OutdoorTerrainDensity
  outdoorTerrainType: OutdoorTerrainType
  outdoorOverpaintRegenerate: boolean
  outdoorTerrainProfiles: Record<OutdoorTerrainType, OutdoorTerrainProfile>
  outdoorBrushMode: OutdoorBrushMode
  outdoorTerrainSculptMode: OutdoorTerrainSculptMode
  outdoorTerrainSculptStep: number
  outdoorTerrainSculptRadius: number
  outdoorTerrainStyleBrush: OutdoorTerrainStyle
  cameraMode: CameraMode
  isPaintingStrokeActive: boolean
  isObjectDragActive: boolean
  isRoomResizeHandleActive: boolean
  roomEditMode: RoomEditMode
  wallConnectionMode: WallConnectionMode
  wallConnectionWidth: 1 | 2 | 3
  selectedRoomId: string | null
  surfaceBrushAssetIds: SurfaceBrushAssetIds
  sceneLighting: SceneLighting
  postProcessing: PostProcessingSettings
  showGrid: boolean
  showLosDebugMask: boolean
  showLosDebugRays: boolean
  showLensFocusDebugPoint: boolean
  showChunkDebugOverlay: boolean
  showProjectionDebugMesh: boolean
  showPropProbeDebug: boolean
  slowBuildAnimationDebug: boolean
  buildPerformanceTracingEnabled: boolean
  floorViewMode: FloorViewMode
  generatedCharacters: Record<string, GeneratedCharacterRecord>
  characterSheet: CharacterSheetState
  assetBrowser: AssetBrowserState
  activeCameraMode: CameraPreset
  cameraPreset: CameraPreset | null
  previousCameraPreset: CameraPreset | null
  objectLightPreviewOverrides: Record<string, ObjectLightOverrides>
  objectScalePreviewOverrides: Record<string, number>
  objectRotationPreviewOverrides: Record<string, DungeonObjectRecord['rotation']>
  pickedUpObject: PickedUpObjectState | null
  objectMoveDragPointer: ObjectMoveDragPointer | null
  history: HistoryEntry[]
  future: HistoryEntry[]
  floorDirtyDomains: FloorDirtyState
  paintCells: (cells: GridCell[]) => number
  eraseCells: (cells: GridCell[]) => number
  paintBlockedCells: (cells: GridCell[]) => number
  eraseBlockedCells: (cells: GridCell[]) => number
  sculptOutdoorTerrain: (cells: GridCell[], mode?: OutdoorTerrainSculptMode) => number
  paintOutdoorTerrainStyleCells: (cells: GridCell[]) => number
  eraseOutdoorTerrainStyleCells: (cells: GridCell[]) => number
  placeObject: (input: PlaceObjectInput) => string | null
  moveObject: (id: string, input: MoveObjectInput) => boolean
  repositionObject: (id: string, input: RepositionObjectInput) => boolean
  setObjectProps: (id: string, props: Record<string, unknown>) => boolean
  setObjectScalePreview: (id: string, scale: number | null) => void
  setObjectRotationPreview: (id: string, rotation: DungeonObjectRecord['rotation'] | null) => void
  setObjectLightPreview: (id: string, overrides: ObjectLightOverrides | null) => void
  pickUpObject: (id: string) => boolean
  cancelPickedUpObject: () => void
  setObjectMoveDragPointer: (pointer: ObjectMoveDragPointer | null) => void
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
  setMapMode: (mode: MapMode) => void
  selectRoom: (id: string | null) => void
  setRoomResizeHandleActive: (active: boolean) => void
  setRoomEditMode: (mode: RoomEditMode) => void
  setWallConnectionMode: (mode: WallConnectionMode) => void
  setWallConnectionWidth: (width: 1 | 2 | 3) => void
  setInnerWallSegments: (wallKeys: string[], present: boolean) => number
  setSelectedAsset: (category: ContentPackCategory, assetId: string) => void
  setSurfaceBrushAsset: (category: keyof SurfaceBrushAssetIds, assetId: string) => void
  setAssetBrowserCategory: (category: AssetBrowserCategory) => void
  setAssetBrowserSubcategory: (subcategory: AssetBrowserSubcategory | null) => void
  focusAssetBrowserForAsset: (assetId: string | null) => void
  setFloorTileAsset: (cellKey: string, assetId: string | null) => boolean
  setWallSurfaceAsset: (wallKey: string, assetId: string | null) => boolean
  setWallSurfaceProps: (wallKey: string, props: Record<string, unknown>) => boolean
  setPaintingStrokeActive: (active: boolean) => void
  setObjectDragActive: (active: boolean) => void
  setSceneLightingIntensity: (intensity: number) => void
  setPostProcessing: (settings: Partial<PostProcessingSettings>) => void
  setOutdoorTimeOfDay: (value: number) => void
  setOutdoorTerrainDensity: (value: OutdoorTerrainDensity) => void
  setOutdoorTerrainType: (value: OutdoorTerrainType) => void
  setOutdoorOverpaintRegenerate: (value: boolean) => void
  setOutdoorBrushMode: (value: OutdoorBrushMode) => void
  setOutdoorTerrainSculptMode: (value: OutdoorTerrainSculptMode) => void
  setDefaultOutdoorTerrainStyle: (value: OutdoorTerrainStyle) => void
  setOutdoorTerrainStyleBrush: (value: OutdoorTerrainStyle) => void
  setShowGrid: (show: boolean) => void
  setShowLosDebugMask: (show: boolean) => void
  setShowLosDebugRays: (show: boolean) => void
  setShowLensFocusDebugPoint: (show: boolean) => void
  setShowChunkDebugOverlay: (show: boolean) => void
  setShowProjectionDebugMesh: (show: boolean) => void
  setShowPropProbeDebug: (show: boolean) => void
  setSlowBuildAnimationDebug: (show: boolean) => void
  setBuildPerformanceTracingEnabled: (show: boolean) => void
  lightEffectsEnabled: boolean
  setLightEffectsEnabled: (enabled: boolean) => void
  lightFlickerEnabled: boolean
  setLightFlickerEnabled: (enabled: boolean) => void
  particleEffectsEnabled: boolean
  setParticleEffectsEnabled: (enabled: boolean) => void
  setFloorViewMode: (mode: FloorViewMode) => void
  createGeneratedCharacter: (input: CreateGeneratedCharacterInput) => string
  createGeneratedCharacterDraft: () => string
  ingestGeneratedCharacters: (
    records: ReadonlyArray<Partial<GeneratedCharacterRecord> & Pick<GeneratedCharacterRecord, 'assetId'>>,
  ) => void
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
  newDungeon: (mode?: MapMode) => void
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
  restoreOpenPassages: (wallKeys: string[]) => number
  setOpeningAsset: (id: string, assetId: string | null) => boolean
  removeOpening: (id: string) => void
  // Persistence
  dungeonName: string
  setDungeonName: (name: string) => void
  exportDungeonJson: () => string
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
const SURROUNDING_FOREST_TAG = 'surrounding-forest'
const DEFAULT_OUTDOOR_TERRAIN_PROFILES: Record<OutdoorTerrainType, OutdoorTerrainProfile> = {
  mixed: { density: 'medium', overpaintRegenerate: false },
  rocks: { density: 'medium', overpaintRegenerate: false },
  'dead-forest': { density: 'medium', overpaintRegenerate: false },
}

const KAYKIT_FOREST_PROP_IDS = getContentPackAssetsByCategory('prop')
  .map((asset) => asset.id)
  .filter((id) => id.startsWith('kaykit.forest_'))

const FOREST_TREE_ASSET_IDS = KAYKIT_FOREST_PROP_IDS.filter(
  (id) => id.startsWith('kaykit.forest_tree_') && !id.startsWith('kaykit.forest_tree_bare_'),
)
const FOREST_BARE_TREE_ASSET_IDS = KAYKIT_FOREST_PROP_IDS.filter((id) =>
  id.startsWith('kaykit.forest_tree_bare_'),
)
const FOREST_BUSH_ASSET_IDS = KAYKIT_FOREST_PROP_IDS.filter((id) => id.startsWith('kaykit.forest_bush_'))
const FOREST_ROCK_ASSET_IDS = KAYKIT_FOREST_PROP_IDS.filter((id) => id.startsWith('kaykit.forest_rock_'))
const FOREST_GRASS_ASSET_IDS = KAYKIT_FOREST_PROP_IDS.filter((id) => id.startsWith('kaykit.forest_grass_'))
const FOREST_TREE_ASSET_IDS_BY_STYLE = buildOutdoorTerrainStyleAssetPools(FOREST_TREE_ASSET_IDS)
const FOREST_BARE_TREE_ASSET_IDS_BY_STYLE = buildOutdoorTerrainStyleAssetPools(FOREST_BARE_TREE_ASSET_IDS)
const FOREST_BUSH_ASSET_IDS_BY_STYLE = buildOutdoorTerrainStyleAssetPools(FOREST_BUSH_ASSET_IDS)
const FOREST_ROCK_ASSET_IDS_BY_STYLE = buildOutdoorTerrainStyleAssetPools(FOREST_ROCK_ASSET_IDS)
const FOREST_GRASS_ASSET_IDS_BY_STYLE = buildOutdoorTerrainStyleAssetPools(FOREST_GRASS_ASSET_IDS)
const DENSITY_SECONDARY_CHANCE: Record<OutdoorTerrainDensity, number> = {
  sparse: 15,
  medium: 35,
  dense: 80,
}

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
    blockedCells: Object.fromEntries(
      Object.entries(snapshot.blockedCells).map(([key, record]) => [
        key,
        { cell: [...record.cell] as GridCell, layerId: record.layerId, roomId: null },
      ]),
    ),
    outdoorTerrainHeights: Object.fromEntries(
      Object.entries(snapshot.outdoorTerrainHeights ?? {}).map(([key, record]) => [
        key,
        { cell: [...record.cell] as GridCell, level: record.level },
      ]),
    ),
    outdoorTerrainStyleCells: Object.fromEntries(
      Object.entries(snapshot.outdoorTerrainStyleCells).map(([key, record]) => [
        key,
        {
          cell: [...record.cell] as GridCell,
          layerId: record.layerId,
          terrainStyle: record.terrainStyle,
        },
      ]),
    ),
    exploredCells: { ...snapshot.exploredCells },
    floorTileAssetIds: { ...snapshot.floorTileAssetIds },
    wallSurfaceAssetIds: { ...snapshot.wallSurfaceAssetIds },
    wallSurfaceProps: Object.fromEntries(
      Object.entries(snapshot.wallSurfaceProps).map(([wallKey, props]) => [wallKey, { ...props }]),
    ),
    placedObjects: Object.fromEntries(
      Object.entries(snapshot.placedObjects).map(([id, object]) => [
        id,
        {
          ...object,
          position: [...object.position] as DungeonObjectRecord['position'],
          rotation: [...object.rotation] as DungeonObjectRecord['rotation'],
          localPosition: object.localPosition
            ? [...object.localPosition] as DungeonObjectRecord['localPosition']
            : object.localPosition ?? null,
          localRotation: object.localRotation
            ? [...object.localRotation] as DungeonObjectRecord['localRotation']
            : object.localRotation ?? null,
          parentObjectId: object.parentObjectId ?? null,
          supportCellKey: object.supportCellKey ?? getCellKey(object.cell),
          cell: [...object.cell] as GridCell,
          props: { ...object.props },
        },
      ]),
    ),
    wallOpenings: Object.fromEntries(
      Object.entries(snapshot.wallOpenings).map(([id, opening]) => [id, { ...opening }]),
    ),
    innerWalls: Object.fromEntries(
      Object.entries(snapshot.innerWalls).map(([wallKey, innerWall]) => [wallKey, { ...innerWall }]),
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

function cloneDungeonObjectRecord(object: DungeonObjectRecord): DungeonObjectRecord {
  return {
    ...object,
    position: [...object.position] as DungeonObjectRecord['position'],
    rotation: [...object.rotation] as DungeonObjectRecord['rotation'],
    localPosition: object.localPosition
      ? [...object.localPosition] as DungeonObjectRecord['localPosition']
      : object.localPosition ?? null,
    localRotation: object.localRotation
      ? [...object.localRotation] as DungeonObjectRecord['localRotation']
      : object.localRotation ?? null,
    parentObjectId: object.parentObjectId ?? null,
    supportCellKey: object.supportCellKey ?? getCellKey(object.cell),
    cell: [...object.cell] as GridCell,
    props: { ...object.props },
  }
}

function serializeCurrentDungeonState(state: DungeonState) {
  const floorsWithCurrent = {
    ...state.floors,
    [state.activeFloorId]: {
      ...state.floors[state.activeFloorId],
      snapshot: cloneSnapshot(state),
      history: [...state.history],
      future: [...state.future],
    },
  }

  return serializeDungeon({
    name: state.dungeonName,
    mapMode: state.mapMode,
    outdoorTimeOfDay: state.outdoorTimeOfDay,
    outdoorTerrainProfiles: state.outdoorTerrainProfiles,
    outdoorTerrainDensity: state.outdoorTerrainDensity,
    outdoorTerrainType: state.outdoorTerrainType,
    outdoorOverpaintRegenerate: state.outdoorOverpaintRegenerate,
    outdoorTerrainHeights: state.outdoorTerrainHeights,
    sceneLighting: state.sceneLighting,
    postProcessing: state.postProcessing,
    lightFlickerEnabled: state.lightFlickerEnabled,
    layers: state.layers,
    layerOrder: state.layerOrder,
    activeLayerId: state.activeLayerId,
    rooms: state.rooms,
    paintedCells: state.paintedCells,
    blockedCells: state.blockedCells,
    outdoorTerrainStyleCells: state.outdoorTerrainStyleCells,
    exploredCells: state.exploredCells,
    floorTileAssetIds: state.floorTileAssetIds,
    wallSurfaceAssetIds: state.wallSurfaceAssetIds,
    wallSurfaceProps: state.wallSurfaceProps,
    placedObjects: state.placedObjects,
    wallOpenings: state.wallOpenings,
    innerWalls: state.innerWalls,
    occupancy: state.occupancy,
    nextRoomNumber: state.nextRoomNumber,
    floors: floorsWithCurrent,
    floorOrder: state.floorOrder,
    activeFloorId: state.activeFloorId,
  })
}

function cloneSnapshotForObjectPlacement(snapshot: DungeonSnapshot): DungeonSnapshot {
  return {
    // Object placement only replaces placedObjects/occupancy/selection. Sharing the
    // untouched collections keeps placement cheap while undo/redo still deep-clone
    // the restored snapshot through cloneSnapshot().
    paintedCells: snapshot.paintedCells,
    blockedCells: snapshot.blockedCells,
    outdoorTerrainHeights: snapshot.outdoorTerrainHeights,
    outdoorTerrainStyleCells: snapshot.outdoorTerrainStyleCells,
    exploredCells: snapshot.exploredCells,
    floorTileAssetIds: snapshot.floorTileAssetIds,
    wallSurfaceAssetIds: snapshot.wallSurfaceAssetIds,
    wallSurfaceProps: snapshot.wallSurfaceProps,
    placedObjects: Object.fromEntries(
      Object.entries(snapshot.placedObjects).map(([id, object]) => [
        id,
        {
          ...object,
          position: [...object.position] as DungeonObjectRecord['position'],
          rotation: [...object.rotation] as DungeonObjectRecord['rotation'],
          localPosition: object.localPosition
            ? [...object.localPosition] as DungeonObjectRecord['localPosition']
            : object.localPosition ?? null,
          localRotation: object.localRotation
            ? [...object.localRotation] as DungeonObjectRecord['localRotation']
            : object.localRotation ?? null,
          parentObjectId: object.parentObjectId ?? null,
          supportCellKey: object.supportCellKey ?? getCellKey(object.cell),
          cell: [...object.cell] as GridCell,
          props: { ...object.props },
        },
      ]),
    ),
    wallOpenings: snapshot.wallOpenings,
    innerWalls: snapshot.innerWalls,
    occupancy: { ...snapshot.occupancy },
    tool: snapshot.tool,
    selectedAssetIds: { ...snapshot.selectedAssetIds },
    selection: snapshot.selection,
    layers: snapshot.layers,
    layerOrder: [...snapshot.layerOrder],
    activeLayerId: snapshot.activeLayerId,
    rooms: snapshot.rooms,
    nextRoomNumber: snapshot.nextRoomNumber,
  }
}

function isObjectHistoryEntry(entry: HistoryEntry): entry is ObjectHistoryEntry {
  return 'kind' in entry && entry.kind === 'object-patch'
}

function collectOccupancyKeysForObjectIds(
  occupancy: Record<string, string>,
  objectIds: Iterable<string>,
) {
  const targetIds = new Set(objectIds)
  const keys = new Set<string>()

  Object.entries(occupancy).forEach(([anchorKey, objectId]) => {
    if (targetIds.has(objectId)) {
      keys.add(anchorKey)
    }
  })

  return keys
}

function buildObjectHistoryPatchState({
  placedObjects,
  occupancy,
  objectIds,
  occupancyKeys,
  selection,
}: {
  placedObjects: Record<string, DungeonObjectRecord>
  occupancy: Record<string, string>
  objectIds: Iterable<string>
  occupancyKeys: Iterable<string>
  selection: string | null
}): ObjectHistoryPatchState {
  return {
    objects: Object.fromEntries(
      [...new Set(objectIds)].map((objectId) => [
        objectId,
        placedObjects[objectId] ? cloneDungeonObjectRecord(placedObjects[objectId]) : null,
      ]),
    ),
    occupancy: Object.fromEntries(
      [...new Set(occupancyKeys)].map((anchorKey) => [anchorKey, occupancy[anchorKey] ?? null]),
    ),
    selection,
  }
}

function buildObjectHistoryEntry({
  beforePlacedObjects,
  afterPlacedObjects,
  beforeOccupancy,
  afterOccupancy,
  changedObjectIds,
  selectionBefore,
  selectionAfter,
}: {
  beforePlacedObjects: Record<string, DungeonObjectRecord>
  afterPlacedObjects: Record<string, DungeonObjectRecord>
  beforeOccupancy: Record<string, string>
  afterOccupancy: Record<string, string>
  changedObjectIds: Iterable<string>
  selectionBefore: string | null
  selectionAfter: string | null
}): ObjectHistoryEntry {
  const objectIds = [...new Set(changedObjectIds)]
  const occupancyKeys = new Set<string>([
    ...collectOccupancyKeysForObjectIds(beforeOccupancy, objectIds),
    ...collectOccupancyKeysForObjectIds(afterOccupancy, objectIds),
  ])

  return {
    kind: 'object-patch',
    before: buildObjectHistoryPatchState({
      placedObjects: beforePlacedObjects,
      occupancy: beforeOccupancy,
      objectIds,
      occupancyKeys,
      selection: selectionBefore,
    }),
    after: buildObjectHistoryPatchState({
      placedObjects: afterPlacedObjects,
      occupancy: afterOccupancy,
      objectIds,
      occupancyKeys,
      selection: selectionAfter,
    }),
  }
}

function applyObjectHistoryPatch(
  current: Pick<DungeonSnapshot, 'placedObjects' | 'occupancy' | 'selection'>,
  patch: ObjectHistoryPatchState,
) {
  const placedObjects = { ...current.placedObjects }
  const occupancy = { ...current.occupancy }

  Object.entries(patch.objects).forEach(([objectId, object]) => {
    if (object) {
      placedObjects[objectId] = cloneDungeonObjectRecord(object)
      return
    }

    delete placedObjects[objectId]
  })

  Object.entries(patch.occupancy).forEach(([anchorKey, objectId]) => {
    if (objectId) {
      occupancy[anchorKey] = objectId
      return
    }

    delete occupancy[anchorKey]
  })

  return {
    placedObjects,
    occupancy,
    selection: patch.selection,
  }
}

function normalizeHistoryEntries(entries: HistoryEntry[] | DungeonSnapshot[] | undefined) {
  return (entries ?? []).filter((entry): entry is HistoryEntry => Boolean(entry))
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

function objectConsumesOccupancy(assetId: string | null, connector: unknown) {
  const asset = assetId ? getContentPackAssetById(assetId) : null
  if (asset?.metadata?.snapsTo === 'FREE') {
    return false
  }

  return connector !== 'FREE'
}

function getFloorRotationIndexFromRotation(rotationY: number) {
  const quarterTurns = Math.round(rotationY / (Math.PI / 2))
  return ((quarterTurns % 4) + 4) % 4
}

function createEmptySnapshot(): DungeonSnapshot {
  const defaultLayer = createDefaultLayer()
  return {
    paintedCells: {},
    blockedCells: {},
    outdoorTerrainHeights: {},
    outdoorTerrainStyleCells: {},
    exploredCells: {},
    floorTileAssetIds: {},
    wallSurfaceAssetIds: {},
    wallSurfaceProps: {},
    placedObjects: {},
    wallOpenings: {},
    innerWalls: {},
    occupancy: {},
    tool: 'select',
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

function createDefaultAssetBrowserState(): AssetBrowserState {
  return {
    category: 'furniture',
    subcategory: null,
  }
}

function createObjectId() {
  return crypto.randomUUID()
}

function ensureAssetPool(pool: string[], fallback: string[]) {
  const filtered = pool.filter(Boolean)
  return filtered.length > 0 ? filtered : fallback
}

function hashString(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash)
}

function getDeterministicRotation(cellKey: string, slot: number) {
  const bucket = hashString(`${cellKey}:${slot}:rotation`) % 4
  return bucket * (Math.PI / 2)
}

function getOutdoorTerrainStyleAssetSuffix(terrainStyle: OutdoorTerrainStyle) {
  return `_${terrainStyle.toLowerCase()}`
}

function buildOutdoorTerrainStyleAssetPools(assetIds: string[]) {
  return Object.fromEntries(
    OUTDOOR_TERRAIN_STYLES.map((terrainStyle) => [
      terrainStyle,
      assetIds.filter((id) => id.endsWith(getOutdoorTerrainStyleAssetSuffix(terrainStyle))),
    ]),
  ) as Record<OutdoorTerrainStyle, string[]>
}

function getOutdoorStyleAssetPool(
  assetPools: Record<OutdoorTerrainStyle, string[]>,
  terrainStyle: OutdoorTerrainStyle,
  fallback: string[],
) {
  return ensureAssetPool(assetPools[terrainStyle] ?? [], fallback)
}

function getOutdoorTerrainAssetPools(terrainStyle: OutdoorTerrainStyle) {
  const color1Trees = FOREST_TREE_ASSET_IDS_BY_STYLE[DEFAULT_OUTDOOR_TERRAIN_STYLE] ?? []
  const color1BareTrees = FOREST_BARE_TREE_ASSET_IDS_BY_STYLE[DEFAULT_OUTDOOR_TERRAIN_STYLE] ?? []
  const color1Bushes = FOREST_BUSH_ASSET_IDS_BY_STYLE[DEFAULT_OUTDOOR_TERRAIN_STYLE] ?? []
  const color1Rocks = FOREST_ROCK_ASSET_IDS_BY_STYLE[DEFAULT_OUTDOOR_TERRAIN_STYLE] ?? []
  const color1Grass = FOREST_GRASS_ASSET_IDS_BY_STYLE[DEFAULT_OUTDOOR_TERRAIN_STYLE] ?? []

  const trees = getOutdoorStyleAssetPool(FOREST_TREE_ASSET_IDS_BY_STYLE, terrainStyle, color1Trees)
  const bareTrees = getOutdoorStyleAssetPool(FOREST_BARE_TREE_ASSET_IDS_BY_STYLE, terrainStyle, color1BareTrees)
  const bushes = getOutdoorStyleAssetPool(FOREST_BUSH_ASSET_IDS_BY_STYLE, terrainStyle, color1Bushes)
  const rocks = getOutdoorStyleAssetPool(FOREST_ROCK_ASSET_IDS_BY_STYLE, terrainStyle, color1Rocks)
  const grass = getOutdoorStyleAssetPool(FOREST_GRASS_ASSET_IDS_BY_STYLE, terrainStyle, color1Grass)
  const flatSmallRocks = ensureAssetPool(
    rocks.filter((id) => /(rock_2_[af]|rock_3_[jklr])_color[1-8]$/.test(id)),
    color1Rocks.filter((id) => /(rock_2_[af]|rock_3_[jklr])_color1$/.test(id)),
  )

  return {
    mixedPrimary: ensureAssetPool(
      [...trees, ...bushes, ...grass],
      [
        'kaykit.forest_tree_1_a_color1',
        'kaykit.forest_tree_2_a_color1',
        'kaykit.forest_bush_1_a_color1',
        'kaykit.forest_grass_1_a_color1',
      ],
    ),
    mixedSecondary: ensureAssetPool(
      [...grass, ...bushes, ...flatSmallRocks],
      ['kaykit.forest_bush_2_a_color1', 'kaykit.forest_rock_2_a_color1'],
    ),
    rockPrimary: ensureAssetPool(rocks, [
      'kaykit.forest_rock_1_a_color1',
      'kaykit.forest_rock_2_a_color1',
      'kaykit.forest_rock_3_a_color1',
    ]),
    rockSecondary: ensureAssetPool(rocks, [
      'kaykit.forest_rock_1_a_color1',
      'kaykit.forest_rock_2_a_color1',
    ]),
    deadForestPrimary: ensureAssetPool(
      [...bareTrees, ...grass],
      ['kaykit.forest_tree_bare_1_a_color1', 'kaykit.forest_grass_1_a_color1'],
    ),
    deadForestSecondary: ensureAssetPool(
      [...bareTrees, ...grass, ...flatSmallRocks],
      ['kaykit.forest_tree_bare_1_a_color1', 'kaykit.forest_rock_2_a_color1'],
    ),
  }
}

function getOutdoorPrimaryAssetId(
  cellKey: string,
  terrainType: OutdoorTerrainType,
  terrainStyle: OutdoorTerrainStyle,
) {
  const assetPools = getOutdoorTerrainAssetPools(terrainStyle)
  const assets = terrainType === 'rocks'
    ? assetPools.rockPrimary
    : terrainType === 'dead-forest'
      ? assetPools.deadForestPrimary
      : assetPools.mixedPrimary
  return assets[hashString(`${cellKey}:primary`) % assets.length]
}

function getOutdoorSecondaryAssetId(
  cellKey: string,
  terrainType: OutdoorTerrainType,
  terrainStyle: OutdoorTerrainStyle,
) {
  const assetPools = getOutdoorTerrainAssetPools(terrainStyle)
  const assets = terrainType === 'rocks'
    ? assetPools.rockSecondary
    : terrainType === 'dead-forest'
      ? assetPools.deadForestSecondary
      : assetPools.mixedSecondary
  return assets[hashString(`${cellKey}:secondary`) % assets.length]
}

function shouldPlaceOutdoorSecondary(cellKey: string, density: OutdoorTerrainDensity) {
  return hashString(`${cellKey}:secondary-toggle`) % 100 < DENSITY_SECONDARY_CHANCE[density]
}

function normalizeOutdoorTerrainProfiles(
  profiles: Partial<Record<OutdoorTerrainType, Partial<OutdoorTerrainProfile>>> | undefined,
): Record<OutdoorTerrainType, OutdoorTerrainProfile> {
  const normalized = { ...DEFAULT_OUTDOOR_TERRAIN_PROFILES }
  if (!profiles) {
    return normalized
  }

  ;(['mixed', 'rocks', 'dead-forest'] as const).forEach((type) => {
    const profile = profiles[type]
    if (!profile) {
      return
    }

    normalized[type] = {
      density:
        profile.density === 'sparse' || profile.density === 'medium' || profile.density === 'dense'
          ? profile.density
          : normalized[type].density,
      overpaintRegenerate:
        typeof profile.overpaintRegenerate === 'boolean'
          ? profile.overpaintRegenerate
          : normalized[type].overpaintRegenerate,
    }
  })

  return normalized
}

function getOutdoorTerrainProfile(
  terrainType: OutdoorTerrainType,
  profiles: Record<OutdoorTerrainType, OutdoorTerrainProfile>,
) {
  return profiles[terrainType] ?? DEFAULT_OUTDOOR_TERRAIN_PROFILES[terrainType]
}

function createForestPrimaryObject({
  cell,
  cellKey,
  layerId,
  terrainType,
  terrainStyle,
  outdoorTerrainHeights,
}: {
  cell: GridCell
  cellKey: string
  layerId: string
  terrainType: OutdoorTerrainType
  terrainStyle: OutdoorTerrainStyle
  outdoorTerrainHeights: OutdoorTerrainHeightfield
}): DungeonObjectRecord {
  const worldPosition = getOutdoorTerrainWorldPosition(cell, outdoorTerrainHeights)
  return {
    id: `surrounding:${SURROUNDING_FOREST_TAG}:${cellKey}:primary`,
    type: 'prop',
    assetId: getOutdoorPrimaryAssetId(cellKey, terrainType, terrainStyle),
    position: [worldPosition[0], worldPosition[1], worldPosition[2]],
    rotation: [0, getDeterministicRotation(cellKey, 0), 0],
    cell: [...cell] as GridCell,
    cellKey: `${cellKey}:floor`,
    supportCellKey: cellKey,
    props: {
      connector: 'FLOOR',
      direction: null,
      generatedBy: SURROUNDING_FOREST_TAG,
      surroundingType: terrainType,
      terrainStyle,
    },
    layerId,
  }
}

function createForestSecondaryObject({
  cell,
  cellKey,
  layerId,
  terrainType,
  terrainStyle,
  outdoorTerrainHeights,
}: {
  cell: GridCell
  cellKey: string
  layerId: string
  terrainType: OutdoorTerrainType
  terrainStyle: OutdoorTerrainStyle
  outdoorTerrainHeights: OutdoorTerrainHeightfield
}): DungeonObjectRecord {
  const worldPosition = getOutdoorTerrainWorldPosition(cell, outdoorTerrainHeights)
  const offsetX = ((hashString(`${cellKey}:offset-x`) % 100) / 100 - 0.5) * 1.1
  const offsetZ = ((hashString(`${cellKey}:offset-z`) % 100) / 100 - 0.5) * 1.1
  return {
    id: `surrounding:${SURROUNDING_FOREST_TAG}:${cellKey}:secondary`,
    type: 'prop',
    assetId: getOutdoorSecondaryAssetId(cellKey, terrainType, terrainStyle),
    position: [worldPosition[0] + offsetX, worldPosition[1], worldPosition[2] + offsetZ],
    rotation: [0, getDeterministicRotation(cellKey, 1), 0],
    cell: [...cell] as GridCell,
    cellKey: `${cellKey}:surrounding:secondary`,
    supportCellKey: cellKey,
    props: {
      connector: 'FREE',
      direction: null,
      generatedBy: SURROUNDING_FOREST_TAG,
      surroundingType: terrainType,
      terrainStyle,
    },
    layerId,
  }
}

function isOutdoorGroundSupportedObject(object: DungeonObjectRecord) {
  if (object.parentObjectId) {
    return false
  }

  const connector = object.props.connector
  return object.type === 'player' || connector === 'FLOOR' || connector === 'FREE'
}

function reanchorOutdoorPlacedObjects(
  placedObjects: Record<string, DungeonObjectRecord>,
  outdoorTerrainHeights: OutdoorTerrainHeightfield,
  targetCellKeys?: Set<string>,
) {
  let nextPlacedObjects = placedObjects

  Object.values(placedObjects).forEach((object) => {
    if (!isOutdoorGroundSupportedObject(object)) {
      return
    }

    const supportCellKey = object.supportCellKey ?? getCellKey(object.cell)
    if (targetCellKeys && !targetCellKeys.has(supportCellKey)) {
      return
    }

    const [supportX, supportZ] = supportCellKey.split(':').map(Number)
    const supportCell: GridCell = Number.isFinite(supportX) && Number.isFinite(supportZ)
      ? [supportX, supportZ]
      : object.cell

    const nextY = getOutdoorTerrainCellHeight(outdoorTerrainHeights, supportCell)

    if (Math.abs(object.position[1] - nextY) < 0.0001) {
      return
    }

    if (nextPlacedObjects === placedObjects) {
      nextPlacedObjects = { ...placedObjects }
    }

    nextPlacedObjects[object.id] = {
      ...object,
      position: [object.position[0], nextY, object.position[2]],
    }
    updateDescendantWorldTransforms(nextPlacedObjects, object.id)
  })

  return nextPlacedObjects
}

function isSurroundingGeneratedObject(object: DungeonObjectRecord) {
  return object.props.generatedBy === SURROUNDING_FOREST_TAG
}

function removeSurroundingObjectsForCell(
  current: MutableObjectMaps,
  targetCellKey: string,
) {
  const objectIds = Object.values(current.placedObjects)
    .filter((object) => isSurroundingGeneratedObject(object))
    .filter((object) => (object.supportCellKey ?? getCellKey(object.cell)) === targetCellKey)
    .map((object) => object.id)

  objectIds.forEach((objectId) => {
    removeObjectHierarchy(current, objectId)
  })
}

function placeSurroundingForestForCell({
  current,
  cell,
  layerId,
  terrainType,
  terrainStyle,
  density,
  regenerate,
  outdoorTerrainHeights,
}: {
  current: MutableObjectMaps
  cell: GridCell
  layerId: string
  terrainType: OutdoorTerrainType
  terrainStyle: OutdoorTerrainStyle
  density: OutdoorTerrainDensity
  regenerate: boolean
  outdoorTerrainHeights: OutdoorTerrainHeightfield
}) {
  const cellKey = getCellKey(cell)
  if (regenerate) {
    removeSurroundingObjectsForCell(current, cellKey)
  }
  const floorAnchorKey = `${cellKey}:floor`
  const occupiedBy = current.occupancy[floorAnchorKey]

  if (occupiedBy) {
    const existing = current.placedObjects[occupiedBy]
    if (existing && isSurroundingGeneratedObject(existing)) {
      removeObjectHierarchy(current, existing.id)
    }
  }

  if (!current.occupancy[floorAnchorKey]) {
    const primary = createForestPrimaryObject({
      cell,
      cellKey,
      layerId,
      terrainType,
      terrainStyle,
      outdoorTerrainHeights,
    })
    current.placedObjects[primary.id] = primary
    current.occupancy[floorAnchorKey] = primary.id
  }

  const secondaryId = `surrounding:${SURROUNDING_FOREST_TAG}:${cellKey}:secondary`
  if (shouldPlaceOutdoorSecondary(cellKey, density)) {
    const secondary = createForestSecondaryObject({
      cell,
      cellKey,
      layerId,
      terrainType,
      terrainStyle,
      outdoorTerrainHeights,
    })
    current.placedObjects[secondary.id] = secondary
  } else if (current.placedObjects[secondaryId]) {
    removeObjectHierarchy(current, secondaryId)
  }
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

function collectOpenPassageIdsForWallKeys(
  wallOpenings: Record<string, OpeningRecord>,
  wallKeys: string[],
) {
  if (wallKeys.length === 0) {
    return []
  }

  const targetSegments = new Set(wallKeys)
  return Object.values(wallOpenings)
    .filter((opening) =>
      opening.assetId === null &&
      getOpeningSegments(opening.wallKey, opening.width).some((segment) => targetSegments.has(segment)),
    )
    .map((opening) => opening.id)
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

function collectAffectedWallKeys(changedCells: GridCell[]) {
  const affectedKeys = new Set<string>()

  changedCells.forEach((cell) => {
    const cellKey = getCellKey(cell)

    CONNECTOR_DIRECTIONS.forEach(({ name, delta, opposite }) => {
      affectedKeys.add(`${cellKey}:${name}`)

      const neighbor: GridCell = [cell[0] + delta[0], cell[1] + delta[1]]
      affectedKeys.add(`${getCellKey(neighbor)}:${opposite}`)
    })
  })

  return affectedKeys
}

function getFloorRenderInvalidationHaloCells(floorTileAssetIds: Record<string, string>) {
  return Math.max(
    1,
    ...Object.values(floorTileAssetIds).map((assetId) => {
      const span = getFloorTileSpan(assetId)
      return Math.max(span.gridWidth - 1, span.gridHeight - 1)
    }),
  )
}

function buildLocalizedRoomPaintDirtyHint(
  current: Pick<DungeonSnapshot, 'floorTileAssetIds'>,
  changedCells: GridCell[],
): FloorDirtyHint {
  const dirtyChunkKeys = getFloorChunkKeysForCells(changedCells)
  const dirtyRenderChunkKeys = getFloorChunkKeysForCells(changedCells, {
    haloCells: getFloorRenderInvalidationHaloCells(current.floorTileAssetIds),
  })

  return {
    cells: changedCells,
    chunkKeys: dirtyChunkKeys,
    renderChunkKeys: dirtyRenderChunkKeys,
    lightChunkKeys: dirtyChunkKeys,
    wallKeys: collectAffectedWallKeys(changedCells),
  }
}

function isAnchorDirection(value: unknown): value is AnchorDirection {
  return (
    value === 'north' ||
    value === 'south' ||
    value === 'east' ||
    value === 'west'
  )
}

function isAnchoredConnector(value: unknown): value is Exclude<PropConnector, 'FREE'> {
  return value === 'FLOOR' || value === 'WALL' || value === 'WALLFLOOR'
}

function collectDescendantIds(
  placedObjects: Record<string, DungeonObjectRecord>,
  rootId: string,
) {
  const pending = [rootId]
  const removedIds = new Set<string>()

  while (pending.length > 0) {
    const currentId = pending.pop()
    if (!currentId || removedIds.has(currentId)) {
      continue
    }

    removedIds.add(currentId)

    Object.values(placedObjects).forEach((object) => {
      if (object.parentObjectId === currentId) {
        pending.push(object.id)
      }
    })
  }

  return removedIds
}

function removeObjectHierarchy(
  current: MutableObjectMaps,
  rootId: string,
) {
  const removedIds = collectDescendantIds(current.placedObjects, rootId)

  removedIds.forEach((objectId) => {
    delete current.placedObjects[objectId]
  })

  Object.entries(current.occupancy).forEach(([anchorKey, objectId]) => {
    if (removedIds.has(objectId)) {
      delete current.occupancy[anchorKey]
    }
  })

  return removedIds
}

function deriveWorldTransformFromParent(
  parent: DungeonObjectRecord,
  localPosition: DungeonObjectRecord['position'],
  localRotation: DungeonObjectRecord['rotation'],
) {
  const parentPosition = new Vector3(...parent.position)
  const parentQuaternion = new Quaternion().setFromEuler(new Euler(...parent.rotation))
  const childOffset = new Vector3(...localPosition).applyQuaternion(parentQuaternion)
  const childQuaternion = parentQuaternion.multiply(
    new Quaternion().setFromEuler(new Euler(...localRotation)),
  )
  const childEuler = new Euler().setFromQuaternion(childQuaternion)

  return {
    position: parentPosition
      .add(childOffset)
      .toArray() as DungeonObjectRecord['position'],
    rotation: [childEuler.x, childEuler.y, childEuler.z] as DungeonObjectRecord['rotation'],
  }
}

function updateDescendantWorldTransforms(
  placedObjects: Record<string, DungeonObjectRecord>,
  parentId: string,
) {
  const parent = placedObjects[parentId]
  if (!parent) {
    return
  }

  Object.values(placedObjects).forEach((object) => {
    if (object.parentObjectId !== parentId || !object.localPosition || !object.localRotation) {
      return
    }

    const worldTransform = deriveWorldTransformFromParent(
      parent,
      object.localPosition,
      object.localRotation,
    )

    placedObjects[object.id] = {
      ...object,
      position: worldTransform.position,
      rotation: worldTransform.rotation,
    }

    updateDescendantWorldTransforms(placedObjects, object.id)
  })
}

function isPropAnchorValid(
  object: DungeonObjectRecord,
  paintedCells: PaintedCells,
) {
  const supportCellKey = object.supportCellKey ?? getCellKey(object.cell)
  if (!paintedCells[supportCellKey]) {
    return false
  }

  const connector = object.props.connector
  if (!isAnchoredConnector(connector)) {
    return true
  }

  const cellKey = getCellKey(object.cell)

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
  current: Pick<DungeonSnapshot, 'placedObjects' | 'occupancy' | 'selection' | 'wallOpenings' | 'innerWalls'>,
  paintedCells: PaintedCells,
  changedCells: GridCell[],
) {
  const affectedAnchorKeys = collectAffectedAnchorKeys(changedCells)
  const affectedWallKeys = collectAffectedWallKeys(changedCells)
  const changedCellKeys = new Set(changedCells.map((cell) => getCellKey(cell)))
  let placedObjects = current.placedObjects
  let occupancy = current.occupancy
  let selection = current.selection
  const invalidRootIds = new Set<string>()

  const ensureMutableObjectMaps = () => {
    if (placedObjects === current.placedObjects) {
      placedObjects = { ...current.placedObjects }
    }
    if (occupancy === current.occupancy) {
      occupancy = { ...current.occupancy }
    }
  }

  affectedAnchorKeys.forEach((anchorKey) => {
    const objectId = occupancy[anchorKey]
    if (!objectId) {
      return
    }

    const object = placedObjects[objectId]
    if (!object || isPropAnchorValid(object, paintedCells)) {
      return
    }

    invalidRootIds.add(objectId)
  })

  Object.values(placedObjects).forEach((object) => {
    if (object.parentObjectId) {
      return
    }

    const connector = object.props.connector
    const supportCellKey = object.supportCellKey ?? getCellKey(object.cell)
    if (connector === 'FREE' && changedCellKeys.has(supportCellKey) && !paintedCells[supportCellKey]) {
      invalidRootIds.add(object.id)
    }
  })

  invalidRootIds.forEach((objectId) => {
    ensureMutableObjectMaps()
    const removedIds = removeObjectHierarchy({ placedObjects, occupancy }, objectId)
    if (selection && removedIds.has(selection)) {
      selection = null
    }
  })

  // Also prune openings whose wall segments are no longer valid boundaries.
  // A segment is valid if: the cell is painted AND the neighbour is either
  // unpainted (exterior wall) OR painted-but-different-room (inter-room wall).
  let wallOpenings = current.wallOpenings
  Object.values(wallOpenings).forEach((opening) => {
    const segments = getOpeningSegments(opening.wallKey, opening.width)
    if (!segments.some((segment) => affectedWallKeys.has(segment))) {
      return
    }

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
    if (!stillValid) {
      if (wallOpenings === current.wallOpenings) {
        wallOpenings = { ...current.wallOpenings }
      }
      delete wallOpenings[opening.id]
    }
  })

  let innerWalls = current.innerWalls
  affectedWallKeys.forEach((wallKey) => {
    if (!innerWalls[wallKey] || getCanonicalInnerWallKey(wallKey, paintedCells)) {
      return
    }

    if (innerWalls === current.innerWalls) {
      innerWalls = { ...current.innerWalls }
    }
    delete innerWalls[wallKey]
  })

  return { placedObjects, occupancy, selection, wallOpenings, innerWalls }
}

function pruneInvalidSurfaceOverrides(
  current: Pick<DungeonSnapshot, 'floorTileAssetIds' | 'wallSurfaceAssetIds' | 'wallSurfaceProps'>,
  paintedCells: PaintedCells,
  changedCells: GridCell[],
) {
  const changedCellKeys = new Set(changedCells.map((cell) => getCellKey(cell)))
  const affectedWallKeys = collectAffectedWallKeys(changedCells)
  let floorTileAssetIds = current.floorTileAssetIds
  let wallSurfaceAssetIds = current.wallSurfaceAssetIds
  let wallSurfaceProps = current.wallSurfaceProps

  changedCellKeys.forEach((cellKey) => {
    const assetId = floorTileAssetIds[cellKey]
    if (!assetId || isFloorSurfacePlacementValid(cellKey, assetId, paintedCells)) {
      return
    }

    if (floorTileAssetIds === current.floorTileAssetIds) {
      floorTileAssetIds = { ...current.floorTileAssetIds }
    }
    delete floorTileAssetIds[cellKey]
  })

  affectedWallKeys.forEach((wallKey) => {
    if (
      wallSurfaceAssetIds[wallKey]
      && getCanonicalWallKey(wallKey, paintedCells) !== wallKey
    ) {
      if (wallSurfaceAssetIds === current.wallSurfaceAssetIds) {
        wallSurfaceAssetIds = { ...current.wallSurfaceAssetIds }
      }
      delete wallSurfaceAssetIds[wallKey]
    }

    if (
      wallSurfaceProps[wallKey]
      && getCanonicalWallKey(wallKey, paintedCells) !== wallKey
    ) {
      if (wallSurfaceProps === current.wallSurfaceProps) {
        wallSurfaceProps = { ...current.wallSurfaceProps }
      }
      delete wallSurfaceProps[wallKey]
    }
  })

  return { floorTileAssetIds, wallSurfaceAssetIds, wallSurfaceProps }
}

const FALLBACK_PERSIST_STORAGE: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  get length() {
    return 0
  },
}

function getPersistStorage() {
  if (typeof window === 'undefined') {
    return FALLBACK_PERSIST_STORAGE
  }

  const storage = window.localStorage
  if (
    storage &&
    typeof storage.getItem === 'function' &&
    typeof storage.setItem === 'function' &&
    typeof storage.removeItem === 'function'
  ) {
    return storage
  }

  return FALLBACK_PERSIST_STORAGE
}

function deriveChangedFloorDirtyDomains(
  previous: DungeonState,
  next: DungeonState,
) {
  const domains = new Set<FloorDirtyDomainKey>()

  if (previous.activeFloorId !== next.activeFloorId) {
    ALL_FLOOR_DIRTY_DOMAINS.forEach((domain) => {
      domains.add(domain)
    })
    return domains
  }

  if (previous.paintedCells !== next.paintedCells) {
    domains.add('tiles')
    domains.add('walls')
    domains.add('lighting')
    domains.add('renderPlan')
  }
  if (previous.blockedCells !== next.blockedCells) {
    domains.add('blocked')
  }
  if (
    previous.outdoorTerrainHeights !== next.outdoorTerrainHeights
    || previous.outdoorTerrainStyleCells !== next.outdoorTerrainStyleCells
    || previous.mapMode !== next.mapMode
  ) {
    domains.add('terrain')
  }
  if (previous.rooms !== next.rooms) {
    domains.add('tiles')
    domains.add('walls')
    domains.add('lighting')
    domains.add('renderPlan')
  }
  if (previous.wallOpenings !== next.wallOpenings) {
    domains.add('openings')
    domains.add('lighting')
    domains.add('renderPlan')
  }
  if (previous.innerWalls !== next.innerWalls) {
    domains.add('walls')
    domains.add('lighting')
    domains.add('renderPlan')
  }
  if (previous.placedObjects !== next.placedObjects) {
    domains.add('props')
    domains.add('lighting')
  }
  if (previous.floorTileAssetIds !== next.floorTileAssetIds) {
    domains.add('tiles')
    domains.add('renderPlan')
  }
  if (previous.wallSurfaceAssetIds !== next.wallSurfaceAssetIds) {
    domains.add('walls')
    domains.add('renderPlan')
  }
  if (previous.wallSurfaceProps !== next.wallSurfaceProps) {
    domains.add('walls')
    domains.add('openings')
    domains.add('lighting')
    domains.add('renderPlan')
  }
  if (previous.layers !== next.layers) {
    domains.add('layerVisibility')
    domains.add('lighting')
    domains.add('renderPlan')
  }
  if (previous.occupancy !== next.occupancy) {
    domains.add('occupancy')
  }
  if (previous.selectedAssetIds.floor !== next.selectedAssetIds.floor) {
    domains.add('tiles')
    domains.add('renderPlan')
  }
  if (previous.selectedAssetIds.wall !== next.selectedAssetIds.wall) {
    domains.add('walls')
    domains.add('renderPlan')
  }

  return domains
}

function applyTrackedFloorDirtyDomains(
  previous: DungeonState,
  next: DungeonState,
  hint: FloorDirtyHint | null,
) {
  const floorId = hint?.floorId ?? next.activeFloorId
  const domains = deriveChangedFloorDirtyDomains(previous, next)
  hint?.domains?.forEach((domain) => {
    domains.add(domain)
  })

  return {
    ...next,
    floorDirtyDomains: applyFloorDirtyMutation({
      floorDirtyState: next.floorDirtyDomains,
      floorIds: next.floorOrder,
      floorId,
      domains,
      hint: previous.activeFloorId !== next.activeFloorId
        ? { ...hint, fullRefresh: true }
        : hint,
    }),
  }
}

function mergeFloorDirtyHints(
  previousHint: FloorDirtyHint | null,
  nextHint: FloorDirtyHint,
): FloorDirtyHint {
  if (!previousHint) {
    return nextHint
  }

  return {
    floorId: nextHint.floorId ?? previousHint.floorId,
    domains: [...new Set([...(previousHint.domains ?? []), ...(nextHint.domains ?? [])])],
    cells: [...(previousHint.cells ?? []), ...(nextHint.cells ?? [])],
    chunkKeys: [...(previousHint.chunkKeys ?? []), ...(nextHint.chunkKeys ?? [])],
    renderChunkKeys: [...(previousHint.renderChunkKeys ?? []), ...(nextHint.renderChunkKeys ?? [])],
    lightChunkKeys: [...(previousHint.lightChunkKeys ?? []), ...(nextHint.lightChunkKeys ?? [])],
    wallKeys: [...(previousHint.wallKeys ?? []), ...(nextHint.wallKeys ?? [])],
    objectIds: [...(previousHint.objectIds ?? []), ...(nextHint.objectIds ?? [])],
    fullRefresh: previousHint.fullRefresh || nextHint.fullRefresh,
  }
}

export const useDungeonStore = create<DungeonState>()(
  persist(
    (set, get) => {
  const INITIAL_FLOOR_ID = 'floor-1'
  const initialSnapshot = createEmptySnapshot()
  const baseSet = set
  let pendingFloorDirtyHint: FloorDirtyHint | null = null
  const queueFloorDirtyHint = (hint: FloorDirtyHint) => {
    pendingFloorDirtyHint = mergeFloorDirtyHints(pendingFloorDirtyHint, hint)
  }

  const trackedSet: typeof set = (partial, replace) => {
    const computeNextState = (current: DungeonState) => {
      const hint = pendingFloorDirtyHint
      pendingFloorDirtyHint = null
      const resolved = typeof partial === 'function'
        ? partial(current)
        : partial
      if (resolved === current) {
        return current
      }

      const next = typeof partial === 'function'
        ? resolved as DungeonState
        : {
            ...current,
            ...(resolved as Partial<DungeonState>),
          }

      return applyTrackedFloorDirtyDomains(current, next as DungeonState, hint)
    }

    if (replace === true) {
      baseSet(computeNextState, true)
      return
    }

    baseSet(computeNextState)
  }
  set = trackedSet

  return ({
  ...initialSnapshot,
  mapMode: 'indoor' as MapMode,
  outdoorTimeOfDay: 0.5,
  outdoorTerrainType: 'mixed' as OutdoorTerrainType,
  outdoorTerrainProfiles: normalizeOutdoorTerrainProfiles(undefined),
  outdoorTerrainDensity: DEFAULT_OUTDOOR_TERRAIN_PROFILES.mixed.density,
  outdoorOverpaintRegenerate: DEFAULT_OUTDOOR_TERRAIN_PROFILES.mixed.overpaintRegenerate,
  defaultOutdoorTerrainStyle: DEFAULT_OUTDOOR_TERRAIN_STYLE,
  outdoorBrushMode: 'surroundings' as OutdoorBrushMode,
  outdoorTerrainSculptMode: 'raise' as OutdoorTerrainSculptMode,
  outdoorTerrainSculptStep: DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
  outdoorTerrainSculptRadius: DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS,
  outdoorTerrainStyleBrush: DEFAULT_OUTDOOR_TERRAIN_STYLE,
  dungeonName: 'My Dungeon',
  cameraMode: 'orbit',
  isPaintingStrokeActive: false,
  isObjectDragActive: false,
  isRoomResizeHandleActive: false,
  roomEditMode: 'rooms' as RoomEditMode,
  wallConnectionMode: 'door' as WallConnectionMode,
  wallConnectionWidth: 1 as 1 | 2 | 3,
  selectedRoomId: null,
  surfaceBrushAssetIds: {
    floor: getDefaultAssetIdByCategory('floor'),
    wall: getDefaultAssetIdByCategory('wall'),
  },
  sceneLighting: { intensity: 1 },
  postProcessing: { ...DEFAULT_POST_PROCESSING_SETTINGS },
  showGrid: true,
  showLosDebugMask: false,
  showLosDebugRays: false,
  showLensFocusDebugPoint: false,
  showChunkDebugOverlay: false,
  showProjectionDebugMesh: false,
  showPropProbeDebug: false,
  slowBuildAnimationDebug: false,
  buildPerformanceTracingEnabled: false,
  lightEffectsEnabled: true,
  lightFlickerEnabled: true,
  particleEffectsEnabled: true,
  floorViewMode: 'active' as FloorViewMode,
  generatedCharacters: {},
  characterSheet: {
    open: false,
    assetId: null,
  },
  assetBrowser: createDefaultAssetBrowserState(),
  fpsLimit: 60 as 0 | 30 | 60 | 120,
  activeCameraMode: 'perspective',
  cameraPreset: null,
  previousCameraPreset: null,
  objectLightPreviewOverrides: {},
  objectScalePreviewOverrides: {},
  objectRotationPreviewOverrides: {},
  pickedUpObject: null,
  objectMoveDragPointer: null,
  history: [],
  future: [],
  floorDirtyDomains: {
    [INITIAL_FLOOR_ID]: createFloorDirtyInfo(),
  },
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

    const previousSnapshot = cloneSnapshotForObjectPlacement(state)
    queueFloorDirtyHint(buildLocalizedRoomPaintDirtyHint(state, nextCells))

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
        innerWalls,
      } = pruneInvalidConnectedProps(current, paintedCells, nextCells)
      const { floorTileAssetIds, wallSurfaceAssetIds, wallSurfaceProps } = pruneInvalidSurfaceOverrides(
        current,
        paintedCells,
        nextCells,
      )

      return {
        ...current,
        paintedCells,
        floorTileAssetIds,
        wallSurfaceAssetIds,
        wallSurfaceProps,
        placedObjects,
        wallOpenings,
        innerWalls,
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
  paintBlockedCells: (cells) => {
    const state = get()
    if (state.mapMode !== 'outdoor') {
      return 0
    }
    const activeProfile = getOutdoorTerrainProfile(state.outdoorTerrainType, state.outdoorTerrainProfiles)
    const nextCells = activeProfile.overpaintRegenerate
      ? cells
      : cells.filter((cell) => !state.blockedCells[getCellKey(cell)])
    if (nextCells.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['blocked', 'terrain', 'props', 'occupancy'],
      cells: nextCells,
    })
    set((current) => {
      const blockedCells = { ...current.blockedCells }
      let placedObjects = { ...current.placedObjects }
      const occupancy = { ...current.occupancy }
      nextCells.forEach((cell) => {
        const cellKey = getCellKey(cell)
        blockedCells[cellKey] = {
          cell: [...cell] as GridCell,
          layerId: current.activeLayerId,
          roomId: null,
        }
        placeSurroundingForestForCell({
          current: { placedObjects, occupancy },
          cell,
          layerId: current.activeLayerId,
          terrainType: current.outdoorTerrainType,
          terrainStyle: current.outdoorTerrainStyleBrush,
          density: getOutdoorTerrainProfile(current.outdoorTerrainType, current.outdoorTerrainProfiles).density,
          regenerate: getOutdoorTerrainProfile(
            current.outdoorTerrainType,
            current.outdoorTerrainProfiles,
          ).overpaintRegenerate,
          outdoorTerrainHeights: current.outdoorTerrainHeights,
        })
      })
      placedObjects = reanchorOutdoorPlacedObjects(
        placedObjects,
        current.outdoorTerrainHeights,
        new Set(nextCells.map((cell) => getCellKey(cell))),
      )
      return {
        ...current,
        blockedCells,
        placedObjects,
        occupancy,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return nextCells.length
  },
  eraseBlockedCells: (cells) => {
    const state = get()
    const nextKeys = cells
      .map((cell) => getCellKey(cell))
      .filter((key) => Boolean(state.blockedCells[key]))

    if (nextKeys.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['blocked', 'terrain', 'props', 'occupancy'],
      cells,
    })
    set((current) => {
      const blockedCells = { ...current.blockedCells }
      const placedObjects = { ...current.placedObjects }
      const occupancy = { ...current.occupancy }
      let selection = current.selection
      nextKeys.forEach((key) => {
        delete blockedCells[key]
        removeSurroundingObjectsForCell({ placedObjects, occupancy }, key)
        if (selection && !placedObjects[selection]) {
          selection = null
        }
      })

      return {
        ...current,
        blockedCells,
        placedObjects,
        occupancy,
        selection,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return nextKeys.length
  },
  sculptOutdoorTerrain: (cells, mode) => {
    const state = get()
    if (state.mapMode !== 'outdoor' || cells.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)
    const sculptMode = mode ?? state.outdoorTerrainSculptMode
    const targetCellKeys = new Set(cells.map((cell) => getCellKey(cell)))
    queueFloorDirtyHint({
      domains: ['terrain', 'props'],
      cells,
    })

    set((current) => {
      const outdoorTerrainHeights = applyOutdoorTerrainSculpt(
        current.outdoorTerrainHeights,
        cells,
        sculptMode,
        current.outdoorTerrainSculptStep,
        current.outdoorTerrainSculptRadius,
      )
      const placedObjects = reanchorOutdoorPlacedObjects(
        current.placedObjects,
        outdoorTerrainHeights,
        targetCellKeys,
      )

      if (
        outdoorTerrainHeights === current.outdoorTerrainHeights &&
        placedObjects === current.placedObjects
      ) {
        return current
      }

      return {
        ...current,
        outdoorTerrainHeights,
        placedObjects,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return cells.length
  },
  paintOutdoorTerrainStyleCells: (cells) => {
    const state = get()
    if (state.mapMode !== 'outdoor') {
      return 0
    }
    const nextCells = cells.filter((cell) => {
      const cellKey = getCellKey(cell)
      return state.outdoorTerrainStyleCells[cellKey]?.terrainStyle !== state.outdoorTerrainStyleBrush
    })
    if (nextCells.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['terrain'],
      cells: nextCells,
    })
    set((current) => {
      if (current.mapMode !== 'outdoor') {
        return current
      }
      const outdoorTerrainStyleCells = { ...current.outdoorTerrainStyleCells }
      nextCells.forEach((cell) => {
        const cellKey = getCellKey(cell)
        outdoorTerrainStyleCells[cellKey] = {
          cell: [...cell] as GridCell,
          layerId: current.activeLayerId,
          terrainStyle: current.outdoorTerrainStyleBrush,
        }
      })
      return {
        ...current,
        outdoorTerrainStyleCells,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return nextCells.length
  },
  eraseOutdoorTerrainStyleCells: (cells) => {
    const state = get()
    if (state.mapMode !== 'outdoor') {
      return 0
    }
    const nextKeys = cells
      .map((cell) => getCellKey(cell))
      .filter((key) => Boolean(state.outdoorTerrainStyleCells[key]))
    if (nextKeys.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['terrain'],
      cells,
    })
    set((current) => {
      if (current.mapMode !== 'outdoor') {
        return current
      }
      const outdoorTerrainStyleCells = { ...current.outdoorTerrainStyleCells }
      nextKeys.forEach((key) => {
        delete outdoorTerrainStyleCells[key]
      })
      return {
        ...current,
        outdoorTerrainStyleCells,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return nextKeys.length
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
    queueFloorDirtyHint({
      domains: ['tiles', 'walls', 'openings', 'props', 'lighting', 'renderPlan', 'occupancy'],
      cells,
    })

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
        innerWalls,
      } = pruneInvalidConnectedProps(current, paintedCells, removedCells)
      const { floorTileAssetIds, wallSurfaceAssetIds, wallSurfaceProps } = pruneInvalidSurfaceOverrides(
        current,
        paintedCells,
        removedCells,
      )

      return {
        ...current,
        paintedCells,
        floorTileAssetIds,
        wallSurfaceAssetIds,
        wallSurfaceProps,
        placedObjects,
        wallOpenings,
        innerWalls,
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
    const consumesOccupancy = objectConsumesOccupancy(input.assetId, input.props.connector)
    if (input.parentObjectId && !state.placedObjects[input.parentObjectId]) {
      return null
    }

    const existingId = consumesOccupancy ? state.occupancy[input.cellKey] : null
    const existingObject = existingId ? state.placedObjects[existingId] : null

    if (
      existingObject &&
      existingObject.type === input.type &&
      existingObject.cellKey === input.cellKey &&
      existingObject.assetId === input.assetId &&
      existingObject.position.every((value, index) => value === input.position[index]) &&
      existingObject.rotation.every((value, index) => value === input.rotation[index]) &&
      (existingObject.parentObjectId ?? null) === (input.parentObjectId ?? null) &&
      (existingObject.supportCellKey ?? getCellKey(existingObject.cell)) ===
        (input.supportCellKey ?? getCellKey(input.cell)) &&
      JSON.stringify(existingObject.localPosition ?? null) ===
        JSON.stringify(input.localPosition ?? null) &&
      JSON.stringify(existingObject.localRotation ?? null) ===
        JSON.stringify(input.localRotation ?? null) &&
      JSON.stringify(existingObject.props) === JSON.stringify(input.props)
    ) {
      return existingObject.id
    }

    const nextId = createObjectId()
    const groundedOutdoorObject =
      state.mapMode === 'outdoor' &&
      !input.parentObjectId &&
      (input.type === 'player' || input.props.connector === 'FLOOR' || input.props.connector === 'FREE')
    const supportCellKey = input.supportCellKey ?? getCellKey(input.cell)
    const positionY = groundedOutdoorObject
      ? getOutdoorTerrainCellHeight(state.outdoorTerrainHeights, input.cell)
      : input.position[1]
    const placedObjects = { ...state.placedObjects }
    const occupancy = { ...state.occupancy }
    const changedObjectIds = new Set<string>([nextId])

    if (existingId) {
      collectDescendantIds(state.placedObjects, existingId).forEach((objectId) => {
        changedObjectIds.add(objectId)
      })
      removeObjectHierarchy({ placedObjects, occupancy }, existingId)
    }

    placedObjects[nextId] = {
      id: nextId,
      type: input.type,
      assetId: input.assetId,
      position: [input.position[0], positionY, input.position[2]] as DungeonObjectRecord['position'],
      rotation: [...input.rotation] as DungeonObjectRecord['rotation'],
      localPosition: input.localPosition
        ? [...input.localPosition] as DungeonObjectRecord['localPosition']
        : input.localPosition ?? null,
      localRotation: input.localRotation
        ? [...input.localRotation] as DungeonObjectRecord['localRotation']
        : input.localRotation ?? null,
      parentObjectId: input.parentObjectId ?? null,
      supportCellKey,
      props: { ...input.props },
      cell: [...input.cell] as GridCell,
      cellKey: input.cellKey,
      layerId: state.activeLayerId,
    }
    if (consumesOccupancy) {
      occupancy[input.cellKey] = nextId
    }

    const nextSelection = input.selectPlaced === false ? state.selection : nextId
    const historyEntry = buildObjectHistoryEntry({
      beforePlacedObjects: state.placedObjects,
      afterPlacedObjects: placedObjects,
      beforeOccupancy: state.occupancy,
      afterOccupancy: occupancy,
      changedObjectIds,
      selectionBefore: state.selection,
      selectionAfter: nextSelection,
    })
    queueFloorDirtyHint({
      domains: ['props', 'lighting', 'occupancy'],
      cells: [input.cell],
      objectIds: changedObjectIds,
    })

    set((current) => ({
      ...current,
      placedObjects,
      occupancy,
      selection: nextSelection,
      history: [...current.history, historyEntry],
      future: [],
    }))

    const stairDirection = getStairDirectionForAssetId(input.assetId)
    const opposingAssetId = getPairedStairAssetId(input.assetId)
    if (stairDirection && opposingAssetId) {
      const updated = get()
      const currentLevel = updated.floors[updated.activeFloorId]?.level ?? 0
      const targetLevel = stairDirection === 'up' ? currentLevel + 1 : currentLevel - 1
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

    const consumesOccupancy = objectConsumesOccupancy(object.assetId, object.props.connector)
    const isOutdoorPlayerMove = state.mapMode === 'outdoor' && object.type === 'player'

    if (state.mapMode !== 'outdoor' && !state.paintedCells[getCellKey(input.cell)]) {
      return false
    }
    if (state.mapMode === 'outdoor' && !isOutdoorPlayerMove && state.blockedCells[getCellKey(input.cell)]) {
      return false
    }

    const occupantId = consumesOccupancy ? state.occupancy[input.cellKey] : null
    const occupant = occupantId ? state.placedObjects[occupantId] : null
    const ignoresOccupant =
      isOutdoorPlayerMove &&
      occupant !== null &&
      isSurroundingGeneratedObject(occupant)
    if (occupantId && occupantId !== id) {
      if (!ignoresOccupant) {
        return false
      }
    }

    const nextPositionY =
      state.mapMode === 'outdoor'
        ? getOutdoorTerrainCellHeight(state.outdoorTerrainHeights, input.cell)
        : input.position[1]

    const unchanged =
      object.cellKey === input.cellKey &&
      object.cell[0] === input.cell[0] &&
      object.cell[1] === input.cell[1] &&
      object.position[0] === input.position[0] &&
      object.position[1] === nextPositionY &&
      object.position[2] === input.position[2]

    if (unchanged) {
      return true
    }

    const changedObjectIds = collectDescendantIds(state.placedObjects, id)
    const placedObjects = {
      ...state.placedObjects,
      [id]: {
        ...object,
        position: [input.position[0], nextPositionY, input.position[2]] as DungeonObjectRecord['position'],
        cell: [...input.cell] as GridCell,
        cellKey: input.cellKey,
        supportCellKey: getCellKey(input.cell),
      },
    }
    const occupancy = { ...state.occupancy }

    if (consumesOccupancy) {
      if (occupancy[object.cellKey] === id) {
        delete occupancy[object.cellKey]
      }
      occupancy[input.cellKey] = id
    }
    updateDescendantWorldTransforms(placedObjects, id)

    const historyEntry = buildObjectHistoryEntry({
      beforePlacedObjects: state.placedObjects,
      afterPlacedObjects: placedObjects,
      beforeOccupancy: state.occupancy,
      afterOccupancy: occupancy,
      changedObjectIds,
      selectionBefore: state.selection,
      selectionAfter: id,
    })
    queueFloorDirtyHint({
      domains: ['props', 'lighting', 'occupancy'],
      cells: [object.cell, input.cell],
      objectIds: changedObjectIds,
    })

    set((current) => ({
      ...current,
      placedObjects,
      occupancy,
      selection: id,
      history: [...current.history, historyEntry],
      future: [],
    }))

    return true
  },
  repositionObject: (id, input) => {
    const state = get()
    const object = state.placedObjects[id]

    if (!object) {
      return false
    }

    const movingIds = collectDescendantIds(state.placedObjects, id)
    const nextParentObjectId = input.parentObjectId ?? null
    if (nextParentObjectId) {
      if (!state.placedObjects[nextParentObjectId] || movingIds.has(nextParentObjectId)) {
        return false
      }
    }

    const nextProps = input.props ? { ...input.props } : object.props
    const supportCellKey = input.supportCellKey ?? getCellKey(input.cell)
    if (state.mapMode !== 'outdoor' && !state.paintedCells[supportCellKey]) {
      return false
    }
    if (
      state.mapMode === 'outdoor' &&
      !nextParentObjectId &&
      object.type !== 'player' &&
      state.blockedCells[getCellKey(input.cell)]
    ) {
      return false
    }

    const previousConsumesOccupancy = objectConsumesOccupancy(object.assetId, object.props.connector)
    const consumesOccupancy = objectConsumesOccupancy(object.assetId, nextProps.connector)
    const occupantId = consumesOccupancy ? state.occupancy[input.cellKey] : null
    if (occupantId && occupantId !== id && movingIds.has(occupantId)) {
      return false
    }

    const groundedOutdoorObject =
      state.mapMode === 'outdoor' &&
      !nextParentObjectId &&
      (object.type === 'player' || nextProps.connector === 'FLOOR' || nextProps.connector === 'FREE')
    const nextPositionY = groundedOutdoorObject
      ? getOutdoorTerrainCellHeight(state.outdoorTerrainHeights, input.cell)
      : input.position[1]

    const unchanged =
      object.cellKey === input.cellKey &&
      object.cell[0] === input.cell[0] &&
      object.cell[1] === input.cell[1] &&
      object.position[0] === input.position[0] &&
      object.position[1] === nextPositionY &&
      object.position[2] === input.position[2] &&
      object.rotation[0] === input.rotation[0] &&
      object.rotation[1] === input.rotation[1] &&
      object.rotation[2] === input.rotation[2] &&
      JSON.stringify(object.props) === JSON.stringify(nextProps) &&
      (object.parentObjectId ?? null) === nextParentObjectId &&
      (object.supportCellKey ?? getCellKey(object.cell)) === supportCellKey &&
      JSON.stringify(object.localPosition ?? null) === JSON.stringify(input.localPosition ?? null) &&
      JSON.stringify(object.localRotation ?? null) === JSON.stringify(input.localRotation ?? null)

    if (unchanged) {
      return true
    }

    const placedObjects = { ...state.placedObjects }
    const occupancy = { ...state.occupancy }
    const changedObjectIds = new Set<string>(movingIds)
    const occupant = occupantId ? state.placedObjects[occupantId] : null
    const ignoresOccupant =
      state.mapMode === 'outdoor' &&
      object.type === 'player' &&
      occupant !== null &&
      isSurroundingGeneratedObject(occupant)

    if (occupantId && occupantId !== id && !ignoresOccupant) {
      collectDescendantIds(state.placedObjects, occupantId).forEach((objectId) => {
        changedObjectIds.add(objectId)
      })
      removeObjectHierarchy({ placedObjects, occupancy }, occupantId)
    }

    placedObjects[id] = {
      ...object,
      position: [input.position[0], nextPositionY, input.position[2]] as DungeonObjectRecord['position'],
      rotation: [...input.rotation] as DungeonObjectRecord['rotation'],
      props: nextProps,
      localPosition: input.localPosition
        ? [...input.localPosition] as DungeonObjectRecord['localPosition']
        : input.localPosition ?? null,
      localRotation: input.localRotation
        ? [...input.localRotation] as DungeonObjectRecord['localRotation']
        : input.localRotation ?? null,
      parentObjectId: nextParentObjectId,
      supportCellKey,
      cell: [...input.cell] as GridCell,
      cellKey: input.cellKey,
    }

    if (previousConsumesOccupancy && occupancy[object.cellKey] === id) {
      delete occupancy[object.cellKey]
    }
    if (consumesOccupancy) {
      occupancy[input.cellKey] = id
    }

    updateDescendantWorldTransforms(placedObjects, id)

    const historyEntry = buildObjectHistoryEntry({
      beforePlacedObjects: state.placedObjects,
      afterPlacedObjects: placedObjects,
      beforeOccupancy: state.occupancy,
      afterOccupancy: occupancy,
      changedObjectIds,
      selectionBefore: state.selection,
      selectionAfter: id,
    })
    queueFloorDirtyHint({
      domains: ['props', 'lighting', 'occupancy'],
      cells: [object.cell, input.cell],
      objectIds: changedObjectIds,
    })

    set((current) => ({
      ...current,
      placedObjects,
      occupancy,
      selection: id,
      isObjectDragActive:
        current.pickedUpObject?.objectId === id
          ? false
          : current.isObjectDragActive,
      objectRotationPreviewOverrides: Object.fromEntries(
        Object.entries(current.objectRotationPreviewOverrides).filter(([key]) => key !== id),
      ),
      pickedUpObject: current.pickedUpObject?.objectId === id ? null : current.pickedUpObject,
      objectMoveDragPointer:
        current.pickedUpObject?.objectId === id
          ? null
          : current.objectMoveDragPointer,
      history: [...current.history, historyEntry],
      future: [],
    }))

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

    const placedObjects = {
      ...state.placedObjects,
      [id]: {
        ...object,
        props: { ...props },
      },
    }
    const historyEntry = buildObjectHistoryEntry({
      beforePlacedObjects: state.placedObjects,
      afterPlacedObjects: placedObjects,
      beforeOccupancy: state.occupancy,
      afterOccupancy: state.occupancy,
      changedObjectIds: [id],
      selectionBefore: state.selection,
      selectionAfter: state.selection,
    })
    queueFloorDirtyHint({
      domains: ['props', 'lighting'],
      cells: [object.cell],
      objectIds: [id],
    })

    set((current) => ({
      ...current,
      placedObjects,
      objectScalePreviewOverrides: Object.fromEntries(
        Object.entries(current.objectScalePreviewOverrides).filter(([key]) => key !== id),
      ),
      objectRotationPreviewOverrides: Object.fromEntries(
        Object.entries(current.objectRotationPreviewOverrides).filter(([key]) => key !== id),
      ),
      objectLightPreviewOverrides: Object.fromEntries(
        Object.entries(current.objectLightPreviewOverrides).filter(([key]) => key !== id),
      ),
      history: [...current.history, historyEntry],
      future: [],
    }))

    return true
  },
  setObjectScalePreview: (id, scale) => {
    set((current) => {
      if (scale === null) {
        if (current.objectScalePreviewOverrides[id] === undefined) {
          return current
        }

        return {
          ...current,
          objectScalePreviewOverrides: Object.fromEntries(
            Object.entries(current.objectScalePreviewOverrides).filter(([key]) => key !== id),
          ),
        }
      }

      if (current.objectScalePreviewOverrides[id] === scale) {
        return current
      }

      return {
        ...current,
        objectScalePreviewOverrides: {
          ...current.objectScalePreviewOverrides,
          [id]: scale,
        },
      }
    })
  },
  setObjectRotationPreview: (id, rotation) => {
    set((current) => {
      if (rotation === null) {
        if (current.objectRotationPreviewOverrides[id] === undefined) {
          return current
        }

        return {
          ...current,
          objectRotationPreviewOverrides: Object.fromEntries(
            Object.entries(current.objectRotationPreviewOverrides).filter(([key]) => key !== id),
          ),
        }
      }

      const existing = current.objectRotationPreviewOverrides[id]
      if (
        existing &&
        existing[0] === rotation[0] &&
        existing[1] === rotation[1] &&
        existing[2] === rotation[2]
      ) {
        return current
      }

      return {
        ...current,
        objectRotationPreviewOverrides: {
          ...current.objectRotationPreviewOverrides,
          [id]: [...rotation] as DungeonObjectRecord['rotation'],
        },
      }
    })
  },
  setObjectLightPreview: (id, overrides) => {
    set((current) => {
      if (overrides === null) {
        if (!current.objectLightPreviewOverrides[id]) {
          return current
        }

        return {
          ...current,
          objectLightPreviewOverrides: Object.fromEntries(
            Object.entries(current.objectLightPreviewOverrides).filter(([key]) => key !== id),
          ),
        }
      }

      return {
        ...current,
        objectLightPreviewOverrides: {
          ...current.objectLightPreviewOverrides,
          [id]: overrides,
        },
      }
    })
  },
  pickUpObject: (id) => {
    const state = get()
    const object = state.placedObjects[id]
    if (!object?.assetId) {
      return false
    }

    const nextPickedUpObject: PickedUpObjectState = {
      objectId: id,
      type: object.type,
      assetId: object.assetId,
      props: { ...object.props },
      floorRotationIndex: getFloorRotationIndexFromRotation(object.rotation[1]),
    }

    set((current) => ({
      ...current,
      pickedUpObject: nextPickedUpObject,
      objectMoveDragPointer: null,
      objectScalePreviewOverrides: Object.fromEntries(
        Object.entries(current.objectScalePreviewOverrides).filter(([key]) => key !== id),
      ),
      objectRotationPreviewOverrides: Object.fromEntries(
        Object.entries(current.objectRotationPreviewOverrides).filter(([key]) => key !== id),
      ),
    }))

    return true
  },
  cancelPickedUpObject: () => {
    set((current) => (
      current.pickedUpObject === null
        ? current
        : {
            ...current,
            isObjectDragActive: false,
            pickedUpObject: null,
            objectMoveDragPointer: null,
          }
    ))
  },
  setObjectMoveDragPointer: (pointer) => {
    set((current) => {
      if (
        current.objectMoveDragPointer?.clientX === pointer?.clientX &&
        current.objectMoveDragPointer?.clientY === pointer?.clientY
      ) {
        return current
      }

      return {
        ...current,
        objectMoveDragPointer: pointer
          ? { clientX: pointer.clientX, clientY: pointer.clientY }
          : null,
      }
    })
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
    if (!state.placedObjects[id]) {
      return
    }
    const removedRootObject = state.placedObjects[id]
    const placedObjects = { ...state.placedObjects }
    const occupancy = { ...state.occupancy }
    const removedIds = removeObjectHierarchy({ placedObjects, occupancy }, id)
    const nextSelection = state.selection && removedIds.has(state.selection) ? null : state.selection
    const historyEntry = buildObjectHistoryEntry({
      beforePlacedObjects: state.placedObjects,
      afterPlacedObjects: placedObjects,
      beforeOccupancy: state.occupancy,
      afterOccupancy: occupancy,
      changedObjectIds: removedIds,
      selectionBefore: state.selection,
      selectionAfter: nextSelection,
    })
    queueFloorDirtyHint({
      domains: ['props', 'lighting', 'occupancy'],
      cells: removedRootObject ? [removedRootObject.cell] : undefined,
      objectIds: removedIds,
    })

    set((current) => ({
      ...current,
      placedObjects,
      occupancy,
      selection: nextSelection,
      isObjectDragActive:
        current.pickedUpObject && removedIds.has(current.pickedUpObject.objectId)
          ? false
          : current.isObjectDragActive,
      pickedUpObject:
        current.pickedUpObject && removedIds.has(current.pickedUpObject.objectId)
          ? null
          : current.pickedUpObject,
      objectMoveDragPointer:
        current.pickedUpObject && removedIds.has(current.pickedUpObject.objectId)
          ? null
          : current.objectMoveDragPointer,
      objectScalePreviewOverrides: Object.fromEntries(
        Object.entries(current.objectScalePreviewOverrides).filter(([key]) => !removedIds.has(key)),
      ),
      objectRotationPreviewOverrides: Object.fromEntries(
        Object.entries(current.objectRotationPreviewOverrides).filter(([key]) => !removedIds.has(key)),
      ),
      history: [...current.history, historyEntry],
      future: [],
    }))
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
      const previousSnapshot = cloneSnapshotForObjectPlacement(state)
      queueFloorDirtyHint({
        domains: ['props', 'lighting'],
        cells: [selectedObject.cell],
        objectIds: [selection],
      })

      set((current) => {
        const currentSelection = current.placedObjects[selection]
        if (!currentSelection) {
          return current
        }

        const placedObjects = {
          ...current.placedObjects,
          [selection]: {
            ...currentSelection,
            rotation: [
              currentSelection.rotation[0],
              currentSelection.rotation[1] + rotationStep,
              currentSelection.rotation[2],
            ] as DungeonObjectRecord['rotation'],
            localRotation: currentSelection.localRotation
              ? [
                  currentSelection.localRotation[0],
                  currentSelection.localRotation[1] + rotationStep,
                  currentSelection.localRotation[2],
                ] as DungeonObjectRecord['localRotation']
              : currentSelection.localRotation ?? null,
          },
        }

        updateDescendantWorldTransforms(placedObjects, selection)

        return {
          ...current,
          placedObjects,
          history: [...current.history, previousSnapshot],
          future: [],
        }
      })
      return
    }

    const selectedOpening = state.wallOpenings[selection]
    if (!selectedOpening || !selectedOpening.assetId) {
      return
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['openings', 'walls', 'renderPlan'],
      wallKeys: [selectedOpening.wallKey],
    })
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
  ...createDungeonStoreEditorUiActions({
    set,
    get,
    cloneSnapshot,
  }),
  setInnerWallSegments: (wallKeys, present) => {
    const state = get()
    const nextWallKeys = [...new Set(
      wallKeys
        .map((wallKey) => getCanonicalInnerWallKey(wallKey, state.paintedCells))
        .filter((wallKey): wallKey is string => Boolean(wallKey)),
    )]

    if (nextWallKeys.length === 0) {
      return 0
    }

    const changedWallKeys = nextWallKeys.filter((wallKey) =>
      present ? !state.innerWalls[wallKey] : Boolean(state.innerWalls[wallKey]),
    )

    if (changedWallKeys.length === 0) {
      return 0
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['walls', 'lighting', 'renderPlan'],
      wallKeys: changedWallKeys,
    })

    set((current) => {
      const innerWalls = { ...current.innerWalls }

      changedWallKeys.forEach((wallKey) => {
        if (present) {
          innerWalls[wallKey] = {
            wallKey,
            layerId: current.activeLayerId,
          }
          return
        }

        delete innerWalls[wallKey]
      })

      return {
        ...current,
        innerWalls,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return changedWallKeys.length
  },
  setFloorTileAsset: (cellKey, assetId) => {
    const state = get()
    const cellRecord = state.paintedCells[cellKey]
    if (!cellRecord) {
      return false
    }

    const inheritedAssetId = getInheritedFloorAssetIdForCellKey(
      cellKey,
      state.paintedCells,
      state.rooms,
      state.selectedAssetIds.floor,
    )
    const nextAssetId = assetId && assetId !== inheritedAssetId ? assetId : null
    const owningAnchorKey = findFloorSurfaceAnchorAtCell(cellKey, state.paintedCells, state.floorTileAssetIds)

    if (!nextAssetId) {
      if (!owningAnchorKey) {
        return false
      }

      const previousSnapshot = cloneSnapshot(state)
      queueFloorDirtyHint({
        domains: ['tiles', 'renderPlan'],
        cells: [owningAnchorKey],
      })
      set((current) => {
        const floorTileAssetIds = { ...current.floorTileAssetIds }
        delete floorTileAssetIds[owningAnchorKey]

        return {
          ...current,
          floorTileAssetIds,
          history: [...current.history, previousSnapshot],
          future: [],
        }
      })
      return true
    }

    if (!isFloorSurfacePlacementValid(cellKey, nextAssetId, state.paintedCells)) {
      return false
    }

    const overlappingAnchorKeys = collectOverlappingFloorSurfaceAnchors(
      cellKey,
      nextAssetId,
      state.paintedCells,
      state.floorTileAssetIds,
    )
    const isNoOp =
      overlappingAnchorKeys.length === 1
      && overlappingAnchorKeys[0] === cellKey
      && state.floorTileAssetIds[cellKey] === nextAssetId

    if (isNoOp) {
      return false
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['tiles', 'renderPlan'],
      cells: [cellKey, ...overlappingAnchorKeys],
    })
    set((current) => {
      const floorTileAssetIds = { ...current.floorTileAssetIds }
      overlappingAnchorKeys.forEach((anchorKey) => {
        delete floorTileAssetIds[anchorKey]
      })
      floorTileAssetIds[cellKey] = nextAssetId

      return {
        ...current,
        floorTileAssetIds,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return true
  },
  setWallSurfaceAsset: (wallKey, assetId) => {
    const state = get()
    const canonicalWallKey = getCanonicalWallKey(wallKey, state.paintedCells)
    if (!canonicalWallKey) {
      return false
    }

    const inheritedAssetId = getInheritedWallAssetIdForWallKey(
      canonicalWallKey,
      state.paintedCells,
      state.rooms,
      state.selectedAssetIds.wall,
    )
    const nextAssetId = assetId && assetId !== inheritedAssetId ? assetId : null
    const currentAssetId = state.wallSurfaceAssetIds[canonicalWallKey] ?? null
    if (currentAssetId === nextAssetId) {
      return false
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['walls', 'lighting', 'renderPlan'],
      wallKeys: [canonicalWallKey],
    })
    set((current) => {
      const wallSurfaceAssetIds = { ...current.wallSurfaceAssetIds }
      const wallSurfaceProps = { ...current.wallSurfaceProps }
      if (nextAssetId) {
        wallSurfaceAssetIds[canonicalWallKey] = nextAssetId
      } else {
        delete wallSurfaceAssetIds[canonicalWallKey]
      }
      if (currentAssetId !== nextAssetId) {
        delete wallSurfaceProps[canonicalWallKey]
      }

      return {
        ...current,
        wallSurfaceAssetIds,
        wallSurfaceProps,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return true
  },
  setWallSurfaceProps: (wallKey, props) => {
    const state = get()
    const canonicalWallKey = getCanonicalWallKey(wallKey, state.paintedCells)
    if (!canonicalWallKey) {
      return false
    }

    const currentProps = state.wallSurfaceProps[canonicalWallKey] ?? {}
    if (JSON.stringify(currentProps) === JSON.stringify(props)) {
      return true
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['walls', 'openings', 'lighting', 'renderPlan'],
      wallKeys: [canonicalWallKey],
    })
    set((current) => {
      if (!getCanonicalWallKey(canonicalWallKey, current.paintedCells)) {
        return current
      }

      return {
        ...current,
        wallSurfaceProps: {
          ...current.wallSurfaceProps,
          [canonicalWallKey]: { ...props },
        },
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return true
  },
  ...createDungeonStoreViewActions({
    set,
    getOutdoorTerrainProfile,
  }),
  ...createDungeonStoreGeneratedCharacterActions({
    set,
    get,
    isGeneratedCharacterInUse,
  }),
  ...createDungeonStoreLayerActions({
    set,
    cloneSnapshot,
    defaultLayerId: DEFAULT_LAYER_ID,
    createObjectId,
  }),
  undo: () => {
    const state = get()
    const previous = state.history.at(-1)

    if (!previous) {
      return
    }

    if (isObjectHistoryEntry(previous)) {
      set((current) => ({
        ...current,
        ...applyObjectHistoryPatch(current, previous.before),
        history: current.history.slice(0, -1),
        future: [...current.future, previous],
      }))
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

    if (isObjectHistoryEntry(next)) {
      set((current) => ({
        ...current,
        ...applyObjectHistoryPatch(current, next.after),
        history: [...current.history, next],
        future: current.future.slice(0, -1),
      }))
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
      queueFloorDirtyHint({
        domains: ALL_FLOOR_DIRTY_DOMAINS,
        fullRefresh: true,
      })
      set((state) => ({
        ...state,
        ...createEmptySnapshot(),
        mapMode: 'indoor',
        outdoorTimeOfDay: 0.5,
        outdoorTerrainType: 'mixed',
        outdoorTerrainProfiles: normalizeOutdoorTerrainProfiles(undefined),
        outdoorTerrainDensity: DEFAULT_OUTDOOR_TERRAIN_PROFILES.mixed.density,
        outdoorOverpaintRegenerate: DEFAULT_OUTDOOR_TERRAIN_PROFILES.mixed.overpaintRegenerate,
        defaultOutdoorTerrainStyle: DEFAULT_OUTDOOR_TERRAIN_STYLE,
        outdoorBrushMode: 'surroundings',
        outdoorTerrainSculptMode: 'raise',
        outdoorTerrainSculptStep: DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
        outdoorTerrainSculptRadius: DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS,
        outdoorTerrainStyleBrush: DEFAULT_OUTDOOR_TERRAIN_STYLE,
        isPaintingStrokeActive: false,
        isObjectDragActive: false,
        selectedRoomId: null,
        roomEditMode: 'rooms',
        surfaceBrushAssetIds: {
          floor: getDefaultAssetIdByCategory('floor'),
          wall: getDefaultAssetIdByCategory('wall'),
        },
        floorViewMode: 'active',
        tool: 'select',
        characterSheet: { open: false, assetId: null },
        assetBrowser: createDefaultAssetBrowserState(),
        activeCameraMode: 'perspective',
        cameraPreset: null,
        objectLightPreviewOverrides: {},
        objectScalePreviewOverrides: {},
        objectRotationPreviewOverrides: {},
        pickedUpObject: null,
        objectMoveDragPointer: null,
        lightEffectsEnabled: true,
        lightFlickerEnabled: true,
        particleEffectsEnabled: true,
        history: [],
      future: [],
    }))
  },

  newDungeon: (mode = 'indoor') => {
    const INITIAL_ID = 'floor-1'
    const fresh = createEmptySnapshot()
    queueFloorDirtyHint({
      floorId: INITIAL_ID,
      domains: ALL_FLOOR_DIRTY_DOMAINS,
      fullRefresh: true,
    })
    set({
      // Snapshot (rooms, cells, objects, etc.)
         ...fresh,
         mapMode: mode,
         outdoorTimeOfDay: 0.5,
         outdoorTerrainType: 'mixed',
         outdoorTerrainProfiles: normalizeOutdoorTerrainProfiles(undefined),
         outdoorTerrainDensity: DEFAULT_OUTDOOR_TERRAIN_PROFILES.mixed.density,
         outdoorOverpaintRegenerate: DEFAULT_OUTDOOR_TERRAIN_PROFILES.mixed.overpaintRegenerate,
         defaultOutdoorTerrainStyle: DEFAULT_OUTDOOR_TERRAIN_STYLE,
         outdoorBrushMode: 'surroundings',
         outdoorTerrainSculptMode: 'raise',
         outdoorTerrainSculptStep: DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
         outdoorTerrainSculptRadius: DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS,
         outdoorTerrainStyleBrush: DEFAULT_OUTDOOR_TERRAIN_STYLE,
         // UI / tool state
         isPaintingStrokeActive: false,
         isObjectDragActive: false,
         selectedRoomId: null,
        roomEditMode: 'rooms',
         surfaceBrushAssetIds: {
           floor: getDefaultAssetIdByCategory('floor'),
           wall: getDefaultAssetIdByCategory('wall'),
         },
         cameraMode: 'orbit',
         tool: 'room',
       floorViewMode: 'active',
      characterSheet: { open: false, assetId: null },
      assetBrowser: createDefaultAssetBrowserState(),
       activeCameraMode: 'perspective',
       cameraPreset: 'perspective', // triggers camera to home position
        objectLightPreviewOverrides: {},
        objectScalePreviewOverrides: {},
        objectRotationPreviewOverrides: {},
        pickedUpObject: null,
        objectMoveDragPointer: null,
         // Settings reset to defaults
        sceneLighting: { intensity: 1 },
         postProcessing: { ...DEFAULT_POST_PROCESSING_SETTINGS },
        showGrid: true,
        showLosDebugMask: false,
        showLosDebugRays: false,
        showLensFocusDebugPoint: false,
        showChunkDebugOverlay: false,
        showProjectionDebugMesh: false,
        showPropProbeDebug: false,
        slowBuildAnimationDebug: false,
        buildPerformanceTracingEnabled: false,
        lightEffectsEnabled: true,
        lightFlickerEnabled: true,
        particleEffectsEnabled: true,
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

      const { placedObjects, occupancy, selection, wallOpenings, innerWalls } =
        pruneInvalidConnectedProps(
          current,
          paintedCells,
          removedCells,
        )
      const { floorTileAssetIds, wallSurfaceAssetIds, wallSurfaceProps } = pruneInvalidSurfaceOverrides(
        current,
        paintedCells,
        removedCells,
      )

      return {
        ...current,
        rooms,
        paintedCells,
        floorTileAssetIds,
        wallSurfaceAssetIds,
        wallSurfaceProps,
        placedObjects,
        wallOpenings,
        innerWalls,
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
    queueFloorDirtyHint({
      domains: ['tiles', 'walls', 'openings', 'props', 'lighting', 'renderPlan', 'occupancy'],
      cells: cellKeys,
    })
    set((current) => {
      const previousSnapshot = cloneSnapshot(current)
      const paintedCells = { ...current.paintedCells }
      cellKeys.forEach((key) => {
        if (paintedCells[key]) paintedCells[key] = { ...paintedCells[key], roomId }
      })
      const changedCells = cellKeys
        .map((key) => paintedCells[key]?.cell ?? current.paintedCells[key]?.cell)
        .filter((cell): cell is GridCell => Boolean(cell))
      const {
        placedObjects,
        occupancy,
        selection,
        wallOpenings,
        innerWalls,
      } = pruneInvalidConnectedProps(current, paintedCells, changedCells)
      const { floorTileAssetIds, wallSurfaceAssetIds, wallSurfaceProps } = pruneInvalidSurfaceOverrides(
        current,
        paintedCells,
        changedCells,
      )
      return {
        ...current,
        paintedCells,
        floorTileAssetIds,
        wallSurfaceAssetIds,
        wallSurfaceProps,
        placedObjects,
        occupancy,
        selection,
        wallOpenings,
        innerWalls,
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
    queueFloorDirtyHint({
      domains: ['tiles', 'walls', 'openings', 'props', 'lighting', 'renderPlan', 'occupancy'],
      fullRefresh: true,
    })

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

      const { placedObjects, occupancy, selection, wallOpenings, innerWalls } =
        pruneInvalidConnectedProps(
          { ...current, wallOpenings: remappedWallOpenings },
          paintedCells,
          changedCells,
        )
      const { floorTileAssetIds, wallSurfaceAssetIds, wallSurfaceProps } = pruneInvalidSurfaceOverrides(
        current,
        paintedCells,
        changedCells,
      )

      return {
        ...current,
        paintedCells,
        floorTileAssetIds,
        wallSurfaceAssetIds,
        wallSurfaceProps,
        placedObjects,
        wallOpenings,
        innerWalls,
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
    queueFloorDirtyHint({
      domains: ['tiles', 'walls', 'openings', 'props', 'lighting', 'renderPlan', 'occupancy'],
      fullRefresh: true,
    })

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

      const { placedObjects, occupancy, selection, wallOpenings, innerWalls } =
        pruneInvalidConnectedProps(current, paintedCells, changedCells)
      const { floorTileAssetIds, wallSurfaceAssetIds, wallSurfaceProps } = pruneInvalidSurfaceOverrides(
        current,
        paintedCells,
        changedCells,
      )

      return {
        ...current,
        paintedCells,
        floorTileAssetIds,
        wallSurfaceAssetIds,
        wallSurfaceProps,
        placedObjects,
        wallOpenings,
        innerWalls,
        occupancy,
        selection,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })

    return true
  },
  setRoomFloorAsset: (roomId, assetId) => {
    queueFloorDirtyHint({
      domains: ['tiles', 'renderPlan'],
      fullRefresh: true,
    })
    set((current) => ({
      ...current,
      rooms: { ...current.rooms, [roomId]: { ...current.rooms[roomId], floorAssetId: assetId } },
    }))
  },
  setRoomWallAsset: (roomId, assetId) => {
    queueFloorDirtyHint({
      domains: ['walls', 'renderPlan'],
      fullRefresh: true,
    })
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
      (obj) => getStairDirectionForAssetId(obj.assetId) === 'down',
    )
    const staircaseUp = Object.values(state.placedObjects).find(
      (obj) => getStairDirectionForAssetId(obj.assetId) === 'up',
    )
    const staircaseOnCurrentFloor = staircaseDown ?? staircaseUp

    // Build an initial snapshot for the new floor
    const newSnapshot = createEmptySnapshot()

    if (staircaseOnCurrentFloor) {
      // Place opposing staircase on new floor at same grid cell
      const opposingAssetId = getPairedStairAssetId(staircaseOnCurrentFloor.assetId)
      if (opposingAssetId) {
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
    }

    const newFloor: FloorRecord = {
      id,
      name: floorName,
      level: newLevel,
      snapshot: cloneSnapshot(newSnapshot),
      history: [],
      future: [],
    }

    queueFloorDirtyHint({
      floorId: id,
      domains: ALL_FLOOR_DIRTY_DOMAINS,
      fullRefresh: true,
    })
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
      queueFloorDirtyHint({
        floorId: targetId,
        domains: ALL_FLOOR_DIRTY_DOMAINS,
        fullRefresh: true,
      })

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
    queueFloorDirtyHint({
      floorId: id,
      domains: ALL_FLOOR_DIRTY_DOMAINS,
      fullRefresh: true,
    })

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
        queueFloorDirtyHint({
          domains: ['props', 'lighting', 'occupancy'],
          cells: [cell],
          objectIds: [staircaseId],
        })
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
    queueFloorDirtyHint({
      domains: ['openings', 'walls', 'lighting', 'renderPlan'],
      wallKeys: [input.wallKey],
    })
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
    queueFloorDirtyHint({
      domains: ['openings', 'walls', 'lighting', 'renderPlan'],
      wallKeys,
    })

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
  restoreOpenPassages: (wallKeys) => {
    if (wallKeys.length === 0) {
      return 0
    }
    queueFloorDirtyHint({
      domains: ['openings', 'walls', 'lighting', 'renderPlan'],
      wallKeys,
    })

    let removedCount = 0
    set((current) => {
      const openingIds = collectOpenPassageIdsForWallKeys(current.wallOpenings, wallKeys)
      if (openingIds.length === 0) {
        return current
      }

      const previousSnapshot = cloneSnapshot(current)
      const wallOpenings = { ...current.wallOpenings }
      openingIds.forEach((openingId) => {
        delete wallOpenings[openingId]
      })
      removedCount = openingIds.length

      return {
        ...current,
        wallOpenings,
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return removedCount
  },
  setOpeningAsset: (id, assetId) => {
    const state = get()
    const opening = state.wallOpenings[id]
    if (!opening) {
      return false
    }

    if ((opening.assetId ?? null) === assetId) {
      return true
    }

    const previousSnapshot = cloneSnapshot(state)
    queueFloorDirtyHint({
      domains: ['openings', 'renderPlan'],
      wallKeys: [opening.wallKey],
    })
    set((current) => {
      const currentOpening = current.wallOpenings[id]
      if (!currentOpening) {
        return current
      }

      return {
        ...current,
        wallOpenings: {
          ...current.wallOpenings,
          [id]: {
            ...currentOpening,
            assetId,
          },
        },
        history: [...current.history, previousSnapshot],
        future: [],
      }
    })
    return true
  },
  removeOpening: (id) => {
    const opening = get().wallOpenings[id]
    if (opening) {
      queueFloorDirtyHint({
        domains: ['openings', 'walls', 'lighting', 'renderPlan'],
        wallKeys: [opening.wallKey],
      })
    }
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
  exportDungeonJson: () => {
    const state = get()
    return serializeCurrentDungeonState(state)
  },
  downloadDungeon: () => {
    const state = get()
    const json = serializeCurrentDungeonState(state)
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
    const terrainType = parsed.outdoorTerrainType ?? 'mixed'
    const terrainProfiles = normalizeOutdoorTerrainProfiles(parsed.outdoorTerrainProfiles)
    const terrainProfile = getOutdoorTerrainProfile(terrainType, terrainProfiles)
      queueFloorDirtyHint({
        floorId: activeFloorId,
        domains: ALL_FLOOR_DIRTY_DOMAINS,
        fullRefresh: true,
      })
      set((current) => ({
        ...current,
        ...parsed,
        mapMode: parsed.mapMode ?? 'indoor',
        outdoorTimeOfDay: parsed.outdoorTimeOfDay ?? 0.5,
        outdoorTerrainType: terrainType,
        outdoorTerrainProfiles: terrainProfiles,
        outdoorTerrainDensity: parsed.outdoorTerrainDensity ?? terrainProfile.density,
        outdoorOverpaintRegenerate: parsed.outdoorOverpaintRegenerate ?? terrainProfile.overpaintRegenerate,
        defaultOutdoorTerrainStyle: parsed.defaultOutdoorTerrainStyle ?? DEFAULT_OUTDOOR_TERRAIN_STYLE,
        outdoorBrushMode: parsed.mapMode === 'outdoor' ? 'surroundings' : current.outdoorBrushMode,
        outdoorTerrainSculptMode: 'raise',
        outdoorTerrainSculptStep: DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
        outdoorTerrainSculptRadius: DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS,
        outdoorTerrainStyleBrush: parsed.defaultOutdoorTerrainStyle ?? DEFAULT_OUTDOOR_TERRAIN_STYLE,
        dungeonName: parsed.name ?? current.dungeonName,
        generatedCharacters: normalizeGeneratedCharacters(current.generatedCharacters),
        characterSheet: { open: false, assetId: null },
        assetBrowser: createDefaultAssetBrowserState(),
         isPaintingStrokeActive: false,
         isObjectDragActive: false,
         selectedRoomId: null,
        roomEditMode: 'rooms',
        surfaceBrushAssetIds: {
          floor: getDefaultAssetIdByCategory('floor'),
          wall: getDefaultAssetIdByCategory('wall'),
        },
        floorViewMode: 'active',
        activeCameraMode: 'perspective',
        cameraPreset: null,
        objectLightPreviewOverrides: {},
        objectScalePreviewOverrides: {},
        objectRotationPreviewOverrides: {},
        pickedUpObject: null,
        objectMoveDragPointer: null,
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
      storage: createJSONStorage(getPersistStorage),
      // Only persist the dungeon content + scene settings, not transient UI state
      partialize: (state) => ({
        dungeonName: state.dungeonName,
        paintedCells: state.paintedCells,
        blockedCells: state.blockedCells,
        outdoorTerrainHeights: state.outdoorTerrainHeights,
        outdoorTerrainStyleCells: state.outdoorTerrainStyleCells,
        exploredCells: state.exploredCells,
        floorTileAssetIds: state.floorTileAssetIds,
        wallSurfaceAssetIds: state.wallSurfaceAssetIds,
        placedObjects: state.placedObjects,
        wallOpenings: state.wallOpenings,
        innerWalls: state.innerWalls,
        occupancy: state.occupancy,
        layers: state.layers,
        layerOrder: state.layerOrder,
        activeLayerId: state.activeLayerId,
        rooms: state.rooms,
        nextRoomNumber: state.nextRoomNumber,
        sceneLighting: state.sceneLighting,
        postProcessing: state.postProcessing,
        mapMode: state.mapMode,
        outdoorTimeOfDay: state.outdoorTimeOfDay,
        outdoorTerrainProfiles: state.outdoorTerrainProfiles,
        outdoorTerrainDensity: state.outdoorTerrainDensity,
        outdoorTerrainType: state.outdoorTerrainType,
        outdoorOverpaintRegenerate: state.outdoorOverpaintRegenerate,
        defaultOutdoorTerrainStyle: state.defaultOutdoorTerrainStyle,
        outdoorBrushMode: state.outdoorBrushMode,
        outdoorTerrainSculptMode: state.outdoorTerrainSculptMode,
        outdoorTerrainSculptStep: state.outdoorTerrainSculptStep,
        outdoorTerrainSculptRadius: state.outdoorTerrainSculptRadius,
        outdoorTerrainStyleBrush: state.outdoorTerrainStyleBrush,
        selectedAssetIds: state.selectedAssetIds,
        generatedCharacters: state.generatedCharacters,
        lightEffectsEnabled: state.lightEffectsEnabled,
        lightFlickerEnabled: state.lightFlickerEnabled,
        floors: state.floors,
        floorOrder: state.floorOrder,
        activeFloorId: state.activeFloorId,
        fpsLimit: state.fpsLimit,
        particleEffectsEnabled: state.particleEffectsEnabled,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          syncGeneratedCharacterAssets({})
          return
        }

        Object.assign(state, sanitizePersistedAssetReferences(state))
        state.history = normalizeHistoryEntries(state.history)
        state.future = normalizeHistoryEntries(state.future)
        state.innerWalls = state.innerWalls ?? {}
        state.outdoorTerrainStyleCells = (state.outdoorTerrainStyleCells ?? {}) as OutdoorTerrainStyleCells
        state.defaultOutdoorTerrainStyle = state.defaultOutdoorTerrainStyle ?? DEFAULT_OUTDOOR_TERRAIN_STYLE
        state.outdoorTerrainStyleBrush = state.outdoorTerrainStyleBrush ?? state.defaultOutdoorTerrainStyle
        Object.values(state.floors ?? {}).forEach((floor) => {
          floor.snapshot.innerWalls = floor.snapshot.innerWalls ?? {}
          floor.snapshot.outdoorTerrainStyleCells = floor.snapshot.outdoorTerrainStyleCells ?? {}
          floor.history = normalizeHistoryEntries(floor.history)
          floor.future = normalizeHistoryEntries(floor.future)
        })
        state.outdoorTerrainHeights = (state.outdoorTerrainHeights ?? {}) as OutdoorTerrainHeightfield
        state.outdoorTerrainSculptMode = state.outdoorTerrainSculptMode ?? 'raise'
        state.outdoorTerrainSculptStep = state.outdoorTerrainSculptStep ?? DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP
        state.outdoorTerrainSculptRadius = state.outdoorTerrainSculptRadius ?? DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS
        if (state.tool === 'opening') {
          state.tool = 'prop'
        }
        state.assetBrowser = createDefaultAssetBrowserState()
        state.postProcessing = normalizePostProcessingSettings(
          state.postProcessing as Partial<PostProcessingSettings> | undefined,
        )
        state.lightEffectsEnabled = state.lightEffectsEnabled ?? true
        state.lightFlickerEnabled = state.lightFlickerEnabled ?? true
        state.particleEffectsEnabled = state.particleEffectsEnabled ?? true
        state.generatedCharacters = normalizeGeneratedCharacters(
          state.generatedCharacters as Record<string, Partial<GeneratedCharacterRecord>> | undefined,
        )
        state.floorDirtyDomains = syncFloorDirtyState(
          state.floorDirtyDomains,
          state.floorOrder ?? Object.keys(state.floors ?? {}),
        )
        syncGeneratedCharacterAssets(state.generatedCharacters)
      },
    },
  ),
)
