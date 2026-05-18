import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { ContentPackAsset, PropConnector } from '../../content-packs/types'
import { useRaycaster } from '../../hooks/useRaycaster'
import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
  getRectangleCells,
  snapWorldPointToGrid,
  useSnapToGrid,
  type GridCell,
  type SnappedGridPosition,
} from '../../hooks/useSnapToGrid'
import {
  useDungeonStore,
  type DungeonObjectRecord,
  type MapMode,
  type PaintedCellRecord,
  type Room,
  type WallConnectionMode,
} from '../../store/useDungeonStore'
import {
  createFloorSurfacePlacement,
  isFloorSurfacePlacementValid,
  resolveEffectiveFloorAssetIdForCellKey,
} from '../../store/floorSurfaceLayout'
import { getOpeningSegments } from '../../store/openingSegments'
import { sampleOutdoorTerrainHeight, type OutdoorTerrainHeightfield } from '../../store/outdoorTerrain'
import {
  buildSplineWallOpeningPlacement,
  findOpeningAtSplineHit,
  type SplineWallOpeningPlacement,
} from '../../store/openingPlacement'
import {
  createSplineWallQueryCache,
  findNearestSplineWallSegment,
  type SplineWallQueryCache,
} from '../../store/splineWallQueries'
import { hasSplineWallGraphPaths, type SplineWallGraph } from '../../store/splineWallGraph'
import { buildSplineWallGraphFromPaintedCells } from '../../store/splineWalls'
import { buildPaintedAreaRoomPreview, type FreehandPaintPoint } from '../../store/freehandRoomPaint'
import {
  getInheritedWallAssetIdForWallKey,
  isInterRoomBoundary,
  isWallBoundary,
  wallKeyToWorldPosition,
} from '../../store/wallSegments'
import {
  buildEligibleOpenPassageWalls,
  buildWallOpeningDerivedState,
} from '../../store/derived/wallOpeningDerived'
import {
  BUILD_ANIMATIONS_ENABLED,
  getBuildAnimationPlaybackDurationMs,
  hasHeldBuildAnimations,
  releaseHeldBuildAnimations,
  triggerBuild,
  useBuildAnimationVersion,
} from '../../store/buildAnimations'
import { traceBuildPerf } from '../../performance/runtimeBuildTrace'
import { FloorGridOverlay } from './FloorGridOverlay'
import { DEFAULT_RENDER_BATCH_CHUNK_SIZE, getRenderBatchChunkKeyForCell } from './batchDescriptors'
import { BatchedTileEntries } from './BatchedTileEntries'
import { ContentPackInstance } from './ContentPackInstance'
import { getRoomPreviewCells } from './gridPreview'
import { isPassiveGridMode, shouldRenderGridOverlay } from './gridMode'
import { getEligibleOpenPassageWallKey } from './openPassageInteraction'
import { extendOpenPassageBrush } from './openPassageBrush'
import { getOpeningToolMode } from './openingToolMode'
import { calculatePropSnapPosition } from './propPlacement'
import {
  shouldUpdateGridHoverInteractionState,
  shouldUpdateGridStrokeState,
  shouldUpdateOpenPassageBrushState,
} from './gridFastState'
import { supportsPlacementRotationShortcut } from '../../rotationShortcuts'
import { getObjectInstanceScale, getObjectTintColor } from '../../store/objectAppearance'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import {
  ACTIVE_FLOOR_RENDER_DOMAINS,
  useActiveFloorSnapshot,
} from '../../store/useActiveFloorSnapshot'
import {
  useTileGpuStream,
  useTileGpuStreamVersion,
} from './TileGpuStreamHooks'
import { getTileGpuStreamMountId } from './TileGpuStreamContextShared'
import {
  shouldBlockRoomStrokeStart,
  shouldClearRoomDraftForFloorChange,
  shouldRenderRoomStreamPreview,
} from './GridShared'
import {
  buildRemovedRoomTileEntries,
  buildSpeculativeRoomTileEntries,
  expandRoomMutationCells,
  type RoomAnimationStateInput,
} from './roomMutationAnimations'
import { useRemovalAnimationBatches } from './useRemovalAnimationBatches'
import { WALL_EXTRA_DELAY_MS } from './DungeonRoomShared'
import { RoomDraftOverlay } from './RoomDraftOverlay'
import {
  createRoomDraftFromStroke,
  type RoomDraftState,
} from '../../store/roomDraft'
import {
  buildRoomDraftOccupancyPolygons,
  clipRoomDraft,
} from '../../store/roomDraftClip'
import { buildPreviewRoomFloorMaskData, filterCellsToRoomFloorMask } from './roomFloorMask'
import {
  buildRoomFloorMaskRuntime,
  disposeRoomFloorMaskRuntime,
} from './roomFloorMaskRuntime'

type GridProps = {
  size?: number
  playMode?: boolean
  bakedLightField?: BakedFloorLightField | null
}

const POINTER_MOVE_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const HELD_ROOM_PREWARM_TIMEOUT_MS = 2000

