import { GRID_SIZE, getCellKey, type GridCell } from '../hooks/useSnapToGrid'

export type OutdoorTerrainHeightRecord = {
  cell: GridCell
  height: number
}

export type OutdoorTerrainHeightfield = Record<string, OutdoorTerrainHeightRecord>
export type OutdoorTerrainSculptMode = 'raise' | 'lower'

export const OUTDOOR_TERRAIN_WORLD_SIZE = 260
export const OUTDOOR_TERRAIN_SEGMENTS = OUTDOOR_TERRAIN_WORLD_SIZE / GRID_SIZE
export const DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP = 0.5
export const DEFAULT_OUTDOOR_TERRAIN_SCULPT_RADIUS = 1

const OUTDOOR_TERRAIN_HEIGHT_EPSILON = 0.0001
const OUTDOOR_TERRAIN_MAX_HEIGHT = 8

function clampHeight(height: number) {
  return Math.max(-OUTDOOR_TERRAIN_MAX_HEIGHT, Math.min(OUTDOOR_TERRAIN_MAX_HEIGHT, height))
}

export function getOutdoorTerrainCellHeight(
  heightfield: OutdoorTerrainHeightfield,
  cell: GridCell,
) {
  return heightfield[getCellKey(cell)]?.height ?? 0
}

export function sampleOutdoorTerrainHeight(
  heightfield: OutdoorTerrainHeightfield,
  worldX: number,
  worldZ: number,
) {
  const sampleX = worldX / GRID_SIZE - 0.5
  const sampleZ = worldZ / GRID_SIZE - 0.5
  const minX = Math.floor(sampleX)
  const minZ = Math.floor(sampleZ)
  const maxX = minX + 1
  const maxZ = minZ + 1
  const tx = sampleX - minX
  const tz = sampleZ - minZ

  const h00 = getOutdoorTerrainCellHeight(heightfield, [minX, minZ])
  const h10 = getOutdoorTerrainCellHeight(heightfield, [maxX, minZ])
  const h01 = getOutdoorTerrainCellHeight(heightfield, [minX, maxZ])
  const h11 = getOutdoorTerrainCellHeight(heightfield, [maxX, maxZ])

  const hx0 = h00 * (1 - tx) + h10 * tx
  const hx1 = h01 * (1 - tx) + h11 * tx

  return hx0 * (1 - tz) + hx1 * tz
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
  if (cells.length === 0 || step <= 0 || radius < 0) {
    return heightfield
  }

  const nextHeightfield: OutdoorTerrainHeightfield = { ...heightfield }
  const direction = mode === 'lower' ? -1 : 1

  for (const [targetX, targetZ] of cells) {
    for (let deltaX = -radius; deltaX <= radius; deltaX += 1) {
      for (let deltaZ = -radius; deltaZ <= radius; deltaZ += 1) {
        const distance = Math.hypot(deltaX, deltaZ)
        if (distance > radius) {
          continue
        }

        const weight = Math.max(0, 1 - distance / (radius + 1))
        if (weight <= 0) {
          continue
        }

        const cell: GridCell = [targetX + deltaX, targetZ + deltaZ]
        const key = getCellKey(cell)
        const currentHeight = nextHeightfield[key]?.height ?? 0
        const nextHeight = clampHeight(currentHeight + direction * step * weight)

        if (Math.abs(nextHeight) <= OUTDOOR_TERRAIN_HEIGHT_EPSILON) {
          delete nextHeightfield[key]
          continue
        }

        nextHeightfield[key] = {
          cell,
          height: nextHeight,
        }
      }
    }
  }

  return nextHeightfield
}
