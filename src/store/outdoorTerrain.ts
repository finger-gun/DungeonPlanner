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

export function quantizeOutdoorTerrainHeight(
  height: number,
  step = DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
) {
  if (!Number.isFinite(height) || !Number.isFinite(step) || step <= 0) {
    return 0
  }

  const clamped = clampHeight(height)
  const quantized = Math.round(clamped / step) * step
  return Math.abs(quantized) <= OUTDOOR_TERRAIN_HEIGHT_EPSILON ? 0 : clampHeight(quantized)
}

export function quantizeOutdoorTerrainHeightfield(
  heightfield: OutdoorTerrainHeightfield,
  step = DEFAULT_OUTDOOR_TERRAIN_SCULPT_STEP,
) {
  const quantized: OutdoorTerrainHeightfield = {}
  Object.values(heightfield).forEach((record) => {
    const height = quantizeOutdoorTerrainHeight(record.height, step)
    if (height === 0) {
      return
    }
    const cell: GridCell = [record.cell[0], record.cell[1]]
    quantized[getCellKey(cell)] = { cell, height }
  })
  return quantized
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
  return getOutdoorTerrainCellHeight(heightfield, [
    Math.floor(worldX / GRID_SIZE),
    Math.floor(worldZ / GRID_SIZE),
  ])
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
        const nextHeight = quantizeOutdoorTerrainHeight(currentHeight + direction * step * weight, step)

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

export function getOutdoorTerrainSculptTargetCellKeys(cells: GridCell[], radius: number) {
  const keys = new Set<string>()
  if (cells.length === 0 || radius < 0) {
    return keys
  }

  for (const [targetX, targetZ] of cells) {
    for (let deltaX = -radius; deltaX <= radius; deltaX += 1) {
      for (let deltaZ = -radius; deltaZ <= radius; deltaZ += 1) {
        if (Math.hypot(deltaX, deltaZ) > radius) {
          continue
        }
        keys.add(getCellKey([targetX + deltaX, targetZ + deltaZ]))
      }
    }
  }

  return keys
}
