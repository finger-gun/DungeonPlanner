import { useRef, useMemo, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
  type GridCell,
} from '../../hooks/useSnapToGrid'
import {
  useDungeonStore,
  getOpeningSegments,
  type OpeningRecord,
  type PaintedCells,
} from '../../store/useDungeonStore'
import { getBuildYOffset, isAnimationActive } from '../../store/buildAnimations'
import { ContentPackInstance } from './ContentPackInstance'
import { registerObject, unregisterObject } from './objectRegistry'
import type { PlayVisibility, PlayVisibilityState } from './playVisibility'

const WALL_EXTRA_DELAY_MS = 70

type WallDirection = 'north' | 'south' | 'east' | 'west'

type RoomWallInstance = {
  key: string
  direction: WallDirection
  position: [number, number, number]
  rotation: [number, number, number]
}

const WALL_DIRECTIONS: Array<{
  direction: WallDirection
  opposite: WallDirection
  delta: GridCell
  rotation: [number, number, number]
}> = [
  { direction: 'north', opposite: 'south', delta: [0, 1],  rotation: [0, Math.PI, 0] },
  { direction: 'south', opposite: 'north', delta: [0, -1], rotation: [0, 0, 0] },
  { direction: 'east',  opposite: 'west',  delta: [1, 0],  rotation: [0, -Math.PI / 2, 0] },
  { direction: 'west',  opposite: 'east',  delta: [-1, 0], rotation: [0, Math.PI / 2, 0] },
]

type CellGroup = {
  floorAssetId: string | null
  wallAssetId: string | null
  cells: GridCell[]
}

export function DungeonRoom({ visibility }: { visibility: PlayVisibility }) {
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const layers = useDungeonStore((state) => state.layers)
  const rooms = useDungeonStore((state) => state.rooms)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const globalFloorAssetId = useDungeonStore((state) => state.selectedAssetIds.floor)
  const globalWallAssetId = useDungeonStore((state) => state.selectedAssetIds.wall)

  // Floor cells occupied by a StaircaseDown have no floor tile — the staircase
  // model fills the space and a tile would clip through it.
  const blockedFloorCellKeys = useMemo(() => {
    const set = new Set<string>()
    for (const obj of Object.values(placedObjects)) {
      if (obj.assetId === 'core.props_staircase_down') {
        set.add(`${obj.cell[0]}:${obj.cell[1]}`)
      }
    }
    return set
  }, [placedObjects])

  // Pre-compute which wall keys are suppressed by openings.
  // For each segment we add both the stored key AND its mirror (same physical wall
  // seen from the neighbouring cell), because inter-room walls are always rendered
  // by the canonical (lower-key) cell — which may be on the other side of the opening.
  const suppressedWallKeys = useMemo(() => {
    const set = new Set<string>()
    Object.values(wallOpenings).forEach((opening) => {
      getOpeningSegments(opening.wallKey, opening.width).forEach((segKey) => {
        set.add(segKey)
        // Mirror: the same wall face as seen from the neighbour
        const parts = segKey.split(':')
        const cx = parseInt(parts[0], 10)
        const cz = parseInt(parts[1], 10)
        const dirEntry = WALL_DIRECTIONS.find((d) => d.direction === parts[2])
        if (dirEntry) {
          const nx = cx + dirEntry.delta[0]
          const nz = cz + dirEntry.delta[1]
          set.add(`${nx}:${nz}:${dirEntry.opposite}`)
        }
      })
    })
    return set
  }, [wallOpenings])

  // Group visible cells by their effective (floor, wall) asset pair.
  // Room asset overrides take precedence over the global selection.
  const cellGroups = useMemo<CellGroup[]>(() => {
    const groups = new Map<string, CellGroup>()

    Object.values(paintedCells).forEach((record) => {
      if (layers[record.layerId]?.visible === false) return
      const room = record.roomId ? rooms[record.roomId] : null
      const floorAssetId = room?.floorAssetId ?? globalFloorAssetId
      const wallAssetId = room?.wallAssetId ?? globalWallAssetId
      const key = `${floorAssetId}||${wallAssetId}`
      if (!groups.has(key)) groups.set(key, { floorAssetId, wallAssetId, cells: [] })
      groups.get(key)!.cells.push(record.cell)
    })

    return Array.from(groups.values())
  }, [paintedCells, layers, rooms, globalFloorAssetId, globalWallAssetId])

  return (
    <>
      {cellGroups.map((group) => (
          <CellGroupRenderer
            key={`${group.floorAssetId}||${group.wallAssetId}`}
            group={group}
            paintedCells={paintedCells}
            suppressedWallKeys={suppressedWallKeys}
            blockedFloorCellKeys={blockedFloorCellKeys}
            visibility={visibility}
          />
        ))}
      {Object.values(wallOpenings).map((opening) => (
        <OpeningRenderer key={opening.id} opening={opening} visibility={visibility} />
      ))}
    </>
  )
}

