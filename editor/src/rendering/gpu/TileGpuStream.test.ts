import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import type { ResolvedStaticTileEntry } from '../../components/canvas/batchDescriptors'
import { applyBakedLightToMaterial } from '../../components/canvas/bakedLightMaterial'
import type { ResolvedTileStreamGroup } from './TileGpuStream'
import { TileGpuStream } from './TileGpuStream'

vi.mock('../../components/canvas/bakedLightMaterial', async () => {
  const actual = await vi.importActual<typeof import('../../components/canvas/bakedLightMaterial')>(
    '../../components/canvas/bakedLightMaterial',
  )

  return {
    ...actual,
    applyBakedLightToMaterial: vi.fn(),
  }
})

function createSourceScene() {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff' })
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
  const scene = new THREE.Group()
  scene.add(mesh)
  return scene
}

function createEntry(index: number, overrides: Partial<ResolvedStaticTileEntry> = {}): ResolvedStaticTileEntry {
  return {
    key: `floor:${index}:0`,
    assetId: 'floor-tile',
    assetUrl: '/assets/floor.glb',
    transformKey: 'default',
    receiveShadow: true,
    position: [index, 0, 0],
    rotation: [0, 0, 0],
    variant: 'floor',
    variantKey: `${index}:0`,
    visibility: 'visible',
    fogCell: [index, 0],
    ...overrides,
  }
}

function createGroup(entries: ResolvedStaticTileEntry[], overrides: Partial<ResolvedTileStreamGroup> = {}): ResolvedTileStreamGroup {
  return {
    floorId: 'floor-1',
    bucketKey: 'floor-1|0:0|/assets/floor.glb|default|floor|visible|shadow|unlit|single-direction|steady',
    chunkKey: '0:0',
    entries,
    assetUrl: '/assets/floor.glb',
    usesGpuFog: false,
    geometrySignature: entries.map((entry) => [
      entry.key,
      entry.position.join(','),
      entry.rotation.join(','),
      entry.buildAnimationStart ?? '',
      entry.buildAnimationDelay ?? '',
    ].join('|')).join(';'),
    renderSignature: entries.map((entry) => `${entry.key}:${entry.visibility}`).join(';'),
    variant: 'floor',
    visibility: 'visible',
    receiveShadow: true,
    useBuildAnimation: entries.some((entry) => entry.buildAnimationStart !== undefined),
    useBakedLight: false,
    useBakedFlicker: false,
    useSecondaryDirectionAttribute: false,
    shouldRenderBase: true,
    useLineOfSightPostMask: false,
    sourceScene: createSourceScene(),
    fogRuntime: null,
    ...overrides,
  }
}

