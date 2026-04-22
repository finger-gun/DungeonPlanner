import { getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import {
  getOutdoorTerrainCellLevel,
  OUTDOOR_TERRAIN_LEVEL_HEIGHT,
  type OutdoorTerrainHeightfield,
} from '../../store/outdoorTerrain'
import type {
  OutdoorGroundTextureCells,
  OutdoorGroundTextureType,
} from '../../store/useDungeonStore'

export type TerrainDirection = 'north' | 'east' | 'south' | 'west'
export type TerrainCorner = 'north-west' | 'north-east' | 'south-west' | 'south-east'

export type OutdoorTerrainTopSurface = {
  cell: GridCell
  cellKey: string
  level: number
  worldY: number
  textureType: OutdoorGroundTextureType | null
}

export type OutdoorTerrainEdgeDecoration = {
  cell: GridCell
  cellKey: string
  direction: TerrainDirection | TerrainCorner
  level: number
  worldY: number
}

export type OutdoorTerrainCliffSegment = {
  cell: GridCell
  cellKey: string
  direction: TerrainDirection | TerrainCorner
  worldY: number
  tall: boolean
}

const CARDINAL_DIRECTIONS: Array<{ direction: TerrainDirection; offset: GridCell }> = [
  { direction: 'north', offset: [0, -1] },
  { direction: 'east', offset: [1, 0] },
  { direction: 'south', offset: [0, 1] },
  { direction: 'west', offset: [-1, 0] },
]

const CORNER_DEFINITIONS = [
  { key: 'north-west' as const, directions: ['north', 'west'] as const },
  { key: 'north-east' as const, directions: ['north', 'east'] as const },
  { key: 'south-west' as const, directions: ['south', 'west'] as const },
  { key: 'south-east' as const, directions: ['south', 'east'] as const },
]

export function buildSteppedOutdoorTerrain(
  outdoorTerrainHeights: OutdoorTerrainHeightfield,
  outdoorGroundTextureCells: OutdoorGroundTextureCells,
) {
  const candidateCells = new Map<string, GridCell>()

  for (const record of Object.values(outdoorTerrainHeights)) {
    candidateCells.set(getCellKey(record.cell), record.cell)
    for (const { offset } of CARDINAL_DIRECTIONS) {
      const neighbor: GridCell = [record.cell[0] + offset[0], record.cell[1] + offset[1]]
      candidateCells.set(getCellKey(neighbor), neighbor)
    }
  }

  for (const record of Object.values(outdoorGroundTextureCells)) {
    candidateCells.set(getCellKey(record.cell), record.cell)
  }

  const topSurfaces: OutdoorTerrainTopSurface[] = []
  const topEdges: OutdoorTerrainEdgeDecoration[] = []
  const topCorners: OutdoorTerrainEdgeDecoration[] = []
  const cliffSides: OutdoorTerrainCliffSegment[] = []
  const cliffCorners: OutdoorTerrainCliffSegment[] = []
  const holeCells: GridCell[] = []

  for (const [cellKey, cell] of candidateCells) {
    const level = getOutdoorTerrainCellLevel(outdoorTerrainHeights, cell)
    const textureType = outdoorGroundTextureCells[cellKey]?.textureType ?? null
    const worldY = level * OUTDOOR_TERRAIN_LEVEL_HEIGHT

    if (level < 0) {
      holeCells.push(cell)
    }

    if (level !== 0 || textureType) {
      topSurfaces.push({ cell, cellKey, level, worldY, textureType })
    }

    const exposed = new Map<TerrainDirection, number>()

    for (const { direction, offset } of CARDINAL_DIRECTIONS) {
      const neighbor: GridCell = [cell[0] + offset[0], cell[1] + offset[1]]
      const neighborLevel = getOutdoorTerrainCellLevel(outdoorTerrainHeights, neighbor)
      const drop = level - neighborLevel
      if (drop <= 0) {
        continue
      }

      exposed.set(direction, drop)
      topEdges.push({ cell, cellKey, direction, level, worldY })

      let remainingDrop = drop
      let segmentBaseLevel = neighborLevel
      while (remainingDrop > 0) {
        const tall = remainingDrop >= 2
        cliffSides.push({
          cell,
          cellKey,
          direction,
          worldY: segmentBaseLevel * OUTDOOR_TERRAIN_LEVEL_HEIGHT,
          tall,
        })
        remainingDrop -= tall ? 2 : 1
        segmentBaseLevel += tall ? 2 : 1
      }
    }

    for (const corner of CORNER_DEFINITIONS) {
      const drops = corner.directions
        .map((direction) => exposed.get(direction) ?? 0)
        .filter((drop) => drop > 0)
      if (drops.length !== 2) {
        continue
      }

      topCorners.push({
        cell,
        cellKey,
        direction: corner.key,
        level,
        worldY,
      })

      let remainingDrop = Math.max(...drops)
      const cornerNeighborLevels = corner.directions.map((direction) => {
        if (direction === 'north') return getOutdoorTerrainCellLevel(outdoorTerrainHeights, [cell[0], cell[1] - 1])
        if (direction === 'east') return getOutdoorTerrainCellLevel(outdoorTerrainHeights, [cell[0] + 1, cell[1]])
        if (direction === 'south') return getOutdoorTerrainCellLevel(outdoorTerrainHeights, [cell[0], cell[1] + 1])
        return getOutdoorTerrainCellLevel(outdoorTerrainHeights, [cell[0] - 1, cell[1]])
      })
      let segmentBaseLevel = Math.min(...cornerNeighborLevels)
      while (remainingDrop > 0) {
        const tall = remainingDrop >= 2
        cliffCorners.push({
          cell,
          cellKey,
          direction: corner.key,
          worldY: segmentBaseLevel * OUTDOOR_TERRAIN_LEVEL_HEIGHT,
          tall,
        })
        remainingDrop -= tall ? 2 : 1
        segmentBaseLevel += tall ? 2 : 1
      }
    }
  }

  return {
    holeCells,
    topSurfaces,
    topEdges,
    topCorners,
    cliffSides,
    cliffCorners,
  }
}
