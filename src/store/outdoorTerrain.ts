import { GRID_SIZE, getCellKey, type GridCell } from '../hooks/useSnapToGrid'

export type OutdoorTerrainHeightRecord = {
  cell: GridCell
  level: number
}

export type OutdoorTerrainHeightfield = Record<string, OutdoorTerrainHeightRecord>
export type OutdoorTerrainSculptMode = 'raise' | 'lower'

export const OUTDOOR_TERRAIN_WORLD_SIZE = 260
export const OUTDOOR_TERRAIN_SEGMENTS = OUTDOOR_TERRAIN_WORLD_SIZE / GRID_SIZE
export const OUTDOOR_TERRAIN_LEVEL_HEIGHT = GRID_SIZE
export const DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP = 1
export const DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS = 0

const OUTDOOR_TERRAIN_MAX_LEVEL = 8

function clampLevel(level: number) {
  return Math.max(-OUTDOOR_TERRAIN_MAX_LEVEL, Math.min(OUTDOOR_TERRAIN_MAX_LEVEL, level))
}

export function getOutdoorTerrainCellLevel(
  heightfield: OutdoorTerrainHeightfield,
  cell: GridCell,
) {
  return heightfield[getCellKey(cell)]?.level ?? 0
}

export function getOutdoorTerrainCellHeight(
  heightfield: OutdoorTerrainHeightfield,
  cell: GridCell,
) {
  return getOutdoorTerrainCellLevel(heightfield, cell) * OUTDOOR_TERRAIN_LEVEL_HEIGHT
}

export function sampleOutdoorTerrainHeight(
  heightfield: OutdoorTerrainHeightfield,
  worldX: number,
  worldZ: number,
) {
  const cell: GridCell = [
    Math.floor(worldX / GRID_SIZE),
    Math.floor(worldZ / GRID_SIZE),
  ]
  return getOutdoorTerrainCellHeight(heightfield, cell)
}

export function getOutdoorTerrainWorldPosition(
  cell: GridCell,
  heightfield: OutdoorTerrainHeightfield,
): [number, number, number] {
  const x = (cell[0] + 0.5) * GRID_SIZE
  const z = (cell[1] + 0.5) * GRID_SIZE
  return [x, getOutdoorTerrainCellHeight(heightfield, cell), z]
}

export function applyOutdoorTerrainSculpt(
  heightfield: OutdoorTerrainHeightfield,
  cells: GridCell[],
  mode: OutdoorTerrainSculptMode,
  step = DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
  radius = DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS,
) {
  const stepLevels = Math.max(1, Math.round(step))
  const sculptRadius = Math.max(0, Math.round(radius))

  if (cells.length === 0) {
    return heightfield
  }

  const nextHeightfield: OutdoorTerrainHeightfield = { ...heightfield }
  const direction = mode === 'lower' ? -1 : 1

  for (const [targetX, targetZ] of cells) {
    for (let deltaX = -sculptRadius; deltaX <= sculptRadius; deltaX += 1) {
      for (let deltaZ = -sculptRadius; deltaZ <= sculptRadius; deltaZ += 1) {

        const cell: GridCell = [targetX + deltaX, targetZ + deltaZ]
        const key = getCellKey(cell)
        const currentLevel = nextHeightfield[key]?.level ?? 0
        const nextLevel = clampLevel(currentLevel + direction * stepLevels)

        if (nextLevel === 0) {
          delete nextHeightfield[key]
          continue
        }

        nextHeightfield[key] = {
          cell,
          level: nextLevel,
        }
      }
    }
  }

  return nextHeightfield
}
