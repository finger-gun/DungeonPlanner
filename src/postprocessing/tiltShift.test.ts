import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AUTOFOCUS_SMOOTH_TIME,
  depthFocusRangeFromFocalLength,
  normalizePostProcessingSettings,
  smoothAutofocusDistance,
} from './tiltShiftMath'

describe('tiltShift helpers', () => {
  it('preserves focal length controls as world-space focus ranges', () => {
    expect(depthFocusRangeFromFocalLength(0.5)).toBe(0.5)
    expect(depthFocusRangeFromFocalLength(3)).toBe(3)
    expect(depthFocusRangeFromFocalLength(12)).toBe(12)
  })

  it('defaults background focus range to the foreground range for older settings', () => {
    expect(normalizePostProcessingSettings({ enabled: false, focalLength: 4 })).toMatchObject({
      enabled: false,
      pixelateEnabled: false,
      pixelSize: 6,
      focusDistance: 0.5,
      focalLength: 4,
      backgroundFocalLength: 4,
      bokehScale: 0.5,
    })
    expect(normalizePostProcessingSettings()).toMatchObject({ enabled: true })
    expect(normalizePostProcessingSettings({ focalLength: 4, backgroundFocalLength: 7 }))
      .toMatchObject({ focalLength: 4, backgroundFocalLength: 7 })
  })

  it('keeps pixelation off by default unless explicitly enabled', () => {
    expect(normalizePostProcessingSettings()).toMatchObject({ pixelateEnabled: false, pixelSize: 6 })
    expect(normalizePostProcessingSettings({ pixelateEnabled: true }))
      .toMatchObject({ pixelateEnabled: true })
  })

  it('smooths autofocus changes over time', () => {
    expect(smoothAutofocusDistance(2, 10, 0)).toBe(10)
    expect(smoothAutofocusDistance(2, 10, 0.5, 0)).toBe(10)
    expect(smoothAutofocusDistance(2, 10, DEFAULT_AUTOFOCUS_SMOOTH_TIME))
      .toBeGreaterThan(2)
    expect(smoothAutofocusDistance(2, 10, DEFAULT_AUTOFOCUS_SMOOTH_TIME))
      .toBeLessThan(10)
  })
})
