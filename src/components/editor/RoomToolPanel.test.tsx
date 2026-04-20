import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RoomToolPanel } from './RoomToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('RoomToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
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
})
