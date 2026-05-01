import { describe, expect, it } from 'vitest'
import { getBuildAnimationCellKeyFromWallKeys, getOpeningHitboxSize } from './DungeonRoom'
import { deriveWallCornersFromSegments } from './wallCornerLayout'
import { shouldActivateFloorReceiver } from './floorReceiverMode'

describe('deriveWallCornersFromSegments', () => {
  it('creates passage-end corners from surviving orthogonal wall segments', () => {
    const corners = deriveWallCornersFromSegments([
      { key: '0:0:north' },
      { key: '0:0:west' },
      { key: '2:0:north' },
      { key: '3:0:west' },
    ])

    expect(corners).toHaveLength(2)
    expect(corners).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: '0:1:corner',
          wallKeys: expect.arrayContaining(['0:0:north', '0:0:west']),
          position: [0, 0, 2],
        }),
        expect.objectContaining({
          key: '3:1:corner',
          wallKeys: expect.arrayContaining(['2:0:north', '3:0:west']),
          position: [6, 0, 2],
        }),
      ]),
    )
  })

  it('does not create corners for straight wall runs', () => {
    const corners = deriveWallCornersFromSegments([
      { key: '0:0:north' },
      { key: '1:0:north' },
    ])

    expect(corners).toHaveLength(0)
  })

  it('only activates floor receivers in play mode unless the debug mesh is shown', () => {
    expect(shouldActivateFloorReceiver('room', false)).toBe(false)
    expect(shouldActivateFloorReceiver('move', false)).toBe(false)
    expect(shouldActivateFloorReceiver('play', false)).toBe(true)
    expect(shouldActivateFloorReceiver('room', true)).toBe(true)
  })

  it('uses the same hitbox dimensions for asset-backed openings and open passages', () => {
    expect(getOpeningHitboxSize(1)).toEqual([1.9, 2.2, 0.1])
    expect(getOpeningHitboxSize(3)).toEqual([5.699999999999999, 2.2, 0.1])
  })

  it('resolves build animation cell keys from adjacent wall keys instead of corner vertex keys', () => {
    expect(getBuildAnimationCellKeyFromWallKeys(['0:0:north', '0:0:west'])).toBe('0:0')
    expect(getBuildAnimationCellKeyFromWallKeys(['2:0:north', '3:0:west'])).toBe('2:0')
  })

  it('prefers an active adjacent wall cell when choosing build animation timing', () => {
    expect(
      getBuildAnimationCellKeyFromWallKeys(['2:0:north', '3:0:west'], (cellKey) => cellKey === '3:0'),
    ).toBe('3:0')
  })
})
