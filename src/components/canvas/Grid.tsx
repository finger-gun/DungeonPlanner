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
import { useDungeonStore, type DungeonTool } from '../../store/useDungeonStore'
import { triggerBuild } from '../../store/buildAnimations'
import { FloorGridOverlay } from './FloorGridOverlay'

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
  const setPaintingStrokeActive = useDungeonStore(
    (state) => state.setPaintingStrokeActive,
  )
  const tool = useDungeonStore((state) => state.tool)
  const showGrid = useDungeonStore((state) => state.showGrid)
  const selectedPropAssetId = useDungeonStore((state) => state.selectedAssetIds.prop)
  const selectedPropAsset = selectedPropAssetId
    ? getContentPackAssetById(selectedPropAssetId)
    : null
  const [hoveredCell, setHoveredCell] = useState<SnappedGridPosition | null>(null)
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; z: number } | null>(null)
  const mousePosRef = useRef(new THREE.Vector2())
  const [strokeMode, setStrokeMode] = useState<'paint' | 'erase' | null>(null)
  const [strokeStartCell, setStrokeStartCell] = useState<GridCell | null>(null)
  const [strokeCurrentCell, setStrokeCurrentCell] = useState<GridCell | null>(null)
  const strokeModeRef = useRef<'paint' | 'erase' | null>(null)
  const strokeStartRef = useRef<GridCell | null>(null)
  const strokeCurrentRef = useRef<GridCell | null>(null)
  const paintedCellsRef = useRef(paintedCells)

  useEffect(() => {
    paintedCellsRef.current = paintedCells
  }, [paintedCells])

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

    if (tool === 'room' && strokeModeRef.current) {
      updateStrokeState(
        strokeModeRef.current,
        strokeStartRef.current,
        snapped.cell,
      )
    }
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    const point = raycaster.pointOnPlane(event)
    const snapped = snap(point)
    setHoveredCell(snapped)
    setHoveredPoint(point)

    if (tool === 'prop') {
      const propPlacement = selectedPropAsset
        ? getPropPlacement(selectedPropAsset, point, paintedCells)
        : null

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

  return (
    <group>
      {/* Invisible hit plane — only wired when an editing tool is active */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={isMoveTool ? undefined : updateHoveredCell}
        onPointerOut={isMoveTool ? undefined : () => {
          if (!strokeModeRef.current) {
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

      {showGrid && (
        <FloorGridOverlay
          centerRef={mousePosRef}
          radius={isMoveTool ? 10000 : 3.5}
          opacity={isMoveTool ? 0.28 : 0.6}
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
              ? getPropPlacement(selectedPropAsset, hoveredPoint, paintedCells)
              : null
          }
          hasPropAsset={Boolean(selectedPropAsset)}
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
  hasPropAsset,
}: {
  hoveredCell: SnappedGridPosition | null
  hoveredPoint: { x: number; y: number; z: number } | null
  previewCells: GridCell[]
  strokeMode: 'paint' | 'erase' | null
  tool: DungeonTool
  propPlacement: PropPlacement | null
  hasPropAsset: boolean
}) {
  if (tool === 'prop') {
    if (!hoveredCell || !hoveredPoint) {
      return null
    }

    const opacity = hasPropAsset ? 0.2 : 0.35
    return (
      <mesh
        position={propPlacement?.position ?? [hoveredCell.position[0], 0.45, hoveredCell.position[2]]}
        rotation={propPlacement?.rotation ?? [0, 0, 0]}
      >
        <boxGeometry args={[0.5, 0.9, 0.5]} />
        <meshStandardMaterial color="#7dd3fc" transparent opacity={opacity} />
      </mesh>
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
            <meshStandardMaterial color={color} transparent opacity={opacity} />
          </mesh>
        )
      })}
    </group>
  )
}

function filterStrokeCells(
  cells: GridCell[],
  paintedCells: Record<string, GridCell>,
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

function getPropPlacement(
  asset: ContentPackAsset,
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, GridCell>,
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
    return !paintedCells[getCellKey(neighbor)]
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