function CellGroupRenderer({
  group,
  paintedCells,
  suppressedWallKeys,
  blockedFloorCellKeys,
  visibility,
}: {
  group: CellGroup
  paintedCells: PaintedCells
  suppressedWallKeys: Set<string>
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
}) {
  const walls = useMemo(
    () => deriveRoomWalls(group.cells, paintedCells, suppressedWallKeys),
    [group.cells, paintedCells, suppressedWallKeys],
  )

  return (
    <>
      {group.cells.map((cell) => {
        const key = getCellKey(cell)
        if (blockedFloorCellKeys.has(key)) return null
        return (
          <AnimatedTileGroup key={`floor:${key}`} cellKey={key}>
            <ContentPackInstance
              assetId={group.floorAssetId}
              position={cellToWorldPosition(cell)}
              variant="floor"
              variantKey={key}
              visibility={visibility.mask ? 'visible' : visibility.getCellVisibility(key)}
            />
          </AnimatedTileGroup>
        )
      })}

      {walls.map((wall) => {
        const floorKey = wall.key.split(':').slice(0, 2).join(':')
        return (
          <AnimatedTileGroup key={wall.key} cellKey={floorKey} extraDelay={WALL_EXTRA_DELAY_MS}>
            <ContentPackInstance
              assetId={group.wallAssetId}
              position={wall.position}
              rotation={wall.rotation}
              variant="wall"
              variantKey={wall.key}
              visibility={visibility.getWallVisibility(wall.key)}
            />
          </AnimatedTileGroup>
        )
      })}
    </>
  )
}

/**
 * Wraps a tile in a group whose Y position is driven each frame by the build
 * animation registry. When there is no active animation the group stays at Y=0
 * with negligible overhead (one Map lookup per frame).
 */
function AnimatedTileGroup({
  cellKey,
  extraDelay = 0,
  children,
}: {
  cellKey: string
  extraDelay?: number
  children: ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)
  // Once the animation registry entry is gone and y has settled to 0, stop running.
  const doneRef = useRef(false)

  useFrame(() => {
    if (doneRef.current) return
    const group = groupRef.current
    if (!group) return
    const y = getBuildYOffset(cellKey, performance.now(), extraDelay)
    if (group.position.y !== y) group.position.y = y
    // Self-disable once the registry entry is cleaned up and position is at rest
    if (y === 0 && !isAnimationActive(cellKey)) doneRef.current = true
  })

  return <group ref={groupRef}>{children}</group>
}

function deriveRoomWalls(
  cells: GridCell[],
  allPaintedCells: PaintedCells,
  suppressedWallKeys: Set<string>,
): RoomWallInstance[] {
  const walls: RoomWallInstance[] = []

  cells.forEach((cell) => {
    const cellKey = getCellKey(cell)
    const center = cellToWorldPosition(cell)
    const currentRoomId = allPaintedCells[cellKey]?.roomId ?? null

    WALL_DIRECTIONS.forEach(({ direction, delta, rotation }) => {
      const neighbor: GridCell = [cell[0] + delta[0], cell[1] + delta[1]]
      const neighborKey = getCellKey(neighbor)
      const neighborRecord = allPaintedCells[neighborKey]

      if (neighborRecord) {
        const neighborRoomId = neighborRecord.roomId ?? null
        if (currentRoomId === neighborRoomId) return // same room — no wall

        // Different rooms: only the canonical side (lower cell key) owns the wall,
        // so the boundary wall is rendered exactly once.
        if (cellKey > neighborKey) return
      }

      const wallKey = `${cellKey}:${direction}`
      if (suppressedWallKeys.has(wallKey)) return

      walls.push({
        key: wallKey,
        direction,
        position: [
          center[0] + delta[0] * (GRID_SIZE * 0.5),
          0,
          center[2] + delta[1] * (GRID_SIZE * 0.5),
        ],
        rotation,
      })
    })
  })

  return walls
}

function OpeningRenderer({
  opening,
  visibility,
}: {
  opening: OpeningRecord
  visibility: PlayVisibility
}) {
  const layers = useDungeonStore((state) => state.layers)
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const ppEnabled = useDungeonStore((state) => state.postProcessing.enabled)
  const selected = selection === opening.id

  const groupRef = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    if (groupRef.current) registerObject(opening.id, groupRef.current)
    return () => unregisterObject(opening.id)
  }, [opening.id])

  const tool = useDungeonStore((state) => state.tool)

  if (layers[opening.layerId]?.visible === false) return null

  const wallPosition = wallKeyToWorldPosition(opening.wallKey)
  if (!wallPosition) return null

  // Apply 180° flip when requested (front/back swap)
  const rotation: [number, number, number] = opening.flipped
    ? [wallPosition.rotation[0], wallPosition.rotation[1] + Math.PI, wallPosition.rotation[2]]
    : wallPosition.rotation

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (tool === 'select') {
      e.stopPropagation()
      selectObject(opening.id)
      return
    }
    if (!e.altKey) return
    e.stopPropagation()
    selectObject(opening.id)
  }

  return (
    <group ref={groupRef} position={wallPosition.position} rotation={rotation}>
      <ContentPackInstance
        assetId={opening.assetId}
        selected={selected && !ppEnabled}
        variant="wall"
        visibility={visibility.getWallVisibility(opening.wallKey)}
        onClick={handleClick}
      />
    </group>
  )
}

export function getWallVisibilityState(
  visibility: PlayVisibility,
  wallKey: string,
): PlayVisibilityState {
  return visibility.getWallVisibility(wallKey)
}

/** Convert a wall key ("x:z:direction") to world position + rotation. */
function wallKeyToWorldPosition(
  wallKey: string,
): { position: [number, number, number]; rotation: [number, number, number] } | null {
  const parts = wallKey.split(':')
  if (parts.length !== 3) return null
  const x = parseInt(parts[0], 10)
  const z = parseInt(parts[1], 10)
  const direction = parts[2]
  if (isNaN(x) || isNaN(z)) return null

  const dir = WALL_DIRECTIONS.find((d) => d.direction === direction)
  if (!dir) return null

  const center = cellToWorldPosition([x, z])
  return {
    position: [
      center[0] + dir.delta[0] * (GRID_SIZE * 0.5),
      0,
      center[2] + dir.delta[1] * (GRID_SIZE * 0.5),
    ],
    rotation: dir.rotation,
  }
}
