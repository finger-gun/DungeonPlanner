import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/react'
import { MoveToolPanel } from './MoveToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'
import { FORWARD_PLUS_BACKEND_LABEL } from '../../rendering/forwardPlusConfig'

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

  it('shows time-of-day controls for indoor maps too', () => {
    render(<MoveToolPanel />)
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByLabelText('Time of Day')).toBeInTheDocument()
    expect(screen.getByText(/dungeon ambience/i)).toBeInTheDocument()
  })

  it('lets users enable the synthetic light stress benchmark and choose a count', async () => {
    const user = userEvent.setup()
    render(<MoveToolPanel />)

    const toggle = screen.getByLabelText('Synthetic Light Stress')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)
    await user.click(screen.getByRole('button', { name: '256' }))

    expect(useDungeonStore.getState().lightBenchmark.enabled).toBe(true)
    expect(useDungeonStore.getState().lightBenchmark.count).toBe(256)
    expect(screen.getByText(FORWARD_PLUS_BACKEND_LABEL)).toBeInTheDocument()
    expect(screen.getByText('256/256')).toBeInTheDocument()
  })
})
