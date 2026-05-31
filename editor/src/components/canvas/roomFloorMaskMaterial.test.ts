import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  applyRoomFloorMaskToMaterial,
  applyRoomFloorMaskToObject,
} from './roomFloorMaskMaterial'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import type { RoomFloorMaskRuntime } from './roomFloorMaskRuntime'

function createMaskRuntime(signature = 'room-floor-mask:test'): RoomFloorMaskRuntime {
  return {
    texture: new THREE.Texture(),
    minWorldX: -1,
    minWorldZ: -1,
    sizeWorldX: 2,
    sizeWorldZ: 2,
    signature,
  }
}

describe('roomFloorMaskMaterial', () => {
  it('applies a world-space opacity mask to node-compatible floor materials', () => {
    const material = createStandardCompatibleMaterial({}) as THREE.Material & {
      alphaTest: number
      alphaTestNode?: unknown
      opacityNode?: unknown
      userData: Record<string, unknown>
    }
    const runtime = createMaskRuntime()

    applyRoomFloorMaskToMaterial(material, runtime)

    expect(material.opacityNode).toBeTruthy()
    expect(material.alphaTest).toBe(0.5)
    expect(material.alphaTestNode).toBeTruthy()
    expect(material.userData.roomFloorMaskSignature).toBe(runtime.signature)
  })

  it('updates every mesh material in an object hierarchy', () => {
    const root = new THREE.Group()
    const child = new THREE.Mesh(new THREE.BoxGeometry(), createStandardCompatibleMaterial({}))
    root.add(child)

    applyRoomFloorMaskToObject(root, createMaskRuntime())

    expect((child.material as THREE.Material & { opacityNode?: unknown }).opacityNode).toBeTruthy()
  })

  it('restores the original opacity configuration when masking is disabled', () => {
    const material = createStandardCompatibleMaterial({}) as THREE.Material & {
      alphaTest: number
      alphaTestNode?: unknown
      userData: Record<string, unknown>
    }
    const baseAlphaTest = material.alphaTest
    const baseAlphaTestNode = material.alphaTestNode ?? null

    applyRoomFloorMaskToMaterial(material, createMaskRuntime())
    applyRoomFloorMaskToMaterial(material, null)

    expect(material.alphaTest).toBe(baseAlphaTest)
    expect(material.alphaTestNode).toBe(baseAlphaTestNode)
    expect(material.userData.roomFloorMaskSignature).toBe('off')
  })
})
