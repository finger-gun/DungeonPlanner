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

  it('toggles selected prop state from the inspector without dropping existing props', () => {
    const placedId = 'doorway-1'
    useDungeonStore.setState((state) => ({
      ...state,
      selection: placedId,
      placedObjects: {
        ...state.placedObjects,
        [placedId]: {
          id: placedId,
          type: 'prop',
          assetId: 'dungeon.wall_wall_doorway',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          props: { connector: 'WALL', direction: 'north' },
          cell: [0, 0],
          cellKey: '0:0:north',
          layerId: state.activeLayerId,
        },
      },
    }))

    render(<SelectToolPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(useDungeonStore.getState().placedObjects[placedId]?.props).toMatchObject({
      connector: 'WALL',
      direction: 'north',
      open: true,
    })
  })

  it('does not expose opening editing in the select tool', () => {
    const openingId = 'opening-1'
    useDungeonStore.setState((state) => ({
      ...state,
      selection: openingId,
      wallOpenings: {
        ...state.wallOpenings,
        [openingId]: {
          id: openingId,
          assetId: 'core.opening_door_wall_1',
          wallKey: '0:0:north',
          width: 1,
          flipped: false,
          layerId: state.activeLayerId,
        },
      },
    }))

    render(<SelectToolPanel />)

    expect(screen.getByText('Select Tool')).toBeInTheDocument()
    expect(screen.queryByText('Selected Connection')).not.toBeInTheDocument()
    expect(useDungeonStore.getState().wallOpenings[openingId]?.assetId).toBe('core.opening_door_wall_1')
  })

  it('toggles selected interactive wall state from the inspector', () => {
    const wallKey = '0:0:east'
    useDungeonStore.setState((state) => ({
      ...state,
      selection: wallKey,
      paintedCells: {
        ...state.paintedCells,
        '0:0': { cell: [0, 0], layerId: state.activeLayerId, roomId: null },
      },
      wallSurfaceAssetIds: {
        ...state.wallSurfaceAssetIds,
        [wallKey]: 'dungeon.wall_wall_doorway',
      },
      wallSurfaceProps: {
        ...state.wallSurfaceProps,
        [wallKey]: {},
      },
    }))

    render(<SelectToolPanel />)

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(useDungeonStore.getState().wallSurfaceProps[wallKey]).toMatchObject({ open: true })
  })
})
