import { describe, expect, it } from 'vitest'
import {
  BILLBOARD_BAKED_LIGHT_RESPONSE,
  getBakedLightLuminance,
  getDirectionalFaceWeight,
  getPropDirectionalLightFactor,
  PROP_DIRECTIONAL_FACE_MINIMUM,
  PROP_DIRECTIONAL_LIGHT_BASELINE,
  PROP_BAKED_LIGHT_RESPONSE,
  shapeBakedLightSample,
  SURFACE_BAKED_LIGHT_RESPONSE,
} from './bakedLightResponse'

describe('bakedLightResponse', () => {
  it('compresses low-intensity surface light toward darkness', () => {
    const sample = shapeBakedLightSample([0.08, 0.04, 0.02], SURFACE_BAKED_LIGHT_RESPONSE)

    expect(sample[0]).toBeLessThan(0.07)
    expect(sample[1]).toBeLessThan(0.045)
    expect(sample[2]).toBeLessThan(0.03)
    expect(sample[0]).toBeGreaterThan(0.045)
  })

  it('desaturates low and mid baked light while preserving highlight hue', () => {
    const lowSample = shapeBakedLightSample([0.16, 0.03, 0.02], SURFACE_BAKED_LIGHT_RESPONSE)
    const highSample = shapeBakedLightSample([0.82, 0.14, 0.08], SURFACE_BAKED_LIGHT_RESPONSE)

    expect(lowSample[0] - lowSample[1]).toBeLessThan(0.13)
    expect(highSample[0]).toBeGreaterThan(highSample[1])
    expect(highSample[1]).toBeGreaterThan(highSample[2])
  })

  it('keeps prop lighting slightly fuller than surface lighting', () => {
    const sample: readonly [number, number, number] = [0.18, 0.08, 0.03]
    const surface = shapeBakedLightSample(sample, SURFACE_BAKED_LIGHT_RESPONSE)
    const prop = shapeBakedLightSample(sample, PROP_BAKED_LIGHT_RESPONSE)

    expect(prop[0]).toBeGreaterThan(surface[0])
    expect(getBakedLightLuminance(prop)).toBeGreaterThan(getBakedLightLuminance(surface))
  })

  it('keeps solid props closer to surfaces than billboards under dim baked light', () => {
    const sample: readonly [number, number, number] = [0.18, 0.08, 0.03]
    const surfaceLuminance = getBakedLightLuminance(shapeBakedLightSample(sample, SURFACE_BAKED_LIGHT_RESPONSE))
    const propLuminance = getBakedLightLuminance(shapeBakedLightSample(sample, PROP_BAKED_LIGHT_RESPONSE))
    const billboardLuminance = getBakedLightLuminance(shapeBakedLightSample(sample, BILLBOARD_BAKED_LIGHT_RESPONSE))

    expect(propLuminance - surfaceLuminance).toBeLessThan(billboardLuminance - propLuminance)
  })

  it('keeps billboard sprites brighter than solid props at the same baked sample', () => {
    const sample: readonly [number, number, number] = [0.14, 0.08, 0.05]
    const prop = shapeBakedLightSample(sample, PROP_BAKED_LIGHT_RESPONSE)
    const billboard = shapeBakedLightSample(sample, BILLBOARD_BAKED_LIGHT_RESPONSE)

    expect(getBakedLightLuminance(billboard)).toBeGreaterThan(getBakedLightLuminance(prop))
    expect(billboard[0]).toBeGreaterThan(prop[0])
  })

  it('strongly attenuates grazing surfaces while keeping some prop wrap', () => {
    expect(getDirectionalFaceWeight(0.15, 0.18, 0)).toBe(0)
    expect(getDirectionalFaceWeight(0.75, 0.18, 0)).toBeGreaterThan(0.45)
    expect(getPropDirectionalLightFactor(0, 0)).toBeCloseTo(PROP_DIRECTIONAL_LIGHT_BASELINE, 5)
    expect(getPropDirectionalLightFactor(0, 1)).toBeCloseTo(PROP_DIRECTIONAL_FACE_MINIMUM, 5)
    expect(getPropDirectionalLightFactor(0.1, 1)).toBeLessThan(0.08)
    expect(getPropDirectionalLightFactor(1, 1)).toBeCloseTo(1, 5)
  })
})
