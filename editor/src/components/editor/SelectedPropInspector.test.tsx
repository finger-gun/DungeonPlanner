import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import { SelectedPropInspector } from './SelectedPropInspector'

const setObjectPropsMock = vi.hoisted(() => vi.fn())
const setObjectLightPreviewMock = vi.hoisted(() => vi.fn())

vi.mock('../../store/useDungeonStore', () => ({
  useDungeonStore: (selector: (state: {
    setObjectProps: typeof setObjectPropsMock
    setObjectLightPreview: typeof setObjectLightPreviewMock
  }) => unknown) => selector({
    setObjectProps: setObjectPropsMock,
    setObjectLightPreview: setObjectLightPreviewMock,
  }),
}))

function createObject(overrides: Partial<DungeonObjectRecord> = {}): DungeonObjectRecord {
  return {
    id: 'prop-1',
    type: 'prop',
    assetId: 'prop-asset',
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    props: {},
    cell: [0, 0],
    cellKey: '0:0:floor',
    layerId: 'default',
    ...overrides,
  }
}

describe('SelectedPropInspector', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    setObjectPropsMock.mockReset()
    setObjectLightPreviewMock.mockReset()
  })

  it('does not render appearance controls in the sidebar', () => {
    render(
      <SelectedPropInspector
        object={createObject({
          props: { instanceScale: 1.5, tintColor: '#aabbcc', bannerColor: 'blue' },
        })}
        asset={{
          id: 'prop-asset',
          slug: 'prop-asset',
          name: 'Banner',
          category: 'prop',
          Component: (() => null),
          metadata: {
            atlasColorVariants: {
              propKey: 'bannerColor',
              variants: [
                { id: 'red', label: 'Red', swatchColor: '#ef4444', uvOffset: [0, 0] },
                { id: 'blue', label: 'Blue', swatchColor: '#3b82f6', uvOffset: [0.5, 0] },
              ],
            },
          },
        }}
        onDelete={() => {}}
      />,
    )

    expect(screen.queryByText('Appearance')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Smaller' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Normal' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Larger' })).toBeNull()
    expect(screen.queryByLabelText('Tint Color')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Red' })).toBeNull()
    expect(setObjectPropsMock).not.toHaveBeenCalled()
  })
})
