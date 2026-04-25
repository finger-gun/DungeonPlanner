import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { getContentPackAssetsByCategory } from '../../content-packs/registry'
import { metadataSupportsConnectorType } from '../../content-packs/connectors'
import { OpeningToolPanel } from './OpeningToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

function getCatalogButtonByAssetName(name: string) {
  return screen.getAllByText(name)
    .map((node) => node.closest('button'))
    .find((button): button is HTMLButtonElement => button instanceof HTMLButtonElement) ?? null
}

describe('OpeningToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
    useDungeonStore.getState().setWallConnectionMode('door')
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the opening catalogue with wall and floor opening sections', () => {
    render(<OpeningToolPanel />)

    expect(screen.getByText('Opening Catalogue')).toBeInTheDocument()
    expect(screen.getByText('Stairs')).toBeInTheDocument()
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
  })

  it('updates the selected opening asset when a catalog card is clicked', () => {
    const openingAsset = getContentPackAssetsByCategory('opening').find((asset) =>
      metadataSupportsConnectorType(asset.metadata, 'WALL'),
    ) ?? getContentPackAssetsByCategory('opening')[0]
    expect(openingAsset).toBeDefined()

    render(<OpeningToolPanel />)

    const assetButton = getCatalogButtonByAssetName(openingAsset!.name)
    expect(assetButton).not.toBeNull()
    fireEvent.click(assetButton!)

    expect(useDungeonStore.getState().selectedAssetIds.opening).toBe(openingAsset!.id)
    expect(assetButton).toHaveAttribute('aria-pressed', 'true')
  })
})
