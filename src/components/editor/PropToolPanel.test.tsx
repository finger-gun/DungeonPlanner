import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { PropToolPanel } from './PropToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('PropToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders the prop catalog without the character generator UI', () => {
    render(<PropToolPanel />)

    expect(screen.getByText('Catalogue')).toBeInTheDocument()
    expect(screen.getByText('Props')).toBeInTheDocument()
    expect(screen.queryByText('Characters')).not.toBeInTheDocument()
    expect(screen.getByAltText('KayKit Lit Candle thumbnail')).toBeInTheDocument()
  })

  it('updates the selected prop asset when a catalog card is clicked', () => {
    render(<PropToolPanel />)

    const candleButton = screen.getByRole('button', { name: /kaykit lit candle/i })
    expect(candleButton).toBeInTheDocument()
    fireEvent.click(candleButton)

    expect(useDungeonStore.getState().selectedAssetIds.prop).toBe('kaykit.props_candle_lit')
    expect(candleButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('allows selecting a prop surface receiver asset from the catalog', () => {
    render(<PropToolPanel />)

    const boxButton = screen.getByRole('button', { name: /kaykit large box/i })
    expect(boxButton).toBeInTheDocument()
    fireEvent.click(boxButton)

    expect(useDungeonStore.getState().selectedAssetIds.prop).toBe('kaykit.props_box_large')
    expect(boxButton).toHaveAttribute('aria-pressed', 'true')
  })
})
