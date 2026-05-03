import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import type { ResolvedStaticTileEntry } from '../../components/canvas/batchDescriptors'
import type { ResolvedTileStreamGroup } from './TileGpuStream'
import { TileGpuStream } from './TileGpuStream'

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
    geometrySignature: entries.map((entry) => entry.key).join(';'),
    renderSignature: entries.map((entry) => `${entry.key}:${entry.buildAnimationStart === undefined ? 'static' : 'animated'}`).join(';'),
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
})
