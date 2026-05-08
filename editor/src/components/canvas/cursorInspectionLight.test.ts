import { describe, expect, it } from 'vitest'
import { getCursorInspectionLightPosition } from './cursorInspectionLight'

describe('getCursorInspectionLightPosition', () => {
  it('lifts the cursor light above the hovered ground point', () => {
    expect(getCursorInspectionLightPosition(
      { x: 2, y: 0, z: -3 },
      null,
    )).toEqual([2, 1.5, -3])
  })

  it('prefers the hovered surface hit when one is available', () => {
    expect(getCursorInspectionLightPosition(
      { x: 2, y: 0, z: -3 },
      { position: [4, 1.5, 6], normal: [0, 0, -1] },
    )).toEqual([4, 1.5, 5.35])
  })

  it('returns null when nothing is hovered', () => {
    expect(getCursorInspectionLightPosition(null, null)).toBeNull()
  })
})
