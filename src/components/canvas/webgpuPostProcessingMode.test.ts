import { describe, expect, it } from 'vitest'
import { getWebGpuPostProcessingPipeline, shouldApplyWebGpuLensBlur } from './webgpuPostProcessingMode'

describe('webgpuPostProcessingMode', () => {
  it('applies lens blur in any camera mode when lens is enabled', () => {
    expect(shouldApplyWebGpuLensBlur({
      activeCameraMode: 'perspective',
      lensEnabled: true,
    })).toBe(true)
    expect(shouldApplyWebGpuLensBlur({
      activeCameraMode: 'top-down',
      lensEnabled: true,
    })).toBe(true)
    expect(shouldApplyWebGpuLensBlur({
      activeCameraMode: 'perspective',
      lensEnabled: false,
    })).toBe(false)
  })

  it('treats blur and pixelate as independent pipeline stages', () => {
    expect(getWebGpuPostProcessingPipeline({
      activeCameraMode: 'top-down',
      lensEnabled: true,
      pixelateEnabled: true,
    })).toEqual({
      applyBlur: true,
      applyPixelate: true,
    })
  })
})
