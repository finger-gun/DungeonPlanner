import { describe, expect, it } from 'vitest'
import { getMimicAttackPose } from './chest_mimic'

describe('chest mimic attack pose', () => {
  it('starts closed, snaps open during chomps, and settles open after the attack', () => {
    expect(getMimicAttackPose(0)).toMatchObject({
      active: true,
      lidOpenAmount: 0,
      offsetX: 0,
      offsetY: 0,
    })

    expect(getMimicAttackPose(0.09).lidOpenAmount).toBeCloseTo(1, 5)
    expect(getMimicAttackPose(0.18).lidOpenAmount).toBeCloseTo(0, 5)
    expect(getMimicAttackPose(1.08)).toMatchObject({
      active: false,
      lidOpenAmount: 1,
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
    })
  })

  it('throws the mimic body around while the attack is active', () => {
    const pose = getMimicAttackPose(0.4)

    expect(pose.active).toBe(true)
    expect(Math.abs(pose.offsetX)).toBeGreaterThan(0.01)
    expect(pose.offsetY).toBeGreaterThan(0.01)
    expect(Math.abs(pose.offsetZ)).toBeGreaterThan(0.01)
  })
})
