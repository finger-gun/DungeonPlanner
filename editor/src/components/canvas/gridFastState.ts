import type { GridCell } from '../../hooks/useSnapToGrid'

type StrokeMode = 'paint' | 'erase' | null

export type GridHoverInteractionState = {
  hoveredOpenWallKey: string | null
}

export type GridStrokeState = {
  mode: StrokeMode
  startCell: GridCell | null
  currentCell: GridCell | null
}

export type OpenPassageBrushState = {
  active: boolean
  wallKeys: readonly string[]
}

export function shouldUpdateGridHoverInteractionState(
  current: GridHoverInteractionState,
  next: GridHoverInteractionState,
) {
  return current.hoveredOpenWallKey !== next.hoveredOpenWallKey
}

export function shouldUpdateGridStrokeState(
  current: GridStrokeState,
  next: GridStrokeState,
) {
  return current.mode !== next.mode
    || !areGridCellsEqual(current.startCell, next.startCell)
    || !areGridCellsEqual(current.currentCell, next.currentCell)
}

export function shouldUpdateOpenPassageBrushState(
  current: OpenPassageBrushState,
  next: OpenPassageBrushState,
) {
  return current.active !== next.active
    || !areStringArraysEqual(current.wallKeys, next.wallKeys)
}

function areStringArraysEqual(left: readonly string[], right: readonly string[]) {
  return left.length === right.length
    && left.every((value, index) => value === right[index])
}

function areGridCellsEqual(left: GridCell | null, right: GridCell | null) {
  return (
    left === right ||
    (
      left !== null &&
      right !== null &&
      left[0] === right[0] &&
      left[1] === right[1]
    )
  )
}
