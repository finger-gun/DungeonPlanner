import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
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
  type DungeonTool,
  type DungeonObjectRecord,
  type PaintedCellRecord,
  type Room,
  type WallConnectionMode,
} from '../../store/useDungeonStore'
import { getOpeningSegments } from '../../store/openingSegments'
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
import { extendOpenPassageBrush } from './openPassageBrush'
import { getOpeningToolMode } from './openingToolMode'

type GridProps = {
  size?: number
  playMode?: boolean
}

export function Grid({ size = 120, playMode = false }: GridProps) {
  const { snap } = useSnapToGrid()
  const raycaster = useRaycaster(0)
  const { gl, camera, scene } = useThree()
  const surfaceRaycasterRef = useRef(new THREE.Raycaster())
  const surfacePointerRef = useRef(new THREE.Vector2())
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const paintCells = useDungeonStore((state) => state.paintCells)
  const eraseCells = useDungeonStore((state) => state.eraseCells)
  const setFloorTileAsset = useDungeonStore((state) => state.setFloorTileAsset)
  const setWallSurfaceAsset = useDungeonStore((state) => state.setWallSurfaceAsset)
  const placeObject = useDungeonStore((state) => state.placeObject)
  const removeObjectAtCell = useDungeonStore((state) => state.removeObjectAtCell)
  const removeObject = useDungeonStore((state) => state.removeObject)
  const placeOpening = useDungeonStore((state) => state.placeOpening)
  const placeOpenPassages = useDungeonStore((state) => state.placeOpenPassages)
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const rooms = useDungeonStore((state) => state.rooms)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
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
  const selection = useDungeonStore((state) => state.selection)
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
    selectedOpeningAsset?.metadata?.connectsTo,
  )
  const [hoveredCell, setHoveredCell] = useState<SnappedGridPosition | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const [hoveredSurfaceHit, setHoveredSurfaceHit] = useState<PlacementSurfaceHit | null>(null)
  const [strokeMode, setStrokeMode] = useState<'paint' | 'erase' | null>(null)
  const [strokeStartCell, setStrokeStartCell] = useState<GridCell | null>(null)
  const [strokeCurrentCell, setStrokeCurrentCell] = useState<GridCell | null>(null)
  const [hoveredOpenWallKey, setHoveredOpenWallKey] = useState<string | null>(null)
  const [openPassageBrushWallKeys, setOpenPassageBrushWallKeys] = useState<string[]>([])
  const strokeModeRef = useRef<'paint' | 'erase' | null>(null)
  const strokeStartRef = useRef<GridCell | null>(null)
  const strokeCurrentRef = useRef<GridCell | null>(null)
  const openPassageBrushActiveRef = useRef(false)
  const openPassageBrushWallKeysRef = useRef<string[]>([])
  const paintedCellsRef = useRef(paintedCells)
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

  useEffect(() => {
    paintedCellsRef.current = paintedCells
  }, [paintedCells])

  const resolvePlacementSurfaceHit = useEffectEvent((pointerEvent: PointerEvent) => {
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
    )
  })

  // R key: rotates floor-connected assets; flips wall-connected openings 180°
  useEffect(() => {
    const isFloorOpening = tool === 'opening' && openingToolMode === 'floor-asset'
    const isWallOpening = tool === 'opening' && wallConnectionMode === 'door' && !isFloorOpening
    if (selection || (tool !== 'prop' && tool !== 'character' && !isFloorOpening && !isWallOpening)) return
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

          return isWallOpening
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
  }, [openingToolMode, placementOrientationKey, selection, tool, wallConnectionMode])

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
    setPaintingStrokeActive(active || Boolean(strokeModeRef.current))
  }

  const previewCells = useMemo(() => {
    if (tool !== 'room' || roomEditMode !== 'rooms') {
      return []
    }

    return getRoomPreviewCells({
      hoveredCell,
      paintedCells,
      strokeCurrentCell,
      strokeMode,
      strokeStartCell,
      suppressRoomPreview: isRoomResizeHandleActive,
      tool,
    })
  }, [
    hoveredCell,
    roomEditMode,
    isRoomResizeHandleActive,
    paintedCells,
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

    const cells = filterStrokeCells(
      getRectangleCells(startCell, currentCell),
      paintedCellsRef.current,
      mode,
    )

    if (cells.length > 0) {
      if (mode === 'paint') {
        paintCells(cells)
        // Cascade FROM the stroke start corner TOWARD the release corner (opposite diagonal).
        // Tiles near where you first clicked appear first.
        triggerBuild(cells, startCell)
      } else {
        eraseCells(cells)
      }
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

  useEffect(() => {
    function handlePointerUp() {
      commitStroke()
      endOpenPassageBrush()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      openPassageBrushActiveRef.current = false
      openPassageBrushWallKeysRef.current = []
      setHoveredOpenWallKey(null)
      setOpenPassageBrushWallKeys([])
      setPaintingStrokeActive(false)
    }
  }, [setPaintingStrokeActive])

  function updateHoveredCell(event: ThreeEvent<PointerEvent>) {
    const point = raycaster.pointOnPlane(event)
    const snapped = snap(point)
    setHoveredCell(snapped)
    setHoveredPoint(point)
    setHoveredSurfaceHit(resolvePlacementSurfaceHit(event.nativeEvent))

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

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    const point = raycaster.pointOnPlane(event)
    const snapped = snap(point)
    const surfaceHit = resolvePlacementSurfaceHit(event.nativeEvent)
    setHoveredCell(snapped)
    setHoveredPoint(point)
    setHoveredSurfaceHit(surfaceHit)

    if (tool === 'opening') {
      const isFloorOpening = openingToolMode === 'floor-asset'

        if (isFloorOpening) {
          // Stairs and other floor-connected openings use prop-style placement
          const rawPlacement = selectedOpeningAsset
            ? getPropPlacement(selectedOpeningAsset, point, paintedCells, surfaceHit)
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
          assetId: selectedOpeningAssetId,
          position: propPlacement.position,
          rotation: propPlacement.rotation,
          props: { connector: propPlacement.connector, direction: propPlacement.direction },
          cell: propPlacement.cell,
          cellKey: propPlacement.anchorKey ?? propPlacement.supportCellKey,
          parentObjectId: propPlacement.parentObjectId,
          localPosition: localTransform.localPosition,
          localRotation: localTransform.localRotation,
          supportCellKey: propPlacement.supportCellKey,
        })
        return
        }

      const openingPlacement = getWallConnectionPlacement(
        wallConnectionMode,
        selectedOpeningAsset,
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
        return
      }

      placeOpening({
        assetId: selectedOpeningAssetId,
        wallKey: `${getCellKey(openingPlacement.cell)}:${openingPlacement.direction}`,
        width: openingPlacement.width,
        flipped: wallFlipped,
      })
      return
    }

    if (tool === 'prop' || tool === 'character') {
      const activeAsset = tool === 'character' ? selectedCharacterAsset : selectedPropAsset
      const activeAssetId = tool === 'character' ? selectedCharacterAssetId : selectedPropAssetId
      const rawPlacement = activeAsset
        ? getPropPlacement(activeAsset, point, paintedCells, surfaceHit)
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
      })
      return
    }

    if (tool === 'room') {
      if (roomEditMode === 'floor-variants') {
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

      if (roomEditMode === 'wall-variants') {
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

      const hoveredRoomId = paintedCells[getCellKey(snapped.cell)]?.roomId ?? null

      if (event.button === 0 && hoveredRoomId) {
        selectRoom(hoveredRoomId)
        return
      }

      if (event.button === 0 && !hoveredRoomId) {
        selectRoom(null)
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
  const wallConnectionPlacement = useMemo(
    () => tool === 'opening' && hoveredPoint
      ? getWallConnectionPlacement(
          wallConnectionMode,
          selectedOpeningAsset,
          hoveredPoint,
          paintedCells,
        )
      : null,
    [hoveredPoint, paintedCells, selectedOpeningAsset, tool, wallConnectionMode],
  )
  const hoveredWallConnection = useMemo(
    () => wallConnectionPlacement
      ? findWallConnectionAtPlacement(wallConnectionPlacement, wallOpenings)
      : null,
    [wallConnectionPlacement, wallOpenings],
  )
  const eligibleOpenPassageWalls = useMemo(
    () => deriveEligibleOpenPassageWalls(paintedCells, wallOpenings),
    [paintedCells, wallOpenings],
  )
  const eligibleOpenPassageWallKeys = useMemo(
    () => new Set(eligibleOpenPassageWalls.map((wall) => wall.wallKey)),
    [eligibleOpenPassageWalls],
  )
  const isFloorVariantMode = tool === 'room' && roomEditMode === 'floor-variants'
  const isWallVariantMode = tool === 'room' && roomEditMode === 'wall-variants'
  const isOpenWallBrushMode =
    tool === 'opening' &&
    wallConnectionMode === 'open' &&
    openingToolMode === 'wall-connection'
  const wallVariantPlacement = useMemo(
    () => (isWallVariantMode && hoveredPoint ? getOpeningPlacement(1, hoveredPoint, paintedCells) : null),
    [hoveredPoint, isWallVariantMode, paintedCells],
  )
  const activeHoveredOpenWallKey =
    hoveredOpenWallKey && eligibleOpenPassageWallKeys.has(hoveredOpenWallKey)
      ? hoveredOpenWallKey
      : null

  return (
    <group>
      {/* Hit plane — always tracks cursor world pos; editing events only for build/place tools */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={isNavigationTool ? updateCursorPosOnly : updateHoveredCell}
        onPointerOut={() => {
          if (!isNavigationTool && !strokeModeRef.current && !openPassageBrushActiveRef.current) {
            setHoveredCell(null)
            setHoveredPoint(null)
            setHoveredSurfaceHit(null)
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
          tool={tool}
          propPlacement={(() => {
            if (tool === 'prop' && selectedPropAsset && hoveredPoint)
              return applyFloorRotation(
                getPropPlacement(selectedPropAsset, hoveredPoint, paintedCells, hoveredSurfaceHit),
                floorRotationIndex * (Math.PI / 2),
              )
            if (tool === 'character' && selectedCharacterAsset && hoveredPoint)
              return applyFloorRotation(
                getPropPlacement(selectedCharacterAsset, hoveredPoint, paintedCells, hoveredSurfaceHit),
                floorRotationIndex * (Math.PI / 2),
              )
            if (
              tool === 'opening' &&
              selectedOpeningAsset &&
              hoveredPoint &&
              openingToolMode === 'floor-asset'
            )
              return applyFloorRotation(
                getPropPlacement(selectedOpeningAsset, hoveredPoint, paintedCells, hoveredSurfaceHit),
                floorRotationIndex * (Math.PI / 2),
              )
            return null
          })()}
          propAssetId={
            tool === 'prop'
              ? selectedPropAssetId
              : tool === 'character'
                ? selectedCharacterAssetId
              : tool === 'opening' &&
                 openingToolMode === 'floor-asset'
                ? selectedOpeningAssetId
               : null
          }
          openingPlacement={
            tool === 'opening' ? wallConnectionPlacement : null
          }
          floorVariantAssetId={isFloorVariantMode ? selectedFloorBrushAssetId : null}
          wallVariantAssetId={isWallVariantMode ? selectedWallBrushAssetId : null}
          wallVariantPlacement={isWallVariantMode ? wallVariantPlacement : null}
          openingAssetId={
            tool === 'opening' &&
            wallConnectionMode === 'door' &&
            openingToolMode === 'wall-connection'
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
           wallSurfaceAssetIds={wallSurfaceAssetIds}
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
  tool,
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
  hoveredOpenWallKey,
  openPassageBrushWallKeys,
  eligibleOpenWallKeys,
  paintedCells,
  rooms,
  floorTileAssetIds,
  globalWallAssetId,
  globalFloorAssetId,
  wallSurfaceAssetIds,
}: {
  hoveredCell: SnappedGridPosition | null
  hoveredPoint: { x: number; y: number; z: number } | null
  previewCells: GridCell[]
  strokeMode: 'paint' | 'erase' | null
  tool: DungeonTool
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
  hoveredOpenWallKey: string | null
  openPassageBrushWallKeys: string[]
  eligibleOpenWallKeys: Set<string>
  paintedCells: Record<string, PaintedCellRecord>
  rooms: Record<string, Room>
  floorTileAssetIds: Record<string, string>
  globalWallAssetId: string | null
  globalFloorAssetId: string | null
  wallSurfaceAssetIds: Record<string, string>
}) {
  // Prop tool OR floor-connected opening (e.g. stairs) — both use prop-style preview
  if (tool === 'prop' || tool === 'character' || (tool === 'opening' && propAssetId)) {
    if (!hoveredCell || !hoveredPoint) return null
    const previewAsset = propAssetId ? getContentPackAssetById(propAssetId) : null
    if (previewAsset?.metadata?.connectsTo === 'FREE' && !propPlacement) {
      return null
    }

    const position = propPlacement?.position ?? [hoveredCell.position[0], 0, hoveredCell.position[2]]
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

  if (tool === 'room' && floorVariantAssetId) {
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

  if (tool === 'room' && wallVariantAssetId) {
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

  if (tool === 'opening') {
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

        return (
          <mesh key={key} position={[position[0], -0.03, position[2]]}>
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
) {
  return cells.filter((cell) =>
    mode === 'paint'
      ? !paintedCells[getCellKey(cell)]
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
    if (!paintedCells[supportCellKey]) {
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

function getPropPlacement(
  asset: ContentPackAsset,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  surfaceHit: PlacementSurfaceHit | null,
): PropPlacement | null {
  const snapped = snapWorldPointToGrid(point)
  const connector = asset.metadata?.connectsTo ?? 'FLOOR'

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

    if (!paintedCells[snapped.key]) {
      return null
    }

    return {
      connector,
      direction: null,
      cell: snapped.cell,
      anchorKey: null,
      supportCellKey: snapped.key,
      position: [point.x, 0, point.z],
      rotation: [0, 0, 0],
      parentObjectId: null,
      localPosition: null,
      localRotation: null,
    }
  }

  if (!paintedCells[snapped.key]) {
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
      position: [cellCenter[0], 0, cellCenter[2]],
      rotation: [0, 0, 0],
      parentObjectId: null,
      localPosition: null,
      localRotation: null,
    }
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
