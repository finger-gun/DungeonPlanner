import * as THREE from 'three'

export type AutofocusPoint = {
  x: number
  y: number
  z: number
} | null

const autofocusPointScratch = new THREE.Vector3()
type AutofocusCamera = {
  near?: number
  matrixWorldInverse: THREE.Matrix4
}

export function resolveAutofocusTarget(
  preferOrbitTarget: boolean,
  orbitTarget: AutofocusPoint,
  raycastTarget: AutofocusPoint,
) {
  return preferOrbitTarget ? (orbitTarget ?? raycastTarget) : (raycastTarget ?? orbitTarget)
}

export function getAutofocusDistance(
  camera: AutofocusCamera,
  target: Exclude<AutofocusPoint, null>,
) {
  autofocusPointScratch.set(target.x, target.y, target.z)
  autofocusPointScratch.applyMatrix4(camera.matrixWorldInverse)

  return Math.max(camera.near ?? 0.01, -autofocusPointScratch.z)
}
