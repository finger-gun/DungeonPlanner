import { beforeEach, describe, expect, it } from 'vitest'
import { useDungeonStore, getOpeningSegments } from './useDungeonStore'

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
    expect(state.paintedCells['0:0']).toMatchObject({ cell: [0, 0], layerId: 'default' })
    expect(state.paintedCells['0:0'].roomId).toBeTruthy() // auto-assigned room

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

  it('places a player into a snapped cell and keeps its player type', () => {
    const placedId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId: 'core.player_barbarian',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    const state = useDungeonStore.getState()
    expect(placedId).toBeTruthy()
    expect(state.selection).toBe(placedId)
    expect(state.occupancy['0:0:floor']).toBe(placedId)
    expect(state.placedObjects[placedId!]?.type).toBe('player')
  })

  it('moves a player to another painted floor cell without changing its id', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])

    const placedId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId: 'core.player_barbarian',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: { connector: 'FLOOR', direction: null },
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    const moved = useDungeonStore.getState().moveObject(placedId!, {
      position: [3, 0, 1],
      cell: [1, 0],
      cellKey: '1:0:floor',
    })

    const state = useDungeonStore.getState()
    expect(moved).toBe(true)
    expect(state.occupancy['0:0:floor']).toBeUndefined()
    expect(state.occupancy['1:0:floor']).toBe(placedId)
    expect(state.placedObjects[placedId!]?.cell).toEqual([1, 0])
    expect(state.placedObjects[placedId!]?.position).toEqual([3, 0, 1])
  })

  it('does not move a player onto an occupied floor cell', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])

    const firstId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId: 'core.player_barbarian',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: { connector: 'FLOOR', direction: null },
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    const secondId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId: 'core.player_barbarian',
      position: [3, 0, 1],
      rotation: [0, 0, 0],
      props: { connector: 'FLOOR', direction: null },
      cell: [1, 0],
      cellKey: '1:0:floor',
    })

    const moved = useDungeonStore.getState().moveObject(firstId!, {
      position: [3, 0, 1],
      cell: [1, 0],
      cellKey: '1:0:floor',
    })

    const state = useDungeonStore.getState()
    expect(moved).toBe(false)
    expect(state.occupancy['0:0:floor']).toBe(firstId)
    expect(state.occupancy['1:0:floor']).toBe(secondId)
    expect(state.placedObjects[firstId!]?.cell).toEqual([0, 0])
  })

  it('clears explored cells without changing painted cells', () => {
    const state = useDungeonStore.getState()
    state.paintCells([[0, 0], [1, 0]])
    state.mergeExploredCells(['0:0', '1:0'])

    expect(Object.keys(useDungeonStore.getState().exploredCells)).toHaveLength(2)

    useDungeonStore.getState().clearExploredCells()

    const nextState = useDungeonStore.getState()
    expect(nextState.exploredCells).toEqual({})
    expect(Object.keys(nextState.paintedCells)).toHaveLength(2)
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
    expect(useDungeonStore.getState().tool).toBe('move')

    useDungeonStore.getState().redo()
    expect(useDungeonStore.getState().tool).toBe('prop')
  })

  it('preserves a wall-connected prop when adjacent room is drawn (inter-room wall)', () => {
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

    // Painting the adjacent cell creates a new room — the wall still exists as
    // an inter-room boundary, so the prop must be preserved.
    useDungeonStore.getState().paintCells([[0, 1]])

    const state = useDungeonStore.getState()
    expect(state.occupancy['0:0:north']).toBe(propId)
    expect(state.placedObjects[propId!]).toBeDefined()
  })

  it('removes a wall-connected prop when its host cell is erased', () => {
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
    useDungeonStore.getState().eraseCells([[0, 0]])

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

  it('rotates a selected floor object by 90 degrees', () => {
    const placedId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId: 'core.player_barbarian',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: {
        connector: 'FLOOR',
        direction: null,
      },
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    useDungeonStore.getState().rotateSelection()

    expect(useDungeonStore.getState().placedObjects[placedId!]?.rotation).toEqual([0, Math.PI / 2, 0])
  })

  it('rotates a selected wall-attached prop by 180 degrees', () => {
    const placedId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0, 2],
      rotation: [0, 0, 0],
      props: {
        connector: 'WALL',
        direction: 'north',
      },
      cell: [0, 0],
      cellKey: '0:0:north',
    })

    useDungeonStore.getState().rotateSelection()

    expect(useDungeonStore.getState().placedObjects[placedId!]?.rotation).toEqual([0, Math.PI, 0])
  })

  it('rotates a selected opening by toggling its flip flag', () => {
    const openingId = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: false,
    })

    useDungeonStore.getState().selectObject(openingId)
    useDungeonStore.getState().rotateSelection()

    expect(useDungeonStore.getState().wallOpenings[openingId!]?.flipped).toBe(true)
  })
})

