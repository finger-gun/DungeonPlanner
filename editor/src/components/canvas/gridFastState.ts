import type { GridCell } from '../../hooks/useSnapToGrid'
import type { RoomWallEditTarget } from './roomWallBrush'

type StrokeMode = 'paint' | 'erase' | null

export type GridHoverInteractionState = {
  hoveredOpenWallKey: string | null
  hoveredRoomWallEditTarget: RoomWallEditTarget | null
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

export type RoomWallBrushState = {
  active: boolean
  mode: StrokeMode
  targets: readonly RoomWallEditTarget[]
}

export function shouldUpdateGridHoverInteractionState(
  current: GridHoverInteractionState,
  next: GridHoverInteractionState,
) {
  return current.hoveredOpenWallKey !== next.hoveredOpenWallKey
    || !areRoomWallEditTargetsEqual(
      current.hoveredRoomWallEditTarget,
      next.hoveredRoomWallEditTarget,
    )
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

export function shouldUpdateRoomWallBrushState(
  current: RoomWallBrushState,
  next: RoomWallBrushState,
) {
  return current.active !== next.active
    || current.mode !== next.mode
    || !areRoomWallEditTargetArraysEqual(current.targets, next.targets)
}

export function areRoomWallEditTargetsEqual(
  left: RoomWallEditTarget | null,
  right: RoomWallEditTarget | null,
) {
  return (
    left === right ||
    (
      left !== null &&
      right !== null &&
      left.wallKey === right.wallKey &&
      left.kind === right.kind
    )
  )
}

export function areRoomWallEditTargetArraysEqual(
  left: readonly RoomWallEditTarget[],
  right: readonly RoomWallEditTarget[],
) {
  return left.length === right.length
    && left.every((target, index) => areRoomWallEditTargetsEqual(target, right[index] ?? null))
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
