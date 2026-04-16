import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildMergedFloorReceiverGeometry } from './floorReceiverGeometry'

function createVariantScene() {
  const root = new THREE.Group()
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), new THREE.MeshBasicMaterial())
  mesh.position.set(0, 0.1, 0)
  root.add(mesh)
  root.updateWorldMatrix(true, true)
  return root
}

describe('floorReceiverGeometry', () => {
  it('builds merged receiver geometry from multiple floor cells', () => {
    const geometry = buildMergedFloorReceiverGeometry({
      cells: [[0, 0], [1, 0]],
      blockedFloorCellKeys: new Set(),
      variantScenes: [createVariantScene()],
    })

    expect(geometry).not.toBeNull()
    geometry!.computeBoundingBox()
    expect((geometry!.boundingBox!.max.x - geometry!.boundingBox!.min.x)).toBeGreaterThan(1.8)
    geometry?.dispose()
  })

  it('omits blocked floor cells from merged receiver geometry', () => {
    const fullGeometry = buildMergedFloorReceiverGeometry({
      cells: [[0, 0], [1, 0]],
      blockedFloorCellKeys: new Set(),
      variantScenes: [createVariantScene()],
    })
    const blockedGeometry = buildMergedFloorReceiverGeometry({
      cells: [[0, 0], [1, 0]],
      blockedFloorCellKeys: new Set(['1:0']),
      variantScenes: [createVariantScene()],
    })

    expect(fullGeometry).not.toBeNull()
    expect(blockedGeometry).not.toBeNull()
    expect(blockedGeometry!.getAttribute('position').count).toBeLessThan(fullGeometry!.getAttribute('position').count)

    fullGeometry?.dispose()
    blockedGeometry?.dispose()
  })
})
