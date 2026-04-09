import { beforeEach, describe, expect, it } from 'vitest'
import { useDungeonStore } from './useDungeonStore'

describe('useDungeonStore history', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  it('paints room cells and supports undo/redo', () => {
    const paintedCount = useDungeonStore.getState().paintCells([
      [0, 0],
      [1, 0],
    ])

    let state = useDungeonStore.getState()
    expect(paintedCount).toBe(2)
    expect(Object.keys(state.paintedCells)).toHaveLength(2)
    expect(state.paintedCells['0:0']).toEqual([0, 0])

    state.undo()
    state = useDungeonStore.getState()
    expect(Object.keys(state.paintedCells)).toHaveLength(0)

    state.redo()
    state = useDungeonStore.getState()
    expect(Object.keys(state.paintedCells)).toHaveLength(2)
  })

  it('places a prop into a snapped cell and selects it', () => {
    const placedId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0.45, 1],
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0',
    })

    const state = useDungeonStore.getState()
    expect(placedId).toBeTruthy()
    expect(state.selection).toBe(placedId)
    expect(state.occupancy['0:0']).toBe(placedId)
    expect(state.placedObjects[placedId!]?.type).toBe('prop')
  })

  it('replaces the existing prop in a cell and supports undo/redo', () => {
    useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0.45, 1],
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0',
    })

    const replacementId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0.45, 1],
      rotation: [0, 0, 0],
      props: { variation: 'alt' },
      cell: [0, 0],
      cellKey: '0:0',
    })

    let state = useDungeonStore.getState()
    expect(Object.keys(state.placedObjects)).toHaveLength(1)
    expect(state.occupancy['0:0']).toBe(replacementId)
    expect(state.placedObjects[replacementId!]?.props).toEqual({
      variation: 'alt',
    })

    state.undo()
    state = useDungeonStore.getState()
    expect(Object.keys(state.placedObjects)).toHaveLength(1)
    expect(state.placedObjects[state.occupancy['0:0']]?.props).toEqual({})

    state.redo()
    state = useDungeonStore.getState()
    expect(state.placedObjects[state.occupancy['0:0']]?.props).toEqual({
      variation: 'alt',
    })
  })

  it('tracks tool changes through history', () => {
    useDungeonStore.getState().setTool('prop')
    expect(useDungeonStore.getState().tool).toBe('prop')

    useDungeonStore.getState().undo()
    expect(useDungeonStore.getState().tool).toBe('room')

    useDungeonStore.getState().redo()
    expect(useDungeonStore.getState().tool).toBe('prop')
  })

  it('removes a wall-connected prop when its wall anchor disappears', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const propId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0, 2],
      rotation: [0, Math.PI, 0],
      props: {
        connector: 'WALL',
        direction: 'north',
      },
      cell: [0, 0],
      cellKey: '0:0:north',
    })

    expect(propId).toBeTruthy()
    expect(useDungeonStore.getState().occupancy['0:0:north']).toBe(propId)

    useDungeonStore.getState().paintCells([[0, 1]])

    const state = useDungeonStore.getState()
    expect(state.occupancy['0:0:north']).toBeUndefined()
    expect(state.placedObjects[propId!]).toBeUndefined()
  })

  it('removes a floor-connected prop when its floor cell is erased', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const propId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: {
        connector: 'FLOOR',
        direction: null,
      },
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    expect(propId).toBeTruthy()
    expect(useDungeonStore.getState().occupancy['0:0:floor']).toBe(propId)

    useDungeonStore.getState().eraseCells([[0, 0]])

    const state = useDungeonStore.getState()
    expect(state.occupancy['0:0:floor']).toBeUndefined()
    expect(state.placedObjects[propId!]).toBeUndefined()
  })
})
