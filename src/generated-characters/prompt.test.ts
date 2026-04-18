import { describe, expect, it } from 'vitest'
import { composeGeneratedCharacterPrompt } from './prompt'

describe('composeGeneratedCharacterPrompt', () => {
  it('forbids model-made frame artifacts and avoids requesting sticker borders', () => {
    const prompt = composeGeneratedCharacterPrompt({
      kind: 'player',
      name: 'Arden',
      prompt: 'Human ranger with a longbow',
      size: 'M',
    })

    expect(prompt).toContain('Do not add any frame, border, sticker outline, nameplate, caption, text, logo, watermark, or UI overlay.')
    expect(prompt).not.toContain('sticker design with a white border')
    expect(prompt).toContain('Character role: Player.')
    expect(prompt).toContain('Tabletop size class: M.')
    expect(prompt).toContain('Character name: Arden.')
    expect(prompt).toContain('User description: Human ranger with a longbow.')
  })
})
