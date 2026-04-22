import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SelectToolPanel } from './SelectToolPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

describe('SelectToolPanel', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows light controls for a selected lit prop', () => {
    const placedId = 'torch-1'
    useDungeonStore.setState((state) => ({
      ...state,
      selection: placedId,
      placedObjects: {
        ...state.placedObjects,
        [placedId]: {
          id: placedId,
          type: 'prop',
          assetId: 'dungeon.props_torch_lit',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          props: {},
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: state.activeLayerId,
        },
      },
    }))

    render(<SelectToolPanel />)

    expect(screen.getByText('Selected Prop')).toBeInTheDocument()
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByLabelText('Light Intensity')).toBeInTheDocument()
  })

  it('commits light intensity after slider release in select mode', () => {
    const placedId = 'torch-1'
    useDungeonStore.setState((state) => ({
      ...state,
      selection: placedId,
      placedObjects: {
        ...state.placedObjects,
        [placedId]: {
          id: placedId,
          type: 'prop',
          assetId: 'dungeon.props_torch_lit',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          props: {},
          cell: [0, 0],
          cellKey: '0:0:floor',
          layerId: state.activeLayerId,
        },
      },
    }))

    render(<SelectToolPanel />)

    const slider = screen.getByLabelText('Light Intensity')
    const historyBeforeDrag = useDungeonStore.getState().history.length

    fireEvent.change(slider, { target: { value: '3.5' } })
    expect(useDungeonStore.getState().objectLightPreviewOverrides[placedId]).toMatchObject({ intensity: 3.5 })
    expect(useDungeonStore.getState().placedObjects[placedId]?.props.lightOverrides).toBeUndefined()
    expect(useDungeonStore.getState().history).toHaveLength(historyBeforeDrag)

    fireEvent.mouseUp(slider)
    expect(useDungeonStore.getState().placedObjects[placedId]?.props.lightOverrides).toMatchObject({ intensity: 3.5 })
    expect(useDungeonStore.getState().objectLightPreviewOverrides[placedId]).toBeUndefined()
    expect(useDungeonStore.getState().history).toHaveLength(historyBeforeDrag + 1)
  })
})
