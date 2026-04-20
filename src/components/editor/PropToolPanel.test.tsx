import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { getAssetBrowserCategory } from '../../content-packs/browserMetadata'
import { metadataSupportsConnectorType } from '../../content-packs/connectors'
import { getContentPackAssetsByCategory } from '../../content-packs/registry'
import { PropToolPanel } from './PropToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

function getButtonByLabel(label: string) {
  return screen.getAllByRole('button').find((button) => button.textContent?.trim() === label) ?? null
}

function getCatalogButtonByAssetName(name: string) {
  return screen.getAllByText(name)
    .map((node) => node.closest('button'))
    .find((button): button is HTMLButtonElement => button instanceof HTMLButtonElement) ?? null
}

describe('PropToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the unified asset browser with top-level categories', () => {
    render(<PropToolPanel />)

    expect(screen.getByText('Asset Categories')).toBeInTheDocument()
    expect(getButtonByLabel('Furniture')).toBeInTheDocument()
    expect(getButtonByLabel('Openings')).toBeInTheDocument()
    expect(getButtonByLabel('Surfaces')).toBeInTheDocument()
  })

  it('updates the selected prop asset when a prop catalog card is clicked', () => {
    const propAsset = getContentPackAssetsByCategory('prop').find((asset) => getAssetBrowserCategory(asset) === 'furniture')
    expect(propAsset).toBeDefined()

    render(<PropToolPanel />)

    const assetButton = getCatalogButtonByAssetName(propAsset!.name)
    expect(assetButton).not.toBeNull()
    fireEvent.click(assetButton!)

    expect(useDungeonStore.getState().selectedAssetIds.prop).toBe(propAsset!.id)
    expect(assetButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('updates the selected opening asset from the unified openings category', () => {
    const openingAsset = getContentPackAssetsByCategory('opening').find((asset) =>
      !metadataSupportsConnectorType(asset.metadata, 'WALL'),
    ) ?? getContentPackAssetsByCategory('opening')[0]
    expect(openingAsset).toBeDefined()

    useDungeonStore.getState().setWallConnectionMode('door')
    render(<PropToolPanel />)

    fireEvent.click(getButtonByLabel('Openings')!)
    const assetButton = getCatalogButtonByAssetName(openingAsset!.name)
    expect(assetButton).not.toBeNull()
    fireEvent.click(assetButton!)

    expect(useDungeonStore.getState().selectedAssetIds.opening).toBe(openingAsset!.id)
  })

  it('always shows the openings catalog inside the unified openings category', () => {
    useDungeonStore.getState().setWallConnectionMode('open')
    render(<PropToolPanel />)

    fireEvent.click(getButtonByLabel('Openings')!)
    expect(screen.getByText('Asset Catalogue')).toBeInTheDocument()
    expect(useDungeonStore.getState().wallConnectionMode).toBe('door')
  })

  it('keeps stairs visible when reopening the unified openings category', () => {
    const stairAsset = getContentPackAssetsByCategory('opening').find((asset) =>
      !metadataSupportsConnectorType(asset.metadata, 'WALL'),
    )
    expect(stairAsset).toBeDefined()

    useDungeonStore.getState().setWallConnectionMode('door')
    render(<PropToolPanel />)

    fireEvent.click(getButtonByLabel('Openings')!)
    fireEvent.click(getCatalogButtonByAssetName(stairAsset!.name)!)
    fireEvent.click(getButtonByLabel('Furniture')!)
    fireEvent.click(getButtonByLabel('Openings')!)

    expect(screen.getByText('Asset Catalogue')).toBeInTheDocument()
    expect(getCatalogButtonByAssetName(stairAsset!.name)).not.toBeNull()
  })

  it('updates the selected surface brush asset from the unified surfaces category', () => {
    const floorAsset = getContentPackAssetsByCategory('floor')[0]
    expect(floorAsset).toBeDefined()

    render(<PropToolPanel />)

    fireEvent.click(getButtonByLabel('Surfaces')!)
    const assetButton = getCatalogButtonByAssetName(floorAsset!.name)
    expect(assetButton).not.toBeNull()
    fireEvent.click(assetButton!)

    expect(useDungeonStore.getState().surfaceBrushAssetIds.floor).toBe(floorAsset!.id)
  })
})
