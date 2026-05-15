import { describe, expect, it } from 'vitest'
import {
  getWebGpuPostProcessingPrewarmCallback,
  registerWebGpuPostProcessingPrewarmCallback,
} from './webgpuPostProcessingPrewarmBridge'

describe('webgpuPostProcessingPrewarmBridge', () => {
  it('registers and clears the live postprocess prewarm callback', () => {
    const callback = () => true

    registerWebGpuPostProcessingPrewarmCallback(callback)
    expect(getWebGpuPostProcessingPrewarmCallback()).toBe(callback)

    registerWebGpuPostProcessingPrewarmCallback(null)
    expect(getWebGpuPostProcessingPrewarmCallback()).toBeNull()
  })
})
