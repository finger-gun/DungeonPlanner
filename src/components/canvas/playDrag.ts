import {
  cellToWorldPosition,
  snapWorldPointToGrid,
  type GridCell,
  type Vector3Like,
} from '../../hooks/useSnapToGrid'

const DRAG_LIFT_Y = 0.24

export type PlayDragState = {
  objectId: string
  assetId: string | null
  rotation: [number, number, number]
  positionY: number
  cell: GridCell
  position: [number, number, number]
  displayPosition: [number, number, number]
  grabOffset: [number, number]
  valid: boolean
  animationState: 'pickup' | 'holding'
}

type DragObjectSnapshot = {
  id: string
  assetId: string | null
  rotation: [number, number, number]
  position: [number, number, number]
  cell: GridCell
}

export function createPlayDragState(
  object: DragObjectSnapshot,
  pointerPoint?: Vector3Like | null,
): PlayDragState {
  const snappedPosition = cellToWorldPosition(object.cell)
  const grabOffset: [number, number] = pointerPoint
    ? [object.position[0] - pointerPoint.x, object.position[2] - pointerPoint.z]
    : [0, 0]

  return {
    objectId: object.id,
    assetId: object.assetId,
    rotation: object.rotation,
    positionY: object.position[1],
    cell: object.cell,
    position: [snappedPosition[0], object.position[1], snappedPosition[2]],
    displayPosition: [object.position[0], object.position[1] + DRAG_LIFT_Y, object.position[2]],
    grabOffset,
    valid: true,
    animationState: 'pickup',
  }
}

export function updatePlayDragState(
  state: PlayDragState,
  pointerPoint: Vector3Like,
  targetPainted: boolean,
  occupantId?: string,
): PlayDragState {
  const displayX = pointerPoint.x + state.grabOffset[0]
  const displayZ = pointerPoint.z + state.grabOffset[1]
  const snapped = snapWorldPointToGrid({ x: displayX, y: pointerPoint.y, z: displayZ })
  const valid = targetPainted && (!occupantId || occupantId === state.objectId)

  return {
    ...state,
    cell: snapped.cell,
    position: [snapped.position[0], state.positionY, snapped.position[2]],
    displayPosition: [displayX, state.positionY + DRAG_LIFT_Y, displayZ],
    valid,
  }
}
