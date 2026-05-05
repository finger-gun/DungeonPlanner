import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

describe('SelectedPropInspector appearance controls', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    setObjectPropsMock.mockReset()
    setObjectLightPreviewMock.mockReset()
  })

  it('increments the selected object size', () => {
    render(<SelectedPropInspector object={createObject()} asset={null} onDelete={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: 'Larger' }))

    expect(setObjectPropsMock).toHaveBeenCalledWith('prop-1', { instanceScale: 1.25 })
  })

  it('resets object size back to normal by removing the override', () => {
    render(
      <SelectedPropInspector
        object={createObject({ props: { instanceScale: 1.5 } })}
        asset={null}
        onDelete={() => {}}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Normal' }))

    expect(setObjectPropsMock).toHaveBeenCalledWith('prop-1', {})
  })

  it('stores and clears tint colors', () => {
    render(
      <SelectedPropInspector
        object={createObject({ props: { tintColor: '#aabbcc' } })}
        asset={null}
        onDelete={() => {}}
      />,
    )

    fireEvent.change(screen.getByLabelText('Tint Color'), {
      target: { value: '#112233' },
    })
    expect(setObjectPropsMock).toHaveBeenCalledWith('prop-1', { tintColor: '#112233' })

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(setObjectPropsMock).toHaveBeenCalledWith('prop-1', {})
  })

  it('shows atlas color variant controls for opted-in props', () => {
    render(
      <SelectedPropInspector
        object={createObject({ props: { bannerColor: 'blue' } })}
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

    fireEvent.click(screen.getByRole('button', { name: 'Red' }))
    expect(setObjectPropsMock).toHaveBeenCalledWith('prop-1', { bannerColor: 'red' })

    fireEvent.click(screen.getAllByRole('button', { name: 'Clear' })[1]!)
    expect(setObjectPropsMock).toHaveBeenCalledWith('prop-1', {})
  })
})
