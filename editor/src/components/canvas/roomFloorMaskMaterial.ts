/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from 'three'
import { float, materialOpacity, positionWorld, texture, vec2 } from 'three/tsl'
import type { RoomFloorMaskRuntime } from './roomFloorMaskRuntime'

type RoomFloorMaskAwareMaterial = THREE.Material & {
  alphaTest?: number
  isNodeMaterial?: boolean
  needsUpdate?: boolean
  opacityNode?: unknown
  userData: Record<string, unknown>
}

export function applyRoomFloorMaskToMaterial(
  material: THREE.Material | THREE.Material[],
  runtime: RoomFloorMaskRuntime | null | undefined,
) {
  const materials = Array.isArray(material) ? material : [material]
  materials.forEach((entry) => {
    const floorMaterial = entry as RoomFloorMaskAwareMaterial
    if (!floorMaterial.isNodeMaterial) {
      return
    }

    const nextSignature = runtime?.signature ?? 'off'
    const previousSignature = floorMaterial.userData.roomFloorMaskSignature ?? null
    if (previousSignature === nextSignature) {
      return
    }

    const currentOpacityNode = floorMaterial.opacityNode ?? null
    const appliedOpacityNode = floorMaterial.userData.roomFloorMaskAppliedOpacityNode ?? null
    const currentAlphaTest = floorMaterial.alphaTest ?? 0
    const appliedAlphaTest = floorMaterial.userData.roomFloorMaskAppliedAlphaTest as number | undefined

    if (
      !Object.prototype.hasOwnProperty.call(floorMaterial.userData, 'roomFloorMaskBaseOpacityNode')
      || currentOpacityNode !== appliedOpacityNode
    ) {
      floorMaterial.userData.roomFloorMaskBaseOpacityNode = currentOpacityNode
    }

    if (
      !Object.prototype.hasOwnProperty.call(floorMaterial.userData, 'roomFloorMaskBaseAlphaTest')
      || currentAlphaTest !== appliedAlphaTest
    ) {
      floorMaterial.userData.roomFloorMaskBaseAlphaTest = currentAlphaTest
    }

    if (runtime) {
      const maskUv = vec2(
        positionWorld.x.sub(float(runtime.minWorldX)).div(float(runtime.sizeWorldX)),
        positionWorld.z.sub(float(runtime.minWorldZ)).div(float(runtime.sizeWorldZ)),
      )
      const inBounds = maskUv.x.greaterThanEqual(float(0))
        .and(maskUv.y.greaterThanEqual(float(0)))
        .and(maskUv.x.lessThanEqual(float(1)))
        .and(maskUv.y.lessThanEqual(float(1)))
      const sampledMask = texture(runtime.texture).sample(vec2(
        maskUv.x.max(float(0)).min(float(1)),
        maskUv.y.max(float(0)).min(float(1)),
      )).r
      const visibilityMask = inBounds.select(sampledMask, float(0))
      const baseOpacityNode = (floorMaterial.userData.roomFloorMaskBaseOpacityNode ?? materialOpacity) as any

      const maskedOpacityNode = baseOpacityNode.mul(visibilityMask)
      floorMaterial.opacityNode = maskedOpacityNode
      floorMaterial.alphaTest = Math.max(
        floorMaterial.userData.roomFloorMaskBaseAlphaTest as number ?? 0,
        0.5,
      )
      floorMaterial.userData.roomFloorMaskAppliedOpacityNode = maskedOpacityNode
      floorMaterial.userData.roomFloorMaskAppliedAlphaTest = floorMaterial.alphaTest
    } else {
      if (currentOpacityNode === appliedOpacityNode) {
        floorMaterial.opacityNode = floorMaterial.userData.roomFloorMaskBaseOpacityNode ?? null
      }
      if (currentAlphaTest === appliedAlphaTest) {
        floorMaterial.alphaTest = floorMaterial.userData.roomFloorMaskBaseAlphaTest as number ?? 0
      }
      floorMaterial.userData.roomFloorMaskAppliedOpacityNode = null
      floorMaterial.userData.roomFloorMaskAppliedAlphaTest = null
    }

    floorMaterial.userData.roomFloorMaskSignature = nextSignature
    floorMaterial.needsUpdate = true
  })
}

export function applyRoomFloorMaskToObject(
  object: THREE.Object3D,
  runtime: RoomFloorMaskRuntime | null | undefined,
) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    applyRoomFloorMaskToMaterial(child.material, runtime)
  })
}
