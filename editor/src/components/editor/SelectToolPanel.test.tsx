import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SelectToolPanel } from './SelectToolPanel'
import { upsertSplineWallGraphRoomPath } from '../../store/splineWallGraph'
import { useDungeonStore } from '../../store/useDungeonStore'
import { createSplineWallSegmentSideSelectionKey } from '../../store/wallStyleAssignments'

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
          assetId: 'dungeon.props_torch',
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
          assetId: 'dungeon.props_torch',
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

  it('lets select mode open a selected wall opening', () => {
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

    expect(screen.getByText('Selected Opening')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(useDungeonStore.getState().wallOpenings[openingId]?.assetId).toBe('core.opening_door_wall_1')
    expect(useDungeonStore.getState().wallOpenings[openingId]?.objectProps).toMatchObject({ open: true })
  })

  it('shows the wall face inspector for selected spline wall faces', () => {
    useDungeonStore.setState((state) => ({
      ...state,
      selection: createSplineWallSegmentSideSelectionKey('room-a:path:0:segment:0', 'left'),
      splineWallGraph: upsertSplineWallGraphRoomPath(state.splineWallGraph, {
        roomId: 'room-a',
        layerId: state.activeLayerId,
        nodes: [
          { position: [0, 0], cornerMode: 'square', cornerAmount: 0 },
          { position: [1, 0], cornerMode: 'square', cornerAmount: 0 },
          { position: [1, 1], cornerMode: 'square', cornerAmount: 0 },
          { position: [0, 1], cornerMode: 'square', cornerAmount: 0 },
        ],
      }),
    }))

    render(<SelectToolPanel />)

    expect(screen.getByText('Selected Wall Face')).toBeInTheDocument()
    expect(screen.getByText('Structural Core')).toBeInTheDocument()
  })

})
