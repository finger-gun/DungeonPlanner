import { beforeEach, describe, expect, it } from 'vitest'
import { getFloorChunkKeysForCells } from '../../store/floorChunkKeys'
import {
  clearBakedFloorLightFieldCache,
  getOrBuildBakedFloorLightField,
  type BakedFloorLightFieldBuildInput,
  type ResolvedDungeonLightSource,
} from '../dungeonLightField'
import {
  FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT,
  getFloorLightComputePrototypeTransferables,
  prepareFloorLightComputePrototype,
  type FloorLightComputePrototypePackedJob,
} from './FloorLightComputePrototype'

// Local test helpers — not part of the public API
function createTestDirtyHint(cells: [number, number][]): NonNullable<BakedFloorLightFieldBuildInput['dirtyHint']> {
  const dirtyCellKeys = cells.map(([x, z]) => `${x}:${z}`)
  const dirtyChunkKeys = getFloorChunkKeysForCells(dirtyCellKeys)
  const xs = cells.map(([x]) => x)
  const zs = cells.map(([, z]) => z)
  return {
    sequence: 1,
    dirtyCellRect: cells.length === 0 ? null : {
      minCellX: Math.min(...xs),
      maxCellX: Math.max(...xs),
      minCellZ: Math.min(...zs),
      maxCellZ: Math.max(...zs),
    },
    dirtyCellKeys,
    dirtyChunkKeys,
    dirtyLightChunkKeys: dirtyChunkKeys,
    dirtyWallKeys: [],
    affectedObjectIds: [],
    fullRefresh: false,
  }
}

function isLightIncludedInPacked(lightKey: string, packed: FloorLightComputePrototypePackedJob) {
  return packed.lightKeys.includes(lightKey)
}

function getLightBufferOffset(packed: FloorLightComputePrototypePackedJob, lightKey: string) {
  const idx = packed.lightKeys.indexOf(lightKey)
  return idx === -1 ? -1 : idx * FLOOR_LIGHT_COMPUTE_LIGHT_VECTORS_PER_LIGHT * 4
}

