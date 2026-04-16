import { useMemo, useState } from 'react'
import {
  deleteGeneratedCharacterAssets,
  requestGeneratedCharacterImage,
  saveGeneratedCharacterAssets,
} from '../../generated-characters/api'
import { composeGeneratedCharacterPrompt } from '../../generated-characters/prompt'
import { processGeneratedCharacterImage } from '../../generated-characters/processing'
import {
  getGeneratedCharacterDisplayName,
  isGeneratedCharacterReady,
  type GeneratedCharacterKind,
  type GeneratedCharacterSize,
} from '../../generated-characters/types'
import { useDungeonStore } from '../../store/useDungeonStore'

const CHARACTER_KINDS: GeneratedCharacterKind[] = ['player', 'npc']
const CHARACTER_SIZES: GeneratedCharacterSize[] = ['S', 'M', 'XL', 'XXL']

export function CharacterSheetOverlay() {
  const characterSheet = useDungeonStore((state) => state.characterSheet)
  const character = useDungeonStore((state) =>
    characterSheet.assetId ? state.generatedCharacters[characterSheet.assetId] ?? null : null,
  )
  const updateGeneratedCharacter = useDungeonStore((state) => state.updateGeneratedCharacter)
  const closeCharacterSheet = useDungeonStore((state) => state.closeCharacterSheet)
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const activeAssetId = characterSheet.assetId
  const composedPrompt = useMemo(
    () => (character ? composeGeneratedCharacterPrompt(character) : ''),
    [character],
  )

  if (!characterSheet.open || !character) {
    return null
  }

  async function handleGenerateImage() {
    if (!activeAssetId) {
      return
    }

    const liveCharacter = useDungeonStore.getState().generatedCharacters[activeAssetId]
    if (!liveCharacter) {
      return
    }
    if (!liveCharacter.prompt.trim()) {
      setGenerationError('Enter a character prompt before generating an image.')
      return
    }

    setIsGenerating(true)
    setGenerationError(null)

    try {
      const payload = await requestGeneratedCharacterImage(composeGeneratedCharacterPrompt(liveCharacter))
      const processed = await processGeneratedCharacterImage(payload.imageDataUrl)
      const savedAssets = await saveGeneratedCharacterAssets({
        originalImageDataUrl: payload.imageDataUrl,
        processedImageDataUrl: processed.processedImageDataUrl,
        thumbnailDataUrl: processed.thumbnailDataUrl,
      })

      updateGeneratedCharacter(liveCharacter.assetId, {
        storageId: savedAssets.storageId,
        model: payload.model,
        originalImageUrl: savedAssets.originalImageUrl,
        processedImageUrl: savedAssets.processedImageUrl,
        thumbnailUrl: savedAssets.thumbnailUrl,
        width: processed.width,
        height: processed.height,
      })
      setSelectedAsset('player', liveCharacter.assetId)

      if (liveCharacter.storageId && liveCharacter.storageId !== savedAssets.storageId) {
        try {
          await deleteGeneratedCharacterAssets(liveCharacter.storageId)
        } catch (error) {
          setGenerationError(
            error instanceof Error
              ? `${error.message} The new image was saved successfully.`
              : 'The new image was saved, but the previous disk assets could not be removed.',
          )
        }
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Character generation failed.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <aside className="absolute inset-x-6 top-6 z-20 flex max-h-[calc(100%-3rem)] justify-center pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-5xl overflow-hidden rounded-3xl border border-stone-700/70 bg-stone-950/94 shadow-2xl backdrop-blur">
        <section className="flex w-[21rem] shrink-0 flex-col border-r border-stone-800/70 bg-stone-925/90 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/75">
                Character Sheet
              </p>
              <p className="mt-2 text-lg font-semibold text-stone-100">
                {getGeneratedCharacterDisplayName(character)}
              </p>
            </div>
            <button
              type="button"
              onClick={closeCharacterSheet}
              className="rounded-full border border-stone-700/70 bg-stone-900/90 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300 transition hover:border-stone-600 hover:text-stone-100"
            >
              Close
            </button>
          </div>

          <div className="mt-5 flex-1 rounded-2xl border border-stone-800/70 bg-stone-900/60 p-4">
            {character.thumbnailUrl ? (
              <img
                src={character.thumbnailUrl}
                alt={`${getGeneratedCharacterDisplayName(character)} preview`}
                className="h-72 w-full rounded-2xl bg-stone-950/80 object-contain"
              />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-stone-700 bg-stone-950/60 px-6 text-center text-sm leading-6 text-stone-500">
                No standee image yet. Fill in the prompt and generate one from this sheet.
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleGenerateImage()}
              disabled={isGenerating || character.prompt.trim().length === 0}
              className="rounded-full border border-sky-300/30 bg-sky-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating
                ? 'Generating...'
                : isGeneratedCharacterReady(character)
                  ? 'Regenerate Image'
                  : 'Generate Image'}
            </button>
            {isGeneratedCharacterReady(character) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAsset('player', character.assetId)
                  closeCharacterSheet()
                }}
                className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-100 transition hover:border-emerald-200/50 hover:bg-emerald-400/15"
              >
                Arm for Placement
              </button>
            )}
          </div>

          {generationError && (
            <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs leading-6 text-rose-200">
              {generationError}
            </p>
          )}
        </section>

        <section className="flex min-w-0 flex-1 flex-col gap-5 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/75">
              Identity
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="character-name"
                  className="block text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500"
                >
                  Name
                </label>
                <input
                  id="character-name"
                  value={character.name}
                  onChange={(event) => updateGeneratedCharacter(character.assetId, { name: event.target.value })}
                  placeholder="Brumble Copperkettle"
                  className="mt-2 w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-sky-300/30"
                />
              </div>
              <div>
                <p className="block text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500">
                  Type
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHARACTER_KINDS.map((kind) => {
                    const active = character.kind === kind
                    return (
                      <button
                        key={kind}
                        type="button"
                        onClick={() => updateGeneratedCharacter(character.assetId, { kind })}
                        className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                          active
                            ? 'border-sky-300/40 bg-sky-400/15 text-sky-100'
                            : 'border-stone-800 bg-stone-900/80 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                        }`}
                      >
                        {kind === 'player' ? 'Player' : 'NPC'}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="character-prompt"
              className="block text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500"
            >
              Prompt
            </label>
            <textarea
              id="character-prompt"
              value={character.prompt}
              onChange={(event) => updateGeneratedCharacter(character.assetId, { prompt: event.target.value })}
              rows={6}
              placeholder="Older female gnome bard-healer with wild red hair, layered green traveling coat, holding a horn and a carved staff"
              className="mt-2 w-full rounded-2xl border border-stone-800 bg-stone-950/80 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-sky-300/30"
            />
          </div>

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500">
              Character Size
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CHARACTER_SIZES.map((size) => {
                const active = character.size === size
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updateGeneratedCharacter(character.assetId, { size })}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] transition ${
                      active
                        ? 'border-amber-300/40 bg-amber-400/15 text-amber-100'
                        : 'border-stone-800 bg-stone-900/80 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs leading-6 text-stone-500">
              S suits gnomes, goblins, and dwarves. M is the default human-sized standee. XL fits ogres and trolls. XXL is for huge creatures like dragons.
            </p>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-stone-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-300">
              Generation Recipe
            </p>
            <p className="mt-2 text-xs leading-6 text-stone-400">
              The sheet automatically adds a fixed standee-safe fantasy illustration prompt: full-body subject, centered composition, clean white background, strong silhouette, no scenery, and no extra characters.
            </p>
            <p className="mt-3 rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-3 font-mono text-[11px] leading-5 text-stone-400">
              {composedPrompt}
            </p>
          </div>
        </section>
      </div>
    </aside>
  )
}
