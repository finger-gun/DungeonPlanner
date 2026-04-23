import { getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import {
  getOutdoorTerrainCellLevel,
  OUTDOOR_TERRAIN_LEVEL_HEIGHT,
  type OutdoorTerrainHeightfield,
} from '../../store/outdoorTerrain'
import type { OutdoorTerrainStyleCells } from '../../store/useDungeonStore'
import {
  DEFAULT_OUTDOOR_TERRAIN_STYLE,
  type OutdoorTerrainStyle,
} from '../../store/outdoorTerrainStyles'

export type TerrainDirection = 'north' | 'east' | 'south' | 'west'
export type TerrainCorner = 'north-west' | 'north-east' | 'south-west' | 'south-east'

export type OutdoorTerrainTopSurface = {
  cell: GridCell
  cellKey: string
  level: number
  worldY: number
  terrainStyle: OutdoorTerrainStyle
  explicitStyle: boolean
  usesSteppedAsset: boolean
}

export type OutdoorTerrainEdgeDecoration = {
  cell: GridCell
  cellKey: string
  direction: TerrainDirection | TerrainCorner
  level: number
  worldY: number
  terrainStyle: OutdoorTerrainStyle
}

export type OutdoorTerrainCliffSegment = {
  cell: GridCell
  cellKey: string
  direction: TerrainDirection | TerrainCorner
  worldY: number
  tall: boolean
  terrainStyle: OutdoorTerrainStyle
}

export type OutdoorTerrainStyleTransition = {
  cell: GridCell
  cellKey: string
  direction: TerrainDirection
  worldY: number
  sourceTerrainStyle: OutdoorTerrainStyle
  targetTerrainStyle: OutdoorTerrainStyle
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

function getResolvedTerrainStyle(
  cellKey: string,
  outdoorTerrainStyleCells: OutdoorTerrainStyleCells,
  defaultOutdoorTerrainStyle: OutdoorTerrainStyle,
) {
  return outdoorTerrainStyleCells[cellKey]?.terrainStyle ?? defaultOutdoorTerrainStyle
}

export function buildSteppedOutdoorTerrain(
  outdoorTerrainHeights: OutdoorTerrainHeightfield,
  outdoorTerrainStyleCells: OutdoorTerrainStyleCells,
  defaultOutdoorTerrainStyle: OutdoorTerrainStyle = DEFAULT_OUTDOOR_TERRAIN_STYLE,
) {
  const candidateCells = new Map<string, GridCell>()

  for (const record of Object.values(outdoorTerrainHeights)) {
    candidateCells.set(getCellKey(record.cell), record.cell)
    for (const { offset } of CARDINAL_DIRECTIONS) {
      const neighbor: GridCell = [record.cell[0] + offset[0], record.cell[1] + offset[1]]
      candidateCells.set(getCellKey(neighbor), neighbor)
    }
  }

  for (const record of Object.values(outdoorTerrainStyleCells)) {
    candidateCells.set(getCellKey(record.cell), record.cell)
    for (const { offset } of CARDINAL_DIRECTIONS) {
      const neighbor: GridCell = [record.cell[0] + offset[0], record.cell[1] + offset[1]]
      candidateCells.set(getCellKey(neighbor), neighbor)
    }
  }

  const topSurfaces: OutdoorTerrainTopSurface[] = []
  const topEdges: OutdoorTerrainEdgeDecoration[] = []
  const topCorners: OutdoorTerrainEdgeDecoration[] = []
  const cliffSides: OutdoorTerrainCliffSegment[] = []
  const cliffCorners: OutdoorTerrainCliffSegment[] = []
  const styleTransitions: OutdoorTerrainStyleTransition[] = []
  const holeCells: GridCell[] = []

  for (const [cellKey, cell] of candidateCells) {
    const level = getOutdoorTerrainCellLevel(outdoorTerrainHeights, cell)
    const terrainStyle = getResolvedTerrainStyle(cellKey, outdoorTerrainStyleCells, defaultOutdoorTerrainStyle)
    const explicitStyle = Boolean(outdoorTerrainStyleCells[cellKey])
    const worldY = level * OUTDOOR_TERRAIN_LEVEL_HEIGHT
    let hasElevationBoundary = false

    if (level < 0) {
      holeCells.push(cell)
    }

    const exposed = new Map<TerrainDirection, number>()

    for (const { direction, offset } of CARDINAL_DIRECTIONS) {
      const neighbor: GridCell = [cell[0] + offset[0], cell[1] + offset[1]]
      const neighborKey = getCellKey(neighbor)
      const neighborLevel = getOutdoorTerrainCellLevel(outdoorTerrainHeights, neighbor)
      const neighborTerrainStyle = getResolvedTerrainStyle(neighborKey, outdoorTerrainStyleCells, defaultOutdoorTerrainStyle)
      if (neighborLevel !== level) {
        hasElevationBoundary = true
      }
      const drop = level - neighborLevel
      if (drop > 0) {
        exposed.set(direction, drop)
        topEdges.push({ cell, cellKey, direction, level, worldY, terrainStyle })

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
            terrainStyle,
          })
          remainingDrop -= tall ? 2 : 1
          segmentBaseLevel += tall ? 2 : 1
        }
      }

      if (neighborLevel === level && neighborTerrainStyle !== terrainStyle) {
        styleTransitions.push({
          cell,
          cellKey,
          direction,
          worldY,
          sourceTerrainStyle: terrainStyle,
          targetTerrainStyle: neighborTerrainStyle,
        })
      }
    }

    const usesSteppedAsset = level !== 0 || exposed.size > 0 || hasElevationBoundary

    if (usesSteppedAsset || explicitStyle) {
      topSurfaces.push({ cell, cellKey, level, worldY, terrainStyle, explicitStyle, usesSteppedAsset })
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
        terrainStyle,
      })

      let remainingDrop = Math.min(...drops)
      let segmentBaseLevel = worldY / OUTDOOR_TERRAIN_LEVEL_HEIGHT - Math.min(...drops)
      while (remainingDrop > 0) {
        const tall = remainingDrop >= 2
        cliffCorners.push({
          cell,
          cellKey,
          direction: corner.key,
          worldY: segmentBaseLevel * OUTDOOR_TERRAIN_LEVEL_HEIGHT,
          tall,
          terrainStyle,
        })
        remainingDrop -= tall ? 2 : 1
        segmentBaseLevel += tall ? 2 : 1
      }
    }
  }

  return {
    topSurfaces,
    topEdges,
    topCorners,
    cliffSides,
    cliffCorners,
    styleTransitions,
    holeCells,
  }
}
