import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import {
  applyBelowGroundClipToObject,
  applyBuildAnimationToMaterial,
  getBelowGroundClipMinY,
} from './buildAnimationMaterial'

type TestNodeMaterial = THREE.Material & {
  alphaTest?: number
  alphaTestNode?: unknown
  castShadowPositionNode?: unknown
  clipShadows?: boolean
  clippingPlanes?: THREE.Plane[] | null
  isNodeMaterial?: boolean
  needsUpdate?: boolean
  opacityNode?: unknown
  positionNode?: unknown
  userData: Record<string, unknown>
}

describe('buildAnimationMaterial', () => {
  it('clips animated materials below ground and restores prior clipping state', () => {
    const material = createStandardCompatibleMaterial({
      color: '#ffffff',
      roughness: 0.4,
      metalness: 0.1,
    }) as TestNodeMaterial
    const originalPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -2)

    material.isNodeMaterial = true
    material.clippingPlanes = [originalPlane]
    material.clipShadows = false

    applyBuildAnimationToMaterial(material, true, getBelowGroundClipMinY('floor'))

    expect(material.opacityNode).toBeDefined()
    expect(material.alphaTestNode).toBeDefined()
    expect(material.clippingPlanes).toEqual([originalPlane])
    expect(material.clipShadows).toBe(false)
    expect(material.positionNode).toBeDefined()

    applyBuildAnimationToMaterial(material, false, getBelowGroundClipMinY('floor'))

    expect(material.clippingPlanes).toEqual([originalPlane])
    expect(material.clipShadows).toBe(false)
    expect(material.opacityNode).toBe(material.userData.buildAnimationBaseOpacityNode ?? null)
    expect(material.alphaTestNode).toBe(material.userData.buildAnimationBaseAlphaTestNode ?? null)
    expect(material.positionNode).toBe(material.userData.buildAnimationBasePositionNode ?? null)
  })

  it('propagates below-ground clipping to mesh shadow materials', () => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: '#ffffff' }),
    )
    const depthMaterial = new THREE.MeshDepthMaterial()

    mesh.customDepthMaterial = depthMaterial

    applyBelowGroundClipToObject(mesh, true, getBelowGroundClipMinY('floor'))

    expect(mesh.material.clippingPlanes).toHaveLength(1)
    expect(mesh.customDepthMaterial?.clippingPlanes).toHaveLength(1)
    expect(mesh.material.clipShadows).toBe(true)

    applyBelowGroundClipToObject(mesh, false, getBelowGroundClipMinY('floor'))

    expect(mesh.material.clippingPlanes).toBeNull()
    expect(mesh.customDepthMaterial?.clippingPlanes).toBeNull()
    expect(mesh.material.clipShadows).toBe(false)
  })

  it('uses a slightly lower clip threshold for floor variants', () => {
    expect(getBelowGroundClipMinY('floor')).toBeLessThan(0)
    expect(getBelowGroundClipMinY('wall')).toBe(0)
    expect(getBelowGroundClipMinY('prop')).toBe(0)
  })
})
