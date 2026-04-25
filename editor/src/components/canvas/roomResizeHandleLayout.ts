import type { RoomResizeEdge } from '../../store/roomResize'

const OVERLAY_Y = 0.3
const EDGE_THICKNESS = 0.08
const HANDLE_SIZE = 0.36
const CORNER_HIT_SIZE = 0.72
const EDGE_HIT_HEIGHT = 0.24
const EDGE_END_GUARD = CORNER_HIT_SIZE / 2 + 0.08
const MIN_EDGE_HIT_LENGTH = 0.24

type WorldRect = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

function getEdgeHitLength(length: number) {
  return Math.min(length, Math.max(length - EDGE_END_GUARD * 2, MIN_EDGE_HIT_LENGTH))
}

export function getCornerHandleLayout() {
  return {
    visibleScale: [HANDLE_SIZE, 0.12, HANDLE_SIZE] as [number, number, number],
    hitScale: [CORNER_HIT_SIZE, EDGE_HIT_HEIGHT, CORNER_HIT_SIZE] as [number, number, number],
  }
}

export function getEdgeProps(
  edge: RoomResizeEdge,
  rect: WorldRect,
  centerX: number,
  centerZ: number,
  width: number,
  depth: number,
) {
  const horizontalHitLength = getEdgeHitLength(width)
  const verticalHitLength = getEdgeHitLength(depth)

  switch (edge) {
    case 'north':
      return {
        position: [centerX, OVERLAY_Y, rect.maxZ] as [number, number, number],
        size: [width, 0.02, EDGE_THICKNESS] as [number, number, number],
        hitScale: [horizontalHitLength, EDGE_HIT_HEIGHT, Math.max(EDGE_THICKNESS, HANDLE_SIZE)] as [number, number, number],
      }
    case 'south':
      return {
        position: [centerX, OVERLAY_Y, rect.minZ] as [number, number, number],
        size: [width, 0.02, EDGE_THICKNESS] as [number, number, number],
        hitScale: [horizontalHitLength, EDGE_HIT_HEIGHT, Math.max(EDGE_THICKNESS, HANDLE_SIZE)] as [number, number, number],
      }
    case 'east':
      return {
        position: [rect.maxX, OVERLAY_Y, centerZ] as [number, number, number],
        size: [EDGE_THICKNESS, 0.02, depth] as [number, number, number],
        hitScale: [Math.max(EDGE_THICKNESS, HANDLE_SIZE), EDGE_HIT_HEIGHT, verticalHitLength] as [number, number, number],
      }
    case 'west':
      return {
        position: [rect.minX, OVERLAY_Y, centerZ] as [number, number, number],
        size: [EDGE_THICKNESS, 0.02, depth] as [number, number, number],
        hitScale: [Math.max(EDGE_THICKNESS, HANDLE_SIZE), EDGE_HIT_HEIGHT, verticalHitLength] as [number, number, number],
      }
  }
}
