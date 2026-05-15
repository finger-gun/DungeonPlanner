import type { GridCell } from '../../hooks/useSnapToGrid'
import type { RoomBounds, RoomBoundaryRun } from '../../store/roomResize'

type DragHandle =
  | { kind: 'corner'; corner: 'nw' | 'ne' | 'se' | 'sw' }
  | { kind: 'edge'; edge: 'north' | 'south' | 'east' | 'west' }

export type RoomResizeDragState =
  | {
      kind: 'rect'
      handle: DragHandle
      bounds: RoomBounds
      valid: boolean
    }
  | {
      kind: 'run'
      run: RoomBoundaryRun
      boundary: number
      cells: GridCell[]
      valid: boolean
    }

export function areRoomBoundsEqual(left: RoomBounds, right: RoomBounds) {
  return left.minX === right.minX
    && left.maxX === right.maxX
    && left.minZ === right.minZ
    && left.maxZ === right.maxZ
}

export function areGridCellArraysEqual(left: readonly GridCell[], right: readonly GridCell[]) {
  return left.length === right.length
    && left.every((cell, index) => {
      const other = right[index]
      return other !== undefined && cell[0] === other[0] && cell[1] === other[1]
    })
}

export function shouldUpdateRoomResizeDragState(
  current: RoomResizeDragState,
  next: RoomResizeDragState,
) {
  if (current.kind !== next.kind || current.valid !== next.valid) {
    return true
  }

  if (current.kind === 'rect' && next.kind === 'rect') {
    return !areRoomBoundsEqual(current.bounds, next.bounds)
  }

  if (current.kind === 'run' && next.kind === 'run') {
    return current.boundary !== next.boundary
      || !areGridCellArraysEqual(current.cells, next.cells)
  }

  return true
}
