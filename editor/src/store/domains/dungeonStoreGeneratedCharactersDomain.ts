import { getDefaultAssetIdByCategory } from '../../content-packs/registry'
import { createGeneratedCharacterAssetId, syncGeneratedCharacterAssets } from '../../content-packs/runtimeRegistry'
import {
  createDefaultGeneratedCharacterInput,
  normalizeGeneratedCharacterRecord,
} from '../../generated-characters/types'
import type { DungeonState } from '../useDungeonStore'

type DungeonStoreSet = (updater: (state: DungeonState) => DungeonState) => void
type DungeonStoreGet = () => DungeonState

type GeneratedCharacterActionKeys =
  | 'createGeneratedCharacter'
  | 'createGeneratedCharacterDraft'
  | 'ingestGeneratedCharacters'
  | 'updateGeneratedCharacter'
  | 'removeGeneratedCharacter'
  | 'openCharacterSheet'
  | 'closeCharacterSheet'

export function createDungeonStoreGeneratedCharacterActions({
  set,
  get,
  isGeneratedCharacterInUse,
}: {
  set: DungeonStoreSet
  get: DungeonStoreGet
  isGeneratedCharacterInUse: (
    assetId: string,
    state: Pick<DungeonState, 'placedObjects' | 'floors' | 'activeFloorId'>,
  ) => boolean
}): Pick<DungeonState, GeneratedCharacterActionKeys> {
  return {
    createGeneratedCharacter: (input) => {
      const recordId = crypto.randomUUID()
      const assetId = createGeneratedCharacterAssetId(recordId)
      const timestamp = new Date().toISOString()
      const nextRecord = normalizeGeneratedCharacterRecord(assetId, {
        ...createDefaultGeneratedCharacterInput(),
        ...input,
        assetId,
        createdAt: timestamp,
        updatedAt: timestamp,
      })

      set((current) => ({
        ...current,
        generatedCharacters: {
          ...current.generatedCharacters,
          [assetId]: nextRecord,
        },
      }))
      syncGeneratedCharacterAssets(get().generatedCharacters)
      return assetId
    },
    createGeneratedCharacterDraft: () => {
      return get().createGeneratedCharacter(createDefaultGeneratedCharacterInput())
    },
    ingestGeneratedCharacters: (records) => {
      if (records.length === 0) {
        return
      }

      set((current) => ({
        ...current,
        generatedCharacters: {
          ...current.generatedCharacters,
          ...Object.fromEntries(
            records.map((record) => [
              record.assetId,
              normalizeGeneratedCharacterRecord(record.assetId, {
                ...current.generatedCharacters[record.assetId],
                ...record,
              }),
            ]),
          ),
        },
      }))
      syncGeneratedCharacterAssets(get().generatedCharacters)
    },
    updateGeneratedCharacter: (assetId, input) => {
      const state = get()
      const existing = state.generatedCharacters[assetId]
      if (!existing) {
        return false
      }

      const nextRecord = normalizeGeneratedCharacterRecord(assetId, {
        ...existing,
        ...input,
        assetId,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      })

      set((current) => ({
        ...current,
        generatedCharacters: {
          ...current.generatedCharacters,
          [assetId]: nextRecord,
        },
      }))
      syncGeneratedCharacterAssets(get().generatedCharacters)
      return true
    },
    removeGeneratedCharacter: (assetId) => {
      const state = get()
      if (!state.generatedCharacters[assetId]) {
        return true
      }
      if (isGeneratedCharacterInUse(assetId, state)) {
        return false
      }

      set((current) => {
        const generatedCharacters = { ...current.generatedCharacters }
        delete generatedCharacters[assetId]
        return {
          ...current,
          generatedCharacters,
          characterSheet: current.characterSheet.assetId === assetId
            ? { open: false, assetId: null }
            : current.characterSheet,
          selectedAssetIds: {
            ...current.selectedAssetIds,
            ...(current.selectedAssetIds.prop === assetId
              ? {
                  prop: getDefaultAssetIdByCategory('prop'),
                }
              : {}),
            ...(current.selectedAssetIds.player === assetId
              ? {
                  player: getDefaultAssetIdByCategory('player'),
                }
              : {}),
          },
        }
      })
      syncGeneratedCharacterAssets(get().generatedCharacters)
      return true
    },
    openCharacterSheet: (assetId) => {
      set((state) => ({
        ...state,
        characterSheet: {
          open: true,
          assetId,
        },
      }))
    },
    closeCharacterSheet: () => {
      set((state) => (
        state.characterSheet.open
          ? {
              ...state,
              characterSheet: {
                open: false,
                assetId: null,
              },
            }
          : state
      ))
    },
  }
}
