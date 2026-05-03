import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { BatchedTileEntries, type StaticTileEntry } from './BatchedTileEntries'
import * as instancedTileMesh from './instancedTileMesh'

vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
  useThree: (selector: (state: { invalidate: () => void }) => unknown) =>
    selector({ invalidate: vi.fn() }),
}))

const material = new THREE.MeshStandardMaterial({ color: '#ffffff' })
const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material)
const scene = new THREE.Group()
scene.add(mesh)

vi.mock('../../rendering/useGLTF', () => ({
  useGLTF: Object.assign(() => [{ scene }], { preload: vi.fn() }),
}))

vi.mock('./tileAssetResolution', () => ({
  resolveBatchedTileAsset: () => ({
    assetUrl: '/assets/floor.glb',
    transformKey: 'default',
    receiveShadow: true,
  }),
}))

describe('BatchedTileEntries instanced geometry', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates instanced mesh entries synchronously on mount', () => {
    const makeSpy = vi.spyOn(instancedTileMesh, 'makeInstancedMeshEntries')
    const entries: StaticTileEntry[] = [{
      key: 'floor:0:0',
      assetId: 'floor-tile',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      variant: 'floor',
      variantKey: '0:0',
      visibility: 'visible',
    }]

    render(<BatchedTileEntries entries={entries} />)

    expect(makeSpy).toHaveBeenCalled()
  })

  it('updates instance buffers without recreating bucket meshes when animation state changes', () => {
    const makeSpy = vi.spyOn(instancedTileMesh, 'makeInstancedMeshEntries')
    const updateSpy = vi.spyOn(instancedTileMesh, 'updateInstancedMeshEntries')
    const baseEntry: StaticTileEntry = {
      key: 'floor:0:0',
      assetId: 'floor-tile',
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      variant: 'floor',
      variantKey: '0:0',
      visibility: 'visible',
    }

    const { rerender } = render(<BatchedTileEntries entries={[baseEntry]} />)
    rerender(<BatchedTileEntries entries={[{
      ...baseEntry,
      buildAnimationStart: 1000,
      buildAnimationDelay: 120,
    }]} />)

    expect(makeSpy).toHaveBeenCalledTimes(1)
    expect(updateSpy).toHaveBeenCalledTimes(2)
  })
})