describe('FloorLightComputePrototype', () => {
  beforeEach(() => {
    clearBakedFloorLightFieldCache()
  })

  it('packs dirty chunks and bounded light slices into GPU-friendly arrays', () => {
    const baseInput = {
      floorId: 'floor-light-prototype',
      chunkSize: 4,
      floorCells: [[0, 0], [1, 0], [4, 0], [5, 0], [8, 0], [9, 0]] as [number, number][],
      staticLightSources: [
        createResolvedLightSource('left', [1, 1.5, 1], { distance: 2 }),
        createResolvedLightSource('middle', [11, 1.5, 1], { distance: 2 }),
        createResolvedLightSource('right', [19, 1.5, 1], { distance: 2, flicker: true }),
        createResolvedLightSource('far', [33, 1.5, 1], { distance: 2 }),
      ],
    }

    getOrBuildBakedFloorLightField(baseInput)

    const prototype = prepareFloorLightComputePrototype(
      {
        ...baseInput,
        dirtyHint: createTestDirtyHint([[5, 0]]),
      },
      {
        workgroupSize: 4,
      },
    )

    expect(prototype).not.toBeNull()
    expect(prototype?.packed.requestedDirtyRegion).toEqual({
      minCellX: 5,
      maxCellX: 5,
      minCellZ: 0,
      maxCellZ: 0,
    })
    expect(prototype?.packed.dispatchDirtyRegion).toEqual({
      minCellX: 0,
      maxCellX: 9,
      minCellZ: 0,
      maxCellZ: 0,
    })
    expect(prototype?.packed.dirtyChunkKeys).toEqual(['0:0', '1:0', '2:0'])
    expect(prototype?.packed.cellKeys).toEqual(['0:0', '1:0', '4:0', '5:0', '8:0', '9:0'])
    expect(prototype?.packed.lightKeys).toEqual(['left', 'middle', 'right'])
    expect(prototype?.packed.flickerLightKeys).toEqual(['right'])
    expect([...prototype!.packed.buffers.cellData.data]).toEqual([
      0, 0, 0, 0,
      1, 0, 0, 0,
      4, 0, 1, 0,
      5, 0, 1, 0,
      8, 0, 2, 0,
      9, 0, 2, 0,
    ])
    expect([...prototype!.packed.buffers.configData.data]).toEqual([
      0, 0, 10, 1,
      6, 3, 0, 0,
      4, 0, 1, 3,
    ])
    expect(prototype?.dispatch.entryPoint).toBe('one-cell-per-invocation')
    expect(prototype?.dispatch.invocationCount).toBe(6)
    expect(prototype?.dispatch.workgroupCount).toEqual([2, 1, 1])
    expect(prototype?.dispatch.computeNode).toBeTruthy()
    expect(getFloorLightComputePrototypeTransferables(prototype!.packed)).toHaveLength(5)
  })

  it('caps the light slice without changing the dirty cell region', () => {
    const baseInput = {
      floorId: 'floor-light-prototype-cap',
      chunkSize: 4,
      floorCells: [[0, 0], [1, 0], [4, 0], [5, 0], [8, 0], [9, 0]] as [number, number][],
      staticLightSources: [
        createResolvedLightSource('alpha', [1, 1.5, 1], { distance: 2 }),
        createResolvedLightSource('beta', [11, 1.5, 1], { distance: 2 }),
        createResolvedLightSource('gamma', [19, 1.5, 1], { distance: 2 }),
      ],
    }

    getOrBuildBakedFloorLightField(baseInput)

    const prototype = prepareFloorLightComputePrototype(
      {
        ...baseInput,
        dirtyHint: createTestDirtyHint([[5, 0]]),
      },
      {
        maxLightsPerDispatch: 2,
        workgroupSize: 8,
      },
    )

    expect(prototype).not.toBeNull()
    expect(prototype?.packed.dispatchDirtyRegion).toEqual({
      minCellX: 0,
      maxCellX: 9,
      minCellZ: 0,
      maxCellZ: 0,
    })
    expect(prototype?.packed.lightKeys).toEqual(['alpha', 'beta'])
    expect(prototype?.packed.lightCount).toBe(2)
    expect(prototype?.packed.truncatedLightCount).toBe(1)
    expect(isLightIncludedInPacked('beta', prototype!.packed)).toBe(true)
    expect(isLightIncludedInPacked('gamma', prototype!.packed)).toBe(false)
    expect(getLightBufferOffset(prototype!.packed, 'alpha')).toBe(0)
    expect(getLightBufferOffset(prototype!.packed, 'beta')).toBe(12)
    expect(getLightBufferOffset(prototype!.packed, 'gamma')).toBe(-1)
  })

  it('returns null when there is no lit work to prototype', () => {
    const prototype = prepareFloorLightComputePrototype({
      floorId: 'floor-light-prototype-empty',
      chunkSize: 4,
      floorCells: [[0, 0]],
      staticLightSources: [],
    })

    expect(prototype).toBeNull()
  })
})

function createResolvedLightSource(
  id: string,
  position: [number, number, number],
  overrides: Partial<ResolvedDungeonLightSource['light']> = {},
): ResolvedDungeonLightSource {
  return {
    key: id,
    object: {
      id,
      type: 'prop',
      assetId: 'dungeon.props_torch',
      position,
      rotation: [0, 0, 0],
      props: {},
      cell: [0, 0],
      cellKey: '0:0:floor',
      layerId: 'default',
    },
    light: {
      color: '#ff9944',
      intensity: overrides.intensity ?? 1.5,
      distance: overrides.distance ?? 8,
      decay: overrides.decay ?? 2,
      flicker: overrides.flicker,
    },
    position,
    linearColor: [1, 0.5583403896342679, 0.05780543019106723],
  }
}
