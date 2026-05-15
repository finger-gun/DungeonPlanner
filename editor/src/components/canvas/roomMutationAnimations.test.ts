import { describe, expect, it } from 'vitest'
import {
  buildTransientRoomEntrySignature,
  expandRoomMutationCells,
  getBuildAnimationTargetsForWallKeys,
  getCellsForWallKeys,
} from './roomMutationAnimations'

describe('roomMutationAnimations', () => {
  it('expands affected cells to include orthogonal neighbors', () => {
    expect(expandRoomMutationCells([[4, 7]])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [3, 7],
        [5, 7],
        [4, 6],
        [4, 8],
      ]),
    )
  })

  it('collects cells from both sides of wall keys for every direction', () => {
    expect(getCellsForWallKeys(['4:7:east'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [5, 7],
      ]),
    )
    expect(getCellsForWallKeys(['4:7:west'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [3, 7],
      ]),
    )
    expect(getCellsForWallKeys(['4:7:north'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [4, 8],
      ]),
    )
    expect(getCellsForWallKeys(['4:7:south'])).toEqual(
      expect.arrayContaining([
        [4, 7],
        [4, 6],
      ]),
    )
  })

  it('builds wall animation targets keyed by the wall segments themselves', () => {
    expect(getBuildAnimationTargetsForWallKeys(['4:7:east', '4:7:east', '4:7:north'])).toEqual([
      { key: '4:7:east', cell: [4, 7] },
      { key: '4:7:north', cell: [4, 7] },
    ])
  })

  it('distinguishes corner ghosts that reuse a vertex with different supporting walls', () => {
    expect(buildTransientRoomEntrySignature({
      key: '1:1:corner',
      assetId: 'dungeon.props_pillars_pillar',
      position: [2, 0, 2],
      rotation: [0, 0, 0],
      variant: 'prop',
      variantKey: '1:1:corner',
      visibility: 'visible',
      objectProps: {
        __transientCornerWallKeys: '0:0:north|0:0:east',
      },
    })).not.toBe(buildTransientRoomEntrySignature({
      key: '1:1:corner',
      assetId: 'dungeon.props_pillars_pillar',
      position: [2, 0, 2],
      rotation: [0, 0, 0],
      variant: 'prop',
      variantKey: '1:1:corner',
      visibility: 'visible',
      objectProps: {
        __transientCornerWallKeys: '0:0:north|1:0:west',
      },
    }))
  })
})
