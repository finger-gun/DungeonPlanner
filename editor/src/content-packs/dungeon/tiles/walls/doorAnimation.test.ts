import { describe, expect, it } from 'vitest'
import { advanceDoorAngle } from './doorAnimation'

describe('doorAnimation', () => {
  it('keeps invalidating while the hinge is still moving', () => {
    const result = advanceDoorAngle(0, -Math.PI / 2, 1 / 60, 14)

    expect(result.nextAngle).not.toBe(0)
    expect(result.nextAngle).not.toBe(-Math.PI / 2)
    expect(result.needsInvalidate).toBe(true)
  })

  it('snaps to the target once the hinge is close enough', () => {
    const result = advanceDoorAngle(-1.5704, -Math.PI / 2, 1 / 60, 14)

    expect(result.nextAngle).toBe(-Math.PI / 2)
    expect(result.needsInvalidate).toBe(false)
  })
})
