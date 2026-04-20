import { describe, expect, it } from 'vitest'
import { easePlayerCameraFocusProgress, getPlayerCameraFocusPoint } from './playerCameraFocus'

describe('getPlayerCameraFocusPoint', () => {
  it('aims at the center height of a default-size player standee', () => {
    expect(getPlayerCameraFocusPoint([3, 0, -2])).toEqual({
      x: 3,
      y: 1.045,
      z: -2,
    })
  })

  it('scales the focus height for larger generated characters', () => {
    expect(getPlayerCameraFocusPoint([1, 0.2, 4], { size: 'XL' })).toEqual({
      x: 1,
      y: 1.61075,
      z: 4,
    })
  })
})

describe('easePlayerCameraFocusProgress', () => {
  it('clamps to the valid range', () => {
    expect(easePlayerCameraFocusProgress(-0.2)).toBe(0)
    expect(easePlayerCameraFocusProgress(1.2)).toBe(1)
  })

  it('eases smoothly through the middle of the animation', () => {
    expect(easePlayerCameraFocusProgress(0.25)).toBeCloseTo(0.103515625)
    expect(easePlayerCameraFocusProgress(0.5)).toBe(0.5)
    expect(easePlayerCameraFocusProgress(0.75)).toBeCloseTo(0.896484375)
  })
})
