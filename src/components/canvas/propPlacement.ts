import type { ContentPackAsset, Connector, ConnectsTo, SnapsTo } from '../../content-packs/types'
import { GRID_SIZE, type GridCell, snapWorldPointToGrid, cellToWorldPosition } from '../../hooks/useSnapToGrid'
import type { PaintedCellRecord } from '../../store/useDungeonStore'

export type SnapResult = {
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  cell: GridCell
  cellKey: string
  connector: Connector
  parentObjectId: string | null
  localPosition: readonly [number, number, number] | null
  localRotation: readonly [number, number, number] | null
}

type WallSegment = {
  position: readonly [number, number, number]
  normal: readonly [number, number, number]
  direction: 'north' | 'south' | 'east' | 'west'
}

/**
 * Get default connector for an asset based on metadata
 */
function getDefaultConnector(asset: ContentPackAsset): Connector {
  const connectsTo = asset.metadata?.connectsTo ?? 'FLOOR'
  
  // Handle legacy PropConnector types
  if (connectsTo === 'FREE' || connectsTo === 'WALLFLOOR') {
    return {
      point: [0, 0, 0],
      type: 'FLOOR',
    }
  }
  
  // Handle new ConnectsTo types (including arrays)
  if (Array.isArray(connectsTo)) {
    // For arrays, use first type as default
    return {
      point: [0, 0, 0],
      type: connectsTo[0],
    }
  }
  
  // Single ConnectsTo value
  const type: ConnectsTo = connectsTo === 'WALL' ? 'WALL' : 
                          connectsTo === 'SURFACE' ? 'SURFACE' :
                          'FLOOR'
  
  return {
    point: [0, 0, 0],
    type,
  }
}

/**
 * Get all connectors for an asset (from metadata or inferred from connectsTo)
 */
function getAssetConnectors(asset: ContentPackAsset): Connector[] {
  // Explicit connectors take priority
  if (asset.metadata?.connectors && asset.metadata.connectors.length > 0) {
    return asset.metadata.connectors as Connector[]
  }
  
  const connectsTo = asset.metadata?.connectsTo
  
  // Handle array of connection types - create a connector for each
  if (Array.isArray(connectsTo)) {
    return connectsTo.map(type => ({
      point: [0, 0, 0] as readonly [number, number, number],
      type,
    }))
  }
  
  // Single connector
  return [getDefaultConnector(asset)]
}

/**
 * Snap position to grid center based on snapsTo mode
 */
function applyGridSnapping(
  worldPos: readonly [number, number, number],
  snapsTo: SnapsTo,
  connectType: ConnectsTo,
): readonly [number, number, number] {
  if (snapsTo !== 'GRID') {
    return worldPos
  }
  
  if (connectType === 'FLOOR') {
    // Snap to grid cell center
    const snappedX = Math.round(worldPos[0] / GRID_SIZE) * GRID_SIZE
    const snappedZ = Math.round(worldPos[2] / GRID_SIZE) * GRID_SIZE
    return [snappedX, worldPos[1], snappedZ]
  }
  
  if (connectType === 'WALL') {
    // Snap to wall segment center (walls are on grid boundaries)
    // For now, just snap X and Z to grid
    const snappedX = Math.round(worldPos[0] / GRID_SIZE) * GRID_SIZE
    const snappedZ = Math.round(worldPos[2] / GRID_SIZE) * GRID_SIZE
    return [snappedX, worldPos[1], snappedZ]
  }
  
  return worldPos
}

/**
 * Find nearby wall segments within threshold distance
 */
function findNearbyWalls(
  point: readonly [number, number, number],
  paintedCells: Record<string, PaintedCellRecord>,
  threshold: number = GRID_SIZE / 4, // 0.5 grid units = 1 meter with GRID_SIZE=2
): WallSegment[] {
  const walls: WallSegment[] = []
  const [x, , z] = point
  
  // Check for walls on grid boundaries
  // Walls exist between painted cells
  const snapped = snapWorldPointToGrid({ x, y: 0, z })
  const cell = snapped.cell
  
  // Check all four directions for walls
  const directions: Array<{ dir: 'north' | 'south' | 'east' | 'west'; dx: number; dz: number; normal: readonly [number, number, number] }> = [
    { dir: 'north', dx: 0, dz: -1, normal: [0, 0, 1] },  // Wall to north, facing south
    { dir: 'south', dx: 0, dz: 1, normal: [0, 0, -1] },  // Wall to south, facing north
    { dir: 'east', dx: 1, dz: 0, normal: [-1, 0, 0] },   // Wall to east, facing west
    { dir: 'west', dx: -1, dz: 0, normal: [1, 0, 0] },   // Wall to west, facing east
  ]
  
  for (const { dir, dx, dz, normal } of directions) {
    const neighborCell: GridCell = [cell[0] + dx, cell[1] + dz]
    const neighborKey = `${neighborCell[0]}:${neighborCell[1]}`
    const currentKey = `${cell[0]}:${cell[1]}`
    
    // Wall exists if one cell is painted and the other isn't (or different rooms)
    const hasCurrent = !!paintedCells[currentKey]
    const hasNeighbor = !!paintedCells[neighborKey]
    
    if (hasCurrent && !hasNeighbor) {
      // Wall on this boundary
      let wallPos: readonly [number, number, number]
      
      if (dir === 'north') {
        wallPos = [cell[0] * GRID_SIZE, 0, cell[1] * GRID_SIZE - GRID_SIZE / 2]
      } else if (dir === 'south') {
        wallPos = [cell[0] * GRID_SIZE, 0, cell[1] * GRID_SIZE + GRID_SIZE / 2]
      } else if (dir === 'east') {
        wallPos = [cell[0] * GRID_SIZE + GRID_SIZE / 2, 0, cell[1] * GRID_SIZE]
      } else { // west
        wallPos = [cell[0] * GRID_SIZE - GRID_SIZE / 2, 0, cell[1] * GRID_SIZE]
      }
      
      // Check if within threshold distance
      const distance = Math.sqrt(
        Math.pow(x - wallPos[0], 2) + Math.pow(z - wallPos[2], 2)
      )
      
      if (distance <= threshold) {
        walls.push({
          position: wallPos,
          normal,
          direction: dir,
        })
      }
    }
  }
  
  return walls
}

