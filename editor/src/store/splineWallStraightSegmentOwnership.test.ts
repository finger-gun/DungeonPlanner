import { describe, expect, it } from 'vitest'
import { findOwningStraightSegmentCandidate } from './splineWallStraightSegmentOwnership'

describe('findOwningStraightSegmentCandidate', () => {
  it('breaks near-endpoint ties by preferring the segment whose tangent matches the endpoint extension', () => {
    const horizontal = {
      id: 'horizontal',
      start: [0, 0] as const,
      end: [2, 0] as const,
      tangent: [1, 0] as const,
    }
    const vertical = {
      id: 'vertical',
      start: [0, 0] as const,
      end: [0, 1] as const,
      tangent: [0, 1] as const,
    }

    const owner = findOwningStraightSegmentCandidate([2.1, 2.7], [horizontal, vertical], 1e-5)

    expect(owner?.id).toBe('vertical')
  })
})
