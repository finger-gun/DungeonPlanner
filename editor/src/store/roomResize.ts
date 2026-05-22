import { GRID_SIZE } from '../hooks/useSnapToGrid'

export type RoomBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export type RoomResizeCorner = 'nw' | 'ne' | 'sw' | 'se'
export type RoomResizeEdge = 'north' | 'south' | 'east' | 'west'

export function snapWorldToBoundary(value: number) {
  return Math.round(value / GRID_SIZE)
}

export function resizeBoundsFromEdge(
  bounds: RoomBounds,
  edge: RoomResizeEdge,
  boundary: number,
): RoomBounds {
  switch (edge) {
    case 'north':
      return {
        ...bounds,
        maxZ: clampBoundary(boundary, bounds.minZ, 1) - 1,
      }
    case 'south':
      return {
        ...bounds,
        minZ: clampBoundary(boundary, bounds.maxZ + 1, -1),
      }
    case 'east':
      return {
        ...bounds,
        maxX: clampBoundary(boundary, bounds.minX, 1) - 1,
      }
    case 'west':
      return {
        ...bounds,
        minX: clampBoundary(boundary, bounds.maxX + 1, -1),
      }
  }
}

function clampBoundary(value: number, anchor: number, direction: -1 | 1) {
  if (direction === -1) {
    return Math.min(value, anchor - 1)
  }

  return Math.max(value, anchor + 1)
}
