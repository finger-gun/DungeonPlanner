import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { CompactPillButton } from './CompactPillButton'

describe('CompactPillButton', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders a compact full-width active pill button', () => {
    render(
      <CompactPillButton active tone="sky" fullWidth>
        Furniture
      </CompactPillButton>,
    )

    const button = screen.getByRole('button', { name: 'Furniture' })
    expect(button.className).toContain('rounded-lg')
    expect(button.className).toContain('min-h-8')
    expect(button.className).toContain('w-full')
    expect(button.className).toContain('border-sky-300/35')
  })
})
