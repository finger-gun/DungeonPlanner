import { describe, expect, it } from 'vitest'
import { shouldEnableActiveFloorPostProcessing } from './webgpuPostProcessingMode'

describe('webgpuPostProcessingMode', () => {
  it('keeps post-processing disabled when active-floor effects and selection mode are both inactive', () => {
    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: false,
      tool: 'room',
      selection: null,
    })).toBe(false)
  })

  it('enables post-processing for lens blur, pixelation, or select mode', () => {
    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: true,
      pixelateEnabled: false,
      tool: 'room',
      selection: null,
    })).toBe(true)

    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: true,
      tool: 'room',
      selection: null,
    })).toBe(true)

    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: false,
      tool: 'select',
      selection: null,
    })).toBe(true)

    expect(shouldEnableActiveFloorPostProcessing({
      activeCameraMode: 'perspective',
      lensEnabled: false,
      pixelateEnabled: false,
      tool: 'select',
      selection: 'wall:1',
    })).toBe(true)
  })
})
