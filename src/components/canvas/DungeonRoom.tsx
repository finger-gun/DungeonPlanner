import { useMemo } from 'react'
import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
  type GridCell,
} from '../../hooks/useSnapToGrid'
import {
  useDungeonStore,
  type PaintedCells,
} from '../../store/useDungeonStore'
import { ContentPackInstance } from './ContentPackInstance'

type WallDirection = 'north' | 'south' | 'east' | 'west'

type RoomWallInstance = {
  key: string
  direction: WallDirection
  position: [number, number, number]
  rotation: [number, number, number]
}

const WALL_DIRECTIONS: Array<{
  direction: WallDirection
  delta: GridCell
  rotation: [number, number, number]
}> = [
  { direction: 'north', delta: [0, 1], rotation: [0, Math.PI, 0] },
  { direction: 'south', delta: [0, -1], rotation: [0, 0, 0] },
  { direction: 'east', delta: [1, 0], rotation: [0, -Math.PI / 2, 0] },
  { direction: 'west', delta: [-1, 0], rotation: [0, Math.PI / 2, 0] },
]

export function DungeonRoom() {
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const floorAssetId = useDungeonStore((state) => state.selectedAssetIds.floor)
  const wallAssetId = useDungeonStore((state) => state.selectedAssetIds.wall)
  const cells = useMemo(() => Object.values(paintedCells), [paintedCells])
  const walls = useMemo(() => deriveRoomWalls(paintedCells), [paintedCells])

  return (
    <>
      {cells.map((cell) => (
        <ContentPackInstance
          key={`floor:${getCellKey(cell)}`}
          assetId={floorAssetId}
          position={cellToWorldPosition(cell)}
          variant="floor"
          variantKey={getCellKey(cell)}
        />
      ))}

      {walls.map((wall) => (
        <ContentPackInstance
          key={wall.key}
          assetId={wallAssetId}
          position={wall.position}
          rotation={wall.rotation}
          variant="wall"
          variantKey={wall.key}
        />
      ))}
    </>
  )
}

function deriveRoomWalls(paintedCells: PaintedCells): RoomWallInstance[] {
  const walls: RoomWallInstance[] = []

  Object.values(paintedCells).forEach((cell) => {
    const center = cellToWorldPosition(cell)

    WALL_DIRECTIONS.forEach(({ direction, delta, rotation }) => {
      const neighbor: GridCell = [cell[0] + delta[0], cell[1] + delta[1]]
      if (paintedCells[getCellKey(neighbor)]) {
        return
      }

      walls.push({
        key: `${getCellKey(cell)}:${direction}`,
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
