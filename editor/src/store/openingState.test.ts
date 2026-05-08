import { describe, expect, it } from 'vitest'
import { getOpeningObjectProps, getOpeningPlayModeNextProps, isOpeningOpen } from './openingState'
import type { OpeningRecord } from './useDungeonStore'

describe('openingState', () => {
  it('treats open passages as open and preserves empty props', () => {
    const opening: OpeningRecord = {
      id: 'opening-1',
      assetId: null,
      wallKey: '0:0:north',
      width: 1,
      layerId: 'default',
    }

    expect(isOpeningOpen(opening)).toBe(true)
    expect(getOpeningObjectProps(opening)).toEqual({})
    expect(getOpeningPlayModeNextProps(opening)).toBeNull()
  })

  it('derives door state from object props and asset play-mode behavior', () => {
    const opening: OpeningRecord = {
      id: 'opening-2',
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      layerId: 'default',
      objectProps: {},
    }

    expect(isOpeningOpen(opening)).toBe(false)
    expect(getOpeningPlayModeNextProps(opening)).toEqual({ open: true })
    expect(isOpeningOpen({ ...opening, objectProps: { open: true } })).toBe(true)
  })

})
