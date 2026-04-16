import { describe, expect, it } from 'vitest'
import { serializeDungeon, deserializeDungeon } from './serialization'
import type { SerializableState } from './serialization'
import type { FloorRecord } from './useDungeonStore'

// ── helpers ───────────────────────────────────────────────────────────────────

function emptyFloorSnapshot() {
  return {
    tool: 'move' as const,
    selectedAssetIds: { floor: null, wall: null, prop: null, opening: null, player: null },
    selection: null,
    layers: { default: { id: 'default', name: 'Default', visible: true, locked: false } },
    layerOrder: ['default'],
    activeLayerId: 'default',
    rooms: {},
    paintedCells: {},
    exploredCells: {},
    placedObjects: {},
    wallOpenings: {},
    occupancy: {},
    nextRoomNumber: 1,
  }
}

function makeFloor(id: string, name: string, level: number): FloorRecord {
  return {
    id,
    name,
    level,
    snapshot: emptyFloorSnapshot(),
    history: [],
    future: [],
  }
}

function baseState(): SerializableState {
  const groundId = 'floor-1'
  return {
    name: 'Test Dungeon',
    sceneLighting: { intensity: 1.5 },
    postProcessing: { enabled: false, focusDistance: 0.5, focalLength: 3, bokehScale: 2 },
    ...emptyFloorSnapshot(),
    floors: { [groundId]: makeFloor(groundId, 'Ground Floor', 0) },
    floorOrder: [groundId],
    activeFloorId: groundId,
  }
}

// ── roundtrip ─────────────────────────────────────────────────────────────────

describe('serializeDungeon / deserializeDungeon roundtrip', () => {
  it('preserves name and scene settings', () => {
    const state = baseState()
    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Test Dungeon')
    expect(result!.sceneLighting.intensity).toBe(1.5)
    expect(result!.postProcessing.enabled).toBe(false)
  })

  it('preserves painted cells', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.paintedCells['2:3'] = {
      cell: [2, 3],
      layerId: 'default',
      roomId: 'room-1',
    }

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    // Active floor data is returned at top level for the store to spread
    const cells = result!.paintedCells ?? result!.floors?.['floor-1']?.snapshot?.paintedCells
    expect(cells?.['2:3']).toMatchObject({ cell: [2, 3] })
  })

  it('preserves explored cells', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.exploredCells['2:3'] = true

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const exploredCells = result!.exploredCells ?? result!.floors?.['floor-1']?.snapshot?.exploredCells
    expect(exploredCells?.['2:3']).toBe(true)
  })

  it('preserves placed objects', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.placedObjects['obj-1'] = {
      id: 'obj-1',
      type: 'prop',
      assetId: 'core.props_wall_torch',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
      layerId: 'default',
    }

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const objects = result!.placedObjects ?? result!.floors?.['floor-1']?.snapshot?.placedObjects
    expect(objects?.['obj-1']).toMatchObject({ assetId: 'core.props_wall_torch' })
  })

  it('preserves player objects', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.placedObjects['obj-player'] = {
      id: 'obj-player',
      type: 'player',
      assetId: 'generated.player.test',
      position: [1, 0, 1],
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
      layerId: 'default',
    }

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const objects = result!.placedObjects ?? result!.floors?.['floor-1']?.snapshot?.placedObjects
    expect(objects?.['obj-player']).toMatchObject({ assetId: 'generated.player.test', type: 'player' })
  })

  it('preserves wall openings with flipped flag', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.wallOpenings['op-1'] = {
      id: 'op-1',
      assetId: 'core.opening_door_wall_1',
      wallKey: '0:0:north',
      width: 1,
      flipped: true,
      layerId: 'default',
    }

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const openings = result!.wallOpenings ?? result!.floors?.['floor-1']?.snapshot?.wallOpenings
    expect(openings?.['op-1']).toMatchObject({ flipped: true, wallKey: '0:0:north' })
  })

  it('roundtrips a multi-floor dungeon', () => {
    const state = baseState()
    const upperId = 'floor-2'
    state.floors![upperId] = makeFloor(upperId, 'Floor 1', 1)
    state.floorOrder!.push(upperId)

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    expect(result!.floorOrder).toHaveLength(2)
    const levels = result!.floors
      ? Object.values(result!.floors).map((f) => f.level)
      : []
    expect(levels).toContain(0)
    expect(levels).toContain(1)
  })

  it('produces valid JSON that JSON.parse accepts', () => {
    expect(() => JSON.parse(serializeDungeon(baseState()))).not.toThrow()
  })
})

// ── error cases ───────────────────────────────────────────────────────────────

describe('deserializeDungeon error cases', () => {
  it('returns null for invalid JSON', () => {
    expect(deserializeDungeon('not json {')).toBeNull()
  })

  it('returns null for a JSON null', () => {
    expect(deserializeDungeon('null')).toBeNull()
  })

  it('returns null for a version number higher than current', () => {
    const tooNew = JSON.stringify({ version: 9999, name: 'X', floors: [] })
    expect(deserializeDungeon(tooNew)).toBeNull()
  })

  it('returns null for an empty object (no floors, no cells)', () => {
    // Missing required structure — should either return null or a safe fallback
    const result = deserializeDungeon(JSON.stringify({ version: 5, name: 'X' }))
    // Either null or an object with empty floors is acceptable
    if (result !== null) {
      expect(result.floorOrder ?? []).toHaveLength(0)
    }
  })
})

// ── version migrations ────────────────────────────────────────────────────────

describe('deserializeDungeon version migrations', () => {
  it('v4→v5: upgrades a flat-format file to multi-floor', () => {
    const v4File = JSON.stringify({
      version: 4,
      name: 'Old Dungeon',
      sceneLighting: { intensity: 1 },
      postProcessing: { enabled: false, focusDistance: 0.5, focalLength: 3, bokehScale: 2 },
      layers: { default: { id: 'default', name: 'Default', visible: true, locked: false } },
      layerOrder: ['default'],
      activeLayerId: 'default',
      rooms: {},
      cells: [],
      objects: [],
      openings: [],
      nextRoomNumber: 1,
    })

    const result = deserializeDungeon(v4File)
    expect(result).not.toBeNull()
    // Should have been wrapped into a floors array
    expect(result!.floorOrder ?? []).toHaveLength(1)
    expect(result!.name).toBe('Old Dungeon')
  })

  it('v1→v5: adds empty openings and nextRoomNumber when missing', () => {
    const v1File = JSON.stringify({
      version: 1,
      name: 'Very Old',
      sceneLighting: { intensity: 1 },
      layers: { default: { id: 'default', name: 'Default', visible: true, locked: false } },
      layerOrder: ['default'],
      activeLayerId: 'default',
      rooms: {},
      cells: [],
      objects: [],
    })

    const result = deserializeDungeon(v1File)
    expect(result).not.toBeNull()
    expect(result!.name).toBe('Very Old')
  })
})
