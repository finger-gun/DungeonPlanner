export const ROOM_DRAFT_OVERLAY_RENDER_ORDER = {
  fill: 30,
  outline: 31,
  handles: 32,
} as const

export function getRoomDraftOverlayMaterialProps(opacity: number) {
  return {
    transparent: true as const,
    opacity,
    depthTest: false as const,
    depthWrite: false as const,
  }
}
