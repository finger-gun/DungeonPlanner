import { describe, expect, it } from 'vitest'
import { shouldApplyWebGpuLensBlur } from './webgpuPostProcessingMode'

describe('shouldApplyWebGpuLensBlur', () => {
  it('disables lens blur in top-down mode', () => {
    expect(shouldApplyWebGpuLensBlur({
      activeCameraMode: 'top-down',
      lensEnabled: true,
    })).toBe(false)
  })

  it('disables lens blur when the setting is off', () => {
    expect(shouldApplyWebGpuLensBlur({
      activeCameraMode: 'perspective',
      lensEnabled: false,
    })).toBe(false)
  })

  it('keeps lens blur enabled for perspective views', () => {
    expect(shouldApplyWebGpuLensBlur({
      activeCameraMode: 'perspective',
      lensEnabled: true,
    })).toBe(true)
  })
})
