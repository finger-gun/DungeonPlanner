export type PostProcessingSettingsShape = {
  enabled: boolean
  pixelateEnabled: boolean
  pixelSize: number
  focusDistance: number
  focalLength: number
  backgroundFocalLength: number
  bokehScale: number
}

export const DEFAULT_AUTOFOCUS_SMOOTH_TIME = 0.5

export const DEFAULT_POST_PROCESSING_SETTINGS: PostProcessingSettingsShape = {
  enabled: true,
  pixelateEnabled: false,
  pixelSize: 6,
  focusDistance: 0.5,
  focalLength: 9,
  backgroundFocalLength: 9,
  bokehScale: 0.5,
}

type PostProcessingSettingsLike = Partial<PostProcessingSettingsShape>

export function depthFocusRangeFromFocalLength(focalLength: number) {
  return focalLength
}

export function smoothAutofocusDistance(
  currentDistance: number,
  targetDistance: number,
  deltaSeconds: number,
  smoothTime = DEFAULT_AUTOFOCUS_SMOOTH_TIME,
) {
  if (smoothTime <= 0 || deltaSeconds <= 0) {
    return targetDistance
  }

  const alpha = 1 - Math.exp(-deltaSeconds / smoothTime)
  return currentDistance + ((targetDistance - currentDistance) * alpha)
}

export function normalizePostProcessingSettings(settings?: PostProcessingSettingsLike) {
  const focalLength = typeof settings?.focalLength === 'number'
    ? settings.focalLength
    : DEFAULT_POST_PROCESSING_SETTINGS.focalLength

  return {
    enabled: settings?.enabled !== false,
    pixelateEnabled: settings?.pixelateEnabled === true,
    pixelSize: typeof settings?.pixelSize === 'number'
      ? settings.pixelSize
      : DEFAULT_POST_PROCESSING_SETTINGS.pixelSize,
    focusDistance: typeof settings?.focusDistance === 'number'
      ? settings.focusDistance
      : DEFAULT_POST_PROCESSING_SETTINGS.focusDistance,
    focalLength,
    backgroundFocalLength: typeof settings?.backgroundFocalLength === 'number'
      ? settings.backgroundFocalLength
      : focalLength,
    bokehScale: typeof settings?.bokehScale === 'number'
      ? settings.bokehScale
      : DEFAULT_POST_PROCESSING_SETTINGS.bokehScale,
  }
}
