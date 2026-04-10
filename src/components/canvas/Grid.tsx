import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { useFrame, useThree } from '@react-three/fiber'
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
  getOpeningSegments,
  type DungeonTool,
  type PaintedCellRecord,
} from '../../store/useDungeonStore'
import { triggerBuild } from '../../store/buildAnimations'
import { FloorGridOverlay } from './FloorGridOverlay'
import { ContentPackInstance } from './ContentPackInstance'

type GridProps = {
  size?: number
}

export function Grid({ size = 120 }: GridProps) {
  const { snap } = useSnapToGrid()
  const raycaster = useRaycaster(0)
  const { gl } = useThree()
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const paintCells = useDungeonStore((state) => state.paintCells)
  const eraseCells = useDungeonStore((state) => state.eraseCells)
  const placeObject = useDungeonStore((state) => state.placeObject)
  const removeObjectAtCell = useDungeonStore((state) => state.removeObjectAtCell)
  const placeOpening = useDungeonStore((state) => state.placeOpening)
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const setPaintingStrokeActive = useDungeonStore(
    (state) => state.setPaintingStrokeActive,
  )
  const tool = useDungeonStore((state) => state.tool)
  const showGrid = useDungeonStore((state) => state.showGrid)
  const selectedPropAssetId = useDungeonStore((state) => state.selectedAssetIds.prop)
  const selectedOpeningAssetId = useDungeonStore((state) => state.selectedAssetIds.opening)
  const selectedPropAsset = selectedPropAssetId
    ? getContentPackAssetById(selectedPropAssetId)
    : null
  const selectedOpeningAsset = selectedOpeningAssetId
    ? getContentPackAssetById(selectedOpeningAssetId)
    : null
  const [hoveredCell, setHoveredCell] = useState<SnappedGridPosition | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const mousePosRef = useRef(new THREE.Vector2())
  const cursorActiveRef = useRef(false)
  const [strokeMode, setStrokeMode] = useState<'paint' | 'erase' | null>(null)
  const [strokeStartCell, setStrokeStartCell] = useState<GridCell | null>(null)
  const [strokeCurrentCell, setStrokeCurrentCell] = useState<GridCell | null>(null)
  const strokeModeRef = useRef<'paint' | 'erase' | null>(null)
  const strokeStartRef = useRef<GridCell | null>(null)
  const strokeCurrentRef = useRef<GridCell | null>(null)
  const paintedCellsRef = useRef(paintedCells)
  // Rotation index for floor-connected prop placement (0–3, each step = 90°)
  const [floorRotationIndex, setFloorRotationIndex] = useState(0)

  useEffect(() => {
    paintedCellsRef.current = paintedCells
  }, [paintedCells])

  // Reset rotation when switching prop asset
  useEffect(() => {
    setFloorRotationIndex(0)
  }, [selectedPropAssetId])

  // R key rotates floor-connected props by 90° while in prop tool
  useEffect(() => {
    if (tool !== 'prop') return
    function onKeyDown(e: KeyboardEvent) {
      const active = document.activeElement
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      ) return
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        setFloorRotationIndex((prev) => (prev + 1) % 4)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [tool])

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

  const previewCells = useMemo(() => {
    if (tool !== 'room') {
      return []
    }

    if (strokeStartCell && strokeCurrentCell && strokeMode) {
      return filterStrokeCells(
        getRectangleCells(strokeStartCell, strokeCurrentCell),
        paintedCells,
        strokeMode,
      )
    }

    return hoveredCell ? [hoveredCell.cell] : []
  }, [hoveredCell, paintedCells, strokeCurrentCell, strokeMode, strokeStartCell, tool])

  const commitStroke = useEffectEvent(() => {
    if (tool !== 'room') {
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

  useEffect(() => {
    function handlePointerUp() {
      commitStroke()
    }

    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      setPaintingStrokeActive(false)
    }
  }, [setPaintingStrokeActive])

  function updateHoveredCell(event: ThreeEvent<PointerEvent>) {
    const point = raycaster.pointOnPlane(event)
    const snapped = snap(point)
    setHoveredCell(snapped)
    setHoveredPoint(point)
    mousePosRef.current.set(point.x, point.z)
    cursorActiveRef.current = true

    if (tool === 'room' && strokeModeRef.current) {
      updateStrokeState(
        strokeModeRef.current,
        strokeStartRef.current,
        snapped.cell,
      )
    }
  }

  function updateCursorPosOnly(event: ThreeEvent<PointerEvent>) {
    const point = raycaster.pointOnPlane(event)
    mousePosRef.current.set(point.x, point.z)
    cursorActiveRef.current = true
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    const point = raycaster.pointOnPlane(event)
    const snapped = snap(point)
    setHoveredCell(snapped)
    setHoveredPoint(point)

    if (tool === 'opening') {
      const openingPlacement = selectedOpeningAsset
        ? getOpeningPlacement(selectedOpeningAsset, point, paintedCells)
        : null

      if (event.button === 2) {
        // Right-click: find and remove an opening whose segments cover this wall key
        if (openingPlacement) {
          const hoveredWallKey = `${getCellKey(openingPlacement.cell)}:${openingPlacement.direction}`
          const hit = Object.values(wallOpenings).find((o) =>
            getOpeningSegments(o.wallKey, o.width).includes(hoveredWallKey),
          )
          if (hit) removeOpening(hit.id)
        }
        return
      }

      if (event.button !== 0 || !openingPlacement || !openingPlacement.valid) return

      placeOpening({
        assetId: selectedOpeningAssetId,
        wallKey: `${getCellKey(openingPlacement.cell)}:${openingPlacement.direction}`,
        width: openingPlacement.width,
      })
      return
    }

    if (tool === 'prop') {
      const rawPlacement = selectedPropAsset
        ? getPropPlacement(selectedPropAsset, point, paintedCells)
        : null
      const propPlacement = applyFloorRotation(rawPlacement, floorRotationIndex * (Math.PI / 2))

      if (event.button === 2) {
        if (propPlacement) {
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

      placeObject({
        type: 'prop',
        assetId: selectedPropAssetId,
        position: propPlacement.position,
        rotation: propPlacement.rotation,
        props: {
          connector: propPlacement.connector,
          direction: propPlacement.direction,
        },
        cell: propPlacement.cell,
        cellKey: propPlacement.anchorKey,
      })
      return
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

  function handleContextMenu(_event: ThreeEvent<PointerEvent>) {
    // preventDefault is handled by the non-passive canvas listener
  }

  const isMoveTool = tool === 'move'
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)
  const isTopDown = activeCameraMode === 'top-down'

  // Show overlay:
  //   - Top-down view: always, full coverage (radius=10000)
  //   - Editing tools (room/prop): cursor radius, any view
  //   - Move tool in perspective/iso: hide (buttons live there; full coverage is confusing)
  const showOverlay = showGrid && (isTopDown || !isMoveTool)
  const overlayRadius  = isTopDown ? 10000 : 10
  const overlayOpacity = isTopDown ? 0.08  : 0.04

  return (
    <group>
      {/* Hit plane — always tracks cursor world pos; editing events only when not in move tool */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={isMoveTool ? updateCursorPosOnly : updateHoveredCell}
        onPointerOut={() => {
          cursorActiveRef.current = false
          if (!isMoveTool && !strokeModeRef.current) {
            setHoveredCell(null)
            setHoveredPoint(null)
          }
        }}
        onPointerDown={isMoveTool ? undefined : handlePointerDown}
        onContextMenu={isMoveTool ? undefined : handleContextMenu}
      >
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <CursorLight centerRef={mousePosRef} activeRef={cursorActiveRef} />

      {showOverlay && (
        <FloorGridOverlay
          centerRef={mousePosRef}
          radius={overlayRadius}
          opacity={overlayOpacity}
        />
      )}

      {showGrid && (
        <gridHelper
          args={[size, size / GRID_SIZE, '#50463c', '#2a2621']}
          position={[0, 0.001, 0]}
        />
      )}

      {!isMoveTool && (
        <HoverPreview
          hoveredCell={hoveredCell}
          hoveredPoint={hoveredPoint}
          previewCells={previewCells}
          strokeMode={strokeMode}
          tool={tool}
          propPlacement={
            tool === 'prop' && selectedPropAsset && hoveredPoint
              ? applyFloorRotation(
                  getPropPlacement(selectedPropAsset, hoveredPoint, paintedCells),
                  floorRotationIndex * (Math.PI / 2),
                )
              : null
          }
          propAssetId={selectedPropAssetId}
          openingPlacement={
            tool === 'opening' && selectedOpeningAsset && hoveredPoint
              ? getOpeningPlacement(selectedOpeningAsset, hoveredPoint, paintedCells)
              : null
          }
          openingAssetId={selectedOpeningAssetId}
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
  openingAssetId,
}: {
  hoveredCell: SnappedGridPosition | null
  hoveredPoint: { x: number; y: number; z: number } | null
  previewCells: GridCell[]
  strokeMode: 'paint' | 'erase' | null
  tool: DungeonTool
  propPlacement: PropPlacement | null
  propAssetId: string | null
  openingPlacement: OpeningPlacement | null
  openingAssetId: string | null
}) {
  if (tool === 'prop') {
    if (!hoveredCell || !hoveredPoint) return null

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

  if (tool === 'opening') {
    if (!hoveredPoint || !openingPlacement) return null

    const { position, rotation, valid } = openingPlacement

    if (!valid) {
      // Red fallback box for invalid placements
      return (
        <mesh position={position} rotation={rotation}>
          <boxGeometry args={[GRID_SIZE * 0.2, GRID_SIZE * 0.8, GRID_SIZE * 0.1]} />
          <meshBasicMaterial color="#f87171" transparent opacity={0.5} />
        </mesh>
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
  anchorKey: string
  position: [number, number, number]
  rotation: [number, number, number]
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

function applyFloorRotation(
  placement: PropPlacement | null,
  yRotation: number,
): PropPlacement | null {
  if (!placement || placement.connector !== 'FLOOR') return placement
  return { ...placement, rotation: [0, yRotation, 0] }
}

/**
 * Returns true if there is a visible wall between `cell` and `neighbor`:
 * - neighbor is unpainted (exterior wall), OR
 * - neighbor is painted but belongs to a different room (inter-room wall)
 */
function isWallBoundary(
  cell: GridCell,
  neighbor: GridCell,
  paintedCells: Record<string, PaintedCellRecord>,
): boolean {
  const neighborRecord = paintedCells[getCellKey(neighbor)]
  if (!neighborRecord) return true
  const cellRecord = paintedCells[getCellKey(cell)]
  return (cellRecord?.roomId ?? null) !== (neighborRecord.roomId ?? null)
}

function getPropPlacement(
  asset: ContentPackAsset,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
): PropPlacement | null {
  const snapped = snapWorldPointToGrid(point)
  const connector = asset.metadata?.connectsTo ?? 'FLOOR'

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
      position: [cellCenter[0], 0, cellCenter[2]],
      rotation: [0, 0, 0],
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
    position: [
      cellCenter[0] + matchingDirection.delta[0] * (GRID_SIZE * 0.5),
      0,
      cellCenter[2] + matchingDirection.delta[1] * (GRID_SIZE * 0.5),
    ],
    rotation: matchingDirection.rotation,
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
  asset: ContentPackAsset,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
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

  const width: 1 | 2 | 3 =
    asset.metadata?.openingWidth === 2 ? 2 : asset.metadata?.openingWidth === 3 ? 3 : 1
  const wallKey = `${getCellKey(snapped.cell)}:${dir.name}`
  const segments = getOpeningSegments(wallKey, width)

  // Validate all segments are actual wall boundaries (exterior or inter-room)
  const valid =
    isActualWall &&
    segments.every((segKey) => {
      const parts = segKey.split(':')
      const cx = parseInt(parts[0], 10)
      const cz = parseInt(parts[1], 10)
      const segDir = WALL_CONNECTOR_DIRECTIONS.find((d) => d.name === parts[2])
      if (!segDir) return false
      const cell: GridCell = [cx, cz]
      if (!paintedCells[getCellKey(cell)]) return false
      const n: GridCell = [cx + segDir.delta[0], cz + segDir.delta[1]]
      return isWallBoundary(cell, n, paintedCells)
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

// ─── Cursor follow light ───────────────────────────────────────────────────

const CURSOR_LIGHT_HEIGHT   = 3.0    // world units above the floor
const CURSOR_LIGHT_COLOR    = '#ff9040'
const CURSOR_LIGHT_INTENSITY = 10
const CURSOR_LIGHT_DISTANCE  = 22
const CURSOR_LIGHT_DECAY     = 1.8

function CursorLight({
  centerRef,
  activeRef,
}: {
  centerRef: MutableRefObject<THREE.Vector2>
  activeRef: MutableRefObject<boolean>
}) {
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame(({ clock }) => {
    const light = lightRef.current
    if (!light) return

    // Smoothly snap visibility
    light.visible = activeRef.current

    // Follow cursor XZ
    light.position.set(centerRef.current.x, CURSOR_LIGHT_HEIGHT, centerRef.current.y)

    // Organic flicker — three layered sin waves
    const t = clock.elapsedTime
    const noise =
      Math.sin(t * 11.3) * 0.12 +
      Math.sin(t *  7.1) * 0.09 +
      Math.sin(t * 23.7) * 0.05
    light.intensity = CURSOR_LIGHT_INTENSITY * (1 + noise)
  })

  return (
    <pointLight
      ref={lightRef}
      color={CURSOR_LIGHT_COLOR}
      intensity={CURSOR_LIGHT_INTENSITY}
      distance={CURSOR_LIGHT_DISTANCE}
      decay={CURSOR_LIGHT_DECAY}
      castShadow
      shadow-mapSize={[512, 512]}
      shadow-camera-near={0.5}
      shadow-camera-far={CURSOR_LIGHT_DISTANCE}
      visible={false}
    />
  )
}
