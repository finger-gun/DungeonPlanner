import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import { SelectedPropInspector } from './SelectedPropInspector'

const setObjectPropsMock = vi.hoisted(() => vi.fn())

vi.mock('../../store/useDungeonStore', () => ({
  useDungeonStore: (selector: (state: { setObjectProps: typeof setObjectPropsMock }) => unknown) => selector({
    setObjectProps: setObjectPropsMock,
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
})
