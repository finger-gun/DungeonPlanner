import { describe, expect, it } from 'vitest'
import { isLikelyImageGenerationModel, mergeModelOptions } from './CharacterSheetOverlay'

describe('character sheet model options', () => {
  it('keeps only image-capable models in the model list', () => {
    expect(
      mergeModelOptions(
        ['x/z-image-turbo', 'devstral-small-2:24b', 'x/flux2-klein:9b', 'qwen3.5:27b'],
        'x/z-image-turbo',
        null,
      ),
    ).toEqual(['x/z-image-turbo', 'x/flux2-klein:9b'])
  })

  it('detects common image-model naming patterns', () => {
    expect(isLikelyImageGenerationModel('x/z-image-turbo')).toBe(true)
    expect(isLikelyImageGenerationModel('x/flux2-klein:9b')).toBe(true)
    expect(isLikelyImageGenerationModel('stable-diffusion-xl')).toBe(true)
    expect(isLikelyImageGenerationModel('gemma4:26b')).toBe(false)
    expect(isLikelyImageGenerationModel('qwen3.5:32b')).toBe(false)
  })
})
