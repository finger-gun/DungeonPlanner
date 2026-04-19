import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RoomToolPanel } from './RoomToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('RoomToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows outdoor texture paint controls only in outdoor mode', () => {
    render(<RoomToolPanel />)
    expect(screen.queryByText('Brush Mode')).not.toBeInTheDocument()
    expect(screen.queryByText('Ground Texture')).not.toBeInTheDocument()

    cleanup()
    useDungeonStore.getState().newDungeon('outdoor')
    render(<RoomToolPanel />)
    expect(screen.getByText('Brush Mode')).toBeInTheDocument()
  })

  it('updates outdoor brush mode and texture brush from UI controls', () => {
    useDungeonStore.getState().newDungeon('outdoor')
    render(<RoomToolPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Ground Texture' }))
    expect(useDungeonStore.getState().outdoorBrushMode).toBe('ground-texture')
    expect(screen.getByRole('button', { name: 'Short Grass' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Rough Stone' }))
    expect(useDungeonStore.getState().outdoorGroundTextureBrush).toBe('rough-stone')
  })

  it('shows sculpt controls only for the terrain sculpt brush', () => {
    useDungeonStore.getState().newDungeon('outdoor')
    render(<RoomToolPanel />)

    expect(screen.queryByText('Sculpt Direction')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Terrain Sculpt' }))
    expect(screen.getByText('Sculpt Direction')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Lower' }))
    expect(useDungeonStore.getState().outdoorTerrainSculptMode).toBe('lower')
  })
})
