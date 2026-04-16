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
    expect(screen.getByAltText('Barrel thumbnail')).toBeInTheDocument()
  })

  it('updates the selected prop asset when a catalog card is clicked', () => {
    render(<PropToolPanel />)

    fireEvent.click(screen.getByRole('button', { name: /barrel/i }))

    expect(useDungeonStore.getState().selectedAssetIds.prop).toBe('core.props_barrel')
    expect(screen.getByRole('button', { name: /barrel/i })).toHaveAttribute('aria-pressed', 'true')
  })
})