// ── getOpeningSegments ────────────────────────────────────────────────────────

describe('getOpeningSegments', () => {
  it('returns the key itself for a 1-wide opening', () => {
    expect(getOpeningSegments('3:2:north', 1)).toEqual(['3:2:north'])
  })

  it('expands a 3-wide N/S opening along X', () => {
    // centre cell is 3:2, so segments should be 2:2, 3:2, 4:2
    expect(getOpeningSegments('3:2:north', 3)).toEqual([
      '2:2:north',
      '3:2:north',
      '4:2:north',
    ])
  })

  it('expands a 3-wide E/W opening along Z', () => {
    expect(getOpeningSegments('3:2:east', 3)).toEqual([
      '3:1:east',
      '3:2:east',
      '3:3:east',
    ])
  })
})

// ── wall openings ─────────────────────────────────────────────────────────────

describe('useDungeonStore wall openings', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  it('places a wall opening and records it', () => {
    const id = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: false,
    })

    const state = useDungeonStore.getState()
    expect(id).toBeTruthy()
    expect(state.wallOpenings[id!]).toMatchObject({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: false,
    })
  })

  it('placing an overlapping opening replaces the existing one', () => {
    const first = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: false,
    })

    const second = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: true,
    })

    const state = useDungeonStore.getState()
    expect(state.wallOpenings[first!]).toBeUndefined()
    expect(state.wallOpenings[second!]).toBeDefined()
    expect(Object.keys(state.wallOpenings)).toHaveLength(1)
  })

  it('removes an opening by id', () => {
    const id = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '1:1:south',
      width: 1,
      flipped: false,
    })

    useDungeonStore.getState().removeOpening(id!)
    expect(useDungeonStore.getState().wallOpenings[id!]).toBeUndefined()
  })

  it('undo/redo works for placeOpening', () => {
    const id = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: false,
    })

    useDungeonStore.getState().undo()
    expect(useDungeonStore.getState().wallOpenings[id!]).toBeUndefined()

    useDungeonStore.getState().redo()
    expect(useDungeonStore.getState().wallOpenings[id!]).toBeDefined()
  })

  it('undo/redo works for removeOpening', () => {
    const id = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: false,
    })

    useDungeonStore.getState().removeOpening(id!)
    expect(useDungeonStore.getState().wallOpenings[id!]).toBeUndefined()

    useDungeonStore.getState().undo()
    expect(useDungeonStore.getState().wallOpenings[id!]).toBeDefined()
  })
})

// ── floors ───────────────────────────────────────────────────────────────────

