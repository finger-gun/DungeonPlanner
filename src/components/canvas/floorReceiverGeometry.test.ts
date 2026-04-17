import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { buildMergedFloorReceiverGeometry } from './floorReceiverGeometry'

function createReceiverScene() {
  const root = new THREE.Group()
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 0.2, 1), new THREE.MeshBasicMaterial())
  mesh.position.set(0, 0.1, 0)
  root.add(mesh)
  root.updateWorldMatrix(true, true)
  return root
}

describe('floorReceiverGeometry', () => {
  it('builds merged receiver geometry from multiple floor cells', () => {
    const receiverScene = createReceiverScene()
    const geometry = buildMergedFloorReceiverGeometry({
      cells: [
        { cell: [0, 0], receiverScene },
        { cell: [1, 0], receiverScene },
      ],
      blockedFloorCellKeys: new Set(),
    })

    expect(geometry).not.toBeNull()
    geometry!.computeBoundingBox()
    expect((geometry!.boundingBox!.max.x - geometry!.boundingBox!.min.x)).toBeGreaterThan(1.8)
    geometry?.dispose()
  })

  it('omits blocked floor cells from merged receiver geometry', () => {
    const receiverScene = createReceiverScene()
    const fullGeometry = buildMergedFloorReceiverGeometry({
      cells: [
        { cell: [0, 0], receiverScene },
        { cell: [1, 0], receiverScene },
      ],
      blockedFloorCellKeys: new Set(),
    })
    const blockedGeometry = buildMergedFloorReceiverGeometry({
      cells: [
        { cell: [0, 0], receiverScene },
        { cell: [1, 0], receiverScene },
      ],
      blockedFloorCellKeys: new Set(['1:0']),
    })

    expect(fullGeometry).not.toBeNull()
    expect(blockedGeometry).not.toBeNull()
    expect(blockedGeometry!.getAttribute('position').count).toBeLessThan(fullGeometry!.getAttribute('position').count)

    fullGeometry?.dispose()
    blockedGeometry?.dispose()
  })

  it('applies the asset receiver transform before merging geometry', () => {
    const receiverScene = createReceiverScene()
    const geometry = buildMergedFloorReceiverGeometry({
      cells: [{
        cell: [0, 0],
        receiverScene,
        receiverTransform: {
          position: [0.5, 0, 0],
          scale: [2, 1, 1],
        },
      }],
      blockedFloorCellKeys: new Set(),
    })

    expect(geometry).not.toBeNull()
    geometry!.computeBoundingBox()
    expect(geometry!.boundingBox!.min.x).toBeCloseTo(0.5)
    expect(geometry!.boundingBox!.max.x).toBeCloseTo(2.5)
    geometry?.dispose()
  })
})
