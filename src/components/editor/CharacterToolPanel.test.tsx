import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { CharacterToolPanel } from './CharacterToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

const TEST_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

describe('CharacterToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
    Object.keys(useDungeonStore.getState().generatedCharacters).forEach((assetId) => {
      useDungeonStore.getState().removeGeneratedCharacter(assetId)
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders created characters and a create-new card', () => {
    useDungeonStore.getState().createGeneratedCharacter({
      storageId: 'storage-paladin',
      name: 'Generated Paladin',
      kind: 'player',
      size: 'M',
      prompt: 'A paladin on a white background',
      model: 'x/z-image-turbo',
      originalImageUrl: TEST_IMAGE_DATA_URL,
      processedImageUrl: TEST_IMAGE_DATA_URL,
      thumbnailUrl: TEST_IMAGE_DATA_URL,
      width: 300,
      height: 600,
    })

    render(<CharacterToolPanel />)

    expect(screen.getByText('Character Library')).toBeInTheDocument()
    expect(screen.getByText('Created Characters')).toBeInTheDocument()
    expect(screen.getByAltText('Generated Paladin thumbnail')).toBeInTheDocument()
    expect(screen.getByText('Create New Character')).toBeInTheDocument()
  })

  it('selects a ready generated character for placement', () => {
    const assetId = useDungeonStore.getState().createGeneratedCharacter({
      storageId: 'storage-ranger',
      name: 'Generated Ranger',
      kind: 'player',
      size: 'M',
      prompt: 'A ranger on a white background',
      model: 'x/z-image-turbo',
      originalImageUrl: TEST_IMAGE_DATA_URL,
      processedImageUrl: TEST_IMAGE_DATA_URL,
      thumbnailUrl: TEST_IMAGE_DATA_URL,
      width: 300,
      height: 600,
    })

    render(<CharacterToolPanel />)

    fireEvent.click(screen.getByAltText('Generated Ranger thumbnail').closest('button')!)

    expect(useDungeonStore.getState().selectedAssetIds.player).toBe(assetId)
  })

  it('creates a draft character and opens the sheet', () => {
    render(<CharacterToolPanel />)

    fireEvent.click(screen.getByRole('button', { name: /create new character/i }))

    const state = useDungeonStore.getState()
    expect(state.characterSheet.open).toBe(true)
    expect(state.characterSheet.assetId).toBeTruthy()
    expect(state.generatedCharacters[state.characterSheet.assetId!]?.size).toBe('M')
  })
})
