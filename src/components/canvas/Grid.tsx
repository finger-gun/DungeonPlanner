import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
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
import { getCanonicalInnerWallKey } from '../../store/manualWalls'
import { getOpeningSegments } from '../../store/openingSegments'
import { sampleOutdoorTerrainHeight, type OutdoorTerrainHeightfield } from '../../store/outdoorTerrain'
import {
  getCanonicalWallKey as getCanonicalWallKeyForGrid,
  getInheritedWallAssetIdForWallKey,
  getOppositeDirection,
  isInterRoomBoundary,
  isWallBoundary,
  wallKeyToWorldPosition,
} from '../../store/wallSegments'
import { triggerBuild } from '../../store/buildAnimations'
import { FloorGridOverlay } from './FloorGridOverlay'
import { ContentPackInstance } from './ContentPackInstance'
import { getRoomPreviewCells } from './gridPreview'
import { isPassiveGridMode, shouldRenderGridOverlay } from './gridMode'
import { getEligibleOpenPassageWallKey } from './openPassageInteraction'
import { extendOpenPassageBrush } from './openPassageBrush'
import { getOpeningToolMode } from './openingToolMode'
import { calculatePropSnapPosition } from './propPlacement'
import { supportsPlacementRotationShortcut } from '../../rotationShortcuts'
import {
  getRoomWallBrushAnchor,
  getRoomWallBrushTargets,
  type RoomWallBrushAnchor,
  type RoomWallEditTarget,
} from './roomWallBrush'

type GridProps = {
  size?: number
  playMode?: boolean
}