describe('TileGpuStream', () => {
  it('creates a second page when more than 64 instances share a page group', () => {
    const stream = new TileGpuStream({ invalidate: vi.fn() })
    const entries = Array.from({ length: 65 }, (_, index) => createEntry(index))

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [createGroup(entries)],
    })

    expect(stream.getDebugSnapshot('mount-1').pageCount).toBe(2)
  })

  it('uploads only dirty update ranges instead of full page buffers', () => {
    const stream = new TileGpuStream({ invalidate: vi.fn() })

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [createGroup([createEntry(0, { buildAnimationStart: 1000, buildAnimationDelay: 50 })])],
    })
    stream.processTileUploadBudget({ maxMs: 5, maxPages: 2 })

    const mountGroup = stream.getMountGroup('mount-1')
    const pageRoot = mountGroup.children[0] as THREE.Group
    const instancedMesh = pageRoot.children[0] as THREE.InstancedMesh
    expect(instancedMesh.instanceMatrix.updateRanges.length).toBeGreaterThan(0)
    expect(instancedMesh.instanceMatrix.updateRanges[0]?.count).toBeLessThan(instancedMesh.instanceMatrix.array.length)

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [createGroup([createEntry(0, {
        buildAnimationStart: 1000,
        buildAnimationDelay: 50,
        position: [4, 0, 0],
      })])],
    })
    stream.processTileUploadBudget({ maxMs: 5, maxPages: 2 })

    expect(instancedMesh.instanceMatrix.updateRanges[0]?.count).toBe(16)
  })

  it('keeps streamed page material configuration stable when build animation entries appear', () => {
    const stream = new TileGpuStream({ invalidate: vi.fn() })
    const applyBakedLightMock = vi.mocked(applyBakedLightToMaterial)
    applyBakedLightMock.mockClear()

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [createGroup([createEntry(0)])],
    })

    const mountGroup = stream.getMountGroup('mount-1')
    const pageRoot = mountGroup.children[0] as THREE.Group
    const instancedMesh = pageRoot.children[0] as THREE.InstancedMesh
    const initialMaterial = instancedMesh.material
    const initialDepthMaterial = instancedMesh.customDepthMaterial
    const configureCalls = applyBakedLightMock.mock.calls.length

    expect(instancedMesh.castShadow).toBe(true)
    expect(initialDepthMaterial).toBeTruthy()

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [createGroup([
        createEntry(0, {
          buildAnimationStart: 1000,
          buildAnimationDelay: 25,
        }),
      ], {
        useBuildAnimation: true,
      })],
    })

    const updatedPageRoot = mountGroup.children[0] as THREE.Group
    const updatedInstancedMesh = updatedPageRoot.children[0] as THREE.InstancedMesh

    expect(updatedInstancedMesh.material).toBe(initialMaterial)
    expect(updatedInstancedMesh.customDepthMaterial).toBe(initialDepthMaterial)
    expect(updatedInstancedMesh.castShadow).toBe(true)
    expect(applyBakedLightMock).toHaveBeenCalledTimes(configureCalls)
  })

  it('tracks committed transaction progress and disposes pages after source removal', () => {
    const stream = new TileGpuStream({ invalidate: vi.fn() })
    stream.beginTileStreamTransaction('tx-1', 'floor-1')
    stream.updateTileStreamPreview('tx-1', [[0, 0]], 'paint', {
      mountId: 'mount-1',
      assetId: 'floor-tile',
    })
    stream.commitTileStreamTransaction('tx-1', 1000)

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [createGroup([
        createEntry(0, {
          buildAnimationStart: 1000,
          buildAnimationDelay: 25,
        }),
      ])],
    })

    expect(stream.getTransactionProgress('tx-1')).toEqual({
      totalPages: 1,
      readyPages: 0,
      pendingPages: 1,
    })

    stream.processTileUploadBudget({ maxMs: 5, maxPages: 2 })
    expect(stream.getTransactionProgress('tx-1')).toEqual({
      totalPages: 1,
      readyPages: 1,
      pendingPages: 0,
    })

    stream.clearSourceRegistration('mount-1', 'static-floor')
    expect(stream.getDebugSnapshot('mount-1').pageCount).toBe(0)

    stream.cancelTileStreamTransaction('tx-1')
    expect(stream.getTransactionProgress('tx-1')).toBeNull()
  })

  it('streams transaction pages offscreen and adopts them when static entries commit', () => {
    const stream = new TileGpuStream({ invalidate: vi.fn() })
    const transactionEntry = createEntry(0, {
      buildAnimationStart: 1000,
      buildAnimationDelay: 25,
    })
    const transactionGroup = createGroup([transactionEntry], {
      useBuildAnimation: true,
    })

    stream.beginTileStreamTransaction('tx-1', 'floor-1', 1000)
    stream.updateTileStreamPreview('tx-1', [[0, 0]], 'paint', {
      mountId: 'mount-1',
      assetId: 'floor-tile',
    })
    stream.setSourceRegistration('mount-1', 'transaction:tx-1', {
      kind: 'transaction',
      floorId: 'floor-1',
      transactionId: 'tx-1',
      groups: [transactionGroup],
    })

    const previewSnapshot = stream.getDebugSnapshot('mount-1')
    expect(previewSnapshot.pageCount).toBe(1)
    const mountGroup = stream.getMountGroup('mount-1')
    expect(mountGroup.children[0]?.position.y).toBeLessThan(-1000)

    stream.processTileUploadBudget({ maxMs: 5, maxPages: 2 })
    stream.commitTileStreamTransaction('tx-1', 1000)
    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [transactionGroup],
    })

    expect(stream.getDebugSnapshot('mount-1').pageCount).toBe(1)
    expect(mountGroup.children[0]?.position.y).toBe(0)
    expect(stream.getTransactionProgress('tx-1')).toEqual({
      totalPages: 1,
      readyPages: 0,
      pendingPages: 1,
    })

    stream.processTileUploadBudget({ maxMs: 5, maxPages: 2 })
    expect(stream.getTransactionProgress('tx-1')).toEqual({
      totalPages: 1,
      readyPages: 1,
      pendingPages: 0,
    })
  })

  it('skips mount rebuilds when a source registration is unchanged', () => {
    const invalidate = vi.fn()
    const stream = new TileGpuStream({ invalidate })
    const registration = {
      kind: 'static' as const,
      floorId: 'floor-1',
      groups: [createGroup([createEntry(0)])],
    }

    stream.setSourceRegistration('mount-1', 'static-floor', registration)
    const versionAfterFirstRegistration = stream.getVersion()
    invalidate.mockClear()

    stream.setSourceRegistration('mount-1', 'static-floor', registration)

    expect(stream.getVersion()).toBe(versionAfterFirstRegistration)
    expect(invalidate).not.toHaveBeenCalled()
    expect(stream.getDebugSnapshot('mount-1').pageCount).toBe(1)
  })

  it('keeps untouched chunk pages mounted and upload-clean when another chunk changes', () => {
    const stream = new TileGpuStream({ invalidate: vi.fn() })
    const chunk0Group = createGroup([createEntry(0)])
    const chunk1Group = createGroup([createEntry(9)], {
      bucketKey: 'floor-1|1:0|/assets/floor.glb|default|floor|visible|shadow|unlit|single-direction|steady',
      chunkKey: '1:0',
    })

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [chunk0Group, chunk1Group],
    })
    stream.processTileUploadBudget({ maxMs: 5, maxPages: 4 })

    const mountGroup = stream.getMountGroup('mount-1')
    const initialSnapshot = stream.getDebugSnapshot('mount-1')
    const untouchedPageKey = initialSnapshot.pages.find((page) => page.keys.includes('floor:9:0'))?.pageKey
    const untouchedPageRoot = mountGroup.children.find((child) => child.name === untouchedPageKey)

    expect(untouchedPageKey).toBeTruthy()
    expect(untouchedPageRoot).toBeTruthy()

    stream.setSourceRegistration('mount-1', 'static-floor', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [
        createGroup([createEntry(0, { position: [4, 0, 0] })]),
        createGroup([createEntry(9)], {
          bucketKey: 'floor-1|1:0|/assets/floor.glb|default|floor|visible|shadow|unlit|single-direction|steady',
          chunkKey: '1:0',
        }),
      ],
    })

    const updatedSnapshot = stream.getDebugSnapshot('mount-1')
    const updatedUntouchedPage = updatedSnapshot.pages.find((page) => page.keys.includes('floor:9:0'))
    const changedPage = updatedSnapshot.pages.find((page) => page.keys.includes('floor:0:0'))
    const updatedUntouchedPageRoot = mountGroup.children.find((child) => child.name === untouchedPageKey)

    expect(updatedUntouchedPage?.dirtyRanges).toEqual([])
    expect(updatedUntouchedPage?.status).toBe('ready')
    expect(changedPage?.dirtyRanges.length).toBeGreaterThan(0)
    expect(updatedUntouchedPageRoot).toBe(untouchedPageRoot)
  })

  it('keeps wall pillars unlit when no baked light field is supplied', () => {
    const stream = new TileGpuStream({ invalidate: vi.fn() })
    const applyBakedLightMock = vi.mocked(applyBakedLightToMaterial)
    applyBakedLightMock.mockClear()

    stream.setSourceRegistration('mount-1', 'static-wall-pillar', {
      kind: 'static',
      floorId: 'floor-1',
      groups: [createGroup([
        createEntry(0, {
          key: 'corner:0:0',
          assetId: 'dungeon.props_pillars_pillar',
          assetUrl: '/assets/pillar.glb',
          variant: 'wall',
          variantKey: '0:0:corner',
        }),
      ], {
        bucketKey: 'floor-1|0:0|/assets/pillar.glb|default|wall|visible|shadow|unlit|single-direction|steady',
        variant: 'wall',
        useBakedLight: false,
      })],
    })

    const bakedLightCall = applyBakedLightMock.mock.calls.find(([, options]) => options !== undefined)
    expect(bakedLightCall?.[1]).toBeNull()
  })
})
