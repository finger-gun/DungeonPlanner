import {
  DEFAULT_GENERATED_CHARACTER_KIND,
  DEFAULT_GENERATED_CHARACTER_SIZE,
  type GeneratedCharacterKind,
  type GeneratedCharacterRecord,
  type GeneratedCharacterSize,
} from './types'

const BASE_CHARACTER_SYSTEM_PROMPT = [
  'Create a fantasy tabletop character illustration.',
  'The subject must be centered, clearly readable, and fully visible from head to toe.',
  'Use a clear green screen background with no scenery, no environment, no floor, and no shadows.',
  'Do not add any frame, border, sticker outline, nameplate, caption, text, logo, watermark, or UI overlay.',
  'Keep the edge strong and uncluttered.',
  'Use polished fantasy concept art / book illustration styling with crisp edges and even lighting.',
  'Avoid cropped limbs, extra characters, speech bubbles, decorative plates, and heavy atmospheric effects.',
].join(' ')

export function composeGeneratedCharacterPrompt(character: Pick<GeneratedCharacterRecord, 'kind' | 'name' | 'prompt' | 'size'>) {
  const details = [
    `Character role: ${formatCharacterKind(character.kind)}.`,
    `Tabletop size class: ${character.size}.`,
  ]

  const trimmedName = character.name.trim()
  if (trimmedName) {
    details.push(`Character name: ${trimmedName}.`)
  }

  const trimmedPrompt = character.prompt.trim()
  if (trimmedPrompt) {
    details.push(`User description: ${trimmedPrompt}.`)
  }

  return `${BASE_CHARACTER_SYSTEM_PROMPT} ${details.join(' ')}`
}

export function getDefaultGeneratedCharacterKind(): GeneratedCharacterKind {
  return DEFAULT_GENERATED_CHARACTER_KIND
}

export function getDefaultGeneratedCharacterSize(): GeneratedCharacterSize {
  return DEFAULT_GENERATED_CHARACTER_SIZE
}

function formatCharacterKind(kind: GeneratedCharacterKind) {
  return kind === 'npc' ? 'NPC' : 'Player'
}
