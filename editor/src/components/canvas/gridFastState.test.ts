import { describe, expect, it } from 'vitest'
import {
  shouldUpdateGridHoverInteractionState,
  shouldUpdateGridStrokeState,
  shouldUpdateOpenPassageBrushState,
} from './gridFastState'

describe('gridFastState', () => {
  it('detects meaningful hover interaction changes', () => {
    const current = {
      hoveredOpenWallKey: '1:2:north',
    }

    expect(shouldUpdateGridHoverInteractionState(current, current)).toBe(false)
    expect(shouldUpdateGridHoverInteractionState(current, {
      ...current,
      hoveredOpenWallKey: '1:2:south',
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

  it('detects brush changes only when keys differ', () => {
    expect(shouldUpdateOpenPassageBrushState(
      { active: true, wallKeys: ['a', 'b'] },
      { active: true, wallKeys: ['a', 'b'] },
    )).toBe(false)
    expect(shouldUpdateOpenPassageBrushState(
      { active: true, wallKeys: ['a', 'b'] },
      { active: true, wallKeys: ['a', 'c'] },
    )).toBe(true)
  })
})
