import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import userEvent from '@testing-library/user-event'
import { cleanup, render, screen } from '@testing-library/react'
import { CameraDropdown } from './CameraDropdown'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('CameraDropdown', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('lets users toggle the grid from the camera menu', async () => {
    const user = userEvent.setup()
    render(<CameraDropdown />)

    await user.click(screen.getByRole('button', { name: /camera/i }))

    const gridToggle = screen.getByRole('button', { name: 'Grid' })
    expect(gridToggle).toHaveAttribute('aria-pressed', 'true')

    await user.click(gridToggle)

    expect(useDungeonStore.getState().showGrid).toBe(false)
    expect(gridToggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('Hidden')).toBeInTheDocument()
  })

  it('lets users switch to the classic angled orthographic preset', async () => {
    const user = userEvent.setup()
    render(<CameraDropdown />)

    await user.click(screen.getByRole('button', { name: /camera/i }))
    await user.click(screen.getByRole('button', { name: /classic/i }))

    expect(useDungeonStore.getState().cameraPreset).toBe('classic')
    expect(useDungeonStore.getState().activeCameraMode).toBe('classic')
  })
})
