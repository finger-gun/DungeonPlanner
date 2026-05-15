import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorldRaycastAcceleration } from './WorldRaycastAcceleration'

vi.mock('@react-three/drei', () => ({
  Bvh: ({
    children,
    enabled,
    firstHitOnly,
  }: {
    children: React.ReactNode
    enabled?: boolean
    firstHitOnly?: boolean
  }) => (
    <div
      data-testid="world-bvh"
      data-enabled={String(enabled)}
      data-first-hit-only={String(firstHitOnly)}
    >
      {children}
    </div>
  ),
}))

describe('WorldRaycastAcceleration', () => {
  it('wraps children in a BVH using first-hit-only ray queries', () => {
    render(
      <WorldRaycastAcceleration>
        <span>world content</span>
      </WorldRaycastAcceleration>,
    )

    expect(screen.getByTestId('world-bvh')).toHaveAttribute('data-enabled', 'true')
    expect(screen.getByTestId('world-bvh')).toHaveAttribute('data-first-hit-only', 'true')
    expect(screen.getByText('world content')).toBeInTheDocument()
  })
})
