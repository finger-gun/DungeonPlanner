export type BakedLightSample = readonly [number, number, number]

export type BakedLightResponseProfile = {
  contrastFloor: number
  contrastRange: number
  minIntensityScale: number
  maxDesaturation: number
  albedoBoost: number
  emissiveBoost: number
}

export const SURFACE_BAKED_LIGHT_RESPONSE: BakedLightResponseProfile = {
  contrastFloor: 0.012,
  contrastRange: 0.34,
  minIntensityScale: 0.54,
  maxDesaturation: 0.16,
  albedoBoost: 0.72,
  emissiveBoost: 0.04,
}

export const PROP_BAKED_LIGHT_RESPONSE: BakedLightResponseProfile = {
  contrastFloor: 0.01,
  contrastRange: 0.3,
  minIntensityScale: 0.74,
  maxDesaturation: 0.07,
  albedoBoost: 0.86,
  emissiveBoost: 0.08,
}

export const BILLBOARD_BAKED_LIGHT_RESPONSE: BakedLightResponseProfile = {
  contrastFloor: 0.008,
  contrastRange: 0.24,
  minIntensityScale: 0.96,
  maxDesaturation: 0.02,
  albedoBoost: 1.18,
  emissiveBoost: 0.24,
}

export function getBakedLightLuminance(sample: BakedLightSample) {
  return sample[0] * 0.2126 + sample[1] * 0.7152 + sample[2] * 0.0722
}

export function shapeBakedLightSample(
  sample: BakedLightSample,
  profile: BakedLightResponseProfile,
): BakedLightSample {
  const luminance = getBakedLightLuminance(sample)
  const contrastGate = clamp01((luminance - profile.contrastFloor) / Math.max(profile.contrastRange, Number.EPSILON))
  const curvedGate = contrastGate * 0.6 + contrastGate * contrastGate * 0.4
  const intensityScale = lerp(profile.minIntensityScale, 1, curvedGate)
  const tonedSample: BakedLightSample = [
    sample[0] * intensityScale,
    sample[1] * intensityScale,
    sample[2] * intensityScale,
  ]
  const desaturation = (1 - contrastGate) * profile.maxDesaturation
  return [
    lerp(luminance, tonedSample[0], 1 - desaturation),
    lerp(luminance, tonedSample[1], 1 - desaturation),
    lerp(luminance, tonedSample[2], 1 - desaturation),
  ]
}

export function getDirectionalFaceWeight(alignment: number, threshold: number, minimum: number) {
  const gated = clamp01((alignment - threshold) / Math.max(1 - threshold, Number.EPSILON))
  return lerp(minimum, 1, gated * gated)
}

export function getPropDirectionalLightFactor(alignment: number, directionalStrength: number) {
  const faceWeight = getDirectionalFaceWeight(alignment, 0.04, 0.7)
  return lerp(0.8, faceWeight, clamp01(directionalStrength))
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function lerp(start: number, end: number, alpha: number) {
  return start + (end - start) * alpha
}