describe('useDungeonStore floors', () => {
  beforeEach(() => {
    useDungeonStore.getState().newDungeon()
  })

  it('switchFloor saves active state and restores target snapshot', () => {
    // Paint cells on the starting floor
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])

    const { floorOrder } = useDungeonStore.getState()
    const groundId = floorOrder[0]

    // Create a second floor manually via ensureAdjacentFloor
    useDungeonStore.getState().ensureAdjacentFloor(
      1, [0, 0], 'core.props_staircase_down',
      [1, 0, 1], [0, 0, 0],
    )

    const upperFloorId = useDungeonStore.getState().floorOrder.find((id) => id !== groundId)!
    expect(upperFloorId).toBeTruthy()

    // Switch to upper floor — it should be empty except for the opposing staircase
    useDungeonStore.getState().switchFloor(upperFloorId)
    let state = useDungeonStore.getState()
    expect(state.activeFloorId).toBe(upperFloorId)
    expect(Object.keys(state.paintedCells)).toHaveLength(0)
    expect(Object.keys(state.placedObjects)).toHaveLength(1) // opposing staircase

    // Switch back — painted cells should be restored
    useDungeonStore.getState().switchFloor(groundId)
    state = useDungeonStore.getState()
    expect(state.activeFloorId).toBe(groundId)
    expect(Object.keys(state.paintedCells)).toHaveLength(2)
  })

  it('ensureAdjacentFloor creates a new floor with the opposing staircase', () => {
    useDungeonStore.getState().ensureAdjacentFloor(
      -1, [2, 3], 'core.props_staircase_up',
      [5, 0, 7], [0, Math.PI, 0],
    )

    const state = useDungeonStore.getState()
    const cellar = Object.values(state.floors).find((f) => f.level === -1)
    expect(cellar).toBeDefined()
    expect(cellar!.name).toBe('Cellar 1')

    const staircase = Object.values(cellar!.snapshot.placedObjects)[0]
    expect(staircase).toBeDefined()
    expect(staircase.assetId).toBe('core.props_staircase_up')
    expect(staircase.cell).toEqual([2, 3])
    expect(cellar!.snapshot.occupancy['2:3:floor']).toBe(staircase.id)
  })

  it('ensureAdjacentFloor injects staircase into an existing inactive floor', () => {
    // Create a floor at level 1
    useDungeonStore.getState().ensureAdjacentFloor(
      1, [0, 0], 'core.props_staircase_down',
      [1, 0, 1], [0, 0, 0],
    )
    const firstId = useDungeonStore.getState().floorOrder.find(
      (id) => useDungeonStore.getState().floors[id].level === 1,
    )!

    // Call again for the same level at a different cell
    useDungeonStore.getState().ensureAdjacentFloor(
      1, [4, 4], 'core.props_staircase_down',
      [9, 0, 9], [0, 0, 0],
    )

    const state = useDungeonStore.getState()
    // No duplicate floor should be created
    const level1Floors = Object.values(state.floors).filter((f) => f.level === 1)
    expect(level1Floors).toHaveLength(1)
    expect(level1Floors[0].id).toBe(firstId)

    // Both staircases should be in the snapshot
    const placed = Object.values(level1Floors[0].snapshot.placedObjects)
    expect(placed).toHaveLength(2)
  })

  it('ensureAdjacentFloor skips if target cell is already occupied', () => {
    useDungeonStore.getState().ensureAdjacentFloor(
      1, [0, 0], 'core.props_staircase_down',
      [1, 0, 1], [0, 0, 0],
    )
    const before = useDungeonStore.getState().floorOrder.length

    // Same cell again — should be a no-op
    useDungeonStore.getState().ensureAdjacentFloor(
      1, [0, 0], 'core.props_staircase_down',
      [1, 0, 1], [0, 0, 0],
    )

    expect(useDungeonStore.getState().floorOrder).toHaveLength(before)
    const floor1 = Object.values(useDungeonStore.getState().floors).find((f) => f.level === 1)!
    expect(Object.keys(floor1.snapshot.placedObjects)).toHaveLength(1)
  })
})

// ── newDungeon ────────────────────────────────────────────────────────────────

describe('useDungeonStore newDungeon', () => {
  beforeEach(() => {
    useDungeonStore.getState().newDungeon()
  })

  it('clears all state back to a single empty ground floor', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])
    useDungeonStore.getState().placeObject({
      type: 'prop', assetId: 'core.props_wall_torch',
      position: [1, 0, 1], rotation: [0, 0, 0],
      props: {}, cell: [0, 0], cellKey: '0:0',
    })
    useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north', width: 1, flipped: false,
    })
    useDungeonStore.getState().ensureAdjacentFloor(
      1, [0, 0], 'core.props_staircase_down',
      [1, 0, 1], [0, 0, 0],
    )

    useDungeonStore.getState().newDungeon()

    const state = useDungeonStore.getState()
    expect(Object.keys(state.paintedCells)).toHaveLength(0)
    expect(Object.keys(state.placedObjects)).toHaveLength(0)
    expect(Object.keys(state.wallOpenings)).toHaveLength(0)
    expect(state.history).toHaveLength(0)
    expect(state.future).toHaveLength(0)
    expect(state.floorOrder).toHaveLength(1)
    expect(state.floors[state.activeFloorId].level).toBe(0)
    expect(state.dungeonName).toBe('My Dungeon')
  })
})
