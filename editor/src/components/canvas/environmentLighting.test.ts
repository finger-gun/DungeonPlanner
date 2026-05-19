import { describe, expect, it } from 'vitest'
import { getEnvironmentLightingState } from './environmentLighting'

describe('getEnvironmentLightingState', () => {
  it('uses neutral light colors at outdoor noon', () => {
    const noon = getEnvironmentLightingState('outdoor', 0.5)

    expect(noon.ambientColor.getHexString()).toBe('ffffff')
    expect(noon.keyColor.getHexString()).toBe('ffffff')
    expect(noon.fillColor.getHexString()).toBe('ffffff')
  })

  it('uses neutral light colors at indoor noon', () => {
    const noon = getEnvironmentLightingState('indoor', 0.5)

    expect(noon.ambientColor.getHexString()).toBe('ffffff')
    expect(noon.keyColor.getHexString()).toBe('ffffff')
    expect(noon.fillColor.getHexString()).toBe('ffffff')
  })

  it('keeps outdoor noon brighter than outdoor night', () => {
    const noon = getEnvironmentLightingState('outdoor', 0.5)
    const night = getEnvironmentLightingState('outdoor', 1)

    expect(noon.keyMultiplier).toBeGreaterThan(night.keyMultiplier)
    expect(noon.fillMultiplier).toBeGreaterThanOrEqual(night.fillMultiplier)
  })

  it('applies the day-night cycle indoors too', () => {
    const noon = getEnvironmentLightingState('indoor', 0.5)
    const night = getEnvironmentLightingState('indoor', 1)

    expect(noon.keyMultiplier).toBeGreaterThan(night.keyMultiplier)
    expect(noon.fillMultiplier).toBeGreaterThan(night.fillMultiplier)
    expect(noon.skyColor.getHexString()).not.toBe(night.skyColor.getHexString())
    expect(noon.ambientColor.getHexString()).not.toBe(night.ambientColor.getHexString())
  })
})
