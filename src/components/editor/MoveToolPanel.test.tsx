import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MoveToolPanel } from './MoveToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('MoveToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows outdoor time-of-day controls for outdoor maps', () => {
    useDungeonStore.getState().newDungeon('outdoor')
    render(<MoveToolPanel />)
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByLabelText('Time of Day')).toBeInTheDocument()
  })

  it('does not show outdoor time-of-day controls for indoor maps', () => {
    render(<MoveToolPanel />)
    expect(screen.queryByText('Environment')).not.toBeInTheDocument()
  })
})
