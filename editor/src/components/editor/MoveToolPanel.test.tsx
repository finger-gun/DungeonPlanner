import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

  it('shows time-of-day controls for indoor maps too', () => {
    render(<MoveToolPanel />)
    expect(screen.getByText('Environment')).toBeInTheDocument()
    expect(screen.getByLabelText('Time of Day')).toBeInTheDocument()
    expect(screen.getByText(/dungeon ambience/i)).toBeInTheDocument()
  })

  it('lets users toggle pixelation from the settings panel', async () => {
    const user = userEvent.setup()
    render(<MoveToolPanel />)

    const toggle = screen.getByLabelText('Pixelate')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(useDungeonStore.getState().postProcessing.pixelateEnabled).toBe(true)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
  })

  it('lets users toggle light flicker independently from particles', async () => {
    const user = userEvent.setup()
    render(<MoveToolPanel />)

    const toggle = screen.getByLabelText('Light Flicker')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggle)

    expect(useDungeonStore.getState().lightFlickerEnabled).toBe(false)
    expect(useDungeonStore.getState().particleEffectsEnabled).toBe(true)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not show a light effects toggle once prop lights are fully baked', () => {
    render(<MoveToolPanel />)

    expect(screen.queryByLabelText('Light Effects')).not.toBeInTheDocument()
  })

  it('lets users change pixel size from the settings panel', async () => {
    const user = userEvent.setup()
    render(<MoveToolPanel />)

    await user.click(screen.getByLabelText('Pixelate'))
    const slider = screen.getByLabelText('Pixel Size')
    fireEvent.change(slider, { target: { value: '10' } })

    expect(useDungeonStore.getState().postProcessing.pixelSize).toBe(10)
  })

  it('lets users toggle autofocus blur without disabling post-processing', async () => {
    const user = userEvent.setup()
    render(<MoveToolPanel />)

    const toggle = screen.getByLabelText('Autofocus')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(toggle)

    expect(useDungeonStore.getState().postProcessing.enabled).toBe(false)
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not show a viewport section in settings', () => {
    render(<MoveToolPanel />)

    expect(screen.queryByText('Viewport')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Grid' })).not.toBeInTheDocument()
  })

  it('does not show synthetic light stress controls', () => {
    render(<MoveToolPanel />)

    expect(screen.queryByText('Synthetic Light Stress')).not.toBeInTheDocument()
  })
})