export function Grid({ size = 120, playMode = false, bakedLightField = null }: GridProps) {
  const { snap } = useSnapToGrid()
  const raycaster = useRaycaster(0)
  const { gl, camera, scene, invalidate } = useThree()
  const surfaceRaycasterRef = useRef(new THREE.Raycaster())
  const surfacePointerRef = useRef(new THREE.Vector2())
  const {
    activeFloorId,
    paintedCells,
    blockedCells,
    outdoorTerrainStyleCells,
        outdoorTerrainHeights,
        placedObjects,
        wallOpenings,
        splineWallGraph,
        innerWalls,
        rooms,
        floorTileAssetIds,
    wallSurfaceAssetIds,
    wallSurfaceProps,
    globalWallAssetId,
    globalFloorAssetId,
  } = useActiveFloorSnapshot(ACTIVE_FLOOR_RENDER_DOMAINS, (state) => ({
    activeFloorId: state.activeFloorId,
    paintedCells: state.paintedCells,
    blockedCells: state.blockedCells,
    outdoorTerrainStyleCells: state.outdoorTerrainStyleCells,
    outdoorTerrainHeights: state.outdoorTerrainHeights,
      placedObjects: state.placedObjects,
      wallOpenings: state.wallOpenings,
      splineWallGraph: state.splineWallGraph,
      innerWalls: state.innerWalls,
      rooms: state.rooms,
    floorTileAssetIds: state.floorTileAssetIds,
    wallSurfaceAssetIds: state.wallSurfaceAssetIds,
    wallSurfaceProps: state.wallSurfaceProps,
    globalWallAssetId: state.selectedAssetIds.wall,
    globalFloorAssetId: state.selectedAssetIds.floor,
  }))
  const outdoorBrushMode = useDungeonStore((state) => state.outdoorBrushMode)
  const outdoorTerrainSculptMode = useDungeonStore((state) => state.outdoorTerrainSculptMode)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const paintCells = useDungeonStore((state) => state.paintCells)
  const commitDraftRoom = useDungeonStore((state) => state.commitDraftRoom)
  const eraseCells = useDungeonStore((state) => state.eraseCells)
  const paintBlockedCells = useDungeonStore((state) => state.paintBlockedCells)
  const eraseBlockedCells = useDungeonStore((state) => state.eraseBlockedCells)
  const sculptOutdoorTerrain = useDungeonStore((state) => state.sculptOutdoorTerrain)
  const paintOutdoorTerrainStyleCells = useDungeonStore((state) => state.paintOutdoorTerrainStyleCells)
  const eraseOutdoorTerrainStyleCells = useDungeonStore((state) => state.eraseOutdoorTerrainStyleCells)
  const setFloorTileAsset = useDungeonStore((state) => state.setFloorTileAsset)
  const placeObject = useDungeonStore((state) => state.placeObject)
  const repositionObject = useDungeonStore((state) => state.repositionObject)
  const removeObjectAtCell = useDungeonStore((state) => state.removeObjectAtCell)
  const removeObject = useDungeonStore((state) => state.removeObject)
  const cancelPickedUpObject = useDungeonStore((state) => state.cancelPickedUpObject)
  const placeOpening = useDungeonStore((state) => state.placeOpening)
  const placeOpenPassages = useDungeonStore((state) => state.placeOpenPassages)
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const roomPaintMode = useDungeonStore((state) => state.roomPaintMode)
  const activeRoomSetId = useDungeonStore((state) => state.activeRoomSetId)
  const assetBrowser = useDungeonStore((state) => state.assetBrowser)
  const outdoorOverpaintRegenerate = useDungeonStore((state) => state.outdoorOverpaintRegenerate)
  const activeLayerId = useDungeonStore((state) => state.activeLayerId)
  const surfaceBrushAssetIds = useDungeonStore((state) => state.surfaceBrushAssetIds)
  const setPaintingStrokeActive = useDungeonStore(
    (state) => state.setPaintingStrokeActive,
  )
  const setObjectDragActive = useDungeonStore((state) => state.setObjectDragActive)
  const setObjectMoveDragPointer = useDungeonStore((state) => state.setObjectMoveDragPointer)
  const isRoomResizeHandleActive = useDungeonStore((state) => state.isRoomResizeHandleActive)
  const selectRoom = useDungeonStore((state) => state.selectRoom)
  const tool = useDungeonStore((state) => state.tool)
  const showGrid = useDungeonStore((state) => state.showGrid)
  const showChunkDebugOverlay = useDungeonStore((state) => state.showChunkDebugOverlay)
  const isObjectDragActive = useDungeonStore((state) => state.isObjectDragActive)
  const pickedUpObject = useDungeonStore((state) => state.pickedUpObject)
  const objectMoveDragPointer = useDungeonStore((state) => state.objectMoveDragPointer)
  const selectedPropAssetId = useDungeonStore((state) => state.selectedAssetIds.prop)
  const selectedCharacterAssetId = useDungeonStore((state) => state.selectedAssetIds.player)
  const selectedOpeningAssetId = useDungeonStore((state) => state.selectedAssetIds.opening)
  const selectedFloorBrushAssetId = surfaceBrushAssetIds.floor
  const wallConnectionMode = useDungeonStore((state) => state.wallConnectionMode)
  const selectedPropAsset = selectedPropAssetId
    ? getContentPackAssetById(selectedPropAssetId)
    : null
  const selectedCharacterAsset = selectedCharacterAssetId
    ? getContentPackAssetById(selectedCharacterAssetId)
    : null
  const selectedOpeningAsset = selectedOpeningAssetId
    ? getContentPackAssetById(selectedOpeningAssetId)
    : null
  const pickedUpAssetId = pickedUpObject?.assetId ?? null
  const pickedUpAsset = pickedUpAssetId
    ? getContentPackAssetById(pickedUpAssetId)
    : null
  const isPickedUpPlacementMode = Boolean(pickedUpObject && pickedUpAsset)
  const openingToolMode = getOpeningToolMode(
    wallConnectionMode,
    selectedOpeningAsset?.metadata,
  )
  const isUnifiedOpeningMode = tool === 'prop' && assetBrowser.category === 'openings'
  const isUnifiedSurfaceMode = tool === 'prop' && assetBrowser.category === 'surfaces'
  const isUnifiedFloorVariantMode = isUnifiedSurfaceMode && assetBrowser.subcategory !== 'walls'
  const isFloorOpeningMode =
    (tool === 'opening' || isUnifiedOpeningMode) &&
    wallConnectionMode === 'door' &&
    openingToolMode === 'floor-asset'
  const isWallOpeningMode =
    (tool === 'opening' || isUnifiedOpeningMode) &&
    wallConnectionMode === 'door' &&
    openingToolMode === 'wall-connection'
  const openingPlacementGraph = useMemo(
    () => (hasSplineWallGraphPaths(splineWallGraph) ? splineWallGraph : buildSplineWallGraphFromPaintedCells(paintedCells)),
    [paintedCells, splineWallGraph],
  )
  const openingQueryCache = useMemo(
    () => createSplineWallQueryCache(openingPlacementGraph),
    [openingPlacementGraph],
  )
  const [hoveredCell, setHoveredCell] = useState<SnappedGridPosition | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const [hoveredRay, setHoveredRay] = useState<{
    origin: [number, number, number]
    direction: [number, number, number]
  } | null>(null)
  const [hoveredTerrainCell, setHoveredTerrainCell] = useState<GridCell | null>(null)
  const [hoveredSurfaceHit, setHoveredSurfaceHit] = useState<PlacementSurfaceHit | null>(null)
  const [strokeMode, setStrokeMode] = useState<'paint' | 'erase' | null>(null)
  const [strokeStartCell, setStrokeStartCell] = useState<GridCell | null>(null)
  const [strokeCurrentCell, setStrokeCurrentCell] = useState<GridCell | null>(null)
  const [latchedRoomPreview, setLatchedRoomPreview] = useState<{
    cells: GridCell[]
    mode: 'paint' | 'erase'
  } | null>(null)
  const [roomDraft, setRoomDraft] = useState<RoomDraftState | null>(null)
  const [hoveredOpenWallKey, setHoveredOpenWallKey] = useState<string | null>(null)
  const [openPassageBrushWallKeys, setOpenPassageBrushWallKeys] = useState<string[]>([])
  const [strokePaintedCells, setStrokePaintedCells] = useState<GridCell[]>([])
  const [freehandPaintPoints, setFreehandPaintPoints] = useState<FreehandPaintPoint[]>([])
  const strokeModeRef = useRef<'paint' | 'erase' | null>(null)
  const strokeStartRef = useRef<GridCell | null>(null)
  const strokeCurrentRef = useRef<GridCell | null>(null)
  const strokePaintedCellsRef = useRef<Set<string>>(new Set())
  const freehandPaintPointsRef = useRef<FreehandPaintPoint[]>([])
  const openPassageBrushActiveRef = useRef(false)
  const openPassageBrushWallKeysRef = useRef<string[]>([])
  const buildAnimationVersion = useBuildAnimationVersion()
  const tileGpuStream = useTileGpuStream()
  const tileGpuStreamVersion = useTileGpuStreamVersion()
  const roomStreamTransactionIdRef = useRef<string | null>(null)
  const roomStreamTransactionStartedAtRef = useRef<number | null>(null)
  const previousActiveFloorIdRef = useRef(activeFloorId)
  const { removalAnimationBatches, queueRemovalAnimationBatch } = useRemovalAnimationBatches()
  const hoverPreviewStateRef = useRef<{
    hoveredCell: SnappedGridPosition | null
    hoveredPoint: { x: number; y: number; z: number } | null
    hoveredRay: {
      origin: [number, number, number]
      direction: [number, number, number]
    } | null
    hoveredTerrainCell: GridCell | null
    hoveredSurfaceHit: PlacementSurfaceHit | null
  }>({
    hoveredCell: null,
    hoveredPoint: null,
    hoveredRay: null,
    hoveredTerrainCell: null,
    hoveredSurfaceHit: null,
  })
  const hoverInteractionStateRef = useRef<{
    hoveredOpenWallKey: string | null
  }>({
    hoveredOpenWallKey: null,
  })
  const placementOrientationKey = pickedUpObject
    ? `pickup:${pickedUpObject.objectId}:${pickedUpObject.assetId}:${wallConnectionMode}`
    : `${selectedPropAssetId ?? ''}:${selectedCharacterAssetId ?? ''}:${selectedOpeningAssetId ?? ''}:${wallConnectionMode}`
  const defaultFloorRotationIndex = pickedUpObject?.floorRotationIndex ?? 0
  const [placementOrientation, setPlacementOrientation] = useState({
    key: placementOrientationKey,
    floorRotationIndex: 0,
    wallFlipped: false,
  })
  const floorRotationIndex =
    placementOrientation.key === placementOrientationKey
      ? placementOrientation.floorRotationIndex
      : defaultFloorRotationIndex
  const wallFlipped =
    placementOrientation.key === placementOrientationKey
      ? placementOrientation.wallFlipped
      : false

  useEffect(() => {
    hoverPreviewStateRef.current = {
      hoveredCell,
      hoveredPoint,
      hoveredRay,
      hoveredTerrainCell,
      hoveredSurfaceHit,
    }
  }, [hoveredCell, hoveredPoint, hoveredRay, hoveredSurfaceHit, hoveredTerrainCell])

  useEffect(() => {
    hoverInteractionStateRef.current = {
      hoveredOpenWallKey,
    }
  }, [hoveredOpenWallKey])

  useEffect(() => {
    void buildAnimationVersion
    if (!latchedRoomPreview || hasHeldBuildAnimations()) {
      return
    }

    if (roomStreamTransactionIdRef.current) {
      tileGpuStream.cancelTileStreamTransaction(roomStreamTransactionIdRef.current)
      roomStreamTransactionIdRef.current = null
      roomStreamTransactionStartedAtRef.current = null
    }
    setLatchedRoomPreview(null)
    invalidate()
  }, [buildAnimationVersion, invalidate, latchedRoomPreview, tileGpuStream])

  useEffect(() => {
    void tileGpuStreamVersion
    if (!latchedRoomPreview || !hasHeldBuildAnimations()) {
      return
    }

    const progress = tileGpuStream.getTransactionProgress(roomStreamTransactionIdRef.current)
    if (!progress || progress.totalPages === 0 || progress.pendingPages > 0) {
      return
    }

    releaseHeldBuildAnimations()
    invalidate()
  }, [buildAnimationVersion, invalidate, latchedRoomPreview, tileGpuStream, tileGpuStreamVersion])

  useEffect(() => {
    if (!latchedRoomPreview || !hasHeldBuildAnimations()) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (!hasHeldBuildAnimations()) {
        return
      }

      console.error('Held room tile stream timed out; releasing animation without streamed pages.')
      releaseHeldBuildAnimations()
      invalidate()
    }, HELD_ROOM_PREWARM_TIMEOUT_MS)

    return () => window.clearTimeout(timeoutId)
  }, [buildAnimationVersion, invalidate, latchedRoomPreview])

  const resolvePlacementSurfaceHit = useCallback((pointerEvent: PointerEvent) => {
    const rect = gl.domElement.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return null
    }

    surfacePointerRef.current.set(
      ((pointerEvent.clientX - rect.left) / rect.width) * 2 - 1,
      -((pointerEvent.clientY - rect.top) / rect.height) * 2 + 1,
    )
    surfaceRaycasterRef.current.setFromCamera(surfacePointerRef.current, camera)

    return findPlacementSurfaceHit(
      surfaceRaycasterRef.current.intersectObjects(scene.children, true),
      paintedCells,
      placedObjects,
      mapMode,
    )
  }, [camera, gl.domElement, mapMode, paintedCells, placedObjects, scene.children])

  const getSnappedHoverCell = useCallback((
    point: { x: number; y: number; z: number },
    terrainCell: GridCell | null,
  ): SnappedGridPosition => {
    if (!terrainCell) {
      return snap(point)
    }

    return {
      cell: terrainCell,
      key: getCellKey(terrainCell),
      position: cellToWorldPosition(terrainCell),
    }
  }, [snap])

  const resolvePointerPlacementState = useCallback((clientX: number, clientY: number) => {
    const rect = gl.domElement.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      return null
    }

    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null
    }

    const pointerRaycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    pointerRaycaster.setFromCamera(ndc, camera)
    const intersections = pointerRaycaster.intersectObjects(scene.children, true)
    const terrainHit = mapMode === 'outdoor'
      ? findOutdoorTerrainHit(intersections)
      : null
    const point = terrainHit?.point
      ?? pointerRaycaster.ray.intersectPlane(POINTER_MOVE_PLANE, new THREE.Vector3())

    if (!point) {
      return null
    }

    const snapped = getSnappedHoverCell(point, terrainHit?.cell ?? null)

    return {
      point,
      snapped,
      terrainCell: terrainHit?.cell ?? null,
      ray: {
        origin: [
          pointerRaycaster.ray.origin.x,
          pointerRaycaster.ray.origin.y,
          pointerRaycaster.ray.origin.z,
        ] as [number, number, number],
        direction: [
          pointerRaycaster.ray.direction.x,
          pointerRaycaster.ray.direction.y,
          pointerRaycaster.ray.direction.z,
        ] as [number, number, number],
      },
      surfaceHit: findPlacementSurfaceHit(intersections, paintedCells, placedObjects, mapMode),
    }
  }, [camera, gl.domElement, getSnappedHoverCell, mapMode, paintedCells, placedObjects, scene.children])

  const applyResolvedHoverState = useCallback((resolved: ReturnType<typeof resolvePointerPlacementState>) => {
    const nextHoveredCell = resolved?.snapped ?? null
    const nextHoveredPoint = resolved ? resolved.point : null
    const nextHoveredRay = resolved?.ray ?? null
    const nextHoveredTerrainCell = resolved?.terrainCell ?? null
    const nextHoveredSurfaceHit = resolved?.surfaceHit ?? null
    const current = hoverPreviewStateRef.current

    if (
      areSnappedGridPositionsEqual(current.hoveredCell, nextHoveredCell) &&
      areHoverPointsEqual(current.hoveredPoint, nextHoveredPoint) &&
      areHoverRaysEqual(current.hoveredRay, nextHoveredRay) &&
      areGridCellsEqual(current.hoveredTerrainCell, nextHoveredTerrainCell) &&
      arePlacementSurfaceHitsEqual(current.hoveredSurfaceHit, nextHoveredSurfaceHit)
    ) {
      return false
    }

    hoverPreviewStateRef.current = {
      hoveredCell: nextHoveredCell,
      hoveredPoint: nextHoveredPoint,
      hoveredRay: nextHoveredRay,
      hoveredTerrainCell: nextHoveredTerrainCell,
      hoveredSurfaceHit: nextHoveredSurfaceHit,
    }

    setHoveredCell(nextHoveredCell)
    setHoveredPoint(nextHoveredPoint)
    setHoveredRay(nextHoveredRay)
    setHoveredTerrainCell(nextHoveredTerrainCell)
    setHoveredSurfaceHit(nextHoveredSurfaceHit)
    return true
  }, [
    setHoveredCell,
    setHoveredPoint,
    setHoveredRay,
    setHoveredSurfaceHit,
    setHoveredTerrainCell,
  ])

  const resolvePickedUpObjectPlacement = useCallback(
    (resolved: ReturnType<typeof resolvePointerPlacementState>) => {
      if (!resolved || !pickedUpAsset) {
        return null
      }

      return applyFloorRotation(
        getPropPlacement(
          pickedUpAsset,
          resolved.point,
          paintedCells,
          resolved.surfaceHit,
          mapMode,
          outdoorTerrainHeights,
          resolved.ray,
          resolved.terrainCell,
          openingQueryCache,
        ),
        floorRotationIndex * (Math.PI / 2),
      )
    },
    [floorRotationIndex, mapMode, openingQueryCache, outdoorTerrainHeights, paintedCells, pickedUpAsset],
  )

  const finishHeldMoveDrag = useCallback((commit: boolean, clientX?: number, clientY?: number) => {
    const resolved =
      commit && typeof clientX === 'number' && typeof clientY === 'number'
        ? resolvePointerPlacementState(clientX, clientY)
        : null
    const propPlacement = commit ? resolvePickedUpObjectPlacement(resolved) : null

    if (resolved || !commit) {
      applyResolvedHoverState(resolved)
    }

    if (pickedUpObject && propPlacement) {
      const localTransform = getNestedLocalTransform(propPlacement, placedObjects)
      const moved = repositionObject(pickedUpObject.objectId, {
        position: propPlacement.position,
        rotation: propPlacement.rotation,
        cell: propPlacement.cell,
        cellKey: propPlacement.anchorKey ?? propPlacement.supportCellKey,
        props: {
          ...pickedUpObject.props,
          connector: propPlacement.connector,
          direction: propPlacement.direction,
        },
        parentObjectId: propPlacement.parentObjectId,
        localPosition: localTransform.localPosition,
        localRotation: localTransform.localRotation,
        supportCellKey: propPlacement.supportCellKey,
      })

      if (!moved) {
        cancelPickedUpObject()
      }
    } else if (pickedUpObject) {
      cancelPickedUpObject()
    }

    setObjectMoveDragPointer(null)
    setObjectDragActive(false)
    invalidate()
  }, [
    applyResolvedHoverState,
    cancelPickedUpObject,
    invalidate,
    pickedUpObject,
    placedObjects,
    repositionObject,
    resolvePickedUpObjectPlacement,
    resolvePointerPlacementState,
    setObjectDragActive,
    setObjectMoveDragPointer,
  ])

  const updateStrokeState = useCallback((
    mode: 'paint' | 'erase' | null,
    startCell: GridCell | null,
    currentCell: GridCell | null,
  ) => {
    const nextState = {
      mode,
      startCell,
      currentCell,
    }
    const currentState = {
      mode: strokeModeRef.current,
      startCell: strokeStartRef.current,
      currentCell: strokeCurrentRef.current,
    }
    if (!shouldUpdateGridStrokeState(currentState, nextState)) {
      return false
    }
    setPaintingStrokeActive(Boolean(mode))
    strokeModeRef.current = mode
    strokeStartRef.current = startCell
    strokeCurrentRef.current = currentCell
    setStrokeMode(mode)
    setStrokeStartCell(startCell)
    setStrokeCurrentCell(currentCell)
    return true
  }, [
    setPaintingStrokeActive,
    setStrokeCurrentCell,
    setStrokeMode,
    setStrokeStartCell,
  ])

  const updateOpenPassageBrushState = useCallback((active: boolean, wallKeys: string[]) => {
    const currentState = {
      active: openPassageBrushActiveRef.current,
      wallKeys: openPassageBrushWallKeysRef.current,
    }
    const nextState = {
      active,
      wallKeys,
    }
    if (!shouldUpdateOpenPassageBrushState(currentState, nextState)) {
      return false
    }
    openPassageBrushActiveRef.current = active
    openPassageBrushWallKeysRef.current = wallKeys
    setOpenPassageBrushWallKeys(wallKeys)
    setPaintingStrokeActive(active || Boolean(strokeModeRef.current))
    return true
  }, [setOpenPassageBrushWallKeys, setPaintingStrokeActive])

  const cancelRoomStrokeStream = useCallback(() => {
    updateStrokeState(null, null, null)
    setStrokePaintedCells([])
    strokePaintedCellsRef.current.clear()
    setFreehandPaintPoints([])
    freehandPaintPointsRef.current = []
    setLatchedRoomPreview(null)
    const transactionId = roomStreamTransactionIdRef.current
    if (transactionId) {
      tileGpuStream.cancelTileStreamTransaction(transactionId)
      roomStreamTransactionIdRef.current = null
      roomStreamTransactionStartedAtRef.current = null
    }
    if (hasHeldBuildAnimations()) {
      releaseHeldBuildAnimations()
    }
    invalidate()
  }, [invalidate, tileGpuStream, updateStrokeState])

  const cancelRoomDraft = useCallback(() => {
    setRoomDraft(null)
    invalidate()
  }, [invalidate])

  const roomBrushCells = useMemo<Record<string, PaintedCellRecord>>(() => {
    if (mapMode !== 'outdoor') {
      return paintedCells
    }
    if (outdoorBrushMode === 'terrain-style') {
      return Object.fromEntries(
        Object.entries(outdoorTerrainStyleCells).map(([cellKey, record]) => [
          cellKey,
          {
            cell: record.cell,
            layerId: record.layerId,
            roomId: null,
          },
        ]),
      )
    }
    return blockedCells
  }, [blockedCells, mapMode, outdoorBrushMode, outdoorTerrainStyleCells, paintedCells])
  const roomDraftOccupancyPolygons = useMemo(
    () => buildRoomDraftOccupancyPolygons(paintedCells, splineWallGraph),
    [paintedCells, splineWallGraph],
  )
  const occupiedRoomDraftCellKeys = useMemo(
    () => new Set(Object.keys(paintedCells)),
    [paintedCells],
  )
  const clippedRoomDraft = useMemo(
    () => roomDraft
      ? clipRoomDraft(roomDraft, roomDraftOccupancyPolygons, occupiedRoomDraftCellKeys)
      : null,
    [occupiedRoomDraftCellKeys, roomDraft, roomDraftOccupancyPolygons],
  )
  const roomDraftCells = useMemo(
    () => clippedRoomDraft?.commitCells ?? [],
    [clippedRoomDraft],
  )
  const roomDraftValid = Boolean(
    clippedRoomDraft
    && clippedRoomDraft.valid
    && roomDraftCells.length > 0
    && clippedRoomDraft.splineNodes.length >= 3,
  )
  const strokeRoomDraftPreview = useMemo(() => {
    if (
      roomDraft
      || tool !== 'room'
      || roomEditMode !== 'rooms'
      || roomPaintMode !== 'area'
      || mapMode === 'outdoor'
      || strokeMode !== 'paint'
      || !strokeStartCell
      || !strokeCurrentCell
      || isRoomResizeHandleActive
    ) {
      return null
    }

    return createRoomDraftFromStroke(strokeStartCell, strokeCurrentCell)
  }, [
    isRoomResizeHandleActive,
    mapMode,
    roomDraft,
    roomEditMode,
    roomPaintMode,
    strokeCurrentCell,
    strokeMode,
    strokeStartCell,
    tool,
  ])
  const strokeRoomDraftPreviewClip = useMemo(
    () => strokeRoomDraftPreview
      ? clipRoomDraft(strokeRoomDraftPreview, roomDraftOccupancyPolygons, occupiedRoomDraftCellKeys)
      : null,
    [occupiedRoomDraftCellKeys, roomDraftOccupancyPolygons, strokeRoomDraftPreview],
  )
  const previewStrokeMode = strokeMode ?? latchedRoomPreview?.mode ?? null
  const paintedAreaRoomPreview = useMemo(() => {
    if (
      roomDraft
      || tool !== 'room'
      || roomEditMode !== 'rooms'
      || roomPaintMode !== 'paint'
      || mapMode === 'outdoor'
      || previewStrokeMode !== 'paint'
    ) {
      return null
    }

    return buildPaintedAreaRoomPreview(freehandPaintPoints)
  }, [
    freehandPaintPoints,
    mapMode,
    previewStrokeMode,
    roomDraft,
    roomEditMode,
    roomPaintMode,
    tool,
  ])

  // R key: rotates floor-connected assets; flips wall-connected openings 180°
  useEffect(() => {
    const supportsRotation =
      isPickedUpPlacementMode ||
      supportsPlacementRotationShortcut({
        tool,
        isUnifiedSurfaceMode,
        isUnifiedOpeningMode,
        isFloorOpeningMode,
        isWallOpeningMode,
      })
    if (!supportsRotation) return
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) return
      if (e.key === 'Escape' && (strokeModeRef.current || latchedRoomPreview || roomStreamTransactionIdRef.current || roomDraft)) {
        e.preventDefault()
        if (roomDraft) {
          cancelRoomDraft()
          return
        }
        cancelRoomStrokeStream()
        return
      }
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setPlacementOrientation((current) => {
          const base =
            current.key === placementOrientationKey
              ? current
              : {
                  key: placementOrientationKey,
                  floorRotationIndex: defaultFloorRotationIndex,
                  wallFlipped: false,
                }

          return isWallOpeningMode
            ? { ...base, wallFlipped: !base.wallFlipped }
            : {
                ...base,
                floorRotationIndex: (base.floorRotationIndex + 1) % 4,
              }
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    cancelRoomDraft,
    cancelRoomStrokeStream,
    defaultFloorRotationIndex,
    isFloorOpeningMode,
    isPickedUpPlacementMode,
    isUnifiedOpeningMode,
    isUnifiedSurfaceMode,
    isWallOpeningMode,
    latchedRoomPreview,
    placementOrientationKey,
    roomDraft,
    tool,
  ])

  // Register non-passive handlers on the canvas so preventDefault() works for
  // context menu suppression and drag-selection prevention
  useEffect(() => {
    const canvas = gl.domElement
    const blockContextMenu = (e: Event) => e.preventDefault()
    const blockSelectOnDrag = (e: PointerEvent) => {
      if (e.button === 0 || e.button === 2) e.preventDefault()
    }
    canvas.addEventListener('contextmenu', blockContextMenu, { passive: false })
    canvas.addEventListener('pointerdown', blockSelectOnDrag, { passive: false })
    return () => {
      canvas.removeEventListener('contextmenu', blockContextMenu)
      canvas.removeEventListener('pointerdown', blockSelectOnDrag)
    }
  }, [gl])

  useEffect(() => {
    if (!pickedUpObject) {
      return
    }

    if (tool !== 'select' || !placedObjects[pickedUpObject.objectId] || !pickedUpAsset) {
      cancelPickedUpObject()
      setObjectMoveDragPointer(null)
      setObjectDragActive(false)
    }
  }, [
    cancelPickedUpObject,
    pickedUpAsset,
    pickedUpObject,
    placedObjects,
    setObjectDragActive,
    setObjectMoveDragPointer,
    tool,
  ])

  useEffect(() => {
    if (!pickedUpObject || !pickedUpAsset || !isObjectDragActive || !objectMoveDragPointer) {
      return
    }

    const resolved = resolvePointerPlacementState(
      objectMoveDragPointer.clientX,
      objectMoveDragPointer.clientY,
    )
    applyResolvedHoverState(resolved)
    invalidate()
  }, [
    applyResolvedHoverState,
    invalidate,
    isObjectDragActive,
    objectMoveDragPointer,
    pickedUpAsset,
    pickedUpObject,
    resolvePointerPlacementState,
  ])

  useEffect(() => {
    if (!pickedUpObject || !pickedUpAsset || !isObjectDragActive) {
      return
    }

    const handlePointerUp = (event: PointerEvent) => {
      finishHeldMoveDrag(true, event.clientX, event.clientY)
    }

    const handlePointerCancel = () => {
      finishHeldMoveDrag(false)
    }

    window.addEventListener('pointerup', handlePointerUp, { once: true })
    window.addEventListener('pointercancel', handlePointerCancel, { once: true })
    window.addEventListener('blur', handlePointerCancel, { once: true })

    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
      window.removeEventListener('blur', handlePointerCancel)
    }
  }, [
    finishHeldMoveDrag,
    isObjectDragActive,
    pickedUpAsset,
    pickedUpObject,
  ])

  const previewCells = useMemo(() => {
    if (tool !== 'room' || roomEditMode !== 'rooms') {
      return []
    }

    if (roomDraft || strokeRoomDraftPreview) {
      return []
    }

    if (
      roomPaintMode === 'paint'
      && mapMode !== 'outdoor'
      && strokeMode === 'paint'
      && paintedAreaRoomPreview
    ) {
      return paintedAreaRoomPreview.cells
    }

    if (mapMode === 'outdoor' && outdoorBrushMode === 'terrain-sculpt') {
      if (strokeStartCell && strokeCurrentCell && strokeMode) {
        return getRectangleCells(strokeStartCell, strokeCurrentCell)
      }

      return hoveredCell ? [hoveredCell.cell] : []
    }

    return getRoomPreviewCells({
      hoveredCell,
      latchedPreviewCells: latchedRoomPreview?.cells,
      paintedCells: roomBrushCells,
      strokeCurrentCell,
      strokeMode,
      strokeStartCell,
      strokePaintedCells,
      suppressRoomPreview: isRoomResizeHandleActive,
      tool,
      roomPaintMode,
    })
  }, [
    hoveredCell,
    paintedAreaRoomPreview,
    mapMode,
    outdoorBrushMode,
    roomEditMode,
    isRoomResizeHandleActive,
    roomDraft,
    roomBrushCells,
    strokeCurrentCell,
    strokeRoomDraftPreview,
    strokeMode,
    strokeStartCell,
    strokePaintedCells,
    latchedRoomPreview,
    tool,
    roomPaintMode,
  ])
  const roomPaintPreviewPaths = useMemo(
    () => paintedAreaRoomPreview?.paths.length
      ? paintedAreaRoomPreview.paths
      : [],
    [paintedAreaRoomPreview],
  )

  useEffect(() => {
    const transactionId = roomStreamTransactionIdRef.current
    if (!transactionId) {
      return
    }

    tileGpuStream.updateTileStreamPreview(
      transactionId,
      previewCells,
      previewStrokeMode,
      {
        mountId: getTileGpuStreamMountId(activeFloorId, 'active'),
        assetId: globalFloorAssetId,
      },
    )
  }, [activeFloorId, globalFloorAssetId, previewCells, previewStrokeMode, tileGpuStream])

  const roomStreamTransactionId = roomStreamTransactionIdRef.current
  const roomStreamTransactionStartedAt = roomStreamTransactionStartedAtRef.current
  const roomStreamMountId = getTileGpuStreamMountId(activeFloorId, 'active')
  const shouldStreamRoomTransactionPreview = shouldRenderRoomStreamPreview({
    roomStreamTransactionId,
    roomStreamTransactionStartedAt,
    previewStrokeMode,
    mapMode,
    previewCells,
    strokeMode,
  })
  const previewRoomFloorMaskData = useMemo(() => {
    if (
      !shouldStreamRoomTransactionPreview
      || previewStrokeMode !== 'paint'
      || previewCells.length === 0
    ) {
      return null
    }

    return buildPreviewRoomFloorMaskData(previewCells, roomPaintPreviewPaths)
  }, [
    previewCells,
    previewStrokeMode,
    roomPaintPreviewPaths,
    shouldStreamRoomTransactionPreview,
  ])
  const renderablePreviewCells = useMemo(
    () => previewRoomFloorMaskData
      ? filterCellsToRoomFloorMask(previewCells, previewRoomFloorMaskData)
      : previewCells,
    [previewCells, previewRoomFloorMaskData],
  )
  const previewRoomFloorMaskRuntime = useMemo(() => {
    if (!previewRoomFloorMaskData) {
      return null
    }

    return buildRoomFloorMaskRuntime(previewRoomFloorMaskData)
  }, [previewRoomFloorMaskData])
  useEffect(
    () => () => disposeRoomFloorMaskRuntime(previewRoomFloorMaskRuntime),
    [previewRoomFloorMaskRuntime],
  )
  const previewStreamEntries = useMemo(
    () => {
      if (!shouldStreamRoomTransactionPreview || renderablePreviewCells.length === 0) {
        return []
      }

      return buildSpeculativeRoomTileEntries({
        activeLayerId,
        activeRoomSetId,
        bakedLightField,
        buildStartedAt: roomStreamTransactionStartedAt!,
        cells: renderablePreviewCells,
        floorTileAssetIds,
        globalFloorAssetId,
        globalWallAssetId,
        innerWalls,
        originCell: strokeStartCell ?? renderablePreviewCells[0]!,
        paintedCells,
        rooms,
        splineWallGraph,
        wallOpenings,
        wallSurfaceAssetIds,
        wallSurfaceProps,
      })
    },
    [
      activeLayerId,
      activeRoomSetId,
      bakedLightField,
      floorTileAssetIds,
      globalFloorAssetId,
      globalWallAssetId,
      innerWalls,
      paintedCells,
      renderablePreviewCells,
      roomStreamTransactionStartedAt,
      rooms,
      splineWallGraph,
      shouldStreamRoomTransactionPreview,
      strokeStartCell,
      wallOpenings,
      wallSurfaceAssetIds,
      wallSurfaceProps,
    ],
  )
  const commitStroke = useEffectEvent(() => {
    if (tool !== 'room' || roomEditMode !== 'rooms') {
      updateStrokeState(null, null, null)
      return
    }

    const mode = strokeModeRef.current
    const startCell = strokeStartRef.current
    const currentCell = strokeCurrentRef.current
    if (!mode || !startCell || !currentCell) {
      return
    }

    // In paint mode, use the tracked painted cells for both paint and erase.
    const paintedAreaCommit = roomPaintMode === 'paint' && mapMode !== 'outdoor' && mode === 'paint'
      ? (() => {
          const preview = buildPaintedAreaRoomPreview(freehandPaintPointsRef.current)
          if (!preview) {
            return null
          }
          const cells = preview.cells.filter((cell) => !paintedCells[getCellKey(cell)])
          return cells.length > 0
            ? { ...preview, cells }
            : null
        })()
      : null
    let cells: GridCell[]
    if (roomPaintMode === 'paint' && mapMode !== 'outdoor') {
      cells = paintedAreaCommit?.cells ?? []
    } else {
      cells =
        mapMode === 'outdoor' && outdoorBrushMode === 'terrain-sculpt'
          ? getRectangleCells(startCell, currentCell)
          : filterStrokeCells(
              getRectangleCells(startCell, currentCell),
              roomBrushCells,
              mode,
              mapMode === 'outdoor' &&
                mode === 'paint' &&
               (outdoorBrushMode === 'terrain-style' || outdoorOverpaintRegenerate),
            )
    }

    if (mode === 'paint' && roomPaintMode === 'area' && mapMode !== 'outdoor') {
      setLatchedRoomPreview(null)
      if (roomStreamTransactionIdRef.current) {
        tileGpuStream.cancelTileStreamTransaction(roomStreamTransactionIdRef.current)
        roomStreamTransactionIdRef.current = null
        roomStreamTransactionStartedAtRef.current = null
      }
      setRoomDraft(createRoomDraftFromStroke(startCell, currentCell))
      updateStrokeState(null, null, null)
      setStrokePaintedCells([])
      strokePaintedCellsRef.current.clear()
      invalidate()
      return
    }

    if (cells.length > 0) {
      const previousRoomAnimationState = mapMode === 'outdoor'
        ? null
        : {
          activeLayerId,
          activeRoomSetId,
          bakedLightField,
          floorTileAssetIds,
          globalFloorAssetId,
          globalWallAssetId,
          innerWalls,
          paintedCells,
          rooms,
          splineWallGraph,
          wallOpenings,
          wallSurfaceAssetIds,
          wallSurfaceProps,
        } satisfies RoomAnimationStateInput
      const chunkKeys = Array.from(new Set(cells.map((cell) => getRenderBatchChunkKeyForCell(cell)))).sort()
      traceBuildPerf('room-stroke-commit', {
        cellCount: cells.length,
        chunkCount: chunkKeys.length,
        chunkKeys,
        mapMode,
        mode,
        outdoorBrushMode: mapMode === 'outdoor' ? outdoorBrushMode : null,
      }, () => {
        let buildStartedAt: number | null = null
        const shouldLatchPreview = mode === 'paint' && BUILD_ANIMATIONS_ENABLED && mapMode !== 'outdoor'
        if (mode === 'paint') {
          if (shouldLatchPreview) {
            setLatchedRoomPreview({
              cells,
              mode,
            })
          } else {
            setLatchedRoomPreview(null)
          }
          if (mapMode === 'outdoor') {
            if (outdoorBrushMode === 'terrain-style') {
              paintOutdoorTerrainStyleCells(cells)
            } else if (outdoorBrushMode === 'terrain-sculpt') {
              sculptOutdoorTerrain(cells, outdoorTerrainSculptMode)
            } else {
              paintBlockedCells(cells)
            }
          } else {
            if (paintedAreaCommit) {
              commitDraftRoom({
                cells: paintedAreaCommit.cells,
                splineNodes: paintedAreaCommit.splineNodes,
                splinePaths: paintedAreaCommit.splinePaths,
              })
            } else {
              paintCells(cells)
            }
          }
        } else {
          setLatchedRoomPreview(null)
          if (roomStreamTransactionIdRef.current) {
            tileGpuStream.cancelTileStreamTransaction(roomStreamTransactionIdRef.current)
            roomStreamTransactionIdRef.current = null
            roomStreamTransactionStartedAtRef.current = null
          }
          if (mapMode === 'outdoor') {
            if (outdoorBrushMode === 'terrain-style') {
              eraseOutdoorTerrainStyleCells(cells)
            } else if (outdoorBrushMode === 'terrain-sculpt') {
              sculptOutdoorTerrain(
                cells,
                outdoorTerrainSculptMode === 'raise' ? 'lower' : 'raise',
              )
            } else {
              eraseBlockedCells(cells)
            }
          } else {
            eraseCells(cells)
          }
          if (BUILD_ANIMATIONS_ENABLED && mapMode !== 'outdoor') {
            buildStartedAt = triggerBuild(cells, startCell)
          }
        }

        if (previousRoomAnimationState) {
          const nextState = useDungeonStore.getState()
          if (nextState.activeFloorId === activeFloorId) {
            const affectedCells = expandRoomMutationCells(cells)
            const removalStartedAt = performance.now()
            const removalEntries = buildRemovedRoomTileEntries({
              before: previousRoomAnimationState,
              after: {
                activeLayerId,
                activeRoomSetId: nextState.activeRoomSetId,
                bakedLightField,
                floorTileAssetIds: nextState.floorTileAssetIds,
                globalFloorAssetId: nextState.selectedAssetIds.floor,
                globalWallAssetId: nextState.selectedAssetIds.wall,
                innerWalls: nextState.innerWalls,
                paintedCells: nextState.paintedCells,
                rooms: nextState.rooms,
                splineWallGraph: nextState.splineWallGraph,
                wallOpenings: nextState.wallOpenings,
                wallSurfaceAssetIds: nextState.wallSurfaceAssetIds,
                wallSurfaceProps: nextState.wallSurfaceProps,
              },
              buildStartedAt: removalStartedAt,
              cells: affectedCells,
              originCell: startCell,
            })
            queueRemovalAnimationBatch(removalEntries, activeFloorId)

            if (mode === 'paint' && BUILD_ANIMATIONS_ENABLED) {
              const scheduledBuildStartedAt = removalEntries.length > 0
                ? removalStartedAt + getBuildAnimationPlaybackDurationMs(WALL_EXTRA_DELAY_MS)
                : roomStreamTransactionStartedAtRef.current ?? performance.now()
              if (roomStreamTransactionIdRef.current) {
                // Cascade FROM the stroke start corner TOWARD the release corner (opposite diagonal).
                // Tiles near where you first clicked appear first.
                buildStartedAt = triggerBuild(cells, startCell, {
                  holdUntilReleased: shouldLatchPreview,
                  startedAt: scheduledBuildStartedAt,
                })
                tileGpuStream.commitTileStreamTransaction(roomStreamTransactionIdRef.current, buildStartedAt)
              } else {
                buildStartedAt = triggerBuild(cells, startCell, {
                  holdUntilReleased: shouldLatchPreview,
                  startedAt: scheduledBuildStartedAt,
                })
              }
            }
          }
        } else if (mode === 'paint' && BUILD_ANIMATIONS_ENABLED) {
          if (roomStreamTransactionIdRef.current) {
            buildStartedAt = triggerBuild(cells, startCell, {
              holdUntilReleased: shouldLatchPreview,
              startedAt: roomStreamTransactionStartedAtRef.current ?? undefined,
            })
            tileGpuStream.commitTileStreamTransaction(roomStreamTransactionIdRef.current, buildStartedAt)
          } else {
            buildStartedAt = triggerBuild(cells, startCell, { holdUntilReleased: shouldLatchPreview })
          }
        } else if (mode === 'paint' && roomStreamTransactionIdRef.current && !BUILD_ANIMATIONS_ENABLED) {
          tileGpuStream.cancelTileStreamTransaction(roomStreamTransactionIdRef.current)
          roomStreamTransactionIdRef.current = null
          roomStreamTransactionStartedAtRef.current = null
        }

        invalidate()
      })
    }

    if (cells.length === 0 && roomStreamTransactionIdRef.current) {
      tileGpuStream.cancelTileStreamTransaction(roomStreamTransactionIdRef.current)
      roomStreamTransactionIdRef.current = null
      roomStreamTransactionStartedAtRef.current = null
    }

    updateStrokeState(null, null, null)
    setStrokePaintedCells([])
    strokePaintedCellsRef.current.clear()
    setFreehandPaintPoints([])
    freehandPaintPointsRef.current = []
  })

  const commitRoomDraftOverlay = useCallback(() => {
    if (!roomDraft || !clippedRoomDraft || !roomDraftValid || roomDraftCells.length === 0) {
      return
    }

    const previousRoomAnimationState = {
      activeLayerId,
      activeRoomSetId,
      bakedLightField,
      floorTileAssetIds,
      globalFloorAssetId,
      globalWallAssetId,
      innerWalls,
      paintedCells,
      rooms,
      splineWallGraph,
      wallOpenings,
      wallSurfaceAssetIds,
      wallSurfaceProps,
    } satisfies RoomAnimationStateInput

    if (!commitDraftRoom({
      cells: roomDraftCells,
      splineNodes: clippedRoomDraft.splineNodes,
    })) {
      return
    }

    setRoomDraft(null)

    const nextState = useDungeonStore.getState()
    if (nextState.activeFloorId !== activeFloorId) {
      invalidate()
      return
    }

    const affectedCells = expandRoomMutationCells(roomDraftCells)
    const removalStartedAt = performance.now()
    const removalEntries = buildRemovedRoomTileEntries({
      before: previousRoomAnimationState,
      after: {
        activeLayerId,
        activeRoomSetId: nextState.activeRoomSetId,
        bakedLightField,
        floorTileAssetIds: nextState.floorTileAssetIds,
        globalFloorAssetId: nextState.selectedAssetIds.floor,
        globalWallAssetId: nextState.selectedAssetIds.wall,
        innerWalls: nextState.innerWalls,
        paintedCells: nextState.paintedCells,
        rooms: nextState.rooms,
        splineWallGraph: nextState.splineWallGraph,
        wallOpenings: nextState.wallOpenings,
        wallSurfaceAssetIds: nextState.wallSurfaceAssetIds,
        wallSurfaceProps: nextState.wallSurfaceProps,
      },
      buildStartedAt: removalStartedAt,
      cells: affectedCells,
      originCell: roomDraft.originCell,
    })
    queueRemovalAnimationBatch(removalEntries, activeFloorId)

    if (BUILD_ANIMATIONS_ENABLED) {
      const scheduledBuildStartedAt = removalEntries.length > 0
        ? removalStartedAt + getBuildAnimationPlaybackDurationMs(WALL_EXTRA_DELAY_MS)
        : performance.now()
      triggerBuild(roomDraftCells, roomDraft.originCell, {
        startedAt: scheduledBuildStartedAt,
      })
    }

    invalidate()
  }, [
    activeFloorId,
    activeLayerId,
    activeRoomSetId,
    bakedLightField,
    clippedRoomDraft,
    commitDraftRoom,
    floorTileAssetIds,
    globalFloorAssetId,
    globalWallAssetId,
    innerWalls,
    invalidate,
    paintedCells,
    queueRemovalAnimationBatch,
    roomDraft,
    roomDraftCells,
    roomDraftValid,
    rooms,
    splineWallGraph,
    wallOpenings,
    wallSurfaceAssetIds,
    wallSurfaceProps,
  ])

  const endOpenPassageBrush = useEffectEvent(() => {
    if (!openPassageBrushActiveRef.current && openPassageBrushWallKeysRef.current.length === 0) {
      return
    }

    if (openPassageBrushWallKeysRef.current.length > 0) {
      placeOpenPassages(openPassageBrushWallKeysRef.current)
    }
    updateOpenPassageBrushState(false, [])
  })

  useEffect(() => {
    if (tool === 'room' && roomEditMode === 'rooms') {
      return
    }

    if (strokeModeRef.current || latchedRoomPreview || roomStreamTransactionIdRef.current) {
      cancelRoomStrokeStream()
    }
  }, [cancelRoomStrokeStream, latchedRoomPreview, roomEditMode, tool])

  useEffect(() => {
    if (!roomDraft) {
      return
    }

    if (tool === 'room' && roomEditMode === 'rooms' && roomPaintMode === 'area' && mapMode !== 'outdoor') {
      return
    }

    cancelRoomDraft()
  }, [cancelRoomDraft, mapMode, roomDraft, roomEditMode, roomPaintMode, tool])

  useEffect(() => {
    if (!roomStreamTransactionIdRef.current) {
      return
    }

    cancelRoomStrokeStream()
  }, [activeFloorId, cancelRoomStrokeStream])

  useEffect(() => {
    const previousActiveFloorId = previousActiveFloorIdRef.current
    previousActiveFloorIdRef.current = activeFloorId

    if (!shouldClearRoomDraftForFloorChange({
      previousActiveFloorId,
      activeFloorId,
      roomDraftActive: roomDraft !== null,
    })) {
      return
    }

    cancelRoomDraft()
  }, [activeFloorId, cancelRoomDraft, roomDraft])

  useEffect(() => {
    function handlePointerUp() {
      commitStroke()
      endOpenPassageBrush()
    }

    function handlePointerCancel() {
      cancelRoomStrokeStream()
      updateOpenPassageBrushState(false, [])
    }

    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)
    window.addEventListener('blur', handlePointerCancel)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
      window.removeEventListener('blur', handlePointerCancel)
      openPassageBrushActiveRef.current = false
      openPassageBrushWallKeysRef.current = []
      setHoveredOpenWallKey(null)
      setOpenPassageBrushWallKeys([])
      setPaintingStrokeActive(false)
    }
  }, [
    cancelRoomStrokeStream,
    setPaintingStrokeActive,
    updateOpenPassageBrushState,
  ])

  function getOutdoorTerrainHit(event: ThreeEvent<PointerEvent>) {
    if (mapMode !== 'outdoor') {
      return null
    }

    return findOutdoorTerrainHit(event.intersections)
  }

  function updateHoveredCell(event: ThreeEvent<PointerEvent>) {
    const terrainHit = getOutdoorTerrainHit(event)
    const point = terrainHit?.point ?? raycaster.pointOnPlane(event)
    const snapped = getSnappedHoverCell(point, terrainHit?.cell ?? null)
    const hoveredOpenWallKey = isOpenWallBrushMode
      ? getEligibleOpenPassageWallKey(
          point,
          paintedCells,
          eligibleOpenPassageWallKeys,
          openingPlacementGraph,
          openingQueryCache,
        )
      : null
    const hoverPreviewChanged = applyResolvedHoverState({
      point,
      snapped,
      terrainCell: terrainHit?.cell ?? null,
      ray: {
        origin: [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
        direction: [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
      },
      surfaceHit: resolvePlacementSurfaceHit(event.nativeEvent),
    })
    const nextHoverInteraction = {
      hoveredOpenWallKey,
    }
    const hoverInteractionChanged = shouldUpdateGridHoverInteractionState(
      hoverInteractionStateRef.current,
      nextHoverInteraction,
    )
    if (hoverInteractionChanged) {
      hoverInteractionStateRef.current = nextHoverInteraction
      setHoveredOpenWallKey(hoveredOpenWallKey)
    }

    let shouldInvalidate = hoverPreviewChanged || hoverInteractionChanged
    if (openPassageBrushActiveRef.current && hoveredOpenWallKey) {
      placeOpenPassageWall(hoveredOpenWallKey)
      shouldInvalidate = true
    }

    if (tool === 'room' && roomEditMode === 'rooms' && strokeModeRef.current) {
      const strokeChanged = updateStrokeState(
        strokeModeRef.current,
        strokeStartRef.current,
        snapped.cell,
      )
      shouldInvalidate = shouldInvalidate || strokeChanged

      // In paint mode, track cells that will be painted or erased (but don't paint/erase yet)
      if (roomPaintMode === 'paint' && mapMode !== 'outdoor') {
        const worldPoint: FreehandPaintPoint = [point.x, point.z]
        const previousPoint = freehandPaintPointsRef.current.at(-1)
        if (!previousPoint || Math.hypot(previousPoint[0] - worldPoint[0], previousPoint[1] - worldPoint[1]) > GRID_SIZE * 0.05) {
          freehandPaintPointsRef.current = [...freehandPaintPointsRef.current, worldPoint]
          setFreehandPaintPoints(freehandPaintPointsRef.current)
        }

        const cellKey = getCellKey(snapped.cell)
        if (!strokePaintedCellsRef.current.has(cellKey)) {
          strokePaintedCellsRef.current.add(cellKey)
          const newPaintedCells = Array.from(strokePaintedCellsRef.current).map((key) => {
            const [x, z] = key.split(':').map(Number) as [number, number]
            return [x, z] as GridCell
          })
          setStrokePaintedCells(newPaintedCells)
          shouldInvalidate = true
        }
      }
    }

    if (shouldInvalidate) {
      invalidate()
    }
  }

  function updateCursorPosOnly(event: ThreeEvent<PointerEvent>) {
    if (applyResolvedHoverState(resolvePointerPlacementState(
      event.nativeEvent.clientX,
      event.nativeEvent.clientY,
    ))) {
      invalidate()
    }
  }

  function placeOpenPassageWall(wallKey: string | null) {
    const nextWallKeys = extendOpenPassageBrush(
      openPassageBrushWallKeysRef.current,
      wallKey,
    )

    if (nextWallKeys === openPassageBrushWallKeysRef.current) {
      return
    }

    updateOpenPassageBrushState(true, nextWallKeys)
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    const terrainHit = getOutdoorTerrainHit(event)
    const point = terrainHit?.point ?? raycaster.pointOnPlane(event)
    const snapped = getSnappedHoverCell(point, terrainHit?.cell ?? null)
    const surfaceHit = resolvePlacementSurfaceHit(event.nativeEvent)
    const hoveredOpenWallKey = isOpenWallBrushMode
      ? getEligibleOpenPassageWallKey(
          point,
          paintedCells,
          eligibleOpenPassageWallKeys,
          openingPlacementGraph,
          openingQueryCache,
        )
      : null
    setHoveredCell(snapped)
    setHoveredPoint(point)
    setHoveredRay({
      origin: [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
      direction: [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
    })
    setHoveredTerrainCell(terrainHit?.cell ?? null)
    setHoveredSurfaceHit(surfaceHit)
    setHoveredOpenWallKey(hoveredOpenWallKey)
    invalidate()

    if (tool === 'opening' || isUnifiedOpeningMode) {
      const activeOpeningAsset = selectedOpeningAsset
      const activeOpeningAssetId = selectedOpeningAssetId

        if (isFloorOpeningMode) {
          // Stairs and other floor-connected openings use prop-style placement
          const rawPlacement = activeOpeningAsset
            ? getPropPlacement(
                activeOpeningAsset,
                point,
                paintedCells,
                surfaceHit,
                mapMode,
                outdoorTerrainHeights,
                {
                  origin: [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
                  direction: [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
                },
                terrainHit?.cell ?? null,
                openingQueryCache,
              )
            : null
          const propPlacement = applyFloorRotation(rawPlacement, floorRotationIndex * (Math.PI / 2))

          if (event.button === 2) {
            const hoveredObjectId = raycaster.objectIdFromEvent(event)
            if (hoveredObjectId) {
              removeObject(hoveredObjectId)
            } else if (propPlacement && propPlacement.anchorKey) {
              removeObjectAtCell(propPlacement.anchorKey)
            }
            return
        }
        if (event.button !== 0 || !propPlacement) return

        const localTransform = getNestedLocalTransform(propPlacement, placedObjects)
          placeObject({
            type: 'prop',
            assetId: activeOpeningAssetId,
            position: propPlacement.position,
            rotation: propPlacement.rotation,
          props: { connector: propPlacement.connector, direction: propPlacement.direction },
          cell: propPlacement.cell,
          cellKey: propPlacement.anchorKey ?? propPlacement.supportCellKey,
            parentObjectId: propPlacement.parentObjectId,
            localPosition: localTransform.localPosition,
            localRotation: localTransform.localRotation,
            supportCellKey: propPlacement.supportCellKey,
            selectPlaced: false,
          })
        return
        }

      const splineOpeningHit = wallConnectionMode === 'door'
        ? findNearestSplineWallSegment(openingQueryCache, [point.x, point.z])
        : null
      const openingPlacement = wallConnectionMode === 'door'
        ? buildSplineWallOpeningPlacement(
            { x: point.x, z: point.z },
            openingPlacementGraph,
            openingQueryCache,
            paintedCells,
            activeOpeningAssetId,
          )
        : getWallConnectionPlacement(
            wallConnectionMode,
            activeOpeningAsset,
            point,
            paintedCells,
            openingPlacementGraph,
            openingQueryCache,
          )
      const hoveredConnection = openingPlacement
        ? (
            (wallConnectionMode === 'door'
              ? findOpeningAtSplineHit(openingPlacementGraph, wallOpenings, splineOpeningHit)
              : null)
            ?? wallOpeningDerivedState.wallOpeningsBySegmentKey[openingPlacement.wallKey]
            ?? null
          )
        : null

      if (event.button === 2) {
        // Right-click: find and remove an opening whose segments cover this wall key
        if (openingPlacement) {
          if (hoveredConnection) removeOpening(hoveredConnection.id)
        }
        return
      }

      if (event.button !== 0 || !openingPlacement || !openingPlacement.valid) return

      if (wallConnectionMode === 'wall') {
        if (hoveredConnection) {
          removeOpening(hoveredConnection.id)
        }
        return
      }

      if (wallConnectionMode === 'open') {
        if (event.button === 0 && hoveredOpenWallKey) {
          updateOpenPassageBrushState(true, [])
          placeOpenPassageWall(hoveredOpenWallKey)
        }
        return
      }

      placeOpening({
        assetId: activeOpeningAssetId,
        wallKey: openingPlacement.wallKey,
        width: openingPlacement.width,
        segmentId: 'segmentId' in openingPlacement ? openingPlacement.segmentId : null,
        segmentStartRatio: 'segmentStartRatio' in openingPlacement ? openingPlacement.segmentStartRatio : null,
        segmentEndRatio: 'segmentEndRatio' in openingPlacement ? openingPlacement.segmentEndRatio : null,
        flipped: wallFlipped,
      })
      return
    }

    if (
      isPickedUpPlacementMode ||
      ((tool === 'prop' && !isUnifiedOpeningMode && !isUnifiedSurfaceMode) || tool === 'character')
    ) {
      const activeAsset = pickedUpObject
        ? pickedUpAsset
        : tool === 'character'
          ? selectedCharacterAsset
          : selectedPropAsset
      const activeAssetId = pickedUpObject
        ? pickedUpAssetId
        : tool === 'character'
          ? selectedCharacterAssetId
          : selectedPropAssetId
      const rawPlacement = activeAsset
        ? getPropPlacement(
            activeAsset,
            point,
            paintedCells,
            surfaceHit,
            mapMode,
            outdoorTerrainHeights,
            {
              origin: [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
              direction: [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
            },
            terrainHit?.cell ?? null,
            openingQueryCache,
          )
        : null
      const propPlacement = applyFloorRotation(rawPlacement, floorRotationIndex * (Math.PI / 2))

      if (event.button === 2) {
        if (pickedUpObject) {
          cancelPickedUpObject()
          return
        }

        const hoveredObjectId = raycaster.objectIdFromEvent(event)
        if (hoveredObjectId) {
          removeObject(hoveredObjectId)
        } else if (propPlacement?.anchorKey) {
          removeObjectAtCell(propPlacement.anchorKey)
        }
        return
      }

      if (event.button !== 0 || event.altKey) {
        return
      }

      if (!propPlacement) {
        return
      }

      const localTransform = getNestedLocalTransform(propPlacement, placedObjects)
      const normalizedObjectType = tool === 'character' || activeAsset?.category === 'player'
        ? 'player'
        : 'prop'

      if (pickedUpObject) {
        const moved = repositionObject(pickedUpObject.objectId, {
          position: propPlacement.position,
          rotation: propPlacement.rotation,
          cell: propPlacement.cell,
          cellKey: propPlacement.anchorKey ?? propPlacement.supportCellKey,
          props: {
            ...pickedUpObject.props,
            connector: propPlacement.connector,
            direction: propPlacement.direction,
          },
          parentObjectId: propPlacement.parentObjectId,
          localPosition: localTransform.localPosition,
          localRotation: localTransform.localRotation,
          supportCellKey: propPlacement.supportCellKey,
        })
        if (moved) {
          cancelPickedUpObject()
        }
        return
      }

      placeObject({
        type: normalizedObjectType,
        assetId: activeAssetId,
        position: propPlacement.position,
        rotation: propPlacement.rotation,
        props: {
          connector: propPlacement.connector,
          direction: propPlacement.direction,
        },
        cell: propPlacement.cell,
        cellKey: propPlacement.anchorKey ?? propPlacement.supportCellKey,
        parentObjectId: propPlacement.parentObjectId,
        localPosition: localTransform.localPosition,
        localRotation: localTransform.localRotation,
        supportCellKey: propPlacement.supportCellKey,
        selectPlaced: false,
      })
      return
    }

    if (tool === 'room' || isUnifiedSurfaceMode) {
      if (mapMode === 'outdoor' && roomEditMode !== 'rooms') {
        return
      }

      if (isUnifiedFloorVariantMode || (tool === 'room' && roomEditMode === 'floor-variants')) {
        const cellKey = getCellKey(snapped.cell)
        if (!paintedCells[cellKey]) {
          return
        }

        if (event.button === 0) {
          setFloorTileAsset(cellKey, selectedFloorBrushAssetId)
        } else if (event.button === 2) {
          setFloorTileAsset(cellKey, null)
        }
        return
      }

      if (tool !== 'room') {
        return
      }

      if (shouldBlockRoomStrokeStart({ latchedRoomPreview, roomDraftActive: roomDraft !== null })) {
        return
      }

      if (mapMode !== 'outdoor') {
        const hoveredRoomId = paintedCells[getCellKey(snapped.cell)]?.roomId ?? null

        // In resize mode, clicking on a room selects it for resizing
        if (roomPaintMode === 'resize') {
          if (event.button === 0 && hoveredRoomId) {
            selectRoom(hoveredRoomId)
            return
          }

          if (event.button === 0 && !hoveredRoomId) {
            selectRoom(null)
          }
          return
        }

        // In area and paint modes, clicking deselects any selected room
        if (event.button === 0) {
          selectRoom(null)
        }
      }
    }

    if (event.button !== 0 && event.button !== 2) {
      return
    }

    if (event.button === 0 && tool === 'room' && roomEditMode === 'rooms' && roomPaintMode === 'paint' && mapMode !== 'outdoor') {
      const worldPoint: FreehandPaintPoint = [point.x, point.z]
      freehandPaintPointsRef.current = [worldPoint]
      setFreehandPaintPoints([worldPoint])

      const cellKey = getCellKey(snapped.cell)
      strokePaintedCellsRef.current.add(cellKey)
      setStrokePaintedCells([[...snapped.cell] as GridCell])

      const transactionId = `tile-stream:${performance.now()}:${Math.random().toString(36).slice(2, 8)}`
      const transactionStartedAt = performance.now()
      roomStreamTransactionIdRef.current = transactionId
      roomStreamTransactionStartedAtRef.current = transactionStartedAt
      tileGpuStream.beginTileStreamTransaction(transactionId, activeFloorId, transactionStartedAt)
      tileGpuStream.updateTileStreamPreview(
        transactionId,
        [snapped.cell],
        'paint',
        {
          mountId: getTileGpuStreamMountId(activeFloorId, 'active'),
          assetId: globalFloorAssetId,
        },
      )
    }

    // Don't start a stroke in resize mode
    if (tool === 'room' && roomEditMode === 'rooms' && roomPaintMode === 'resize') {
      return
    }

    updateStrokeState(
      event.button === 0 ? 'paint' : 'erase',
      snapped.cell,
      snapped.cell,
    )
  }

  function handleContextMenu() {
    // preventDefault is handled by the non-passive canvas listener
  }

  const isNavigationTool = isPassiveGridMode(tool, playMode) && !isPickedUpPlacementMode
  const renderGridOverlay = shouldRenderGridOverlay(showGrid, playMode)
  const hoveredSplineOpeningHit = hoveredPoint && wallConnectionMode === 'door'
    ? findNearestSplineWallSegment(openingQueryCache, [hoveredPoint.x, hoveredPoint.z])
    : null
  const wallConnectionPlacement = (tool === 'opening' || isUnifiedOpeningMode) && hoveredPoint
    ? (
        wallConnectionMode === 'door'
          ? buildSplineWallOpeningPlacement(
              { x: hoveredPoint.x, z: hoveredPoint.z },
              openingPlacementGraph,
              openingQueryCache,
              paintedCells,
              selectedOpeningAssetId,
            )
          : getWallConnectionPlacement(
              wallConnectionMode,
              selectedOpeningAsset,
              hoveredPoint,
              paintedCells,
              openingPlacementGraph,
              openingQueryCache,
            )
      )
    : null
  const wallOpeningDerivedState = buildWallOpeningDerivedState(wallOpenings)
  const hoveredWallConnection = wallConnectionPlacement
    ? (
        (wallConnectionMode === 'door'
          ? findOpeningAtSplineHit(openingPlacementGraph, wallOpenings, hoveredSplineOpeningHit)
          : null)
        ?? wallOpeningDerivedState.wallOpeningsBySegmentKey[wallConnectionPlacement.wallKey]
        ?? null
      )
    : null
  const eligibleOpenPassageWalls = buildEligibleOpenPassageWalls(
    paintedCells,
    wallOpenings,
    wallOpeningDerivedState,
  )
  const eligibleOpenPassageWallKeys = new Set(eligibleOpenPassageWalls.map((wall) => wall.wallKey))
  const isFloorVariantMode = (tool === 'room' && roomEditMode === 'floor-variants') || isUnifiedFloorVariantMode
  const isOpenWallBrushMode =
    (tool === 'opening' || isUnifiedOpeningMode) &&
    wallConnectionMode === 'open' &&
    !isFloorOpeningMode
  const activeHoveredOpenWallKey =
    hoveredOpenWallKey && eligibleOpenPassageWallKeys.has(hoveredOpenWallKey)
      ? hoveredOpenWallKey
      : null
  const activeChunkKeys = useMemo(() => {
    if (tool !== 'room') {
      return []
    }

    const chunkKeys = new Set<string>(previewCells.map((cell) => getRenderBatchChunkKeyForCell(cell)))
    if (chunkKeys.size === 0 && hoveredCell) {
      chunkKeys.add(getRenderBatchChunkKeyForCell(hoveredCell.cell))
    }

    return [...chunkKeys].sort()
  }, [hoveredCell, previewCells, tool])

  return (
    <group>
      {/* Hit plane — always tracks cursor world pos; editing events only for build/place tools */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerMove={isNavigationTool ? updateCursorPosOnly : updateHoveredCell}
          onPointerOut={() => {
          if (!strokeModeRef.current && !openPassageBrushActiveRef.current) {
            hoverPreviewStateRef.current = {
              hoveredCell: null,
              hoveredPoint: null,
              hoveredRay: null,
              hoveredTerrainCell: null,
              hoveredSurfaceHit: null,
            }
            hoverInteractionStateRef.current = {
              hoveredOpenWallKey: null,
            }
            setHoveredOpenWallKey(null)
            setHoveredCell(null)
            setHoveredPoint(null)
            setHoveredRay(null)
            setHoveredTerrainCell(null)
            setHoveredSurfaceHit(null)
            invalidate()
          }
        }}
        onPointerDown={isNavigationTool ? undefined : handlePointerDown}
        onContextMenu={isNavigationTool ? undefined : handleContextMenu}
      >
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {isOpenWallBrushMode && (
        <OpenPassageHitTargets
          walls={eligibleOpenPassageWalls}
          onHoverWall={(wallKey) => setHoveredOpenWallKey(wallKey)}
          onClearHover={() => setHoveredOpenWallKey(null)}
          onStartBrush={(wallKey) => {
            setHoveredOpenWallKey(wallKey)
            updateOpenPassageBrushState(true, [])
            placeOpenPassageWall(wallKey)
          }}
          onExtendBrush={(wallKey) => {
            setHoveredOpenWallKey(wallKey)
            if (openPassageBrushActiveRef.current) {
              placeOpenPassageWall(wallKey)
            }
          }}
        />
      )}

      {renderGridOverlay && (
        <FloorGridOverlay
          size={size}
          showBase={!playMode}
        />
      )}
      {showChunkDebugOverlay && (
        <RenderBatchChunkOverlay
          size={size}
          activeChunkKeys={activeChunkKeys}
        />
      )}

      {roomStreamTransactionId && previewStreamEntries.length > 0 && (
        <BatchedTileEntries
          entries={previewStreamEntries}
          floorId={activeFloorId}
          mountId={roomStreamMountId}
          sourceId={`transaction:${roomStreamTransactionId}`}
          sourceKind="transaction"
          transactionId={roomStreamTransactionId}
          useLineOfSightPostMask={false}
          useRoomFloorMask={previewRoomFloorMaskRuntime !== null}
          roomFloorMaskRuntime={previewRoomFloorMaskRuntime}
        />
      )}

      {removalAnimationBatches
        .filter((batch) => batch.floorId === activeFloorId)
        .map((batch) => (
          <BatchedTileEntries
            key={batch.id}
            entries={batch.entries}
            floorId={batch.floorId}
            mountId={getTileGpuStreamMountId(batch.floorId, 'active')}
            sourceId={batch.id}
            useLineOfSightPostMask={false}
          />
        ))}

      {roomDraft && (
        <RoomDraftOverlay
          draft={roomDraft}
          valid={roomDraftValid}
          previewPoints={clippedRoomDraft?.previewPoints}
          centerPosition={clippedRoomDraft?.controlPosition}
          handleVisibility={clippedRoomDraft?.handleVisibility}
          invalidTitle={
            clippedRoomDraft?.invalidReason === 'disconnected'
              ? 'Draft must remain one connected piece after clipping'
              : clippedRoomDraft?.invalidReason === 'empty'
                ? 'Draft has no visible area after clipping'
                : 'Commit draft room'
          }
          onChange={setRoomDraft}
          onCommit={commitRoomDraftOverlay}
          onCancel={cancelRoomDraft}
        />
      )}

      {!isNavigationTool && (
        <HoverPreview
          hoveredCell={hoveredCell}
          hoveredPoint={hoveredPoint}
          previewCells={previewCells}
          roomPaintPreviewPaths={roomPaintPreviewPaths}
          roomDraftPreviewPoints={strokeRoomDraftPreviewClip?.previewPoints ?? null}
          roomDraftPreviewValid={strokeRoomDraftPreviewClip?.valid ?? false}
          strokeMode={previewStrokeMode}
          propPlacement={(() => {
            if (pickedUpAsset && hoveredPoint)
              return applyFloorRotation(
                getPropPlacement(
                  pickedUpAsset,
                  hoveredPoint,
                  paintedCells,
                  hoveredSurfaceHit,
                  mapMode,
                  outdoorTerrainHeights,
                  hoveredRay,
                  hoveredTerrainCell,
                  openingQueryCache,
                ),
                floorRotationIndex * (Math.PI / 2),
              )
            if (tool === 'prop' && !isUnifiedOpeningMode && !isUnifiedSurfaceMode && selectedPropAsset && hoveredPoint)
              return applyFloorRotation(
                getPropPlacement(
                  selectedPropAsset,
                  hoveredPoint,
                  paintedCells,
                  hoveredSurfaceHit,
                  mapMode,
                  outdoorTerrainHeights,
                  hoveredRay,
                  hoveredTerrainCell,
                  openingQueryCache,
                ),
                floorRotationIndex * (Math.PI / 2),
              )
            if (tool === 'character' && selectedCharacterAsset && hoveredPoint)
              return applyFloorRotation(
                getPropPlacement(
                  selectedCharacterAsset,
                  hoveredPoint,
                  paintedCells,
                  hoveredSurfaceHit,
                  mapMode,
                  outdoorTerrainHeights,
                  hoveredRay,
                  hoveredTerrainCell,
                  openingQueryCache,
                ),
                floorRotationIndex * (Math.PI / 2),
              )
            if (
              (tool === 'opening' || isUnifiedOpeningMode) &&
              selectedOpeningAsset &&
              hoveredPoint &&
              isFloorOpeningMode
            )
              return applyFloorRotation(
                getPropPlacement(
                  selectedOpeningAsset,
                  hoveredPoint,
                  paintedCells,
                  hoveredSurfaceHit,
                  mapMode,
                  outdoorTerrainHeights,
                  hoveredRay,
                  hoveredTerrainCell,
                  openingQueryCache,
                ),
                floorRotationIndex * (Math.PI / 2),
              )
            return null
          })()}
          propAssetId={
            pickedUpAssetId
              ? pickedUpAssetId
            : tool === 'prop' && !isUnifiedSurfaceMode && !isUnifiedOpeningMode
              ? selectedPropAssetId
            : tool === 'character'
                ? selectedCharacterAssetId
              : (tool === 'opening' || isUnifiedOpeningMode) &&
                 isFloorOpeningMode
                ? selectedOpeningAssetId
                : null
          }
          propObjectProps={pickedUpObject?.props ?? null}
          openingPlacement={
            (tool === 'opening' || isUnifiedOpeningMode) ? wallConnectionPlacement : null
          }
          floorVariantAssetId={isFloorVariantMode ? selectedFloorBrushAssetId : null}
          openingAssetId={
            (tool === 'opening' || isUnifiedOpeningMode) &&
            wallConnectionMode === 'door' &&
            !isFloorOpeningMode
              ? selectedOpeningAssetId
              : null
          }
          wallConnectionMode={wallConnectionMode}
          wallConnectionRemovable={Boolean(hoveredWallConnection)}
          wallFlipped={wallFlipped}
          hoveredOpenWallKey={activeHoveredOpenWallKey}
          openPassageBrushWallKeys={openPassageBrushWallKeys}
          eligibleOpenWallKeys={eligibleOpenPassageWallKeys}
          paintedCells={paintedCells}
          rooms={rooms}
          floorTileAssetIds={floorTileAssetIds}
          globalWallAssetId={globalWallAssetId}
          globalFloorAssetId={globalFloorAssetId}
          mapMode={mapMode}
          outdoorTerrainHeights={outdoorTerrainHeights}
        />
      )}
    </group>
  )
}

function HoverPreview({
  hoveredCell,
  hoveredPoint,
  previewCells,
  roomPaintPreviewPaths,
  roomDraftPreviewPoints,
  roomDraftPreviewValid,
  strokeMode,
  propPlacement,
  propAssetId,
  propObjectProps,
  openingPlacement,
  floorVariantAssetId,
  openingAssetId,
  wallConnectionMode,
  wallConnectionRemovable,
  wallFlipped,
  hoveredOpenWallKey,
  openPassageBrushWallKeys,
  eligibleOpenWallKeys,
  paintedCells,
  rooms,
  floorTileAssetIds,
  globalWallAssetId,
  globalFloorAssetId,
  mapMode,
  outdoorTerrainHeights,
}: {
  hoveredCell: SnappedGridPosition | null
  hoveredPoint: { x: number; y: number; z: number } | null
  previewCells: GridCell[]
  roomPaintPreviewPaths: readonly (readonly (readonly [number, number])[])[]
  roomDraftPreviewPoints: readonly (readonly [number, number])[] | null
  roomDraftPreviewValid: boolean
  strokeMode: 'paint' | 'erase' | null
  propPlacement: PropPlacement | null
  propAssetId: string | null
  propObjectProps: Record<string, unknown> | null
  openingPlacement: OpeningPlacement | SplineWallOpeningPlacement | null
  floorVariantAssetId: string | null
  openingAssetId: string | null
  wallConnectionMode: WallConnectionMode
  wallConnectionRemovable: boolean
  wallFlipped: boolean
  hoveredOpenWallKey: string | null
  openPassageBrushWallKeys: string[]
  eligibleOpenWallKeys: Set<string>
  paintedCells: Record<string, PaintedCellRecord>
  rooms: Record<string, Room>
  floorTileAssetIds: Record<string, string>
  globalWallAssetId: string | null
  globalFloorAssetId: string | null
  mapMode: MapMode
  outdoorTerrainHeights: OutdoorTerrainHeightfield
}) {
  // Prop-style preview, including floor-connected openings
  if (propAssetId) {
    if (!hoveredCell || !hoveredPoint) return null
    const previewAsset = propAssetId ? getContentPackAssetById(propAssetId) : null
    if (previewAsset?.metadata?.connectsTo === 'FREE' && !propPlacement) {
      return null
    }

    const position = propPlacement?.position ?? [
      hoveredCell.position[0],
      mapMode === 'outdoor'
        ? sampleOutdoorTerrainHeight(outdoorTerrainHeights, hoveredCell.position[0], hoveredCell.position[2])
        : 0,
      hoveredCell.position[2],
    ]
    const rotation = propPlacement?.rotation ?? [0, 0, 0]
    const previewScale = propObjectProps ? getObjectInstanceScale(propObjectProps) : 1
    const previewTint = propObjectProps ? getObjectTintColor(propObjectProps) : null

    return (
      <group position={position} rotation={rotation} scale={previewScale}>
        <ContentPackInstance
          assetId={propAssetId}
          variant="prop"
          objectProps={propObjectProps ?? undefined}
          tint={previewTint ?? undefined}
        />
      </group>
    )
  }

  if (floorVariantAssetId) {
    if (!hoveredCell || !paintedCells[hoveredCell.key]) {
      return null
    }

    const previewPlacement = createFloorSurfacePlacement(hoveredCell.key, floorVariantAssetId)
    if (!previewPlacement) {
      return null
    }

    const effectiveFloorAssetId = resolveEffectiveFloorAssetIdForCellKey(
      hoveredCell.key,
      paintedCells,
      rooms,
      globalFloorAssetId,
      floorTileAssetIds,
    )
    const placementValid = isFloorSurfacePlacementValid(hoveredCell.key, floorVariantAssetId, paintedCells)

    return (
      <group position={previewPlacement.position}>
        <ContentPackInstance
          assetId={floorVariantAssetId}
          variant="floor"
          variantKey={previewPlacement.anchorCellKey}
          tint={
            !placementValid
              ? '#ef4444'
              : effectiveFloorAssetId === floorVariantAssetId
                ? '#22c55e'
                : '#7dd3fc'
          }
          tintOpacity={0.3}
        />
      </group>
    )
  }

  if (openingPlacement || openingAssetId || hoveredOpenWallKey || openPassageBrushWallKeys.length > 0) {
    if (wallConnectionMode === 'open') {
      return (
        <group>
          {openPassageBrushWallKeys.map((wallKey) => (
            <WallSegmentHighlight
              key={wallKey}
              wallKey={wallKey}
              assetId={getWallAssetIdForWallKey(
                wallKey,
                paintedCells,
                rooms,
                globalWallAssetId,
              )}
              color={OPEN_WALL_BRUSH_COLOR}
              opacity={0.34}
            />
          ))}
          {hoveredOpenWallKey &&
            eligibleOpenWallKeys.has(hoveredOpenWallKey) &&
            !openPassageBrushWallKeys.includes(hoveredOpenWallKey) && (
            <WallSegmentHighlight
              key={hoveredOpenWallKey}
              wallKey={hoveredOpenWallKey}
              assetId={getWallAssetIdForWallKey(
                hoveredOpenWallKey,
                paintedCells,
                rooms,
                globalWallAssetId,
              )}
              color={OPEN_WALL_HOVER_COLOR}
              opacity={0.24}
            />
          )}
        </group>
      )
    }

    if (!hoveredPoint || !openingPlacement) return null

    const { position, valid } = openingPlacement
    const rotation: [number, number, number] = wallFlipped
      ? [openingPlacement.rotation[0], openingPlacement.rotation[1] + Math.PI, openingPlacement.rotation[2]]
      : openingPlacement.rotation

    if (wallConnectionMode === 'wall') {
      const previewWidth = openingPlacement.spanWorldWidth
      return (
        <mesh position={position} rotation={rotation}>
          <boxGeometry args={[previewWidth * 0.95, 2.2, 0.1]} />
          <meshBasicMaterial
            color={valid && wallConnectionRemovable ? '#f59e0b' : '#ef4444'}
            transparent
            opacity={0.28}
          />
        </mesh>
      )
    }

    if (!valid) {
      return (
        <group position={position} rotation={rotation}>
          <ContentPackInstance
            assetId={openingAssetId}
            variant="wall"
            tint="#ef4444"
          />
        </group>
      )
    }

    return (
      <group position={position} rotation={rotation}>
        <ContentPackInstance
          assetId={openingAssetId}
          variant="wall"
        />
      </group>
    )
  }

  if (roomDraftPreviewPoints) {
    return (
      <RoomDraftFootprintPreview
        points={roomDraftPreviewPoints}
        color={roomDraftPreviewValid ? '#7dd3fc' : '#f87171'}
        opacity={0.24}
      />
    )
  }

  if (roomPaintPreviewPaths.length > 0) {
    return (
      <group>
        {roomPaintPreviewPaths.map((points, index) => (
          <RoomDraftFootprintPreview
            key={index}
            points={points}
            color="#7dd3fc"
            opacity={0.22}
          />
        ))}
      </group>
    )
  }

  const color =
    strokeMode === 'erase' ? '#f87171' : strokeMode === 'paint' ? '#7dd3fc' : '#34d399'
  const opacity = strokeMode ? 0.35 : 0.2

  return (
    <group>
      {previewCells.map((cell) => {
        const key = getCellKey(cell)
        const position = cellToWorldPosition(cell)
        const terrainY = mapMode === 'outdoor'
          ? sampleOutdoorTerrainHeight(outdoorTerrainHeights, position[0], position[2])
          : -0.03

        return (
          <mesh key={key} position={[position[0], terrainY - 0.03, position[2]]}>
            <boxGeometry args={[GRID_SIZE * 0.98, 0.06, GRID_SIZE * 0.98]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        )
      })}
    </group>
  )
}

function RoomDraftFootprintPreview({
  points,
  color,
  opacity,
}: {
  points: readonly (readonly [number, number])[]
  color: string
  opacity: number
}) {
  const fillGeometry = useMemo(() => {
    if (points.length < 3) {
      return null
    }

    const shape = new THREE.Shape()
    const [firstPoint, ...rest] = points
    shape.moveTo(firstPoint![0], firstPoint![1])
    rest.forEach((point) => {
      shape.lineTo(point[0], point[1])
    })
    shape.closePath()

    const geometry = new THREE.ShapeGeometry(shape)
    geometry.rotateX(Math.PI / 2)
    geometry.translate(0, 0.02, 0)
    return geometry
  }, [points])
  const outlinePositions = useMemo(() => {
    if (points.length === 0) {
      return new Float32Array()
    }

    const closedPoints = [...points, points[0]!]
    return new Float32Array(closedPoints.flatMap((point) => [point[0], 0.03, point[1]]))
  }, [points])

  useEffect(() => () => {
    fillGeometry?.dispose()
  }, [fillGeometry])

  if (!fillGeometry) {
    return null
  }

  return (
    <group>
      <mesh geometry={fillGeometry}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {outlinePositions.length > 0 ? (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[outlinePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#bae6fd" transparent opacity={0.9} />
        </line>
      ) : null}
    </group>
  )
}

function filterStrokeCells(
  cells: GridCell[],
  paintedCells: Record<string, PaintedCellRecord>,
  mode: 'paint' | 'erase',
  includeExistingPainted = false,
) {
  return cells.filter((cell) =>
    mode === 'paint'
      ? includeExistingPainted || !paintedCells[getCellKey(cell)]
      : Boolean(paintedCells[getCellKey(cell)]),
  )
}

function RenderBatchChunkOverlay({
  size,
  activeChunkKeys,
}: {
  size: number
  activeChunkKeys: readonly string[]
}) {
  const lineGeometry = useMemo(() => {
    const halfSize = size / 2
    const chunkWorldSize = GRID_SIZE * DEFAULT_RENDER_BATCH_CHUNK_SIZE
    const positions: number[] = []
    const minIndex = Math.ceil(-halfSize / chunkWorldSize)
    const maxIndex = Math.floor(halfSize / chunkWorldSize)

    for (let index = minIndex; index <= maxIndex; index += 1) {
      const offset = index * chunkWorldSize
      positions.push(offset, 0.035, -halfSize, offset, 0.035, halfSize)
      positions.push(-halfSize, 0.035, offset, halfSize, 0.035, offset)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    return geometry
  }, [size])

  useLayoutEffect(() => () => {
    lineGeometry.dispose()
  }, [lineGeometry])

  return (
    <group renderOrder={6}>
      <lineSegments geometry={lineGeometry} frustumCulled={false}>
        <lineBasicMaterial color="#f59e0b" transparent opacity={0.5} depthTest={false} />
      </lineSegments>
      {activeChunkKeys.map((chunkKey) => {
        const [chunkXString, chunkZString] = chunkKey.split(':')
        const chunkX = Number.parseInt(chunkXString ?? '', 10)
        const chunkZ = Number.parseInt(chunkZString ?? '', 10)
        if (Number.isNaN(chunkX) || Number.isNaN(chunkZ)) {
          return null
        }

        const chunkWorldSize = GRID_SIZE * DEFAULT_RENDER_BATCH_CHUNK_SIZE
        const centerX = chunkX * chunkWorldSize + chunkWorldSize / 2
        const centerZ = chunkZ * chunkWorldSize + chunkWorldSize / 2

        return (
          <mesh
            key={chunkKey}
            position={[centerX, 0.028, centerZ]}
            rotation={[-Math.PI / 2, 0, 0]}
            renderOrder={5}
            frustumCulled={false}
          >
            <planeGeometry args={[chunkWorldSize * 0.98, chunkWorldSize * 0.98]} />
            <meshBasicMaterial color="#f59e0b" transparent opacity={0.08} depthWrite={false} depthTest={false} />
          </mesh>
        )
      })}
    </group>
  )
}

type PropPlacement = {
  connector: PropConnector
  direction: 'north' | 'south' | 'east' | 'west' | null
  cell: GridCell
  anchorKey: string | null
  supportCellKey: string
  position: [number, number, number]
  rotation: [number, number, number]
  parentObjectId: string | null
  localPosition: [number, number, number] | null
  localRotation: [number, number, number] | null
}

type PlacementSurfaceHit = {
  objectId: string
  cell: GridCell
  supportCellKey: string
  position: [number, number, number]
}

const WALL_CONNECTOR_DIRECTIONS: Array<{
  name: 'north' | 'south' | 'east' | 'west'
  delta: GridCell
  rotation: [number, number, number]
}> = [
  { name: 'north', delta: [0, 1], rotation: [0, Math.PI, 0] },
  { name: 'south', delta: [0, -1], rotation: [0, 0, 0] },
  { name: 'east', delta: [1, 0], rotation: [0, -Math.PI / 2, 0] },
  { name: 'west', delta: [-1, 0], rotation: [0, Math.PI / 2, 0] },
]

const OPEN_WALL_HOVER_COLOR = '#f59e0b'
const OPEN_WALL_BRUSH_COLOR = '#ef4444'
const OPEN_WALL_HITBOX_WIDTH = GRID_SIZE * 1.08
const OPEN_WALL_HITBOX_HEIGHT = 3.8
const OPEN_WALL_HITBOX_DEPTH = GRID_SIZE * 0.7

function applyFloorRotation(
  placement: PropPlacement | null,
  yRotation: number,
): PropPlacement | null {
  if (!placement || (placement.connector !== 'FLOOR' && placement.connector !== 'FREE')) return placement
  return { ...placement, rotation: [0, yRotation, 0] }
}

function findPlacementSurfaceHit(
  intersections: THREE.Intersection[],
  paintedCells: Record<string, PaintedCellRecord>,
  placedObjects: Record<string, DungeonObjectRecord>,
  mapMode: MapMode,
): PlacementSurfaceHit | null {
  for (const intersection of intersections) {
    const objectId = raycastObjectId(intersection.object)
    if (!objectId) {
      continue
    }

    const placedObject = placedObjects[objectId]
    if (!placedObject) {
      continue
    }
    const supportCellKey = placedObject.supportCellKey ?? getCellKey(placedObject.cell)
    if (mapMode !== 'outdoor' && !paintedCells[supportCellKey]) {
      continue
    }

    const asset = placedObject.assetId ? getContentPackAssetById(placedObject.assetId) : null
    if (!asset?.metadata?.propSurface) {
      continue
    }

    const faceNormal = intersection.face?.normal.clone()
    if (!faceNormal) {
      continue
    }

    const worldNormal = faceNormal.transformDirection(intersection.object.matrixWorld)
    if (worldNormal.y < 0.65) {
      continue
    }

    return {
      objectId,
      cell: placedObject.cell,
      supportCellKey,
      position: [
        intersection.point.x,
        intersection.point.y,
        intersection.point.z,
      ],
    }
  }

  return null
}

function getNestedLocalTransform(
  placement: PropPlacement,
  placedObjects: Record<string, DungeonObjectRecord>,
) {
  if (!placement.parentObjectId) {
    return {
      localPosition: placement.localPosition,
      localRotation: placement.localRotation,
    }
  }

  const parentObject = placedObjects[placement.parentObjectId]
  if (!parentObject) {
    return {
      localPosition: null,
      localRotation: null,
    }
  }

  const parentPosition = new THREE.Vector3(...parentObject.position)
  const parentQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...parentObject.rotation))
  const localPosition = new THREE.Vector3(...placement.position)
    .sub(parentPosition)
    .applyQuaternion(parentQuaternion.clone().invert())
  const worldQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation))
  const localEuler = new THREE.Euler().setFromQuaternion(
    parentQuaternion.clone().invert().multiply(worldQuaternion),
  )

  return {
    localPosition: localPosition.toArray() as PropPlacement['localPosition'],
    localRotation: [localEuler.x, localEuler.y, localEuler.z] as PropPlacement['localRotation'],
  }
}

function findOutdoorTerrainHit(intersections: THREE.Intersection[]) {
  for (const intersection of intersections) {
    let current: THREE.Object3D | null = intersection.object
    while (current) {
      if (current.userData.outdoorTerrainSurface === true) {
        const terrainCell = current.userData.outdoorTerrainCell
        const cell =
          Array.isArray(terrainCell) &&
          terrainCell.length === 2 &&
          typeof terrainCell[0] === 'number' &&
          typeof terrainCell[1] === 'number'
            ? [terrainCell[0], terrainCell[1]] as GridCell
            : null
        return {
          point: intersection.point.clone(),
          cell,
        }
      }
      current = current.parent
    }
  }

  return null
}

function areGridCellsEqual(left: GridCell | null, right: GridCell | null) {
  return (
    left === right ||
    (
      left !== null &&
      right !== null &&
      left[0] === right[0] &&
      left[1] === right[1]
    )
  )
}

function areHoverPointsEqual(
  left: { x: number; y: number; z: number } | null,
  right: { x: number; y: number; z: number } | null,
) {
  return (
    left === right ||
    (
      left !== null &&
      right !== null &&
      left.x === right.x &&
      left.y === right.y &&
      left.z === right.z
    )
  )
}

function areHoverRaysEqual(
  left: {
    origin: [number, number, number]
    direction: [number, number, number]
  } | null,
  right: {
    origin: [number, number, number]
    direction: [number, number, number]
  } | null,
) {
  return (
    left === right ||
    (
      left !== null &&
      right !== null &&
      left.origin[0] === right.origin[0] &&
      left.origin[1] === right.origin[1] &&
      left.origin[2] === right.origin[2] &&
      left.direction[0] === right.direction[0] &&
      left.direction[1] === right.direction[1] &&
      left.direction[2] === right.direction[2]
    )
  )
}

function arePlacementSurfaceHitsEqual(
  left: PlacementSurfaceHit | null,
  right: PlacementSurfaceHit | null,
) {
  return (
    left === right ||
    (
      left !== null &&
      right !== null &&
      left.objectId === right.objectId &&
      left.supportCellKey === right.supportCellKey &&
      areGridCellsEqual(left.cell, right.cell) &&
      left.position[0] === right.position[0] &&
      left.position[1] === right.position[1] &&
      left.position[2] === right.position[2]
    )
  )
}

function areSnappedGridPositionsEqual(
  left: SnappedGridPosition | null,
  right: SnappedGridPosition | null,
) {
  return (
    left === right ||
    (
      left !== null &&
      right !== null &&
      left.key === right.key &&
      areGridCellsEqual(left.cell, right.cell) &&
      left.position[0] === right.position[0] &&
      left.position[1] === right.position[1] &&
      left.position[2] === right.position[2]
    )
  )
}

function raycastObjectId(object: THREE.Object3D | null) {
  let current = object

  while (current) {
    const objectId = current.userData.objectId
    if (typeof objectId === 'string') {
      return objectId
    }
    current = current.parent
  }

  return null
}

function getPropPlacement(
  asset: ContentPackAsset,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  surfaceHit: PlacementSurfaceHit | null,
  mapMode: MapMode,
  outdoorTerrainHeights: OutdoorTerrainHeightfield,
  cursorRay?: {
    origin: [number, number, number]
    direction: [number, number, number]
  } | null,
  terrainCellOverride?: GridCell | null,
  wallQueryCache?: ReturnType<typeof createSplineWallQueryCache> | null,
): PropPlacement | null {
  // Use new placement system if asset has new metadata features
  // OR if it uses new ConnectsTo values (WALL, SURFACE, or arrays)
  const hasNewMetadata = 
    asset.metadata?.connectors || 
    asset.metadata?.snapsTo || 
    (asset.metadata?.connectsTo && (
      Array.isArray(asset.metadata.connectsTo) || 
      asset.metadata.connectsTo === 'SURFACE' ||
      asset.metadata.connectsTo === 'WALL'
    ))
  
  if (hasNewMetadata) {
    const snapResult = calculatePropSnapPosition(
      asset,
      point,
      paintedCells,
      surfaceHit ? {
        position: surfaceHit.position,
        objectId: surfaceHit.objectId,
        cell: surfaceHit.cell,
      } : null,
      cursorRay,
      mapMode === 'outdoor',
      mapMode === 'outdoor' ? outdoorTerrainHeights : undefined,
      terrainCellOverride ?? undefined,
      wallQueryCache,
    )
    
    if (!snapResult) {
      return null
    }
    
    // Convert to PropPlacement format
     return {
      connector:
        snapResult.connector.type === 'WALL'
          ? 'WALL'
          : snapResult.connector.type === 'SURFACE'
            ? 'FREE'
            : 'FLOOR',
      direction: null,
      cell: snapResult.cell,
      anchorKey: snapResult.cellKey,
      supportCellKey: snapResult.cellKey,
      position: snapResult.position as [number, number, number],
      rotation: snapResult.rotation as [number, number, number],
      parentObjectId: snapResult.parentObjectId,
      localPosition: snapResult.localPosition as [number, number, number] | null,
      localRotation: snapResult.localRotation as [number, number, number] | null,
    }
  }
  
  // Legacy placement logic for backward compatibility
  const snapped = terrainCellOverride
    ? {
        cell: terrainCellOverride,
        key: getCellKey(terrainCellOverride),
        position: cellToWorldPosition(terrainCellOverride),
      }
    : snapWorldPointToGrid(point)
  const connectsTo = asset.metadata?.connectsTo ?? 'FLOOR'
  
  // For legacy logic, we only handle single PropConnector values
  const connector: PropConnector = 
    Array.isArray(connectsTo) ? 'FLOOR' :  // Default arrays to FLOOR for legacy
    connectsTo === 'SURFACE' ? 'FLOOR' :   // SURFACE not supported in legacy
    connectsTo

  if (connector === 'FREE') {
    if (surfaceHit) {
      return {
        connector,
        direction: null,
        cell: surfaceHit.cell,
        anchorKey: null,
        supportCellKey: surfaceHit.supportCellKey,
        position: surfaceHit.position,
        rotation: [0, 0, 0],
        parentObjectId: surfaceHit.objectId,
        localPosition: null,
        localRotation: [0, 0, 0],
      }
    }

    if (mapMode !== 'outdoor' && !paintedCells[snapped.key]) {
      return null
    }

    return {
      connector,
      direction: null,
      cell: snapped.cell,
      anchorKey: null,
      supportCellKey: snapped.key,
      position: [
        point.x,
        mapMode === 'outdoor'
          ? sampleOutdoorTerrainHeight(
              outdoorTerrainHeights,
              terrainCellOverride ? snapped.position[0] : point.x,
              terrainCellOverride ? snapped.position[2] : point.z,
            )
          : 0,
        point.z,
      ],
      rotation: [0, 0, 0],
      parentObjectId: null,
      localPosition: null,
      localRotation: null,
    }
  }

  if (mapMode !== 'outdoor' && !paintedCells[snapped.key]) {
    return null
  }

  const cellCenter = cellToWorldPosition(snapped.cell)

  if (connector === 'FLOOR') {
    return {
      connector,
      direction: null,
      cell: snapped.cell,
      anchorKey: `${snapped.key}:floor`,
      supportCellKey: snapped.key,
      position: [
        cellCenter[0],
        mapMode === 'outdoor'
          ? sampleOutdoorTerrainHeight(outdoorTerrainHeights, cellCenter[0], cellCenter[2])
          : 0,
        cellCenter[2],
      ],
      rotation: [0, 0, 0],
      parentObjectId: null,
      localPosition: null,
      localRotation: null,
    }
  }

  if (mapMode === 'outdoor') {
    return null
  }

  const localX = point.x - cellCenter[0]
  const localZ = point.z - cellCenter[2]
  const rankedDirections = [...WALL_CONNECTOR_DIRECTIONS].sort((left, right) => {
    const leftDistance = Math.abs(localX - left.delta[0] * (GRID_SIZE * 0.5)) +
      Math.abs(localZ - left.delta[1] * (GRID_SIZE * 0.5))
    const rightDistance = Math.abs(localX - right.delta[0] * (GRID_SIZE * 0.5)) +
      Math.abs(localZ - right.delta[1] * (GRID_SIZE * 0.5))

    return leftDistance - rightDistance
  })

  const matchingDirection = rankedDirections.find(({ delta }) => {
    const neighbor: GridCell = [snapped.cell[0] + delta[0], snapped.cell[1] + delta[1]]
    return isWallBoundary(snapped.cell, neighbor, paintedCells)
  })

  if (!matchingDirection) {
    return null
  }

  return {
    connector,
    direction: matchingDirection.name,
    cell: snapped.cell,
    anchorKey: `${snapped.key}:${matchingDirection.name}`,
    supportCellKey: snapped.key,
    position: [
      cellCenter[0] + matchingDirection.delta[0] * (GRID_SIZE * 0.5),
      0,
      cellCenter[2] + matchingDirection.delta[1] * (GRID_SIZE * 0.5),
    ],
    rotation: matchingDirection.rotation,
    parentObjectId: null,
    localPosition: null,
    localRotation: null,
  }
}

type OpeningPlacement = {
  wallKey: string
  direction: 'north' | 'south' | 'east' | 'west'
  cell: GridCell
  width: 1 | 2 | 3
  spanWorldWidth: number
  position: [number, number, number]
  rotation: [number, number, number]
  valid: boolean
  segmentId?: string | null
  segmentStartRatio?: number | null
  segmentEndRatio?: number | null
}

function getOpeningPlacement(
  width: 1 | 2 | 3,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  requireInterRoom = false,
  splineWallGraph?: SplineWallGraph | null,
  openingQueryCache?: SplineWallQueryCache | null,
  openingAssetId?: string | null,
): OpeningPlacement | null {
  if (splineWallGraph && openingQueryCache) {
    const splinePlacement = buildSplineWallOpeningPlacement(
      { x: point.x, z: point.z },
      splineWallGraph,
      openingQueryCache,
      paintedCells,
      openingAssetId ?? null,
    )
    if (splinePlacement) {
      const [cellX, cellZ, direction] = splinePlacement.wallKey.split(':')
      const parsedCell: GridCell = [Number.parseInt(cellX ?? '', 10), Number.parseInt(cellZ ?? '', 10)]
      const directionEntry = WALL_CONNECTOR_DIRECTIONS.find((entry) => entry.name === direction)
      const neighbor: GridCell = directionEntry
        ? [parsedCell[0] + directionEntry.delta[0], parsedCell[1] + directionEntry.delta[1]]
        : parsedCell
      const validInterRoom = !requireInterRoom ||
        (directionEntry != null &&
          paintedCells[getCellKey(parsedCell)] != null &&
          isInterRoomBoundary(parsedCell, neighbor, paintedCells))

      if (directionEntry) {
        return {
          wallKey: splinePlacement.wallKey,
          direction: directionEntry.name,
          cell: parsedCell,
          width,
          spanWorldWidth: splinePlacement.spanWorldWidth,
          position: splinePlacement.position,
          rotation: splinePlacement.rotation,
          valid: splinePlacement.valid && validInterRoom,
          segmentId: splinePlacement.segmentId,
          segmentStartRatio: splinePlacement.segmentStartRatio,
          segmentEndRatio: splinePlacement.segmentEndRatio,
        }
      }
    }
  }

  const snapped = snapWorldPointToGrid(point)
  if (!paintedCells[snapped.key]) return null

  const cellCenter = cellToWorldPosition(snapped.cell)
  const localX = point.x - cellCenter[0]
  const localZ = point.z - cellCenter[2]
  const rankedDirections = [...WALL_CONNECTOR_DIRECTIONS].sort((a, b) => {
    const da =
      Math.abs(localX - a.delta[0] * (GRID_SIZE * 0.5)) +
      Math.abs(localZ - a.delta[1] * (GRID_SIZE * 0.5))
    const db =
      Math.abs(localX - b.delta[0] * (GRID_SIZE * 0.5)) +
      Math.abs(localZ - b.delta[1] * (GRID_SIZE * 0.5))
    return da - db
  })

  const dir = rankedDirections[0]
  const neighbor: GridCell = [snapped.cell[0] + dir.delta[0], snapped.cell[1] + dir.delta[1]]
  const isActualWall = isWallBoundary(snapped.cell, neighbor, paintedCells)
  const wallKey = `${getCellKey(snapped.cell)}:${dir.name}`
  const segments = getOpeningSegments(wallKey, width)

  // Validate all segments are actual wall boundaries (exterior or inter-room)
  const valid =
    isActualWall &&
    (!requireInterRoom || isInterRoomBoundary(snapped.cell, neighbor, paintedCells)) &&
    segments.every((segKey) => {
      const parts = segKey.split(':')
      const cx = parseInt(parts[0], 10)
      const cz = parseInt(parts[1], 10)
      const segDir = WALL_CONNECTOR_DIRECTIONS.find((d) => d.name === parts[2])
      if (!segDir) return false
      const cell: GridCell = [cx, cz]
      if (!paintedCells[getCellKey(cell)]) return false
      const n: GridCell = [cx + segDir.delta[0], cz + segDir.delta[1]]
      return isWallBoundary(cell, n, paintedCells) &&
        (!requireInterRoom || isInterRoomBoundary(cell, n, paintedCells))
    })

  return {
    wallKey,
    direction: dir.name,
    cell: snapped.cell,
    width,
    spanWorldWidth: width * GRID_SIZE,
    position: [
      cellCenter[0] + dir.delta[0] * (GRID_SIZE * 0.5),
      0,
      cellCenter[2] + dir.delta[1] * (GRID_SIZE * 0.5),
    ],
    rotation: dir.rotation,
    valid,
  }
}

function getWallConnectionPlacement(
  mode: WallConnectionMode,
  asset: ContentPackAsset | null,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  splineWallGraph?: SplineWallGraph | null,
  openingQueryCache?: SplineWallQueryCache | null,
) {
  if (mode === 'door') {
    if (!asset) {
      return null
    }

    const width: 1 | 2 | 3 =
      asset.metadata?.openingWidth === 2 ? 2 : asset.metadata?.openingWidth === 3 ? 3 : 1
    return getOpeningPlacement(width, point, paintedCells, false, splineWallGraph, openingQueryCache, asset.id)
  }

  return getOpeningPlacement(1, point, paintedCells, true, splineWallGraph, openingQueryCache, null)
}

function getWallAssetIdForWallKey(
  wallKey: string,
  paintedCells: Record<string, PaintedCellRecord>,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
) {
  return getInheritedWallAssetIdForWallKey(
    wallKey,
    paintedCells,
    rooms,
    globalWallAssetId,
  )
}

function WallSegmentHighlight({
  wallKey,
  assetId,
  color,
  opacity,
}: {
  wallKey: string
  assetId: string | null
  color: string
  opacity: number
}) {
  const position = wallKeyToWorldPosition(wallKey)
  if (!position) return null

  return (
    <group position={position.position} rotation={position.rotation}>
      <ContentPackInstance
        key={`${assetId ?? 'null'}:${wallKey}`}
        assetId={assetId}
        variant="wall"
        variantKey={wallKey}
        tint={color}
        tintOpacity={opacity}
        overlayOnly
      />
    </group>
  )
}

function OpenPassageHitTargets({
  walls,
  onHoverWall,
  onClearHover,
  onStartBrush,
  onExtendBrush,
}: {
  walls: Array<{
    wallKey: string
    position: [number, number, number]
    rotation: [number, number, number]
  }>
  onHoverWall: (wallKey: string) => void
  onClearHover: () => void
  onStartBrush: (wallKey: string) => void
  onExtendBrush: (wallKey: string) => void
}) {
  return (
    <group>
      {walls.map((wall) => (
        <mesh
          key={wall.wallKey}
          position={[wall.position[0], OPEN_WALL_HITBOX_HEIGHT * 0.5, wall.position[2]]}
          rotation={wall.rotation}
          onPointerOver={(event) => {
            event.stopPropagation()
            onHoverWall(wall.wallKey)
          }}
          onPointerMove={(event) => {
            event.stopPropagation()
            onHoverWall(wall.wallKey)
          }}
          onPointerEnter={(event) => {
            event.stopPropagation()
            onExtendBrush(wall.wallKey)
          }}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.stopPropagation()
            onStartBrush(wall.wallKey)
          }}
          onPointerOut={(event) => {
            event.stopPropagation()
            onClearHover()
          }}
        >
          <boxGeometry args={[OPEN_WALL_HITBOX_WIDTH, OPEN_WALL_HITBOX_HEIGHT, OPEN_WALL_HITBOX_DEPTH]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}
