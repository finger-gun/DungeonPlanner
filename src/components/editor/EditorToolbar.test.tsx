import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { EditorToolbar } from './EditorToolbar'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('EditorToolbar', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('creates an outdoor map from the New Dungeon menu', () => {
    render(<EditorToolbar />)

    fireEvent.click(screen.getByTitle('File'))
    fireEvent.click(screen.getByRole('button', { name: /new dungeon/i }))
    fireEvent.click(screen.getByRole('button', { name: /new outdoor map/i }))

    const state = useDungeonStore.getState()
    expect(state.mapMode).toBe('outdoor')
    expect(state.tool).toBe('room')
  })

  it('hides the opening tool shortcut in outdoor mode', () => {
    useDungeonStore.getState().newDungeon('outdoor')
    render(<EditorToolbar />)

    expect(screen.queryByTitle('Opening')).not.toBeInTheDocument()
  })
})
