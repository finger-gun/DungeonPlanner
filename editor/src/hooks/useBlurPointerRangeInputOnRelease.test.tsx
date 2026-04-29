import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { useBlurPointerRangeInputOnRelease } from './useBlurPointerRangeInputOnRelease'

function TestHarness() {
  useBlurPointerRangeInputOnRelease()

  return (
    <div>
      <input aria-label="Intensity" type="range" defaultValue="4" />
      <input aria-label="Notes" type="text" defaultValue="Torch" />
    </div>
  )
}

describe('useBlurPointerRangeInputOnRelease', () => {
  afterEach(() => {
    cleanup()
  })

  it('releases range input focus after pointer-driven slider changes', () => {
    render(<TestHarness />)

    const slider = screen.getByLabelText('Intensity')
    slider.focus()
    expect(slider).toHaveFocus()

    fireEvent.pointerDown(slider)
    fireEvent.change(slider, { target: { value: '7' } })

    expect(slider).not.toHaveFocus()
  })

  it('keeps keyboard-focused sliders active when there was no pointer interaction', () => {
    render(<TestHarness />)

    const slider = screen.getByLabelText('Intensity')
    slider.focus()
    expect(slider).toHaveFocus()

    fireEvent.change(slider, { target: { value: '6' } })

    expect(slider).toHaveFocus()
  })
})