export function Grid({ size = 120, playMode = false }: GridProps) {
  const { snap } = useSnapToGrid()
  const raycaster = useRaycaster(0)
  const { gl, camera, scene, invalidate } = useThree()
  const surfaceRaycasterRef = useRef(new THREE.Raycaster())
  const surfacePointerRef = useRef(new THREE.Vector2())
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const blockedCells = useDungeonStore((state) => state.blockedCells)
  const outdoorTerrainStyleCells = useDungeonStore((state) => state.outdoorTerrainStyleCells)
  const outdoorTerrainHeights = useDungeonStore((state) => state.outdoorTerrainHeights)
  const outdoorBrushMode = useDungeonStore((state) => state.outdoorBrushMode)
  const outdoorTerrainSculptMode = useDungeonStore((state) => state.outdoorTerrainSculptMode)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const paintCells = useDungeonStore((state) => state.paintCells)
  const eraseCells = useDungeonStore((state) => state.eraseCells)
  const paintBlockedCells = useDungeonStore((state) => state.paintBlockedCells)
  const eraseBlockedCells = useDungeonStore((state) => state.eraseBlockedCells)
  const sculptOutdoorTerrain = useDungeonStore((state) => state.sculptOutdoorTerrain)
  const paintOutdoorTerrainStyleCells = useDungeonStore((state) => state.paintOutdoorTerrainStyleCells)
  const eraseOutdoorTerrainStyleCells = useDungeonStore((state) => state.eraseOutdoorTerrainStyleCells)
  const setFloorTileAsset = useDungeonStore((state) => state.setFloorTileAsset)
  const setWallSurfaceAsset = useDungeonStore((state) => state.setWallSurfaceAsset)
  const placeObject = useDungeonStore((state) => state.placeObject)
  const removeObjectAtCell = useDungeonStore((state) => state.removeObjectAtCell)
  const removeObject = useDungeonStore((state) => state.removeObject)
  const placeOpening = useDungeonStore((state) => state.placeOpening)
  const placeOpenPassages = useDungeonStore((state) => state.placeOpenPassages)
  const restoreOpenPassages = useDungeonStore((state) => state.restoreOpenPassages)
  const setInnerWallSegments = useDungeonStore((state) => state.setInnerWallSegments)
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const innerWalls = useDungeonStore((state) => state.innerWalls)
  const rooms = useDungeonStore((state) => state.rooms)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const assetBrowser = useDungeonStore((state) => state.assetBrowser)
  const outdoorOverpaintRegenerate = useDungeonStore((state) => state.outdoorOverpaintRegenerate)
  const surfaceBrushAssetIds = useDungeonStore((state) => state.surfaceBrushAssetIds)
  const floorTileAssetIds = useDungeonStore((state) => state.floorTileAssetIds)
  const wallSurfaceAssetIds = useDungeonStore((state) => state.wallSurfaceAssetIds)
  const setPaintingStrokeActive = useDungeonStore(
    (state) => state.setPaintingStrokeActive,
  )
  const isRoomResizeHandleActive = useDungeonStore((state) => state.isRoomResizeHandleActive)
  const selectRoom = useDungeonStore((state) => state.selectRoom)
  const tool = useDungeonStore((state) => state.tool)
  const showGrid = useDungeonStore((state) => state.showGrid)
  const selectedPropAssetId = useDungeonStore((state) => state.selectedAssetIds.prop)
  const selectedCharacterAssetId = useDungeonStore((state) => state.selectedAssetIds.player)
  const selectedOpeningAssetId = useDungeonStore((state) => state.selectedAssetIds.opening)
  const selectedFloorBrushAssetId = surfaceBrushAssetIds.floor
  const selectedWallBrushAssetId = surfaceBrushAssetIds.wall
  const globalWallAssetId = useDungeonStore((state) => state.selectedAssetIds.wall)
  const globalFloorAssetId = useDungeonStore((state) => state.selectedAssetIds.floor)
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
  const openingToolMode = getOpeningToolMode(
    wallConnectionMode,
    selectedOpeningAsset?.metadata,
  )
  const isUnifiedOpeningMode = tool === 'prop' && assetBrowser.category === 'openings'
  const isUnifiedSurfaceMode = tool === 'prop' && assetBrowser.category === 'surfaces'
  const isUnifiedFloorVariantMode = isUnifiedSurfaceMode && assetBrowser.subcategory !== 'walls'
  const isUnifiedWallVariantMode = isUnifiedSurfaceMode && assetBrowser.subcategory === 'walls'
  const isFloorOpeningMode =
    (tool === 'opening' || isUnifiedOpeningMode) &&
    wallConnectionMode === 'door' &&
    openingToolMode === 'floor-asset'
  const isWallOpeningMode =
    (tool === 'opening' || isUnifiedOpeningMode) &&
    wallConnectionMode === 'door' &&
    openingToolMode === 'wall-connection'
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
  const [hoveredOpenWallKey, setHoveredOpenWallKey] = useState<string | null>(null)
  const [openPassageBrushWallKeys, setOpenPassageBrushWallKeys] = useState<string[]>([])
  const [hoveredRoomWallEditTarget, setHoveredRoomWallEditTarget] = useState<RoomWallEditTarget | null>(null)
  const [roomWallBrushTargets, setRoomWallBrushTargets] = useState<RoomWallEditTarget[]>([])
  const [roomWallBrushMode, setRoomWallBrushMode] = useState<'paint' | 'erase' | null>(null)
  const strokeModeRef = useRef<'paint' | 'erase' | null>(null)
  const strokeStartRef = useRef<GridCell | null>(null)
  const strokeCurrentRef = useRef<GridCell | null>(null)
  const openPassageBrushActiveRef = useRef(false)
  const openPassageBrushWallKeysRef = useRef<string[]>([])
  const roomWallBrushActiveRef = useRef(false)
  const roomWallBrushModeRef = useRef<'paint' | 'erase' | null>(null)
  const roomWallBrushTargetsRef = useRef<RoomWallEditTarget[]>([])
  const roomWallBrushAnchorRef = useRef<RoomWallBrushAnchor | null>(null)
  const placementOrientationKey = `${selectedPropAssetId ?? ''}:${selectedCharacterAssetId ?? ''}:${selectedOpeningAssetId ?? ''}:${wallConnectionMode}`
  const [placementOrientation, setPlacementOrientation] = useState({
    key: placementOrientationKey,
    floorRotationIndex: 0,
    wallFlipped: false,
  })
  const floorRotationIndex =
    placementOrientation.key === placementOrientationKey
      ? placementOrientation.floorRotationIndex
      : 0
  const wallFlipped =
    placementOrientation.key === placementOrientationKey
      ? placementOrientation.wallFlipped
      : false

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

  // R key: rotates floor-connected assets; flips wall-connected openings 180°
  useEffect(() => {
    const supportsRotation = supportsPlacementRotationShortcut({
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
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setPlacementOrientation((current) => {
          const base =
            current.key === placementOrientationKey
              ? current
              : { key: placementOrientationKey, floorRotationIndex: 0, wallFlipped: false }

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
  }, [isFloorOpeningMode, isUnifiedOpeningMode, isUnifiedSurfaceMode, isWallOpeningMode, placementOrientationKey, tool])

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

  function updateStrokeState(
    mode: 'paint' | 'erase' | null,
    startCell: GridCell | null,
    currentCell: GridCell | null,
  ) {
    setPaintingStrokeActive(Boolean(mode))
    strokeModeRef.current = mode
    strokeStartRef.current = startCell
    strokeCurrentRef.current = currentCell
    setStrokeMode(mode)
    setStrokeStartCell(startCell)
    setStrokeCurrentCell(currentCell)
  }

  function updateOpenPassageBrushState(active: boolean, wallKeys: string[]) {
    openPassageBrushActiveRef.current = active
    openPassageBrushWallKeysRef.current = wallKeys
    setOpenPassageBrushWallKeys(wallKeys)
    setPaintingStrokeActive(active || roomWallBrushActiveRef.current || Boolean(strokeModeRef.current))
  }

  function updateRoomWallBrushState(
    active: boolean,
    mode: 'paint' | 'erase' | null,
    targets: RoomWallEditTarget[],
  ) {
    roomWallBrushActiveRef.current = active
    roomWallBrushModeRef.current = mode
    roomWallBrushTargetsRef.current = targets
    setRoomWallBrushTargets(targets)
    setRoomWallBrushMode(mode)
    setPaintingStrokeActive(active || openPassageBrushActiveRef.current || Boolean(strokeModeRef.current))
  }

  const previewCells = useMemo(() => {
    if (tool !== 'room' || roomEditMode !== 'rooms') {
      return []
    }

    if (mapMode === 'outdoor' && outdoorBrushMode === 'terrain-sculpt') {
      if (strokeStartCell && strokeCurrentCell && strokeMode) {
        return getRectangleCells(strokeStartCell, strokeCurrentCell)
      }

      return hoveredCell ? [hoveredCell.cell] : []
    }

    return getRoomPreviewCells({
      hoveredCell,
      paintedCells: roomBrushCells,
      strokeCurrentCell,
      strokeMode,
      strokeStartCell,
      suppressRoomPreview: isRoomResizeHandleActive,
      tool,
    })
  }, [
    hoveredCell,
    mapMode,
    outdoorBrushMode,
    roomEditMode,
    isRoomResizeHandleActive,
    roomBrushCells,
    strokeCurrentCell,
    strokeMode,
    strokeStartCell,
    tool,
  ])

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

    const cells =
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

    if (cells.length > 0) {
      if (mode === 'paint') {
        if (mapMode === 'outdoor') {
          if (outdoorBrushMode === 'terrain-style') {
            paintOutdoorTerrainStyleCells(cells)
          } else if (outdoorBrushMode === 'terrain-sculpt') {
            sculptOutdoorTerrain(cells, outdoorTerrainSculptMode)
          } else {
            paintBlockedCells(cells)
          }
        } else {
          paintCells(cells)
        }
        // Cascade FROM the stroke start corner TOWARD the release corner (opposite diagonal).
        // Tiles near where you first clicked appear first.
        triggerBuild(cells, startCell)
      } else {
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
      }

      invalidate()
    }

    updateStrokeState(null, null, null)
  })

  const endOpenPassageBrush = useEffectEvent(() => {
    if (!openPassageBrushActiveRef.current && openPassageBrushWallKeysRef.current.length === 0) {
      return
    }

    if (openPassageBrushWallKeysRef.current.length > 0) {
      placeOpenPassages(openPassageBrushWallKeysRef.current)
    }
    updateOpenPassageBrushState(false, [])
  })

  const endRoomWallBrush = useEffectEvent(() => {
    if (!roomWallBrushActiveRef.current || roomWallBrushTargetsRef.current.length === 0) {
      updateRoomWallBrushState(false, null, [])
      roomWallBrushAnchorRef.current = null
      return
    }

    const mode = roomWallBrushModeRef.current
    if (mode === 'paint') {
      const innerWallKeys = roomWallBrushTargetsRef.current
        .filter((target) => target.kind === 'inner')
        .map((target) => target.wallKey)
      const sharedWallKeys = roomWallBrushTargetsRef.current
        .filter((target) => target.kind === 'shared')
        .map((target) => target.wallKey)

      if (innerWallKeys.length > 0) {
        setInnerWallSegments(innerWallKeys, true)
      }
      if (sharedWallKeys.length > 0) {
        restoreOpenPassages(sharedWallKeys)
      }
    } else if (mode === 'erase') {
      const innerWallKeys = roomWallBrushTargetsRef.current
        .filter((target) => target.kind === 'inner')
        .map((target) => target.wallKey)
      const sharedWallKeys = roomWallBrushTargetsRef.current
        .filter((target) => target.kind === 'shared')
        .map((target) => target.wallKey)

      if (innerWallKeys.length > 0) {
        setInnerWallSegments(innerWallKeys, false)
      }
      if (sharedWallKeys.length > 0) {
        placeOpenPassages(sharedWallKeys)
      }
    }

    updateRoomWallBrushState(false, null, [])
    roomWallBrushAnchorRef.current = null
  })

  useEffect(() => {
    function handlePointerUp() {
      commitStroke()
      endOpenPassageBrush()
      endRoomWallBrush()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      openPassageBrushActiveRef.current = false
      openPassageBrushWallKeysRef.current = []
      roomWallBrushActiveRef.current = false
      roomWallBrushModeRef.current = null
      roomWallBrushTargetsRef.current = []
      roomWallBrushAnchorRef.current = null
      setHoveredOpenWallKey(null)
      setOpenPassageBrushWallKeys([])
      setHoveredRoomWallEditTarget(null)
      setRoomWallBrushTargets([])
      setRoomWallBrushMode(null)
      setPaintingStrokeActive(false)
    }
  }, [setPaintingStrokeActive])

  function getOutdoorTerrainHit(event: ThreeEvent<PointerEvent>) {
    if (mapMode !== 'outdoor') {
      return null
    }

    for (const intersection of event.intersections) {
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

  function getSnappedHoverCell(
    point: { x: number; y: number; z: number },
    terrainCell: GridCell | null,
  ): SnappedGridPosition {
    if (!terrainCell) {
      return snap(point)
    }

    return {
      cell: terrainCell,
      key: getCellKey(terrainCell),
      position: cellToWorldPosition(terrainCell),
    }
  }

  function updateHoveredCell(event: ThreeEvent<PointerEvent>) {
    const terrainHit = getOutdoorTerrainHit(event)
    const point = terrainHit?.point ?? raycaster.pointOnPlane(event)
    const snapped = getSnappedHoverCell(point, terrainHit?.cell ?? null)
    const hoveredOpenWallKey = isOpenWallBrushMode
      ? getEligibleOpenPassageWallKey(point, paintedCells, eligibleOpenPassageWallKeys)
      : null
    const hoveredRoomWallEditTarget = !roomWallBrushActiveRef.current && isRoomWallMode
      ? getRoomWallEditTarget(
          point,
          paintedCells,
          innerWalls,
          suppressedWallKeys,
          roomWallBrushModeRef.current ?? 'paint',
        )
      : null
    setHoveredCell(snapped)
    setHoveredPoint(point)
    setHoveredRay({
      origin: [event.ray.origin.x, event.ray.origin.y, event.ray.origin.z],
      direction: [event.ray.direction.x, event.ray.direction.y, event.ray.direction.z],
    })
    setHoveredTerrainCell(terrainHit?.cell ?? null)
    setHoveredSurfaceHit(resolvePlacementSurfaceHit(event.nativeEvent))
    setHoveredOpenWallKey(hoveredOpenWallKey)
    setHoveredRoomWallEditTarget(hoveredRoomWallEditTarget)

    if (openPassageBrushActiveRef.current && hoveredOpenWallKey) {
      placeOpenPassageWall(hoveredOpenWallKey)
    }
    invalidate()
    if (roomWallBrushActiveRef.current) {
      extendRoomWallBrush(point)
    }

    if (tool === 'room' && roomEditMode === 'rooms' && strokeModeRef.current) {
      updateStrokeState(
        strokeModeRef.current,
        strokeStartRef.current,
        snapped.cell,
      )
    }

  }

  function updateCursorPosOnly() {}

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

  function extendRoomWallBrush(point: { x: number; y: number; z: number }) {
    const anchor = roomWallBrushAnchorRef.current
    const mode = roomWallBrushModeRef.current
    if (!anchor || !mode) {
      return
    }

    const nextTargets = getRoomWallBrushTargets(
      anchor,
      point,
      paintedCells,
      innerWalls,
      suppressedWallKeys,
      mode,
    )
    if (
      nextTargets.length === roomWallBrushTargetsRef.current.length &&
      nextTargets.every((target, index) => {
        const current = roomWallBrushTargetsRef.current[index]
        return current?.wallKey === target.wallKey && current?.kind === target.kind
      })
    ) {
      return
    }

    updateRoomWallBrushState(
      true,
      mode,
      nextTargets,
    )
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    const terrainHit = getOutdoorTerrainHit(event)
    const point = terrainHit?.point ?? raycaster.pointOnPlane(event)
    const snapped = getSnappedHoverCell(point, terrainHit?.cell ?? null)
    const surfaceHit = resolvePlacementSurfaceHit(event.nativeEvent)
    const hoveredOpenWallKey = isOpenWallBrushMode
      ? getEligibleOpenPassageWallKey(point, paintedCells, eligibleOpenPassageWallKeys)
      : null
    const hoveredRoomWallEditTarget = isRoomWallMode
      ? getRoomWallEditTarget(
          point,
          paintedCells,
          innerWalls,
          suppressedWallKeys,
          event.button === 2 ? 'erase' : 'paint',
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
    setHoveredRoomWallEditTarget(hoveredRoomWallEditTarget)
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

      const openingPlacement = getWallConnectionPlacement(
        wallConnectionMode,
        activeOpeningAsset,
        point,
        paintedCells,
      )
      const hoveredConnection = openingPlacement
        ? findWallConnectionAtPlacement(openingPlacement, wallOpenings)
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
        wallKey: `${getCellKey(openingPlacement.cell)}:${openingPlacement.direction}`,
        width: openingPlacement.width,
        flipped: wallFlipped,
      })
      return
    }

    if ((tool === 'prop' && !isUnifiedOpeningMode && !isUnifiedSurfaceMode) || tool === 'character') {
      const activeAsset = tool === 'character' ? selectedCharacterAsset : selectedPropAsset
      const activeAssetId = tool === 'character' ? selectedCharacterAssetId : selectedPropAssetId
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
          )
        : null
      const propPlacement = applyFloorRotation(rawPlacement, floorRotationIndex * (Math.PI / 2))

      if (event.button === 2) {
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

      if (isUnifiedWallVariantMode || (tool === 'room' && roomEditMode === 'wall-variants')) {
        const wallPlacement = hoveredPoint
          ? getOpeningPlacement(1, hoveredPoint, paintedCells)
          : getOpeningPlacement(1, point, paintedCells)
        if (!wallPlacement?.valid) {
          return
        }

        const wallKey = `${getCellKey(wallPlacement.cell)}:${wallPlacement.direction}`
        if (event.button === 0) {
          setWallSurfaceAsset(wallKey, selectedWallBrushAssetId)
        } else if (event.button === 2) {
          setWallSurfaceAsset(wallKey, null)
        }
        return
      }

      if (tool !== 'room') {
        return
      }

      if (roomEditMode === 'walls') {
        if (event.button !== 0 && event.button !== 2) {
          return
        }
        if (!hoveredRoomWallEditTarget) {
          return
        }

        roomWallBrushAnchorRef.current = getRoomWallBrushAnchor(hoveredRoomWallEditTarget)
        if (!roomWallBrushAnchorRef.current) {
          return
        }
        updateRoomWallBrushState(
          true,
          event.button === 0 ? 'paint' : 'erase',
          [hoveredRoomWallEditTarget],
        )
        setHoveredRoomWallEditTarget(null)
        return
      }

      if (mapMode !== 'outdoor') {
        const hoveredRoomId = paintedCells[getCellKey(snapped.cell)]?.roomId ?? null

        if (event.button === 0 && hoveredRoomId) {
          selectRoom(hoveredRoomId)
          return
        }

        if (event.button === 0 && !hoveredRoomId) {
          selectRoom(null)
        }
      }
    }

    if (event.button !== 0 && event.button !== 2) {
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

  const isNavigationTool = isPassiveGridMode(tool, playMode)
  const renderGridOverlay = shouldRenderGridOverlay(showGrid, playMode)
  const wallConnectionPlacement = (tool === 'opening' || isUnifiedOpeningMode) && hoveredPoint
    ? getWallConnectionPlacement(
        wallConnectionMode,
        selectedOpeningAsset,
        hoveredPoint,
        paintedCells,
      )
    : null
  const hoveredWallConnection = wallConnectionPlacement
    ? findWallConnectionAtPlacement(wallConnectionPlacement, wallOpenings)
    : null
  const suppressedWallKeys = getSuppressedWallKeys(wallOpenings)
  const eligibleOpenPassageWalls = deriveEligibleOpenPassageWalls(paintedCells, wallOpenings)
  const eligibleOpenPassageWallKeys = new Set(eligibleOpenPassageWalls.map((wall) => wall.wallKey))
  const isFloorVariantMode = (tool === 'room' && roomEditMode === 'floor-variants') || isUnifiedFloorVariantMode
  const isWallVariantMode = (tool === 'room' && roomEditMode === 'wall-variants') || isUnifiedWallVariantMode
  const isRoomWallMode = tool === 'room' && roomEditMode === 'walls'
  const isOpenWallBrushMode =
    (tool === 'opening' || isUnifiedOpeningMode) &&
    wallConnectionMode === 'open' &&
    !isFloorOpeningMode
  const wallVariantPlacement = useMemo(
    () => (isWallVariantMode && hoveredPoint ? getOpeningPlacement(1, hoveredPoint, paintedCells) : null),
    [hoveredPoint, isWallVariantMode, paintedCells],
  )
  const activeHoveredOpenWallKey =
    hoveredOpenWallKey && eligibleOpenPassageWallKeys.has(hoveredOpenWallKey)
      ? hoveredOpenWallKey
      : null
  const activeHoveredRoomWallEditTarget =
    roomWallBrushTargets.length === 0 &&
    hoveredRoomWallEditTarget &&
    !roomWallBrushTargets.some((target) => target.wallKey === hoveredRoomWallEditTarget.wallKey)
      ? hoveredRoomWallEditTarget
      : null

  return (
    <group>
      {/* Hit plane — always tracks cursor world pos; editing events only for build/place tools */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={isNavigationTool ? updateCursorPosOnly : updateHoveredCell}
        onPointerOut={() => {
          if (!isNavigationTool && !strokeModeRef.current && !openPassageBrushActiveRef.current && !roomWallBrushActiveRef.current) {
            setHoveredOpenWallKey(null)
            setHoveredRoomWallEditTarget(null)
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

      {!isNavigationTool && (
        <HoverPreview
          hoveredCell={hoveredCell}
          hoveredPoint={hoveredPoint}
          previewCells={previewCells}
          strokeMode={strokeMode}
          propPlacement={(() => {
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
                ),
                floorRotationIndex * (Math.PI / 2),
              )
            return null
          })()}
          propAssetId={
            tool === 'prop' && !isUnifiedSurfaceMode && !isUnifiedOpeningMode
              ? selectedPropAssetId
            : tool === 'character'
                ? selectedCharacterAssetId
              : (tool === 'opening' || isUnifiedOpeningMode) &&
                 isFloorOpeningMode
                ? selectedOpeningAssetId
                : null
          }
          openingPlacement={
            (tool === 'opening' || isUnifiedOpeningMode) ? wallConnectionPlacement : null
          }
          floorVariantAssetId={isFloorVariantMode ? selectedFloorBrushAssetId : null}
          wallVariantAssetId={isWallVariantMode ? selectedWallBrushAssetId : null}
          wallVariantPlacement={isWallVariantMode ? wallVariantPlacement : null}
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
          roomWallEditMode={isRoomWallMode}
          roomWallBrushMode={roomWallBrushMode}
          hoveredRoomWallEditTarget={activeHoveredRoomWallEditTarget}
          roomWallBrushTargets={roomWallBrushTargets}
          hoveredOpenWallKey={activeHoveredOpenWallKey}
          openPassageBrushWallKeys={openPassageBrushWallKeys}
          eligibleOpenWallKeys={eligibleOpenPassageWallKeys}
           paintedCells={paintedCells}
           rooms={rooms}
           floorTileAssetIds={floorTileAssetIds}
          globalWallAssetId={globalWallAssetId}
          globalFloorAssetId={globalFloorAssetId}
          wallSurfaceAssetIds={wallSurfaceAssetIds}
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
  strokeMode,
  propPlacement,
  propAssetId,
  openingPlacement,
  floorVariantAssetId,
  wallVariantAssetId,
  wallVariantPlacement,
  openingAssetId,
  wallConnectionMode,
  wallConnectionRemovable,
  wallFlipped,
  roomWallEditMode,
  roomWallBrushMode,
  hoveredRoomWallEditTarget,
  roomWallBrushTargets,
  hoveredOpenWallKey,
  openPassageBrushWallKeys,
  eligibleOpenWallKeys,
  paintedCells,
  rooms,
  floorTileAssetIds,
  globalWallAssetId,
  globalFloorAssetId,
  wallSurfaceAssetIds,
  mapMode,
  outdoorTerrainHeights,
}: {
  hoveredCell: SnappedGridPosition | null
  hoveredPoint: { x: number; y: number; z: number } | null
  previewCells: GridCell[]
  strokeMode: 'paint' | 'erase' | null
  propPlacement: PropPlacement | null
  propAssetId: string | null
  openingPlacement: OpeningPlacement | null
  floorVariantAssetId: string | null
  wallVariantAssetId: string | null
  wallVariantPlacement: OpeningPlacement | null
  openingAssetId: string | null
  wallConnectionMode: WallConnectionMode
  wallConnectionRemovable: boolean
  wallFlipped: boolean
  roomWallEditMode: boolean
  roomWallBrushMode: 'paint' | 'erase' | null
  hoveredRoomWallEditTarget: RoomWallEditTarget | null
  roomWallBrushTargets: RoomWallEditTarget[]
  hoveredOpenWallKey: string | null
  openPassageBrushWallKeys: string[]
  eligibleOpenWallKeys: Set<string>
  paintedCells: Record<string, PaintedCellRecord>
  rooms: Record<string, Room>
  floorTileAssetIds: Record<string, string>
  globalWallAssetId: string | null
  globalFloorAssetId: string | null
  wallSurfaceAssetIds: Record<string, string>
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

    return (
      <group position={position} rotation={rotation}>
        <ContentPackInstance
          assetId={propAssetId}
          variant="prop"
        />
      </group>
    )
  }

  if (floorVariantAssetId) {
    if (!hoveredCell || !paintedCells[hoveredCell.key]) {
      return null
    }

    const effectiveFloorAssetId =
      floorTileAssetIds[hoveredCell.key] ??
      getFloorAssetIdForCellKey(hoveredCell.key, paintedCells, rooms, globalFloorAssetId)

    return (
      <group position={hoveredCell.position}>
        <ContentPackInstance
          assetId={floorVariantAssetId}
          variant="floor"
          tint={effectiveFloorAssetId === floorVariantAssetId ? '#22c55e' : '#7dd3fc'}
          tintOpacity={0.3}
        />
      </group>
    )
  }

  if (wallVariantAssetId) {
    if (!wallVariantPlacement?.valid) {
      return null
    }

    const wallKey = `${getCellKey(wallVariantPlacement.cell)}:${wallVariantPlacement.direction}`
    const effectiveWallAssetId = getWallAssetIdForWallKey(
      wallKey,
      paintedCells,
      rooms,
      globalWallAssetId,
      wallSurfaceAssetIds,
    )

    return (
      <group position={wallVariantPlacement.position} rotation={wallVariantPlacement.rotation}>
        <ContentPackInstance
          assetId={wallVariantAssetId}
          variant="wall"
          tint={effectiveWallAssetId === wallVariantAssetId ? '#22c55e' : '#7dd3fc'}
          tintOpacity={0.26}
        />
      </group>
    )
  }

  if (roomWallEditMode && (hoveredRoomWallEditTarget || roomWallBrushTargets.length > 0)) {
    const activeBrushColor = roomWallBrushMode === 'erase' ? '#ef4444' : '#22c55e'
    return (
      <group>
        {roomWallBrushTargets.map((target) => (
          <WallEditLinePreview
            key={`${target.kind}:${target.wallKey}`}
            wallKey={target.wallKey}
            color={activeBrushColor}
            opacity={0.55}
          />
        ))}
        {hoveredRoomWallEditTarget && (
          <WallEditLinePreview
            key={`hover:${hoveredRoomWallEditTarget.kind}:${hoveredRoomWallEditTarget.wallKey}`}
            wallKey={hoveredRoomWallEditTarget.wallKey}
            color={hoveredRoomWallEditTarget.kind === 'shared' ? '#f97316' : '#38bdf8'}
            opacity={0.42}
          />
        )}
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
                wallSurfaceAssetIds,
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
                wallSurfaceAssetIds,
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
      return (
        <mesh position={position} rotation={rotation}>
          <boxGeometry args={[openingPlacement.width * GRID_SIZE * 0.95, 2.2, 0.1]} />
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
const ROOM_WALL_PREVIEW_THICKNESS = GRID_SIZE * 0.08
const ROOM_WALL_PREVIEW_HEIGHT = 1.35
const ROOM_WALL_PREVIEW_RENDER_ORDER = 20

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

export function getPropPlacement(
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
  direction: 'north' | 'south' | 'east' | 'west'
  cell: GridCell
  width: 1 | 2 | 3
  position: [number, number, number]
  rotation: [number, number, number]
  valid: boolean
}

function getOpeningPlacement(
  width: 1 | 2 | 3,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  requireInterRoom = false,
): OpeningPlacement | null {
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
    direction: dir.name,
    cell: snapped.cell,
    width,
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
) {
  if (mode === 'door') {
    if (!asset) {
      return null
    }

    const width: 1 | 2 | 3 =
      asset.metadata?.openingWidth === 2 ? 2 : asset.metadata?.openingWidth === 3 ? 3 : 1
    return getOpeningPlacement(width, point, paintedCells)
  }

  return getOpeningPlacement(1, point, paintedCells, true)
}

function findWallConnectionAtPlacement(
  placement: Pick<OpeningPlacement, 'cell' | 'direction'>,
  wallOpenings: ReturnType<typeof useDungeonStore.getState>['wallOpenings'],
) {
  const hoveredWallKey = `${getCellKey(placement.cell)}:${placement.direction}`
  return Object.values(wallOpenings).find((opening) =>
    getOpeningSegments(opening.wallKey, opening.width).includes(hoveredWallKey),
  ) ?? null
}

function getSuppressedWallKeys(
  wallOpenings: ReturnType<typeof useDungeonStore.getState>['wallOpenings'],
) {
  const suppressed = new Set<string>()

  Object.values(wallOpenings).forEach((opening) => {
    getOpeningSegments(opening.wallKey, opening.width).forEach((wallKey) => {
      suppressed.add(wallKey)

      const parts = wallKey.split(':')
      const direction = WALL_CONNECTOR_DIRECTIONS.find((entry) => entry.name === parts[2])
      if (!direction) return

      const cell: GridCell = [parseInt(parts[0], 10), parseInt(parts[1], 10)]
      const neighbor: GridCell = [cell[0] + direction.delta[0], cell[1] + direction.delta[1]]
      suppressed.add(`${getCellKey(neighbor)}:${getOppositeDirection(direction.name)}`)
    })
  })

  return suppressed
}

function deriveEligibleOpenPassageWalls(
  paintedCells: Record<string, PaintedCellRecord>,
  wallOpenings: ReturnType<typeof useDungeonStore.getState>['wallOpenings'],
) {
  const walls: Array<{
    wallKey: string
    position: [number, number, number]
    rotation: [number, number, number]
  }> = []
  const suppressed = getSuppressedWallKeys(wallOpenings)

  Object.values(paintedCells).forEach((record) => {
    const cell = record.cell
    const cellKey = getCellKey(cell)

    WALL_CONNECTOR_DIRECTIONS.forEach((direction) => {
      const neighbor: GridCell = [cell[0] + direction.delta[0], cell[1] + direction.delta[1]]
      const neighborKey = getCellKey(neighbor)
      const wallKey = `${cellKey}:${direction.name}`

      if (
        !isInterRoomBoundary(cell, neighbor, paintedCells) ||
        cellKey > neighborKey ||
        suppressed.has(wallKey)
      ) {
        return
      }

      const position = wallKeyToWorldPosition(wallKey)
      if (!position) return

      walls.push({
        wallKey,
        position: position.position,
        rotation: position.rotation,
      })
    })
  })

  return walls
}

function getRoomWallEditTarget(
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  innerWalls: ReturnType<typeof useDungeonStore.getState>['innerWalls'],
  suppressedWallKeys: Set<string>,
  mode: 'paint' | 'erase',
): RoomWallEditTarget | null {
  const snapped = snapWorldPointToGrid(point)
  if (!paintedCells[snapped.key]) {
    return null
  }

  const cellCenter = cellToWorldPosition(snapped.cell)
  const localX = point.x - cellCenter[0]
  const localZ = point.z - cellCenter[2]
  const rankedDirections = [...WALL_CONNECTOR_DIRECTIONS].sort((left, right) => {
    const leftDistance = Math.abs(localX - left.delta[0] * (GRID_SIZE * 0.5))
      + Math.abs(localZ - left.delta[1] * (GRID_SIZE * 0.5))
    const rightDistance = Math.abs(localX - right.delta[0] * (GRID_SIZE * 0.5))
      + Math.abs(localZ - right.delta[1] * (GRID_SIZE * 0.5))

    return leftDistance - rightDistance
  })

  for (const direction of rankedDirections) {
    const rawWallKey = `${snapped.key}:${direction.name}`
    const neighbor: GridCell = [
      snapped.cell[0] + direction.delta[0],
      snapped.cell[1] + direction.delta[1],
    ]
    const neighborKey = getCellKey(neighbor)
    if (!paintedCells[neighborKey]) {
      continue
    }

    const innerWallKey = getCanonicalInnerWallKey(rawWallKey, paintedCells)
    if (mode === 'paint' && innerWallKey) {
      return { wallKey: innerWallKey, kind: 'inner' }
    }

    if (mode === 'erase' && innerWallKey && innerWalls[innerWallKey]) {
      return { wallKey: innerWallKey, kind: 'inner' }
    }

    const boundaryWallKey = getCanonicalWallKeyForGrid(rawWallKey, paintedCells)
    if (
      boundaryWallKey &&
      isInterRoomBoundary(snapped.cell, neighbor, paintedCells) &&
      ((mode === 'paint' && suppressedWallKeys.has(boundaryWallKey)) ||
        (mode === 'erase' && !suppressedWallKeys.has(boundaryWallKey)))
    ) {
      return { wallKey: boundaryWallKey, kind: 'shared' }
    }
  }

  return null
}

function getFloorAssetIdForCellKey(
  cellKey: string,
  paintedCells: Record<string, PaintedCellRecord>,
  rooms: Record<string, Room>,
  globalFloorAssetId: string | null,
) {
  const record = paintedCells[cellKey]
  const room = record?.roomId ? rooms[record.roomId] : null
  return room?.floorAssetId ?? globalFloorAssetId
}

function getWallAssetIdForWallKey(
  wallKey: string,
  paintedCells: Record<string, PaintedCellRecord>,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
) {
  const inheritedAssetId = getInheritedWallAssetIdForWallKey(
    wallKey,
    paintedCells,
    rooms,
    globalWallAssetId,
  )
  return wallSurfaceAssetIds[getCanonicalWallKeyForGrid(wallKey, paintedCells) ?? ''] ?? inheritedAssetId
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

function WallEditLinePreview({
  wallKey,
  color,
  opacity,
}: {
  wallKey: string
  color: string
  opacity: number
}) {
  const position = wallKeyToWorldPosition(wallKey)
  if (!position) {
    return null
  }

  return (
    <mesh
      position={[position.position[0], ROOM_WALL_PREVIEW_HEIGHT, position.position[2]]}
      rotation={position.rotation}
      renderOrder={ROOM_WALL_PREVIEW_RENDER_ORDER}
    >
      <boxGeometry args={[GRID_SIZE * 0.94, ROOM_WALL_PREVIEW_THICKNESS, ROOM_WALL_PREVIEW_THICKNESS]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
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
