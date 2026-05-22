import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RoomToolPanel } from './RoomToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('RoomToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
    useDungeonStore.getState().setRoomPaintMode('area')
  })

  afterEach(() => {
    cleanup()
  })

  it('removes redundant room mode buttons from the sidebar', () => {
    render(<RoomToolPanel />)

    expect(screen.queryByRole('button', { name: 'Rooms' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Walls' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inner walls' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Floor' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Wall Variants' })).not.toBeInTheDocument()
  })

  it('shows spline wall guidance when that mode is active', () => {
    useDungeonStore.getState().setRoomEditMode('walls')
    render(<RoomToolPanel />)

    expect(screen.getByText('Spline walls')).toBeInTheDocument()
    expect(screen.getByText(/amber node handles/i)).toBeInTheDocument()
  })

  it('updates indoor room descriptions to match the active context tool', () => {
    render(<RoomToolPanel />)

    expect(screen.getByText('Area Tool')).toBeInTheDocument()
    expect(screen.getByText(/draft a room footprint/i)).toBeInTheDocument()

    cleanup()
    useDungeonStore.getState().reset()
    useDungeonStore.getState().setRoomPaintMode('paint')
    render(<RoomToolPanel />)

    expect(screen.getByText('Paint Tool')).toBeInTheDocument()
    expect(screen.getByText(/paint rooms cell-by-cell/i)).toBeInTheDocument()
  })

  it('shows wall style choices for area, paint, and walls', () => {
    render(<RoomToolPanel />)
    expect(screen.queryByText('Room Style')).not.toBeInTheDocument()
    expect(screen.getByText('Interior Wall')).toBeInTheDocument()
    expect(screen.getByText('Exterior Wall')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Interior Wall: Rocky Cave' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exterior Wall: AI Gothic' })).toBeInTheDocument()
    expect(screen.getByTestId('Interior Wall-rocky-cave-preview')).toHaveAttribute('src', expect.any(String))
    expect(screen.getByTestId('Exterior Wall-ai-gothic-preview')).toHaveAttribute('src', expect.any(String))

    cleanup()
    useDungeonStore.getState().reset()
    useDungeonStore.getState().setRoomPaintMode('paint')
    render(<RoomToolPanel />)
    expect(screen.getByText('Interior Wall')).toBeInTheDocument()

    cleanup()
    useDungeonStore.getState().reset()
    useDungeonStore.getState().setRoomEditMode('walls')
    render(<RoomToolPanel />)
    expect(screen.getByText('Interior Wall')).toBeInTheDocument()
  })

  it('lets interior and exterior wall styles be picked independently before drawing', () => {
    render(<RoomToolPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Interior Wall: Rocky Cave' }))
    fireEvent.click(screen.getByRole('button', { name: 'Exterior Wall: AI Gothic' }))

    expect(useDungeonStore.getState().activeInteriorWallStyleId).toBe('rocky-cave')
    expect(useDungeonStore.getState().activeExteriorWallStyleId).toBe('ai-gothic')
  })

  it('does not show spline wall graph conversion controls in the sidebar', () => {
    useDungeonStore.getState().paintCells([[0, 0]])
    render(<RoomToolPanel />)

    expect(screen.queryByText('Spline Wall Graph')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /(?:Convert Rooms to|Rebuild) Spline Graph/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear Spline Graph' })).not.toBeInTheDocument()
  })

  it('resets legacy room variant modes back to rooms', () => {
    useDungeonStore.getState().setRoomPaintMode('area')
    useDungeonStore.getState().setRoomEditMode('floor-variants')
    render(<RoomToolPanel />)

    expect(useDungeonStore.getState().roomEditMode).toBe('rooms')
    expect(screen.getByText('Area Tool')).toBeInTheDocument()
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
    useDungeonStore.getState().setRoomPaintMode('area')
    const state = useDungeonStore.getState()
    const roomId = state.createRoom('Painted Room')
    state.renameRoom(roomId, 'Painted Room')

    render(<RoomToolPanel />)

    expect(screen.queryByText('No rooms yet. Create one to override room-wide floor/wall assets.')).not.toBeInTheDocument()
    expect(screen.queryByText('Painted Room')).not.toBeInTheDocument()
    expect(screen.getByText(/draft a room footprint/i)).toBeInTheDocument()
  })
})
