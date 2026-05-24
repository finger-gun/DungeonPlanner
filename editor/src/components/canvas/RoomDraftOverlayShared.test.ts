import { describe, expect, it } from 'vitest'
import {
  getRoomDraftOverlayMaterialProps,
  ROOM_DRAFT_OVERLAY_RENDER_ORDER,
} from './RoomDraftOverlayShared'

describe('RoomDraftOverlayShared', () => {
  it('renders the draft overlay above scene geometry', () => {
    expect(getRoomDraftOverlayMaterialProps(0.75)).toEqual({
      transparent: true,
      opacity: 0.75,
      depthTest: false,
      depthWrite: false,
    })
    expect(ROOM_DRAFT_OVERLAY_RENDER_ORDER).toEqual({
      fill: 30,
      outline: 31,
      handles: 32,
    })
  })
})
