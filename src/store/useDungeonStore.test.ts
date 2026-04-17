import { beforeEach, describe, expect, it } from 'vitest'
import { getContentPackAssetById } from '../content-packs/registry'
import { useDungeonStore } from './useDungeonStore'
import { getOpeningSegments } from './openingSegments'

const TEST_IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg=='

function createTestGeneratedCharacter(name = 'Generated Test Player') {
  return useDungeonStore.getState().createGeneratedCharacter({
    storageId: `${name.toLowerCase().replace(/\s+/g, '-')}-storage`,
    name,
    kind: 'player',
    size: 'M',
    prompt: `${name} on white`,
    model: 'x/z-image-turbo',
    originalImageUrl: TEST_IMAGE_DATA_URL,
    processedImageUrl: TEST_IMAGE_DATA_URL,
    thumbnailUrl: TEST_IMAGE_DATA_URL,
    width: 300,
    height: 600,
  })
}

describe('useDungeonStore history', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
    Object.keys(useDungeonStore.getState().generatedCharacters).forEach((assetId) => {
      useDungeonStore.getState().removeGeneratedCharacter(assetId)
    })
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
    const assetId = createTestGeneratedCharacter('Generated Barbarian')
    const placedId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId,
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

  it('removes the selected room', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])
    const roomId = useDungeonStore.getState().paintedCells['0:0'].roomId

    expect(roomId).toBeTruthy()

    useDungeonStore.getState().selectRoom(roomId)
    useDungeonStore.getState().removeSelectedRoom()

    const state = useDungeonStore.getState()
    expect(state.rooms[roomId!]).toBeUndefined()
    expect(state.selectedRoomId).toBeNull()
    expect(state.paintedCells['0:0']).toBeUndefined()
    expect(state.paintedCells['1:0']).toBeUndefined()
  })

  it('clears both object and room selection', () => {
    useDungeonStore.getState().paintCells([[0, 0]])
    const roomId = useDungeonStore.getState().paintedCells['0:0'].roomId
    const placedId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0.45, 1],
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0',
    })

    useDungeonStore.getState().selectRoom(roomId)
    useDungeonStore.getState().selectObject(placedId)
    useDungeonStore.getState().clearSelection()

    const state = useDungeonStore.getState()
    expect(state.selection).toBeNull()
    expect(state.selectedRoomId).toBeNull()
  })

  it('resizes a non-rectangular room by dragging a boundary run', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0], [0, 1]])
    const roomId = useDungeonStore.getState().paintedCells['0:0'].roomId

    const resized = useDungeonStore.getState().resizeRoomByBoundaryRun(
      roomId!,
      { direction: 'north', line: 1, start: 1, end: 1 },
      2,
    )

    const state = useDungeonStore.getState()
    expect(resized).toBe(true)
    expect(state.paintedCells['1:1']?.roomId).toBe(roomId)
    expect(state.selectedRoomId).toBeNull()
  })

  it('updates object props and records the change in history', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const placedId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0.45, 1],
      rotation: [0, 0, 0],
      props: { connector: 'WALL', direction: 'north' },
      cell: [0, 0],
      cellKey: '0:0:north',
    })

    const updated = useDungeonStore.getState().setObjectProps(placedId!, {
      connector: 'WALL',
      direction: 'north',
      lit: false,
    })

    const state = useDungeonStore.getState()
    expect(updated).toBe(true)
    expect(state.placedObjects[placedId!]?.props).toEqual({
      connector: 'WALL',
      direction: 'north',
      lit: false,
    })
    expect(state.history.length).toBeGreaterThan(0)
  })

  it('moves a player to another painted floor cell without changing its id', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])
    const assetId = createTestGeneratedCharacter('Generated Mover')

    const placedId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId,
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
    const assetId = createTestGeneratedCharacter('Generated Occupant')

    const firstId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId,
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: { connector: 'FLOOR', direction: null },
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    const secondId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId,
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

  it('creates generated character assets that appear in the registry', () => {
    const assetId = useDungeonStore.getState().createGeneratedCharacter({
      storageId: 'storage-barbarian',
      name: 'Generated Barbarian',
      kind: 'player',
      prompt: 'A barbarian standee on white',
      model: 'x/z-image-turbo',
      size: 'M',
      originalImageUrl: TEST_IMAGE_DATA_URL,
      processedImageUrl: TEST_IMAGE_DATA_URL,
      thumbnailUrl: TEST_IMAGE_DATA_URL,
      width: 300,
      height: 600,
    })

    expect(assetId).toBeTruthy()
    expect(useDungeonStore.getState().generatedCharacters[assetId!]?.name).toBe('Generated Barbarian')
    expect(getContentPackAssetById(assetId!)).toMatchObject({
      id: assetId,
      category: 'player',
      name: 'Generated Barbarian',
    })
  })

  it('does not remove a generated character that is already placed', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const assetId = useDungeonStore.getState().createGeneratedCharacter({
      storageId: 'storage-wizard',
      name: 'Generated Wizard',
      kind: 'player',
      prompt: 'A wizard standee on white',
      model: 'x/z-image-turbo',
      size: 'M',
      originalImageUrl: TEST_IMAGE_DATA_URL,
      processedImageUrl: TEST_IMAGE_DATA_URL,
      thumbnailUrl: TEST_IMAGE_DATA_URL,
      width: 300,
      height: 600,
    })

    useDungeonStore.getState().placeObject({
      type: 'player',
      assetId,
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: { connector: 'FLOOR', direction: null },
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    expect(useDungeonStore.getState().removeGeneratedCharacter(assetId!)).toBe(false)
    expect(useDungeonStore.getState().generatedCharacters[assetId!]).toBeTruthy()
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

  it('applies and clears a floor tile variant override', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const applied = useDungeonStore.getState().setFloorTileAsset('0:0', 'kaykit.floor_tile_small_broken_a')

    expect(applied).toBe(true)
    expect(useDungeonStore.getState().floorTileAssetIds['0:0']).toBe('kaykit.floor_tile_small_broken_a')

    useDungeonStore.getState().eraseCells([[0, 0]])
    expect(useDungeonStore.getState().floorTileAssetIds['0:0']).toBeUndefined()
  })

  it('stores wall variant overrides on the canonical wall key', () => {
    useDungeonStore.getState().paintCells([[0, 0]])
    useDungeonStore.getState().paintCells([[1, 0]])

    const applied = useDungeonStore.getState().setWallSurfaceAsset('1:0:west', 'core.wall')

    expect(applied).toBe(true)
    expect(useDungeonStore.getState().wallSurfaceAssetIds['0:0:east']).toBe('core.wall')
    expect(useDungeonStore.getState().wallSurfaceAssetIds['1:0:west']).toBeUndefined()
  })

  it('creates an adjacent floor for KayKit stair assets using their paired metadata', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'kaykit.opening_stairs_up',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: { connector: 'FLOOR', direction: null },
      cell: [0, 0],
      cellKey: '0:0:floor',
    })

    const state = useDungeonStore.getState()
    const upperFloor = Object.values(state.floors).find((floor) => floor.level === 1)
    expect(upperFloor).toBeDefined()
    const staircase = upperFloor ? Object.values(upperFloor.snapshot.placedObjects)[0] : null
    expect(staircase?.assetId).toBe('kaykit.opening_stairs_down')
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

  it('toggles the projection debug mesh visibility flag', () => {
    expect(useDungeonStore.getState().showProjectionDebugMesh).toBe(false)

    useDungeonStore.getState().setShowProjectionDebugMesh(true)
    expect(useDungeonStore.getState().showProjectionDebugMesh).toBe(true)

    useDungeonStore.getState().setShowProjectionDebugMesh(false)
    expect(useDungeonStore.getState().showProjectionDebugMesh).toBe(false)
  })

  it('switches to top-down view when entering room mode', () => {
    useDungeonStore.getState().setTool('room')

    const state = useDungeonStore.getState()
    expect(state.tool).toBe('room')
    expect(state.cameraPreset).toBe('top-down')
    expect(state.activeCameraMode).toBe('top-down')
  })

  it('resizes a selected room footprint on the grid', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])
    const roomId = useDungeonStore.getState().paintedCells['0:0'].roomId

    expect(roomId).toBeTruthy()

    useDungeonStore.getState().selectRoom(roomId)
    const resized = useDungeonStore.getState().resizeRoom(roomId!, {
      minX: 0,
      maxX: 1,
      minZ: 0,
      maxZ: 1,
    })

    const state = useDungeonStore.getState()
    expect(resized).toBe(true)
    expect(state.selectedRoomId).toBe(roomId)
    expect(state.paintedCells['0:1']?.roomId).toBe(roomId)
    expect(state.paintedCells['1:1']?.roomId).toBe(roomId)
  })

  it('does not resize a room into another room', () => {
    useDungeonStore.getState().paintCells([[0, 0]])
    const firstRoomId = useDungeonStore.getState().paintedCells['0:0'].roomId
    useDungeonStore.getState().paintCells([[1, 0]])
    const secondRoomId = useDungeonStore.getState().paintedCells['1:0'].roomId

    const resized = useDungeonStore.getState().resizeRoom(firstRoomId!, {
      minX: 0,
      maxX: 1,
      minZ: 0,
      maxZ: 0,
    })

    expect(firstRoomId).toBeTruthy()
    expect(secondRoomId).toBeTruthy()
    expect(resized).toBe(false)
    expect(useDungeonStore.getState().paintedCells['1:0']?.roomId).toBe(secondRoomId)
  })

  it('keeps an opening on a resized room edge when the boundary still exists', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0]])
    const roomId = useDungeonStore.getState().paintedCells['0:0'].roomId
    const openingId = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: false,
    })

    const resized = useDungeonStore.getState().resizeRoom(roomId!, {
      minX: 0,
      maxX: 1,
      minZ: 0,
      maxZ: 1,
    })

    expect(resized).toBe(true)
    expect(useDungeonStore.getState().wallOpenings[openingId!]?.wallKey).toBe('0:1:north')
  })

  it('removes a wide opening when the resized wall is too short', () => {
    useDungeonStore.getState().paintCells([[0, 0], [1, 0], [2, 0]])
    const roomId = useDungeonStore.getState().paintedCells['0:0'].roomId
    const openingId = useDungeonStore.getState().placeOpening({
      assetId: 'core.opening_door_wall_3',
      wallKey: '1:0:north',
      width: 3,
      flipped: false,
    })

    const resized = useDungeonStore.getState().resizeRoom(roomId!, {
      minX: 0,
      maxX: 1,
      minZ: 0,
      maxZ: 0,
    })

    expect(resized).toBe(true)
    expect(useDungeonStore.getState().wallOpenings[openingId!]).toBeUndefined()
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

  it('places a free prop on a painted floor cell without consuming occupancy', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const propId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'kaykit.prop_candle_lit',
      position: [1.2, 0, 0.8],
      rotation: [0, Math.PI / 2, 0],
      props: {
        connector: 'FREE',
        direction: null,
      },
      cell: [0, 0],
      cellKey: '0:0',
      supportCellKey: '0:0',
    })

    const state = useDungeonStore.getState()
    expect(propId).toBeTruthy()
    expect(state.occupancy['0:0:floor']).toBeUndefined()
    expect(state.placedObjects[propId!]).toMatchObject({
      parentObjectId: null,
      supportCellKey: '0:0',
      position: [1.2, 0, 0.8],
      rotation: [0, Math.PI / 2, 0],
    })
  })

  it('keeps child free props attached to their parent transform', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const parentId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'kaykit.prop_box_large',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: {
        connector: 'FLOOR',
        direction: null,
      },
      cell: [0, 0],
      cellKey: '0:0:floor',
      supportCellKey: '0:0',
    })

    const childId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'kaykit.prop_candle_lit',
      position: [1.5, 1, 1],
      rotation: [0, 0, 0],
      props: {
        connector: 'FREE',
        direction: null,
      },
      cell: [0, 0],
      cellKey: '0:0',
      parentObjectId: parentId,
      localPosition: [0.5, 1, 0],
      localRotation: [0, 0, 0],
      supportCellKey: '0:0',
    })

    useDungeonStore.getState().selectObject(parentId)
    useDungeonStore.getState().rotateSelection()

    const state = useDungeonStore.getState()
    expect(state.placedObjects[childId!]).toMatchObject({
      parentObjectId: parentId,
      localPosition: [0.5, 1, 0],
    })
    expect(state.placedObjects[childId!]?.position[0]).toBeCloseTo(1)
    expect(state.placedObjects[childId!]?.position[1]).toBeCloseTo(1)
    expect(state.placedObjects[childId!]?.position[2]).toBeCloseTo(0.5)
    expect(state.placedObjects[childId!]?.rotation[0]).toBeCloseTo(0)
    expect(state.placedObjects[childId!]?.rotation[1]).toBeCloseTo(Math.PI / 2)
    expect(state.placedObjects[childId!]?.rotation[2]).toBeCloseTo(0)
  })

  it('cascades child free props when their ancestor support is removed', () => {
    useDungeonStore.getState().paintCells([[0, 0]])

    const parentId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'kaykit.prop_box_large',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: {
        connector: 'FREE',
        direction: null,
      },
      cell: [0, 0],
      cellKey: '0:0',
      supportCellKey: '0:0',
    })

    const childId = useDungeonStore.getState().placeObject({
      type: 'prop',
      assetId: 'kaykit.prop_candle_lit',
      position: [1, 1, 1],
      rotation: [0, 0, 0],
      props: {
        connector: 'FREE',
        direction: null,
      },
      cell: [0, 0],
      cellKey: '0:0',
      parentObjectId: parentId,
      localPosition: [0, 1, 0],
      localRotation: [0, 0, 0],
      supportCellKey: '0:0',
    })

    useDungeonStore.getState().eraseCells([[0, 0]])

    const state = useDungeonStore.getState()
    expect(state.placedObjects[parentId!]).toBeUndefined()
    expect(state.placedObjects[childId!]).toBeUndefined()
  })

  it('rotates a selected floor object by 90 degrees', () => {
    const assetId = createTestGeneratedCharacter('Generated Rotator')
    const placedId = useDungeonStore.getState().placeObject({
      type: 'player',
      assetId,
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

  it('places an open passage without an asset mesh', () => {
    const id = useDungeonStore.getState().placeOpening({
      assetId: null,
      wallKey: '0:0:north',
      width: 2,
      flipped: false,
    })

    expect(useDungeonStore.getState().wallOpenings[id!]).toMatchObject({
      assetId: null,
      wallKey: '0:0:north',
      width: 2,
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

  it('updates wall connection tool settings', () => {
    useDungeonStore.getState().setWallConnectionMode('open')
    useDungeonStore.getState().setWallConnectionWidth(3)

    const state = useDungeonStore.getState()
    expect(state.wallConnectionMode).toBe('open')
    expect(state.wallConnectionWidth).toBe(3)
  })

  it('places open passages in a single history step', () => {
    useDungeonStore.getState().placeOpenPassages(['0:0:north', '1:0:north'])

    let state = useDungeonStore.getState()
    expect(Object.values(state.wallOpenings)).toHaveLength(2)
    expect(Object.values(state.wallOpenings).every((opening) => opening.assetId === null)).toBe(true)

    state.undo()
    state = useDungeonStore.getState()
    expect(Object.keys(state.wallOpenings)).toHaveLength(0)

    state.redo()
    state = useDungeonStore.getState()
    expect(Object.values(state.wallOpenings)).toHaveLength(2)
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
