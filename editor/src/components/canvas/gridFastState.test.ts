import { describe, expect, it } from 'vitest'
import {
  areRoomWallEditTargetArraysEqual,
  areRoomWallEditTargetsEqual,
  shouldUpdateGridHoverInteractionState,
  shouldUpdateGridStrokeState,
  shouldUpdateOpenPassageBrushState,
  shouldUpdateRoomWallBrushState,
} from './gridFastState'

describe('gridFastState', () => {
  it('detects meaningful hover interaction changes', () => {
    const current = {
      hoveredOpenWallKey: '1:2:north',
      hoveredRoomWallEditTarget: { wallKey: '1:2:north', kind: 'shared' as const },
    }

    expect(shouldUpdateGridHoverInteractionState(current, current)).toBe(false)
    expect(shouldUpdateGridHoverInteractionState(current, {
      ...current,
      hoveredOpenWallKey: '1:2:south',
    })).toBe(true)
    expect(shouldUpdateGridHoverInteractionState(current, {
      ...current,
      hoveredRoomWallEditTarget: { wallKey: '1:2:north', kind: 'inner' },
    })).toBe(true)
  })

  it('detects stroke changes by semantic cell equality', () => {
    expect(shouldUpdateGridStrokeState(
      { mode: 'paint', startCell: [1, 2], currentCell: [3, 4] },
      { mode: 'paint', startCell: [1, 2], currentCell: [3, 4] },
    )).toBe(false)

    expect(shouldUpdateGridStrokeState(
      { mode: 'paint', startCell: [1, 2], currentCell: [3, 4] },
      { mode: 'erase', startCell: [1, 2], currentCell: [3, 4] },
    )).toBe(true)
  })

  it('detects brush changes only when keys or targets differ', () => {
    expect(shouldUpdateOpenPassageBrushState(
      { active: true, wallKeys: ['a', 'b'] },
      { active: true, wallKeys: ['a', 'b'] },
    )).toBe(false)
    expect(shouldUpdateOpenPassageBrushState(
      { active: true, wallKeys: ['a', 'b'] },
      { active: true, wallKeys: ['a', 'c'] },
    )).toBe(true)

    expect(shouldUpdateRoomWallBrushState(
      { active: true, mode: 'paint', targets: [{ wallKey: 'a', kind: 'shared' }] },
      { active: true, mode: 'paint', targets: [{ wallKey: 'a', kind: 'shared' }] },
    )).toBe(false)
    expect(shouldUpdateRoomWallBrushState(
      { active: true, mode: 'paint', targets: [{ wallKey: 'a', kind: 'shared' }] },
      { active: true, mode: 'paint', targets: [{ wallKey: 'a', kind: 'inner' }] },
    )).toBe(true)
  })

  it('compares wall edit targets semantically', () => {
    expect(areRoomWallEditTargetsEqual(
      { wallKey: 'a', kind: 'shared' },
      { wallKey: 'a', kind: 'shared' },
    )).toBe(true)
    expect(areRoomWallEditTargetsEqual(
      { wallKey: 'a', kind: 'shared' },
      { wallKey: 'a', kind: 'inner' },
    )).toBe(false)

    expect(areRoomWallEditTargetArraysEqual(
      [{ wallKey: 'a', kind: 'shared' }, { wallKey: 'b', kind: 'inner' }],
      [{ wallKey: 'a', kind: 'shared' }, { wallKey: 'b', kind: 'inner' }],
    )).toBe(true)
  })
})