/**
 * Calculate rotation to align connector with wall normal
 */
function calculateWallRotation(
  wallNormal: readonly [number, number, number],
  connectorRotation?: readonly [number, number, number],
): readonly [number, number, number] {
  // Calculate Y rotation to face away from wall
  let yRotation = 0
  
  if (wallNormal[0] === 1) yRotation = Math.PI / 2      // West wall, face east
  else if (wallNormal[0] === -1) yRotation = -Math.PI / 2  // East wall, face west
  else if (wallNormal[2] === 1) yRotation = Math.PI     // North wall, face south
  else if (wallNormal[2] === -1) yRotation = 0          // South wall, face north
  
  // Apply connector's base rotation if specified
  if (connectorRotation) {
    return [
      connectorRotation[0],
      yRotation + connectorRotation[1],
      connectorRotation[2],
    ]
  }
  
  return [0, yRotation, 0]
}

/**
 * Calculate snap position for a prop with advanced placement logic
 */
export function calculatePropSnapPosition(
  asset: ContentPackAsset,
  cursorPoint: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  surfaceHit: { position: readonly [number, number, number]; objectId: string; cell: GridCell } | null,
): SnapResult | null {
  const connectors = getAssetConnectors(asset)
  const snapsTo = asset.metadata?.snapsTo ?? 'FREE'
  const point: readonly [number, number, number] = [cursorPoint.x, cursorPoint.y, cursorPoint.z]
  
  // Check for nearby walls (for WALL connectors)
  const nearbyWalls = findNearbyWalls(point, paintedCells)
  
  // Choose best connector based on context
  let chosenConnector: Connector | null = null
  let finalPosition: readonly [number, number, number] = point
  let finalRotation: readonly [number, number, number] = [0, 0, 0]
  let parentObjectId: string | null = null
  let localPosition: readonly [number, number, number] | null = null
  let localRotation: readonly [number, number, number] | null = null
  
  // Priority: WALL > SURFACE > FLOOR
  const wallConnector = connectors.find(c => c.type === 'WALL')
  const surfaceConnector = connectors.find(c => c.type === 'SURFACE')
  const floorConnector = connectors.find(c => c.type === 'FLOOR')
  
  if (wallConnector && nearbyWalls.length > 0) {
    // Snap to nearest wall
    const wall = nearbyWalls[0]
    chosenConnector = wallConnector
    
    // Position connector point at wall surface
    const connectorOffset = wallConnector.point
    finalPosition = [
      wall.position[0] - connectorOffset[0],
      wall.position[1] - connectorOffset[1],
      wall.position[2] - connectorOffset[2],
    ]
    
    // Apply grid snapping if enabled
    finalPosition = applyGridSnapping(finalPosition, snapsTo, 'WALL')
    
    // Rotate to face away from wall
    finalRotation = calculateWallRotation(wall.normal, wallConnector.rotation)
    
  } else if (surfaceConnector && surfaceHit) {
    // Place on surface
    chosenConnector = surfaceConnector
    
    const connectorOffset = surfaceConnector.point
    finalPosition = [
      surfaceHit.position[0] - connectorOffset[0],
      surfaceHit.position[1] - connectorOffset[1],
      surfaceHit.position[2] - connectorOffset[2],
    ]
    
    parentObjectId = surfaceHit.objectId
    localPosition = [0, 0, 0]  // Offset from parent
    localRotation = surfaceConnector.rotation ?? [0, 0, 0]
    
  } else if (floorConnector) {
    // Default to floor placement
    chosenConnector = floorConnector
    
    const snapped = snapWorldPointToGrid(cursorPoint)
    const cellCenter = cellToWorldPosition(snapped.cell)
    
    const connectorOffset = floorConnector.point
    let basePosition: readonly [number, number, number] = [
      cursorPoint.x - connectorOffset[0],
      0 - connectorOffset[1],
      cursorPoint.z - connectorOffset[2],
    ]
    
    // Apply grid snapping if enabled
    if (snapsTo === 'GRID') {
      basePosition = [
        cellCenter[0] - connectorOffset[0],
        0 - connectorOffset[1],
        cellCenter[2] - connectorOffset[2],
      ]
    }
    
    finalPosition = basePosition
    finalRotation = floorConnector.rotation ?? [0, 0, 0]
  }
  
  if (!chosenConnector) {
    return null
  }
  
  // Get cell for final position
  const snapped = snapWorldPointToGrid({ x: finalPosition[0], y: finalPosition[1], z: finalPosition[2] })
  
  // Check if cell is painted (required for placement)
  if (!paintedCells[snapped.key] && !parentObjectId) {
    return null
  }
  
  return {
    position: finalPosition,
    rotation: finalRotation,
    cell: snapped.cell,
    cellKey: snapped.key,
    connector: chosenConnector,
    parentObjectId,
    localPosition,
    localRotation,
  }
}
