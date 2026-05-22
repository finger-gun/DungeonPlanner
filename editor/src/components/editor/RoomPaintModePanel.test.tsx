import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { RoomPaintModePanel } from './RoomPaintModePanel'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('RoomPaintModePanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
    useDungeonStore.getState().setTool('room')
  })

  afterEach(() => {
    cleanup()
  })

  it('switches into spline walls mode from the room context toolbar', () => {
    render(<RoomPaintModePanel sidebarVisible={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Spline walls' }))

    expect(useDungeonStore.getState().roomEditMode).toBe('walls')
  })

  it('returns to room paint when selecting a room paint tool', () => {
    useDungeonStore.getState().setRoomEditMode('walls')
    render(<RoomPaintModePanel sidebarVisible={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'Paint' }))

    expect(useDungeonStore.getState().roomEditMode).toBe('rooms')
    expect(useDungeonStore.getState().roomPaintMode).toBe('paint')
  })

  it('only shows area, paint, and spline wall tools', () => {
    render(<RoomPaintModePanel sidebarVisible={false} />)

    expect(screen.getByRole('button', { name: 'Area' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Paint' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Spline walls' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Resize' })).not.toBeInTheDocument()
  })
})
