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

  it('switches between room and wall sub-tools', () => {
    render(<RoomToolPanel />)

    const wallsButton = screen.getByRole('button', { name: 'Walls' })
    fireEvent.click(wallsButton)

    expect(useDungeonStore.getState().roomEditMode).toBe('walls')
    expect(screen.getByText(/preview a locked wall run/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Rooms' }))

    expect(useDungeonStore.getState().roomEditMode).toBe('rooms')
    expect(screen.getByText(/left-drag to paint rooms/i)).toBeInTheDocument()
  })

  it('shows outdoor texture paint controls only in outdoor mode', () => {
    render(<RoomToolPanel />)
    expect(screen.queryByText('Tool')).not.toBeInTheDocument()
    expect(screen.queryByText('Style')).not.toBeInTheDocument()

    cleanup()
    useDungeonStore.getState().newDungeon('outdoor')
    render(<RoomToolPanel />)
    expect(screen.getByText('Tool')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Nature' }).length).toBeGreaterThan(0)
  })

  it('updates outdoor brush mode and texture brush from UI controls', () => {
    useDungeonStore.getState().newDungeon('outdoor')
    render(<RoomToolPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Style' }))
    expect(useDungeonStore.getState().outdoorBrushMode).toBe('terrain-style')
    expect(screen.getAllByRole('button', { name: 'Lush' })[0]).toBeInTheDocument()

    fireEvent.click(screen.getAllByRole('button', { name: 'Fern' })[0])
    expect(useDungeonStore.getState().outdoorTerrainStyleBrush).toBe('Color4')
  })

  it('shows sculpt controls only for the terrain sculpt brush', () => {
    useDungeonStore.getState().newDungeon('outdoor')
    render(<RoomToolPanel />)

    expect(screen.queryByText('Sculpt Direction')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sculpt' }))
    expect(screen.getByText('Sculpt Direction')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Lower' }))
    expect(useDungeonStore.getState().outdoorTerrainSculptMode).toBe('lower')
  })

  it('does not render a room row for each room in the sidebar', () => {
    const state = useDungeonStore.getState()
    const roomId = state.createRoom('Painted Room')
    state.renameRoom(roomId, 'Painted Room')

    render(<RoomToolPanel />)

    expect(screen.queryByText('No rooms yet. Create one to override room-wide floor/wall assets.')).not.toBeInTheDocument()
    expect(screen.queryByText('Painted Room')).not.toBeInTheDocument()
    expect(screen.getByText(/left-drag to paint rooms/i)).toBeInTheDocument()
  })
})
