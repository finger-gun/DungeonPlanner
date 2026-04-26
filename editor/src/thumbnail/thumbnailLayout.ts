import * as THREE from 'three'

export type ThumbnailBounds = {
  min: [number, number, number]
  max: [number, number, number]
}

export type ThumbnailLayout = {
  modelPosition: [number, number, number]
  target: [number, number, number]
  cameraPosition: [number, number, number]
  cameraUp: [number, number, number]
  far: number
  zoom: number
}

const DEFAULT_CAMERA_DIRECTION = new THREE.Vector3(0.9, 0.72, 1).normalize()
const FLAT_CAMERA_DIRECTION = new THREE.Vector3(0, 1, 0)
const DEFAULT_CAMERA_UP = new THREE.Vector3(0, 1, 0)
const FLAT_CAMERA_UP = new THREE.Vector3(0, 0, -1)

export function getThumbnailLayout(
  bounds: ThumbnailBounds,
  aspect = 1,
): ThumbnailLayout {
  const sizeX = Math.max(bounds.max[0] - bounds.min[0], 0.001)
  const sizeY = Math.max(bounds.max[1] - bounds.min[1], 0.001)
  const sizeZ = Math.max(bounds.max[2] - bounds.min[2], 0.001)
  const centerX = (bounds.min[0] + bounds.max[0]) * 0.5
  const centerY = (bounds.min[1] + bounds.max[1]) * 0.5
  const centerZ = (bounds.min[2] + bounds.max[2]) * 0.5
  const maxDim = Math.max(sizeX, sizeY, sizeZ)
  const minDim = Math.min(sizeX, sizeY, sizeZ)
  const flatness = maxDim / minDim
  const isFloorLike = sizeY <= Math.min(sizeX, sizeZ) * 0.25
  const framePadding = flatness >= 10 ? 2.1 : flatness >= 5 ? 1.55 : 1.22
  const cameraDirection = isFloorLike ? FLAT_CAMERA_DIRECTION : DEFAULT_CAMERA_DIRECTION
  const cameraUp = isFloorLike ? FLAT_CAMERA_UP : DEFAULT_CAMERA_UP
  const distance = Math.max(maxDim * 4, 8)
  const target: [number, number, number] = [0, 0, 0]
  const modelPosition: [number, number, number] = [-centerX, -centerY, -centerZ]
  const cameraPosition: [number, number, number] = [
    cameraDirection.x * distance,
    cameraDirection.y * distance,
    cameraDirection.z * distance,
  ]

  const viewMatrix = new THREE.Matrix4().lookAt(
    new THREE.Vector3(...cameraPosition),
    new THREE.Vector3(...target),
    cameraUp,
  )

  const halfX = sizeX * 0.5
  const halfY = sizeY * 0.5
  const halfZ = sizeZ * 0.5
  const corners = [
    new THREE.Vector3(-halfX, -halfY, -halfZ),
    new THREE.Vector3(-halfX, -halfY, halfZ),
    new THREE.Vector3(-halfX, halfY, -halfZ),
    new THREE.Vector3(-halfX, halfY, halfZ),
    new THREE.Vector3(halfX, -halfY, -halfZ),
    new THREE.Vector3(halfX, -halfY, halfZ),
    new THREE.Vector3(halfX, halfY, -halfZ),
    new THREE.Vector3(halfX, halfY, halfZ),
  ]

  let minProjectedX = Infinity
  let maxProjectedX = -Infinity
  let minProjectedY = Infinity
  let maxProjectedY = -Infinity

  corners.forEach((corner) => {
    const projected = corner.clone().applyMatrix4(viewMatrix)
    minProjectedX = Math.min(minProjectedX, projected.x)
    maxProjectedX = Math.max(maxProjectedX, projected.x)
    minProjectedY = Math.min(minProjectedY, projected.y)
    maxProjectedY = Math.max(maxProjectedY, projected.y)
  })

  const requiredWidth = Math.max((maxProjectedX - minProjectedX) * framePadding, 0.001)
  const requiredHeight = Math.max((maxProjectedY - minProjectedY) * framePadding, 0.001)
  const zoom = Math.max(
    Math.min((2 * aspect) / requiredWidth, 2 / requiredHeight),
    0.01,
  )

  return {
    modelPosition,
    target,
    cameraPosition,
    cameraUp: [cameraUp.x, cameraUp.y, cameraUp.z],
    far: Math.max(distance * 4, 100),
    zoom,
  }
}
