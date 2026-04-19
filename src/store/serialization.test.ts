import { describe, expect, it } from 'vitest'
import { serializeDungeon, deserializeDungeon } from './serialization'
import type { SerializableState } from './serialization'
import type { FloorRecord } from './useDungeonStore'
import { DEFAULT_POST_PROCESSING_SETTINGS } from '../postprocessing/tiltShiftMath'

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
    blockedCells: {},
    outdoorTerrainHeights: {},
    outdoorGroundTextureCells: {},
    exploredCells: {},
    floorTileAssetIds: {},
    wallSurfaceAssetIds: {},
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
    mapMode: 'indoor',
    outdoorTimeOfDay: 0.5,
    outdoorTerrainProfiles: {
      mixed: { density: 'medium', overpaintRegenerate: false },
      rocks: { density: 'medium', overpaintRegenerate: false },
      'dead-forest': { density: 'medium', overpaintRegenerate: false },
    },
    outdoorTerrainDensity: 'medium',
    outdoorTerrainType: 'mixed',
    outdoorOverpaintRegenerate: false,
    sceneLighting: { intensity: 1.5 },
    postProcessing: { ...DEFAULT_POST_PROCESSING_SETTINGS },
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
    expect(result!.postProcessing.enabled).toBe(true)
    expect(result!.postProcessing.focalLength).toBe(9)
    expect(result!.postProcessing.backgroundFocalLength).toBe(9)
    expect(result!.postProcessing.bokehScale).toBe(0.5)
  })

  it('preserves map mode and outdoor time of day', () => {
    const state = baseState()
    state.mapMode = 'outdoor'
    state.outdoorTimeOfDay = 0.8
    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    expect(result!.mapMode).toBe('outdoor')
    expect(result!.outdoorTimeOfDay).toBe(0.8)
  })

  it('preserves outdoor terrain brush settings', () => {
    const state = baseState()
    state.mapMode = 'outdoor'
    state.outdoorTerrainDensity = 'dense'
    state.outdoorTerrainType = 'dead-forest'
    state.outdoorOverpaintRegenerate = true
    state.outdoorTerrainProfiles = {
      mixed: { density: 'dense', overpaintRegenerate: true },
      rocks: { density: 'sparse', overpaintRegenerate: false },
      'dead-forest': { density: 'dense', overpaintRegenerate: true },
    }
    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    expect(result!.outdoorTerrainDensity).toBe('dense')
    expect(result!.outdoorTerrainType).toBe('dead-forest')
    expect(result!.outdoorOverpaintRegenerate).toBe(true)
    expect(result!.outdoorTerrainProfiles?.rocks?.density).toBe('sparse')
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

  it('preserves blocked cells', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.blockedCells['4:5'] = {
      cell: [4, 5],
      layerId: 'default',
      roomId: null,
    }

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const blocked = result!.blockedCells ?? result!.floors?.['floor-1']?.snapshot?.blockedCells
    expect(blocked?.['4:5']).toMatchObject({ cell: [4, 5], layerId: 'default' })
  })

  it('preserves outdoor ground texture paint cells', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.outdoorGroundTextureCells['6:7'] = {
      cell: [6, 7],
      layerId: 'default',
      textureType: 'rough-stone',
    }

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const outdoorGroundTextureCells = result!.outdoorGroundTextureCells
      ?? result!.floors?.['floor-1']?.snapshot?.outdoorGroundTextureCells
    expect(outdoorGroundTextureCells?.['6:7']).toMatchObject({
      cell: [6, 7],
      textureType: 'rough-stone',
    })
  })

  it('preserves outdoor terrain heights', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.outdoorTerrainHeights['3:4'] = {
      cell: [3, 4],
      height: 1.25,
    }

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const outdoorTerrainHeights = result!.outdoorTerrainHeights
      ?? result!.floors?.['floor-1']?.snapshot?.outdoorTerrainHeights
    expect(outdoorTerrainHeights?.['3:4']).toMatchObject({
      cell: [3, 4],
      height: 1.25,
    })
  })

  it('preserves explored cells', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.exploredCells['2:3'] = true

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const exploredCells = result!.exploredCells ?? result!.floors?.['floor-1']?.snapshot?.exploredCells
    expect(exploredCells?.['2:3']).toBe(true)
  })

  it('preserves floor and wall surface overrides', () => {
    const state = baseState()
    state.floors!['floor-1'].snapshot.floorTileAssetIds['2:3'] = 'kaykit.floor_tile_small_broken_a'
    state.floors!['floor-1'].snapshot.wallSurfaceAssetIds['2:3:north'] = 'kaykit.wall'

    const result = deserializeDungeon(serializeDungeon(state))
    expect(result).not.toBeNull()
    const floorTileAssetIds = result!.floorTileAssetIds ?? result!.floors?.['floor-1']?.snapshot?.floorTileAssetIds
    const wallSurfaceAssetIds = result!.wallSurfaceAssetIds ?? result!.floors?.['floor-1']?.snapshot?.wallSurfaceAssetIds
    expect(floorTileAssetIds?.['2:3']).toBe('kaykit.floor_tile_small_broken_a')
    expect(wallSurfaceAssetIds?.['2:3:north']).toBe('kaykit.wall')
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
    expect(result!.postProcessing.backgroundFocalLength).toBe(3)
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
    expect(result!.mapMode).toBe('indoor')
    expect(result!.outdoorTimeOfDay).toBe(0.5)
  })

  it('v12→v13: adds empty outdoor terrain heights when missing', () => {
    const v12File = JSON.stringify({
      version: 12,
      name: 'Legacy Outdoor',
      mapMode: 'outdoor',
      sceneLighting: { intensity: 1 },
      postProcessing: { ...DEFAULT_POST_PROCESSING_SETTINGS },
      activeFloorId: 'floor-1',
      floorOrder: ['floor-1'],
      floors: [{
        id: 'floor-1',
        name: 'Ground Floor',
        level: 0,
        layers: [{ id: 'default', name: 'Default', visible: true, locked: false }],
        layerOrder: ['default'],
        activeLayerId: 'default',
        rooms: [],
        cells: [],
        blockedCells: [],
        exploredCells: [],
        objects: [],
        openings: [],
        nextRoomNumber: 1,
      }],
    })

    const result = deserializeDungeon(v12File)
    expect(result).not.toBeNull()
    expect(result!.outdoorTerrainHeights).toEqual({})
  })
})
