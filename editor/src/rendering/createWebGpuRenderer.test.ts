import { describe, expect, it } from 'vitest'
import { buildWebGpuRendererOptions, getSampledTextureViewAspect } from './createWebGpuRenderer'

describe('buildWebGpuRendererOptions', () => {
  it('always requests a stencil buffer for room floor masking', () => {
    const options = buildWebGpuRendererOptions(
      {
        antialias: false,
        alpha: false,
        depth: false,
      },
      'low-power',
      { maxSampledTexturesPerShaderStage: 16 },
    )

    expect(options.antialias).toBe(false)
    expect(options.alpha).toBe(false)
    expect(options.depth).toBe(false)
    expect(options.stencil).toBe(true)
  })
})

describe('getSampledTextureViewAspect', () => {
  it('uses depth-only views for sampled depth textures', () => {
    expect(getSampledTextureViewAspect({ isDepthTexture: true })).toBe('depth-only')
    expect(getSampledTextureViewAspect({ isDepthTexture: false })).toBe('all')
  })
})
