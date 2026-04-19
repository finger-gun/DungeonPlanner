import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { ContentPackModelTransform } from '../../content-packs/types'

export type BatchedTilePlacement = {
  key: string
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
}

export type BatchedTileGeometryMesh = {
  key: string
  geometry: THREE.BufferGeometry
  material: THREE.Material
}

export function buildMergedTileGeometryMeshes({
  sourceScene,
  placements,
  transform,
}: {
  sourceScene: THREE.Object3D
  placements: BatchedTilePlacement[]
  transform?: ContentPackModelTransform
}) {
  const mergedMeshes: BatchedTileGeometryMesh[] = []
  if (placements.length === 0) {
    return mergedMeshes
  }

  const transformMatrix = getTransformMatrix(transform)
  sourceScene.updateWorldMatrix(true, true)

  const sourceMeshes = Array.from(iterateBatchableMeshes(sourceScene))
  sourceMeshes.forEach(({ material, mesh: sourceMesh }, meshIndex) => {
    const geometries: THREE.BufferGeometry[] = []
    placements.forEach((placement) => {
      const geometry = sourceMesh.geometry.clone()
      geometry.applyMatrix4(getPlacementMatrix(placement).multiply(transformMatrix).multiply(sourceMesh.matrixWorld))
      geometries.push(geometry)
    })

    const mergedGeometry = mergeGeometries(geometries, false)
    geometries.forEach((geometry) => geometry.dispose())
    if (!mergedGeometry) {
      return
    }

    mergedMeshes.push({
      key: `${meshIndex}:${sourceMesh.uuid}`,
      geometry: mergedGeometry,
      material: material.clone(),
    })
  })

  return mergedMeshes
}

function * iterateBatchableMeshes(root: THREE.Object3D) {
  const meshes: Array<{ mesh: THREE.Mesh, material: THREE.Material }> = []
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh) || !child.geometry) {
      return
    }

    if (child.material instanceof THREE.Material) {
      meshes.push({ mesh: child, material: child.material })
    }
  })
  yield * meshes
}

function getPlacementMatrix(placement: BatchedTilePlacement) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...placement.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation)),
    new THREE.Vector3(1, 1, 1),
  )
}

function getTransformMatrix(transform?: ContentPackModelTransform) {
  const scale = resolveScale(transform?.scale)
  return new THREE.Matrix4().compose(
    new THREE.Vector3(...(transform?.position ?? [0, 0, 0])),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...(transform?.rotation ?? [0, 0, 0])),
    ),
    new THREE.Vector3(...scale),
  )
}

function resolveScale(scale?: ContentPackModelTransform['scale']): [number, number, number] {
  if (typeof scale === 'number') {
    return [scale, scale, scale]
  }

  return scale ? [scale[0], scale[1], scale[2]] : [1, 1, 1]
}
